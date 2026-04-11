/**
 * VaultKey SDK — Example Usage
 *
 * Run with: npx tsx examples/usage.ts
 * Make sure VAULTKEY_API_KEY and VAULTKEY_API_SECRET are set in your environment.
 */

import { VaultKey } from "@vaultkey/sdk";

const vk = new VaultKey({
  apiKey: process.env.VAULTKEY_API_KEY,
  apiSecret: process.env.VAULTKEY_API_SECRET,
});

// ---------------------------------------------------------------------------
// Helper: poll a job until completed or failed
// ---------------------------------------------------------------------------

async function pollJob(jobId: string, intervalMs = 1000) {
  console.log(`  Polling job ${jobId}...`);
  while (true) {
    const { data, error } = await vk.jobs.get(jobId);
    if (error) throw new Error(`Job poll failed: ${error.message}`);
    console.log(`  status: ${data.status}`);
    if (data.status === "completed") return data;
    if (data.status === "failed") throw new Error(`Job failed: ${data.error}`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

// ---------------------------------------------------------------------------
// 1. Create wallets
// ---------------------------------------------------------------------------

async function createWallets() {
  console.log("\n── Create Wallets ──────────────────────────────────────────");

  const { data: evmWallet, error: evmErr } = await vk.wallets.create({
    userId: "user_123",
    chainType: "evm",
    label: "Primary EVM wallet",
  });
  if (evmErr) throw new Error(evmErr.message);
  console.log("EVM wallet created:", evmWallet.id, evmWallet.address);

  const { data: solWallet, error: solErr } = await vk.wallets.create({
    userId: "user_123",
    chainType: "solana",
  });
  if (solErr) throw new Error(solErr.message);
  console.log("Solana wallet created:", solWallet.id, solWallet.address);

  return { evmWallet, solWallet };
}

// ---------------------------------------------------------------------------
// 2. List wallets for a user
// ---------------------------------------------------------------------------

async function listWallets(userId: string) {
  console.log("\n── List Wallets ────────────────────────────────────────────");

  const { data, error } = await vk.wallets.listByUser(userId);
  if (error) throw new Error(error.message);

  console.log(`Found ${data.wallets.length} wallet(s) for user ${userId}`);
  for (const w of data.wallets) {
    console.log(`  ${w.id}  ${w.chainType}  ${w.address}`);
  }

  if (data.hasMore) {
    console.log("  (more pages available — use data.nextCursor to fetch)");
  }
}

// ---------------------------------------------------------------------------
// 3. Check balances
// ---------------------------------------------------------------------------

async function checkBalances(evmWalletId: string, solWalletId: string) {
  console.log("\n── Balances ────────────────────────────────────────────────");

  // EVM — prefer chain name over chain ID
  const { data: evmBal, error: evmErr } = await vk.wallets.evmBalance(
    evmWalletId,
    { chainName: "base-sepolia" }
  );
  if (evmErr) throw new Error(evmErr.message);
  console.log(`EVM balance: ${evmBal.balance} ${evmBal.symbol} on ${evmBal.chainName}`);

  // Solana
  const { data: solBal, error: solErr } = await vk.wallets.solanaBalance(solWalletId);
  if (solErr) throw new Error(solErr.message);
  console.log(`Solana balance: ${solBal.balance} ${solBal.symbol}`);
}

// ---------------------------------------------------------------------------
// 4. Sign messages
// ---------------------------------------------------------------------------

async function signMessages(evmWalletId: string, solWalletId: string) {
  console.log("\n── Sign Messages ───────────────────────────────────────────");

  // EVM message signing
  const { data: evmJob, error: evmErr } = await vk.wallets
    .signing(evmWalletId)
    .evmMessage({
      payload: { message: "Hello from VaultKey" },
      idempotencyKey: "sign-evm-001",
    });
  if (evmErr) throw new Error(evmErr.message);
  console.log("EVM sign job created:", evmJob.jobId);
  const evmResult = await pollJob(evmJob.jobId);
  console.log("EVM sign result:", evmResult.result);

  // Solana message signing
  const { data: solJob, error: solErr } = await vk.wallets
    .signing(solWalletId)
    .solanaMessage({
      payload: { data: Buffer.from("Hello from VaultKey").toString("base64") },
    });
  if (solErr) throw new Error(solErr.message);
  console.log("Solana sign job created:", solJob.jobId);
  await pollJob(solJob.jobId);
}

// ---------------------------------------------------------------------------
// 5. Stablecoin transfer
// ---------------------------------------------------------------------------

async function stablecoinTransfer(evmWalletId: string) {
  console.log("\n── Stablecoin Transfer ─────────────────────────────────────");

  // EVM USDC transfer (gasless — relayer pays gas)
  const { data, error } = await vk.stablecoin.transfer(evmWalletId, {
    token: "usdc",
    to: "0xRecipientAddress",
    amount: "10.00",
    chainType: "evm",
    chainName: "base-sepolia",
    gasless: true,
    speed: "normal",
    idempotencyKey: "transfer-usdc-001",
  });
  if (error) throw new Error(error.message);
  console.log("Transfer job created:", data.jobId);
  await pollJob(data.jobId);

  // Check balance after
  const { data: bal } = await vk.stablecoin.balance(evmWalletId, {
    token: "usdc",
    chainType: "evm",
    chainName: "base-sepolia",
  });
  console.log(`USDC balance after transfer: ${bal.balance} ${bal.symbol}`);
}

// ---------------------------------------------------------------------------
// 6. Sweep
// ---------------------------------------------------------------------------

async function sweep(evmWalletId: string, solWalletId: string) {
  console.log("\n── Sweep ───────────────────────────────────────────────────");

  // EVM sweep
  const { data: evmJob, error: evmErr } = await vk.wallets.sweep(evmWalletId, {
    chainType: "evm",
    chainName: "base-sepolia",
  });
  if (evmErr) throw new Error(evmErr.message);
  console.log("EVM sweep job:", evmJob.jobId);
  await pollJob(evmJob.jobId);

  // Solana sweep
  const { data: solJob, error: solErr } = await vk.wallets.sweep(solWalletId, {
    chainType: "solana",
  });
  if (solErr) throw new Error(solErr.message);
  console.log("Solana sweep job:", solJob.jobId);
  await pollJob(solJob.jobId);
}

// ---------------------------------------------------------------------------
// 7. List supported chains
// ---------------------------------------------------------------------------

async function listChains() {
  console.log("\n── Supported Chains ────────────────────────────────────────");

  const { data: chains, error } = await vk.chains.list();
  if (error) throw new Error(error.message);

  for (const c of chains) {
    const label = c.testnet ? "(testnet)" : "(mainnet)";
    console.log(`  ${c.name.padEnd(20)} chain_id=${c.chainId}  ${c.nativeSymbol}  ${label}`);
  }
}

// ---------------------------------------------------------------------------
// Run all examples
// ---------------------------------------------------------------------------

async function main() {
  console.log("VaultKey SDK — Example Usage");
  console.log("=".repeat(60));

  const { evmWallet, solWallet } = await createWallets();
  await listWallets("user_123");
  await checkBalances(evmWallet.id, solWallet.id);
  await signMessages(evmWallet.id, solWallet.id);
  await stablecoinTransfer(evmWallet.id);
  await sweep(evmWallet.id, solWallet.id);
  await listChains();

  console.log("\n✓ All examples completed.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});