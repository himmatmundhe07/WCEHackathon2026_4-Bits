import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';

interface SubscriptionCardProps {
  patientId: string;
}

const SubscriptionCard = ({ patientId }: SubscriptionCardProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        // Since the table might be newly created or not in types, we use 'any'
        const { data, error } = await (supabase as any)
          .from('patient_subscriptions')
          .select('*')
          .eq('patient_id', patientId)
          .eq('status', 'active')
          .maybeSingle();

        if (data) setSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchSubscription();
  }, [patientId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 flex justify-center items-center border border-[#E2EEF1]">
        <Loader2 className="animate-spin text-[#0891B2]" size={20} />
      </div>
    );
  }

  const isPremium = subscription && subscription.status === 'active';

  return (
    <div className="bg-white rounded-xl overflow-hidden relative" 
      style={{ border: isPremium ? '1px solid #F59E0B' : '1px solid #E2EEF1' }}>
      <JharokhaArch color={isPremium ? '#F59E0B' : '#0891B2'} opacity={0.15} />
      
      <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" 
            style={{ background: isPremium ? '#FFFBEB' : '#EBF7FA' }}>
            {isPremium ? (
              <Crown className="text-[#F59E0B]" size={24} />
            ) : (
              <ShieldCheck className="text-[#0891B2]" size={24} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-[#1E293B]">
              {isPremium ? `Sanjeevani+ ${subscription.plan_name}` : 'Sanjeevani Free Plan'}
            </h3>
            <p className="text-[13px] text-[#64748B]">
              {isPremium 
                ? `Active until ${new Date(subscription.expires_at).toLocaleDateString()}` 
                : 'Upgrade for priority booking and free appointments'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-bold transition-all hover:opacity-90"
          style={{ 
            background: isPremium ? '#F59E0B' : '#0891B2',
            color: isPremium ? '#1E293B' : 'white' 
          }}
        >
          {isPremium ? 'Manage Plan' : 'Upgrade to Sanjeevani+'}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;
