export interface FitnessPlan {
  id: string;
  patient_id: string;
  generated_by: string;
  intensity_level: string;
  plan_title: string;
  plan_summary: string;
  weekly_goal_minutes: number;
  daily_water_goal_ml: number;
  safety_note: string | null;
  is_active: boolean;
  is_paused: boolean;
  created_at: string;
  expires_at: string | null;
  doctor_approved: boolean;
  doctor_notes: string | null;
  patient_location: string;
}

export interface FitnessActivity {
  id: string;
  plan_id: string;
  patient_id: string;
  activity_name: string;
  category: string;
  description: string;
  duration_seconds: number | null;
  repetitions: number | null;
  sets: number;
  rest_seconds: number;
  frequency_per_day: number;
  best_time: string;
  difficulty_label: string;
  caution_note: string | null;
  animation_key: string;
  day_of_week: string[];
  order_in_plan: number;
  created_at: string;
}

export interface FitnessLog {
  id: string;
  patient_id: string;
  activity_id: string | null;
  plan_id: string | null;
  log_date: string;
  log_time: string;
  status: string;
  duration_actual_seconds: number | null;
  how_felt_after: string | null;
  pain_location: string | null;
  notes: string | null;
  water_intake_ml: number | null;
  steps_count: number | null;
  sleep_hours: number | null;
  mood: string | null;
  energy_level: number | null;
}

export interface FitnessStreak {
  id: string;
  patient_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  total_active_days: number;
  badges_earned: string[];
  updated_at: string;
}

export const INTENSITY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'Bed Rest':   { bg: '#FEF2F2', color: '#DC2626', label: '🛏 Bed Rest' },
  'Very Light': { bg: '#EBF7FA', color: '#0891B2', label: '🌿 Very Light' },
  'Light':      { bg: '#F0FDF4', color: '#059669', label: '🚶 Light' },
  'Moderate':   { bg: '#FFFBEB', color: '#D97706', label: '⚡ Moderate' },
};

export const CATEGORY_ICONS: Record<string, string> = {
  'Breathing':   '🌬️',
  'Circulation': '🔄',
  'Mobility':    '🤸',
  'Strength':    '💪',
  'Balance':     '⚖️',
  'Walking':     '🚶',
  'Relaxation':  '😌',
  'Posture':     '🧍',
};

export const BADGE_META: Record<string, { icon: string; label: string; description: string }> = {
  'First Step':       { icon: '🌱', label: 'First Step',       description: 'Completed your first activity' },
  'Hydration Hero':   { icon: '💧', label: 'Hydration Hero',   description: 'Hit water goal 3 days in a row' },
  '3-Day Warrior':    { icon: '🔥', label: '3-Day Warrior',    description: '3-day recovery streak' },
  'Week Champion':    { icon: '⭐', label: 'Week Champion',    description: '7-day streak' },
  'Consistent':       { icon: '💪', label: 'Consistent',       description: '80% completion this week' },
  'Recovery Star':    { icon: '🌟', label: 'Recovery Star',    description: 'Doctor marked improvement' },
};

export const ALL_BADGES = Object.keys(BADGE_META);
