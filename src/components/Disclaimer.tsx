'use client';

/**
 * Disclaimer Component
 * ====================
 * Educational/legal disclaimer shown at the bottom of the page.
 * Uses design tokens (no hardcoded hex).
 */

import { useI18n } from '@/lib/i18n';

export function Disclaimer() {
  const { t } = useI18n();

  return (
    <div className="border-t border-border mt-8 pt-6">
      <p className="text-xs text-text-muted text-center max-w-2xl mx-auto leading-relaxed">
        ⚕️ {t('disclaimer')}
      </p>
    </div>
  );
}
