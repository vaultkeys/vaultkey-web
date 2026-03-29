"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, Building2 } from "lucide-react";
import { useOrg } from "@/hooks/useOrg";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Compact org switcher shown in the sidebar below the logo.
 * Shows current org name + a dropdown to switch or create a new org.
 */
export function OrgSwitcher() {
  const { org, orgs, setActiveOrg, loading } = useOrg();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading || !org) return null;
  // Only show switcher if there are multiple orgs OR we want to allow creating a new one
  // Always render so users can create additional orgs

  const handleSelect = async (orgId: string) => {
    if (orgId === org.id) { setOpen(false); return; }
    setSwitching(orgId);
    setOpen(false);
    await setActiveOrg(orgId);
    setSwitching(null);
    router.push("/dashboard");
  };

  const handleCreate = () => {
    setOpen(false);
    router.push("/onboarding");
  };

  return (
    <div ref={ref} className="relative px-2 pb-1">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors group",
          "hover:bg-sidebar-accent/60 text-sidebar-foreground",
          open && "bg-sidebar-accent/60",
        )}
      >
        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-muted/50 border border-sidebar-border">
          <Building2 className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="flex-1 min-w-0 text-left text-xs font-medium truncate">
          {switching ? "Switching…" : org.name}
        </span>
        <ChevronDown className={cn(
          "h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-150",
          open && "rotate-180",
        )} />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {orgs.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                Organizations
              </p>
              {orgs.map((o) => {
                const active = o.id === org.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => handleSelect(o.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                        : "text-popover-foreground hover:bg-sidebar-accent/40",
                    )}
                  >
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-muted/40 border border-sidebar-border">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="flex-1 min-w-0 text-left text-xs truncate">{o.name}</span>
                    {active && <Check className="h-3 w-3 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-border py-1">
            <button
              onClick={handleCreate}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40 transition-colors"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 border border-dashed border-muted-foreground/40">
                <Plus className="h-3 w-3" />
              </div>
              <span className="text-xs">New organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}