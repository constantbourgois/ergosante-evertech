import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";

/**
 * Suppression à la demande depuis le compte — docs/QUESTIONS-OUVERTES.md
 * §5.6. Marque le compte pour suppression plutôt que de l'effacer
 * immédiatement : les devis déjà émis sont des pièces commerciales à
 * conserver jusqu'au terme légal (5 ans), la purge effective et
 * l'anonymisation sont traitées par `scripts/gdpr-retention.ts`.
 */
export async function DELETE() {
  try {
    const session = await requireSession();
    await db.user.update({
      where: { id: session.user.id },
      data: { deletionRequestedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
