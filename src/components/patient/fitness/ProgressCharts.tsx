import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subDays, parseISO, isSameDay } from 'date-fns';
import type { FitnessLog } from './FitnessTypes';

interface ProgressChartsProps {
  logs: FitnessLog[];
  activities: { id: string }[];
  waterGoalMl: number;
}

type Range = '7d' | '14d' | '30d';

const ProgressCharts: React.FC<ProgressChartsProps> = ({ logs, activities, waterGoalMl }) => {
  const [range, setRange] = useState<Range>('7d');

  const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;

  // Build chart data per day
  const chartData = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const dayLogs = logs.filter(l => {
      try { return isSameDay(parseISO(l.log_date), date); } catch { return false; }
    });

    const completedCount = dayLogs.filter(l => l.status === 'Completed').length;
    const totalActivities = activities.length || 4;
    const completionPct = Math.round((completedCount / totalActivities) * 100);

    const energyEntry = dayLogs.find(l => l.energy_level != null);
    const waterEntry = dayLogs.find(l => l.water_intake_ml != null);

    return {
      day: format(date, 'dd/MM'),
      completion: completionPct,
      energy: energyEntry?.energy_level ?? null,
      water: waterEntry?.water_intake_ml ?? null,
    };
  }).filter(d => d.completion !== undefined);

  // Trend analysis
  const recentEnergy = chartData.filter(d => d.energy != null).map(d => d.energy!);
  const energyTrend = recentEnergy.length >= 2
    ? recentEnergy[recentEnergy.length - 1]! > recentEnergy[0]! ? 'up'
      : recentEnergy[recentEnergy.length - 1]! < recentEnergy[0]! ? 'down' : 'flat'
    : 'flat';

  const ranges: Range[] = ['7d', '14d', '30d'];
  const rangeLabels: Record<Range, string> = { '7d': 'This Week', '14d': 'Last 2 Weeks', '30d': 'Last Month' };

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <h3 className="text-sm font-bold" style={{ color: '#1E293B', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          📈 My Recovery Progress
        </h3>
        <div className="flex gap-1">
          {ranges.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: range === r ? '#0891B2' : '#F1F5F9',
                color: range === r ? 'white' : '#64748B',
              }}>
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Chart 1: Activity Completion */}
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: '#64748B' }}>Activity Completion Rate (%)</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94A3B8' }} />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Completion']}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E2EEF1' }} />
              <Bar dataKey="completion" radius={[3, 3, 0, 0]}
                fill="#10B981"
                className="transition-all" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Energy Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: '#64748B' }}>Energy Level Trend (1–5)</p>
            {energyTrend === 'up' && <span className="text-xs font-medium" style={{ color: '#059669' }}>↑ You're getting stronger! 🌱</span>}
            {energyTrend === 'down' && <span className="text-xs font-medium" style={{ color: '#D97706' }}>↓ Rest more today. It's okay 💛</span>}
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 9, fill: '#94A3B8' }} />
              <Tooltip
                formatter={(val: any) => [val ? `${val}/5` : 'No data', 'Energy']}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E2EEF1' }} />
              <Line type="monotone" dataKey="energy" stroke="#0891B2" strokeWidth={2.5}
                dot={{ r: 3, fill: '#0891B2' }} connectNulls name="Energy" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Water Intake */}
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: '#64748B' }}>Water Intake (ml)</p>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891B2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0891B2" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} />
              <Tooltip
                formatter={(val: any) => [val ? `${val}ml` : 'No data', 'Water']}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E2EEF1' }} />
              <ReferenceLine y={waterGoalMl} stroke="#F59E0B" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Goal', position: 'right', fontSize: 9, fill: '#F59E0B' }} />
              <Area type="monotone" dataKey="water" stroke="#0891B2" strokeWidth={2}
                fill="url(#waterGrad)" connectNulls name="Water" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgressCharts;
