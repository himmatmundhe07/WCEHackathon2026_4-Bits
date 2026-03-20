import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePharmaContext } from '@/hooks/usePharmaContext';
import { ClipboardList, CheckCircle2, FileText, Download, AlertTriangle } from 'lucide-react';
import JharokhaFrame from '@/components/registration/JharokhaFrame';

export default function PharmaAgreement() {
  const { pharma } = usePharmaContext();
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pharma?.id) return;
    fetchAgreement();
  }, [pharma]);

  const fetchAgreement = async () => {
    try {
      setLoading(true);
      const { data: pharmaData, error: pErr } = await (supabase as any)
        .from('pharmacies')
        .select('tnc_version, tnc_agreed_at, revenue_share_pct')
        .eq('id', pharma?.id)
        .single();
      
      if (pErr) throw pErr;
      
      const { data: tncData, error: tErr } = await (supabase as any)
        .from('pharma_tnc_versions')
        .select('*')
        .eq('version', pharmaData.tnc_version)
        .maybeSingle();
      
      setAgreement({ ...pharmaData, ...tncData });
    } catch (err: any) {
      console.error('Error fetching agreement:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading agreement...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-[#1E293B] flex items-center gap-2">
          <ClipboardList className="text-[#0891B2]" /> Revenue Sharing Agreement
        </h1>
      </div>

      <JharokhaFrame>
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold text-[#1E293B]">Your Active Agreement</h2>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669]">
              <CheckCircle2 size={14} /> Active
            </span>
          </div>

          <div className="bg-[#F8FAFC] rounded-xl border border-[#E2EEF1] mb-6 shadow-sm overflow-hidden">
             <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="p-4 border-b md:border-b-0 md:border-r border-[#E2EEF1]">
                  <p className="text-xs text-[#64748B] mb-0.5 uppercase tracking-wide font-semibold">T&C Version</p>
                  <p className="text-[#1E293B] font-bold font-mono">{agreement?.tnc_version}</p>
                </div>
                 <div className="p-4 border-b md:border-b-0 md:border-r border-[#E2EEF1]">
                  <p className="text-xs text-[#64748B] mb-0.5 uppercase tracking-wide font-semibold">Effective Date</p>
                  <p className="text-[#1E293B] font-bold">{agreement?.effective_date ? new Date(agreement.effective_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                 <div className="p-4 border-b md:border-b-0 md:border-r border-[#E2EEF1]">
                  <p className="text-xs text-[#64748B] mb-0.5 uppercase tracking-wide font-semibold">Consent Given</p>
                  <p className="text-[#1E293B] font-bold">{agreement?.tnc_agreed_at ? new Date(agreement.tnc_agreed_at).toLocaleDateString() : 'N/A'}</p>
                 </div>
                 <div className="p-4">
                  <p className="text-xs text-[#B45309] mb-0.5 uppercase tracking-wide font-semibold">Commission Rate</p>
                  <p className="text-[#F59E0B] font-extrabold text-lg">{agreement?.revenue_share_pct}%</p>
                </div>
             </div>
          </div>

          {!agreement?.is_current && (
             <div className="bg-[#FFFBEB] border-l-4 border-[#F59E0B] p-4 text-sm text-[#92400E] flex items-start gap-4 mb-6 shadow-sm">
              <AlertTriangle className="text-[#F59E0B] shrink-0" size={20} />
              <div>
                <strong className="block mb-1 text-[#B45309]">⚠️ New Agreement Available</strong>
                A new version of the Revenue Sharing Agreement is available. Please review and re-agree to continue using the platform without interruption.
                <button className="mt-3 bg-[#F59E0B] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#D97706] transition-colors block">
                  Review New Agreement →
                </button>
              </div>
            </div>
          )}

          <div>
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-[#1E293B] flex items-center gap-2">
                 <FileText size={16} className="text-[#0891B2]" /> Full Legal Text
               </h3>
               <button className="text-sm bg-white border border-[#E2EEF1] px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium hover:bg-gray-50 text-[#64748B] transition-colors">
                 <Download size={14} /> Download PDF
               </button>
             </div>
             
             <div className="h-96 overflow-y-auto bg-gray-50 border border-[#E2EEF1] rounded-xl p-6 text-[13px] text-[#334155] font-mono leading-relaxed shadow-inner">
                 <pre className="whitespace-pre-wrap font-sans">{agreement?.full_text}</pre>
             </div>
          </div>
        </div>
      </JharokhaFrame>
    </div>
  );
}
