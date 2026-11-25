import type { VerdictTier } from '@/lib/design-tokens';
import type { I18nKeys } from '@/lib/i18n';
import { NormalizedBillSchema, type NormalizedBill } from '@/lib/schemas/audit';

/**
 * Three 1-click Synthetic Demo Scenarios
 * ======================================
 * All bills are explicitly flagged `isSynthetic: true` with fictional Indian
 * hospitals and fictional patient names for zero-friction evaluation.
 */

export interface SyntheticDemoScenario {
  id: 'stent-duplicate-lumpsum' | 'tpa-deduction-review' | 'clean-accurate-bill';
  tierHint: VerdictTier;
  titleKey: I18nKeys;
  descriptionKey: I18nKeys;
  bill: NormalizedBill;
}

const scenarioABill: NormalizedBill = NormalizedBillSchema.parse({
  billId: 'DEMO-SYN-A-001',
  isSynthetic: true,
  hospitalName: 'SYNTHETIC Sahyadri Care Demo Hospital',
  patientName: 'Aarav Sharma (Synthetic)',
  billDate: '2026-11-18',
  statedTotalPaise: 7550000, // ₹75,500.00
  lineItems: [
    {
      id: 'demo-a-1',
      rawDescription: 'Coronary Drug Eluting Stent (DES)',
      normalizedName: 'Coronary Drug Eluting Stent (DES)',
      category: 'stent',
      quantity: 1,
      unit: 'unit',
      strengthOrSpec: 'DES',
      unitPricePaise: 4800000, // ₹48,000.00
      lineTotalPaise: 4800000,
      date: '2026-11-16',
      isCheckedByUser: false,
    },
    {
      id: 'demo-a-2',
      rawDescription: 'ICU Monitoring Charges (2 Days)',
      normalizedName: 'ICU Monitoring Charges',
      category: 'room_rent',
      quantity: 2,
      unit: 'day',
      strengthOrSpec: 'ICU',
      unitPricePaise: 250000, // 2 x ₹2,500 = ₹5,000, billed ₹6,000 (arithmetic mismatch)
      lineTotalPaise: 600000,
      date: '2026-11-16',
      isCheckedByUser: false,
    },
    {
      id: 'demo-a-3',
      rawDescription: 'Troponin-I Rapid Assay',
      normalizedName: 'Troponin I Rapid Assay',
      category: 'diagnostics',
      quantity: 1,
      unit: 'test',
      strengthOrSpec: 'quantitative',
      unitPricePaise: 150000, // ₹1,500.00
      lineTotalPaise: 150000,
      date: '2026-11-16',
      isCheckedByUser: false,
    },
    {
      id: 'demo-a-4',
      rawDescription: 'Troponin-I Rapid Assay (Repeat Billing)',
      normalizedName: 'Troponin I Rapid Assay',
      category: 'diagnostics',
      quantity: 1,
      unit: 'test',
      strengthOrSpec: 'quantitative',
      unitPricePaise: 150000, // Duplicate same date & amount
      lineTotalPaise: 150000,
      date: '2026-11-16',
      isCheckedByUser: false,
    },
    {
      id: 'demo-a-5',
      rawDescription: 'Pharmacy & Consumables Lump Sum',
      normalizedName: 'Pharmacy Lump Sum',
      category: 'pharmacy',
      quantity: 1,
      unit: 'lump_sum',
      strengthOrSpec: null,
      unitPricePaise: 1850000, // ₹18,500.00
      lineTotalPaise: 1850000,
      date: '2026-11-18',
      isCheckedByUser: false,
    },
  ],
  tpaDeductions: [],
});

