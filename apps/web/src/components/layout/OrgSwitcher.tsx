"use client";

import { useState } from "react";
import { Check, Plus, Building2, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useOrg } from "@/hooks/useOrg";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@vaultkey/ui/src/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vaultkey/ui/src/dropdown-menu";

export function OrgSwitcher() {
  const { org, orgs, setActiveOrg, loading } = useOrg();
  const [switching, setSwitching] = useState<string | null>(null);
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const router = useRouter();

  if (loading || !org) return null;

  const handleSelect = async (orgId: string) => {
    if (orgId === org.id) return;
    setSwitching(orgId);
    await setActiveOrg(orgId);
    setSwitching(null);
    router.push("/dashboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
            "hover:bg-sidebar-accent/60 text-sidebar-foreground focus:outline-none",
            collapsed ? "justify-center" : "mx-2",
          )}
        >
          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-muted/50 border border-sidebar-border">
            <Building2 className="h-3 w-3 text-muted-foreground" />
          </div>
          {!collapsed && (
            <>
              <span className="flex-1 min-w-0 text-left text-xs font-medium truncate">
                {switching ? "Switching…" : org.name}
              </span>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align="start"
        sideOffset={8}
        className="min-w-56"
      >
        <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
          Organizations
        </DropdownMenuLabel>

        {orgs.map((o) => {
          const active = o.id === org.id;
          return (
            <DropdownMenuItem
              key={o.id}
              onClick={() => handleSelect(o.id)}
              className="gap-2.5"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-muted/40 border border-sidebar-border">
                <Building2 className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="flex-1 min-w-0 text-xs truncate">{o.name}</span>
              {active && <Check className="h-3 w-3 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => router.push("/onboarding")}
          className="gap-2.5 text-muted-foreground"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 border border-dashed border-muted-foreground/40">
            <Plus className="h-3 w-3" />
          </div>
          <span className="text-xs">New organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}