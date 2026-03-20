import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HospitalRegistration from "./pages/HospitalRegistration";
import PatientSignup from "./pages/PatientSignup";
import UnifiedLogin from "./pages/UnifiedLogin";
import ComingSoon from "./pages/ComingSoon";
import PatientResetPassword from "./pages/PatientResetPassword";
import PharmaRegistration from "./pages/PharmaRegistration";
import PharmaDashboardLayout from "./pages/pharma/PharmaDashboardLayout";
import PharmaOverview from "./pages/pharma/PharmaOverview";
import PharmaAnalyticsPage from "./pages/pharma/PharmaAnalyticsPage";

import PharmaRevenue from "./pages/pharma/PharmaRevenue";
import PharmaStatements from "./pages/pharma/PharmaStatements";
import PharmaBankDetails from "./pages/pharma/PharmaBankDetails";
import PharmaAgreement from "./pages/pharma/PharmaAgreement";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import HospitalApprovals from "./pages/admin/HospitalApprovals";
import Patients from "./pages/admin/Patients";
import ActivityLog from "./pages/admin/ActivityLog";
import AdminSettings from "./pages/admin/AdminSettings";
import PatientDashboardLayout from "./pages/patient/PatientDashboardLayout";
import PatientOverview from "./pages/patient/PatientOverview";
import PatientRecords from "./pages/patient/PatientRecords";
import PatientReports from "./pages/patient/PatientReports";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientFindDoctors from "./pages/patient/PatientFindDoctors";
import PatientFindPharma from "./pages/patient/PatientFindPharma";
import PatientEmergency from "./pages/patient/PatientEmergency";
import PatientSettings from "./pages/patient/PatientSettings";
import PatientFitness from "./pages/patient/PatientFitness";
import PatientBloodNetwork from "./pages/patient/PatientBloodNetwork";
import HospitalDashboardLayout from "./pages/hospital/HospitalDashboardLayout";
import HospitalOverview from "./pages/hospital/HospitalOverview";
import HospitalPatients from "./pages/hospital/HospitalPatients";
import HospitalAppointments from "./pages/hospital/HospitalAppointments";
import HospitalEmergency from "./pages/hospital/HospitalEmergency";
import HospitalBloodNetwork from "./pages/hospital/HospitalBloodNetwork";
import HospitalBeds from "./pages/hospital/HospitalBeds";
import HospitalStaff from "./pages/hospital/HospitalStaff";
import HospitalInventory from "./pages/hospital/HospitalInventory";
import HospitalBilling from "./pages/hospital/HospitalBilling";
import HospitalAnalytics from "./pages/hospital/HospitalAnalytics";
import HospitalDocuments from "./pages/hospital/HospitalDocuments";
import HospitalSettings from "./pages/hospital/HospitalSettings";
import HospitalPending from "./pages/hospital/HospitalPending";
import HospitalRejected from "./pages/hospital/HospitalRejected";
import HospitalPrescriptions from "./pages/hospital/HospitalPrescriptions";
import HospitalPrescriptionAnalytics from "./pages/hospital/HospitalPrescriptionAnalytics";
import PublicQRProfile from "./pages/PublicQRProfile";

// NGO Pages
import NGORegistration from "./pages/ngo/NGORegistration";
import NGODashboard from "./pages/ngo/NGODashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<HospitalRegistration />} />
          <Route path="/patient/signup" element={<PatientSignup />} />
          <Route path="/login" element={<UnifiedLogin />} />
          <Route path="/patient/login" element={<UnifiedLogin />} />
          <Route path="/hospital/login" element={<UnifiedLogin />} />
          <Route path="/pharma/login" element={<UnifiedLogin />} />
          <Route path="/ngo/login" element={<UnifiedLogin />} />
          
          {/* NGO routes */}
          <Route path="/ngo/register" element={<NGORegistration />} />
          <Route path="/ngo/dashboard" element={<NGODashboard />} />

          {/* Patient dashboard routes */}
          <Route path="/patient/dashboard" element={<PatientDashboardLayout />}>
            <Route index element={<PatientOverview />} />
            <Route path="records" element={<PatientRecords />} />
            <Route path="reports" element={<PatientReports />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="find" element={<PatientFindDoctors />} />
            <Route path="pharmacy" element={<PatientFindPharma />} />
            <Route path="emergency" element={<PatientEmergency />} />
            <Route path="blood-network" element={<PatientBloodNetwork />} />
            <Route path="fitness" element={<PatientFitness />} />
            <Route path="settings" element={<PatientSettings />} />
          </Route>
          <Route path="/patient/reset-password" element={<PatientResetPassword />} />
          <Route path="/hospital/pending" element={<HospitalPending />} />
          <Route path="/hospital/rejected" element={<HospitalRejected />} />
          {/* Hospital dashboard routes */}
          <Route path="/hospital/dashboard" element={<HospitalDashboardLayout />}>
            <Route index element={<HospitalOverview />} />
            <Route path="patients" element={<HospitalPatients />} />
            <Route path="appointments" element={<HospitalAppointments />} />
            <Route path="prescriptions" element={<HospitalPrescriptions />} />
            <Route path="prescriptions/analytics" element={<HospitalPrescriptionAnalytics />} />
            <Route path="emergency" element={<HospitalEmergency />} />
            <Route path="blood-network" element={<HospitalBloodNetwork />} />
            <Route path="beds" element={<HospitalBeds />} />
            <Route path="staff" element={<HospitalStaff />} />
            <Route path="inventory" element={<HospitalInventory />} />
            <Route path="billing" element={<HospitalBilling />} />
            <Route path="analytics" element={<HospitalAnalytics />} />
            <Route path="documents" element={<HospitalDocuments />} />
            <Route path="settings" element={<HospitalSettings />} />
          </Route>
          
          {/* Fixed Pharma routes */}
          <Route path="/pharma/register" element={<PharmaRegistration />} />

          {/* Pharma dashboard routes */}
          <Route path="/pharma/dashboard" element={<PharmaDashboardLayout />}>
            <Route index element={<PharmaOverview />} />
            <Route path="revenue" element={<PharmaRevenue />} />
            <Route path="statements" element={<PharmaStatements />} />
            <Route path="bank" element={<PharmaBankDetails />} />
            <Route path="agreement" element={<PharmaAgreement />} />
            <Route path="prescriptions" element={<div>Prescriptions Page</div>} />
            <Route path="orders" element={<div>Orders Page</div>} />
            <Route path="settings" element={<div>Settings Page</div>} />
          </Route>
          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Overview />} />
            <Route path="hospitals" element={<HospitalApprovals />} />
            <Route path="patients" element={<Patients />} />
            <Route path="logs" element={<ActivityLog />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/qr/:patientId" element={<PublicQRProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
