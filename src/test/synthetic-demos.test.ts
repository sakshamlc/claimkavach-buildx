import { describe, it, expect } from 'vitest';
import { runAudit } from '@/lib/audit';
import {
  SYNTHETIC_DEMO_SCENARIOS,
  getSyntheticDemoById,
} from '@/lib/demo/synthetic-bills';
import en from '@/lib/i18n/en';
import hi from '@/lib/i18n/hi';
import { DEFAULT_REFERENCE_DATASET } from '@/lib/reference/dataset';
import { NormalizedBillSchema } from '@/lib/schemas/audit';

describe('Synthetic Demo Bills', () => {
  it('provides exactly 3 synthetic scenarios with valid schemas, flags, and EN/HI copy', () => {
    expect(SYNTHETIC_DEMO_SCENARIOS).toHaveLength(3);

    for (const scenario of SYNTHETIC_DEMO_SCENARIOS) {
      expect(scenario.bill.isSynthetic).toBe(true);
      expect(() => NormalizedBillSchema.parse(scenario.bill)).not.toThrow();
      expect(en[scenario.titleKey]).toBeTruthy();
      expect(hi[scenario.titleKey]).toBeTruthy();
      expect(en[scenario.descriptionKey]).toBeTruthy();
      expect(hi[scenario.descriptionKey]).toBeTruthy();
      expect(getSyntheticDemoById(scenario.id)?.bill.billId).toBe(scenario.bill.billId);
    }
  });

  it('runs Scenario A through runAudit cleanly with arithmetic, duplicate, lump-sum, and NOT_CHECKED transparency', () => {
    const demoA = getSyntheticDemoById('stent-duplicate-lumpsum')!;
    const report = runAudit(demoA.bill, DEFAULT_REFERENCE_DATASET, '2026-11-25');

    expect(report.reconcile.isReconciled).toBe(true);
    expect(report.tiers.CONFIRMED.count).toBe(1); // Arithmetic line mismatch
    expect(report.tiers.LIKELY.count).toBe(1); // Duplicate Troponin-I
    expect(report.tiers.NEEDS_REVIEW.count).toBe(1); // Pharmacy lump sum
    expect(report.tiers.NOT_CHECKED.count).toBeGreaterThanOrEqual(1);
  });

  it('runs Scenario B through runAudit cleanly with TPA vague deduction flagged as NEEDS_REVIEW', () => {
    const demoB = getSyntheticDemoById('tpa-deduction-review')!;
    const report = runAudit(demoB.bill, DEFAULT_REFERENCE_DATASET, '2026-11-25');

    expect(report.reconcile.isReconciled).toBe(true);
    expect(report.tiers.NEEDS_REVIEW.count).toBe(1);
    expect(report.tiers.NOT_CHECKED.count).toBeGreaterThanOrEqual(1);
  });

  it('runs Scenario C through runAudit with zero false positives in actionable tiers', () => {
    const demoC = getSyntheticDemoById('clean-accurate-bill')!;
    const report = runAudit(demoC.bill, DEFAULT_REFERENCE_DATASET, '2026-11-25');

    expect(report.reconcile.isReconciled).toBe(true);
    expect(report.tiers.CONFIRMED.count).toBe(0);
    expect(report.tiers.LIKELY.count).toBe(0);
    expect(report.tiers.NEEDS_REVIEW.count).toBe(0);
  });
});
