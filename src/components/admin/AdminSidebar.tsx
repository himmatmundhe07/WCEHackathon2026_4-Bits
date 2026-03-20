import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, Users, ClipboardList, Settings, LogOut, Menu, X, Crown, Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Overview', icon: BarChart3, path: '/admin/dashboard' },
  { label: 'Hospital Approvals', icon: Building2, path: '/admin/hospitals' },
  { label: 'Pharmacy Approvals', icon: Pill, path: '/admin/pharmacy-approvals' },
  { label: 'Patients', icon: Users, path: '/admin/patients' },
  { label: 'Activity Log', icon: ClipboardList, path: '/admin/logs' },

  { label: 'Settings', icon: Settings, path: '/admin/settings' },
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
    <path d="M0 28 Q30 28 60 14 Q100 0 130 0 Q160 0 200 14 Q230 28 260 28" fill="none" stroke="#0891B2" strokeOpacity="0.12" strokeWidth="1.5" />
  </svg>
);

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  adminEmail?: string;
}

const AdminSidebar = ({ mobileOpen, onMobileClose, adminEmail }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPharmaSubs, setPendingPharmaSubs] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase
        .from('hospitals')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'Pending');
      setPendingCount(count || 0);
    };

    const fetchPendingPharmaSubs = async () => {
      const { count } = await (supabase as any)
        .from('pharmacy_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_payment');
      setPendingPharmaSubs(count || 0);
    };

    fetchPending();
    fetchPendingPharmaSubs();

    const channel = supabase
      .channel('pending-hospitals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, () => {
        fetchPending();
      })
      .subscribe();

    const pharmaChannel = supabase
      .channel('pending-pharma-subs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pharmacy_subscriptions' }, () => {
        fetchPendingPharmaSubs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(pharmaChannel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('admin_2fa_verified');
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full jaali-pattern" style={{ background: '#EBF7FA', borderRight: '1px solid #D1EBF1' }}>
      <div className="p-5 pb-3">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-1">
          <LotusIcon />
          <span className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Sanjeevani</span>
        </div>
        {/* Manuscript underline */}
        <div className="flex items-center gap-1 mb-4 ml-6">
          <span style={{ color: '#F59E0B', fontSize: '8px' }}>◇</span>
          <div className="h-px flex-1" style={{ background: '#F59E0B', maxWidth: '80px' }} />
          <span style={{ color: '#F59E0B', fontSize: '8px' }}>◇</span>
        </div>

        <p className="text-[13px] mb-2" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>Welcome, Admin</p>
        <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-md" style={{ background: '#0891B2', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
          Platform Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onMobileClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all relative"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#0891B2' : '#64748B',
                borderLeft: active ? '3px solid #0891B2' : '3px solid transparent',
              }}
            >
              <item.icon size={18} />
              {item.label}
              {item.label === 'Hospital Approvals' && pendingCount > 0 && (
                <span className="ml-auto text-[10px] font-bold text-white rounded-full w-5 h-5 flex items-center justify-center" style={{ background: '#EF4444' }}>
                  {pendingCount}
                </span>
              )}
              {item.label === 'Pharmacy Approvals' && pendingPharmaSubs > 0 && (
                <span className="ml-auto text-[10px] font-bold text-white rounded-full w-5 h-5 flex items-center justify-center" style={{ background: '#F59E0B' }}>
                  {pendingPharmaSubs}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-5 pb-4">
        <MehraabArch />
        <p className="text-[11px] mt-2 truncate" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
          {adminEmail || 'admin@sanjeevani.in'}
        </p>
        <button onClick={handleLogout} className="text-[13px] font-medium mt-2 transition-colors hover:opacity-80" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
          <LogOut size={14} className="inline mr-1.5" /> Logout
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

export default AdminSidebar;
