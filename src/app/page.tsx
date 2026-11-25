'use client';

/**
 * ClaimKavach Landing Page
 * ========================
 * Entry point for the app. Shows:
 * 1. Value proposition
 * 2. Privacy notice + consent
 * 3. Upload CTA
 * 4. Demo bill strip (3 synthetic scenarios)
 * 5. Educational disclaimer
 *
 * Mobile-first (375px safe, zero horizontal scroll).
 * All colors from design tokens.
 */

import { useState } from 'react';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { Stepper } from '@/components/Stepper';
import { PrivacyDisclaimer } from '@/components/PrivacyDisclaimer';
import { Disclaimer } from '@/components/Disclaimer';
import { LanguageToggle } from '@/components/LanguageToggle';

function LandingContent() {
  const { t } = useI18n();
  const [consented, setConsented] = useState(false);

  return (
    <div className="min-h-screen bg-page-bg flex flex-col">
      {/* Header */}
      <header className="bg-card-bg border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl" aria-hidden="true">🛡️</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-primary-navy">
                {t('appName')}
              </h1>
              <p className="text-xs text-text-muted hidden sm:block">
                {t('appTagline')}
              </p>
            </div>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper
            currentStep={0}
            labels={[t('stepUpload'), t('stepVerify'), t('stepReport')]}
          />
        </div>

        {/* Hero Section */}
        <section className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-navy mb-3 leading-tight">
            {t('landingTitle')}
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {t('landingSubtitle')}
          </p>
        </section>

        {/* Privacy + Upload */}
        <section className="max-w-xl mx-auto space-y-5 mb-10">
          <PrivacyDisclaimer
            consented={consented}
            onConsentChange={setConsented}
          />

          {/* Upload CTA */}
          <button
            disabled={!consented}
            className={`
              w-full py-4 px-6 rounded-xl text-base font-semibold
              transition-all duration-200 min-h-[52px]
              ${consented
                ? 'bg-action-teal hover:bg-action-teal-hover text-white shadow-lg shadow-action-teal/20 cursor-pointer'
                : 'bg-subtle-panel text-text-muted cursor-not-allowed border border-border'
              }
            `}
          >
            📄 {t('ctaUpload')}
          </button>
        </section>

        {/* Demo Strip */}
        <section className="bg-card-bg rounded-2xl border border-border p-5 sm:p-6 mb-8">
          <div className="text-center mb-5">
            <h3 className="text-lg font-bold text-primary-navy mb-1">
              {t('demoStripTitle')}
            </h3>
            <p className="text-sm text-text-muted">
              {t('demoStripSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'demoScenarioA' as const, icon: '🔴', scenario: 'a' },
              { key: 'demoScenarioB' as const, icon: '🟠', scenario: 'b' },
              { key: 'demoScenarioC' as const, icon: '🟢', scenario: 'c' },
            ].map(({ key, icon, scenario }) => (
              <button
                key={scenario}
                className="
                  flex items-start gap-3 p-4 rounded-xl
                  bg-subtle-panel hover:bg-soft-teal-tint
                  border border-border hover:border-action-teal/30
                  transition-all duration-150 text-left min-h-[44px]
                  group cursor-pointer
                "
              >
                <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
                <div>
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-action-teal/10 text-action-teal rounded mb-1">
                    {t('syntheticBadge')}
                  </span>
                  <p className="text-sm font-medium text-text-primary group-hover:text-action-teal transition-colors">
                    {t(key)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="text-center mb-8">
          <p className="text-sm text-text-secondary italic">
            {t('appDescription')}
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 w-full">
        <Disclaimer />
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <I18nProvider defaultLocale="en">
      <LandingContent />
    </I18nProvider>
  );
}
