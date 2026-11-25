/**
 * Integer-Paise Currency Utilities
 * ================================
 * ALL monetary values in ClaimKavach are represented internally as safe
 * integer paise (`1 INR = 100 paise`).
 *
 * `formatINR` is used ONLY at the UI presentation layer.
 * Pure, deterministic, zero locale/ICU drift.
 */

export type Paise = number;

/**
 * Validate that a value is a finite safe integer suitable for paise math.
 * Rejects NaN, Infinity, floats, and integers outside Number.MAX_SAFE_INTEGER.
 */
export function assertSafePaise(value: number, label = 'amount'): Paise {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new RangeError(`Invalid paise ${label}: expected safe integer, received ${String(value)}`);
  }
  return value === 0 ? 0 : value;
}

/**
 * Convert a rupee amount (e.g. 1250.5) to safe integer paise (125050).
 * Rounds half-away-from-zero cleanly to avoid IEEE-754 drift (e.g. 1.005 -> 101).
 */
export function rupeesToPaise(rupees: number): Paise {
  if (typeof rupees !== 'number' || !Number.isFinite(rupees)) {
    throw new RangeError(`Invalid rupee amount: expected finite number, received ${String(rupees)}`);
  }
  const sign = rupees < 0 ? -1 : 1;
  const scaled = Math.round(Math.abs(rupees) * 100 + 1e-9) * sign;
  return assertSafePaise(scaled === 0 ? 0 : scaled, 'rupeesToPaise');
}

/**
 * Convert safe integer paise to a decimal rupee number for display/serialization.
 */
export function paiseToRupees(paise: Paise): number {
  const safe = assertSafePaise(paise, 'paiseToRupees');
  return safe / 100;
}

/**
 * Sum any number of safe integer paise amounts.
 */
export function addPaise(...amounts: Paise[]): Paise {
  let total = 0;
  for (let i = 0; i < amounts.length; i++) {
    const val = assertSafePaise(amounts[i], `addPaise[${i}]`);
    total = assertSafePaise(total + val, 'addPaise total');
  }
  return total;
}

/**
 * Subtract two safe integer paise amounts: a - b.
 */
export function subtractPaise(a: Paise, b: Paise): Paise {
  const safeA = assertSafePaise(a, 'subtractPaise(a)');
  const safeB = assertSafePaise(b, 'subtractPaise(b)');
  return assertSafePaise(safeA - safeB, 'subtractPaise result');
}

/**
 * Multiply unit price in paise by a quantity (integer or fractional).
 * Uses explicit rounding to return a safe integer paise total.
 */
export function multiplyPaise(unitPaise: Paise, qty: number): Paise {
  const safeUnit = assertSafePaise(unitPaise, 'multiplyPaise(unitPaise)');
  if (typeof qty !== 'number' || !Number.isFinite(qty) || qty < 0) {
    throw new RangeError(`Invalid quantity: expected finite non-negative number, received ${String(qty)}`);
  }
  const product = safeUnit * qty;
  if (!Number.isFinite(product)) {
    throw new RangeError('multiplyPaise overflow');
  }
  const sign = product < 0 ? -1 : 1;
  const rounded = Math.round(Math.abs(product) + 1e-9) * sign;
  return assertSafePaise(rounded === 0 ? 0 : rounded, 'multiplyPaise result');
}

/**
 * Format safe integer paise in Indian numbering system: e.g. ₹1,25,000.00.
 * Deterministic string formatting (no Intl runtime/locale variance).
 */
export function formatINR(paise: Paise): string {
  const safe = assertSafePaise(paise, 'formatINR');
  const isNegative = safe < 0;
  const absPaise = Math.abs(safe);

  const wholeRupees = Math.floor(absPaise / 100);
  const remPaise = absPaise % 100;

  const rupeesStr = String(wholeRupees);
  let grouped: string;
  if (rupeesStr.length <= 3) {
    grouped = rupeesStr;
  } else {
    const lastThree = rupeesStr.slice(-3);
    const rest = rupeesStr.slice(0, -3);
    const pairs: string[] = [];
    for (let i = rest.length; i > 0; i -= 2) {
      const start = Math.max(0, i - 2);
      pairs.unshift(rest.slice(start, i));
    }
    grouped = `${pairs.join(',')},${lastThree}`;
  }

  const paiseStr = String(remPaise).padStart(2, '0');
  return `${isNegative ? '-' : ''}₹${grouped}.${paiseStr}`;
}
