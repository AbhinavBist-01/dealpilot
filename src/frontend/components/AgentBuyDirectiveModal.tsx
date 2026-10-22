'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ShoppingCart, 
  X, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface AgentBuyDirectiveProps {
  country?: string;
  currency?: string;
  onInitiateCheckout: (product: any, offer: any) => void;
  onRefreshWatches: () => void;
}

export const AgentBuyDirectiveModal: React.FC<AgentBuyDirectiveProps> = ({
  country = 'IN',
  currency = 'INR',
  onInitiateCheckout,
  onRefreshWatches,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    { text: 'Buy Sony WH-1000XM5 when price drops to 18000', query: 'Sony WH-1000XM5', target: 18000 },
    { text: 'Buy AirPods Max when price is under 45000', query: 'AirPods Max', target: 45000 },
    { text: 'Buy Dell XPS 15 when price reaches 120000', query: 'Dell XPS 15', target: 120000 },
  ];

  const handleParseAndSubmit = async (customPrompt?: string) => {
    const rawText = customPrompt || promptInput;
    if (!rawText.trim()) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    // Natural Language Parser: extract product name and target price
    // Matches patterns like "buy [product] when [price]" or "[product] at [price]" or "under [price]"
    let targetPrice: number | null = null;
    let query: string = rawText;

    const priceMatch = rawText.match(/(?:under|below|drops to|reach(?:es)?|to|at|<=?)\s*(?:[₹$€£]|inr|usd)?\s*([0-9]+(?:,[0-9]+)?)/i);
    if (priceMatch && priceMatch[1]) {
      targetPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
      // Clean query by removing "buy", "when drops to...", etc.
      query = rawText
        .replace(/(?:buy|purchase|get|order|pilot|watch)\s+/i, '')
        .replace(/(?:when|if|once|under|below|drops to|reach(?:es)?|to|at|<=?)\s*(?:[₹$€£]|inr|usd)?\s*[0-9]+(?:,[0-9]+)?.*/i, '')
        .trim();
    }

    if (!targetPrice || targetPrice <= 0) {
      setError('Please specify a target price. (e.g. "Buy Sony WH-1000XM5 when drops to 18000")');
      setSubmitting(false);
      return;
    }

    if (!query || query.length < 2) {
      setError('Please provide a specific product model to watch.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/agent/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          targetPrice,
          country,
          currency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch agent directive');
      }

      setResult(data);
      onRefreshWatches();
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with Autonomous Agent');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Agent Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black px-5 py-3.5 rounded-full shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group cursor-pointer border border-emerald-300/40"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-950" />
        </span>
        <Bot className="w-5 h-5 text-slate-950" />
        <span className="text-sm tracking-tight">Agent Buy Directive</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-emerald-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <span>Autonomous Buy Directive</span>
                    <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Agent Loop
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Instruct the agent what to buy and when. You only click Buy Now when matched.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setResult(null);
                  setError(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Form */}
            {!result ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Describe your buy directive:
                  </label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder='e.g. "Buy Sony WH-1000XM5 when the price drops to 18000"'
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition font-medium resize-none shadow-inner"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleParseAndSubmit();
                        }
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Example Quick-Pick Prompts */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Try example directives:
                  </span>
                  <div className="space-y-1.5">
                    {examplePrompts.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPromptInput(ex.text);
                          handleParseAndSubmit(ex.text);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition flex items-center justify-between group"
                      >
                        <span className="font-mono text-slate-300">{ex.text}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="button"
                  disabled={submitting || !promptInput.trim()}
                  onClick={() => handleParseAndSubmit()}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-3.5 rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? 'Instructing Agent...' : 'Delegate Buy Directive to Agent'}</span>
                </button>
              </div>
            ) : (
              /* Agent Notification & Match Card */
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">
                      {result.isTargetMet ? 'Offer Matched! Ready for One-Click Checkout' : 'Directive Active in Background'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {result.message}
                    </p>
                  </div>
                </div>

                {/* Product Detail Snippet */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
                  {result.product?.imageUrl && (
                    <img
                      src={result.product.imageUrl}
                      alt={result.product.title}
                      className="w-14 h-14 rounded-xl object-contain bg-slate-900 border border-slate-800 p-1"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-100 truncate">
                      {result.product?.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>Live Price: <strong className="text-emerald-400 font-mono">{formatCurrency(result.product?.currentBestPrice, currency)}</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="text-slate-200 font-mono">{formatCurrency(result.rule?.targetPrice, currency)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Required Action Buttons: BUY NOW vs LEAVE */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setResult(null);
                      setPromptInput('');
                    }}
                    className="w-1/2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700"
                  >
                    Leave
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (result.product && result.product.bestOffer) {
                        onInitiateCheckout(result.product, result.product.bestOffer);
                      }
                      setResult(null);
                      setPromptInput('');
                    }}
                    className="w-1/2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
