'use client';

import { useState } from 'react';
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
        w-full min-h-[44px] px-2.5 py-2 rounded-lg
        bg-card-bg border border-border text-sm text-text-primary font-mono
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
          {t('verifyTitle')}
        </h2>
        <p className="text-sm text-text-secondary mt-1">{t('verifySubtitle')}</p>
      </div>

      {/* Sticky Reconcile Bar */}
      <div className="sticky top-[65px] z-10 rounded-2xl border border-border bg-card-bg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-4">
            <div>
              <p className="text-xs text-text-muted">{t('reconcileBillTotal')}</p>
              <p className="text-base sm:text-lg font-bold text-primary-navy font-mono">
                {formatINR(bill.statedTotalPaise)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">{t('reconcileExtractedSum')}</p>
              <p className="text-base sm:text-lg font-bold text-primary-navy font-mono">
                {formatINR(computedSumPaise)}
              </p>
            </div>
          </div>

          <div
            role="status"
            aria-live="polite"
            className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
              ${
                isReconciled
                  ? 'bg-verdict-valid-bg text-verdict-valid'
                  : 'bg-verdict-likely-bg text-verdict-likely'
              }
            `}
          >
            <span aria-hidden="true">{isReconciled ? '🟢' : '🟠'}</span>
            <span>
              {isReconciled
                ? `${t('verifyReconciledBadge')} (${formatINR(0)})`
                : `${t('verifyMismatchBadge')}: ${t('verifyDifferenceLabel')} ${formatINR(differencePaise)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Bill Metadata */}
      <section className="rounded-2xl border border-border bg-card-bg p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-text-secondary">
            {t('verifyHospitalLabel')}
          </span>
          <input
            type="text"
            value={bill.hospitalName}
            onChange={(e) =>
              onBillChange({ ...bill, hospitalName: e.target.value })
            }
            className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-card-bg border border-border text-sm text-text-primary"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-text-secondary">
            {t('verifyPatientLabel')}
          </span>
          <input
            type="text"
            value={bill.patientName}
            onChange={(e) =>
              onBillChange({ ...bill, patientName: e.target.value })
            }
            className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-card-bg border border-border text-sm text-text-primary"
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
            className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-card-bg border border-border text-sm text-text-primary font-mono"
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
      <section className="space-y-3 md:hidden">
        {bill.lineItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-card-bg p-4 space-y-3"
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
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border text-sm"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full min-h-[44px] px-2 py-2 rounded-lg border border-border bg-card-bg text-sm"
                >
                  {LineCategorySchema.options.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(CATEGORY_LABEL_KEYS[cat])}
                    </option>
                  ))}
                </select>
              </label>

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
                  className="w-full min-h-[44px] px-2.5 py-2 rounded-lg border border-border text-sm font-mono"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
              <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer text-sm font-medium text-text-primary">
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
                <span>{t('verifyConfirmToggle')}</span>
              </label>

              <button
                type="button"
                onClick={() => removeLineItem(item.id)}
                className="min-h-[44px] px-3 py-2 text-xs font-semibold text-verdict-confirmed hover:bg-verdict-confirmed-bg rounded-lg cursor-pointer"
              >
                {t('verifyRemoveRow')}
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Desktop Line Items Table (>= 768px) */}
      <section className="hidden md:block rounded-2xl border border-border bg-card-bg overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-subtle-panel text-xs font-semibold text-text-secondary">
              <th className="p-3">{t('verifyFieldDescription')}</th>
              <th className="p-3 w-36">{t('verifyFieldCategory')}</th>
              <th className="p-3 w-20">{t('verifyFieldQty')}</th>
              <th className="p-3 w-32">{t('verifyFieldUnitPrice')}</th>
              <th className="p-3 w-32">{t('verifyFieldLineTotal')}</th>
              <th className="p-3 w-36">{t('verifyFieldDate')}</th>
              <th className="p-3 w-32">{t('verifyConfirmToggle')}</th>
              <th className="p-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bill.lineItems.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="p-2.5">
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
                    className="w-full min-h-[44px] px-2.5 py-2 rounded-lg border border-border text-sm"
                  />
                </td>
                <td className="p-2.5">
                  <select
                    aria-label={t('verifyFieldCategory')}
                    value={item.category}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        category: e.target.value as LineCategory,
                      })
                    }
                    className="w-full min-h-[44px] px-2 py-2 rounded-lg border border-border bg-card-bg text-sm"
                  >
                    {LineCategorySchema.options.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(CATEGORY_LABEL_KEYS[cat])}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2.5">
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
                    className="w-full min-h-[44px] px-2 py-2 rounded-lg border border-border text-sm font-mono"
                  />
                </td>
                <td className="p-2.5">
                  <RupeeInput
                    paise={item.unitPricePaise}
                    onCommitPaise={(p) =>
                      updateLineItem(item.id, { unitPricePaise: p })
                    }
                    ariaLabel={`${item.rawDescription} ${t('verifyFieldUnitPrice')}`}
                  />
                </td>
                <td className="p-2.5">
                  <RupeeInput
                    paise={item.lineTotalPaise}
                    onCommitPaise={(p) =>
                      updateLineItem(item.id, { lineTotalPaise: p })
                    }
                    ariaLabel={`${item.rawDescription} ${t('verifyFieldLineTotal')}`}
                  />
                </td>
                <td className="p-2.5">
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
                    className="w-full min-h-[44px] px-2 py-2 rounded-lg border border-border text-xs font-mono"
                  />
                </td>
                <td className="p-2.5">
                  <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer text-xs font-medium">
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
                    <span>{t('verifyConfirmToggle')}</span>
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
        <section className="rounded-2xl border border-border bg-card-bg p-4 sm:p-5 space-y-3">
          <h3 className="text-base font-bold text-primary-navy">
            {t('verifyTpaSectionTitle')}
          </h3>
          <div className="space-y-3">
            {bill.tpaDeductions.map((ded) => (
              <div
                key={ded.id}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-subtle-panel border border-border"
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
                    className="w-full min-h-[44px] px-2.5 py-2 rounded-lg border border-border bg-card-bg text-sm"
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
                    className="w-full min-h-[44px] px-2.5 py-2 rounded-lg border border-border bg-card-bg text-sm"
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
