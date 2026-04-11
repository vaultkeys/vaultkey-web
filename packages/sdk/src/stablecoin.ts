import { VaultKey } from "./vaultkey";
import {
  VaultKeyResponse,
  StablecoinTransferParams,
  StablecoinTransferResult,
  StablecoinBalanceParams,
  StablecoinBalanceResult,
} from "../types";

type TransferBody = {
  token: string;
  to: string;
  amount: string;
  chain_name?: string;
  chain_id?: string;
  gasless?: boolean;
  speed?: string;
  idempotency_key?: string;
};

type BalanceQuery = {
  token: string;
  chain_name?: string;
  chain_id?: string;
};

/**
 * Stablecoin operations — transfer USDC/USDT and check stablecoin balances
 * across EVM chains and Solana.
 *
 * @example
 * const vaultkey = new VaultKey({ apiKey: "vk_live_...", apiSecret: "..." });
 *
 * // Transfer USDC on Base
 * const { data } = await vaultkey.stablecoin.transfer("wallet_id", {
 *   token: "usdc",
 *   to: "0xRecipient",
 *   amount: "50.00",
 *   chainType: "evm",
 *   chainName: "base",
 *   gasless: true,
 * });
 *
 * // Check USDC balance on Polygon
 * const { data: bal } = await vaultkey.stablecoin.balance("wallet_id", {
 *   token: "usdc",
 *   chainType: "evm",
 *   chainName: "polygon",
 * });
 */
export class Stablecoin {
  constructor(private readonly client: VaultKey) {}

  /**
   * Transfer a stablecoin from a wallet.
   *
   * - For EVM: provide chainName (preferred) or chainId.
   * - For Solana: omit chainName and chainId.
   * - The operation is async — poll `vaultkey.jobs.get(data.jobId)`.
   * - Use `idempotencyKey` to safely retry without double-sending.
   *
   * @example
   * // EVM (gasless)
   * const { data } = await vaultkey.stablecoin.transfer("wallet_id", {
   *   token: "usdc",
   *   to: "0xRecipient",
   *   amount: "100.00",
   *   chainType: "evm",
   *   chainName: "base",
   *   gasless: true,
   *   speed: "fast",
   * });
   *
   * // Solana
   * const { data } = await vaultkey.stablecoin.transfer("wallet_id", {
   *   token: "usdc",
   *   to: "RecipientBase58",
   *   amount: "100.00",
   *   chainType: "solana",
   * });
   */
  async transfer(
    walletId: string,
    params: StablecoinTransferParams
  ): Promise<VaultKeyResponse<StablecoinTransferResult>> {
    const body: TransferBody = {
      token: params.token,
      to: params.to,
      amount: params.amount,
    };

    if (params.chainType === "evm") {
      // chainName takes precedence — mirrors Go handler logic
      if (params.chainName) {
        body.chain_name = params.chainName;
      } else if (params.chainId) {
        body.chain_id = params.chainId;
      }
    }
    // For Solana, chain_name and chain_id must not be sent (server rejects them)

    if (params.gasless !== undefined) body.gasless = params.gasless;
    if (params.speed) body.speed = params.speed;
    if (params.idempotencyKey) body.idempotency_key = params.idempotencyKey;

    return this.client.post<StablecoinTransferResult>(
      `/wallets/${walletId}/stablecoin/transfer/${params.chainType}`,
      body
    );
  }

  /**
   * Get the stablecoin balance for a wallet.
   *
   * - For EVM: provide chainName (preferred) or chainId.
   * - For Solana: omit chainName and chainId.
   *
   * @example
   * const { data } = await vaultkey.stablecoin.balance("wallet_id", {
   *   token: "usdc",
   *   chainType: "evm",
   *   chainName: "polygon",
   * });
   * console.log(data.balance); // "50.00"
   */
  async balance(
    walletId: string,
    params: StablecoinBalanceParams
  ): Promise<VaultKeyResponse<StablecoinBalanceResult>> {
    const query: BalanceQuery = { token: params.token };

    if (params.chainType === "evm") {
      if (params.chainName) {
        query.chain_name = params.chainName;
      } else if (params.chainId) {
        query.chain_id = params.chainId;
      }
    }

    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined) as [
        string,
        string
      ][]
    ).toString();

    return this.client.get<StablecoinBalanceResult>(
      `/wallets/${walletId}/stablecoin/balance/${params.chainType}?${qs}`
    );
  }
}