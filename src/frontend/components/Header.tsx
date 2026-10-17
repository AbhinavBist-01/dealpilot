import React from 'react';
import { Clock, Bell, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: 'search' | 'watches' | 'alerts' | 'simulation';
  setActiveTab: (tab: 'search' | 'watches' | 'alerts' | 'simulation') => void;
  activeWatchesCount: number;
  alertsCount: number;
  onRefreshWatches: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeWatchesCount,
  alertsCount,
  onRefreshWatches,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-xl text-slate-950 shadow-lg shadow-emerald-500/20">
            ✈
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              DealPilot
            </div>
            <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autonomous Shopping Agent
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'search'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deal Search
          </button>
          <button
            onClick={() => {
              setActiveTab('watches');
              onRefreshWatches();
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 'watches'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Active Watches ({activeWatchesCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('alerts');
              onRefreshWatches();
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            Outbox Alerts ({alertsCount})
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 'simulation'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            Test Lab
          </button>
        </div>
      </div>
    </header>
  );
};
