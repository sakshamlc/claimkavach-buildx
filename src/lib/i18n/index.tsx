/**
 * ClaimKavach i18n — Entry point
 * Provides a React context-based translation hook.
 */
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import en, { type I18nKeys } from './en';
import hi from './hi';

export type Locale = 'en' | 'hi';

const dictionaries: Record<Locale, Record<I18nKeys, string>> = { en, hi };

interface I18nContextValue {
  locale: Locale;
  t: (key: I18nKeys) => string;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, defaultLocale = 'en' }: { children: ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const t = useCallback(
    (key: I18nKeys): string => {
      return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
    },
    [locale],
  );

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === 'en' ? 'hi' : 'en'));
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}

export { type I18nKeys };
