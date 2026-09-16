import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  requireAdmin,
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
} from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject") }),
  z.object({ action: z.literal("set-discount"), discountRateId: z.string().nullable() }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Action invalide." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    }

    const data = parsed.data;

    if (data.action === "approve") {
      const updated = await db.user.update({
        where: { id },
        data: { approvedAt: new Date(), approvedBy: session.user.id, rejectedAt: null, rejectedBy: null },
      });
      await sendAccountApprovedEmail(updated.email);
      return NextResponse.json({ ok: true });
    }

    if (data.action === "reject") {
      const updated = await db.user.update({
        where: { id },
        data: { rejectedAt: new Date(), rejectedBy: session.user.id, approvedAt: null },
      });
      await sendAccountRejectedEmail(updated.email);
      return NextResponse.json({ ok: true });
    }

    await db.user.update({
      where: { id },
      data: { discountRateId: data.discountRateId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
