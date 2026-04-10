"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  RefreshCw, Pencil, Check, X, AlertTriangle,
  ShieldCheck, ShieldAlert, WifiOff, Trash2, Info,
} from "lucide-react";
import { toast } from "sonner";
import { type Relayer, type RelayerLiveInfo } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useChains } from "@/hooks/useChains";
import { CopyButton } from "@/components/shared/CopyButton";
import { StatusBadgeBoolean } from "@/components/shared/StatusBadge";
import ChainBadge from "@/components/shared/ChainBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@vaultkey/ui/src/dialog";
import { formatRelayerBalance } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RelayerDetailProps {
  relayer: Relayer;
  orgId: string;
  /** Called after a successful deactivation so the parent can update state. */
  onDeactivated?: (relayerId: string) => void;
  /** Called after min_balance_alert is updated. */
  onUpdated?: (relayer: Relayer) => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function RelayerDetail({ relayer, orgId, onDeactivated, onUpdated }: RelayerDetailProps) {
  const { getToken } = useAuth();
  const { cloud } = useApi();
  const { chains } = useChains();

  // Live balance state
  const [liveInfo, setLiveInfo] = useState<RelayerLiveInfo | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Alert threshold edit state
  const [editing, setEditing] = useState(false);
  const [alertDraft, setAlertDraft] = useState(relayer.min_balance_alert);
  const [alertSaving, setAlertSaving] = useState(false);

  // Deactivate state
  const [deactivating, setDeactivating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Derive native symbol from chain registry for display.
  const nativeSymbol = relayer.chain_type === "solana"
    ? "SOL"
    : chains.find((c) => c.chain_id === relayer.chain_id)?.native_symbol ?? "ETH";

  // ── Live balance fetch ──────────────────────────────────────────────────────

  const fetchLiveInfo = useCallback(async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const info = await cloud.getRelayerLiveInfo(token, orgId, relayer.id);
      setLiveInfo(info);
    } catch (e: any) {
      // 502 = RPC unreachable, anything else is unexpected.
      const msg = e.status === 502
        ? "Balance unavailable — RPC node unreachable"
        : (e.message ?? "Failed to fetch balance");
      setLiveError(msg);
    } finally {
      setLiveLoading(false);
    }
  }, [getToken, cloud, orgId, relayer.id]);

  useEffect(() => {
    fetchLiveInfo();
  }, [fetchLiveInfo]);

  // ── Alert threshold update ──────────────────────────────────────────────────

  const saveAlert = async () => {
    const trimmed = alertDraft.trim();
    // Basic client-side validation before hitting the API.
    const parsed = parseFloat(trimmed);
    if (!trimmed || isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid non-negative number (e.g. 0.1)");
      return;
    }
    setAlertSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await cloud.updateRelayer(token, orgId, relayer.id, {
        min_balance_alert: trimmed,
      });
      onUpdated?.(updated);
      toast.success("Alert threshold updated");
      setEditing(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update threshold");
    } finally {
      setAlertSaving(false);
    }
  };

  const cancelEdit = () => {
    setAlertDraft(relayer.min_balance_alert);
    setEditing(false);
  };

  // ── Deactivate ──────────────────────────────────────────────────────────────

  const deactivate = async () => {
    setDeactivating(true);
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.deactivateRelayer(token, orgId, relayer.id);
      toast.success("Fee payer deactivated");
      onDeactivated?.(relayer.id);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to deactivate");
    } finally {
      setDeactivating(false);
      setConfirmOpen(false);
    }
  };

  // ── Derived balance values ──────────────────────────────────────────────────

  const formattedBalance = liveInfo
    ? formatRelayerBalance(liveInfo.balance, liveInfo.unit, relayer.chain_type, nativeSymbol)
    : null;

  const createdAt = relayer.created_at
    ? new Date(relayer.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Inactive banner */}
      {!relayer.active && (
        <div className="rounded-lg border border-muted-foreground/20 bg-muted/30 px-4 py-3 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            This fee payer is <strong className="text-foreground">inactive</strong> and will not pay gas for transactions.
            Balance is shown for reference only.
          </p>
        </div>
      )}

      {/* Identity card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Identity</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Address">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs break-all">{relayer.address}</span>
              <CopyButton value={relayer.address} className="shrink-0" />
            </div>
          </Field>

          <Field label="Wallet ID">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-muted-foreground truncate">{relayer.wallet_id}</span>
              <CopyButton value={relayer.wallet_id} className="shrink-0" />
            </div>
          </Field>

          <Field label="Chain">
            <ChainBadge chain={relayer.chain_type} chainId={relayer.chain_id} />
          </Field>

          <Field label="Status">
            <StatusBadgeBoolean active={relayer.active} resultIfYes="Active" resultIfNo="Inactive" />
          </Field>

          {createdAt && (
            <Field label="Created">
              <span className="text-sm">{createdAt}</span>
            </Field>
          )}
        </div>
      </div>

      {/* Live balance card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Live Balance</p>
          <button
            onClick={fetchLiveInfo}
            disabled={liveLoading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", liveLoading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {liveLoading ? (
          <BalanceSkeleton />
        ) : liveError ? (
          <BalanceError message={liveError} onRetry={fetchLiveInfo} />
        ) : liveInfo && formattedBalance ? (
          <div className="space-y-3">
            {/* Balance value */}
            <div>
              <p className="text-3xl font-semibold font-mono tabular-nums tracking-tight">
                {formattedBalance.value}
                <span className="text-lg text-muted-foreground ml-2">{formattedBalance.symbol}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {liveInfo.balance} {liveInfo.unit}
              </p>
            </div>

            {/* Health indicators */}
            <div className="space-y-2">
              <HealthRow
                healthy={liveInfo.healthy}
                label={liveInfo.healthy
                  ? "Above minimum operating balance"
                  : "Below minimum operating balance (0.05 " + nativeSymbol + ")"}
              />
              {liveInfo.alert_triggered && (
                <div className="flex items-start gap-2 rounded-md border border-yellow-500/25 bg-yellow-500/8 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Balance is below your alert threshold of{" "}
                    <span className="font-mono text-foreground">
                      {relayer.min_balance_alert} {nativeSymbol}
                    </span>
                    . Top up this wallet to avoid disruptions.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Configuration card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Configuration</p>

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Low balance alert threshold</p>
          {editing ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-[200px]">
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  min="0"
                  value={alertDraft}
                  onChange={(e) => setAlertDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveAlert();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono">{nativeSymbol}</span>
              <button
                onClick={saveAlert}
                disabled={alertSaving}
                className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {alertSaving
                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  : <Check className="h-3.5 w-3.5" />
                }
              </button>
              <button
                onClick={cancelEdit}
                disabled={alertSaving}
                className="p-1.5 rounded-md border border-border hover:bg-accent transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">
                {relayer.min_balance_alert} {nativeSymbol}
              </span>
              <button
                onClick={() => {
                  setAlertDraft(relayer.min_balance_alert);
                  setEditing(true);
                }}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1.5">
            You'll be notified when the balance drops below this value.
          </p>
        </div>
      </div>

      {/* Danger zone — only shown for active relayers */}
      {relayer.active && (
        <div className="rounded-xl border border-red-500/20 bg-card p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Danger Zone</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Deactivate fee payer</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The wallet will stop paying gas. This cannot be undone from the dashboard.
              </p>
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={deactivating}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deactivating ? "Deactivating…" : "Deactivate"}
            </button>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate fee payer?</DialogTitle>
            <DialogDescription>
              This wallet will stop paying gas for transactions. This cannot be undone from the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <button className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors">Cancel</button>
            </DialogClose>
            <button onClick={deactivate} disabled={deactivating} className="px-4 py-2 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors">
              {deactivating ? "Deactivating…" : "Deactivate"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div>{children}</div>
    </div>
  );
}

function HealthRow({ healthy, label }: { healthy: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {healthy
        ? <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
        : <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
      }
      <p className={cn("text-xs", healthy ? "text-muted-foreground" : "text-red-600 dark:text-red-400")}>
        {label}
      </p>
    </div>
  );
}

function BalanceSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-8 w-40 rounded bg-muted/40" />
      <div className="h-3 w-24 rounded bg-muted/30" />
    </div>
  );
}

function BalanceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-muted-foreground/20 bg-muted/20 px-4 py-3">
      <WifiOff className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{message}</p>
        <button
          onClick={onRetry}
          className="mt-1.5 text-xs text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}