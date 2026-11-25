'use client';

import Link from 'next/link';
import { Disclaimer } from '@/components/Disclaimer';
import { LanguageToggle } from '@/components/LanguageToggle';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { DEFAULT_REFERENCE_DATASET } from '@/lib/reference/dataset';

const EXPECTED_CATEGORIES = [
  {
    category: 'Coronary Stents (DES / BMS)',
    expectedSource: 'NPPA Ceiling Price Notification (docs/sources/raw/)',
  },
  {
    category: 'Essential Drugs / Formulations',
    expectedSource: 'NPPA DPCO Ceiling Price List (docs/sources/raw/)',
  },
  {
    category: 'Orthopaedic Knee Implants',
    expectedSource: 'NPPA Knee Implant Price Order (docs/sources/raw/)',
  },
  {
    category: 'IRDAI Non-Payable Consumables',
    expectedSource: 'IRDAI Health Insurance Guidelines Annexure I (docs/sources/raw/)',
  },
] as const;

function SourcesContent() {
  const { t } = useI18n();
  const { sources } = DEFAULT_REFERENCE_DATASET;

  return (
    <div className="min-h-screen bg-page-bg flex flex-col">
      <header className="bg-card-bg border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 min-h-[44px] px-2 text-sm font-semibold text-action-teal hover:text-action-teal-hover"
          >
            ← {t('sourcesBackHome')}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-6">
        <section>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-navy">
            {t('sourcesPageTitle')}
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mt-2 max-w-3xl leading-relaxed">
            {t('sourcesPageSubtitle')}
          </p>
        </section>

        {/* Loaded Sources Section */}
        <section className="rounded-2xl border border-border bg-card-bg p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-primary-navy">
              {t('sourcesLoadedTitle')}
            </h2>
            <span className="px-2.5 py-1 rounded-full bg-subtle-panel border border-border text-xs font-mono font-semibold text-text-secondary">
              {sources.length} {t('items')}
            </span>
          </div>

          {sources.length === 0 ? (
            <div className="rounded-xl border border-border bg-subtle-panel p-4 text-sm text-text-secondary leading-relaxed">
              {t('sourcesEmptyNotice')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-subtle-panel text-xs font-semibold text-text-secondary">
                    <th className="p-3">{t('sourcesColTitle')}</th>
                    <th className="p-3">{t('sourcesColInstrument')}</th>
                    <th className="p-3">{t('sourcesColDate')}</th>
                    <th className="p-3">{t('sourcesColHash')}</th>
                    <th className="p-3">{t('sourcesColVerified')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sources.map((src) => (
                    <tr key={src.id}>
                      <td className="p-3 font-medium text-text-primary">
                        {src.title}
                      </td>
                      <td className="p-3 font-mono text-xs text-text-secondary">
                        {src.instrumentNumber}
                      </td>
                      <td className="p-3 font-mono text-xs text-text-secondary">
                        {src.instrumentDate}
                      </td>
                      <td className="p-3 font-mono text-xs text-text-muted break-all">
                        {src.sha256}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                            src.verified
                              ? 'bg-verdict-valid-bg text-verdict-valid border-verdict-valid/30'
                              : 'bg-verdict-likely-bg text-verdict-likely border-verdict-likely/30'
                          }`}
                        >
                          {src.verified
                            ? t('reportVerifiedBadge')
                            : t('reportUnverifiedBadge')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Reference Data Status Table */}
        <section className="rounded-2xl border border-border bg-card-bg p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-primary-navy">
            {t('sourcesStatusTitle')}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-subtle-panel text-xs font-semibold text-text-secondary">
                  <th className="p-3">{t('sourcesColCategory')}</th>
                  <th className="p-3">{t('sourcesColStatus')}</th>
                  <th className="p-3">{t('sourcesColExpectedSource')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {EXPECTED_CATEGORIES.map((row) => (
                  <tr key={row.category}>
                    <td className="p-3 font-medium text-text-primary">
                      {row.category}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-verdict-not-checked-bg border border-border text-xs font-bold text-verdict-not-checked">
                        <span aria-hidden="true">⚪</span>
                        <span>{t('verdictNotChecked')}</span>
                      </span>
                    </td>
                    <td className="p-3 text-xs text-text-secondary">
                      {row.expectedSource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Verification Workflow */}
        <section className="rounded-2xl border border-border bg-soft-teal-tint p-5 space-y-2">
          <h2 className="text-base font-bold text-primary-navy">
            {t('sourcesWorkflowTitle')}
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {t('sourcesWorkflowBody')}
          </p>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 w-full">
        <Disclaimer />
      </footer>
    </div>
  );
}

export default function SourcesPage() {
  return (
    <I18nProvider defaultLocale="en">
      <SourcesContent />
    </I18nProvider>
  );
}
