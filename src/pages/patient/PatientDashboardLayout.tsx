import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PatientProtectedRoute from '@/components/patient/dashboard/PatientProtectedRoute';
import PatientSidebar from '@/components/patient/dashboard/PatientSidebar';
import PatientTopBar from '@/components/patient/dashboard/PatientTopBar';
import QRModal from '@/components/patient/dashboard/QRModal';
import { LanguageProvider } from '@/contexts/LanguageContext';

const PatientDashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);

  return (
    <LanguageProvider>
      <PatientProtectedRoute>
        {(patient) => (
          <div className="min-h-screen" style={{ background: '#F7FBFC' }}>
            <PatientSidebar
              patient={patient}
              mobileOpen={mobileOpen}
              onMobileClose={() => setMobileOpen(false)}
              onShowQR={() => setShowQR(true)}
            />
            <div className="lg:ml-[260px] min-h-screen flex flex-col">
              <PatientTopBar patient={patient} onMenuClick={() => setMobileOpen(true)} />
              <main className="flex-1 p-4 lg:p-8">
                <Outlet context={{ patient }} />
              </main>
            </div>

            {showQR && <QRModal patient={patient} onClose={() => setShowQR(false)} />}
          </div>
        )}
      </PatientProtectedRoute>
    </LanguageProvider>
  );
};

export default PatientDashboardLayout;

