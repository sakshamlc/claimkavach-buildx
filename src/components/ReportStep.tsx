'use client';

import { useState } from 'react';
import { formatINR } from '@/lib/currency';
import { verdictTiers } from '@/lib/design-tokens';
import { useI18n, type I18nKeys } from '@/lib/i18n';
import type {
  AuditFinding,
  AuditReport,
  AuditVerdictTier,
  NormalizedBill,
} from '@/lib/schemas/audit';

interface ReportStepProps {
  bill: NormalizedBill;
  report: AuditReport;
  onBackToVerify: () => void;
  onStartOver: () => void;
}

const TIER_ORDER: readonly AuditVerdictTier[] = [
  'CONFIRMED',
  'LIKELY',
  'NEEDS_REVIEW',
  'VALID_EXCLUSION',
  'NOT_CHECKED',
];

const TIER_LABEL_KEYS: Record<AuditVerdictTier, I18nKeys> = {
  CONFIRMED: 'verdictConfirmed',
  LIKELY: 'verdictLikely',
  NEEDS_REVIEW: 'verdictNeedsReview',
  VALID_EXCLUSION: 'verdictValidExclusion',
  NOT_CHECKED: 'verdictNotChecked',
};

const TIER_STYLES: Record<
  AuditVerdictTier,
  { container: string; badge: string; text: string }
> = {
  CONFIRMED: {
    container: 'border-verdict-confirmed/30 bg-card-bg',
    badge: 'bg-verdict-confirmed-bg text-verdict-confirmed border-verdict-confirmed/30',
    text: 'text-verdict-confirmed',
  },
  LIKELY: {
    container: 'border-verdict-likely/30 bg-card-bg',
    badge: 'bg-verdict-likely-bg text-verdict-likely border-verdict-likely/30',
    text: 'text-verdict-likely',
  },
  NEEDS_REVIEW: {
    container: 'border-verdict-needs-review/30 bg-card-bg',
    badge: 'bg-verdict-needs-review-bg text-verdict-needs-review border-verdict-needs-review/30',
    text: 'text-verdict-needs-review',
  },
  VALID_EXCLUSION: {
    container: 'border-verdict-valid/30 bg-card-bg',
    badge: 'bg-verdict-valid-bg text-verdict-valid border-verdict-valid/30',
    text: 'text-verdict-valid',
  },
  NOT_CHECKED: {
    container: 'border-border bg-card-bg',
    badge: 'bg-verdict-not-checked-bg text-verdict-not-checked border-border',
    text: 'text-verdict-not-checked',
  },
};

