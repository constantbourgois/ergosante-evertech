import { describe, expect, it } from "vitest";
import { calculateQuote } from "./calculator";
import { PricingError } from "./types";
import type { QuoteCalculationInput } from "./types";
import {
  edgingVariant,
  families,
  franceShippingBrackets,
  mbFamily,
  saniflexSbrFamily,
  standFamily,
  variants,
} from "./fixtures.test-helpers";

function baseInput(
  overrides: Partial<QuoteCalculationInput> = {},
): QuoteCalculationInput {
  return {
    lines: [],
    families,
    variants,
    edgingVariant,
    discountPercentage: 0,
    discountAppliesToTransport: false,
    shippingBrackets: franceShippingBrackets,
    vatRate: 20,
    ...overrides,
  };
}

describe("calculateQuote — cas de recette Ergosanté du 14/09/2026 (docs/CATALOGUE.md §6)", () => {
  // docs/CATALOGUE.md calcule le produit sur la surface totale (4,4180 m² ×
  // 202,15 € = 893,10 €) puis arrondit une seule fois. docs/PLAN.md §6.5 et
  // §9's AGENTS.md imposent la règle formelle et non négociable : chaque
  // ligne est arrondie au centime *avant* d'être sommée. Sur ce cas précis,
  // les deux méthodes divergent d'un centime (893,09 € au lieu de 893,10 €) —
  // c'est la règle formelle qui est implémentée ici, l'exemple du document
  // étant une illustration simplifiée.
  it("reproduces the reference quote on Evermat MB", () => {
    const result = calculateQuote(
      baseInput({
        lines: [
          { familyId: mbFamily.id, quantity: 1, lengthCm: 220, widthCm: 91, hasESD: false, hasB1: false, hasEdging: false },
          { familyId: mbFamily.id, quantity: 1, lengthCm: 160, widthCm: 91, hasESD: false, hasB1: false, hasEdging: false },
          { familyId: mbFamily.id, quantity: 1, lengthCm: 160, widthCm: 60, hasESD: false, hasB1: false, hasEdging: false },
        ],
      }),
    );

    expect(result.status).toBe("OK");
    expect(result.subtotal).toBeCloseTo(893.09, 2);
    expect(result.totalWeightKg).toBeCloseTo(22.09, 2);
    expect(result.shippingCost).toBeCloseTo(41.91, 2);
    expect(result.totalHT).toBeCloseTo(935.0, 2);
    expect(result.taxAmount).toBeCloseTo(187.0, 2);
    expect(result.totalTTC).toBeCloseTo(1122.0, 2);
  });

  it("applies a 10% discount, not applied to transport", () => {
    const result = calculateQuote(
      baseInput({
        discountPercentage: 10,
        lines: [
          { familyId: mbFamily.id, quantity: 1, lengthCm: 220, widthCm: 91, hasESD: false, hasB1: false, hasEdging: false },
          { familyId: mbFamily.id, quantity: 1, lengthCm: 160, widthCm: 91, hasESD: false, hasB1: false, hasEdging: false },
          { familyId: mbFamily.id, quantity: 1, lengthCm: 160, widthCm: 60, hasESD: false, hasB1: false, hasEdging: false },
        ],
      }),
    );

    expect(result.discountAmount).toBeCloseTo(89.31, 2);
    expect(result.totalHT).toBeCloseTo(845.69, 2);
    expect(result.totalTTC).toBeCloseTo(1014.83, 2);
  });
});

