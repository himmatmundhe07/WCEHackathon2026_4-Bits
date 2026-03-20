import { Menu, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/patient/dashboard/LanguageSwitcher';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PatientProfile } from './PatientProtectedRoute';

const routeKeys: Record<string, string> = {
  '/patient/dashboard': 'sidebar.overview',
  '/patient/dashboard/records': 'sidebar.medicalRecords',
  '/patient/dashboard/reports': 'sidebar.labReports',
  '/patient/dashboard/appointments': 'sidebar.appointments',
  '/patient/dashboard/find': 'sidebar.findDoctors',
  '/patient/dashboard/emergency': 'sidebar.emergencyProfile',
  '/patient/dashboard/settings': 'sidebar.settings',
};

interface Props {
  patient: PatientProfile;
  onMenuClick: () => void;
}

const PatientTopBar = ({ patient, onMenuClick }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const routeKey = routeKeys[location.pathname] || 'topbar.dashboard';
  const pageLabel = t(routeKey);
  const initials = patient.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/patient/login');
  };

  return (
    <div className="sticky top-0 z-30 flex items-center h-14 px-4 lg:px-8 bg-white" style={{ borderBottom: '1px solid #E2EEF1' }}>
      <button onClick={onMenuClick} className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-gray-100">
        <Menu size={20} style={{ color: '#64748B' }} />
      </button>

      <div className="flex items-center gap-1.5 text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span style={{ color: '#64748B' }}>{t('topbar.myHealth')}</span>
        <span style={{ color: '#64748B' }}>/</span>
        <span className="font-semibold" style={{ color: '#1E293B' }}>{pageLabel}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <LanguageSwitcher />
        <NotificationBell userId={patient.supabase_user_id} />
        <span className="text-[13px] font-medium hidden sm:block" style={{ color: '#1E293B' }}>{patient.full_name}</span>
        {patient.profile_photo_url ? (
          <img src={patient.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#0891B2' }}>
            {initials}
          </div>
        )}
        <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-gray-100 hidden sm:block">
          <LogOut size={16} style={{ color: '#EF4444' }} />
        </button>
      </div>
    </div>
  );
};

export default PatientTopBar;
