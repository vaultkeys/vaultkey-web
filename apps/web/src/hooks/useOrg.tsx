"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useEnv } from "@/hooks/useEnv";
import { makeCloud, type OrgDetail } from "@/lib/api";

interface OrgCtx {
  org: OrgDetail | null;
  orgId: string | null;
  loading: boolean;
  /** true when the user has no org in the current environment */
  needsOnboarding: boolean;
  refetch: () => Promise<void>;
}

const OrgContext = createContext<OrgCtx>({
  org: null,
  orgId: null,
  loading: true,
  needsOnboarding: false,
  refetch: async () => {},
});

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useAuth();
  const { baseUrl, env } = useEnv();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const refetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const api = makeCloud(baseUrl);
      const { organizations } = await api.listOrgs(token);
      if (organizations.length > 0) {
        const detail = await api.getOrg(token, organizations[0]!.id);
        setOrg(detail);
        setNeedsOnboarding(false);
      } else {
        setOrg(null);
        setNeedsOnboarding(true);
      }
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [userId, getToken, baseUrl]);

  // Re-fetch whenever the environment switches
  useEffect(() => {
    setOrg(null);
    setLoading(true);
    refetch();
  }, [env]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <OrgContext.Provider value={{ org, orgId: org?.id ?? null, loading, needsOnboarding, refetch }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);