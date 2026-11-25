/**
 * src/lib/audit/index.ts
 * ======================
 * Pure deterministic rules engine — ENTRY POINT.
 * 
 * PURITY CONTRACT:
 * - NO network calls (no fetch, no XMLHttpRequest)
 * - NO AI SDK imports (no @google/generative-ai, no ai/*)
 * - NO Date.now(), no Math.random()
 * - NO imports from src/app/api/*, src/lib/extract/*, or any AI module
 * - NO side effects, no I/O, no logging beyond return values
 * 
 * This module is 100% deterministic: given the same input, it MUST
 * produce byte-identical output every time.
 */

export { type VerdictTier } from '@/lib/design-tokens';

export interface AuditLineItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPricePaise: number;    // Integer paise
  lineTotalPaise: number;    // Integer paise
  date: string;              // ISO YYYY-MM-DD
}

export interface AuditInput {
  lineItems: AuditLineItem[];
  statedTotalPaise: number;  // Integer paise
  hospitalName: string;
  patientName: string;
  billDate: string;          // ISO YYYY-MM-DD
  billNumber: string;
}

export type FindingVerdict = 'CONFIRMED' | 'LIKELY' | 'NEEDS_REVIEW' | 'VALID_EXCLUSION' | 'NOT_CHECKED';

export interface AuditFinding {
  lineItemId: string;
  verdict: FindingVerdict;
  ruleId: string;
  title: string;
  explanation: string;
  amountPaise: number | null;
  evidence: {
    type: 'arithmetic' | 'reference' | 'duplicate' | 'lump_sum' | 'policy' | 'none';
    sourceOrderNumber?: string;
    verified: boolean;
    details: string;
  };
  notCheckedReason?: string;
}

export interface AuditResult {
  findings: AuditFinding[];
  coverage: {
    arithmeticChecked: number;
    arithmeticTotal: number;
    referenceChecked: number;
    referenceTotal: number;
    notCheckedCount: number;
    notCheckedReasons: string[];
  };
  computedTotalPaise: number;
  statedTotalPaise: number;
  totalDiscrepancyPaise: number;
  deterministic: true; // Always true — signals this is a pure engine result
}

/**
 * Run the full audit pipeline on extracted bill data.
 * This is the ONLY entry point. All rules are executed in a fixed,
 * deterministic order.
 */
export function runAudit(_input: AuditInput): AuditResult {
  // Phase 2 will implement the full rules engine.
  // For now, return a valid empty result for type-checking and test scaffolding.
  return {
    findings: [],
    coverage: {
      arithmeticChecked: 0,
      arithmeticTotal: 0,
      referenceChecked: 0,
      referenceTotal: 0,
      notCheckedCount: 0,
      notCheckedReasons: [],
    },
    computedTotalPaise: 0,
    statedTotalPaise: _input.statedTotalPaise,
    totalDiscrepancyPaise: 0,
    deterministic: true,
  };
}
