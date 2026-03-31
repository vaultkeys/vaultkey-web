"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Env = "mainnet" | "testnet";

interface EnvCtx {
  env: Env;
  setEnv: (e: Env) => void;
  isTestnet: boolean;
  mainnetUrl: string;
  testnetUrl: string;
  baseUrl: string;
  hydrated: boolean;
}

const MAINNET_URL = process.env.NEXT_PUBLIC_MAINNET_BACKEND_URL ?? "http://localhost:8080";
const TESTNET_URL = process.env.NEXT_PUBLIC_TESTNET_BACKEND_URL ?? "http://localhost:8081";
const STORAGE_KEY = "vaultkey_env";

const EnvContext = createContext<EnvCtx>({
  env: "testnet",
  setEnv: () => {},
  isTestnet: true,
  mainnetUrl: MAINNET_URL,
  testnetUrl: TESTNET_URL,
  baseUrl: TESTNET_URL,
  hydrated: false,
});

export function EnvProvider({ children }: { children: React.ReactNode }) {
  const [env, setEnvState] = useState<Env>("testnet"); // same on server and client
  const [hydrated, setHydrated] = useState(false);

  // Only runs on client — reads localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Env | null;
      if (stored === "testnet" || stored === "mainnet") {
        setEnvState(stored);
      }
    } catch {}
    setHydrated(true);
  }, []);

  const setEnv = useCallback((e: Env) => {
    setEnvState(e);
    try { localStorage.setItem(STORAGE_KEY, e); } catch {}
  }, []);

  const baseUrl = env === "testnet" ? TESTNET_URL : MAINNET_URL;

  return (
    <EnvContext.Provider value={{
      env,
      setEnv,
      isTestnet: env === "testnet",
      mainnetUrl: MAINNET_URL,
      testnetUrl: TESTNET_URL,
      baseUrl,
      hydrated,
    }}>
      {hydrated ? children : null}
    </EnvContext.Provider>
  );
}

export const useEnv = () => useContext(EnvContext);