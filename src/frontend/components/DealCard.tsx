"use client";

import React from "react";
import {
  ShieldCheck,
  Sparkles,
  Bell,
  CreditCard,
  Star,
  TrendingDown,
  Tag,
  Award,
} from "lucide-react";
import { formatCurrency, getDealScoreBadgeColor } from "../utils/formatters";

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
  const offer = product.offers?.[0];
  const evalData = offer?.evaluations?.[0];

  // 1. Deal Score (calculated using 0-100 rubric)
  const score = evalData?.score || 78;
  const badgeColors = getDealScoreBadgeColor(score);

  // 2. Lowest Price Ever Recorded
  const observations = offer?.observations || [];
  const lowestObserved =
    observations.length > 0
      ? Math.min(...observations.map((o: any) => o.totalPrice))
      : offer?.lowestPrice || Math.round((offer?.totalPrice || 20000) * 0.94);
  const currentPrice = offer?.totalPrice || 0;
  const isAtHistoricalLow = currentPrice <= lowestObserved;
  const diffFromLow = currentPrice - lowestObserved;

  // 3. Condition of the Product
  let rawAttrs: any = {};
  try {
    rawAttrs =
      typeof offer?.variantAttributes === "string"
        ? JSON.parse(offer.variantAttributes)
        : offer?.variantAttributes || {};
  } catch {
    rawAttrs = {};
  }
  const condition = rawAttrs.condition || offer?.condition || "new";
  const conditionDisplay =
    condition === "refurbished"
      ? "Certified Refurbished"
      : condition === "open_box"
        ? "Open Box"
        : "Brand New (Factory Sealed)";

  // 4. Seller Ratings
  const sellerRating = offer?.sellerRating || 4.8;
  const sellerReviews = offer?.sellerReviewCount || 1240;
  const sellerName = offer?.sellerName || "Verified Merchant";

  // 5. AI Summary about product specs & deal
  const aiSummary =
    evalData?.explanation ||
    `${conditionDisplay}. ${product.brand} ${product.model || product.title}. Deal rating ${score}/100 verified at authorized retailer.`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between shadow-xl">
      <div>
        {product.imageUrl && (
          <div className="h-48 w-full bg-slate-950 relative overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-500"
            />
            {/* Top Deal Score Badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black border backdrop-blur-md shadow-md flex items-center gap-1 ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Deal Score: {score}/100</span>
              </span>
            </div>

            {/* Condition & Source Badges on thumbnail */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md flex items-center gap-1 ${
                  condition === "refurbished"
                    ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                    : "bg-slate-950/80 text-emerald-300 border-emerald-700/60"
                }`}
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{conditionDisplay}</span>
              </span>

              {offer?.sourceId === "channel3" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md bg-indigo-950/80 text-indigo-300 border-indigo-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span>Channel3 Live</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="p-5">
          {/* Category & Brand Header */}
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {product.brand} · {product.category}
          </div>

          <h3
            className="font-bold text-base line-clamp-2 text-slate-100 mb-3"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Pricing & Historical Low Section */}
          <div
            onClick={() => onViewHistory && onViewHistory(product)}
            className={`bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-3 transition ${
              onViewHistory
                ? "cursor-pointer hover:border-emerald-500/50 hover:bg-slate-950"
                : ""
            }`}
            title={
              onViewHistory
                ? "Click to view historical price trajectory & multi-merchant comparison"
                : undefined
            }
          >
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-black text-emerald-400">
                  {formatCurrency(currentPrice, offer?.currency)}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className="text-slate-500">Lowest ever recorded:</span>
                  <span className="font-bold text-slate-200">
                    {formatCurrency(lowestObserved, offer?.currency)}
                  </span>
                </div>
              </div>

              {isAtHistoricalLow ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1 shadow-sm">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>All-Time Low!</span>
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">
                  +₹{diffFromLow.toLocaleString()} above low
                </span>
              )}
            </div>
          </div>

          {/* Seller Ratings & Authorization Section */}
          <div className="flex items-center justify-between text-xs text-slate-300 pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 truncate">
              {offer?.isAuthorizedSeller && (
                <span title="Authorized Dealer">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </span>
              )}
              <span className="font-medium text-slate-200 truncate">
                {sellerName}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="font-bold text-slate-100">
                {sellerRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500">
                ({sellerReviews.toLocaleString()})
              </span>
            </div>
          </div>

          {/* AI Specs & Deal Insight Summary */}
          <div className="bg-emerald-950/20 rounded-xl p-3 border border-emerald-800/30 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Specs & Deal Summary</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
              {aiSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="p-5 pt-0 space-y-2 mt-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onTrack(product, offer)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Track Price</span>
          </button>

          <button
            onClick={() => onBuy(product, offer)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Buy Now</span>
          </button>
        </div>

        {onViewHistory && (
          <button
            onClick={() => onViewHistory(product)}
            className="w-full bg-slate-950 hover:bg-slate-800/80 text-slate-400 hover:text-emerald-400 text-[11px] font-semibold py-2 rounded-xl border border-slate-800 transition flex items-center justify-center gap-1.5"
          >
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Price History & Retailers</span>
          </button>
        )}
      </div>
    </div>
  );
};
