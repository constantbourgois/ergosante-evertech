import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api/errors";
import { parseTariffWorkbook, applyTariffImport } from "@/lib/catalog-import";
import { db } from "@/lib/db";

/** Import du tarif (xlsx) — docs/PLAN.md §7. Refuse toute référence sans
 * poids, ignore systématiquement la colonne V.A, journalise les changements
 * de prix. */
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const { rows, errors } = parseTariffWorkbook(buffer);

    if (rows.length === 0) {
      return NextResponse.json({ imported: null, errors }, { status: 400 });
    }

    const result = await applyTariffImport(db, rows, session.user.id);
    return NextResponse.json({ imported: result, errors });
  } catch (error) {
    return toErrorResponse(error);
  }
}
