/**
 * Purge et anonymisation RGPD — docs/QUESTIONS-OUVERTES.md §5.6 :
 *   - devis conservés 5 ans (prescription commerciale, art. L110-4 du code
 *     de commerce) puis supprimés ;
 *   - compte inactif alerté à 2 ans sans connexion, anonymisé à 3 ans ;
 *   - suppression à la demande honorée immédiatement pour les comptes sans
 *     devis de moins de 5 ans, sinon différée jusqu'au terme légal.
 *
 * Aucune infrastructure de tâche planifiée n'est provisionnée dans ce
 * dépôt : ce script est prévu pour être exécuté par un Vercel Cron Job (ou
 * équivalent) une fois par jour, pas encore câblé — voir README.
 *
 * Usage : npx tsx scripts/gdpr-retention.ts [--dry-run]
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const QUOTE_RETENTION_YEARS = 5;
const INACTIVITY_ALERT_YEARS = 2;
const INACTIVITY_DELETION_YEARS = 3;

const dryRun = process.argv.includes("--dry-run");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function yearsAgo(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

async function purgeExpiredQuotes() {
  const cutoff = yearsAgo(QUOTE_RETENTION_YEARS);
  const expired = await db.quote.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, reference: true },
  });
  console.log(`Devis au-delà de ${QUOTE_RETENTION_YEARS} ans : ${expired.length}`);
  if (!dryRun && expired.length > 0) {
    await db.quote.deleteMany({ where: { id: { in: expired.map((q) => q.id) } } });
  }
}

async function alertInactiveAccounts() {
  const cutoff = yearsAgo(INACTIVITY_ALERT_YEARS);
  const inactive = await db.user.findMany({
    where: {
      role: "CLIENT",
      deletionRequestedAt: null,
      OR: [{ lastLoginAt: { lt: cutoff } }, { lastLoginAt: null, createdAt: { lt: cutoff } }],
    },
    select: { id: true, email: true },
  });
  console.log(`Comptes inactifs depuis ${INACTIVITY_ALERT_YEARS} ans (à alerter) : ${inactive.length}`);
  // L'envoi effectif de l'e-mail d'alerte est laissé à l'intégration Brevo —
  // lib/auth/email.ts — une fois le gabarit dédié rédigé.
}

async function anonymizeInactiveOrRequestedAccounts() {
  const cutoff = yearsAgo(INACTIVITY_DELETION_YEARS);
  const toAnonymize = await db.user.findMany({
    where: {
      role: "CLIENT",
      OR: [
        { deletionRequestedAt: { not: null } },
        { lastLoginAt: { lt: cutoff } },
        { lastLoginAt: null, createdAt: { lt: cutoff } },
      ],
    },
  });
  console.log(`Comptes à anonymiser : ${toAnonymize.length}`);
  if (dryRun) return;

  for (const user of toAnonymize) {
    await db.user.update({
      where: { id: user.id },
      data: {
        email: `compte-anonymise-${user.id}@evertech-france.invalid`,
        passwordHash: "",
        companyName: null,
        phone: null,
      },
    });
  }
}

async function main() {
  console.log(`Rétention RGPD — ${dryRun ? "simulation" : "exécution"}`);
  await purgeExpiredQuotes();
  await alertInactiveAccounts();
  await anonymizeInactiveOrRequestedAccounts();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
