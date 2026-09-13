'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { RotateCcw, FastForward, Play, Square, BrainCircuit, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ControlsProps {
  onReset: () => void;
  onStep: () => void;
  onToggleAutoplay: () => void;
  isAutoplay: boolean;
  policy: 'random' | 'trained';
  setPolicy: (p: 'random' | 'trained') => void;
  onTrain: () => void;
  isTraining: boolean;
  terminated: boolean;
}

export default function Controls({
  onReset,
  onStep,
  onToggleAutoplay,
  isAutoplay,
  policy,
  setPolicy,
  onTrain,
  isTraining,
  terminated,
}: ControlsProps) {
  return (
    <div className="glass rounded-2xl p-4 shadow-xl hover:border-white/10 transition-colors duration-300 flex flex-col gap-4">
      <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
        Controls
      </span>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onReset}
          disabled={isTraining}
          className="flex-1 flex items-center justify-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/[0.14] rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200"
        >
          <RotateCcw size={13} />
          Reset
        </button>

        <button
          onClick={onStep}
          disabled={isAutoplay || isTraining || terminated}
          className="flex-1 flex items-center justify-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/[0.14] rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200"
        >
          <FastForward size={13} />
          Step
        </button>

        <button
          onClick={onToggleAutoplay}
          disabled={isTraining || terminated}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
            isAutoplay
              ? 'bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30'
              : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 hover:from-indigo-400 hover:to-cyan-400 border border-transparent'
          )}
        >
          {isAutoplay ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
          {isAutoplay ? 'Pause' : 'Auto'}
        </button>
      </div>

      {/* Policy toggle — segmented control with sliding pill */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono tracking-widest text-slate-600 uppercase">
          Policy
        </span>
        <div className="relative flex bg-black/30 rounded-xl p-0.5 border border-white/[0.06]">
          <AnimatePresence initial={false}>
            <motion.div
              key={policy}
              layoutId="policy-pill"
              className={cn(
                'absolute inset-y-0.5 w-[calc(50%-2px)] rounded-[10px]',
                policy === 'trained'
                  ? 'bg-indigo-500/20 border border-indigo-400/30 left-[calc(50%+1px)]'
                  : 'bg-white/[0.06] border border-white/[0.08] left-0.5'
              )}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            />
          </AnimatePresence>

          {(['random', 'trained'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPolicy(p)}
              className={cn(
                'relative z-10 flex-1 py-1.5 text-xs font-medium rounded-[10px] transition-colors duration-200',
                policy === p
                  ? p === 'trained' ? 'text-indigo-300' : 'text-slate-200'
                  : 'text-slate-500 hover:text-slate-400'
              )}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Train button */}
      <button
        onClick={onTrain}
        disabled={isTraining}
        className="w-full flex items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-indigo-400/20 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-indigo-300 rounded-xl px-4 py-2.5 text-xs font-medium transition-all duration-200"
      >
        {isTraining ? (
          <>
            <Loader2 size={13} className="animate-spin text-indigo-400" />
            <span className="text-indigo-400">Training 20k steps...</span>
          </>
        ) : (
          <>
            <BrainCircuit size={13} />
            Train 20k steps
          </>
        )}
      </button>
    </div>
  );
}
