import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export interface PatientProfile {
  id: string;
  full_name: string;
  email: string;
  blood_group: string | null;
  abha_card_no: string | null;
  abha_id: string | null;
  profile_photo_url: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  age: number | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  current_medications: string[] | null;
  past_surgeries: string[] | null;
  disabilities: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  has_insurance: boolean | null;
  insurance_provider: string | null;
  insurance_policy_no: string | null;
  insurance_type: string | null;
  insurance_validity_date: string | null;
  sum_insured: string | null;
  organ_donor: boolean | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  aadhaar_number: string | null;
  supabase_user_id: string;
}


interface Props {
  children: (patient: PatientProfile) => React.ReactNode;
}

const PatientProtectedRoute = ({ children }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientProfile | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/patient/login', { replace: true }); return; }

      const role = user.user_metadata?.role;
      if (role === 'admin') { navigate('/', { replace: true }); return; }

      const { data: pat } = await supabase
        .from('patients')
        .select('*')
        .eq('supabase_user_id', user.id)
        .single();

      if (!pat) { navigate('/patient/signup', { replace: true }); return; }
      setPatient(pat as PatientProfile);
      setLoading(false);
    };
    check();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7FBFC' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#0891B2' }} />
      </div>
    );
  }

  if (!patient) return null;
  return <>{children(patient)}</>;
};

export default PatientProtectedRoute;
