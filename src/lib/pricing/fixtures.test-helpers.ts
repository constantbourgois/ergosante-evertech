// Jeu de données minimal du catalogue réel — docs/CATALOGUE.md — utilisé par
// les tests du moteur de calcul. Un sous-ensemble suffisant pour couvrir les
// cas de recette, pas l'intégralité des 48 références du tarif.
import type { PricingFamily, PricingVariant } from "./types";

export const mbFamily: PricingFamily = {
  id: "fam-mb",
  code: "10104",
  minCutCm: 60,
  maxCutWidthCm: null,
  supportsEdging: true,
};

export const standFamily: PricingFamily = {
  id: "fam-stand",
  code: "10101",
  minCutCm: 60,
  maxCutWidthCm: null,
  supportsEdging: true,
};

export const nbrFamily: PricingFamily = {
  id: "fam-nbr",
  code: "20101NBR",
  minCutCm: 60,
  maxCutWidthCm: null,
  supportsEdging: true,
};

export const saniflexSbrFamily: PricingFamily = {
  id: "fam-saniflex-sbr",
  code: "20102SBR",
  minCutCm: 60,
  maxCutWidthCm: null,
  supportsEdging: false,
};

export const saniflexNbrFamily: PricingFamily = {
  id: "fam-saniflex-nbr",
  code: "20102NBR",
  minCutCm: 60,
  maxCutWidthCm: null,
  supportsEdging: false,
};

export const edgingVariant: PricingVariant = {
  id: "var-chan01",
  reference: "CHAN01",
  familyId: "options",
  hasESD: false,
  hasB1: false,
  salesUnit: "LINEAR_METER",
  standardLengthCm: null,
  standardWidthCm: null,
  salePrice: 47.25,
  weight: 0.25,
  isActive: true,
};

export const variants: PricingVariant[] = [
  // Evermat MB (10104) — quatre combinaisons, découpe uniquement dans ce jeu
  // de test (le pré-coupé est couvert via Evermat Stand ci-dessous).
  {
    id: "var-10104",
    reference: "10104",
    familyId: mbFamily.id,
    hasESD: false,
    hasB1: false,
    salesUnit: "SQM",
    standardLengthCm: null,
    standardWidthCm: null,
    salePrice: 202.15,
    weight: 5,
    isActive: true,
  },
  {
    id: "var-10104esd",
    reference: "10104ESD",
    familyId: mbFamily.id,
    hasESD: true,
    hasB1: false,
    salesUnit: "SQM",
    standardLengthCm: null,
    standardWidthCm: null,
    salePrice: 226.2,
    weight: 5,
    isActive: true,
  },

  // Evermat Stand (10101) — découpe et pré-coupé 65×95, base et B1+ESD, pour
  // couvrir la règle « le pré-coupé prime sur la découpe » (docs/CATALOGUE.md §4).
  {
    id: "var-10101",
    reference: "10101",
    familyId: standFamily.id,
    hasESD: false,
    hasB1: false,
    salesUnit: "SQM",
    standardLengthCm: null,
    standardWidthCm: null,
    salePrice: 219.7, // valeur alignée — docs/CATALOGUE.md §5.1
    weight: 5,
    isActive: true,
  },
  {
    id: "var-10101u",
    reference: "10101U",
    familyId: standFamily.id,
    hasESD: false,
    hasB1: false,
    salesUnit: "UNIT",
    standardLengthCm: 65,
    standardWidthCm: 95,
    salePrice: 115.38,
    weight: 5 * 0.6175,
    isActive: true,
  },
  {
    id: "var-10101esdb1",
    reference: "10101ESDB1",
    familyId: standFamily.id,
    hasESD: true,
    hasB1: true,
    salesUnit: "SQM",
    standardLengthCm: null,
    standardWidthCm: null,
    salePrice: 261.63,
    weight: 5,
    isActive: true,
  },
  {
    id: "var-10101b1esdu",
    reference: "10101B1ESDU",
    familyId: standFamily.id,
    hasESD: true,
    hasB1: true,
    salesUnit: "UNIT",
    standardLengthCm: 65,
    standardWidthCm: 95,
    salePrice: 138.13,
    weight: 5 * 0.6175,
    isActive: true,
  },

  // Evermat NBR (20101NBR) — chant seul, pas d'ESD ni de B1.
  {
    id: "var-20101nbr",
    reference: "20101NBR",
    familyId: nbrFamily.id,
    hasESD: false,
    hasB1: false,
    salesUnit: "SQM",
    standardLengthCm: null,
    standardWidthCm: null,
    salePrice: 145.7,
    weight: 9.5,
    isActive: true,
  },
  {
    id: "var-20101nbru",
    reference: "20101NBRU",
    familyId: nbrFamily.id,
    hasESD: false,
    hasB1: false,
    salesUnit: "UNIT",
    standardLengthCm: 65,
    standardWidthCm: 95,
    salePrice: 89.0,
    weight: 5.87,
    isActive: true,
  },

  // Saniflex SBR (20102SBR) — découpe et pré-coupé 91×152, aucune option.
  {
    id: "var-20102sbr",
    reference: "20102SBR",
    familyId: saniflexSbrFamily.id,
    hasESD: false,
    hasB1: false,
    salesUnit: "SQM",
    standardLengthCm: null,
    standardWidthCm: null,
    salePrice: 121.28,
    weight: 8,
    isActive: true,
  },
  {
    id: "var-20102sbru",
    reference: "20102SBRU",
    familyId: saniflexSbrFamily.id,
    hasESD: false,
    hasB1: false,
    salesUnit: "UNIT",
    standardLengthCm: 91,
    standardWidthCm: 152,
    salePrice: 135.14,
    weight: 11.07,
    isActive: true,
  },

  // Saniflex NBR (20102NBR) — découpe uniquement, aucune référence pièce
  // (docs/QUESTIONS-OUVERTES.md §3.3 : « il ne manque rien »).
  {
    id: "var-20102nbr",
    reference: "20102NBR",
    familyId: saniflexNbrFamily.id,
    hasESD: false,
    hasB1: false,
    salesUnit: "SQM",
    standardLengthCm: null,
    standardWidthCm: null,
    salePrice: 121.28,
    weight: 8,
    isActive: true,
  },
];

export const franceShippingBrackets = [
  { maxWeightKg: 1, flatPrice: 20.39 },
  { maxWeightKg: 3, flatPrice: 25.18 },
  { maxWeightKg: 5, flatPrice: 28.17 },
  { maxWeightKg: 10, flatPrice: 31.26 },
  { maxWeightKg: 15, flatPrice: 34.27 },
  { maxWeightKg: 20, flatPrice: 37.98 },
  { maxWeightKg: 25, flatPrice: 41.91 },
  { maxWeightKg: 30, flatPrice: 55.59 },
  { maxWeightKg: 40, flatPrice: 88.74 },
];

export const families: PricingFamily[] = [
  mbFamily,
  standFamily,
  nbrFamily,
  saniflexSbrFamily,
  saniflexNbrFamily,
];
