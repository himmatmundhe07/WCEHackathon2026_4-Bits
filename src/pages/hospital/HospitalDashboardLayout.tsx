import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useHospitalContext } from '@/hooks/useHospitalContext';
import HospitalProtectedRoute from '@/components/hospital/HospitalProtectedRoute';
import HospitalSidebar from '@/components/hospital/HospitalSidebar';
import HospitalTopBar from '@/components/hospital/HospitalTopBar';

export const HospitalContext = { hospital: null as any };

const HospitalDashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { hospital, loading, authorized } = useHospitalContext();

  return (
    <HospitalProtectedRoute loading={loading} authorized={authorized}>
      <div className="min-h-screen" style={{ background: '#F7FBFC' }}>
        <HospitalSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} hospital={hospital} />
        <div className="lg:ml-[260px] min-h-screen flex flex-col">
          <HospitalTopBar onMenuClick={() => setMobileOpen(true)} hospital={hospital} />
          <main className="flex-1 p-4 lg:p-8">
            <Outlet context={{ hospital }} />
          </main>
        </div>
      </div>
    </HospitalProtectedRoute>
  );
};

export default HospitalDashboardLayout;
