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
  currency = 'INR',
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
    fetch(`/api/products/${productId}/price-history?currency=${encodeURIComponent(currency)}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load price history:', err);
        setLoading(false);
      });
  }, [productId, currency]);

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
  const currency = product?.currency || 'INR';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Price Intelligence & History
              </div>
              <h2 className="text-lg font-bold text-slate-100 line-clamp-1 max-w-lg">
                {product?.title || 'Loading Product History...'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-400">Aggregating historical price observations...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* 4 Stat Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Current Price */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Current Price
                </span>
                <div className="text-2xl font-black text-emerald-400">
                  {formatCurrency(stats?.currentPrice || 0, currency)}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px]">
                  {stats?.isAllTimeLow ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" /> All-Time Low!
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      +₹{((stats?.currentPrice || 0) - (stats?.lowestRecorded || 0)).toLocaleString()} from low
                    </span>
                  )}
                </div>
              </div>

              {/* Lowest Recorded */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Lowest Recorded
                </span>
                <div className="text-2xl font-black text-slate-100">
                  {formatCurrency(stats?.lowestRecorded || 0, currency)}
                </div>
                <div className="mt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-0.5">
                  <ArrowDownRight className="w-3 h-3" /> {stats?.dropPercent}% peak discount
                </div>
              </div>

              {/* Highest Recorded */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Historical Peak
                </span>
                <div className="text-2xl font-black text-slate-300">
                  {formatCurrency(stats?.highestRecorded || 0, currency)}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Save ₹{(stats?.savingsVsHigh || 0).toLocaleString()} vs peak
                </div>
              </div>

              {/* Trend & Average */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  30-Day Trend
                </span>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold capitalize text-slate-200">
                    {stats?.trend || 'Stable'}
                  </div>
                  {stats?.trend === 'dropping' ? (
                    <TrendingDown className="w-5 h-5 text-emerald-400" />
                  ) : stats?.trend === 'rising' ? (
                    <TrendingUp className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Avg: {formatCurrency(stats?.averagePrice || 0, currency)}
                </div>
              </div>
            </div>

            {/* Interactive SVG Chart Container */}
            <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Price History Trajectory</span>
                  {hoverIndex !== null && chartMetrics && (
                    <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-mono text-[11px]">
                      {chartMetrics.points[hoverIndex]?.date}: {formatCurrency(chartMetrics.points[hoverIndex]?.price || 0, currency)}
                    </span>
                  )}
                </div>

                {/* Timeframe Buttons */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {(['7d', '14d', '30d', 'all'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition uppercase ${
                        timeframe === tf
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
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
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
                      </filter>
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
                            stroke="#1e293b"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={chartMetrics.padX - 8}
                            y={yVal + 3}
                            fill="#64748b"
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
                      stroke="#10b981"
                      strokeWidth="2.5"
                      filter="url(#glow)"
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
                              r={8}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="1.5"
                              className="animate-ping opacity-60"
                            />
                          )}

                          {/* Interactive circle dot */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 6 : isLow ? 4.5 : 3.5}
                            fill={isHovered ? '#34d399' : isLow ? '#10b981' : '#059669'}
                            stroke="#0f172a"
                            strokeWidth="2"
                          />

                          {/* Date Label under x-axis */}
                          {(i === 0 || i === chartMetrics.points.length - 1 || isHovered) && (
                            <text
                              x={pt.x}
                              y={chartMetrics.height - 6}
                              fill={isHovered ? '#34d399' : '#64748b'}
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
                <Store className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">
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
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                        isBestPrice
                          ? 'bg-emerald-950/20 border-emerald-800/60 shadow-sm'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-200">
                            <span>{m.merchant}</span>
                            {m.isAuthorized && (
                              <span title="Verified Indian Retailer">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                            {m.merchant?.toLowerCase().includes('blinkit') || m.merchant?.toLowerCase().includes('zepto') || m.merchant?.toLowerCase().includes('instamart') ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                ⚡ Quick Commerce
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                📦 E-Commerce
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{Number(m.rating).toFixed(1)}</span>
                            </span>
                            <span>·</span>
                            <span className="capitalize text-slate-300">{m.condition}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-base font-black text-emerald-400">
                            {formatCurrency(m.price, currency)}
                          </div>
                          <div className="text-[11px] font-medium text-slate-400">
                            {isBestPrice ? (
                              <span className="text-emerald-400 font-bold">Best Deal</span>
                            ) : (
                              <span>+₹{diff.toLocaleString()} difference</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onBuy(product, m)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-sm"
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
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-emerald-400">Optimal Buying Strategy: </span>
                {stats?.isAllTimeLow
                  ? 'Currently at its all-time lowest price. Excellent time to purchase.'
                  : `Price is within ₹${((stats?.currentPrice || 0) - (stats?.lowestRecorded || 0)).toLocaleString()} of the historical low.`}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onTrack(product, stats?.lowestRecorded || stats?.currentPrice || 15000);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Set Watch at All-Time Low</span>
                </button>

                <button
                  onClick={() => {
                    const bestOffer = data?.product?.offers?.[0] || merchants[0];
                    onBuy(product, bestOffer);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
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
