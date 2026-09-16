"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminQuote {
  id: string;
  reference: string;
  status: string;
  total: string | null;
  totalWeightKg: string;
  createdAt: string;
  user: { email: string; companyName: string | null };
}

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  A_CONSULTER: "Nous consulter",
  EMIS: "Émis",
  EXPIRE: "Expiré",
};

export default function AdminDevisPage() {
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");

  async function refresh() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (email) params.set("email", email);
    const res = await fetch(`/api/admin/quotes?${params.toString()}`);
    const body = await res.json();
    setQuotes(body.quotes ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- rechargement volontaire au changement de filtre
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Devis</h1>

      <div className="flex gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          placeholder="Filtrer par e-mail client"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && refresh()}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button onClick={refresh} className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
          Filtrer
        </button>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-2">Référence</th>
            <th className="py-2">Client</th>
            <th className="py-2">Statut</th>
            <th className="py-2">Total TTC</th>
            <th className="py-2">Date</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr
              key={q.id}
              className={`border-b border-zinc-100 dark:border-zinc-900 ${
                q.status === "A_CONSULTER" ? "bg-amber-50 dark:bg-amber-950/40" : ""
              }`}
            >
              <td className="py-2">{q.reference}</td>
              <td className="py-2">{q.user.companyName ?? q.user.email}</td>
              <td className="py-2">{STATUS_LABELS[q.status] ?? q.status}</td>
              <td className="py-2">{q.total ? `${Number(q.total).toFixed(2)} €` : "—"}</td>
              <td className="py-2">{new Intl.DateTimeFormat("fr-FR").format(new Date(q.createdAt))}</td>
              <td className="py-2 text-right">
                <Link href={`/devis/${q.id}`} className="underline">
                  Voir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
