"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Wallet, Search } from "lucide-react";
import { toast } from "sonner";
import { type Wallet as WalletType } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useOrg } from "@/hooks/useOrg";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CopyButton } from "@/components/shared/CopyButton";
import { shortAddress, formatDate, cn } from "@/lib/utils";

export default function WalletsPage() {
  const { getToken } = useAuth();
  const { org } = useOrg();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!org?.project_id) return;
    setLoading(false);
  }, [org]);

  const filtered = wallets.filter(
    (w) => w.address.toLowerCase().includes(search.toLowerCase()) || (w.label ?? "").toLowerCase().includes(search.toLowerCase()) || w.user_id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 sm:p-8">
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
        Wallet queries use your <strong className="text-foreground font-mono">project API key</strong>.
        Go to <a href="/api-keys" className="underline text-foreground">API Keys</a> to get one, then use the SDK directly or the test client.
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by address, label, or user ID…"
          className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {loading ? (
        <WalletsSkeleton />
      ) : wallets.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-10 w-10" />}
          title="No wallets loaded"
          description="Wallets are created via the SDK using your project API key. Create one or query by user ID."
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
        <WalletTable wallets={filtered} />
      )}

      {showCreate && (
        <CreateWalletModal
          onClose={() => setShowCreate(false)}
          onCreated={(w) => { setWallets((p) => [w, ...p]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function WalletTable({ wallets }: { wallets: WalletType[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">Address</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">Chain</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">User ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">Label</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs">{shortAddress(w.address)}</span>
                    <CopyButton value={w.address} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ChainBadge chain={w.chain_type} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{w.user_id}</td>
                <td className="px-4 py-3 text-muted-foreground">{w.label ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(w.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {wallets.map((w) => (
          <div key={w.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-xs truncate">{shortAddress(w.address)}</span>
                <CopyButton value={w.address} />
              </div>
              <ChainBadge chain={w.chain_type} />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>User ID</span>
                <span className="font-mono">{w.user_id}</span>
              </div>
              {w.label && (
                <div className="flex justify-between">
                  <span>Label</span>
                  <span>{w.label}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Created</span>
                <span>{formatDate(w.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ChainBadge({ chain }: { chain: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono",
      chain === "evm"
        ? "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
        : "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    )}>
      {chain.toUpperCase()}
    </span>
  );
}

function CreateWalletModal({ onClose, onCreated }: { onClose: () => void; onCreated: (w: WalletType) => void }) {
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
      const wallet = await sdk.createWallet(
        { apiKey, apiSecret },
        { user_id: userId, chain_type: chain, label: label || undefined },
      );
      toast.success("Wallet created");
      onCreated(wallet);
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
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors">Cancel</button>
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

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30";

function WalletsSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="h-10 bg-muted/30" />
      {[...Array(5)].map((_, i) => <div key={i} className="h-12 border-t border-border bg-muted/10" />)}
    </div>
  );
}