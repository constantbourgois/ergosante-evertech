import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import type { AuthTokenType } from "@/generated/prisma/client";

const TOKEN_BYTES = 32;

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Jeton à usage unique, expirant, comparé en temps constant — docs/PLAN.md
 * §10. Seul son hash est stocké ; le jeton en clair n'existe que dans le lien
 * envoyé au client.
 */
export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlHours: number,
): Promise<string> {
  const rawToken = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  // Un compte ne doit avoir qu'un jeton actif à la fois par type : les
  // précédents sont invalidés (marqués utilisés) pour qu'un lien renvoyé ne
  // laisse pas plusieurs jetons valides en circulation.
  await db.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  await db.authToken.create({
    data: { userId, type, tokenHash, expiresAt },
  });

  return rawToken;
}

export async function consumeAuthToken(
  rawToken: string,
  type: AuthTokenType,
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(rawToken);
  const token = await db.authToken.findUnique({ where: { tokenHash } });

  if (!token || token.type !== type) return null;

  const providedBuf = Buffer.from(tokenHash);
  const storedBuf = Buffer.from(token.tokenHash);
  if (
    providedBuf.length !== storedBuf.length ||
    !timingSafeEqual(providedBuf, storedBuf)
  ) {
    return null;
  }

  if (token.usedAt || token.expiresAt < new Date()) {
    return null;
  }

  await db.authToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  return { userId: token.userId };
}
