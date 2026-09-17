import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { formatEUR } from "../configurateur/format-currency";

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  A_CONSULTER: "Nous consulter",
  EMIS: "Émis",
  EXPIRE: "Expiré",
};

export default async function TableauDeBordPage() {
  const session = await auth();
  const quotes = await db.quote.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vos devis</h1>
        <Link
          href="/configurateur"
          className="rounded bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-black hover:bg-brand-yellow-dark"
        >
          Nouveau devis
        </Link>
      </div>

      {quotes.length === 0 ? (
        <p className="text-zinc-600">
          Vous n&apos;avez pas encore de devis.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="py-2">Référence</th>
              <th className="py-2">Statut</th>
              <th className="py-2">Total TTC</th>
              <th className="py-2">Validité</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id} className="border-b border-zinc-100">
                <td className="py-2">{quote.reference}</td>
                <td className="py-2">{STATUS_LABELS[quote.status] ?? quote.status}</td>
                <td className="py-2">{quote.total ? formatEUR(Number(quote.total)) : "—"}</td>
                <td className="py-2">
                  {new Intl.DateTimeFormat("fr-FR").format(quote.validUntil)}
                </td>
                <td className="py-2 text-right">
                  <Link href={`/devis/${quote.id}`} className="underline">
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
