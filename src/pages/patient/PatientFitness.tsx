import React, { useEffect, useState, useCallback } from 'react';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, RefreshCw, Bot, AlertTriangle, Play, CheckCircle2, SkipForward, Clock } from 'lucide-react';
import JharokhaArch from '@/components/admin/JharokhaArch';
import RecoveryAnimation from '@/components/patient/RecoveryAnimations';
import ActivityPlayer from '@/components/patient/fitness/ActivityPlayer';
import DailyTrackingCard from '@/components/patient/fitness/DailyTrackingCard';
import StreakCard from '@/components/patient/fitness/StreakCard';
import ProgressCharts from '@/components/patient/fitness/ProgressCharts';
import { INTENSITY_COLORS, CATEGORY_ICONS } from '@/components/patient/fitness/FitnessTypes';
import type { FitnessPlan, FitnessActivity, FitnessLog, FitnessStreak } from '@/components/patient/fitness/FitnessTypes';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

const MandanaDivider = () => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px" style={{ background: '#E2EEF1' }} />
    <span style={{ color: '#E8A820', fontSize: '14px' }}>◇ — ◇</span>
    <div className="flex-1 h-px" style={{ background: '#E2EEF1' }} />
  </div>
);

const PatientFitness: React.FC = () => {
  const { patient } = usePatientContext();
  const firstName = patient.full_name?.split(' ')[0] || 'there';

  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [activities, setActivities] = useState<FitnessActivity[]>([]);
  const [logs, setLogs] = useState<FitnessLog[]>([]);
  const [streak, setStreak] = useState<FitnessStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeActivity, setActiveActivity] = useState<FitnessActivity | null>(null);
  const [activityStatuses, setActivityStatuses] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  const fetchData = useCallback(async () => {
    const pid = patient.id;
    const db = supabase as any;
    const [planRes, streakRes, logsRes] = await Promise.all([
      db.from('fitness_plans').select('*').eq('patient_id', pid).eq('is_active', true).maybeSingle(),
      db.from('fitness_streaks').select('*').eq('patient_id', pid).maybeSingle(),
      db.from('fitness_logs').select('*').eq('patient_id', pid).order('log_date', { ascending: false }).limit(60),
    ]);
    setPlan(planRes.data as FitnessPlan | null);
    setStreak(streakRes.data as FitnessStreak | null);
    setLogs((logsRes.data || []) as FitnessLog[]);

    if (planRes.data) {
      const { data: acts } = await (db as any)
        .from('fitness_activities')
        .select('*')
        .eq('plan_id', (planRes.data as any).id)
        .order('order_in_plan', { ascending: true });
      setActivities((acts || []) as FitnessActivity[]);

      // Build today's statuses
      const todayLogs = ((logsRes.data || []) as any[]).filter((l: any) => l.log_date === today);
      const statusMap: Record<string, string> = {};
      todayLogs.forEach((l: any) => { if (l.activity_id) statusMap[l.activity_id] = l.status; });
      setActivityStatuses(statusMap);
    }
    setLoading(false);
  }, [patient.id, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-fitness-plan', { body: { patientId: patient.id } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success('🤖 Your recovery plan has been refreshed!');
      await fetchData();
    } catch (e: any) {
      toast.error('Failed to generate plan: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const skipActivity = async (activity: FitnessActivity) => {
    await (supabase as any).from('fitness_logs').insert({
      patient_id: patient.id,
      activity_id: activity.id,
      plan_id: plan!.id,
      log_date: today,
      status: 'Skipped',
      how_felt_after: 'Skipped',
    });
    setActivityStatuses(s => ({ ...s, [activity.id]: 'Skipped' }));
    toast('⏭ Skipped — rest is part of recovery too 🌱');
  };

  const handleActivityComplete = async (log: Partial<FitnessLog>) => {
    const { error } = await (supabase as any).from('fitness_logs').insert(log);
    if (!error && log.activity_id) {
      setActivityStatuses(s => ({ ...s, [log.activity_id!]: log.status || 'Completed' }));
      // Update streak
      await updateStreak();
      // Badge: first step
      if (!streak?.badges_earned?.includes('First Step')) {
        await (supabase as any).from('fitness_streaks')
          .update({ badges_earned: ['First Step', ...(streak?.badges_earned || [])] })
          .eq('patient_id', patient.id);
      }
    }
  };

  const updateStreak = async () => {
    const { data: todayLogs } = await (supabase as any)
      .from('fitness_logs')
      .select('status')
      .eq('patient_id', patient.id)
      .eq('log_date', today)
      .eq('status', 'Completed');

    if ((todayLogs?.length ?? 0) > 0) {
      const { data: currentStreak } = await (supabase as any)
        .from('fitness_streaks')
        .select('*')
        .eq('patient_id', patient.id)
        .maybeSingle();

      const cs = currentStreak as any;
      const lastDate = cs?.last_active_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastDate === yesterday.toISOString().split('T')[0];
      const isAlreadyToday = lastDate === today;

      if (!isAlreadyToday) {
        const newStreak = wasYesterday ? (cs?.current_streak ?? 0) + 1 : 1;
        const longest = Math.max(newStreak, cs?.longest_streak ?? 0);
        const totalDays = (cs?.total_active_days ?? 0) + 1;
        const badges = [...(cs?.badges_earned ?? [])];
        if (newStreak >= 3 && !badges.includes('3-Day Warrior')) badges.push('3-Day Warrior');
        if (newStreak >= 7 && !badges.includes('Week Champion')) badges.push('Week Champion');

        await (supabase as any).from('fitness_streaks').upsert([{
          patient_id: patient.id,
          current_streak: newStreak,
          longest_streak: longest,
          last_active_date: today,
          total_active_days: totalDays,
          badges_earned: badges,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'patient_id' });
        await fetchData();
      }
    }
  };

  const completedToday = activities.filter(a => activityStatuses[a.id] === 'Completed').length;
  const completionPct = activities.length > 0 ? Math.round((completedToday / activities.length) * 100) : 0;
  const ringColor = completionPct === 100 ? '#10B981' : completionPct >= 50 ? '#0891B2' : '#F59E0B';

  const todayLog = logs.find(l => l.log_date === today && l.water_intake_ml != null) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin mx-auto mb-3" style={{ color: '#0891B2' }} />
          <p className="text-sm" style={{ color: '#64748B' }}>Loading your recovery plan...</p>
        </div>
      </div>
    );
  }

  // No plan — onboarding prompt
  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-8 text-center overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #EBF7FA 0%, #F0FDF4 100%)', border: '1px solid #D1EBF1' }}>
          <div className="absolute inset-0 jaali-pattern opacity-5" />
          <div className="relative z-10">
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1E293B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Welcome to Your Recovery Journey
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: '#64748B' }}>
              Let our AI create a safe, personalized recovery activity plan based on your medical profile, current vitals, and health conditions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              {[
                { icon: '🩺', text: 'Medically safe activities' },
                { icon: '🎮', text: 'Gamified with streaks & badges' },
                { icon: '👨‍⚕️', text: 'Shared with your doctor' },
              ].map(f => (
                <div key={f.text} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl" style={{ border: '1px solid #D1EBF1' }}>
                  <span>{f.icon}</span>
                  <span className="text-xs font-medium" style={{ color: '#1E293B' }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={generatePlan} disabled={generating}
              className="px-8 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 mx-auto disabled:opacity-60 transition-all hover:scale-105"
              style={{ background: '#0891B2' }}>
              {generating ? <><Loader2 size={16} className="animate-spin" /> Generating your plan...</> : <><Bot size={16} /> Generate My Recovery Plan</>}
            </button>
            <p className="text-xs mt-3" style={{ color: '#94A3B8' }}>Takes about 10–20 seconds · Powered by Grok AI</p>
          </div>
        </div>
      </div>
    );
  }

  // Plan is paused by doctor
  if (plan.is_paused) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <div className="text-4xl mb-3">⏸️</div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#92400E' }}>Recovery Plan Paused</h2>
        <p className="text-sm" style={{ color: '#78350F' }}>Your doctor has temporarily paused your plan. Rest today and wait for updates.</p>
        {plan.doctor_notes && <p className="text-sm mt-3 italic" style={{ color: '#78350F' }}>Note: {plan.doctor_notes}</p>}
      </div>
    );
  }

  const intensityMeta = INTENSITY_COLORS[plan.intensity_level] || INTENSITY_COLORS['Very Light'];
  const radialData = [{ value: completionPct, fill: ringColor }];

  const nextActivityIdx = activities.findIndex(a => !activityStatuses[a.id]);
  const nextActivity = nextActivityIdx >= 0 ? activities[nextActivityIdx] : null;

  return (
    <div className="space-y-6 pb-10">
      {/* ── SECTION 1: Hero Card ─────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden relative" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                {greeting}, {firstName} {greetingEmoji}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: intensityMeta.bg, color: intensityMeta.color }}>
                  {intensityMeta.label}
                </span>
                <span className="text-xs font-medium" style={{ color: '#64748B' }}>💊 {plan.plan_title}</span>
              </div>
              {/* Quick stats */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#FFFBEB' }}>
                  <span className="text-xs font-bold" style={{ color: '#D97706' }}>🔥 {streak?.current_streak ?? 0} days</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#EBF7FA' }}>
                  <span className="text-xs font-bold" style={{ color: '#0891B2' }}>
                    💧 {todayLog?.water_intake_ml ? `${(todayLog.water_intake_ml / 1000).toFixed(1)}L` : '0L'} / {plan.daily_water_goal_ml >= 1000 ? `${(plan.daily_water_goal_ml / 1000).toFixed(1)}L` : plan.daily_water_goal_ml + 'ml'}
                  </span>
                </div>
                {todayLog?.energy_level && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#F0FDF4' }}>
                    <span className="text-xs font-bold" style={{ color: '#059669' }}>⚡ {todayLog.energy_level}/5</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress ring */}
            <div className="flex flex-col items-center">
              <div className="relative" style={{ width: 100, height: 100 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#E2EEF1' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: ringColor }}>{completedToday}/{activities.length}</span>
                  <span className="text-[9px]" style={{ color: '#94A3B8' }}>done</span>
                </div>
              </div>
            </div>
          </div>

          {/* Start Today's Plan CTA */}
          {nextActivity && (
            <button onClick={() => setActiveActivity(nextActivity)}
              className="w-full mt-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:scale-[1.01]"
              style={{ background: '#0891B2' }}>
              <Play size={16} /> Start Today's Plan
            </button>
          )}
          {!nextActivity && activities.length > 0 && (
            <div className="w-full mt-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
              style={{ background: '#F0FDF4', color: '#059669', border: '1px solid #BBF7D0' }}>
              <CheckCircle2 size={16} /> All activities completed today! 🎉
            </div>
          )}
        </div>
      </div>

      {/* ── Safety Banner (if needed) ──────────────────────── */}
      {plan.safety_note && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <AlertTriangle size={16} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#DC2626' }}>⚠️ Safety Note</p>
            <p className="text-xs" style={{ color: '#7F1D1D' }}>{plan.safety_note}</p>
          </div>
        </div>
      )}

      {/* ── SECTION 2: Today's Activities ────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: '#1E293B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Today's Activities
          </h2>
          <span className="text-xs" style={{ color: '#64748B' }}>{format(new Date(), 'EEEE, dd MMM')}</span>
        </div>
        <MandanaDivider />

        <div className="space-y-3">
          {activities.map(activity => {
            const status = activityStatuses[activity.id];
            const isDone = status === 'Completed';
            const isSkipped = status === 'Skipped';
            const mins = activity.duration_seconds ? Math.ceil(activity.duration_seconds / 60) : null;
            const catIcon = CATEGORY_ICONS[activity.category] || '🏃';

            return (
              <div key={activity.id} className="bg-white rounded-2xl overflow-hidden transition-all"
                style={{
                  border: isDone ? '1.5px solid #10B981' : isSkipped ? '1.5px solid #CBD5E1' : '1.5px solid #E2EEF1',
                  background: isDone ? '#F0FDF4' : isSkipped ? '#F8FAFC' : 'white',
                }}>
                {/* Active pulsing strip */}
                {!isDone && !isSkipped && (
                  <div className="h-1 animate-pulse" style={{ background: 'linear-gradient(90deg, #0891B2, #67E8F9, #0891B2)', backgroundSize: '200% 100%' }} />
                )}

                <div className="p-4">
                  {/* Top meta */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#EBF7FA', color: '#0891B2' }}>
                        {activity.best_time}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>
                        {activity.difficulty_label}
                      </span>
                    </div>
                    {isDone && <CheckCircle2 size={18} style={{ color: '#10B981' }} />}
                    {isSkipped && <SkipForward size={18} style={{ color: '#94A3B8' }} />}
                  </div>

                  <div className="flex gap-3">
                    {/* Animation */}
                    <div className="shrink-0 flex items-center justify-center rounded-xl"
                      style={{ width: 72, height: 72, background: isDone ? '#F0FDF4' : '#EBF7FA' }}>
                      <RecoveryAnimation animationKey={activity.animation_key || 'deep_breath'} size={64}
                        color={isDone ? '#10B981' : '#0891B2'} accentColor="#F59E0B" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span>{catIcon}</span>
                        <h3 className="text-sm font-bold" style={{ color: isDone ? '#059669' : '#1E293B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                          {activity.activity_name}
                        </h3>
                      </div>
                      <p className="text-xs mb-1" style={{ color: '#64748B' }}>
                        {activity.category}
                        {mins && ` · ${mins} min`}
                        {activity.sets > 1 && ` · ${activity.sets} sets`}
                      </p>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#475569' }}>
                        {activity.description}
                      </p>
                    </div>
                  </div>

                  {/* Caution */}
                  {activity.caution_note && !isDone && !isSkipped && (
                    <div className="mt-2 flex items-start gap-1.5 px-3 py-2 rounded-lg" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                      <AlertTriangle size={11} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
                      <p className="text-xs" style={{ color: '#92400E' }}>{activity.caution_note}</p>
                    </div>
                  )}

                  {/* Sets dots */}
                  {activity.sets > 1 && !isDone && (
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: activity.sets }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full" style={{ background: '#D1EBF1' }} />
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {!isDone && !isSkipped && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setActiveActivity(activity)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                        style={{ background: '#F59E0B' }}>
                        <Play size={13} /> Start Activity
                      </button>
                      <button onClick={() => skipActivity(activity)}
                        className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ background: '#F1F5F9', color: '#64748B' }}>
                        Skip
                      </button>
                    </div>
                  )}

                  {/* Status labels */}
                  {isDone && (
                    <p className="text-xs font-semibold mt-2" style={{ color: '#059669' }}>✅ Completed</p>
                  )}
                  {isSkipped && (
                    <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>⏭ Skipped — No worries, rest is part of recovery 🌱</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3 + 4: Water & Daily Tracking ─────────── */}
      <DailyTrackingCard
        patientId={patient.id}
        planId={plan.id}
        waterGoalMl={plan.daily_water_goal_ml}
        todayLog={todayLog}
        onSaved={fetchData}
      />

      {/* ── SECTION 5: Streak & Badges ───────────────────── */}
      <StreakCard streak={streak} logs={logs} />

      {/* ── SECTION 6: Progress Charts ───────────────────── */}
      <ProgressCharts logs={logs} activities={activities} waterGoalMl={plan.daily_water_goal_ml} />

      {/* ── SECTION 7: AI Plan Details ───────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bot size={16} style={{ color: '#0891B2' }} />
                <h3 className="text-sm font-bold" style={{ color: '#1E293B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  About Your Recovery Plan
                </h3>
              </div>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Generated {format(new Date(plan.created_at), 'dd MMM yyyy')}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: intensityMeta.bg, color: intensityMeta.color }}>
              {intensityMeta.label}
            </span>
          </div>

          <p className="text-sm leading-relaxed mb-3" style={{ color: '#475569' }}>{plan.plan_summary}</p>

          {plan.safety_note && (
            <div className="p-3 rounded-xl mb-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#DC2626' }}>⚠️ Important Safety Note</p>
              <p className="text-xs" style={{ color: '#7F1D1D' }}>{plan.safety_note}</p>
            </div>
          )}

          {plan.expires_at && (
            <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: '#64748B' }}>
              <Clock size={12} />
              Plan refreshes: {format(new Date(plan.expires_at), 'dd MMM yyyy')} · Based on your latest vitals
            </div>
          )}

          {plan.doctor_approved && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl mb-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <CheckCircle2 size={14} style={{ color: '#059669' }} />
              <p className="text-xs font-semibold" style={{ color: '#059669' }}>Doctor Approved ✓</p>
            </div>
          )}

          {plan.doctor_notes && (
            <div className="px-3 py-2 rounded-xl mb-3" style={{ background: '#EBF7FA', border: '1px solid #D1EBF1' }}>
              <p className="text-xs font-semibold mb-0.5" style={{ color: '#0891B2' }}>👨‍⚕️ Doctor's Note</p>
              <p className="text-xs" style={{ color: '#1E293B' }}>{plan.doctor_notes}</p>
            </div>
          )}

          <button onClick={generatePlan} disabled={generating}
            className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-60"
            style={{ border: '1.5px solid #0891B2', color: '#0891B2', background: 'white' }}>
            {generating ? <><Loader2 size={14} className="animate-spin" /> Regenerating...</> : <><RefreshCw size={14} /> Regenerate Plan</>}
          </button>
        </div>
      </div>

      {/* ── ACTIVITY PLAYER OVERLAY ───────────────────────── */}
      {activeActivity && (
        <ActivityPlayer
          activity={activeActivity}
          planId={plan.id}
          patientId={patient.id}
          onClose={() => setActiveActivity(null)}
          onComplete={handleActivityComplete}
          onNext={() => {
            setActiveActivity(null);
            // Auto-advance to next
            const nextIdx = activities.findIndex((a, i) => i > activities.indexOf(activeActivity) && !activityStatuses[a.id]);
            if (nextIdx >= 0) setTimeout(() => setActiveActivity(activities[nextIdx]), 500);
          }}
        />
      )}
    </div>
  );
};

export default PatientFitness;
