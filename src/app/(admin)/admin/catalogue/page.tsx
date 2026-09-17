"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Variant {
  id: string;
  reference: string;
  salesUnit: string;
  salePrice: string;
  weight: string;
  isActive: boolean;
}

interface Family {
  id: string;
  code: string;
  name: string;
  workstationType: string;
  isRecommended: boolean;
  isActive: boolean;
  variants: Variant[];
}

export default function CataloguePage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/families");
    const body = await res.json();
    setFamilies(body.families ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial de la liste
    refresh();
  }, []);

  async function toggleFamily(id: string, field: "isActive" | "isRecommended", value: boolean) {
    await fetch(`/api/admin/families/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    refresh();
  }

  async function updateVariant(id: string, data: Record<string, unknown>) {
    await fetch(`/api/admin/variants/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    refresh();
  }

  async function onImport(event: FormEvent) {
    event.preventDefault();
    if (!importFile) return;
    const formData = new FormData();
    formData.append("file", importFile);
    const res = await fetch("/api/admin/catalog/import", { method: "POST", body: formData });
    const body = await res.json();
    if (!res.ok) {
      setImportResult(`Erreur : ${body.error ?? "import refusé"}`);
    } else {
      const errorCount = body.errors?.length ?? 0;
      setImportResult(
        `Importé : ${body.imported.created} créées, ${body.imported.updated} mises à jour${
          errorCount ? `, ${errorCount} lignes refusées` : ""
        }.`,
      );
    }
    refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <h1 className="text-2xl font-semibold">Catalogue</h1>

      <form onSubmit={onImport} className="flex items-center gap-3 rounded border border-zinc-200 p-4 text-sm">
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" className="rounded bg-brand-yellow px-4 py-2 font-bold text-brand-black hover:bg-brand-yellow-dark">
          Importer le tarif (xlsx)
        </button>
        {importResult ? <span>{importResult}</span> : null}
      </form>

      {loading ? (
        <p>Chargement…</p>
      ) : (
        families.map((family) => (
          <section key={family.id} className="flex flex-col gap-3 rounded border border-zinc-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">
                {family.name} ({family.code}) — {family.workstationType}
              </h2>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={family.isActive}
                    onChange={(e) => toggleFamily(family.id, "isActive", e.target.checked)}
                  />
                  Actif
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={family.isRecommended}
                    onChange={(e) => toggleFamily(family.id, "isRecommended", e.target.checked)}
                  />
                  Recommandé
                </label>
              </div>
            </div>
            {family.variants.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucune référence tarifée — à importer.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="py-1">Référence</th>
                    <th className="py-1">Unité</th>
                    <th className="py-1">Prix</th>
                    <th className="py-1">Poids</th>
                    <th className="py-1">Actif</th>
                  </tr>
                </thead>
                <tbody>
                  {family.variants.map((variant) => (
                    <tr key={variant.id} className="border-b border-zinc-100">
                      <td className="py-1">{variant.reference}</td>
                      <td className="py-1">{variant.salesUnit}</td>
                      <td className="py-1">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={variant.salePrice}
                          onBlur={(e) => {
                            const value = Number(e.target.value);
                            if (value > 0 && value !== Number(variant.salePrice)) {
                              updateVariant(variant.id, { salePrice: value });
                            }
                          }}
                          className="w-24 rounded border-2 border-brand-black px-2 py-1 focus:border-brand-yellow focus:outline-none"
                        />
                      </td>
                      <td className="py-1">{variant.weight}</td>
                      <td className="py-1">
                        <input
                          type="checkbox"
                          checked={variant.isActive}
                          onChange={(e) => updateVariant(variant.id, { isActive: e.target.checked })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))
      )}
    </main>
  );
}
