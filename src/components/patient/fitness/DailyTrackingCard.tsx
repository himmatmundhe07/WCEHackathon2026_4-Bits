import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Droplets, Footprints, Moon, Zap, Smile } from 'lucide-react';
import type { FitnessLog } from './FitnessTypes';

interface DailyTrackingCardProps {
  patientId: string;
  planId: string;
  waterGoalMl: number;
  todayLog: Partial<FitnessLog> | null;
  onSaved: () => void;
}

const MOOD_OPTIONS = [
  { key: 'Happy',   emoji: '😊', label: 'Happy' },
  { key: 'Okay',    emoji: '😐', label: 'Okay' },
  { key: 'Tired',   emoji: '😴', label: 'Tired' },
  { key: 'Anxious', emoji: '😟', label: 'Anxious' },
  { key: 'Sad',     emoji: '😢', label: 'Sad' },
];

const DailyTrackingCard: React.FC<DailyTrackingCardProps> = ({ patientId, planId, waterGoalMl, todayLog, onSaved }) => {
  const [water, setWater] = useState(todayLog?.water_intake_ml ?? 0);
  const [steps, setSteps] = useState<string>(todayLog?.steps_count?.toString() ?? '');
  const [sleep, setSleep] = useState<string>(todayLog?.sleep_hours?.toString() ?? '');
  const [energy, setEnergy] = useState(todayLog?.energy_level ?? 3);
  const [mood, setMood] = useState<string>(todayLog?.mood ?? '');
  const [saving, setSaving] = useState(false);

  const waterPct = Math.min((water / waterGoalMl) * 100, 100);

  const addWater = (ml: number) => {
    setWater(w => Math.min(w + ml, waterGoalMl * 1.5));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const db = supabase as any;
      const { error } = await db.from('fitness_logs').upsert([{
        patient_id: patientId,
        plan_id: planId,
        log_date: today,
        status: 'Rest Day',
        water_intake_ml: water,
        steps_count: steps ? parseInt(steps) : null,
        sleep_hours: sleep ? parseFloat(sleep) : null,
        energy_level: energy,
        mood: mood || null,
        activity_id: null,
      }]);
      if (error) throw error;

      // Check hydration badge - just update streaks if water goal hit
      if (water >= waterGoalMl) {
        const { data: strk } = await db.from('fitness_streaks').select('badges_earned').eq('patient_id', patientId).maybeSingle();
        if (strk && !strk.badges_earned?.includes('Hydration Hero')) {
          await db.from('fitness_streaks').update({ badges_earned: [...(strk.badges_earned || []), 'Hydration Hero'] }).eq('patient_id', patientId);
        }
      }

      toast.success('✅ Daily log saved!');
      onSaved();
    } catch (e: any) {
      toast.error('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
      {/* Water Tracker */}
      <div className="p-5 pb-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <div className="flex items-center gap-2 mb-3">
          <Droplets size={18} style={{ color: '#0891B2' }} />
          <h3 className="text-sm font-bold" style={{ color: '#1E293B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            💧 Water Intake Today
          </h3>
        </div>

        {/* Water bottle visual */}
        <div className="flex items-end gap-4 mb-3">
          <div className="relative" style={{ width: 44, height: 80 }}>
            <div className="absolute inset-0 rounded-xl overflow-hidden" style={{ background: '#E2EEF1', border: '2px solid #0891B230' }}>
              <div className="absolute bottom-0 left-0 right-0 rounded-b-xl transition-all duration-500"
                style={{ height: `${waterPct}%`, background: 'linear-gradient(180deg, #67E8F9 0%, #0891B2 100%)' }} />
            </div>
            {/* Bottle cap */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-3 rounded-t-md" style={{ background: '#0891B2' }} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold" style={{ color: '#0891B2', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {water >= 1000 ? `${(water / 1000).toFixed(1)}L` : `${water}ml`}
            </p>
            <p className="text-xs" style={{ color: '#64748B' }}>of {waterGoalMl >= 1000 ? `${(waterGoalMl / 1000).toFixed(1)}L` : `${waterGoalMl}ml`} goal</p>
            {water >= waterGoalMl && <p className="text-xs font-semibold mt-1" style={{ color: '#059669' }}>🎉 Goal reached!</p>}
            {water >= waterGoalMl * 0.5 && water < waterGoalMl && <p className="text-xs mt-1" style={{ color: '#0891B2' }}>Halfway there! Keep going 💧</p>}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[200, 300, 500].map(ml => (
            <button key={ml} onClick={() => addWater(ml)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: '#EBF7FA', color: '#0891B2', border: '1px solid #D1EBF1' }}>
              +{ml}ml
            </button>
          ))}
          <div className="flex items-center gap-1">
            <input type="number" placeholder="Custom ml" min="0" max="2000"
              className="w-24 text-xs rounded-lg px-2 py-1.5 outline-none"
              style={{ border: '1px solid #E2EEF1', color: '#1E293B' }}
              onBlur={e => { if (e.target.value) { addWater(parseInt(e.target.value)); e.target.value = ''; } }} />
          </div>
        </div>
      </div>

      {/* Other daily metrics */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Sleep */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>
              <Moon size={13} /> Sleep last night (hrs)
            </label>
            <input type="number" min="0" max="24" step="0.5" value={sleep} onChange={e => setSleep(e.target.value)}
              placeholder="e.g. 7.5"
              className="w-full text-sm rounded-lg px-3 py-2 outline-none field-input" />
          </div>
          {/* Steps */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>
              <Footprints size={13} /> Steps today
            </label>
            <input type="number" min="0" value={steps} onChange={e => setSteps(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full text-sm rounded-lg px-3 py-2 outline-none field-input" />
          </div>
        </div>

        {/* Energy */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: '#64748B' }}>
            <Zap size={13} /> Energy level
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setEnergy(n)}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: energy >= n ? '#F59E0B' : '#F1F5F9',
                  color: energy >= n ? '#fff' : '#94A3B8',
                }}>
                {n === 1 ? '😞' : n === 2 ? '😐' : n === 3 ? '🙂' : n === 4 ? '😊' : '🤩'}
              </button>
            ))}
          </div>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
            {energy === 1 ? 'Exhausted — rest today' : energy === 2 ? 'Low energy' : energy === 3 ? 'Manageable' : energy === 4 ? 'Feeling good!' : 'Feeling great!'}
          </p>
        </div>

        {/* Mood */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: '#64748B' }}>
            <Smile size={13} /> Mood today
          </label>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setMood(opt.key)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs transition-all"
                style={{
                  background: mood === opt.key ? '#EBF7FA' : '#F8FAFC',
                  border: mood === opt.key ? '1.5px solid #0891B2' : '1.5px solid #E2EEF1',
                  color: mood === opt.key ? '#0891B2' : '#64748B',
                }}>
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-[9px]">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: saving ? '#94A3B8' : '#0891B2' }}>
          {saving ? 'Saving...' : '💾 Save Today\'s Log'}
        </button>
      </div>
    </div>
  );
};

export default DailyTrackingCard;
