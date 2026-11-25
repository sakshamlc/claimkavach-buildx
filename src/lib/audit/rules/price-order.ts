import { multiplyPaise, subtractPaise } from '@/lib/currency';
import { isDateInRange } from '@/lib/dates';
import { normalizeToken } from '@/lib/audit/normalize';
import type {
  AuditFinding,
  BillLineItem,
  NormalizedBill,
  ReferencePriceRecord,
} from '@/lib/schemas/audit';

export interface PriceOrderCheckOutput {
  findings: AuditFinding[];
  referenceCheckedCount: number;
  notCheckedReasons: Array<{ lineId: string; reason: string }>;
}

function findMatchingReferenceRecord(
  item: BillLineItem,
  prices: ReferencePriceRecord[],
): ReferencePriceRecord | null {
  if (item.strengthOrSpec === null) {
    return null;
  }

  const itemName = normalizeToken(item.normalizedName);
  const itemUnit = normalizeToken(item.unit);
  const itemSpec = normalizeToken(item.strengthOrSpec);

  for (const record of prices) {
    if (record.category !== item.category) continue;
    if (normalizeToken(record.unit) !== itemUnit) continue;
    if (normalizeToken(record.strengthOrSpec) !== itemSpec) continue;

    const canonicalMatch = normalizeToken(record.canonicalName) === itemName;
    const aliasMatch = record.matchAliases.some(
      (alias) => normalizeToken(alias) === itemName,
    );

    if (canonicalMatch || aliasMatch) {
      return record;
    }
  }

  return null;
}

/**
 * Pure Price-Order Comparison Rule
 * ================================
 * Compares bill line items against loaded ReferencePriceRecord[] ONLY when
 * category, unit, strength/spec, and item name match cleanly.
 *
 * CRITICAL SAFETY INVARIANT:
 * - Only `record.verified === true` within `[effectiveDate, validityEndDate]`
 *   may emit `CONFIRMED`.
 * - Any match backed by `record.verified === false` MUST downgrade to `LIKELY`
 *   with `unverifiedData: true`.
 * - Missing reference categories or unmatched specifications emit `NOT_CHECKED`
 *   with a neutral, data-derived reason.
 */
