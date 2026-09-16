import { NextResponse } from "next/server";
import { requireApprovedClient } from "@/lib/auth";
import { previewQuote } from "@/lib/quotes/service";
import { quoteInputSchema } from "@/lib/quotes/schema";
import { toErrorResponse } from "@/lib/api/errors";

/** Prix en direct pour le configurateur — jamais faisant autorité, recalculé
 * côté serveur avant émission (docs/PLAN.md §10). */
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

    const result = await previewQuote(session.user.id, parsed.data.lines);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
