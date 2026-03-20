import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Pill, Package, DollarSign, FileText, 
  Landmark, ClipboardList, Settings, LogOut, X, ShieldCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { PharmaProfile } from '@/hooks/usePharmaContext';

const navItems = [
  { label: 'Overview', icon: BarChart3, path: '/pharma/dashboard' },
  { label: 'Prescriptions', icon: Pill, path: '/pharma/dashboard/prescriptions' },
  { label: 'Orders', icon: Package, path: '/pharma/dashboard/orders' },
  { label: 'Revenue & Commissions', icon: DollarSign, path: '/pharma/dashboard/revenue' },
  { label: 'Monthly Statements', icon: FileText, path: '/pharma/dashboard/statements' },
  { label: 'Bank Details', icon: Landmark, path: '/pharma/dashboard/bank' },
  { label: 'Agreement', icon: ClipboardList, path: '/pharma/dashboard/agreement' },
  { label: 'Settings', icon: Settings, path: '/pharma/dashboard/settings' },
];

const LotusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="16" rx="3" ry="5" fill="#0891B2" fillOpacity="0.8" />
    <ellipse cx="7" cy="14" rx="2.5" ry="5" fill="#0891B2" fillOpacity="0.5" transform="rotate(-20 7 14)" />
    <ellipse cx="17" cy="14" rx="2.5" ry="5" fill="#0891B2" fillOpacity="0.5" transform="rotate(20 17 14)" />
    <circle cx="12" cy="14" r="1.5" fill="#0891B2" />
  </svg>
);

const MehraabArch = () => (
  <svg width="100%" height="28" viewBox="0 0 260 28" preserveAspectRatio="none" className="block mt-auto">
    <path d="M0 28 Q30 28 60 14 Q100 0 130 0 Q160 0 200 14 Q230 28 260 28" fill="none" stroke="#0891B2" strokeOpacity="0.12" strokeWidth="1.5" />
  </svg>
);

interface PharmaSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  pharma: PharmaProfile | null;
}

const PharmaSidebar = ({ mobileOpen, onMobileClose, pharma }: PharmaSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/pharma/login');
  };

  const isVerified = pharma?.verification_status === 'Verified';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#ECFEFF]" style={{ 
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h2v2H0V0zm4 4h2v2H4V4zm4 4h2v2H8V8zm4 4h2v2h-2v-2zm4 4h2v2h-2v-2z\' fill=\'%230891B2\' fill-opacity=\'0.08\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
      borderRight: '1px solid #CFFAFE' 
    }}>
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <LotusIcon />
          <span className="text-lg font-bold font-display" style={{ color: '#1E293B' }}>Sanjeevani Pharma</span>
        </div>
        <div className="flex items-center gap-1 mb-4 ml-6">
          <span style={{ color: '#0891B2', fontSize: '8px' }}>◇</span>
          <div className="h-px flex-1" style={{ background: '#0891B2', maxWidth: '80px' }} />
          <span style={{ color: '#0891B2', fontSize: '8px' }}>◇</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm" style={{ background: '#0891B2' }}>
            {(pharma?.pharmacy_name || 'P').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[14px] font-bold font-display truncate text-[#1E293B] max-w-[170px]">
              {pharma?.pharmacy_name || 'Pharmacy'}
            </p>
            {isVerified ? (
              <p className="text-[11px] text-[#059669] flex items-center gap-1 font-medium">
                <ShieldCheck size={12} /> Verified Partner
              </p>
            ) : (
              <p className="text-[11px] text-[#D97706] flex items-center gap-1 font-medium">
                ⏳ Verification Pending
              </p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto mt-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onMobileClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: active ? '#CFFAFE' : 'transparent',
                color: active ? '#0891B2' : '#64748B',
                borderLeft: active ? '3px solid #0891B2' : '3px solid transparent',
              }}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-5 pb-4 mt-auto">
        <MehraabArch />
        <p className="text-[11px] mt-2 truncate font-sans text-[#94A3B8]">
          Logged in as {pharma?.email || ''}
        </p>
        <button onClick={handleLogout} className="text-[13px] font-medium mt-2 transition-colors hover:opacity-80 font-sans text-[#EF4444]">
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
            <button onClick={onMobileClose} className="absolute top-3 right-3 z-10 p-1 rounded-full text-[#64748B]">
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default PharmaSidebar;
