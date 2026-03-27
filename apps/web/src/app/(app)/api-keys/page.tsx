"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, KeyRound, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cloud, type ApiKey, type ApiKeyCreated } from "@/lib/api";
import { useOrg } from "@/hooks/useOrg";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CopyButton } from "@/components/shared/CopyButton";
import { formatDate } from "@/lib/utils";

export default function ApiKeysPage() {
  const { getToken } = useAuth();
  const { orgId } = useOrg();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [justCreated, setJustCreated] = useState<ApiKeyCreated | null>(null);

  const load = async () => {
    if (!orgId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const { api_keys } = await cloud.listApiKeys(token, orgId);
      setKeys(api_keys);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [orgId]);

  const revoke = async (keyId: string, keyName: string) => {
    if (!confirm(`Revoke "${keyName}"? This cannot be undone.`)) return;
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.revokeApiKey(token, orgId!, keyId);
      setKeys((p) => p.filter((k) => k.id !== keyId));
      toast.success("API key revoked");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="API Keys"
        description="Project keys authenticate SDK requests. The secret is shown once only."
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New key
          </button>
        }
      />

      {/* One-time secret display */}
      {justCreated && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Save your API secret now — it won't be shown again</p>
              <div className="mt-3 space-y-2">
                <SecretRow label="Key" value={justCreated.key} />
                <SecretRow label="Secret" value={justCreated.secret} />
              </div>
              <button onClick={() => setJustCreated(null)} className="mt-3 text-xs text-muted-foreground hover:text-foreground underline">
                I've saved it, dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <KeysSkeleton />
      ) : keys.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="h-10 w-10" />}
          title="No API keys yet"
          description="Create an API key to authenticate SDK calls from your backend."
          action={
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Create first key
            </button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Name", "Key prefix", "Last used", "Created", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{k.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-muted-foreground">{k.key.slice(0, 20)}…</span>
                      <CopyButton value={k.key} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{k.last_used_at ? formatDate(k.last_used_at) : "Never"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(k.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => revoke(k.id, k.name)}
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
      )}

      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(k) => { setJustCreated(k); setKeys((p) => [k, ...p]); setShowCreate(false); }}
          orgId={orgId!}
        />
      )}
    </div>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-10">{label}</span>
      <code className="flex-1 font-mono text-xs bg-muted/50 px-2 py-1 rounded break-all">
        {show ? value : value.slice(0, 12) + "•".repeat(20)}
      </code>
      <button onClick={() => setShow((p) => !p)} className="p-1 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <CopyButton value={value} />
    </div>
  );
}

function CreateKeyModal({ onClose, onCreated, orgId }: { onClose: () => void; onCreated: (k: ApiKeyCreated) => void; orgId: string }) {
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const key = await cloud.createApiKey(token, orgId, name || `Key ${new Date().toLocaleDateString()}`);
      toast.success("API key created");
      onCreated(key);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border-2 border-border bg-popover p-6 shadow-xl">
        <h2 className="font-semibold text-base mb-4">New API key</h2>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Name (optional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`Key ${new Date().toLocaleDateString()}`}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 mb-5"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading ? "Creating…" : "Create key"}
          </button>
        </div>
      </div>
    </div>
  );
}

function KeysSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="h-10 bg-muted/30" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-12 border-t border-border bg-muted/10" />)}
    </div>
  );
}
