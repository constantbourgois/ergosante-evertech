import type { PrismaClient } from "@/generated/prisma/client";
import type { ParsedTariffRow } from "./parser";

export interface ApplyImportResult {
  created: number;
  updated: number;
  skipped: Array<{ reference: string; reason: string }>;
}

/**
 * Applique les lignes déjà validées par `parseTariffWorkbook` en base : une
 * ligne du tarif = une référence (`ProductVariant`) — docs/PLAN.md §5.1. Les
 * changements de prix sont journalisés dans `TariffChangeLog` — docs/PLAN.md
 * §7 : qui a changé quel prix et quand.
 */
export async function applyTariffImport(
  db: PrismaClient,
  rows: ParsedTariffRow[],
  changedBy: string,
): Promise<ApplyImportResult> {
  const result: ApplyImportResult = { created: 0, updated: 0, skipped: [] };

  for (const row of rows) {
    const family = await db.productFamily.findUnique({
      where: { code: row.familyCode },
    });
    if (!family) {
      result.skipped.push({
        reference: row.reference,
        reason: `Famille inconnue : ${row.familyCode}. Créez-la avant d'importer ses références.`,
      });
      continue;
    }

    const existing = await db.productVariant.findUnique({
      where: { reference: row.reference },
    });

    await db.productVariant.upsert({
      where: { reference: row.reference },
      create: {
        reference: row.reference,
        familyId: family.id,
        hasESD: row.hasESD,
        hasB1: row.hasB1,
        salesUnit: row.salesUnit,
        standardLengthCm: row.standardLengthCm,
        standardWidthCm: row.standardWidthCm,
        salePrice: row.salePrice,
        weight: row.weight,
        isActive: true,
      },
      update: {
        familyId: family.id,
        hasESD: row.hasESD,
        hasB1: row.hasB1,
        salesUnit: row.salesUnit,
        standardLengthCm: row.standardLengthCm,
        standardWidthCm: row.standardWidthCm,
        salePrice: row.salePrice,
        weight: row.weight,
        isActive: true,
      },
    });

    if (existing) {
      if (Number(existing.salePrice) !== row.salePrice) {
        await db.tariffChangeLog.create({
          data: {
            entityType: "ProductVariant",
            entityId: existing.id,
            field: "salePrice",
            previousValue: String(existing.salePrice),
            newValue: String(row.salePrice),
            changedBy,
          },
        });
      }
      result.updated += 1;
    } else {
      result.created += 1;
    }
  }

  return result;
}
