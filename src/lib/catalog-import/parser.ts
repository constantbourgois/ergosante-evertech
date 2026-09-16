import * as XLSX from "xlsx";
import { z } from "zod";
import { applyTariffCorrection, KNOWN_HARMLESS_ANOMALIES } from "./tariff-corrections";

export interface ParsedTariffRow {
  rowNumber: number;
  reference: string;
  familyCode: string;
  hasESD: boolean;
  hasB1: boolean;
  salesUnit: "SQM" | "UNIT" | "LINEAR_METER";
  standardLengthCm: number | null;
  standardWidthCm: number | null;
  salePrice: number;
  weight: number;
  wasCorrected: boolean;
  isKnownAnomaly: boolean;
}

export interface ImportRowError {
  rowNumber: number;
  reference: string | null;
  message: string;
}

export interface ParseTariffResult {
  rows: ParsedTariffRow[];
  errors: ImportRowError[];
}

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const SALES_UNIT_ALIASES: Record<string, "SQM" | "UNIT" | "LINEAR_METER"> = {
  m2: "SQM",
  "m²": "SQM",
  sqm: "SQM",
  unit: "UNIT",
  "unit.": "UNIT",
  piece: "UNIT",
  piece_: "UNIT",
  ml: "LINEAR_METER",
  "m.l.": "LINEAR_METER",
  linear_meter: "LINEAR_METER",
};

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const s = String(value ?? "").trim().toLowerCase();
  return s === "1" || s === "oui" || s === "true" || s === "x" || s === "yes";
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const normalized = String(value).trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

const rawRowSchema = z.object({
  reference: z.string().trim().min(1, "Référence manquante."),
  famille: z.string().trim().min(1, "Famille manquante."),
  esd: z.unknown().optional(),
  b1: z.unknown().optional(),
  unite: z.string().trim().min(1, "Unité de vente manquante."),
  longueur_standard_cm: z.unknown().optional(),
  largeur_standard_cm: z.unknown().optional(),
  prix_vente: z.unknown(),
  poids_kg: z.unknown(),
  // La colonne V.A n'est jamais lue au-delà de sa présence — voir
  // docs/PLAN.md §10. Elle est acceptée dans le fichier mais ignorée.
  v_a: z.unknown().optional(),
});

/**
 * Lit le fichier tarifaire (xlsx) et retourne les lignes valides ainsi que
 * les erreurs de validation, sans jamais importer la colonne « V.A » ni
 * accepter une référence sans poids — docs/PLAN.md §7 et §10.
 */
export function parseTariffWorkbook(
  data: ArrayBuffer | Uint8Array,
): ParseTariffResult {
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
  });

  const rows: ParsedTariffRow[] = [];
  const errors: ImportRowError[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // +1 pour l'en-tête, +1 pour l'index 0-based
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      normalized[normalizeHeader(key)] = value;
    }

    const parsedRaw = rawRowSchema.safeParse(normalized);
    if (!parsedRaw.success) {
      errors.push({
        rowNumber,
        reference:
          typeof normalized.reference === "string" ? normalized.reference : null,
        message: parsedRaw.error.issues.map((i) => i.message).join(" "),
      });
      return;
    }
    const data = parsedRaw.data;
    const reference = data.reference.toUpperCase();

    const unitKey = data.unite.trim().toLowerCase();
    const salesUnit = SALES_UNIT_ALIASES[unitKey];
    if (!salesUnit) {
      errors.push({
        rowNumber,
        reference,
        message: `Unité de vente inconnue : « ${data.unite} ».`,
      });
      return;
    }

    const salePriceSource = parseNumber(data.prix_vente);
    if (salePriceSource === null || salePriceSource < 0) {
      errors.push({
        rowNumber,
        reference,
        message: "Prix de vente manquant ou invalide.",
      });
      return;
    }

    // Un poids manquant n'est pas un détail cosmétique : il fausse le
    // transport. L'import refuse la référence plutôt que de la charger à
    // zéro — docs/CATALOGUE.md §5.3.
    const weight = parseNumber(data.poids_kg);
    if (weight === null || weight <= 0) {
      errors.push({
        rowNumber,
        reference,
        message: "Poids manquant ou nul : référence refusée (le transport serait sous-facturé).",
      });
      return;
    }

    const { price: salePrice, corrected: wasCorrected } = applyTariffCorrection(
      reference,
      salePriceSource,
    );

    const standardLengthCm = parseNumber(data.longueur_standard_cm);
    const standardWidthCm = parseNumber(data.largeur_standard_cm);
    if (salesUnit === "UNIT" && (standardLengthCm === null || standardWidthCm === null)) {
      errors.push({
        rowNumber,
        reference,
        message: "Format standard (longueur/largeur) manquant pour une référence à la pièce.",
      });
      return;
    }

    rows.push({
      rowNumber,
      reference,
      familyCode: data.famille.trim(),
      hasESD: parseBoolean(data.esd),
      hasB1: parseBoolean(data.b1),
      salesUnit,
      standardLengthCm: salesUnit === "UNIT" ? standardLengthCm : null,
      standardWidthCm: salesUnit === "UNIT" ? standardWidthCm : null,
      salePrice,
      weight,
      wasCorrected,
      isKnownAnomaly: KNOWN_HARMLESS_ANOMALIES.has(reference),
    });
  });

  return { rows, errors };
}
