"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  WORKSTATION_LABELS,
  type CatalogFamily,
  type DraftLine,
  type PreviewResult,
  type WorkstationType,
} from "./types";
import { formatEUR } from "./format-currency";

const WORKSTATION_ORDER: WorkstationType[] = [
  "FIXE",
  "MOBILE",
  "PIVOTANT",
  "SPECIFIQUE",
  "MILIEU_HUMIDE",
];

function newLineDraft(family: CatalogFamily): DraftLine {
  return {
    key: crypto.randomUUID(),
    familyId: family.id,
    familyLabel: family.name,
    quantity: 1,
    lengthCm: family.minCutCm,
    widthCm: family.minCutCm,
    hasESD: false,
    hasB1: false,
    hasEdging: false,
  };
}

export default function ConfiguratorApp() {
  const router = useRouter();
  const [families, setFamilies] = useState<CatalogFamily[] | null>(null);
  const [workstationType, setWorkstationType] = useState<WorkstationType>("FIXE");
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftLine | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/catalog/families")
      .then((res) => res.json())
      .then((data) => setFamilies(data.families));
  }, []);

  const familiesForWorkstation = useMemo(
    () => (families ?? []).filter((f) => f.workstationType === workstationType),
    [families, workstationType],
  );

  // Sélection dérivée : le choix explicite du client prime, sinon la
  // référence recommandée pour ce type de poste, sinon la première
  // disponible — calculée au rendu, pas dans un effet (docs React : ne pas
  // dupliquer un état dérivable en state + effet).
  const selectedFamily = useMemo(() => {
    const explicit = familiesForWorkstation.find((f) => f.id === selectedFamilyId);
    if (explicit) return explicit;
    const recommended = familiesForWorkstation.find((f) => f.isRecommended);
    return recommended ?? familiesForWorkstation[0] ?? null;
  }, [familiesForWorkstation, selectedFamilyId]);

  useEffect(() => {
    // Le brouillon de ligne est un état saisi par le client, pas une valeur
    // dérivable : il doit être réinitialisé quand le modèle change, mais
    // reste ensuite librement modifié par le formulaire.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(selectedFamily ? newLineDraft(selectedFamily) : null);
  }, [selectedFamily]);

  useEffect(() => {
    if (lines.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null);
      return;
    }
    const controller = new AbortController();
    fetch("/api/pricing/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        lines: lines.map((l) => ({
          familyId: l.familyId,
          quantity: l.quantity,
          lengthCm: l.lengthCm,
          widthCm: l.widthCm,
          hasESD: l.hasESD,
          hasB1: l.hasB1,
          hasEdging: l.hasEdging,
        })),
      }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setPreviewError(body.error ?? "Impossible de calculer le devis.");
          setPreview(null);
          return;
        }
        setPreviewError(null);
        setPreview(body);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [lines]);

  function addLine() {
    if (!draft || !selectedFamily) return;
    if (draft.lengthCm < selectedFamily.minCutCm || draft.widthCm < selectedFamily.minCutCm) {
      setPreviewError(
        `Dimensions minimales : ${selectedFamily.minCutCm} cm sur chaque côté.`,
      );
      return;
    }
    setLines((prev) => [...prev, draft]);
    setDraft(newLineDraft(selectedFamily));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  async function submitQuote() {
    setSubmitting(true);
    setSubmitError(null);
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((l) => ({
          familyId: l.familyId,
          quantity: l.quantity,
          lengthCm: l.lengthCm,
          widthCm: l.widthCm,
          hasESD: l.hasESD,
          hasB1: l.hasB1,
          hasEdging: l.hasEdging,
        })),
      }),
    });
    const body = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setSubmitError(body.error ?? "Impossible de générer le devis.");
      return;
    }
    router.push(`/devis/${body.quote.id}`);
  }

  if (!families) {
    return <p className="px-6 py-12">Chargement du catalogue…</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <h1 className="text-2xl font-semibold">Nouveau devis</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">1. Type de poste de travail</h2>
        <div className="flex flex-wrap gap-2">
          {WORKSTATION_ORDER.map((type) => (
            <button
              key={type}
              onClick={() => {
                setWorkstationType(type);
                setSelectedFamilyId(null);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                workstationType === type
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {WORKSTATION_LABELS[type]}
            </button>
          ))}
        </div>
      </section>

      {selectedFamily ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">2. Modèle</h2>
            <div className="flex flex-wrap gap-3">
              {familiesForWorkstation.map((family) => (
                <button
                  key={family.id}
                  onClick={() => setSelectedFamilyId(family.id)}
                  className={`flex flex-col gap-1 rounded border px-4 py-3 text-left text-sm ${
                    family.id === selectedFamilyId
                      ? "border-black dark:border-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  <span className="font-medium">
                    {family.name} {family.isRecommended ? "· Recommandé" : ""}
                  </span>
                  <span className="text-zinc-500">{family.description}</span>
                  <span className="text-zinc-500">
                    {family.thicknessMm} mm · {family.colorLabel}
                  </span>
                </button>
              ))}
              {familiesForWorkstation.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Aucun modèle disponible pour ce type de poste pour le moment.
                </p>
              ) : null}
            </div>
          </section>

          {draft ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">3–5. Quantité, dimensions, options</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <label className="flex flex-col gap-1 text-sm">
                  Quantité
                  <input
                    type="number"
                    min={1}
                    value={draft.quantity}
                    onChange={(e) =>
                      setDraft({ ...draft, quantity: Number(e.target.value) || 1 })
                    }
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Longueur (cm)
                  <input
                    type="number"
                    min={selectedFamily.minCutCm}
                    value={draft.lengthCm}
                    onChange={(e) =>
                      setDraft({ ...draft, lengthCm: Number(e.target.value) || 0 })
                    }
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Largeur (cm)
                  <input
                    type="number"
                    min={selectedFamily.minCutCm}
                    max={selectedFamily.maxCutWidthCm ?? undefined}
                    value={draft.widthCm}
                    onChange={(e) =>
                      setDraft({ ...draft, widthCm: Number(e.target.value) || 0 })
                    }
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
              </div>
              <p className="text-xs text-zinc-500">
                Minimum {selectedFamily.minCutCm} cm sur chaque côté
                {selectedFamily.maxCutWidthCm
                  ? `, largeur maximale ${selectedFamily.maxCutWidthCm} cm`
                  : ", aucune longueur maximale"}
                {selectedFamily.hasStandardFormat
                  ? ". Un format standard est automatiquement retenu s'il correspond exactement à vos dimensions."
                  : ""}
              </p>

              <div className="flex flex-wrap gap-6">
                <label
                  title={!selectedFamily.supportsESD ? "Non disponible sur ce modèle" : undefined}
                  className={`flex items-center gap-2 text-sm ${!selectedFamily.supportsESD ? "opacity-40" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={!selectedFamily.supportsESD}
                    checked={draft.hasESD}
                    onChange={(e) => setDraft({ ...draft, hasESD: e.target.checked })}
                  />
                  ESD — dissipation électrostatique
                </label>
                <label
                  title={!selectedFamily.supportsB1 ? "Non disponible sur ce modèle" : undefined}
                  className={`flex items-center gap-2 text-sm ${!selectedFamily.supportsB1 ? "opacity-40" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={!selectedFamily.supportsB1}
                    checked={draft.hasB1}
                    onChange={(e) => setDraft({ ...draft, hasB1: e.target.checked })}
                  />
                  B1 — résistance au feu (DIN 4102-1)
                </label>
                <label
                  title={!selectedFamily.supportsEdging ? "Non disponible sur ce modèle" : undefined}
                  className={`flex items-center gap-2 text-sm ${!selectedFamily.supportsEdging ? "opacity-40" : ""}`}
                >
                  <input
                    type="checkbox"
                    disabled={!selectedFamily.supportsEdging}
                    checked={draft.hasEdging}
                    onChange={(e) => setDraft({ ...draft, hasEdging: e.target.checked })}
                  />
                  Chant jaune 5 cm (périmètre complet)
                </label>
              </div>

              {previewError ? <p className="text-sm text-red-600">{previewError}</p> : null}

              <button
                onClick={addLine}
                className="self-start rounded border border-black px-4 py-2 text-sm font-medium dark:border-white"
              >
                Ajouter cette ligne
              </button>
            </section>
          ) : null}
        </>
      ) : null}

      {lines.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">6. Lignes du devis</h2>
          <ul className="flex flex-col gap-2">
            {lines.map((line) => (
              <li
                key={line.key}
                className="flex items-center justify-between rounded border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800"
              >
                <span>
                  {line.familyLabel} — {line.quantity} × {line.lengthCm}×{line.widthCm} cm
                  {line.hasESD ? " · ESD" : ""}
                  {line.hasB1 ? " · B1" : ""}
                  {line.hasEdging ? " · Chant" : ""}
                </span>
                <button onClick={() => removeLine(line.key)} className="text-red-600 underline">
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {preview ? (
        <section className="flex flex-col gap-2 rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium">Récapitulatif</h2>
          {preview.status === "A_CONSULTER" ? (
            <p className="text-amber-600">
              Cette configuration dépasse 40 kg ({preview.totalWeightKg.toFixed(2)} kg) :
              nous devons vous consulter pour le transport. Votre configuration sera
              conservée et notre service client vous recontactera.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:w-80">
              <dt>Sous-total</dt>
              <dd className="text-right">{formatEUR(preview.subtotal)}</dd>
              {preview.discountAmount > 0 ? (
                <>
                  <dt>Remise</dt>
                  <dd className="text-right">− {formatEUR(preview.discountAmount)}</dd>
                </>
              ) : null}
              <dt>Transport</dt>
              <dd className="text-right">{formatEUR(preview.shippingCost ?? 0)}</dd>
              <dt className="font-medium">Total HT</dt>
              <dd className="text-right font-medium">{formatEUR(preview.totalHT ?? 0)}</dd>
              <dt>TVA (20 %)</dt>
              <dd className="text-right">{formatEUR(preview.taxAmount ?? 0)}</dd>
              <dt className="font-semibold">Total TTC</dt>
              <dd className="text-right font-semibold">{formatEUR(preview.totalTTC ?? 0)}</dd>
            </dl>
          )}
          <p className="text-xs text-zinc-500">
            Validité 1 mois · Délai 2 à 3 semaines.
          </p>
          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
          <button
            onClick={submitQuote}
            disabled={submitting}
            className="mt-2 self-start rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {submitting ? "Génération…" : "Valider le devis"}
          </button>
        </section>
      ) : null}
    </main>
  );
}
