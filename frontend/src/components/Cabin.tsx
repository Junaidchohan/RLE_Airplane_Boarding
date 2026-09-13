'use client';
import { SeatData } from '@/types';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Cabin({ cabin }: { cabin: SeatData[][] }) {
  if (!cabin || cabin.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded-2xl shadow-xl border border-white/5 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-slate-400 mb-2 tracking-widest uppercase">Cabin</h2>
      {cabin.map((row, rIdx) => (
        <div key={rIdx} className="flex gap-2">
          {row.map((seat, sIdx) => {
            const isEmpty = seat.state === 'empty';
            const isStowing = seat.state === 'stowing';
            const isSeated = seat.state === 'seated';

            return (
              <motion.div
                layout
                key={seat.seat_num}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={clsx(
                  "w-10 h-10 flex items-center justify-center rounded-xl text-xs font-mono font-bold border transition-colors shadow-sm",
                  {
                    "bg-slate-800 border-slate-700/50 text-slate-600": isEmpty,
                    "bg-amber-500/80 border-amber-400/50 text-amber-100": isStowing,
                    "bg-emerald-500/80 border-emerald-400/50 text-emerald-50": isSeated,
                    // Give a small gap in the middle for the aisle visual effect (assuming 5 seats, gap after 2nd/3rd?) 
                    // Wait, the prompt says "vertical column in front of the seats". 
                    // Let's just render them in a row.
                  }
                )}
              >
                {seat.passenger ? seat.passenger : seat.seat_num}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
