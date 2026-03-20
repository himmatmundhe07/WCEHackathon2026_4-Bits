import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Pill, ClipboardList, Calendar, Search, ShieldAlert, Settings, LogOut, X, QrCode, Store, Crown, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PatientProfile } from './PatientProtectedRoute';

const navItems = [
  { labelKey: 'sidebar.overview', icon: Home, path: '/patient/dashboard' },
  { labelKey: 'sidebar.medicalRecords', icon: Pill, path: '/patient/dashboard/records' },
  { labelKey: 'sidebar.labReports', icon: ClipboardList, path: '/patient/dashboard/reports' },
  { labelKey: 'sidebar.appointments', icon: Calendar, path: '/patient/dashboard/appointments' },
  { labelKey: '🏃 My Recovery Plan', icon: Activity, path: '/patient/dashboard/fitness' },
  { labelKey: 'sidebar.findDoctors', icon: Search, path: '/patient/dashboard/find' },
  { labelKey: 'sidebar.findPharmacy', icon: Store, path: '/patient/dashboard/pharmacy' },
  { labelKey: 'Sanjeevani+ Plans', icon: Crown, path: '/pricing' },
  { labelKey: 'sidebar.emergencyProfile', icon: ShieldAlert, path: '/patient/dashboard/emergency' },
  { labelKey: 'sidebar.settings', icon: Settings, path: '/patient/dashboard/settings' },
];

const LotusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <ellipse cx="8" cy="5" rx="2.5" ry="4" fill="#0891B2" opacity="0.9" />
    <ellipse cx="4.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(-25 4.5 8)" />
    <ellipse cx="11.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(25 11.5 8)" />
    <circle cx="8" cy="7.5" r="1.5" fill="#E8A820" />
  </svg>
);

const MehraabArch = () => (
  <svg width="100%" height="28" viewBox="0 0 260 28" preserveAspectRatio="none" className="block mt-auto">
    <path d="M0 28 Q30 28 60 14 Q100 0 130 0 Q160 0 200 14 Q230 28 260 28" fill="none" stroke="#0891B2" strokeOpacity="0.12" strokeWidth="1.5" />
  </svg>
);

interface Props {
  patient: PatientProfile;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onShowQR: () => void;
}

const PatientSidebar = ({ patient, mobileOpen, onMobileClose, onShowQR }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const firstName = patient.full_name?.split(' ')[0] || 'Patient';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/patient/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full jaali-pattern" style={{ background: '#EBF7FA', borderRight: '1px solid #D1EBF1' }}>
      <div className="p-5 pb-3">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-1">
          <LotusIcon />
          <span className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Sanjeevani</span>
        </div>
        <div className="flex items-center gap-1 mb-4 ml-6">
          <span style={{ color: '#F59E0B', fontSize: '8px' }}>◇</span>
          <div className="h-px flex-1" style={{ background: '#F59E0B', maxWidth: '80px' }} />
          <span style={{ color: '#F59E0B', fontSize: '8px' }}>◇</span>
        </div>

        <p className="text-[13px] mb-2" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
          {t('auth.welcome')}, {firstName}
        </p>
        {patient.abha_card_no ? (
          <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-md" style={{ background: '#0891B2', color: '#fff' }}>
            {t('auth.abhaLinked')}
          </span>
        ) : (
          <button onClick={() => navigate('/patient/dashboard/settings')}
            className="inline-block text-[11px] font-semibold px-3 py-1 rounded-md"
            style={{ border: '1px solid #F59E0B', color: '#F59E0B' }}>
            {t('auth.linkAbha')}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onMobileClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#0891B2' : '#64748B',
                borderLeft: active ? '3px solid #0891B2' : '3px solid transparent',
              }}
            >
              <item.icon size={18} />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>

      {/* Emergency QR shortcut */}
      <div className="px-4 mb-3">
        <button onClick={onShowQR}
          className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:opacity-90"
          style={{ background: 'rgba(8,145,178,0.08)', border: '1px solid #0891B2' }}>
          <QrCode size={24} style={{ color: '#0891B2' }} />
          <div className="text-left">
            <p className="text-[13px] font-bold" style={{ color: '#0891B2' }}>{t('emergency.myQR')}</p>
            <p className="text-[11px]" style={{ color: '#64748B' }}>{t('emergency.tapToView')}</p>
          </div>
        </button>
      </div>

      {/* Bottom */}
      <div className="px-5 pb-4">
        <MehraabArch />
        <p className="text-[11px] mt-2 truncate" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
          {patient.email}
        </p>
        <button onClick={handleLogout} className="text-[13px] font-medium mt-2 transition-colors hover:opacity-80" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
          <LogOut size={14} className="inline mr-1.5" /> {t('auth.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[260px] min-h-screen fixed left-0 top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={onMobileClose} />
          <aside className="relative w-[280px] h-full">
            <button onClick={onMobileClose} className="absolute top-3 right-3 z-10 p-1 rounded-full" style={{ color: '#64748B' }}>
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default PatientSidebar;
