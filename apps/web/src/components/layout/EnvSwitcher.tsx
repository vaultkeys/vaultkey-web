"use client";

import { useEnv, type Env } from "@/hooks/useEnv";
import { useSidebar } from "@vaultkey/ui/src/sidebar";
import { cn } from "@/lib/utils";
import { FlaskConical, Globe } from "lucide-react";
import React from "react";

export function EnvSwitcher() {
  const { env, setEnv, mainnetEnabled } = useEnv();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const allOptions = [
    { value: "mainnet" as Env, label: "Mainnet", Icon: Globe },
    { value: "testnet" as Env, label: "Testnet", Icon: FlaskConical },
  ];

  const options = allOptions.filter(o => o.value !== "mainnet" || mainnetEnabled);

  // Collapsed: just show the active env as a single icon button
  if (collapsed) {
    const active = options.find(o => o.value === env)!;
    return (
      <div className="flex justify-center py-2">
        <button
          className={cn(
            "flex items-center justify-center rounded-md p-2 transition-all duration-150",
            env === "testnet"
              ? "bg-yellow-500/15 text-yellow-500 border border-yellow-500/25"
              : "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border",
          )}
          onClick={() => {
            const next = options.find(o => o.value !== env);
            if (next) setEnv(next.value);
          }}
          title={`Switch to ${options.find(o => o.value !== env)?.label ?? ""}`}
        >
          <active.Icon className="h-4 w-4 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 px-1 mb-1.5">
        Environment
      </p>
      <div className="flex rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-0.5 gap-0.5">
        {options.map(({ value, label, Icon }) => {
          const active = env === value;
          return (
            <button
              key={value}
              onClick={() => setEnv(value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-150",
                active
                  ? value === "testnet"
                    ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/25 shadow-sm"
                    : "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-sm"
                  : "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className={cn("h-3 w-3 shrink-0", active && value === "testnet" && "text-yellow-500")} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {env === "testnet" && (
        <p className="mt-1.5 px-1 text-[10px] text-yellow-600 dark:text-yellow-500/80 leading-tight">
          Testnet data is isolated — separate org, keys & credits.
        </p>
      )}
    </div>
  );
}