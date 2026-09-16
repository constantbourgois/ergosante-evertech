import { PricingError } from "./types";
import type { PricingFamily, PricingVariant } from "./types";

/**
 * Traduit le choix du client (famille, ESD ?, B1 ?, dimensions) en référence
 * du tarif. Chaque combinaison est une référence à part entière — docs/PLAN.md
 * §5.1 — le résolveur ne calcule aucun prix, il choisit la ligne du tarif.
 */
export interface ResolveVariantParams {
  family: PricingFamily;
  candidates: PricingVariant[];
  lengthCm: number;
  widthCm: number;
  hasESD: boolean;
  hasB1: boolean;
}

export interface ResolveVariantResult {
  variant: PricingVariant;
  unitAreaSqm: number;
}

function matchesStandardFormat(
  variant: PricingVariant,
  lengthCm: number,
  widthCm: number,
): boolean {
  if (variant.standardLengthCm == null || variant.standardWidthCm == null) {
    return false;
  }
  const a = variant.standardLengthCm;
  const b = variant.standardWidthCm;
  return (
    (lengthCm === a && widthCm === b) || (lengthCm === b && widthCm === a)
  );
}

export function resolveVariant(
  params: ResolveVariantParams,
): ResolveVariantResult {
  const { family, candidates, lengthCm, widthCm, hasESD, hasB1 } = params;

  if (!Number.isInteger(lengthCm) || !Number.isInteger(widthCm) || lengthCm <= 0 || widthCm <= 0) {
    throw new PricingError("Les dimensions doivent être des entiers positifs, en centimètres.");
  }

  const matching = candidates.filter(
    (v) =>
      v.familyId === family.id &&
      v.isActive &&
      v.hasESD === hasESD &&
      v.hasB1 === hasB1,
  );

  // Le format pré-coupé prime sur la découpe (docs/PLAN.md §6.1) : un client
  // demandant exactement 65 × 95 paierait jusqu'à 22 % de trop en découpe.
  const unitMatch = matching.find(
    (v) => v.salesUnit === "UNIT" && matchesStandardFormat(v, lengthCm, widthCm),
  );
  if (unitMatch) {
    return {
      variant: unitMatch,
      unitAreaSqm: (lengthCm / 100) * (widthCm / 100),
    };
  }

  if (lengthCm < family.minCutCm || widthCm < family.minCutCm) {
    throw new PricingError(
      `Dimensions inférieures au minimum de découpe (${family.minCutCm} cm sur chaque côté).`,
    );
  }
  if (family.maxCutWidthCm != null && widthCm > family.maxCutWidthCm) {
    throw new PricingError(
      `Largeur (${widthCm} cm) supérieure à la laize maximale (${family.maxCutWidthCm} cm).`,
    );
  }

  const sqmMatch = matching.find((v) => v.salesUnit === "SQM");
  if (!sqmMatch) {
    throw new PricingError(
      `Aucune référence de découpe disponible pour cette combinaison (famille ${family.code}, ESD=${hasESD}, B1=${hasB1}).`,
    );
  }

  return {
    variant: sqmMatch,
    unitAreaSqm: (lengthCm / 100) * (widthCm / 100),
  };
}
