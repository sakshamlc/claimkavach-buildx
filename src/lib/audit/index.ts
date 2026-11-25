/**
 * src/lib/audit/index.ts
 * ======================
 * Pure deterministic rules engine — ENTRY POINT.
 *
 * PURITY CONTRACT:
 * - NO network calls (no fetch, no XMLHttpRequest)
 * - NO AI SDK imports (no @google/generative-ai, no ai/*)
 * - NO Date.now(), no new Date(), no Math.random()
 * - NO imports from src/app/api/*, src/lib/extract/*, or any AI module
 * - NO console.log or Node I/O
 *
 * Given identical `(bill, referenceDataset, referenceDateISO)`, `runAudit`
 * ALWAYS returns byte-identical JSON output.
 */

import {
  AuditReportSchema,
  ISODateSchema,
  NormalizedBillSchema,
  ReferenceDatasetSchema,
  type AuditFinding,
  type AuditReport,
  type AuditVerdictTier,
  type NormalizedBill,
  type ReferenceDataset,
} from '@/lib/schemas/audit';
import { checkArithmetic } from '@/lib/audit/rules/arithmetic';
import { checkDuplicates } from '@/lib/audit/rules/duplicates';
import { checkPharmacyLumpSums } from '@/lib/audit/rules/pharmacy-lump-sum';
import { checkPriceOrders } from '@/lib/audit/rules/price-order';
import { checkTpaDeductions } from '@/lib/audit/rules/tpa-deduction';

export type {
  AuditFinding,
  AuditReport,
  AuditVerdictTier,
  NormalizedBill,
  ReferenceDataset,
} from '@/lib/schemas/audit';

/**
 * Run the full deterministic audit pipeline.
 */
export function runAudit(
  billInput: NormalizedBill,
  referenceDatasetInput: ReferenceDataset,
  referenceDateISO: string,
): AuditReport {
  const bill = NormalizedBillSchema.parse(billInput);
  const referenceDataset = ReferenceDatasetSchema.parse(referenceDatasetInput);
  const validatedRefDate = ISODateSchema.parse(referenceDateISO);

  const arithmetic = checkArithmetic(bill);
  const duplicateFindings = checkDuplicates(bill);
  const lumpSum = checkPharmacyLumpSums(bill);
  const priceOrder = checkPriceOrders(
    bill,
    referenceDataset.prices,
    validatedRefDate,
    lumpSum.flaggedLineIds,
  );
  const tpa = checkTpaDeductions(
    bill,
    referenceDataset.tpaExclusions,
    validatedRefDate,
  );

  const allFindings: AuditFinding[] = [
    ...arithmetic.findings,
    ...duplicateFindings,
    ...lumpSum.findings,
    ...priceOrder.findings,
    ...tpa.findings,
  ];

  const byTier: Record<AuditVerdictTier, AuditFinding[]> = {
    CONFIRMED: [],
    LIKELY: [],
    NEEDS_REVIEW: [],
    VALID_EXCLUSION: [],
    NOT_CHECKED: [],
  };

  for (const finding of allFindings) {
    byTier[finding.tier].push(finding);
  }

  const notCheckedReasons = [
    ...priceOrder.notCheckedReasons,
    ...tpa.notCheckedReasons,
  ];

  const report: AuditReport = {
    billId: bill.billId,
    referenceDateISO: validatedRefDate,
    reconcile: arithmetic.reconcile,
    coverage: {
      totalLines: bill.lineItems.length,
      arithmeticCheckedCount: arithmetic.arithmeticCheckedCount,
      referenceCheckedCount: priceOrder.referenceCheckedCount,
      notCheckedCount: notCheckedReasons.length,
      notCheckedReasons,
    },
    tiers: {
      CONFIRMED: {
        tier: 'CONFIRMED',
        count: byTier.CONFIRMED.length,
        findings: byTier.CONFIRMED,
      },
      LIKELY: {
        tier: 'LIKELY',
        count: byTier.LIKELY.length,
        findings: byTier.LIKELY,
      },
      NEEDS_REVIEW: {
        tier: 'NEEDS_REVIEW',
        count: byTier.NEEDS_REVIEW.length,
        findings: byTier.NEEDS_REVIEW,
      },
      VALID_EXCLUSION: {
        tier: 'VALID_EXCLUSION',
        count: byTier.VALID_EXCLUSION.length,
        findings: byTier.VALID_EXCLUSION,
      },
      NOT_CHECKED: {
        tier: 'NOT_CHECKED',
        count: byTier.NOT_CHECKED.length,
        findings: byTier.NOT_CHECKED,
      },
    },
  };

  return AuditReportSchema.parse(report);
}
