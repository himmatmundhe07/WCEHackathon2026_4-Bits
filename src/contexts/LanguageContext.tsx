import { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n'; // Initialize i18next

export type LangCode = 'en' | 'hi' | 'gu' | 'mr' | 'raj';

export const LANGUAGES: { code: LangCode; label: string; nativeLabel: string }[] = [
  { code: 'en',  label: 'English',    nativeLabel: 'English' },
  { code: 'hi',  label: 'Hindi',      nativeLabel: 'हिन्दी' },
  { code: 'gu',  label: 'Gujarati',   nativeLabel: 'ગુજરાતી' },
  { code: 'mr',  label: 'Marathi',    nativeLabel: 'मराठी' },
  { code: 'raj', label: 'Rajasthani', nativeLabel: 'राजस्थानी' },
];

// ---------- Context & Hook ----------
interface LanguageContextType {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string, options?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation();

  const lang = (i18n.language || 'en') as LangCode;

  const setLang = (l: LangCode) => {
    i18n.changeLanguage(l);
    localStorage.setItem('sanjeevani_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
