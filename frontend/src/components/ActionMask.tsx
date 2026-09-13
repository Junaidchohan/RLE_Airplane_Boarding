'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export default function ActionMask({
  mask,
  lastAction,
}: {
  mask: boolean[];
  lastAction: number | null;
}) {
  if (!mask || mask.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 shadow-xl hover:border-white/10 transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          Action Mask
        </span>
        <span className="text-[10px] font-mono text-slate-600">
          {mask.filter(Boolean).length} / {mask.length} available
        </span>
      </div>

      <div className="flex gap-1.5 items-center">
        {mask.map((isValid, idx) => {
          const isSelected = lastAction === idx;

          return (
            <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
              <motion.div
                layout
                animate={{
                  scale: isSelected ? 1.15 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={cn(
                  'h-1.5 w-full rounded-full transition-colors duration-200',
                  !isValid && 'bg-white/[0.06]',
                  isValid && !isSelected && 'bg-emerald-400/50',
                  isSelected && isValid && 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]',
                )}
              />
              <span
                className={cn(
                  'text-[9px] font-mono tabular-nums transition-colors duration-200',
                  !isValid && 'text-slate-700',
                  isValid && !isSelected && 'text-slate-500',
                  isSelected && 'text-cyan-400 font-bold',
                )}
              >
                {idx}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
