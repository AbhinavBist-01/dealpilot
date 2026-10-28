import React from 'react';
import { Clock, Bell, Zap, CreditCard, Search, Activity, Shield, Sparkles, Globe, Plane } from 'lucide-react';
import { UserAuthButton } from './UserAuthButton';
import { useAuth } from '@/frontend/utils/auth-context';
import { SUPPORTED_COUNTRIES, CountryConfig } from '@/backend/contracts/countries';

interface HeaderProps {
  activeTab: 'search' | 'watches' | 'alerts' | 'simulation' | 'paypal';
  setActiveTab: (tab: 'search' | 'watches' | 'alerts' | 'simulation' | 'paypal') => void;
  activeWatchesCount: number;
  alertsCount: number;
  onRefreshWatches: () => void;
  selectedCountry?: CountryConfig;
  onCountryChange?: (country: CountryConfig) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeWatchesCount,
  alertsCount,
  onRefreshWatches,
  selectedCountry = SUPPORTED_COUNTRIES[0],
  onCountryChange,
}) => {
  const { session } = useAuth();
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
      icon: <CreditCard className="w-3.5 h-3.5" />,
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
    <header className="border-b border-zinc-800 bg-black/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand & Live Worker Heartbeat */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Plane className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>DealPilot</span>
                <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span>Autonomous Shopping Agent</span>
              </div>
            </div>
          </div>

          {/* Subtle Live Worker Heartbeat Telemetry */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <Activity className="w-3 h-3 text-zinc-400" />
            <span className="text-[11px] font-medium tracking-wide">BullMQ Workers</span>
            <span className="text-[10px] text-zinc-500 font-mono border-l border-zinc-800 pl-1.5">Live · 2h/30m</span>
          </div>
        </div>

        {/* Navigation Tabs with Smooth Active Indicator */}
        <nav
          className="hidden md:flex items-center p-1 bg-zinc-950 rounded-lg border border-zinc-800"
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
                className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 select-none cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>

                {tab.badge !== undefined && (
                  <span
                    className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                      tab.alertStyle
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                        : isActive
                        ? 'bg-zinc-900 text-zinc-200 border border-zinc-700'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
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
            <div className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm">
              {sessionUser.image ? (
                <img
                  src={sessionUser.image}
                  alt={sessionUser.name || 'User'}
                  className="w-6 h-6 rounded-md object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-200 font-semibold text-[10px] flex items-center justify-center border border-zinc-700">
                  {initials}
                </div>
              )}
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs font-medium text-zinc-200 max-w-[105px] truncate">
                  {sessionUser.name || sessionUser.email?.split('@')[0]}
                </span>
                <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Verified
                </span>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm">
              <div className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-300 font-medium text-[10px] flex items-center justify-center border border-zinc-700">
                DP
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[11px] font-medium text-zinc-300">Pilot Guest</span>
                <span className="text-[9px] text-zinc-500 font-mono">Sandbox</span>
              </div>
            </div>
          )}

          {/* Country & Currency Selector Dropdown */}
          {onCountryChange && (
            <div className="relative flex items-center">
              <select
                value={selectedCountry.code}
                onChange={(e) => {
                  const found = SUPPORTED_COUNTRIES.find((c) => c.code === e.target.value);
                  if (found) onCountryChange(found);
                }}
                className="appearance-none bg-zinc-900 hover:bg-zinc-850 text-xs font-medium text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-lg pl-2.5 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-600 transition"
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-black text-zinc-200">
                    {c.flag} {c.code} ({c.currency})
                  </option>
                ))}
              </select>
              <Globe className="w-3.5 h-3.5 absolute right-2 text-zinc-500 pointer-events-none" />
            </div>
          )}

          <div className="h-4 w-px bg-zinc-800 mx-0.5" />

          {/* Better Auth Action Button / Modal Trigger */}
          <UserAuthButton />
        </div>
      </div>
    </header>
  );
};
