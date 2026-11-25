import type { NormalizedBill, ReferenceDataset } from '@/lib/schemas/audit';

/**
 * Test-only synthetic reference dataset and 3 golden synthetic bills.
 * Used solely in Vitest suites (NOT shipped as production reference data).
 */
export const SYNTHETIC_TEST_DATASET: ReferenceDataset = {
  prices: [
    {
      id: 'syn-ref-des',
      category: 'stent',
      canonicalName: 'Drug Eluting Stent',
      matchAliases: ['Coronary Drug Eluting Stent (DES)', 'DES Stent'],
      unit: 'unit',
      strengthOrSpec: 'DES',
      ceilingPricePaise: 3000000, // ₹30,000.00
      gstTreatment: '5% GST extra',
      sourceTitle: 'Synthetic Test Stent Order',
      instrumentNumber: 'SYN-TEST-SO-01',
      instrumentDate: '2026-04-01',
      effectiveDate: '2026-04-01',
      validityEndDate: null,
      sourceFileHash: 'synthetic-test-hash-stent',
      provenancePageRow: 'Page 1, Row 1',
      verified: false, // Unverified -> must emit LIKELY, never CONFIRMED
    },
    {
      id: 'syn-ref-room',
      category: 'room_rent',
      canonicalName: 'General Ward Bed',
      matchAliases: ['General Ward Room Rent'],
      unit: 'day',
      strengthOrSpec: 'general_ward',
      ceilingPricePaise: 300000, // ₹3,000.00/day
      gstTreatment: 'Exempt',
      sourceTitle: 'Synthetic Test Room Tariff',
      instrumentNumber: 'SYN-TEST-TARIFF-01',
      instrumentDate: '2026-04-01',
      effectiveDate: '2026-04-01',
      validityEndDate: null,
      sourceFileHash: 'synthetic-test-hash-room',
      provenancePageRow: 'Page 2, Row 4',
      verified: true,
    },
  ],
  tpaExclusions: [
    {
      id: 'syn-tpa-gloves',
      canonicalName: 'Disposable Sterile Gloves',
      matchAliases: ['Sterile Gloves', 'Examination Gloves'],
      category: 'consumables',
      isStandardNonPayable: true,
      sourceTitle: 'Synthetic Test Non-Payable Annexure',
      instrumentNumber: 'SYN-TEST-CIR-01',
      instrumentDate: '2020-06-11',
      effectiveDate: '2020-06-11',
      validityEndDate: null,
      sourceFileHash: 'synthetic-test-hash-tpa',
      provenancePageRow: 'Annexure I, Row 12',
      verified: true,
    },
  ],
  sources: [],
};

// ─── Golden Bill A: Stent Overcharge + Duplicate + Pharmacy Lump Sum ─────────
export const SYNTHETIC_BILL_A: NormalizedBill = {
  billId: 'SYN-BILL-A-001',
  isSynthetic: true,
  hospitalName: 'SYNTHETIC Sunrise Heart Institute',
  patientName: 'Aarav Mehta (Synthetic)',
  billDate: '2026-11-18',
  statedTotalPaise: 6950000, // ₹69,500.00
  lineItems: [
    {
      id: 'a-1',
      rawDescription: 'Coronary Drug Eluting Stent (DES)',
      normalizedName: 'Coronary Drug Eluting Stent (DES)',
      category: 'stent',
      quantity: 1,
      unit: 'unit',
      strengthOrSpec: 'DES',
      unitPricePaise: 4800000, // ₹48,000.00
      lineTotalPaise: 4800000,
      date: '2026-11-16',
      isCheckedByUser: true,
    },
    {
      id: 'a-2',
      rawDescription: 'Troponin-I Rapid Assay',
      normalizedName: 'Troponin I Rapid Assay',
      category: 'diagnostics',
      quantity: 1,
      unit: 'test',
      strengthOrSpec: 'quantitative',
      unitPricePaise: 150000, // ₹1,500.00
      lineTotalPaise: 150000,
      date: '2026-11-16',
      isCheckedByUser: true,
    },
    {
      id: 'a-3',
      rawDescription: 'Troponin-I Rapid Assay (Duplicate Entry)',
      normalizedName: 'Troponin I Rapid Assay',
      category: 'diagnostics',
      quantity: 1,
      unit: 'test',
      strengthOrSpec: 'quantitative',
      unitPricePaise: 150000,
      lineTotalPaise: 150000,
      date: '2026-11-16',
      isCheckedByUser: true,
    },
    {
      id: 'a-4',
      rawDescription: 'Pharmacy & Consumables Lump Sum',
      normalizedName: 'Pharmacy Lump Sum',
      category: 'pharmacy',
      quantity: 1,
      unit: 'lump_sum',
      strengthOrSpec: null,
      unitPricePaise: 1850000, // ₹18,500.00
      lineTotalPaise: 1850000,
      date: '2026-11-18',
      isCheckedByUser: true,
    },
  ],
  tpaDeductions: [],
};

