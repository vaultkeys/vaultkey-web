"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, Zap, TrendingUp, Loader2, CheckCircle, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { type StripePayment } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { useEnv } from "@/hooks/useEnv";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCredits, formatCents, formatDate } from "@/lib/utils";
import React from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const PACKAGES = [
  { label: "$10", cents: 1000, base: 10_000, bonus: 5_000 },
  { label: "$50", cents: 5000, base: 50_000, bonus: 25_000 },
  { label: "$100", cents: 10_000, base: 100_000, bonus: 50_000 },
  { label: "$500", cents: 50_000, base: 500_000, bonus: 250_000 },
];

export default function BillingPage() {
  const { getToken } = useAuth();
  const { orgId } = useOrg();
  const { isTestnet } = useEnv();
  const { cloud } = useApi();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<StripePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const load = async () => {
    if (!orgId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const [creditsData, histData] = await Promise.all([
        cloud.getCredits(token, orgId),
        // Don't fetch billing history on testnet — no payments exist
        isTestnet
          ? Promise.resolve({ payments: [] })
          : cloud.getBillingHistory(token, orgId),
      ]);
      setBalance(creditsData.balance);
      setHistory(histData?.payments ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { setBalance(0); setHistory([]); setLoading(true); load(); }, [orgId]);

  const initPayment = async (cents: number) => {
    setIntentLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await cloud.createPaymentIntent(token, { amount_cents: cents, currency: "usd" });
      setClientSecret(res.client_secret);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setIntentLoading(false); }
  };

  return (
    <div className="p-8">
      <PageHeader title="Billing & Credits" description={isTestnet ? "Testnet credit balance — free grants only" : "Purchase credits and view payment history"} />

      {/* Balance + stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          label="Credit balance"
          value={loading ? "…" : formatCredits(balance)}
          sub={isTestnet ? "free grant credits" : "available to spend"}
          icon={<Zap className="h-4 w-4" />}
        />
        {!isTestnet && (
          <>
            <StatCard
              label="Total purchases"
              value={loading ? "…" : history.filter((p) => p.status === "succeeded").length.toString()}
              sub="successful payments"
              icon={<CreditCard className="h-4 w-4" />}
            />
            <StatCard
              label="Total spent"
              value={loading ? "…" : formatCents(history.filter((p) => p.status === "succeeded").reduce((s, p) => s + p.amount_cents, 0))}
              sub="all time"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      {isTestnet ? (
        <TestnetCreditsInfo />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Purchase panel */}
          <div>
            {success ? (
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-8 text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold">Payment successful</p>
                <p className="text-sm text-muted-foreground mt-1">Credits will appear in your balance shortly</p>
                <button
                  onClick={() => { setSuccess(false); setClientSecret(null); setSelected(null); load(); }}
                  className="mt-4 text-sm underline text-muted-foreground hover:text-foreground"
                >
                  Purchase more credits
                </button>
              </div>
            ) : clientSecret && selected !== null ? (
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
                  Complete payment · {formatCents(PACKAGES[selected]!.cents)}
                </p>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm onSuccess={() => setSuccess(true)} onBack={() => setClientSecret(null)} />
                </Elements>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Purchase credits</p>
                <p className="text-xs text-muted-foreground mb-4">All packages include a 50% bonus. Credits expire 24 months after purchase.</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {PACKAGES.map((pkg, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        selected === i
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/40 hover:bg-muted/20"
                      }`}
                    >
                      <p className="font-semibold text-base">{pkg.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatCredits(pkg.base + pkg.bonus)} credits</p>
                      <p className="text-xs text-muted-foreground">{formatCredits(pkg.base)} + {formatCredits(pkg.bonus)} bonus</p>
                    </button>
                  ))}
                </div>
                <button
                  disabled={selected === null || intentLoading}
                  onClick={() => selected !== null && initPayment(PACKAGES[selected]!.cents)}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  {intentLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing payment…</>
                    : <><CreditCard className="h-4 w-4" /> Continue to payment</>}
                </button>
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Payment history</p>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No payments yet</div>
            ) : (
              <div className="space-y-1">
                {history.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{formatCents(p.amount_cents, p.currency)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">+{formatCredits(p.total_credits)} cr</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Shown in place of the purchase panel when on testnet */
function TestnetCreditsInfo() {
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/8 p-6">
        <div className="flex items-start gap-3">
          <FlaskConical className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Testnet credits are free</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your testnet workspace receives a free monthly grant of credits automatically — no payment needed.
              Credits are isolated from mainnet and cannot be transferred.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">How testnet credits work</p>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-mono">1</span>
            <p>Free credits are granted automatically each month — no action required.</p>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-mono">2</span>
            <p>Credits reset at the start of each billing period.</p>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-mono">3</span>
            <p>When you're ready to go live, switch to mainnet and purchase a credit package.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors">Back</button>
        <button type="submit" disabled={!stripe || loading} className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : "Pay now"}
        </button>
      </div>
    </form>
  );
}