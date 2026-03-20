import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format, subDays, subMonths, startOfDay, isAfter } from 'date-fns';
import jsPDF from 'jspdf';
import type { HospitalProfile } from '@/hooks/useHospitalContext';

const COLORS = ['#F59E0B', '#0891B2', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const ranges = ['Today', 'This Week', 'This Month', 'Last 3 Months'] as const;
type Range = typeof ranges[number];

const HospitalAnalytics = () => {
  const { hospital } = useOutletContext<{ hospital: HospitalProfile | null }>();
  const [range, setRange] = useState<Range>('This Month');
  const [metrics, setMetrics] = useState({ avgOccupancy: 0, avgStay: 0, topSpec: 'N/A', collectionRate: 0 });
  const [admissionData, setAdmissionData] = useState<any[]>([]);
  const [apptData, setApptData] = useState<any[]>([]);
  const [bedData, setBedData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [specData, setSpecData] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);

  const getStartDate = () => {
    const now = new Date();
    if (range === 'Today') return startOfDay(now);
    if (range === 'This Week') return subDays(now, 7);
    if (range === 'This Month') return subDays(now, 30);
    return subMonths(now, 3);
  };

  useEffect(() => {
    if (!hospital) return;
    const fetchAll = async () => {
      const start = getStartDate();
      const startStr = start.toISOString();

      const [bedsRes, billsRes, patientsRes, staffRes, apptsRes] = await Promise.all([
        supabase.from('hospital_beds').select('status').eq('hospital_id', hospital.id),
        supabase.from('hospital_bills').select('total, paid_amount, bill_date').eq('hospital_id', hospital.id),
        supabase.from('hospital_patients').select('admitted_at, discharged_at, diagnosis, relationship_type').eq('hospital_id', hospital.id),
        supabase.from('hospital_staff').select('shift, is_on_duty, specialization').eq('hospital_id', hospital.id),
        supabase.from('patient_appointments').select('appointment_date, status').eq('hospital_id', hospital.id),
      ]);

      const beds = bedsRes.data || [];
      const bills = billsRes.data || [];
      const pts = patientsRes.data || [];
      const stf = staffRes.data || [];
      const appts = apptsRes.data || [];

      // Metrics
      const totalBeds = beds.length;
      const occupied = beds.filter(b => b.status === 'Occupied').length;
      const avgOcc = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;
      const totalBilled = bills.reduce((s, b) => s + (Number(b.total) || 0), 0);
      const totalCollected = bills.reduce((s, b) => s + (Number(b.paid_amount) || 0), 0);
      const collRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

      // Avg stay
      const stays = pts.filter(p => p.admitted_at && p.discharged_at).map(p => (new Date(p.discharged_at).getTime() - new Date(p.admitted_at).getTime()) / 86400000);
      const avgStay = stays.length > 0 ? Math.round(stays.reduce((a, b) => a + b, 0) / stays.length) : 0;

      // Top specialization
      const specCount: Record<string, number> = {};
      stf.forEach(s => { if (s.specialization) specCount[s.specialization] = (specCount[s.specialization] || 0) + 1; });
      const topSpec = Object.entries(specCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';

      setMetrics({ avgOccupancy: avgOcc, avgStay, topSpec, collectionRate: collRate });

      // Chart 1 - Admissions by day
      const days = range === 'Today' ? 1 : range === 'This Week' ? 7 : range === 'This Month' ? 30 : 90;
      const admMap: Record<string, number> = {};
      for (let i = 0; i < Math.min(days, 30); i++) {
        const d = format(subDays(new Date(), i), 'MMM dd');
        admMap[d] = 0;
      }
      pts.filter(p => p.admitted_at && isAfter(new Date(p.admitted_at), start)).forEach(p => {
        const d = format(new Date(p.admitted_at), 'MMM dd');
        if (admMap[d] !== undefined) admMap[d]++;
      });
      setAdmissionData(Object.entries(admMap).reverse().map(([day, count]) => ({ day, count })));

      // Chart 2 - Appointments
      const apptMap: Record<string, { confirmed: number; completed: number; cancelled: number }> = {};
      appts.filter(a => isAfter(new Date(a.appointment_date), start)).forEach(a => {
        const d = format(new Date(a.appointment_date), 'MMM dd');
        if (!apptMap[d]) apptMap[d] = { confirmed: 0, completed: 0, cancelled: 0 };
        if (a.status === 'Confirmed' || a.status === 'Upcoming') apptMap[d].confirmed++;
        else if (a.status === 'Completed') apptMap[d].completed++;
        else if (a.status === 'Cancelled') apptMap[d].cancelled++;
      });
      setApptData(Object.entries(apptMap).map(([day, v]) => ({ day, ...v })));

      // Chart 3 - Bed occupancy per day (real data from admissions)
      const totalBedsCount = beds.length || 1;
      const bedDays = [];
      for (let i = Math.min(days, 14) - 1; i >= 0; i--) {
        const dayStart = startOfDay(subDays(new Date(), i));
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        // Count patients who were admitted before this day's end and either still admitted OR discharged after this day's start
        const occupiedThatDay = pts.filter(p => {
          if (!p.admitted_at) return false;
          const admittedAt = new Date(p.admitted_at);
          const dischargedAt = p.discharged_at ? new Date(p.discharged_at) : null;
          return admittedAt < dayEnd && (!dischargedAt || dischargedAt > dayStart);
        }).length;
        const occupancyPct = Math.min(100, Math.round((occupiedThatDay / totalBedsCount) * 100));
        bedDays.push({ day: format(dayStart, 'MMM dd'), occupancy: occupancyPct, patients: occupiedThatDay });
      }
      setBedData(bedDays);

      // Chart 4 - Revenue
      const revMap: Record<string, { billed: number; collected: number }> = {};
      bills.filter(b => isAfter(new Date(b.bill_date), start)).forEach(b => {
        const d = format(new Date(b.bill_date), 'MMM dd');
        if (!revMap[d]) revMap[d] = { billed: 0, collected: 0 };
        revMap[d].billed += Number(b.total) || 0;
        revMap[d].collected += Number(b.paid_amount) || 0;
      });
      setRevenueData(Object.entries(revMap).map(([day, v]) => ({ day, ...v })));

      // Chart 5 - Specialization pie
      const specPts: Record<string, number> = {};
      pts.filter(p => p.diagnosis).forEach(p => { specPts[p.diagnosis!] = (specPts[p.diagnosis!] || 0) + 1; });
      setSpecData(Object.entries(specPts).slice(0, 6).map(([name, value]) => ({ name, value })));

      // Chart 6 - Staff by shift
      const shiftMap: Record<string, number> = { Morning: 0, Afternoon: 0, Night: 0 };
      stf.filter(s => s.is_on_duty).forEach(s => { if (s.shift && shiftMap[s.shift] !== undefined) shiftMap[s.shift]++; });
      setStaffData(Object.entries(shiftMap).map(([shift, count]) => ({ shift, count })));
    };
    fetchAll();
  }, [hospital, range]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Sanjeevani — Analytics Report', 20, 25);
    doc.setFontSize(11);
    doc.text(`Hospital: ${hospital?.hospital_name}`, 20, 38);
    doc.text(`Period: ${range}`, 20, 46);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 20, 54);
    doc.text(`Avg Bed Occupancy: ${metrics.avgOccupancy}%`, 20, 68);
    doc.text(`Avg Length of Stay: ${metrics.avgStay} days`, 20, 76);
    doc.text(`Collection Rate: ${metrics.collectionRate}%`, 20, 84);
    doc.text(`Top Specialization: ${metrics.topSpec}`, 20, 92);
    doc.save(`analytics-${hospital?.hospital_name}-${range}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Analytics</h1>
        <Button variant="outline" onClick={exportPDF} className="text-[13px]" style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
          <Download size={14} /> Export Report
        </Button>
      </div>

      {/* Range pills */}
      <div className="flex gap-2">
        {ranges.map(r => (
          <button key={r} onClick={() => setRange(r)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium"
            style={{ background: range === r ? '#FFFBEB' : 'transparent', color: range === r ? '#F59E0B' : '#64748B', border: range === r ? '1px solid #F59E0B' : '1px solid transparent' }}>
            {r}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Bed Occupancy', value: `${metrics.avgOccupancy}%`, color: '#0891B2' },
          { label: 'Avg Length of Stay', value: `${metrics.avgStay} days`, color: '#F59E0B' },
          { label: 'Collection Rate', value: `${metrics.collectionRate}%`, color: '#10B981' },
          { label: 'Top Specialization', value: metrics.topSpec, color: '#64748B' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border p-4 overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
            <JharokhaArch color={m.color} opacity={0.12} />
            <p className="text-[12px]" style={{ color: '#64748B' }}>{m.label}</p>
            <p className="text-lg font-bold mt-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart 1 - Admissions */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
          <JharokhaArch color="#F59E0B" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Patient Admissions</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={admissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderColor: '#E2EEF1' }} />
                <Area type="monotone" dataKey="count" fill="#F59E0B" fillOpacity={0.2} stroke="#F59E0B" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 - Appointments */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
          <JharokhaArch color="#0891B2" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Appointment Volume</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={apptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderColor: '#E2EEF1' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="confirmed" fill="#0891B2" name="Confirmed" radius={[3, 3, 0, 0]} />
                <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[3, 3, 0, 0]} />
                <Bar dataKey="cancelled" fill="#EF4444" name="Cancelled" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3 - Bed Occupancy */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
          <JharokhaArch color="#0891B2" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Bed Occupancy Rate</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={bedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderColor: '#E2EEF1' }} />
                <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: '80%', fontSize: 10, fill: '#F59E0B' }} />
                <Line type="monotone" dataKey="occupancy" stroke="#0891B2" strokeWidth={2} dot={{ r: 3, fill: '#0891B2' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4 - Revenue */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
          <JharokhaArch color="#F59E0B" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Revenue Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderColor: '#E2EEF1' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="billed" fill="#F59E0B" name="Billed" stackId="a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="collected" fill="#10B981" name="Collected" stackId="b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5 - Specialization Pie */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
          <JharokhaArch color="#F59E0B" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Patient Flow by Diagnosis</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={specData.length > 0 ? specData : [{ name: 'No Data', value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {(specData.length > 0 ? specData : [{ name: 'No Data', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6 - Staff by Shift */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
          <JharokhaArch color="#0891B2" opacity={0.18} />
          <div className="p-5">
            <h3 className="text-[14px] font-bold mb-4" style={{ color: '#1E293B' }}>Staff On Duty by Shift</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={staffData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF1" />
                <XAxis dataKey="shift" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderColor: '#E2EEF1' }} />
                <Bar dataKey="count" fill="#0891B2" name="On Duty" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalAnalytics;
