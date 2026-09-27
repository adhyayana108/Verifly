import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import * as api from "./api";
import type { PublicUser } from "./types";

interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "verifly_token";
const USER_KEY = "verifly_user";

function readStoredUser(): PublicUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<PublicUser | null>(() => readStoredUser());

  const persist = useCallback((t: string, u: PublicUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await api.login({ username, password });
      persist(res.token, res.user);
    },
    [persist]
  );

  const registerFn = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await api.register({ username, email, password });
      persist(res.token, res.user);
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      register: registerFn,
      logout,
    }),
    [user, token, login, registerFn, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}