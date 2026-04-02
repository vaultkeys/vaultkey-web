"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useEnv } from "@/hooks/useEnv";
import { Chain, makeCloud } from "@/lib/api";

interface ChainsCtx {
  chains: Chain[];
  chainsLoading: boolean;
  chainsError: string | null;
  /** Call this from any page that needs chains. No-op if already loaded. */
  ensureChains: () => Promise<void>;
}

const ChainsContext = createContext<ChainsCtx>({
  chains: [],
  chainsLoading: false,
  chainsError: null,
  ensureChains: async () => {},
});

export function ChainsProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const { baseUrl, env } = useEnv();

  const [chains, setChains] = useState<Chain[]>([]);
  const [chainsLoading, setChainsLoading] = useState(false);
  const [chainsError, setChainsError] = useState<string | null>(null);

  // Track the env for which chains are currently loaded.
  // This lets us detect a stale cache after an env switch.
  const loadedEnvRef = useRef<string | null>(null);

  // Guard against concurrent fetches: if a fetch is already in-flight,
  // additional ensureChains() calls should wait for it rather than fire again.
  const fetchingRef = useRef(false);
  const pendingRef = useRef<Array<() => void>>([]);

  // When the environment switches, invalidate the cache.
  useEffect(() => {
    setChains([]);
    setChainsError(null);
    loadedEnvRef.current = null;
    fetchingRef.current = false;
    pendingRef.current = [];
  }, [env]);

  const ensureChains = useCallback(async () => {
    // Already loaded for this env — nothing to do.
    if (loadedEnvRef.current === env && chains.length > 0) return;

    // A fetch is already in-flight — queue up and wait for it to resolve.
    if (fetchingRef.current) {
      return new Promise<void>((resolve) => {
        pendingRef.current.push(resolve);
      });
    }

    fetchingRef.current = true;
    setChainsLoading(true);
    setChainsError(null);

    const resolvePending = () => {
      const queue = pendingRef.current.splice(0);
      queue.forEach((resolve) => resolve());
    };

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const api = makeCloud(baseUrl);
      const res = await api.getChains(token);

      setChains(res.chains);
      loadedEnvRef.current = env;
      setChainsError(null);
    } catch (e: any) {
      // Don't cache a failed result so the next caller can retry.
      setChainsError(e.message ?? "Failed to load chains");
      setChains([]);
      loadedEnvRef.current = null;
    } finally {
      fetchingRef.current = false;
      setChainsLoading(false);
      resolvePending();
    }
  }, [env, baseUrl, getToken, chains.length]);

  return (
    <ChainsContext.Provider value={{ chains, chainsLoading, chainsError, ensureChains }}>
      {children}
    </ChainsContext.Provider>
  );
}

export const useChains = () => useContext(ChainsContext);