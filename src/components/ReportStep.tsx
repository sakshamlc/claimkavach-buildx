'use client';

import { useState } from 'react';
import { DisputePack } from '@/components/DisputePack';
import { PrinterIcon, VerdictIcon } from '@/components/Icons';
import { ListenButton } from '@/components/ListenButton';
import { formatINR } from '@/lib/currency';
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
  { container: string; badge: string; text: string; leftAccent: string }
> = {
  CONFIRMED: {
    container: 'border-verdict-confirmed/30 bg-card-bg',
    badge: 'bg-verdict-confirmed-bg text-verdict-confirmed border-verdict-confirmed/30',
    text: 'text-verdict-confirmed',
    leftAccent: 'border-l-verdict-confirmed',
  },
  LIKELY: {
    container: 'border-verdict-likely/30 bg-card-bg',
    badge: 'bg-verdict-likely-bg text-verdict-likely border-verdict-likely/30',
    text: 'text-verdict-likely',
    leftAccent: 'border-l-verdict-likely',
  },
  NEEDS_REVIEW: {
    container: 'border-verdict-needs-review/30 bg-card-bg',
    badge: 'bg-verdict-needs-review-bg text-verdict-needs-review border-verdict-needs-review/30',
    text: 'text-verdict-needs-review',
    leftAccent: 'border-l-verdict-needs-review',
  },
  VALID_EXCLUSION: {
    container: 'border-verdict-valid/30 bg-card-bg',
    badge: 'bg-verdict-valid-bg text-verdict-valid border-verdict-valid/30',
    text: 'text-verdict-valid',
    leftAccent: 'border-l-verdict-valid',
  },
  NOT_CHECKED: {
    container: 'border-border bg-card-bg',
    badge: 'bg-verdict-not-checked-bg text-verdict-not-checked border-border',
    text: 'text-verdict-not-checked',
    leftAccent: 'border-l-verdict-not-checked',
  },
};

