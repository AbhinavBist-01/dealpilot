'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Clock, 
  CheckCircle2, 
  TrendingDown, 
  Activity, 
  Check, 
  CreditCard, 
  Mail, 
  ArrowUpRight,
  Search,
  Bell,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface LandingViewProps {
  onOpenAuthModal: () => void;
}

interface DemoProduct {
  id: string;
  name: string;
  category: string;
  badge: string;
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
    deliveryTime: string;
    isLowest?: boolean;
  }[];
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'iphone-16-pro',
    name: 'Apple iPhone 16 Pro (128GB, Desert Titanium)',
    category: 'Flagship Smartphone',
    badge: 'Spec Verified',
    msrp: 119900,
    targetPrice: 112000,
    currentLowest: 109900,
    currency: '₹',
    dropPercent: 8.3,
    dealScore: 96,
    points: [
      { day: 'Day 1', price: 119900, note: 'Official Launch MRP' },
      { day: 'Day 3', price: 118490, note: 'Bank Card Discount' },
      { day: 'Day 5', price: 115900, note: 'Weekend Markdown' },
      { day: 'Day 7', price: 113500, note: 'Escalated Polling (30m)' },
      { day: 'Day 9', price: 111900, note: 'Target Threshold Crossed' },
      { day: 'Live', price: 109900, note: 'Instant Quick Commerce Flash' },
    ],
    merchants: [
      {
        name: 'Blinkit',
        domain: 'blinkit.com',
        price: 109900,
        rating: 4.9,
        reviews: 8420,
        stock: 'In Stock • Dark Store Verified',
        deliveryTime: '10 mins',
        isLowest: true,
      },
      {
        name: 'Amazon India',
        domain: 'amazon.in',
        price: 112999,
        rating: 4.8,
        reviews: 24310,
        stock: 'In Stock • Prime Fulfilled',
        deliveryTime: 'Tomorrow',
      },
      {
        name: 'Flipkart',
        domain: 'flipkart.com',
        price: 114900,
        rating: 4.7,
        reviews: 19400,
        stock: 'In Stock • F-Assured',
        deliveryTime: '2 Days',
      },
      {
        name: 'Croma',
        domain: 'croma.com',
        price: 119900,
        rating: 4.6,
        reviews: 6200,
        stock: 'Store Pickup Ready',
        deliveryTime: 'Same Day',
      }
    ]
  },
  {
    id: 'macbook-air-m3',
    name: 'Apple MacBook Air 13" M3 (16GB RAM, 512GB SSD)',
    category: 'Pro Ultrabook',
    badge: 'Spec Verified',
    msrp: 134900,
    targetPrice: 122000,
    currentLowest: 118990,
    currency: '₹',
    dropPercent: 11.8,
    dealScore: 98,
    points: [
      { day: 'Day 1', price: 134900, note: 'Official Store MSRP' },
      { day: 'Day 3', price: 129900, note: 'Corporate Offer' },
      { day: 'Day 5', price: 126500, note: 'Croma Price Match' },
      { day: 'Day 7', price: 123900, note: 'Near Target' },
      { day: 'Day 9', price: 120990, note: 'Target Hit Alert' },
      { day: 'Live', price: 118990, note: 'Reliance Digital Instant Rebate' },
    ],
    merchants: [
      {
        name: 'Reliance Digital',
        domain: 'reliancedigital.in',
        price: 118990,
        rating: 4.8,
        reviews: 5120,
        stock: 'In Stock • Express Delivery',
        deliveryTime: '3 Hours',
        isLowest: true,
      },
      {
        name: 'Amazon India',
        domain: 'amazon.in',
        price: 122490,
        rating: 4.9,
        reviews: 14200,
        stock: 'In Stock • Brand Warranty',
        deliveryTime: 'Tomorrow',
      },
      {
        name: 'Croma',
        domain: 'croma.com',
        price: 124900,
        rating: 4.7,
        reviews: 8300,
        stock: 'In Stock • Tata Certified',
        deliveryTime: 'Same Day',
      }
    ]
  },
  {
    id: 'ps5-slim',
    name: 'Sony PlayStation 5 Slim (Disc Edition with 1TB SSD)',
    category: 'Next-Gen Gaming',
    badge: 'Spec Verified',
    msrp: 54990,
    targetPrice: 50000,
    currentLowest: 48990,
    currency: '₹',
    dropPercent: 10.9,
    dealScore: 95,
    points: [
      { day: 'Day 1', price: 54990, note: 'Sony Official Store' },
      { day: 'Day 3', price: 53990, note: 'Standard Sale' },
      { day: 'Day 5', price: 52490, note: 'E-commerce Weekend' },
      { day: 'Day 7', price: 50990, note: 'Target Proximity' },
      { day: 'Day 9', price: 49990, note: 'Target Reached' },
      { day: 'Live', price: 48990, note: 'Zepto Dark Store Drop' },
    ],
    merchants: [
      {
        name: 'Zepto',
        domain: 'zepto.in',
        price: 48990,
        rating: 4.9,
        reviews: 4100,
        stock: 'In Stock • 11-Min Delivery',
        deliveryTime: '11 mins',
        isLowest: true,
      },
      {
        name: 'Flipkart',
        domain: 'flipkart.com',
        price: 49990,
        rating: 4.8,
        reviews: 32000,
        stock: 'In Stock • F-Assured',
        deliveryTime: 'Tomorrow',
      },
      {
        name: 'Amazon India',
        domain: 'amazon.in',
        price: 51990,
        rating: 4.8,
        reviews: 28500,
        stock: 'In Stock • Authorized Seller',
        deliveryTime: 'Tomorrow',
      }
    ]
  },
  {
    id: 'boat-airdopes',
    name: 'boAt Airdopes 141 ANC (32dB Hybrid ANC, 42H Playback)',
    category: 'Audio & Wearables',
    badge: 'Spec Verified',
    msrp: 4490,
    targetPrice: 2000,
    currentLowest: 1499,
    currency: '₹',
    dropPercent: 66.6,
    dealScore: 99,
    points: [
      { day: 'Day 1', price: 4490, note: 'Standard Launch MSRP' },
      { day: 'Day 3', price: 2999, note: 'Regular Promo' },
      { day: 'Day 5', price: 2299, note: 'Online Discount' },
      { day: 'Day 7', price: 1899, note: 'Target Hit Threshold' },
      { day: 'Day 9', price: 1699, note: 'Flash Clearance' },
      { day: 'Live', price: 1499, note: 'Swiggy Instamart Blitz' },
    ],
    merchants: [
      {
        name: 'Swiggy Instamart',
        domain: 'swiggy.com/instamart',
        price: 1499,
        rating: 4.8,
        reviews: 12400,
        stock: 'In Stock • Dark Store Verified',
        deliveryTime: '15 mins',
        isLowest: true,
      },
      {
        name: 'Blinkit',
        domain: 'blinkit.com',
        price: 1599,
        rating: 4.8,
        reviews: 9800,
        stock: 'In Stock • 10-Min Delivery',
        deliveryTime: '10 mins',
      },
      {
        name: 'Amazon India',
        domain: 'amazon.in',
        price: 1799,
        rating: 4.6,
        reviews: 84000,
        stock: 'In Stock • boAt Official',
        deliveryTime: 'Tomorrow',
      }
    ]
  }
];

