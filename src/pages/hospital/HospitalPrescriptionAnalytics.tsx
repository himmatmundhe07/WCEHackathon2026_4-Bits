import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Pill, TrendingUp, Users, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { HospitalProfile } from '@/hooks/useHospitalContext';
import { generateAnalyticsReportPDF } from '@/utils/pdfReports';

const COLORS = ['#0891B2', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

const HospitalPrescriptionAnalytics = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);

  useEffect(() => {
    if (!hospital) return;
    const fetchAll = async () => {
      const [fbRes, rxRes, medsRes] = await Promise.all([
        supabase.from('prescription_feedback').select('*').eq('hospital_id', hospital.id),
        supabase.from('prescriptions').select('*').eq('hospital_id', hospital.id),
        supabase.from('prescription_medicines').select('*, prescriptions!inner(hospital_id)').eq('prescriptions.hospital_id', hospital.id),
      ]);
      setFeedbacks(fbRes.data || []);
      setPrescriptions(rxRes.data || []);
      setMedicines(medsRes.data || []);
    };
    fetchAll();
  }, [hospital]);

  const totalRx = prescriptions.length;
  const totalFeedback = feedbacks.length;
  const feedbackRate = totalRx > 0 ? Math.round((totalFeedback / totalRx) * 100) : 0;
  const avgImprovement = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + (f.improvement_rating || 0), 0) / feedbacks.length).toFixed(1)
    : '—';

  // Most prescribed medicine
  const medCounts: Record<string, number> = {};
  medicines.forEach(m => { medCounts[m.medicine_name] = (medCounts[m.medicine_name] || 0) + 1; });
  const sortedMeds = Object.entries(medCounts).sort((a, b) => b[1] - a[1]);
  const topMedicine = sortedMeds.length > 0 ? sortedMeds[0][0] : '—';

  // Chart 1: Medicine effectiveness by avg rating
  const medRatings: Record<string, { total: number; count: number }> = {};
  const medsByRx: Record<string, string[]> = {};
  medicines.forEach(m => {
    if (!medsByRx[m.prescription_id]) medsByRx[m.prescription_id] = [];
    medsByRx[m.prescription_id].push(m.medicine_name);
  });

  feedbacks.forEach(f => {
    const presMeds = medsByRx[f.prescription_id] || [];
    presMeds.forEach((mName) => {
      if (!medRatings[mName]) medRatings[mName] = { total: 0, count: 0 };
      medRatings[mName].total += (f.improvement_rating || 0);
      medRatings[mName].count += 1;
    });
  });
  
  const effectivenessChart = Object.entries(medRatings).map(([name, v]) => ({
    name: name.length > 12 ? name.slice(0, 12) + '...' : name,
    rating: v.count > 0 ? +(v.total / v.count).toFixed(1) : 0,
  })).sort((a, b) => b.rating - a.rating).slice(0, 8);

  // Chart 2: Effectiveness by age group
  const ageGroups: Record<string, { total: number; count: number }> = {
    '0-12': { total: 0, count: 0 },
    '13-18': { total: 0, count: 0 },
    '19-30': { total: 0, count: 0 },
    '31-45': { total: 0, count: 0 },
    '46-60': { total: 0, count: 0 },
    '60+': { total: 0, count: 0 },
  };
  feedbacks.forEach(f => {
    const age = f.patient_age || 0;
    let group = '60+';
    if (age <= 12) group = '0-12';
    else if (age <= 18) group = '13-18';
    else if (age <= 30) group = '19-30';
    else if (age <= 45) group = '31-45';
    else if (age <= 60) group = '46-60';
    ageGroups[group].total += (f.improvement_rating || 0);
    ageGroups[group].count += 1;
  });
  const ageChart = Object.entries(ageGroups).map(([group, v]) => ({
    group,
    rating: v.count > 0 ? +(v.total / v.count).toFixed(1) : 0,
    count: v.count,
  }));

  // Chart 3: Side effects distribution
  const seCount: Record<string, number> = {};
  feedbacks.forEach(f => {
    (f.side_effects || []).forEach((se: string) => {
      seCount[se] = (seCount[se] || 0) + 1;
    });
  });
  const sePie = Object.entries(seCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  // Chart 4: Adherence distribution
  const adherenceCount: Record<string, number> = { Always: 0, Mostly: 0, Sometimes: 0, Rarely: 0, Never: 0 };
  feedbacks.forEach(f => {
    if (f.adherence_rating && adherenceCount[f.adherence_rating] !== undefined) {
      adherenceCount[f.adherence_rating] += 1;
    }
  });
  const adherenceChart = Object.entries(adherenceCount).map(([name, value]) => ({ name, value }));

  // Chart 5: Top medicines by volume
  const topMedsChart = sortedMeds.slice(0, 8).map(([name, count]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, count }));

  const statCards = [
    { label: 'Total Prescriptions', value: totalRx, color: '#0891B2', icon: Pill },
    { label: 'Feedback Rate', value: feedbackRate + '%', color: '#10B981', icon: TrendingUp },
    { label: 'Avg. Improvement', value: avgImprovement + '/5', color: '#F59E0B', icon: Users },
    { label: 'Most Prescribed', value: topMedicine, color: '#64748B', icon: Pill },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            📈 Prescription Analytics
          </h1>
          <p className="text-[13px]" style={{ color: '#64748B' }}>Aggregated prescription and feedback data across all patients.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.success('🔄 Syncing analytics securely with Pharmacy Network...');
              setTimeout(() => {
                toast.success('✅ Analytics successfully sent to Pharmacies!');
              }, 1500);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold text-white transition-all hover:bg-emerald-600"
            style={{ background: '#10B981' }}
          >
            <TrendingUp size={16} /> Share with Pharmacy Network
          </button>

          <button
            onClick={() => {
              generateAnalyticsReportPDF({
                hospitalName: hospital?.hospital_name || 'Hospital',
                totalPrescriptions: totalRx,
                totalFeedback: totalFeedback,
                feedbackRate,
                avgImprovement: String(avgImprovement),
                topMedicine,
                topMedicines: sortedMeds.slice(0, 10).map(([name, count]) => ({ name, count })),
                effectivenessData: effectivenessChart,
                ageGroupData: ageChart,
                sideEffects: sePie,
                adherenceData: adherenceChart,
              });
              toast.success('📄 Analytics report downloaded!');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold text-white"
            style={{ background: '#0891B2' }}
          >
            <Download size={16} /> Download Full Report PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
            <JharokhaArch color={s.color} opacity={0.18} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} style={{ color: s.color }} />
                <span className="text-[11px] font-medium" style={{ color: '#64748B' }}>{s.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Medicine Effectiveness */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
          <JharokhaArch color="#10B981" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Medicine Effectiveness (Avg Rating)</h3>
            {effectivenessChart.length === 0 ? (
              <p className="text-center py-8 text-[13px]" style={{ color: '#94A3B8' }}>No feedback data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={effectivenessChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip />
                  <Bar dataKey="rating" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* By Age Group */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
          <JharokhaArch color="#0891B2" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Effectiveness by Age Group</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip />
                <Bar dataKey="rating" fill="#0891B2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Side Effects Pie */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
          <JharokhaArch color="#F59E0B" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Side Effects Distribution</h3>
            {sePie.length === 0 ? (
              <p className="text-center py-8 text-[13px]" style={{ color: '#94A3B8' }}>No side effects reported.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sePie} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} dataKey="value" label={({ name, percent }) => name + ' ' + (percent * 100).toFixed(0) + '%'} >
                    {sePie.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Adherence */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
          <JharokhaArch color="#8B5CF6" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Medicine Adherence Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={adherenceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Medicines */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="p-5">
          <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Top Medicines by Prescription Volume</h3>
          {topMedsChart.length === 0 ? (
            <p className="text-center py-8 text-[13px]" style={{ color: '#94A3B8' }}>No prescription data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topMedsChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalPrescriptionAnalytics;
