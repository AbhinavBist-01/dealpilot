'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Lock, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ShoppingBag,
  Store,
  Star,
  Activity,
  Cpu,
  Filter,
  Bell,
  Check,
  ArrowUpRight,
  RefreshCw,
  Server,
  Shield
} from 'lucide-react';
import { signIn } from '@/frontend/utils/auth-client';

interface LandingViewProps {
  onOpenAuthModal: () => void;
}

interface DemoProduct {
  id: string;
  name: string;
  category: string;
  msrp: number;
  targetPrice: number;
  currentLowest: number;
  currency: string;
  dropPercent: number;
  points: { day: string; price: number; note?: string }[];
  merchants: {
    name: string;
    domain: string;
    price: number;
    rating: number;
    reviews: number;
    stock: string;
    badge?: string;
    isLowest?: boolean;
    color: string;
  }[];
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'sony-wh1000xm5',
    name: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    category: 'Audio & Premium Electronics',
    msrp: 29990,
    targetPrice: 22000,
    currentLowest: 19990,
    currency: '₹',
    dropPercent: 33,
    points: [
      { day: 'Oct 14', price: 29990, note: 'MSRP Catalog Ingest' },
      { day: 'Oct 16', price: 27499, note: 'Mid-week Promo' },
      { day: 'Oct 18', price: 25990 },
      { day: 'Oct 19', price: 23500, note: 'Near Target (Escalating Polling to 30m)' },
      { day: 'Oct 20', price: 22000, note: 'Target Hit Threshold' },
      { day: 'Today', price: 19990, note: 'Flash Drop (Amazon Verified Offer)' },
    ],
    merchants: [
      {
        name: 'Amazon',
        domain: 'amazon.com',
        price: 19990,
        rating: 4.8,
        reviews: 18420,
        stock: 'In Stock (Direct Sold by Amazon)',
        badge: 'Lowest Price',
        isLowest: true,
        color: 'emerald'
      },
      {
        name: 'Best Buy',
        domain: 'bestbuy.com',
        price: 21999,
        rating: 4.7,
        reviews: 6310,
        stock: 'In Stock (Curbside Pick-up)',
        badge: 'Official Retailer',
        color: 'sky'
      },
      {
        name: "Macy's",
        domain: 'macys.com',
        price: 24499,
        rating: 4.6,
        reviews: 2180,
        stock: 'Low Stock: 4 units remaining',
        badge: 'Promo Eligible',
        color: 'purple'
      }
    ]
  },
  {
    id: 'apple-airpods-max',
    name: 'Apple AirPods Max Wireless Over-Ear Headphones (Space Gray)',
    category: 'Personal Audio',
    msrp: 59900,
    targetPrice: 48000,
    currentLowest: 44990,
    currency: '₹',
    dropPercent: 25,
    points: [
      { day: 'Oct 14', price: 59900 },
      { day: 'Oct 16', price: 56900 },
      { day: 'Oct 18', price: 52000 },
      { day: 'Oct 19', price: 49500, note: 'Pre-sale Drop' },
      { day: 'Oct 20', price: 47990, note: 'Target Hit' },
      { day: 'Today', price: 44990, note: 'All-Time Record Low' },
    ],
    merchants: [
      {
        name: 'Amazon',
        domain: 'amazon.com',
        price: 44990,
        rating: 4.9,
        reviews: 24150,
        stock: 'In Stock (Prime Next-Day)',
        badge: 'Lowest Price',
        isLowest: true,
        color: 'emerald'
      },
      {
        name: 'Best Buy',
        domain: 'bestbuy.com',
        price: 47999,
        rating: 4.8,
        reviews: 8900,
        stock: 'In Stock (Store Pickup)',
        badge: 'Price Match',
        color: 'sky'
      },
      {
        name: "Macy's",
        domain: 'macys.com',
        price: 54990,
        rating: 4.5,
        reviews: 1420,
        stock: 'In Stock',
        badge: 'Member Exclusive',
        color: 'purple'
      }
    ]
  },
  {
    id: 'bose-qc-ultra',
    name: 'Bose QuietComfort Ultra Noise Cancelling Headphones',
    category: 'Flagship Audio',
    msrp: 35900,
    targetPrice: 28000,
    currentLowest: 24999,
    currency: '₹',
    dropPercent: 30,
    points: [
      { day: 'Oct 14', price: 35900 },
      { day: 'Oct 16', price: 33990 },
      { day: 'Oct 18', price: 30500 },
      { day: 'Oct 19', price: 28900 },
      { day: 'Oct 20', price: 27999, note: 'Target Reached' },
      { day: 'Today', price: 24999, note: 'Best Buy Flash Deal' },
    ],
    merchants: [
      {
        name: 'Best Buy',
        domain: 'bestbuy.com',
        price: 24999,
        rating: 4.8,
        reviews: 5200,
        stock: 'In Stock (Same-Day Delivery)',
        badge: 'Lowest Price',
        isLowest: true,
        color: 'emerald'
      },
      {
        name: 'Amazon',
        domain: 'amazon.com',
        price: 26490,
        rating: 4.7,
        reviews: 11840,
        stock: 'In Stock (Direct Prime)',
        badge: 'Verified Merchant',
        color: 'sky'
      },
      {
        name: "Macy's",
        domain: 'macys.com',
        price: 31990,
        rating: 4.6,
        reviews: 950,
        stock: 'In Stock',
        badge: 'Standard Delivery',
        color: 'purple'
      }
    ]
  }
];

