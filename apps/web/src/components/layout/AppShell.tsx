"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Wallet, ArrowLeftRight, KeyRound,
  Users, CreditCard, Settings, ShieldCheck,
  Sun, Moon, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrg } from "@/hooks/useOrg";
import { useEnv } from "@/hooks/useEnv";
import { EnvSwitcher } from "@/components/layout/EnvSwitcher";

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
  const { org, needsOnboarding, loading: orgLoading } = useOrg();
  const { theme, setTheme } = useTheme();
  const { isTestnet } = useEnv();
  const router = useRouter();

  // Redirect to onboarding when the user has no org in the current environment
  // and loading has settled — avoids a flash on initial load.
  if (!orgLoading && needsOnboarding && !pathname.startsWith("/onboarding")) {
    router.replace("/onboarding");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "w-56 shrink-0 flex flex-col border-r border-border",
        isTestnet ? "bg-[hsl(var(--sidebar-background))]" : "bg-sidebar-background",
      )}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
            isTestnet ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-primary",
          )}>
            <span className={cn(
              "font-bold text-xs font-mono",
              isTestnet ? "text-yellow-600 dark:text-yellow-400" : "text-primary-foreground",
            )}>VK</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none truncate">VaultKey</p>
            {org && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{org.name}</p>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
          {nav.map(({ label, href, icon: Icon }) => {
            // Hide billing in testnet — no purchase flow
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
        <div className="px-2 pb-2 border-t border-sidebar-border pt-2">
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
        </div>

        {/* User + theme */}
        <div className="px-3 py-3 border-t border-sidebar-border flex items-center gap-2">
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
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Testnet top bar */}
        {isTestnet && (
          <div className="sticky top-0 z-10 flex items-center justify-center gap-2 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            Testnet — data is isolated and not connected to mainnet
          </div>
        )}
        {children}
      </main>
    </div>
  );
}