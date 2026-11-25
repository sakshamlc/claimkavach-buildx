import { describe, it, expect } from 'vitest';
import {
  ClientPrepError,
  packPagesIntoBatches,
  resolveUploadMimeType,
  utf8ByteLength,
} from '@/lib/extract/client-prep';
import {
  mapExtractionToNormalizedBill,
  mergeBatchExtractions,
  normalizeOcrDate,
} from '@/lib/extract/mapper';
import type { ExtractImagePart, RawExtraction } from '@/lib/extract/schemas';

describe('Extraction Mapper & Client-Prep Utilities', () => {
  it('converts rupee floats cleanly into integer paise and initializes isCheckedByUser: false', () => {
    const raw: RawExtraction = {
      hospitalName: '  Apollo Care Demo  ',
      patientName: 'Ananya Verma',
      billDate: '18/11/2026',
      statedTotalRupees: 1525.5,
      lineItems: [
        {
          rawDescription: '  IV Cannula 20G  ',
          category: 'consumables',
          quantity: 2,
          unit: 'unit',
          strengthOrSpec: null,
          unitPriceRupees: 250.25,
          lineTotalRupees: 500.5,
          date: '2026-11-17',
          confidenceNote: null,
        },
        {
          rawDescription: 'Consultation Visit',
          category: 'doctor_fee',
          quantity: 1,
          unit: 'visit',
          unitPriceRupees: 1025,
          lineTotalRupees: 1025,
        },
      ],
      tpaDeductions: [
        {
          description: 'Gloves',
          claimedRupees: 150.75,
          deductedRupees: 150.75,
          reasonText: 'Non-payable',
          category: 'consumables',
        },
      ],
      extractionWarnings: [],
    };

    const normalized = mapExtractionToNormalizedBill(raw, {
      billId: 'ext-1',
      fallbackBillDateISO: '2026-11-25',
    });

    expect(normalized.billId).toBe('ext-1');
    expect(normalized.isSynthetic).toBe(false);
    expect(normalized.billDate).toBe('2026-11-18');
    expect(normalized.statedTotalPaise).toBe(152550);
    expect(normalized.lineItems[0].rawDescription).toBe('IV Cannula 20G');
    expect(normalized.lineItems[0].normalizedName).toBe('IV Cannula 20G');
    expect(normalized.lineItems[0].unitPricePaise).toBe(25025);
    expect(normalized.lineItems[0].lineTotalPaise).toBe(50050);
    expect(normalized.lineItems[0].isCheckedByUser).toBe(false);
    expect(normalized.lineItems[1].date).toBeNull();
    expect(normalized.tpaDeductions[0].deductedPaise).toBe(15075);
  });

  it('normalizes valid Indian/ISO dates and converts invalid OCR dates to null without crashing', () => {
    expect(normalizeOcrDate('2026-11-25')).toBe('2026-11-25');
    expect(normalizeOcrDate('25/11/2026')).toBe('2026-11-25');
    expect(normalizeOcrDate('25-11-2026')).toBe('2026-11-25');
    expect(normalizeOcrDate('25.11.2026')).toBe('2026-11-25');
    expect(normalizeOcrDate('2026-02-30')).toBeNull();
    expect(normalizeOcrDate('31/04/2026')).toBeNull();
    expect(normalizeOcrDate('unreadable')).toBeNull();
    expect(normalizeOcrDate(undefined)).toBeNull();

    const bill = mapExtractionToNormalizedBill(
      {
        hospitalName: 'City Hospital',
        patientName: 'Test',
        billDate: '31/02/2026',
        statedTotalRupees: 100,
        lineItems: [],
        tpaDeductions: [],
        extractionWarnings: [],
      },
      { fallbackBillDateISO: '2026-11-25' },
    );
    expect(bill.billDate).toBe('2026-11-25');
  });

  it('rejects malformed extraction objects at the Zod boundary', () => {
    expect(() =>
      mapExtractionToNormalizedBill({
        hospitalName: 'H',
        patientName: 'P',
        statedTotalRupees: -50, // negative rupees rejected
        lineItems: [],
        tpaDeductions: [],
        extractionWarnings: [],
      } as unknown as RawExtraction),
    ).toThrow();
  });

  it('merges multi-batch extractions cleanly', () => {
    const merged = mergeBatchExtractions([
      {
        hospitalName: 'Hospital A',
        patientName: 'Patient A',
        billDate: null,
        statedTotalRupees: 0,
        lineItems: [
          {
            rawDescription: 'Item 1',
            category: 'other',
            quantity: 1,
            unit: 'unit',
            unitPriceRupees: 100,
            lineTotalRupees: 100,
          },
        ],
        tpaDeductions: [],
        extractionWarnings: ['w1'],
      },
      {
        hospitalName: 'Hospital A',
        patientName: 'Patient A',
        billDate: '2026-11-20',
        statedTotalRupees: 300,
        lineItems: [
          {
            rawDescription: 'Item 2',
            category: 'other',
            quantity: 1,
            unit: 'unit',
            unitPriceRupees: 200,
            lineTotalRupees: 200,
          },
        ],
        tpaDeductions: [],
        extractionWarnings: ['w1', 'w2'],
      },
    ]);

    expect(merged.lineItems).toHaveLength(2);
    expect(merged.statedTotalRupees).toBe(300);
    expect(merged.billDate).toBe('2026-11-20');
    expect(merged.extractionWarnings).toEqual(['w1', 'w2']);
  });

  it('packs multi-page uploads into batches strictly under the byte budget', () => {
    const chunk = 'A'.repeat(1000);
    const pages: ExtractImagePart[] = [
      { mimeType: 'image/jpeg', base64Data: chunk, pageNumber: 1 },
      { mimeType: 'image/jpeg', base64Data: chunk, pageNumber: 2 },
      { mimeType: 'image/jpeg', base64Data: chunk, pageNumber: 3 },
    ];

    const batches = packPagesIntoBatches(pages, 2300);
    expect(batches.length).toBeGreaterThan(1);
    for (const batch of batches) {
      expect(utf8ByteLength(JSON.stringify(batch))).toBeLessThanOrEqual(2300);
    }
    expect(batches[0].totalBatches).toBe(batches.length);
  });

  it('rejects unsupported MIME types early with ClientPrepError', () => {
    expect(() => resolveUploadMimeType('malware.exe', 'application/x-msdownload')).toThrowError(
      ClientPrepError,
    );
    expect(resolveUploadMimeType('bill.PDF', '')).toBe('application/pdf');
    expect(resolveUploadMimeType('scan.jpg', 'image/jpeg')).toBe('image/jpeg');
  });
});
