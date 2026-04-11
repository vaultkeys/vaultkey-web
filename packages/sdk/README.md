# @vaultkey/sdk

Official TypeScript / JavaScript SDK for the [VaultKey](https://vaultkey.com) API.

VaultKey lets you create and manage crypto wallets, sign messages and transactions, transfer stablecoins, and sweep funds — all through a simple API.

## Installation

```bash
npm install @vaultkey/sdk
# or
pnpm add @vaultkey/sdk
# or
yarn add @vaultkey/sdk
```

## Requirements

- Node.js 18+
- A VaultKey API key and secret from your [dashboard](https://app.vaultkeys.com)

---

## Quick Start

```ts
import { VaultKey } from "@vaultkey/sdk";

const vk = new VaultKey({
  apiKey: "vk_live_...",
  apiSecret: "...",
});

// Create a wallet
const { data: wallet, error } = await vk.wallets.create({
  userId: "user_123",
  chainType: "evm",
});

if (error) {
  console.error(error.message);
} else {
  console.log(wallet.address); // "0x..."
}
```

---

## Configuration

```ts
const vk = new VaultKey({
  apiKey: "vk_live_...",       // or set VAULTKEY_API_KEY env var
  apiSecret: "...",             // or set VAULTKEY_API_SECRET env var
  baseUrl: "https://...",       // optional — override for self-hosted deployments
});
```

**API key prefixes:**
- `testnet_` — testnet environment
- `vk_live_` — mainnet / production

The SDK will warn you at construction time if your key prefix does not match the detected environment.

---

## Response Shape

Every method returns `{ data, error }`. Exactly one will be non-null.

```ts
const { data, error } = await vk.wallets.get("wallet_id");

if (error) {
  console.error(error.code, error.message);
  return;
}

console.log(data.address);
```

---

## Wallets

### Create a wallet

```ts
const { data: wallet } = await vk.wallets.create({
  userId: "user_123",
  chainType: "evm",       // "evm" | "solana"
  label: "Primary",       // optional
});
```

### Get a wallet

```ts
const { data: wallet } = await vk.wallets.get("wallet_id");
```

### List wallets for a user

```ts
const { data } = await vk.wallets.listByUser("user_123");

// Paginate
if (data.hasMore) {
  const { data: page2 } = await vk.wallets.listByUser("user_123", {
    after: data.nextCursor,
  });
}
```

---

## Signing

Signing operations are **asynchronous**. They return a `jobId` which you poll via `vk.jobs.get()`.

### Sign an EVM message

```ts
const { data: job } = await vk.wallets
  .signing("wallet_id")
  .evmMessage({
    payload: { message: "Hello from VaultKey" },
    idempotencyKey: "unique-key-123",  // optional — safe to retry
  });

// Poll until done
const result = await pollJob(vk, job.jobId);
```

### Sign a Solana message

```ts
const { data: job } = await vk.wallets
  .signing("wallet_id")
  .solanaMessage({
    payload: { data: "SGVsbG8=" },
  });
```

---

## Balances

### EVM balance

```ts
// Preferred: use chain name
const { data } = await vk.wallets.evmBalance("wallet_id", {
  chainName: "base",
});

// Fallback: use chain ID
const { data } = await vk.wallets.evmBalance("wallet_id", {
  chainId: "8453",
});

console.log(data.balance);     // "0.05"
console.log(data.symbol);      // "ETH"
console.log(data.chainName);   // "base"
```

### Solana balance

```ts
const { data } = await vk.wallets.solanaBalance("wallet_id");
console.log(data.balance);  // "1.5"
console.log(data.symbol);   // "SOL"
```

---

## Broadcast

Send a pre-signed transaction to the network.

### EVM

```ts
const { data } = await vk.wallets.broadcastEVM("wallet_id", {
  signedTx: "0x...",
  chainName: "base",
});
console.log(data.txHash);
```

### Solana

```ts
const { data } = await vk.wallets.broadcastSolana("wallet_id", {
  signedTx: "base58encodedtx...",
});
console.log(data.signature);
```

---

## Sweep

Move all funds from a wallet to the configured master wallet. Async — poll the returned job.

```ts
// EVM sweep
const { data: job } = await vk.wallets.sweep("wallet_id", {
  chainType: "evm",
  chainName: "base",
});

// Solana sweep
const { data: job } = await vk.wallets.sweep("wallet_id", {
  chainType: "solana",
});

const result = await pollJob(vk, job.jobId);
```

---

## Stablecoin

Transfer USDC or USDT, and check stablecoin balances.

### Transfer

```ts
// EVM — gasless (relayer pays gas)
const { data } = await vk.stablecoin.transfer("wallet_id", {
  token: "usdc",
  to: "0xRecipient",
  amount: "50.00",
  chainType: "evm",
  chainName: "base",
  gasless: true,
  speed: "fast",              // "slow" | "normal" | "fast"
  idempotencyKey: "tx-001",  // optional — prevents double sends on retry
});

// Solana — omit chain fields
const { data } = await vk.stablecoin.transfer("wallet_id", {
  token: "usdc",
  to: "RecipientBase58...",
  amount: "50.00",
  chainType: "solana",
});

// Poll the async job
const result = await pollJob(vk, data.jobId);
```

### Balance

```ts
const { data } = await vk.stablecoin.balance("wallet_id", {
  token: "usdc",
  chainType: "evm",
  chainName: "polygon",
});
console.log(data.balance);  // "50.00"
```

---

## Jobs

Poll the status of any async operation.

```ts
const { data } = await vk.jobs.get("job_id");
// data.status: "pending" | "processing" | "completed" | "failed"
```

### Polling helper

```ts
async function pollJob(vk: VaultKey, jobId: string, intervalMs = 1000) {
  while (true) {
    const { data, error } = await vk.jobs.get(jobId);
    if (error) throw new Error(error.message);
    if (data.status === "completed") return data;
    if (data.status === "failed") throw new Error(data.error ?? "Job failed");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
```

---

## Chains

Discover supported chains for the current environment.

```ts
const { data: chains } = await vk.chains.list();
// [{ name: "base", chainId: "8453", nativeSymbol: "ETH", testnet: false }, ...]
```

**Supported EVM chains:**

| Mainnet | Testnet |
|---|---|
| ethereum | sepolia |
| polygon | amoy |
| arbitrum | arbitrum-sepolia |
| base | base-sepolia |
| optimism | optimism-sepolia |
| avalanche | avalanche-fuji |
| bsc | bsc-testnet |
| linea | — |
| scroll | — |
| zksync | zksync-sepolia |

---

## Environment Variables

| Variable | Description |
|---|---|
| `VAULTKEY_API_KEY` | Your API key (fallback if not passed to constructor) |
| `VAULTKEY_API_SECRET` | Your API secret (fallback if not passed to constructor) |
| `VAULTKEY_BASE_URL` | Override base URL (optional) |
| `ENVIRONMENT` | `"testnet"` or `"mainnet"` — used for key prefix validation warnings |

---

## Available Resources

| Resource | Methods |
|---|---|
| `vk.wallets` | `create`, `get`, `listByUser`, `evmBalance`, `solanaBalance`, `broadcastEVM`, `broadcastSolana`, `sweep` |
| `vk.wallets.signing(id)` | `evmMessage`, `solanaMessage` |
| `vk.stablecoin` | `transfer`, `balance` |
| `vk.jobs` | `get` |
| `vk.chains` | `list` |