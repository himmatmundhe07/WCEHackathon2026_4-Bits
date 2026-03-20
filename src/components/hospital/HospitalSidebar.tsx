import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, CalendarDays, AlertTriangle, BedDouble,
  UserCog, Package, Receipt, TrendingUp, FolderOpen, Settings,
  LogOut, X, Pill
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

const navItems = [
  { label: 'Overview', icon: BarChart3, path: '/hospital/dashboard' },
  { label: 'Patients', icon: Users, path: '/hospital/dashboard/patients', badgeKey: 'patients' },
  { label: 'Appointments', icon: CalendarDays, path: '/hospital/dashboard/appointments', badgeKey: 'appointments' },
  { label: 'Prescriptions', icon: Pill, path: '/hospital/dashboard/prescriptions', badgeKey: 'prescriptions' },
  { label: 'Emergency Alerts', icon: AlertTriangle, path: '/hospital/dashboard/emergency', badgeKey: 'emergency' },
  { label: 'Bed Management', icon: BedDouble, path: '/hospital/dashboard/beds' },
  { label: 'Staff Roster', icon: UserCog, path: '/hospital/dashboard/staff' },
  { label: 'Inventory', icon: Package, path: '/hospital/dashboard/inventory', badgeKey: 'inventory' },
  { label: 'Billing', icon: Receipt, path: '/hospital/dashboard/billing' },
  { label: 'Analytics', icon: TrendingUp, path: '/hospital/dashboard/analytics' },
  { label: 'Document Vault', icon: FolderOpen, path: '/hospital/dashboard/documents', badgeKey: 'documents' },
  { label: 'Settings', icon: Settings, path: '/hospital/dashboard/settings' },
];

const LotusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="16" rx="3" ry="5" fill="#0891B2" fillOpacity="0.8" />
    <ellipse cx="7" cy="14" rx="2.5" ry="5" fill="#0891B2" fillOpacity="0.5" transform="rotate(-20 7 14)" />
    <ellipse cx="17" cy="14" rx="2.5" ry="5" fill="#0891B2" fillOpacity="0.5" transform="rotate(20 17 14)" />
    <circle cx="12" cy="14" r="1.5" fill="#F59E0B" />
  </svg>
);

const MehraabArch = () => (
  <svg width="100%" height="28" viewBox="0 0 260 28" preserveAspectRatio="none" className="block mt-auto">
    <path d="M0 28 Q30 28 60 14 Q100 0 130 0 Q160 0 200 14 Q230 28 260 28" fill="none" stroke="#F59E0B" strokeOpacity="0.12" strokeWidth="1.5" />
  </svg>
);

interface HospitalSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  hospital: HospitalProfile | null;
}

const HospitalSidebar = ({ mobileOpen, onMobileClose, hospital }: HospitalSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!hospital) return;
    const fetchBadges = async () => {
      const [patients, appointments, emergency, inventory] = await Promise.all([
        supabase.from('hospital_patients').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id).eq('relationship_type', 'Admitted'),
        supabase.from('patient_appointments').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id).eq('status', 'Upcoming'),
        supabase.from('qr_scan_logs').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id).eq('resolved', false),
        supabase.from('hospital_inventory').select('id, quantity, min_threshold').eq('hospital_id', hospital.id),
      ]);
      const lowStock = (inventory.data || []).filter(i => (i.quantity || 0) <= (i.min_threshold || 10)).length;
      setBadges({
        patients: patients.count || 0,
        appointments: appointments.count || 0,
        emergency: emergency.count || 0,
        inventory: lowStock,
      });
    };
    fetchBadges();
  }, [hospital]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/hospital/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full jaali-pattern" style={{ background: '#EBF7FA', borderRight: '1px solid #D1EBF1' }}>
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <LotusIcon />
          <span className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Sanjeevani</span>
        </div>
        <div className="flex items-center gap-1 mb-4 ml-6">
          <span style={{ color: '#F59E0B', fontSize: '8px' }}>◇</span>
          <div className="h-px flex-1" style={{ background: '#F59E0B', maxWidth: '80px' }} />
          <span style={{ color: '#F59E0B', fontSize: '8px' }}>◇</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          {hospital?.logo_url ? (
            <img src={hospital.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#F59E0B' }}>
              {(hospital?.hospital_name || 'H').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[14px] font-bold truncate" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B', maxWidth: '170px' }}>
              {hospital?.hospital_name || 'Hospital'}
            </p>
            {hospital?.city && <p className="text-[11px]" style={{ color: '#64748B' }}>{hospital.city}{hospital.state ? `, ${hospital.state}` : ''}</p>}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md" style={{ background: '#10B981', color: '#fff' }}>
          ✅ Verified Hospital
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onMobileClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: active ? '#EBF7FA' : 'transparent',
                color: active ? '#0891B2' : '#64748B',
                borderLeft: active ? '3px solid #0891B2' : '3px solid transparent',
              }}
            >
              <item.icon size={18} />
              {item.label}
              {badge != null && badge > 0 && (
                <span className="ml-auto text-[10px] font-bold text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                  style={{ background: item.badgeKey === 'emergency' ? '#EF4444' : item.badgeKey === 'patients' ? '#0891B2' : '#F59E0B' }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Emergency shortcut */}
      <div className="mx-4 mb-3">
        <button
          onClick={() => navigate('/hospital/dashboard/emergency')}
          className="w-full p-3 rounded-lg border text-left transition-all hover:shadow-sm"
          style={{ background: '#FEF2F2', borderColor: '#EF4444' }}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[13px] font-bold" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>Emergency Alerts</span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: '#64748B' }}>
            {(badges.emergency || 0) > 0 ? `${badges.emergency} active alerts` : 'All clear'}
          </p>
        </button>
      </div>

      <div className="px-5 pb-4">
        <MehraabArch />
        <p className="text-[11px] mt-2 truncate" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
          Logged in as {hospital?.admin_email || ''}
        </p>
        <button onClick={handleLogout} className="text-[13px] font-medium mt-2 transition-colors hover:opacity-80" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
          <LogOut size={14} className="inline mr-1.5" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[260px] min-h-screen fixed left-0 top-0 z-40">
        {sidebarContent}
      </aside>
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

export default HospitalSidebar;
