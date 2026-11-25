/**
 * Pure text normalization helpers for deterministic audit matching.
 * Zero side effects, zero I/O, zero non-deterministic calls.
 */
export function normalizeToken(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
