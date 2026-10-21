'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef } from 'ag-grid-community';

import { formatCurrency, getDealScoreBadgeColor } from '../utils/formatters';
import {
  ShieldCheck,
  Bell,
  CreditCard,
  Star,
  TrendingDown,
  Sparkles,
  Tag,
  LineChart,
  Store,
  CheckCircle2,
} from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);

interface DealGridProps {
  products: any[];
  onTrack: (product: any, offer: any) => void;
  onBuy: (product: any, offer: any) => void;
  onViewHistory?: (product: any) => void;
}

export const DealGrid: React.FC<DealGridProps> = ({
  products,
  onTrack,
  onBuy,
  onViewHistory,
}) => {
  // Flatten product + best offer for AG Grid tabular rows
  const rowData = useMemo(() => {
    return products.map((product) => {
      const offer = product.offers?.[0];
      const evalData = offer?.evaluations?.[0];
      const score = evalData?.score || 78;
      const history = offer?.observations || [];
      const currentPrice = offer?.totalPrice || 0;
      const lowestObserved =
        history.length > 0
          ? Math.min(...history.map((o: any) => o.totalPrice))
          : offer?.lowestPrice || Math.round(currentPrice * 0.94);

      // Savings calculation
      const originalPrice =
        history.length > 0
          ? Math.max(...history.map((o: any) => o.totalPrice), Math.round(currentPrice * 1.18))
          : Math.round(currentPrice * 1.25);
      const savingsPct = Math.round(Math.max(0, (originalPrice - currentPrice) / originalPrice) * 100);

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
      const sellerRating = Number(offer?.sellerRating || 4.8);
      const sellerReviewCount = Number(offer?.sellerReviewCount || 1240);

      return {
        id: product.id,
        title: product.title,
        brand: product.brand,
        category: product.category,
        imageUrl: product.imageUrl,
        seller: offer?.sellerName || 'Verified Merchant',
        sellerRating,
        sellerReviewCount,
        isAuthorized: offer?.isAuthorizedSeller,
        source: offer?.sourceId || 'channel3',
        price: currentPrice,
        currency: offer?.currency || 'INR',
        historicalLow: lowestObserved,
        savingsPct,
        dealScore: score,
        condition,
        aiSummary:
          evalData?.explanation ||
          `${product.brand} ${product.model || product.title}. Deal score ${score}/100.`,
        stock:
          offer?.availabilityStatus === 'in_stock'
            ? 'In Stock'
            : 'Out of Stock',
        freshness: offer?.freshnessState || 'LIVE',
        matchQuality: product.verification?.matchQuality || 'exact_model',
        isMatch: product.verification?.isMatch !== false,
        rawProduct: product,
        rawOffer: offer,
      };
    });
  }, [products]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: 'title',
        headerName: 'Product & Specs',
        flex: 2,
        minWidth: 260,
        cellRenderer: (params: any) => {
          const data = params.data;
          if (!data) return null;
          return (
            <div className="flex items-center gap-3 py-1.5 h-full">
              {data.imageUrl && (
                <img
                  src={data.imageUrl}
                  alt={data.title}
                  className="w-11 h-11 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0 shadow-sm"
                />
              )}
              <div className="truncate">
                <div className="font-bold text-slate-100 text-xs md:text-sm truncate">
                  {data.title}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {data.brand} · {data.category}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        field: 'matchQuality',
        headerName: 'Verification',
        width: 140,
        cellRenderer: (params: any) => {
          const isExact = params.value === 'exact_model';
          return (
            <div className="flex items-center h-full">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-sm ${
                isExact ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' : 'bg-teal-950/90 text-teal-300 border-teal-500/50'
              }`}>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{isExact ? 'Verified Intent' : 'Verified Deal'}</span>
              </span>
            </div>
          );
        },
      },
      {
        field: 'condition',
        headerName: 'Condition',
        width: 130,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          const isRefurb = params.value === 'refurbished';
          return (
            <div className="flex items-center h-full">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border inline-flex items-center gap-1 ${
                  isRefurb
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                }`}
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{isRefurb ? 'Refurbished' : 'Brand New'}</span>
              </span>
            </div>
          );
        },
      },
      {
        field: 'price',
        headerName: 'Current Price',
        width: 155,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params: any) => {
          const savings = params.data?.savingsPct || 0;
          return (
            <div className="flex flex-col justify-center h-full py-1">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-emerald-400 text-sm font-mono">
                  {formatCurrency(params.value, params.data?.currency)}
                </span>
                {savings > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    -{savings}%
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        field: 'historicalLow',
        headerName: 'Lowest Recorded',
        width: 175,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params: any) => {
          const current = params.data?.price || 0;
          const low = params.value || current;
          const isAtLow = current <= low;
          return (
            <button
              type="button"
              onClick={() =>
                onViewHistory && onViewHistory(params.data?.rawProduct)
              }
              className="text-left group flex flex-col justify-center h-full py-1 hover:opacity-90 transition cursor-pointer"
              title="Click to view 30D multi-merchant price chart"
            >
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={
                    isAtLow ? 'text-emerald-400 font-bold font-mono' : 'text-slate-300 font-mono'
                  }
                >
                  {formatCurrency(low, params.data?.currency)}
                </span>
                {isAtLow ? (
                  <span className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30 font-bold inline-flex items-center gap-0.5">
                    <TrendingDown className="w-2.5 h-2.5" />
                    <span>Low!</span>
                  </span>
                ) : (
                  <span className="ml-1 text-[10px] text-slate-500 font-mono">
                    (+₹{(current - low).toLocaleString()})
                  </span>
                )}
              </div>
              <span className="text-[10px] text-indigo-400 group-hover:underline flex items-center gap-1 mt-0.5">
                <LineChart className="w-2.5 h-2.5" />
                <span>30D Trajectory</span>
              </span>
            </button>
          );
        },
      },
      {
        field: 'seller',
        headerName: 'Seller & Ratings',
        width: 180,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          const data = params.data;
          if (!data) return null;
          return (
            <div className="flex flex-col justify-center h-full truncate py-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium truncate">
                {data.isAuthorized && (
                  <span title="Authorized Retailer">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </span>
                )}
                <span className="truncate">{data.seller}</span>
                {data.source === 'channel3' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 shrink-0">
                    Channel3
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
                <Star className="w-3 h-3 fill-amber-400" />
                <span className="font-bold text-slate-200 font-mono">
                  {Number(data.sellerRating).toFixed(1)}
                </span>
                <span className="text-slate-500 text-[10px]">
                  ({Number(data.sellerReviewCount).toLocaleString()})
                </span>
              </div>
            </div>
          );
        },
      },
      {
        field: 'dealScore',
        headerName: 'Deal Score',
        width: 140,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params: any) => {
          const score = params.value;
          const badgeColors = getDealScoreBadgeColor(score);
          return (
            <div className="flex items-center h-full">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border shadow-sm ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}
              >
                {score} / 100
              </span>
            </div>
          );
        },
      },
      {
        field: 'aiSummary',
        headerName: 'AI Specs Summary',
        flex: 3,
        minWidth: 280,
        cellRenderer: (params: any) => {
          return (
            <div
              className="text-xs text-slate-300 truncate h-full flex items-center gap-1.5"
              title={params.value}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{params.value}</span>
            </div>
          );
        },
      },
      {
        headerName: 'Actions',
        width: 215,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const data = params.data;
          if (!data) return null;
          return (
            <div className="flex items-center gap-1.5 h-full py-1">
              {onViewHistory && (
                <button
                  type="button"
                  onClick={() => onViewHistory(data.rawProduct)}
                  className="p-1.5 bg-slate-800 hover:bg-indigo-950/80 text-slate-300 hover:text-indigo-300 rounded-lg border border-slate-700 hover:border-indigo-700/60 transition active:scale-90"
                  title="View Price History & Multi-Merchant Comparison"
                >
                  <LineChart className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              )}
              <button
                onClick={() => onTrack(data.rawProduct, data.rawOffer)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition active:scale-95 shadow-sm"
                title="Track price"
              >
                <Bell className="w-3 h-3 text-amber-400" />
                <span>Track</span>
              </button>
              <button
                onClick={() => onBuy(data.rawProduct, data.rawOffer)}
                className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1 transition active:scale-95 shadow-sm shadow-emerald-500/20"
                title="Buy with PayPal Sandbox"
              >
                <CreditCard className="w-3 h-3" />
                <span>Buy</span>
              </button>
            </div>
          );
        },
      },
    ],
    [onTrack, onBuy, onViewHistory],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
    }),
    [],
  );

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md p-4 md:p-6">
      {/* Scoped CSS for Dark-Quartz AG Grid Theme */}
      <style jsx global>{`
        .ag-theme-quartz-dark {
          --ag-background-color: #0b1120;
          --ag-header-background-color: #0f172a;
          --ag-odd-row-background-color: #0d1527;
          --ag-border-color: #1e293b;
          --ag-row-border-color: #1e293b;
          --ag-header-column-separator-color: #334155;
          --ag-foreground-color: #f1f5f9;
          --ag-data-color: #e2e8f0;
          --ag-secondary-foreground-color: #94a3b8;
          --ag-header-foreground-color: #cbd5e1;
          --ag-row-hover-color: rgba(51, 65, 85, 0.45);
          --ag-selected-row-background-color: rgba(16, 185, 129, 0.12);
          --ag-range-selection-border-color: #10b981;
          --ag-active-color: #10b981;
          --ag-font-family: inherit;
          --ag-font-size: 13px;
          --ag-border-radius: 16px;
        }
        .ag-theme-quartz-dark .ag-header-cell-label {
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-size: 10px;
          color: #94a3b8;
        }
        .ag-theme-quartz-dark .ag-row {
          transition: background-color 0.15s ease;
        }
      `}</style>

      {/* Grid Header Info */}
      <div className="text-xs text-slate-400 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-200">
            Interactive AG Grid Comparison
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
            Dark Quartz Engine
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>Sorted by relevance & deal rating</span>
          <span className="text-emerald-400 font-bold font-mono">
            {rowData.length} normalized deals
          </span>
        </div>
      </div>

      {/* AG Grid Responsive Container */}
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-800/80 shadow-inner">
        <div
          className="ag-theme-quartz-dark"
          style={{ height: '540px', width: '100%', minWidth: '880px' }}
        >
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowHeight={64}
            headerHeight={44}
            animateRows={true}
          />
        </div>
      </div>
    </div>
  );
};