// ─── Golden Bill B: TPA / Insurer Deduction Review Case ──────────────────────
export const SYNTHETIC_BILL_B: NormalizedBill = {
  billId: 'SYN-BILL-B-002',
  isSynthetic: true,
  hospitalName: 'SYNTHETIC Lotus Multi-Speciality Care',
  patientName: 'Priya Nair (Synthetic)',
  billDate: '2026-11-19',
  statedTotalPaise: 500000, // ₹5,000.00
  lineItems: [
    {
      id: 'b-1',
      rawDescription: 'General Ward Room Rent',
      normalizedName: 'General Ward Room Rent',
      category: 'room_rent',
      quantity: 2,
      unit: 'day',
      strengthOrSpec: 'general_ward',
      unitPricePaise: 250000, // ₹2,500.00/day
      lineTotalPaise: 500000,
      date: '2026-11-18',
      isCheckedByUser: true,
    },
  ],
  tpaDeductions: [
    {
      id: 'tpa-b-1',
      description: 'Sterile Gloves & Gown Pack',
      claimedPaise: 180000,
      deductedPaise: 180000,
      reasonText: 'Non-payable consumable per standard annexure',
      category: 'consumables',
    },
    {
      id: 'tpa-b-2',
      description: 'Surgeon Procedure Fee',
      claimedPaise: 4500000,
      deductedPaise: 1200000,
      reasonText: 'Reasonable & Customary',
      category: 'doctor_fee',
    },
  ],
};

// ─── Golden Bill C: Clean, Accurate Bill (Zero False Positives) ──────────────
export const SYNTHETIC_BILL_C: NormalizedBill = {
  billId: 'SYN-BILL-C-003',
  isSynthetic: true,
  hospitalName: 'SYNTHETIC Metro Civic Clinic',
  patientName: 'Rohan Deshmukh (Synthetic)',
  billDate: '2026-11-20',
  statedTotalPaise: 3750000, // ₹37,500.00
  lineItems: [
    {
      id: 'c-1',
      rawDescription: 'General Ward Room Rent',
      normalizedName: 'General Ward Room Rent',
      category: 'room_rent',
      quantity: 3,
      unit: 'day',
      strengthOrSpec: 'general_ward',
      unitPricePaise: 250000, // ₹2,500/day <= ₹3,000 ceiling
      lineTotalPaise: 750000,
      date: '2026-11-18',
      isCheckedByUser: true,
    },
    {
      id: 'c-2',
      rawDescription: 'Drug Eluting Stent',
      normalizedName: 'Drug Eluting Stent',
      category: 'stent',
      quantity: 1,
      unit: 'unit',
      strengthOrSpec: 'DES',
      unitPricePaise: 3000000, // ₹30,000 == ceiling
      lineTotalPaise: 3000000,
      date: '2026-11-19',
      isCheckedByUser: true,
    },
  ],
  tpaDeductions: [],
};
