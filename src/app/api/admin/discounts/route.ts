import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

const DEFAULT_CAP_PERCENTAGE = 30;

const createSchema = z.object({
  name: z.string().trim().min(1),
  percentage: z.number().min(0).max(100),
  appliesToTransport: z.boolean().optional(),
  confirmAboveCap: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const discounts = await db.discountRate.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ discounts });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Garde-fou de remise — docs/PLAN.md §6.3 : plafond paramétrable, 30 % par
 * défaut. Au-delà, l'enregistrement demande une confirmation explicite
 * (`confirmAboveCap`) plutôt qu'un blocage pur — les prix d'achat n'étant
 * pas importés, l'application ne peut pas vérifier la marge (docs/PLAN.md §10).
 */
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

    if (parsed.data.percentage > DEFAULT_CAP_PERCENTAGE && !parsed.data.confirmAboveCap) {
      return NextResponse.json(
        {
          error: `Remise supérieure au plafond de ${DEFAULT_CAP_PERCENTAGE} %. Confirmez explicitement pour l'enregistrer.`,
          requiresConfirmation: true,
        },
        { status: 422 },
      );
    }

    const discount = await db.discountRate.create({
      data: {
        name: parsed.data.name,
        percentage: parsed.data.percentage,
        appliesToTransport: parsed.data.appliesToTransport ?? false,
      },
    });
    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
