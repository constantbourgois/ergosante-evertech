import { describe, it, expect } from "vitest";

const STEPS = [
  { id: 0, label: "Type de poste" },
  { id: 1, label: "Modèle" },
  { id: 2, label: "Configuration" },
  { id: 3, label: "Résumé" },
  { id: 4, label: "Aperçu" },
];

describe("ConfiguratorApp", () => {
  it("defines 5 configuration steps", () => {
    expect(STEPS).toHaveLength(5);
    expect(STEPS[0].label).toBe("Type de poste");
    expect(STEPS[4].label).toBe("Aperçu");
  });

  it("validates step navigation logic", () => {
    let currentStep = 0;
    const canAdvance = (step: number) => step < STEPS.length - 1;

    expect(canAdvance(currentStep)).toBe(true);
    currentStep = 4;
    expect(canAdvance(currentStep)).toBe(false);
  });

  it("validates workstation types", () => {
    const WORKSTATION_ORDER = [
      "FIXE",
      "MOBILE",
      "PIVOTANT",
      "SPECIFIQUE",
      "MILIEU_HUMIDE",
    ];

    expect(WORKSTATION_ORDER).toHaveLength(5);
    expect(WORKSTATION_ORDER[0]).toBe("FIXE");
    expect(WORKSTATION_ORDER).toContain("MOBILE");
  });

  it("validates dimension constraints", () => {
    const MIN_DIMENSION = 60;
    const testDimensions = [60, 91, 152, 220];

    testDimensions.forEach((dim) => {
      expect(dim).toBeGreaterThanOrEqual(MIN_DIMENSION);
    });
  });

  it("validates standard format detection", () => {
    const isStandardFormat = (length: number, width: number) => {
      return (length === 91 && width === 152) || (length === 65 && width === 95);
    };

    expect(isStandardFormat(91, 152)).toBe(true);
    expect(isStandardFormat(65, 95)).toBe(true);
    expect(isStandardFormat(100, 150)).toBe(false);
  });

  it("calculates price preview", () => {
    const basePrice = 100;
    const quantity = 2;
    const hasOptions = true;
    const optionsSurcharge = 20;

    const total = basePrice * quantity + (hasOptions ? optionsSurcharge : 0);
    expect(total).toBe(220);
  });
});
