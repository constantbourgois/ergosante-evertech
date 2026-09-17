"use client";

type StepId = 0 | 1 | 2 | 3 | 4;

interface Step {
  id: StepId;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: StepId;
  onStepClick: (stepId: StepId) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-2">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = currentStep >= step.id;

          return (
            <div key={step.id} className="flex flex-1 flex-col">
              <div className="flex items-center">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className="relative z-10 flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 transition-all duration-200 disabled:cursor-not-allowed"
                  style={{
                    borderColor: isActive ? "#d4a700" : isCompleted ? "#22c55e" : "#e5e7eb",
                    backgroundColor: isActive ? "#fcd34d" : isCompleted ? "#22c55e" : "#f3f4f6",
                  }}
                >
                  <span
                    className="text-base font-bold leading-tight"
                    style={{
                      color: isActive || isCompleted ? "white" : "#6b7280",
                    }}
                  >
                    {isCompleted ? "✓" : step.id + 1}
                  </span>
                </button>

                {index < steps.length - 1 && (
                  <div
                    className="h-0.5 flex-1 transition-all duration-200"
                    style={{
                      backgroundColor: isCompleted ? "#22c55e" : "#e5e7eb",
                    }}
                  />
                )}
              </div>

              <div className="mt-4">
                <p
                  className="text-sm font-semibold transition-colors duration-200"
                  style={{
                    color: isActive ? "#d4a700" : isCompleted ? "#22c55e" : "#9ca3af",
                  }}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
