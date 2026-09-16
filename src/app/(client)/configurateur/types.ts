export type WorkstationType =
  | "FIXE"
  | "MOBILE"
  | "PIVOTANT"
  | "SPECIFIQUE"
  | "MILIEU_HUMIDE";

export const WORKSTATION_LABELS: Record<WorkstationType, string> = {
  FIXE: "Fixe",
  MOBILE: "Mobile",
  PIVOTANT: "Pivotant",
  SPECIFIQUE: "Spécifique (métallurgie)",
  MILIEU_HUMIDE: "Milieu humide (dont agroalimentaire)",
};

export interface CatalogFamily {
  id: string;
  code: string;
  name: string;
  description: string;
  imageUrl: string | null;
  workstationType: WorkstationType;
  isRecommended: boolean;
  thicknessMm: number;
  colorLabel: string;
  supportsESD: boolean;
  supportsB1: boolean;
  supportsEdging: boolean;
  minCutCm: number;
  maxCutWidthCm: number | null;
  hasStandardFormat: boolean;
}

export interface DraftLine {
  key: string;
  familyId: string;
  familyLabel: string;
  quantity: number;
  lengthCm: number;
  widthCm: number;
  hasESD: boolean;
  hasB1: boolean;
  hasEdging: boolean;
}

export interface ResolvedLineView {
  variant: { reference: string; salesUnit: string };
  quantity: number;
  lengthCm: number;
  widthCm: number;
  totalAreaSqm: number;
  lineTotal: number;
  lineWeightKg: number;
  hasEdging: boolean;
  edgingLinearMeters: number | null;
  edgingPrice: number | null;
}

export interface PreviewResult {
  status: "OK" | "A_CONSULTER";
  lines: ResolvedLineView[];
  subtotal: number;
  discountAmount: number;
  netHT: number;
  totalWeightKg: number;
  shippingCost: number | null;
  totalHT: number | null;
  taxAmount: number | null;
  totalTTC: number | null;
}
