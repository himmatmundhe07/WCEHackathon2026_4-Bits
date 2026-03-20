import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePharmaContext } from '@/hooks/usePharmaContext';
import { IndianRupee, PieChart, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import JharokhaFrame from '@/components/registration/JharokhaFrame';

export default function PharmaRevenue() {
  const { pharma } = usePharmaContext();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pharma?.id) return;
    fetchRevenue();
  }, [pharma]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('pharmacy_revenue_logs')
        .select('*')
        .eq('pharmacy_id', pharma?.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching revenue:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthLogs = logs.filter(l => l.billing_month === currentMonth);
  const totalRevenue = thisMonthLogs.reduce((acc, l) => acc + Number(l.gross_amount), 0);
  const totalCommission = thisMonthLogs.reduce((acc, l) => acc + Number(l.commission_amount), 0);
  const totalNet = thisMonthLogs.reduce((acc, l) => acc + Number(l.net_amount), 0);
  const nextDeductionDate = '15 ' + new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleString('en-US', { month: 'short' });

  if (loading) return <div>Loading revenue...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-[#1E293B]">Revenue & Commissions</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-[#E2EEF1] p-5">
          <p className="text-sm font-semibold text-[#64748B] mb-1">This Month's Revenue</p>
          <p className="text-3xl font-extrabold text-[#F59E0B]">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#E2EEF1] p-5">
          <p className="text-sm font-semibold text-[#64748B] mb-1">Commission Due (8%)</p>
          <p className="text-3xl font-extrabold text-[#EF4444]">₹{totalCommission.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#E2EEF1] p-5">
          <p className="text-sm font-semibold text-[#64748B] mb-1">Net Earnings</p>
          <p className="text-3xl font-extrabold text-[#10B981]">₹{totalNet.toLocaleString()}</p>
        </div>
        <div className="bg-[#ECFEFF] rounded-xl shadow-sm border border-[#A5F3FC] p-5">
          <p className="text-sm font-semibold text-[#0891B2] mb-1">Next Deduction Date</p>
          <p className="text-3xl font-extrabold text-[#164E63]">{nextDeductionDate}</p>
        </div>
      </div>

      <JharokhaFrame>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#1E293B]">Transaction Log</h2>
            <div className="flex gap-2">
              <button className="text-sm bg-white border border-[#E2EEF1] px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Download size={15}/> Export CSV
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2EEF1]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Gross (₹)</th>
                  <th className="px-4 py-3 text-right">Commission (₹)</th>
                  <th className="px-4 py-3 text-right">Net (₹)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EEF1]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{log.transaction_type}</td>
                      <td className="px-4 py-3 text-right text-[#F59E0B] font-medium">{log.gross_amount}</td>
                      <td className="px-4 py-3 text-right text-[#EF4444] font-medium">{log.commission_amount}</td>
                      <td className="px-4 py-3 text-right text-[#10B981] font-bold">{log.net_amount}</td>
                      <td className="px-4 py-3">
                        {log.deduction_status === 'Pending' && <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FFFBEB] text-[#D97706]">Pending</span>}
                        {log.deduction_status === 'Deducted' && <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#ECFDF5] text-[#059669]">Deducted</span>}
                        {log.deduction_status === 'Failed' && <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF2F2] text-[#DC2626]">Failed</span>}
                        {log.deduction_status === 'Waived' && <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#ECFEFF] text-[#0891B2]">Waived</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </JharokhaFrame>
    </div>
  );
}
