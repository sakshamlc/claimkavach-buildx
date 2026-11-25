import { describe, it, expect } from 'vitest';
import {
  addPaise,
  assertSafePaise,
  formatINR,
  multiplyPaise,
  paiseToRupees,
  rupeesToPaise,
  subtractPaise,
} from '@/lib/currency';
import {
  compareISODates,
  daysInMonth,
  isDateInRange,
  isLeapYear,
  isValidISODate,
  parseISODate,
} from '@/lib/dates';

describe('Integer-Paise Currency Utilities', () => {
  it('converts rupees to paise with safe rounding', () => {
    expect(rupeesToPaise(0)).toBe(0);
    expect(rupeesToPaise(19.99)).toBe(1999);
    expect(rupeesToPaise(1.005)).toBe(101);
    expect(rupeesToPaise(-250.5)).toBe(-25050);
    expect(rupeesToPaise(-0)).toBe(0);
  });

  it('converts paise back to rupees', () => {
    expect(paiseToRupees(12500000)).toBe(125000);
    expect(paiseToRupees(1999)).toBe(19.99);
    expect(paiseToRupees(0)).toBe(0);
  });

  it('adds and subtracts paise accurately', () => {
    expect(addPaise(100, 250, 50)).toBe(400);
    expect(addPaise()).toBe(0);
    expect(subtractPaise(5000, 1250)).toBe(3750);
    expect(subtractPaise(100, 250)).toBe(-150);
  });

  it('multiplies unit paise by integer and fractional quantities safely', () => {
    expect(multiplyPaise(15000, 3)).toBe(45000);
    expect(multiplyPaise(1000, 1.5)).toBe(1500);
    expect(multiplyPaise(333, 0.5)).toBe(167);
    expect(multiplyPaise(500, 0)).toBe(0);
  });

  it('rejects NaN, Infinity, floats, and non-safe integers', () => {
    expect(() => assertSafePaise(Number.NaN)).toThrow();
    expect(() => assertSafePaise(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => assertSafePaise(12.34)).toThrow();
    expect(() => assertSafePaise(Number.MAX_SAFE_INTEGER + 1)).toThrow();
    expect(() => rupeesToPaise(Number.NaN)).toThrow();
    expect(() => rupeesToPaise(Number.NEGATIVE_INFINITY)).toThrow();
    expect(() => multiplyPaise(100, -1)).toThrow();
    expect(() => multiplyPaise(100, Number.NaN)).toThrow();
  });

  it('formats paise into Indian numbering system (₹1,25,000.00)', () => {
    expect(formatINR(0)).toBe('₹0.00');
    expect(formatINR(50)).toBe('₹0.50');
    expect(formatINR(10000)).toBe('₹100.00');
    expect(formatINR(100000)).toBe('₹1,000.00');
    expect(formatINR(12500000)).toBe('₹1,25,000.00');
    expect(formatINR(1234567890)).toBe('₹1,23,45,678.90');
    expect(formatINR(-12500000)).toBe('-₹1,25,000.00');
  });
});

describe('Strict ISO Date Utilities (YYYY-MM-DD)', () => {
  it('detects leap years accurately', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });

  it('computes daysInMonth accurately', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(daysInMonth(2026, 13)).toBe(0);
  });

  it('validates calendar-valid ISO dates and rejects invalid dates', () => {
    expect(isValidISODate('2026-11-25')).toBe(true);
    expect(isValidISODate('2024-02-29')).toBe(true);
    expect(isValidISODate('2025-02-29')).toBe(false);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-04-31')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('2026-00-10')).toBe(false);
    expect(isValidISODate('25-11-2026')).toBe(false);
    expect(isValidISODate('2026-11-25T10:00:00Z')).toBe(false);
  });

  it('parses and compares dates lexicographically without Date()', () => {
    expect(parseISODate('2026-11-25')).toEqual({ year: 2026, month: 11, day: 25 });
    expect(() => parseISODate('2026-02-30')).toThrow();
    expect(compareISODates('2026-01-01', '2026-11-25')).toBe(-1);
    expect(compareISODates('2026-11-25', '2026-11-25')).toBe(0);
    expect(compareISODates('2026-12-01', '2026-11-25')).toBe(1);
  });

  it('evaluates closed and open-ended validity ranges', () => {
    expect(isDateInRange('2026-05-01', '2026-01-01', '2026-12-31')).toBe(true);
    expect(isDateInRange('2026-01-01', '2026-01-01', '2026-12-31')).toBe(true);
    expect(isDateInRange('2026-12-31', '2026-01-01', '2026-12-31')).toBe(true);
    expect(isDateInRange('2025-12-31', '2026-01-01', '2026-12-31')).toBe(false);
    expect(isDateInRange('2027-01-01', '2026-01-01', '2026-12-31')).toBe(false);
    expect(isDateInRange('2030-01-01', '2026-01-01', null)).toBe(true);
  });
});