export function checkPriceOrders(
  bill: NormalizedBill,
  prices: ReferencePriceRecord[],
  referenceDateISO: string,
  skipLineIds: ReadonlySet<string>,
): PriceOrderCheckOutput {
  const findings: AuditFinding[] = [];
  const notCheckedReasons: Array<{ lineId: string; reason: string }> = [];
  let referenceCheckedCount = 0;

  for (const item of bill.lineItems) {
    if (skipLineIds.has(item.id)) {
      continue;
    }

    const categoryHasRecords = prices.some((r) => r.category === item.category);
    if (!categoryHasRecords) {
      const reason = `No verified reference price list is loaded for category '${item.category}'.`;
      notCheckedReasons.push({ lineId: item.id, reason });
      findings.push({
        id: `not-checked-${item.id}`,
        ruleId: 'PRICE_ORDER_NO_CATEGORY_DATA',
        tier: 'NOT_CHECKED',
        lineItemId: item.id,
        titleKey: 'findingNotCheckedNoCategory',
        summary: `"${item.rawDescription}" was not price-checked: ${reason}`,
        billedPaise: item.lineTotalPaise,
        referencePaise: null,
        deltaPaise: null,
        unverifiedData: false,
        evidence: {
          kind: 'not_checked',
          formula: null,
          sourceTitle: null,
          instrumentNumber: null,
          instrumentDate: null,
          provenancePageRow: null,
          details: reason,
        },
        recommendedAction:
          'Verify this rate against your hospital schedule of charges or insurer package tariff.',
      });
      continue;
    }

    const matched = findMatchingReferenceRecord(item, prices);
    if (!matched) {
      const reason =
        item.strengthOrSpec === null
          ? `Missing strength/specification on "${item.rawDescription}" for exact reference comparison.`
          : `No matching reference entry for '${item.normalizedName}' with unit '${item.unit}' and spec '${item.strengthOrSpec}'.`;

      notCheckedReasons.push({ lineId: item.id, reason });
      findings.push({
        id: `not-checked-${item.id}`,
        ruleId: 'PRICE_ORDER_NO_EXACT_MATCH',
        tier: 'NOT_CHECKED',
        lineItemId: item.id,
        titleKey: 'findingNotCheckedNoMatch',
        summary: `"${item.rawDescription}" was not price-checked: ${reason}`,
        billedPaise: item.lineTotalPaise,
        referencePaise: null,
        deltaPaise: null,
        unverifiedData: false,
        evidence: {
          kind: 'not_checked',
          formula: null,
          sourceTitle: null,
          instrumentNumber: null,
          instrumentDate: null,
          provenancePageRow: null,
          details: reason,
        },
        recommendedAction:
          'Confirm the exact specification, brand, or MRP/schedule rate on the invoice or implant sticker.',
      });
      continue;
    }

    const effectiveCheckDate = item.date ?? bill.billDate ?? referenceDateISO;
    const inValidityWindow = isDateInRange(
      effectiveCheckDate,
      matched.effectiveDate,
      matched.validityEndDate,
    );

    if (!inValidityWindow) {
      const reason = `Reference order ${matched.instrumentNumber} (effective ${matched.effectiveDate}${matched.validityEndDate ? ` to ${matched.validityEndDate}` : ''}) does not cover date ${effectiveCheckDate}.`;
      notCheckedReasons.push({ lineId: item.id, reason });
      findings.push({
        id: `not-checked-${item.id}`,
        ruleId: 'PRICE_ORDER_OUT_OF_VALIDITY',
        tier: 'NOT_CHECKED',
        lineItemId: item.id,
        titleKey: 'findingNotCheckedOutOfDate',
        summary: `"${item.rawDescription}" was not price-checked: ${reason}`,
        billedPaise: item.lineTotalPaise,
        referencePaise: null,
        deltaPaise: null,
        unverifiedData: !matched.verified,
        evidence: {
          kind: 'not_checked',
          formula: null,
          sourceTitle: matched.sourceTitle,
          instrumentNumber: matched.instrumentNumber,
          instrumentDate: matched.instrumentDate,
          provenancePageRow: matched.provenancePageRow,
          details: reason,
        },
        recommendedAction:
          'Check the applicable price ceiling notification effective on the date of procedure.',
      });
      continue;
    }

    referenceCheckedCount += 1;

    if (item.unitPricePaise > matched.ceilingPricePaise) {
      const unitDiffPaise = subtractPaise(item.unitPricePaise, matched.ceilingPricePaise);
      const totalDeltaPaise = multiplyPaise(unitDiffPaise, item.quantity);
      const tier = matched.verified ? 'CONFIRMED' : 'LIKELY';
      const unverifiedData = !matched.verified;

      findings.push({
        id: `price-order-${item.id}`,
        ruleId: 'PRICE_ORDER_EXCEEDS_CEILING',
        tier,
        lineItemId: item.id,
        titleKey: matched.verified
          ? 'findingPriceExceedsConfirmed'
          : 'findingPriceExceedsUnverified',
        summary: `Unit price (${item.unitPricePaise} paise) for "${item.rawDescription}" exceeds listed ceiling (${matched.ceilingPricePaise} paise) in ${matched.instrumentNumber}.`,
        billedPaise: item.lineTotalPaise,
        referencePaise: multiplyPaise(matched.ceilingPricePaise, item.quantity),
        deltaPaise: totalDeltaPaise,
        unverifiedData,
        evidence: {
          kind: 'reference',
          formula: `(${item.unitPricePaise} - ${matched.ceilingPricePaise}) × ${item.quantity} = ${totalDeltaPaise} paise above listed ceiling (${matched.gstTreatment})`,
          sourceTitle: matched.sourceTitle,
          instrumentNumber: matched.instrumentNumber,
          instrumentDate: matched.instrumentDate,
          provenancePageRow: matched.provenancePageRow,
          details: `Matched "${matched.canonicalName}" (${matched.strengthOrSpec}, unit: ${matched.unit}). GST treatment: ${matched.gstTreatment}. Verification status: ${matched.verified ? 'human-verified' : 'unverified draft record'}.`,
        },
        recommendedAction:
          'Request the hospital billing desk to clarify the unit price against the applicable ceiling notification and GST treatment.',
      });
    }
  }

  return {
    findings,
    referenceCheckedCount,
    notCheckedReasons,
  };
}
