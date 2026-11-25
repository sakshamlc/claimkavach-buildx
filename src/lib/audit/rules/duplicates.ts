import { normalizeToken } from '@/lib/audit/normalize';
import type { AuditFinding, NormalizedBill } from '@/lib/schemas/audit';

/**
 * Pure Duplicate Line Detection Rule
 * ==================================
 * Detects repeated charges sharing normalized description + lineTotalPaise +
 * same date (or both missing date).
 *
 * Always emits LIKELY (never CONFIRMED), because two identical doses or tests
 * on the same day can legitimately occur and require human confirmation.
 */
export function checkDuplicates(bill: NormalizedBill): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const firstSeenByKey = new Map<string, string>();

  for (const item of bill.lineItems) {
    if (item.lineTotalPaise === 0) continue;

    const normDesc = normalizeToken(item.normalizedName || item.rawDescription);
    if (!normDesc) continue;

    const dateKey = item.date ?? 'MISSING_DATE';
    const compositeKey = `${normDesc}::${item.lineTotalPaise}::${dateKey}`;

    const firstId = firstSeenByKey.get(compositeKey);
    if (firstId === undefined) {
      firstSeenByKey.set(compositeKey, item.id);
      continue;
    }

    findings.push({
      id: `dup-${item.id}`,
      ruleId: 'DUPLICATE_LINE_ITEM',
      tier: 'LIKELY',
      lineItemId: item.id,
      titleKey: 'findingDuplicateLine',
      summary: `Possible duplicate charge for "${item.rawDescription}" (${item.lineTotalPaise} paise) matching earlier line ${firstId}.`,
      billedPaise: item.lineTotalPaise,
      referencePaise: item.lineTotalPaise,
      deltaPaise: item.lineTotalPaise,
      unverifiedData: false,
      evidence: {
        kind: 'duplicate',
        formula: `Matches line ${firstId}: normalized="${normDesc}", amount=${item.lineTotalPaise} paise, date=${dateKey}`,
        sourceTitle: null,
        instrumentNumber: null,
        instrumentDate: null,
        provenancePageRow: null,
        details: `Identical description, amount, and date (${dateKey}) appeared earlier on line ${firstId}. Two administrations on the same date can occasionally be valid, so please confirm against clinical notes.`,
      },
      recommendedAction:
        'Confirm with the nursing chart or ward record whether this item was administered twice on the same date, or request removal of the repeated entry.',
    });
  }

  return findings;
}
