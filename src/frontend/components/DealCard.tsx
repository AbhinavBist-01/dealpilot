import React from 'react';
import { ShieldCheck, Sparkles, Bell, CreditCard } from 'lucide-react';
import { formatCurrency, getDealScoreBadgeColor } from '../utils/formatters';

interface DealCardProps {
  product: any;
  onTrack: (product: any, offer: any) => void;
  onBuy: (product: any, offer: any) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ product, onTrack, onBuy }) => {
  const offer = product.offers?.[0];
  const evalData = offer?.evaluations?.[0];
  const score = evalData?.score || 75;
  const badgeColors = getDealScoreBadgeColor(score);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between shadow-lg">
      <div>
        {product.imageUrl && (
          <div className="h-48 w-full bg-slate-950 relative overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-500"
            />
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}>
                Deal Score: {score}/100
              </span>
            </div>
            <div className="absolute bottom-3 left-3">
              <span className="bg-slate-950/80 backdrop-blur text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-800">
                {product.brand} · {product.category}
              </span>
            </div>
          </div>
        )}

        <div className="p-5">
          <h3 className="font-bold text-base line-clamp-2 text-slate-100 mb-2">
            {product.title}
          </h3>

          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-2xl font-black text-emerald-400">
                {formatCurrency(offer?.totalPrice || 0, offer?.currency)}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                {offer?.isAuthorizedSeller && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />}
                <span>Sold by {offer?.sellerName}</span>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              {offer?.availabilityStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {evalData?.explanation && (
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 mb-4">
              <div className="flex items-center gap-1 text-emerald-400 font-semibold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Agent Evaluation:</span>
              </div>
              <p className="line-clamp-2">{evalData.explanation}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 pt-0 grid grid-cols-2 gap-2">
        <button
          onClick={() => onTrack(product, offer)}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
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
    </div>
  );
};
