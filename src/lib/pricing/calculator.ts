import { roundToCents } from "./rounding";
import { resolveVariant } from "./resolver";
import { PricingError } from "./types";
import type {
  PricingFamily,
  PricingVariant,
  QuoteCalculationInput,
  QuoteCalculationResult,
  QuoteLineInput,
  ResolvedQuoteLine,
} from "./types";

export * from "./types";
export { resolveVariant } from "./resolver";
export { roundToCents } from "./rounding";

function calculateLine(
  input: QuoteLineInput,
  family: PricingFamily,
  variants: PricingVariant[],
  edgingVariant: PricingVariant | null,
): ResolvedQuoteLine {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new PricingError("La quantité doit être un entier supérieur ou égal à 1.");
  }

  const { variant, unitAreaSqm } = resolveVariant({
    family,
    candidates: variants,
    lengthCm: input.lengthCm,
    widthCm: input.widthCm,
    hasESD: input.hasESD,
    hasB1: input.hasB1,
  });

  const totalAreaSqm = unitAreaSqm * input.quantity;
  let unitPrice: number;
  let lineTotal: number;
  let lineWeightKg: number;

  if (variant.salesUnit === "UNIT") {
    unitPrice = variant.salePrice;
    lineTotal = roundToCents(unitPrice * input.quantity);
    lineWeightKg = variant.weight * input.quantity;
  } else {
    // SQM — découpe sur mesure
    unitPrice = variant.salePrice;
    lineTotal = roundToCents(totalAreaSqm * variant.salePrice);
    lineWeightKg = totalAreaSqm * variant.weight;
  }

  let edgingLinearMeters: number | null = null;
  let edgingPrice: number | null = null;

  if (input.hasEdging) {
    if (!family.supportsEdging) {
      throw new PricingError("Le chant n'est pas disponible sur ce modèle.");
    }
    if (!edgingVariant) {
      throw new PricingError("Référence de chant introuvable au catalogue.");
    }
    // Périmètre complet, par pièce — docs/PLAN.md §6.2.
    edgingLinearMeters =
      input.quantity * 2 * ((input.lengthCm + input.widthCm) / 100);
    edgingPrice = roundToCents(edgingLinearMeters * edgingVariant.salePrice);
  }

  return {
    variant,
    quantity: input.quantity,
    lengthCm: input.lengthCm,
    widthCm: input.widthCm,
    unitAreaSqm,
    totalAreaSqm,
    unitPrice,
    lineTotal,
    lineWeightKg,
    hasEdging: input.hasEdging,
    edgingLinearMeters,
    edgingPrice,
  };
}

/**
 * Moteur de calcul complet d'un devis — docs/PLAN.md §6. Module pur : reçoit
 * des objets simples (catalogue, barème, remise) et retourne un devis
 * calculé, sans connaître Prisma ni React.
 */
export function calculateQuote(
  input: QuoteCalculationInput,
): QuoteCalculationResult {
  if (input.lines.length === 0) {
    throw new PricingError("Un devis doit comporter au moins une ligne.");
  }

  const lines = input.lines.map((lineInput) => {
    const family = input.families.find((f) => f.id === lineInput.familyId);
    if (!family) {
      throw new PricingError(`Famille de produit introuvable : ${lineInput.familyId}.`);
    }
    return calculateLine(lineInput, family, input.variants, input.edgingVariant);
  });

  // sousTotal = Σ prixLigne + Σ prixChant — chaque terme déjà arrondi au
  // centime, la somme est exacte (docs/PLAN.md §6.5).
  const subtotal = roundToCents(
    lines.reduce((sum, l) => sum + l.lineTotal + (l.edgingPrice ?? 0), 0),
  );

  const discountAmount = roundToCents(
    subtotal * (input.discountPercentage / 100),
  );
  const netHT = roundToCents(subtotal - discountAmount);

  // Poids arrondi à 3 décimales avant comparaison aux bornes de tranche, pour
  // qu'un poids « exactement 25,00 kg » ne bascule pas dans la tranche
  // supérieure à cause d'un résidu flottant (docs/PLAN.md §6.7).
  const totalWeightKg =
    Math.round(lines.reduce((sum, l) => sum + l.lineWeightKg, 0) * 1000) /
    1000;

  const bracket = input.shippingBrackets
    .slice()
    .sort((a, b) => a.maxWeightKg - b.maxWeightKg)
    .find((b) => totalWeightKg <= b.maxWeightKg);

  if (!bracket) {
    // Au-delà de 40 kg : « nous consulter ». Aucun total n'est affiché —
    // docs/PLAN.md §6.4.
    return {
      status: "A_CONSULTER",
      lines,
      subtotal,
      discountAmount,
      netHT,
      totalWeightKg,
      shippingCost: null,
      totalHT: null,
      taxAmount: null,
      totalTTC: null,
    };
  }

  const shippingDiscount = input.discountAppliesToTransport
    ? roundToCents(bracket.flatPrice * (input.discountPercentage / 100))
    : 0;
  const shippingCost = roundToCents(bracket.flatPrice - shippingDiscount);

  const totalHT = roundToCents(netHT + shippingCost);
  const taxAmount = roundToCents(totalHT * (input.vatRate / 100));
  const totalTTC = roundToCents(totalHT + taxAmount);

  return {
    status: "OK",
    lines,
    subtotal,
    discountAmount,
    netHT,
    totalWeightKg,
    shippingCost,
    totalHT,
    taxAmount,
    totalTTC,
  };
}
