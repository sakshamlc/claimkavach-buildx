import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runAudit } from '@/lib/audit';
import type {
  BillLineItem,
  NormalizedBill,
  ReferenceDataset,
  ReferencePriceRecord,
  TpaExclusionRule,
} from '@/lib/schemas/audit';

function makeLineItem(overrides: Partial<BillLineItem> = {}): BillLineItem {
  return {
    id: 'line-1',
    rawDescription: 'General Ward Room Charge',
    normalizedName: 'General Ward Room Charge',
    category: 'room_rent',
    quantity: 1,
    unit: 'day',
    strengthOrSpec: 'general_ward',
    unitPricePaise: 250000,
    lineTotalPaise: 250000,
    date: '2026-11-20',
    isCheckedByUser: true,
    ...overrides,
  };
}

function makeBill(overrides: Partial<NormalizedBill> = {}): NormalizedBill {
  return {
    billId: 'bill-test-1',
    isSynthetic: true,
    hospitalName: 'SYNTHETIC Horizon Care Hospital',
    patientName: 'Test Patient',
    billDate: '2026-11-20',
    statedTotalPaise: 250000,
    lineItems: [makeLineItem()],
    tpaDeductions: [],
    ...overrides,
  };
}

function makePriceRecord(overrides: Partial<ReferencePriceRecord> = {}): ReferencePriceRecord {
  return {
    id: 'ref-stent-des',
    category: 'stent',
    canonicalName: 'Coronary Drug Eluting Stent',
    matchAliases: ['DES Cardiac Stent', 'Drug Eluting Stent'],
    unit: 'unit',
    strengthOrSpec: 'DES',
    ceilingPricePaise: 3000000, // ₹30,000.00
    gstTreatment: '5% GST extra',
    sourceTitle: 'Synthetic Test Price Order',
    instrumentNumber: 'TEST-SO-001',
    instrumentDate: '2026-04-01',
    effectiveDate: '2026-04-01',
    validityEndDate: '2027-03-31',
    sourceFileHash: 'test-hash-001',
    provenancePageRow: 'Page 1, Row 2',
    verified: true,
    ...overrides,
  };
}

function makeExclusionRule(overrides: Partial<TpaExclusionRule> = {}): TpaExclusionRule {
  return {
    id: 'tpa-excl-gloves',
    canonicalName: 'Sterile Examination Gloves',
    matchAliases: ['Gloves', 'Disposable Gloves'],
    category: 'consumables',
    isStandardNonPayable: true,
    sourceTitle: 'Synthetic Test Non-Payable List',
    instrumentNumber: 'TEST-CIR-001',
    instrumentDate: '2020-06-11',
    effectiveDate: '2020-06-11',
    validityEndDate: null,
    sourceFileHash: 'test-hash-tpa',
    provenancePageRow: 'Annexure I, Row 5',
    verified: true,
    ...overrides,
  };
}

const emptyDataset: ReferenceDataset = {
  prices: [],
  tpaExclusions: [],
  sources: [],
};

