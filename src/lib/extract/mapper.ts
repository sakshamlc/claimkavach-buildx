import { rupeesToPaise } from '@/lib/currency';
import { isValidISODate } from '@/lib/dates';
import {
  NormalizedBillSchema,
  type BillLineItem,
  type NormalizedBill,
  type TpaDeductionItem,
} from '@/lib/schemas/audit';
import {
  RawExtractionSchema,
  type RawExtraction,
} from '@/lib/extract/schemas';

export interface MapExtractionOptions {
  billId?: string;
  isSynthetic?: boolean;
  fallbackBillDateISO?: string;
}

const YYYY_MM_DD_RE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
const DD_MM_YYYY_RE = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Normalize common Indian hospital bill date strings into strict ISO `YYYY-MM-DD`.
 * Returns `null` if the string is unreadable or fails calendar validation.
 */
export function normalizeOcrDate(rawDate: string | null | undefined): string | null {
  if (!rawDate || typeof rawDate !== 'string') return null;
  const trimmed = rawDate.trim();
  if (!trimmed) return null;

  const isoLike = YYYY_MM_DD_RE.exec(trimmed);
  if (isoLike) {
    const candidate = `${isoLike[1]}-${pad2(Number(isoLike[2]))}-${pad2(Number(isoLike[3]))}`;
    return isValidISODate(candidate) ? candidate : null;
  }

  const dmyLike = DD_MM_YYYY_RE.exec(trimmed);
  if (dmyLike) {
    const candidate = `${dmyLike[3]}-${pad2(Number(dmyLike[2]))}-${pad2(Number(dmyLike[1]))}`;
    return isValidISODate(candidate) ? candidate : null;
  }

  return null;
}

/**
 * Merge multiple sequential page-batch extractions into one combined RawExtraction.
 */
export function mergeBatchExtractions(batches: RawExtraction[]): RawExtraction {
  if (batches.length === 0) {
    throw new Error('Cannot merge zero extraction batches');
  }
  const parsed = batches.map((b) => RawExtractionSchema.parse(b));
  const first = parsed[0];

  const statedTotalRupees =
    parsed.find((b) => b.statedTotalRupees > 0)?.statedTotalRupees ?? first.statedTotalRupees;

  return RawExtractionSchema.parse({
    hospitalName: first.hospitalName,
    patientName: first.patientName,
    billDate: parsed.find((b) => normalizeOcrDate(b.billDate) !== null)?.billDate ?? first.billDate,
    statedTotalRupees,
    lineItems: parsed.flatMap((b) => b.lineItems),
    tpaDeductions: parsed.flatMap((b) => b.tpaDeductions),
    extractionWarnings: Array.from(new Set(parsed.flatMap((b) => b.extractionWarnings))),
  });
}

/**
 * Pure mapper converting Gemini's RawExtraction into a strict NormalizedBill
 * with integer paise currency and `isCheckedByUser: false` for Step 2 verification.
 */
export function mapExtractionToNormalizedBill(
  rawInput: RawExtraction,
  options: MapExtractionOptions = {},
): NormalizedBill {
  const raw = RawExtractionSchema.parse(rawInput);

  const fallbackDate = options.fallbackBillDateISO ?? '1970-01-01';
  if (!isValidISODate(fallbackDate)) {
    throw new RangeError(`Invalid fallbackBillDateISO: "${fallbackDate}"`);
  }

  const billDate = normalizeOcrDate(raw.billDate) ?? fallbackDate;

  const lineItems: BillLineItem[] = raw.lineItems.map((item, idx) => {
    const rawDescription = item.rawDescription.trim();
    const normalizedName = (item.normalizedName ?? rawDescription).trim() || rawDescription;
    const strengthOrSpec =
      item.strengthOrSpec && item.strengthOrSpec.trim().length > 0
        ? item.strengthOrSpec.trim()
        : null;

    return {
      id: `line-${idx + 1}`,
      rawDescription,
      normalizedName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit.trim() || 'unit',
      strengthOrSpec,
      unitPricePaise: rupeesToPaise(item.unitPriceRupees),
      lineTotalPaise: rupeesToPaise(item.lineTotalRupees),
      date: normalizeOcrDate(item.date),
      isCheckedByUser: false,
    };
  });

  const tpaDeductions: TpaDeductionItem[] = raw.tpaDeductions.map((ded, idx) => ({
    id: `tpa-${idx + 1}`,
    description: ded.description.trim(),
    claimedPaise: rupeesToPaise(ded.claimedRupees),
    deductedPaise: rupeesToPaise(ded.deductedRupees),
    reasonText: ded.reasonText.trim(),
    category: ded.category.trim() || 'other',
  }));

  const normalized: NormalizedBill = {
    billId: options.billId ?? 'extracted-bill-1',
    isSynthetic: options.isSynthetic ?? false,
    hospitalName: raw.hospitalName.trim() || 'Unknown Hospital',
    patientName: raw.patientName.trim() || 'Patient',
    billDate,
    statedTotalPaise: rupeesToPaise(raw.statedTotalRupees),
    lineItems,
    tpaDeductions,
  };

  return NormalizedBillSchema.parse(normalized);
}
