'use client';

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Sparkles, LayoutGrid, Table } from 'lucide-react';
import { Header } from '../components/Header';
import { DealCard } from '../components/DealCard';
import { DealGrid } from '../components/DealGrid';
import { WatchesList } from '../components/WatchesList';
import { OutboxAlertsList } from '../components/OutboxAlertsList';
import { TestLabPanel } from '../components/TestLabPanel';
import { TrackingModal } from '../components/TrackingModal';
import { PayPalModal } from '../components/PayPalModal';
import { PriceHistoryModal } from '../components/PriceHistoryModal';

export const DashboardView: React.FC = () => {
  const [query, setQuery] = useState('headphones');
  const [budget, setBudget] = useState<string>('20000');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [trackingRules, setTrackingRules] = useState<any[]>([]);
  const [outboxAlerts, setOutboxAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'watches' | 'alerts' | 'simulation'>('search');
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

        {activeTab === 'simulation' && (
          <TestLabPanel onSimulate={runSimulation} />
        )}
      </main>

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
