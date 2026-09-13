'use client';
import { StatsData } from '@/types';
import { Activity, Users, Clock, ArrowUpCircle } from 'lucide-react';

export default function StatsPanel({ 
  stats, 
  step, 
  reward, 
  elapsed 
}: { 
  stats: StatsData; 
  step: number; 
  reward: number; 
  elapsed: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/50 rounded-2xl shadow-xl border border-white/5 backdrop-blur-sm">
      <div className="col-span-2">
        <h2 className="text-sm font-semibold text-slate-400 mb-2 tracking-widest uppercase">Metrics</h2>
      </div>

      <div className="flex flex-col p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Activity size={14} />
          <span className="text-xs uppercase font-semibold">Step</span>
        </div>
        <span className="text-xl font-mono font-bold text-slate-200">{step}</span>
      </div>

      <div className="flex flex-col p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <ArrowUpCircle size={14} />
          <span className="text-xs uppercase font-semibold">Reward</span>
        </div>
        <span className="text-xl font-mono font-bold text-blue-400">{reward.toFixed(1)}</span>
      </div>

      <div className="flex flex-col p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Users size={14} />
          <span className="text-xs uppercase font-semibold">Seated</span>
        </div>
        <span className="text-xl font-mono font-bold text-emerald-400">
          {stats?.seated ?? 0} <span className="text-sm text-slate-500">/ {stats?.total ?? 0}</span>
        </span>
      </div>

      <div className="flex flex-col p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Clock size={14} />
          <span className="text-xs uppercase font-semibold">Elapsed</span>
        </div>
        <span className="text-xl font-mono font-bold text-slate-200">{elapsed.toFixed(1)}s</span>
      </div>
    </div>
  );
}
