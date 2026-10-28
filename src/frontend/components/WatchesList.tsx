'use client';

import React from 'react';
import { RefreshCw, Clock, Trash2, ArrowUpRight, Zap, Bell, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface WatchesListProps {
  rules: any[];
  onRefresh: () => void;
}

export const WatchesList: React.FC<WatchesListProps> = ({ rules, onRefresh }) => {
  return (
    <div className="bg-[#09090b] border border-zinc-850 rounded-xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase text-emerald-400 tracking-wider font-semibold">
              Live Price Tracking Active
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Active Price Trackers
          </h2>
          <p className="text-zinc-400 text-xs mt-1">
            We continuously check store prices and will alert you the instant a deal matches or beats your target.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-850 rounded-lg space-y-2">
          <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-xs font-semibold text-zinc-300">No active price trackers</div>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            Search for any product or set an alert on a deal to begin tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-black border border-zinc-850 hover:border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                  <span>{rule.product.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
                    {rule.product.brand || 'Verified'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400 pt-1">
                  <span>
                    Target: <strong className="text-emerald-400 tabular-nums">{formatCurrency(rule.targetPrice, rule.currency)}</strong>
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span>
                    Cadence: <span className="text-zinc-200">{rule.pollingPolicy || 'Adaptive (2h / 30m)'}</span>
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span>
                    Strategy: <span className="text-zinc-300 uppercase">{rule.strategy}</span>
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-zinc-900 pt-2 sm:pt-0 gap-1 text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  rule.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}>
                  {rule.status}
                </span>
                
                <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  <span>Next: {formatDateTime(rule.nextCheckAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
