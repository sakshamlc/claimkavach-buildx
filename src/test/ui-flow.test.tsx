// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import Home from '@/app/page';

describe('ClaimKavach 3-Step UI Flow', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('loads a 1-click synthetic demo bill -> Verify Reconcile Bar -> Report -> Edit -> Recalculates', () => {
    render(<Home />);

    // Step 1: Landing shows 3 Load Demo Bill buttons and disabled upload CTA until consent
    const uploadButton = screen.getByRole('button', { name: /Choose File or Photo/i });
    expect(uploadButton).toBeDisabled();

    const demoButtons = screen.getAllByRole('button', { name: /Load Demo Bill/i });
    expect(demoButtons).toHaveLength(3);

    // Click Scenario A (Stent + Duplicate + Lump Sum)
    fireEvent.click(demoButtons[0]);

    // Step 2: Verify step shows SYNTHETIC banner and Reconciled status
    expect(screen.getByText(/Verify Extracted Line Items/i)).toBeInTheDocument();
    expect(screen.getByText(/SYNTHETIC DEMO DATA/i)).toBeInTheDocument();
    expect(screen.getByText(/Reconciled/i)).toBeInTheDocument();

    // Advance to Step 3 (Report)
    const runAuditBtn = screen.getByRole('button', { name: /Run Deterministic Audit/i });
    fireEvent.click(runAuditBtn);

    // Step 3: Report shows Coverage Summary, all 5 verdict tier headings, and zero merged total savings
    expect(screen.getByRole('heading', { name: /Audit Report/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Coverage Summary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Confirmed Issue/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Likely Issue/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Needs Review/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Valid \/ Standard/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Not Checked/i })).toBeInTheDocument();
    expect(screen.queryByText(/Total Savings/i)).not.toBeInTheDocument();

    // Expand evidence panel on first finding
    const viewEvidenceBtns = screen.getAllByRole('button', { name: /View Evidence/i });
    expect(viewEvidenceBtns.length).toBeGreaterThan(0);
    fireEvent.click(viewEvidenceBtns[0]);
    expect(screen.getByText(/Calculation:/i)).toBeInTheDocument();

    // Back to Verify -> edit stated total -> live Reconcile Bar updates -> rerun audit
    fireEvent.click(screen.getByRole('button', { name: /Edit Bill \(Back to Verify\)/i }));
    const statedTotalInput = screen.getByLabelText(/Stated Bill Total/i);
    fireEvent.change(statedTotalInput, { target: { value: '80000' } });
    expect(screen.getByText(/Mismatch/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Run Deterministic Audit/i }));
    expect(screen.getByText(/Audit Report/i)).toBeInTheDocument();
  });

  it('toggles language smoothly between English and Hindi', () => {
    render(<Home />);
    const toggle = screen.getByRole('button', { name: /Switch language/i });
    fireEvent.click(toggle);
    expect(screen.getByText(/सिंथेटिक डेमो बिल आज़माएँ/i)).toBeInTheDocument();
  });
});
