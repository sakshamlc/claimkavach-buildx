import { formatINR } from '@/lib/currency';
import { normalizeToken } from '@/lib/audit/normalize';
import type { AuditFinding, NormalizedBill } from '@/lib/schemas/audit';

interface FirstOccurrence {
  rowNumber: number;
  rawDescription: string;
}

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
  const firstSeenByKey = new Map<string, FirstOccurrence>();

  for (let i = 0; i < bill.lineItems.length; i++) {
    const item = bill.lineItems[i];
    if (item.lineTotalPaise === 0) continue;

    const normDesc = normalizeToken(item.normalizedName || item.rawDescription);
    if (!normDesc) continue;

    const dateKey = item.date ?? 'MISSING_DATE';
    const compositeKey = `${normDesc}::${item.lineTotalPaise}::${dateKey}`;

    const first = firstSeenByKey.get(compositeKey);
    if (first === undefined) {
      firstSeenByKey.set(compositeKey, {
        rowNumber: i + 1,
        rawDescription: item.rawDescription,
      });
      continue;
    }

    const formattedAmount = formatINR(item.lineTotalPaise);
    const dateLabel = item.date ?? 'unspecified date';

    findings.push({
      id: `dup-${item.id}`,
      ruleId: 'DUPLICATE_LINE_ITEM',
      tier: 'LIKELY',
      lineItemId: item.id,
      titleKey: 'findingDuplicateLine',
      summary: `Possible duplicate charge for "${item.rawDescription}" (${formattedAmount}) matching an earlier charge on row #${first.rowNumber} ("${first.rawDescription}") on the same date.`,
      billedPaise: item.lineTotalPaise,
      referencePaise: item.lineTotalPaise,
      deltaPaise: item.lineTotalPaise,
      unverifiedData: false,
      evidence: {
        kind: 'duplicate',
        formula: `Matches row #${first.rowNumber}: normalized="${normDesc}", amount=${formattedAmount}, date=${dateLabel}`,
        sourceTitle: null,
        instrumentNumber: null,
        instrumentDate: null,
        provenancePageRow: null,
        details: `Identical description, amount (${formattedAmount}), and date (${dateLabel}) appeared earlier on row #${first.rowNumber} ("${first.rawDescription}"). Two administrations on the same date can occasionally be valid, so please confirm against clinical notes.`,
      },
      recommendedAction:
        'Confirm with the nursing chart or ward record whether this item was administered twice on the same date, or request removal of the repeated entry.',
    });
  }

  return findings;
}
