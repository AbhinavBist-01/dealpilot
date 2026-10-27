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
  ShoppingBag,
  Store,
  Star,
  Activity,
  Cpu,
  Bell,
  Check,
  ArrowUpRight,
  RefreshCw,
  Shield,
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Flame,
  CreditCard,
  Mail,
  Sliders,
  DollarSign
} from 'lucide-react';
import { signIn } from '@/frontend/utils/auth-client';

interface LandingViewProps {
  onOpenAuthModal: () => void;
}

interface DemoProduct {
  id: string;
  name: string;
  category: string;
  badge: string;
  icon: string;
  msrp: number;
  targetPrice: number;
  currentLowest: number;
  currency: string;
  dropPercent: number;
  dealScore: number;
  points: { day: string; price: number; note?: string }[];
  merchants: {
    name: string;
    domain: string;
    price: number;
    rating: number;
    reviews: number;
    stock: string;
    deliveryTime?: string;
    badge?: string;
    isLowest?: boolean;
    color: string;
  }[];
}

const VIBRANT_PRODUCTS: DemoProduct[] = [
  {
    id: 'iphone-16-pro',
    name: 'Apple iPhone 16 Pro (128GB, Desert Titanium)',
    category: 'Flagship Smartphone',
    badge: '⚡ Trending Radar',
    icon: '📱',
    msrp: 119900,
    targetPrice: 112000,
    currentLowest: 109900,
    currency: '₹',
    dropPercent: 8.3,
    dealScore: 96,
    points: [
      { day: 'Day 1', price: 119900, note: 'Official Launch MRP' },
      { day: 'Day 3', price: 118499, note: 'Card Discount' },
      { day: 'Day 5', price: 115900 },
      { day: 'Day 7', price: 113500, note: 'Escalating Polling to 30m' },
      { day: 'Day 9', price: 111990, note: 'Target Hit Threshold' },
      { day: 'Live', price: 109900, note: 'Quick Commerce Flash Deal' },
    ],
    merchants: [
      {
        name: 'Blinkit',
        domain: 'blinkit.com',
        price: 109900,
        rating: 4.9,
        reviews: 8420,
        stock: 'In Stock (⚡ 10-Min Delivery)',
        deliveryTime: '10 mins',
        badge: 'Lowest Price',
        isLowest: true,
        color: 'emerald'
      },
      {
        name: 'Amazon India',
        domain: 'amazon.in',
        price: 112999,
        rating: 4.8,
        reviews: 24310,
        stock: 'In Stock (Prime Next-Day)',
        deliveryTime: 'Tomorrow',
        badge: 'Authorized Apple Store',
        color: 'sky'
      },
      {
        name: 'Flipkart',
        domain: 'flipkart.com',
        price: 114900,
        rating: 4.7,
        reviews: 19400,
        stock: 'In Stock (F-Assured)',
        deliveryTime: '2 Days',
        badge: 'Exchange Bonus',
        color: 'blue'
      },
      {
        name: 'Croma',
        domain: 'croma.com',
        price: 119900,
        rating: 4.6,
        reviews: 6200,
        stock: 'Store Pickup Ready',
        deliveryTime: 'Same Day',
        badge: 'Tata Guarantee',
        color: 'purple'
      }
    ]
  },
  {
    id: 'macbook-air-m3',
    name: 'Apple MacBook Air 13" M3 (16GB Unified Memory, 512GB SSD)',
    category: 'Pro Ultrabook',
    badge: '🔥 High Savings',
    icon: '💻',
    msrp: 134900,
    targetPrice: 122000,
    currentLowest: 118990,
    currency: '₹',
    dropPercent: 11.8,
    dealScore: 98,
    points: [
      { day: 'Day 1', price: 134900, note: 'Apple Official Store' },
      { day: 'Day 3', price: 129900 },
      { day: 'Day 5', price: 126500, note: 'Croma Price Match' },
      { day: 'Day 7', price: 123900 },
      { day: 'Day 9', price: 120990, note: 'Target Price Crossed' },
      { day: 'Live', price: 118990, note: 'Reliance Digital Instant Rebate' },
    ],
    merchants: [
      {
        name: 'Reliance Digital',
        domain: 'reliancedigital.in',
        price: 118990,
        rating: 4.8,
        reviews: 5120,
        stock: 'In Stock (Express Delivery)',
        deliveryTime: '3 Hours',
        badge: 'Lowest Price',
        isLowest: true,
        color: 'emerald'
      },
      {
        name: 'Amazon India',
        domain: 'amazon.in',
        price: 122490,
        rating: 4.9,
        reviews: 14200,
        stock: 'In Stock',
        deliveryTime: 'Tomorrow',
        badge: 'Prime Verified',
        color: 'sky'
      },
      {
        name: 'Croma',
        domain: 'croma.com',
        price: 124900,
        rating: 4.7,
        reviews: 8300,
        stock: 'In Stock',
        deliveryTime: 'Same Day',
        badge: 'Store Pickup',
        color: 'purple'
      }
    ]
  },
  {
    id: 'ps5-slim',
    name: 'PlayStation 5 Slim Console (Disc Edition with 1TB SSD)',
    category: 'Next-Gen Gaming',
    badge: '⚡ 11-Min Delivery',
    icon: '🎮',
    msrp: 54990,
    targetPrice: 50000,
    currentLowest: 48990,
    currency: '₹',
    dropPercent: 10.9,
    dealScore: 95,
    points: [
      { day: 'Day 1', price: 54990, note: 'Sony Official Store' },
      { day: 'Day 3', price: 53990 },
      { day: 'Day 5', price: 52490 },
      { day: 'Day 7', price: 50990, note: 'Target Proximity Alert' },
      { day: 'Day 9', price: 49990, note: 'Target Hit' },
      { day: 'Live', price: 48990, note: 'Zepto Quick Drop' },
    ],
    merchants: [
      {
        name: 'Zepto',
        domain: 'zepto.in',
        price: 48990,
        rating: 4.9,
        reviews: 4100,
        stock: 'In Stock (⚡ 11-Min Delivery)',
        deliveryTime: '11 mins',
        badge: 'Lowest Price',
        isLowest: true,
        color: 'emerald'
      },
      {
        name: 'Flipkart',
        domain: 'flipkart.com',
        price: 49990,
        rating: 4.8,
        reviews: 32000,
        stock: 'In Stock (F-Assured)',
        deliveryTime: 'Tomorrow',
        badge: 'Official Distributor',
        color: 'blue'
      },
      {
        name: 'Amazon India',
        domain: 'amazon.in',
        price: 51990,
        rating: 4.8,
        reviews: 28500,
        stock: 'In Stock',
        deliveryTime: 'Tomorrow',
        badge: 'Sony Warranty',
        color: 'sky'
      }
    ]
  },
  {
    id: 'boat-airdopes',
    name: 'boAt Airdopes 141 ANC (32dB Hybrid ANC, 42H Playback)',
    category: 'Audio & Wearables',
    badge: '💥 Super Steal',
    icon: '🎧',
    msrp: 4490,
    targetPrice: 2000,
    currentLowest: 1499,
    currency: '₹',
    dropPercent: 66.6,
    dealScore: 99,
    points: [
      { day: 'Day 1', price: 4490, note: 'Standard MSRP' },
      { day: 'Day 3', price: 2999 },
      { day: 'Day 5', price: 2299 },
      { day: 'Day 7', price: 1899, note: 'Target Price Met' },
      { day: 'Day 9', price: 1699 },
      { day: 'Live', price: 1499, note: 'Swiggy Instamart Blitz' },
    ],
    merchants: [
      {
        name: 'Swiggy Instamart',
        domain: 'swiggy.com/instamart',
        price: 1499,
        rating: 4.8,
        reviews: 12400,
        stock: 'In Stock (⚡ 15-Min Delivery)',
        deliveryTime: '15 mins',
        badge: 'Lowest Price',
        isLowest: true,
        color: 'emerald'
      },
      {
        name: 'Blinkit',
        domain: 'blinkit.com',
        price: 1599,
        rating: 4.8,
        reviews: 9800,
        stock: 'In Stock (⚡ 10-Min Delivery)',
        deliveryTime: '10 mins',
        badge: 'Quick In Stock',
        color: 'amber'
      },
      {
        name: 'Amazon India',
        domain: 'amazon.in',
        price: 1799,
        rating: 4.6,
        reviews: 84000,
        stock: 'In Stock',
        deliveryTime: 'Tomorrow',
        badge: 'Brand Warranty',
        color: 'sky'
      }
    ]
  }
];

