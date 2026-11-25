/**
 * Privacy Copy Test
 * =================
 * Ensures the UI never makes false privacy claims.
 * The app sends data to Google Gemini for OCR — we must NOT claim
 * "nothing is sent" or "in-memory only" or "fully offline".
 */
import { describe, it, expect } from 'vitest';
import en from '@/lib/i18n/en';
import hi from '@/lib/i18n/hi';

const FORBIDDEN_PHRASES = [
  'nothing is sent',
  'in-memory only',
  'fully offline',
  'completely offline',
  'never leaves your device',
  'stays on your device',
  'no data is transmitted',
  'your data never leaves',
];

function checkStrings(dict: Record<string, string>, lang: string) {
  for (const [key, value] of Object.entries(dict)) {
    for (const phrase of FORBIDDEN_PHRASES) {
      it(`${lang}.${key} should not contain "${phrase}"`, () => {
        expect(value.toLowerCase()).not.toContain(phrase.toLowerCase());
      });
    }
  }
}

describe('Privacy Copy Accuracy', () => {
  describe('English strings', () => {
    checkStrings(en, 'en');
  });

  describe('Hindi strings', () => {
    // Hindi check is for transliterated/English phrases that might slip in
    const hiEntries = Object.fromEntries(
      Object.entries(hi).filter(([, v]) => /[a-zA-Z]/.test(v))
    );
    checkStrings(hiEntries, 'hi');
  });

  it('EN privacyNotice should mention Gemini data flow', () => {
    expect(en.privacyNotice.toLowerCase()).toContain('gemini');
    expect(en.privacyNotice.toLowerCase()).toContain('sent');
  });

  it('EN privacyNotice should mention local audit', () => {
    expect(en.privacyNotice.toLowerCase()).toContain('locally');
  });
});
