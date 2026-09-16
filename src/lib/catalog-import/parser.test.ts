import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseTariffWorkbook } from "./parser";

const HEADERS = [
  "Référence",
  "Famille",
  "ESD",
  "B1",
  "Unité",
  "Longueur standard (cm)",
  "Largeur standard (cm)",
  "Prix Vente",
  "Poids (kg)",
  "V.A",
];

function buildWorkbook(rows: (string | number | null)[][]): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Tarif");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

describe("parseTariffWorkbook", () => {
  it("parses a valid cut-to-size row and never surfaces the V.A column", () => {
    const buffer = buildWorkbook([
      ["10104", "10104", "non", "non", "M²", null, null, 202.15, 5, 130.6],
    ]);
    const { rows, errors } = parseTariffWorkbook(buffer);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      reference: "10104",
      salesUnit: "SQM",
      salePrice: 202.15,
      weight: 5,
    });
    expect(rows[0]).not.toHaveProperty("v_a");
    expect(rows[0]).not.toHaveProperty("costValue");
  });

  it("refuses a row with a missing weight rather than defaulting to zero", () => {
    const buffer = buildWorkbook([
      ["10104ESD", "10104", "oui", "non", "M²", null, null, 226.2, null, 145.7],
    ]);
    const { rows, errors } = parseTariffWorkbook(buffer);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/poids/i);
  });

  it("applies the documented tariff correction for reference 10101", () => {
    const buffer = buildWorkbook([
      ["10101", "10101", "non", "non", "M²", null, null, 212.94, 5, 135.2],
    ]);
    const { rows, errors } = parseTariffWorkbook(buffer);
    expect(errors).toHaveLength(0);
    expect(rows[0].salePrice).toBe(219.7);
    expect(rows[0].wasCorrected).toBe(true);
  });

  it("requires a standard format for piece-priced references", () => {
    const buffer = buildWorkbook([
      ["10101U", "10101", "non", "non", "Unit.", null, null, 115.38, 3.0875, 74.53],
    ]);
    const { rows, errors } = parseTariffWorkbook(buffer);
    expect(rows).toHaveLength(0);
    expect(errors[0].message).toMatch(/format standard/i);
  });

  it("parses a piece-priced row with its standard format", () => {
    const buffer = buildWorkbook([
      ["10101U", "10101", "non", "non", "Unit.", 65, 95, 115.38, 3.0875, 74.53],
    ]);
    const { rows, errors } = parseTariffWorkbook(buffer);
    expect(errors).toHaveLength(0);
    expect(rows[0]).toMatchObject({
      salesUnit: "UNIT",
      standardLengthCm: 65,
      standardWidthCm: 95,
    });
  });
});
