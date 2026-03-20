import { useState } from 'react';
import { X, CreditCard, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JharokhaArch from '@/components/admin/JharokhaArch';

interface CheckoutModalProps {
  planType: 'single' | 'family';
  onClose: () => void;
}

const CheckoutModal = ({ planType, onClose }: CheckoutModalProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const planDetails = {
    single: { name: 'Sanjeevani+ Single', price: '₹3,000/yr' },
    family: { name: 'Sanjeevani+ Family', price: '₹6,000/yr' }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Calculate expiration date (1 year from now)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // In a real app, you would integrate Razorpay or Stripe here.
      // For this hackathon project, we'll simulate a successful payment.
      const { error } = await (supabase as any)
        .from('patient_subscriptions')
        .insert({
          patient_id: user.id,
          plan_name: planType === 'single' ? 'Single' : 'Family',
          status: 'active',
          amount: planType === 'single' ? 3000 : 6000,
          expires_at: expiresAt.toISOString(),
          payment_reference: 'SIMULATED_' + Math.random().toString(36).substring(7).toUpperCase()
        });

      if (error) throw error;
      
      setSuccess(true);
      toast.success('Subscription activated successfully!');
      
      // Delay closing to show success state
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to update UI
      }, 2000);

    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Failed to process payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden" 
        style={{ border: '1px solid #E2EEF1', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        <JharokhaArch color="#0891B2" opacity={0.15} />
        
        <div className="p-6 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1E293B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Complete Your Upgrade
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} className="text-[#64748B]" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-[#10B981]" />
              </div>
              <h3 className="text-lg font-bold text-[#1E293B] mb-2">Payment Successful!</h3>
              <p className="text-[#64748B]">Welcome to {planDetails[planType].name}. Your benefits are now active.</p>
            </div>
          ) : (
            <>
              <div className="bg-[#F7FBFC] rounded-xl p-4 mb-6 border border-[#D1EBF1]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[14px] text-[#64748B]">Selected Plan:</span>
                  <span className="text-[14px] font-bold text-[#1E293B]">{planDetails[planType].name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#64748B]">Billing Interval:</span>
                  <span className="text-[14px] font-bold text-[#1E293B]">Annually</span>
                </div>
                <div className="mt-3 pt-3 border-t border-[#D1EBF1] flex justify-between items-center">
                  <span className="font-bold text-[#1E293B]">Total Amount:</span>
                  <span className="text-xl font-extrabold text-[#0891B2]">{planDetails[planType].price}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-[#E2EEF1]">
                  <CreditCard className="text-[#0891B2] shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-[13px] font-bold text-[#1E293B]">Safe & Secure Payment</p>
                    <p className="text-[12px] text-[#64748B]">Encrypted transaction handled via secure gateway.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-[#E2EEF1]">
                  <ShieldCheck className="text-[#10B981] shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-[13px] font-bold text-[#1E293B]">Sanjeevani Trust Guarantee</p>
                    <p className="text-[12px] text-[#64748B]">7-day money-back guarantee if you're not satisfied.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: '#0891B2' }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {loading ? 'Processing...' : `Pay ${planDetails[planType].price} & Activate`}
              </button>
              
              <p className="text-center text-[11px] text-[#94A3B8] mt-4">
                By clicking pay, you agree to our Terms of Service and Privacy Policy.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
