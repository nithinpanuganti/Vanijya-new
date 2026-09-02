'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language, UnifiedTranslations } from './types';
import { en } from './en';
import { hi } from './hi';
import { te } from './te';
import { getLocalizedCropName } from './crops';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: UnifiedTranslations;
  tCrop: (cropNameOrId: string | undefined | null) => string;
}

const translationsMap: Record<Language, UnifiedTranslations> = {
  en,
  hi,
  te,
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: en,
  tCrop: (crop) => crop || '',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Priority 1: localStorage -> Priority 2: navigator.language -> Priority 3: Default 'en'
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vanijya_unified_language') as Language;
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'te')) {
        setLanguageState(saved);
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.language) {
        const navLang = navigator.language.toLowerCase();
        if (navLang.startsWith('hi')) {
          setLanguageState('hi');
          return;
        }
        if (navLang.startsWith('te')) {
          setLanguageState('te');
          return;
        }
      }
    } catch {
      // Fallback to default
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('vanijya_unified_language', lang);
      // Optional document language attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const t = useMemo(() => translationsMap[language] || en, [language]);

  const tCrop = useCallback((cropNameOrId: string | undefined | null) => {
    return getLocalizedCropName(cropNameOrId, language);
  }, [language]);

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      tCrop,
    }),
    [language, setLanguage, t, tCrop],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}
