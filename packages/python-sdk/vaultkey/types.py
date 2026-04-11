"""TypedDict models for the VaultKey API.

Lightweight, Pydantic-free types for editor autocomplete and static checks.
At runtime these are plain dicts — no validation overhead.
"""
from __future__ import annotations

from typing import Dict, List, Literal, Optional, Union
from typing_extensions import NotRequired, Required, TypedDict

# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------


class APIError(TypedDict):
    code: str
    message: str


# ---------------------------------------------------------------------------
# Chains
# ---------------------------------------------------------------------------

ChainType = Literal["evm", "solana"]

#: Supported EVM chain names.
#: Mainnets:  ethereum, polygon, arbitrum, base, optimism,
#:            avalanche, bsc, linea, scroll, zksync
#: Testnets:  sepolia, amoy, arbitrum-sepolia, base-sepolia,
#:            optimism-sepolia, avalanche-fuji, bsc-testnet, zksync-sepolia
ChainName = Literal[
    # Mainnets
    "ethereum", "polygon", "arbitrum", "base", "optimism",
    "avalanche", "bsc", "linea", "scroll", "zksync",
    # Testnets
    "sepolia", "amoy", "arbitrum-sepolia", "base-sepolia",
    "optimism-sepolia", "avalanche-fuji", "bsc-testnet", "zksync-sepolia",
]


class Chain(TypedDict, total=False):
    name: str
    chain_id: str
    native_symbol: str
    legacy_symbol: Optional[str]
    testnet: bool


# ---------------------------------------------------------------------------
# Wallets
# ---------------------------------------------------------------------------


class Wallet(TypedDict, total=False):
    id: str
    user_id: str
    chain_type: ChainType
    address: str
    label: Optional[str]
    created_at: str


class WalletCreate(TypedDict, total=False):
    user_id: Required[str]
    chain_type: Required[ChainType]
    label: NotRequired[str]


class WalletList(TypedDict):
    wallets: List[Wallet]
    next_cursor: Optional[str]
    has_more: bool


# ---------------------------------------------------------------------------
# Signing
# ---------------------------------------------------------------------------

JobStatus = Literal["pending", "processing", "completed", "failed"]


class SigningJob(TypedDict, total=False):
    job_id: str
    status: JobStatus


class SignEVMMessageParams(TypedDict, total=False):
    payload: Required[Dict]
    idempotency_key: NotRequired[str]


class SignSolanaMessageParams(TypedDict, total=False):
    payload: Required[Dict]
    idempotency_key: NotRequired[str]


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------


class Job(TypedDict, total=False):
    id: str
    status: JobStatus
    operation: str
    result: Optional[object]
    error: Optional[str]
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Balance
# ---------------------------------------------------------------------------


class EVMBalance(TypedDict, total=False):
    address: str
    balance: str
    raw_balance: str
    symbol: str
    chain_name: str
    chain_id: str


class SolanaBalance(TypedDict, total=False):
    address: str
    balance: str
    raw_balance: str
    symbol: Literal["SOL"]


# ---------------------------------------------------------------------------
# Broadcast
# ---------------------------------------------------------------------------


class BroadcastEVMResult(TypedDict, total=False):
    tx_hash: str
    chain_name: str
    chain_id: str


class BroadcastSolanaResult(TypedDict, total=False):
    signature: str


# ---------------------------------------------------------------------------
# Sweep
# ---------------------------------------------------------------------------


class SweepParams(TypedDict, total=False):
    chain_type: Required[ChainType]
    chain_name: NotRequired[str]
    chain_id: NotRequired[str]


# ---------------------------------------------------------------------------
# Stablecoin
# ---------------------------------------------------------------------------

StablecoinToken = Literal["usdc", "usdt"]
TransferSpeed = Literal["slow", "normal", "fast"]


class StablecoinTransferParams(TypedDict, total=False):
    token: Required[StablecoinToken]
    to: Required[str]
    amount: Required[str]
    chain_type: Required[ChainType]
    chain_name: NotRequired[str]
    chain_id: NotRequired[str]
    gasless: NotRequired[bool]
    speed: NotRequired[TransferSpeed]
    idempotency_key: NotRequired[str]


class StablecoinTransferResult(TypedDict, total=False):
    job_id: str
    status: str


class StablecoinBalanceParams(TypedDict, total=False):
    token: Required[StablecoinToken]
    chain_type: Required[ChainType]
    chain_name: NotRequired[str]
    chain_id: NotRequired[str]


class StablecoinBalanceResult(TypedDict, total=False):
    address: str
    token: str
    symbol: str
    balance: str
    raw_balance: str
    chain_id: Optional[str]