'use client';
import { SeatData } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const SEAT_LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function Cabin({ cabin }: { cabin: SeatData[][] }) {
  const displayCabin = (!cabin || cabin.length === 0)
    ? Array.from({ length: 10 }, (_, r) =>
        Array.from({ length: 5 }, (_, s) => ({
          seat_num: r * 5 + s,
          state: 'empty' as const,
          passenger: null,
        }))
      )
    : cabin;

  const seatsPerRow = displayCabin[0]?.length ?? 5;

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      {/* Seat letter headers */}
      <div className="flex gap-1.5 mb-0.5 ml-8">
        {Array.from({ length: seatsPerRow }).map((_, i) => (
          <div
            key={i}
            className="w-9 text-center text-[10px] font-mono tracking-widest text-slate-600 uppercase"
          >
            {SEAT_LETTERS[i] ?? i}
          </div>
        ))}
      </div>

      {displayCabin.map((row, rIdx) => (
        <div key={rIdx} className="flex items-center gap-1.5">
          {/* Row label */}
          <div className="w-6 shrink-0 text-right text-[10px] font-mono text-slate-600 pr-0.5">
            R{rIdx}
          </div>

          {row.map((seat) => {
            const isEmpty = seat.state === 'empty';
            const isStowing = seat.state === 'stowing';
            const isSeated = seat.state === 'seated';

            return (
              <motion.div
                key={seat.seat_num}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { type: 'spring', stiffness: 400, damping: 30 },
                }}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-lg border text-[10px] font-mono font-semibold transition-colors duration-200 select-none',
                  isEmpty && 'bg-white/[0.02] border-white/[0.06] text-slate-700',
                  isSeated && 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
                  isStowing && 'bg-amber-500/15 border-amber-400/40 text-amber-300 animate-pulse',
                )}
              >
                {seat.passenger ? seat.passenger.replace('P', '') : ''}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
