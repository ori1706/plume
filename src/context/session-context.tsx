"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type UserMini = {
  id: string;
  handle: string;
  name: string;
  avatarUrl: string;
  bio: string;
};

type SessionContextValue = {
  token: string | null;
  user: UserMini | null;
  ready: boolean;
  refreshUser: () => Promise<void>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  setToken: (t: string | null) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserMini | null>(null);
  const [ready, setReady] = useState(false);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem("plume_token", t);
      else localStorage.removeItem("plume_token");
    }
  }, []);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const t =
        token ??
        (typeof window !== "undefined"
          ? localStorage.getItem("plume_token")
          : null);
      if (t) headers.set("Authorization", `Bearer ${t}`);
      return fetch(input, { ...init, headers });
    },
    [token],
  );

  const refreshUser = useCallback(async () => {
    const t =
      typeof window !== "undefined" ? localStorage.getItem("plume_token") : null;
    if (!t) return;
    const r = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (r.ok) {
      const data = await r.json();
      setUser(data.user);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const existing =
        typeof window !== "undefined"
          ? localStorage.getItem("plume_token")
          : null;
      if (!existing) {
        const boot = await fetch("/api/auth/bootstrap", { method: "POST" });
        const data = await boot.json();
        if (data.token) {
          localStorage.setItem("plume_token", data.token);
          setTokenState(data.token);
          setUser(data.user);
        }
      } else {
        setTokenState(existing);
        const me = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${existing}` },
        });
        if (me.ok) {
          const data = await me.json();
          setUser(data.user);
        }
      }
      setReady(true);
    })();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      refreshUser,
      authFetch,
      setToken,
    }),
    [token, user, ready, refreshUser, authFetch, setToken],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx)
    throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
