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

    // Step 3: Report shows Coverage Summary, all 5 verdict tier headings, INR formatting, pluralization, and zero merged total savings
    expect(screen.getByRole('heading', { name: /Audit Report/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Coverage Summary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Confirmed Issue/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Likely Issue/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Needs Review/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Valid \/ Standard/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Not Checked/i })).toBeInTheDocument();
    expect(screen.queryByText(/Total Savings/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bpaise\b/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/1 item\b/i).length).toBeGreaterThan(0);

    // Expand evidence panel on first finding
    const viewEvidenceBtns = screen.getAllByRole('button', { name: /View Evidence/i });
    expect(viewEvidenceBtns.length).toBeGreaterThan(0);
    expect(viewEvidenceBtns[0]).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(viewEvidenceBtns[0]);
    const hideEvidenceBtns = screen.getAllByRole('button', { name: /Hide Evidence/i });
    expect(hideEvidenceBtns[0]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText(/Calculation:/i).length).toBeGreaterThan(0);

    // Dispute Pack tabs, checklist, and Print button render on Step 3
    expect(screen.getByRole('heading', { name: /Dispute Draft Pack/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Hospital Billing Query/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Insurer Grievance Officer/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Insurance Ombudsman/i })).toBeInTheDocument();
    expect(screen.getByText(/Verify before sending:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print \/ Save as PDF/i })).toBeInTheDocument();

    // Switch dispute tab
    fireEvent.click(screen.getByRole('tab', { name: /Insurer Grievance Officer/i }));
    expect(screen.getByText(/Copy-ready draft: Insurer Grievance Officer/i)).toBeInTheDocument();

    // Back to Verify -> edit stated total -> live Reconcile Bar updates -> rerun audit
    fireEvent.click(screen.getByRole('button', { name: /Edit Bill \(Back to Verify\)/i }));
    const statedTotalInput = screen.getByLabelText(/Stated Bill Total/i);
    fireEvent.change(statedTotalInput, { target: { value: '80000' } });
    expect(screen.getByText(/Mismatch/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Run Deterministic Audit/i }));
    expect(screen.getByRole('heading', { name: /Audit Report/i })).toBeInTheDocument();

    // Interactive Stepper lets user click completed Verify step directly
    fireEvent.click(screen.getByRole('button', { name: /^Verify$/i }));
    expect(screen.getByText(/Verify Extracted Line Items/i)).toBeInTheDocument();
  });

  it('toggles language smoothly between English and Hindi', () => {
    render(<Home />);
    const toggle = screen.getByRole('button', { name: /Switch language/i });
    fireEvent.click(toggle);
    expect(screen.getByText(/सिंथेटिक डेमो बिल आज़माएँ/i)).toBeInTheDocument();
  });
});
