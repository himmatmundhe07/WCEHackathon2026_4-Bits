import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isSameDay, subDays } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle2, Pause, Play, Pencil, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DoctorFitnessPanelProps {
  patientId: string;
  hospitalId: string;
  adminName: string;
}

const INTENSITY_OPTIONS = ['Bed Rest', 'Very Light', 'Light', 'Moderate'];
const INTENSITY_COLORS: Record<string, string> = {
  'Bed Rest': '#DC2626', 'Very Light': '#0891B2', 'Light': '#059669', 'Moderate': '#D97706'
};

const DoctorFitnessPanel: React.FC<DoctorFitnessPanelProps> = ({ patientId, hospitalId, adminName }) => {
  const [plan, setPlan] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingIntensity, setEditingIntensity] = useState(false);

  const db = supabase as any;

  const fetchAll = async () => {
    setLoading(true);
    const [planRes, streakRes, logsRes] = await Promise.all([
      db.from('fitness_plans').select('*').eq('patient_id', patientId).eq('is_active', true).maybeSingle(),
      db.from('fitness_streaks').select('*').eq('patient_id', patientId).maybeSingle(),
      db.from('fitness_logs').select('*').eq('patient_id', patientId).order('log_date', { ascending: false }).limit(30),
    ]);
    setPlan(planRes.data);
    setStreak(streakRes.data);
    setLogs(logsRes.data || []);
    if (planRes.data) {
      const { data: acts } = await db.from('fitness_activities').select('*').eq('plan_id', planRes.data.id);
      setActivities(acts || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [patientId]);

  const togglePause = async () => {
    if (!plan) return;
    setSaving(true);
    await db.from('fitness_plans').update({ is_paused: !plan.is_paused }).eq('id', plan.id);
    toast.success(plan.is_paused ? '▶ Plan resumed' : '⏸ Plan paused');
    await fetchAll();
    setSaving(false);
  };

  const approvePlan = async () => {
    if (!plan) return;
    setSaving(true);
    await db.from('fitness_plans').update({ doctor_approved: true }).eq('id', plan.id);
    toast.success('✅ Plan approved!');
    await fetchAll();
    setSaving(false);
  };

  const saveNote = async () => {
    if (!plan || !newNote.trim()) return;
    setSaving(true);
    await db.from('fitness_plans').update({ doctor_notes: newNote.trim() }).eq('id', plan.id);
    toast.success('📝 Note saved to patient plan');
    setNewNote('');
    await fetchAll();
    setSaving(false);
  };

  const saveIntensity = async (val: string) => {
    if (!plan) return;
    setSaving(true);
    await db.from('fitness_plans').update({ intensity_level: val }).eq('id', plan.id);
    toast.success(`💪 Intensity set to ${val}`);
    setEditingIntensity(false);
    await fetchAll();
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 size={24} className="animate-spin" style={{ color: '#0891B2' }} />
    </div>
  );

  if (!plan) return (
    <div className="text-center py-10">
      <p className="text-sm" style={{ color: '#64748B' }}>No active fitness/recovery plan for this patient.</p>
      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Patient can generate one from their dashboard.</p>
    </div>
  );

  // Concern flags
  const painLogs = logs.filter(l => l.how_felt_after === 'Pain' || l.how_felt_after === 'Dizzy');
  const skippedDays = logs.filter(l => l.status === 'Skipped');

  // Chart data (last 14 days)
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dayLogs = logs.filter(l => { try { return isSameDay(parseISO(l.log_date), date); } catch { return false; } });
    const completedCount = dayLogs.filter(l => l.status === 'Completed').length;
    const totalActs = activities.length || 4;
    const energyEntry = dayLogs.find(l => l.energy_level != null);
    const moodMap: Record<string, number> = { Happy: 5, Okay: 3, Tired: 2, Anxious: 2, Sad: 1 };
    const moodEntry = dayLogs.find(l => l.mood);
    return {
      day: format(date, 'dd/MM'),
      completion: Math.round((completedCount / totalActs) * 100),
      energy: energyEntry?.energy_level ?? null,
      mood: moodEntry ? (moodMap[moodEntry.mood] ?? null) : null,
    };
  });

  const avgCompletion = chartData.filter(d => d.completion > 0).length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.completion, 0) / chartData.length)
    : 0;

  const recentEnergy = chartData.filter(d => d.energy != null).map(d => d.energy!);
  const energyTrend = recentEnergy.length >= 2
    ? recentEnergy[recentEnergy.length - 1] > recentEnergy[0] ? '↑ Improving' : recentEnergy[recentEnergy.length - 1] < recentEnergy[0] ? '↓ Declining' : '→ Stable'
    : 'No data';
  const energyTrendColor = energyTrend.startsWith('↑') ? '#059669' : energyTrend.startsWith('↓') ? '#DC2626' : '#64748B';

  return (
    <div className="space-y-5 text-[13px]">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Plan', value: plan.plan_title, color: '#0891B2' },
          { label: 'Current Streak', value: `${streak?.current_streak ?? 0} days 🔥`, color: '#D97706' },
          { label: 'Completion (2wk)', value: `${avgCompletion}%`, color: avgCompletion >= 70 ? '#059669' : '#D97706' },
          { label: 'Energy Trend', value: energyTrend, color: energyTrendColor },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
            <p className="text-[11px] mb-1" style={{ color: '#64748B' }}>{item.label}</p>
            <p className="font-semibold text-[13px] truncate" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Plan status */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] px-2 py-1 rounded-full font-semibold"
          style={{ background: INTENSITY_COLORS[plan.intensity_level] + '20', color: INTENSITY_COLORS[plan.intensity_level] }}>
          {plan.intensity_level}
        </span>
        {plan.is_paused && <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ background: '#FFFBEB', color: '#D97706' }}>⏸ Paused</span>}
        {plan.doctor_approved && <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ background: '#F0FDF4', color: '#059669' }}>✅ Doc Approved</span>}
        <span className="text-[11px]" style={{ color: '#94A3B8' }}>Generated {format(new Date(plan.created_at), 'dd MMM yyyy')}</span>
      </div>

      {/* Concern Flags */}
      {(painLogs.length > 0 || skippedDays.length >= 3) && (
        <div className="space-y-2">
          <p className="text-[12px] font-bold" style={{ color: '#DC2626' }}>⚠️ Concern Flags</p>
          {painLogs.slice(0, 3).map(l => {
            const act = activities.find(a => a.id === l.activity_id);
            return (
              <div key={l.id} className="p-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={13} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="font-semibold" style={{ color: '#DC2626' }}>
                      {l.how_felt_after === 'Dizzy' ? '😵 Dizziness' : '😟 Pain'} reported{act ? ` during "${act.activity_name}"` : ''} on {l.log_date ? format(parseISO(l.log_date), 'dd MMM') : '—'}
                    </p>
                    {l.pain_location && <p className="text-[11px] mt-0.5" style={{ color: '#7F1D1D' }}>Location: {l.pain_location}</p>}
                  </div>
                </div>
              </div>
            );
          })}
          {skippedDays.length >= 3 && (
            <div className="p-3 rounded-xl" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p className="font-semibold" style={{ color: '#D97706' }}>
                ⏭ Patient has skipped {skippedDays.length} activities recently
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#92400E' }}>Consider reviewing plan intensity.</p>
            </div>
          )}
        </div>
      )}

      {/* Activity completion chart */}
      <div>
        <p className="text-[12px] font-semibold mb-2" style={{ color: '#64748B' }}>Activity Completion (last 14 days)</p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94A3B8' }} />
            <Tooltip formatter={(v: any) => [`${v}%`, 'Completion']} contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="completion" fill="#0891B2" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Energy + mood */}
      <div>
        <p className="text-[12px] font-semibold mb-2" style={{ color: '#64748B' }}>Energy & Mood Trend</p>
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 9, fill: '#94A3B8' }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="energy" stroke="#0891B2" strokeWidth={2} dot={false} name="Energy" connectNulls />
            <Line type="monotone" dataKey="mood" stroke="#F59E0B" strokeWidth={2} dot={false} name="Mood" connectNulls strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Doctor Actions */}
      <div className="space-y-3">
        <p className="text-[12px] font-bold" style={{ color: '#1E293B' }}>Doctor Actions</p>

        {/* Intensity override */}
        <div>
          <p className="text-[11px] font-semibold mb-1" style={{ color: '#64748B' }}>Modify Plan Intensity</p>
          {editingIntensity ? (
            <div className="flex gap-2 flex-wrap">
              {INTENSITY_OPTIONS.map(opt => (
                <button key={opt} onClick={() => saveIntensity(opt)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{ background: INTENSITY_COLORS[opt] + '20', color: INTENSITY_COLORS[opt], border: `1px solid ${INTENSITY_COLORS[opt]}40` }}>
                  {opt}
                </button>
              ))}
              <button onClick={() => setEditingIntensity(false)} className="text-[11px] px-3 py-1.5 rounded-full" style={{ color: '#64748B', border: '1px solid #E2EEF1' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setEditingIntensity(true)} className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#0891B2' }}>
              <Pencil size={12} /> Change intensity (current: {plan.intensity_level})
            </button>
          )}
        </div>

        {/* Pause / Resume */}
        <Button onClick={togglePause} disabled={saving} size="sm" variant="outline"
          className="text-[12px] flex items-center gap-2"
          style={{ borderColor: plan.is_paused ? '#059669' : '#D97706', color: plan.is_paused ? '#059669' : '#D97706' }}>
          {plan.is_paused ? <><Play size={13} /> Resume Plan</> : <><Pause size={13} /> Pause Plan</>}
        </Button>

        {/* Approve */}
        {!plan.doctor_approved && (
          <Button onClick={approvePlan} disabled={saving} size="sm" variant="outline"
            className="text-[12px] flex items-center gap-2"
            style={{ borderColor: '#059669', color: '#059669' }}>
            <CheckCircle2 size={13} /> Approve Plan
          </Button>
        )}

        {/* Doctor notes for patient */}
        <div>
          <p className="text-[11px] font-semibold mb-1" style={{ color: '#64748B' }}>Add Note to Patient's Recovery Plan</p>
          <div className="flex gap-2">
            <input value={newNote} onChange={e => setNewNote(e.target.value)}
              placeholder="e.g. Avoid walking if BP is above 150..."
              className="flex-1 text-[12px] rounded-lg px-3 py-1.5 outline-none field-input" />
            <Button onClick={saveNote} disabled={saving || !newNote.trim()} size="sm"
              className="text-[12px]" style={{ background: '#0891B2', color: '#fff' }}>
              <FileText size={12} className="mr-1" /> Save
            </Button>
          </div>
          {plan.doctor_notes && (
            <p className="text-[11px] mt-1 italic" style={{ color: '#64748B' }}>Current note: "{plan.doctor_notes}"</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorFitnessPanel;
