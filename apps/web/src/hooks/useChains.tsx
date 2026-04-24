"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useEnv } from "@/hooks/useEnv";
import { Chain, makeCloud } from "@/lib/api";

interface ChainsCtx {
  chains: Chain[];
  chainsLoading: boolean;
  chainsError: string | null;
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

  const loadedEnvRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);
  const pendingRef = useRef<Array<() => void>>([]);
  const chainsLoadedRef = useRef(false);

  useEffect(() => {
    setChains([]);
    setChainsError(null);
    loadedEnvRef.current = null;
    chainsLoadedRef.current = false;
    fetchingRef.current = false;
    pendingRef.current = [];
  }, [env]);

  const ensureChains = useCallback(async () => {
    if (loadedEnvRef.current === env && chainsLoadedRef.current) return;

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

      const incoming = Array.isArray(res) ? res : [];
      setChains(incoming);
      chainsLoadedRef.current = incoming.length > 0;
      loadedEnvRef.current = env;
      setChainsError(null);
    } catch (e: any) {
      setChainsError(e.message ?? "Failed to load chains");
      setChains([]);
      chainsLoadedRef.current = false;
      loadedEnvRef.current = null;
    } finally {
      fetchingRef.current = false;
      setChainsLoading(false);
      resolvePending();
    }
  }, [env, baseUrl, getToken]);

  return (
    <ChainsContext.Provider value={{ chains, chainsLoading, chainsError, ensureChains }}>
      {children}
    </ChainsContext.Provider>
  );
}

export const useChains = () => useContext(ChainsContext);