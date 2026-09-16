import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApprovedClient } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

/** Catalogue exposé au configurateur — jamais de prix côté client sans
 * approbation (docs/PLAN.md §10). */
export async function GET() {
  try {
    await requireApprovedClient();

    const families = await db.productFamily.findMany({
      where: { isActive: true },
      orderBy: [{ workstationType: "asc" }, { isRecommended: "desc" }],
      include: {
        variants: {
          where: { isActive: true },
          select: { id: true, hasESD: true, hasB1: true, salesUnit: true },
        },
      },
    });

    return NextResponse.json({
      families: families.map((f) => ({
        id: f.id,
        code: f.code,
        name: f.name,
        description: f.description,
        imageUrl: f.imageUrl,
        workstationType: f.workstationType,
        isRecommended: f.isRecommended,
        thicknessMm: f.thicknessMm,
        colorLabel: f.colorLabel,
        supportsESD: f.supportsESD,
        supportsB1: f.supportsB1,
        supportsEdging: f.supportsEdging,
        minCutCm: f.minCutCm,
        maxCutWidthCm: f.maxCutWidthCm,
        hasStandardFormat: f.variants.some((v) => v.salesUnit === "UNIT"),
      })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