function FindingCard({ finding }: { finding: AuditFinding }) {
  const { t } = useI18n();
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const tierMeta = verdictTiers[finding.tier];
  const style = TIER_STYLES[finding.tier];

  return (
    <article className="rounded-xl border border-border bg-subtle-panel p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${style.badge}`}
        >
          <span aria-hidden="true">{tierMeta.icon}</span>
          <span>{t(TIER_LABEL_KEYS[finding.tier])}</span>
        </span>

        {finding.unverifiedData && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-verdict-likely-bg text-verdict-likely border border-verdict-likely/30 text-xs font-semibold">
            {t('reportUnverifiedBadge')}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-text-primary leading-relaxed">
        {finding.summary}
      </p>

      {/* Monetary breakdown when available */}
      {(finding.billedPaise !== null ||
        finding.referencePaise !== null ||
        finding.deltaPaise !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-card-bg rounded-lg border border-border p-3">
          {finding.billedPaise !== null && (
            <div>
              <span className="block text-text-muted">
                {t('reportBilledAmount')}
              </span>
              <span className="font-mono font-semibold text-text-primary">
                {formatINR(finding.billedPaise)}
              </span>
            </div>
          )}
          {finding.referencePaise !== null && (
            <div>
              <span className="block text-text-muted">
                {t('reportReferenceAmount')}
              </span>
              <span className="font-mono font-semibold text-text-primary">
                {formatINR(finding.referencePaise)}
              </span>
            </div>
          )}
          {finding.deltaPaise !== null && (
            <div>
              <span className="block text-text-muted">
                {t('reportDeltaAmount')}
              </span>
              <span className={`font-mono font-bold ${style.text}`}>
                {formatINR(finding.deltaPaise)}
              </span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-text-secondary">
        <span className="font-semibold text-text-primary">
          {t('reportRecommendedAction')}:{' '}
        </span>
        {finding.recommendedAction}
      </p>

      <div>
        <button
          type="button"
          aria-expanded={evidenceOpen}
          onClick={() => setEvidenceOpen((prev) => !prev)}
          className="min-h-[44px] px-3 py-1.5 rounded-lg border border-border bg-card-bg hover:bg-soft-teal-tint text-xs font-semibold text-action-teal cursor-pointer"
        >
          {evidenceOpen ? t('reportHideEvidence') : t('reportViewEvidence')}
        </button>

        {evidenceOpen && (
          <div className="mt-2 rounded-lg border border-border bg-card-bg p-3 text-xs text-text-secondary space-y-1.5">
            {finding.evidence.formula && (
              <p>
                <span className="font-semibold text-text-primary">
                  {t('reportFormulaLabel')}:{' '}
                </span>
                <span className="font-mono">{finding.evidence.formula}</span>
              </p>
            )}
            {finding.evidence.sourceTitle && (
              <p>
                <span className="font-semibold text-text-primary">
                  {t('reportSourceTitleLabel')}:{' '}
                </span>
                {finding.evidence.sourceTitle}
              </p>
            )}
            {finding.evidence.instrumentNumber && (
              <p>
                <span className="font-semibold text-text-primary">
                  {t('reportSourceOrder')}:{' '}
                </span>
                {finding.evidence.instrumentNumber}
              </p>
            )}
            {finding.evidence.instrumentDate && (
              <p>
                <span className="font-semibold text-text-primary">
                  {t('reportInstrumentDateLabel')}:{' '}
                </span>
                <span className="font-mono">{finding.evidence.instrumentDate}</span>
              </p>
            )}
            {finding.evidence.provenancePageRow && (
              <p>
                <span className="font-semibold text-text-primary">
                  {t('reportProvenanceLabel')}:{' '}
                </span>
                {finding.evidence.provenancePageRow}
              </p>
            )}
            <p className="text-text-secondary">{finding.evidence.details}</p>
          </div>
        )}
      </div>
    </article>
  );
}

export function ReportStep({
  bill,
  report,
  onBackToVerify,
  onStartOver,
}: ReportStepProps) {
  const { t } = useI18n();
  const [notCheckedExpanded, setNotCheckedExpanded] = useState(false);

  return (
    <div className="space-y-6">
      {bill.isSynthetic && (
        <div
          role="note"
          className="rounded-xl border border-action-teal/30 bg-soft-teal-tint px-4 py-3 text-sm font-semibold text-action-teal flex items-center gap-2"
        >
          <span className="px-2 py-0.5 rounded bg-action-teal text-white text-xs font-bold">
            {t('syntheticBadge')}
          </span>
          <span>{t('syntheticDemoBanner')}</span>
        </div>
      )}

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary-navy">
          {t('reportTitle')}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {bill.hospitalName} • {bill.patientName} • {bill.billDate}
        </p>
      </div>

      {/* Coverage Summary Card (Never merges tiers into single savings figure) */}
      <section className="rounded-2xl border border-border bg-card-bg p-5 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-primary-navy">
          {t('reportCoverageTitle')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-subtle-panel border border-border p-3.5">
            <p className="text-xs text-text-muted">
              {t('reportArithmeticChecked')}
            </p>
            <p className="text-xl font-bold text-primary-navy font-mono mt-1">
              {report.coverage.arithmeticCheckedCount} {t('of')}{' '}
              {report.coverage.totalLines}
            </p>
          </div>

          <div className="rounded-xl bg-subtle-panel border border-border p-3.5">
            <p className="text-xs text-text-muted">
              {t('reportReferenceChecked')}
            </p>
            <p className="text-xl font-bold text-primary-navy font-mono mt-1">
              {report.coverage.referenceCheckedCount} {t('of')}{' '}
              {report.coverage.totalLines}
            </p>
          </div>

          <div className="rounded-xl bg-verdict-not-checked-bg border border-border p-3.5">
            <p className="text-xs text-text-muted">{t('reportNotChecked')}</p>
            <p className="text-xl font-bold text-verdict-not-checked font-mono mt-1">
              {report.coverage.notCheckedCount} {t('items')}
            </p>
          </div>
        </div>

        {report.coverage.notCheckedReasons.length > 0 && (
          <div>
            <button
              type="button"
              aria-expanded={notCheckedExpanded}
              onClick={() => setNotCheckedExpanded((prev) => !prev)}
              className="min-h-[44px] px-3 py-1.5 rounded-lg border border-border bg-subtle-panel hover:bg-soft-teal-tint text-xs font-semibold text-action-teal cursor-pointer"
            >
              {t('reportNotCheckedExpand')} ({report.coverage.notCheckedReasons.length})
            </button>

            {notCheckedExpanded && (
              <ul className="mt-2 space-y-1.5 text-xs text-text-secondary bg-subtle-panel rounded-xl border border-border p-3">
                {report.coverage.notCheckedReasons.map((item) => (
                  <li key={`${item.lineId}-${item.reason}`}>
                    <span className="font-mono font-semibold text-text-primary">
                      {item.lineId}:
                    </span>{' '}
                    {item.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="text-xs text-text-muted leading-relaxed">
          {t('reportTransparencyNote')}
        </p>
      </section>

      {/* 5 Separate Verdict Tier Cards */}
      <section className="space-y-4">
        {TIER_ORDER.map((tierKey) => {
          const bucket = report.tiers[tierKey];
          const meta = verdictTiers[tierKey];
          const style = TIER_STYLES[tierKey];

          return (
            <div
              key={tierKey}
              className={`card rounded-2xl border p-4 sm:p-5 space-y-3 ${style.container}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">
                    {meta.icon}
                  </span>
                  <h3 className={`text-base font-bold ${style.text}`}>
                    {t(TIER_LABEL_KEYS[tierKey])}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full border text-xs font-bold font-mono ${style.badge}`}
                >
                  {bucket.count} {t('items')}
                </span>
              </div>

              {bucket.count === 0 ? (
                <p className="text-sm text-text-muted">{t('reportNoItemsInTier')}</p>
              ) : (
                <div className="space-y-3">
                  {bucket.findings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Phase 5 Hook Banner */}
      <section className="rounded-2xl border border-dashed border-border bg-subtle-panel p-4 text-xs text-text-secondary text-center">
        {t('reportDisputePhase5Hook')}
      </section>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToVerify}
          className="min-h-[44px] px-5 py-2.5 rounded-xl border border-border bg-card-bg hover:bg-subtle-panel text-sm font-semibold text-text-primary cursor-pointer"
        >
          ← {t('reportEditBill')}
        </button>

        <button
          type="button"
          onClick={onStartOver}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary-navy hover:bg-action-teal text-white text-sm font-semibold cursor-pointer"
        >
          {t('reportStartOver')}
        </button>
      </div>
    </div>
  );
}
