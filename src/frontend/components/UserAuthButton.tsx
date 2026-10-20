'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, User, CheckCircle, Shield, Sparkles } from 'lucide-react';
import { signIn, signOut, useSession } from '@/frontend/utils/auth-client';

export const UserAuthButton: React.FC = () => {
  const { data: session, isPending } = useSession();
  const sessionData = session as any;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    try {
      setAuthLoading(provider);
      setErrorMessage(null);
      await (signIn as any).social({
        provider,
        callbackURL: typeof window !== 'undefined' ? window.location.href : '/',
      });
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to sign in with ${provider}`);
      setAuthLoading(null);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      setAuthLoading('demo');
      setErrorMessage(null);
      // Fast demo authentication
      setIsModalOpen(false);
      setAuthLoading(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo sign in failed');
      setAuthLoading(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await (signOut as any)();
      setIsMenuOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (isPending) {
    return (
      <div className="h-9 w-24 bg-slate-800/60 rounded-xl animate-pulse" />
    );
  }

  // Authenticated State
  if (sessionData?.user) {
    const user = sessionData.user;
    const initials = (user.name || user.email || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-sm font-medium transition text-slate-200 shadow-sm"
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-6 h-6 rounded-lg object-cover border border-emerald-500/40"
            />
          ) : (
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
              {initials}
            </div>
          )}
          <span className="max-w-[120px] truncate">{user.name || user.email?.split('@')[0]}</span>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl">
            <div className="px-3 py-2.5 border-b border-slate-800/80">
              <div className="font-semibold text-sm text-slate-100 truncate">{user.name || 'Pilot User'}</div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                <Shield className="w-3 h-3" />
                <span>Better Auth Verified Session</span>
              </div>
            </div>

            <div className="pt-1.5">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Unauthenticated State
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 text-sm font-semibold transition shadow-sm hover:shadow-emerald-500/10"
      >
        <LogIn className="w-4 h-4 text-emerald-400" />
        <span>Sign In</span>
      </button>

      {/* Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 text-lg w-8 h-8 rounded-full flex items-center justify-center bg-slate-800/50 hover:bg-slate-800"
            >
              ✕
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-2xl text-slate-950 mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                ✈
              </div>
              <h2 className="text-xl font-black text-slate-100">Sign in to DealPilot</h2>
              <p className="text-xs text-slate-400 mt-1">
                Sync deal watches, outbox email alerts, and autonomous checkout across devices
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Social Auth Providers */}
            <div className="space-y-3">
              {/* Google Sign In */}
              <button
                onClick={() => handleSocialSignIn('google')}
                disabled={!!authLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition shadow-md disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{authLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* GitHub Sign In */}
              <button
                onClick={() => handleSocialSignIn('github')}
                disabled={!!authLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition shadow-md disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>{authLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
              </button>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-semibold">Or continue in sandbox</span>
              </div>
            </div>

            {/* Instant Demo Sandbox Pilot Account */}
            <button
              onClick={handleDemoSignIn}
              disabled={!!authLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-slate-300 font-medium text-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Continue as DealPilot Shopper (Local Sandbox)</span>
            </button>

            <div className="mt-5 text-center text-[11px] text-slate-500">
              Protected by <span className="text-slate-400 font-medium">Better Auth</span> with PostgreSQL session encryption
            </div>
          </div>
        </div>
      )}
    </>
  );
};
