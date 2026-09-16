import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

const DEFAULT_CAP_PERCENTAGE = 30;

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  percentage: z.number().min(0).max(100).optional(),
  appliesToTransport: z.boolean().optional(),
  confirmAboveCap: z.boolean().optional(),
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

    if (
      parsed.data.percentage !== undefined &&
      parsed.data.percentage > DEFAULT_CAP_PERCENTAGE &&
      !parsed.data.confirmAboveCap
    ) {
      return NextResponse.json(
        {
          error: `Remise supérieure au plafond de ${DEFAULT_CAP_PERCENTAGE} %. Confirmez explicitement pour l'enregistrer.`,
          requiresConfirmation: true,
        },
        { status: 422 },
      );
    }

    const discount = await db.discountRate.update({
      where: { id },
      data: {
        name: parsed.data.name,
        percentage: parsed.data.percentage,
        appliesToTransport: parsed.data.appliesToTransport,
      },
    });
    return NextResponse.json({ discount });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.user.updateMany({ where: { discountRateId: id }, data: { discountRateId: null } });
    await db.discountRate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
