import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  maxCutWidthCm: z.number().int().positive().nullable().optional(),
  minCutCm: z.number().int().positive().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    }

    const family = await db.productFamily.findUnique({ where: { id } });
    if (!family) {
      return NextResponse.json({ error: "Famille introuvable." }, { status: 404 });
    }

    // Une seule référence recommandée par type de poste — docs/PLAN.md §5.2.
    if (parsed.data.isRecommended) {
      await db.productFamily.updateMany({
        where: { workstationType: family.workstationType, id: { not: id } },
        data: { isRecommended: false },
      });
    }

    const updated = await db.productFamily.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ family: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}
