'use client';

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { PrivacyDisclaimer } from '@/components/PrivacyDisclaimer';
import { SYNTHETIC_DEMO_SCENARIOS } from '@/lib/demo/synthetic-bills';
import {
  ClientPrepError,
  prepareBillUpload,
  type PrepProgress,
} from '@/lib/extract/client-prep';
import {
  mapExtractionToNormalizedBill,
  mergeBatchExtractions,
} from '@/lib/extract/mapper';
import { RawExtractionSchema, type RawExtraction } from '@/lib/extract/schemas';
import { useI18n } from '@/lib/i18n';
import type { NormalizedBill } from '@/lib/schemas/audit';

interface UploadStepProps {
  consented: boolean;
  onConsentChange: (consented: boolean) => void;
  onBillReady: (bill: NormalizedBill) => void;
}

export function UploadStep({
  consented,
  onConsentChange,
  onBillReady,
}: UploadStepProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function mapHttpErrorToMessage(status: number): string {
    switch (status) {
      case 413:
        return t('errorFileTooLarge');
      case 422:
        return t('errorUnprocessable');
      case 429:
        return t('errorRateLimited');
      case 503:
        return t('errorNotConfigured');
      case 400:
        return t('errorUnsupportedFormat');
      default:
        return t('errorExtractionFailed');
    }
  }

  function mapPrepErrorToMessage(err: unknown): string {
    if (err instanceof ClientPrepError) {
      switch (err.code) {
        case 'UNSUPPORTED_MIME':
          return t('errorUnsupportedFormat');
        case 'PAYLOAD_TOO_LARGE':
          return t('errorFileTooLarge');
        case 'EMPTY_FILE':
        case 'CORRUPTED_FILE':
          return t('errorExtractionFailed');
        default:
          return t('errorGeneric');
      }
    }
    return t('errorGeneric');
  }

  async function processFile(file: File) {
    if (!consented) {
      setErrorMessage(t('uploadConsentRequired'));
      return;
    }

    setErrorMessage(null);
    setSelectedFileName(file.name);
    setIsProcessing(true);
    setStatusMessage(t('uploadProgressCompressing'));

    try {
      const prepared = await prepareBillUpload(file, (progress: PrepProgress) => {
        if (progress.stage === 'rendering_pdf' || progress.stage === 'compressing') {
          setStatusMessage(
            `${t('uploadProgressCompressing')} (${progress.currentPage} ${t('of')} ${progress.totalPages})`,
          );
        }
      });

      const batchExtractions: RawExtraction[] = [];
      for (const batch of prepared.batches) {
        setStatusMessage(
          `${t('uploadProgressBatch')} ${batch.batchIndex + 1} ${t('of')} ${batch.totalBatches}...`,
        );

        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });

        if (!response.ok) {
          setErrorMessage(mapHttpErrorToMessage(response.status));
          return;
        }

        const payload = (await response.json()) as { extraction?: unknown };
        const parsed = RawExtractionSchema.safeParse(payload.extraction);
        if (!parsed.success) {
          setErrorMessage(t('errorUnprocessable'));
          return;
        }
        batchExtractions.push(parsed.data);
      }

      const merged = mergeBatchExtractions(batchExtractions);
      const todayISO = new Date().toISOString().slice(0, 10);
      const normalized = mapExtractionToNormalizedBill(merged, {
        billId: `upload-${Date.now()}`,
        isSynthetic: false,
        fallbackBillDateISO: todayISO,
      });

      onBillReady(normalized);
    } catch (err) {
      setErrorMessage(mapPrepErrorToMessage(err));
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (!consented || isProcessing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  }

  function handleLoadDemo(bill: NormalizedBill) {
    setErrorMessage(null);
    // Deep clone so user edits in Step 2 never mutate the static demo fixture
    onBillReady(structuredClone(bill));
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-navy mb-3 leading-tight">
          {t('landingTitle')}
        </h2>
        <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          {t('landingSubtitle')}
        </p>
      </section>

      {/* 1-Click Synthetic Demo Strip */}
      <section className="bg-card-bg rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-primary-navy mb-1">
            {t('demoStripTitle')}
          </h3>
          <p className="text-sm text-text-muted">{t('demoStripSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SYNTHETIC_DEMO_SCENARIOS.map((scenario) => (
            <div
              key={scenario.id}
              className="flex flex-col justify-between gap-3 p-4 rounded-xl bg-subtle-panel border border-border"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg" aria-hidden="true">
                    {scenario.icon}
                  </span>
                  <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-soft-teal-tint text-action-teal rounded">
                    {t('syntheticBadge')}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  {t(scenario.titleKey)}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t(scenario.descriptionKey)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleLoadDemo(scenario.bill)}
                disabled={isProcessing}
                className="
                  w-full min-h-[44px] px-3 py-2 rounded-lg
                  bg-card-bg hover:bg-soft-teal-tint
                  border border-action-teal/40 text-action-teal
                  text-sm font-semibold transition-colors cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {t('loadDemoButton')}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Consent + Upload Dropzone */}
      <section className="max-w-xl mx-auto space-y-4">
        <PrivacyDisclaimer
          consented={consented}
          onConsentChange={(val) => {
            onConsentChange(val);
            if (val) setErrorMessage(null);
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (consented && !isProcessing) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            rounded-2xl border-2 border-dashed p-6 text-center transition-colors
            ${
              isDragging
                ? 'border-action-teal bg-soft-teal-tint'
                : 'border-border bg-card-bg'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
            aria-label={t('uploadChooseFile')}
            disabled={!consented || isProcessing}
          />

          <p className="text-base font-semibold text-primary-navy mb-1">
            {t('uploadTitle')}
          </p>
          <p className="text-sm text-text-secondary mb-2">
            {t('uploadDragDrop')}
          </p>
          <p className="text-xs text-text-muted mb-4">{t('uploadFormats')}</p>

          {selectedFileName && (
            <p className="text-xs text-text-secondary mb-3 break-all">
              {t('uploadSelectedFile')}: <span className="font-medium">{selectedFileName}</span>
            </p>
          )}

          {statusMessage && (
            <p
              role="status"
              aria-live="polite"
              className="text-sm font-medium text-action-teal mb-4"
            >
              {statusMessage}
            </p>
          )}

          <button
            type="button"
            disabled={!consented || isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className={`
              w-full min-h-[48px] px-6 py-3 rounded-xl text-base font-semibold
              transition-colors
              ${
                consented && !isProcessing
                  ? 'bg-action-teal hover:bg-action-teal-hover text-white cursor-pointer'
                  : 'bg-subtle-panel text-text-muted border border-border cursor-not-allowed'
              }
            `}
          >
            {isProcessing ? t('uploadProcessing') : t('uploadChooseFile')}
          </button>

          {!consented && (
            <p className="text-xs text-text-muted mt-3">
              {t('uploadConsentRequired')}
            </p>
          )}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-verdict-confirmed/30 bg-verdict-confirmed-bg p-4 text-sm text-verdict-confirmed"
          >
            {errorMessage}
          </div>
        )}
      </section>
    </div>
  );
}