export const LandingView: React.FC<LandingViewProps> = ({ onOpenAuthModal }) => {
  const [authLoading, setAuthLoading] = useState<string | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'monitoring' | 'intent' | 'paypal' | 'outbox'>('monitoring');

  const product = DEMO_PRODUCTS[selectedProductIndex];

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setAuthLoading(provider);
      await (signIn as any).social({
        provider,
        callbackURL: '/',
      });
    } catch {
      setAuthLoading(null);
    }
  };

  // SVG Chart calculation helpers
  const chartHeight = 160;
  const chartWidth = 540;
  const paddingX = 40;
  const paddingY = 24;

  const minPrice = useMemo(() => {
    const prices = product.points.map(p => p.price);
    return Math.min(...prices, product.targetPrice) * 0.95;
  }, [product]);

  const maxPrice = useMemo(() => {
    const prices = product.points.map(p => p.price);
    return Math.max(...prices, product.targetPrice) * 1.05;
  }, [product]);

  const pointsCoordinates = useMemo(() => {
    const total = product.points.length;
    return product.points.map((p, i) => {
      const x = paddingX + (i / (total - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - ((p.price - minPrice) / (maxPrice - minPrice)) * (chartHeight - paddingY * 2);
      return { x, y, price: p.price, day: p.day, note: p.note };
    });
  }, [product, minPrice, maxPrice]);

  const targetLineY = useMemo(() => {
    return chartHeight - paddingY - ((product.targetPrice - minPrice) / (maxPrice - minPrice)) * (chartHeight - paddingY * 2);
  }, [product, minPrice, maxPrice]);

  // Construct smooth bezier SVG path
  const svgPathD = useMemo(() => {
    if (pointsCoordinates.length === 0) return '';
    let d = `M ${pointsCoordinates[0].x} ${pointsCoordinates[0].y}`;
    for (let i = 0; i < pointsCoordinates.length - 1; i++) {
      const current = pointsCoordinates[i];
      const next = pointsCoordinates[i + 1];
      const cx = (current.x + next.x) / 2;
      d += ` C ${cx} ${current.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  }, [pointsCoordinates]);

  // Closed path for subtle gradient fill under the curve
  const areaPathD = useMemo(() => {
    if (pointsCoordinates.length === 0) return '';
    const last = pointsCoordinates[pointsCoordinates.length - 1];
    const first = pointsCoordinates[0];
    const bottom = chartHeight - paddingY;
    return `${svgPathD} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
  }, [svgPathD, pointsCoordinates]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-hidden font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-emerald-500/12 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 left-[-10%] w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-[-10%] w-[550px] h-[550px] bg-sky-500/5 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Modern High-Precision Top Nav */}
      <header className="border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/30">
              ✈
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">DealPilot</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Autonomous Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              <span>Channel3 API</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition rounded-xl hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700"
            >
              Sign In
            </button>
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <span>Launch Agent</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center relative">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300 mb-8 backdrop-blur shadow-inner shadow-emerald-500/5 hover:border-emerald-500/50 transition">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium text-slate-200">Autonomous Deal-Hunting & Multi-Merchant Telemetry</span>
          <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/15 px-2 py-0.5 rounded-full">v2.4 Active</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08] mb-6">
          Never Overpay. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            Let the Autonomous Agent Pilot Your Deals.
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          DealPilot streams real domestic merchant catalog data, filters junk accessories deterministically, monitors prices via adaptive BullMQ workers, and initiates PayPal checkouts the exact second target thresholds are met.
        </p>

        {/* Primary CTA Area */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-16">
          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all rounded-xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <span>Launch Deal Dashboard</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleOAuth('google')}
              disabled={authLoading !== null}
              className="flex-1 sm:flex-initial px-4 py-3.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-emerald-500/10 active:scale-[0.98]"
              title="Quick Sign in with Google"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>
            <button
              onClick={() => handleOAuth('github')}
              disabled={authLoading !== null}
              className="flex-1 sm:flex-initial px-4 py-3.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-emerald-500/10 active:scale-[0.98]"
              title="Quick Sign in with GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            FEATURE 1: INTERACTIVE LIVE TELEMETRY PREVIEW MOCKUP
        ═══════════════════════════════════════════════════════════════ */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-2xl p-4 sm:p-7 shadow-2xl shadow-emerald-950/30 text-left relative ring-1 ring-slate-800/80">
          {/* Mockup Frame Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 ring-2 ring-rose-500/20" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 ring-2 ring-amber-500/20" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 ring-2 ring-emerald-500/20" />
              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
              <span className="font-mono text-[11px] text-slate-400 hidden sm:inline-block">
                dealpilot://telemetry/live-monitor/stream-01
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                <Activity className="w-3 h-3 animate-spin text-emerald-400" />
                Adaptive Poller Active
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/90 text-slate-300 font-mono text-[11px]">
                <Lock className="w-3 h-3 text-emerald-400" />
                Zero-Trust Preflight
              </span>
            </div>
          </div>

          {/* Interactive SKU Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Tracked SKU:
            </span>
            {DEMO_PRODUCTS.map((prod, idx) => (
              <button
                key={prod.id}
                onClick={() => setSelectedProductIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-2 ${
                  selectedProductIndex === idx
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-950/60 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{prod.name.split(' ')[0]} {prod.name.split(' ')[1]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  selectedProductIndex === idx ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  -{prod.dropPercent}%
                </span>
              </button>
            ))}
          </div>

          {/* Product Header & Live Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mb-1">
                <span>{product.category}</span>
                <span>•</span>
                <span className="text-slate-500">Universal Catalog Ingestion</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mb-2">
                {product.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {product.currency}{product.currentLowest.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 line-through">
                  MSRP {product.currency}{product.msrp.toLocaleString()}
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Save {product.dropPercent}% ({product.currency}{(product.msrp - product.currentLowest).toLocaleString()})</span>
                </div>
              </div>
            </div>

            {/* Quick Status KPI Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                  <span>Target Threshold</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </div>
                <div className="text-base font-bold text-teal-300 font-mono">
                  {product.currency}{product.targetPrice.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                  ✓ Target Triggered ({product.currency}{(product.targetPrice - product.currentLowest).toLocaleString()} lower)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                  <span>Adaptive Polling</span>
                  <Activity className="w-3 h-3 text-sky-400" />
                </div>
                <div className="text-base font-bold text-sky-300 font-mono">
                  30 mins
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Escalated from 120m (near target)
                </div>
              </div>
            </div>
          </div>

          {/* Real-time SVG Price Curve & Trajectory Chart */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 mb-6 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Live Price Observation Trajectory (Bezier Interpolation)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
                  Live Price
                </span>
                <span className="flex items-center gap-1 ml-2">
                  <span className="w-2.5 h-0.5 bg-dashed border-t border-teal-400/80 inline-block" />
                  Target Trigger
                </span>
              </div>
            </div>

            {/* Interactive SVG Viewport */}
            <div className="w-full overflow-x-auto">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-44 select-none overflow-visible"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                {/* Target Price Threshold Line */}
                <line 
                  x1={paddingX} 
                  y1={targetLineY} 
                  x2={chartWidth - paddingX} 
                  y2={targetLineY} 
                  stroke="#2dd4bf" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                  strokeOpacity="0.7"
                />
                <text 
                  x={chartWidth - paddingX + 6} 
                  y={targetLineY + 3} 
                  fill="#2dd4bf" 
                  fontSize="9" 
                  fontFamily="monospace"
                >
                  Target {product.currency}{product.targetPrice.toLocaleString()}
                </text>

                {/* Subtle horizontal grid lines */}
                <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#334155" strokeWidth="0.5" strokeDasharray="2 4" strokeOpacity="0.4" />
                <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />

                {/* Area under curve */}
                <path d={areaPathD} fill="url(#areaGradient)" />

                {/* Spline path */}
                <path d={svgPathD} fill="none" stroke="url(#strokeGradient)" strokeWidth="3" strokeLinecap="round" />

                {/* Data Points */}
                {pointsCoordinates.map((pt, i) => {
                  const isHovered = hoveredPointIndex === i;
                  const isCurrent = i === pointsCoordinates.length - 1;

                  return (
                    <g 
                      key={i} 
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPointIndex(i)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    >
                      {/* Pulse circle on the current latest drop point */}
                      {isCurrent && (
                        <circle cx={pt.x} cy={pt.y} r="8" fill="#10b981" opacity="0.3" className="animate-ping" />
                      )}
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r={isHovered ? 6 : isCurrent ? 5 : 3.5} 
                        fill={isCurrent ? '#10b981' : '#0f172a'} 
                        stroke="#10b981" 
                        strokeWidth={isHovered ? 2.5 : 2} 
                        className="transition-all"
                      />
                      {/* Day Label */}
                      <text 
                        x={pt.x} 
                        y={chartHeight - 6} 
                        textAnchor="middle" 
                        fill="#64748b" 
                        fontSize="9"
                        fontFamily="sans-serif"
                      >
                        {pt.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hovered point telemetry tooltip */}
            <div className="mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Inspecting point:</span>
                <span className="font-semibold text-white">
                  {hoveredPointIndex !== null 
                    ? `${pointsCoordinates[hoveredPointIndex].day} — ${product.currency}${pointsCoordinates[hoveredPointIndex].price.toLocaleString()}`
                    : `Today — ${product.currency}${product.currentLowest.toLocaleString()} (All-Time Low)`}
                </span>
                {hoveredPointIndex !== null && pointsCoordinates[hoveredPointIndex].note && (
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {pointsCoordinates[hoveredPointIndex].note}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block font-mono">
                Observation: Verified Channel3 Catalog Stream
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              VERIFIED MERCHANT CARDS (Amazon, Best Buy, Macy's)
          ═══════════════════════════════════════════════════════════════ */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Multi-Merchant Real-Time Offers (Original Merchant Domains)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Sorted deterministically by normalized price
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {product.merchants.map((merchant) => {
                const diff = merchant.price - product.currentLowest;
                return (
                  <div 
                    key={merchant.name}
                    className={`p-4 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                      merchant.isLowest 
                        ? 'bg-gradient-to-b from-emerald-950/30 to-slate-950/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Card Header: Store + Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            merchant.name === 'Amazon' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                            merchant.name === 'Best Buy' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' :
                            'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            {merchant.name[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                              {merchant.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {merchant.domain}
                            </div>
                          </div>
                        </div>

                        {merchant.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            merchant.isLowest 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {merchant.badge}
                          </span>
                        )}
                      </div>

                      {/* Price & Spread */}
                      <div className="mb-2">
                        <div className="text-xl font-black text-white">
                          {product.currency}{merchant.price.toLocaleString()}
                        </div>
                        <div className="text-[11px] font-medium">
                          {merchant.isLowest ? (
                            <span className="text-emerald-400">★ Lowest Verified Offer across catalogs</span>
                          ) : (
                            <span className="text-slate-400">+{product.currency}{diff.toLocaleString()} vs lowest offer</span>
                          )}
                        </div>
                      </div>

                      {/* Stock & Rating */}
                      <div className="space-y-1 text-[11px] text-slate-400 mb-4 pt-2 border-t border-slate-800/60">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{merchant.stock}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          <span>{merchant.rating} ({merchant.reviews.toLocaleString()} reviews)</span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={onOpenAuthModal}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        merchant.isLowest
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{merchant.isLowest ? 'Automate Checkout' : 'Monitor Offer'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURE 2: INTERACTIVE FEATURE TABS & SUBSYSTEM SHOWCASE
      ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autonomous Agent Core Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Precision & Zero Surprises
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            Click through DealPilot's four core subsystems to preview the deterministic pipeline.
          </p>
        </div>

        {/* Feature Tab Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-4xl mx-auto">
          {[
            { id: 'monitoring', label: 'Adaptive BullMQ Poller', icon: Activity, tag: 'Background Workers' },
            { id: 'intent', label: 'Intent Guard & Verifier', icon: ShieldCheck, tag: 'Anti-Noise AI' },
            { id: 'paypal', label: 'PayPal Agent Toolkit', icon: Zap, tag: 'Orders v2' },
            { id: 'outbox', label: 'Transactional Outbox', icon: Bell, tag: 'Guaranteed Alerts' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFeatureTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFeatureTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 border border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/70 hover:bg-slate-900/90 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  {tab.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Feature Tab Details Card */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
          {activeFeatureTab === 'monitoring' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Subsystem 01: Adaptive Poller</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  BullMQ Background Workers with Dynamic Jitter
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                  Default 2-hour monitoring cycles dynamically escalate to 30-minute intervals as soon as prices get within 5% of your target threshold.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>PostgreSQL 16 & Redis 7 containerized persistence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Deterministic jitter backoff prevents retailer IP rate-limits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Automatic price drift tracking and statistical aggregate generation</span>
                  </li>
                </ul>
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <span>Configure Custom Polling Rules</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2 shadow-inner">
                <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>worker.telemetry.log</span>
                  <span className="text-emerald-400">● LIVE RUNNING</span>
                </div>
                <div className="text-slate-400">[00:12:04] Rule #419: Target ₹22,000 | Current ₹22,890</div>
                <div className="text-amber-400">[00:12:05] SPREAD_DELTA: 3.8% &lt; 5% threshold</div>
                <div className="text-teal-400">[00:12:05] ADAPTIVE_ESCALATION: Polling 120m → 30m</div>
                <div className="text-emerald-400">[00:42:05] TARGET_HIT: Offer #8812 drops to ₹19,990</div>
                <div className="text-slate-300">[00:42:06] Outbox notification enqueued (atomic DB write)</div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'intent' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Subsystem 02: Intent Guard & Verifier</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Accessory Junk & Refurbished Filter
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                  Never be tricked by a $14 silicone sleeve or replacement cable when searching for a $350 pair of noise-canceling headphones.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Exact model token relevance extractor</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Discards cases, cables, cushions, and mismatched variants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Condition checks: New vs Certified Refurbished vs Pre-owned</span>
                  </li>
                </ul>
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <span>Explore Search Verifier</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2.5 shadow-inner">
                <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>verifier.spec.guard</span>
                  <span className="text-emerald-400">● PASS RATIO 99.4%</span>
                </div>
                <div className="p-2 rounded bg-rose-950/30 border border-rose-900/40 text-rose-300">
                  ✕ REJECTED: "Silicone Case for Sony WH-1000XM5" (Token Match: Accessory)
                </div>
                <div className="p-2 rounded bg-rose-950/30 border border-rose-900/40 text-rose-300">
                  ✕ REJECTED: "WH-1000XM4 Pre-Owned" (Condition: Used, Refurbished)
                </div>
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">
                  ✓ VERIFIED: "Sony WH-1000XM5 Black (Brand New)" (Relevance: 0.98)
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'paypal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Subsystem 03: PayPal Agent Toolkit</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Pre-Flight Price Revalidation Gatekeeper
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                  Integrated with official `@paypal/agent-toolkit/openai` (`create_order`, `get_order`, `pay_order`). Live revalidation guarantees no unexpected price shifts or out-of-stock checkouts.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Server-side capture verification (prevents client-side spoofing)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographic Idempotency-Key headers prevent double-captures</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Interactive natural-language shopping assistant chat interface</span>
                  </li>
                </ul>
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <span>Test PayPal Sandbox</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2 shadow-inner">
                <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>paypal.preflight.audit</span>
                  <span className="text-sky-400">● 256-BIT TLS</span>
                </div>
                <div className="text-slate-400">[REVALIDATION] Querying live merchant stock...</div>
                <div className="text-emerald-400">[IN_STOCK] Merchant confirmed 12 units available</div>
                <div className="text-emerald-400">[PRICE_VERIFIED] Live: ₹19,990 == Cached: ₹19,990</div>
                <div className="text-sky-300">[SANDBOX_ORDER] Created: 9DL4920401019</div>
                <div className="text-slate-400">[CAPTURE] Idempotency Key verified • Charge cleared</div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'outbox' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Subsystem 04: Transactional Outbox</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Zero Duplicate Price-Drop Dispatches
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                  Alerts are committed atomically within the same database transaction as the price observation. Dedicated outbox workers dispatch responsive dark-quartz HTML emails with SHA-256 deduplication.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Deduplication key format: `rule + offer + event + obs`</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Resilient against network drops and worker restarts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>HTML email previews and one-click purchase links</span>
                  </li>
                </ul>
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <span>Preview Alert Templates</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2 shadow-inner">
                <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>outbox.dispatcher.queue</span>
                  <span className="text-purple-400">● DEDUPED</span>
                </div>
                <div className="text-slate-400">DedupKey: rule_81:off_33:drop_33:obs_910</div>
                <div className="text-teal-400">[EMAIL_DISPATCH] Template: dark-quartz-alert.html</div>
                <div className="text-emerald-400">[SMTP_STATUS] Delivered to user session email</div>
                <div className="text-slate-400">[DUPLICATE_CHECK] Repeated job ignored (Idempotent)</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM CTA & REPUTATION BANNER
      ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-emerald-500/25 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Ready to Put Deal-Hunting on Autopilot?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Deploy your personal agent in under 30 seconds. Stream live domestic retailer offers, set price alerts, and test autonomous checkout.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAuthModal}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenAuthModal}
              className="w-full sm:w-auto px-6 py-3.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition"
            >
              Explore Interactive Demo
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800/80 py-10 text-center bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">DealPilot</span>
            <span>—</span>
            <span>Autonomous Commerce Engine</span>
            <span>•</span>
            <span className="text-emerald-500/80">Next.js 16 & React 19</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={onOpenAuthModal} className="hover:text-slate-300 transition">
              Sign In
            </button>
            <button onClick={onOpenAuthModal} className="hover:text-emerald-400 font-semibold transition">
              Deploy Agent →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
