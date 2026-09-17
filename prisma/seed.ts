// Seed du catalogue à partir des données vérifiées dans docs/CATALOGUE.md et
// docs/QUESTIONS-OUVERTES.md. Les prix marqués "dérivé" sont calculés à
// partir des suppléments d'option confirmés uniformes (+24,05 €/m² ESD,
// +17,88 €/m² B1, +41,93 €/m² la combinaison — docs/CATALOGUE.md §5.1), pas
// directement lus au tarif : ce ne sont pas des prix inventés, mais ils
// restent à vérifier contre le tarif source complet.
//
// Trois familles (Evermat Walk, Evermat NBR, Evermat SBR) sont créées sans
// référence tarifée : aucun prix de base n'est donné nulle part dans les
// documents de cadrage pour ces modèles. Elles doivent être complétées par
// l'import du tarif réel (lib/catalog-import) avant mise en production.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const PIECE_AREA_65X95 = (65 / 100) * (95 / 100); // 0,6175 m²
const PIECE_AREA_91X152 = (91 / 100) * (152 / 100); // 1,3832 m²

const ESD_SUPPLEMENT = 24.05;
const B1_SUPPLEMENT = 17.88;
const B1_ESD_SUPPLEMENT = 41.93; // = ESD_SUPPLEMENT + B1_SUPPLEMENT, confirmé "partout"

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

interface VariantSeed {
  reference: string;
  hasESD: boolean;
  hasB1: boolean;
  salesUnit: "SQM" | "UNIT" | "LINEAR_METER";
  standardLengthCm?: number;
  standardWidthCm?: number;
  salePrice: number;
  weight: number;
}

/** Les 4 combinaisons découpe + les 4 combinaisons pré-coupé d'un modèle mousse,
 * à partir de son prix de base au m² et à la pièce (docs/CATALOGUE.md §1.3). */
function foamMatrix(params: {
  codePrefix: string;
  baseSqmPrice: number;
  basePiecePrice: number;
  pieceEsdB1Price?: number; // prix documenté du B1+ESD à la pièce, sinon dérivé
  weightPerSqm: number;
}): VariantSeed[] {
  const { codePrefix, baseSqmPrice, basePiecePrice, weightPerSqm } = params;
  const pieceEsdB1Price =
    params.pieceEsdB1Price ??
    round2(basePiecePrice + B1_ESD_SUPPLEMENT * PIECE_AREA_65X95);
  const pieceWeight = round3(weightPerSqm * PIECE_AREA_65X95);

  return [
    { reference: codePrefix, hasESD: false, hasB1: false, salesUnit: "SQM", salePrice: baseSqmPrice, weight: weightPerSqm },
    { reference: `${codePrefix}B1`, hasESD: false, hasB1: true, salesUnit: "SQM", salePrice: round2(baseSqmPrice + B1_SUPPLEMENT), weight: weightPerSqm },
    { reference: `${codePrefix}ESD`, hasESD: true, hasB1: false, salesUnit: "SQM", salePrice: round2(baseSqmPrice + ESD_SUPPLEMENT), weight: weightPerSqm },
    { reference: `${codePrefix}ESDB1`, hasESD: true, hasB1: true, salesUnit: "SQM", salePrice: round2(baseSqmPrice + B1_ESD_SUPPLEMENT), weight: weightPerSqm },
    { reference: `${codePrefix}U`, hasESD: false, hasB1: false, salesUnit: "UNIT", standardLengthCm: 65, standardWidthCm: 95, salePrice: basePiecePrice, weight: pieceWeight },
    { reference: `${codePrefix}B1U`, hasESD: false, hasB1: true, salesUnit: "UNIT", standardLengthCm: 65, standardWidthCm: 95, salePrice: round2(basePiecePrice + B1_SUPPLEMENT * PIECE_AREA_65X95), weight: pieceWeight },
    { reference: `${codePrefix}ESDU`, hasESD: true, hasB1: false, salesUnit: "UNIT", standardLengthCm: 65, standardWidthCm: 95, salePrice: round2(basePiecePrice + ESD_SUPPLEMENT * PIECE_AREA_65X95), weight: pieceWeight },
    { reference: `${codePrefix}B1ESDU`, hasESD: true, hasB1: true, salesUnit: "UNIT", standardLengthCm: 65, standardWidthCm: 95, salePrice: pieceEsdB1Price, weight: pieceWeight },
  ];
}

