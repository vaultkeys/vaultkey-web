# vaultkey

Official Python SDK for the [VaultKey](https://vaultkey.com) API.

VaultKey lets you create and manage crypto wallets, sign messages and transactions, transfer stablecoins, and sweep funds — all through a simple API.

## Installation

```bash
pip install vaultkey
# or
poetry add vaultkey
```

## Requirements

- Python 3.8+
- A VaultKey API key and secret from your [dashboard](https://app.vaultkey.com)

---

## Quick Start

```python
from vaultkey import VaultKey

vk = VaultKey(api_key="vk_live_...", api_secret="...")

# Create a wallet
wallet, err = vk.wallets.create({"user_id": "user_123", "chain_type": "evm"})

if err:
    print(err["message"])
else:
    print(wallet["address"])  # "0x..."
```

---

## Configuration

```python
vk = VaultKey(
    api_key="vk_live_...",    # or set VAULTKEY_API_KEY env var
    api_secret="...",          # or set VAULTKEY_API_SECRET env var
    base_url="https://...",    # optional — override for self-hosted deployments
    raise_on_error=True,       # default True; set False to return (None, error) tuples
)
```

**API key prefixes:**
- `testnet_` — testnet environment
- `vk_live_` — mainnet / production

The SDK will warn you at construction time if your key prefix does not match the detected environment.

### Error handling modes

```python
# Mode 1 (default): raises VaultKeyHTTPError on non-2xx
from vaultkey import VaultKey, VaultKeyHTTPError

vk = VaultKey(api_key="vk_live_...", api_secret="...")
try:
    wallet, _ = vk.wallets.get("bad_id")
except VaultKeyHTTPError as e:
    print(e.status_code, e.error["message"])

# Mode 2: returns (None, error_dict) instead of raising
vk = VaultKey(api_key="vk_live_...", api_secret="...", raise_on_error=False)
wallet, err = vk.wallets.get("bad_id")
if err:
    print(err["message"])
```

---

## Response Shape

Every method returns a `(data, error)` tuple. Exactly one will be non-None.

```python
wallet, err = vk.wallets.get("wallet_id")
if err:
    print(err["code"], err["message"])
else:
    print(wallet["address"])
```

---

## Wallets

### Create a wallet

```python
wallet, err = vk.wallets.create({
    "user_id": "user_123",
    "chain_type": "evm",   # "evm" | "solana"
    "label": "Primary",    # optional
})
```

### Get a wallet

```python
wallet, err = vk.wallets.get("wallet_id")
```

### List wallets for a user

```python
result, err = vk.wallets.list_by_user("user_123")

# Paginate
if result["has_more"]:
    page2, err = vk.wallets.list_by_user(
        "user_123", after=result["next_cursor"]
    )
```

---

## Signing

Signing operations are **asynchronous**. They return a `job_id` which you poll via `vk.jobs.get()`.

### Sign an EVM message

```python
job, err = vk.wallets.signing.evm_message(
    "wallet_id",
    {
        "payload": {"message": "Hello from VaultKey"},
        "idempotency_key": "unique-key-123",  # optional — safe to retry
    },
)

# Poll until done
result = poll_job(vk, job["job_id"])
```

### Sign a Solana message

```python
job, err = vk.wallets.signing.solana_message(
    "wallet_id",
    {"payload": {"data": "SGVsbG8="}},
)
```

---

## Balances

### EVM balance

```python
# Preferred: use chain name
bal, err = vk.wallets.evm_balance("wallet_id", chain_name="base")

# Fallback: use chain ID
bal, err = vk.wallets.evm_balance("wallet_id", chain_id="8453")

print(bal["balance"])    # "0.05"
print(bal["symbol"])     # "ETH"
print(bal["chain_name"]) # "base"
```

### Solana balance

```python
bal, err = vk.wallets.solana_balance("wallet_id")
print(bal["balance"])  # "1.5"
print(bal["symbol"])   # "SOL"
```

---

## Broadcast

Send a pre-signed transaction to the network.

### EVM

```python
result, err = vk.wallets.broadcast_evm(
    "wallet_id", "0x...", chain_name="base"
)
print(result["tx_hash"])
```

### Solana

```python
result, err = vk.wallets.broadcast_solana("wallet_id", "base58tx...")
print(result["signature"])
```

---

## Sweep

Move all funds from a wallet to the configured master wallet. Async — poll the returned job.

```python
# EVM sweep
job, err = vk.wallets.sweep(
    "wallet_id",
    {"chain_type": "evm", "chain_name": "base"},
)

# Solana sweep
job, err = vk.wallets.sweep("wallet_id", {"chain_type": "solana"})

result = poll_job(vk, job["job_id"])
```

---

## Stablecoin

Transfer USDC or USDT, and check stablecoin balances.

### Transfer

```python
# EVM — gasless (relayer pays gas)
result, err = vk.stablecoin.transfer("wallet_id", {
    "token": "usdc",
    "to": "0xRecipient",
    "amount": "50.00",
    "chain_type": "evm",
    "chain_name": "base",
    "gasless": True,
    "speed": "fast",             # "slow" | "normal" | "fast"
    "idempotency_key": "tx-001", # optional — prevents double sends on retry
})

# Solana — omit chain fields
result, err = vk.stablecoin.transfer("wallet_id", {
    "token": "usdc",
    "to": "RecipientBase58...",
    "amount": "50.00",
    "chain_type": "solana",
})

# Poll the async job
final = poll_job(vk, result["job_id"])
```

### Balance

```python
bal, err = vk.stablecoin.balance("wallet_id", {
    "token": "usdc",
    "chain_type": "evm",
    "chain_name": "polygon",
})
print(bal["balance"])  # "50.00"
```

---

## Jobs

Poll the status of any async operation.

```python
result, err = vk.jobs.get("job_id")
# result["status"]: "pending" | "processing" | "completed" | "failed"
```

### Polling helper

```python
import time

def poll_job(vk, job_id: str, interval: float = 1.0):
    while True:
        result, err = vk.jobs.get(job_id)
        if err:
            raise Exception(err["message"])
        if result["status"] == "completed":
            return result
        if result["status"] == "failed":
            raise Exception(result.get("error", "Job failed"))
        time.sleep(interval)
```

---

## Chains

Discover supported chains for the current environment.

```python
chains, err = vk.chains.list()
for chain in chains:
    print(chain["name"], chain["chain_id"])
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
| `vk.wallets` | `create`, `get`, `list_by_user`, `evm_balance`, `solana_balance`, `broadcast_evm`, `broadcast_solana`, `sweep` |
| `vk.wallets.signing` | `evm_message`, `solana_message` |
| `vk.stablecoin` | `transfer`, `balance` |
| `vk.jobs` | `get` |
| `vk.chains` | `list` |