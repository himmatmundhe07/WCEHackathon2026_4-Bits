import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-gray-100"
        style={{ color: '#0891B2', border: '1px solid #E2EEF1' }}
        title={t('language')}
      >
        <Globe size={14} />
        <span className="hidden sm:inline">{current?.nativeLabel || 'EN'}</span>
      </button>
      
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg py-1 z-50 overflow-hidden"
          style={{ border: '1px solid #E2EEF1' }}
        >
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
            {t('language')}
          </p>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-[13px] font-medium flex items-center justify-between transition-all hover:bg-[#F7FBFC]"
              style={{
                color: lang === l.code ? '#0891B2' : '#1E293B',
                background: lang === l.code ? '#EBF7FA' : 'transparent',
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

export default LanguageSwitcher;
