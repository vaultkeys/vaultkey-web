"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CopyButton } from "@/components/shared/CopyButton";

type TransferResult = { job_id: string; status: string } | null;

export default function TransfersPage() {
  const { getToken } = useAuth();
  const { sdk } = useApi();

  const [apiKey, setApiKey] = useState("");
  const [walletId, setWalletId] = useState("");
  const [chainType, setChainType] = useState<"evm" | "solana">("evm");
  const [token, setToken] = useState<"usdc" | "usdt">("usdc");
  const [apiSecret, setApiSecret] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [chainId, setChainId] = useState("137");
  const [gasless, setGasless] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResult>(null);

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  const checkBalance = async () => {
    if (!apiKey || !apiSecret || !walletId) {
      toast.error("Enter API key, API secret, and wallet ID first");
      return;
    }
    setBalanceLoading(true);
    try {
      const res = await sdk.stablecoinBalance(
        { apiKey, apiSecret },
        walletId, chainType, token,
        chainType === "evm" ? chainId : undefined,
      );
      setBalance(`${res.balance} ${res.symbol}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBalanceLoading(false); }
  };

  const submit = async () => {
    if (!apiKey || !apiSecret || !walletId || !to || !amount) {
      toast.error("Fill all required fields");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await sdk.stablecoinTransfer(
        { apiKey, apiSecret },
        walletId, chainType,
        { token, to, amount, ...(chainType === "evm" ? { chain_id: chainId } : {}), gasless },
      );
      setResult(res);
      toast.success("Transfer queued");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Stablecoin Transfers"
        description="Send USDC or USDT from a wallet. Returns a job ID — poll for result."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Transfer form */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Transfer parameters</p>

          <Field label="Project API key *">
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="vk_live_…" className={iCls} />
          </Field>

          <Field label="Project API secret *">
            <input
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="sk_…"
              type="password"
              className={iCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Chain">
              <select value={chainType} onChange={(e) => { setChainType(e.target.value as "evm" | "solana"); setBalance(null); }} className={iCls}>
                <option value="evm">EVM</option>
                <option value="solana">Solana</option>
              </select>
            </Field>
            <Field label="Token">
              <select value={token} onChange={(e) => setToken(e.target.value as "usdc" | "usdt")} className={iCls}>
                <option value="usdc">USDC</option>
                <option value="usdt">USDT</option>
              </select>
            </Field>
          </div>

          {chainType === "evm" && (
            <Field label="Chain ID (EVM)">
              <select value={chainId} onChange={(e) => setChainId(e.target.value)} className={iCls}>
                <option value="1">Ethereum (1)</option>
                <option value="137">Polygon (137)</option>
                <option value="42161">Arbitrum (42161)</option>
                <option value="10">Optimism (10)</option>
                <option value="8453">Base (8453)</option>
                <option value="56">BSC (56)</option>
              </select>
            </Field>
          )}

          <Field label="Wallet ID *">
            <div className="flex gap-2">
              <input value={walletId} onChange={(e) => { setWalletId(e.target.value); setBalance(null); }} placeholder="wallet_…" className={iCls} />
              <button onClick={checkBalance} disabled={balanceLoading} className="px-3 py-2 text-xs rounded-md border border-border hover:bg-accent transition-colors whitespace-nowrap disabled:opacity-50 shrink-0">
                {balanceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Check"}
              </button>
            </div>
            {balance && (
              <p className="mt-1 text-xs text-muted-foreground">Balance: <span className="text-foreground font-medium">{balance}</span></p>
            )}
          </Field>

          <Field label="Recipient address *">
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={chainType === "evm" ? "0x…" : "Base58…"} className={iCls} />
          </Field>

          <Field label="Amount *">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.00" className={iCls} type="number" min="0" step="0.01" />
          </Field>

          {chainType === "evm" && (
            <div className="flex items-center gap-2">
              <input id="gasless" type="checkbox" checked={gasless} onChange={(e) => setGasless(e.target.checked)} className="rounded border-input" />
              <label htmlFor="gasless" className="text-sm text-muted-foreground cursor-pointer">Gasless (relayer pays gas)</label>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Queuing transfer…</> : <><ArrowLeftRight className="h-4 w-4" /> Send transfer</>}
          </button>
        </div>

        {/* Result + info */}
        <div className="space-y-4">
          {result ? (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Transfer queued</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">Job ID</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs truncate">{result.job_id}</span>
                    <CopyButton value={result.job_id} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={result.status} />
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Poll <span className="font-mono text-foreground">GET /sdk/jobs/{"{job_id}"}</span> or wait for your webhook callback.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
              <ArrowLeftRight className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Transfer result will appear here</p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">How it works</p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Transfer request is queued immediately (HTTP 202)</li>
              <li>Worker picks up the job, signs the stablecoin tx</li>
              <li>Transaction is broadcast to the chain</li>
              <li>Result delivered to your webhook + available via job poll</li>
            </ol>
            <div className="mt-4 rounded-lg bg-muted/40 p-3 font-mono text-xs text-muted-foreground break-all">
              POST /sdk/wallets/{"{walletId}"}/stablecoin/transfer/{"{chainType}"}
            </div>
          </div>
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

const iCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30";