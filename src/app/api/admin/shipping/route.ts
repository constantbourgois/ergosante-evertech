import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

const createSchema = z.object({
  maxWeightKg: z.number().positive(),
  flatPrice: z.number().positive(),
});

export async function GET() {
  try {
    await requireAdmin();
    const zone = await db.shippingZone.findFirst({
      where: { name: "France" },
      include: { brackets: { orderBy: { maxWeightKg: "asc" } } },
    });
    return NextResponse.json({ brackets: zone?.brackets ?? [] });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Contrôle de cohérence à l'enregistrement — docs/PLAN.md §7 : pas de
 * doublon de borne pour la zone France. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    }

    const zone = await db.shippingZone.upsert({
      where: { name: "France" },
      create: { name: "France" },
      update: {},
    });

    const existing = await db.shippingBracket.findUnique({
      where: { zoneId_maxWeightKg: { zoneId: zone.id, maxWeightKg: parsed.data.maxWeightKg } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Une tranche existe déjà pour ce poids maximal." },
        { status: 409 },
      );
    }

    const bracket = await db.shippingBracket.create({
      data: { zoneId: zone.id, maxWeightKg: parsed.data.maxWeightKg, flatPrice: parsed.data.flatPrice },
    });
    return NextResponse.json({ bracket }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
