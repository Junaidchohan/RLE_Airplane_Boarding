'use client';
import { useState } from 'react';
import { LobbyData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

export default function Lobby({
  lobby,
  activeRow,
}: {
  lobby: LobbyData[];
  activeRow: number | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (!lobby || lobby.length === 0) return null;

  const totalPassengers = lobby.reduce((s, r) => s + r.passengers.length, 0);

  return (
    <div className="glass rounded-2xl shadow-xl hover:border-white/10 transition-colors duration-300 overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            Lobby
          </span>
          <span className="text-[10px] font-mono text-slate-600 tabular-nums">
            {totalPassengers} remaining
          </span>
        </div>
        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-slate-600" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2">
              {lobby.map((lRow) => {
                const isActive = activeRow === lRow.row;
                return (
                  <div
                    key={lRow.row}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-cyan-400/[0.06] ring-1 ring-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.08)]'
                        : 'bg-white/[0.02]'
                    )}
                  >
                    <div className="w-5 shrink-0 text-[10px] font-mono text-slate-600 pt-1 text-center">
                      {lRow.row}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <AnimatePresence>
                        {lRow.passengers.map((p) => (
                          <motion.div
                            key={`lobby-${p}`}
                            layout
                            layoutId={`passenger-${p}`}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.3 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                            className={cn(
                              'h-6 px-2 flex items-center justify-center rounded-md text-[10px] font-mono font-semibold border',
                              isActive
                                ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300 animate-pulse'
                                : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
                            )}
                          >
                            {p.replace('P', '')}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {lRow.passengers.length === 0 && (
                        <span className="text-[10px] text-slate-700 font-mono italic">
                          cleared
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
