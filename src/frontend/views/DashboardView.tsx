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
} from 'lucide-react';
import { Header } from '../components/Header';
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
import { useSession } from '@/frontend/utils/auth-client';
import { SUPPORTED_COUNTRIES, CountryConfig, DEFAULT_COUNTRY } from '@/backend/contracts/countries';

export const DashboardView: React.FC = () => {
  const { data: session, isPending: isSessionPending } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(DEFAULT_COUNTRY);
  const [query, setQuery] = useState('Sony WH-1000XM5');
  const [budget, setBudget] = useState<string>('30000');
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

  // Required Quick Preset Chips
  const presetChips = [
    { label: 'Sony WH-1000XM5', query: 'Sony WH-1000XM5', budget: '30000', icon: '🎧' },
    { label: 'MacBook Pro M3', query: 'MacBook Pro M3', budget: '175000', icon: '💻' },
    { label: 'Dell XPS 15', query: 'Dell XPS 15', budget: '145000', icon: '💻' },
    { label: 'AirPods Max', query: 'AirPods Max', budget: '55000', icon: '🎧' },
  ];

  const budgetTiers = [
    { label: '≤ ₹30k', val: '30000' },
    { label: '≤ ₹60k', val: '60000' },
    { label: '≤ ₹150k', val: '150000' },
    { label: '≤ ₹200k', val: '200000' },
  ];

  useEffect(() => {
    handleSearch();
    fetchTrackingRules();
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
    // Adjust default budget scale when switching between high-denomination INR and USD/GBP/EUR
    if (newCountry.currency === 'INR' && Number(budget) < 1000) {
      setBudget('30000');
    } else if (newCountry.currency !== 'INR' && Number(budget) > 5000) {
      setBudget('500');
    }
    showBanner(`Localized to ${newCountry.name} (${newCountry.currency})`);
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

  // Unauthenticated users are served the landing page
  if (!isSessionPending && !session) {
    return (
      <>
        <LandingView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  const budgetNum = Number(budget) || 0;
  const budgetProgress = Math.min(100, Math.max(5, (budgetNum / 200000) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {bannerMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-semibold border border-emerald-400/40 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{bannerMessage}</span>
        </div>
      )}

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeWatchesCount={trackingRules.length}
        alertsCount={outboxAlerts.length}
        onRefreshWatches={fetchTrackingRules}
        selectedCountry={selectedCountry}
        onCountryChange={handleCountrySelect}
      />

      {isSessionPending ? (
        <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-200">Verifying Session...</h2>
          <p className="text-slate-400 text-sm mt-1">Checking authentication state with Better Auth</p>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'search' && (
            <div>
              {/* Modernized Search & Filter Command Center */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl mb-8 relative overflow-hidden">
                {/* Subtle Ambient Background Gradient */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100 flex items-center gap-2">
                        <span>Autonomous Deal Radar</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                          AI Scored
                        </span>
                      </h1>
                      <p className="text-slate-400 text-sm mt-1">
                        Crawls verified domestic sources, normalizes multi-merchant offers, and applies rubric deal scoring.
                      </p>
                    </div>

                    {/* Price Range Indicator Pill */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-400 font-medium">Market:</span>
                      <span className="font-extrabold text-emerald-400 font-mono flex items-center gap-1">
                        <span>{selectedCountry.flag}</span>
                        <span>0 — {selectedCountry.symbol}{budgetNum.toLocaleString(selectedCountry.locale)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Search Bar & Budget Control */}
                  <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search Input with Clear Button */}
                    <div className="relative flex-1 group">
                      <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search product or model for ${selectedCountry.name} (${selectedCountry.currency})...`}
                        className="w-full bg-slate-950/90 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all shadow-inner outline-none font-medium"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />

                      {/* Clear Button */}
                      {query.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuery('');
                          }}
                          className="absolute right-3.5 top-3.5 p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition active:scale-90"
                          title="Clear search input"
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Budget Input & Filter */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-44">
                        <span className="absolute left-3.5 top-3.5 text-xs text-slate-400 font-bold">Max {selectedCountry.symbol}</span>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="Budget"
                          className="w-full bg-slate-950/90 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl pl-16 pr-3 py-3.5 text-sm font-semibold font-mono text-slate-100 transition-all shadow-inner outline-none"
                        />
                      </div>

                      {/* Discover CTA Button */}
                      <button
                        onClick={() => handleSearch()}
                        disabled={loading}
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>Discover Deals</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Price Range Indicator Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold shrink-0">Budget Tiers:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {budgetTiers.map((tier) => (
                          <button
                            key={tier.val}
                            onClick={() => {
                              setBudget(tier.val);
                              handleSearch(query, tier.val);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition active:scale-95 border ${
                              budget === tier.val
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Progress Track */}
                    <div className="flex items-center gap-2.5 w-full md:w-56">
                      <span className="text-[10px] text-slate-500 font-mono">₹0</span>
                      <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                          style={{ width: `${budgetProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        ₹{budgetNum > 1000 ? `${Math.round(budgetNum / 1000)}k` : budgetNum}
                      </span>
                    </div>
                  </div>

                  {/* Required Quick Preset Chips */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Quick Presets:</span>
                    </span>

                    {presetChips.map((chip) => {
                      const isSelected = query.toLowerCase() === chip.query.toLowerCase();
                      return (
                        <button
                          key={chip.label}
                          onClick={() => {
                            setQuery(chip.query);
                            setBudget(chip.budget);
                            handleSearch(chip.query, chip.budget);
                          }}
                          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 border shadow-sm ${
                            isSelected
                              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10'
                              : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span>{chip.icon}</span>
                          <span>{chip.label}</span>
                          <span className={`text-[10px] font-mono ml-0.5 ${isSelected ? 'text-emerald-400 font-bold' : 'text-slate-500 group-hover:text-slate-400'}`}>
                            (≤₹{Number(chip.budget) / 1000}k)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Deal Grid / Cards Header & Toggle */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                      <span>Normalized Deals</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {products.length} found
                      </span>
                    </h2>
                    <span className="text-xs text-slate-400">Deterministic scoring & live inventory verification</span>
                  </div>

                  {products.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                          viewMode === 'cards'
                            ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Cards View</span>
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                          viewMode === 'grid'
                            ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>AG Grid Table</span>
                      </button>
                    </div>
                  )}
                </div>

                {products.length === 0 && !loading && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 backdrop-blur-sm shadow-xl">
                    <p className="text-base font-semibold text-slate-300 mb-1">No deals found matching your query.</p>
                    <p className="text-xs text-slate-500">
                      Try selecting one of the quick presets above: "Sony WH-1000XM5", "MacBook Pro M3", or "AirPods Max".
                    </p>
                  </div>
                )}

                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              onRefresh={fetchTrackingRules}
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
      )}

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

      {/* Autonomous Agent Buy Directive Interface */}
      <AgentBuyDirectiveModal
        country={selectedCountry.code}
        currency={selectedCountry.currency}
        onInitiateCheckout={(product, offer) => initiateCheckout(product, offer)}
        onRefreshWatches={fetchTrackingRules}
      />
    </div>
  );
};
