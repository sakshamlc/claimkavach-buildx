'use client';

/**
 * Disclaimer Component
 * ====================
 * Educational/legal disclaimer shown at the bottom of the page.
 * Uses design tokens and inline SVG icon (zero raw emojis).
 */

import { InfoIcon } from '@/components/Icons';
import { useI18n } from '@/lib/i18n';

export function Disclaimer() {
  const { t } = useI18n();

  return (
    <div className="border-t border-border mt-8 pt-6">
      <p className="text-xs text-text-muted text-center max-w-2xl mx-auto leading-relaxed flex items-start justify-center gap-1.5">
        <InfoIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-text-muted" />
        <span>{t('disclaimer')}</span>
      </p>
    </div>
  );
}
