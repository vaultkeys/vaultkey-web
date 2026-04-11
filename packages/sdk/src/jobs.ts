import { VaultKey } from "./vaultkey";
import { VaultKeyResponse, Job } from "../types";

/**
 * Job polling — check the status of async operations like signing and sweeps.
 *
 * Most VaultKey operations that involve on-chain activity are asynchronous.
 * They return a `jobId` which you poll here until `status` is
 * "completed" or "failed".
 *
 * @example
 * const { data: job } = await vaultkey.wallets
 *   .signing("wallet_id")
 *   .evmMessage({ payload: { message: "Hello" } });
 *
 * // Poll until done
 * let result;
 * do {
 *   await new Promise(r => setTimeout(r, 1000));
 *   result = await vaultkey.jobs.get(job.jobId);
 * } while (result.data?.status === "pending" || result.data?.status === "processing");
 */
export class Jobs {
  constructor(private readonly client: VaultKey) {}

  /**
   * Retrieve the current state of an async job.
   *
   * @example
   * const { data, error } = await vaultkey.jobs.get("job_abc123");
   * if (data?.status === "completed") {
   *   console.log("Done!", data.result);
   * }
   */
  async get(jobId: string): Promise<VaultKeyResponse<Job>> {
    return this.client.get<Job>(`/jobs/${jobId}`);
  }
}