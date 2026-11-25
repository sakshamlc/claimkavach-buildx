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
import { BrandShieldIcon } from '@/components/Icons';
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
      const prefersReduced = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? 'auto' : 'smooth',
      });
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
    if (!bill) return;
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
    <div className="min-h-screen bg-page-bg flex flex-col overflow-x-hidden">
      {/* Anchored Deep Navy Header */}
      <header className="no-print bg-primary-navy text-white border-b border-primary-navy sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-soft-teal-tint flex-shrink-0">
              <BrandShieldIcon className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">
                {t('appName')}
              </h1>
              <p className="text-xs text-white/75 hidden sm:block">
                {t('appTagline')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/sources"
              className="min-h-[44px] inline-flex items-center px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {t('sourcesNavLink')}
            </Link>
            <LanguageToggle variant="navy" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 ${
          step === 1 ? 'max-w-6xl' : 'max-w-5xl'
        } mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full`}
      >
        <div className="mb-7 sm:mb-8">
          <Stepper
            currentStep={step}
            labels={[t('stepUpload'), t('stepVerify'), t('stepReport')]}
            onStepSelect={(target) => {
              if (target === 0) handleBackToUpload();
              else if (target === 1 && bill) handleBackToVerify();
            }}
          />
        </div>

        <div key={step} className="step-enter min-w-0">
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
        </div>
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
