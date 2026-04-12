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
import { StatusBadgeBoolean } from "@/components/shared/StatusBadge";
import ChainBadge from "@/components/shared/ChainBadge";

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
      const { master_wallets } = await cloud.listMasterWallets(token, orgId);
      setWallets(master_wallets);
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
    <div className="p-6 space-y-6">
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
            into a central treasury. When a user wallet balance exceeds the dust threshold, VaultKey
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
                  {["Address", "Chain", "Dust threshold", "Status", ""].map((h) => (
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
                        <span className="font-mono text-xs">{shortAddress(w.master_address)}</span>
                        <CopyButton value={w.master_address} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ChainBadge chain={w.chain_type} chainId={w.chain_id} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {w.dust_threshold === "0" ? "Always sweep" : w.dust_threshold}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadgeBoolean active={w.enabled} resultIfYes="Active" resultIfNo="Inactive" />
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
                    <span className="font-mono text-xs truncate">{shortAddress(w.master_address)}</span>
                    <CopyButton value={w.master_address} />
                  </div>
                  <StatusBadgeBoolean active={w.enabled} resultIfYes="Active" resultIfNo="Inactive" />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Chain</span>
                    <ChainBadge chain={w.chain_type} chainId={w.chain_id} />
                  </div>
                  <div className="flex justify-between">
                    <span>Dust threshold</span>
                    <span className="font-mono">
                      {w.dust_threshold === "0" ? "Always sweep" : w.dust_threshold}
                    </span>
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
  const [dustThreshold, setDustThreshold] = useState("0");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (chainType === "evm" && !chainId) {
      toast.error("Chain ID is required for EVM collection wallets");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const wallet = await cloud.provisionMasterWallet(token, orgId, {
        chain_type: chainType,
        chain_id: chainType === "evm" ? chainId : undefined,
        dust_threshold: dustThreshold,
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

          <Field label="Dust threshold">
            <input
              value={dustThreshold}
              onChange={(e) => setDustThreshold(e.target.value)}
              placeholder="0"
              type="text"
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum balance before a sweep triggers. Set to "0" to always sweep.
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
  const [dustThreshold, setDustThreshold] = useState(wallet.dust_threshold);
  const [enabled, setEnabled] = useState(wallet.enabled);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      // Backend returns { status: "updated" } not the updated object,
      // so we merge changes locally.
      await cloud.updateMasterWallet(token, orgId, wallet.id, {
        dust_threshold: dustThreshold,
        enabled,
      });
      toast.success("Collection wallet updated");
      onUpdated({ ...wallet, dust_threshold: dustThreshold, enabled });
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
        <p className="text-xs text-muted-foreground mb-4 font-mono">{shortAddress(wallet.master_address)}</p>
        <div className="space-y-3">
          <Field label="Dust threshold">
            <input
              value={dustThreshold}
              onChange={(e) => setDustThreshold(e.target.value)}
              type="text"
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum balance before a sweep triggers. Set to "0" to always sweep.
            </p>
          </Field>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-input"
            />
            <label htmlFor="enabled" className="text-sm text-muted-foreground cursor-pointer">
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