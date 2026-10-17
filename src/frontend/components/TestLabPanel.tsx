import React from 'react';
import { Zap } from 'lucide-react';

interface TestLabPanelProps {
  onSimulate: (action: string) => void;
}

export const TestLabPanel: React.FC<TestLabPanelProps> = ({ onSimulate }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400" />
        <span>Interactive Test Lab & Failure Simulation</span>
      </h2>
      <p className="text-slate-400 text-xs mb-6">
        Test end-to-end failure paths and autonomous behaviors with one click:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-200 mb-1">1. Simulate Price Drop</h3>
            <p className="text-xs text-slate-400 mb-4">
              Forces Sony WH-1000XM5 price to drop to ₹17,499 (below ₹18,000 target).
            </p>
          </div>
          <button
            onClick={() => onSimulate('drop_price')}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-semibold py-2 px-3 rounded-lg text-xs transition"
          >
            Drop Price to ₹17,499
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-200 mb-1">2. Run Monitoring Worker</h3>
            <p className="text-xs text-slate-400 mb-4">
              Immediately triggers background evaluation on all active tracking rules.
            </p>
          </div>
          <button
            onClick={() => onSimulate('run_monitor_now')}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold py-2 px-3 rounded-lg text-xs transition"
          >
            Poll Tracking Rules Now
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-200 mb-1">3. Simulate Stock Outage</h3>
            <p className="text-xs text-slate-400 mb-4">
              Marks item as Out of Stock to verify pre-flight revalidation guards checkout.
            </p>
          </div>
          <button
            onClick={() => onSimulate('toggle_stock')}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-semibold py-2 px-3 rounded-lg text-xs transition"
          >
            Set to Out of Stock
          </button>
        </div>
      </div>
    </div>
  );
};
