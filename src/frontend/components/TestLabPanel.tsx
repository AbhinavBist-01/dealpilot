import React from 'react';
import { Zap, Activity, AlertTriangle, Play } from 'lucide-react';

interface TestLabPanelProps {
  onSimulate: (action: string) => void;
}

export const TestLabPanel: React.FC<TestLabPanelProps> = ({ onSimulate }) => {
  return (
    <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Interactive Test Lab & Failure Simulation</span>
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
          Vitest / Sandbox Guardrails
        </span>
      </div>
      <p className="text-zinc-400 text-xs mb-6">
        Test end-to-end failure paths and autonomous behaviors deterministically with one click:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-200 mb-1">
              <span className="w-4 h-4 rounded-full bg-zinc-900 text-zinc-400 text-[10px] flex items-center justify-center font-mono">1</span>
              <span>Simulate Price Drop</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              Forces Sony WH-1000XM5 price to drop to ₹17,499 (below ₹18,000 target threshold).
            </p>
          </div>
          <button
            onClick={() => onSimulate('drop_price')}
            className="w-full bg-zinc-900 hover:bg-zinc-850 text-emerald-400 border border-zinc-800 font-medium py-2 px-3 rounded-lg text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3" />
            <span>Drop Price to ₹17,499</span>
          </button>
        </div>

        <div className="bg-black border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-200 mb-1">
              <span className="w-4 h-4 rounded-full bg-zinc-900 text-zinc-400 text-[10px] flex items-center justify-center font-mono">2</span>
              <span>Run Monitoring Worker</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              Immediately triggers background evaluation on all active price-tracking rules.
            </p>
          </div>
          <button
            onClick={() => onSimulate('run_monitor_now')}
            className="w-full bg-zinc-900 hover:bg-zinc-850 text-amber-400 border border-zinc-800 font-medium py-2 px-3 rounded-lg text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Activity className="w-3 h-3" />
            <span>Poll Rules Now</span>
          </button>
        </div>

        <div className="bg-black border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-200 mb-1">
              <span className="w-4 h-4 rounded-full bg-zinc-900 text-zinc-400 text-[10px] flex items-center justify-center font-mono">3</span>
              <span>Simulate Stock Outage</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              Marks item as Out of Stock to verify pre-flight revalidation guards checkout.
            </p>
          </div>
          <button
            onClick={() => onSimulate('toggle_stock')}
            className="w-full bg-zinc-900 hover:bg-zinc-850 text-rose-400 border border-zinc-800 font-medium py-2 px-3 rounded-lg text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Set Out of Stock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
