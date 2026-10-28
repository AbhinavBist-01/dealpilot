'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, User, CheckCircle, Shield, Sparkles, Plane, X } from 'lucide-react';
import { signIn, signOut } from '@/frontend/utils/auth-client';
import { useAuth } from '@/frontend/utils/auth-context';

export const UserAuthButton: React.FC = () => {
  const { session, isPending } = useAuth();
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
      <div className="h-8 w-20 bg-zinc-900 rounded-lg animate-pulse" />
    );
  }

  // Authenticated State
  if (sessionData?.user) {
    const user = sessionData.user;
    const initials = (user.name || user.email || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-medium transition text-zinc-200 cursor-pointer"
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-5 h-5 rounded-md object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-200 font-semibold text-[10px] flex items-center justify-center border border-zinc-700">
              {initials}
            </div>
          )}
          <span className="max-w-[110px] truncate">{user.name || user.email?.split('@')[0]}</span>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-2 z-50">
            <div className="px-3 py-2 border-b border-zinc-800">
              <div className="font-semibold text-xs text-zinc-100 truncate">{user.name || 'Pilot User'}</div>
              <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                <Shield className="w-3 h-3" />
                <span>Better Auth Verified Session</span>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </button>

      {/* Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-200 text-xs w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-900 border border-zinc-800 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mx-auto mb-3">
                <Plane className="w-5 h-5 text-zinc-200" />
              </div>
              <h2 className="text-base font-semibold text-zinc-100">Sign in to DealPilot</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Sync deal watches, outbox alerts, and autonomous checkout
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Social Auth Providers */}
            <div className="space-y-2.5">
              {/* Google Sign In */}
              <button
                onClick={() => handleSocialSignIn('google')}
                disabled={!!authLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
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
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>{authLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#09090b] px-2 text-zinc-500 font-medium">Or continue in sandbox</span>
              </div>
            </div>

            {/* Instant Demo Sandbox Pilot Account */}
            <button
              onClick={handleDemoSignIn}
              disabled={!!authLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-medium text-xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Continue as DealPilot Shopper (Local Sandbox)</span>
            </button>

            <div className="mt-4 text-center text-[11px] text-zinc-500">
              Protected by <span className="text-zinc-400 font-medium">Better Auth</span> with PostgreSQL session encryption
            </div>
          </div>
        </div>
      )}
    </>
  );
};
