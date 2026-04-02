"use client";

import { EnvProvider, useEnv } from "@/hooks/useEnv";
import { OrgProvider, useOrg } from "@/hooks/useOrg";
import { AppShell } from "@/components/layout/AppShell";
import React from "react";
import { ChainsProvider } from "@/hooks/useChains";

function AppContent({ children }: { children: React.ReactNode }) {
  const { env } = useEnv();
  const { orgId } = useOrg();

  return (
    <AppShell>
      <div key={`${env}-${orgId}`}>{children}</div>
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EnvProvider>
      <OrgProvider>
        <ChainsProvider>
          <AppContent>{children}</AppContent>
        </ChainsProvider>
      </OrgProvider>
    </EnvProvider>
  );
}