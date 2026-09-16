import { db } from "@/lib/db";
import { calculateQuote, PricingError } from "@/lib/pricing";
import type { QuoteLineInput, QuoteCalculationResult } from "@/lib/pricing";
import { loadPricingContext } from "./pricing-context";
import { generateQuoteReference } from "./reference";
import { notifyServiceClientQuoteToConsult } from "@/lib/auth";

export { PricingError };

async function calculateForUser(
  userId: string,
  lines: QuoteLineInput[],
): Promise<{ result: QuoteCalculationResult; discountPercentage: number; discountAppliesToTransport: boolean; vatRate: number; validityDays: number }> {
  const [context, user] = await Promise.all([
    loadPricingContext(),
    db.user.findUnique({ where: { id: userId }, include: { discountRate: true } }),
  ]);

  const discountPercentage = user?.discountRate
    ? Number(user.discountRate.percentage)
    : 0;
  const discountAppliesToTransport = user?.discountRate?.appliesToTransport ?? false;

  const result = calculateQuote({
    lines,
    families: context.families,
    variants: context.variants,
    edgingVariant: context.edgingVariant,
    discountPercentage,
    discountAppliesToTransport,
    shippingBrackets: context.shippingBrackets,
    vatRate: context.vatRate,
  });

  return {
    result,
    discountPercentage,
    discountAppliesToTransport,
    vatRate: context.vatRate,
    validityDays: context.quoteValidityDays,
  };
}

/** Calcul sans persistance — utilisé par le configurateur pour le prix en direct. */
export async function previewQuote(userId: string, lines: QuoteLineInput[]) {
  const { result } = await calculateForUser(userId, lines);
  return result;
}

/**
 * Calcule puis persiste le devis — docs/PLAN.md §4.3 : « le devis est
 * persisté à sa génération, avec numéro ». Le statut A_CONSULTER (> 40 kg)
 * est enregistré sans aucun total, et déclenche la notification du service
 * client — docs/PLAN.md §6.4.
 */
export async function createQuote(userId: string, lines: QuoteLineInput[]) {
  const { result, vatRate, validityDays } = await calculateForUser(userId, lines);
  const reference = await generateQuoteReference();
  const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

  const quote = await db.quote.create({
    data: {
      reference,
      userId,
      status: result.status === "A_CONSULTER" ? "A_CONSULTER" : "EMIS",
      subtotal: result.subtotal,
      discountAmount: result.discountAmount,
      shippingCost: result.shippingCost,
      totalHT: result.totalHT,
      taxAmount: result.taxAmount,
      total: result.totalTTC,
      vatRate,
      validUntil,
      totalWeightKg: result.totalWeightKg,
      pricingSnapshot: JSON.parse(JSON.stringify(result)),
      lines: {
        create: result.lines.map((line) => ({
          variantId: line.variant.id,
          variantReferenceSnapshot: line.variant.reference,
          quantity: line.quantity,
          lengthCm: line.lengthCm,
          widthCm: line.widthCm,
          unitAreaSqm: line.unitAreaSqm,
          totalAreaSqm: line.totalAreaSqm,
          hasEdging: line.hasEdging,
          edgingLinearMeters: line.edgingLinearMeters,
          edgingPrice: line.edgingPrice,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          lineWeightKg: line.lineWeightKg,
        })),
      },
    },
    include: { lines: true },
  });

  if (quote.status === "A_CONSULTER") {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    await notifyServiceClientQuoteToConsult(quote.reference, user.email);
  }

  return quote;
}
