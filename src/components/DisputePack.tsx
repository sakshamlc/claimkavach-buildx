'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildDisputeDrafts,
  type DisputeTabId,
} from '@/lib/dispute/templates';
import { useI18n } from '@/lib/i18n';
import type { AuditReport, NormalizedBill } from '@/lib/schemas/audit';

interface DisputePackProps {
  bill: NormalizedBill;
  report: AuditReport;
}

function fallbackCopyText(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export function DisputePack({ bill, report }: DisputePackProps) {
  const { t } = useI18n();
  const drafts = useMemo(() => buildDisputeDrafts(bill, report), [bill, report]);
  const [activeTab, setActiveTab] = useState<DisputeTabId>('hospital-query');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentDraft =
    drafts.find((d) => d.id === activeTab) ?? drafts[0];

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  function markCopied() {
    setCopyStatus('copied');
    if (copyTimerRef.current !== null) {
      clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = setTimeout(() => {
      setCopyStatus('idle');
      copyTimerRef.current = null;
    }, 2500);
  }

  async function handleCopy() {
    if (!currentDraft) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentDraft.body);
        markCopied();
        return;
      }
      if (fallbackCopyText(currentDraft.body)) {
        markCopied();
      } else {
        setCopyStatus('error');
      }
    } catch {
      if (fallbackCopyText(currentDraft.body)) {
        markCopied();
      } else {
        setCopyStatus('error');
      }
    }
  }

  return (
    <section className="no-print rounded-2xl border border-border bg-card-bg p-4 sm:p-6 space-y-4 shadow-sm min-w-0">
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-primary-navy break-words">
          {t('disputeTitle')}
        </h3>
        <p className="text-sm text-text-secondary mt-1 leading-relaxed break-words">
          {t('disputeSubtitle')}
        </p>
      </div>

      {/* 4 Draft Tabs (2x2 grid on narrow phones, wrapped row on >= 640px) */}
      <div
        role="tablist"
        aria-label={t('disputeTitle')}
        className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2"
      >
        {drafts.map((draft) => {
          const isSelected = draft.id === activeTab;
          return (
            <button
              key={draft.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setActiveTab(draft.id);
                setCopyStatus('idle');
              }}
              className={`
                min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold
                border transition-colors cursor-pointer text-center
                ${
                  isSelected
                    ? 'bg-action-teal text-white border-action-teal'
                    : 'bg-subtle-panel text-text-secondary border-border hover:bg-soft-teal-tint hover:text-action-teal'
                }
              `}
            >
              {t(draft.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Draft Textarea */}
      {currentDraft && (
        <div role="tabpanel" className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-text-secondary">
              {t('disputeDraftLabel')}: {t(currentDraft.labelKey)}
            </span>
            <textarea
              readOnly
              rows={12}
              value={currentDraft.body}
              className="
                w-full min-h-[260px] p-4 rounded-xl border border-border bg-card-bg
                font-sans text-base text-text-primary leading-relaxed shadow-xs
              "
            />
          </label>

          {/* Mandatory Verify Before Sending Checklist */}
          <div className="rounded-xl border border-verdict-likely/30 bg-verdict-likely-bg p-3.5 space-y-1.5">
            <p className="text-xs font-bold text-verdict-likely">
              {t('disputeVerifyChecklist')}
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-text-primary">
              <li>{t('disputeCheck1')}</li>
              <li>{t('disputeCheck2')}</li>
              <li>{t('disputeCheck3')}</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="
                w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl
                bg-action-teal hover:bg-action-teal-hover text-white
                text-sm font-semibold cursor-pointer transition-colors
              "
            >
              {copyStatus === 'copied'
                ? t('disputeCopied')
                : t('disputeCopyButton')}
            </button>

            <span role="status" aria-live="polite" className="sr-only">
              {copyStatus === 'copied' ? t('disputeCopied') : ''}
            </span>

            {copyStatus === 'error' && (
              <p role="alert" className="text-xs text-verdict-confirmed">
                {t('disputeCopyError')}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
