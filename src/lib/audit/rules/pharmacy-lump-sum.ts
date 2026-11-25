import { formatINR } from '@/lib/currency';
import { normalizeToken } from '@/lib/audit/normalize';
import type { AuditFinding, NormalizedBill } from '@/lib/schemas/audit';

const LUMP_SUM_KEYWORDS = [
  'pharmacy',
  'medicines',
  'medicine',
  'consumables',
  'consumable',
  'bulk',
  'misc pharmacy',
  'ward consumables',
  'ot consumables',
  'surgical consumables',
  'medical supplies',
];

const LUMP_SUM_THRESHOLD_PAISE = 100000; // ₹1,000.00

export interface LumpSumCheckOutput {
  findings: AuditFinding[];
  flaggedLineIds: Set<string>;
}

/**
 * Pure Pharmacy / Consumables Lump-Sum Rule
 * =========================================
 * Flags unitemized bulk pharmacy or consumables rows (e.g. "Pharmacy Charges"
 * with qty 1, lump_sum unit or missing drug specification, and significant cost)
 * as NEEDS_REVIEW so the family can request a detailed itemized breakup.
 */
export function checkPharmacyLumpSums(bill: NormalizedBill): LumpSumCheckOutput {
  const findings: AuditFinding[] = [];
  const flaggedLineIds = new Set<string>();

  for (const item of bill.lineItems) {
    if (item.category !== 'pharmacy' && item.category !== 'consumables') {
      continue;
    }
    if (item.lineTotalPaise <= 0) {
      continue;
    }

    const unitNorm = normalizeToken(item.unit);
    const descNorm = normalizeToken(`${item.rawDescription} ${item.normalizedName}`);
    const hasLumpSumKeyword = LUMP_SUM_KEYWORDS.some((kw) => descNorm.includes(kw));

    const isExplicitLumpSum = unitNorm === 'lump sum' || unitNorm === 'lump_sum';
    const isImplicitBulk =
      item.quantity === 1 &&
      item.strengthOrSpec === null &&
      item.lineTotalPaise >= LUMP_SUM_THRESHOLD_PAISE &&
      hasLumpSumKeyword;

    if (!isExplicitLumpSum && !isImplicitBulk) {
      continue;
    }

    flaggedLineIds.add(item.id);
    findings.push({
      id: `lump-sum-${item.id}`,
      ruleId: 'PHARMACY_LUMP_SUM',
      tier: 'NEEDS_REVIEW',
      lineItemId: item.id,
      titleKey: 'findingPharmacyLumpSum',
      summary: `Unitemized lump-sum charge "${item.rawDescription}" (${formatINR(item.lineTotalPaise)}) requires an itemized pharmacy/consumables breakup.`,
      billedPaise: item.lineTotalPaise,
      referencePaise: null,
      deltaPaise: null,
      unverifiedData: false,
      evidence: {
        kind: 'lump_sum',
        formula: null,
        sourceTitle: null,
        instrumentNumber: null,
        instrumentDate: null,
        provenancePageRow: null,
        details: `Category "${item.category}" billed as a single bulk line (qty ${item.quantity}, unit "${item.unit}") without individual item names, quantities, or MRP breakdown.`,
      },
      recommendedAction:
        'Request an itemized pharmacy and consumables breakup listing each medicine/item, quantity, batch number, and printed MRP.',
    });
  }

  return { findings, flaggedLineIds };
}
