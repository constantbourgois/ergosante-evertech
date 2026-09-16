import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

/** Liste admin filtrable — docs/PLAN.md §7 : client, période, suivi des
 * devis A_CONSULTER. */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const email = searchParams.get("email");

    const quotes = await db.quote.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(email ? { user: { email: { contains: email, mode: "insensitive" } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, companyName: true } } },
      take: 200,
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    return toErrorResponse(error);
  }
}
