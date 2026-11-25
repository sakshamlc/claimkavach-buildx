/**
 * ClaimKavach i18n — English strings
 * Every key MUST exist in both en.ts and hi.ts (enforced by Vitest parity test).
 */
const en = {
  // App
  appName: 'ClaimKavach',
  appTagline: 'Your Hospital Bill Auditor',
  appDescription: 'AI reads your bill. Deterministic rules judge it. You stay in control.',

  // Privacy
  privacyNotice: 'We store nothing. Your file is sent to Google Gemini only to read the text; the audit runs locally in your browser.',
  privacyConsent: 'I understand and agree to continue',
  privacyLearnMore: 'Learn more about our privacy model',

  // Navigation
  stepUpload: 'Upload',
  stepVerify: 'Verify',
  stepReport: 'Report',

  // Landing
  landingTitle: 'Understand Your Hospital Bill Before You Pay',
  landingSubtitle: 'ClaimKavach checks your hospital bill against government price lists and arithmetic — so you can ask the right questions at the billing counter.',
  ctaUpload: 'Upload Your Bill',
  ctaDemo: 'Try a Demo Bill (No Upload Needed)',
  demoStripTitle: 'Try Synthetic Demo Bills',
  demoStripSubtitle: 'See ClaimKavach in action with pre-built sample bills',
  demoScenarioA: 'Stent Overcharge + Duplicate + Lump Sum',
  demoScenarioB: 'TPA / Insurer Deduction Review',
  demoScenarioC: 'Clean Bill (Zero False Positives)',
  syntheticBadge: 'SYNTHETIC',

  // Upload
  uploadTitle: 'Upload Your Hospital Bill',
  uploadDragDrop: 'Drag and drop your bill here, or click to browse',
  uploadFormats: 'Supported: PDF, JPG, PNG (max 10 MB)',
  uploadProcessing: 'Reading your bill...',

  // Verify
  verifyTitle: 'Verify Extracted Line Items',
  verifySubtitle: 'Review what was extracted from your bill. Edit any incorrect values before running the audit.',
  reconcileBarLabel: 'Reconcile',
  reconcileExtractedSum: 'Extracted sum of lines',
  reconcileBillTotal: 'Stated bill total',
  reconcileMatch: 'Totals match',
  reconcileDiscrepancy: 'Discrepancy detected',
  verifyConfirmToggle: 'I checked this',
  verifyRunAudit: 'Run Audit',

  // Report
  reportTitle: 'Audit Report',
  reportCoverageTitle: 'Coverage Summary',
  reportArithmeticChecked: 'Arithmetic Checked',
  reportReferenceChecked: 'Reference Checked',
  reportNotChecked: 'Not Checked',
  reportNotCheckedReason: 'Reason',
  reportEvidencePanel: 'Evidence',
  reportSourceOrder: 'Source Order No.',
  reportUnverifiedBadge: 'Unverified Data',
  reportVerifiedBadge: 'Verified Data',

  // Verdict Tiers
  verdictConfirmed: 'Confirmed Issue',
  verdictLikely: 'Likely Issue',
  verdictNeedsReview: 'Needs Review',
  verdictValidExclusion: 'Valid / Standard',
  verdictNotChecked: 'Not Checked',

  // Dispute Pack
  disputeTitle: 'Dispute Draft Pack',
  disputeSubtitle: 'Polite, copy-ready drafts for different escalation paths. Replace [BLANK] placeholders with your details.',
  disputeHospitalQuery: 'Hospital Billing Query',
  disputeInsurerGrievance: 'Insurer Grievance Officer',
  disputeBimaBharosa: 'Bima Bharosa Portal',
  disputeOmbudsman: 'Insurance Ombudsman',
  disputeVerifyChecklist: 'Before sending, please verify:',
  disputeCopyButton: 'Copy to Clipboard',
  disputeCopied: 'Copied!',

  // Educational Disclaimer
  disclaimer: 'ClaimKavach is an educational verification tool. It is NOT legal or medical advice. Always consult a qualified professional before making decisions based on this analysis.',

  // Errors
  errorFileTooLarge: 'File exceeds 10 MB limit. Please compress or split your bill.',
  errorUnsupportedFormat: 'Unsupported file format. Please use PDF, JPG, or PNG.',
  errorExtractionFailed: 'Could not read the bill. Please try a clearer image or PDF.',
  errorGeneric: 'Something went wrong. Please try again.',

  // Misc
  of: 'of',
  items: 'items',
  close: 'Close',
  back: 'Back',
  next: 'Next',
  loading: 'Loading...',
  listenButton: 'Listen',
  listenWarning: 'May use online speech service if no on-device voice is available.',
  languageToggle: 'हिंदी',
} as const;

export type I18nKeys = keyof typeof en;
export default en;
