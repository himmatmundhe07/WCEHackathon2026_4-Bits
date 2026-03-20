import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAdminEmail(user.email || '');
    });
  }, []);

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen" style={{ background: '#F7FBFC' }}>
        <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} adminEmail={adminEmail} />
        <div className="lg:ml-[260px] min-h-screen flex flex-col">
          <AdminTopBar onMenuClick={() => setMobileOpen(true)} adminEmail={adminEmail} />
          <main className="flex-1 p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
};

export default AdminLayout;
