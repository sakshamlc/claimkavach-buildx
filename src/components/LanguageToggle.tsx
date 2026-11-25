'use client';

/**
 * LanguageToggle Component
 * ========================
 * Toggles between English and Hindi with >= 44px tap target.
 */

import { useI18n } from '@/lib/i18n';

export function LanguageToggle({
  variant = 'navy',
}: {
  variant?: 'navy' | 'light';
}) {
  const { t, toggleLocale } = useI18n();

  const variantClasses =
    variant === 'navy'
      ? 'text-white bg-white/10 hover:bg-white/20 border border-white/25 focus-visible:ring-white'
      : 'text-action-teal hover:text-action-teal-hover bg-soft-teal-tint hover:bg-action-teal/10 border border-action-teal/25 focus-visible:ring-action-teal';

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`
        min-w-[44px] min-h-[44px] px-3 sm:px-3.5 py-2 whitespace-nowrap
        text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150
        focus:outline-none focus-visible:ring-2 cursor-pointer
        ${variantClasses}
      `}
      aria-label="Switch language"
    >
      {t('languageToggle')}
    </button>
  );
}
