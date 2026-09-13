'use client';
import { SeatData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import PassengerSprite from './PassengerSprite';

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

  return (
    <div className="relative flex flex-col items-center p-5 bg-[#0b0c16] rounded-[40px] border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Top strip: OVERHEAD BINS */}
      <div className="w-full flex items-center justify-between px-6 py-1.5 mb-3 bg-white/[0.03] border-b border-white/[0.06] rounded-t-3xl">
        <span className="text-[8px] font-mono tracking-[0.25em] text-slate-500 uppercase">
          ◀ OVERHEAD BINS
        </span>
        <span className="text-[8px] font-mono tracking-[0.25em] text-slate-600">
          CABIN 10×5
        </span>
        <span className="text-[8px] font-mono tracking-[0.25em] text-slate-500 uppercase">
          OVERHEAD BINS ▶
        </span>
      </div>

      {/* Seat column headers (A, B, C | D, E) */}
      <div className="flex items-center gap-1.5 mb-2 pl-7 pr-2">
        <div className="flex gap-1.5">
          {['A', 'B', 'C'].map((letter) => (
            <div
              key={letter}
              className="w-[48px] text-center text-[10px] font-mono font-semibold tracking-wider text-slate-500"
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Aisle gap header spacer */}
        <div className="w-4 flex items-center justify-center">
          <span className="text-[8px] font-mono text-slate-700">|</span>
        </div>

        <div className="flex gap-1.5">
          {['D', 'E'].map((letter) => (
            <div
              key={letter}
              className="w-[48px] text-center text-[10px] font-mono font-semibold tracking-wider text-slate-500"
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* Cabin fuselage rows */}
      <div className="relative flex flex-col gap-1.5 w-full items-center">
        {/* Subtle vertical aisle band between C and D */}
        <div className="absolute top-0 bottom-0 left-[214px] w-5 bg-white/[0.02] border-x border-white/[0.03] pointer-events-none rounded-sm" />

        {displayCabin.map((row, rIdx) => (
          <div key={`row-${rIdx}`} className="flex items-center gap-1.5 z-10">
            {/* Row Number */}
            <div className="w-6 text-right text-[10px] font-mono font-bold text-slate-600 pr-1 select-none">
              R{rIdx}
            </div>

            {/* Left side seats: A, B, C */}
            <div className="flex gap-1.5">
              {row.slice(0, 3).map((seat, sIdx) => (
                <SeatCell
                  key={seat.seat_num}
                  seat={seat}
                  label={`${SEAT_LETTERS[sIdx]}${rIdx}`}
                />
              ))}
            </div>

            {/* Aisle gap */}
            <div className="w-4 h-full" />

            {/* Right side seats: D, E */}
            <div className="flex gap-1.5">
              {row.slice(3, 5).map((seat, sIdx) => (
                <SeatCell
                  key={seat.seat_num}
                  seat={seat}
                  label={`${SEAT_LETTERS[sIdx + 3]}${rIdx}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom strip: FLOOR */}
      <div className="w-full flex items-center justify-center py-1.5 mt-4 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent border-t border-white/[0.04] rounded-b-3xl">
        <span className="text-[8px] font-mono tracking-[0.3em] text-slate-600 uppercase">
          FLOOR LEVEL · REAR
        </span>
      </div>
    </div>
  );
}

function SeatCell({ seat, label }: { seat: SeatData; label: string }) {
  const isEmpty = seat.state === 'empty';
  const isStowing = seat.state === 'stowing';
  const isSeated = seat.state === 'seated';

  return (
    <motion.div
      layout
      transition={{
        layout: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
      }}
      className={cn(
        'relative w-[48px] h-[58px] rounded-xl border flex flex-col items-center justify-center transition-all duration-300 select-none overflow-hidden',
        isEmpty && 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]',
        isSeated && 'bg-emerald-500/[0.08] border-emerald-400/30 shadow-[0_0_15px_rgba(52,211,153,0.12)]',
        isStowing && 'bg-amber-500/[0.08] border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
      )}
    >
      <AnimatePresence mode="wait">
        {isEmpty && (
          <motion.span
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[10px] font-mono font-medium text-slate-600"
          >
            {label}
          </motion.span>
        )}

        {isSeated && (
          <motion.div
            key={`seated-${seat.passenger}`}
            layoutId={seat.passenger ? `passenger-${seat.passenger}` : undefined}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [0.9, 1.08, 1], opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center justify-center"
          >
            <PassengerSprite state="SEATED" size="sm" tint="emerald" />
            <span className="text-[9px] font-mono font-bold tracking-tight text-emerald-400 -mt-0.5">
              {seat.passenger}
            </span>
          </motion.div>
        )}

        {isStowing && (
          <motion.div
            key={`stowing-${seat.passenger}`}
            layoutId={seat.passenger ? `passenger-${seat.passenger}` : undefined}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center"
          >
            <PassengerSprite state="STOWING" size="sm" tint="amber" />
            <span className="text-[9px] font-mono font-bold tracking-tight text-amber-400 -mt-0.5">
              {seat.passenger}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
