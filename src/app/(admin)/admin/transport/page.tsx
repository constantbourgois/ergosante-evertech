"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Bracket {
  id: string;
  maxWeightKg: string;
  flatPrice: string;
}

export default function TransportPage() {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [maxWeightKg, setMaxWeightKg] = useState(0);
  const [flatPrice, setFlatPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/shipping");
    const body = await res.json();
    setBrackets(body.brackets ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial de la liste
    refresh();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/shipping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ maxWeightKg, flatPrice }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error);
      return;
    }
    setMaxWeightKg(0);
    setFlatPrice(0);
    refresh();
  }

  async function updateBracket(id: string, flatPrice: number) {
    await fetch(`/api/admin/shipping/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ flatPrice }),
    });
    refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/shipping/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Transport — France</h1>
      <p className="text-sm text-zinc-500">
        Au-delà de la tranche la plus haute, le devis bascule automatiquement en
        « nous consulter ».
      </p>

      <form onSubmit={onSubmit} className="flex items-end gap-3 rounded border border-zinc-200 p-4">
        <label className="flex flex-col gap-1 text-sm">
          Poids max (kg)
          <input
            type="number"
            step="0.01"
            value={maxWeightKg || ""}
            onChange={(e) => setMaxWeightKg(Number(e.target.value))}
            className="w-32 rounded border-2 border-brand-black px-3 py-2 focus:border-brand-yellow focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Forfait (€)
          <input
            type="number"
            step="0.01"
            value={flatPrice || ""}
            onChange={(e) => setFlatPrice(Number(e.target.value))}
            className="w-32 rounded border-2 border-brand-black px-3 py-2 focus:border-brand-yellow focus:outline-none"
          />
        </label>
        <button type="submit" className="rounded bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-black hover:bg-brand-yellow-dark">
          Ajouter la tranche
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="py-2">Jusqu&apos;à</th>
            <th className="py-2">Forfait</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {brackets.map((b) => (
            <tr key={b.id} className="border-b border-zinc-100">
              <td className="py-2">{b.maxWeightKg} kg</td>
              <td className="py-2">
                <input
                  type="number"
                  step="0.01"
                  defaultValue={b.flatPrice}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (value > 0 && value !== Number(b.flatPrice)) updateBracket(b.id, value);
                  }}
                  className="w-24 rounded border-2 border-brand-black px-2 py-1 focus:border-brand-yellow focus:outline-none"
                />
                {" €"}
              </td>
              <td className="py-2 text-right">
                <button onClick={() => remove(b.id)} className="text-red-600 underline">
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
