'use client';
import { useState } from 'react';
import { LobbyData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import PassengerSprite from './PassengerSprite';
import { ChevronDown, Users } from 'lucide-react';

export default function Lobby({
  lobby,
  activeRow,
  onSelectRow,
}: {
  lobby: LobbyData[];
  activeRow: number | null;
  onSelectRow?: (row: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (!lobby || lobby.length === 0) return null;

  const totalPassengers = lobby.reduce((s, r) => s + r.passengers.length, 0);

  return (
    <div className="glass rounded-2xl shadow-xl hover:border-white/10 transition-colors duration-300 overflow-hidden">
      {/* Header with collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors duration-200"
      >
        <div className="flex items-center gap-2.5">
          <Users size={14} className="text-cyan-400" />
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
            Lobby Queues
          </span>
          <span className="text-[10px] font-mono text-slate-500 tabular-nums">
            ({totalPassengers} waiting)
          </span>
        </div>

        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-slate-500" />
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
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lobby.map((lRow) => {
                const isActive = activeRow === lRow.row;
                const count = lRow.passengers.length;

                return (
                  <div
                    key={`lobby-row-${lRow.row}`}
                    onClick={() => onSelectRow?.(lRow.row)}
                    className={cn(
                      'flex flex-col gap-1.5 p-2.5 rounded-xl border transition-all duration-300 cursor-pointer select-none',
                      isActive
                        ? 'bg-cyan-500/[0.1] border-cyan-400/40 ring-2 ring-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.15)] animate-pulse'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                    )}
                  >
                    {/* Header Label: Row # · # waiting */}
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span
                        className={cn(
                          'font-bold',
                          isActive ? 'text-cyan-300' : 'text-slate-400'
                        )}
                      >
                        Row {lRow.row}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {count > 0 ? `${count} waiting` : 'Cleared'}
                      </span>
                    </div>

                    {/* Character Lineup */}
                    <div className="flex flex-wrap items-center gap-1 min-h-[26px]">
                      <AnimatePresence>
                        {lRow.passengers.map((p) => (
                          <motion.div
                            key={`lobby-p-${p}`}
                            layout
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.3 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="flex flex-col items-center bg-white/[0.03] border border-white/[0.06] rounded-md px-1 py-0.5"
                            title={`Passenger ${p}`}
                          >
                            <PassengerSprite
                              state="IDLE"
                              size="sm"
                              tint={isActive ? 'cyan' : 'slate'}
                            />
                            <span className="text-[7px] font-mono text-slate-500">
                              {p}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {count === 0 && (
                        <span className="text-[9px] font-mono text-slate-700 italic">
                          All boarded ✓
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
