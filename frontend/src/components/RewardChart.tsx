'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export interface ChartDataPoint {
  step: number;
  reward: number;
  stalled: number;
}

export default function RewardChart({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 w-full flex items-center justify-center bg-slate-900/50 rounded-2xl border border-white/5">
        <span className="text-sm text-slate-500">No chart data</span>
      </div>
    );
  }

  return (
    <div className="h-64 w-full p-4 bg-slate-900/50 rounded-2xl shadow-xl border border-white/5 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-slate-400 mb-4 tracking-widest uppercase">Reward & Stalls</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis 
            dataKey="step" 
            stroke="#94a3b8" 
            fontSize={10} 
            tickFormatter={(val) => `${val}`}
          />
          <YAxis stroke="#94a3b8" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', fontSize: '12px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Line 
            type="monotone" 
            dataKey="reward" 
            name="Cumulative Reward" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="stalled" 
            name="Passengers Stalled" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
