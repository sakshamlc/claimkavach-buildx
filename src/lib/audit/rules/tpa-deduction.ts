import { isDateInRange } from '@/lib/dates';
import { normalizeToken } from '@/lib/audit/normalize';
import type {
  AuditFinding,
  NormalizedBill,
  TpaExclusionRule,
} from '@/lib/schemas/audit';

const VAGUE_REASON_PATTERNS = [
  'reasonable and customary',
  'reasonable customary',
  'r c',
  'r and c',
  'customary charges',
  'as per policy terms',
  'as per norms',
  'disallowed',
  'deducted',
  'miscellaneous deduction',
  'not payable as per tpa',
];

export interface TpaCheckOutput {
  findings: AuditFinding[];
  notCheckedReasons: Array<{ lineId: string; reason: string }>;
}

function isVagueReason(reasonText: string): boolean {
  const norm = normalizeToken(reasonText);
  if (!norm || norm.length < 4) return true;
  if (norm === 'other' || norm === 'misc' || norm === 'na' || norm === 'none') {
    return true;
  }
  return VAGUE_REASON_PATTERNS.some((pattern) => norm === pattern || norm.includes(pattern));
}

function findMatchingExclusion(
  description: string,
  reasonText: string,
  rules: TpaExclusionRule[],
): TpaExclusionRule | null {
  const descNorm = normalizeToken(description);
  const reasonNorm = normalizeToken(reasonText);

  for (const rule of rules) {
    const canonical = normalizeToken(rule.canonicalName);
    const aliases = rule.matchAliases.map(normalizeToken);
    const candidates = [canonical, ...aliases];

    const matchesDesc = candidates.some(
      (c) => c.length > 0 && (descNorm === c || descNorm.includes(c)),
    );
    const matchesReason = candidates.some(
      (c) => c.length > 0 && (reasonNorm === c || reasonNorm.includes(c)),
    );

    if (matchesDesc || matchesReason) {
      return rule;
    }
  }

  return null;
}

/**
 * Pure TPA / Insurer Deduction Review Rule
 * ========================================
 * Reviews TPA deduction rows against loaded IRDAI/policy non-payable rules:
 * - Vague or unexplained deductions (e.g. "Reasonable & Customary" without
 *   calculation or clause breakdown) emit NEEDS_REVIEW.
 * - Deductions matching a loaded standard non-payable rule within validity
 *   dates emit VALID_EXCLUSION.
 * - When no IRDAI circular annexure is loaded (or no rule matches), emits
 *   NOT_CHECKED with a neutral, data-derived reason.
 */
export function checkTpaDeductions(
  bill: NormalizedBill,
  tpaExclusions: TpaExclusionRule[],
  referenceDateISO: string,
): TpaCheckOutput {
  const findings: AuditFinding[] = [];
  const notCheckedReasons: Array<{ lineId: string; reason: string }> = [];

  for (const deduction of bill.tpaDeductions) {
    if (isVagueReason(deduction.reasonText)) {
      findings.push({
        id: `tpa-vague-${deduction.id}`,
        ruleId: 'TPA_VAGUE_DEDUCTION',
        tier: 'NEEDS_REVIEW',
        lineItemId: deduction.id,
        titleKey: 'findingTpaVagueDeduction',
        summary: `Deduction of ${deduction.deductedPaise} paise on "${deduction.description}" cites a vague or incomplete reason ("${deduction.reasonText || 'none provided'}").`,
        billedPaise: deduction.deductedPaise,
        referencePaise: null,
        deltaPaise: deduction.deductedPaise,
        unverifiedData: false,
        evidence: {
          kind: 'tpa',
          formula: `Claimed ${deduction.claimedPaise} paise - Deducted ${deduction.deductedPaise} paise`,
          sourceTitle: null,
          instrumentNumber: null,
          instrumentDate: null,
          provenancePageRow: null,
          details: `Reason text "${deduction.reasonText || '(empty)'}" lacks a specific policy clause, itemization, or calculation benchmark.`,
        },
        recommendedAction:
          'Request a written clause-by-clause deduction sheet and calculation basis from the TPA or insurer grievance cell.',
      });
      continue;
    }

    if (tpaExclusions.length === 0) {
      const reason =
        'No IRDAI non-payable items circular is currently loaded to verify this deduction.';
      notCheckedReasons.push({ lineId: deduction.id, reason });
      findings.push({
        id: `tpa-not-checked-${deduction.id}`,
        ruleId: 'TPA_NO_CIRCULAR_LOADED',
        tier: 'NOT_CHECKED',
        lineItemId: deduction.id,
        titleKey: 'findingTpaNotCheckedNoData',
        summary: `Deduction on "${deduction.description}" was not verified: ${reason}`,
        billedPaise: deduction.deductedPaise,
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
          'Cross-check this deduction against your policy wordings and standard non-payable items annexure.',
      });
      continue;
    }

    const matchedRule = findMatchingExclusion(
      deduction.description,
      deduction.reasonText,
      tpaExclusions,
    );

    const checkDate = bill.billDate || referenceDateISO;
    if (
      matchedRule &&
      matchedRule.isStandardNonPayable &&
      isDateInRange(checkDate, matchedRule.effectiveDate, matchedRule.validityEndDate)
    ) {
      findings.push({
        id: `tpa-valid-${deduction.id}`,
        ruleId: 'TPA_STANDARD_EXCLUSION',
        tier: 'VALID_EXCLUSION',
        lineItemId: deduction.id,
        titleKey: 'findingTpaValidExclusion',
        summary: `Deduction on "${deduction.description}" (${deduction.deductedPaise} paise) matches standard non-payable item "${matchedRule.canonicalName}".`,
        billedPaise: deduction.deductedPaise,
        referencePaise: deduction.deductedPaise,
        deltaPaise: 0,
        unverifiedData: !matchedRule.verified,
        evidence: {
          kind: 'tpa',
          formula: `Standard non-payable deduction: ${deduction.deductedPaise} paise`,
          sourceTitle: matchedRule.sourceTitle,
          instrumentNumber: matchedRule.instrumentNumber,
          instrumentDate: matchedRule.instrumentDate,
          provenancePageRow: matchedRule.provenancePageRow,
          details: `Matched standard non-payable category "${matchedRule.canonicalName}" (${matchedRule.verified ? 'human-verified' : 'unverified draft record'}).`,
        },
        recommendedAction:
          'No dispute needed unless your policy explicitly includes a consumables cover rider.',
      });
      continue;
    }

    const reason =
      'Deduction reason does not match any loaded standard non-payable exclusion rule.';
    notCheckedReasons.push({ lineId: deduction.id, reason });
    findings.push({
      id: `tpa-not-checked-${deduction.id}`,
      ruleId: 'TPA_UNMATCHED_DEDUCTION',
      tier: 'NOT_CHECKED',
      lineItemId: deduction.id,
      titleKey: 'findingTpaNotCheckedUnmatched',
      summary: `Deduction on "${deduction.description}" was not verified: ${reason}`,
      billedPaise: deduction.deductedPaise,
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
        'Verify this item against your specific policy sub-limits and schedule of benefits.',
    });
  }

  return { findings, notCheckedReasons };
}
