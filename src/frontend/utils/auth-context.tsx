'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useSession as useBetterAuthSession, signIn, signOut } from '@/frontend/utils/auth-client';

interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  [key: string]: any;
}

interface AuthContextType {
  session: any | null;
  user: User | null;
  isPending: boolean;
  isInitialLoading: boolean;
  signIn: typeof signIn;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isPending: true,
  isInitialLoading: true,
  signIn,
  signOut: async () => {},
  refreshSession: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Call Better Auth useSession EXACTLY ONCE at the root provider
  const { data: rawSession, isPending: rawIsPending, error } = useBetterAuthSession();
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false);
  const [cachedSession, setCachedSession] = useState<any | null>(null);

  useEffect(() => {
    if (!rawIsPending) {
      setHasResolvedOnce(true);
      if (rawSession) {
        setCachedSession(rawSession);
      } else {
        setCachedSession(null);
      }
    }
  }, [rawIsPending, rawSession]);

  const activeSession = rawSession || cachedSession;
  const user = (activeSession as any)?.user || null;

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setCachedSession(null);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    // Optional manual refresh without causing polling loops
    try {
      const res = await fetch('/api/auth/get-session');
      if (res.ok) {
        const data = await res.json();
        setCachedSession(data);
      }
    } catch (err) {
      console.warn('Failed to refresh session:', err);
    }
  }, []);

  const value = useMemo(
    () => ({
      session: activeSession,
      user,
      isPending: !hasResolvedOnce && rawIsPending,
      isInitialLoading: !hasResolvedOnce,
      signIn,
      signOut: handleSignOut,
      refreshSession,
    }),
    [activeSession, user, hasResolvedOnce, rawIsPending, handleSignOut, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
