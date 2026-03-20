import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePharmaContext } from '@/hooks/usePharmaContext';
import { Landmark, CheckCircle, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import JharokhaFrame from '@/components/registration/JharokhaFrame';

export default function PharmaBankDetails() {
  const { pharma } = usePharmaContext();
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pharma?.id) return;
    fetchBankDetails();
  }, [pharma]);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('pharmacy_bank_details')
        .select('*')
        .eq('pharmacy_id', pharma?.id)
        .maybeSingle();
        
      if (error) throw error;
      setBankDetails(data);
    } catch (err: any) {
      console.error('Error fetching bank details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMask = (acc: string) => {
    if (!acc) return '';
    if (acc.length <= 4) return acc;
    return '*'.repeat(acc.length - 4) + acc.slice(-4);
  };

  if (loading) return <div>Loading bank details...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-[#1E293B] flex items-center gap-2">
          <Landmark className="text-[#0891B2]" /> Bank Account Details
        </h1>
      </div>

      {!bankDetails ? (
        <div className="bg-white p-6 rounded-xl border border-dashed border-[#CBD5E1] text-center">
          No bank details found. Please contact support.
        </div>
      ) : (
        <JharokhaFrame>
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-bold text-[#1E293B]">Current Deductions Account</h2>
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${bankDetails.bank_verified ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FFFBEB] text-[#D97706]'}`}>
                {bankDetails.bank_verified ? <CheckCircle size={14} /> : <Clock size={14} />}
                {bankDetails.bank_verified ? 'Verified by Sanjeevani' : 'Verification Pending'}
              </span>
            </div>

            <div className="bg-[#F8FAFC] rounded-xl border border-[#E2EEF1] overflow-hidden mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 border-b md:border-b-0 md:border-r border-[#E2EEF1]">
                  <p className="text-xs text-[#64748B] mb-1 font-semibold uppercase tracking-wide">Account Holder</p>
                  <p className="text-[#1E293B] font-bold">{bankDetails.account_holder_name || bankDetails.upi_name || 'N/A'}</p>
                </div>
                <div className="p-5">
                  <p className="text-xs text-[#64748B] mb-1 font-semibold uppercase tracking-wide">Preferred Method</p>
                  <p className="text-[#1E293B] font-bold uppercase">{bankDetails.preferred_method}</p>
                </div>
                
                {bankDetails.preferred_method === 'bank' && (
                  <>
                    <div className="p-5 border-t border-b md:border-b-0 md:border-r border-[#E2EEF1]">
                      <p className="text-xs text-[#64748B] mb-1 font-semibold uppercase tracking-wide">Bank & Branch</p>
                      <p className="text-[#1E293B] font-bold">{bankDetails.bank_name}</p>
                      {bankDetails.branch_name && <p className="text-sm text-[#475569]">{bankDetails.branch_name}</p>}
                    </div>
                    <div className="p-5 border-t border-[#E2EEF1]">
                      <p className="text-xs text-[#64748B] mb-1 font-semibold uppercase tracking-wide">Account Details</p>
                      <p className="text-[#1E293B] font-bold font-mono tracking-widest">{handleMask(bankDetails.account_number)}</p>
                      <p className="text-sm text-[#475569] uppercase mt-0.5">IFSC: <span className="font-mono">{bankDetails.ifsc_code}</span></p>
                    </div>
                  </>
                )}
                
                {bankDetails.preferred_method === 'upi' && (
                  <div className="col-span-1 md:col-span-2 p-5 border-t border-[#E2EEF1]">
                    <p className="text-xs text-[#64748B] mb-1 font-semibold uppercase tracking-wide">UPI ID</p>
                    <p className="text-[#1E293B] font-bold font-mono">{bankDetails.upi_id}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-4 rounded-xl flex items-start gap-3 mb-6">
              <ShieldAlert className="text-[#059669] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#065F46] font-semibold mb-0.5">Deduction Consent Active</p>
                <p className="text-xs text-[#064E3B]">
                  Consent given on {new Date(bankDetails.deduction_consent_at).toLocaleDateString()} from IP {bankDetails.deduction_consent_ip}. 
                  This consent forms the legal basis for monthly commission deductions.
                </p>
              </div>
            </div>

            <div className="bg-[#FFFBEB] border-l-4 border-[#F59E0B] p-4 text-sm text-[#92400E] flex items-start gap-3">
              <AlertTriangle className="text-[#F59E0B] shrink-0" />
              <div>
                <strong className="block mb-1 text-[#B45309]">⚠️ Changing bank details?</strong>
                Any change requires re-verification and a new deduction consent. Deductions will be paused until the new account is verified by the Sanjeevani team.
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button className="bg-white border-2 border-[#F59E0B] text-[#D97706] px-6 py-2.5 rounded-xl font-bold hover:bg-[#FFFBEB] transition-colors">
                Request Update
              </button>
            </div>
          </div>
        </JharokhaFrame>
      )}
    </div>
  );
}
