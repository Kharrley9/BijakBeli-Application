import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Category } from '../types';
import { Language, getPrefs, loadPrefs, setPref } from '../utils/prefs';

/**
 * App language (Malay / English), chosen in Settings and remembered via prefs.
 * For now it drives the category names; the rest of the UI is still English.
 */
interface LanguageContextData {
  lang: Language;
  setLang: (l: Language) => void;
}

const LanguageContext = createContext<LanguageContextData>({ lang: 'ms', setLang: () => {} });

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(getPrefs().language);

  useEffect(() => {
    loadPrefs().then((p) => setLangState(p.language));
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    setPref('language', l);
  };

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

/** Category name in the chosen language (falls back to the Malay name). */
export const categoryLabel = (c: Pick<Category, 'categoryName' | 'nameEn'>, lang: Language) =>
  lang === 'en' && c.nameEn ? c.nameEn : c.categoryName;
