'use client';

/**
 * LanguageToggle Component
 * ========================
 * Toggles between English and Hindi.
 * Min 44px tap target for accessibility.
 */

import { useI18n } from '@/lib/i18n';

export function LanguageToggle() {
  const { t, toggleLocale } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      className="
        min-w-[44px] min-h-[44px] px-3 py-2
        text-sm font-medium
        text-action-teal hover:text-action-teal-hover
        bg-soft-teal-tint hover:bg-action-teal/10
        rounded-lg transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-action-teal
      "
      aria-label="Switch language"
    >
      {t('languageToggle')}
    </button>
  );
}
