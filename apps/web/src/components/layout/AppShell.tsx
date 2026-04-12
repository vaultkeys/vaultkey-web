"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Wallet, ArrowLeftRight, KeyRound,
  Users, CreditCard, Settings, Fuel, Warehouse,
  Sun, Moon, Webhook, MoreVertical, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrg } from "@/hooks/useOrg";
import { useEnv } from "@/hooks/useEnv";
import { EnvSwitcher } from "@/components/layout/EnvSwitcher";
import { OrgSwitcher } from "@/components/layout/OrgSwitcher";
import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@vaultkey/ui/src/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vaultkey/ui/src/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@vaultkey/ui/src/avatar";

const nav = [
  { label: "Dashboard",          href: "/dashboard",       icon: LayoutDashboard },
  { label: "Wallets",            href: "/wallets",         icon: Wallet },
  { label: "Transfers",          href: "/transfers",       icon: ArrowLeftRight },
  { label: "Fee Payers",         href: "/relayers",        icon: Fuel },
  { label: "Collection Wallets", href: "/master-wallets",  icon: Warehouse },
  { label: "API Keys",           href: "/api-keys",        icon: KeyRound },
  { label: "Webhooks",           href: "/webhooks",        icon: Webhook },
  { label: "Team",               href: "/team",            icon: Users },
  { label: "Billing",            href: "/billing",         icon: CreditCard },
  { label: "Settings",           href: "/settings",        icon: Settings },
];

function NavUser() {
  const { user } = useUser();
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const avatar = user?.imageUrl ?? "";
  const initials = name.charAt(0).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {avatar && <AvatarImage src={avatar} alt={name} />}
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
              <MoreVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-xl"
            side={isMobile ? "bottom" : "top"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {avatar && <AvatarImage src={avatar} alt={name} />}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {mounted
                  ? theme === "dark"
                    ? <><Sun className="size-4" /> Light mode</>
                    : <><Moon className="size-4" /> Dark mode</>
                  : <span className="size-4" />
                }
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Clerk sign-out via UserButton is kept — render it hidden and trigger programmatically,
                or swap for a sign-out link matching your Clerk setup */}
            <DropdownMenuItem asChild>
              {/* Replace href with your sign-out handler if needed */}
              <Link href="/sign-out">
                <LogOut className="size-4" />
                Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function AppSidebar() {
  const pathname = usePathname();
  const { isTestnet } = useEnv();
  const { org } = useOrg();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-10 items-center gap-2.5 px-2">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
            isTestnet
              ? "bg-yellow-500/20 border border-yellow-500/30"
              : "bg-primary",
          )}>
            <Image src="/logo-squircle.png" alt="vaultkey" width={24} height={24} />
          </div>
          <span className="text-sm font-semibold">VaultKey</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Org switcher */}
        {org && (
          <SidebarGroup className="border-b border-sidebar-border py-2">
            <SidebarGroupContent>
              <OrgSwitcher />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map(({ label, href, icon: Icon }) => {
                if (isTestnet && href === "/billing") return null;
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild tooltip={label} isActive={active}>
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: env switcher + user */}
      <SidebarFooter className="border-t border-sidebar-border">
        <EnvSwitcher />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isTestnet } = useEnv();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Mobile top bar */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background shrink-0 z-30">
          <SidebarTrigger />
          {/* rest of your mobile header content, hidden on desktop */}
          <div className="flex items-center gap-2 flex-1 min-w-0 md:hidden">
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
              isTestnet ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-primary",
            )}>
              <Image src="/logo-squircle.png" alt="vaultkey" width={24} height={24} />
            </div>
            <span className="text-sm font-semibold truncate">VaultKey</span>
          </div>
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
      </SidebarInset>
    </SidebarProvider>
  );
}