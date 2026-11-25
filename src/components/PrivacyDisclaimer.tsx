'use client';

/**
 * PrivacyDisclaimer Component
 * ===========================
 * Shows the honest privacy notice and consent checkbox.
 * Uses design tokens (no hardcoded hex).
 */

import { useI18n } from '@/lib/i18n';

interface PrivacyDisclaimerProps {
  consented: boolean;
  onConsentChange: (consented: boolean) => void;
}

export function PrivacyDisclaimer({ consented, onConsentChange }: PrivacyDisclaimerProps) {
  const { t } = useI18n();

  return (
    <div className="bg-soft-teal-tint border border-action-teal/20 rounded-xl p-4 sm:p-5">
      {/* Privacy notice */}
      <div className="flex gap-3 items-start">
        <div className="flex-shrink-0 mt-0.5">
          <ShieldIcon />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {t('privacyNotice')}
        </p>
      </div>

      {/* Consent checkbox */}
      <label className="flex items-center gap-3 mt-4 cursor-pointer min-h-[44px]">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="
            w-5 h-5 rounded border-2 border-action-teal text-action-teal
            focus:ring-2 focus:ring-action-teal focus:ring-offset-2
            cursor-pointer accent-action-teal
          "
        />
        <span className="text-sm font-medium text-text-primary">
          {t('privacyConsent')}
        </span>
      </label>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="w-5 h-5 text-action-teal"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}
