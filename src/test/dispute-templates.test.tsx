// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { afterEach, describe, it, expect } from 'vitest';
import SourcesPage from '@/app/sources/page';
import { runAudit } from '@/lib/audit';
import { formatINR } from '@/lib/currency';
import { buildDisputeDrafts } from '@/lib/dispute/templates';
import { DEFAULT_REFERENCE_DATASET } from '@/lib/reference/dataset';
import { SYNTHETIC_BILL_A, SYNTHETIC_TEST_DATASET } from '@/test/golden-bills-data';

describe('Dispute Draft Templates', () => {
  it('generates 4 drafts with [FILL IN: placeholders, exact INR amounts, zero banned words, and zero invented legal citations', () => {
    const report = runAudit(SYNTHETIC_BILL_A, SYNTHETIC_TEST_DATASET, '2026-11-25');
    const drafts = buildDisputeDrafts(SYNTHETIC_BILL_A, report);

    expect(drafts).toHaveLength(4);
    expect(drafts.map((d) => d.id)).toEqual([
      'hospital-query',
      'insurer-grievance',
      'grievance-portal',
      'ombudsman-draft',
    ]);

    const expectedTotalFormatted = formatINR(report.reconcile.statedTotalPaise);
    const expectedOverchargeDelta = formatINR(1800000); // ₹18,000.00 stent variance

    const forbiddenWords = ['illegal', 'fraud', 'cheating'];
    const inventedCitations = [
      'irdai regulation',
      'section 38',
      'within 15 days',
      'within 30 days',
      'consumer protection act',
    ];

    for (const draft of drafts) {
      expect(draft.body).toContain('[FILL IN: Policy Number]');
      expect(draft.body).toContain('[FILL IN: Claim/UHID Number]');
      expect(draft.body).toContain('[FILL IN: Patient Contact]');
      expect(draft.body).toContain(expectedTotalFormatted);
      expect(draft.body).toContain(expectedOverchargeDelta);

      const lower = draft.body.toLowerCase();
      for (const word of forbiddenWords) {
        expect(lower, `Draft ${draft.id} contains "${word}"`).not.toContain(word);
      }
      for (const cite of inventedCitations) {
        expect(lower, `Draft ${draft.id} contains invented citation "${cite}"`).not.toContain(cite);
      }
    }
  });
});

describe('/sources Transparency Page', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders reference data status cleanly when zero official PDFs are loaded', () => {
    render(<SourcesPage />);

    expect(
      screen.getByRole('heading', { name: /Reference Data & Provenance/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Reference Data Status/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Coronary Stents/i)).toBeInTheDocument();
    expect(screen.getByText(/IRDAI Non-Payable Consumables/i)).toBeInTheDocument();
    expect(DEFAULT_REFERENCE_DATASET.sources).toHaveLength(0);
  });

  it('uses zero runtime fs imports in src/app/sources/page.tsx or src/lib/reference/dataset.ts', () => {
    const root = path.resolve(__dirname, '..');
    const sourcesPageSrc = fs.readFileSync(path.join(root, 'app/sources/page.tsx'), 'utf8');
    const datasetSrc = fs.readFileSync(path.join(root, 'lib/reference/dataset.ts'), 'utf8');

    expect(sourcesPageSrc).not.toMatch(/from ['"](node:)?fs['"]/);
    expect(datasetSrc).not.toMatch(/from ['"](node:)?fs['"]/);
  });
});
