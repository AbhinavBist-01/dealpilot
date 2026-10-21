'use client';

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Sparkles, LayoutGrid, Table, Shield, LogIn, Lock } from 'lucide-react';
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
import { useSession, signIn } from '@/frontend/utils/auth-client';

export const DashboardView: React.FC = () => {
  const { data: session, isPending: isSessionPending } = useSession();
  const [query, setQuery] = useState('headphones');
  const [budget, setBudget] = useState<string>('20000');
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {bannerMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4" />
          <span>{bannerMessage}</span>
        </div>
      )}

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeWatchesCount={trackingRules.length}
        alertsCount={outboxAlerts.length}
        onRefreshWatches={fetchTrackingRules}
      />

      {/* Authentication Guard: Only authenticated users can access the dealpilot dashboard */}
      {isSessionPending ? (
        <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-200">Verifying Session...</h2>
          <p className="text-slate-400 text-sm mt-1">Checking authentication state with Better Auth</p>
        </div>
      ) : !session ? (
        <div className="max-w-xl mx-auto px-4 py-20">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center backdrop-blur relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Sign in to Access DealPilot</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              DealPilot is an autonomous deal-hunting and price-monitoring agent. Sign in with Google or GitHub to search verified deals, set background watches, and execute autonomous PayPal transactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => (signIn as any).social({ provider: 'google', callbackURL: '/' })}
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition shadow-sm hover:border-slate-600"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>
              <button
                onClick={() => (signIn as any).social({ provider: 'github', callbackURL: '/' })}
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition shadow-sm hover:border-slate-600"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>
            </div>
          </div>
        </div>
      ) : (
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'search' && (
          <div>
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

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-300">
                    Normalized Deals ({products.length} found)
                  </h2>
                  <span className="text-xs text-slate-500">Deterministic scoring & live inventory</span>
                </div>

                {products.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        viewMode === 'cards'
                          ? 'bg-slate-800 text-emerald-400 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Cards</span>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        viewMode === 'grid'
                          ? 'bg-slate-800 text-emerald-400 shadow'
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                  No deals found matching your query. Try searching for "Headphones" or "Sony".
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
          <WatchesList rules={trackingRules} onRefresh={fetchTrackingRules} />
        )}

        {activeTab === 'alerts' && (
          <OutboxAlertsList alerts={outboxAlerts} onRefresh={fetchTrackingRules} />
        )}

        {activeTab === 'paypal' && (
          <PayPalChatInterface />
        )}

        {activeTab === 'simulation' && (
          <TestLabPanel onSimulate={runSimulation} />
        )}
      </main>
      )}

      {historyModalProductId && (
        <PriceHistoryModal
          productId={historyModalProductId}
          onClose={() => setHistoryModalProductId(null)}
          onTrack={(p, targetPrice) => {
            setTrackModalProduct(p);
            setTargetPriceInput(targetPrice);
          }}
          onBuy={(p, o) => initiateCheckout(p, o)}
        />
      )}

      {trackModalProduct && (
        <TrackingModal
          product={trackModalProduct}
          targetPrice={targetPriceInput}
          setTargetPrice={setTargetPriceInput}
          onConfirm={createTrackingRule}
          onClose={() => setTrackModalProduct(null)}
        />
      )}

      {checkoutOffer && (
        <PayPalModal
          step={checkoutStep}
          product={checkoutProduct}
          order={createdOrder}
          error={checkoutError}
          onAuthorize={confirmPayPalCapture}
          onClose={() => setCheckoutOffer(null)}
        />
      )}
    </div>
  );
};
