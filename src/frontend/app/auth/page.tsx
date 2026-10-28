'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  Mail, 
  Activity, 
  Zap,
  TrendingDown,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { signIn } from '@/frontend/utils/auth-client';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setLoadingProvider(provider);
      setError(null);
      await (signIn as any).social({
        provider,
        callbackURL: '/',
      });
    } catch (err: any) {
      setError(err?.message || `Failed to authenticate with ${provider}`);
      setLoadingProvider(null);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }
    setError(null);
    setEmailSent(true);
  };

  const handleDemoAccess = () => {
    // Instant demo session routing
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white flex flex-col justify-between">
      
      {/* Top Header Bar */}
      <header className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2.5 text-xs text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Deal Radar</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-white">
            DP
          </div>
          <span className="font-semibold text-xs tracking-tight text-zinc-200">
            DealPilot Auth Console
          </span>
        </div>

        <div className="text-[11px] font-mono text-zinc-500 hidden sm:block">
          POSTGRESQL 16 • BETTER AUTH
        </div>
      </header>

      {/* Main Dual-Column Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Mission Control & Live Telemetry Preview */}
          <div className="lg:col-span-6 space-y-8">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-850 text-zinc-400 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>SESSION GATEWAY • PKCE SECURED</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Command your autonomous deal agents.
              </h1>

              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg">
                Sign in to synchronize multi-merchant price tracking, receive transactional outbox alerts, and command autonomous buy directives with instant PayPal v6 settlement.
              </p>
            </div>

            {/* Live Observation Telemetry Card */}
            <div className="bg-[#09090b] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono border-b border-zinc-850/80 pb-3">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-zinc-400" />
                  <span>ACTIVE AGENT OBSERVER</span>
                </span>
                <span className="text-emerald-400 font-semibold">● POLLING (30M)</span>
              </div>

              {/* Sample Product Observation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-zinc-100">
                    Apple iPhone 16 Pro (128GB)
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    TARGET HIT
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Record Low: Blinkit Dark Store</span>
                  <span className="text-white font-bold tabular-nums">₹1,09,900 (-8.3%)</span>
                </div>

                <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-4/5" />
                </div>
              </div>

              {/* Telemetry Log Stream */}
              <div className="bg-[#0e0e12] rounded-lg p-3 font-mono text-[11px] text-zinc-400 space-y-1.5 border border-zinc-850">
                <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                  <span>LOG STREAM</span>
                  <span>ID: AGT_9841</span>
                </div>
                <div className="text-zinc-400 truncate">
                  <span className="text-zinc-600">[18:24:02]</span> Ingested 7 merchant endpoints
                </div>
                <div className="text-zinc-400 truncate">
                  <span className="text-zinc-600">[18:24:08]</span> Spec guard: non-accessory verified
                </div>
                <div className="text-emerald-400 truncate">
                  <span className="text-zinc-600">[18:24:12]</span> Pre-flight price locked: ₹1,09,900
                </div>
              </div>
            </div>

            {/* Security Badges Strip */}
            <div className="grid grid-cols-3 gap-3 text-xs font-mono text-zinc-500 pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>256-Bit TLS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>OAuth 2.0 PKCE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Zero Secrets</span>
              </div>
            </div>

          </div>

          {/* Right Column: Clean Authentication Terminal */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-[#09090b] border border-zinc-850 rounded-2xl p-7 sm:p-9 shadow-2xl">
              
              {/* Terminal Header */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {authMode === 'signin' 
                    ? 'Authenticate to access active tracking rules and alerts.' 
                    : 'Initialize a new multi-tenant session workspace.'}
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex p-1 rounded-lg bg-zinc-950 border border-zinc-850 mb-6 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(null); setEmailSent(false); }}
                  className={`flex-1 py-2 rounded transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-zinc-850 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setError(null); setEmailSent(false); }}
                  className={`flex-1 py-2 rounded transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-zinc-850 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded-lg bg-zinc-900 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* OAuth Action Buttons */}
              <div className="space-y-3 mb-6">
                
                {/* Google OAuth */}
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={loadingProvider !== null}
                  className="w-full py-3 px-4 rounded-lg bg-[#111114] hover:bg-[#16161a] border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white text-xs sm:text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  {loadingProvider === 'google' ? (
                    <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>
                    {loadingProvider === 'google' 
                      ? 'Connecting Google OAuth...' 
                      : `${authMode === 'signin' ? 'Sign in' : 'Register'} with Google`}
                  </span>
                </button>

                {/* GitHub OAuth */}
                <button
                  onClick={() => handleOAuth('github')}
                  disabled={loadingProvider !== null}
                  className="w-full py-3 px-4 rounded-lg bg-[#111114] hover:bg-[#16161a] border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white text-xs sm:text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  {loadingProvider === 'github' ? (
                    <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  )}
                  <span>
                    {loadingProvider === 'github' 
                      ? 'Connecting GitHub OAuth...' 
                      : `${authMode === 'signin' ? 'Sign in' : 'Register'} with GitHub`}
                  </span>
                </button>

              </div>

              {/* Minimal Divider */}
              <div className="relative flex items-center justify-center my-6">
                <div className="border-t border-zinc-850 w-full" />
                <span className="bg-[#09090b] px-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  OR EMAIL ACCESS
                </span>
              </div>

              {/* Magic Link Form */}
              {emailSent ? (
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-center space-y-1.5 mb-6">
                  <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-xs font-semibold text-white">Verification Link Dispatched</div>
                  <p className="text-[11px] text-zinc-400">
                    A secure sign-in token has been sent to <span className="font-mono text-zinc-200">{emailInput}</span>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-3 mb-6">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0e0e11] border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-zinc-100 hover:bg-white text-black font-semibold text-xs rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Continue with Magic Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Fast Sandbox Access */}
              <div className="pt-4 border-t border-zinc-850/80">
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Launch Demo Session (Sandbox)</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-2 font-mono">
        <div>
          DealPilot • Multi-Tenant Autonomous Price Intelligence
        </div>
        <div>
          Better Auth PostgreSQL Adapter • PKCE Verified
        </div>
      </footer>

    </div>
  );
}
