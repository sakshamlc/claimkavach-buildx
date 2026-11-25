import { describe, it, expect } from 'vitest';
import { runAudit } from '@/lib/audit';
import { DEFAULT_REFERENCE_DATASET } from '@/lib/reference/dataset';
import {
  SYNTHETIC_BILL_A,
  SYNTHETIC_BILL_B,
  SYNTHETIC_BILL_C,
  SYNTHETIC_TEST_DATASET,
} from '@/test/golden-bills-data';

describe('Golden Synthetic Bills', () => {
  it('Bill A: detects stent overcharge (LIKELY since unverified), duplicate (LIKELY), and lump sum (NEEDS_REVIEW)', () => {
    const report = runAudit(SYNTHETIC_BILL_A, SYNTHETIC_TEST_DATASET, '2026-11-25');

    expect(report.reconcile.isReconciled).toBe(true);
    expect(report.reconcile.computedSumPaise).toBe(6950000);
    expect(report.tiers.CONFIRMED.count).toBe(0);
    expect(report.tiers.LIKELY.count).toBe(2);
    expect(report.tiers.LIKELY.findings.map((f) => f.ruleId).sort()).toEqual([
      'DUPLICATE_LINE_ITEM',
      'PRICE_ORDER_EXCEEDS_CEILING',
    ]);
    expect(report.tiers.NEEDS_REVIEW.count).toBe(1);
    expect(report.tiers.NEEDS_REVIEW.findings[0].ruleId).toBe('PHARMACY_LUMP_SUM');
    expect(report.tiers.NOT_CHECKED.count).toBe(2);
  });

  it('Bill A against empty DEFAULT_REFERENCE_DATASET emits NOT_CHECKED for stent & diagnostics while keeping duplicate + lump sum', () => {
    const report = runAudit(SYNTHETIC_BILL_A, DEFAULT_REFERENCE_DATASET, '2026-11-25');
    expect(report.tiers.CONFIRMED.count).toBe(0);
    expect(report.tiers.LIKELY.count).toBe(1);
    expect(report.tiers.NEEDS_REVIEW.count).toBe(1);
    expect(report.tiers.NOT_CHECKED.count).toBe(3);
  });

  it('Bill B: flags 1 VALID_EXCLUSION and 1 NEEDS_REVIEW (Reasonable & Customary)', () => {
    const report = runAudit(SYNTHETIC_BILL_B, SYNTHETIC_TEST_DATASET, '2026-11-25');

    expect(report.reconcile.isReconciled).toBe(true);
    expect(report.tiers.CONFIRMED.count).toBe(0);
    expect(report.tiers.LIKELY.count).toBe(0);
    expect(report.tiers.VALID_EXCLUSION.count).toBe(1);
    expect(report.tiers.VALID_EXCLUSION.findings[0].lineItemId).toBe('tpa-b-1');
    expect(report.tiers.NEEDS_REVIEW.count).toBe(1);
    expect(report.tiers.NEEDS_REVIEW.findings[0].lineItemId).toBe('tpa-b-2');
    expect(report.tiers.NOT_CHECKED.count).toBe(0);
  });

  it('Bill C: clean, accurate bill yields zero false positives across all actionable tiers', () => {
    const report = runAudit(SYNTHETIC_BILL_C, SYNTHETIC_TEST_DATASET, '2026-11-25');

    expect(report.reconcile.isReconciled).toBe(true);
    expect(report.coverage.totalLines).toBe(2);
    expect(report.coverage.arithmeticCheckedCount).toBe(2);
    expect(report.coverage.referenceCheckedCount).toBe(2);
    expect(report.coverage.notCheckedCount).toBe(0);
    expect(report.tiers.CONFIRMED.count).toBe(0);
    expect(report.tiers.LIKELY.count).toBe(0);
    expect(report.tiers.NEEDS_REVIEW.count).toBe(0);
    expect(report.tiers.VALID_EXCLUSION.count).toBe(0);
    expect(report.tiers.NOT_CHECKED.count).toBe(0);
  });
});
