import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { usePharmaContext } from '@/hooks/usePharmaContext';
import PharmaProtectedRoute from '@/components/pharma/PharmaProtectedRoute';
import PharmaSidebar from '@/components/pharma/PharmaSidebar';
import PharmaTopBar from '@/components/pharma/PharmaTopBar';

const PharmaDashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pharma, loading, authorized } = usePharmaContext();

  return (
    <PharmaProtectedRoute loading={loading} authorized={authorized}>
      <div className="min-h-screen" style={{ background: '#F7FBFC' }}>
        <PharmaSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} pharma={pharma} />
        <div className="lg:ml-[260px] min-h-screen flex flex-col">
          <PharmaTopBar onMenuClick={() => setMobileOpen(true)} pharma={pharma} />
          <main className="flex-1 p-4 lg:p-8">
            <Outlet context={{ pharma }} />
          </main>
        </div>
      </div>
    </PharmaProtectedRoute>
  );
};

export default PharmaDashboardLayout;
