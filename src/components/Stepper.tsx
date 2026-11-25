'use client';

/**
 * Stepper Component
 * =================
 * 3-step progress indicator: Upload → Verify → Report
 * Uses design tokens (no hardcoded hex).
 * Accessible: uses aria-current, proper semantic structure.
 */

interface StepperProps {
  currentStep: number; // 0-based: 0=Upload, 1=Verify, 2=Report
  labels: [string, string, string];
}

export function Stepper({ currentStep, labels }: StepperProps) {
  return (
    <nav aria-label="Audit progress" className="w-full max-w-2xl mx-auto">
      <ol className="flex items-center justify-between">
        {labels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <li
              key={label}
              className="flex flex-1 items-center"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Connector line (before each step except first) */}
              {index > 0 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors duration-200 ${
                    isCompleted ? 'bg-action-teal' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    text-sm font-semibold transition-colors duration-200
                    ${isCompleted
                      ? 'bg-action-teal text-white'
                      : isCurrent
                        ? 'bg-action-teal text-white ring-4 ring-soft-teal-tint'
                        : 'bg-subtle-panel text-text-muted border-2 border-border'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`
                    text-xs font-medium text-center truncate max-w-[80px]
                    ${isCurrent
                      ? 'text-action-teal'
                      : isUpcoming
                        ? 'text-text-muted'
                        : 'text-text-secondary'
                    }
                  `}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
