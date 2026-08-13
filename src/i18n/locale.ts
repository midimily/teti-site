export type Locale = 'en' | 'zh';

export const LOCALE_STORAGE_KEY = 'teti.locale';

export function resolveLocale(
  savedLocale: string | null | undefined,
  browserLanguages: readonly string[] = [],
): Locale {
  if (savedLocale === 'zh' || savedLocale === 'en') {
    return savedLocale;
  }
  return browserLanguages.some(language => language.toLowerCase().startsWith('zh')) ? 'zh' : 'en';
}
