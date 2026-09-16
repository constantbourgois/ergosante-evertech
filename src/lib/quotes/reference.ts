import { db } from "@/lib/db";

/**
 * Numéro de devis lisible, `DEV-{année}-{séquence}`. La contrainte
 * d'unicité en base sert de filet en cas de course entre deux générations
 * concurrentes : on retente avec le compteur suivant plutôt que d'échouer.
 */
export async function generateQuoteReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const count = await db.quote.count({
      where: { reference: { startsWith: prefix } },
    });
    const candidate = `${prefix}${String(count + 1 + attempt).padStart(5, "0")}`;
    const existing = await db.quote.findUnique({ where: { reference: candidate } });
    if (!existing) return candidate;
  }

  throw new Error("Impossible de générer un numéro de devis unique.");
}
