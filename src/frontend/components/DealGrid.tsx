'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { formatCurrency, getDealScoreBadgeColor } from '../utils/formatters';
import { ShieldCheck, Bell, CreditCard, Star, TrendingDown, Sparkles, Tag } from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);

interface DealGridProps {
  products: any[];
  onTrack: (product: any, offer: any) => void;
  onBuy: (product: any, offer: any) => void;
}

export const DealGrid: React.FC<DealGridProps> = ({ products, onTrack, onBuy }) => {
  // Flatten product + best offer for AG Grid tabular rows
  const rowData = useMemo(() => {
    return products.map((product) => {
      const offer = product.offers?.[0];
      const evalData = offer?.evaluations?.[0];
      const score = evalData?.score || 78;
      const history = offer?.observations || [];
      const lowestObserved = history.length > 0
        ? Math.min(...history.map((o: any) => o.totalPrice))
        : (offer?.lowestPrice || Math.round((offer?.totalPrice || 20000) * 0.94));

      let rawAttrs: any = {};
      try {
        rawAttrs = typeof offer?.variantAttributes === 'string'
          ? JSON.parse(offer.variantAttributes)
          : (offer?.variantAttributes || {});
      } catch {
        rawAttrs = {};
      }

      const condition = rawAttrs.condition || offer?.condition || 'new';
      const sellerRating = offer?.sellerRating || 4.8;
      const sellerReviewCount = offer?.sellerReviewCount || 1240;

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
        source: offer?.sourceId || 'mock_retailer',
        price: offer?.totalPrice || 0,
        currency: offer?.currency || 'INR',
        historicalLow: lowestObserved,
        dealScore: score,
        condition,
        aiSummary: evalData?.explanation || `${product.brand} ${product.model || product.title}. Deal score ${score}/100.`,
        stock: offer?.availabilityStatus === 'in_stock' ? 'In Stock' : 'Out of Stock',
        freshness: offer?.freshnessState || 'LIVE',
        rawProduct: product,
        rawOffer: offer,
      };
    });
  }, [products]);

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: 'title',
      headerName: 'Product & Specs',
      flex: 2,
      minWidth: 260,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        return (
          <div className="flex items-center gap-3 py-1">
            {data.imageUrl && (
              <img
                src={data.imageUrl}
                alt={data.title}
                className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
              />
            )}
            <div className="truncate">
              <div className="font-semibold text-slate-100 text-sm truncate">{data.title}</div>
              <div className="text-[11px] text-slate-400">{data.brand} · {data.category}</div>
            </div>
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
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
            isRefurb
              ? 'bg-amber-950/70 text-amber-300 border-amber-800'
              : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
          }`}>
            <Tag className="w-2.5 h-2.5" />
            <span>{isRefurb ? 'Refurbished' : 'Brand New'}</span>
          </span>
        );
      },
    },
    {
      field: 'price',
      headerName: 'Current Price',
      width: 140,
      sortable: true,
      filter: 'agNumberColumnFilter',
      cellRenderer: (params: any) => {
        return (
          <div className="font-bold text-emerald-400 text-sm">
            {formatCurrency(params.value, params.data?.currency)}
          </div>
        );
      },
    },
    {
      field: 'historicalLow',
      headerName: 'Lowest Recorded',
      width: 160,
      sortable: true,
      filter: 'agNumberColumnFilter',
      cellRenderer: (params: any) => {
        const current = params.data?.price || 0;
        const low = params.value || current;
        const isAtLow = current <= low;
        return (
          <div className="text-xs">
            <span className={isAtLow ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
              {formatCurrency(low, params.data?.currency)}
            </span>
            {isAtLow ? (
              <span className="ml-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold inline-flex items-center gap-0.5">
                <TrendingDown className="w-2.5 h-2.5" />
                <span>Low!</span>
              </span>
            ) : (
              <span className="ml-1 text-[10px] text-slate-500">
                (+₹{(current - low).toLocaleString()})
              </span>
            )}
          </div>
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
          <div className="truncate py-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium truncate">
              {data.isAuthorized && (
                <span title="Authorized Retailer">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </span>
              )}
              <span className="truncate">{data.seller}</span>
              {data.source === 'channel3' && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 shrink-0">
                  Channel3
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400" />
              <span className="font-bold text-slate-200">{Number(data.sellerRating).toFixed(1)}</span>
              <span className="text-slate-500">({Number(data.sellerReviewCount).toLocaleString()})</span>
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
          <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}>
            {score} / 100
          </span>
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
          <div className="text-xs text-slate-300 truncate py-1 flex items-center gap-1.5" title={params.value}>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{params.value}</span>
          </div>
        );
      },
    },
    {
      headerName: 'Actions',
      width: 170,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        return (
          <div className="flex items-center gap-2 h-full py-1">
            <button
              onClick={() => onTrack(data.rawProduct, data.rawOffer)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition"
              title="Track price"
            >
              <Bell className="w-3 h-3 text-amber-400" />
              <span>Track</span>
            </button>
            <button
              onClick={() => onBuy(data.rawProduct, data.rawOffer)}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 transition shadow-sm"
              title="Buy with PayPal Sandbox"
            >
              <CreditCard className="w-3 h-3" />
              <span>Buy</span>
            </button>
          </div>
        );
      },
    },
  ], [onTrack, onBuy]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
  }), []);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4">
      <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
        <span className="font-medium text-slate-300">
          Interactive AG Grid Comparison — Deal Score, Historical Low, Specs, Condition & Seller Ratings
        </span>
        <span className="text-slate-500">{rowData.length} deals</span>
      </div>
      <div className="ag-theme-quartz-dark" style={{ height: '520px', width: '100%' }}>
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
  );
};
