'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  TrendingDown,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Zap,
  Sliders,
  DollarSign
} from 'lucide-react';

interface DealProduct {
  id: string;
  title: string;
  brand: string;
  category: string;
  imageUrl?: string;
  offers: Array<{
    id: string;
    sourceId: string;
    sellerName: string;
    isAuthorizedSeller: boolean;
    totalPrice: number;
    currency: string;
    availabilityStatus: string;
    freshnessStatus: string;
    evaluations: Array<{
      score: number;
      recommendation: string;
      confidenceLevel: string;
      explanation: string;
      signalsJson: string;
    }>;
  }>;
}

interface TrackingRule {
  id: string;
  targetPrice: number;
  strategy: string;
  status: string;
  nextCheckAt: string;
  pollingPolicy: string;
  product: {
    title: string;
  };
}

export default function Home() {
  const [query, setQuery] = useState('headphones');
  const [budget, setBudget] = useState<string>('20000');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<DealProduct[]>([]);
  const [trackingRules, setTrackingRules] = useState<TrackingRule[]>([]);
  const [outboxAlerts, setOutboxAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'watches' | 'alerts' | 'simulation'>('search');

  // Tracking Modal State
  const [trackModalProduct, setTrackModalProduct] = useState<DealProduct | null>(null);
  const [targetPriceInput, setTargetPriceInput] = useState<number>(18000);

  // Checkout Modal State
  const [checkoutOffer, setCheckoutOffer] = useState<any | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<DealProduct | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'paypal_sandbox' | 'completed' | 'error'>('review');
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Status banners
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    handleSearch();
    fetchTrackingRules();
  }, []);

  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 4000);
  };

  const handleSearch = async (overrideQuery?: string, overrideBudget?: string) => {
    setLoading(true);
    const q = overrideQuery !== undefined ? overrideQuery : query;
    const b = overrideBudget !== undefined ? overrideBudget : budget;

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          budget: b ? parseFloat(b) : undefined,
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

  const initiateCheckout = async (product: DealProduct, offer: any) => {
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

  // Simulations
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Banner Message */}
      {bannerMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
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
                activeTab === 'search' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deal Search
            </button>
            <button
              onClick={() => { setActiveTab('watches'); fetchTrackingRules(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'watches' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Active Watches ({trackingRules.length})
            </button>
            <button
              onClick={() => { setActiveTab('alerts'); fetchTrackingRules(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'alerts' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-4 h-4" />
              Outbox Alerts ({outboxAlerts.length})
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === 'simulation' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Test Lab
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* TAB 1: Search & Discovery */}
        {activeTab === 'search' && (
          <div>
            {/* Search Input Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
              <h1 className="text-2xl font-bold mb-2">Find the Best Deals Deterministically</h1>
              <p className="text-slate-400 text-sm mb-6">
                DealPilot crawls verified sources, evaluates deal ratings from historical observations, and triggers automated background monitoring.
              </p>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search query (e.g. 'I want the best headphones under 20K', 'Sony XM5', 'Dell XPS')"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-40">
                    <span className="absolute left-3 top-3 text-xs text-slate-500 font-semibold">Max ₹</span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Budget"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-14 pr-3 py-3 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => handleSearch()}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Discover</span>
                  </button>
                </div>
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                <span className="text-slate-500">Popular queries:</span>
                <button
                  onClick={() => { setQuery('headphones'); setBudget('20000'); handleSearch('headphones', '20000'); }}
                  className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-slate-300"
                >
                  🎧 Headphones under ₹20,000
                </button>
                <button
                  onClick={() => { setQuery('Sony WH-1000XM5'); setBudget('20000'); handleSearch('Sony WH-1000XM5', '20000'); }}
                  className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-slate-300"
                >
                  ⚡ Sony WH-1000XM5
                </button>
                <button
                  onClick={() => { setQuery('Bose'); setBudget('25000'); handleSearch('Bose', '25000'); }}
                  className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-slate-300"
                >
                  🎵 Bose QuietComfort
                </button>
                <button
                  onClick={() => { setQuery('Monitor'); setBudget('30000'); handleSearch('Monitor', '30000'); }}
                  className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-slate-300"
                >
                  🖥️ Gaming Monitor under ₹30,000
                </button>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-300">
                  Normalized Deals ({products.length} found)
                </h2>
                <span className="text-xs text-slate-500">Deterministic scoring & live inventory</span>
              </div>

              {products.length === 0 && !loading && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                  No deals found matching your query. Try searching for "Headphones" or "Sony".
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const offer = product.offers[0];
                  const evalData = offer?.evaluations[0];
                  const score = evalData?.score || 75;

                  let scoreBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                  if (score < 50) scoreBadgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
                  else if (score < 75) scoreBadgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';

                  return (
                    <div
                      key={product.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
                    >
                      {/* Product Card Top */}
                      <div>
                        {product.imageUrl && (
                          <div className="h-48 w-full bg-slate-950 relative overflow-hidden">
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-500"
                            />
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur ${scoreBadgeColor}`}>
                                Deal Score: {score}/100
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-3">
                              <span className="bg-slate-950/80 backdrop-blur text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-800">
                                {product.brand} · {product.category}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-5">
                          <h3 className="font-bold text-base line-clamp-2 text-slate-100 mb-2">
                            {product.title}
                          </h3>

                          {/* Price & Seller */}
                          <div className="flex items-baseline justify-between mb-3">
                            <div>
                              <div className="text-2xl font-black text-emerald-400">
                                ₹{offer?.totalPrice.toLocaleString()}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                {offer?.isAuthorizedSeller && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />}
                                <span>Sold by {offer?.sellerName}</span>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              {offer?.availabilityStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>

                          {/* AI & Rubric Explanation */}
                          {evalData?.explanation && (
                            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 mb-4">
                              <div className="flex items-center gap-1 text-emerald-400 font-semibold mb-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Agent Evaluation:</span>
                              </div>
                              <p className="line-clamp-2">{evalData.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setTrackModalProduct(product);
                            setTargetPriceInput(Math.round((offer?.totalPrice || 20000) * 0.9));
                          }}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                        >
                          <Bell className="w-3.5 h-3.5 text-amber-400" />
                          <span>Track Price</span>
                        </button>

                        <button
                          onClick={() => initiateCheckout(product, offer)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Active Watches & Polling Status */}
        {activeTab === 'watches' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Active Tracking Rules & Adaptive Polling</h2>
                <p className="text-slate-400 text-xs">
                  Background BullMQ workers check these prices on dynamic cadences (2h normal, 30m when near target).
                </p>
              </div>
              <button
                onClick={fetchTrackingRules}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {trackingRules.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No active tracking rules. Search for a product and click "Track Price" to set one!
              </div>
            ) : (
              <div className="space-y-3">
                {trackingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-200">
                        {rule.product.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Target: <strong className="text-emerald-400">₹{rule.targetPrice.toLocaleString()}</strong></span>
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
                        Next check: {new Date(rule.nextCheckAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Outbox Alerts */}
        {activeTab === 'alerts' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Price Drop Outbox & Deduplicated Alerts</h2>
                <p className="text-slate-400 text-xs">
                  Alerts persisted using the transactional outbox pattern to guarantee zero lost notifications.
                </p>
              </div>
              <button
                onClick={fetchTrackingRules}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {outboxAlerts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No alerts fired yet. Once a monitored item drops to or below target, notifications appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {outboxAlerts.map((alert) => {
                  let payload: any = {};
                  try { payload = JSON.parse(alert.payload); } catch {}
                  return (
                    <div
                      key={alert.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold text-sm text-slate-200">
                            {payload.productTitle || 'Price Target Achieved'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Observed Price: <strong className="text-emerald-400">₹{payload.observedPrice}</strong> (Target: ₹{payload.targetPrice})
                        </p>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          Deduplication Key: {alert.deduplicationKey}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {alert.status.toUpperCase()}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Test Lab & Simulation */}
        {activeTab === 'simulation' && (
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
                  onClick={() => runSimulation('drop_price')}
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
                  onClick={() => runSimulation('run_monitor_now')}
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
                  onClick={() => runSimulation('toggle_stock')}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-semibold py-2 px-3 rounded-lg text-xs transition"
                >
                  Set to Out of Stock
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Create Tracking Rule */}
      {trackModalProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Track Price with DealPilot</h3>
            <p className="text-xs text-slate-400 mb-4">
              We'll monitor <strong>{trackModalProduct.title}</strong> in the background and notify you the moment it hits your target.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Target Price (₹)
                </label>
                <input
                  type="number"
                  value={targetPriceInput}
                  onChange={(e) => setTargetPriceInput(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span className="text-emerald-400 font-semibold">Adaptive Polling: </span>
                Monitors every 2 hours; switches to every 30 mins when price is within 5% of your target.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTrackModalProduct(null)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={createTrackingRule}
                className="w-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20"
              >
                Confirm & Track
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Pre-Flight Checkout & PayPal Sandbox */}
      {checkoutOffer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {checkoutStep === 'paypal_sandbox' && (
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold text-lg">PayPal</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                      SANDBOX
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Pre-flight Verified ✓</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="text-xs text-slate-400">
                    Order ID: <code className="text-slate-300 font-mono">{createdOrder?.paypalOrderId}</code>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    {checkoutProduct?.title}
                  </div>
                  <div className="flex items-center justify-between text-base font-bold bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span>Total Amount</span>
                    <span className="text-emerald-400">₹{createdOrder?.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCheckoutOffer(null)}
                    className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPayPalCapture}
                    className="w-1/2 bg-[#0070ba] hover:bg-[#005ea6] text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Authorize & Pay</span>
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 'completed' && (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-100 mb-1">Purchase Verified & Recorded!</h3>
                <p className="text-xs text-slate-400 mb-6">
                  PayPal transaction captured and verified server-to-server.
                </p>
                <button
                  onClick={() => setCheckoutOffer(null)}
                  className="bg-emerald-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            )}

            {checkoutStep === 'error' && (
              <div className="text-center py-4">
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-100 mb-1">Pre-Flight Revalidation Guard</h3>
                <p className="text-xs text-rose-300 mb-6">{checkoutError}</p>
                <button
                  onClick={() => setCheckoutOffer(null)}
                  className="bg-slate-800 text-slate-200 font-semibold px-6 py-2.5 rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
