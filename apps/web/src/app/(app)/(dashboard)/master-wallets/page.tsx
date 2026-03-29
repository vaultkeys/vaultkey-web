"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Warehouse, Info, Settings } from "lucide-react";
import { toast } from "sonner";
import { type MasterWallet } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CopyButton } from "@/components/shared/CopyButton";
import { shortAddress, formatDate, cn } from "@/lib/utils";

export default function MasterWalletsPage() {
  const { getToken } = useAuth();
  const { orgId } = useOrg();
  const { cloud } = useApi();
  const [wallets, setWallets] = useState<MasterWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingWallet, setEditingWallet] = useState<MasterWallet | null>(null);

  const load = async () => {
    if (!orgId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const { configs } = await cloud.listMasterWallets(token, orgId);
      setWallets(configs);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orgId]);

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Collection Wallets"
        description="Automatically sweep funds from user wallets to a central collection wallet."
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New collection wallet
          </button>
        }
      />

      {/* Info banner */}
      <div className="mb-6 rounded-lg border border-blue-500/25 bg-blue-500/8 px-4 py-3 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">What are collection wallets?</p>
          <p>
            Collection wallets (also called master wallets) automatically consolidate funds from your users' wallets
            into a central treasury. When a user wallet balance exceeds the threshold, VaultKey
            triggers a sweep transaction to move funds to your collection wallet. This is useful for
            payment processors, exchanges, and platforms that need to aggregate incoming payments.
          </p>
        </div>
      </div>

      {loading ? (
        <WalletsSkeleton />
      ) : wallets.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="h-10 w-10" />}
          title="No collection wallets yet"
          description="Create a collection wallet to automatically sweep funds from user wallets."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create first collection wallet
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Address", "Chain", "Threshold", "Schedule", "Status", "Last sweep", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
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
                      <ChainBadge chain={w.chain_type} chainId={w.chain_id} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{w.threshold}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      Every {w.schedule_hours}h
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={w.active} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {w.last_sweep_at ? formatDate(w.last_sweep_at) : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingWallet(w)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {wallets.map((w) => (
              <div key={w.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs truncate">{shortAddress(w.address)}</span>
                    <CopyButton value={w.address} />
                  </div>
                  <StatusBadge active={w.active} />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Chain</span>
                    <ChainBadge chain={w.chain_type} chainId={w.chain_id} />
                  </div>
                  <div className="flex justify-between">
                    <span>Threshold</span>
                    <span className="font-mono">{w.threshold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schedule</span>
                    <span>Every {w.schedule_hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last sweep</span>
                    <span>{w.last_sweep_at ? formatDate(w.last_sweep_at) : "Never"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingWallet(w)}
                  className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-border hover:bg-accent transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" /> Configure
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {showCreate && (
        <CreateWalletModal
          onClose={() => setShowCreate(false)}
          onCreated={(w) => {
            setWallets((p) => [w, ...p]);
            setShowCreate(false);
          }}
          orgId={orgId!}
        />
      )}

      {editingWallet && (
        <EditWalletModal
          wallet={editingWallet}
          onClose={() => setEditingWallet(null)}
          onUpdated={(updated) => {
            setWallets((p) => p.map((w) => (w.id === updated.id ? updated : w)));
            setEditingWallet(null);
          }}
          orgId={orgId!}
        />
      )}
    </div>
  );
}

function ChainBadge({ chain, chainId }: { chain: string; chainId?: string }) {
  const label = chain === "evm" && chainId ? `${chain.toUpperCase()} (${chainId})` : chain.toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono",
        chain === "evm"
          ? "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400"
      )}
    >
      {label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        active
          ? "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
          : "border-muted-foreground/20 bg-muted/40 text-muted-foreground"
      )}
    >
      {active ? "Active" : "Paused"}
    </span>
  );
}

function CreateWalletModal({
  onClose,
  onCreated,
  orgId,
}: {
  onClose: () => void;
  onCreated: (w: MasterWallet) => void;
  orgId: string;
}) {
  const { getToken } = useAuth();
  const { cloud } = useApi();
  const [chainType, setChainType] = useState<"evm" | "solana">("evm");
  const [chainId, setChainId] = useState("137");
  const [threshold, setThreshold] = useState("100");
  const [scheduleHours, setScheduleHours] = useState(24);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (chainType === "evm" && !chainId) {
      toast.error("Chain ID is required for EVM collection wallets");
      return;
    }
    if (!threshold || parseFloat(threshold) <= 0) {
      toast.error("Threshold must be greater than 0");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const wallet = await cloud.provisionMasterWallet(token, orgId, {
        chain_type: chainType,
        chain_id: chainType === "evm" ? chainId : undefined,
        threshold,
        schedule_hours: scheduleHours,
      });
      toast.success("Collection wallet created");
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
        <h2 className="font-semibold text-base mb-1">New collection wallet</h2>
        <p className="text-xs text-muted-foreground mb-4">
          A new wallet will be generated to collect funds from user wallets automatically.
        </p>
        <div className="space-y-3">
          <Field label="Chain type">
            <select
              value={chainType}
              onChange={(e) => setChainType(e.target.value as "evm" | "solana")}
              className={inputCls}
            >
              <option value="evm">EVM (Ethereum, Polygon, etc.)</option>
              <option value="solana">Solana</option>
            </select>
          </Field>

          {chainType === "evm" && (
            <Field label="Chain ID">
              <select value={chainId} onChange={(e) => setChainId(e.target.value)} className={inputCls}>
                <option value="1">Ethereum Mainnet (1)</option>
                <option value="137">Polygon (137)</option>
                <option value="42161">Arbitrum (42161)</option>
                <option value="10">Optimism (10)</option>
                <option value="8453">Base (8453)</option>
                <option value="56">BSC (56)</option>
              </select>
            </Field>
          )}

          <Field label="Sweep threshold (USDC)">
            <input
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="100"
              type="number"
              step="1"
              min="1"
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sweep when user wallet balance exceeds this amount
            </p>
          </Field>

          <Field label="Check interval (hours)">
            <input
              value={scheduleHours}
              onChange={(e) => setScheduleHours(parseInt(e.target.value) || 24)}
              type="number"
              step="1"
              min="1"
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-1">
              How often to check for wallets ready to sweep
            </p>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating…" : "Create collection wallet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditWalletModal({
  wallet,
  onClose,
  onUpdated,
  orgId,
}: {
  wallet: MasterWallet;
  onClose: () => void;
  onUpdated: (w: MasterWallet) => void;
  orgId: string;
}) {
  const { getToken } = useAuth();
  const { cloud } = useApi();
  const [threshold, setThreshold] = useState(wallet.threshold);
  const [scheduleHours, setScheduleHours] = useState(wallet.schedule_hours);
  const [active, setActive] = useState(wallet.active);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!threshold || parseFloat(threshold) <= 0) {
      toast.error("Threshold must be greater than 0");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await cloud.updateMasterWallet(token, orgId, wallet.id, {
        threshold,
        schedule_hours: scheduleHours,
        active,
      });
      toast.success("Collection wallet updated");
      onUpdated(updated);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-border bg-popover p-6 shadow-xl">
        <h2 className="font-semibold text-base mb-1">Configure collection wallet</h2>
        <p className="text-xs text-muted-foreground mb-4 font-mono">{shortAddress(wallet.address)}</p>
        <div className="space-y-3">
          <Field label="Sweep threshold (USDC)">
            <input
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              type="number"
              step="1"
              min="1"
              className={inputCls}
            />
          </Field>

          <Field label="Check interval (hours)">
            <input
              value={scheduleHours}
              onChange={(e) => setScheduleHours(parseInt(e.target.value) || 24)}
              type="number"
              step="1"
              min="1"
              className={inputCls}
            />
          </Field>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-input"
            />
            <label htmlFor="active" className="text-sm text-muted-foreground cursor-pointer">
              Active (sweep automatically)
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving…" : "Save changes"}
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
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 border-t border-border bg-muted/10" />
      ))}
    </div>
  );
}