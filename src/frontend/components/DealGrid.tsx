'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { formatCurrency, getDealScoreBadgeColor } from '../utils/formatters';
import { ShieldCheck, Bell, CreditCard } from 'lucide-react';

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
      const score = evalData?.score || 75;
      const history = offer?.observations || [];
      const lowestObserved = history.length > 0
        ? Math.min(...history.map((o: any) => o.observedPrice))
        : offer?.totalPrice;

      return {
        id: product.id,
        title: product.title,
        brand: product.brand,
        category: product.category,
        imageUrl: product.imageUrl,
        seller: offer?.sellerName || 'Direct',
        isAuthorized: offer?.isAuthorizedSeller,
        price: offer?.totalPrice || 0,
        currency: offer?.currency || 'INR',
        historicalLow: lowestObserved,
        dealScore: score,
        scoreSummary: evalData?.explanation?.summary || 'Standard verified offer',
        condition: offer?.condition || 'new',
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
      headerName: 'Product',
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
      headerName: 'Historical Low',
      width: 140,
      sortable: true,
      filter: 'agNumberColumnFilter',
      cellRenderer: (params: any) => {
        const current = params.data?.price || 0;
        const low = params.value || current;
        const isAtLow = current <= low;
        return (
          <div className="text-xs">
            <span className={isAtLow ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {formatCurrency(low, params.data?.currency)}
            </span>
            {isAtLow && (
              <span className="ml-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Low!
              </span>
            )}
          </div>
        );
      },
    },
    {
      field: 'seller',
      headerName: 'Retailer',
      width: 160,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            {params.data?.isAuthorized && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            <span className="truncate">{params.value}</span>
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
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}>
            {score} / 100
          </span>
        );
      },
    },
    {
      field: 'freshness',
      headerName: 'Freshness',
      width: 120,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const val = params.value;
        const isLive = val === 'LIVE';
        return (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
            isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {val}
          </span>
        );
      },
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: 120,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const inStock = params.value === 'In Stock';
        return (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
            inStock ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {params.value}
          </span>
        );
      },
    },
    {
      headerName: 'Actions',
      width: 180,
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
          Interactive AG Grid Table — click column headers to sort, hover to filter
        </span>
        <span className="text-slate-500">{rowData.length} rows</span>
      </div>
      <div className="ag-theme-quartz-dark" style={{ height: '520px', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={56}
          headerHeight={44}
          animateRows={true}
        />
      </div>
    </div>
  );
};
