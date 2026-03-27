"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { cloud, type OrgDetail } from "@/lib/api";

interface OrgCtx {
  org: OrgDetail | null;
  orgId: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const OrgContext = createContext<OrgCtx>({ org: null, orgId: null, loading: true, refetch: async () => {} });

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useAuth();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const token = await getToken();
      if (!token) return;
      const { organizations } = await cloud.listOrgs(token);
      if (organizations.length > 0) {
        const detail = await cloud.getOrg(token, organizations[0]!.id);
        setOrg(detail);
      } else {
        setOrg(null);
      }
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [userId, getToken]);

  useEffect(() => { refetch(); }, [refetch]);

  return (
    <OrgContext.Provider value={{ org, orgId: org?.id ?? null, loading, refetch }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);
