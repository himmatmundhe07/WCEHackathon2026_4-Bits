import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Heart, Users, CheckCircle2, AlertCircle, IndianRupee, ExternalLink, Filter, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const NGOOverview = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRequests: 0, totalFunded: 0, pendingAmount: 0 });

  const fetchNGOData = async () => {
    setLoading(true);
    try {
      // Fetch stats & requests
      const { data: reqData, error } = await supabase
        .from('sponsorship_requests')
        .select('*, patients(full_name, city, age), hospitals(hospital_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(reqData || []);
      
      const pending = reqData?.reduce((acc, curr) => acc + (Number(curr.amount_needed) - Number(curr.amount_raised)), 0) || 0;
      setStats({
        totalRequests: reqData?.length || 0,
        totalFunded: reqData?.filter(r => r.status === 'Funded').length || 0,
        pendingAmount: pending
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNGOData(); }, []);

  const handleSponsor = async (reqId: string, amount: number) => {
    try {
      // In a real app, this would trigger a payment gateway
      const { error } = await supabase.from('sponsorship_donations').insert({
        request_id: reqId,
        amount: amount,
        // For demo, assume NGO ID 1
      });
      
      if (error) throw error;
      
      // Update request status
      await supabase.from('sponsorship_requests').update({
        status: 'Funded',
        amount_raised: amount
      }).eq('id', reqId);

      toast.success("Sponsorship successful! Thank you for your impact.");
      fetchNGOData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">NGO Impact Dashboard</h1>
          <p className="text-slate-500 text-sm">Empowering lives through transparent medical sponsorship.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">NGO Verified</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Users className="text-blue-500" />} label="Active Requests" value={stats.totalRequests} color="#3B82F6" />
        <StatCard icon={<CheckCircle2 className="text-emerald-500" />} label="Lives Impacted" value={stats.totalFunded} color="#10B981" />
        <StatCard icon={<IndianRupee className="text-amber-500" />} label="Funding Needed" value={`₹${stats.pendingAmount.toLocaleString()}`} color="#F59E0B" />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
             <Heart size={18} className="text-rose-500" /> Open Sponsorship Cases
          </h2>
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Search by disease or patient..." className="pl-9 pr-4 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-64" />
             </div>
             <button className="p-2 border rounded-lg hover:bg-slate-100 transition-colors text-slate-600"><Filter size={14} /></button>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Loader2 className="animate-spin mb-2" />
                <p>Fetching cases...</p>
             </div>
          ) : requests.length === 0 ? (
             <div className="p-12 text-center text-slate-400">
                <p>No sponsorship requests found at this moment.</p>
             </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
                <tr>
                  <th className="px-6 py-3 text-left">Patient Details</th>
                  <th className="px-6 py-3 text-left">Reason / Diagnosis</th>
                  <th className="px-6 py-3 text-left">Amount Required</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                            {req.patients?.full_name?.slice(0, 2).toUpperCase()}
                         </div>
                         <div>
                            <p className="font-bold text-slate-900">{req.patients?.full_name}</p>
                            <p className="text-[11px] text-slate-500">{req.patients?.age} yrs · {req.patients?.city}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700 font-medium line-clamp-1">{req.reason}</p>
                      <p className="text-[11px] text-blue-600 flex items-center gap-1">
                         <ExternalLink size={10} /> {req.hospitals?.hospital_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                       <p className="font-bold text-slate-900">₹{Number(req.amount_needed).toLocaleString()}</p>
                       <div className="w-32 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(req.amount_raised/req.amount_needed)*100}%` }} />
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'Funded' ? 'bg-emerald-100 text-emerald-700' : 
                        req.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        disabled={req.status === 'Funded'}
                        onClick={() => handleSponsor(req.id, req.amount_needed)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          req.status === 'Funded' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                       >
                         {req.status === 'Funded' ? 'Funded' : 'Sponsor Now'}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all group overflow-hidden relative">
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      </div>
      <div className="p-3 rounded-lg bg-slate-50 group-hover:bg-white transition-colors">{icon}</div>
    </div>
    <div className="absolute -bottom-6 -right-6 opacity-5">
       {icon}
    </div>
  </div>
);

export default NGOOverview;
