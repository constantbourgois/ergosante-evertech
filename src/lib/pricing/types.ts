// Module pur — ni Prisma ni React, voir AGENTS.md et docs/PLAN.md §9.2.
// Ces types sont des objets simples : le moteur ne connaît jamais un modèle
// Prisma directement, pour rester testable sans base de données.

export type SalesUnit = "SQM" | "UNIT" | "LINEAR_METER";

export interface PricingFamily {
  id: string;
  code: string;
  minCutCm: number;
  maxCutWidthCm: number | null;
  supportsEdging: boolean;
}

export interface PricingVariant {
  id: string;
  reference: string;
  familyId: string;
  hasESD: boolean;
  hasB1: boolean;
  salesUnit: SalesUnit;
  standardLengthCm: number | null;
  standardWidthCm: number | null;
  salePrice: number;
  weight: number;
  isActive: boolean;
}

export interface ShippingBracketInput {
  maxWeightKg: number;
  flatPrice: number;
}

export interface QuoteLineInput {
  familyId: string;
  quantity: number;
  lengthCm: number;
  widthCm: number;
  hasESD: boolean;
  hasB1: boolean;
  hasEdging: boolean;
}

export interface ResolvedQuoteLine {
  variant: PricingVariant;
  quantity: number;
  lengthCm: number;
  widthCm: number;
  unitAreaSqm: number;
  totalAreaSqm: number;
  unitPrice: number;
  lineTotal: number;
  lineWeightKg: number;
  hasEdging: boolean;
  edgingLinearMeters: number | null;
  edgingPrice: number | null;
}

export interface QuoteCalculationInput {
  lines: QuoteLineInput[];
  families: PricingFamily[];
  variants: PricingVariant[];
  edgingVariant: PricingVariant | null;
  discountPercentage: number;
  discountAppliesToTransport: boolean;
  shippingBrackets: ShippingBracketInput[];
  vatRate: number;
}

export type QuoteCalculationStatus = "OK" | "A_CONSULTER";

export interface QuoteCalculationResult {
  status: QuoteCalculationStatus;
  lines: ResolvedQuoteLine[];
  subtotal: number;
  discountAmount: number;
  netHT: number;
  totalWeightKg: number;
  shippingCost: number | null;
  totalHT: number | null;
  taxAmount: number | null;
  totalTTC: number | null;
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}
