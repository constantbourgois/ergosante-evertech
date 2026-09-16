import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  createAuthToken,
  rateLimitKeyFromRequest,
  sendVerificationEmail,
} from "@/lib/auth";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(request: Request) {
  const rateLimitKey = rateLimitKeyFromRequest(request, "resend-verification");
  const { allowed } = checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  // Réponse identique que le compte existe ou non, et qu'il soit déjà
  // vérifié ou non : ne jamais confirmer l'existence d'un compte.
  if (user && !user.emailVerifiedAt) {
    const token = await createAuthToken(user.id, "EMAIL_VERIFICATION", 24);
    await sendVerificationEmail(user.email, token);
  }

  return NextResponse.json({ ok: true });
}
