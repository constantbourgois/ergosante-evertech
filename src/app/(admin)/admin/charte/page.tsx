"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Branding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  companyAddress: string;
  legalMentions: string;
  quoteFooter: string | null;
  quoteValidityDays: number;
  defaultVatRate: string;
  leadTimeLabel: string;
}

export default function ChartePage() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/branding")
      .then((res) => res.json())
      .then((body) => setBranding(body.branding));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!branding) return;
    await fetch("/api/admin/branding", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...branding,
        defaultVatRate: Number(branding.defaultVatRate),
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!branding) return <p className="px-6 py-12">Chargement…</p>;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Charte graphique du PDF</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          URL du logo
          <input
            value={branding.logoUrl ?? ""}
            onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value || null })}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Couleur principale
            <input
              type="color"
              value={branding.primaryColor}
              onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Couleur secondaire
            <input
              type="color"
              value={branding.secondaryColor}
              onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Adresse de l&apos;entreprise
          <textarea
            value={branding.companyAddress}
            onChange={(e) => setBranding({ ...branding, companyAddress: e.target.value })}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mentions légales
          <textarea
            value={branding.legalMentions}
            onChange={(e) => setBranding({ ...branding, legalMentions: e.target.value })}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Validité (jours)
            <input
              type="number"
              value={branding.quoteValidityDays}
              onChange={(e) =>
                setBranding({ ...branding, quoteValidityDays: Number(e.target.value) })
              }
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            TVA (%)
            <input
              type="number"
              value={branding.defaultVatRate}
              onChange={(e) => setBranding({ ...branding, defaultVatRate: e.target.value })}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Délai
            <input
              value={branding.leadTimeLabel}
              onChange={(e) => setBranding({ ...branding, leadTimeLabel: e.target.value })}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </div>
        <button
          type="submit"
          className="self-start rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          Enregistrer
        </button>
        {saved ? <p className="text-sm text-green-600">Enregistré.</p> : null}
      </form>
    </main>
  );
}
