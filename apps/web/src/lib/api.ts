export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function req<T>(
  baseUrl: string,
  path: string,
  opts: RequestInit & { token?: string; apiKey?: string; apiSecret?: string } = {},
): Promise<T> {
  const { token, apiKey, apiSecret, ...init } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (apiKey) headers["X-API-Key"] = apiKey;
  if (apiSecret) headers["X-API-Secret"] = apiSecret;

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const b = await res.json();
      msg = b.error ?? msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function buildQS(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "" && v !== null,
  ) as [string, string | number][];
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Org { id: string; name: string; slug: string; billing_email: string; created_at: string; }
export interface OrgDetail extends Org { created_by: string; updated_at: string; project_id?: string; }
export interface OnboardingResponse { org_id: string; org_name: string; org_slug: string; project_id: string; created_at: string; }
export interface Member { id: string; clerk_user_id: string; role: string; email: string; first_name: string; last_name: string; joined_at: string; }
export interface Invite { id: string; org_id: string; email: string; token: string; role: string; created_by: string; expires_at: string; created_at: string; accepted_at?: string; }
export interface ApiKey { id: string; name: string; key: string; active: boolean; last_used_at?: string; created_at: string; }
export interface ApiKeyCreated { id: string; name: string; key: string; secret: string; active: boolean; last_used_at?: string; created_at: string; }
export interface Wallet { id: string; user_id: string; chain_type: string; address: string; label?: string; created_at: string; }
export interface PaymentIntentRes { client_secret: string; payment_intent_id: string; base_credits: number; bonus_credits: number; total_credits: number; amount_cents: number; currency: string; }
export interface StripePayment { id: string; amount_cents: number; currency: string; status: string; created_at: string; total_credits: number; }
export interface BillingHistory { payments: StripePayment[]; }
export interface OperationStat { operation: string; count: number; credits_consumed: number; }
export interface DailyUsage { date: string; operation: string; count: number; credits_consumed: number; }
export interface UsageStats { org_id: string; period: { start: string; end: string }; total_credits_consumed: number; total_operations: number; current_balance: number; by_operation: OperationStat[]; daily?: DailyUsage[]; }
export interface JobStatus { id: string; status: string; result?: unknown; error?: string; created_at: string; updated_at: string; }

export interface Relayer {
  id: string;
  wallet_id: string;
  address: string;
  chain_type: string;
  chain_id?: string;
  min_balance_alert: string;
  active: boolean;
}
export interface RelayerInfo {
  wallet_id: string;
  address: string;
  chain_type: string;
  chain_id?: string;
  balance: string;
  unit: string;
  healthy: boolean;
}

export interface MasterWallet {
  id: string;
  chain_type: string;
  chain_id?: string;
  master_wallet_id: string;
  master_address: string;
  dust_threshold: string;
  enabled: boolean;
}



export interface WebhookConfig {
  url: string | null;
  has_secret: boolean;
}

export interface RotateSecretResponse {
  secret: string;
  previous_expires_at: string;
}

export interface TestWebhookResponse {
  success: boolean;
  response_status?: number;
  response_body?: string;
  latency_ms: number;
  error?: string;
}

export interface WebhookDelivery {
  id: string;
  org_id?: string;
  success: boolean;
  response_status: number;
  response_body: string;
  latency_ms: number;
  error: string;
  created_at: string;
  event_type?: string;
}

export interface WebhookStats {
  last_24h: {
    total: number;
    succeeded: number;
    failed: number;
    success_rate: number;
    avg_latency_ms: number;
  };
}

export interface Chain {
  name: string;
  chain_id: string;
  testnet: boolean;
  native_symbol: string;
  legacy_symbol?: string;
}

// ── Paginated response wrapper ────────────────────────────────────────────────

export type Paginated<K extends string, T> = {
  next_cursor: string | null;
  has_more: boolean;
} & Record<K, T[]>;

// ── Cloud endpoints (Clerk JWT bearer) ────────────────────────────────────────

export function makeCloud(baseUrl: string) {
  return {
    onboard: (token: string, body: { org_name: string; billing_email: string }) =>
      req<OnboardingResponse>(baseUrl, "/cloud/onboarding", { method: "POST", body: JSON.stringify(body), token }),

    listOrgs: (token: string) =>
      req<{ organizations: Org[] }>(baseUrl, "/cloud/organizations", { token }),

    getOrg: (token: string, orgId: string) =>
      req<OrgDetail>(baseUrl, `/cloud/organizations/${orgId}`, { token }),

    updateOrg: (token: string, orgId: string, body: { name: string; billing_email: string }) =>
      req<OrgDetail>(baseUrl, `/cloud/organizations/${orgId}`, { method: "PATCH", body: JSON.stringify(body), token }),

    deleteOrg: (token: string, orgId: string) =>
      req<void>(baseUrl, `/cloud/organizations/${orgId}`, { method: "DELETE", token }),

    listMembers: (token: string, orgId: string, after?: string, limit?: number) =>
      req<Paginated<"members", Member>>(baseUrl, `/cloud/organizations/${orgId}/members${buildQS({ after, limit })}`, { token }),

    updateMember: (token: string, orgId: string, clerkUserId: string, role: string) =>
      req<Member>(baseUrl, `/cloud/organizations/${orgId}/members/${clerkUserId}`, { method: "PATCH", body: JSON.stringify({ role }), token }),

    removeMember: (token: string, orgId: string, clerkUserId: string) =>
      req<void>(baseUrl, `/cloud/organizations/${orgId}/members/${clerkUserId}`, { method: "DELETE", token }),

    createInvite: (token: string, orgId: string, body: { email: string; role: string }) =>
      req<Invite>(baseUrl, `/cloud/organizations/${orgId}/invites`, { method: "POST", body: JSON.stringify(body), token }),

    listInvites: (token: string, orgId: string, after?: string, limit?: number) =>
      req<Paginated<"invites", Invite>>(baseUrl, `/cloud/organizations/${orgId}/invites${buildQS({ after, limit })}`, { token }),

    revokeInvite: (token: string, orgId: string, inviteToken: string) =>
      req<void>(baseUrl, `/cloud/organizations/${orgId}/invites/${inviteToken}`, { method: "DELETE", token }),

    acceptInvite: (token: string, inviteToken: string) =>
      req<{ status: string; org_id: string; role: string }>(baseUrl, `/cloud/invites/${inviteToken}/accept`, { method: "POST", token }),

    createApiKey: (token: string, orgId: string, name: string) =>
      req<ApiKeyCreated>(baseUrl, `/cloud/organizations/${orgId}/api-keys`, { method: "POST", body: JSON.stringify({ name }), token }),

    listApiKeys: (token: string, orgId: string, after?: string, limit?: number) =>
      req<Paginated<"api_keys", ApiKey>>(baseUrl, `/cloud/organizations/${orgId}/api-keys${buildQS({ after, limit })}`, { token }),

    revokeApiKey: (token: string, orgId: string, keyId: string) =>
      req<void>(baseUrl, `/cloud/organizations/${orgId}/api-keys/${keyId}`, { method: "DELETE", token }),

    createPaymentIntent: (token: string, body: { amount_cents: number; currency: string }) =>
      req<PaymentIntentRes>(baseUrl, "/cloud/billing/purchase", { method: "POST", body: JSON.stringify(body), token }),

    getBillingHistory: (token: string, orgId: string) =>
      req<BillingHistory>(baseUrl, `/cloud/organizations/${orgId}/billing/history`, { token }),

    getUsage: (token: string, orgId: string, params?: { start?: string; end?: string; breakdown?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return req<UsageStats>(baseUrl, `/cloud/organizations/${orgId}/usage${qs ? `?${qs}` : ""}`, { token });
    },

    getCredits: (token: string, orgId: string) =>
      req<{ org_id: string; balance: number }>(baseUrl, `/cloud/organizations/${orgId}/credits`, { token }),

    registerRelayer: (
      token: string,
      orgId: string,
      body: { chain_type: "evm" | "solana"; chain_id?: string; min_balance_alert?: string },
    ) =>
      req<Relayer>(baseUrl, `/cloud/organizations/${orgId}/relayer`, { method: "POST", body: JSON.stringify(body), token }),

    getRelayer: (token: string, orgId: string, params: { chain_type: string; chain_id?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return req<RelayerInfo>(baseUrl, `/cloud/organizations/${orgId}/relayer?${qs}`, { token });
    },

    listRelayers: (token: string, orgId: string, after?: string, limit?: number) =>
      req<Paginated<"relayers", Relayer>>(baseUrl, `/cloud/organizations/${orgId}/relayers${buildQS({ after, limit })}`, { token }),

    deactivateRelayer: (token: string, orgId: string, relayerId: string) =>
      req<void>(baseUrl, `/cloud/organizations/${orgId}/relayer/${relayerId}`, { method: "DELETE", token }),

    provisionMasterWallet: (
      token: string,
      orgId: string,
      body: { chain_type: "evm" | "solana"; chain_id?: string; dust_threshold?: string },
    ) =>
      req<MasterWallet>(baseUrl, `/cloud/organizations/${orgId}/master-wallet`, { method: "POST", body: JSON.stringify(body), token }),

    getMasterWallet: (token: string, orgId: string, params: { chain_type: string; chain_id?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return req<MasterWallet>(baseUrl, `/cloud/organizations/${orgId}/master-wallet?${qs}`, { token });
    },

    listMasterWallets: (token: string, orgId: string) =>
      req<{ master_wallets: MasterWallet[] }>(baseUrl, `/cloud/organizations/${orgId}/master-wallets`, { token }),

    updateMasterWallet: (
      token: string,
      orgId: string,
      configId: string,
      body: { dust_threshold?: string; enabled?: boolean },
    ) =>
      req<void>(baseUrl, `/cloud/organizations/${orgId}/master-wallet/${configId}`, { method: "PATCH", body: JSON.stringify(body), token }),

    // ── Webhook ────────────────────────────────────────────────────────────────
    getWebhook: (token: string, orgId: string) =>
      req<WebhookConfig>(baseUrl, `/cloud/organizations/${orgId}/webhook`, { token }),

    updateWebhook: (token: string, orgId: string, url: string) =>
      req<{ status: string }>(baseUrl, `/cloud/organizations/${orgId}/webhook`, {
        method: "PUT", body: JSON.stringify({ url }), token,
      }),

    deleteWebhook: (token: string, orgId: string) =>
      req<{ status: string }>(baseUrl, `/cloud/organizations/${orgId}/webhook`, {
        method: "DELETE", token,
      }),

    testWebhook: (token: string, orgId: string) =>
      req<TestWebhookResponse>(baseUrl, `/cloud/organizations/${orgId}/webhook/test`, {
        method: "POST", token,
      }),

    rotateWebhookSecret: (token: string, orgId: string) =>
      req<RotateSecretResponse>(baseUrl, `/cloud/organizations/${orgId}/webhook/secret/rotate`, {
        method: "POST", token,
      }),

    listWebhookDeliveries: (token: string, orgId: string, after?: string, limit = 20, failed?: boolean) => {
      const qs = new URLSearchParams();
      if (after) qs.set("after", after);
      qs.set("limit", String(limit));
      if (failed) qs.set("failed", "true");
      return req<Paginated<"deliveries", WebhookDelivery>>(
        baseUrl, `/cloud/organizations/${orgId}/webhook/deliveries?${qs}`, { token },
      );
    },

    getWebhookStats: (token: string, orgId: string) =>
      req<WebhookStats>(baseUrl, `/cloud/organizations/${orgId}/webhook/stats`, { token }),

    getChains: (token: string) =>
    req<{ chains: Chain[]; environment: string }>(baseUrl, "/cloud/chains", { token }),
  };
}

// ── SDK endpoints (project API key) ──────────────────────────────────────────

export function makeSDK(baseUrl: string) {
  type Creds = { apiKey: string; apiSecret: string };

  return {
    createWallet: (creds: Creds, body: { user_id: string; chain_type: "evm" | "solana"; label?: string }) =>
      req<Wallet>(baseUrl, "/sdk/wallets", { method: "POST", body: JSON.stringify(body), ...creds }),

    getWallet: (creds: Creds, walletId: string) =>
      req<Wallet>(baseUrl, `/sdk/wallets/${walletId}`, { ...creds }),

    listUserWallets: (creds: Creds, userId: string, after?: string, limit?: number) =>
      req<Paginated<"wallets", Wallet>>(baseUrl, `/sdk/users/${userId}/wallets${buildQS({ after, limit })}`, { ...creds }),

    getBalance: (creds: Creds, walletId: string, chainId?: string) => {
      const qs = chainId ? `?chain_id=${chainId}` : "";
      return req<{ address: string; balance: string; unit: string; chain_id?: string }>(
        baseUrl, `/sdk/wallets/${walletId}/balance${qs}`, { ...creds },
      );
    },

    stablecoinTransfer: (
      creds: Creds,
      walletId: string,
      chainType: "evm" | "solana",
      body: { token: string; to: string; amount: string; chain_id?: string; gasless?: boolean; idempotency_key?: string },
    ) => req<{ job_id: string; status: string }>(
      baseUrl, `/sdk/wallets/${walletId}/stablecoin/transfer/${chainType}`,
      { method: "POST", body: JSON.stringify(body), ...creds },
    ),

    stablecoinBalance: (creds: Creds, walletId: string, chainType: "evm" | "solana", stablecoin: string, chainId?: string) => {
      const qs = new URLSearchParams({ token: stablecoin, ...(chainId ? { chain_id: chainId } : {}) }).toString();
      return req<{ address: string; token: string; symbol: string; balance: string; raw_balance: string; chain_id?: string }>(
        baseUrl, `/sdk/wallets/${walletId}/stablecoin/balance/${chainType}?${qs}`, { ...creds },
      );
    },

    getJob: (creds: Creds, jobId: string) =>
      req<JobStatus>(baseUrl, `/sdk/jobs/${jobId}`, { ...creds }),
  };
}