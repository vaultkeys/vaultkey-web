"use client";

import { ShieldCheck, Construction } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AdminPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Admin"
        description="Platform-level administration"
      />

      <div className="max-w-lg">
        {/* Coming soon card */}
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="h-8 w-8 text-muted-foreground/40" />
            <Construction className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h2 className="font-semibold text-base">Admin routes coming soon</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Admin endpoints are not yet wired on the backend. Once available, this section will cover stablecoin token management and platform-level configuration.
          </p>
        </div>

        {/* Planned sections */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Planned admin capabilities</p>
          <ul className="space-y-3">
            {[
              { route: "GET /admin/stablecoins", label: "List supported stablecoin tokens" },
              { route: "POST /admin/stablecoins", label: "Upsert token (add / update contract address)" },
              { route: "DELETE /admin/stablecoins/{tokenId}", label: "Disable a token" },
            ].map((item) => (
              <li key={item.route} className="flex items-start gap-3">
                <code className="shrink-0 mt-0.5 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                  {item.route}
                </code>
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
