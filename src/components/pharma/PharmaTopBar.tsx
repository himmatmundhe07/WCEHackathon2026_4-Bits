import { Menu, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { PharmaProfile } from '@/hooks/usePharmaContext';

const routeLabels: Record<string, string> = {
  '/pharma/dashboard': 'Overview',
  '/pharma/dashboard/effectiveness': 'Medicine Effectiveness',
  '/pharma/dashboard/demographics': 'Patient Demographics',
  '/pharma/dashboard/disease-performance': 'Disease vs Medicine',
  '/pharma/dashboard/adherence': 'Medication Adherence',
  '/pharma/dashboard/side-effects': 'Side Effects Monitoring',
  '/pharma/dashboard/geographic': 'Geographic Analytics',
  '/pharma/dashboard/prescription-trends': 'Prescription Trends',
  '/pharma/dashboard/forecast': 'Demand Forecast',
  '/pharma/dashboard/comparison': 'Drug Comparison',
};

interface PharmaTopBarProps {
  onMenuClick: () => void;
  pharma: PharmaProfile | null;
}

const PharmaTopBar = ({ onMenuClick, pharma }: PharmaTopBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = routeLabels[location.pathname] || 'Dashboard';
  const initials = (pharma?.owner_name || pharma?.pharmacy_name || 'P').slice(0, 2).toUpperCase();

  return (
    <div className="sticky top-0 z-30 flex items-center h-14 px-4 lg:px-8 bg-white" style={{ borderBottom: '1px solid #E2EEF1' }}>
      <button onClick={onMenuClick} className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-gray-100">
        <Menu size={20} style={{ color: '#64748B' }} />
      </button>
      <div className="flex items-center gap-1.5 text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span style={{ color: '#64748B' }}>{pharma?.pharmacy_name || 'Pharmacy'}</span>
        <span style={{ color: '#64748B' }}>/</span>
        <span className="font-semibold" style={{ color: '#1E293B' }}>{pageLabel}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell userId={pharma?.supabase_user_id ?? null} />
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#8B5CF6' }}>
          {initials}
        </div>
        <span className="hidden md:block text-[13px] font-medium" style={{ color: '#1E293B' }}>{pharma?.owner_name || ''}</span>
        <button onClick={async () => { await supabase.auth.signOut(); navigate('/pharma/login'); }} className="p-2 rounded-lg hover:bg-gray-50">
          <LogOut size={16} style={{ color: '#EF4444' }} />
        </button>
      </div>
    </div>
  );
};

export default PharmaTopBar;
