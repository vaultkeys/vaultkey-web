"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useEnv } from "@/hooks/useEnv";
import { makeCloud, type OrgDetail, type Org } from "@/lib/api";

const ACTIVE_ORG_KEY = "vaultkey_active_org";

interface OrgCtx {
  /** All orgs the user belongs to in the current environment */
  orgs: Org[];
  /** Currently active (selected) org detail */
  org: OrgDetail | null;
  orgId: string | null;
  loading: boolean;
  /** true when the user has no org in the current environment */
  needsOnboarding: boolean;
  /** Switch the active org */
  setActiveOrg: (orgId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const OrgContext = createContext<OrgCtx>({
  orgs: [],
  org: null,
  orgId: null,
  loading: true,
  needsOnboarding: false,
  setActiveOrg: async () => {},
  refetch: async () => {},
});

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useAuth();
  const { baseUrl, env, hydrated } = useEnv();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const loadOrgDetail = useCallback(async (token: string, orgId: string) => {
    const api = makeCloud(baseUrl);
    const detail = await api.getOrg(token, orgId);
    setOrg(detail);
  }, [baseUrl]);

  const refetch = useCallback(async () => {
    console.log("refetch called", { userId, baseUrl });
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const api = makeCloud(baseUrl);
      console.log("Fetching orgs with token", { token: token.slice(0, 10) + "..." });
      const { organizations } = await api.listOrgs(token);
      console.log("Orgs fetched", { count: organizations.length, orgs: organizations.map((o) => ({ id: o.id, name: o.name })) });

      setOrgs(organizations);

      if (organizations.length === 0) {
        setOrg(null);
        setNeedsOnboarding(true);
        return;
      }

      setNeedsOnboarding(false);

      // Try to restore the previously active org for this env
      const storageKey = `${ACTIVE_ORG_KEY}_${env}`;
      const stored = (() => { try { return localStorage.getItem(storageKey); } catch { return null; } })();
      const preferred = organizations.find((o) => o.id === stored) ?? organizations[0]!;

      await loadOrgDetail(token, preferred.id);
      // Persist preference
      try { localStorage.setItem(storageKey, preferred.id); } catch {}
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [userId, getToken, baseUrl, env, loadOrgDetail]);

  const setActiveOrg = useCallback(async (orgId: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      await loadOrgDetail(token, orgId);
      const storageKey = `${ACTIVE_ORG_KEY}_${env}`;
      try { localStorage.setItem(storageKey, orgId); } catch {}
    } finally {
      setLoading(false);
    }
  }, [getToken, loadOrgDetail, env]);

  // Re-fetch whenever the environment switches
  useEffect(() => {
    console.log("OrgProvider effect fired", { hydrated, env, userId });
    if (!hydrated) return;
    setOrg(null);
    setOrgs([]);
    setLoading(true);
    refetch();
  }, [env, hydrated, userId]);

  return (
    <OrgContext.Provider value={{ orgs, org, orgId: org?.id ?? null, loading, needsOnboarding, setActiveOrg, refetch }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);