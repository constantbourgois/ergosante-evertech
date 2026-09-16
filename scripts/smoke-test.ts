/**
 * Test de bout en bout du parcours principal, contre un serveur déjà lancé
 * (dev database uniquement — ce script écrit des comptes de test en base).
 *
 * Usage :
 *   npm run build && npm run start -- -p 3100   (dans un premier terminal)
 *   npx tsx scripts/smoke-test.ts                (dans un second terminal)
 *
 * Couvre : inscription, vérification (simulée — pas d'e-mail réel sans
 * BREVO_API_KEY), approbation admin, connexion, catalogue, prévisualisation
 * de prix (cas de recette Ergosanté), création de devis, téléchargement du
 * PDF, cloisonnement entre clients.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const BASE = "http://localhost:3100";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function extractSetCookie(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function signIn(email: string, password: string) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfCookie = extractSetCookie(csrfRes);
  const { csrfToken } = await csrfRes.json();

  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: csrfCookie,
    },
    body: new URLSearchParams({ email, password, csrfToken, redirect: "false", json: "true" }),
  });
  const sessionCookie = extractSetCookie(signInRes);
  return [csrfCookie, sessionCookie].filter(Boolean).join("; ");
}

async function main() {
  console.log("1. Bootstrap admin…");
  const adminEmail = `admin-${Date.now()}@example.com`;
  const adminPassword = "AdminPassword123";
  await db.user.create({
    data: {
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  console.log("2. Register client…");
  const clientEmail = `client-${Date.now()}@example.com`;
  const clientPassword = "ClientPassword123";
  const registerRes = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: clientEmail, password: clientPassword, companyName: "Ergosanté" }),
  });
  console.log("   register status:", registerRes.status);

  const user = await db.user.findUniqueOrThrow({ where: { email: clientEmail } });
  const token = await db.authToken.findFirstOrThrow({ where: { userId: user.id, type: "EMAIL_VERIFICATION" } });
  // Le token brut n'est jamais stocké : on force la vérification directement pour le smoke test.
  await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  await db.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });

  console.log("3. Admin approves client…");
  const adminCookie = await signIn(adminEmail, adminPassword);
  const approveRes = await fetch(`${BASE}/api/admin/users/${user.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie: adminCookie },
    body: JSON.stringify({ action: "approve" }),
  });
  console.log("   approve status:", approveRes.status, await approveRes.text());

  console.log("4. Client signs in…");
  const clientCookie = await signIn(clientEmail, clientPassword);

  console.log("5. Fetch catalog families…");
  const familiesRes = await fetch(`${BASE}/api/catalog/families`, { headers: { cookie: clientCookie } });
  const { families } = await familiesRes.json();
  const mb = families.find((f: { code: string }) => f.code === "10104");
  console.log("   MB family found:", Boolean(mb));

  console.log("6. Preview Ergosanté quote…");
  const lines = [
    { familyId: mb.id, quantity: 1, lengthCm: 220, widthCm: 91, hasESD: false, hasB1: false, hasEdging: false },
    { familyId: mb.id, quantity: 1, lengthCm: 160, widthCm: 91, hasESD: false, hasB1: false, hasEdging: false },
    { familyId: mb.id, quantity: 1, lengthCm: 160, widthCm: 60, hasESD: false, hasB1: false, hasEdging: false },
  ];
  const previewRes = await fetch(`${BASE}/api/pricing/preview`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: clientCookie },
    body: JSON.stringify({ lines }),
  });
  const preview = await previewRes.json();
  console.log("   preview:", preview.status, preview.totalHT, preview.totalTTC);

  console.log("7. Create quote…");
  const createRes = await fetch(`${BASE}/api/quotes`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: clientCookie },
    body: JSON.stringify({ lines }),
  });
  const { quote } = await createRes.json();
  console.log("   quote:", quote.reference, quote.status, quote.total);

  console.log("8. Download PDF…");
  const pdfRes = await fetch(`${BASE}/api/quotes/${quote.id}/pdf`, { headers: { cookie: clientCookie } });
  console.log("   pdf status:", pdfRes.status, pdfRes.headers.get("content-type"));
  const buf = Buffer.from(await pdfRes.arrayBuffer());
  console.log("   pdf bytes:", buf.length, "starts with %PDF:", buf.subarray(0, 4).toString());

  console.log("9. Cross-tenant isolation check: another client cannot see this quote…");
  const otherEmail = `other-${Date.now()}@example.com`;
  await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: otherEmail, password: "OtherPassword123" }),
  });
  const otherUser = await db.user.findUniqueOrThrow({ where: { email: otherEmail } });
  await db.user.update({ where: { id: otherUser.id }, data: { emailVerifiedAt: new Date(), approvedAt: new Date() } });
  const otherCookie = await signIn(otherEmail, "OtherPassword123");
  const forbiddenRes = await fetch(`${BASE}/api/quotes/${quote.id}`, { headers: { cookie: otherCookie } });
  console.log("   other client quote access status (expect 404):", forbiddenRes.status);

  console.log("\nSmoke test complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
