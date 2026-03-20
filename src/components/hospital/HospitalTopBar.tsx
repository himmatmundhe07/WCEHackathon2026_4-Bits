import { Menu, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

const routeLabels: Record<string, string> = {
  '/hospital/dashboard': 'Overview',
  '/hospital/dashboard/patients': 'Patients',
  '/hospital/dashboard/appointments': 'Appointments',
  '/hospital/dashboard/emergency': 'Emergency Alerts',
  '/hospital/dashboard/beds': 'Bed Management',
  '/hospital/dashboard/staff': 'Staff Roster',
  '/hospital/dashboard/inventory': 'Inventory',
  '/hospital/dashboard/billing': 'Billing',
  '/hospital/dashboard/analytics': 'Analytics',
  '/hospital/dashboard/documents': 'Document Vault',
  '/hospital/dashboard/settings': 'Settings',
};

interface HospitalTopBarProps {
  onMenuClick: () => void;
  hospital: HospitalProfile | null;
}

const HospitalTopBar = ({ onMenuClick, hospital }: HospitalTopBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = routeLabels[location.pathname] || 'Dashboard';
  const initials = (hospital?.admin_name || hospital?.hospital_name || 'H').slice(0, 2).toUpperCase();

  return (
    <div className="sticky top-0 z-30 flex items-center h-14 px-4 lg:px-8 bg-white" style={{ borderBottom: '1px solid #E2EEF1' }}>
      <button onClick={onMenuClick} className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-gray-100">
        <Menu size={20} style={{ color: '#64748B' }} />
      </button>
      <div className="flex items-center gap-1.5 text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span style={{ color: '#64748B' }}>{hospital?.hospital_name || 'Hospital'}</span>
        <span style={{ color: '#64748B' }}>/</span>
        <span className="font-semibold" style={{ color: '#1E293B' }}>{pageLabel}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell userId={hospital?.supabase_user_id ?? null} />
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#F59E0B' }}>
          {initials}
        </div>
        <span className="hidden md:block text-[13px] font-medium" style={{ color: '#1E293B' }}>{hospital?.admin_name || ''}</span>
        <button onClick={async () => { await supabase.auth.signOut(); navigate('/hospital/login'); }} className="p-2 rounded-lg hover:bg-gray-50">
          <LogOut size={16} style={{ color: '#EF4444' }} />
        </button>
      </div>
    </div>
  );
};

export default HospitalTopBar;
