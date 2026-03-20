import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Clock, LogOut, RefreshCw, ShieldCheck, Pill } from 'lucide-react';
import { toast } from 'sonner';

interface SubRecord {
  status: string;
  plan_name: string;
  payment_reference: string | null;
  created_at: string;
}

const PharmaSubscriptionRequired = () => {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubRecord | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const loadSub = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/pharma/login', { replace: true }); return; }

      const { data } = await (supabase as any)
        .from('pharmacy_subscriptions')
        .select('status, plan_name, payment_reference, created_at')
        .eq('pharmacy_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSub(data ?? null);
    };
    loadSub();
  }, [navigate]);

  const handleRecheck = async () => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/pharma/login', { replace: true }); return; }

      const { data: subscription } = await (supabase as any)
        .from('pharmacy_subscriptions')
        .select('id, status, expires_at')
        .eq('pharmacy_id', user.id)
        .eq('status', 'active')
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const isActive =
        subscription &&
        subscription.status === 'active' &&
        new Date(subscription.expires_at) > new Date();

      if (isActive) {
        toast.success('Subscription verified! Welcome to your dashboard.');
        navigate('/pharma/dashboard', { replace: true });
      } else {
        toast.info('Payment not yet verified. Our team will activate your account shortly.');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/pharma/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F7FBFC' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <Pill size={20} className="text-[#8B5CF6]" />
            <span className="text-sm font-semibold text-[#8B5CF6]">Sanjeevani Pharmacy Network</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #F59E0B', boxShadow: '0 4px 24px rgba(245,158,11,0.1)' }}>

          {/* Top accent */}
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #F59E0B, #8B5CF6)' }} />

          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#FFFBEB', border: '2px solid #FDE68A' }}>
              <Clock size={28} className="text-[#F59E0B]" />
            </div>

            <h1 className="text-xl font-extrabold text-[#1E293B] mb-2">
              {sub?.status === 'pending_payment'
                ? '⏳ Payment Verification Pending'
                : '🔒 Subscription Required'}
            </h1>

            <p className="text-[14px] text-[#64748B] mb-6 leading-relaxed">
              {sub?.status === 'pending_payment'
                ? <>
                    Your <strong className="text-[#1E293B]">{sub.plan_name}</strong> subscription payment
                    is being verified by our team. This usually takes up to <strong>2 hours</strong>.
                  </>
                : <>
                    You need an active subscription to access the Sanjeevani pharmacy dashboard.
                    Please complete registration with a subscription plan.
                  </>}
            </p>

            {/* Payment reference chip */}
            {sub?.payment_reference && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6 text-[13px]"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <ShieldCheck size={14} className="text-[#F59E0B]" />
                <span className="text-[#64748B]">Transaction Ref:</span>
                <span className="font-bold font-mono text-[#D97706]">{sub.payment_reference}</span>
              </div>
            )}

            {/* Info boxes */}
            <div className="text-left rounded-xl p-4 mb-6 space-y-2"
              style={{ background: '#F8FAFC', border: '1px solid #E2EEF1' }}>
              {[
                { icon: <Clock size={13} />, text: 'Payments are verified within 2 business hours' },
                { icon: <ShieldCheck size={13} />, text: 'You\'ll receive an email once your account is active' },
                { icon: <RefreshCw size={13} />, text: 'Click "Check Status" below to refresh verification' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] text-[#475569]">
                  <span className="text-[#8B5CF6]">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button onClick={handleRecheck} disabled={checking}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#8B5CF6' }}>
                {checking
                  ? <><RefreshCw size={15} className="animate-spin" /> Checking...</>
                  : <><RefreshCw size={15} /> Check Activation Status</>}
              </button>

              {!sub && (
                <button onClick={() => navigate('/pharma/registration')}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                  style={{ border: '1.5px solid #8B5CF6', color: '#8B5CF6', background: 'white' }}>
                  Complete Registration →
                </button>
              )}

              <button onClick={handleLogout}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 flex items-center justify-center gap-2"
                style={{ color: '#64748B' }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[12px] text-[#94A3B8] mt-4">
          Need help? Email us at{' '}
          <a href="mailto:support@sanjeevani.health" className="underline hover:text-[#8B5CF6]">
            support@sanjeevani.health
          </a>
        </p>
      </div>
    </div>
  );
};

export default PharmaSubscriptionRequired;
