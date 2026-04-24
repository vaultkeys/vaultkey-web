"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { loadStripe } from "@stripe/stripe-js";
import {
  CreditCard,
  Zap,
  Loader2,
  CheckCircle,
  FlaskConical,
  AlertTriangle,
  ChevronRight,
  Check,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { type OrgSubscription, type StripePayment } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { useEnv } from "@/hooks/useEnv";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCredits, formatCents, formatDate } from "@/lib/utils";
import React from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

// ── Pricing data ──────────────────────────────────────────────────────────────

type BillingInterval = "monthly" | "yearly" | "two_year";

interface TierSlot {
  cents: number;       // monthly-equivalent shown in UI
  upfrontCents: number; // what Stripe actually charges (0 for monthly)
  credits: number;
  price_id: string;
}

interface Tier {
  id: string;
  name: string;
  tier: string;
  monthly: TierSlot | null;
  yearly: TierSlot | null;
  two_year: TierSlot | null;
  highlight?: boolean;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    tier: "free",
    monthly: null,
    yearly: null,
    two_year: null,
  },
  {
    id: "starter_49",
    name: "Starter",
    tier: "starter",
    monthly:  { cents: 4900,  upfrontCents: 0,      credits: 4_000_000,  price_id: "price_starter_49_mo"  },
    yearly:   { cents: 2940,  upfrontCents: 35280,   credits: 4_000_000,  price_id: "price_starter_49_yr"  },
    two_year: { cents: 2450,  upfrontCents: 58800,   credits: 4_000_000,  price_id: "price_starter_49_2yr" },
  },
  {
    id: "starter_79",
    name: "Starter",
    tier: "starter",
    monthly:  { cents: 7900,  upfrontCents: 0,      credits: 7_000_000,  price_id: "price_starter_79_mo"  },
    yearly:   { cents: 4740,  upfrontCents: 56880,   credits: 7_000_000,  price_id: "price_starter_79_yr"  },
    two_year: { cents: 3950,  upfrontCents: 94800,   credits: 7_000_000,  price_id: "price_starter_79_2yr" },
  },
  {
    id: "pro_99",
    name: "Pro",
    tier: "pro",
    highlight: true,
    badge: "Most popular",
    monthly:  { cents: 9900,  upfrontCents: 0,      credits: 10_000_000, price_id: "price_pro_99_mo"      },
    yearly:   { cents: 5940,  upfrontCents: 71280,   credits: 10_000_000, price_id: "price_pro_99_yr"      },
    two_year: { cents: 4950,  upfrontCents: 118800,  credits: 10_000_000, price_id: "price_pro_99_2yr"     },
  },
  {
    id: "pro_139",
    name: "Pro",
    tier: "pro",
    monthly:  { cents: 13900, upfrontCents: 0,      credits: 15_000_000, price_id: "price_pro_139_mo"     },
    yearly:   { cents: 8340,  upfrontCents: 100080,  credits: 15_000_000, price_id: "price_pro_139_yr"     },
    two_year: { cents: 6950,  upfrontCents: 166800,  credits: 15_000_000, price_id: "price_pro_139_2yr"    },
  },
  {
    id: "pro_179",
    name: "Pro",
    tier: "pro",
    monthly:  { cents: 17900, upfrontCents: 0,      credits: 20_000_000, price_id: "price_pro_179_mo"     },
    yearly:   { cents: 10740, upfrontCents: 128880,  credits: 20_000_000, price_id: "price_pro_179_yr"     },
    two_year: { cents: 8950,  upfrontCents: 214800,  credits: 20_000_000, price_id: "price_pro_179_2yr"    },
  },
  {
    id: "scale_349",
    name: "Scale",
    tier: "scale",
    monthly:  { cents: 34900, upfrontCents: 0,      credits: 40_000_000, price_id: "price_scale_349_mo"   },
    yearly:   { cents: 20940, upfrontCents: 251280,  credits: 40_000_000, price_id: "price_scale_349_yr"   },
    two_year: { cents: 17450, upfrontCents: 418800,  credits: 40_000_000, price_id: "price_scale_349_2yr"  },
  },
  {
    id: "scale_649",
    name: "Scale",
    tier: "scale",
    monthly:  { cents: 64900, upfrontCents: 0,      credits: 80_000_000, price_id: "price_scale_649_mo"   },
    yearly:   { cents: 38940, upfrontCents: 467280,  credits: 80_000_000, price_id: "price_scale_649_yr"   },
    two_year: { cents: 32450, upfrontCents: 778800,  credits: 80_000_000, price_id: "price_scale_649_2yr"  },
  },
];

