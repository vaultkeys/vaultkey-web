"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useOrg } from "@/hooks/useOrg";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { org, orgId, refetch } = useOrg();
  const { cloud } = useApi();

  const [name, setName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (org) {
      setName(org.name);
      setBillingEmail(org.billing_email ?? "");
    }
  }, [org]);

  const saveOrg = async () => {
    if (!orgId || !name.trim()) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.updateOrg(token, orgId, { name: name.trim(), billing_email: billingEmail.trim() });
      await refetch();
      toast.success("Organization updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const deleteOrg = async () => {
    if (!orgId || confirmName !== org?.name) { toast.error("Organization name does not match"); return; }
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.deleteOrg(token, orgId);
      toast.success("Organization deleted");
      window.location.href = "/onboarding";
    } catch (e: any) {
      toast.error(e.message);
      setDeleting(false);
    }
  };

  if (!org) return (
    <div className="p-4 sm:p-8 animate-pulse space-y-4">
      <div className="h-7 w-32 bg-muted rounded" />
      <div className="h-48 bg-muted rounded-xl" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="Manage your organization details" />

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">General</p>
        <div className="space-y-4">
          <Field label="Organization name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={iCls} placeholder="Acme Corp" />
          </Field>
          <Field label="Billing email">
            <input value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className={iCls} placeholder="billing@company.com" type="email" />
          </Field>
          <Field label="Slug">
            <input value={org.slug} disabled className={`${iCls} opacity-50 cursor-not-allowed`} />
            <p className="mt-1 text-xs text-muted-foreground">Slug is generated at creation and cannot be changed.</p>
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={saveOrg} disabled={saving} className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Organization info</p>
        <div className="space-y-3 text-sm">
          <Row label="Org ID" value={org.id} mono />
          <Row label="Project ID" value={org.project_id ?? "—"} mono />
          <Row label="Created by" value={org.created_by} mono />
          <Row label="Created" value={new Date(org.created_at).toLocaleString()} />
        </div>
      </section>

      <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 sm:p-6">
        <p className="text-xs font-mono uppercase tracking-wider text-red-500 mb-2">Danger zone</p>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting the organization is permanent and cannot be undone. All API keys, members, and configuration will be removed.
        </p>
        <Field label={`Type "${org.name}" to confirm`}>
          <input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} className={`${iCls} border-red-500/30 focus:ring-red-500/20`} placeholder={org.name} />
        </Field>
        <div className="mt-4">
          <button
            onClick={deleteOrg}
            disabled={deleting || confirmName !== org.name}
            className="px-4 py-2 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40 transition-colors"
          >
            {deleting ? "Deleting…" : "Delete organization"}
          </button>
        </div>
      </section>
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={mono ? "font-mono text-xs break-all" : ""}>{value}</span>
    </div>
  );
}

const iCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30";