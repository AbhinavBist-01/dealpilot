'use client';

import React, { useState, useEffect } from 'react';
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
  TrendingDown,
  Zap
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface AgentBuyDirectiveProps {
  country?: string;
  currency?: string;
  onInitiateCheckout: (product: any, offer: any) => void;
  onRefreshWatches: () => void;
  externalIsOpen?: boolean;
  onCloseExternal?: () => void;
}

export const AgentBuyDirectiveModal: React.FC<AgentBuyDirectiveProps> = ({
  country = 'IN',
  currency = 'INR',
  onInitiateCheckout,
  onRefreshWatches,
  externalIsOpen,
  onCloseExternal,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    setInternalIsOpen(false);
    if (onCloseExternal) {
      onCloseExternal();
    }
    setResult(null);
    setError(null);
  };

  const examplePrompts = [
    { text: 'Buy Sony WH-1000XM5 when price drops to 30000', query: 'Sony WH-1000XM5', target: 30000 },
    { text: 'Buy AirPods Pro 2 if under 18500', query: 'AirPods Pro 2', target: 18500 },
    { text: 'Buy Dell XPS 15 when price reaches 140000', query: 'Dell XPS 15', target: 140000 },
  ];

  const handleParseAndSubmit = async (customPrompt?: string) => {
    const rawText = customPrompt || promptInput;
    if (!rawText.trim()) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/agent/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: rawText,
          country: 'IN',
          currency: 'INR',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch agent directive');
      }

      setResult(data);
      onRefreshWatches();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Agent Action Button */}
      <button
        onClick={() => setInternalIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-zinc-100 hover:bg-white text-black font-semibold px-4 py-3 rounded-full shadow-2xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-zinc-200"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Bot className="w-4 h-4 text-black" />
        <span className="text-xs font-semibold">Agent Directive</span>
      </button>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up"
          onClick={handleClose}
        >
          <div 
            className="w-full max-w-lg bg-[#09090b] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Autonomous Buy Directive</span>
                    <span className="text-[10px] uppercase font-mono font-bold bg-zinc-900 text-emerald-400 border border-zinc-800 px-2 py-0.5 rounded">
                      Agent Engine
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">Instruct the agent what to buy and when. You decide between Buy Now or Leave when matched.</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction Form */}
            {!result ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                    Natural Language Directive:
                  </label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder='e.g. "Buy Sony WH-1000XM5 when the price drops to 30000"'
                      className="w-full bg-[#0e0e11] border border-zinc-800 focus:border-zinc-600 rounded-xl p-3.5 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none transition font-sans resize-none"
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
                  <div className="p-3 rounded-lg bg-zinc-900 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Example Quick-Pick Prompts */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block mb-2">
                    Example directives:
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
                        className="w-full text-left p-2.5 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-750 text-xs text-zinc-300 hover:text-white transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <span className="font-mono text-xs text-zinc-300">{ex.text}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="button"
                  disabled={submitting || !promptInput.trim()}
                  onClick={() => handleParseAndSubmit()}
                  className="w-full bg-zinc-100 hover:bg-white text-black font-semibold py-3 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-xs shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>{submitting ? 'Instructing Agent...' : 'Delegate Buy Directive to Agent'}</span>
                </button>
              </div>
            ) : (
              /* Agent Notification & Match Card */
              <div className="space-y-5 animate-fade-in-up">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 font-mono">
                      {result.isTargetMet ? 'TARGET MET — PRE-FLIGHT VERIFIED' : 'DIRECTIVE ACTIVE IN BACKGROUND'}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {result.message}
                    </p>
                  </div>
                </div>

                {/* Product Detail Snippet */}
                <div className="p-4 rounded-xl bg-black border border-zinc-850 flex items-center gap-3.5">
                  {result.product?.imageUrl && (
                    <img
                      src={result.product.imageUrl}
                      alt={result.product.title}
                      className="w-12 h-12 rounded-lg object-contain bg-zinc-900 border border-zinc-800 p-1"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-zinc-100 truncate">
                      {result.product?.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1">
                      <span>Best: <strong className="text-emerald-400">{formatCurrency(result.product?.currentBestPrice, currency)}</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="text-zinc-200">{formatCurrency(result.rule?.targetPrice, currency)}</strong></span>
                    </div>

                    {result.product?.bestOffer?.sellerName && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                        <span>Merchant:</span>
                        <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
                          {result.product.bestOffer.sellerName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Required Action Buttons: BUY NOW vs LEAVE */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-1/2 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-medium text-xs transition-colors border border-zinc-800 cursor-pointer"
                  >
                    Leave
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      if (result.product && result.product.bestOffer) {
                        onInitiateCheckout(result.product, result.product.bestOffer);
                      }
                    }}
                    className="w-1/2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
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
