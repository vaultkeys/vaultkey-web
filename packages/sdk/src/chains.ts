import { VaultKey } from "./vaultkey";
import { VaultKeyResponse, Chain } from "../types";

/**
 * Chain discovery — list supported chains for the current environment.
 *
 * Use this to build chain selectors in your UI or to validate
 * chain names before passing them to other SDK methods.
 *
 * @example
 * const { data } = await vaultkey.chains.list();
 * // [{ name: "base", chainId: "8453", nativeSymbol: "ETH", testnet: false }, ...]
 */
export class Chains {
  constructor(private readonly client: VaultKey) {}

  /**
   * List all supported EVM chains for the current environment
   * (testnet or mainnet, determined by your API key).
   *
   * @example
   * const { data, error } = await vaultkey.chains.list();
   */
  async list(): Promise<VaultKeyResponse<Chain[]>> {
    return this.client.get<Chain[]>("/chains");
  }
}