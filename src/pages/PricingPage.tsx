import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Crown, Users, Zap, Star, ArrowLeft, Ticket } from 'lucide-react';
import JharokhaArch from '@/components/admin/JharokhaArch';
import CheckoutModal from '@/components/subscription/CheckoutModal';

/* ─── SVG Helpers ─── */
const LotusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
    <ellipse cx="8" cy="5" rx="2.5" ry="4" fill="#0891B2" opacity="0.9" />
    <ellipse cx="4.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(-25 4.5 8)" />
    <ellipse cx="11.5" cy="8" rx="2.5" ry="3.5" fill="#0891B2" opacity="0.6" transform="rotate(25 11.5 8)" />
    <circle cx="8" cy="7.5" r="1.5" fill="#E8A820" />
  </svg>
);

const MandanaDivider = () => (
  <div className="flex items-center gap-2 my-6 max-w-xs mx-auto">
    <span style={{ color: '#E8A820', fontSize: '8px' }}>◇</span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #E8A820, transparent)' }} />
    <span style={{ color: '#E8A820', fontSize: '8px' }}>◇</span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #E8A820, transparent)' }} />
    <span style={{ color: '#E8A820', fontSize: '8px' }}>◇</span>
  </div>
);

/* ─── Feature List Item ─── */
const Feature = ({ included, text, badge }: { included: boolean; text: string; badge?: string }) => (
  <div className="flex items-start gap-2.5 py-1.5">
    {included ? (
      <Check size={16} className="mt-0.5 shrink-0" style={{ color: '#10B981' }} />
    ) : (
      <X size={16} className="mt-0.5 shrink-0" style={{ color: '#CBD5E1' }} />
    )}
    <div className="flex-1">
      <span className="text-[13px]" style={{ color: included ? '#1E293B' : '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
        {text}
      </span>
      {badge && (
        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
          {badge}
        </span>
      )}
    </div>
  </div>
);

/* ─── Main Pricing Page ─── */
const PricingPage = () => {
  const navigate = useNavigate();
  const [checkoutPlan, setCheckoutPlan] = useState<'single' | 'family' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in (for directing to login or checkout)
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setIsLoggedIn(!!user);
      });
    });
  }, []);

  const handleBuyPlan = (planType: 'single' | 'family') => {
    if (!isLoggedIn) {
      navigate('/login?role=patient&redirect=/pricing');
      return;
    }
    setCheckoutPlan(planType);
  };

  return (
    <div className="min-h-screen" style={{ background: '#F7FBFC' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 h-14 bg-white flex items-center px-5 md:px-12" style={{ borderBottom: '1px solid #E2EEF1' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] font-medium mr-4" style={{ color: '#64748B' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <LotusIcon />
          <span className="text-lg font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Sanjeevani</span>
        </div>
      </div>

      {/* Hero */}
      <section className="pt-12 pb-4 px-5 md:px-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
          style={{ background: '#EBF7FA', border: '1px solid #D1EBF1' }}>
          <Crown size={14} style={{ color: '#F59E0B' }} />
          <span className="text-[12px] font-semibold" style={{ color: '#0891B2' }}>Sanjeevani+ Premium Plans</span>
        </div>

        <h1 className="text-[32px] md:text-[40px] font-bold mb-3"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
          Choose Your Sanjeevani Plan
        </h1>
        <p className="text-[16px] max-w-xl mx-auto mb-2"
          style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
          Emergency protection and priority healthcare for you and your loved ones.
        </p>
        <MandanaDivider />
      </section>

      {/* Plan Cards */}
      <section className="px-5 md:px-12 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">

          {/* ─── FREE PLAN ─── */}
          <div className="relative bg-white rounded-xl overflow-hidden transition-all hover:shadow-lg"
            style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#64748B" opacity={0.18} />
            <div className="p-6 md:p-7">
              <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                Sanjeevani Free
              </h3>
              <div className="mb-1">
                <span className="text-[40px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>₹0</span>
              </div>
              <p className="text-[14px] mb-6" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>Forever</p>

              <div className="space-y-0.5 mb-8">
                <Feature included text="Emergency QR code" />
                <Feature included text="Health profile" />
                <Feature included text="Appointment booking" />
                <Feature included text="Prescription viewing" />
                <Feature included={false} text="Free appointments" />
                <Feature included={false} text="Priority booking" />
                <Feature included={false} text="Fast queue access" />
                <Feature included={false} text="Family members" />
              </div>

              <button onClick={() => navigate(isLoggedIn ? '/patient/dashboard' : '/login?role=patient')}
                className="w-full py-2.5 rounded-lg text-[14px] font-semibold transition-all hover:opacity-90"
                style={{ border: '1.5px solid #0891B2', color: '#0891B2', background: 'white' }}>
                Get Started Free
              </button>
            </div>
          </div>

          {/* ─── SINGLE PLAN ─── */}
          <div className="relative bg-white rounded-xl overflow-hidden transition-all hover:shadow-lg"
            style={{ border: '2px solid #0891B2', boxShadow: '0 4px 24px rgba(8,145,178,0.12)' }}>
            {/* Popular Badge */}
            <span className="absolute top-3 right-3 z-10 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white"
              style={{ background: '#0891B2' }}>
              <Star size={12} fill="currentColor" /> MOST POPULAR
            </span>
            <JharokhaArch color="#0891B2" opacity={0.2} />
            <div className="p-6 md:p-7">
              <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0891B2' }}>
                Sanjeevani+ Single
              </h3>
              <div className="mb-1">
                <span className="text-[40px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0891B2' }}>₹3,000</span>
                <span className="text-base font-medium ml-1" style={{ color: '#64748B' }}>/year</span>
              </div>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>₹250/month equivalent</p>

              <div className="space-y-0.5 mb-8">
                <Feature included text="Everything in Free" />
                <Feature included text="3 free appointments per year" badge="🎫 3 Free" />
                <Feature included text="Fast appointment booking" badge="⚡ Skip the wait" />
                <Feature included text="Top priority in hospital queue" badge="🔝 Priority" />
                <Feature included text="1 member (you only)" />
                <Feature included={false} text="Family members" />
              </div>

              <button onClick={() => handleBuyPlan('single')}
                className="w-full py-3 rounded-lg text-[14px] font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#0891B2' }}>
                Buy Single Plan
              </button>
            </div>
          </div>

          {/* ─── FAMILY PLAN ─── */}
          <div className="relative bg-white rounded-xl overflow-hidden transition-all hover:shadow-lg"
            style={{ border: '2px solid #F59E0B', boxShadow: '0 4px 24px rgba(245,158,11,0.1)' }}>
            {/* Best Value Badge */}
            <span className="absolute top-3 right-3 z-10 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ background: '#F59E0B', color: '#1E293B' }}>
              👨‍👩‍👧‍👦 BEST VALUE
            </span>
            <JharokhaArch color="#F59E0B" opacity={0.2} />
            <div className="p-6 md:p-7">
              <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F59E0B' }}>
                Sanjeevani+ Family
              </h3>
              <div className="mb-1">
                <span className="text-[40px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#F59E0B' }}>₹6,000</span>
                <span className="text-[14px] ml-1" style={{ color: '#64748B' }}>/year</span>
              </div>
              <p className="text-[12px] mb-1" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>₹500/month equivalent</p>
              <p className="text-[11px] mb-6 font-medium" style={{ color: '#10B981' }}>Only ₹1,000 more for 3 extra members!</p>

              <div className="space-y-0.5 mb-8">
                <Feature included text="Everything in Single plan" />
                <Feature included text="3 free appointments per year (shared)" badge="🎫 Shared Pool" />
                <Feature included text="Fast + priority booking for ALL members" />
                <Feature included text="Up to 4 family members" badge="👤👤👤👤" />
                <Feature included text="Each member gets their own Emergency QR" />
              </div>

              <button onClick={() => handleBuyPlan('family')}
                className="w-full py-3 rounded-lg text-[14px] font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#F59E0B', color: '#1E293B' }}>
                Buy Family Plan
              </button>
            </div>
          </div>
        </div>

        {/* Bottom notes */}
        <div className="max-w-5xl mx-auto mt-8">
          <MandanaDivider />
          <div className="text-center space-y-2">
            <p className="text-[13px]" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
              All paid plans include a <strong>7-day refund guarantee</strong>.
            </p>
            <p className="text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span style={{ color: '#64748B' }}>Questions? Contact us at </span>
              <a href="mailto:support@sanjeevani.in" style={{ color: '#0891B2' }} className="font-medium hover:underline">
                support@sanjeevani.in
              </a>
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-[22px] font-bold text-center mb-6"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            Compare Plans
          </h2>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color="#0891B2" opacity={0.15} />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ background: '#F7FBFC' }}>
                    <th className="text-left p-4 font-semibold" style={{ color: '#64748B' }}>Feature</th>
                    <th className="p-4 font-semibold text-center" style={{ color: '#64748B' }}>Free</th>
                    <th className="p-4 font-semibold text-center" style={{ color: '#0891B2' }}>Single</th>
                    <th className="p-4 font-semibold text-center" style={{ color: '#F59E0B' }}>Family</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Emergency QR', true, true, true],
                    ['Health Profile', true, true, true],
                    ['Appointment Booking', true, true, true],
                    ['Prescription Viewing', true, true, true],
                    ['Free Appointments / Year', '0', '3', '3 (shared)'],
                    ['Priority Booking', false, true, true],
                    ['Fast Queue Access', false, true, true],
                    ['Members', '1', '1', 'Up to 4'],
                    ['Price', '₹0', '₹3,000/yr', '₹6,000/yr'],
                  ].map(([feature, free, single, family], i) => (
                    <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td className="p-4 font-medium" style={{ color: '#1E293B' }}>{feature as string}</td>
                      {[free, single, family].map((val, j) => (
                        <td key={j} className="p-4 text-center">
                          {typeof val === 'boolean' ? (
                            val ? <Check size={16} className="mx-auto" style={{ color: '#10B981' }} />
                              : <X size={16} className="mx-auto" style={{ color: '#CBD5E1' }} />
                          ) : (
                            <span style={{ color: '#1E293B' }}>{val as string}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {checkoutPlan && (
        <CheckoutModal
          planType={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </div>
  );
};

export default PricingPage;
