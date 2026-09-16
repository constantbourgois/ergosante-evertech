import { auth } from "./config";
import { db } from "@/lib/db";
import type { Session } from "next-auth";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

/**
 * Contrôle de rôle côté serveur — docs/PLAN.md §10 : les routes
 * d'administration ne se protègent jamais par le seul masquage d'interface.
 */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError("Authentification requise.");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    throw new ForbiddenError("Réservé aux administrateurs.");
  }
  return session;
}

/**
 * Client authentifié, e-mail vérifié et compte approuvé — revérifié en base
 * à chaque appel, pas seulement au moment de la connexion : un accès révoqué
 * après l'émission du jeton de session ne doit pas rester actif.
 */
export async function requireApprovedClient(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role === "ADMIN") return session;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.rejectedAt || !user.emailVerifiedAt || !user.approvedAt) {
    throw new ForbiddenError("Compte non approuvé.");
  }
  return session;
}
