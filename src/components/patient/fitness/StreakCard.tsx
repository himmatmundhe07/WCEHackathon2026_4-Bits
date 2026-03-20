import React from 'react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { BADGE_META, ALL_BADGES } from './FitnessTypes';
import type { FitnessStreak, FitnessLog } from './FitnessTypes';

interface StreakCardProps {
  streak: FitnessStreak | null;
  logs: FitnessLog[];
}

const StreakCard: React.FC<StreakCardProps> = ({ streak, logs }) => {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const badges = streak?.badges_earned ?? [];

  // Build last 14 days calendar
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(today, 13 - i);
    const hasLog = logs.some(l => {
      try { return isSameDay(parseISO(l.log_date), date) && l.status === 'Completed'; } catch { return false; }
    });
    const isToday = isSameDay(date, today);
    return { date, hasLog, isToday };
  });

  const nextBadge = current < 3 ? { name: '3-Day Warrior', daysLeft: 3 - current }
    : current < 7 ? { name: 'Week Champion', daysLeft: 7 - current }
    : null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#EBF7FA', border: '1px solid #D1EBF1' }}>
      <div className="p-5">
        {/* Streak header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold mb-1" style={{ color: '#1E293B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              🔥 Your Recovery Streak
            </h3>
            {nextBadge && (
              <p className="text-xs" style={{ color: '#0891B2' }}>
                {nextBadge.name} is just {nextBadge.daysLeft} {nextBadge.daysLeft === 1 ? 'day' : 'days'} away!
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold" style={{ color: '#F59E0B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {current}
            </div>
            <div className="text-xs" style={{ color: '#64748B' }}>days</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mb-4">
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: '#0891B2' }}>{longest}</p>
            <p className="text-xs" style={{ color: '#64748B' }}>Best streak</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: '#0891B2' }}>{streak?.total_active_days ?? 0}</p>
            <p className="text-xs" style={{ color: '#64748B' }}>Total active</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: '#0891B2' }}>{badges.length}</p>
            <p className="text-xs" style={{ color: '#64748B' }}>Badges</p>
          </div>
        </div>

        {/* 14-day calendar */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>Last 14 days</p>
          <div className="flex gap-1.5 flex-wrap">
            {days.map(({ date, hasLog, isToday }) => (
              <div key={date.toISOString()} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: isToday ? '#0891B2' : hasLog ? '#10B981' : '#D1EBF1',
                    color: (isToday || hasLog) ? 'white' : '#94A3B8',
                    boxShadow: isToday ? '0 0 0 2px #67E8F9' : 'none',
                  }}
                  title={format(date, 'dd MMM')}
                >
                  {isToday ? '●' : hasLog ? '✓' : format(date, 'd')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Miss-day encouragement */}
        {current === 0 && (
          <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.6)' }}>
            <p className="text-xs" style={{ color: '#0891B2' }}>
              🌱 No worries — rest is part of recovery. Start fresh today!
            </p>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="px-5 pb-5">
        <p className="text-xs font-bold mb-3" style={{ color: '#1E293B' }}>🏆 Badges Earned</p>
        <div className="grid grid-cols-3 gap-2">
          {ALL_BADGES.map(badgeKey => {
            const meta = BADGE_META[badgeKey];
            const earned = badges.includes(badgeKey);
            return (
              <div key={badgeKey}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-center"
                style={{
                  background: earned ? 'white' : 'rgba(0,0,0,0.05)',
                  border: earned ? '1px solid #D1EBF1' : '1px solid transparent',
                  opacity: earned ? 1 : 0.45,
                  filter: earned ? 'none' : 'grayscale(1)',
                }}>
                <span className="text-xl">{meta.icon}</span>
                <span className="text-[9px] font-semibold" style={{ color: earned ? '#1E293B' : '#94A3B8' }}>{meta.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StreakCard;
