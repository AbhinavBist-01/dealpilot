'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Calendar,
  Store,
  ShieldCheck,
  Star,
  Bell,
  CreditCard,
  ArrowDownRight,
  Clock,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface PriceHistoryModalProps {
  productId: string | null;
  currency?: string;
  onClose: () => void;
  onTrack: (product: any, targetPrice: number) => void;
  onBuy: (product: any, offer: any) => void;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  productId,
  currency: propCurrency = 'INR',
  onClose,
  onTrack,
  onBuy,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d' | 'all'>('30d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/products/${productId}/price-history?currency=${encodeURIComponent(propCurrency)}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load price history:', err);
        setLoading(false);
      });
  }, [productId, propCurrency]);

  useEffect(() => {
    if (!productId) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [productId, onClose]);

  // Filter timeline based on timeframe
  const activeTimeline = useMemo(() => {
    if (!data?.timeline || data.timeline.length === 0) return [];
    if (timeframe === 'all' || data.timeline.length <= 4) return data.timeline;
    if (timeframe === '7d') return data.timeline.slice(-4);
    if (timeframe === '14d') return data.timeline.slice(-6);
    return data.timeline;
  }, [data, timeframe]);

  // Chart coordinate calculations
  const chartMetrics = useMemo(() => {
    if (activeTimeline.length === 0) return null;
    const prices = activeTimeline.map((t: any) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const padding = range * 0.15;
    const yMin = Math.max(0, Math.floor(min - padding));
    const yMax = Math.ceil(max + padding);

    const width = 640;
    const height = 220;
    const padX = 40;
    const padY = 25;

    const points = activeTimeline.map((item: any, i: number) => {
      const x = padX + (i / Math.max(activeTimeline.length - 1, 1)) * (width - 2 * padX);
      const y = height - padY - ((item.price - yMin) / (yMax - yMin)) * (height - 2 * padY);
      return { x, y, ...item };
    });

    const pathD = points.reduce((acc: string, pt: any, i: number) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      // Smooth cubic bezier curve
      const prev = points[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

    return { width, height, padX, padY, yMin, yMax, points, pathD, areaD };
  }, [activeTimeline]);

  if (!productId) return null;

  const product = data?.product;
  const stats = data?.stats;
  const merchants = data?.merchants || [];
  const currency = product?.currency || propCurrency || 'INR';

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-[#09090b] border border-zinc-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-[#0e0e11]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                Price Intelligence & History
              </div>
              <h2 className="text-base font-semibold text-zinc-100 line-clamp-1 max-w-lg">
                {product?.title || 'Loading Product History...'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-xs text-zinc-400">Aggregating historical price observations...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* 4 Stat Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Current Price */}
              <div className="bg-black border border-zinc-800 rounded-xl p-4">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  Current Price
                </span>
                <div className="text-2xl font-bold text-zinc-100 font-mono tracking-tight">
                  {formatCurrency(stats?.currentPrice || 0, currency)}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px]">
                  {stats?.isAllTimeLow ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" /> All-Time Low
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-mono">
                      +{formatCurrency(((stats?.currentPrice || 0) - (stats?.lowestRecorded || 0)), currency)} from low
                    </span>
                  )}
                </div>
              </div>

              {/* Lowest Recorded */}
              <div className="bg-black border border-zinc-800 rounded-xl p-4">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  Lowest Recorded
                </span>
                <div className="text-2xl font-bold text-zinc-100 font-mono tracking-tight">
                  {formatCurrency(stats?.lowestRecorded || 0, currency)}
                </div>
                <div className="mt-1 text-[11px] text-emerald-400 font-medium flex items-center gap-0.5">
                  <ArrowDownRight className="w-3 h-3" /> {stats?.dropPercent}% peak discount
                </div>
              </div>

              {/* Highest Recorded */}
              <div className="bg-black border border-zinc-800 rounded-xl p-4">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  Historical Peak
                </span>
                <div className="text-2xl font-bold text-zinc-400 font-mono tracking-tight">
                  {formatCurrency(stats?.highestRecorded || 0, currency)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                  Save {formatCurrency(stats?.savingsVsHigh || 0, currency)} vs peak
                </div>
              </div>

              {/* Trend & Average */}
              <div className="bg-black border border-zinc-800 rounded-xl p-4">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  30-Day Trend
                </span>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold capitalize text-zinc-200">
                    {stats?.trend || 'Stable'}
                  </div>
                  {stats?.trend === 'dropping' ? (
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  ) : stats?.trend === 'rising' ? (
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                  Avg: {formatCurrency(stats?.averagePrice || 0, currency)}
                </div>
              </div>
            </div>

            {/* Interactive SVG Chart Container */}
            <div className="bg-black border border-zinc-800 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Price History Trajectory</span>
                  {hoverIndex !== null && chartMetrics && (
                    <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 font-mono text-[11px]">
                      {chartMetrics.points[hoverIndex]?.date}: {formatCurrency(chartMetrics.points[hoverIndex]?.price || 0, currency)}
                    </span>
                  )}
                </div>

                {/* Timeframe Buttons */}
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  {(['7d', '14d', '30d', 'all'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition uppercase cursor-pointer ${
                        timeframe === tf
                          ? 'bg-white text-zinc-950 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart SVG Canvas */}
              {chartMetrics && (
                <div className="relative w-full h-56">
                  <svg
                    viewBox={`0 0 ${chartMetrics.width} ${chartMetrics.height}`}
                    className="w-full h-full overflow-visible"
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines */}
                    {[0, 0.33, 0.66, 1].map((pct, idx) => {
                      const yVal = chartMetrics.padY + pct * (chartMetrics.height - 2 * chartMetrics.padY);
                      const priceVal = Math.round(chartMetrics.yMax - pct * (chartMetrics.yMax - chartMetrics.yMin));
                      return (
                        <g key={idx}>
                          <line
                            x1={chartMetrics.padX}
                            y1={yVal}
                            x2={chartMetrics.width - chartMetrics.padX}
                            y2={yVal}
                            stroke="#18181b"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={chartMetrics.padX - 8}
                            y={yVal + 3}
                            fill="#71717a"
                            fontSize="9"
                            textAnchor="end"
                            fontFamily="monospace"
                          >
                            ₹{priceVal.toLocaleString()}
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient Area Fill */}
                    <path d={chartMetrics.areaD} fill="url(#priceGradient)" />

                    {/* Smooth Price Path Line */}
                    <path
                      d={chartMetrics.pathD}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                    />

                    {/* Data Points */}
                    {chartMetrics.points.map((pt: any, i: number) => {
                      const isHovered = hoverIndex === i;
                      const isLow = pt.price === stats?.lowestRecorded;
                      return (
                        <g
                          key={i}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoverIndex(i)}
                        >
                          {/* Invisible hit target for smooth hovering */}
                          <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />

                          {/* Outer pulse for all-time low */}
                          {isLow && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={7}
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="1.5"
                              className="animate-ping opacity-50"
                            />
                          )}

                          {/* Interactive circle dot */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 5.5 : isLow ? 4 : 3}
                            fill={isHovered ? '#ffffff' : isLow ? '#22c55e' : '#15803d'}
                            stroke="#09090b"
                            strokeWidth="2"
                          />

                          {/* Date Label under x-axis */}
                          {(i === 0 || i === chartMetrics.points.length - 1 || isHovered) && (
                            <text
                              x={pt.x}
                              y={chartMetrics.height - 6}
                              fill={isHovered ? '#ffffff' : '#71717a'}
                              fontSize="9"
                              textAnchor="middle"
                              fontFamily="sans-serif"
                            >
                              {pt.date}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* Multi-Merchant Comparison Table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Multi-Merchant Live Comparison ({merchants.length} retailers)
                </h3>
              </div>

              <div className="space-y-2">
                {merchants.map((m: any, idx: number) => {
                  const isBestPrice = m.price === stats?.currentPrice;
                  const diff = m.price - (stats?.currentPrice || 0);

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                        isBestPrice
                          ? 'bg-zinc-900 border-zinc-700'
                          : 'bg-black border-zinc-850 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-xs text-zinc-300">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-xs text-zinc-200">
                            <span>{m.merchant}</span>
                            {m.isAuthorized && (
                              <span title="Verified Retailer">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                            {m.merchant?.toLowerCase().includes('blinkit') || m.merchant?.toLowerCase().includes('zepto') || m.merchant?.toLowerCase().includes('instamart') ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1">
                                Quick
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1">
                                Store
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span className="font-mono">{Number(m.rating).toFixed(1)}</span>
                            </span>
                            <span>·</span>
                            <span className="capitalize text-zinc-400">{m.condition}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-bold text-zinc-100 font-mono">
                            {formatCurrency(m.price, currency)}
                          </div>
                          <div className="text-[11px] font-normal text-zinc-400">
                            {isBestPrice ? (
                              <span className="text-emerald-400 font-medium">Best Deal</span>
                            ) : (
                              <span className="font-mono">+{formatCurrency(diff, currency)} diff</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onBuy(product, m)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-zinc-300">
                <span className="font-semibold text-zinc-100">Optimal Buying Strategy: </span>
                {stats?.isAllTimeLow
                  ? 'Currently at its all-time lowest price. Recommended purchase.'
                  : `Price is within ${formatCurrency(((stats?.currentPrice || 0) - (stats?.lowestRecorded || 0)), currency)} of the historical low.`}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onTrack(product, stats?.lowestRecorded || stats?.currentPrice || 15000);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Set Watch</span>
                </button>

                <button
                  onClick={() => {
                    const bestOffer = data?.product?.offers?.[0] || merchants[0];
                    onBuy(product, bestOffer);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Buy at Best Price</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
