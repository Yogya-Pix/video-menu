"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "./api";
import type { SessionRestaurant, SessionUser } from "./types";

interface SessionState {
  user: SessionUser;
  restaurant: SessionRestaurant;
}

interface SessionContextValue {
  session: SessionState | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<SessionState>("/api/auth/me");
      setSession(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
      }
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading, refresh: load }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
