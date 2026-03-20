import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en',  label: 'English',    nativeLabel: 'English' },
  { code: 'hi',  label: 'Hindi',      nativeLabel: 'हिन्दी' },
  { code: 'gu',  label: 'Gujarati',   nativeLabel: 'ગુજરાતી' },
  { code: 'mr',  label: 'Marathi',    nativeLabel: 'मराठी' },
  { code: 'raj', label: 'Rajasthani', nativeLabel: 'राजस्थानी' },
];

const GlobalLanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLang = i18n.language || 'en';
  const current = LANGUAGES.find(l => l.code === currentLang);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-gray-100"
        style={{ color: '#0891B2', border: '1px solid #E2EEF1' }}
      >
        <Globe size={14} />
        <span className="hidden sm:inline">{current?.nativeLabel || 'EN'}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg py-1 z-50 overflow-hidden"
          style={{ border: '1px solid #E2EEF1' }}
        >
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => {
                i18n.changeLanguage(l.code);
                localStorage.setItem('sanjeevani_lang', l.code);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-[13px] font-medium flex items-center justify-between transition-all hover:bg-[#F7FBFC]"
              style={{
                color: currentLang === l.code ? '#0891B2' : '#1E293B',
                background: currentLang === l.code ? '#EBF7FA' : 'transparent',
              }}
            >
              <span>{l.nativeLabel}</span>
              <span className="text-[11px]" style={{ color: '#94A3B8' }}>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalLanguageSwitcher;
