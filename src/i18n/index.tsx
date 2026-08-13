import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';

import {en, type MessageKey} from './en';
import {LOCALE_STORAGE_KEY, resolveLocale, type Locale} from './locale';
import {zh} from './zh';

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
};

const I18nContext = createContext<I18nValue | null>(null);
const messages = {en, zh};

function browserLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return resolveLocale(saved, languages);
}

export function I18nProvider({children}: {children: ReactNode}) {
  const [locale, setLocaleState] = useState<Locale>(browserLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nValue>(() => {
    const t = (key: MessageKey, values: Record<string, string | number> = {}) =>
      Object.entries(values).reduce(
        (result, [name, replacement]) => result.replaceAll(`{${name}}`, String(replacement)),
        messages[locale][key] as string,
      );
    return {
      locale,
      setLocale: nextLocale => {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
        setLocaleState(nextLocale);
      },
      t,
      formatNumber: valueToFormat => new Intl.NumberFormat(locale).format(valueToFormat),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
