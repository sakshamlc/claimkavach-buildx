'use client';

/**
 * ClaimKavach Main Application Shell
 * ==================================
 * Wires the complete 3-step client-side journey:
 *   1. Upload / Demo Selection -> 2. Verify (Reconcile Bar) -> 3. Report
 *
 * Zero client-side storage (`localStorage` / `sessionStorage`) or server persistence:
 * all bill and audit state resides solely in React state for the active session.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Disclaimer } from '@/components/Disclaimer';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ReportStep } from '@/components/ReportStep';
import { Stepper } from '@/components/Stepper';
import { UploadStep } from '@/components/UploadStep';
import { VerifyStep } from '@/components/VerifyStep';
import { runAudit } from '@/lib/audit';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { DEFAULT_REFERENCE_DATASET } from '@/lib/reference/dataset';
import type { AuditReport, NormalizedBill } from '@/lib/schemas/audit';

type FlowStep = 0 | 1 | 2;

function ClaimKavachApp() {
  const { t } = useI18n();
  const [step, setStep] = useState<FlowStep>(0);
  const [consented, setConsented] = useState(false);
  const [bill, setBill] = useState<NormalizedBill | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);

  function scrollToTop() {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleBillReady(loadedBill: NormalizedBill) {
    setBill(loadedBill);
    setReport(null);
    setStep(1);
    scrollToTop();
  }

  function handleRunAudit(verifiedBill: NormalizedBill) {
    const todayISO = new Date().toISOString().slice(0, 10);
    const nextReport = runAudit(verifiedBill, DEFAULT_REFERENCE_DATASET, todayISO);
    setBill(verifiedBill);
    setReport(nextReport);
    setStep(2);
    scrollToTop();
  }

  function handleBackToVerify() {
    setStep(1);
    scrollToTop();
  }

  function handleBackToUpload() {
    setStep(0);
    scrollToTop();
  }

  function handleStartOver() {
    setBill(null);
    setReport(null);
    setStep(0);
    scrollToTop();
  }

  return (
    <div className="min-h-screen bg-page-bg flex flex-col">
      {/* Header */}
      <header className="no-print bg-card-bg border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl" aria-hidden="true">
              🛡️
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-primary-navy">
                {t('appName')}
              </h1>
              <p className="text-xs text-text-muted hidden sm:block">
                {t('appTagline')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/sources"
              className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-text-secondary hover:text-action-teal hover:bg-subtle-panel transition-colors"
            >
              {t('sourcesNavLink')}
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        <div className="mb-8">
          <Stepper
            currentStep={step}
            labels={[t('stepUpload'), t('stepVerify'), t('stepReport')]}
          />
        </div>

        {step === 0 && (
          <UploadStep
            consented={consented}
            onConsentChange={setConsented}
            onBillReady={handleBillReady}
          />
        )}

        {step === 1 && bill && (
          <VerifyStep
            bill={bill}
            onBillChange={setBill}
            onRunAudit={handleRunAudit}
            onBack={handleBackToUpload}
          />
        )}

        {step === 2 && bill && report && (
          <ReportStep
            bill={bill}
            report={report}
            onBackToVerify={handleBackToVerify}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 w-full">
        <Disclaimer />
        <div className="no-print mt-3 text-center">
          <Link
            href="/sources"
            className="inline-flex items-center min-h-[44px] px-3 text-xs font-medium text-action-teal hover:underline"
          >
            {t('sourcesNavLink')}
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <I18nProvider defaultLocale="en">
      <ClaimKavachApp />
    </I18nProvider>
  );
}
