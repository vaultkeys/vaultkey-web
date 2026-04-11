"""
VaultKey SDK — Example Usage

Run with:
    VAULTKEY_API_KEY=vk_live_... VAULTKEY_API_SECRET=... python examples/usage.py

Make sure VAULTKEY_API_KEY and VAULTKEY_API_SECRET are set in your environment.
"""

import time
import os

from vaultkey import VaultKey, VaultKeyHTTPError

vk = VaultKey(
    api_key=os.environ["VAULTKEY_API_KEY"],
    api_secret=os.environ["VAULTKEY_API_SECRET"],
)


# ---------------------------------------------------------------------------
# Helper: poll a job until completed or failed
# ---------------------------------------------------------------------------

def poll_job(job_id: str, interval: float = 1.0):
    print(f"  Polling job {job_id}...")
    while True:
        result, err = vk.jobs.get(job_id)
        if err:
            raise Exception(f"Job poll failed: {err['message']}")
        print(f"  status: {result['status']}")
        if result["status"] == "completed":
            return result
        if result["status"] == "failed":
            raise Exception(f"Job failed: {result.get('error', 'unknown reason')}")
        time.sleep(interval)


# ---------------------------------------------------------------------------
# 1. Create wallets
# ---------------------------------------------------------------------------

def create_wallets():
    print("\n── Create Wallets ──────────────────────────────────────────")

    evm_wallet, err = vk.wallets.create({
        "user_id": "user_123",
        "chain_type": "evm",
        "label": "Primary EVM wallet",
    })
    if err:
        raise Exception(err["message"])
    print(f"EVM wallet created: {evm_wallet['id']}  {evm_wallet['address']}")

    sol_wallet, err = vk.wallets.create({
        "user_id": "user_123",
        "chain_type": "solana",
    })
    if err:
        raise Exception(err["message"])
    print(f"Solana wallet created: {sol_wallet['id']}  {sol_wallet['address']}")

    return evm_wallet, sol_wallet


# ---------------------------------------------------------------------------
# 2. List wallets for a user
# ---------------------------------------------------------------------------

def list_wallets(user_id: str):
    print("\n── List Wallets ────────────────────────────────────────────")

    result, err = vk.wallets.list_by_user(user_id)
    if err:
        raise Exception(err["message"])

    print(f"Found {len(result['wallets'])} wallet(s) for user {user_id}")
    for w in result["wallets"]:
        print(f"  {w['id']}  {w['chain_type']}  {w['address']}")

    if result["has_more"]:
        print("  (more pages available — use result['next_cursor'] to fetch)")


# ---------------------------------------------------------------------------
# 3. Check balances
# ---------------------------------------------------------------------------

def check_balances(evm_wallet_id: str, sol_wallet_id: str):
    print("\n── Balances ────────────────────────────────────────────────")

    # EVM — prefer chain name over chain ID
    evm_bal, err = vk.wallets.evm_balance(evm_wallet_id, chain_name="base-sepolia")
    if err:
        raise Exception(err["message"])
    print(f"EVM balance: {evm_bal['balance']} {evm_bal['symbol']} on {evm_bal['chain_name']}")

    # Solana
    sol_bal, err = vk.wallets.solana_balance(sol_wallet_id)
    if err:
        raise Exception(err["message"])
    print(f"Solana balance: {sol_bal['balance']} {sol_bal['symbol']}")


# ---------------------------------------------------------------------------
# 4. Sign messages
# ---------------------------------------------------------------------------

def sign_messages(evm_wallet_id: str, sol_wallet_id: str):
    print("\n── Sign Messages ───────────────────────────────────────────")

    # EVM message signing
    evm_job, err = vk.wallets.signing.evm_message(
        evm_wallet_id,
        {
            "payload": {"message": "Hello from VaultKey"},
            "idempotency_key": "sign-evm-001",
        },
    )
    if err:
        raise Exception(err["message"])
    print(f"EVM sign job created: {evm_job['job_id']}")
    evm_result = poll_job(evm_job["job_id"])
    print(f"EVM sign result: {evm_result.get('result')}")

    # Solana message signing
    sol_job, err = vk.wallets.signing.solana_message(
        sol_wallet_id,
        {"payload": {"data": "SGVsbG8gZnJvbSBWYXVsdEtleQ=="}},
    )
    if err:
        raise Exception(err["message"])
    print(f"Solana sign job created: {sol_job['job_id']}")
    poll_job(sol_job["job_id"])


# ---------------------------------------------------------------------------
# 5. Stablecoin transfer
# ---------------------------------------------------------------------------

def stablecoin_transfer(evm_wallet_id: str):
    print("\n── Stablecoin Transfer ─────────────────────────────────────")

    # EVM USDC transfer (gasless — relayer pays gas)
    result, err = vk.stablecoin.transfer(evm_wallet_id, {
        "token": "usdc",
        "to": "0xRecipientAddress",
        "amount": "10.00",
        "chain_type": "evm",
        "chain_name": "base-sepolia",
        "gasless": True,
        "speed": "normal",
        "idempotency_key": "transfer-usdc-001",
    })
    if err:
        raise Exception(err["message"])
    print(f"Transfer job created: {result['job_id']}")
    poll_job(result["job_id"])

    # Check balance after
    bal, _ = vk.stablecoin.balance(evm_wallet_id, {
        "token": "usdc",
        "chain_type": "evm",
        "chain_name": "base-sepolia",
    })
    print(f"USDC balance after transfer: {bal['balance']} {bal['symbol']}")


# ---------------------------------------------------------------------------
# 6. Sweep
# ---------------------------------------------------------------------------

def sweep(evm_wallet_id: str, sol_wallet_id: str):
    print("\n── Sweep ───────────────────────────────────────────────────")

    # EVM sweep
    evm_job, err = vk.wallets.sweep(
        evm_wallet_id,
        {"chain_type": "evm", "chain_name": "base-sepolia"},
    )
    if err:
        raise Exception(err["message"])
    print(f"EVM sweep job: {evm_job['job_id']}")
    poll_job(evm_job["job_id"])

    # Solana sweep
    sol_job, err = vk.wallets.sweep(sol_wallet_id, {"chain_type": "solana"})
    if err:
        raise Exception(err["message"])
    print(f"Solana sweep job: {sol_job['job_id']}")
    poll_job(sol_job["job_id"])


# ---------------------------------------------------------------------------
# 7. List supported chains
# ---------------------------------------------------------------------------

def list_chains():
    print("\n── Supported Chains ────────────────────────────────────────")

    chains, err = vk.chains.list()
    if err:
        raise Exception(err["message"])

    for c in chains:
        label = "(testnet)" if c.get("testnet") else "(mainnet)"
        print(f"  {c['name']:<20} chain_id={c['chain_id']}  {c['native_symbol']}  {label}")


# ---------------------------------------------------------------------------
# Run all examples
# ---------------------------------------------------------------------------

def main():
    print("VaultKey SDK — Example Usage")
    print("=" * 60)

    try:
        evm_wallet, sol_wallet = create_wallets()
        list_wallets("user_123")
        check_balances(evm_wallet["id"], sol_wallet["id"])
        sign_messages(evm_wallet["id"], sol_wallet["id"])
        stablecoin_transfer(evm_wallet["id"])
        sweep(evm_wallet["id"], sol_wallet["id"])
        list_chains()
        print("\n✓ All examples completed.")
    except VaultKeyHTTPError as e:
        print(f"\nAPI error {e.status_code}: {e.error['message']}")
        raise
    except Exception as e:
        print(f"\nError: {e}")
        raise


if __name__ == "__main__":
    main()