import { formatINR } from '@/lib/currency';
import type { I18nKeys } from '@/lib/i18n';
import type { AuditFinding, AuditReport, NormalizedBill } from '@/lib/schemas/audit';

export type DisputeTabId =
  | 'hospital-query'
  | 'insurer-grievance'
  | 'grievance-portal'
  | 'ombudsman-draft';

export interface DisputeDraft {
  id: DisputeTabId;
  labelKey: I18nKeys;
  subject: string;
  body: string;
}

function formatFindingLine(finding: AuditFinding, index: number): string {
  const parts: string[] = [`${index + 1}. [${finding.tier}] ${finding.summary}`];
  if (finding.billedPaise !== null) {
    parts.push(`   - Billed: ${formatINR(finding.billedPaise)}`);
  }
  if (finding.referencePaise !== null) {
    parts.push(`   - Reference / Expected: ${formatINR(finding.referencePaise)}`);
  }
  if (finding.deltaPaise !== null) {
    parts.push(`   - Difference: ${formatINR(finding.deltaPaise)}`);
  }
  if (finding.evidence.instrumentNumber) {
    parts.push(
      `   - Reference Order: ${finding.evidence.instrumentNumber} (${finding.evidence.provenancePageRow ?? 'documented source'})`,
    );
  }
  if (finding.unverifiedData) {
    parts.push('   - Note: Reference record is marked unverified and needs counter-checking.');
  }
  parts.push(`   - Request: ${finding.recommendedAction}`);
  return parts.join('\n');
}

function buildFindingsBlock(report: AuditReport): string {
  const relevant: AuditFinding[] = [
    ...report.tiers.CONFIRMED.findings,
    ...report.tiers.LIKELY.findings,
    ...report.tiers.NEEDS_REVIEW.findings,
  ];

  if (relevant.length === 0) {
    return 'No billing discrepancies or lump-sum review items were flagged in this summary.';
  }

  return relevant.map((f, idx) => formatFindingLine(f, idx)).join('\n\n');
}

/**
 * Generates 4 polite, factual dispute drafts strictly from verified figures
 * in `NormalizedBill` and `AuditReport`.
 *
 * Safety guardrails:
 * - Uses explicit `[FILL IN: ...]` placeholders for missing user identifiers.
 * - Never invents statutory deadlines, legal sections, or fault accusations.
 */
