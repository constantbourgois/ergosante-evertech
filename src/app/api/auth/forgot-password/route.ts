import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  createAuthToken,
  rateLimitKeyFromRequest,
  sendPasswordResetEmail,
} from "@/lib/auth";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(request: Request) {
  const rateLimitKey = rateLimitKeyFromRequest(request, "forgot-password");
  const { allowed } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
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

  if (user) {
    const token = await createAuthToken(user.id, "PASSWORD_RESET", 2);
    await sendPasswordResetEmail(user.email, token);
  }

  // Réponse identique dans tous les cas — ne jamais confirmer l'existence
  // d'un compte à partir de cet endpoint.
  return NextResponse.json({ ok: true });
}