async function upsertFamily(data: {
  code: string;
  name: string;
  description: string;
  workstationType:
    | "FIXE"
    | "MOBILE"
    | "PIVOTANT"
    | "SPECIFIQUE"
    | "MILIEU_HUMIDE";
  isRecommended: boolean;
  thicknessMm: number;
  colorLabel: string;
  supportsESD: boolean;
  supportsB1: boolean;
  supportsEdging: boolean;
  variants: VariantSeed[];
}) {
  const family = await db.productFamily.upsert({
    where: { code: data.code },
    create: {
      code: data.code,
      name: data.name,
      description: data.description,
      workstationType: data.workstationType,
      isRecommended: data.isRecommended,
      thicknessMm: data.thicknessMm,
      colorLabel: data.colorLabel,
      supportsESD: data.supportsESD,
      supportsB1: data.supportsB1,
      supportsEdging: data.supportsEdging,
      minCutCm: 60,
    },
    update: {
      name: data.name,
      description: data.description,
      workstationType: data.workstationType,
      isRecommended: data.isRecommended,
      thicknessMm: data.thicknessMm,
      colorLabel: data.colorLabel,
      supportsESD: data.supportsESD,
      supportsB1: data.supportsB1,
      supportsEdging: data.supportsEdging,
    },
  });

  for (const v of data.variants) {
    await db.productVariant.upsert({
      where: { reference: v.reference },
      create: {
        reference: v.reference,
        familyId: family.id,
        hasESD: v.hasESD,
        hasB1: v.hasB1,
        salesUnit: v.salesUnit,
        standardLengthCm: v.standardLengthCm,
        standardWidthCm: v.standardWidthCm,
        salePrice: v.salePrice,
        weight: v.weight,
      },
      update: {
        salePrice: v.salePrice,
        weight: v.weight,
        isActive: true,
      },
    });
  }

  return family;
}

