// Corrections tarifaires actées — docs/CATALOGUE.md §5.1. Quatre références
// du tarif source s'écartaient de la logique de leur gamme ; la décision a
// été d'aligner ces quatre lignes à l'import plutôt que par une écriture
// manuelle en base — voir AGENTS.md « Les corrections tarifaires se font à
// l'import ».
export interface TariffCorrection {
  reference: string;
  sourcePrice: number;
  correctedPrice: number;
  reason: string;
}

export const TARIFF_CORRECTIONS: TariffCorrection[] = [
  {
    reference: "10101",
    sourcePrice: 212.94,
    correctedPrice: 219.7,
    reason:
      "Coefficient PV/V.A anormal (1,575 au lieu de 1,548) ; identique à Turn et Walk après correction.",
  },
  {
    reference: "10104B1",
    sourcePrice: 213.26,
    correctedPrice: 220.03,
    reason: "Supplément B1 anormal (+11,11 € au lieu de +17,88 €).",
  },
  {
    reference: "10102B1ESDU",
    sourcePrice: 133.88,
    correctedPrice: 138.13,
    reason: "Coefficient PV/V.A anormal ; identique à Stand après correction.",
  },
  {
    reference: "10105U",
    sourcePrice: 102.38,
    correctedPrice: 105.63,
    reason: "Coefficient PV/V.A anormal ; identique à MB après correction.",
  },
];

/**
 * Anomalies documentées et sciemment conservées telles quelles à l'import —
 * docs/CATALOGUE.md §5.2. Un import qui les signalerait à chaque exécution
 * générerait du bruit inutile pour l'administrateur.
 */
export const KNOWN_HARMLESS_ANOMALIES = new Set([
  "20102SBR", // même prix de vente que le NBR malgré un coût d'achat supérieur
  "20102SBRU", // V.A. incohérente avec la surface, sans impact : la V.A n'est pas importée
]);

export function applyTariffCorrection(
  reference: string,
  sourcePrice: number,
): { price: number; corrected: boolean } {
  const correction = TARIFF_CORRECTIONS.find((c) => c.reference === reference);
  if (!correction) {
    return { price: sourcePrice, corrected: false };
  }
  return { price: correction.correctedPrice, corrected: true };
}
