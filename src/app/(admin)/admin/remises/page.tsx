"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Discount {
  id: string;
  name: string;
  percentage: string;
  appliesToTransport: boolean;
}

export default function RemisesPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState(10);
  const [appliesToTransport, setAppliesToTransport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/discounts");
    const body = await res.json();
    setDiscounts(body.discounts ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial de la liste
    refresh();
  }, []);

  async function onSubmit(event: FormEvent, confirmAboveCap = false) {
    event.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, percentage, appliesToTransport, confirmAboveCap }),
    });
    const body = await res.json();
    if (!res.ok) {
      if (body.requiresConfirmation) {
        if (confirm(`${body.error} Continuer quand même ?`)) {
          return onSubmit(event, true);
        }
        return;
      }
      setError(body.error);
      return;
    }
    setName("");
    setPercentage(10);
    refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Remises</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="flex flex-col gap-1 text-sm">
          Nom
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Taux (%)
          <input
            type="number"
            min={0}
            max={100}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={appliesToTransport}
            onChange={(e) => setAppliesToTransport(e.target.checked)}
          />
          S&apos;applique aussi au transport
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="self-start rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
          Ajouter
        </button>
      </form>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-2">Nom</th>
            <th className="py-2">Taux</th>
            <th className="py-2">Transport</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {discounts.map((d) => (
            <tr key={d.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2">{d.name}</td>
              <td className="py-2">{d.percentage} %</td>
              <td className="py-2">{d.appliesToTransport ? "Oui" : "Non"}</td>
              <td className="py-2 text-right">
                <button onClick={() => remove(d.id)} className="text-red-600 underline">
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