const scenarioBBill: NormalizedBill = NormalizedBillSchema.parse({
  billId: 'DEMO-SYN-B-002',
  isSynthetic: true,
  hospitalName: 'SYNTHETIC Indus Valley Demo Clinic',
  patientName: 'Meera Iyer (Synthetic)',
  billDate: '2026-11-19',
  statedTotalPaise: 500000, // ₹5,000.00
  lineItems: [
    {
      id: 'demo-b-1',
      rawDescription: 'Twin Sharing Room Rent (2 Days)',
      normalizedName: 'Twin Sharing Room Rent',
      category: 'room_rent',
      quantity: 2,
      unit: 'day',
      strengthOrSpec: 'twin_sharing',
      unitPricePaise: 250000,
      lineTotalPaise: 500000,
      date: '2026-11-18',
      isCheckedByUser: false,
    },
  ],
  tpaDeductions: [
    {
      id: 'demo-tpa-1',
      description: 'Disposable Sterile Gloves & Gown Kit',
      claimedPaise: 180000,
      deductedPaise: 180000,
      reasonText: 'Non-payable consumable per standard annexure',
      category: 'consumables',
    },
    {
      id: 'demo-tpa-2',
      description: 'Surgeon Procedure Fee',
      claimedPaise: 4500000,
      deductedPaise: 1200000,
      reasonText: 'Reasonable & Customary',
      category: 'doctor_fee',
    },
  ],
});

const scenarioCBill: NormalizedBill = NormalizedBillSchema.parse({
  billId: 'DEMO-SYN-C-003',
  isSynthetic: true,
  hospitalName: 'SYNTHETIC Deccan Trust Demo Hospital',
  patientName: 'Vikram Kulkarni (Synthetic)',
  billDate: '2026-11-20',
  statedTotalPaise: 1090000, // ₹10,900.00
  lineItems: [
    {
      id: 'demo-c-1',
      rawDescription: 'General Ward Room Rent (3 Days)',
      normalizedName: 'General Ward Room Rent',
      category: 'room_rent',
      quantity: 3,
      unit: 'day',
      strengthOrSpec: 'general_ward',
      unitPricePaise: 250000, // ₹2,500/day x 3 = ₹7,500
      lineTotalPaise: 750000,
      date: '2026-11-18',
      isCheckedByUser: false,
    },
    {
      id: 'demo-c-2',
      rawDescription: 'Physician Consultation Visit (2 Visits)',
      normalizedName: 'Physician Consultation',
      category: 'doctor_fee',
      quantity: 2,
      unit: 'visit',
      strengthOrSpec: 'general_medicine',
      unitPricePaise: 100000, // ₹1,000 x 2 = ₹2,000
      lineTotalPaise: 200000,
      date: '2026-11-19',
      isCheckedByUser: false,
    },
    {
      id: 'demo-c-3',
      rawDescription: 'Amoxicillin + Clavulanate 625mg Strip',
      normalizedName: 'Amoxicillin Clavulanate',
      category: 'pharmacy',
      quantity: 2,
      unit: 'strip',
      strengthOrSpec: '625mg',
      unitPricePaise: 70000, // ₹700 x 2 = ₹1,400
      lineTotalPaise: 140000,
      date: '2026-11-20',
      isCheckedByUser: false,
    },
  ],
  tpaDeductions: [],
});

export const SYNTHETIC_DEMO_SCENARIOS: readonly SyntheticDemoScenario[] = [
  {
    id: 'stent-duplicate-lumpsum',
    tierHint: 'CONFIRMED',
    titleKey: 'demoScenarioA',
    descriptionKey: 'demoScenarioADesc',
    bill: scenarioABill,
  },
  {
    id: 'tpa-deduction-review',
    tierHint: 'NEEDS_REVIEW',
    titleKey: 'demoScenarioB',
    descriptionKey: 'demoScenarioBDesc',
    bill: scenarioBBill,
  },
  {
    id: 'clean-accurate-bill',
    tierHint: 'VALID_EXCLUSION',
    titleKey: 'demoScenarioC',
    descriptionKey: 'demoScenarioCDesc',
    bill: scenarioCBill,
  },
] as const;

export function getSyntheticDemoById(
  id: string,
): SyntheticDemoScenario | undefined {
  return SYNTHETIC_DEMO_SCENARIOS.find((s) => s.id === id);
}
