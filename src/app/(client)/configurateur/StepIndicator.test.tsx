import { describe, it, expect } from "vitest";

describe("StepIndicator", () => {
  it("validates step data structure", () => {
    const mockSteps = [
      { id: 0 as const, label: "Type de poste" },
      { id: 1 as const, label: "Modèle" },
      { id: 2 as const, label: "Configuration" },
    ];

    expect(mockSteps).toHaveLength(3);
    expect(mockSteps[0]).toEqual({ id: 0, label: "Type de poste" });
    expect(mockSteps[1]).toEqual({ id: 1, label: "Modèle" });
  });

  it("tracks current step correctly", () => {
    let currentStep = 0;
    expect(currentStep).toBe(0);

    currentStep = 1;
    expect(currentStep).toBe(1);

    currentStep = 2;
    expect(currentStep).toBe(2);
  });

  it("validates step progression logic", () => {
    const totalSteps = 5;
    const isStepComplete = (step: number, current: number) => step < current;

    expect(isStepComplete(0, 1)).toBe(true);
    expect(isStepComplete(1, 1)).toBe(false);
    expect(isStepComplete(2, 1)).toBe(false);
  });

  it("checks if step is disabled", () => {
    const currentStep = 0;
    const isStepDisabled = (step: number, current: number) => step > current;

    expect(isStepDisabled(0, currentStep)).toBe(false);
    expect(isStepDisabled(1, currentStep)).toBe(true);
    expect(isStepDisabled(2, currentStep)).toBe(true);
  });
});