describe('Pure Audit Rules Engine', () => {
  describe('Arithmetic Rule', () => {
    it('flags exact integer line multiplication mismatch as CONFIRMED', () => {
      const bill = makeBill({
        statedTotalPaise: 500000,
        lineItems: [
          makeLineItem({
            id: 'l1',
            quantity: 2,
            unitPricePaise: 200000,
            lineTotalPaise: 500000, // should be 400000
          }),
        ],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.tiers.CONFIRMED.count).toBe(1);
      expect(report.tiers.CONFIRMED.findings[0].ruleId).toBe('ARITHMETIC_LINE_MISMATCH');
      expect(report.tiers.CONFIRMED.findings[0].deltaPaise).toBe(100000);
      expect(report.reconcile.isReconciled).toBe(true);
    });

    it('allows 1-paise rounding tolerance for fractional quantities', () => {
      const bill = makeBill({
        statedTotalPaise: 166,
        lineItems: [
          makeLineItem({
            id: 'l1',
            quantity: 0.5,
            unitPricePaise: 333, // 0.5 * 333 = 166.5 -> 167; 166 is within 1 paise
            lineTotalPaise: 166,
          }),
        ],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      const arithFindings = report.tiers.CONFIRMED.findings.filter((f) =>
        f.ruleId.startsWith('ARITHMETIC_'),
      );
      expect(arithFindings).toHaveLength(0);
    });

    it('flags bill sum mismatch vs statedTotalPaise as CONFIRMED', () => {
      const bill = makeBill({
        statedTotalPaise: 300000,
        lineItems: [makeLineItem({ lineTotalPaise: 250000 })],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.reconcile.isReconciled).toBe(false);
      expect(report.reconcile.differencePaise).toBe(50000);
      expect(report.tiers.CONFIRMED.findings.some((f) => f.ruleId === 'ARITHMETIC_BILL_SUM_MISMATCH')).toBe(true);
    });

    it('handles empty lineItems with 0 statedTotalPaise cleanly', () => {
      const bill = makeBill({ statedTotalPaise: 0, lineItems: [] });
      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.reconcile.isReconciled).toBe(true);
      expect(report.coverage.totalLines).toBe(0);
    });
  });

  describe('Duplicate Line Rule', () => {
    it('flags duplicate normalized description + amount + same date as LIKELY (never CONFIRMED)', () => {
      const bill = makeBill({
        statedTotalPaise: 200000,
        lineItems: [
          makeLineItem({
            id: 'l1',
            rawDescription: 'Complete Blood Count (CBC)',
            normalizedName: 'Complete Blood Count CBC',
            category: 'diagnostics',
            unit: 'test',
            unitPricePaise: 100000,
            lineTotalPaise: 100000,
            date: '2026-11-20',
          }),
          makeLineItem({
            id: 'l2',
            rawDescription: 'complete blood count - cbc',
            normalizedName: 'complete blood count cbc',
            category: 'diagnostics',
            unit: 'test',
            unitPricePaise: 100000,
            lineTotalPaise: 100000,
            date: '2026-11-20',
          }),
        ],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.tiers.CONFIRMED.count).toBe(0);
      expect(report.tiers.LIKELY.count).toBe(1);
      expect(report.tiers.LIKELY.findings[0].ruleId).toBe('DUPLICATE_LINE_ITEM');
      expect(report.tiers.LIKELY.findings[0].lineItemId).toBe('l2');
    });

    it('flags duplicates when both dates are null', () => {
      const bill = makeBill({
        statedTotalPaise: 160000,
        lineItems: [
          makeLineItem({ id: 'l1', normalizedName: 'ECG', unitPricePaise: 80000, lineTotalPaise: 80000, date: null }),
          makeLineItem({ id: 'l2', normalizedName: 'ECG', unitPricePaise: 80000, lineTotalPaise: 80000, date: null }),
        ],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.tiers.LIKELY.count).toBe(1);
    });

    it('does NOT flag identical items billed on different dates or with zero total', () => {
      const bill = makeBill({
        statedTotalPaise: 500000,
        lineItems: [
          makeLineItem({ id: 'l1', date: '2026-11-19' }),
          makeLineItem({ id: 'l2', date: '2026-11-20' }),
          makeLineItem({ id: 'l3', unitPricePaise: 0, lineTotalPaise: 0, date: '2026-11-20' }),
          makeLineItem({ id: 'l4', unitPricePaise: 0, lineTotalPaise: 0, date: '2026-11-20' }),
        ],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.tiers.LIKELY.count).toBe(0);
    });
  });

  describe('Price-Order Comparison Rule', () => {
    it('emits CONFIRMED only when verified: true and within validity window', () => {
      const dataset: ReferenceDataset = {
        prices: [makePriceRecord({ verified: true })],
        tpaExclusions: [],
        sources: [],
      };
      const bill = makeBill({
        statedTotalPaise: 4800000,
        lineItems: [
          makeLineItem({
            id: 'stent-1',
            rawDescription: 'Drug Eluting Stent',
            normalizedName: 'Drug Eluting Stent',
            category: 'stent',
            unit: 'unit',
            strengthOrSpec: 'DES',
            unitPricePaise: 4800000,
            lineTotalPaise: 4800000,
          }),
        ],
      });

      const report = runAudit(bill, dataset, '2026-11-25');
      expect(report.tiers.CONFIRMED.count).toBe(1);
      expect(report.tiers.CONFIRMED.findings[0].unverifiedData).toBe(false);
      expect(report.tiers.CONFIRMED.findings[0].deltaPaise).toBe(1800000);
      expect(report.coverage.referenceCheckedCount).toBe(1);
    });

    it('MUST downgrade verified: false overcharge to LIKELY with unverifiedData: true', () => {
      const dataset: ReferenceDataset = {
        prices: [makePriceRecord({ verified: false })],
        tpaExclusions: [],
        sources: [],
      };
      const bill = makeBill({
        statedTotalPaise: 4800000,
        lineItems: [
          makeLineItem({
            id: 'stent-1',
            rawDescription: 'Drug Eluting Stent',
            normalizedName: 'Drug Eluting Stent',
            category: 'stent',
            unit: 'unit',
            strengthOrSpec: 'DES',
            unitPricePaise: 4800000,
            lineTotalPaise: 4800000,
          }),
        ],
      });

      const report = runAudit(bill, dataset, '2026-11-25');
      expect(report.tiers.CONFIRMED.count).toBe(0);
      expect(report.tiers.LIKELY.count).toBe(1);
      expect(report.tiers.LIKELY.findings[0].unverifiedData).toBe(true);
      expect(report.tiers.LIKELY.findings[0].ruleId).toBe('PRICE_ORDER_EXCEEDS_CEILING');
    });

    it('emits NOT_CHECKED when unit or strengthOrSpec does not match cleanly', () => {
      const dataset: ReferenceDataset = {
        prices: [makePriceRecord({ verified: true, unit: 'unit', strengthOrSpec: 'DES' })],
        tpaExclusions: [],
        sources: [],
      };
      const bill = makeBill({
        statedTotalPaise: 4800000,
        lineItems: [
          makeLineItem({
            id: 'stent-bms',
            rawDescription: 'Bare Metal Stent',
            normalizedName: 'Drug Eluting Stent',
            category: 'stent',
            unit: 'unit',
            strengthOrSpec: 'BMS', // mismatch
            unitPricePaise: 4800000,
            lineTotalPaise: 4800000,
          }),
        ],
      });

      const report = runAudit(bill, dataset, '2026-11-25');
      expect(report.tiers.CONFIRMED.count).toBe(0);
      expect(report.tiers.LIKELY.count).toBe(0);
      expect(report.tiers.NOT_CHECKED.count).toBe(1);
      expect(report.coverage.notCheckedCount).toBe(1);
    });

    it('emits NOT_CHECKED when bill date is outside validity range', () => {
      const dataset: ReferenceDataset = {
        prices: [
          makePriceRecord({
            verified: true,
            effectiveDate: '2026-04-01',
            validityEndDate: '2026-10-31',
          }),
        ],
        tpaExclusions: [],
        sources: [],
      };
      const bill = makeBill({
        billDate: '2026-11-20',
        statedTotalPaise: 4800000,
        lineItems: [
          makeLineItem({
            id: 'stent-1',
            normalizedName: 'Drug Eluting Stent',
            category: 'stent',
            unit: 'unit',
            strengthOrSpec: 'DES',
            unitPricePaise: 4800000,
            lineTotalPaise: 4800000,
            date: '2026-11-20',
          }),
        ],
      });

      const report = runAudit(bill, dataset, '2026-11-25');
      expect(report.tiers.CONFIRMED.count).toBe(0);
      expect(report.tiers.NOT_CHECKED.count).toBe(1);
      expect(report.tiers.NOT_CHECKED.findings[0].ruleId).toBe('PRICE_ORDER_OUT_OF_VALIDITY');
    });
  });

  describe('Pharmacy Lump-Sum Rule', () => {
    it('flags unitemized pharmacy lump-sum line as NEEDS_REVIEW', () => {
      const bill = makeBill({
        statedTotalPaise: 1850000,
        lineItems: [
          makeLineItem({
            id: 'pharm-1',
            rawDescription: 'Pharmacy & Ward Consumables Bulk',
            normalizedName: 'Pharmacy Bulk',
            category: 'pharmacy',
            quantity: 1,
            unit: 'lump_sum',
            strengthOrSpec: null,
            unitPricePaise: 1850000,
            lineTotalPaise: 1850000,
          }),
        ],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.tiers.NEEDS_REVIEW.count).toBe(1);
      expect(report.tiers.NEEDS_REVIEW.findings[0].ruleId).toBe('PHARMACY_LUMP_SUM');
      expect(report.tiers.NOT_CHECKED.count).toBe(0);
    });

    it('does NOT flag specific itemized medicines with strengthOrSpec', () => {
      const bill = makeBill({
        statedTotalPaise: 24000,
        lineItems: [
          makeLineItem({
            id: 'med-1',
            rawDescription: 'Paracetamol 650mg Tablet',
            normalizedName: 'Paracetamol',
            category: 'pharmacy',
            quantity: 2,
            unit: 'strip',
            strengthOrSpec: '650mg',
            unitPricePaise: 12000,
            lineTotalPaise: 24000,
          }),
        ],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.tiers.NEEDS_REVIEW.count).toBe(0);
    });
  });

  describe('TPA Deduction Review Rule', () => {
    it('emits VALID_EXCLUSION when matched to loaded non-payable rule', () => {
      const dataset: ReferenceDataset = {
        prices: [],
        tpaExclusions: [makeExclusionRule({ verified: true })],
        sources: [],
      };
      const bill = makeBill({
        statedTotalPaise: 0,
        lineItems: [],
        tpaDeductions: [
          {
            id: 'tpa-1',
            description: 'Disposable Gloves',
            claimedPaise: 120000,
            deductedPaise: 120000,
            reasonText: 'Non-payable consumable per IRDAI guidelines',
            category: 'consumables',
          },
        ],
      });

      const report = runAudit(bill, dataset, '2026-11-25');
      expect(report.tiers.VALID_EXCLUSION.count).toBe(1);
      expect(report.tiers.VALID_EXCLUSION.findings[0].ruleId).toBe('TPA_STANDARD_EXCLUSION');
    });

    it('emits NEEDS_REVIEW for vague "Reasonable & Customary" or empty reasonText', () => {
      const bill = makeBill({
        statedTotalPaise: 0,
        lineItems: [],
        tpaDeductions: [
          {
            id: 'tpa-1',
            description: 'Surgeon Fee',
            claimedPaise: 5000000,
            deductedPaise: 1500000,
            reasonText: 'Reasonable & Customary',
            category: 'doctor_fee',
          },
          {
            id: 'tpa-2',
            description: 'Assistant Fee',
            claimedPaise: 1000000,
            deductedPaise: 400000,
            reasonText: '',
            category: 'doctor_fee',
          },
        ],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.tiers.NEEDS_REVIEW.count).toBe(2);
    });

    it('emits NOT_CHECKED when no IRDAI circular annexure is loaded for non-vague deduction', () => {
      const bill = makeBill({
        statedTotalPaise: 0,
        lineItems: [],
        tpaDeductions: [
          {
            id: 'tpa-1',
            description: 'Admission Kit',
            claimedPaise: 50000,
            deductedPaise: 50000,
            reasonText: 'Non-payable item under Annexure I',
            category: 'consumables',
          },
        ],
      });

      const report = runAudit(bill, emptyDataset, '2026-11-25');
      expect(report.tiers.NOT_CHECKED.count).toBe(1);
      expect(report.tiers.NOT_CHECKED.findings[0].ruleId).toBe('TPA_NO_CIRCULAR_LOADED');
    });
  });

  describe('Contract & Language Guardrails', () => {
    it('AuditReport NEVER exposes a merged totalSavingsPaise property', () => {
      const report = runAudit(makeBill(), emptyDataset, '2026-11-25');
      expect('totalSavingsPaise' in report).toBe(false);
    });

    it('audit engine source files never contain prohibited words ("illegal", "fraud", "cheating")', () => {
      const auditDir = path.resolve(__dirname, '../lib/audit');
      const walk = (dir: string): string[] =>
        fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
          const full = path.join(dir, entry.name);
          return entry.isDirectory() ? walk(full) : [full];
        });

      const forbidden = ['illegal', 'fraud', 'cheating'];
      for (const file of walk(auditDir)) {
        const content = fs.readFileSync(file, 'utf8').toLowerCase();
        for (const word of forbidden) {
          expect(content, `${file} contains forbidden word "${word}"`).not.toContain(word);
        }
      }
    });
  });
});
