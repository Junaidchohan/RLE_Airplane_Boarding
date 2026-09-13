'use client';
import { StatsData } from '@/types';

interface StatTileProps {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
}

function StatTile({ label, value, valueClass = 'text-slate-100', sub }: StatTileProps) {
  return (
    <div className="flex flex-col p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] hover:bg-white/[0.04] transition-colors duration-200">
      <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">
        {label}
      </span>
      <span className={`text-2xl font-semibold tabular-nums tracking-tight ${valueClass}`}>
        {value}
        {sub && (
          <span className="text-sm font-normal text-slate-600 ml-1">{sub}</span>
        )}
      </span>
    </div>
  );
}

export default function StatsPanel({
  stats,
  step,
  reward,
  elapsed,
}: {
  stats: StatsData;
  step: number;
  reward: number;
  elapsed: number;
}) {
  const rewardStr = reward.toFixed(0);

  return (
    <div className="glass rounded-2xl p-4 shadow-xl hover:border-white/10 transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          Metrics
        </span>
        {stats.stalled > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {stats.stalled} stalled
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label="Step"
          value={String(step)}
          sub="/ 50"
        />
        <StatTile
          label="Reward"
          value={rewardStr}
          valueClass="gradient-text"
        />
        <StatTile
          label="Seated"
          value={String(stats?.seated ?? 0)}
          sub={`/ ${stats?.total ?? 50}`}
          valueClass="text-emerald-400"
        />
        <StatTile
          label="Elapsed"
          value={elapsed.toFixed(1)}
          sub="s"
          valueClass="text-slate-300"
        />
      </div>
    </div>
  );
}
