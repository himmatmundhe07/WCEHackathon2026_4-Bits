import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const routeLabels: Record<string, string> = {
  '/admin/dashboard': 'Overview',
  '/admin/hospitals': 'Hospital Approvals',
  '/admin/patients': 'Patients',
  '/admin/logs': 'Activity Log',
  '/admin/settings': 'Settings',
};

interface AdminTopBarProps {
  onMenuClick: () => void;
  adminEmail?: string;
}

const AdminTopBar = ({ onMenuClick, adminEmail }: AdminTopBarProps) => {
  const location = useLocation();
  const pageLabel = routeLabels[location.pathname] || 'Dashboard';

  const initials = (adminEmail || 'AD').slice(0, 2).toUpperCase();

  return (
    <div className="sticky top-0 z-30 flex items-center h-14 px-4 lg:px-8 bg-white" style={{ borderBottom: '1px solid #E2EEF1' }}>
      <button onClick={onMenuClick} className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-gray-100">
        <Menu size={20} style={{ color: '#64748B' }} />
      </button>

      <div className="flex items-center gap-1.5 text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span style={{ color: '#64748B' }}>Admin</span>
        <span style={{ color: '#64748B' }}>/</span>
        <span className="font-semibold" style={{ color: '#1E293B' }}>{pageLabel}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#0891B2' }}>
          {initials}
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;
