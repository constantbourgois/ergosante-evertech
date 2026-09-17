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
import { StepIndicator } from "./StepIndicator";

const WORKSTATION_ORDER: WorkstationType[] = [
  "FIXE",
  "MOBILE",
  "PIVOTANT",
  "SPECIFIQUE",
  "MILIEU_HUMIDE",
];

const STEPS = [
  { id: 0, label: "Type de poste" },
  { id: 1, label: "Modèle" },
  { id: 2, label: "Configuration" },
  { id: 3, label: "Résumé" },
  { id: 4, label: "Aperçu" },
] as const;

type StepId = typeof STEPS[number]["id"];

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
  const [currentStep, setCurrentStep] = useState<StepId>(0);
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

  function canAdvanceStep(): boolean {
    switch (currentStep) {
      case 0:
        return workstationType !== null;
      case 1:
        return selectedFamily !== null;
      case 2:
        return draft !== null && lines.length + 1 >= 1;
      case 3:
        return lines.length > 0;
      case 4:
        return preview !== null;
      default:
        return true;
    }
  }

  function nextStep() {
    if (canAdvanceStep() && currentStep < STEPS.length - 1) {
      setCurrentStep((currentStep + 1) as StepId);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as StepId);
    }
  }

  if (!families) {
    return <p className="px-6 py-12">Chargement du catalogue…</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Nouveau devis</h1>
      </div>

      <div className="px-2">
        <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
      </div>

      <div className="min-h-96">
        {currentStep === 0 && (
          <section className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-medium mb-2">{STEPS[0].label}</h2>
              <p className="text-sm text-zinc-500">Quel type de poste de travail ?</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {WORKSTATION_ORDER.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setWorkstationType(type);
                    setSelectedFamilyId(null);
                  }}
                  className={`rounded-lg border-2 px-4 py-4 text-left transition ${
                    workstationType === type
                      ? "border-brand-yellow bg-brand-yellow/10"
                      : "border-zinc-200 hover:border-brand-yellow"
                  }`}
                >
                  <div className="font-medium">{WORKSTATION_LABELS[type]}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {currentStep === 1 && (
          <section className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-medium mb-2">{STEPS[1].label}</h2>
              <p className="text-sm text-zinc-500">Quel produit EVERMAT ?</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {familiesForWorkstation.map((family) => (
                <button
                  key={family.id}
                  onClick={() => setSelectedFamilyId(family.id)}
                  className={`flex flex-col gap-2 rounded-lg border-2 px-4 py-4 text-left transition ${
                    family.id === selectedFamilyId
                      ? "border-brand-yellow bg-brand-yellow/10"
                      : "border-zinc-200 hover:border-brand-yellow"
                  }`}
                >
                  <div className="font-medium">{family.name}</div>
                  <div className="text-sm text-zinc-500">{family.description}</div>
                  <div className="text-xs text-zinc-400">
                    {family.thicknessMm} mm · {family.colorLabel}
                    {family.isRecommended ? " · Recommandé" : ""}
                  </div>
                </button>
              ))}
              {familiesForWorkstation.length === 0 && (
                <p className="text-sm text-zinc-500 col-span-full">
                  Aucun modèle disponible pour ce type de poste.
                </p>
              )}
            </div>
          </section>
        )}

        {currentStep === 2 && draft && (
          <section className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-medium mb-2">{STEPS[2].label}</h2>
              <p className="text-sm text-zinc-500">{selectedFamily?.name}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Quantité</span>
                <input
                  type="number"
                  min={1}
                  value={draft.quantity}
                  onChange={(e) =>
                    setDraft({ ...draft, quantity: Number(e.target.value) || 1 })
                  }
                  className="rounded border-2 border-zinc-200 px-3 py-2 focus:border-brand-yellow focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Longueur (cm)</span>
                <input
                  type="number"
                  min={selectedFamily?.minCutCm}
                  value={draft.lengthCm}
                  onChange={(e) =>
                    setDraft({ ...draft, lengthCm: Number(e.target.value) || 0 })
                  }
                  className="rounded border-2 border-zinc-200 px-3 py-2 focus:border-brand-yellow focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Largeur (cm)</span>
                <input
                  type="number"
                  min={selectedFamily?.minCutCm}
                  max={selectedFamily?.maxCutWidthCm ?? undefined}
                  value={draft.widthCm}
                  onChange={(e) =>
                    setDraft({ ...draft, widthCm: Number(e.target.value) || 0 })
                  }
                  className="rounded border-2 border-zinc-200 px-3 py-2 focus:border-brand-yellow focus:outline-none"
                />
              </label>
            </div>
            <p className="text-xs text-zinc-500">
              Minimum {selectedFamily?.minCutCm} cm
              {selectedFamily?.maxCutWidthCm ? ` · Largeur max ${selectedFamily.maxCutWidthCm} cm` : ""}
            </p>

            <div className="space-y-3">
              {selectedFamily?.supportsESD && (
                <label className="flex items-center gap-3 rounded border border-zinc-200 p-3 hover:bg-zinc-50">
                  <input
                    type="checkbox"
                    checked={draft.hasESD}
                    onChange={(e) => setDraft({ ...draft, hasESD: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="text-sm font-medium">ESD</div>
                    <div className="text-xs text-zinc-500">Dissipation électrostatique</div>
                  </div>
                </label>
              )}
              {selectedFamily?.supportsB1 && (
                <label className="flex items-center gap-3 rounded border border-zinc-200 p-3 hover:bg-zinc-50">
                  <input
                    type="checkbox"
                    checked={draft.hasB1}
                    onChange={(e) => setDraft({ ...draft, hasB1: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="text-sm font-medium">B1</div>
                    <div className="text-xs text-zinc-500">Résistance au feu (DIN 4102-1)</div>
                  </div>
                </label>
              )}
              {selectedFamily?.supportsEdging && (
                <label className="flex items-center gap-3 rounded border border-zinc-200 p-3 hover:bg-zinc-50">
                  <input
                    type="checkbox"
                    checked={draft.hasEdging}
                    onChange={(e) => setDraft({ ...draft, hasEdging: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="text-sm font-medium">Chant jaune</div>
                    <div className="text-xs text-zinc-500">5 cm sur le périmètre complet</div>
                  </div>
                </label>
              )}
            </div>

            {previewError && <p className="text-sm text-red-600">{previewError}</p>}

            <button
              onClick={addLine}
              className="self-start rounded bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-black hover:bg-brand-yellow-dark"
            >
              Ajouter cette ligne
            </button>

            {lines.length > 0 && preview && (
              <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="mb-3 text-sm font-medium">Aperçu du devis</h3>
                <table className="w-full text-xs">
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-1">Sous-total</td>
                      <td className="text-right">{formatEUR(preview.subtotal)}</td>
                    </tr>
                    {preview.discountAmount > 0 && (
                      <tr>
                        <td className="py-1">Remise</td>
                        <td className="text-right text-green-600">
                          − {formatEUR(preview.discountAmount)}
                        </td>
                      </tr>
                    )}
                    <tr className="font-medium">
                      <td className="py-1">Total HT</td>
                      <td className="text-right">{formatEUR(preview.totalHT ?? 0)}</td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="py-1">Total TTC</td>
                      <td className="text-right">{formatEUR(preview.totalTTC ?? 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {currentStep === 3 && (
          <section className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-medium mb-2">{STEPS[3].label}</h2>
              <p className="text-sm text-zinc-500">{lines.length} ligne{lines.length > 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-2">
              {lines.map((line) => (
                <div
                  key={line.key}
                  className="flex items-center justify-between rounded border border-zinc-200 px-4 py-3"
                >
                  <div className="text-sm">
                    <div className="font-medium">{line.familyLabel}</div>
                    <div className="text-zinc-500">
                      {line.quantity} × {line.lengthCm}×{line.widthCm} cm
                      {line.hasESD ? " · ESD" : ""}
                      {line.hasB1 ? " · B1" : ""}
                      {line.hasEdging ? " · Chant" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => removeLine(line.key)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentStep === 4 && preview && (
          <section className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-medium mb-2">{STEPS[4].label}</h2>
            </div>
            {preview.status === "A_CONSULTER" ? (
              <div className="rounded bg-amber-50 p-4 text-amber-800">
                <p className="text-sm font-medium">Configuration consultée</p>
                <p className="text-sm">
                  Cette configuration dépasse 40 kg ({preview.totalWeightKg.toFixed(2)} kg).
                  Notre service client vous recontactera.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2">Sous-total</td>
                      <td className="text-right">{formatEUR(preview.subtotal)}</td>
                    </tr>
                    {preview.discountAmount > 0 && (
                      <tr>
                        <td className="py-2">Remise</td>
                        <td className="text-right text-green-600">
                          − {formatEUR(preview.discountAmount)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2">Transport</td>
                      <td className="text-right">{formatEUR(preview.shippingCost ?? 0)}</td>
                    </tr>
                    <tr className="font-medium">
                      <td className="py-2">Total HT</td>
                      <td className="text-right">{formatEUR(preview.totalHT ?? 0)}</td>
                    </tr>
                    <tr>
                      <td className="py-2">TVA (20 %)</td>
                      <td className="text-right">{formatEUR(preview.taxAmount ?? 0)}</td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="py-2">Total TTC</td>
                      <td className="text-right">{formatEUR(preview.totalTTC ?? 0)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-zinc-500">Validité 1 mois · Délai 2 à 3 semaines</p>
              </div>
            )}
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          </section>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        {currentStep > 0 ? (
          <button
            onClick={prevStep}
            className="rounded border-2 border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            ← Retour
          </button>
        ) : (
          <div />
        )}
        {currentStep === STEPS.length - 1 ? (
          <button
            onClick={submitQuote}
            disabled={submitting || preview?.status === "A_CONSULTER"}
            className="rounded bg-brand-yellow px-8 py-3 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark disabled:opacity-50"
          >
            {submitting ? "Génération…" : "Valider le devis"}
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!canAdvanceStep()}
            className="rounded bg-brand-yellow px-8 py-3 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark disabled:opacity-50"
          >
            Suivant →
          </button>
        )}
      </div>
    </main>
  );
}
