"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Webhook, RefreshCw, Trash2, Play, RotateCcw,
  CheckCircle2, XCircle, AlertTriangle, Info,
  Eye, EyeOff, ChevronDown, ChevronUp, Clock,
  Activity, Zap, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useOrg } from "@/hooks/useOrg";
import { useEnv } from "@/hooks/useEnv";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadMore } from "@/components/shared/LoadMore";
import { formatDate, cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { RotateSecretResponse, TestWebhookResponse, WebhookConfig, WebhookDelivery, WebhookStats } from "@/lib/api";
import { WebhookStatCard } from "@/components/shared/StatCard";
import { usePagedCursor } from "@/hooks/usePagedCursor";
import { Pagination } from "@/components/shared/Pagination";


export default function WebhookPage() {
  const { cloud } = useApi();
  const { getToken } = useAuth();
  const { orgId } = useOrg();
  const { baseUrl: _baseUrl } = useEnv();
  

  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // URL editor state
  const [urlInput, setUrlInput] = useState("");
  const [urlSaving, setUrlSaving] = useState(false);
  const [urlEditing, setUrlEditing] = useState(false);

  // Secret state
  const [newSecret, setNewSecret] = useState<RotateSecretResponse | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [rotating, setRotating] = useState(false);

  // Test state
  const [testResult, setTestResult] = useState<TestWebhookResponse | null>(null);
  const [testing, setTesting] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  const [failedOnly, setFailedOnly] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);

//   const api = makeWebhookApi(_baseUrl);

  const loadConfig = useCallback(async () => {
    if (!orgId || !_baseUrl) return;
    setConfigLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const [cfg, st] = await Promise.all([
        await cloud.getWebhook(token, orgId),
        await cloud.getWebhookStats(token, orgId),
      ]);
      setConfig(cfg);
      setStats(st);
      if (cfg.url) setUrlInput(cfg.url);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setConfigLoading(false);
    }
  }, [orgId, _baseUrl]);

  const deliveryFetcher = useCallback(async (cursor: string | undefined) => {
  const token = await getToken();
  if (!token) return { items: [], next_cursor: null, has_more: false };
    const res = await cloud.listWebhookDeliveries(token, orgId!, cursor, 20, failedOnly);
    return { items: res.deliveries, next_cursor: res.next_cursor, has_more: res.has_more };
  }, [orgId, getToken, cloud, failedOnly]);

  const {
    items: deliveries,
    currentPage: deliveriesPage,
    totalKnownPages: deliveriesTotalPages,
    hasMore: deliveriesMore,
    loading: deliveriesLoading,
    goToPage: goToDeliveryPage,
    loadFirst: loadDeliveriesFirst,
    reset: resetDeliveries,
  } = usePagedCursor<WebhookDelivery>({ fetcher: deliveryFetcher });

  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => {
    if (!orgId || !_baseUrl) return;
    resetDeliveries();
    loadDeliveriesFirst().catch((e) => toast.error(e.message));
  }, [orgId, failedOnly, _baseUrl]);

  const saveUrl = async () => {
    if (!orgId) return;
    if (urlInput && !isValidUrl(urlInput)) {
      toast.error("Please enter a valid HTTPS URL");
      return;
    }
    setUrlSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.updateWebhook(token, orgId, urlInput);
      setConfig((p) => p ? { ...p, url: urlInput || null } : { url: urlInput || null, has_secret: false });
      setUrlEditing(false);
      toast.success(urlInput ? "Webhook URL updated" : "Webhook URL cleared");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUrlSaving(false);
    }
  };

  const deleteWebhook = async () => {
    if (!orgId || !confirm("Remove the webhook configuration? This clears the URL and signing secret.")) return;
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await cloud.deleteWebhook(token, orgId);
      setConfig({ url: null, has_secret: false });
      setUrlInput("");
      setNewSecret(null);
      toast.success("Webhook removed");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const rotateSecret = async () => {
    if (!orgId) return;
    if (!confirm("Rotate the signing secret? Your previous secret will remain valid for 1 hour.")) return;
    setRotating(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await cloud.rotateWebhookSecret(token, orgId);
      setNewSecret(res);
      setShowSecret(true);
      setConfig((p) => p ? { ...p, has_secret: true } : null);
      toast.success("Secret rotated — save it now, it won't be shown again");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRotating(false);
    }
  };

  const testWebhook = async () => {
    if (!orgId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await cloud.testWebhook(token, orgId);
      setTestResult(res);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  };

  if (configLoading) return <WebhookSkeleton />;

  const hasUrl = !!(config?.url);

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <PageHeader
        title="Webhooks"
        description="Receive real-time notifications when jobs complete, fail, or change state."
      />

      {/* ── Stats bar ── */}
      {stats && hasUrl && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <WebhookStatCard label="Deliveries (24h)" value={stats.last_24h.total} icon={<Activity className="h-3.5 w-3.5" />} />
          <WebhookStatCard label="Success rate" value={`${(stats.last_24h.success_rate * 100).toFixed(0)}%`} icon={<CheckCircle2 className="h-3.5 w-3.5" />} color={stats.last_24h.success_rate >= 0.95 ? "green" : stats.last_24h.success_rate >= 0.7 ? "yellow" : "red"} />
          <WebhookStatCard label="Failures (24h)" value={stats.last_24h.failed} icon={<XCircle className="h-3.5 w-3.5" />} color={stats.last_24h.failed > 0 ? "red" : undefined} />
          <WebhookStatCard label="Avg latency" value={`${stats.last_24h.avg_latency_ms}ms`} icon={<Zap className="h-3.5 w-3.5" />} />
        </div>
      )}

      {/* ── Configuration card ── */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Endpoint</p>
          {hasUrl && (
            <button
              onClick={deleteWebhook}
              disabled={deleting}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Removing…" : "Remove"}
            </button>
          )}
        </div>

        {/* URL field */}
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Webhook URL</label>
          {urlEditing || !hasUrl ? (
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveUrl()}
                placeholder="https://yourapp.com/webhooks/vaultkey"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 font-mono"
                autoFocus={urlEditing}
              />
              <button
                onClick={saveUrl}
                disabled={urlSaving}
                className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
              >
                {urlSaving ? "Saving…" : "Save"}
              </button>
              {urlEditing && (
                <button
                  onClick={() => { setUrlEditing(false); setUrlInput(config?.url ?? ""); }}
                  className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors shrink-0"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 min-w-0">
                <span className="font-mono text-sm truncate">{config?.url}</span>
                <a href={config?.url ?? "#"} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <button
                onClick={() => setUrlEditing(true)}
                className="px-3 py-2 rounded-md text-sm border border-border hover:bg-accent transition-colors shrink-0"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Actions row */}
        {hasUrl && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testWebhook}
              disabled={testing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-border hover:bg-accent transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              {testing ? "Sending…" : "Send test"}
            </button>
            <button
              onClick={rotateSecret}
              disabled={rotating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-border hover:bg-accent transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {rotating ? "Rotating…" : config?.has_secret ? "Rotate secret" : "Add signing secret"}
            </button>
          </div>
        )}

        {/* No URL state */}
        {!hasUrl && !urlEditing && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-500/25 bg-blue-500/8 px-4 py-3">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Enter an HTTPS URL above to start receiving webhook events. VaultKey will POST a JSON payload whenever a job completes or fails.
            </p>
          </div>
        )}
      </section>

      {/* ── Test result ── */}
      {testResult && (
        <div className={cn(
          "mb-6 rounded-xl border p-4",
          testResult.success
            ? "border-green-500/30 bg-green-500/5"
            : "border-red-500/30 bg-red-500/5",
        )}>
          <div className="flex items-center gap-2 mb-3">
            {testResult.success
              ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
            <p className={cn("text-sm font-medium", testResult.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
              Test {testResult.success ? "succeeded" : "failed"}
            </p>
            <span className="ml-auto text-xs text-muted-foreground font-mono">{testResult.latency_ms}ms</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            {testResult.response_status != null && (
              <div className="flex gap-2"><span className="text-muted-foreground w-20 shrink-0">HTTP</span><span>{testResult.response_status}</span></div>
            )}
            {testResult.error && (
              <div className="flex gap-2"><span className="text-muted-foreground w-20 shrink-0">Error</span><span className="text-red-500">{testResult.error}</span></div>
            )}
            {testResult.response_body && (
              <div>
                <span className="text-muted-foreground">Body</span>
                <pre className="mt-1 p-2 rounded bg-muted/40 text-xs overflow-x-auto whitespace-pre-wrap break-all">{testResult.response_body.slice(0, 500)}{testResult.response_body.length > 500 ? "…" : ""}</pre>
              </div>
            )}
          </div>
          <button onClick={() => setTestResult(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">Dismiss</button>
        </div>
      )}

      {/* ── New secret banner ── */}
      {newSecret && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                Save your signing secret — it won't be shown again
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Your previous secret remains valid until <span className="font-mono">{new Date(newSecret.previous_expires_at).toLocaleTimeString()}</span>.
              </p>
              <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                <code className="flex-1 font-mono text-xs break-all min-w-0">
                  {showSecret ? newSecret.secret : newSecret.secret.slice(0, 14) + "•".repeat(20)}
                </code>
                <button onClick={() => setShowSecret((p) => !p)} className="p-1 text-muted-foreground hover:text-foreground shrink-0">
                  {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(newSecret.secret); toast.success("Copied!"); }}
                  className="text-xs px-2 py-0.5 rounded border border-border hover:bg-accent transition-colors shrink-0"
                >
                  Copy
                </button>
              </div>
              <button onClick={() => setNewSecret(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
                I've saved it, dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Signing secret status ── */}
      {hasUrl && !newSecret && (
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Signing secret</p>
          {config?.has_secret ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-sm text-muted-foreground">A signing secret is configured. VaultKey will sign all payloads with HMAC-SHA256.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">No signing secret set. Anyone could forge payloads to your endpoint.</p>
                <button onClick={rotateSecret} disabled={rotating} className="mt-1 text-xs text-primary underline hover:no-underline">
                  Add a signing secret →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Delivery log ── */}
      {hasUrl && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Delivery log</p>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={failedOnly}
                  onChange={(e) => setFailedOnly(e.target.checked)}
                  className="rounded border-border"
                />
                Failed only
              </label>
              <button
                onClick={() => { resetDeliveries(); loadDeliveriesFirst().catch((e) => toast.error(e.message)); }}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {deliveriesLoading ? (
            <DeliveriesSkeleton />
          ) : deliveries.length === 0 ? (
            <EmptyState
              icon={<Webhook className="h-10 w-10" />}
              title={failedOnly ? "No failed deliveries" : "No deliveries yet"}
              description={failedOnly ? "All recent deliveries succeeded." : "Deliveries will appear here once events are triggered."}
            />
          ) : (
            <>
              <div className="rounded-xl border border-border overflow-hidden">
                {deliveries.map((d, i) => (
                  <DeliveryRow
                    key={d.id}
                    delivery={d}
                    expanded={expandedDelivery === d.id}
                    onToggle={() => setExpandedDelivery((p) => p === d.id ? null : d.id)}
                    isLast={i === deliveries.length - 1}
                  />
                ))}
              </div>
              <Pagination 
                currentPage={deliveriesPage} 
                totalKnownPages={deliveriesTotalPages} 
                hasMore={deliveriesMore} 
                loading={deliveriesLoading} 
                onPage={(p) => { setExpandedDelivery(null); goToDeliveryPage(p); }}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}

function DeliveryRow({ delivery: d, expanded, onToggle, isLast }: {
  delivery: WebhookDelivery;
  expanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <div className={cn("border-b border-border", isLast && "border-0")}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
      >
        {d.success
          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {d.event_type && (
              <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">{d.event_type}</span>
            )}
            {d.response_status > 0 && (
              <span className={cn("text-xs font-mono", d.response_status < 300 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                {d.response_status}
              </span>
            )}
            {d.error && <span className="text-xs text-red-500 truncate max-w-xs">{d.error}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground font-mono">{d.latency_ms}ms</span>
          <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(d.created_at)}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-2 bg-muted/10 border-t border-border">
          <div className="pt-2 flex gap-4 text-xs text-muted-foreground sm:hidden">
            <span><Clock className="h-3 w-3 inline mr-1" />{formatDate(d.created_at)}</span>
          </div>
          {d.error && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Error</p>
              <p className="text-xs text-red-500 font-mono">{d.error}</p>
            </div>
          )}
          {d.response_body && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Response body</p>
              <pre className="text-xs font-mono p-2 rounded bg-muted/40 overflow-x-auto whitespace-pre-wrap break-all max-h-40">
                {d.response_body.slice(0, 1000)}{d.response_body.length > 1000 ? "\n…truncated" : ""}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WebhookSkeleton() {
  return (
    <div className="p-4 sm:p-8 max-w-3xl animate-pulse space-y-6">
      <div className="h-7 w-32 bg-muted rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
      </div>
      <div className="h-48 bg-muted rounded-xl" />
    </div>
  );
}

function DeliveriesSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 border-b border-border last:border-0 bg-muted/10" />
      ))}
    </div>
  );
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:"; // allow http for local dev
  } catch {
    return false;
  }
}