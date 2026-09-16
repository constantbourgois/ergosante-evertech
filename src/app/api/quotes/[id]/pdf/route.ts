import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApprovedClient } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";
import { renderQuotePdf, quotePdfFileName, quotePdfStoragePath } from "@/lib/pdf/generate";
import {
  createSignedQuotePdfUrl,
  isStorageConfigured,
  uploadQuotePdf,
} from "@/lib/pdf/storage";

/**
 * Téléchargement du PDF — docs/PLAN.md §8 : généré une seule fois puis
 * stocké, jamais régénéré à chaque téléchargement. L'accès passe par une URL
 * signée à courte durée, créée après vérification que le devis appartient
 * bien au client connecté — docs/PLAN.md §10.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireApprovedClient();
    const { id } = await params;

    const quote = await db.quote.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    }
    if (session.user.role !== "ADMIN" && quote.userId !== session.user.id) {
      return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    }
    if (quote.status !== "EMIS") {
      return NextResponse.json(
        { error: "Aucun PDF disponible pour ce devis." },
        { status: 409 },
      );
    }

    const fileName = quotePdfFileName(quote.reference, quote.createdAt);

    if (!isStorageConfigured()) {
      // Environnement de développement sans Supabase Storage configuré : le
      // PDF est rendu à la volée et jamais persisté. En production,
      // SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être renseignées
      // pour respecter la règle « stocké, pas régénéré » (§8).
      const pdfBuffer = await renderQuotePdf(quote.id);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    const storagePath = quote.pdfUrl ?? quotePdfStoragePath(quote.id, quote.reference);
    if (!quote.pdfUrl) {
      const pdfBuffer = await renderQuotePdf(quote.id);
      await uploadQuotePdf(storagePath, pdfBuffer);
      await db.quote.update({ where: { id: quote.id }, data: { pdfUrl: storagePath } });
    }

    const signedUrl = await createSignedQuotePdfUrl(storagePath);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return toErrorResponse(error);
  }
}
