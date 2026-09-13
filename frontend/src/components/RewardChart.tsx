'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';

export interface ChartDataPoint {
  step: number;
  reward: number;
  stalled: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-[11px] font-mono shadow-xl border border-white/10">
      <p className="text-slate-400 mb-1">Step {label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function RewardChart({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-2xl p-4 shadow-xl h-48 flex flex-col">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-4">
          Reward History
        </span>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-slate-700 font-mono">No data yet — run an episode</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 shadow-xl hover:border-white/10 transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          Reward History
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Reward
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
            <span className="w-3 h-0.5 bg-amber-400 inline-block border-t border-dashed border-amber-400" /> Stalled
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="step"
            stroke="#334155"
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
          />
          <YAxis
            stroke="#334155"
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="reward"
            name="Reward"
            stroke="#22d3ee"
            strokeWidth={1.5}
            fill="url(#rewardGrad)"
            dot={false}
            activeDot={{ r: 3, fill: '#22d3ee' }}
          />
          <Line
            type="monotone"
            dataKey="stalled"
            name="Stalled"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
            activeDot={{ r: 3, fill: '#f59e0b' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
