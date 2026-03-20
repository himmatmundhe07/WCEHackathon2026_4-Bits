import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface HospitalProfile {
  id: string;
  hospital_name: string;
  logo_url: string | null;
  admin_email: string;
  admin_name: string | null;
  verification_status: string | null;
  facility_type: string | null;
  license_id: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  emergency_helpline: string | null;
  email: string;
  website: string | null;
  maps_link: string | null;
  address: string | null;
  pin_code: string | null;
  year_established: number | null;
  emergency_24x7: boolean | null;
  blood_bank: boolean | null;
  pharmacy: boolean | null;
  total_beds: number | null;
  icu_beds: number | null;
  general_ward_beds: number | null;
  private_rooms: number | null;
  operation_theatres: number | null;
  ambulances: number | null;
  total_doctors: number | null;
  total_nurses: number | null;
  support_staff: number | null;
  specializations: string[] | null;
  supabase_user_id: string;
  registered_at: string | null;
}

export function useHospitalContext() {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<HospitalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) { navigate('/hospital/login', { replace: true }); return; }
      const role = user.user_metadata?.role;
      if (role !== 'hospital' && role !== 'hospital_admin') {
        // Fallback: check if a hospital record exists with this user's email
        const { data: fallback } = await supabase
          .from('hospitals')
          .select('id')
          .eq('admin_email', user.email)
          .maybeSingle();
        if (!fallback) { navigate('/', { replace: true }); return; }
      }

      const { data: h } = await supabase
        .from('hospitals')
        .select('*')
        .or(`supabase_user_id.eq.${user.id},admin_email.eq.${user.email}`)
        .single();

      if (!h) { navigate('/register', { replace: true }); return; }

      if (h.verification_status === 'Pending') { navigate('/hospital/pending', { replace: true }); return; }
      if (h.verification_status === 'Rejected') { navigate('/hospital/rejected', { replace: true }); return; }

      setHospital(h as HospitalProfile);
      setAuthorized(true);
      setLoading(false);
    };
    check();
  }, [navigate]);

  return { hospital, loading, authorized };
}
