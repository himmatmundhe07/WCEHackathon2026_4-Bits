import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Clock, Users, XCircle, TrendingUp } from 'lucide-react';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
    <JharokhaArch color={color} opacity={0.18} />
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          {icon}
        </div>
        <span className="text-[12px] font-medium" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>{label}</span>
      </div>
      <p className="text-3xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color }}>{value}</p>
    </div>
  </div>
);

const DONUT_COLORS: Record<string, string> = {
  'Private Hospital': '#0891B2',
  'Government Hospital': '#10B981',
  'Clinic': '#F59E0B',
  'Nursing Home': '#8B5CF6',
  'Diagnostic Center': '#64748B',
  'Trauma Center': '#EF4444',
};

const Overview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ hospitals: 0, pending: 0, patients: 0, rejected: 0 });
  const [pendingHospitals, setPendingHospitals] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [facilityData, setFacilityData] = useState<{ name: string; value: number }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ week: string; count: number }[]>([]);

  const fetchAll = async () => {
    const [h, p, pat, r] = await Promise.all([
      supabase.from('hospitals').select('*', { count: 'exact', head: true }),
      supabase.from('hospitals').select('*', { count: 'exact', head: true }).eq('verification_status', 'Pending'),
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('hospitals').select('*', { count: 'exact', head: true }).eq('verification_status', 'Rejected'),
    ]);
    setStats({ hospitals: h.count || 0, pending: p.count || 0, patients: pat.count || 0, rejected: r.count || 0 });

    // Pending hospitals
    const { data: ph } = await supabase.from('hospitals')
      .select('id, hospital_name, city, state, facility_type, registered_at')
      .eq('verification_status', 'Pending')
      .order('registered_at', { ascending: false })
      .limit(5);
    setPendingHospitals(ph || []);

    // Recent logs
    const { data: logs } = await supabase.from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setRecentLogs(logs || []);

    // Facility type breakdown
    const { data: allH } = await supabase.from('hospitals').select('facility_type');
    if (allH) {
      const grouped: Record<string, number> = {};
      allH.forEach((h: any) => {
        const ft = h.facility_type || 'Unknown';
        grouped[ft] = (grouped[ft] || 0) + 1;
      });
      setFacilityData(Object.entries(grouped).map(([name, value]) => ({ name, value })));
    }

    // Weekly registrations (last 8 weeks approximation)
    const { data: allHDates } = await supabase.from('hospitals').select('registered_at').order('registered_at', { ascending: true });
    if (allHDates && allHDates.length > 0) {
      const weeks: Record<string, number> = {};
      allHDates.forEach((h: any) => {
        const d = new Date(h.registered_at);
        const weekKey = `W${Math.ceil(d.getDate() / 7)}/${d.getMonth() + 1}`;
        weeks[weekKey] = (weeks[weekKey] || 0) + 1;
      });
      const entries = Object.entries(weeks).slice(-8);
      setWeeklyData(entries.map(([week, count]) => ({ week, count })));
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleVerify = async (id: string, name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('hospitals').update({ verification_status: 'Verified' }).eq('id', id);
    await supabase.from('admin_logs').insert([{ admin_user_id: user!.id, action: 'HOSPITAL_VERIFIED', target_type: 'hospital', target_id: id, notes: 'Quick verified from overview' }]);
    toast.success(`✅ ${name} has been verified.`);
    fetchAll();
  };

  const handleReject = async (id: string, name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('hospitals').update({ verification_status: 'Rejected' }).eq('id', id);
    await supabase.from('admin_logs').insert([{ admin_user_id: user!.id, action: 'HOSPITAL_REJECTED', target_type: 'hospital', target_id: id, notes: 'Quick rejected from overview' }]);
    toast.error(`❌ ${name} has been rejected.`);
    fetchAll();
  };

  const totalFacilities = facilityData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Building2 size={18} style={{ color: '#0891B2' }} />} label="Total Hospitals" value={stats.hospitals} color="#0891B2" />
        <StatCard icon={<Clock size={18} style={{ color: '#F59E0B' }} />} label="Pending Verification" value={stats.pending} color="#F59E0B" />
        <StatCard icon={<Users size={18} style={{ color: '#10B981' }} />} label="Total Patients" value={stats.patients} color="#10B981" />
        <StatCard icon={<XCircle size={18} style={{ color: '#EF4444' }} />} label="Rejected Applications" value={stats.rejected} color="#EF4444" />
      </div>

      {/* Pending table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#F59E0B" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Pending Hospital Approvals</h3>
            <button onClick={() => navigate('/admin/hospitals')} className="text-[13px] font-medium" style={{ color: '#0891B2' }}>View All →</button>
          </div>
          {pendingHospitals.length === 0 ? (
            <p className="text-[13px] py-6 text-center" style={{ color: '#94A3B8' }}>No pending approvals</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2EEF1' }}>
                    <th className="text-left py-2 font-medium" style={{ color: '#64748B' }}>Hospital</th>
                    <th className="text-left py-2 font-medium" style={{ color: '#64748B' }}>Location</th>
                    <th className="text-left py-2 font-medium" style={{ color: '#64748B' }}>Type</th>
                    <th className="text-left py-2 font-medium" style={{ color: '#64748B' }}>Registered</th>
                    <th className="text-right py-2 font-medium" style={{ color: '#64748B' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingHospitals.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td className="py-2.5 font-semibold" style={{ color: '#1E293B' }}>{h.hospital_name}</td>
                      <td className="py-2.5" style={{ color: '#64748B' }}>{h.city}, {h.state}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: '#F1F5F9', color: '#64748B' }}>{h.facility_type || '—'}</span>
                      </td>
                      <td className="py-2.5" style={{ color: '#64748B' }}>{h.registered_at ? formatDistanceToNow(new Date(h.registered_at), { addSuffix: true }) : '—'}</td>
                      <td className="py-2.5 text-right space-x-2">
                        <button onClick={() => navigate('/admin/hospitals')} className="px-3 py-1 rounded-md text-[12px] font-medium text-white transition-all hover:opacity-90" style={{ background: '#0891B2' }}>
                          View Details & Certificate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
          <JharokhaArch color="#0891B2" />
          <div className="p-5">
            <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Registrations Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0891B2" strokeWidth={2} dot={{ fill: '#0891B2', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
          <JharokhaArch color="#10B981" />
          <div className="p-5">
            <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Hospital Types</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={facilityData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {facilityData.map((entry) => (
                      <Cell key={entry.name} fill={DONUT_COLORS[entry.name] || '#94A3B8'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-[12px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <p className="font-bold text-lg" style={{ color: '#1E293B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{totalFacilities}</p>
                {facilityData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[d.name] || '#94A3B8' }} />
                    <span style={{ color: '#64748B' }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#64748B" />
        <div className="p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Recent Activity</h3>
          {recentLogs.length === 0 ? (
            <p className="text-[13px] py-4 text-center" style={{ color: '#94A3B8' }}>No activity yet</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const dotColor = log.action?.includes('VERIFIED') ? '#10B981' : log.action?.includes('REJECTED') ? '#EF4444' : '#F59E0B';
                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: dotColor }} />
                    <div>
                      <p className="text-[13px]" style={{ color: '#1E293B' }}>{log.notes || log.action}</p>
                      <p className="text-[11px]" style={{ color: '#94A3B8' }}>{log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