export const LandingView: React.FC<LandingViewProps> = ({ onOpenAuthModal }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('iphone-16-pro');
  const [activeDirective, setActiveDirective] = useState<'idle' | 'bought' | 'left'>('idle');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Interactive Pipeline Motion Simulator State
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const activeProduct = useMemo(() => {
    return DEMO_PRODUCTS.find((p) => p.id === selectedProductId) || DEMO_PRODUCTS[0];
  }, [selectedProductId]);

  const maxPrice = useMemo(() => {
    return Math.max(...activeProduct.points.map((p) => p.price));
  }, [activeProduct]);

  const minPrice = useMemo(() => {
    return Math.min(...activeProduct.points.map((p) => p.price));
  }, [activeProduct]);

  const savingsAmount = activeProduct.msrp - activeProduct.currentLowest;

  // Chart coordinates calculation (SVG)
  const chartWidth = 560;
  const chartHeight = 160;
  const chartPadding = { top: 20, right: 30, bottom: 28, left: 30 };
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const priceRange = maxPrice - minPrice || 1;

  const chartPoints = useMemo(() => {
    return activeProduct.points.map((pt, idx) => {
      const x = chartPadding.left + (idx / (activeProduct.points.length - 1)) * innerWidth;
      const y = chartPadding.top + ((maxPrice - pt.price) / priceRange) * innerHeight;
      return { ...pt, x, y };
    });
  }, [activeProduct, maxPrice, priceRange, innerWidth, innerHeight]);

  const polylinePoints = useMemo(() => {
    return chartPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }, [chartPoints]);

  const targetLineY = useMemo(() => {
    return chartPadding.top + ((maxPrice - activeProduct.targetPrice) / priceRange) * innerHeight;
  }, [activeProduct.targetPrice, maxPrice, priceRange, innerHeight]);

  // Automated Pipeline Simulator
  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(1);

    const timer1 = setTimeout(() => setSimulationStep(2), 700);
    const timer2 = setTimeout(() => setSimulationStep(3), 1500);
    const timer3 = setTimeout(() => {
      setSimulationStep(4);
      setIsSimulating(false);
    }, 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const resetSimulation = () => {
    setSimulationStep(0);
    setIsSimulating(false);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* 1. Precision Top Navigation */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white">
              DP
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                DealPilot
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase tracking-wider">
                Autonomous Radar
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <a href="#radar-preview" className="hover:text-zinc-100 transition-colors">Live Telemetry</a>
            <a href="#pipeline-simulator" className="hover:text-zinc-100 transition-colors">Execution Pipeline</a>
            <a href="#quick-commerce" className="hover:text-zinc-100 transition-colors">10-Min Commerce</a>
          </nav>

          {/* User Auth CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-black bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Launch Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-20 pb-14 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          
          {/* Eyebrow Telemetry Tag */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-850 text-zinc-300 text-[11px] font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="tracking-wide">AUTONOMOUS RADAR • CRAWLING 7 DOMESTIC NETWORKS</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-50 leading-[1.08] mb-6">
            Stop overpaying.<br />
            Autonomous price radar for record lows.
          </h1>

          {/* Subtitle */}
          <p className="text-zinc-400 text-base sm:text-lg font-normal leading-relaxed mb-8 max-w-2xl">
            DealPilot monitors inventory and pricing across Amazon, Flipkart, Croma, and instant 10-minute Quick Commerce on Blinkit, Zepto, and Swiggy Instamart. When prices hit your target, autonomous directives verify authentic specs and route to verified PayPal checkout.
          </p>

          {/* Action CTAs with Motion Feedback */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenAuthModal}
              className="px-5 py-3 rounded-md bg-zinc-100 hover:bg-white text-black font-semibold text-xs tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Start Tracking Deals Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="#radar-preview"
              className="px-5 py-3 rounded-md bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-xs tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              <span>Inspect Telemetry Radar</span>
            </a>
          </div>

        </div>

        {/* 3. Metric Bar (Telemetry Strip) */}
        <div className="mt-16 pt-8 border-t border-zinc-900 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group">
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Tracked Savings</div>
            <div className="text-2xl font-bold text-zinc-100 tabular-nums">₹4.82 Cr+</div>
            <div className="text-xs text-zinc-500 mt-1">Across 42,000+ observations</div>
          </div>
          <div className="group">
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Fastest Delivery</div>
            <div className="text-2xl font-bold text-zinc-100 tabular-nums">10 Minutes</div>
            <div className="text-xs text-zinc-500 mt-1">Blinkit, Zepto & Swiggy Instamart</div>
          </div>
          <div className="group">
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Pre-Flight Protection</div>
            <div className="text-2xl font-bold text-zinc-100 tabular-nums">100% Guarded</div>
            <div className="text-xs text-zinc-500 mt-1">Stale & accessory check verified</div>
          </div>
          <div className="group">
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Checkout Engine</div>
            <div className="text-2xl font-bold text-zinc-100 tabular-nums">PayPal v6 SDK</div>
            <div className="text-xs text-zinc-500 mt-1">Idempotency & Server verification</div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Telemetry Radar & Directive Terminal (Motion-Enhanced) */}
      <section id="radar-preview" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto scroll-mt-16">
        
        {/* Section Eyebrow & Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-900 mb-6">
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Live Observation Feed</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Deal Intelligence Console
            </h2>
          </div>

          {/* Product Selector Buttons with Tactile Motion Feedback */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-850">
            {DEMO_PRODUCTS.map((prod) => {
              const isSelected = prod.id === selectedProductId;
              return (
                <button
                  key={prod.id}
                  onClick={() => {
                    setSelectedProductId(prod.id);
                    setActiveDirective('idle');
                    setHoveredPointIndex(null);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all active:scale-[0.97] cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-850 text-white shadow-sm border border-zinc-750'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {prod.category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Telemetry Console Frame */}
        <div className="bg-[#09090b] border border-zinc-850 rounded-xl overflow-hidden shadow-2xl">
          
          {/* Console Header Bar */}
          <div className="bg-[#0f0f12] px-6 py-3.5 border-b border-zinc-850 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-zinc-400">TELEMETRY ID: <strong className="text-zinc-200 uppercase">{activeProduct.id}</strong></span>
              <span className="text-zinc-700">•</span>
              <span className="inline-flex items-center gap-1.5 text-zinc-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                FREQUENCY: 30M ADAPTIVE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-[11px] font-mono">DEAL SCORE:</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono font-bold text-[11px]">
                {activeProduct.dealScore}/100
              </span>
            </div>
          </div>

          {/* Main Grid: Details + Chart (Left) & Autonomous Directive (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-850">
            
            {/* Left 7 Columns: Product Data & Price Trajectory SVG Chart */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {activeProduct.category}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{activeProduct.badge}</span>
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {activeProduct.name}
                </h3>
              </div>

              {/* Price Metrics Row */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-[#0e0e11] border border-zinc-850">
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-500 mb-0.5">MSRP</div>
                  <div className="text-sm font-mono text-zinc-500 line-through tabular-nums">
                    {activeProduct.currency}{activeProduct.msrp.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-400 mb-0.5">Lowest Live</div>
                  <div className="text-xl font-bold font-mono text-zinc-100 tabular-nums">
                    {activeProduct.currency}{activeProduct.currentLowest.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-emerald-500 mb-0.5">Current Savings</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                    Save {activeProduct.currency}{savingsAmount.toLocaleString('en-IN')} ({activeProduct.dropPercent}%)
                  </div>
                </div>
              </div>

              {/* SVG Price Trajectory Chart with Accessible Node Hover */}
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-mono text-zinc-400 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Historical Price Drop Telemetry</span>
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    Target: {activeProduct.currency}{activeProduct.targetPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="relative bg-[#0d0d10] border border-zinc-850 rounded-lg p-4">
                  <svg 
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                    className="w-full h-auto overflow-visible"
                  >
                    {/* Horizontal Reference Grid Lines */}
                    <line 
                      x1={chartPadding.left} 
                      y1={chartPadding.top} 
                      x2={chartWidth - chartPadding.right} 
                      y2={chartPadding.top} 
                      stroke="#27272a" 
                      strokeDasharray="3 3" 
                      strokeWidth="1" 
                    />
                    <line 
                      x1={chartPadding.left} 
                      y1={chartPadding.top + innerHeight / 2} 
                      x2={chartWidth - chartPadding.right} 
                      y2={chartPadding.top + innerHeight / 2} 
                      stroke="#27272a" 
                      strokeDasharray="3 3" 
                      strokeWidth="1" 
                    />
                    <line 
                      x1={chartPadding.left} 
                      y1={chartPadding.top + innerHeight} 
                      x2={chartWidth - chartPadding.right} 
                      y2={chartPadding.top + innerHeight} 
                      stroke="#27272a" 
                      strokeWidth="1" 
                    />

                    {/* Target Threshold Line */}
                    <line 
                      x1={chartPadding.left} 
                      y1={targetLineY} 
                      x2={chartWidth - chartPadding.right} 
                      y2={targetLineY} 
                      stroke="#eab308" 
                      strokeDasharray="4 4" 
                      strokeWidth="1.5" 
                      opacity="0.8"
                    />

                    {/* Main Trajectory Line */}
                    <polyline
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      points={polylinePoints}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {chartPoints.map((pt, idx) => {
                      const isLowest = pt.price === activeProduct.currentLowest;
                      const isHovered = hoveredPointIndex === idx;

                      return (
                        <g 
                          key={idx} 
                          className="cursor-pointer transition-transform"
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                        >
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 6 : isLowest ? 5 : 3.5}
                            fill={isLowest ? '#10b981' : '#09090b'}
                            stroke={isLowest ? '#10b981' : '#ffffff'}
                            strokeWidth="2"
                          />
                          {/* Label below axis */}
                          <text
                            x={pt.x}
                            y={chartHeight - 6}
                            textAnchor="middle"
                            fontSize="10"
                            fontFamily="ui-monospace, monospace"
                            fill={isLowest ? '#10b981' : '#71717a'}
                          >
                            {pt.day}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Active Point Note Banner */}
                  <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">
                      {hoveredPointIndex !== null 
                        ? `${chartPoints[hoveredPointIndex].day}: ${activeProduct.currency}${chartPoints[hoveredPointIndex].price.toLocaleString('en-IN')}`
                        : `Live Lowest: ${activeProduct.currency}${activeProduct.currentLowest.toLocaleString('en-IN')}`}
                    </span>
                    <span className="text-zinc-400">
                      {hoveredPointIndex !== null && chartPoints[hoveredPointIndex].note
                        ? chartPoints[hoveredPointIndex].note
                        : 'Pre-flight verified below target threshold'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right 5 Columns: Autonomous Directive Control Terminal */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-[#0b0b0e]">
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                      Directive Control
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
                      TARGET REACHED
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 leading-relaxed">
                    The background monitoring worker confirmed that the current lowest offer dropped below your target threshold. All pre-flight safety checks passed.
                  </div>
                </div>

                {/* Directive Spec Matrix */}
                <div className="space-y-2 border border-zinc-850 rounded-lg p-3.5 bg-[#0e0e12] text-xs font-mono">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-850/80">
                    <span className="text-zinc-500">Target Ceiling</span>
                    <span className="text-zinc-200 tabular-nums">{activeProduct.currency}{activeProduct.targetPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-zinc-850/80">
                    <span className="text-zinc-500">Executed Offer</span>
                    <span className="text-emerald-400 font-bold tabular-nums">{activeProduct.currency}{activeProduct.currentLowest.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-zinc-850/80">
                    <span className="text-zinc-500">Merchant</span>
                    <span className="text-zinc-200">Blinkit (10-min Dark Store)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-500">Spec Status</span>
                    <span className="text-zinc-300">100% Genuine • Non-Refurbished</span>
                  </div>
                </div>

                {/* Binary Decision Callout with Tactile Transitions */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-zinc-400">
                    Autonomous Actions
                  </div>

                  {activeDirective === 'bought' ? (
                    <div className="p-4 rounded-lg bg-zinc-900 border border-emerald-500/40 text-left space-y-1 animate-fade-in-up">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                        <Check className="w-4 h-4" />
                        <span>Pre-Flight Verified • PayPal Order Created</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Idempotency-Key locked. Server verified order token in sandbox.
                      </p>
                      <button
                        onClick={() => setActiveDirective('idle')}
                        className="mt-2 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                      >
                        Reset Directive State
                      </button>
                    </div>
                  ) : activeDirective === 'left' ? (
                    <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-left space-y-1 animate-fade-in-up">
                      <div className="text-zinc-300 font-bold text-xs font-mono">
                        Directive Dismissed
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Alert archived. Radar resumed adaptive 30m background polling.
                      </p>
                      <button
                        onClick={() => setActiveDirective('idle')}
                        className="mt-2 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                      >
                        Reset Directive State
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActiveDirective('bought')}
                        className="py-3 px-3 rounded-md bg-zinc-100 hover:bg-white text-black font-semibold text-xs tracking-tight transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>Buy Now (Instant)</span>
                      </button>
                      <button
                        onClick={() => setActiveDirective('left')}
                        className="py-3 px-3 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-medium text-xs tracking-tight transition-all active:scale-[0.97] flex items-center justify-center cursor-pointer"
                      >
                        <span>Leave</span>
                      </button>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 font-mono text-center pt-1">
                    Strictly 2 autonomous options: execute checkout or ignore.
                  </div>
                </div>

              </div>

              {/* Security Seal */}
              <div className="pt-6 border-t border-zinc-850 mt-6 flex items-center gap-2.5 text-xs text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Pre-flight price verification gatekeeper active. Zero stale checkouts.</span>
              </div>

            </div>

          </div>

          {/* Bottom Table: Multi-Merchant Comparative Ledger */}
          <div id="order-book" className="border-t border-zinc-850 bg-[#08080a] p-6 scroll-mt-16">
            <div className="flex items-center justify-between text-xs mb-4">
              <span className="font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Normalized Merchant Comparison (Quick Commerce & Domestic Retail)
              </span>
              <span className="font-mono text-zinc-500 text-[11px]">
                Sorted by net effective cost
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeProduct.merchants.map((merchant, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all hover:-translate-y-0.5 ${
                    merchant.isLowest
                      ? 'bg-zinc-900/60 border-zinc-700'
                      : 'bg-[#0d0d10] border-zinc-850 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-zinc-200">{merchant.name}</span>
                    {merchant.isLowest && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        LOWEST
                      </span>
                    )}
                  </div>

                  <div className="text-xl font-bold font-mono text-white tabular-nums mb-2">
                    {activeProduct.currency}{merchant.price.toLocaleString('en-IN')}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{merchant.deliveryTime}</span>
                    </div>
                    <div className="text-zinc-500 text-[11px]">
                      {merchant.stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 5. Interactive Pipeline Motion Simulator Component (Replaces Architecture Section) */}
      <section id="pipeline-simulator" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-zinc-900 scroll-mt-16">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Interactive Motion Simulator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
              Watch Autonomous Deal Execution in Motion
            </h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-xl">
              Simulate an incoming price drop on a quick-commerce dark store and observe the 4-stage pipeline verify and capture the deal.
            </p>
          </div>

          {/* Simulation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isSimulating
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-100 hover:bg-white text-black active:scale-95 shadow-sm'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? 'Executing Pipeline...' : 'Simulate Deal Drop'}</span>
            </button>
            {simulationStep > 0 && !isSimulating && (
              <button
                onClick={resetSimulation}
                className="px-3 py-2 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4-Stage Motion Pipeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Stage 1 */}
          <div className={`p-5 rounded-xl border transition-all duration-300 ${
            simulationStep >= 1
              ? 'bg-zinc-900/90 border-zinc-700 shadow-md'
              : 'bg-[#09090b] border-zinc-850 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="text-zinc-500">STAGE 01</span>
              {simulationStep >= 1 ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>DETECTED</span>
                </span>
              ) : (
                <span className="text-zinc-600">IDLE</span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Catalog Observation
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Blinkit dark store drops iPhone 16 Pro price from ₹1,19,900 to ₹1,09,900 (-8.3%).
            </p>
            {simulationStep >= 1 && (
              <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
                Latency: 14ms • Dark Store Ingestion
              </div>
            )}
          </div>

          {/* Stage 2 */}
          <div className={`p-5 rounded-xl border transition-all duration-300 ${
            simulationStep >= 2
              ? 'bg-zinc-900/90 border-zinc-700 shadow-md'
              : 'bg-[#09090b] border-zinc-850 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="text-zinc-500">STAGE 02</span>
              {simulationStep >= 2 ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>VERIFIED</span>
                </span>
              ) : (
                <span className="text-zinc-600">PENDING</span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Anti-Fraud Spec Guard
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Deterministic spec parser confirms flagship unit; rejects accessories and refurbished stock.
            </p>
            {simulationStep >= 2 && (
              <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
                Tokens: A18 Pro, 128GB, Desert Titanium
              </div>
            )}
          </div>

          {/* Stage 3 */}
          <div className={`p-5 rounded-xl border transition-all duration-300 ${
            simulationStep >= 3
              ? 'bg-zinc-900/90 border-zinc-700 shadow-md'
              : 'bg-[#09090b] border-zinc-850 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="text-zinc-500">STAGE 03</span>
              {simulationStep >= 3 ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>LOCKED</span>
                </span>
              ) : (
                <span className="text-zinc-600">PENDING</span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Pre-Flight Revalidation
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Live server handshake confirms stock availability and locks price before checkout execution.
            </p>
            {simulationStep >= 3 && (
              <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
                In Stock • 10-Min Delivery ETA Locked
              </div>
            )}
          </div>

          {/* Stage 4 */}
          <div className={`p-5 rounded-xl border transition-all duration-300 ${
            simulationStep >= 4
              ? 'bg-zinc-900/90 border-emerald-500/50 shadow-lg'
              : 'bg-[#09090b] border-zinc-850 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="text-zinc-500">STAGE 04</span>
              {simulationStep >= 4 ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>EXECUTED</span>
                </span>
              ) : (
                <span className="text-zinc-600">PENDING</span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              PayPal v6 Settlement
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Autonomous directive dispatches order with Idempotency-Key. Verification token captured.
            </p>
            {simulationStep >= 4 && (
              <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] font-mono text-emerald-400 font-bold">
                ✓ Order Captured in 184ms
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6. Quick Commerce Arbitrage Section */}
      <section id="quick-commerce" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-zinc-900 scroll-mt-16">
        <div className="max-w-2xl mb-8">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
            Instant Delivery Arbitrage
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            10-Minute Dark Stores vs. 3-Day Shipping
          </h2>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            Local quick-commerce dark stores frequently offer flash rebates that beat national e-commerce retailers by thousands of rupees, delivered to your doorstep in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-850 hover:border-zinc-800 transition-all space-y-2">
            <div className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Blinkit Dark Stores</span>
            </div>
            <div className="text-lg font-bold text-white">10-Minute Electronics</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instant delivery on Apple flagships, PS5 consoles, chargers, and premium audio with verified brand warranties.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-850 hover:border-zinc-800 transition-all space-y-2">
            <div className="text-xs font-mono text-teal-400 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Zepto Flash Deals</span>
            </div>
            <div className="text-lg font-bold text-white">11-Minute Hubs</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              High-frequency inventory drops with hyper-localized price match guarantees directly competing with Flipkart Assured.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-850 hover:border-zinc-800 transition-all space-y-2">
            <div className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Swiggy Instamart</span>
            </div>
            <div className="text-lg font-bold text-white">15-Minute Blitz</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Aggressive weekend clearances on smart wearables and audio gear with instant localized delivery.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Bottom Call to Action */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900 text-center">
        <div className="p-10 sm:p-14 rounded-2xl bg-[#09090b] border border-zinc-850 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to track real-time deal telemetry?
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
            Authenticate with Google or GitHub to launch DealPilot, set price targets across domestic e-commerce and quick commerce, and let autonomous workers monitor 24/7.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenAuthModal}
              className="px-6 py-3.5 rounded-md bg-zinc-100 hover:bg-white text-black font-semibold text-xs tracking-wide transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Launch DealPilot Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold">DealPilot</span>
            <span>• Autonomous Shopping Radar</span>
          </div>
          <div>
            Next.js 16 (Turbopack) • React 19 • PostgreSQL 16 • Redis 7 • PayPal v6 SDK
          </div>
        </div>
      </section>

    </div>
  );
};
