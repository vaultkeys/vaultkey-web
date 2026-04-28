"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Zap, TrendingDown, ArrowDownToLine, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { type RelayerLiveInfo } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

interface TronStakingPanelProps {
  relayerId: string;
  orgId: string;
  liveInfo: RelayerLiveInfo;
  onActionComplete: () => void; // refresh live info after stake/unstake/withdraw
}

function formatEnergy(n: number) {
  return n.toLocaleString("en-US");
}

export function TronStakingPanel({ relayerId, orgId, liveInfo, onActionComplete }: TronStakingPanelProps) {
  const { getToken } = useAuth();
  const { cloud } = useApi();

  const [activeAction, setActiveAction] = useState<"stake" | "unstake" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground";

  const handleStake = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Enter a valid TRX amount");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await cloud.stakeTRX(token, orgId, relayerId, {
        amount_trx: amount,
        resource: "ENERGY",
      });
      toast.success(`Staked ${amount} TRX — takes effect in ~3 seconds`, {
        description: `Transaction: ${res.tx_id.slice(0, 16)}…`,
      });
      setAmount("");
      setActiveAction(null);
      setTimeout(onActionComplete, 4000); // give the chain a moment to update
    } catch (e: any) {
      toast.error(e.message ?? "Stake failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Enter a valid TRX amount");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.unstakeTRX(token, orgId, relayerId, {
        amount_trx: amount,
        resource: "ENERGY",
      });
      toast.success(`Unstaked ${amount} TRX`, {
        description: "Your TRX will be locked for 14 days before you can withdraw it.",
        duration: 8000,
      });
      setAmount("");
      setActiveAction(null);
      setTimeout(onActionComplete, 4000);
    } catch (e: any) {
      toast.error(e.message ?? "Unstake failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await cloud.withdrawStake(token, orgId, relayerId);
      toast.success(`Withdrew ${res.withdrawn_trx} TRX back to your relayer wallet`);
      setActiveAction(null);
      setTimeout(onActionComplete, 4000);
    } catch (e: any) {
      // Backend returns 400 when nothing is ready to withdraw
      if (e.status === 400) {
        toast.error("Nothing to withdraw yet — the 14-day lock period hasn't expired");
      } else {
        toast.error(e.message ?? "Withdraw failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Energy Management</p>
        <button
          onClick={() => setShowExplainer((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          How it works
          {showExplainer ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Explainer */}
      {showExplainer && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/6 px-4 py-3 text-xs text-muted-foreground space-y-1.5">
          <p><strong className="text-foreground">Staking TRX gives your relayer energy.</strong> Energy is what pays for your users' USDT transfers on Tron — no energy means the relayer burns TRX directly instead, which costs about 6.5 TRX per transfer.</p>
          <p>Staking ~6,000 TRX gives roughly 65,000 energy per day, enough for ~1 transfer. For higher volume, stake more TRX.</p>
          <p><strong className="text-foreground">Unstaking takes 14 days</strong> — your TRX is locked during that period. You don't lose it; you just can't move it yet.</p>
        </div>
      )}

      {/* Current energy stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox
          label="Available energy"
          value={liveInfo.available_energy != null ? formatEnergy(liveInfo.available_energy) : "—"}
          sub="units today"
          alert={liveInfo.energy_alert_triggered}
        />
        <StatBox
          label="Est. transfers left"
          value={liveInfo.estimated_transactions_remaining != null
            ? liveInfo.estimated_transactions_remaining.toLocaleString("en-US")
            : "—"}
          sub="at 65k energy each"
        />
        <StatBox
          label="TRX staked for energy"
          value={liveInfo.staked_for_energy_trx
            ? `${parseFloat(liveInfo.staked_for_energy_trx).toLocaleString("en-US", { maximumFractionDigits: 2 })} TRX`
            : "—"}
          sub="currently staked"
        />
        <StatBox
          label="Daily energy limit"
          value={liveInfo.total_energy_limit != null ? formatEnergy(liveInfo.total_energy_limit) : "—"}
          sub="resets daily"
        />
      </div>

      {/* Low energy warning */}
      {liveInfo.energy_alert_triggered && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/25 bg-yellow-500/8 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Energy is low — transfers will burn TRX directly until you stake more.
            Consider staking additional TRX to avoid higher costs.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {activeAction === null && (
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Stake TRX"
            description="Lock TRX to earn daily energy"
            onClick={() => setActiveAction("stake")}
          />
          <ActionButton
            icon={<TrendingDown className="h-3.5 w-3.5" />}
            label="Unstake TRX"
            description="Start 14-day unlock process"
            onClick={() => setActiveAction("unstake")}
          />
          <ActionButton
            icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
            label="Withdraw"
            description="Reclaim TRX after lock expires"
            onClick={() => setActiveAction("withdraw")}
          />
        </div>
      )}

      {/* Stake form */}
      {activeAction === "stake" && (
        <ActionForm
          title="Stake TRX for energy"
          description="Staked TRX generates energy daily. The more you stake, the more transfers your relayer can cover for free."
          inputLabel="Amount (TRX)"
          inputValue={amount}
          onInputChange={setAmount}
          onConfirm={handleStake}
          onCancel={() => { setActiveAction(null); setAmount(""); }}
          loading={loading}
          confirmLabel="Stake TRX"
          confirmVariant="primary"
        />
      )}

      {/* Unstake form */}
      {activeAction === "unstake" && (
        <ActionForm
          title="Unstake TRX"
          description="Starting the unstake process reduces your energy immediately. Your TRX will be locked for 14 days — you can withdraw it after the lock expires."
          inputLabel="Amount (TRX)"
          inputValue={amount}
          onInputChange={setAmount}
          onConfirm={handleUnstake}
          onCancel={() => { setActiveAction(null); setAmount(""); }}
          loading={loading}
          confirmLabel="Unstake TRX"
          confirmVariant="danger"
          warning="This reduces your energy immediately. Transfers will burn TRX directly until the lock period ends and you re-stake."
        />
      )}

      {/* Withdraw form */}
      {activeAction === "withdraw" && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Withdraw unlocked TRX</p>
            <p className="text-xs text-muted-foreground mt-1">
              Reclaims TRX that has completed the 14-day lock period and returns it to your relayer wallet balance.
              If nothing is ready yet, you'll see an error.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Withdrawing…" : "Withdraw available TRX"}
            </button>
            <button
              onClick={() => setActiveAction(null)}
              disabled={loading}
              className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ label, value, sub, alert }: { label: string; value: string; sub: string; alert?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${alert ? "border-yellow-500/30 bg-yellow-500/5" : "border-border bg-muted/10"}`}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-mono font-medium tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>
    </div>
  );
}

function ActionButton({ icon, label, description, onClick }: {
  icon: React.ReactNode; label: string; description: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span>
        <span className="font-medium block text-xs">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

function ActionForm({ title, description, inputLabel, inputValue, onInputChange, onConfirm, onCancel, loading, confirmLabel, confirmVariant, warning }: {
  title: string; description: string; inputLabel: string;
  inputValue: string; onInputChange: (v: string) => void;
  onConfirm: () => void; onCancel: () => void;
  loading: boolean; confirmLabel: string;
  confirmVariant: "primary" | "danger";
  warning?: string;
}) {
  const confirmCls = confirmVariant === "danger"
    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    : "bg-primary text-primary-foreground hover:bg-primary/90";

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      {warning && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/25 bg-yellow-500/8 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{warning}</p>
        </div>
      )}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{inputLabel}</label>
        <input
          autoFocus
          type="number"
          min="0"
          step="1"
          placeholder="e.g. 1000"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onConfirm(); if (e.key === "Escape") onCancel(); }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 rounded-md text-sm disabled:opacity-50 transition-colors ${confirmCls}`}>
          {loading ? "Processing…" : confirmLabel}
        </button>
        <button onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}