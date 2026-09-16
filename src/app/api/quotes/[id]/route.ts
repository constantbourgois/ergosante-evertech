import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApprovedClient } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireApprovedClient();
    const { id } = await params;

    const quote = await db.quote.findUnique({
      where: { id },
      include: { lines: { include: { variant: true } } },
    });

    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    }

    // Cloisonnement strict, vérifié côté serveur — docs/PLAN.md §10.
    if (session.user.role !== "ADMIN" && quote.userId !== session.user.id) {
      return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    }

    return NextResponse.json({ quote });
  } catch (error) {
    return toErrorResponse(error);
  }
}
