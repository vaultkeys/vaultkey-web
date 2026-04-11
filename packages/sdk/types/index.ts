// ── Shared response wrapper ───────────────────────────────────────────────────

export type VaultKeyResponse<T> = {
  data: T | null;
  error: ErrorResponse | null;
};

export type ErrorResponse = {
  message: string;
  code: string;
};

// ── Chain types ───────────────────────────────────────────────────────────────

/**
 * Supported EVM chain names.
 * Pass chain_name (preferred) or chain_id when calling EVM endpoints.
 *
 * Mainnets:  ethereum, polygon, arbitrum, base, optimism,
 *            avalanche, bsc, linea, scroll, zksync
 *
 * Testnets:  sepolia, amoy, arbitrum-sepolia, base-sepolia,
 *            optimism-sepolia, avalanche-fuji, bsc-testnet, zksync-sepolia
 */
export type ChainName =
  // Mainnets
  | "ethereum"
  | "polygon"
  | "arbitrum"
  | "base"
  | "optimism"
  | "avalanche"
  | "bsc"
  | "linea"
  | "scroll"
  | "zksync"
  // Testnets
  | "sepolia"
  | "amoy"
  | "arbitrum-sepolia"
  | "base-sepolia"
  | "optimism-sepolia"
  | "avalanche-fuji"
  | "bsc-testnet"
  | "zksync-sepolia";

/**
 * Chain resolution params for EVM endpoints.
 * Provide chainName (preferred) OR chainId — chainName takes precedence.
 */
export type EVMChainParams =
  | { chainName: ChainName | string; chainId?: never }
  | { chainId: string; chainName?: never };

export type ChainType = "evm" | "solana";

export type Chain = {
  name: string;
  chainId: string;
  nativeSymbol: string;
  legacySymbol?: string;
  testnet: boolean;
};

// ── Wallet types ──────────────────────────────────────────────────────────────

export type Wallet = {
  id: string;
  userId: string;
  chainType: ChainType;
  address: string;
  label?: string;
  createdAt: string;
};

export type CreateWalletParams = {
  userId: string;
  chainType: ChainType;
  /** Optional human-readable label for this wallet. */
  label?: string;
};

export type ListWalletsResult = {
  wallets: Wallet[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type PaginationParams = {
  /** Cursor from the previous page's nextCursor for pagination. */
  after?: string;
  limit?: number;
};

// ── Signing types ─────────────────────────────────────────────────────────────

export type SigningJob = {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
};

export type SignEVMMessageParams = {
  /** Raw message or typed data payload to sign. */
  payload: Record<string, unknown>;
  /** Optional deduplication key — safe to retry with the same key. */
  idempotencyKey?: string;
};

export type SignSolanaMessageParams = {
  payload: Record<string, unknown>;
  idempotencyKey?: string;
};

// ── Balance types ─────────────────────────────────────────────────────────────

export type EVMBalanceResult = {
  address: string;
  balance: string;
  rawBalance: string;
  symbol: string;
  chainName: string;
  chainId: string;
};

export type SolanaBalanceResult = {
  address: string;
  balance: string;
  rawBalance: string;
  symbol: "SOL";
};

// ── Broadcast types ───────────────────────────────────────────────────────────

export type BroadcastEVMResult = {
  txHash: string;
  chainName: string;
  chainId: string;
};

export type BroadcastSolanaResult = {
  signature: string;
};

// ── Sweep types ───────────────────────────────────────────────────────────────

export type SweepParams = {
  chainType: ChainType;
  /**
   * EVM only — the chain to sweep from.
   * chainName takes precedence over chainId.
   */
  chainName?: string;
  chainId?: string;
};

// ── Stablecoin types ──────────────────────────────────────────────────────────

export type StablecoinToken = "usdc" | "usdt";

export type TransferSpeed = "slow" | "normal" | "fast";

export type StablecoinTransferParams = {
  token: StablecoinToken;
  /** Recipient wallet address. */
  to: string;
  /** Human-readable amount, e.g. "50.00". */
  amount: string;
  chainType: ChainType;
  /** EVM only — chainName (preferred) or chainId. */
  chainName?: string;
  chainId?: string;
  /** If true, the relayer pays gas on behalf of the sender. */
  gasless?: boolean;
  /** Controls transaction priority. Defaults to "normal". */
  speed?: TransferSpeed;
  /** Optional deduplication key. */
  idempotencyKey?: string;
};

export type StablecoinTransferResult = {
  jobId: string;
  status: string;
};

export type StablecoinBalanceParams = {
  token: StablecoinToken;
  chainType: ChainType;
  /** EVM only — chainName (preferred) or chainId. */
  chainName?: string;
  chainId?: string;
};

export type StablecoinBalanceResult = {
  address: string;
  token: string;
  symbol: string;
  balance: string;
  rawBalance: string;
  chainId?: string;
};

// ── Job types ─────────────────────────────────────────────────────────────────

export type Job = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  operation: string;
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
};