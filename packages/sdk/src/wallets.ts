import { VaultKey } from "./vaultkey";
import { Signing } from "./signing";
import {
  VaultKeyResponse,
  Wallet,
  CreateWalletParams,
  ListWalletsResult,
  PaginationParams,
  EVMBalanceResult,
  SolanaBalanceResult,
  BroadcastEVMResult,
  BroadcastSolanaResult,
  SweepParams,
  SigningJob,
  EVMChainParams,
} from "../types";

// ── Internal request shapes (snake_case to match Go API) ─────────────────────

type CreateWalletBody = {
  user_id: string;
  chain_type: string;
  label?: string;
};

type BroadcastBody = {
  signed_tx: string;
  chain_name?: string;
  chain_id?: string;
};

/**
 * Wallet management — create wallets, retrieve them, sign messages,
 * check balances, broadcast transactions, and trigger sweeps.
 *
 * @example
 * const vaultkey = new VaultKey({ apiKey: "vk_live_...", apiSecret: "..." });
 *
 * // Create a wallet
 * const { data } = await vaultkey.wallets.create({
 *   userId: "user_123",
 *   chainType: "evm",
 * });
 *
 * // Sign a message
 * const { data: job } = await vaultkey.wallets
 *   .signing("wallet_id")
 *   .evmMessage({ payload: { message: "Hello" } });
 *
 * // Poll until done
 * const { data: result } = await vaultkey.jobs.get(job.jobId);
 */
export class Wallets {
  constructor(private readonly client: VaultKey) {}

  /**
   * Create a new wallet for a user.
   *
   * @example
   * const { data, error } = await vaultkey.wallets.create({
   *   userId: "user_123",
   *   chainType: "evm",
   *   label: "Primary wallet",
   * });
   */
  async create(params: CreateWalletParams): Promise<VaultKeyResponse<Wallet>> {
    const body: CreateWalletBody = {
      user_id: params.userId,
      chain_type: params.chainType,
    };
    if (params.label) body.label = params.label;

    return this.client.post<Wallet>("/wallets", body);
  }

  /**
   * Retrieve a wallet by its ID.
   *
   * @example
   * const { data } = await vaultkey.wallets.get("wallet_abc123");
   */
  async get(walletId: string): Promise<VaultKeyResponse<Wallet>> {
    return this.client.get<Wallet>(`/wallets/${walletId}`);
  }

  /**
   * List all wallets belonging to a user.
   * Results are paginated — use `nextCursor` to fetch the next page.
   *
   * @example
   * const { data } = await vaultkey.wallets.listByUser("user_123");
   * // Next page:
   * const { data: page2 } = await vaultkey.wallets.listByUser("user_123", {
   *   after: data.nextCursor,
   * });
   */
  async listByUser(
    userId: string,
    pagination?: PaginationParams
  ): Promise<VaultKeyResponse<ListWalletsResult>> {
    const params = new URLSearchParams();
    if (pagination?.after) params.set("after", pagination.after);
    if (pagination?.limit) params.set("limit", String(pagination.limit));
    const qs = params.toString();
    return this.client.get<ListWalletsResult>(
      `/users/${userId}/wallets${qs ? `?${qs}` : ""}`
    );
  }

  /**
   * Returns a signing interface scoped to the given wallet.
   * Use this to sign EVM or Solana messages.
   *
   * @example
   * const { data } = await vaultkey.wallets
   *   .signing("wallet_id")
   *   .evmMessage({ payload: { message: "Hello" } });
   */
  signing(walletId: string): Signing {
    return new Signing(this.client, walletId);
  }

  /**
   * Get the native token balance for an EVM wallet.
   * Provide chainName (preferred) or chainId.
   *
   * @example
   * const { data } = await vaultkey.wallets.evmBalance("wallet_id", {
   *   chainName: "base",
   * });
   * console.log(data.balance); // "0.05"
   */
  async evmBalance(
    walletId: string,
    chain: EVMChainParams
  ): Promise<VaultKeyResponse<EVMBalanceResult>> {
    const params = new URLSearchParams();
    if ("chainName" in chain && chain.chainName) {
      params.set("chain_name", chain.chainName);
    } else if ("chainId" in chain && chain.chainId) {
      params.set("chain_id", chain.chainId);
    }
    return this.client.get<EVMBalanceResult>(
      `/wallets/${walletId}/balance/evm?${params.toString()}`
    );
  }

  /**
   * Get the SOL balance for a Solana wallet.
   *
   * @example
   * const { data } = await vaultkey.wallets.solanaBalance("wallet_id");
   * console.log(data.balance); // "1.5"
   */
  async solanaBalance(
    walletId: string
  ): Promise<VaultKeyResponse<SolanaBalanceResult>> {
    return this.client.get<SolanaBalanceResult>(
      `/wallets/${walletId}/balance/solana`
    );
  }

  /**
   * Broadcast a pre-signed EVM transaction.
   * Provide chainName (preferred) or chainId.
   *
   * @example
   * const { data } = await vaultkey.wallets.broadcastEVM("wallet_id", {
   *   signedTx: "0x...",
   *   chainName: "base",
   * });
   * console.log(data.txHash);
   */
  async broadcastEVM(
    walletId: string,
    params: { signedTx: string } & EVMChainParams
  ): Promise<VaultKeyResponse<BroadcastEVMResult>> {
    const body: BroadcastBody = { signed_tx: params.signedTx };
    if ("chainName" in params && params.chainName) {
      body.chain_name = params.chainName;
    } else if ("chainId" in params && params.chainId) {
      body.chain_id = params.chainId;
    }
    return this.client.post<BroadcastEVMResult>(
      `/wallets/${walletId}/broadcast`,
      body
    );
  }

  /**
   * Broadcast a pre-signed Solana transaction.
   *
   * @example
   * const { data } = await vaultkey.wallets.broadcastSolana("wallet_id", {
   *   signedTx: "base58encodedtx...",
   * });
   * console.log(data.signature);
   */
  async broadcastSolana(
    walletId: string,
    params: { signedTx: string }
  ): Promise<VaultKeyResponse<BroadcastSolanaResult>> {
    return this.client.post<BroadcastSolanaResult>(
      `/wallets/${walletId}/broadcast`,
      { signed_tx: params.signedTx }
    );
  }

  /**
   * Trigger a sweep — move all funds from this wallet to the configured
   * master wallet. The operation is asynchronous; poll via `vaultkey.jobs.get`.
   *
   * @example
   * // EVM sweep
   * const { data } = await vaultkey.wallets.sweep("wallet_id", {
   *   chainType: "evm",
   *   chainName: "base",
   * });
   *
   * // Solana sweep
   * const { data } = await vaultkey.wallets.sweep("wallet_id", {
   *   chainType: "solana",
   * });
   */
  async sweep(
    walletId: string,
    params: SweepParams
  ): Promise<VaultKeyResponse<SigningJob>> {
    const body: Record<string, string> = {
      chain_type: params.chainType,
    };

    if (params.chainType === "evm") {
      // chainName takes precedence — mirrors Go resolveEVMChain logic
      if (params.chainName) {
        body.chain_name = params.chainName;
      } else if (params.chainId) {
        body.chain_id = params.chainId;
      }
    }

    return this.client.post<SigningJob>(`/wallets/${walletId}/sweep`, body);
  }
}