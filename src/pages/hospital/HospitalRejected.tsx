import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { XCircle } from 'lucide-react';
import JharokhaArch from '@/components/admin/JharokhaArch';

const HospitalRejected = () => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<any>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/hospital/login', { replace: true }); return; }
      const { data } = await supabase.from('hospitals').select('*').eq('supabase_user_id', user.id).single();
      if (!data) { navigate('/register', { replace: true }); return; }
      if (data.verification_status === 'Verified') { navigate('/hospital/dashboard', { replace: true }); return; }
      if (data.verification_status === 'Pending') { navigate('/hospital/pending', { replace: true }); return; }
      setHospital(data);
      // Try to find rejection reason from admin_logs
      const { data: logs } = await supabase.from('admin_logs').select('notes').eq('target_id', data.id).eq('action', 'reject_hospital').order('created_at', { ascending: false }).limit(1);
      if (logs && logs.length > 0 && logs[0].notes) setReason(logs[0].notes);
    };
    check();
  }, [navigate]);

  if (!hospital) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7FBFC' }}>
      <div className="w-full max-w-[520px] bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
        <JharokhaArch color="#EF4444" opacity={0.2} />
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#FEF2F2' }}>
            <XCircle size={28} style={{ color: '#EF4444' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            Application Not Approved
          </h1>

          {reason && (
            <div className="p-4 rounded-lg mb-4 text-left text-[13px]" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
              <p className="font-semibold mb-1">Reason for rejection:</p>
              <p>{reason}</p>
            </div>
          )}

          <p className="text-[14px] mb-6" style={{ color: '#64748B' }}>
            You may re-apply after addressing the issues above.
          </p>

          <button onClick={() => navigate('/register')} className="px-6 py-2.5 rounded-lg text-[14px] font-semibold text-white mb-4" style={{ background: '#0891B2' }}>
            Re-Register
          </button>
          <p className="text-[13px] mb-3 mt-3" style={{ color: '#64748B' }}>
            <a href="mailto:support@sanjeevani.in" className="hover:underline">Contact Support</a>
          </p>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} className="text-[13px] font-medium" style={{ color: '#EF4444' }}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalRejected;
