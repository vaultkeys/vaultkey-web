"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Wallet, ArrowLeftRight, Zap, TrendingUp } from "lucide-react";
import { type UsageStats } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCredits, operationLabel, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { org, orgId, loading: orgLoading } = useOrg();
  const { cloud } = useApi();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const [usageData, creditsData] = await Promise.all([
          cloud.getUsage(token, orgId, {
            start: new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10),
            end: new Date().toISOString().slice(0, 10),
          }),
          cloud.getCredits(token, orgId),
        ]);
        setStats(usageData);
        setBalance(creditsData.balance);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [orgId, getToken]);

  if (orgLoading) return <DashSkeleton />;

  if (!org) return (
    <div className="p-8">
      <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md mx-auto mt-16">
        <h2 className="font-semibold text-lg">Welcome to VaultKey</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Complete onboarding to get started.
        </p>
        <a href="/onboarding" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Start onboarding
        </a>
      </div>
    </div>
  );

  const chartData = (stats?.by_operation ?? []).slice(0, 6).map((s) => ({
    name: operationLabel(s.operation).replace("Transfer ", "").replace(" (EVM)", "").replace(" (Solana)", ""),
    credits: s.credits_consumed,
    ops: s.count,
  }));

  return (
    <div className="p-8">
      <PageHeader
        title={`${org.name}`}
        description="Last 30 days · stablecoin infrastructure overview"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <StatCard
          label="Credits balance"
          value={formatCredits(balance)}
          sub="available to spend"
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="Credits used"
          value={formatCredits(stats?.total_credits_consumed ?? 0)}
          sub="this period"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Operations"
          value={(stats?.total_operations ?? 0).toLocaleString()}
          sub="this period"
          icon={<ArrowLeftRight className="h-4 w-4" />}
        />
        <StatCard
          label="Project ID"
          value={org.project_id ? org.project_id.slice(0, 8) + "…" : "—"}
          sub={org.slug}
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      {/* Usage by operation */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Credits by operation</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No usage this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={chartData} barSize={24}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--accent))" }}
                />
                <Bar dataKey="credits" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--primary-light))`} opacity={1 - i * 0.1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top operations table */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Top operations</p>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : (stats?.by_operation ?? []).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No operations yet</div>
          ) : (
            <div className="space-y-1">
              {(stats?.by_operation ?? []).slice(0, 7).map((op) => (
                <div key={op.operation} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-mono text-muted-foreground">{operationLabel(op.operation)}</span>
                  <div className="flex items-center gap-4 text-xs text-right">
                    <span className="text-muted-foreground">{op.count.toLocaleString()} ops</span>
                    <span className="font-medium w-16">{formatCredits(op.credits_consumed)} cr</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-7 w-48 bg-muted rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
