'use client';

import { useState } from 'react';
import { VerdictIcon } from '@/components/Icons';
import { addPaise, formatINR, rupeesToPaise, subtractPaise } from '@/lib/currency';
import { isValidISODate } from '@/lib/dates';
import { useI18n, type I18nKeys } from '@/lib/i18n';
import {
  LineCategorySchema,
  type BillLineItem,
  type LineCategory,
  type NormalizedBill,
  type TpaDeductionItem,
} from '@/lib/schemas/audit';

interface VerifyStepProps {
  bill: NormalizedBill;
  onBillChange: (updated: NormalizedBill) => void;
  onRunAudit: (bill: NormalizedBill) => void;
  onBack: () => void;
}

const CATEGORY_LABEL_KEYS: Record<LineCategory, I18nKeys> = {
  stent: 'catStent',
  implant: 'catImplant',
  pharmacy: 'catPharmacy',
  consumables: 'catConsumables',
  room_rent: 'catRoomRent',
  diagnostics: 'catDiagnostics',
  procedure: 'catProcedure',
  doctor_fee: 'catDoctorFee',
  other: 'catOther',
};

function RupeeInput({
  paise,
  onCommitPaise,
  ariaLabel,
}: {
  paise: number;
  onCommitPaise: (nextPaise: number) => void;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState((paise / 100).toFixed(2));
  const [focused, setFocused] = useState(false);
  const displayValue = focused ? draft : (paise / 100).toFixed(2);

  return (
    <input
      type="number"
      step="0.01"
      min="0"
      aria-label={ariaLabel}
      value={displayValue}
      onFocus={() => {
        setDraft((paise / 100).toFixed(2));
        setFocused(true);
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = Number(draft);
        if (Number.isFinite(parsed) && parsed >= 0) {
          const rounded = rupeesToPaise(parsed);
          onCommitPaise(rounded);
          setDraft((rounded / 100).toFixed(2));
        } else {
          setDraft((paise / 100).toFixed(2));
        }
      }}
      onChange={(e) => {
        const nextVal = e.target.value;
        setDraft(nextVal);
        const parsed = Number(nextVal);
        if (nextVal.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) {
          onCommitPaise(rupeesToPaise(parsed));
        }
      }}
      className="
        w-full min-h-[44px] px-2.5 py-2 rounded-lg scroll-mt-40
        bg-card-bg border border-border text-base md:text-sm text-text-primary font-mono tabular-nums
      "
    />
  );
}

export function VerifyStep({
  bill,
  onBillChange,
  onRunAudit,
  onBack,
}: VerifyStepProps) {
  const { t } = useI18n();

  const computedSumPaise = addPaise(
    ...bill.lineItems.map((item) => item.lineTotalPaise),
  );
  const differencePaise = subtractPaise(bill.statedTotalPaise, computedSumPaise);
  const isReconciled = differencePaise === 0;

  function updateLineItem(id: string, patch: Partial<BillLineItem>) {
    onBillChange({
      ...bill,
      lineItems: bill.lineItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  function removeLineItem(id: string) {
    onBillChange({
      ...bill,
      lineItems: bill.lineItems.filter((item) => item.id !== id),
    });
  }

  function addLineItem() {
    const nextIdx = bill.lineItems.length + 1;
    const newItem: BillLineItem = {
      id: `line-manual-${Date.now()}-${nextIdx}`,
      rawDescription: 'New Line Item',
      normalizedName: 'New Line Item',
      category: 'other',
      quantity: 1,
      unit: 'unit',
      strengthOrSpec: null,
      unitPricePaise: 0,
      lineTotalPaise: 0,
      date: bill.billDate,
      isCheckedByUser: false,
    };
    onBillChange({
      ...bill,
      lineItems: [...bill.lineItems, newItem],
    });
  }

  function updateTpaDeduction(id: string, patch: Partial<TpaDeductionItem>) {
    onBillChange({
      ...bill,
      tpaDeductions: bill.tpaDeductions.map((ded) =>
        ded.id === id ? { ...ded, ...patch } : ded,
      ),
    });
  }

  return (
    <div className="space-y-6">
      {/* Synthetic Badge Banner */}
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

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary-navy">
          {t('verifyTitle')}
        </h2>
        <p className="text-sm text-text-secondary mt-1 leading-relaxed">
          {t('verifySubtitle')}
        </p>
      </div>

      {/* Sticky Reconcile Bar */}
      <div className="sticky top-[64px] z-10 rounded-2xl border border-border bg-card-bg/95 backdrop-blur-sm p-5 sm:p-6 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6">
            <div>
              <p className="text-xs text-text-muted">{t('reconcileBillTotal')}</p>
              <p className="text-base sm:text-lg font-bold text-primary-navy font-mono tabular-nums">
                {formatINR(bill.statedTotalPaise)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">{t('reconcileExtractedSum')}</p>
              <p className="text-base sm:text-lg font-bold text-primary-navy font-mono tabular-nums">
                {formatINR(computedSumPaise)}
              </p>
            </div>
          </div>

          <div
            role="status"
            aria-live="polite"
            className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold tabular-nums
              ${
                isReconciled
                  ? 'bg-verdict-valid-bg text-verdict-valid'
                  : 'bg-verdict-likely-bg text-verdict-likely'
              }
            `}
          >
            <VerdictIcon
              tier={isReconciled ? 'VALID_EXCLUSION' : 'LIKELY'}
              className="w-4 h-4 flex-shrink-0"
            />
            <span>
              {isReconciled
                ? `${t('verifyReconciledBadge')} (${formatINR(0)})`
                : `${t('verifyMismatchBadge')}: ${t('verifyDifferenceLabel')} ${formatINR(differencePaise)}`}
            </span>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {isReconciled
            ? t('reconcileHelperMatch')
            : t('reconcileHelperMismatch')}
        </p>
      </div>

      {/* Bill Metadata */}
      <section className="rounded-2xl border border-border bg-card-bg p-5 sm:p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <label className="block space-y-1 sm:col-span-2 lg:col-span-2">
          <span className="text-xs font-medium text-text-secondary">
            {t('verifyHospitalLabel')}
          </span>
          <input
            type="text"
            value={bill.hospitalName}
            onChange={(e) =>
              onBillChange({ ...bill, hospitalName: e.target.value })
            }
            className="w-full min-h-[44px] px-3 py-2 rounded-lg scroll-mt-40 bg-card-bg border border-border text-base md:text-sm text-text-primary"
          />
        </label>

        <label className="block space-y-1 sm:col-span-2 lg:col-span-2">
          <span className="text-xs font-medium text-text-secondary">
            {t('verifyPatientLabel')}
          </span>
          <input
            type="text"
            value={bill.patientName}
            onChange={(e) =>
              onBillChange({ ...bill, patientName: e.target.value })
            }
            className="w-full min-h-[44px] px-3 py-2 rounded-lg scroll-mt-40 bg-card-bg border border-border text-base md:text-sm text-text-primary"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-text-secondary">
            {t('verifyBillDateLabel')}
          </span>
          <input
            type="text"
            value={bill.billDate}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (isValidISODate(val)) {
                onBillChange({ ...bill, billDate: val });
              }
            }}
            placeholder="YYYY-MM-DD"
            className="w-full min-h-[44px] px-3 py-2 rounded-lg scroll-mt-40 bg-card-bg border border-border text-base md:text-sm text-text-primary font-mono tabular-nums"
          />
        </label>

        <div className="space-y-1">
          <span className="block text-xs font-medium text-text-secondary">
            {t('verifyStatedTotalLabel')}
          </span>
          <RupeeInput
            paise={bill.statedTotalPaise}
            onCommitPaise={(nextPaise) =>
              onBillChange({ ...bill, statedTotalPaise: nextPaise })
            }
            ariaLabel={t('verifyStatedTotalLabel')}
          />
        </div>
      </section>

      {/* Mobile Line Items (< 768px) */}
      <section className="space-y-4 md:hidden">
        {bill.lineItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-card-bg p-5 shadow-sm space-y-3.5"
          >
            <label className="block space-y-1">
              <span className="text-xs font-medium text-text-secondary">
                {t('verifyFieldDescription')}
              </span>
              <input
                type="text"
                value={item.rawDescription}
                onChange={(e) =>
                  updateLineItem(item.id, {
                    rawDescription: e.target.value,
                    normalizedName: e.target.value.trim() || item.normalizedName,
                  })
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-lg scroll-mt-40 border border-border text-base"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-text-secondary">
                {t('verifyFieldCategory')}
              </span>
              <select
                value={item.category}
                onChange={(e) =>
                  updateLineItem(item.id, {
                    category: e.target.value as LineCategory,
                  })
                }
                className="w-full min-h-[44px] px-2.5 py-2 rounded-lg scroll-mt-40 border border-border bg-card-bg text-base"
              >
                {LineCategorySchema.options.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(CATEGORY_LABEL_KEYS[cat])}
                  </option>
                ))}
              </select>
            </label>

            {/* 2-col numeric grid 1: Qty + Unit Price */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-text-secondary">
                  {t('verifyFieldQty')}
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={item.quantity}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    if (Number.isFinite(q) && q > 0) {
                      updateLineItem(item.id, { quantity: q });
                    }
                  }}
                  className="w-full min-h-[44px] px-2.5 py-2 rounded-lg scroll-mt-40 border border-border text-base font-mono tabular-nums"
                />
              </label>

              <div className="space-y-1">
                <span className="block text-xs font-medium text-text-secondary">
                  {t('verifyFieldUnitPrice')}
                </span>
                <RupeeInput
                  paise={item.unitPricePaise}
                  onCommitPaise={(p) =>
                    updateLineItem(item.id, { unitPricePaise: p })
                  }
                  ariaLabel={`${item.rawDescription} ${t('verifyFieldUnitPrice')}`}
                />
              </div>
            </div>

            {/* 2-col numeric grid 2: Line Total + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="block text-xs font-medium text-text-secondary">
                  {t('verifyFieldLineTotal')}
                </span>
                <RupeeInput
                  paise={item.lineTotalPaise}
                  onCommitPaise={(p) =>
                    updateLineItem(item.id, { lineTotalPaise: p })
                  }
                  ariaLabel={`${item.rawDescription} ${t('verifyFieldLineTotal')}`}
                />
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-text-secondary">
                  {t('verifyFieldDate')}
                </span>
                <input
                  type="text"
                  value={item.date ?? ''}
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    if (val === '') {
                      updateLineItem(item.id, { date: null });
                    } else if (isValidISODate(val)) {
                      updateLineItem(item.id, { date: val });
                    }
                  }}
                  className="w-full min-h-[44px] px-2.5 py-2 rounded-lg scroll-mt-40 border border-border text-base font-mono tabular-nums"
                />
              </label>
            </div>

            <div className="pt-2.5 border-t border-border space-y-2">
              <label className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-subtle-panel min-h-[44px] cursor-pointer text-sm font-medium text-text-primary">
                <span>{t('verifyConfirmToggle')}</span>
                <input
                  type="checkbox"
                  checked={item.isCheckedByUser}
                  onChange={(e) =>
                    updateLineItem(item.id, {
                      isCheckedByUser: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-action-teal rounded cursor-pointer"
                />
              </label>

              <button
                type="button"
                onClick={() => removeLineItem(item.id)}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-semibold text-verdict-confirmed hover:bg-verdict-confirmed-bg border border-verdict-confirmed/20 rounded-xl cursor-pointer"
              >
                {t('verifyRemoveRow')}
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Desktop Line Items Table (>= 768px) */}
      <section className="hidden md:block rounded-2xl border border-border bg-card-bg shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-subtle-panel text-xs font-semibold text-text-secondary">
              <th className="p-3 min-w-[260px]">{t('verifyFieldDescription')}</th>
              <th className="p-3 min-w-[140px]">{t('verifyFieldCategory')}</th>
              <th className="p-3 min-w-[72px] w-[72px] text-center">{t('verifyFieldQty')}</th>
              <th className="p-3 min-w-[120px]">{t('verifyFieldUnitPrice')}</th>
              <th className="p-3 min-w-[120px]">{t('verifyFieldLineTotal')}</th>
              <th className="p-3 min-w-[120px]">{t('verifyFieldDateShort')}</th>
              <th className="p-3 min-w-[68px] text-center">{t('verifyFieldCheckedShort')}</th>
              <th className="p-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bill.lineItems.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="p-2.5 min-w-[260px]">
                  <input
                    type="text"
                    aria-label={t('verifyFieldDescription')}
                    value={item.rawDescription}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        rawDescription: e.target.value,
                        normalizedName:
                          e.target.value.trim() || item.normalizedName,
                      })
                    }
                    className="w-full min-h-[44px] px-2.5 py-2 rounded-lg scroll-mt-40 border border-border text-sm"
                  />
                </td>
                <td className="p-2.5 min-w-[140px]">
                  <select
                    aria-label={t('verifyFieldCategory')}
                    value={item.category}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        category: e.target.value as LineCategory,
                      })
                    }
                    className="w-full min-h-[44px] px-2 py-2 rounded-lg scroll-mt-40 border border-border bg-card-bg text-sm"
                  >
                    {LineCategorySchema.options.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(CATEGORY_LABEL_KEYS[cat])}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2.5 min-w-[72px] w-[72px]">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    aria-label={t('verifyFieldQty')}
                    value={item.quantity}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      if (Number.isFinite(q) && q > 0) {
                        updateLineItem(item.id, { quantity: q });
                      }
                    }}
                    className="w-full min-h-[44px] px-2 py-2 text-center rounded-lg scroll-mt-40 border border-border text-sm font-mono tabular-nums"
                  />
                </td>
                <td className="p-2.5 min-w-[120px]">
                  <RupeeInput
                    paise={item.unitPricePaise}
                    onCommitPaise={(p) =>
                      updateLineItem(item.id, { unitPricePaise: p })
                    }
                    ariaLabel={`${item.rawDescription} ${t('verifyFieldUnitPrice')}`}
                  />
                </td>
                <td className="p-2.5 min-w-[120px]">
                  <RupeeInput
                    paise={item.lineTotalPaise}
                    onCommitPaise={(p) =>
                      updateLineItem(item.id, { lineTotalPaise: p })
                    }
                    ariaLabel={`${item.rawDescription} ${t('verifyFieldLineTotal')}`}
                  />
                </td>
                <td className="p-2.5 min-w-[120px]">
                  <input
                    type="text"
                    aria-label={t('verifyFieldDate')}
                    value={item.date ?? ''}
                    placeholder="YYYY-MM-DD"
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val === '') {
                        updateLineItem(item.id, { date: null });
                      } else if (isValidISODate(val)) {
                        updateLineItem(item.id, { date: val });
                      }
                    }}
                    className="w-full min-h-[44px] px-2 py-2 rounded-lg scroll-mt-40 border border-border text-xs font-mono tabular-nums"
                  />
                </td>
                <td className="p-2.5 text-center">
                  <label className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer rounded-lg hover:bg-subtle-panel">
                    <input
                      type="checkbox"
                      aria-label={`${t('verifyConfirmToggle')}: ${item.rawDescription}`}
                      checked={item.isCheckedByUser}
                      onChange={(e) =>
                        updateLineItem(item.id, {
                          isCheckedByUser: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-action-teal rounded cursor-pointer"
                    />
                  </label>
                </td>
                <td className="p-2.5">
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    className="min-h-[44px] px-2.5 py-2 text-xs font-semibold text-verdict-confirmed hover:bg-verdict-confirmed-bg rounded-lg cursor-pointer"
                  >
                    {t('verifyRemoveRow')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div>
        <button
          type="button"
          onClick={addLineItem}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-action-teal/40 text-action-teal bg-soft-teal-tint hover:bg-action-teal/10 text-sm font-semibold cursor-pointer"
        >
          + {t('verifyAddRow')}
        </button>
      </div>

      {/* TPA Deductions Section (when present) */}
      {bill.tpaDeductions.length > 0 && (
        <section className="rounded-2xl border border-border bg-card-bg p-5 sm:p-6 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-primary-navy">
            {t('verifyTpaSectionTitle')}
          </h3>
          <div className="space-y-3">
            {bill.tpaDeductions.map((ded) => (
              <div
                key={ded.id}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-subtle-panel border border-border"
              >
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-text-secondary">
                    {t('verifyFieldDescription')}
                  </span>
                  <input
                    type="text"
                    value={ded.description}
                    onChange={(e) =>
                      updateTpaDeduction(ded.id, {
                        description: e.target.value,
                      })
                    }
                    className="w-full min-h-[44px] px-2.5 py-2 rounded-lg scroll-mt-40 border border-border bg-card-bg text-base md:text-sm"
                  />
                </label>

                <div className="space-y-1">
                  <span className="block text-xs font-medium text-text-secondary">
                    {t('verifyTpaClaimed')}
                  </span>
                  <RupeeInput
                    paise={ded.claimedPaise}
                    onCommitPaise={(p) =>
                      updateTpaDeduction(ded.id, { claimedPaise: p })
                    }
                    ariaLabel={`${ded.description} ${t('verifyTpaClaimed')}`}
                  />
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-medium text-text-secondary">
                    {t('verifyTpaDeducted')}
                  </span>
                  <RupeeInput
                    paise={ded.deductedPaise}
                    onCommitPaise={(p) =>
                      updateTpaDeduction(ded.id, { deductedPaise: p })
                    }
                    ariaLabel={`${ded.description} ${t('verifyTpaDeducted')}`}
                  />
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-text-secondary">
                    {t('verifyTpaReason')}
                  </span>
                  <input
                    type="text"
                    value={ded.reasonText}
                    onChange={(e) =>
                      updateTpaDeduction(ded.id, {
                        reasonText: e.target.value,
                      })
                    }
                    className="w-full min-h-[44px] px-2.5 py-2 rounded-lg scroll-mt-40 border border-border bg-card-bg text-base md:text-sm"
                  />
                </label>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Primary Action Bar */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-5 py-2.5 rounded-xl border border-border bg-card-bg hover:bg-subtle-panel text-sm font-semibold text-text-secondary cursor-pointer"
        >
          ← {t('verifyBackToUpload')}
        </button>

        <button
          type="button"
          onClick={() => onRunAudit(bill)}
          className="min-h-[48px] px-6 py-3 rounded-xl bg-action-teal hover:bg-action-teal-hover text-white text-base font-semibold shadow-sm cursor-pointer"
        >
          {t('verifyRunAudit')} →
        </button>
      </div>
    </div>
  );
}
