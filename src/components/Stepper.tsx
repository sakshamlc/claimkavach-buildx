'use client';

/**
 * Stepper Component
 * =================
 * Symmetrical centered 3-step indicator: Upload -> Verify -> Report.
 * Connector lines sit cleanly at the vertical midpoint of the 40px step circles.
 * Completed steps are clickable to jump back smoothly.
 */

interface StepperProps {
  currentStep: number; // 0-based: 0=Upload, 1=Verify, 2=Report
  labels: [string, string, string];
  onStepSelect?: (stepIndex: number) => void;
}

export function Stepper({ currentStep, labels, onStepSelect }: StepperProps) {
  return (
    <nav aria-label="Audit progress" className="w-full max-w-lg mx-auto px-2">
      <ol className="flex items-start justify-between">
        {labels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          const canSelect = isCompleted && typeof onStepSelect === 'function';

          const stepInner = (
            <>
              <span
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full
                  text-sm font-semibold transition-colors duration-200
                  ${
                    isCompleted
                      ? 'bg-action-teal text-white'
                      : isCurrent
                        ? 'bg-action-teal text-white ring-4 ring-soft-teal-tint'
                        : 'bg-card-bg text-text-muted border-2 border-border'
                  }
                `}
              >
                {isCompleted ? <CheckIcon /> : <span>{index + 1}</span>}
              </span>
              <span
                className={`
                  text-xs font-medium text-center leading-tight max-w-[84px]
                  ${
                    isCurrent
                      ? 'text-action-teal font-semibold'
                      : isUpcoming
                        ? 'text-text-muted'
                        : 'text-text-primary'
                  }
                `}
              >
                {label}
              </span>
            </>
          );

          return (
            <li
              key={label}
              className="contents"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {index > 0 && (
                <div
                  className={`flex-1 h-0.5 mt-5 mx-1.5 sm:mx-3 transition-colors duration-200 ${
                    isCompleted || isCurrent ? 'bg-action-teal' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}

              {canSelect ? (
                <button
                  type="button"
                  onClick={() => onStepSelect(index)}
                  aria-label={label}
                  className="flex flex-col items-center gap-1.5 min-w-[60px] sm:min-w-[72px] min-h-[44px] px-1 py-0.5 rounded-xl hover:bg-soft-teal-tint/60 transition-colors cursor-pointer"
                >
                  {stepInner}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-1.5 min-w-[60px] sm:min-w-[72px] min-h-[44px] px-1 py-0.5">
                  {stepInner}
                </div>
              )}
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
