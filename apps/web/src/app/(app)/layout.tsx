"use client";

import { EnvProvider, useEnv } from "@/hooks/useEnv";
import { OrgProvider, useOrg } from "@/hooks/useOrg";
import { AppShell } from "@/components/layout/AppShell";
import React, { useEffect } from "react";
import { ChainsProvider } from "@/hooks/useChains";
import { usePathname, useRouter } from "next/navigation";

function AppContent({ children }: { children: React.ReactNode }) {
  const { env, hydrated } = useEnv();
  const { orgId, loading: orgLoading, needsOnboarding } = useOrg();
  const pathname = usePathname();
  const router = useRouter();

  // Wait for env hydration and org fetch to settle before doing anything
  const settling = !hydrated || orgLoading;

  useEffect(() => {
    if (settling) return;
    if (needsOnboarding && !pathname.startsWith("/onboarding")) {
      router.replace("/onboarding");
    }
  }, [settling, needsOnboarding, pathname, router]);

  if (settling || (needsOnboarding && !pathname.startsWith("/onboarding"))) {
    return <AppSkeleton />;
  }

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



function AppSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background animate-pulse">
      {/* sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-sidebar-background">
        <div className="h-14 border-b border-sidebar-border px-4 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
        <div className="px-2 py-3 space-y-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 rounded-md bg-muted" />
          ))}
        </div>
      </aside>
      {/* main */}
      <div className="flex-1 flex flex-col">
        <div className="md:hidden h-14 border-b border-border bg-background" />
        <div className="flex-1 p-4 sm:p-8 space-y-6">
          <div className="h-7 w-48 rounded bg-muted" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 rounded-xl bg-muted" />
            <div className="h-64 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}