'use client';

import React from 'react';
import { X, Clock, Bell, ShieldCheck } from 'lucide-react';

interface TrackingModalProps {
  product: any;
  targetPrice: number;
  setTargetPrice: (price: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  product,
  targetPrice,
  setTargetPrice,
  onConfirm,
  onClose,
}) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-[#09090b] border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Deploy Price Watch Rule</h3>
            <span className="text-[10px] font-mono text-zinc-500">BULLMQ BACKGROUND WORKER</span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mt-2 mb-4 leading-relaxed">
          Monitor <strong className="text-zinc-200">{product.title}</strong> across domestic retailers. Dispatches atomic alert events upon hitting target ceiling.
        </p>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1">
              Target Price Ceiling (₹)
            </label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-black border border-zinc-800 focus:border-zinc-500 rounded-lg px-3.5 py-2 text-xs font-mono text-white outline-none transition-colors"
            />
          </div>

          <div className="bg-black p-3 rounded-lg border border-zinc-850 text-xs font-mono text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 text-[11px] font-semibold">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Adaptive Polling Cadence</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Crawl interval: 2 hours by default; accelerates to 30 minutes when live offers approach within 10% of target.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-1/2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 py-2.5 rounded-lg text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-1/2 bg-zinc-100 hover:bg-white text-black py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            Deploy Watch
          </button>
        </div>
      </div>
    </div>
  );
};
