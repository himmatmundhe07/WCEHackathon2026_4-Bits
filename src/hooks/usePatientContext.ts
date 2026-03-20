import { useOutletContext } from 'react-router-dom';
import type { PatientProfile } from '@/components/patient/dashboard/PatientProtectedRoute';

export function usePatientContext() {
  return useOutletContext<{ patient: PatientProfile }>();
}
