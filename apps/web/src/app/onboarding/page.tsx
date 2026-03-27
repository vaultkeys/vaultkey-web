"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import { cloud } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";

const STEPS = ["Organization", "Review"] as const;

export default function OnboardingPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { refetch } = useOrg();

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
      await cloud.onboard(token, { org_name: orgName.trim(), billing_email: billingEmail.trim() });
      await refetch();
      toast.success("Organization created — welcome to VaultKey");
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
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm font-mono">VK</span>
          </div>
          <span className="font-semibold text-lg">VaultKey</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border-2 border-border bg-card p-7 shadow-xl">
          {step === 0 && (
            <>
              <div className="mb-5">
                <Building2 className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <h1 className="text-lg font-semibold">Set up your organization</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  This is the billing and access boundary for your team. You can rename it later.
                </p>
              </div>
              <div className="space-y-4">
                <Field label="Organization name *">
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="Acme Corp"
                    className={iCls}
                    autoFocus
                  />
                </Field>
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
              </div>
              <button
                onClick={next}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="mb-5">
                <h1 className="text-lg font-semibold">Review & create</h1>
                <p className="text-sm text-muted-foreground mt-1">Confirm your details before we create the organization.</p>
              </div>
              <div className="rounded-lg border border-border divide-y divide-border mb-6">
                <ReviewRow label="Organization name" value={orgName} />
                <ReviewRow label="Billing email" value={billingEmail || "Same as account email"} />
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
                  className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                    : <>Create organization <ArrowRight className="h-4 w-4" /></>
                  }
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an org?{" "}
          <a href="/dashboard" className="underline hover:text-foreground">Go to dashboard</a>
        </p>
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
