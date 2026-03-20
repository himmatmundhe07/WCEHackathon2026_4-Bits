import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlobalLanguageSwitcher from '@/components/GlobalLanguageSwitcher';

interface NavbarProps {
  onAdminLogin: () => void;
  onScrollToCards: () => void;
}

const LotusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <ellipse cx="8" cy="5" rx="2.5" ry="4" fill="#0891B2" opacity="0.9" />
    <ellipse cx="4.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(-25 4.5 8)" />
    <ellipse cx="11.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(25 11.5 8)" />
    <circle cx="8" cy="7.5" r="1.5" fill="#E8A820" />
  </svg>
);

const Navbar = ({ onAdminLogin, onScrollToCards }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white flex items-center" style={{ borderBottom: '1px solid #E2EEF1' }}>
      <div className="w-full max-w-7xl mx-auto px-5 md:px-12 flex items-center justify-between">
        {/* Left — Logo */}
        <div className="flex items-center gap-2">
          <LotusIcon />
          <div className="inline-block">
            <span className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
              Sanjeevani
            </span>
            <svg width="100%" height="6" viewBox="0 0 110 6" preserveAspectRatio="none" className="block mt-[-2px]">
              <line x1="5" y1="3" x2="105" y2="3" stroke="#E8A820" strokeOpacity="0.6" strokeWidth="1" />
              <path d="M0 3l2.5-2.5 2.5 2.5-2.5 2.5z" fill="#E8A820" fillOpacity="0.6" />
              <path d="M105 3l2.5-2.5 2.5 2.5-2.5 2.5z" fill="#E8A820" fillOpacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Right — Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <button onClick={onScrollToCards} className="text-sm transition-colors hover:text-[#0891B2]" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
            {t('navbar.forPatients')}
          </button>
          <button onClick={onScrollToCards} className="text-sm transition-colors hover:text-[#0891B2]" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
            {t('navbar.forHospitals')}
          </button>
          <button onClick={onAdminLogin} className="text-sm px-4 py-1.5 rounded-lg border transition-colors hover:border-[#0891B2] hover:text-[#0891B2]" style={{ color: '#64748B', borderColor: '#E2EEF1', fontFamily: 'Inter, sans-serif' }}>
            {t('navbar.adminLogin')}
          </button>
          <GlobalLanguageSwitcher />
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <GlobalLanguageSwitcher />
          <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: '#1E293B' }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg md:hidden z-50" style={{ borderColor: '#E2EEF1' }}>
          <div className="flex flex-col p-4 gap-3">
            <button onClick={() => { onScrollToCards(); setMobileOpen(false); }} className="text-sm text-left py-2" style={{ color: '#64748B' }}>{t('navbar.forPatients')}</button>
            <button onClick={() => { onScrollToCards(); setMobileOpen(false); }} className="text-sm text-left py-2" style={{ color: '#64748B' }}>{t('navbar.forHospitals')}</button>
            <button onClick={() => { onAdminLogin(); setMobileOpen(false); }} className="text-sm text-left py-2" style={{ color: '#64748B' }}>{t('navbar.adminLogin')}</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
