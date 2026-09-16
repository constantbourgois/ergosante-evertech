import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  createAuthToken,
  hashPassword,
  rateLimitKeyFromRequest,
  sendVerificationEmail,
} from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères."),
  companyName: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const rateLimitKey = rateLimitKeyFromRequest(request, "register");
  const { allowed } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(" ") },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Ne pas révéler qu'un compte existe déjà : réponse générique, mais
    // aucun nouvel e-mail n'est envoyé.
    return NextResponse.json({ ok: true });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      companyName: parsed.data.companyName,
      phone: parsed.data.phone,
    },
  });

  const token = await createAuthToken(user.id, "EMAIL_VERIFICATION", 24);
  await sendVerificationEmail(user.email, token);

  return NextResponse.json({ ok: true });
}