function EvidenceDetails({ finding }: { finding: AuditFinding }) {
  const { t } = useI18n();
  return (
    <div className="space-y-1.5 text-xs text-text-secondary break-words">
      {finding.evidence.formula && (
        <p>
          <span className="font-semibold text-text-primary">
            {t('reportFormulaLabel')}:{' '}
          </span>
          <span className="font-mono tabular-nums">{finding.evidence.formula}</span>
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
  );
}

function FindingCard({ finding }: { finding: AuditFinding }) {
  const { t } = useI18n();
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const style = TIER_STYLES[finding.tier];

  return (
    <article
      className={`rounded-xl border border-border border-l-4 ${style.leftAccent} bg-subtle-panel p-4 space-y-3`}
    >
      {finding.unverifiedData && (
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-verdict-likely-bg text-verdict-likely border border-verdict-likely/30 text-xs font-semibold">
            {t('reportUnverifiedBadge')}
          </span>
        </div>
      )}

      <p className="text-sm font-medium text-text-primary leading-relaxed break-words">
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
              <span className="font-mono tabular-nums font-semibold text-text-primary">
                {formatINR(finding.billedPaise)}
              </span>
            </div>
          )}
          {finding.referencePaise !== null && (
            <div>
              <span className="block text-text-muted">
                {t('reportReferenceAmount')}
              </span>
              <span className="font-mono tabular-nums font-semibold text-text-primary">
                {formatINR(finding.referencePaise)}
              </span>
            </div>
          )}
          {finding.deltaPaise !== null && (
            <div>
              <span className="block text-text-muted">
                {t('reportDeltaAmount')}
              </span>
              <span className={`font-mono tabular-nums font-bold ${style.text}`}>
                {formatINR(finding.deltaPaise)}
              </span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-text-secondary leading-relaxed break-words">
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

        <div
          className={
            evidenceOpen
              ? 'mt-2 rounded-lg border border-border bg-card-bg p-3'
              : 'hidden print-evidence mt-2 rounded-lg border border-border bg-card-bg p-3'
          }
        >
          <EvidenceDetails finding={finding} />
        </div>
      </div>
    </article>
  );
}

function NotCheckedCompactRow({
  finding,
  bill,
}: {
  finding: AuditFinding;
  bill: NormalizedBill;
}) {
  const { t } = useI18n();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const lineLabel =
    bill.lineItems.find((li) => li.id === finding.lineItemId)?.rawDescription ??
    bill.tpaDeductions.find((td) => td.id === finding.lineItemId)?.description ??
    finding.summary;

  return (
    <li className="p-3.5 sm:px-4 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span className="text-sm font-semibold text-text-primary break-words">
              {lineLabel}
            </span>
            {finding.billedPaise !== null && (
              <span className="text-xs font-mono tabular-nums font-semibold text-text-secondary">
                {formatINR(finding.billedPaise)}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary leading-relaxed break-words">
            {finding.evidence.details}
          </p>
        </div>

        <button
          type="button"
          aria-expanded={evidenceOpen}
          onClick={() => setEvidenceOpen((prev) => !prev)}
          className="min-h-[44px] px-3 py-1.5 rounded-lg border border-border bg-card-bg hover:bg-soft-teal-tint text-xs font-semibold text-action-teal cursor-pointer self-start sm:self-center flex-shrink-0"
        >
          {evidenceOpen ? t('reportHideEvidence') : t('reportEvidencePanel')}
        </button>
      </div>

      <div
        className={
          evidenceOpen
            ? 'rounded-lg border border-border bg-card-bg p-3'
            : 'hidden print-evidence rounded-lg border border-border bg-card-bg p-3'
        }
      >
        <EvidenceDetails finding={finding} />
      </div>
    </li>
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

  const formatCount = (count: number) =>
    `${count} ${count === 1 ? t('itemSingular') : t('items')}`;

  return (
    <div className="space-y-6 min-w-0">
      {bill.isSynthetic && (
        <div
          role="note"
          className="rounded-xl border border-action-teal/30 bg-soft-teal-tint px-4 py-3 text-sm font-semibold text-action-teal flex flex-wrap items-center gap-2"
        >
          <span className="px-2 py-0.5 rounded bg-action-teal text-white text-xs font-bold">
            {t('syntheticBadge')}
          </span>
          <span className="break-words">{t('syntheticDemoBanner')}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-navy">
            {t('reportTitle')}
          </h2>
          <p className="text-sm text-text-secondary mt-1 break-words">
            {bill.hospitalName} • {bill.patientName} • {bill.billDate}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && typeof window.print === 'function') {
              window.print();
            }
          }}
          className="no-print w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl border border-border bg-card-bg hover:bg-soft-teal-tint text-sm font-semibold text-action-teal cursor-pointer inline-flex items-center justify-center gap-2 flex-shrink-0"
        >
          <PrinterIcon className="w-4 h-4" />
          <span>{t('printReportButton')}</span>
        </button>
      </div>

      {/* Audio Summary (Web Speech API) */}
      <ListenButton report={report} />

      {/* Coverage Summary Card (Never merges tiers into single savings figure) */}
      <section className="rounded-2xl border border-border bg-card-bg p-4 sm:p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-primary-navy">
          {t('reportCoverageTitle')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-subtle-panel border border-border p-3.5">
            <p className="text-xs text-text-muted">
              {t('reportArithmeticChecked')}
            </p>
            <p className="text-xl font-bold text-primary-navy font-mono tabular-nums mt-1">
              {report.coverage.arithmeticCheckedCount} {t('of')}{' '}
              {report.coverage.totalLines}
            </p>
          </div>

          <div className="rounded-xl bg-subtle-panel border border-border p-3.5">
            <p className="text-xs text-text-muted">
              {t('reportReferenceChecked')}
            </p>
            <p className="text-xl font-bold text-primary-navy font-mono tabular-nums mt-1">
              {report.coverage.referenceCheckedCount} {t('of')}{' '}
              {report.coverage.totalLines}
            </p>
          </div>

          <div className="rounded-xl bg-verdict-not-checked-bg border border-border p-3.5">
            <p className="text-xs text-text-muted">{t('reportNotChecked')}</p>
            <p className="text-xl font-bold text-verdict-not-checked font-mono tabular-nums mt-1">
              {formatCount(report.coverage.notCheckedCount)}
            </p>
          </div>
        </div>

        {report.coverage.notCheckedReasons.length > 0 && (
          <div className="no-print">
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
                {report.coverage.notCheckedReasons.map((item) => {
                  const rowName =
                    bill.lineItems.find((li) => li.id === item.lineId)
                      ?.rawDescription ??
                    bill.tpaDeductions.find((td) => td.id === item.lineId)
                      ?.description ??
                    item.lineId;
                  return (
                    <li key={`${item.lineId}-${item.reason}`} className="break-words">
                      <span className="font-semibold text-text-primary">
                        {rowName}:
                      </span>{' '}
                      {item.reason}
                    </li>
                  );
                })}
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
          const style = TIER_STYLES[tierKey];

          return (
            <div
              key={tierKey}
              className={`card rounded-2xl border p-4 sm:p-6 shadow-sm space-y-3 ${style.container}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`${style.text} flex-shrink-0`}>
                    <VerdictIcon tier={tierKey} className="w-5 h-5" />
                  </span>
                  <h3 className={`text-base font-bold ${style.text} break-words`}>
                    {t(TIER_LABEL_KEYS[tierKey])}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full border text-xs font-bold font-mono tabular-nums flex-shrink-0 ${style.badge}`}
                >
                  {formatCount(bucket.count)}
                </span>
              </div>

              {bucket.count === 0 ? (
                <p className="text-sm text-text-muted">{t('reportNoItemsInTier')}</p>
              ) : tierKey === 'NOT_CHECKED' ? (
                <ul className="divide-y divide-border rounded-xl border border-border bg-subtle-panel">
                  {bucket.findings.map((finding) => (
                    <NotCheckedCompactRow
                      key={finding.id}
                      finding={finding}
                      bill={bill}
                    />
                  ))}
                </ul>
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

      {/* Polite Dispute Draft Pack */}
      <DisputePack bill={bill} report={report} />

      {/* Footer Actions */}
      <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