async function main() {
  console.log("Seed du catalogue EVERMAT…");

  await upsertFamily({
    code: "10104",
    name: "Evermat MB",
    description:
      "Postes d'assemblage, d'emballage, de préparation de commande, aux machines outils.",
    workstationType: "FIXE",
    isRecommended: true, // préconisation acquise — docs/QUESTIONS-OUVERTES.md §6
    thicknessMm: 14,
    colorLabel: "Gris RAL 7016",
    supportsESD: true,
    supportsB1: true,
    supportsEdging: true,
    variants: foamMatrix({
      codePrefix: "10104",
      baseSqmPrice: 202.15,
      basePiecePrice: 105.63,
      weightPerSqm: 5,
    }),
  });

  await upsertFamily({
    code: "10101",
    name: "Evermat Stand",
    description: "Tous types de postes de travail statiques.",
    workstationType: "FIXE",
    isRecommended: false,
    thicknessMm: 14,
    colorLabel: "Gris RAL 7016",
    supportsESD: true,
    supportsB1: true,
    supportsEdging: true,
    variants: foamMatrix({
      codePrefix: "10101",
      baseSqmPrice: 219.7, // valeur alignée, tarif source 212,94 € — docs/CATALOGUE.md §5.1
      basePiecePrice: 115.38,
      weightPerSqm: 5,
    }),
  });

  await upsertFamily({
    code: "10102",
    name: "Evermat Turn",
    description: "Mouvements rotatifs fréquents.",
    workstationType: "PIVOTANT",
    isRecommended: true, // seul modèle du poste pivotant
    thicknessMm: 14,
    colorLabel: "Gris RAL 7016",
    supportsESD: true,
    supportsB1: true,
    supportsEdging: true,
    variants: foamMatrix({
      codePrefix: "10102",
      baseSqmPrice: 219.7, // même palier que Stand — docs/CATALOGUE.md §5.1
      basePiecePrice: 115.38,
      pieceEsdB1Price: 138.13, // valeur alignée, tarif source 133,88 €
      weightPerSqm: 5,
    }),
  });

  await upsertFamily({
    code: "10105",
    name: "Evermat ML",
    description: "Confort optimal, entretien facile.",
    workstationType: "MOBILE",
    // ⚠️ Référence recommandée pour le poste Mobile non tranchée — choix
    // provisoire, à confirmer avant le lot L4 (docs/QUESTIONS-OUVERTES.md §6).
    isRecommended: true,
    thicknessMm: 14,
    colorLabel: "Gris RAL 7016",
    supportsESD: true,
    supportsB1: true,
    supportsEdging: true,
    variants: foamMatrix({
      codePrefix: "10105",
      baseSqmPrice: 202.15, // même palier que MB — docs/CATALOGUE.md §5.1
      basePiecePrice: 105.63, // valeur alignée, tarif source 102,38 €
      weightPerSqm: 5,
    }),
  });

  // Evermat Walk (10103, Mobile, 13 mm) : le tarif source ne fournit son prix
  // de base dans aucun document de cadrage. Famille créée pour le
  // configurateur ; ses références doivent être chargées par l'import du
  // tarif réel avant de pouvoir être proposées au client.
  await db.productFamily.upsert({
    where: { code: "10103" },
    create: {
      code: "10103",
      name: "Evermat Walk",
      description:
        "Postes mobiles nécessitant des déplacements fréquents, résistance à l'abrasion.",
      workstationType: "MOBILE",
      isRecommended: false,
      thicknessMm: 13,
      colorLabel: "Gris RAL 7016",
      supportsESD: true,
      supportsB1: true,
      supportsEdging: true,
      minCutCm: 60,
      isActive: false, // pas de référence tarifée : à activer après import
    },
    update: {},
  });

  // Evermat NBR / SBR (20101NBR, 20101SBR, Spécifique) : chant seul, aucun
  // prix de base documenté — mêmes réserves que Walk.
  for (const [code, name, description] of [
    ["20101NBR", "Evermat NBR", "Résistant aux huiles et aux copeaux de métal, métallurgie."],
    ["20101SBR", "Evermat SBR", "Copeaux de métal et perles de soudure, métallurgie."],
  ] as const) {
    await db.productFamily.upsert({
      where: { code },
      create: {
        code,
        name,
        description,
        workstationType: "SPECIFIQUE",
        isRecommended: code === "20101NBR", // ⚠️ provisoire, à confirmer
        thicknessMm: 14,
        colorLabel: "Noir RAL 9005",
        supportsESD: false,
        supportsB1: false,
        supportsEdging: true,
        minCutCm: 60,
        isActive: false,
      },
      update: {},
    });
  }

  await upsertFamily({
    code: "20102SBR",
    name: "Saniflex SBR",
    description:
      "Milieu humide de type agroalimentaire, transformation des métaux et soudage.",
    workstationType: "MILIEU_HUMIDE",
    isRecommended: true, // ⚠️ provisoire, à confirmer — docs/QUESTIONS-OUVERTES.md §6
    thicknessMm: 13,
    colorLabel: "Noir RAL 9005",
    supportsESD: false,
    supportsB1: false,
    supportsEdging: false,
    variants: [
      { reference: "20102SBR", hasESD: false, hasB1: false, salesUnit: "SQM", salePrice: 121.28, weight: 8 },
      { reference: "20102SBRU", hasESD: false, hasB1: false, salesUnit: "UNIT", standardLengthCm: 91, standardWidthCm: 152, salePrice: 135.14, weight: round3(8 * PIECE_AREA_91X152) },
    ],
  });

  await upsertFamily({
    code: "20102NBR",
    name: "Saniflex NBR",
    description: "Polyvalent, nitrile, milieux humides et huiles.",
    workstationType: "MILIEU_HUMIDE",
    isRecommended: false,
    thicknessMm: 13,
    colorLabel: "Rouge",
    supportsESD: false,
    supportsB1: false,
    supportsEdging: false,
    variants: [
      // Ne se vend qu'à la découpe — aucune référence pièce au tarif, ce
      // n'est pas un oubli — docs/QUESTIONS-OUVERTES.md §3.3.
      { reference: "20102NBR", hasESD: false, hasB1: false, salesUnit: "SQM", salePrice: 121.28, weight: 8 },
    ],
  });

  // Chant jaune 5 cm — option au mètre linéaire, tous modèles sauf Saniflex.
  // Poids au ml jamais fourni ni confirmé : valeur estimée à 0,25 kg/ml
  // (0,05 m² × 5 kg/m²) — docs/CATALOGUE.md §5.3, à valider avant le lot L5.
  const optionsFamily = await db.productFamily.upsert({
    where: { code: "OPTIONS" },
    create: {
      code: "OPTIONS",
      name: "Options",
      description: "Références d'options transverses (chant).",
      workstationType: "FIXE",
      isRecommended: false,
      thicknessMm: 0,
      colorLabel: "Jaune",
      supportsESD: false,
      supportsB1: false,
      supportsEdging: false,
      minCutCm: 0,
      isActive: false,
    },
    update: {},
  });
  await db.productVariant.upsert({
    where: { reference: "CHAN01" },
    create: {
      reference: "CHAN01",
      familyId: optionsFamily.id,
      hasESD: false,
      hasB1: false,
      salesUnit: "LINEAR_METER",
      salePrice: 47.25,
      weight: 0.25, // ⚠️ à confirmer
    },
    update: { salePrice: 47.25 },
  });

  // Barème de transport France — docs/CATALOGUE.md §3.
  const franceZone = await db.shippingZone.upsert({
    where: { name: "France" },
    create: { name: "France" },
    update: {},
  });
  const brackets: Array<[number, number]> = [
    [1, 20.39],
    [3, 25.18],
    [5, 28.17],
    [10, 31.26],
    [15, 34.27],
    [20, 37.98],
    [25, 41.91],
    [30, 55.59],
    [40, 88.74],
  ];
  for (const [maxWeightKg, flatPrice] of brackets) {
    await db.shippingBracket.upsert({
      where: { zoneId_maxWeightKg: { zoneId: franceZone.id, maxWeightKg } },
      create: { zoneId: franceZone.id, maxWeightKg, flatPrice },
      update: { flatPrice },
    });
  }

  // Charte graphique par défaut — modifiable en administration.
  const brandingCount = await db.brandingSettings.count();
  if (brandingCount === 0) {
    await db.brandingSettings.create({
      data: {
        primaryColor: "#0a0a0a",
        secondaryColor: "#ffc400",
        fontFamily: "Helvetica",
        companyAddress: "Evertech SAS — adresse à renseigner",
        legalMentions:
          "TVA intracommunautaire à renseigner — RCS à renseigner.",
        quoteValidityDays: 30,
        defaultVatRate: 20,
        leadTimeLabel: "2 à 3 semaines",
      },
    });
  }

  console.log("Seed terminé.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
