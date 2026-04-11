import { ErrorResponse } from "../types";
import { Wallets } from "./wallets";
import { Jobs } from "./jobs";
import { Stablecoin } from "./stablecoin";
import { Chains } from "./chains";

const DEFAULT_BASE_URL = "https://app.vaultkeys.dev";

type RequestOptions = {
  headers?: HeadersInit;
};

function isVaultKeyErrorResponse(resp: unknown): resp is { error: ErrorResponse } {
  return (
    typeof resp === "object" &&
    resp !== null &&
    "error" in resp &&
    typeof (resp as { error: unknown }).error === "object"
  );
}

export interface VaultKeyConfig {
  /**
   * Your VaultKey API key.
   * Testnet keys start with `testnet_`, live keys start with `vk_live_`.
   * Falls back to the VAULTKEY_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Your VaultKey API secret.
   * Falls back to the VAULTKEY_API_SECRET environment variable.
   */
  apiSecret?: string;

  /**
   * Override the base URL. Useful for self-hosted deployments or proxies.
   * Defaults to https://app.vaultkeys.dev
   */
  baseUrl?: string;
}

export class VaultKey {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  readonly baseUrl: string;

  /** Wallet management — create, retrieve, and list wallets. */
  readonly wallets: Wallets;

  /** Async job polling — check the status of signing and sweep operations. */
  readonly jobs: Jobs;

  /** Stablecoin transfers and balance lookups (USDC, USDT). */
  readonly stablecoin: Stablecoin;

  /** Chain discovery — list supported EVM chains for the current environment. */
  readonly chains: Chains;

  constructor(config: VaultKeyConfig = {}) {
    const apiKey =
      config.apiKey ??
      (typeof process !== "undefined"
        ? process.env?.VAULTKEY_API_KEY
        : undefined);

    const apiSecret =
      config.apiSecret ??
      (typeof process !== "undefined"
        ? process.env?.VAULTKEY_API_SECRET
        : undefined);

    if (!apiKey) {
      throw new Error(
        'Missing API key. Pass it via config: new VaultKey({ apiKey: "vk_live_..." }) ' +
          "or set the VAULTKEY_API_KEY environment variable."
      );
    }

    if (!apiSecret) {
      throw new Error(
        'Missing API secret. Pass it via config: new VaultKey({ apiSecret: "..." }) ' +
          "or set the VAULTKEY_API_SECRET environment variable."
      );
    }

    // Warn on likely key/environment mismatches — the server will reject
    // these anyway, but a client-side hint saves a round-trip.
    if (
      typeof process !== "undefined" &&
      process.env?.ENVIRONMENT === "mainnet" &&
      apiKey.startsWith("testnet_")
    ) {
      console.warn(
        "[VaultKey] Warning: testnet API key detected but ENVIRONMENT is mainnet. " +
          "Requests will be rejected by the server."
      );
    }

    if (
      typeof process !== "undefined" &&
      process.env?.ENVIRONMENT === "testnet" &&
      apiKey.startsWith("vk_live_")
    ) {
      console.warn(
        "[VaultKey] Warning: live API key detected but ENVIRONMENT is testnet. " +
          "Requests will be rejected by the server."
      );
    }

    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = `${config.baseUrl ?? DEFAULT_BASE_URL}/api/v1/sdk`;

    this.wallets = new Wallets(this);
    this.jobs = new Jobs(this);
    this.stablecoin = new Stablecoin(this);
    this.chains = new Chains(this);
  }

  async fetchRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: ErrorResponse | null }> {
    const headers = new Headers({
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      "X-API-Secret": this.apiSecret,
      ...Object.fromEntries(new Headers(options.headers ?? {})),
    });

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const defaultError: ErrorResponse = {
      code: "INTERNAL_SERVER_ERROR",
      message: response.statusText,
    };

    if (!response.ok) {
      try {
        const body = await response.json();
        if (isVaultKeyErrorResponse(body)) {
          return { data: null, error: body.error };
        }
        // Server returned a plain { error: "string" } shape
        if (typeof body?.error === "string") {
          return {
            data: null,
            error: { code: String(response.status), message: body.error },
          };
        }
        return { data: null, error: defaultError };
      } catch {
        return { data: null, error: defaultError };
      }
    }

    const data = await response.json();
    return { data, error: null };
  }

  async get<T>(path: string, options?: RequestOptions) {
    return this.fetchRequest<T>(path, {
      method: "GET",
      headers: options?.headers,
    });
  }

  async post<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.fetchRequest<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: options?.headers,
    });
  }

  async put<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.fetchRequest<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: options?.headers,
    });
  }

  async patch<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.fetchRequest<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: options?.headers,
    });
  }

  async delete<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.fetchRequest<T>(path, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: options?.headers,
    });
  }
}