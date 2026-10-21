import React from 'react';
import { Clock, Bell, Zap, CreditCard, Search, Activity, Shield, Sparkles } from 'lucide-react';
import { UserAuthButton } from './UserAuthButton';
import { useSession } from '@/frontend/utils/auth-client';

interface HeaderProps {
  activeTab: 'search' | 'watches' | 'alerts' | 'simulation' | 'paypal';
  setActiveTab: (tab: 'search' | 'watches' | 'alerts' | 'simulation' | 'paypal') => void;
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
  const { data: session } = useSession();
  const sessionUser = (session as any)?.user;
  const initials = (sessionUser?.name || sessionUser?.email || 'DP')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const navTabs = [
    {
      id: 'search' as const,
      label: 'Deal Search',
      icon: <Search className="w-3.5 h-3.5" />,
      onClick: () => setActiveTab('search'),
    },
    {
      id: 'watches' as const,
      label: 'Active Watches',
      icon: <Clock className="w-3.5 h-3.5" />,
      badge: activeWatchesCount,
      onClick: () => {
        setActiveTab('watches');
        onRefreshWatches();
      },
    },
    {
      id: 'alerts' as const,
      label: 'Outbox Alerts',
      icon: <Bell className="w-3.5 h-3.5" />,
      badge: alertsCount,
      alertStyle: alertsCount > 0,
      onClick: () => {
        setActiveTab('alerts');
        onRefreshWatches();
      },
    },
    {
      id: 'paypal' as const,
      label: 'PayPal Agent',
      icon: <CreditCard className="w-3.5 h-3.5 text-blue-400" />,
      onClick: () => setActiveTab('paypal'),
    },
    {
      id: 'simulation' as const,
      label: 'Test Lab',
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      onClick: () => setActiveTab('simulation'),
    },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/75 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & Live Worker Heartbeat */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-xl text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
              ✈
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
                <span>DealPilot</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span>Autonomous Shopping Agent</span>
              </div>
            </div>
          </div>

          {/* Subtle Live Worker Heartbeat Pulse Telemetry */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-emerald-500/30 text-emerald-400 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] font-semibold tracking-wide">BullMQ Workers</span>
            <span className="text-[10px] text-slate-400 font-mono border-l border-slate-800 pl-1.5">Live · 2h/30m</span>
          </div>
        </div>

        {/* Navigation Tabs with Smooth Active Indicator */}
        <nav
          className="hidden md:flex items-center p-1 bg-slate-950/60 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-inner"
          role="tablist"
          aria-label="Dashboard Navigation"
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={tab.onClick}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 z-10 select-none active:scale-95 ${
                  isActive
                    ? 'text-emerald-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {/* Active tab background glow */}
                {isActive && (
                  <span className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-lg -z-10 shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all duration-200" />
                )}

                {/* Smooth active indicator underline under tab */}
                {isActive && (
                  <span className="absolute -bottom-1 left-2.5 right-2.5 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-in fade-in zoom-in-75 duration-200" />
                )}

                {tab.icon}
                <span>{tab.label}</span>

                {tab.badge !== undefined && (
                  <span
                    className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                      tab.alertStyle
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : isActive
                        ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: User Profile Pill with Avatar/Initials & Auth Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* User Profile Pill with Avatar / Initials */}
          {sessionUser ? (
            <div className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 shadow-sm backdrop-blur-sm hover:border-emerald-500/40 transition">
              {sessionUser.image ? (
                <img
                  src={sessionUser.image}
                  alt={sessionUser.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                  {initials}
                </div>
              )}
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-slate-100 max-w-[105px] truncate">
                  {sessionUser.name || sessionUser.email?.split('@')[0]}
                </span>
                <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Verified Pilot
                </span>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-sm">
                DP
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[11px] font-semibold text-slate-200">Pilot Guest</span>
                <span className="text-[9px] text-emerald-400/80 font-mono">Sandbox Mode</span>
              </div>
            </div>
          )}

          <div className="h-5 w-px bg-slate-800 mx-0.5" />

          {/* Better Auth Action Button / Modal Trigger */}
          <UserAuthButton />
        </div>
      </div>
    </header>
  );
};
