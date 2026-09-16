import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { consumeAuthToken, hashPassword } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(" ") },
      { status: 400 },
    );
  }

  const result = await consumeAuthToken(parsed.data.token, "PASSWORD_RESET");
  if (!result) {
    return NextResponse.json(
      { error: "Lien de réinitialisation invalide ou expiré." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.user.update({
    where: { id: result.userId },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