describe("calculateQuote — chant (edging)", () => {
  it("prices the edging on the full perimeter, per piece", () => {
    const result = calculateQuote(
      baseInput({
        lines: [
          { familyId: standFamily.id, quantity: 1, lengthCm: 220, widthCm: 91, hasESD: false, hasB1: false, hasEdging: true },
          { familyId: standFamily.id, quantity: 1, lengthCm: 160, widthCm: 91, hasESD: false, hasB1: false, hasEdging: true },
          { familyId: standFamily.id, quantity: 1, lengthCm: 160, widthCm: 60, hasESD: false, hasB1: false, hasEdging: true },
        ],
      }),
    );

    const totalEdgingMeters = result.lines.reduce(
      (sum, l) => sum + (l.edgingLinearMeters ?? 0),
      0,
    );
    expect(totalEdgingMeters).toBeCloseTo(15.64, 2);
    const totalEdgingPrice = result.lines.reduce(
      (sum, l) => sum + (l.edgingPrice ?? 0),
      0,
    );
    expect(totalEdgingPrice).toBeCloseTo(739.0, 2);
  });

  it("rejects edging on a family that doesn't support it (Saniflex)", () => {
    expect(() =>
      calculateQuote(
        baseInput({
          lines: [
            { familyId: saniflexSbrFamily.id, quantity: 1, lengthCm: 200, widthCm: 100, hasESD: false, hasB1: false, hasEdging: true },
          ],
        }),
      ),
    ).toThrow(PricingError);
  });
});

describe("calculateQuote — transport", () => {
  it("picks the exact boundary bracket at 25.00 kg", () => {
    // 202.15 €/m², 5 kg/m² : 5 m² pèsent exactement 25 kg.
    const result = calculateQuote(
      baseInput({
        lines: [
          { familyId: mbFamily.id, quantity: 1, lengthCm: 500, widthCm: 100, hasESD: false, hasB1: false, hasEdging: false },
        ],
      }),
    );
    expect(result.totalWeightKg).toBeCloseTo(25, 3);
    expect(result.shippingCost).toBeCloseTo(41.91, 2);
  });

  it("switches to A_CONSULTER beyond 40 kg, with no total", () => {
    // 5 m² × 2 = 10 m² à 5 kg/m² = 50 kg > 40 kg.
    const result = calculateQuote(
      baseInput({
        lines: [
          { familyId: mbFamily.id, quantity: 2, lengthCm: 500, widthCm: 100, hasESD: false, hasB1: false, hasEdging: false },
        ],
      }),
    );
    expect(result.status).toBe("A_CONSULTER");
    expect(result.shippingCost).toBeNull();
    expect(result.totalHT).toBeNull();
    expect(result.totalTTC).toBeNull();
  });
});

describe("calculateQuote — devis multi-lignes, unités de vente mêlées", () => {
  it("mixes SQM, UNIT and edging (linear meter) in one quote", () => {
    const result = calculateQuote(
      baseInput({
        lines: [
          { familyId: mbFamily.id, quantity: 1, lengthCm: 220, widthCm: 91, hasESD: false, hasB1: false, hasEdging: false },
          { familyId: standFamily.id, quantity: 2, lengthCm: 65, widthCm: 95, hasESD: false, hasB1: false, hasEdging: true },
        ],
      }),
    );
    expect(result.status).toBe("OK");
    expect(result.lines[0].variant.salesUnit).toBe("SQM");
    expect(result.lines[1].variant.salesUnit).toBe("UNIT");
    expect(result.lines[1].hasEdging).toBe(true);
  });
});

describe("calculateQuote — arrondis", () => {
  it("totals exactly the sum of the rounded lines", () => {
    const result = calculateQuote(
      baseInput({
        lines: [
          { familyId: mbFamily.id, quantity: 1, lengthCm: 220, widthCm: 91, hasESD: false, hasB1: false, hasEdging: false },
          { familyId: mbFamily.id, quantity: 1, lengthCm: 160, widthCm: 91, hasESD: false, hasB1: false, hasEdging: false },
          { familyId: mbFamily.id, quantity: 1, lengthCm: 160, widthCm: 60, hasESD: false, hasB1: false, hasEdging: false },
        ],
      }),
    );
    const sumOfLines = Math.round(
      result.lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100,
    ) / 100;
    expect(result.subtotal).toBe(sumOfLines);
  });
});
