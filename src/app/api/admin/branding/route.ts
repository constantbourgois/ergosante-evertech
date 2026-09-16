import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

const patchSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().min(1).optional(),
  secondaryColor: z.string().min(1).optional(),
  fontFamily: z.string().min(1).optional(),
  companyAddress: z.string().min(1).optional(),
  legalMentions: z.string().min(1).optional(),
  quoteFooter: z.string().nullable().optional(),
  quoteValidityDays: z.number().int().positive().optional(),
  defaultVatRate: z.number().min(0).max(100).optional(),
  leadTimeLabel: z.string().min(1).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const branding = await db.brandingSettings.findFirst();
    return NextResponse.json({ branding });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    }

    const existing = await db.brandingSettings.findFirst();
    const branding = existing
      ? await db.brandingSettings.update({ where: { id: existing.id }, data: parsed.data })
      : await db.brandingSettings.create({
          data: {
            primaryColor: "#0f4c81",
            secondaryColor: "#e8b923",
            fontFamily: "Helvetica",
            companyAddress: "",
            legalMentions: "",
            ...parsed.data,
          },
        });

    return NextResponse.json({ branding });
  } catch (error) {
    return toErrorResponse(error);
  }
}
