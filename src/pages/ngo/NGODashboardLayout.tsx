import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NGOSidebar from '@/components/ngo/NGOSidebar';
import NGOTopBar from '@/components/ngo/NGOTopBar';

const NGODashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login?role=ngo');
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NGOSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      
      <div className="lg:ml-[260px] min-h-screen flex flex-col transition-all duration-300">
        <NGOTopBar onMenuClick={() => setMobileOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-8 animate-fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default NGODashboardLayout;
