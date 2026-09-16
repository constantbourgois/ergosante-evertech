import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeAuthToken, notifyAdminNewRegistration } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  if (!token) {
    return NextResponse.json({ error: "Jeton manquant." }, { status: 400 });
  }

  const result = await consumeAuthToken(token, "EMAIL_VERIFICATION");
  if (!result) {
    return NextResponse.json(
      { error: "Lien de vérification invalide ou expiré." },
      { status: 400 },
    );
  }

  const user = await db.user.update({
    where: { id: result.userId },
    data: { emailVerifiedAt: new Date() },
  });

  await notifyAdminNewRegistration(user.email);

  return NextResponse.json({ ok: true });
}
