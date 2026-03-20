import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface PharmaProfile {
  id: string;
  pharmacy_name: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  license_number: string | null;
  verification_status?: string | null;
}

export function usePharmaContext() {
  const navigate = useNavigate();
  const [pharma, setPharma] = useState<PharmaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/pharma/login', { replace: true });
        return;
      }

      const role = user.user_metadata?.role;
      if (role !== 'pharma') {
        navigate('/', { replace: true });
        return;
      }

      // ── Check active subscription ─────────────────────────────────────────
      const { data: subscription } = await (supabase as any)
        .from('pharmacy_subscriptions')
        .select('id, status, expires_at')
        .eq('pharmacy_id', user.id)
        .eq('status', 'active')
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const hasActiveSub =
        subscription &&
        subscription.status === 'active' &&
        new Date(subscription.expires_at) > new Date();

      if (!hasActiveSub) {
        // Redirect to subscription-required page — the pharmacy has logged in
        // but hasn't paid / admin hasn't verified yet.
        navigate('/pharma/subscription-required', { replace: true });
        return;
      }

      // ── Fetch / auto-create pharmacy profile ───────────────────────────────
      let { data: profile } = await (supabase as any)
        .from('pharmacies')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        const newPharma: PharmaProfile = {
          id: user.id,
          pharmacy_name: user.user_metadata?.pharmacy_name || user.user_metadata?.full_name || 'Partner Pharmacy Hub',
          owner_name: user.user_metadata?.full_name || 'Owner',
          email: user.email || '',
          phone: null,
          address: null,
          license_number: null,
          verification_status: 'Pending',
        };
        const { data: inserted, error } = await (supabase as any)
          .from('pharmacies')
          .insert([newPharma])
          .select()
          .single();
        profile = (!error && inserted) ? inserted : newPharma;
      }

      setPharma(profile as unknown as PharmaProfile);
      setAuthorized(true);
      setLoading(false);
    };

    check();
  }, [navigate]);

  return { pharma, loading, authorized };
}
