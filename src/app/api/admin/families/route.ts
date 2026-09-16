import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET() {
  try {
    await requireAdmin();
    const families = await db.productFamily.findMany({
      orderBy: [{ workstationType: "asc" }, { code: "asc" }],
      include: { variants: { orderBy: { reference: "asc" } } },
    });
    return NextResponse.json({ families });
  } catch (error) {
    return toErrorResponse(error);
  }
}
