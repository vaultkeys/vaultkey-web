"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Building2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { makeCloud } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { useEnv } from "@/hooks/useEnv";
import { cn } from "@/lib/utils";
import React from "react";

const STEPS = ["Organization", "Review"] as const;

export default function OnboardingPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { refetch } = useOrg();
  const { isTestnet, baseUrl, env } = useEnv();

  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const next = () => {
    if (step === 0) {
      if (!orgName.trim()) { toast.error("Organization name is required"); return; }
      setStep(1);
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const api = makeCloud(baseUrl);
      await api.onboard(token, { org_name: orgName.trim(), billing_email: billingEmail.trim() });
      await refetch();
      toast.success(
        isTestnet
          ? "Testnet workspace created — you're ready to experiment"
          : "Organization created — welcome to VaultKey",
      );
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center",
            isTestnet ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-primary",
          )}>
            <span className={cn(
              "font-bold text-sm font-mono",
              isTestnet ? "text-yellow-600 dark:text-yellow-400" : "text-primary-foreground",
            )}>VK</span>
          </div>
          <span className="font-semibold text-lg">VaultKey</span>
        </div>

        {/* Testnet callout */}
        {isTestnet && (
          <div className="mb-5 rounded-lg border border-yellow-500/25 bg-yellow-500/8 px-4 py-3 flex items-start gap-2.5">
            <FlaskConical className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Setting up your testnet workspace</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This org is isolated from mainnet — separate API keys, wallets, and credits. Free grants only, no billing.
              </p>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors",
                i === step
                  ? isTestnet
                    ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30"
                    : "bg-primary text-primary-foreground"
                  : i < step
                  ? isTestnet
                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                    : "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={cn(
                "text-xs",
                i === step ? "text-foreground font-medium" : "text-muted-foreground",
              )}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className={cn(
          "rounded-2xl border-2 bg-card p-7 shadow-xl",
          isTestnet ? "border-yellow-500/20" : "border-border",
        )}>
          {step === 0 && (
            <>
              <div className="mb-5">
                <Building2 className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <h1 className="text-lg font-semibold">
                  {isTestnet ? "Set up your testnet workspace" : "Set up your organization"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isTestnet
                    ? "Your testnet workspace is a sandbox — experiment freely without affecting mainnet."
                    : "This is the billing and access boundary for your team. You can rename it later."}
                </p>
              </div>
              <div className="space-y-4">
                <Field label="Organization name *">
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder={isTestnet ? "Acme Corp (testnet)" : "Acme Corp"}
                    className={iCls}
                    autoFocus
                  />
                </Field>
                {!isTestnet && (
                  <Field label="Billing email">
                    <input
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="billing@acme.com"
                      className={iCls}
                      type="email"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Used for payment receipts. Defaults to your account email.</p>
                  </Field>
                )}
              </div>
              <button
                onClick={next}
                className={cn(
                  "mt-6 w-full flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                  isTestnet
                    ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25 border border-yellow-500/25"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="mb-5">
                <h1 className="text-lg font-semibold">Review & create</h1>
                <p className="text-sm text-muted-foreground mt-1">Confirm your details before we create the workspace.</p>
              </div>
              <div className="rounded-lg border border-border divide-y divide-border mb-6">
                <ReviewRow label="Name" value={orgName} />
                {!isTestnet && (
                  <ReviewRow label="Billing email" value={billingEmail || "Same as account email"} />
                )}
                <ReviewRow label="Environment" value={isTestnet ? "Testnet (sandbox)" : "Mainnet"} />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={submit}
                  disabled={loading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors",
                    isTestnet
                      ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25 border border-yellow-500/25"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                    : <>Create {isTestnet ? "testnet workspace" : "organization"} <ArrowRight className="h-4 w-4" /></>
                  }
                </button>
              </div>
            </>
          )}
        </div>

        {env === "testnet" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Want to set up mainnet?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); /* EnvSwitcher handles this */ }} className="underline hover:text-foreground">
              Switch to mainnet
            </a>{" "}
            in the sidebar.
          </p>
        )}
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

const iCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30";