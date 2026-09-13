'use client';
import { Play, Square, FastForward, RotateCcw, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';

export default function Controls({
  onReset,
  onStep,
  onToggleAutoplay,
  isAutoplay,
  policy,
  setPolicy,
  onTrain,
  isTraining,
  terminated
}: {
  onReset: () => void;
  onStep: () => void;
  onToggleAutoplay: () => void;
  isAutoplay: boolean;
  policy: 'random' | 'trained';
  setPolicy: (p: 'random' | 'trained') => void;
  onTrain: () => void;
  isTraining: boolean;
  terminated: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/50 rounded-2xl shadow-xl border border-white/5 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-slate-400 tracking-widest uppercase">Controls</h2>
      
      <div className="flex gap-2">
        <button
          onClick={onReset}
          disabled={isTraining}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        
        <button
          onClick={onStep}
          disabled={isAutoplay || isTraining || terminated}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
        >
          <FastForward size={16} />
          Step
        </button>
        
        <button
          onClick={onToggleAutoplay}
          disabled={isTraining || terminated}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg",
            isAutoplay 
              ? "bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-amber-900/20"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
          )}
        >
          {isAutoplay ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          {isAutoplay ? "Stop" : "Auto"}
        </button>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
        <div className="flex justify-between items-center text-sm text-slate-400">
          <span>Policy:</span>
          <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
            <button 
              onClick={() => setPolicy('random')}
              className={clsx(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                policy === 'random' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Random
            </button>
            <button 
              onClick={() => setPolicy('trained')}
              className={clsx(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                policy === 'trained' ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Trained
            </button>
          </div>
        </div>

        <button
          onClick={onTrain}
          disabled={isTraining}
          className="w-full flex items-center justify-center gap-2 mt-2 bg-indigo-900/50 hover:bg-indigo-800/50 text-indigo-300 border border-indigo-700/50 disabled:opacity-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <BrainCircuit size={16} />
          {isTraining ? "Training..." : "Train 20k steps"}
        </button>
      </div>
    </div>
  );
}
