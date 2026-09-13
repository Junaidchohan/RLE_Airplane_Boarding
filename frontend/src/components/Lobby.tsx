'use client';
import { LobbyData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function Lobby({ lobby, activeRow }: { lobby: LobbyData[], activeRow: number | null }) {
  if (!lobby || lobby.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded-2xl shadow-xl border border-white/5 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-slate-400 mb-2 tracking-widest uppercase">Lobby Waiting Lines</h2>
      <div className="flex flex-col gap-2">
        {lobby.map((lRow) => {
          const isActive = activeRow === lRow.row;
          return (
            <div 
              key={lRow.row} 
              className={clsx(
                "flex items-center gap-2 p-2 rounded-xl transition-all duration-300",
                isActive ? "bg-indigo-500/20 ring-1 ring-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "bg-slate-800/30"
              )}
            >
              <div className="w-6 text-xs text-slate-500 font-bold text-center">{lRow.row}</div>
              <div className="flex flex-wrap gap-1">
                <AnimatePresence>
                  {lRow.passengers.map((p) => (
                    <motion.div
                      key={`lobby-${p}`}
                      layout
                      layoutId={`passenger-${p}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="w-8 h-6 flex items-center justify-center rounded bg-slate-700 text-[10px] font-mono font-bold text-slate-300"
                    >
                      {p}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {lRow.passengers.length === 0 && (
                  <span className="text-xs text-slate-600 italic px-2">Empty</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
