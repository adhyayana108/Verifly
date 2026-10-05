import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as api from "./api";
import type { PublicUser } from "./types";

interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext =
  createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "verifly_token";
const USER_KEY = "verifly_user";

function readStoredUser(): PublicUser | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PublicUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );

  const [user, setUser] =
    useState<PublicUser | null>(
      () => readStoredUser(),
    );

  const [initializing, setInitializing] =
    useState(() => !!localStorage.getItem(TOKEN_KEY));

  const persist = useCallback(
    (newToken: string, newUser: PublicUser) => {
      localStorage.setItem(
        TOKEN_KEY,
        newToken,
      );

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(newUser),
      );

      setToken(newToken);
      setUser(newUser);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string,
    ) => {
      const res = await api.login({
        username,
        password,
      });

      persist(res.token, res.user);
    },
    [persist],
  );

  const registerFn = useCallback(
    async (
      username: string,
      email: string,
      password: string,
    ) => {
      const res = await api.register({
        username,
        email,
        password,
      });

      persist(res.token, res.user);
    },
    [persist],
  );

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      try {
        const currentUser = await api.me();

        if (cancelled) {
          return;
        }

        setUser(currentUser);

        localStorage.setItem(
          USER_KEY,
          JSON.stringify(currentUser),
        );
      } catch {
        if (cancelled) {
          return;
        }

        logout();
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      register: registerFn,
      logout,
    }),
    [
      user,
      token,
      login,
      registerFn,
      logout,
    ],
  );

  if (initializing) {
    return (
      <div className="min-h-screen bg-background" />
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }

  return ctx;
}