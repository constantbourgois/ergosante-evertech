import { createClient } from "@supabase/supabase-js";

const BUCKET = "quotes";
const SIGNED_URL_TTL_SECONDS = 60;

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  // La clé service_role ne quitte jamais le serveur — docs/PLAN.md §10. Ce
  // module n'est importé que par du code serveur (routes API, jamais un
  // composant client).
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Dépose le PDF dans le bucket privé Supabase Storage et retourne le chemin
 * de stockage (pas une URL) : l'accès se fait toujours par URL signée à
 * courte durée, générée après vérification que le devis appartient au
 * client — docs/PLAN.md §10.
 */
export async function uploadQuotePdf(
  storagePath: string,
  pdfBytes: Uint8Array,
): Promise<void> {
  const client = getServiceClient();
  if (!client) {
    throw new Error(
      "Supabase Storage non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants).",
    );
  }
  const { error } = await client.storage
    .from(BUCKET)
    .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(`Échec de l'envoi du PDF vers Supabase Storage : ${error.message}`);
}

export async function createSignedQuotePdfUrl(storagePath: string): Promise<string> {
  const client = getServiceClient();
  if (!client) {
    throw new Error("Supabase Storage non configuré.");
  }
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    throw new Error(`Échec de la génération de l'URL signée : ${error?.message}`);
  }
  return data.signedUrl;
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
