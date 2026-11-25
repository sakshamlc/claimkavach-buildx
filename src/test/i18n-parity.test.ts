/**
 * i18n Parity Test
 * ================
 * Ensures every key in en.ts exists in hi.ts and vice versa.
 * Prevents missing translations from reaching production.
 */
import { describe, it, expect } from 'vitest';
import en from '@/lib/i18n/en';
import hi from '@/lib/i18n/hi';

describe('i18n Key Parity', () => {
  const enKeys = Object.keys(en).sort();
  const hiKeys = Object.keys(hi).sort();

  it('should have identical keys in EN and HI', () => {
    expect(enKeys).toEqual(hiKeys);
  });

  it('should have no empty strings in EN', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `EN key "${key}" is empty`).not.toBe('');
    }
  });

  it('should have no empty strings in HI', () => {
    for (const [key, value] of Object.entries(hi)) {
      expect(value, `HI key "${key}" is empty`).not.toBe('');
    }
  });

  it('EN keys missing from HI', () => {
    const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
    expect(missingInHi, `Keys in EN but missing from HI: ${missingInHi.join(', ')}`).toEqual([]);
  });

  it('HI keys missing from EN', () => {
    const missingInEn = hiKeys.filter((k) => !enKeys.includes(k));
    expect(missingInEn, `Keys in HI but missing from EN: ${missingInEn.join(', ')}`).toEqual([]);
  });
});
