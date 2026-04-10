"use client";

import React from "react";

type BillingCycle = "monthly" | "yearly" | "biennial";

const BILLING_OPTIONS: {
  key: BillingCycle;
  label: string;
  badge?: string;
  multiplier: number;
}[] = [
  { key: "monthly", label: "Monthly", multiplier: 1 },
  { key: "yearly", label: "Yearly", badge: "Save 40%", multiplier: 0.6 },
  { key: "biennial", label: "2 Years", badge: "Save 50%", multiplier: 0.5 },
];

interface Tier {
  name: string;
  creditsLabel: string;
  monthlyBase: number | null;
  nextTier: string | null;
}

const TIERS: Tier[] = [
  { name: "Free",     creditsLabel: "100,000 lifetime credits", monthlyBase: 0,    nextTier: "Starter"    },
  { name: "Starter",  creditsLabel: "4,000,000 credits / mo",   monthlyBase: 49,   nextTier: "Starter 7M" },
  { name: "Starter",  creditsLabel: "7,000,000 credits / mo",   monthlyBase: 79,   nextTier: "Pro"        },
  { name: "Pro",      creditsLabel: "10,000,000 credits / mo",  monthlyBase: 99,   nextTier: "Pro 15M"    },
  { name: "Pro",      creditsLabel: "15,000,000 credits / mo",  monthlyBase: 139,  nextTier: "Pro 20M"    },
  { name: "Pro",      creditsLabel: "20,000,000 credits / mo",  monthlyBase: 179,  nextTier: "Scale"      },
  { name: "Scale",    creditsLabel: "40,000,000 credits / mo",  monthlyBase: 349,  nextTier: "Scale 80M"  },
  { name: "Scale",    creditsLabel: "80,000,000 credits / mo",  monthlyBase: 649,  nextTier: "Business"   },
  { name: "Business", creditsLabel: "Custom",                   monthlyBase: null, nextTier: null         },
];

const TIER_LABELS = ["Free", "4M", "7M", "10M", "15M", "20M", "40M", "80M", "Custom"];

const PAID_FEATURES = [
  "200 req/sec · 200,000 subscriptions",
  "7-day notification history",
  "Advanced analytics · team features",
  "Archive nodes · helpdesk priority",
];

const FREE_FEATURES = [
  "3 req/sec · 5 subscriptions",
  "1-day notification history · full nodes",
  "Debugging tools · community support",
  "100,000 lifetime credits (no monthly refresh)",
];

const LAST_IDX = TIERS.length - 1;

export function PricingCalculator() {
  const [tierIndex, setTierIndex] = React.useState(1);
  const [billing, setBilling] = React.useState<BillingCycle>("monthly");

  const tier = TIERS[tierIndex];
  const billingOpt = BILLING_OPTIONS.find((o) => o.key === billing)!;

  const isCustom = tier?.monthlyBase === null;
  const isFree = tier?.monthlyBase === 0;

  const discountedPrice =
    tier?.monthlyBase != null && tier?.monthlyBase > 0
      ? Math.round(tier?.monthlyBase * billingOpt.multiplier)
      : tier?.monthlyBase;

  const showOriginal = billing !== "monthly" && !isFree && !isCustom;

  const periodLabel: Record<BillingCycle, string> = {
    monthly: "/mo",
    yearly: "/mo, billed yearly",
    biennial: "/mo, billed 2-yr",
  };

  // Thumb tooltip position — exact per-step percentage
  const thumbPercent = (tierIndex / LAST_IDX) * 100;

  return (
    <div className="rounded-[18px] bg-primary/20 p-1">
      <div className="rounded-[14px] bg-primary/20 p-0.5 shadow-sm">
        <div className="bg-background rounded-xl p-5 pb-10">
          <div className="flex flex-col gap-6">

            {/* header */}
            <div className="text-center">
              <div className="text-sm uppercase tracking-wider text-primary">
                Pricing Calculator
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Slide to pick your usage tier and billing cycle.
              </p>
            </div>

            {/* billing tabs */}
            <div className="flex gap-2 flex-wrap">
              {BILLING_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setBilling(opt.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                    billing === opt.key
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {opt.label}
                  {opt.badge && (
                    <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                      {opt.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* slider */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <label className="font-medium">Credits / month</label>
                <span className="text-primary font-mono text-sm">
                  {TIER_LABELS[tierIndex]}
                </span>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={LAST_IDX}
                  step={1}
                  value={tierIndex}
                  onChange={(e) => setTierIndex(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Credits per month"
                />
                {/* tooltip pinned exactly to thumb */}
                <div
                  className="pointer-events-none absolute -top-8 -translate-x-1/2"
                  style={{ left: `${thumbPercent}%` }}
                >
                  <div className="rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background tabular-nums shadow whitespace-nowrap font-mono">
                    {TIER_LABELS[tierIndex]}
                  </div>
                </div>
              </div>

              {/* tick marks — evenly spaced, aligned to slider stops */}
              <div className="relative h-4">
                {TIER_LABELS.map((label, i) => {
                  const pct = (i / LAST_IDX) * 100;
                  return (
                    <button
                      key={label}
                      onClick={() => setTierIndex(i)}
                      className="absolute -translate-x-1/2 text-[10px] text-muted-foreground hover:text-primary transition-colors tabular-nums"
                      style={{ left: `${pct}%` }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* result */}
            {isCustom ? (
              <div className="rounded-lg border border-primary/30 p-4 text-center">
                <div className="text-xs text-muted-foreground">
                  Your usage exceeds 80M credits / mo
                </div>
                <div className="mt-1 text-sm font-medium text-primary">
                  Business — Custom pricing
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Contact sales for dedicated nodes, SLAs, and custom rate limits.
                </div>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="rounded-lg border border-primary/30 p-4 sm:col-span-2">
                  <div className="text-xs text-muted-foreground">Plan</div>
                  <div className="text-lg font-medium">{tier?.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {tier?.creditsLabel}
                  </div>
                  {tier?.nextTier && !isFree && (
                    <div className="mt-2 text-xs text-muted-foreground border-t border-primary/20 pt-2">
                      Auto-upgrades to{" "}
                      <span className="text-primary">{tier?.nextTier}</span> if
                      credits run out mid-cycle.
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-primary/30 p-4 bg-primary/10">
                  <div className="text-xs text-muted-foreground">
                    {isFree ? "Price" : "Estimated total"}
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div className="text-3xl text-primary font-semibold font-mono">
                      {isFree ? "$0" : `$${discountedPrice}`}
                    </div>
                    {showOriginal && (
                      <div className="text-sm text-muted-foreground line-through font-mono">
                        ${tier?.monthlyBase}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isFree ? "forever" : periodLabel[billing]}
                  </div>
                </div>
              </div>
            )}

            {/* features */}
            {!isCustom && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {(isFree ? FREE_FEATURES : PAID_FEATURES).map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingCalculator;