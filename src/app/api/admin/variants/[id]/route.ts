import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

// Contrôles de saisie stricts — docs/PLAN.md §7 : prix négatif ou nul, poids
// négatif ou nul refusés.
const patchSchema = z.object({
  salePrice: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    }

    const existing = await db.productVariant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Référence introuvable." }, { status: 404 });
    }

    const updated = await db.productVariant.update({
      where: { id },
      data: parsed.data,
    });

    if (
      parsed.data.salePrice !== undefined &&
      Number(existing.salePrice) !== parsed.data.salePrice
    ) {
      await db.tariffChangeLog.create({
        data: {
          entityType: "ProductVariant",
          entityId: id,
          field: "salePrice",
          previousValue: String(existing.salePrice),
          newValue: String(parsed.data.salePrice),
          changedBy: session.user.id,
        },
      });
    }

    return NextResponse.json({ variant: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}