export function buildDisputeDrafts(
  bill: NormalizedBill,
  report: AuditReport,
): DisputeDraft[] {
  const statedTotal = formatINR(report.reconcile.statedTotalPaise);
  const computedSum = formatINR(report.reconcile.computedSumPaise);
  const reconcileDiff = formatINR(report.reconcile.differencePaise);
  const findingsBlock = buildFindingsBlock(report);
  const validExclusions = report.tiers.VALID_EXCLUSION.findings;

  const billHeader = [
    `Hospital: ${bill.hospitalName}`,
    `Patient Name: ${bill.patientName}`,
    `Bill Date: ${bill.billDate}`,
    `Bill / Reference ID: ${bill.billId}`,
    `Claim / UHID Number: [FILL IN: Claim/UHID Number]`,
    `Policy Number: [FILL IN: Policy Number]`,
    `Stated Bill Total: ${statedTotal} (Sum of extracted lines: ${computedSum}; Difference: ${reconcileDiff})`,
  ].join('\n');

  const hospitalBody = [
    'To,',
    'The Billing Manager / Medical Superintendent,',
    bill.hospitalName,
    '',
    `Subject: Polite Request for Itemized Clarification on Hospital Bill (${bill.billDate})`,
    '',
    'Dear Sir / Madam,',
    '',
    'Thank you for the care provided to the patient. While reviewing the discharge bill prior to final settlement, we noted a few line items where we would appreciate a written itemized clarification or revised calculation:',
    '',
    billHeader,
    '',
    'Items Requiring Clarification:',
    findingsBlock,
    '',
    'Kindly provide an itemized breakup (including batch/MRP details for bulk pharmacy or consumables rows, if any) and confirm the verified figures at the billing counter.',
    '',
    'Sincerely,',
    '[FILL IN: Attendant / Family Member Name]',
    'Contact: [FILL IN: Patient Contact]',
  ].join('\n');

  const insurerExclusionsNote =
    validExclusions.length > 0
      ? `\nNote on Standard Exclusions Reviewed (${validExclusions.length} item(s)):\n${validExclusions
          .map((e, i) => `${i + 1}. ${e.summary} (Billed: ${e.billedPaise !== null ? formatINR(e.billedPaise) : 'N/A'})`)
          .join('\n')}\n`
      : '';

  const insurerBody = [
    'To,',
    'The Grievance Redressal Officer,',
    '[FILL IN: Insurance Company / TPA Name]',
    '',
    `Subject: Request for Claim Review & Deduction Clarification — Policy [FILL IN: Policy Number]`,
    '',
    'Dear Grievance Redressal Officer,',
    '',
    'I am writing to respectfully request a detailed review and written clause-by-clause explanation for the billing/deduction items listed below in connection with our hospitalization claim:',
    '',
    billHeader,
    '',
    'Items Highlighted for Review:',
    findingsBlock,
    insurerExclusionsNote,
    'Kindly share the specific policy schedule clause and itemized calculation worksheet supporting each deduction or variance, and review any eligible payable amounts.',
    '',
    'Enclosed: Copy of Final Hospital Bill, Discharge Summary, and TPA Settlement / Deduction Sheet.',
    '',
    'Thank you,',
    '[FILL IN: Proposer / Patient Name]',
    'Policy Number: [FILL IN: Policy Number]',
    'Claim / UHID Number: [FILL IN: Claim/UHID Number]',
    'Contact: [FILL IN: Patient Contact]',
  ].join('\n');

  const portalBody = [
    'CLAIM CLARIFICATION SUMMARY (PORTAL SUBMISSION)',
    '---------------------------------------------',
    `Policy Number: [FILL IN: Policy Number]`,
    `Claim / UHID Number: [FILL IN: Claim/UHID Number]`,
    `Insurer / TPA: [FILL IN: Insurance Company / TPA Name]`,
    `Hospital & Date: ${bill.hospitalName} (${bill.billDate})`,
    `Stated Bill Total: ${statedTotal} | Extracted Line Sum: ${computedSum}`,
    `Coverage Summary: Arithmetic checked on ${report.coverage.arithmeticCheckedCount} of ${report.coverage.totalLines} lines; Reference checked on ${report.coverage.referenceCheckedCount} of ${report.coverage.totalLines} lines; Not checked: ${report.coverage.notCheckedCount} items.`,
    '',
    'Key Points for Review:',
    findingsBlock,
    '',
    'Requested Action: Please provide a written itemized calculation / policy clause explanation and review the flagged items.',
    'Applicant Contact: [FILL IN: Patient Contact]',
  ].join('\n');

  const ombudsmanBody = [
    'To,',
    'The Office of the Insurance Ombudsman,',
    '[FILL IN: Ombudsman Office City / Region]',
    '',
    `Subject: Representation Regarding Unresolved Claim / Deduction Review — Policy [FILL IN: Policy Number]`,
    '',
    'Respected Sir / Madam,',
    '',
    'I respectfully submit this representation following our earlier written query to the insurer grievance cell, as the items below remain unresolved:',
    '',
    billHeader,
    `Prior Insurer Grievance Reference: [FILL IN: Insurer Grievance Reference No. & Date]`,
    '',
    'Summary of Disputed / Unclear Items:',
    findingsBlock,
    '',
    'We respectfully request an impartial review of the attached hospital bill, policy schedule, and insurer deduction sheet.',
    '',
    'Attachments: [FILL IN: List Attached Documents]',
    '',
    'Yours faithfully,',
    '[FILL IN: Complainant Name]',
    'Contact: [FILL IN: Patient Contact]',
  ].join('\n');

  return [
    {
      id: 'hospital-query',
      labelKey: 'disputeHospitalQuery',
      subject: `Billing Clarification Request — ${bill.hospitalName}`,
      body: hospitalBody,
    },
    {
      id: 'insurer-grievance',
      labelKey: 'disputeInsurerGrievance',
      subject: `Claim Review Request — [FILL IN: Policy Number]`,
      body: insurerBody,
    },
    {
      id: 'grievance-portal',
      labelKey: 'disputeBimaBharosa',
      subject: `Grievance Portal Summary — [FILL IN: Claim/UHID Number]`,
      body: portalBody,
    },
    {
      id: 'ombudsman-draft',
      labelKey: 'disputeOmbudsman',
      subject: `Ombudsman Representation — [FILL IN: Policy Number]`,
      body: ombudsmanBody,
    },
  ];
}
