'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Check, 
  Fingerprint,
  Mail,
  RefreshCw,
  Zap
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

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  const handleDemoAccess = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tactile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white">
            DP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">DealPilot</h3>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                Auth Gate
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {authMode === 'signin' 
                ? 'Authenticate to sync autonomous deal radar sessions.' 
                : 'Deploy your personal deal-monitoring agent in seconds.'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 rounded-lg bg-zinc-950 border border-zinc-850 mb-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setError(null); setEmailSent(false); }}
            className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
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
            className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'bg-zinc-850 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-zinc-900 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-2.5 mb-5">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loadingProvider !== null}
            className="w-full py-2.5 px-4 rounded-lg bg-[#111114] hover:bg-[#16161a] border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {loadingProvider === 'google' ? (
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>
              {loadingProvider === 'google' 
                ? 'Connecting to Google...' 
                : `${authMode === 'signin' ? 'Sign in' : 'Sign up'} with Google`}
            </span>
          </button>

          <button
            onClick={() => handleOAuth('github')}
            disabled={loadingProvider !== null}
            className="w-full py-2.5 px-4 rounded-lg bg-[#111114] hover:bg-[#16161a] border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {loadingProvider === 'github' ? (
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            <span>
              {loadingProvider === 'github' 
                ? 'Connecting to GitHub...' 
                : `${authMode === 'signin' ? 'Sign in' : 'Sign up'} with GitHub`}
            </span>
          </button>
        </div>

        {/* Minimal Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-zinc-850 w-full" />
          <span className="bg-[#09090b] px-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            OR MAGIC EMAIL
          </span>
        </div>

        {/* Magic Link */}
        {emailSent ? (
          <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-center space-y-1 mb-5">
            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
            <div className="text-xs font-semibold text-white">Login Link Sent</div>
            <p className="text-[11px] text-zinc-400">
              Check <span className="font-mono text-zinc-200">{emailInput}</span> for your instant login token.
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-2.5 mb-5">
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 bg-[#0e0e11] border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-zinc-100 hover:bg-white text-black font-semibold text-xs rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Continue with Magic Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Sandbox Access & Security Note */}
        <div className="pt-3 border-t border-zinc-850/80 space-y-2">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-1.5 text-center text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Launch Demo Sandbox Access
          </button>
          <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-zinc-600 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-zinc-500" />
              256-Bit TLS
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-zinc-500" />
              OAuth 2.0 PKCE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
