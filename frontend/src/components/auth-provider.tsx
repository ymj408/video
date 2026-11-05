"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  getCurrentUser,
  isAbortError,
  loginDemoUser,
  errorMessage,
} from "@/lib/api";
import { CURRENT_USER_STORAGE_KEY } from "@/lib/constants";
import type { DemoUser } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "anonymous" | "error";

interface AuthContextValue {
  status: AuthStatus;
  user: DemoUser | null;
  error: string | null;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<DemoUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const storedId = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!storedId) {
      setStatus("anonymous");
      setUser(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    getCurrentUser(storedId, controller.signal)
      .then((nextUser) => {
        if (cancelled) return;
        setUser(nextUser);
        setStatus("authenticated");
      })
      .catch((nextError: unknown) => {
        if (cancelled || isAbortError(nextError)) return;
        if (nextError instanceof ApiError && nextError.status === 401) {
          window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
          setUser(null);
          setStatus("anonymous");
          setError(null);
          return;
        }
        setUser(null);
        setStatus("error");
        setError(errorMessage(nextError));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [retryCount]);

  const login = useCallback(async (userId: string) => {
    const selected = await loginDemoUser(userId);
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, selected.id);
    setUser(selected);
    setError(null);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    setUser(null);
    setError(null);
    setStatus("anonymous");
  }, []);

  const retry = useCallback(() => {
    setRetryCount((value) => value + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, error, login, logout, retry }),
    [status, user, error, login, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
