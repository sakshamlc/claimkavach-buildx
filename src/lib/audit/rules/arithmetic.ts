import { addPaise, formatINR, multiplyPaise, subtractPaise } from '@/lib/currency';
import type { AuditFinding, NormalizedBill } from '@/lib/schemas/audit';

export interface ArithmeticCheckOutput {
  findings: AuditFinding[];
  reconcile: {
    statedTotalPaise: number;
    computedSumPaise: number;
    differencePaise: number;
    isReconciled: boolean;
  };
  arithmeticCheckedCount: number;
}

/**
 * Pure Arithmetic Check Rule
 * ==========================
 * 1. Verifies each line item: multiplyPaise(unitPricePaise, quantity) vs lineTotalPaise.
 *    Allows 1-paise rounding tolerance ONLY when quantity is fractional.
 * 2. Verifies bill total: sum(lineTotalPaise) vs statedTotalPaise.
 *
 * Pure arithmetic discrepancies emit CONFIRMED with exact math evidence.
 */
export function checkArithmetic(bill: NormalizedBill): ArithmeticCheckOutput {
  const findings: AuditFinding[] = [];
  const lineTotals: number[] = [];

  for (let i = 0; i < bill.lineItems.length; i++) {
    const item = bill.lineItems[i];
    lineTotals.push(item.lineTotalPaise);

    const expected = multiplyPaise(item.unitPricePaise, item.quantity);
    const diff = subtractPaise(item.lineTotalPaise, expected);
    const tolerance = Number.isInteger(item.quantity) ? 0 : 1;

    if (Math.abs(diff) > tolerance) {
      findings.push({
        id: `arith-line-${item.id}`,
        ruleId: 'ARITHMETIC_LINE_MISMATCH',
        tier: 'CONFIRMED',
        lineItemId: item.id,
        titleKey: 'findingArithmeticLineMismatch',
        summary: `Line total (${formatINR(item.lineTotalPaise)}) differs from ${item.quantity} × ${formatINR(item.unitPricePaise)} (${formatINR(expected)}) for "${item.rawDescription}".`,
        billedPaise: item.lineTotalPaise,
        referencePaise: expected,
        deltaPaise: diff,
        unverifiedData: false,
        evidence: {
          kind: 'arithmetic',
          formula: `${item.quantity} × ${formatINR(item.unitPricePaise)} = ${formatINR(expected)} (billed ${formatINR(item.lineTotalPaise)}; difference ${formatINR(diff)})`,
          sourceTitle: null,
          instrumentNumber: null,
          instrumentDate: null,
          provenancePageRow: null,
          details: `Exact arithmetic check on "${item.rawDescription}" shows a ${formatINR(diff)} discrepancy.`,
        },
        recommendedAction:
          'Ask the billing desk to verify the quantity, unit rate, and line multiplication on this row.',
      });
    }
  }

  const computedSumPaise = addPaise(...lineTotals);
  const differencePaise = subtractPaise(bill.statedTotalPaise, computedSumPaise);
  const isReconciled = differencePaise === 0;

  if (!isReconciled) {
    findings.push({
      id: `arith-bill-sum-${bill.billId}`,
      ruleId: 'ARITHMETIC_BILL_SUM_MISMATCH',
      tier: 'CONFIRMED',
      lineItemId: null,
      titleKey: 'findingArithmeticBillSumMismatch',
      summary: `Stated bill total (${formatINR(bill.statedTotalPaise)}) does not equal sum of extracted lines (${formatINR(computedSumPaise)}).`,
      billedPaise: bill.statedTotalPaise,
      referencePaise: computedSumPaise,
      deltaPaise: differencePaise,
      unverifiedData: false,
      evidence: {
        kind: 'arithmetic',
        formula: `Stated total ${formatINR(bill.statedTotalPaise)} − sum of lines ${formatINR(computedSumPaise)} = ${formatINR(differencePaise)}`,
        sourceTitle: null,
        instrumentNumber: null,
        instrumentDate: null,
        provenancePageRow: null,
        details: `Sum of ${bill.lineItems.length} extracted line items is ${formatINR(computedSumPaise)}, compared against stated bill total of ${formatINR(bill.statedTotalPaise)}.`,
      },
      recommendedAction:
        'Check whether any discount, tax, advance payment, or missing page accounts for the difference in the final bill total.',
    });
  }

  return {
    findings,
    reconcile: {
      statedTotalPaise: bill.statedTotalPaise,
      computedSumPaise,
      differencePaise,
      isReconciled,
    },
    arithmeticCheckedCount: bill.lineItems.length,
  };
}
