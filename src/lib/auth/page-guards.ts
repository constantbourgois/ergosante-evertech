import { redirect } from "next/navigation";
import { auth } from "./config";
import { db } from "@/lib/db";
import type { Session } from "next-auth";

/**
 * Garde de page (Server Component) : redirige vers l'écran adapté plutôt que
 * de renvoyer une erreur JSON — utilisée par les layouts de (client) et
 * (admin). Revérifie l'état du compte en base à chaque rendu.
 */
export async function requireApprovedClientPage(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role === "ADMIN") return session;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.rejectedAt) redirect("/compte-refuse");
  if (!user.emailVerifiedAt) redirect("/verifier-email");
  if (!user.approvedAt) redirect("/en-attente");

  return session;
}

export async function requireAdminPage(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}
