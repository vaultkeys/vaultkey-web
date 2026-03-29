"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Wallet, ArrowLeftRight, KeyRound,
  Users, CreditCard, Settings, ShieldCheck,
  Sun, Moon, ChevronRight, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrg } from "@/hooks/useOrg";
import { useEnv } from "@/hooks/useEnv";
import { EnvSwitcher } from "@/components/layout/EnvSwitcher";
import { OrgSwitcher } from "@/components/layout/OrgSwitcher";
import React, { useState, useEffect } from "react";

const nav = [
  { label: "Dashboard",   href: "/dashboard",    icon: LayoutDashboard },
  { label: "Wallets",     href: "/wallets",       icon: Wallet },
  { label: "Transfers",   href: "/transfers",     icon: ArrowLeftRight },
  { label: "API Keys",    href: "/api-keys",      icon: KeyRound },
  { label: "Team",        href: "/team",          icon: Users },
  { label: "Billing",     href: "/billing",       icon: CreditCard },
  { label: "Settings",    href: "/settings",      icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { org, orgs, needsOnboarding, loading: orgLoading } = useOrg();
  const { theme, setTheme } = useTheme();
  const { isTestnet } = useEnv();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (!orgLoading && needsOnboarding && !pathname.startsWith("/onboarding")) {
    router.replace("/onboarding");
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
          isTestnet ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-primary",
        )}>
          <span className={cn(
            "font-bold text-xs font-mono",
            isTestnet ? "text-yellow-600 dark:text-yellow-400" : "text-primary-foreground",
          )}>VK</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-none truncate">VaultKey</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Org switcher — shown when user has an org */}
      {org && (
        <div className="border-b border-sidebar-border pt-2 pb-1">
          <OrgSwitcher />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {nav.map(({ label, href, icon: Icon }) => {
          if (isTestnet && href === "/billing") return null;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors group",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="h-3 w-3 ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Environment switcher */}
      <EnvSwitcher />

      {/* Admin link */}
      {/* <div className="px-2 pb-2 border-t border-sidebar-border pt-2 shrink-0">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
            pathname.startsWith("/admin")
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Admin</span>
        </Link>
      </div> */}

      {/* User + theme */}
      <div className="px-3 py-3 border-t border-sidebar-border flex items-center gap-2 shrink-0">
        <UserButton afterSignOutUrl="/sign-in" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className={cn(
        "hidden md:flex w-56 shrink-0 flex-col border-r border-border",
        isTestnet ? "bg-[hsl(var(--sidebar-background))]" : "bg-sidebar-background",
      )}>
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-72 border-r border-border transition-transform duration-200 ease-in-out md:hidden",
        isTestnet ? "bg-[hsl(var(--sidebar-background))]" : "bg-sidebar-background",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 flex items-center gap-3 px-4 border-b border-border bg-background shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
              isTestnet ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-primary",
            )}>
              <span className={cn(
                "font-bold text-[10px] font-mono",
                isTestnet ? "text-yellow-600 dark:text-yellow-400" : "text-primary-foreground",
              )}>VK</span>
            </div>
            <span className="text-sm font-semibold truncate">VaultKey</span>
            {org && (
              <span className="text-xs text-muted-foreground truncate hidden xs:block">· {org.name}</span>
            )}
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        {/* Testnet banner */}
        {isTestnet && (
          <div className="sticky top-0 z-10 flex items-center justify-center gap-2 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 text-xs font-medium text-yellow-600 dark:text-yellow-400 shrink-0">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="hidden sm:inline">Testnet — data is isolated and not connected to mainnet</span>
            <span className="sm:hidden">Testnet mode</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}