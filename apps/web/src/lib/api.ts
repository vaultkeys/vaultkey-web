export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function req<T>(
  baseUrl: string,
  path: string,
  opts: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Org { id: string; name: string; slug: string; billing_email: string; created_at: string; }
export interface OrgDetail extends Org { created_by: string; updated_at: string; project_id?: string; }
export interface OnboardingResponse { org_id: string; org_name: string; org_slug: string; project_id: string; created_at: string; }
export interface Member { id: string; clerk_user_id: string; role: string; email: string; first_name: string; last_name: string; joined_at: string; }
export interface Invite { id: string; org_id: string; email: string; token: string; role: string; created_by: string; expires_at: string; created_at: string; accepted_at?: string; }
export interface ApiKey { id: string; name: string; key: string; active: boolean; last_used_at?: string; created_at: string; }
export interface ApiKeyCreated { id: string; name: string; key: string; secret: string; created_at: string; }
export interface Wallet { id: string; user_id: string; chain_type: string; address: string; label?: string; created_at: string; }
export interface PaymentIntentRes { client_secret: string; payment_intent_id: string; base_credits: number; bonus_credits: number; total_credits: number; amount_cents: number; currency: string; }
export interface StripePayment { id: string; amount_cents: number; currency: string; status: string; created_at: string; total_credits: number; }
export interface BillingHistory { payments: StripePayment[]; }
export interface OperationStat { operation: string; count: number; credits_consumed: number; }
export interface DailyUsage { date: string; operation: string; count: number; credits_consumed: number; }
export interface UsageStats { org_id: string; period: { start: string; end: string }; total_credits_consumed: number; total_operations: number; current_balance: number; by_operation: OperationStat[]; daily?: DailyUsage[]; }
export interface JobStatus { id: string; status: string; result?: unknown; error?: string; created_at: string; updated_at: string; }

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

    listMembers: (token: string, orgId: string) =>
      req<{ members: Member[] }>(baseUrl, `/cloud/organizations/${orgId}/members`, { token }),

    updateMember: (token: string, orgId: string, clerkUserId: string, role: string) =>
      req<Member>(baseUrl, `/cloud/organizations/${orgId}/members/${clerkUserId}`, { method: "PATCH", body: JSON.stringify({ role }), token }),

    removeMember: (token: string, orgId: string, clerkUserId: string) =>
      req<void>(baseUrl, `/cloud/organizations/${orgId}/members/${clerkUserId}`, { method: "DELETE", token }),

    createInvite: (token: string, orgId: string, body: { email: string; role: string }) =>
      req<Invite>(baseUrl, `/cloud/organizations/${orgId}/invites`, { method: "POST", body: JSON.stringify(body), token }),

    listInvites: (token: string, orgId: string) =>
      req<{ invites: Invite[] }>(baseUrl, `/cloud/organizations/${orgId}/invites`, { token }),

    revokeInvite: (token: string, orgId: string, inviteToken: string) =>
      req<void>(baseUrl, `/cloud/organizations/${orgId}/invites/${inviteToken}`, { method: "DELETE", token }),

    acceptInvite: (token: string, inviteToken: string) =>
      req<{ status: string; org_id: string; role: string }>(baseUrl, `/cloud/invites/${inviteToken}/accept`, { method: "POST", token }),

    createApiKey: (token: string, orgId: string, name: string) =>
      req<ApiKeyCreated>(baseUrl, `/cloud/organizations/${orgId}/api-keys`, { method: "POST", body: JSON.stringify({ name }), token }),

    listApiKeys: (token: string, orgId: string) =>
      req<{ api_keys: ApiKey[] }>(baseUrl, `/cloud/organizations/${orgId}/api-keys`, { token }),

    revokeApiKey: (token: string, orgId: string, keyId: string) =>
      req<void>(baseUrl, `/cloud/organizations/${orgId}/api-keys/${keyId}`, { method: "DELETE", token }),

    createPaymentIntent: (token: string, body: { amount_cents: number; currency: string }) =>
      req<PaymentIntentRes>(baseUrl, "/cloud/billing/purchase", { method: "POST", body: JSON.stringify(body), token }),

    getBillingHistory: (token: string) =>
      req<BillingHistory>(baseUrl, "/cloud/billing/history", { token }),

    getUsage: (token: string, orgId: string, params?: { start?: string; end?: string; breakdown?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return req<UsageStats>(baseUrl, `/cloud/organizations/${orgId}/usage${qs ? `?${qs}` : ""}`, { token });
    },

    getCredits: (token: string, orgId: string) =>
      req<{ org_id: string; balance: number }>(baseUrl, `/cloud/organizations/${orgId}/credits`, { token }),
  };
}

// ── SDK endpoints (project API key) ──────────────────────────────────────────

export function makeSDK(baseUrl: string) {
  return {
    createWallet: (token: string, body: { user_id: string; chain_type: "evm" | "solana"; label?: string }) =>
      req<Wallet>(baseUrl, "/sdk/wallets", { method: "POST", body: JSON.stringify(body), token }),

    getWallet: (token: string, walletId: string) =>
      req<Wallet>(baseUrl, `/sdk/wallets/${walletId}`, { token }),

    listUserWallets: (token: string, userId: string) =>
      req<{ wallets: Wallet[] }>(baseUrl, `/sdk/users/${userId}/wallets`, { token }),

    getBalance: (token: string, walletId: string, chainId?: string) => {
      const qs = chainId ? `?chain_id=${chainId}` : "";
      return req<{ address: string; balance: string; unit: string; chain_id?: string }>(
        baseUrl, `/sdk/wallets/${walletId}/balance${qs}`, { token },
      );
    },

    stablecoinTransfer: (
      token: string,
      walletId: string,
      chainType: "evm" | "solana",
      body: { token: string; to: string; amount: string; chain_id?: string; gasless?: boolean; idempotency_key?: string },
    ) => req<{ job_id: string; status: string }>(
      baseUrl, `/sdk/wallets/${walletId}/stablecoin/transfer/${chainType}`,
      { method: "POST", body: JSON.stringify(body), token },
    ),

    stablecoinBalance: (token: string, walletId: string, chainType: "evm" | "solana", stablecoin: string, chainId?: string) => {
      const qs = new URLSearchParams({ token: stablecoin, ...(chainId ? { chain_id: chainId } : {}) }).toString();
      return req<{ address: string; token: string; symbol: string; balance: string; raw_balance: string; chain_id?: string }>(
        baseUrl, `/sdk/wallets/${walletId}/stablecoin/balance/${chainType}?${qs}`, { token },
      );
    },

    getJob: (token: string, jobId: string) =>
      req<JobStatus>(baseUrl, `/sdk/jobs/${jobId}`, { token }),
  };
}

// ── Legacy singleton (backward-compat, uses NEXT_PUBLIC_BACKEND_URL) ──────────
// Still used by pages that haven't been migrated to useApi() yet.
// const _legacyBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
// export const cloud = makeCloud(_legacyBase);
// export const sdk = makeSDK(_legacyBase);