export const LandingView: React.FC<LandingViewProps> = ({ onOpenAuthModal }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('iphone-16-pro');
  const [activeDirective, setActiveDirective] = useState<'idle' | 'bought' | 'left'>('idle');

  const activeProduct = useMemo(() => {
    return VIBRANT_PRODUCTS.find((p) => p.id === selectedProductId) || VIBRANT_PRODUCTS[0];
  }, [selectedProductId]);

  const maxPrice = useMemo(() => {
    return Math.max(...activeProduct.points.map((p) => p.price));
  }, [activeProduct]);

  const minPrice = useMemo(() => {
    return Math.min(...activeProduct.points.map((p) => p.price));
  }, [activeProduct]);

  const savingsAmount = activeProduct.msrp - activeProduct.currentLowest;

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 font-sans relative selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      
      {/* Dynamic Ambient Neon Lights (Inspired by vibrant.design) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[30%] -left-48 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-[160px] rounded-full" />
        <div className="absolute top-[60%] -right-48 w-[650px] h-[650px] bg-gradient-to-bl from-emerald-500/15 via-indigo-600/10 to-transparent blur-[180px] rounded-full" />
        {/* Subtle geometric dot grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />
      </div>

      {/* Modern Floating Header Bar */}
      <nav className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-950/70 backdrop-blur-2xl border border-white/[0.08] rounded-full px-5 py-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-base shadow-[0_0_20px_rgba(52,211,153,0.5)]">
              ✈
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                DealPilot
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                v2.0 RADAR
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <a href="#radar-preview" className="hover:text-slate-100 transition-colors">Live Radar</a>
            <a href="#quick-commerce" className="hover:text-slate-100 transition-colors">10-Min Commerce</a>
            <a href="#architecture" className="hover:text-slate-100 transition-colors">Guardrails</a>
            <a href="#paypal-v6" className="hover:text-slate-100 transition-colors">PayPal v6 Checkout</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onOpenAuthModal}
              className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-[0_0_25px_rgba(52,211,153,0.4)] active:scale-95 cursor-pointer"
            >
              <span>Launch DealPilot</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 md:pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        
        {/* Glowing Pill Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-400/25 text-emerald-400 text-xs font-bold mb-6 backdrop-blur-md shadow-[0_0_30px_rgba(52,211,153,0.15)] animate-in fade-in duration-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span>AUTONOMOUS SHOPPING RADAR • 7 LIVE DOMESTIC NETWORKS</span>
        </div>

        {/* Display Typography */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08] mb-6">
          Stop Overpaying. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Let Autonomous Agents
          </span>{' '}
          Capture Record Lows.
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed mb-10">
          DealPilot continuously crawls verified merchants across 
          <strong className="text-slate-200"> Amazon, Flipkart, Croma</strong> alongside 
          <strong className="text-emerald-400"> 10-minute Quick Commerce on Blinkit, Zepto & Swiggy Instamart</strong>. 
          Evaluates deals with deterministic guardrails and executes instant PayPal v6 checkouts.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_35px_rgba(52,211,153,0.45)] hover:shadow-[0_0_50px_rgba(52,211,153,0.6)] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Autonomous Hunting Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#radar-preview"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 text-slate-200 font-bold text-sm tracking-wide transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Explore Live Deals Radar</span>
          </a>
        </div>

        {/* High-Density Ticker Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-16 text-left">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 shadow-lg">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Savings Tracked</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">₹4.82 Cr+</div>
            <div className="text-[10px] text-slate-500 mt-1">Across 42,000+ observations</div>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 shadow-lg">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fastest Delivery</div>
            <div className="text-2xl font-black text-teal-300 font-mono">10 Mins ⚡</div>
            <div className="text-[10px] text-slate-500 mt-1">Blinkit, Zepto, Instamart</div>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 shadow-lg">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pre-Flight Verification</div>
            <div className="text-2xl font-black text-cyan-300 font-mono">100% Guarded</div>
            <div className="text-[10px] text-slate-500 mt-1">Price shift & stock locks</div>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 shadow-lg">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Engine</div>
            <div className="text-2xl font-black text-blue-400 font-mono">PayPal v6 SDK</div>
            <div className="text-[10px] text-slate-500 mt-1">Pay in 4 & Credit Line support</div>
          </div>
        </div>

        {/* INTERACTIVE RADAR & DEAL COMPARISON SHOWCASE (vibrant.design style) */}
        <div id="radar-preview" className="relative z-10 max-w-5xl mx-auto scroll-mt-24">
          <div className="bg-slate-950/85 backdrop-blur-3xl border border-white/[0.1] rounded-3xl p-6 md:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.7)] text-left relative overflow-hidden">
            
            {/* Top Toolbar: Product Selection Chips */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Live Deal Radar Ticker
                  </span>
                </div>
                <div className="text-lg font-black text-slate-100">
                  Select a Product to Observe Live Telemetry:
                </div>
              </div>

              {/* Product Selector Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {VIBRANT_PRODUCTS.map((prod) => {
                  const isSelected = prod.id === selectedProductId;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setSelectedProductId(prod.id);
                        setActiveDirective('idle');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                          : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-white/[0.06]'
                      }`}
                    >
                      <span>{prod.icon}</span>
                      <span>{prod.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Product Details & Stats Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Product Info Card */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {activeProduct.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Deal Score: <strong className="text-emerald-400">{activeProduct.dealScore}/100</strong>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeProduct.name}
                </h3>

                {/* Price Aggregates */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
                  <div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Standard MSRP</div>
                    <div className="text-lg font-bold text-slate-500 line-through font-mono">
                      {activeProduct.currency}{activeProduct.msrp.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-emerald-400 font-semibold uppercase">Current Record Low</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                      {activeProduct.currency}{activeProduct.currentLowest.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-2xl">
                    <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Instant Savings</div>
                    <div className="text-base font-extrabold text-emerald-400 font-mono">
                      Save {activeProduct.currency}{savingsAmount.toLocaleString('en-IN')} ({activeProduct.dropPercent}% OFF)
                    </div>
                  </div>
                </div>
              </div>

              {/* Autonomous Directive Interactive Showcase */}
              <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between shadow-inner">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-400">Autonomous Agent Directive</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                      Target: {activeProduct.currency}{activeProduct.targetPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mb-3">
                    Target hit! Price dropped below threshold. Autonomous directive engine requests confirmation:
                  </div>
                </div>

                {/* 2 Exclusive Actions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveDirective('bought')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                        activeDirective === 'bought'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{activeDirective === 'bought' ? '✓ Order Verified!' : 'Buy Now (Instant)'}</span>
                    </button>
                    <button
                      onClick={() => setActiveDirective('left')}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer ${
                        activeDirective === 'left'
                          ? 'bg-rose-500 text-white font-black'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <span>{activeDirective === 'left' ? 'Skipped' : 'Leave'}</span>
                    </button>
                  </div>
                  <div className="text-[10px] text-center text-slate-500 font-mono">
                    Strictly 2 Autonomous Actions: Instant Capture or Ignore
                  </div>
                </div>
              </div>
            </div>

            {/* Price Drop Curve & Timeline Chart */}
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <span>Adaptive Polling Trajectory (Target Threshold Verification)</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  Adaptive Frequency: 30m Active
                </span>
              </div>

              {/* Visual Curve Representation */}
              <div className="relative h-28 flex items-end justify-between gap-2 pt-6 px-2">
                {activeProduct.points.map((pt, idx) => {
                  const normalizedHeight = Math.max(
                    15,
                    Math.round(((maxPrice - pt.price) / (maxPrice - minPrice || 1)) * 100)
                  );
                  const isLowest = pt.price === activeProduct.currentLowest;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/20 px-2 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap pointer-events-none z-20">
                        {activeProduct.currency}{pt.price.toLocaleString('en-IN')} {pt.note ? `• ${pt.note}` : ''}
                      </div>

                      <div className="w-full flex justify-center items-end h-full">
                        <div
                          className={`w-3/4 max-w-[48px] rounded-t-xl transition-all duration-300 ${
                            isLowest
                              ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                              : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                          style={{ height: `${normalizedHeight}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono ${isLowest ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {pt.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multi-Merchant Breakdown Table */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center justify-between">
                <span>Multi-Merchant Normalized Crawl:</span>
                <span className="text-[11px] text-slate-500">Includes 10-minute Quick Commerce</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {activeProduct.merchants.map((merchant, mIdx) => (
                  <div
                    key={mIdx}
                    className={`rounded-2xl p-4 border transition-all ${
                      merchant.isLowest
                        ? 'bg-emerald-950/25 border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.1)]'
                        : 'bg-slate-900/50 border-white/[0.05] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">{merchant.name}</span>
                      {merchant.isLowest && (
                        <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                          Best Price
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-white font-mono mb-2">
                      {activeProduct.currency}{merchant.price.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">{merchant.deliveryTime || 'Fast Delivery'}</span>
                      </div>
                      <div className="text-slate-500">{merchant.stock}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES BENTO GRID (Inspired by vibrant.design) */}
      <section id="quick-commerce" className="relative z-10 py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Engineering Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Engineered For Precision Deal Automation.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-3">
            Every layer from normalization to checkout runs on verified deterministic rules, transactional reliability, and intelligent background workers.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bento Card 1: Quick Commerce */}
          <div className="md:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              10-Minute Quick Commerce Arbitrage
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xl">
              Why wait 3 days for standard shipping when local dark stores have lower prices right now? DealPilot cross-analyzes instant delivery catalogs on <strong className="text-slate-200">Blinkit, Zepto & Swiggy Instamart</strong> against traditional e-commerce giants.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-mono font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400">⚡ Blinkit (10m)</span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-teal-300">⚡ Zepto (11m)</span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300">⚡ Instamart (15m)</span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">Amazon India</span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">Flipkart</span>
            </div>
          </div>

          {/* Bento Card 2: Deterministic Guardrails */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-teal-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Anti-Fraud Spec Guard
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Our deterministic token extractor catches misleading listings, excludes cheap phone cases and replacement cables masquerading as flagships, and rejects refurbished or open-box goods.
            </p>
            <div className="space-y-2 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero accessory confusion</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Condition & brand verification</span>
              </div>
            </div>
          </div>

          {/* Bento Card 3: PayPal v6 Web SDK */}
          <div id="paypal-v6" className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              PayPal v6 Web SDK
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Modern client-token authentication, dynamic eligible payment method discovery, Pay Later installments, and server-side capture verification with <code className="text-blue-300 font-mono text-xs">Idempotency-Key</code> guards.
            </p>
            <div className="text-xs text-blue-300 font-mono bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl">
              window.paypal.createInstance()
            </div>
          </div>

          {/* Bento Card 4: Transactional Outbox Email */}
          <div className="md:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Atomic Transactional Outbox & Real Gmail Dispatch
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-xl">
              Never miss a price drop again. All price shift events are written atomically with database observations, guaranteeing zero dropped notifications. Dispatched directly as styled HTML alerts to your authenticated Gmail account.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deduplication key constraints prevent duplicate emails</span>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER CTA SECTION */}
      <section className="relative z-10 py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/[0.1] rounded-3xl p-10 md:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
          
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 relative z-10">
            Ready to Automate Your Deal Hunting?
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto mb-8 relative z-10">
            Sign in with Google or GitHub, command the radar with your target price, and let DealPilot do the monitoring 24/7.
          </p>

          <button
            onClick={onOpenAuthModal}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_35px_rgba(52,211,153,0.45)] hover:shadow-[0_0_55px_rgba(52,211,153,0.6)] transition-all duration-200 active:scale-95 inline-flex items-center gap-2 cursor-pointer relative z-10"
          >
            <span>Launch DealPilot Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Brand & Legal */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">DealPilot</span>
            <span>• Next-Gen Autonomous Shopping Engine</span>
          </div>
          <div>
            Built with Next.js 16 (Turbopack), React 19, BullMQ, Redis, PostgreSQL 16 & PayPal Web SDK v6
          </div>
        </div>
      </section>

    </div>
  );
};
