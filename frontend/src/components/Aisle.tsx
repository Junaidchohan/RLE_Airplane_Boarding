'use client';
import { AisleData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

function ArrowUpIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M5 1L9 6H6v3H4V6H1L5 1z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="2">
      <path d="M2 2l6 6M8 2l-6 6" />
    </svg>
  );
}

function LuggageIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="6" height="6" rx="1" />
      <path d="M3.5 3V2a1.5 1.5 0 013 0v1" />
      <line x1="5" y1="5" x2="5" y2="7" />
    </svg>
  );
}

export default function Aisle({
  aisle,
  totalRows,
}: {
  aisle: AisleData[];
  totalRows: number;
}) {
  const slots = Array.from({ length: totalRows }, (_, i) =>
    aisle.find((a) => a.row === i) || null
  );

  return (
    <div className="flex flex-col gap-1.5 items-center w-12 shrink-0">
      {/* Header spacer to align with cabin's letter row */}
      <div className="h-[22px]" />

      {/* Thin vertical aisle line */}
      <div className="relative flex flex-col gap-1.5 items-center">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-slate-700/0 via-slate-600/40 to-slate-700/0 pointer-events-none" />

        {slots.map((slot, idx) => (
          <div
            key={`slot-${idx}`}
            className="relative w-9 h-9 flex items-center justify-center"
          >
            <AnimatePresence>
              {slot && slot.passenger && (
                <motion.div
                  layout
                  layoutId={`aisle-${slot.passenger}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className={cn(
                    'absolute inset-0 flex items-center justify-center gap-0.5 rounded-lg border text-[10px] font-mono font-semibold z-10',
                    slot.status === 'MOVING' && 'bg-slate-500/20 border-slate-400/30 text-slate-300',
                    slot.status === 'STALLED' && 'bg-rose-500/20 border-rose-400/40 text-rose-300',
                    slot.status === 'STOWING' && 'bg-amber-500/20 border-amber-400/40 text-amber-300',
                  )}
                >
                  {slot.status === 'MOVING' && <ArrowUpIcon />}
                  {slot.status === 'STALLED' && <XIcon />}
                  {slot.status === 'STOWING' && <LuggageIcon />}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty slot indicator */}
            {!slot?.passenger && (
              <div className="w-1 h-1 rounded-full bg-slate-800" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
