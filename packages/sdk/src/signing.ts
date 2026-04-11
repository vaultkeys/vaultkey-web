import { VaultKey } from "./vaultkey";
import {
  VaultKeyResponse,
  SigningJob,
  SignEVMMessageParams,
  SignSolanaMessageParams,
} from "../types";

/**
 * Signing operations — sign EVM and Solana messages.
 *
 * All signing operations are asynchronous. They return a job ID
 * which you can poll via `vaultkey.jobs.get(jobId)` until the
 * status is "completed" or "failed".
 *
 * Access via: `vaultkey.wallets.signing`
 */
export class Signing {
  constructor(
    private readonly client: VaultKey,
    private readonly walletId: string
  ) {}

  /**
   * Sign an EVM message or typed data (EIP-712).
   *
   * @example
   * const { data } = await vaultkey.wallets.signing("wallet_id").evmMessage({
   *   payload: { message: "Hello from VaultKey" },
   * });
   * // Poll: await vaultkey.jobs.get(data.jobId)
   */
  async evmMessage(
    params: SignEVMMessageParams
  ): Promise<VaultKeyResponse<SigningJob>> {
    const { idempotencyKey, ...rest } = params;
    return this.client.post<SigningJob>(
      `/wallets/${this.walletId}/sign/message/evm`,
      {
        payload: rest.payload,
        idempotency_key: idempotencyKey,
      }
    );
  }

  /**
   * Sign a Solana message.
   *
   * @example
   * const { data } = await vaultkey.wallets.signing("wallet_id").solanaMessage({
   *   payload: { message: "Hello from VaultKey" },
   * });
   */
  async solanaMessage(
    params: SignSolanaMessageParams
  ): Promise<VaultKeyResponse<SigningJob>> {
    const { idempotencyKey, ...rest } = params;
    return this.client.post<SigningJob>(
      `/wallets/${this.walletId}/sign/message/solana`,
      {
        payload: rest.payload,
        idempotency_key: idempotencyKey,
      }
    );
  }
}