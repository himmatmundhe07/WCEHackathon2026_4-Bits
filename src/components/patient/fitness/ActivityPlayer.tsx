import React, { useState, useEffect, useRef } from 'react';
import RecoveryAnimation from '../RecoveryAnimations';
import { X, Pause, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { FitnessActivity, FitnessLog } from './FitnessTypes';

interface ActivityPlayerProps {
  activity: FitnessActivity;
  planId: string;
  patientId: string;
  onClose: () => void;
  onComplete: (log: Partial<FitnessLog>) => void;
  onNext: () => void;
}

const FEEL_OPTIONS = [
  { key: 'Great',  emoji: '😊', label: 'Great' },
  { key: 'Good',   emoji: '🙂', label: 'Good' },
  { key: 'Okay',   emoji: '😐', label: 'Okay' },
  { key: 'Tired',  emoji: '😴', label: 'Tired' },
  { key: 'Pain',   emoji: '😟', label: 'Pain' },
  { key: 'Dizzy',  emoji: '😵', label: 'Dizzy' },
];

const ActivityPlayer: React.FC<ActivityPlayerProps> = ({ activity, planId, patientId, onClose, onComplete, onNext }) => {
  const totalSeconds = activity.duration_seconds || 300;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const [phase, setPhase] = useState<'active' | 'done'>('active');
  const [feel, setFeel] = useState<string | null>(null);
  const [painLocation, setPainLocation] = useState('');
  const [startTime] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && phase === 'active') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setPhase('done');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const handleStopEarly = () => {
    setPhase('done');
    setRunning(false);
  };

  const handleSaveFeel = () => {
    if (!feel) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onComplete({
      activity_id: activity.id,
      plan_id: planId,
      patient_id: patientId,
      status: timeLeft === 0 ? 'Completed' : 'Partial',
      duration_actual_seconds: elapsed,
      how_felt_after: feel as any,
      pain_location: feel === 'Pain' || feel === 'Dizzy' ? painLocation || null : null,
      log_date: new Date().toISOString().split('T')[0],
    });
    onNext();
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#0F1B2D' }}>
      <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <X size={20} color="white" />
      </button>

      {phase === 'active' ? (
        <div className="flex flex-col items-center gap-6 w-full max-w-md px-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{activity.activity_name}</h2>
            <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#0891B220', color: '#67E8F9' }}>{activity.category}</span>
          </div>

          {/* Animation */}
          <div className="flex items-center justify-center">
            <RecoveryAnimation animationKey={activity.animation_key || 'deep_breath'} size={160} color="#67E8F9" accentColor="#F59E0B" />
          </div>

          {/* Circular timer */}
          <div className="relative flex items-center justify-center">
            <svg width="200" height="200">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#1E3A5F" strokeWidth="8" />
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#0891B2" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="absolute text-center">
              <div className="text-4xl font-bold text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {mins}:{secs.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-blue-200 mt-1">remaining</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center max-w-sm">
            <p className="text-sm text-blue-100 leading-relaxed">{activity.description}</p>
          </div>

          {/* Caution */}
          {activity.caution_note && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg w-full" style={{ background: '#FF444420', border: '1px solid #FF444440' }}>
              <AlertTriangle size={14} color="#FCA5A5" />
              <p className="text-xs text-red-200">{activity.caution_note}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            <button onClick={() => setRunning(r => !r)} className="px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pause' : 'Resume'}
            </button>
            <button onClick={handleStopEarly} className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
              Stop Early
            </button>
            <button onClick={() => { setPhase('done'); setRunning(false); }} className="px-5 py-2.5 rounded-full text-sm font-semibold text-white flex items-center gap-2" style={{ background: '#059669' }}>
              <CheckCircle2 size={16} />
              Done!
            </button>
          </div>
        </div>
      ) : (
        /* Post-activity feedback */
        <div className="flex flex-col items-center gap-5 w-full max-w-sm px-6">
          <div className="text-4xl">🌟</div>
          <h2 className="text-2xl font-bold text-white text-center" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Great job!</h2>
          <p className="text-blue-200 text-sm text-center">How do you feel after "{activity.activity_name}"?</p>

          <div className="grid grid-cols-3 gap-3 w-full">
            {FEEL_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setFeel(opt.key)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all"
                style={{ background: feel === opt.key ? '#0891B2' : 'rgba(255,255,255,0.08)', color: 'white', border: feel === opt.key ? '2px solid #67E8F9' : '2px solid transparent' }}>
                <span className="text-2xl">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {(feel === 'Pain' || feel === 'Dizzy') && (
            <div className="w-full space-y-2">
              <p className="text-xs text-red-300">Where does it hurt / what do you feel?</p>
              <input value={painLocation} onChange={e => setPainLocation(e.target.value)}
                placeholder="e.g. Left knee, chest, lower back..."
                className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/10 border border-red-400/30 outline-none" />
              <div className="px-3 py-2 rounded-lg" style={{ background: '#FF000015', border: '1px solid #FF444430' }}>
                <p className="text-xs text-red-200">⚠️ We've noted this. Please inform your doctor at your next visit.</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button onClick={handleSaveFeel} disabled={!feel}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: feel ? '#0891B2' : '#334155' }}>
              Next Activity →
            </button>
            <button onClick={onClose} className="px-4 py-3 rounded-xl text-sm text-blue-200" style={{ background: 'rgba(255,255,255,0.06)' }}>
              Done for today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPlayer;
