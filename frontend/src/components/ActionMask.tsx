'use client';
import clsx from 'clsx';

export default function ActionMask({ 
  mask, 
  lastAction 
}: { 
  mask: boolean[]; 
  lastAction: number | null;
}) {
  if (!mask || mask.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded-2xl shadow-xl border border-white/5 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-slate-400 tracking-widest uppercase">Action Mask</h2>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {mask.map((isValid, idx) => {
          const isSelected = lastAction === idx;
          return (
            <div 
              key={idx}
              className={clsx(
                "flex flex-col items-center justify-center min-w-[28px] h-10 rounded-md border text-xs font-mono font-bold transition-all",
                isValid ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-950/50 border-slate-900 text-slate-700 opacity-50",
                isSelected && isValid ? "ring-2 ring-indigo-500 bg-indigo-900/50 text-indigo-200 border-indigo-500" : ""
              )}
            >
              {idx}
              <div className={clsx(
                "w-1.5 h-1.5 rounded-full mt-1",
                isValid ? "bg-emerald-500" : "bg-slate-800"
              )} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
