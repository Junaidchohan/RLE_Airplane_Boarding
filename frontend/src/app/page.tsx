'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { StateResponse, ChartDataPoint } from '@/types';
import Cabin from '@/components/Cabin';
import Aisle from '@/components/Aisle';
import Lobby from '@/components/Lobby';
import RewardChart from '@/components/RewardChart';
import StatsPanel from '@/components/StatsPanel';
import Controls from '@/components/Controls';
import ActionMask from '@/components/ActionMask';
import { cn } from '@/lib/cn';
import { ExternalLink } from 'lucide-react';

// ── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ connected, step, episodeCount }: { connected: boolean; step: number; episodeCount: number }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#080810]/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto h-12 flex items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
              <path d="M10 5C10 8 6 11 6 11S2 8 2 5a4 4 0 018 0z" />
              <circle cx="6" cy="5" r="1.5" fill="#080810" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-200 tracking-tight">
            Airplane Boarding
          </span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500 font-mono">RLE</span>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          {/* Episode counter */}
          <span className="text-[11px] font-mono text-slate-500 tabular-nums hidden sm:block">
            Ep&nbsp;{episodeCount}&nbsp;·&nbsp;Step&nbsp;
            <span className="text-slate-300">{step}</span>&nbsp;/&nbsp;50
          </span>

          {/* Bridge status */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono border transition-all duration-500',
              connected
                ? 'bg-emerald-500/[0.08] border-emerald-400/20 text-emerald-400'
                : 'bg-rose-500/[0.08] border-rose-400/20 text-rose-400'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              )}
            />
            {connected ? 'Connected' : 'Disconnected'}
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/Junaidchohan/RLE_Airplane_Boarding"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.05] transition-all duration-200"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </header>
  );
}

