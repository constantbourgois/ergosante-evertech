import { describe, expect, it } from "vitest";
import { resolveVariant } from "./resolver";
import { PricingError } from "./types";
import {
  mbFamily,
  saniflexNbrFamily,
  saniflexSbrFamily,
  standFamily,
  variants,
} from "./fixtures.test-helpers";

describe("resolveVariant", () => {
  it("prefers the standard piece format over cutting at exact 65×95 dimensions", () => {
    const result = resolveVariant({
      family: standFamily,
      candidates: variants,
      lengthCm: 65,
      widthCm: 95,
      hasESD: false,
      hasB1: false,
    });
    expect(result.variant.reference).toBe("10101U");
    expect(result.variant.salesUnit).toBe("UNIT");
  });

  it("matches the standard format regardless of length/width order", () => {
    const result = resolveVariant({
      family: standFamily,
      candidates: variants,
      lengthCm: 95,
      widthCm: 65,
      hasESD: false,
      hasB1: false,
    });
    expect(result.variant.reference).toBe("10101U");
  });

  it("falls back to cut-to-size (SQM) for non-standard dimensions", () => {
    const result = resolveVariant({
      family: standFamily,
      candidates: variants,
      lengthCm: 220,
      widthCm: 91,
      hasESD: false,
      hasB1: false,
    });
    expect(result.variant.reference).toBe("10101");
    expect(result.variant.salesUnit).toBe("SQM");
    expect(result.unitAreaSqm).toBeCloseTo(2.002, 4);
  });

  it("resolves the ESD+B1 combination to its own dedicated reference", () => {
    const result = resolveVariant({
      family: standFamily,
      candidates: variants,
      lengthCm: 65,
      widthCm: 95,
      hasESD: true,
      hasB1: true,
    });
    expect(result.variant.reference).toBe("10101B1ESDU");
  });

  it("rejects dimensions under the 60 cm minimum", () => {
    expect(() =>
      resolveVariant({
        family: standFamily,
        candidates: variants,
        lengthCm: 59,
        widthCm: 95,
        hasESD: false,
        hasB1: false,
      }),
    ).toThrow(PricingError);
  });

  it("does not look for a standard piece format on Saniflex NBR (cut-to-size only)", () => {
    const result = resolveVariant({
      family: saniflexNbrFamily,
      candidates: variants,
      lengthCm: 91,
      widthCm: 152,
      hasESD: false,
      hasB1: false,
    });
    expect(result.variant.salesUnit).toBe("SQM");
  });

  it("resolves the Saniflex SBR standard piece format (91×152)", () => {
    const result = resolveVariant({
      family: saniflexSbrFamily,
      candidates: variants,
      lengthCm: 91,
      widthCm: 152,
      hasESD: false,
      hasB1: false,
    });
    expect(result.variant.reference).toBe("20102SBRU");
  });

  it("has no maximum length — a very long cut is valid", () => {
    const result = resolveVariant({
      family: mbFamily,
      candidates: variants,
      lengthCm: 900,
      widthCm: 91,
      hasESD: false,
      hasB1: false,
    });
    expect(result.variant.reference).toBe("10104");
  });

  it("rejects a width beyond the configured maximum cut width (laize)", () => {
    const limitedFamily = { ...mbFamily, maxCutWidthCm: 140 };
    expect(() =>
      resolveVariant({
        family: limitedFamily,
        candidates: variants,
        lengthCm: 200,
        widthCm: 150,
        hasESD: false,
        hasB1: false,
      }),
    ).toThrow(PricingError);
  });
});
