import { useLocale } from 'next-intl';
import { LocalizedString } from '@/src/types';

/**
 * Hook to automatically extract the localized string based on current locale.
 * Fallbacks to English if the current locale string is empty or missing.
 */
export function useLocaleString() {
  const locale = useLocale();

  const getLocalizedString = (localizedObj?: LocalizedString | null): string => {
    if (!localizedObj) return '';
    
    // If locale is 'ar' and 'ar' exists, return it. Otherwise fallback to 'en'.
    if (locale === 'ar' && localizedObj.ar) {
      return localizedObj.ar;
    }
    
    return localizedObj.en || '';
  };

  return { getLocalizedString, locale };
}