// ── Hero strip ────────────────────────────────────────────────────────────────
function HeroStrip({
  step,
  reward,
  prevReward,
  terminated,
}: {
  step: number;
  reward: number;
  prevReward: number;
  terminated: boolean;
}) {
  const delta = reward - prevReward;
  return (
    <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono text-slate-500 tabular-nums">
          Step&nbsp;
          <span className="text-slate-200 font-semibold">{step}</span>
          &nbsp;/&nbsp;50
        </span>
        {terminated && (
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-mono rounded-full">
            COMPLETE
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {step > 0 && delta !== 0 && (
          <span
            className={cn(
              'text-xs font-mono',
              delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {delta >= 0 ? '+' : ''}{delta.toFixed(0)}
          </span>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Reward</span>
          <span className="text-3xl font-semibold tabular-nums tracking-tight gradient-text">
            {reward.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [connected, setConnected] = useState<boolean>(false);
  const [state, setState] = useState<StateResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [policy, setPolicy] = useState<'random' | 'trained'>('trained');
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [episodeCount, setEpisodeCount] = useState(1);
  const [prevReward, setPrevReward] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Health check: retry every 5s until connected, then poll every 30s
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const checkHealth = async () => {
      let isConnected = false;
      try {
        const res = await fetch('/api/env/state');
        if (res.ok) {
          isConnected = true;
          const data = await res.json();
          if (data.ok) {
            setState((prev) => prev ?? data);
            if (startTimeRef.current === null) {
              startTimeRef.current = Date.now();
            }
          } else {
            const resetRes = await fetch('/api/env/reset', { method: 'POST', body: JSON.stringify({}) });
            if (resetRes.ok) {
              const resetData = await resetRes.json();
              if (resetData.ok) {
                setState((prev) => prev ?? resetData);
              }
            }
          }
        }
      } catch {
        isConnected = false;
      }

      if (isMounted) {
        setConnected(isConnected);
        const delay = isConnected ? 30000 : 5000;
        timeoutId = setTimeout(checkHealth, delay);
      }
    };

    checkHealth();
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, []);

  const handleReset = async () => {
    try {
      const res = await fetch('/api/env/reset', { method: 'POST', body: JSON.stringify({}) });
      if (res.ok) setConnected(true);
      const data = await res.json();
      if (data.ok) {
        setPrevReward(state?.reward_total ?? 0);
        setState(data);
        setChartData([{ step: data.step, reward: data.reward_total, stalled: data.stats?.stalled ?? 0 }]);
        startTimeRef.current = Date.now();
        setElapsed(0);
        setIsAutoplay(false);
        setEpisodeCount((c) => c + 1);
      }
    } catch (e) { console.error(e); }
  };

  const handleStep = useCallback(async () => {
    try {
      const res = await fetch('/api/env/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy }),
      });
      if (res.ok) setConnected(true);
      const data = await res.json();
      if (data.ok) {
        setState(data);
        setChartData((prev) => [
          ...prev,
          { step: data.step, reward: data.reward_total, stalled: data.stats?.stalled ?? 0 },
        ]);
        if (data.terminated) setIsAutoplay(false);
      }
    } catch (e) { console.error(e); }
  }, [policy]);

  const handleTrain = async () => {
    setIsTraining(true);
    setIsAutoplay(false);
    try {
      const response = await fetch('/api/env/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timesteps: 20000 }),
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error('No reader available');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) { setIsTraining(false); handleReset(); }
              else if (data.ok === false) { console.error('Training error', data); setIsTraining(false); }
            } catch (err) { console.error('Parse error', err); }
          }
        }
      }
    } catch (e) { console.error('SSE Error', e); setIsTraining(false); }
  };

  // Autoplay loop
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(handleStep, 350);
    return () => clearInterval(interval);
  }, [isAutoplay, handleStep]);

  // Elapsed time loop
  useEffect(() => {
    if (state?.terminated) return;
    const interval = setInterval(() => {
      if (startTimeRef.current) setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [state?.terminated]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(34,211,238,0.04) 0%, transparent 50%), #080810' }}>
      <TopBar connected={connected} step={state?.step ?? 0} episodeCount={episodeCount} />

      <HeroStrip
        step={state?.step ?? 0}
        reward={state?.reward_total ?? 0}
        prevReward={prevReward}
        terminated={state?.terminated ?? false}
      />

      {/* Main grid */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left: Cabin + Aisle panel (7 cols) */}
          <div className="lg:col-span-7">
            <div className="glass rounded-2xl p-5 shadow-2xl h-full hover:border-white/10 transition-colors duration-300">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                    Cabin
                  </span>
                  <span className="text-[10px] font-mono text-slate-700">10 × 5</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-500">
                    <span className="w-2 h-2 rounded-sm bg-emerald-500/30 border border-emerald-400/40 inline-block" /> Seated
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-sm bg-amber-500/20 border border-amber-400/30 inline-block" /> Stowing
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2 h-2 rounded-sm bg-white/[0.02] border border-white/[0.06] inline-block" /> Empty
                  </span>
                </div>
              </div>

              <div className="flex gap-4 justify-center items-start overflow-x-auto pb-2">
                <Aisle aisle={state?.aisle || []} totalRows={10} />
                <Cabin cabin={state?.cabin || []} />
              </div>
            </div>
          </div>

          {/* Right: stacked controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <StatsPanel
              stats={state?.stats || { seated: 0, total: 50, stalled: 0, moving: 0, stowing: 0, mask: [] }}
              step={state?.step || 0}
              reward={state?.reward_total || 0}
              elapsed={elapsed}
            />

            <Controls
              onReset={handleReset}
              onStep={handleStep}
              onToggleAutoplay={() => setIsAutoplay(!isAutoplay)}
              isAutoplay={isAutoplay}
              policy={policy}
              setPolicy={setPolicy}
              onTrain={handleTrain}
              isTraining={isTraining}
              terminated={state?.terminated || false}
            />

            <ActionMask
              mask={state?.stats?.mask || []}
              lastAction={state?.action ?? null}
            />

            <RewardChart data={chartData} />

            <Lobby
              lobby={state?.lobby || []}
              activeRow={state?.action ?? null}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-4 px-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-700">
            Gymnasium · MaskablePPO · sb3-contrib
          </span>
          <a
            href="https://github.com/Junaidchohan/RLE_Airplane_Boarding"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-slate-700 hover:text-slate-400 transition-colors duration-200 flex items-center gap-1"
          >
            Junaidchohan/RLE_Airplane_Boarding <ExternalLink size={10} />
          </a>
        </div>
      </footer>
    </div>
  );
}
