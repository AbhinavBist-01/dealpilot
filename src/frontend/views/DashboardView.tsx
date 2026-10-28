'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  Table,
  Shield,
  LogIn,
  Lock,
  X,
  SlidersHorizontal,
  TrendingDown,
  Tag,
  ArrowRight,
  Laptop,
  Headphones,
  Monitor,
  Menu,
  Bot,
  Sliders,
  CheckCircle2,
  Clock,
  Zap,
  Command,
  Eye,
  AlertCircle
} from 'lucide-react';
import { DashboardSidebar, DashboardMode } from '../components/DashboardSidebar';
import { DealCard } from '../components/DealCard';
import { DealGrid } from '../components/DealGrid';
import { WatchesList } from '../components/WatchesList';
import { OutboxAlertsList } from '../components/OutboxAlertsList';
import { TestLabPanel } from '../components/TestLabPanel';
import { TrackingModal } from '../components/TrackingModal';
import { PayPalModal } from '../components/PayPalModal';
import { PriceHistoryModal } from '../components/PriceHistoryModal';
import { PayPalChatInterface } from '../components/PayPalChatInterface';
import { AgentBuyDirectiveModal } from '../components/AgentBuyDirectiveModal';
import { LandingView } from './LandingView';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '@/frontend/utils/auth-context';
import { SUPPORTED_COUNTRIES, CountryConfig, DEFAULT_COUNTRY } from '@/backend/contracts/countries';

