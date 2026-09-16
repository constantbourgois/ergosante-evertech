import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApprovedClient } from "@/lib/auth";
import { createQuote } from "@/lib/quotes/service";
import { quoteInputSchema } from "@/lib/quotes/schema";
import { toErrorResponse } from "@/lib/api/errors";

/** Historique des devis du client connecté — cloisonnement strict : jamais
 * les devis d'un autre client (docs/PLAN.md §10). */
export async function GET() {
  try {
    const session = await requireApprovedClient();
    const quotes = await db.quote.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        status: true,
        total: true,
        totalWeightKg: true,
        validUntil: true,
        pdfUrl: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ quotes });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApprovedClient();
    const body = await request.json().catch(() => null);
    const parsed = quoteInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    }

    const quote = await createQuote(session.user.id, parsed.data.lines);
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
