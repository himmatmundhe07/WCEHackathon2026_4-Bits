import { useState, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, Users, Pill, UserCheck, AlertCircle, 
  MapPin, TrendingUp, Calculator, PieChart 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import type { PharmaProfile } from '@/hooks/usePharmaContext';

const JharokhaArch = ({ color = '#8B5CF6', opacity = 0.18 }) => (
  <svg width="100%" height="18" viewBox="0 0 400 18" preserveAspectRatio="none" className="block">
    <rect x="8" y="3" width="3" height="15" rx="1" fill={color} fillOpacity={opacity} />
    <rect x="389" y="3" width="3" height="15" rx="1" fill={color} fillOpacity={opacity} />
    <path d="M50 18 Q120 18 160 6 Q190 0 200 0 Q210 0 240 6 Q280 18 350 18" fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="1.5" />
    <circle cx="170" cy="4" r="1.5" fill={color} fillOpacity={opacity * 0.8} />
    <circle cx="200" cy="1.5" r="1.5" fill={color} fillOpacity={opacity * 0.8} />
    <circle cx="230" cy="4" r="1.5" fill={color} fillOpacity={opacity * 0.8} />
  </svg>
);

const PharmaAnalyticsPage = () => {
  const { pharma } = useOutletContext<{ pharma: PharmaProfile | null }>();
  const location = useLocation();
  const path = location.pathname.split('/').pop();

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);

  useEffect(() => {
    if (!pharma) return;
    const fetchAll = async () => {
      const { data: fbData } = await supabase.from('prescription_feedback').select('*, prescriptions(diagnosis)');
      const { data: medData } = await supabase.from('prescription_medicines').select('*, prescriptions(id, diagnosis, doctor_specialization)');
      if (fbData) {
        const relevantFeedbacks = fbData.filter((f: any) => 
          f.shared_pharma_network === 'Global Sanjeevani Network (All Partners)' ||
          f.shared_pharma_network === pharma.pharmacy_name ||
          !f.shared_pharma_network
        );
        setFeedbacks(relevantFeedbacks);
      }
      if (medData) setMedicines(medData);
    };
    fetchAll();
  }, [pharma]);

  // Transform Data
  const medsByRx: Record<string, any[]> = {};
  medicines.forEach(m => {
    if (m.prescription_id) {
      if (!medsByRx[m.prescription_id]) medsByRx[m.prescription_id] = [];
      medsByRx[m.prescription_id].push(m);
    }
  });

  const effMap: Record<string, { patients: number; improved: number; noEffect: number; sideEffects: number }> = {};
  const diseaseMap: Record<string, Record<string, { total: number, success: number }>> = {};
  const trendsMap: Record<string, Record<string, number>> = {};
  const compMap: Record<string, { count: number, totalRating: number }> = {};

  feedbacks.forEach(f => {
    const presMeds = medsByRx[f.prescription_id] || [];
    const diagnosis = f.prescriptions?.diagnosis || 'Unknown';
    
    presMeds.forEach(m => {
      // 1. Effectiveness
      if (!effMap[m.medicine_name]) effMap[m.medicine_name] = { patients: 0, improved: 0, noEffect: 0, sideEffects: 0 };
      effMap[m.medicine_name].patients++;
      if ((f.improvement_rating || 0) >= 4) effMap[m.medicine_name].improved++;
      else if ((f.improvement_rating || 0) <= 2) effMap[m.medicine_name].noEffect++;
      if (f.had_side_effects) effMap[m.medicine_name].sideEffects++;

      // 2. Disease vs Med
      if (!diseaseMap[diagnosis]) diseaseMap[diagnosis] = {};
      if (!diseaseMap[diagnosis][m.medicine_name]) diseaseMap[diagnosis][m.medicine_name] = { total: 0, success: 0 };
      diseaseMap[diagnosis][m.medicine_name].total++;
      if ((f.improvement_rating || 0) >= 4) diseaseMap[diagnosis][m.medicine_name].success++;
      
      // 4. Comparison
      if (!compMap[m.medicine_name]) compMap[m.medicine_name] = { count: 0, totalRating: 0 };
      compMap[m.medicine_name].count++;
      compMap[m.medicine_name].totalRating += (f.improvement_rating || 0);
    });
  });

  medicines.forEach(m => {
      // 3. Trends
      const spec = m.prescriptions?.doctor_specialization || 'General Physician';
      if (!trendsMap[spec]) trendsMap[spec] = {};
      trendsMap[spec][m.medicine_name] = (trendsMap[spec][m.medicine_name] || 0) + 1;
  });

  const effectivenessData = Object.entries(effMap).map(([name, data]) => ({ name, ...data })).sort((a,b) => b.patients - a.patients);
  if (effectivenessData.length === 0) effectivenessData.push({ name: 'No data', patients: 0, improved: 0, noEffect: 0, sideEffects: 0 });

  const diseaseData = Object.entries(diseaseMap).flatMap(([disease, meds]) => 
     Object.entries(meds).map(([med, stats]) => ({
         disease: disease.slice(0, 30), med, successRate: stats.total > 0 ? Math.round((stats.success/stats.total)*100) : 0
     }))
  ).sort((a, b) => b.successRate - a.successRate);
  if (diseaseData.length === 0) diseaseData.push({ disease: 'No data', med: 'No data', successRate: 0 });

  const trendsData = Object.entries(trendsMap).map(([spec, meds]) => {
      const topMed = Object.entries(meds).sort((a, b) => b[1] - a[1])[0];
      return { spec: spec || 'Unknown', med: topMed ? topMed[0] : 'None', count: topMed ? topMed[1] : 0 };
  }).sort((a,b) => b.count - a.count);
  if (trendsData.length === 0) trendsData.push({ spec: 'No data', med: 'No data', count: 0 });

  const compData = Object.entries(compMap).map(([name, stats]) => ({
      name: name.slice(0, 15), effectiveness: stats.count > 0 ? Math.round((stats.totalRating / (stats.count * 5)) * 100) : 0
  })).sort((a,b) => b.effectiveness - a.effectiveness).slice(0, 6);
  if (compData.length === 0) compData.push({ name: 'No data', effectiveness: 0 });


  const renderContent = () => {
    switch (path) {
      case 'effectiveness':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#1E293B]">Medicine Effectiveness Report</h2>
            <div className="bg-white p-6 rounded-xl border border-[#E2EEF1]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2EEF1] text-[#64748B]">
                    <th className="pb-3">Medicine</th>
                    <th className="pb-3">Patients Used</th>
                    <th className="pb-3">Improved</th>
                    <th className="pb-3">No Effect</th>
                    <th className="pb-3">Side Effects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EEF1]">
                  {effectivenessData.map(m => (
                    <tr key={m.name}>
                        <td className="py-4 font-medium">{m.name}</td>
                        <td>{m.patients}</td>
                        <td className="text-emerald-600 font-bold">{m.patients > 0 ? Math.round((m.improved/m.patients)*100) : 0}%</td>
                        <td>{m.noEffect}</td>
                        <td className="text-rose-500">{m.sideEffects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'disease-vs-med':
        return (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-[#1E293B]">Disease vs Medicine Performance</h2>
              <div className="bg-white p-6 rounded-xl border border-[#E2EEF1]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E2EEF1] text-[#64748B]">
                      <th className="pb-3">Related Diagnosis</th>
                      <th className="pb-3">Medicine Prescribed</th>
                      <th className="pb-3">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EEF1]">
                    {diseaseData.map((d, i) => (
                      <tr key={i}>
                        <td className="py-4">{d.disease}</td>
                        <td className="font-medium text-[#0891B2]">{d.med}</td>
                        <td className="text-emerald-600 font-bold">{d.successRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
      case 'prescription-trends':
        return (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-[#1E293B]">Doctor Prescription Trends</h2>
              <div className="bg-white p-6 rounded-xl border border-[#E2EEF1]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E2EEF1] text-[#64748B]">
                      <th className="pb-3">Doctor Specialty</th>
                      <th className="pb-3">Most Prescribed Drug</th>
                      <th className="pb-3">Prescription Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EEF1]">
                    {trendsData.map((t, i) => (
                      <tr key={i}>
                        <td className="py-4">{t.spec}</td>
                        <td className="font-medium">{t.med}</td>
                        <td>{t.count} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
      case 'comparison':
        return (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-[#1E293B]">Drug Comparison Analytics</h2>
              <div className="h-[300px] bg-white p-6 rounded-xl border border-[#E2EEF1]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Bar dataKey="effectiveness" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E2EEF1]">
            <TrendingUp size={48} className="text-[#8B5CF6] mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-[#1E293B]">Detailed Analytics Coming Soon</h2>
            <p className="text-[#64748B]">We are processing the latest market data for {path?.replace('-', ' ')}.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] capitalize" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {path?.replace('-', ' ')}
          </h1>
          <p className="text-sm text-[#64748B]">Pharmacy: {pharma?.pharmacy_name}</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-lg border border-[#E2EEF1] text-xs font-medium text-[#64748B]">
          Updated: {new Date().toLocaleDateString()}
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default PharmaAnalyticsPage;