const INTERVAL_LABELS: Record<BillingInterval, { label: string; badge?: string }> = {
  monthly:  { label: "Monthly" },
  yearly:   { label: "Yearly",   badge: "–40%" },
  two_year: { label: "2-Year",   badge: "–50%" },
};

const UPFRONT_LABEL: Record<BillingInterval, string> = {
  monthly:  "",
  yearly:   "billed annually",
  two_year: "billed every 2 years",
};

const FREE_FEATURES = [
  "100,000 lifetime credits",
  "3 requests/sec",
  "5 subscriptions",
  "1-day notification history",
  "Full nodes + debugging tools",
  "Community support",
];

const PAID_FEATURES = [
  "200 requests/sec",
  "200,000 subscriptions",
  "7-day notification history",
  "Advanced analytics",
  "Team features",
  "Archive nodes",
  "Helpdesk priority support",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatM(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function tierColor(tier: string) {
  switch (tier) {
    case "starter": return "text-blue-400";
    case "pro":     return "text-primary";
    case "scale":   return "text-purple-400";
    default:        return "text-muted-foreground";
  }
}

function tierBg(tier: string) {
  switch (tier) {
    case "starter": return "border-blue-500/30 bg-blue-500/5";
    case "pro":     return "border-primary/40 bg-primary/5";
    case "scale":   return "border-purple-500/30 bg-purple-500/5";
    default:        return "border-border bg-card";
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { getToken } = useAuth();
  const { orgId } = useOrg();
  const { isTestnet } = useEnv();
  const { cloud } = useApi();

  const [creditBalance, setCreditBalance]   = useState(0);
  const [subscription, setSubscription]     = useState<OrgSubscription | null>(null);
  const [history, setHistory]               = useState<StripePayment[]>([]);
  const [loading, setLoading]               = useState(true);

  // checkout flow
  const [interval, setInterval]             = useState<BillingInterval>("monthly");
  const [selectedTier, setSelectedTier]     = useState<Tier | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [success, setSuccess]               = useState(false);

  // ref for Stripe embedded checkout instance — needed to unmount on back/success
  const checkoutRef = useRef<{ unmount: () => void } | null>(null);
  const mountRef    = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!orgId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const [creditsData, subData, histData] = await Promise.all([
        cloud.getCredits(token, orgId),
        cloud.getSubscription(token, orgId),
        isTestnet
          ? Promise.resolve({ payments: [] })
          : cloud.getBillingHistory(token, orgId),
      ]);
      setCreditBalance(creditsData.balance);
      setSubscription(subData);
      setHistory(histData?.payments ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCreditBalance(0);
    setSubscription(null);
    setHistory([]);
    setLoading(true);
    load();
  }, [orgId]);

  // Mount embedded checkout once we have a selected tier
  useEffect(() => {
    if (!selectedTier || !mountRef.current) return;

    let cancelled = false;

    (async () => {
      const slot = selectedTier[interval];
      if (!slot) return;

      const stripe = await stripePromise;
      if (!stripe || cancelled) return;

      try {
        const token = await getToken();
        if (!token || cancelled) return;

        const { client_secret } = await cloud.createCheckoutSession(token, orgId!, {
          price_id:   slot.price_id,
          return_url: window.location.href,
        });

        if (cancelled) return;

        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret: client_secret,
          onComplete() {
            checkoutRef.current = null;
            setSuccess(true);
          },
        });

        if (cancelled) {
          checkout.unmount();
          return;
        }

        checkoutRef.current = checkout;

        // mountRef.current is guaranteed non-null here — checked at top of effect
        checkout.mount(mountRef.current!);
      } catch (e: any) {
        if (!cancelled) toast.error(e.message ?? "Failed to load checkout");
        setSelectedTier(null);
      }
    })();

    return () => {
      cancelled = true;
      checkoutRef.current?.unmount();
      checkoutRef.current = null;
    };
  }, [selectedTier]);

  const handleBack = () => {
    checkoutRef.current?.unmount();
    checkoutRef.current = null;
    setSelectedTier(null);
  };

  const reset = () => {
    setSuccess(false);
    setSelectedTier(null);
    setLoading(true);
    load();
  };

  const isSuspended = !!subscription?.suspended_at;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Billing & Credits"
        description={
          isTestnet
            ? "Testnet workspace — free credits only"
            : "Manage your plan and view usage"
        }
      />

      {isSuspended && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/8 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Account suspended</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {subscription?.suspension_reason === "chargeback_dispute"
                ? "A chargeback dispute was opened on your account. Contact support to resolve."
                : "Your account has been suspended. Contact support for details."}
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          label="Credit balance"
          value={loading ? "…" : formatCredits(creditBalance)}
          sub={
            isTestnet
              ? "free grant credits"
              : subscription?.plan
              ? `${formatM(subscription.plan.monthly_credits)}/mo on ${subscription.plan.display_name}`
              : "free tier"
          }
          icon={<Zap className="h-4 w-4" />}
        />
        {!isTestnet && subscription && (
          <StatCard
            label="Current plan"
            value={loading ? "…" : subscription.plan?.display_name ?? "Free"}
            sub={
              subscription.status === "past_due"
                ? "⚠ payment past due"
                : subscription.current_period_end
                ? `renews ${formatDate(subscription.current_period_end)}`
                : "lifetime credits"
            }
            icon={<CreditCard className="h-4 w-4" />}
          />
        )}
        {!isTestnet && subscription?.plan && (
          <StatCard
            label="Rate limit"
            value={loading ? "…" : `${subscription.plan.rate_limit_rps} req/s`}
            sub="current plan allowance"
            icon={<ArrowUpRight className="h-4 w-4" />}
          />
        )}
      </div>

      {isTestnet ? (
        <TestnetCreditsInfo />
      ) : success ? (
        <SuccessBanner onReset={reset} />
      ) : selectedTier ? (
        // Embedded Stripe Checkout — mounts into this div via the effect above
        <div className="max-w-xl">
          <button
            onClick={handleBack}
            className="mb-4 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            ← Back to plans
          </button>
          <div
            ref={mountRef}
            className="min-h-[400px] rounded-xl border border-border bg-card p-1"
          >
            {checkoutLoading && (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {subscription && (
            <CurrentPlanCard subscription={subscription} />
          )}

          {/* Interval toggle */}
          <div>
           <div className="flex items-center gap-1 mb-6 w-fit rounded-lg border border-border bg-muted/30 p-1">
            {(["monthly", "yearly", "two_year"] as BillingInterval[]).map((iv) => {
              const { label, badge } = INTERVAL_LABELS[iv];
              return (
                <button
                  key={iv}
                  onClick={() => setInterval(iv)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    interval === iv
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {badge && (
                    <span className={`text-[10px] px-1 py-0.5 rounded font-semibold ${
                      interval === iv
                        ? "bg-green-500/15 text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FreeTierCard active={!subscription?.plan} />
              {TIERS.filter((t) => t.tier !== "free").map((tier) => {
                const slot = tier[interval];
                const isActive =
                  !!subscription?.plan &&
                  subscription.plan.monthly_credits === (slot?.credits ?? 0) &&
                  subscription.plan.tier === tier.tier;
                return (
                  <TierCard
                    key={tier.id}
                    tier={tier}
                    slot={slot}
                    interval={interval}
                    isActive={isActive}
                    onSelect={() => setSelectedTier(tier)}
                  />
                );
              })}
              <BusinessCard />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              All paid plans include
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAID_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
                Payment history
              </p>
              <div className="space-y-1">
                {history.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatCents(p.amount_cents, p.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        +{formatCredits(p.total_credits)} cr
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CurrentPlanCard({ subscription }: { subscription: OrgSubscription }) {
  const plan = subscription.plan;
  const isPaid = !!plan;

  return (
    <div
      className={`rounded-xl border p-5 flex items-start justify-between gap-4 ${
        isPaid ? tierBg(plan!.tier) : "border-border bg-card"
      }`}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className={`text-sm font-semibold ${isPaid ? tierColor(plan!.tier) : "text-muted-foreground"}`}>
            {plan?.display_name ?? "Free"}
          </p>
          {subscription.status === "past_due" && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
              past due
            </span>
          )}
          {subscription.cancel_at_period_end && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20">
              cancels at period end
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isPaid
            ? `${formatM(plan!.monthly_credits)} credits/mo · ${plan!.rate_limit_rps} req/s`
            : "100K lifetime credits · 3 req/s"}
        </p>
        {subscription.current_period_end && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {subscription.cancel_at_period_end ? "Ends" : "Renews"}{" "}
            {formatDate(subscription.current_period_end)}
          </p>
        )}
      </div>
    </div>
  );
}

function FreeTierCard({ active }: { active: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col ${
        active
          ? "border-border bg-muted/20 ring-1 ring-border"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-3">
        <p className="text-sm font-semibold">Free</p>
        <p className="text-2xl font-bold mt-1">$0</p>
        <p className="text-xs text-muted-foreground">forever</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">100K lifetime credits</p>
      <div className="space-y-1.5 mb-4">
        {FREE_FEATURES.map((f) => (
          <div key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Check className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/60" />
            {f}
          </div>
        ))}
      </div>
      {active && (
        <div className="mt-auto pt-2 text-xs text-center text-muted-foreground">
          Current plan
        </div>
      )}
    </div>
  );
}

function TierCard({
  tier,
  slot,
  interval,
  isActive,
  onSelect,
}: {
  tier: Tier;
  slot: TierSlot | null;
  interval: BillingInterval;
  isActive: boolean;
  onSelect: () => void;
}) {
  if (!slot) return null;

  const upfrontLabel = slot.upfrontCents > 0
    ? `$${(slot.upfrontCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${UPFRONT_LABEL[interval]}`
    : null;

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col transition-colors relative ${
        isActive
          ? tierBg(tier.tier) + " ring-1 ring-primary/40"
          : tier.highlight
          ? "border-primary/30 bg-primary/5 hover:border-primary/50"
          : "border-border bg-card hover:border-muted-foreground/30"
      }`}
    >
      {tier.badge && !isActive && (
        <span className="absolute -top-2.5 left-3 text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
          {tier.badge}
        </span>
      )}
      {isActive && (
        <span className="absolute -top-2.5 left-3 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
          Current
        </span>
      )}

      <div className="mb-3">
        <p className={`text-sm font-semibold ${tierColor(tier.tier)}`}>{tier.name}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold">${slot.cents / 100}</span>
          <span className="text-xs text-muted-foreground">/mo</span>
        </div>
        {upfrontLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{upfrontLabel}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        {formatM(slot.credits)} credits/mo
      </p>

      <button
        disabled={isActive}
        onClick={onSelect}
        className={`mt-auto w-full rounded-md px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
          isActive
            ? "bg-muted text-muted-foreground cursor-default"
            : tier.highlight
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-border hover:bg-accent text-foreground"
        } disabled:opacity-50`}
      >
        {isActive ? "Current plan" : <>Upgrade <ChevronRight className="h-3 w-3" /></>}
      </button>
    </div>
  );
}

function BusinessCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
      <div className="mb-3">
        <p className="text-sm font-semibold text-muted-foreground">Business</p>
        <p className="text-2xl font-bold mt-1">Custom</p>
        <p className="text-xs text-muted-foreground">contact sales</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Unlimited calls · dedicated nodes · custom SLAs
      </p>
      <a
        href="mailto:sales@getvaultkey.com"
        className="mt-auto w-full rounded-md px-3 py-2 text-xs font-medium border border-border hover:bg-accent text-foreground text-center transition-colors flex items-center justify-center gap-1.5"
      >
        Contact sales <ArrowUpRight className="h-3 w-3" />
      </a>
    </div>
  );
}

function SuccessBanner({ onReset }: { onReset: () => void }) {
  return (
    <div className="max-w-md rounded-xl border border-green-500/30 bg-green-500/5 p-8 text-center">
      <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
      <p className="font-semibold">Subscription activated</p>
      <p className="text-sm text-muted-foreground mt-1">
        Your plan is now active. Credits will appear in your balance shortly.
      </p>
      <button
        onClick={onReset}
        className="mt-4 text-sm flex items-center gap-1.5 mx-auto text-muted-foreground hover:text-foreground transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Refresh billing
      </button>
    </div>
  );
}

function TestnetCreditsInfo() {
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/8 p-6">
        <div className="flex items-start gap-3">
          <FlaskConical className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Testnet credits are free
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your testnet workspace receives a free monthly grant automatically.
              Credits are isolated from mainnet and cannot be transferred.
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
          How testnet credits work
        </p>
        <div className="space-y-3 text-sm text-muted-foreground">
          {[
            "Free credits are granted automatically each month — no action required.",
            "Credits reset at the start of each billing period.",
            "When ready to go live, switch to mainnet and choose a plan.",
          ].map((text, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-mono">
                {i + 1}
              </span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}