export const DashboardView: React.FC = () => {
  const { session, isInitialLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(DEFAULT_COUNTRY);
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('agent');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState(false);

  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [trackingRules, setTrackingRules] = useState<any[]>([]);
  const [outboxAlerts, setOutboxAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'watches' | 'alerts' | 'simulation' | 'paypal'>('search');
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');

  // Price History Modal State
  const [historyModalProductId, setHistoryModalProductId] = useState<string | null>(null);

  // Tracking Modal State
  const [trackModalProduct, setTrackModalProduct] = useState<any | null>(null);
  const [targetPriceInput, setTargetPriceInput] = useState<number>(18000);

  // Checkout Modal State
  const [checkoutOffer, setCheckoutOffer] = useState<any | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'paypal_sandbox' | 'completed' | 'error'>('review');
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Status Banner
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Trending Indian Consumer Electronics & Quick Commerce items
  const presetChips = [
    { label: 'iPhone 16 Pro', query: 'iPhone 16 Pro', budget: '119900', icon: '📱' },
    { label: 'MacBook Air M3', query: 'MacBook Air M3', budget: '114900', icon: '💻' },
    { label: 'Sony PS5 Slim', query: 'PlayStation 5 Slim', budget: '54990', icon: '🎮' },
    { label: 'boAt Earbuds', query: 'boAt Airdopes', budget: '1999', icon: '🎧' },
  ];

  const budgetTiers = [
    { label: '≤ ₹30k', val: '30000' },
    { label: '≤ ₹60k', val: '60000' },
    { label: '≤ ₹150k', val: '150000' },
    { label: '≤ ₹200k', val: '200000' },
  ];

  const fetchOutboxAlerts = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.alerts) {
          setOutboxAlerts(data.alerts);
        }
      }
    } catch (err) {
      console.warn('Could not fetch outbox alerts:', err);
    }
  };

  useEffect(() => {
    fetchTrackingRules();
    fetchOutboxAlerts();
  }, []);

  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 4000);
  };

  const handleSearch = async (overrideQuery?: string, overrideBudget?: string, overrideCountry?: CountryConfig) => {
    setLoading(true);
    const q = overrideQuery !== undefined ? overrideQuery : query;
    const b = overrideBudget !== undefined ? overrideBudget : budget;
    const activeCountry = overrideCountry || selectedCountry;

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          budget: b ? parseFloat(b) : undefined,
          country: activeCountry.code,
          currency: activeCountry.currency,
        }),
      });
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err: any) {
      showBanner('Failed to search deals: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = (newCountry: CountryConfig) => {
    setSelectedCountry(newCountry);
    if (newCountry.currency === 'INR' && Number(budget) < 1000) {
      setBudget('30000');
    } else if (newCountry.currency !== 'INR' && Number(budget) > 5000) {
      setBudget('500');
    }
    showBanner(`Market switched to ${newCountry.name} (${newCountry.currency})`);
    handleSearch(query, undefined, newCountry);
  };

  const fetchTrackingRules = async () => {
    try {
      const res = await fetch('/api/tracking-rules');
      const data = await res.json();
      if (data.rules) {
        setTrackingRules(data.rules);
        const allAlerts: any[] = [];
        data.rules.forEach((r: any) => {
          if (r.notifications) {
            allAlerts.push(...r.notifications);
          }
        });
        setOutboxAlerts(allAlerts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createTrackingRule = async () => {
    if (!trackModalProduct) return;
    try {
      const res = await fetch('/api/tracking-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: trackModalProduct.id,
          targetPrice: targetPriceInput,
          strategy: 'target_price',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showBanner(`Tracking rule created for ₹${targetPriceInput}! Background workers are monitoring.`);
        setTrackModalProduct(null);
        fetchTrackingRules();
      }
    } catch (err: any) {
      showBanner('Failed to create tracking rule: ' + err.message);
    }
  };

  const initiateCheckout = async (product: any, offer: any) => {
    setCheckoutProduct(product);
    setCheckoutOffer(offer);
    setCheckoutStep('review');
    setCheckoutError(null);

    // Pre-flight revalidation
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCheckoutStep('error');
        setCheckoutError(data.error || 'Pre-flight checkout revalidation failed.');
        return;
      }

      setCreatedOrder(data.order);
      setCheckoutStep('paypal_sandbox');
    } catch (err: any) {
      setCheckoutStep('error');
      setCheckoutError(err.message);
    }
  };

  const confirmPayPalCapture = async () => {
    if (!createdOrder) return;
    try {
      const res = await fetch(`/api/orders/${createdOrder.id}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalOrderId: createdOrder.paypalOrderId }),
      });
      const data = await res.json();

      if (data.success) {
        setCheckoutStep('completed');
        showBanner('Payment authorized and verified server-side via PayPal!');
      } else {
        setCheckoutStep('error');
        setCheckoutError(data.error || 'Server-side capture failed');
      }
    } catch (err: any) {
      setCheckoutStep('error');
      setCheckoutError(err.message);
    }
  };

  const runSimulation = async (action: string) => {
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      showBanner(data.message);
      fetchTrackingRules();
      handleSearch();
    } catch (err: any) {
      showBanner('Simulation error: ' + err.message);
    }
  };

  // Initial loading state
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4 font-sans text-zinc-100">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center font-bold text-sm text-zinc-200">
            DP
          </div>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs">
          <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
          <span>INITIALIZING TELEMETRY RADAR...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated users are served the clean landing page
  if (!session) {
    return (
      <>
        <LandingView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  const budgetNum = Number(budget) || 0;
  const budgetProgress = Math.min(100, Math.max(5, (budgetNum / 200000) * 100));

  const tabLabels: Record<string, string> = {
    search: 'Deal Radar & Search',
    watches: 'Active Background Watches',
    alerts: 'Outbox Alert Events',
    paypal: 'PayPal Agent Toolkit Console',
    simulation: 'Failure Path Test Lab',
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col md:flex-row selection:bg-zinc-800 selection:text-white">
      
      {/* Banner Notifications */}
      {bannerMessage && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-mono border border-zinc-700 animate-fade-in-up">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* 1. Left Persistent Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mode={dashboardMode}
        setMode={setDashboardMode}
        activeWatchesCount={trackingRules.length}
        alertsCount={outboxAlerts.length}
        onRefreshWatches={fetchTrackingRules}
        selectedCountry={selectedCountry}
        onCountryChange={handleCountrySelect}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onOpenDirectiveModal={() => setIsDirectiveModalOpen(true)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Command & Telemetry Bar */}
        <header className="h-14 border-b border-zinc-850 bg-[#09090b]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-white">
                {tabLabels[activeTab]}
              </span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              
              {/* Active Operational Mode Pill */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 border border-zinc-850">
                {dashboardMode === 'agent' ? (
                  <>
                    <Bot className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">AGENT MODE</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-3 h-3 text-zinc-300" />
                    <span className="text-zinc-300">MANUAL MODE</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Status Controls */}
          <div className="flex items-center gap-3">
            
            {/* Quick Mode Toggle Button */}
            <button
              onClick={() => setDashboardMode(dashboardMode === 'agent' ? 'manual' : 'agent')}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle operational mode"
            >
              {dashboardMode === 'agent' ? (
                <>
                  <Sliders className="w-3 h-3 text-zinc-400" />
                  <span className="hidden sm:inline">Switch to</span>
                  <span>Manual</span>
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Switch to</span>
                  <span>Agent</span>
                </>
              )}
            </button>

            {/* Region / Currency Pill */}
            <div className="text-[11px] font-mono text-zinc-400 px-2 py-1 rounded border border-zinc-850 bg-black flex items-center gap-1">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.currency}</span>
            </div>

          </div>
        </header>

        {/* Main Work Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {activeTab === 'search' && (
            <div className="space-y-6">
              
              {/* MODE 1: AGENT MODE CONSOLE */}
              {dashboardMode === 'agent' ? (
                <div className="bg-[#09090b] border border-zinc-850 rounded-xl p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-mono uppercase text-emerald-400 tracking-wider font-semibold">
                          Autonomous Agent Engine Active
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Continuous Radar & Directives Monitoring
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                        DealPilot background workers continuously scrape and normalize domestic offers across Amazon, Flipkart, Croma, Blinkit, Zepto, and Instamart. When a deal reaches target threshold, pre-flight safety locks the offer for 1-click execution.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsDirectiveModalOpen(true)}
                      className="px-4 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-black font-semibold text-xs transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                    >
                      <Command className="w-3.5 h-3.5" />
                      <span>Deploy Buy Directive</span>
                    </button>
                  </div>

                  {/* Agent 3-Metric Health Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-850/80 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-black border border-zinc-850">
                      <div className="text-[10px] text-zinc-500 uppercase">Tracked Directives</div>
                      <div className="text-base font-bold text-zinc-100 tabular-nums mt-0.5">
                        {trackingRules.length} Active Rules
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">● Polling Cadence: 30m / 2h</div>
                    </div>

                    <div className="p-3 rounded-lg bg-black border border-zinc-850">
                      <div className="text-[10px] text-zinc-500 uppercase">Outbox Alerts Ready</div>
                      <div className="text-base font-bold text-zinc-100 tabular-nums mt-0.5">
                        {outboxAlerts.length} Captured Events
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Gmail Dispatch Deduplicated</div>
                    </div>

                    <div className="p-3 rounded-lg bg-black border border-zinc-850">
                      <div className="text-[10px] text-zinc-500 uppercase">Pre-Flight Safety</div>
                      <div className="text-base font-bold text-zinc-100 mt-0.5">
                        100% Guarded
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Stock & Price Locked at Checkout</div>
                    </div>
                  </div>

                  {/* Search Bar in Agent Mode */}
                  <div className="pt-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Tell agent which product or category to crawl across ${selectedCountry.name}...`}
                        className="w-full bg-black border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-lg pl-10 pr-24 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <button
                        onClick={() => handleSearch()}
                        disabled={loading}
                        className="absolute right-1.5 top-1.5 px-3 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Crawl'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* MODE 2: MANUAL MODE CONSOLE (TRADER) */
                <div className="bg-[#09090b] border border-zinc-850 rounded-xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        <span className="text-[11px] font-mono uppercase text-zinc-300 tracking-wider font-semibold">
                          Manual Trader Mode
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Granular Search & Table Inspection
                      </h2>
                    </div>

                    <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                      <span>Ceiling:</span>
                      <span className="text-emerald-400 font-bold tabular-nums">
                        {selectedCountry.symbol}{budgetNum > 0 ? budgetNum.toLocaleString(selectedCountry.locale) : 'No Limit'}
                      </span>
                    </div>
                  </div>

                  {/* Manual Search & Budget Inputs */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search manual catalog for ${selectedCountry.name} (${selectedCountry.currency})...`}
                        className="w-full bg-black border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-lg pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      {query.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setQuery('')}
                          className="absolute right-3 top-3 text-zinc-500 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="relative w-full sm:w-44">
                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder={`Budget (${selectedCountry.symbol})`}
                        className="w-full bg-black border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-colors font-mono"
                      />
                    </div>

                    <button
                      onClick={() => handleSearch()}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
                    >
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Budget Tiers Chips */}
                  <div className="pt-2 border-t border-zinc-850/80 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-zinc-500 font-mono text-[11px] uppercase mr-1">Tiers:</span>
                    {budgetTiers.map((tier) => (
                      <button
                        key={tier.val}
                        onClick={() => {
                          setBudget(tier.val);
                          handleSearch(query, tier.val);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                          budget === tier.val
                            ? 'bg-zinc-800 text-white border-zinc-700'
                            : 'bg-black text-zinc-400 hover:text-zinc-200 border-zinc-850'
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>

                  {/* Quick Presets */}
                  <div className="pt-2 border-t border-zinc-850/80 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-zinc-500 font-mono text-[11px] uppercase mr-1">Presets:</span>
                    {presetChips.map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => {
                          setQuery(chip.query);
                          setBudget(chip.budget);
                          handleSearch(chip.query, chip.budget);
                        }}
                        className="px-2.5 py-1 rounded bg-black hover:bg-zinc-900 border border-zinc-850 text-zinc-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{chip.icon}</span>
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Deal Cards & AG Grid Table Header */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                      <span>Normalized Catalog Results</span>
                      <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {products.length} Items Found
                      </span>
                    </h3>
                  </div>

                  {/* View Mode Toggle: Cards vs AG Grid Table */}
                  {products.length > 0 && (
                    <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-zinc-850">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                          viewMode === 'cards'
                            ? 'bg-zinc-850 text-white font-semibold shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Cards</span>
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                          viewMode === 'grid'
                            ? 'bg-zinc-850 text-white font-semibold shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>AG Grid Table</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Empty State */}
                {products.length === 0 && !loading && (
                  <div className="bg-[#09090b] border border-zinc-850 rounded-xl p-10 text-center space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        {dashboardMode === 'agent' ? 'No Active Agent Discoveries Yet' : 'No Catalog Offers Loaded'}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {dashboardMode === 'agent'
                          ? 'Instruct the agent with a natural language directive or search a product to trigger autonomous domestic crawlers.'
                          : 'Enter a search term above or select a preset chip to view normalized multi-merchant offers.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      {presetChips.map((chip) => (
                        <button
                          key={chip.label}
                          onClick={() => {
                            setQuery(chip.query);
                            setBudget(chip.budget);
                            handleSearch(chip.query, chip.budget);
                          }}
                          className="px-3 py-1.5 rounded-md bg-black hover:bg-zinc-900 border border-zinc-850 text-zinc-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{chip.icon}</span>
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Display (Cards vs AG Grid Table) */}
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {products.map((product) => (
                      <DealCard
                        key={product.id}
                        product={product}
                        onTrack={(p, o) => {
                          setTrackModalProduct(p);
                          setTargetPriceInput(Math.round((o?.totalPrice || 20000) * 0.9));
                        }}
                        onBuy={(p, o) => initiateCheckout(p, o)}
                        onViewHistory={(p) => setHistoryModalProductId(p.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <DealGrid
                    products={products}
                    onTrack={(p, o) => {
                      setTrackModalProduct(p);
                      setTargetPriceInput(Math.round((o?.totalPrice || 20000) * 0.9));
                    }}
                    onBuy={(p, o) => initiateCheckout(p, o)}
                    onViewHistory={(p) => setHistoryModalProductId(p.id)}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'watches' && (
            <WatchesList
              rules={trackingRules}
              onRefresh={fetchTrackingRules}
            />
          )}

          {activeTab === 'alerts' && (
            <OutboxAlertsList
              alerts={outboxAlerts}
              onRefresh={() => {
                fetchOutboxAlerts();
                fetchTrackingRules();
              }}
            />
          )}

          {activeTab === 'paypal' && (
            <PayPalChatInterface />
          )}

          {activeTab === 'simulation' && (
            <TestLabPanel
              onSimulate={runSimulation}
            />
          )}

        </main>
      </div>

      {/* Tracking Modal */}
      {trackModalProduct && (
        <TrackingModal
          product={trackModalProduct}
          targetPrice={targetPriceInput}
          setTargetPrice={setTargetPriceInput}
          onClose={() => setTrackModalProduct(null)}
          onConfirm={createTrackingRule}
        />
      )}

      {/* Checkout Modal */}
      {checkoutOffer && checkoutProduct && (
        <PayPalModal
          product={checkoutProduct}
          step={checkoutStep}
          order={createdOrder}
          error={checkoutError}
          onClose={() => {
            setCheckoutOffer(null);
            setCheckoutProduct(null);
          }}
          onAuthorize={confirmPayPalCapture}
        />
      )}

      {/* Price History & Multi-Merchant Comparison Modal */}
      {historyModalProductId && (
        <PriceHistoryModal
          productId={historyModalProductId}
          currency={selectedCountry.currency}
          onClose={() => setHistoryModalProductId(null)}
          onTrack={(p, targetPrice) => {
            setTrackModalProduct(p);
            setTargetPriceInput(targetPrice);
          }}
          onBuy={(p, o) => initiateCheckout(p, o)}
        />
      )}

      {/* Autonomous Agent Buy Directive Modal */}
      <AgentBuyDirectiveModal
        country={selectedCountry.code}
        currency={selectedCountry.currency}
        externalIsOpen={isDirectiveModalOpen}
        onCloseExternal={() => setIsDirectiveModalOpen(false)}
        onInitiateCheckout={(product, offer) => initiateCheckout(product, offer)}
        onRefreshWatches={fetchTrackingRules}
      />

    </div>
  );
};
