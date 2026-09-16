import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { QuoteDocument, type QuoteDocumentLine } from "./QuoteDocument";

/** Nommage du fichier — docs/PLAN.md §8. */
export function quotePdfFileName(reference: string, createdAt: Date): string {
  const date = createdAt.toISOString().slice(0, 10);
  return `Devis-${reference}-${date}.pdf`;
}

export function quotePdfStoragePath(quoteId: string, reference: string): string {
  return `${quoteId}/${reference}.pdf`;
}

/**
 * Rend le PDF d'un devis déjà persisté. Le document remis au client ne doit
 * pas changer entre deux téléchargements (§8) : cette fonction est appelée
 * une seule fois, à la première demande de téléchargement, puis le résultat
 * est stocké.
 */
export async function renderQuotePdf(quoteId: string): Promise<Buffer> {
  const quote = await db.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: { lines: { include: { variant: true } }, user: true },
  });
  const branding = await db.brandingSettings.findFirst();

  const lines: QuoteDocumentLine[] = quote.lines.map((line) => ({
    reference: line.variantReferenceSnapshot,
    designation: line.variant.reference,
    lengthCm: line.lengthCm,
    widthCm: line.widthCm,
    quantity: line.quantity,
    totalAreaSqm: Number(line.totalAreaSqm),
    lineTotal: Number(line.lineTotal),
    hasEdging: line.hasEdging,
    edgingLinearMeters: line.edgingLinearMeters ? Number(line.edgingLinearMeters) : null,
    edgingPrice: line.edgingPrice ? Number(line.edgingPrice) : null,
  }));

  const document = QuoteDocument({
    reference: quote.reference,
    createdAt: quote.createdAt,
    validUntil: quote.validUntil,
    leadTimeLabel: branding?.leadTimeLabel ?? "2 à 3 semaines",
    customer: {
      companyName: quote.user.companyName,
      email: quote.user.email,
      phone: quote.user.phone,
    },
    lines,
    subtotal: Number(quote.subtotal),
    discountAmount: Number(quote.discountAmount),
    shippingCost: Number(quote.shippingCost ?? 0),
    totalHT: Number(quote.totalHT ?? 0),
    vatRate: Number(quote.vatRate),
    taxAmount: Number(quote.taxAmount ?? 0),
    totalTTC: Number(quote.total ?? 0),
    branding: {
      logoUrl: branding?.logoUrl ?? null,
      primaryColor: branding?.primaryColor ?? "#0f4c81",
      companyAddress: branding?.companyAddress ?? "",
      legalMentions: branding?.legalMentions ?? "",
      quoteFooter: branding?.quoteFooter ?? null,
    },
  });

  return renderToBuffer(document);
}
