import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getMe,
  loginRequest,
  register,
  RegisterPayload,
  setUnauthorizedHandler,
} from '../api/client';
import { clearToken, loadToken, setToken } from '../api/authStore';
import { ApiUser } from '../api/types';

type AuthContextValue = {
  token: string | null;
  user: ApiUser | null;
  userId: number | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  // Restore a persisted session on launch.
  useEffect(() => {
    let active = true;
    (async () => {
      // Wrapped end-to-end: previously only the getMe() call inside had a
      // try/catch, so a rejection from loadToken() itself, or from the
      // clearToken() called on the getMe() failure path, propagated out of
      // this IIFE uncaught — setLoading(false) below never ran, and the app
      // was stuck on App.tsx's splash spinner forever with no recovery
      // short of a reinstall. Falling back to "logged out" on any failure
      // here is always a safe, reachable terminal state.
      try {
        const stored = await loadToken();
        if (!active) {
          return;
        }
        if (stored) {
          try {
            const me = await getMe();
            if (active) {
              setTokenState(stored);
              setUser(me);
            }
          } catch {
            await clearToken();
          }
        }
      } catch {
        // Storage itself failed (loadToken or the clearToken above) —
        // treat as logged out rather than leaving loading stuck.
        setTokenState(null);
        setUser(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Any 401 from the API layer drops us back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await loginRequest(email, password);
    await setToken(access_token);
    const me = await getMe();
    setTokenState(access_token);
    setUser(me);
  }, []);

  const signup = useCallback(async (payload: RegisterPayload) => {
    const { access_token } = await register(payload);
    await setToken(access_token);
    const me = await getMe();
    setTokenState(access_token);
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      userId: user?.id ?? null,
      loading,
      login,
      signup,
      logout,
    }),
    [token, user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
