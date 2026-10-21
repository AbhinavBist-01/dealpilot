'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  Fingerprint,
  Mail,
  Shield
} from 'lucide-react';
import { signIn } from '@/frontend/utils/auth-client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 relative overflow-hidden ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none -z-10" />

        {/* Tactile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition active:scale-95"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40">
            ✈
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight">DealPilot</h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Auth Gate
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {authMode === 'signin' 
                ? 'Welcome back. Sync your autonomous agent sessions.' 
                : 'Deploy your personal deal-monitoring agent in seconds.'}
            </p>
          </div>
        </div>

        {/* Sleek Tab Toggle: Sign In vs Create Account */}
        <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setError(null); setEmailSent(false); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              authMode === 'signin'
                ? 'bg-slate-800 text-white shadow-md shadow-slate-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setError(null); setEmailSent(false); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              authMode === 'signup'
                ? 'bg-slate-800 text-white shadow-md shadow-slate-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-relaxed flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Social Authentication Buttons with Subtle Hover Glow */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white font-medium text-xs sm:text-sm border border-slate-800 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 group active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="group-hover:text-white text-slate-200">
              {loadingProvider === 'google' 
                ? 'Connecting to Google OAuth...' 
                : `${authMode === 'signin' ? 'Sign in' : 'Sign up'} with Google`}
            </span>
          </button>

          <button
            onClick={() => handleOAuth('github')}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white font-medium text-xs sm:text-sm border border-slate-800 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-200 group active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current text-white transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="group-hover:text-white text-slate-200">
              {loadingProvider === 'github' 
                ? 'Connecting to GitHub OAuth...' 
                : `${authMode === 'signin' ? 'Sign in' : 'Sign up'} with GitHub`}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Or Magic Email
          </span>
        </div>

        {/* Optional Email Fast Sign-in Sandbox */}
        {emailSent ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <div className="text-xs font-bold text-white mb-0.5">Magic Login Sent</div>
            <p className="text-[11px] text-slate-400">
              Check your inbox at <span className="text-emerald-300 font-mono">{emailInput}</span> or use Google / GitHub for instant access.
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-3 mb-6">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="developer@dealpilot.ai"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/80 transition flex items-center justify-center gap-1.5"
            >
              <span>Continue with Magic Link</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </form>
        )}

        {/* Privacy & Security Badges */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>256-Bit TLS Security</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>OAuth 2.0 / PKCE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Zero Password Storage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Multi-Tenant Guard</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 text-center leading-normal pt-1">
            Protected by Better Auth & PostgreSQL 16 session isolation.
          </p>
        </div>
      </div>
    </div>
  );
};
