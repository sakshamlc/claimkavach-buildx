import { z } from 'zod';
import { LineCategorySchema } from '@/lib/schemas/audit';

/**
 * Extraction Request & Raw Gemini Output Schemas
 * ==============================================
 * Kept strictly isolated from `src/lib/audit/**` so the pure rules engine
 * never depends on AI/extraction shapes.
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  'application/pdf',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

/** Strict 4 MB ceiling enforced on `/api/extract` requests */
export const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

/** Client-side target payload per request batch to stay safely below 4 MB */
export const CLIENT_BATCH_TARGET_BYTES = 3_200_000;

export const ExtractImagePartSchema = z.object({
  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  base64Data: z
    .string()
    .min(16, 'Image payload is empty')
    .regex(/^[A-Za-z0-9+/=]+$/, 'Invalid base64 image encoding'),
  pageNumber: z.number().int().positive(),
});

export type ExtractImagePart = z.infer<typeof ExtractImagePartSchema>;

export const ExtractRequestSchema = z.object({
  images: z.array(ExtractImagePartSchema).min(1).max(12),
  batchIndex: z.number().int().nonnegative().default(0),
  totalBatches: z.number().int().positive().default(1),
});

export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

export const RawExtractedLineItemSchema = z.object({
  rawDescription: z.string().min(1),
  normalizedName: z.string().min(1).optional(),
  category: LineCategorySchema.catch('other'),
  quantity: z.number().finite().positive().default(1),
  unit: z.string().min(1).default('unit'),
  strengthOrSpec: z.string().nullable().optional(),
  unitPriceRupees: z.number().finite().nonnegative(),
  lineTotalRupees: z.number().finite().nonnegative(),
  date: z.string().nullable().optional(),
  confidenceNote: z.string().nullable().optional(),
});

export type RawExtractedLineItem = z.infer<typeof RawExtractedLineItemSchema>;

export const RawExtractedTpaDeductionSchema = z.object({
  description: z.string().min(1),
  claimedRupees: z.number().finite().nonnegative(),
  deductedRupees: z.number().finite().nonnegative(),
  reasonText: z.string().default(''),
  category: z.string().min(1).default('other'),
});

export type RawExtractedTpaDeduction = z.infer<typeof RawExtractedTpaDeductionSchema>;

export const RawExtractionSchema = z.object({
  hospitalName: z.string().min(1).default('Unknown Hospital'),
  patientName: z.string().min(1).default('Patient'),
  billDate: z.string().nullable().optional(),
  statedTotalRupees: z.number().finite().nonnegative(),
  lineItems: z.array(RawExtractedLineItemSchema),
  tpaDeductions: z.array(RawExtractedTpaDeductionSchema).default([]),
  extractionWarnings: z.array(z.string()).default([]),
});

export type RawExtraction = z.infer<typeof RawExtractionSchema>;
