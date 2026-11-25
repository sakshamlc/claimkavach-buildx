import { describe, it, expect } from 'vitest';
import { runAudit } from '@/lib/audit';
import { DEFAULT_REFERENCE_DATASET } from '@/lib/reference/dataset';
import {
  SYNTHETIC_BILL_A,
  SYNTHETIC_BILL_B,
  SYNTHETIC_BILL_C,
  SYNTHETIC_TEST_DATASET,
} from '@/test/golden-bills-data';

describe('Audit Engine Determinism', () => {
  it('returns byte-identical JSON across repeated runs on all golden bills', () => {
    const bills = [SYNTHETIC_BILL_A, SYNTHETIC_BILL_B, SYNTHETIC_BILL_C];
    const datasets = [DEFAULT_REFERENCE_DATASET, SYNTHETIC_TEST_DATASET];

    for (const dataset of datasets) {
      for (const bill of bills) {
        const firstRun = JSON.stringify(runAudit(bill, dataset, '2026-11-25'));
        const secondRun = JSON.stringify(runAudit(bill, dataset, '2026-11-25'));
        expect(secondRun).toBe(firstRun);
      }
    }
  });
});
