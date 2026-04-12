"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Wallet, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { type Wallet as WalletType } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useOrg } from "@/hooks/useOrg";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CopyButton } from "@/components/shared/CopyButton";
import { shortAddress, formatDate, cn } from "@/lib/utils";
import { usePagedCursor } from "@/hooks/usePagedCursor";
import { Pagination } from "@/components/shared/Pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaultkey/ui/src/sheet";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WalletGroup {
  userId: string;
  wallets: WalletType[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupWalletsByUser(wallets: WalletType[]): WalletGroup[] {
  const map = new Map<string, WalletType[]>();
  for (const w of wallets) {
    const existing = map.get(w.user_id);
    if (existing) {
      existing.push(w);
    } else {
      map.set(w.user_id, [w]);
    }
  }
  return Array.from(map.entries()).map(([userId, ws]) => ({ userId, wallets: ws }));
}

function chainSummary(wallets: WalletType[]): string {
  const chains = [...new Set(wallets.map((w) => w.chain_type.toUpperCase()))];
  return chains.join(" + ");
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WalletsPage() {
  const { getToken } = useAuth();
  const { orgId } = useOrg();
  const { cloud, sdk } = useApi();

  const [search, setSearch] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);

  const fetcher = useCallback(
    async (cursor: string | undefined) => {
      const token = await getToken();
      if (!token || !orgId) return { items: [], next_cursor: null, has_more: false };
      const res = await cloud.listWallets(token, orgId, userIdFilter || undefined, cursor);
      return { items: res.wallets, next_cursor: res.next_cursor, has_more: res.has_more };
    },
    [orgId, getToken, cloud, userIdFilter],
  );

  const { items: wallets, currentPage, totalKnownPages, hasMore, loading, goToPage, loadFirst, reset } =
    usePagedCursor<WalletType>({ fetcher });

  useEffect(() => {
    if (!orgId) return;
    reset();
    loadFirst().catch((e) => toast.error(e.message));
  }, [orgId, userIdFilter]);

  const filtered = useMemo(() => {
    if (!search) return wallets;
    const q = search.toLowerCase();
    return wallets.filter(
      (w) =>
        w.address.toLowerCase().includes(q) ||
        (w.label ?? "").toLowerCase().includes(q) ||
        w.user_id.toLowerCase().includes(q),
    );
  }, [wallets, search]);

  const groups = useMemo(() => groupWalletsByUser(filtered), [filtered]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Wallets"
        description="EVM and Solana wallets managed by your project"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create wallet</span>
          </button>
        }
      />

      <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Wallet queries use your{" "}
        <strong className="text-foreground font-mono">project API key</strong>. Go to{" "}
        <a href="/api-keys" className="underline text-foreground">
          API Keys
        </a>{" "}
        to get one, then use the SDK directly or the test client.
      </div>

      {/* Search + user filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by address or label…"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <input
          value={userIdFilter}
          onChange={(e) => setUserIdFilter(e.target.value)}
          placeholder="Filter by user ID…"
          className="sm:w-56 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {loading ? (
        <WalletsSkeleton />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-10 w-10" />}
          title="No wallets found"
          description={
            userIdFilter
              ? `No wallets found for user "${userIdFilter}".`
              : "Wallets are created via the SDK using your project API key."
          }
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create wallet
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop grouped table */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["User", "Address", "Chain", "Label", "Created"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) =>
                  group.wallets.map((w, idx) => (
                    <tr
                      key={w.id}
                      onClick={() => setSelectedWallet(w)}
                      className={cn(
                        "hover:bg-muted/20 transition-colors cursor-pointer",
                        idx === 0 && "border-t border-border",
                        group.wallets.length > 1 && "bg-muted/5",
                      )}
                    >
                      {/* User ID cell — only shown on first row of group */}
                      <td className="px-4 py-3 align-top w-[200px]">
                        {idx === 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-foreground">{group.userId}</span>
                            {group.wallets.length > 1 && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                {chainSummary(group.wallets)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center pl-2">
                            <div className="w-px h-4 bg-border" />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs">{shortAddress(w.address)}</span>
                          <CopyButton value={w.address} />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <ChainBadge chain={w.chain_type} />
                      </td>

                      <td className="px-4 py-3 text-muted-foreground text-xs">{w.label ?? "—"}</td>

                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(w.created_at)}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile grouped cards */}
          <div className="sm:hidden space-y-3">
            {groups.map((group) => (
              <div key={group.userId} className="rounded-xl border border-border overflow-hidden">
                {/* Group header */}
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-foreground">{group.userId}</span>
                  {group.wallets.length > 1 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      {chainSummary(group.wallets)}
                    </span>
                  )}
                </div>
                {/* Wallet rows within group */}
                {group.wallets.map((w, idx) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWallet(w)}
                    className={cn(
                      "px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors",
                      idx !== 0 && "border-t border-border",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-xs truncate">{shortAddress(w.address)}</span>
                        <CopyButton value={w.address} />
                      </div>
                      <ChainBadge chain={w.chain_type} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {w.label ? <span>{w.label}</span> : <span />}
                      <span>{formatDate(w.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalKnownPages={totalKnownPages}
            hasMore={hasMore}
            loading={loading}
            onPage={goToPage}
          />
        </>
      )}

      {showCreate && (
        <CreateWalletModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { reset(); loadFirst(); setShowCreate(false); }}
        />
      )}

      {/* Wallet detail sheet */}
      <Sheet open={!!selectedWallet} onOpenChange={(open) => { if (!open) setSelectedWallet(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selectedWallet && <WalletDetailPanel wallet={selectedWallet} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Wallet detail panel ───────────────────────────────────────────────────────

function WalletDetailPanel({ wallet }: { wallet: WalletType }) {
  const { getToken } = useAuth();
  const { sdk } = useApi();

  const [balance, setBalance] = useState<{ value: string; unit: string } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceFetched, setBalanceFetched] = useState(false);

  useEffect(() => {
    setBalance(null);
    setBalanceFetched(false);
  }, [wallet.id]);

  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const creds = { apiKey: "", apiSecret: "" };
      // Balance endpoints accept Clerk JWT via Authorization header too —
      // use the same token the dashboard already has.
      const token = await getToken();
      if (!token) return;

      const path =
        wallet.chain_type === "evm"
          ? `/sdk/wallets/${wallet.id}/balance/evm`
          : `/sdk/wallets/${wallet.id}/balance/solana`;

      const res = await fetch(path, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch balance");
      const data = await res.json();
      setBalance({ value: data.balance, unit: data.unit });
      setBalanceFetched(true);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to fetch balance");
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2">
      <SheetHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <SheetTitle className="font-mono text-base">{shortAddress(wallet.address)}</SheetTitle>
            <SheetDescription>
              <ChainBadge chain={wallet.chain_type} />
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {/* Metadata */}
      <div className="rounded-xl border border-border overflow-hidden">
        <DetailRow label="Wallet ID" value={wallet.id} mono copyable />
        <DetailRow label="Address" value={wallet.address} mono copyable />
        <DetailRow label="User ID" value={wallet.user_id} mono copyable />
        <DetailRow label="Chain" value={wallet.chain_type.toUpperCase()} />
        <DetailRow label="Label" value={wallet.label ?? "—"} />
        <DetailRow label="Created" value={formatDate(wallet.created_at)} last />
      </div>

      {/* Balance — lazy */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Balance
          </span>
          <button
            onClick={fetchBalance}
            disabled={balanceLoading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", balanceLoading && "animate-spin")} />
            {balanceFetched ? "Refresh" : "Check balance"}
          </button>
        </div>
        <div className="px-4 py-4 min-h-[56px] flex items-center">
          {!balanceFetched && !balanceLoading && (
            <p className="text-xs text-muted-foreground">
              Click "Check balance" to fetch the current on-chain balance.
            </p>
          )}
          {balanceLoading && <div className="h-6 w-24 rounded bg-muted/40 animate-pulse" />}
          {balanceFetched && balance && (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold tabular-nums">{balance.value}</span>
              <span className="text-sm text-muted-foreground uppercase">{balance.unit}</span>
            </div>
          )}
        </div>
      </div>

      {/* Full address */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Full address</p>
        <div className="flex items-start gap-2">
          <span className="font-mono text-xs break-all text-foreground flex-1">{wallet.address}</span>
          <CopyButton value={wallet.address} />
        </div>
      </div>
    </div>
  );
}

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  mono = false,
  copyable = false,
  last = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 gap-4",
        !last && "border-b border-border",
      )}
    >
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={cn("text-xs truncate", mono && "font-mono text-foreground")}>
          {value}
        </span>
        {copyable && value !== "—" && <CopyButton value={value} />}
      </div>
    </div>
  );
}

// ── Chain badge ───────────────────────────────────────────────────────────────

function ChainBadge({ chain }: { chain: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono",
        chain === "evm"
          ? "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400",
      )}
    >
      {chain.toUpperCase()}
    </span>
  );
}

// ── Create wallet modal ───────────────────────────────────────────────────────

function CreateWalletModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { sdk } = useApi();
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [userId, setUserId] = useState("");
  const [chain, setChain] = useState<"evm" | "solana">("evm");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!apiKey.trim() || !apiSecret.trim() || !userId.trim()) {
      toast.error("API key, API secret, and user ID are required");
      return;
    }
    setLoading(true);
    try {
      await sdk.createWallet(
        { apiKey, apiSecret },
        { user_id: userId, chain_type: chain, label: label || undefined },
      );
      toast.success("Wallet created");
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-border bg-popover p-6 shadow-xl">
        <h2 className="font-semibold text-base mb-4">Create wallet</h2>
        <div className="space-y-3">
          <Field label="Project API key">
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="vk_live_…" className={inputCls} />
          </Field>
          <Field label="Project API secret">
            <input value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="sk_…" type="password" className={inputCls} />
          </Field>
          <Field label="User ID">
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user_123" className={inputCls} />
          </Field>
          <Field label="Chain">
            <select value={chain} onChange={(e) => setChain(e.target.value as "evm" | "solana")} className={inputCls}>
              <option value="evm">EVM</option>
              <option value="solana">Solana</option>
            </select>
          </Field>
          <Field label="Label (optional)">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="main" className={inputCls} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30";

function WalletsSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="h-10 bg-muted/30" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 border-t border-border bg-muted/10" />
      ))}
    </div>
  );
}