import { z } from 'zod';
import { isValidISODate } from '@/lib/dates';

/**
 * Strict Zod Schemas & TypeScript Contracts for ClaimKavach Audit Pipeline
 * ========================================================================
 * - All currency values are safe integer paise.
 * - All dates are calendar-valid ISO YYYY-MM-DD strings.
 * - No single merged "totalSavingsPaise" exists on AuditReport.
 */

export const ISODateSchema = z
  .string()
  .refine(isValidISODate, { message: 'Must be a valid calendar ISO YYYY-MM-DD date' });

export const PaiseSchema = z
  .number()
  .refine(Number.isSafeInteger, { message: 'Monetary amount must be a safe integer in paise' });

export const NonNegativePaiseSchema = PaiseSchema.refine((val) => val >= 0, {
  message: 'Monetary amount must be non-negative paise',
});

export const LineCategorySchema = z.enum([
  'stent',
  'implant',
  'pharmacy',
  'consumables',
  'room_rent',
  'diagnostics',
  'procedure',
  'doctor_fee',
  'other',
]);

export type LineCategory = z.infer<typeof LineCategorySchema>;

export const BillLineItemSchema = z.object({
  id: z.string().min(1),
  rawDescription: z.string().min(1),
  normalizedName: z.string().min(1),
  category: LineCategorySchema,
  quantity: z.number().finite().positive(),
  unit: z.string().min(1),
  strengthOrSpec: z.string().nullable(),
  unitPricePaise: NonNegativePaiseSchema,
  lineTotalPaise: NonNegativePaiseSchema,
  date: ISODateSchema.nullable(),
  isCheckedByUser: z.boolean(),
});

export type BillLineItem = z.infer<typeof BillLineItemSchema>;

export const TpaDeductionItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  claimedPaise: NonNegativePaiseSchema,
  deductedPaise: NonNegativePaiseSchema,
  reasonText: z.string(),
  category: z.string().min(1),
});

export type TpaDeductionItem = z.infer<typeof TpaDeductionItemSchema>;

export const NormalizedBillSchema = z.object({
  billId: z.string().min(1),
  isSynthetic: z.boolean(),
  hospitalName: z.string().min(1),
  patientName: z.string().min(1),
  billDate: ISODateSchema,
  statedTotalPaise: NonNegativePaiseSchema,
  lineItems: z.array(BillLineItemSchema),
  tpaDeductions: z.array(TpaDeductionItemSchema),
});

export type NormalizedBill = z.infer<typeof NormalizedBillSchema>;

export const ReferencePriceRecordSchema = z.object({
  id: z.string().min(1),
  category: LineCategorySchema,
  canonicalName: z.string().min(1),
  matchAliases: z.array(z.string().min(1)),
  unit: z.string().min(1),
  strengthOrSpec: z.string().min(1),
  ceilingPricePaise: NonNegativePaiseSchema,
  gstTreatment: z.string().min(1),
  sourceTitle: z.string().min(1),
  instrumentNumber: z.string().min(1),
  instrumentDate: ISODateSchema,
  effectiveDate: ISODateSchema,
  validityEndDate: ISODateSchema.nullable(),
  sourceFileHash: z.string().min(1),
  provenancePageRow: z.string().min(1),
  verified: z.boolean(),
});

export type ReferencePriceRecord = z.infer<typeof ReferencePriceRecordSchema>;

export const TpaExclusionRuleSchema = z.object({
  id: z.string().min(1),
  canonicalName: z.string().min(1),
  matchAliases: z.array(z.string().min(1)),
  category: z.string().min(1),
  isStandardNonPayable: z.boolean(),
  sourceTitle: z.string().min(1),
  instrumentNumber: z.string().min(1),
  instrumentDate: ISODateSchema,
  effectiveDate: ISODateSchema,
  validityEndDate: ISODateSchema.nullable(),
  sourceFileHash: z.string().min(1),
  provenancePageRow: z.string().min(1),
  verified: z.boolean(),
});

export type TpaExclusionRule = z.infer<typeof TpaExclusionRuleSchema>;

export const ReferenceSourceMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  instrumentNumber: z.string().min(1),
  instrumentDate: ISODateSchema,
  sha256: z.string().min(1),
  verified: z.boolean(),
  recordCount: z.number().int().nonnegative(),
});

export type ReferenceSourceMeta = z.infer<typeof ReferenceSourceMetaSchema>;

export const ReferenceDatasetSchema = z.object({
  prices: z.array(ReferencePriceRecordSchema),
  tpaExclusions: z.array(TpaExclusionRuleSchema),
  sources: z.array(ReferenceSourceMetaSchema),
});

export type ReferenceDataset = z.infer<typeof ReferenceDatasetSchema>;

export const VerdictTierSchema = z.enum([
  'CONFIRMED',
  'LIKELY',
  'NEEDS_REVIEW',
  'VALID_EXCLUSION',
  'NOT_CHECKED',
]);

export type AuditVerdictTier = z.infer<typeof VerdictTierSchema>;

export const AuditFindingEvidenceSchema = z.object({
  kind: z.enum(['arithmetic', 'reference', 'duplicate', 'lump_sum', 'tpa', 'not_checked']),
  formula: z.string().nullable(),
  sourceTitle: z.string().nullable(),
  instrumentNumber: z.string().nullable(),
  instrumentDate: ISODateSchema.nullable(),
  provenancePageRow: z.string().nullable(),
  details: z.string().min(1),
});

export type AuditFindingEvidence = z.infer<typeof AuditFindingEvidenceSchema>;

export const AuditFindingSchema = z.object({
  id: z.string().min(1),
  ruleId: z.string().min(1),
  tier: VerdictTierSchema,
  lineItemId: z.string().nullable(),
  titleKey: z.string().min(1),
  summary: z.string().min(1),
  billedPaise: PaiseSchema.nullable(),
  referencePaise: PaiseSchema.nullable(),
  deltaPaise: PaiseSchema.nullable(),
  unverifiedData: z.boolean(),
  evidence: AuditFindingEvidenceSchema,
  recommendedAction: z.string().min(1),
});

export type AuditFinding = z.infer<typeof AuditFindingSchema>;

export const AuditTierBucketSchema = z.object({
  tier: VerdictTierSchema,
  count: z.number().int().nonnegative(),
  findings: z.array(AuditFindingSchema),
});

export type AuditTierBucket = z.infer<typeof AuditTierBucketSchema>;

export const AuditReportSchema = z.object({
  billId: z.string().min(1),
  referenceDateISO: ISODateSchema,
  reconcile: z.object({
    statedTotalPaise: NonNegativePaiseSchema,
    computedSumPaise: NonNegativePaiseSchema,
    differencePaise: PaiseSchema,
    isReconciled: z.boolean(),
  }),
  coverage: z.object({
    totalLines: z.number().int().nonnegative(),
    arithmeticCheckedCount: z.number().int().nonnegative(),
    referenceCheckedCount: z.number().int().nonnegative(),
    notCheckedCount: z.number().int().nonnegative(),
    notCheckedReasons: z.array(
      z.object({
        lineId: z.string().min(1),
        reason: z.string().min(1),
      }),
    ),
  }),
  tiers: z.object({
    CONFIRMED: AuditTierBucketSchema,
    LIKELY: AuditTierBucketSchema,
    NEEDS_REVIEW: AuditTierBucketSchema,
    VALID_EXCLUSION: AuditTierBucketSchema,
    NOT_CHECKED: AuditTierBucketSchema,
  }),
});

export type AuditReport = z.infer<typeof AuditReportSchema>;
