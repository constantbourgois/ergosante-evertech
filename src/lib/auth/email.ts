const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "Devis Tapis Antifatigue", email: "no-reply@evertech-france.com" };
const SERVICE_CLIENT_EMAIL = "serviceclient@evertech-france.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envoie un e-mail transactionnel via Brevo — docs/PLAN.md §9. En l'absence
 * de `BREVO_API_KEY` (environnement de développement), l'e-mail est
 * simplement journalisé : ça permet de développer et tester le parcours sans
 * compte Brevo, sans jamais échouer silencieusement en production.
 */
async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(`[email:dev] À: ${to} — Sujet: ${subject}\n${html}`);
    return;
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Échec de l'envoi Brevo (${response.status}) : ${body}`);
  }
}

function appUrl(path: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

export async function sendVerificationEmail(
  email: string,
  rawToken: string,
): Promise<void> {
  const link = appUrl(`/verifier-email?token=${rawToken}`);
  await sendEmail({
    to: email,
    subject: "Vérifiez votre adresse e-mail",
    html: `<p>Bienvenue,</p><p>Confirmez votre adresse e-mail en cliquant sur le lien ci-dessous (valable 24 h) :</p><p><a href="${link}">${link}</a></p>`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  rawToken: string,
): Promise<void> {
  const link = appUrl(`/reinitialiser-mot-de-passe?token=${rawToken}`);
  await sendEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    html: `<p>Une demande de réinitialisation de mot de passe a été effectuée.</p><p><a href="${link}">${link}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`,
  });
}

export async function sendAccountApprovedEmail(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Votre compte est approuvé",
    html: `<p>Votre compte a été approuvé. Vous pouvez désormais vous connecter et générer vos devis.</p><p><a href="${appUrl("/connexion")}">Se connecter</a></p>`,
  });
}

export async function sendAccountRejectedEmail(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Votre demande d'accès n'a pas été retenue",
    html: `<p>Votre demande de compte n'a pas été approuvée. Pour toute question, contactez ${SERVICE_CLIENT_EMAIL}.</p>`,
  });
}

export async function notifyAdminNewRegistration(email: string): Promise<void> {
  await sendEmail({
    to: SERVICE_CLIENT_EMAIL,
    subject: "Nouvelle inscription en attente d'approbation",
    html: `<p>Le compte ${email} a vérifié son adresse et attend une approbation.</p>`,
  });
}

export async function notifyServiceClientQuoteToConsult(
  quoteReference: string,
  customerEmail: string,
): Promise<void> {
  await sendEmail({
    to: SERVICE_CLIENT_EMAIL,
    subject: `Devis ${quoteReference} à chiffrer manuellement`,
    html: `<p>Le devis ${quoteReference} du client ${customerEmail} dépasse 40 kg et doit être chiffré manuellement.</p>`,
  });
}
