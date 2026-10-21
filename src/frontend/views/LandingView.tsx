'use client';

import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Lock, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  ShoppingBag
} from 'lucide-react';
import { signIn } from '@/frontend/utils/auth-client';

interface LandingViewProps {
  onOpenAuthModal: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onOpenAuthModal }) => {
  const [authLoading, setAuthLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setAuthLoading(provider);
      await (signIn as any).social({
        provider,
        callbackURL: '/',
      });
    } catch {
      setAuthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -top-40 right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Minimalist Top Nav */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              ✈
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">DealPilot</span>
              <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Agentic Commerce
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              Sign In
            </button>
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition rounded-lg shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-8 backdrop-blur shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Autonomous deal-hunting & price drop execution engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08] mb-6">
          Never Overpay. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            Let the Agent Pilot Your Deals.
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          DealPilot streams real merchant catalog offers, filters junk accessories, scores deal value deterministically, and executes automated PayPal checkouts the exact moment prices plummet.
        </p>

        {/* Primary CTA Area */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-14">
          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all rounded-xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <span>Launch Deal Dashboard</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleOAuth('google')}
              disabled={authLoading !== null}
              className="flex-1 sm:flex-initial px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition rounded-xl flex items-center justify-center gap-2 shadow-sm"
              title="Sign in with Google"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>
            <button
              onClick={() => handleOAuth('github')}
              disabled={authLoading !== null}
              className="flex-1 sm:flex-initial px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition rounded-xl flex items-center justify-center gap-2 shadow-sm"
              title="Sign in with GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        </div>

        {/* Glassmorphic Live Preview Card */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-2 sm:p-4 shadow-2xl shadow-emerald-950/20 text-left">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 mb-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] text-slate-500">dealpilot://authenticated-console</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <Lock className="w-3 h-3" />
              <span>Protected Session</span>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Direct Search Ingestion</span>
                <span className="text-emerald-400 font-mono">0ms delay</span>
              </div>
              <div className="text-lg font-bold text-white mb-1">Channel3 Commerce</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live domain extraction from Macy's, Best Buy, and direct retailers with exact currency data.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Adaptive Polling</span>
                <span className="text-teal-400 font-mono">BullMQ + Redis</span>
              </div>
              <div className="text-lg font-bold text-white mb-1">Autonomous Watches</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                2-hour default polling escalates to 30 minutes when prices get within 5% of target threshold.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Atomic Checkout</span>
                <span className="text-sky-400 font-mono">PayPal Orders v2</span>
              </div>
              <div className="text-lg font-bold text-white mb-1">Pre-Flight Guard</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live stock and price shift gatekeeper guarantees no price surprises at checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars / Core Mechanics */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Engineering & Autonomy</div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">How DealPilot Operates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Intent Guard & Accessory Filter</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never get tricked by a $12 silicone case when searching for $300 headphones. Our deterministic verifier scores model token relevance and discards noise.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Transactional Outbox Alerts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Price drops enqueue atomic database events. The outbox worker dispatches responsive HTML emails with deduplication keys to ensure zero duplicate notifications.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">PayPal Agent Toolkit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equipped with official `@paypal/agent-toolkit/openai` primitives (`create_order`, `get_order`, `pay_order`) for autonomous, secure transaction completion.
            </p>
          </div>
        </div>
      </section>

      {/* Minimal Footer CTA */}
      <footer className="border-t border-slate-800/80 py-12 text-center bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">DealPilot</span>
            <span>—</span>
            <span>Autonomous Shopping & Deal Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onOpenAuthModal} className="hover:text-slate-300 transition">
              Sign In
            </button>
            <button onClick={onOpenAuthModal} className="hover:text-emerald-400 font-semibold transition">
              Get Started →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
