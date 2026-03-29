"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Fuel, AlertTriangle, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { type Relayer, type RelayerInfo } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CopyButton } from "@/components/shared/CopyButton";
import { shortAddress, formatDate, cn } from "@/lib/utils";

export default function RelayersPage() {
  const { getToken } = useAuth();
  const { orgId } = useOrg();
  const { cloud } = useApi();
  const [relayers, setRelayers] = useState<Relayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    if (!orgId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const { relayers: data } = await cloud.listRelayers(token, orgId);
      setRelayers(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orgId]);

  const deactivate = async (relayerId: string, address: string) => {
    if (!confirm(`Deactivate fee payer ${shortAddress(address)}? It will stop paying gas for transactions.`)) return;
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.deactivateRelayer(token, orgId!, relayerId);
      setRelayers((p) => p.filter((r) => r.id !== relayerId));
      toast.success("Fee payer deactivated");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Fee Payers"
        description="Wallets that pay gas fees for your users' transactions. Enable gasless experiences."
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New fee payer
          </button>
        }
      />

      {/* Info banner */}
      <div className="mb-6 rounded-lg border border-blue-500/25 bg-blue-500/8 px-4 py-3 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">What are fee payers?</p>
          <p>
            Fee payers are dedicated wallets that cover gas costs for your users' transactions.
            When you enable <span className="font-mono text-xs bg-muted/50 px-1 rounded">gasless: true</span> on a transfer,
            the fee payer wallet pays the network fee instead of the user's wallet. This creates a
            seamless experience — your users can send stablecoins without holding native tokens.
          </p>
        </div>
      </div>

      {loading ? (
        <RelayersSkeleton />
      ) : relayers.length === 0 ? (
        <EmptyState
          icon={<Fuel className="h-10 w-10" />}
          title="No fee payers yet"
          description="Create a fee payer wallet to enable gasless transactions for your users."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create first fee payer
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
                  {["Address", "Chain", "Alert threshold", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {relayers.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{shortAddress(r.address)}</span>
                        <CopyButton value={r.address} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ChainBadge chain={r.chain_type} chainId={r.chain_id} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {r.min_balance_alert} {r.chain_type === "evm" ? "ETH" : "SOL"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={r.active} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deactivate(r.id, r.address)}
                        className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {relayers.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs truncate">{shortAddress(r.address)}</span>
                    <CopyButton value={r.address} />
                  </div>
                  <StatusBadge active={r.active} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <ChainBadge chain={r.chain_type} chainId={r.chain_id} />
                  <span className="font-mono">
                    Alert: {r.min_balance_alert} {r.chain_type === "evm" ? "ETH" : "SOL"}
                  </span>
                </div>
                <button
                  onClick={() => deactivate(r.id, r.address)}
                  className="w-full mt-2 px-3 py-1.5 rounded-md text-xs border border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {showCreate && (
        <CreateRelayerModal
          onClose={() => setShowCreate(false)}
          onCreated={(r) => {
            setRelayers((p) => [r, ...p]);
            setShowCreate(false);
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
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function CreateRelayerModal({
  onClose,
  onCreated,
  orgId,
}: {
  onClose: () => void;
  onCreated: (r: Relayer) => void;
  orgId: string;
}) {
  const { getToken } = useAuth();
  const { cloud } = useApi();
  const [chainType, setChainType] = useState<"evm" | "solana">("evm");
  const [chainId, setChainId] = useState("137");
  const [minBalanceAlert, setMinBalanceAlert] = useState("0.1");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (chainType === "evm" && !chainId) {
      toast.error("Chain ID is required for EVM fee payers");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const relayer = await cloud.registerRelayer(token, orgId, {
        chain_type: chainType,
        chain_id: chainType === "evm" ? chainId : undefined,
        min_balance_alert: minBalanceAlert || "0.1",
      });
      toast.success("Fee payer created");
      onCreated(relayer);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-border bg-popover p-6 shadow-xl">
        <h2 className="font-semibold text-base mb-1">New fee payer</h2>
        <p className="text-xs text-muted-foreground mb-4">
          A new wallet will be generated to pay gas fees for your users' transactions.
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

          <Field label={`Low balance alert (${chainType === "evm" ? "ETH" : "SOL"})`}>
            <input
              value={minBalanceAlert}
              onChange={(e) => setMinBalanceAlert(e.target.value)}
              placeholder="0.1"
              type="number"
              step="0.01"
              min="0"
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-1">
              You'll be notified when the balance drops below this threshold.
            </p>
          </Field>
        </div>

        <div className="mt-4 rounded-lg border border-yellow-500/25 bg-yellow-500/8 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Remember to fund this wallet!</strong> After creation,
              send {chainType === "evm" ? "ETH" : "SOL"} to the address to cover gas fees.
            </p>
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
            {loading ? "Creating…" : "Create fee payer"}
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

function RelayersSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="h-10 bg-muted/30" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 border-t border-border bg-muted/10" />
      ))}
    </div>
  );
}