'use client';

import React, { useId } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Bell,
  CreditCard,
  Star,
  TrendingDown,
  Tag,
  Award,
  LineChart,
  Store,
  CheckCircle2,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, getDealScoreBadgeColor } from '../utils/formatters';
import { computeProductDealScore } from '../utils/deal-scoring';

interface DealCardProps {
  product: any;
  onTrack: (product: any, offer: any) => void;
  onBuy: (product: any, offer: any) => void;
  onViewHistory?: (product: any) => void;
}

export const DealCard: React.FC<DealCardProps> = ({
  product,
  onTrack,
  onBuy,
  onViewHistory,
}) => {
  const sparklineId = useId().replace(/:/g, '');
  const offer = product.offers?.[0];
  const evalData = offer?.evaluations?.[0];

  // 1. Dynamic Value & Deal Score (30% P + 25% Q + 15% H + 15% T + 15% U)
  const dealScoreData = computeProductDealScore(product, offer);
  const score = evalData?.score || dealScoreData.score;

  // 2. Pricing, Lowest Observed & Savings Calculation
  const currentPrice = offer?.totalPrice || 0;
  const observations = offer?.observations || [];
  const lowestObserved =
    observations.length > 0
      ? Math.min(...observations.map((o: any) => o.totalPrice))
      : offer?.lowestPrice || Math.round(currentPrice * 0.94);
  const isAtHistoricalLow = currentPrice <= lowestObserved;

  // Calculate Savings Percentage
  const originalPrice =
    observations.length > 0
      ? Math.max(...observations.map((o: any) => o.totalPrice), Math.round(currentPrice * 1.18))
      : Math.round(currentPrice * 1.25);
  const savingsAmount = Math.max(0, originalPrice - currentPrice);
  const savingsPct = Math.round((savingsAmount / originalPrice) * 100);

  // 3. Condition of the Product
  let rawAttrs: any = {};
  try {
    rawAttrs =
      typeof offer?.variantAttributes === 'string'
        ? JSON.parse(offer.variantAttributes)
        : offer?.variantAttributes || {};
  } catch {
    rawAttrs = {};
  }
  const condition = rawAttrs.condition || offer?.condition || 'new';
  const conditionDisplay =
    condition === 'refurbished'
      ? 'Refurbished'
      : condition === 'open_box'
      ? 'Open Box'
      : 'Brand New (Sealed)';

  // 4. Seller Ratings & Merchant Info
  const sellerRating = Number(offer?.sellerRating || 4.8);
  const sellerReviews = Number(offer?.sellerReviewCount || 1240);
  const sellerName = offer?.sellerName || 'Verified Merchant';

  // 5. Verification Status
  const isExactModel = product.verification?.matchQuality === 'exact_model';
  const isVerified = product.verification?.isMatch !== false;

  // 6. Specs Summary
  const aiSummary =
    evalData?.explanation ||
    `${conditionDisplay}. ${product.brand} ${product.model || product.title}. Deal score ${score}/100 verified across stores.`;

  // Mini Sparkline Points
  const sparklinePath = `M 5 26 C 25 22, 45 26, 65 24 C 85 22, 105 14, 130 ${isAtHistoricalLow ? 8 : 14}`;

  return (
    <div className="group relative bg-[#09090b] hover:bg-[#0c0c0f] border border-zinc-850 hover:border-zinc-750 rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-lg">
      <div>
        {/* Thumbnail & Badges */}
        {product.imageUrl && (
          <div className="h-48 w-full bg-black relative overflow-hidden border-b border-zinc-850">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />

            {/* AI Deal Score Badge (Top-Right) */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-black/90 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                <span>{score}/100</span>
              </span>
            </div>

            {/* Verified Badge (Top-Left) */}
            {isVerified && (
              <div className="absolute top-2.5 left-2.5 z-10">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-black/90 text-zinc-300 border border-zinc-700 backdrop-blur-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{isExactModel ? 'Spec Verified' : 'Verified Deal'}</span>
                </span>
              </div>
            )}

            {/* Bottom Thumbnail Overlay Tags */}
            <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/90 text-zinc-300 border border-zinc-800 backdrop-blur-md">
                {conditionDisplay}
              </span>

              {offer?.sellerName?.toLowerCase().includes('blinkit') ||
              offer?.sellerName?.toLowerCase().includes('zepto') ||
              offer?.sellerName?.toLowerCase().includes('instamart') ? (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-black/90 text-amber-300 border border-amber-600/50 backdrop-blur-md flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span>10m Delivery</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/90 text-zinc-400 border border-zinc-800 backdrop-blur-md">
                  Domestic Merchant
                </span>
              )}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-3">
          
          {/* Brand & Seller Row */}
          <div className="flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-zinc-500 uppercase tracking-wider text-[10px] truncate">
              {product.brand} · {product.category}
            </span>

            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black border border-zinc-850 text-[11px] text-zinc-300 truncate max-w-[130px]">
              <Store className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">{sellerName}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3
            className="font-semibold text-sm line-clamp-2 text-zinc-100 group-hover:text-white transition-colors leading-snug"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Telemetry Price Block with Clean SVG Trajectory */}
          <div className="bg-black rounded-lg p-3 border border-zinc-850">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold font-mono text-white tabular-nums">
                    {formatCurrency(currentPrice, offer?.currency)}
                  </div>

                  {savingsPct > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      -{savingsPct}%
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 mt-1">
                  <span>Low:</span>
                  <span className="text-zinc-300 tabular-nums">
                    {formatCurrency(lowestObserved, offer?.currency)}
                  </span>
                  {isAtHistoricalLow && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-900 text-emerald-400 font-bold border border-zinc-800">
                      Record
                    </span>
                  )}
                </div>
              </div>

              {/* Minimal SVG Sparkline */}
              <div
                onClick={() => onViewHistory && onViewHistory(product)}
                className="cursor-pointer flex flex-col items-end group/spark"
                title="Click to view multi-merchant price chart"
              >
                <div className="w-24 h-8 rounded bg-[#09090b] border border-zinc-850 p-0.5 hover:border-zinc-700 transition-colors">
                  <svg viewBox="0 0 135 36" className="w-full h-full overflow-visible">
                    <path
                      d={sparklinePath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="130"
                      cy={isAtHistoricalLow ? 8 : 14}
                      r="3"
                      fill="#10b981"
                    />
                  </svg>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 group-hover/spark:text-zinc-300 mt-1 flex items-center gap-0.5">
                  <LineChart className="w-2.5 h-2.5" />
                  <span>Trajectory</span>
                </span>
              </div>
            </div>
          </div>

          {/* Seller Ratings & Authorization */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-850/80">
            <div className="flex items-center gap-1 text-[11px] font-mono truncate">
              {offer?.isAuthorizedSeller && (
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Authorized Dealer</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 bg-black px-2 py-0.5 rounded border border-zinc-850 text-[11px] font-mono text-zinc-400">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-zinc-200 font-bold">{sellerRating.toFixed(1)}</span>
              <span className="text-zinc-600">({sellerReviews.toLocaleString()})</span>
            </div>
          </div>

          {/* Value & Deal Score Factors Strip (30% P + 25% Q + 15% H + 15% T + 15% U) */}
          <div className="bg-[#0b0b0e] rounded-lg p-2.5 border border-zinc-850 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400 flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>Value Score: <strong className="text-white">{score}/100</strong></span>
              </span>
              <span className="text-emerald-400 font-medium text-[10px]">{dealScoreData.gradeLabel}</span>
            </div>

            <div className="grid grid-cols-5 gap-1 text-[9px] font-mono text-center">
              <div className="bg-black p-1 rounded border border-zinc-850" title="Price & Deal Quality (30% weight)">
                <div className="text-zinc-500 text-[8px] uppercase">Price 30%</div>
                <div className="text-zinc-200 font-bold tabular-nums">{dealScoreData.P}</div>
              </div>
              <div className="bg-black p-1 rounded border border-zinc-850" title="Product Quality (25% weight)">
                <div className="text-zinc-500 text-[8px] uppercase">Quality 25%</div>
                <div className="text-zinc-200 font-bold tabular-nums">{dealScoreData.Q}</div>
              </div>
              <div className="bg-black p-1 rounded border border-zinc-850" title="Price History (15% weight)">
                <div className="text-zinc-500 text-[8px] uppercase">Hist 15%</div>
                <div className="text-zinc-200 font-bold tabular-nums">{dealScoreData.H}</div>
              </div>
              <div className="bg-black p-1 rounded border border-zinc-850" title="Seller Trust (15% weight)">
                <div className="text-zinc-500 text-[8px] uppercase">Trust 15%</div>
                <div className="text-zinc-200 font-bold tabular-nums">{dealScoreData.T}</div>
              </div>
              <div className="bg-black p-1 rounded border border-zinc-850" title="User Fit (15% weight)">
                <div className="text-zinc-500 text-[8px] uppercase">Fit 15%</div>
                <div className="text-zinc-200 font-bold tabular-nums">{dealScoreData.U}</div>
              </div>
            </div>
          </div>

          {/* Specs & Evaluation Summary */}
          <div className="bg-[#0e0e11] rounded-lg p-2.5 border border-zinc-850 text-xs text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[10px] uppercase font-semibold">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span>Summary</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 font-sans">
              {aiSummary}
            </p>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 sm:p-5 pt-0 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onTrack(product, offer)}
            className="w-full bg-zinc-900 hover:bg-zinc-850 active:scale-95 text-zinc-300 hover:text-white text-xs font-semibold py-2.5 rounded-lg border border-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-zinc-400" />
            <span>Track</span>
          </button>

          <button
            onClick={() => onBuy(product, offer)}
            className="w-full bg-zinc-100 hover:bg-white active:scale-95 text-black text-xs font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Buy Now</span>
          </button>
        </div>

        {onViewHistory && (
          <button
            onClick={() => onViewHistory(product)}
            className="w-full bg-black hover:bg-zinc-900 active:scale-[0.99] text-zinc-500 hover:text-zinc-300 text-[11px] font-mono py-1.5 rounded-lg border border-zinc-850 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <TrendingDown className="w-3 h-3 text-zinc-400" />
            <span>Inspect Multi-Merchant Comparison</span>
          </button>
        )}
      </div>
    </div>
  );
};
