import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface WatchesListProps {
  rules: any[];
  onRefresh: () => void;
}

export const WatchesList: React.FC<WatchesListProps> = ({ rules, onRefresh }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Active Tracking Rules & Adaptive Polling</h2>
          <p className="text-slate-400 text-xs">
            Background BullMQ workers check these prices on dynamic cadences (2h normal, 30m when near target).
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 text-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          No active tracking rules. Search for a product and click "Track Price" to set one!
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="font-semibold text-sm text-slate-200">
                  {rule.product.title}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Target: <strong className="text-emerald-400">{formatCurrency(rule.targetPrice, rule.currency)}</strong></span>
                  <span>Strategy: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">{rule.strategy}</code></span>
                  <span>Polling Policy: <span className="text-amber-400 font-medium">{rule.pollingPolicy}</span></span>
                </div>
              </div>

              <div className="text-right">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  rule.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {rule.status.toUpperCase()}
                </span>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  Next check: {formatDateTime(rule.nextCheckAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
