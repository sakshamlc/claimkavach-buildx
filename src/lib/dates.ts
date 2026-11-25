/**
 * Strict ISO Date Utilities (YYYY-MM-DD)
 * ======================================
 * Pure calendar validation and comparison without `new Date()` timezone
 * or locale drift. Safe for use inside the pure audit engine.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface ParsedISODate {
  year: number;
  month: number;
  day: number;
}

/**
 * Gregorian leap-year check.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Number of calendar days in a given (year, 1-indexed month).
 */
export function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    case 2:
      return isLeapYear(year) ? 29 : 28;
    default:
      return 0;
  }
}

/**
 * Returns true iff `value` is a syntactically and calendar-valid YYYY-MM-DD string.
 * Rejects impossible calendar dates such as '2026-02-30' or '2025-02-29'.
 */
export function isValidISODate(value: string): boolean {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE_RE.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const maxDay = daysInMonth(year, month);
  return day >= 1 && day <= maxDay;
}

/**
 * Parse and validate an ISO YYYY-MM-DD date string.
 * Throws RangeError if invalid.
 */
export function parseISODate(value: string): ParsedISODate {
  if (!isValidISODate(value)) {
    throw new RangeError(`Invalid ISO YYYY-MM-DD date: "${String(value)}"`);
  }
  const match = ISO_DATE_RE.exec(value)!;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/**
 * Compare two validated ISO YYYY-MM-DD strings lexicographically.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
export function compareISODates(a: string, b: string): -1 | 0 | 1 {
  parseISODate(a);
  parseISODate(b);
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Check whether `date` lies within `[startInclusive, endInclusive]`.
 * If `endInclusive` is null, the range is open-ended from `startInclusive` onward.
 */
export function isDateInRange(
  date: string,
  startInclusive: string,
  endInclusive: string | null,
): boolean {
  if (compareISODates(date, startInclusive) < 0) return false;
  if (endInclusive !== null && compareISODates(date, endInclusive) > 0) return false;
  return true;
}
