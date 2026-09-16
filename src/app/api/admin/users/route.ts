import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

/** Liste des comptes — filtrable par statut (en attente par défaut). */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const status = new URL(request.url).searchParams.get("status") ?? "pending";

    const where =
      status === "pending"
        ? { emailVerifiedAt: { not: null }, approvedAt: null, rejectedAt: null }
        : status === "approved"
          ? { approvedAt: { not: null } }
          : status === "rejected"
            ? { rejectedAt: { not: null } }
            : {};

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        companyName: true,
        phone: true,
        role: true,
        emailVerifiedAt: true,
        approvedAt: true,
        rejectedAt: true,
        createdAt: true,
        discountRateId: true,
        discountRate: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return toErrorResponse(error);
  }
}
