import { EnvProvider } from "@/hooks/useEnv";
import { OrgProvider } from "@/hooks/useOrg";
import { AppShell } from "@/components/layout/AppShell";
import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EnvProvider>
      <OrgProvider>
        <AppShell>{children}</AppShell>
      </OrgProvider>
    </EnvProvider>
  );
}