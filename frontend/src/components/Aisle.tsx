'use client';
import { AisleData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import PassengerSprite from './PassengerSprite';
import { ArrowUp, X, Briefcase } from 'lucide-react';

export default function Aisle({
  aisle,
  totalRows = 10,
}: {
  aisle: AisleData[];
  totalRows?: number;
}) {
  const slots = Array.from({ length: totalRows }, (_, i) =>
    aisle.find((a) => a.row === i) || null
  );

  return (
    <div className="relative flex flex-col items-center p-5 bg-[#0b0c16] rounded-[40px] border border-white/[0.08] shadow-2xl backdrop-blur-xl w-24">
      {/* Top strip spacer matching cabin header */}
      <div className="w-full flex items-center justify-center py-1.5 mb-3 bg-white/[0.03] border-b border-white/[0.06] rounded-t-3xl">
        <span className="text-[8px] font-mono tracking-[0.2em] text-slate-500 uppercase">
          AISLE
        </span>
      </div>

      {/* Header spacer to align with seat letters */}
      <div className="h-[20px] mb-2 flex items-center justify-center">
        <span className="text-[9px] font-mono text-slate-600">WALK</span>
      </div>

      {/* Vertical walk track */}
      <div className="relative flex flex-col gap-1.5 w-full items-center">
        {/* Subtle center line */}
        <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-cyan-500/20 via-slate-600/30 to-slate-700/10 pointer-events-none" />

        {slots.map((slot, idx) => {
          const passenger = slot?.passenger;
          const status = slot?.status;
          const isStalled = status === 'STALLED';
          const isStowing = status === 'STOWING';

          return (
            <div
              key={`aisle-slot-${idx}`}
              className="relative w-[54px] h-[58px] rounded-xl border border-dashed border-white/[0.06] bg-white/[0.015] flex flex-col items-center justify-center"
            >
              <AnimatePresence>
                {slot && passenger && (
                  <motion.div
                    layout
                    layoutId={`passenger-${passenger}`}
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 28,
                    }}
                    style={{ willChange: 'transform' }}
                    className={cn(
                      'relative z-10 w-full h-full flex flex-col items-center justify-center rounded-xl border shadow-lg transition-colors duration-200',
                      status === 'MOVING' && 'bg-cyan-500/[0.12] border-cyan-400/40 shadow-cyan-950/40',
                      status === 'STALLED' && 'bg-rose-500/[0.14] border-rose-400/50 shadow-rose-950/40',
                      status === 'STOWING' && 'bg-amber-500/[0.14] border-amber-400/50 shadow-amber-950/40'
                    )}
                  >
                    {/* Status Badge in corner */}
                    <div className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center w-4 h-4 rounded-full border shadow-md bg-slate-900">
                      {status === 'MOVING' && (
                        <span className="text-cyan-400 flex items-center justify-center">
                          <ArrowUp size={10} strokeWidth={2.5} />
                        </span>
                      )}
                      {status === 'STALLED' && (
                        <span className="text-rose-400 flex items-center justify-center">
                          <X size={10} strokeWidth={2.5} />
                        </span>
                      )}
                      {status === 'STOWING' && (
                        <span className="text-amber-400 flex items-center justify-center">
                          <Briefcase size={9} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>

                    {/* Animated Sprite */}
                    <PassengerSprite
                      state={isStowing ? 'STOWING' : 'WALKING'}
                      tint={isStalled ? 'slate' : isStowing ? 'amber' : 'cyan'}
                      size="sm"
                      isStalled={isStalled}
                    />

                    {/* Passenger Tag */}
                    <span
                      className={cn(
                        'text-[8px] font-mono font-bold tracking-tight -mt-0.5',
                        status === 'MOVING' && 'text-cyan-300',
                        status === 'STALLED' && 'text-rose-300',
                        status === 'STOWING' && 'text-amber-300'
                      )}
                    >
                      {passenger}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Slot dot when empty */}
              {!passenger && (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800/80" />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom strip: ENTRANCE */}
      <div className="w-full flex items-center justify-center py-1.5 mt-4 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent border-t border-white/[0.04] rounded-b-3xl">
        <span className="text-[8px] font-mono tracking-[0.2em] text-slate-600 uppercase">
          ENTRY
        </span>
      </div>
    </div>
  );
}
