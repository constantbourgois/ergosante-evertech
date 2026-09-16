import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { formatEUR } from "../../configurateur/format-currency";

export default async function DevisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const quote = await db.quote.findUnique({
    where: { id },
    include: { lines: { include: { variant: true } } },
  });

  if (!quote) notFound();
  if (session!.user.role !== "ADMIN" && quote.userId !== session!.user.id) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Devis {quote.reference}</h1>
        {quote.status === "EMIS" ? (
          <a
            href={`/api/quotes/${quote.id}/pdf`}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Télécharger le PDF
          </a>
        ) : null}
      </div>

      {quote.status === "A_CONSULTER" ? (
        <p className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Cette configuration dépasse 40 kg ({Number(quote.totalWeightKg).toFixed(2)} kg).
          Notre service client va vous recontacter pour établir ce devis.
        </p>
      ) : null}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-2">Référence</th>
            <th className="py-2">Dimensions</th>
            <th className="py-2">Qté</th>
            <th className="py-2">Surface</th>
            <th className="py-2 text-right">Prix</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((line) => (
            <tr key={line.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2">{line.variantReferenceSnapshot}</td>
              <td className="py-2">
                {line.lengthCm} × {line.widthCm} cm
              </td>
              <td className="py-2">{line.quantity}</td>
              <td className="py-2">{Number(line.totalAreaSqm).toFixed(4)} m²</td>
              <td className="py-2 text-right">{formatEUR(Number(line.lineTotal))}</td>
            </tr>
          ))}
          {quote.lines
            .filter((l) => l.hasEdging)
            .map((line) => (
              <tr key={`${line.id}-chant`} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2">CHAN01</td>
                <td className="py-2" colSpan={2}>
                  Chant — {Number(line.edgingLinearMeters).toFixed(2)} ml
                </td>
                <td />
                <td className="py-2 text-right">{formatEUR(Number(line.edgingPrice))}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {quote.status !== "A_CONSULTER" ? (
        <dl className="ml-auto grid w-72 grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt>Sous-total</dt>
          <dd className="text-right">{formatEUR(Number(quote.subtotal))}</dd>
          {Number(quote.discountAmount) > 0 ? (
            <>
              <dt>Remise</dt>
              <dd className="text-right">− {formatEUR(Number(quote.discountAmount))}</dd>
            </>
          ) : null}
          <dt>Transport</dt>
          <dd className="text-right">{formatEUR(Number(quote.shippingCost))}</dd>
          <dt className="font-medium">Total HT</dt>
          <dd className="text-right font-medium">{formatEUR(Number(quote.totalHT))}</dd>
          <dt>TVA</dt>
          <dd className="text-right">{formatEUR(Number(quote.taxAmount))}</dd>
          <dt className="font-semibold">Total TTC</dt>
          <dd className="text-right font-semibold">{formatEUR(Number(quote.total))}</dd>
        </dl>
      ) : null}

      <p className="text-xs text-zinc-500">
        Devis valable jusqu&apos;au {new Intl.DateTimeFormat("fr-FR").format(quote.validUntil)}.
        Délai de livraison : 2 à 3 semaines.
      </p>
    </main>
  );
}
