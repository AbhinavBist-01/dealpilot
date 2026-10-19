'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Bell,
  LineChart,
  CreditCard,
  CheckCircle2,
  Minimize2,
  Maximize2,
  RefreshCw,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, getDealScoreBadgeColor } from '../utils/formatters';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  action?: {
    type: 'search_results' | 'rule_created' | 'price_history' | 'comparison';
    products?: any[];
    rule?: any;
    history?: any;
    comparison?: any;
  };
  suggestedPrompts?: string[];
  timestamp: string;
}

interface ShoppingCopilotProps {
  onTrackProduct: (product: any, offer?: any) => void;
  onViewHistory: (product: any) => void;
  onBuyProduct: (product: any, offer?: any) => void;
  onNavigateTab: (tab: 'search' | 'watches' | 'alerts' | 'simulation') => void;
}

export const ShoppingCopilot: React.FC<ShoppingCopilotProps> = ({
  onTrackProduct,
  onViewHistory,
  onBuyProduct,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hi! I'm your **DealPilot Shopping Copilot**. I can find live deals, set automated price-drop alerts, analyze 30-day price trajectories, or compare products side-by-side.",
      suggestedPrompts: [
        '🎧 Find headphones under ₹20,000',
        '⚡ Track Sony XM5 under ₹15,000',
        '📊 Show price history for Sony XM5',
        '⚖️ Compare top headphones',
      ],
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.sender,
        content: m.text,
      }));

      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Here is what I found for you:',
        action: data.action,
        suggestedPrompts: data.suggestedPrompts,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue connecting to the deal intelligence engine. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-bold px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform hover:scale-105 border border-emerald-400/30 group"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
          </div>
          <span className="text-xs uppercase tracking-wider font-black">AI Copilot</span>
        </button>
      )}

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-[460px] h-[640px] max-h-[90vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-100 text-sm">DealPilot Copilot</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    GPT-6 Luna
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Autonomous Shopping Assistant</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
                title="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2.5 ${m.sender === 'user' ? 'items-end' : ''}`}>
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none shadow-md'
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* Action Payload: Search Results */}
                  {m.action?.type === 'search_results' && m.action.products && (
                    <div className="space-y-2 pt-1">
                      {m.action.products.slice(0, 3).map((prod) => {
                        const badge = getDealScoreBadgeColor(prod.dealScore);
                        return (
                          <div
                            key={prod.id}
                            className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.title}
                                  className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-100 truncate text-[11px]">
                                  {prod.title}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-bold text-emerald-400 text-xs">
                                    {formatCurrency(prod.price, prod.currency)}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${badge.bg} ${badge.text} ${badge.border}`}
                                  >
                                    {prod.dealScore} / 100
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onViewHistory(prod.rawProduct || prod)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition"
                                title="View price chart"
                              >
                                <LineChart className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onTrackProduct(prod.rawProduct || prod, prod.rawOffer)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                                title="Track price"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onBuyProduct(prod.rawProduct || prod, prod.rawOffer)}
                                className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition"
                                title="Buy now"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Action Payload: Rule Created */}
                  {m.action?.type === 'rule_created' && m.action.rule && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Background Monitor Active</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Tracking <span className="font-bold text-white">{m.action.rule.productTitle}</span> at target threshold{' '}
                        <span className="font-bold text-emerald-400">₹{m.action.rule.targetPrice.toLocaleString()}</span>.
                      </div>
                      <button
                        onClick={() => onNavigateTab('watches')}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>View in Watches tab</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Action Payload: Price History */}
                  {m.action?.type === 'price_history' && m.action.history && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Current</span>
                        <span className="font-bold text-slate-200">
                          ₹{m.action.history.currentPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">All-Time Lowest</span>
                        <span className="font-bold text-emerald-400">
                          ₹{m.action.history.lowestRecorded.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Drop from Peak</span>
                        <span className="font-bold text-amber-400">
                          {m.action.history.dropPercent}% (₹{m.action.history.savingsVsHigh.toLocaleString()} saved)
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onViewHistory({ id: m.action?.history.productId, title: m.action?.history.title })
                        }
                        className="w-full mt-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <LineChart className="w-3 h-3 text-indigo-400" />
                        <span>Open Interactive Trajectory Chart</span>
                      </button>
                    </div>
                  )}

                  {/* Action Payload: Comparison */}
                  {m.action?.type === 'comparison' && m.action.comparison && (
                    <div className="space-y-1.5 pt-1">
                      {m.action.comparison.map((c: any) => (
                        <div
                          key={c.id}
                          className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 truncate">{c.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {c.condition} · Score {c.dealScore}/100 · {c.sellerName}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-emerald-400">₹{c.price.toLocaleString()}</div>
                            <button
                              onClick={() => onBuyProduct(c.rawProduct || c, c.rawOffer)}
                              className="text-[10px] text-indigo-400 hover:underline font-semibold"
                            >
                              Checkout
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Prompts */}
                  {m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggestedPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(prompt)}
                          className="text-[10px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700/60 transition text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-500">{m.timestamp}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>DealPilot Copilot is reasoning with GPT-6 Luna...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-2xl px-3 py-1.5 focus-within:border-emerald-500 transition"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Copilot (e.g. 'Find headphones < 15k', 'Track Sony XM5')..."
                className="flex-1 bg-transparent text-slate-100 text-xs focus:outline-none placeholder-slate-500 py-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-xl transition"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
