'use client';
import { AisleData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, X, Briefcase } from 'lucide-react';
import clsx from 'clsx';

export default function Aisle({ aisle, totalRows }: { aisle: AisleData[], totalRows: number }) {
  // Aisle is a vertical column next to the cabin. We'll map rows 0..totalRows-1.
  
  // Create an array of length totalRows
  const slots = Array.from({ length: totalRows }, (_, i) => {
    return aisle.find(a => a.row === i) || null;
  });

  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded-2xl shadow-xl border border-white/5 backdrop-blur-sm w-20 items-center">
      <h2 className="text-sm font-semibold text-slate-400 mb-2 tracking-widest uppercase">Aisle</h2>
      {slots.map((slot, idx) => (
        <div key={`slot-${idx}`} className="w-12 h-10 flex items-center justify-center relative bg-slate-800/40 rounded-xl border border-slate-800 border-dashed">
          <AnimatePresence>
            {slot && slot.passenger && (
              <motion.div
                layout
                layoutId={`passenger-${slot.passenger}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={clsx(
                  "absolute inset-0 flex items-center justify-between px-1 rounded-xl shadow-lg border text-xs font-mono font-bold",
                  {
                    "bg-blue-500/80 border-blue-400 text-blue-50": slot.status === "MOVING",
                    "bg-red-500/80 border-red-400 text-red-50": slot.status === "STALLED",
                    "bg-amber-500/80 border-amber-400 text-amber-50": slot.status === "STOWING",
                  }
                )}
              >
                <span className="scale-75">{slot.passenger}</span>
                {slot.status === "MOVING" && <ArrowUp size={12} />}
                {slot.status === "STALLED" && <X size={12} />}
                {slot.status === "STOWING" && <Briefcase size={12} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
