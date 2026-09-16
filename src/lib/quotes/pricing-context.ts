import { db } from "@/lib/db";
import type {
  PricingFamily,
  PricingVariant,
  ShippingBracketInput,
} from "@/lib/pricing";

export interface PricingContext {
  families: PricingFamily[];
  variants: PricingVariant[];
  edgingVariant: PricingVariant | null;
  shippingBrackets: ShippingBracketInput[];
  vatRate: number;
  quoteValidityDays: number;
}

/** Charge le catalogue et le barème depuis la base et les traduit en objets
 * simples pour le moteur de calcul pur (docs/PLAN.md §9.2). */
export async function loadPricingContext(): Promise<PricingContext> {
  const [families, variants, franceZone, branding] = await Promise.all([
    db.productFamily.findMany({ where: { isActive: true } }),
    db.productVariant.findMany({ where: { isActive: true } }),
    db.shippingZone.findFirst({
      where: { name: "France" },
      include: { brackets: true },
    }),
    db.brandingSettings.findFirst(),
  ]);

  const toPricingFamily = (f: (typeof families)[number]): PricingFamily => ({
    id: f.id,
    code: f.code,
    minCutCm: f.minCutCm,
    maxCutWidthCm: f.maxCutWidthCm,
    supportsEdging: f.supportsEdging,
  });

  const toPricingVariant = (v: (typeof variants)[number]): PricingVariant => ({
    id: v.id,
    reference: v.reference,
    familyId: v.familyId,
    hasESD: v.hasESD,
    hasB1: v.hasB1,
    salesUnit: v.salesUnit,
    standardLengthCm: v.standardLengthCm,
    standardWidthCm: v.standardWidthCm,
    salePrice: Number(v.salePrice),
    weight: Number(v.weight),
    isActive: v.isActive,
  });

  const edgingVariantRow = variants.find((v) => v.reference === "CHAN01") ?? null;

  return {
    families: families.map(toPricingFamily),
    variants: variants.filter((v) => v.reference !== "CHAN01").map(toPricingVariant),
    edgingVariant: edgingVariantRow ? toPricingVariant(edgingVariantRow) : null,
    shippingBrackets: (franceZone?.brackets ?? []).map((b) => ({
      maxWeightKg: Number(b.maxWeightKg),
      flatPrice: Number(b.flatPrice),
    })),
    vatRate: branding ? Number(branding.defaultVatRate) : 20,
    quoteValidityDays: branding?.quoteValidityDays ?? 30,
  };
}
