'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Search, 
  Clock, 
  Bell, 
  CreditCard, 
  Zap, 
  Bot, 
  Sliders, 
  Globe, 
  LogOut, 
  User, 
  ShieldCheck, 
  Activity, 
  ChevronRight,
  Sparkles,
  Command,
  Radio
} from 'lucide-react';
import { SUPPORTED_COUNTRIES, CountryConfig } from '@/backend/contracts/countries';
import { useAuth } from '@/frontend/utils/auth-context';

export type DashboardMode = 'agent' | 'manual';

interface DashboardSidebarProps {
  activeTab: 'search' | 'watches' | 'alerts' | 'simulation' | 'paypal';
  setActiveTab: (tab: 'search' | 'watches' | 'alerts' | 'simulation' | 'paypal') => void;
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  activeWatchesCount: number;
  alertsCount: number;
  onRefreshWatches: () => void;
  selectedCountry: CountryConfig;
  onCountryChange: (country: CountryConfig) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenDirectiveModal: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  setActiveTab,
  mode,
  setMode,
  activeWatchesCount,
  alertsCount,
  onRefreshWatches,
  selectedCountry,
  onCountryChange,
  isMobileOpen,
  setIsMobileOpen,
  onOpenDirectiveModal,
}) => {
  const { session, signOut } = useAuth();
  const sessionUser = (session as any)?.user;
  const userInitials = (sessionUser?.name || sessionUser?.email || 'DP')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    {
      id: 'search' as const,
      label: 'Deal Radar',
      icon: <Search className="w-4 h-4" />,
      description: 'Search & Normalized Deals',
    },
    {
      id: 'watches' as const,
      label: 'Active Watches',
      icon: <Clock className="w-4 h-4" />,
      badge: activeWatchesCount,
      description: 'Background Tracking Rules',
      onClick: () => {
        setActiveTab('watches');
        onRefreshWatches();
      },
    },
    {
      id: 'alerts' as const,
      label: 'Outbox Alerts',
      icon: <Bell className="w-4 h-4" />,
      badge: alertsCount,
      alertStyle: alertsCount > 0,
      description: 'Transactional Notifications',
      onClick: () => {
        setActiveTab('alerts');
        onRefreshWatches();
      },
    },
    {
      id: 'paypal' as const,
      label: 'PayPal Agent',
      icon: <CreditCard className="w-4 h-4 text-zinc-300" />,
      description: 'Toolkit & Order Chat',
    },
    {
      id: 'simulation' as const,
      label: 'Test Lab',
      icon: <Zap className="w-4 h-4 text-zinc-300" />,
      description: 'Failure Paths & Sim',
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-[#09090b] text-zinc-100 font-sans border-r border-zinc-850">
      
      {/* Top Header & Brand */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 font-bold text-xs text-white">
              DP
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white leading-tight">
                DealPilot
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                v2.0 RADAR
              </div>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            PRO
          </span>
        </div>

        {/* 2 Modes Segmented Switcher (Agent vs Manual) */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
            <span className="uppercase tracking-wider">Operational Mode</span>
            <span className={`text-[10px] font-bold ${mode === 'agent' ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {mode === 'agent' ? 'AUTONOMOUS' : 'MANUAL'}
            </span>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-lg bg-black border border-zinc-800">
            <button
              type="button"
              onClick={() => setMode('agent')}
              className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'agent'
                  ? 'bg-zinc-850 text-white shadow-sm border border-zinc-750'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agent</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'bg-zinc-850 text-white shadow-sm border border-zinc-750'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-300" />
              <span>Manual</span>
            </button>
          </div>

          {/* Mode Micro Telemetry Hint */}
          <div className="px-1 text-[10px] font-mono text-zinc-500 flex items-center gap-1">
            {mode === 'agent' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">AI scoring & auto buy directives armed</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                <span className="truncate">Direct manual search & AG Grid table</span>
              </>
            )}
          </div>
        </div>

        {/* Agent Quick Directive Action (Visible in Agent Mode) */}
        {mode === 'agent' && (
          <div className="px-1">
            <button
              onClick={onOpenDirectiveModal}
              className="w-full py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-2">
                <Command className="w-3.5 h-3.5 text-emerald-400" />
                <span>Command Directive</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase text-zinc-500 px-3 tracking-wider mb-2">
            Navigation
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else {
                      setActiveTab(item.id);
                    }
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-850 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      item.alertStyle 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Country / Market Selector */}
        <div className="space-y-1 px-1">
          <div className="text-[10px] font-mono uppercase text-zinc-500 px-2 tracking-wider mb-1.5 flex items-center justify-between">
            <span>Market Region</span>
            <Globe className="w-3 h-3 text-zinc-500" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-black p-1 rounded-lg border border-zinc-800 text-xs">
            {SUPPORTED_COUNTRIES.map((country) => {
              const isSelected = selectedCountry.code === country.code;
              return (
                <button
                  key={country.code}
                  onClick={() => onCountryChange(country)}
                  className={`py-1.5 px-2 rounded flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-850 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{country.flag}</span>
                  <span className="truncate">{country.currency}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom User Account & Telemetry Footer */}
      <div className="pt-4 border-t border-zinc-850/80 space-y-3">
        
        {/* System Health Status */}
        <div className="p-2.5 rounded-lg bg-black border border-zinc-850/80 text-[10px] font-mono text-zinc-400 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">ENGINE STATUS</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ONLINE
            </span>
          </div>
          <div className="text-zinc-500 truncate">
            Redis 7 • PG 16 • PayPal v6 SDK
          </div>
        </div>

        {/* User Card & Sign Out */}
        {sessionUser ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-850">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                {userInitials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-zinc-200 truncate">
                  {sessionUser.name || 'Agent Operator'}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 truncate">
                  {sessionUser.email || 'Authenticated'}
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Link
              href="/auth"
              className="w-full py-2 rounded-md bg-zinc-100 hover:bg-white text-black font-semibold text-xs transition-colors block"
            >
              Sign In to Account
            </Link>
          </div>
        )}

      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sliding Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex">
          <div className="w-72 max-w-[85%] h-full animate-fade-in-up">
            {sidebarContent}
          </div>
          <div 
            className="flex-1 h-full" 
            onClick={() => setIsMobileOpen(false)} 
          />
        </div>
      )}
    </>
  );
};
