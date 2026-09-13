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
import { Activity } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [connected, setConnected] = useState<boolean>(false);
  const [state, setState] = useState<StateResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [policy, setPolicy] = useState<'random' | 'trained'>('trained');
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  
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
            // Bridge is running but env needs initial reset
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

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleReset = async () => {
    try {
      const res = await fetch('/api/env/reset', { method: 'POST', body: JSON.stringify({}) });
      if (res.ok) {
        setConnected(true);
      }
      const data = await res.json();
      if (data.ok) {
        setState(data);
        setChartData([{ step: data.step, reward: data.reward_total, stalled: data.stats?.stalled ?? 0 }]);
        startTimeRef.current = Date.now();
        setElapsed(0);
        setIsAutoplay(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStep = useCallback(async () => {
    try {
      const res = await fetch('/api/env/step', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy }) 
      });
      if (res.ok) {
        setConnected(true);
      }
      const data = await res.json();
      if (data.ok) {
        setState(data);
        setChartData(prev => [...prev, { 
          step: data.step, 
          reward: data.reward_total,
          stalled: data.stats?.stalled ?? 0
        }]);
        if (data.terminated) {
          setIsAutoplay(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [policy]);

  const handleTrain = async () => {
    setIsTraining(true);
    setIsAutoplay(false);
    try {
      const response = await fetch('/api/env/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timesteps: 20000 })
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
              if (data.done) {
                setIsTraining(false);
                handleReset();
              } else if (data.ok === false) {
                console.error("Training error", data);
                setIsTraining(false);
              } else {
                console.log("Training progress:", data);
              }
            } catch (err) {
              console.error("Parse error", err);
            }
          }
        }
      }
    } catch (e) {
      console.error("SSE Error", e);
      setIsTraining(false);
    }
  };

  // Autoplay loop
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      handleStep();
    }, 350);
    return () => clearInterval(interval);
  }, [isAutoplay, handleStep]);

  // Elapsed time loop
  useEffect(() => {
    if (state?.terminated) return;
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed((Date.now() - startTimeRef.current) / 1000);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [state?.terminated]);

  if (!state && connected) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-indigo-950 text-slate-200 p-8">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Airplane Boarding</h1>
          <p className="text-sm text-slate-400">RLE Dashboard • Maskable PPO</p>
        </div>
        <div className="flex items-center gap-4">
          {!connected && (
             <button onClick={handleReset} className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500 text-white">Initialize</button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-full border border-white/5 shadow-inner">
            <Activity size={14} className={connected ? "text-emerald-500" : "text-red-500"} />
            <span className="text-xs font-medium">{connected ? "Bridge Connected" : "Disconnected"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (spans 2) - Visualizations */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex gap-6">
            <Aisle aisle={state?.aisle || []} totalRows={10} />
            <Cabin cabin={state?.cabin || []} />
          </div>
        </div>

        {/* Right Column - Stats, Controls, Logs */}
        <div className="flex flex-col gap-4">
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
          <Lobby lobby={state?.lobby || []} activeRow={state?.action ?? null} />
        </div>
      </div>
      
    </div>
  );
}
