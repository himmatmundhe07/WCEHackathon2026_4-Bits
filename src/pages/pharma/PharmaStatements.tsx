import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePharmaContext } from '@/hooks/usePharmaContext';
import { FileText, Download, Eye, AlertCircle } from 'lucide-react';
import JharokhaFrame from '@/components/registration/JharokhaFrame';

export default function PharmaStatements() {
  const { pharma } = usePharmaContext();
  const [statements, setStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pharma?.id) return;
    fetchStatements();
  }, [pharma]);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('pharmacy_deduction_statements')
        .select('*')
        .eq('pharmacy_id', pharma?.id)
        .order('billing_month', { ascending: false });
        
      if (error) throw error;
      setStatements(data || []);
    } catch (err: any) {
      console.error('Error fetching statements:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-700',
    Generated: 'bg-blue-100 text-blue-800',
    Deducted: 'bg-green-100 text-green-800',
    Disputed: 'bg-red-100 text-red-800',
    Resolved: 'bg-teal-100 text-teal-800',
  };

  if (loading) return <div>Loading statements...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-[#1E293B]">Monthly Statements</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statements.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-dashed border-[#CBD5E1] text-center text-[#64748B]">
            No statements generated yet. Statements are generated on the 5th of every month.
          </div>
        ) : (
          statements.map(stmt => (
            <div key={stmt.id} className="bg-white rounded-xl shadow-sm border border-[#E2EEF1] overflow-hidden flex flex-col">
              <div className="h-1 bg-[#0891B2] w-full" />
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                      <FileText size={18} className="text-[#0891B2]" /> 
                      {stmt.billing_month} Statement
                    </h3>
                    <p className="text-xs text-[#64748B]">Gen: {new Date(stmt.generated_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${statusColors[stmt.statement_status as keyof typeof statusColors]}`}>
                    {stmt.statement_status}
                  </span>
                </div>

                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">Gross Revenue</span>
                    <span className="font-semibold text-[#1E293B]">₹{Number(stmt.total_revenue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">Commission ({stmt.commission_pct_applied}%)</span>
                    <span className="font-bold text-[#EF4444]">₹{Number(stmt.total_commission).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-[#E2EEF1]">
                    <span className="text-[#1E293B] font-semibold">Net Earnings</span>
                    <span className="font-extrabold text-[#10B981]">₹{Number(stmt.total_net).toLocaleString()}</span>
                  </div>
                </div>

                {stmt.deducted_at && (
                  <div className="bg-[#ECFDF5] text-[#065F46] text-xs p-2 rounded-lg mb-4 flex gap-2">
                    <span className="shrink-0 pt-0.5">✅</span>
                    <span>Deducted on {new Date(stmt.deducted_at).toLocaleDateString()}<br/>Ref: {stmt.deduction_ref}</span>
                  </div>
                )}

                <div className="flex gap-2 mt-auto">
                  <button className="flex-1 bg-white border border-[#E2EEF1] hover:bg-gray-50 text-[#1E293B] py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    <Eye size={16} /> View
                  </button>
                  <button className="flex-1 bg-[#0891B2] hover:bg-[#06B6D4] text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    <Download size={16} /> PDF
                  </button>
                </div>
                {stmt.statement_status === 'Generated' && (
                  <button className="w-full mt-2 text-xs font-semibold text-[#DC2626] hover:underline flex items-center justify-center gap-1 py-1">
                    <AlertCircle size={14} /> Dispute Statement
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
