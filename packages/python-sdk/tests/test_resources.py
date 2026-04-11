"""Tests for the VaultKey Python SDK."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from vaultkey import VaultKey


class MockResponse:
    def __init__(self, payload: Any, ok: bool = True, reason: str = "OK") -> None:
        self._payload = payload
        self.ok = ok
        self.reason = reason
        self.status_code = 200 if ok else 400

    def json(self) -> Any:
        return self._payload


class MockSession:
    def __init__(self, responses: List[MockResponse]) -> None:
        self._responses = responses
        self.calls: List[Dict[str, Any]] = []

    def request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        json: Optional[Any] = None,
        params: Optional[Dict[str, str]] = None,
    ) -> MockResponse:
        self.calls.append({"method": method, "url": url, "headers": headers, "json": json, "params": params})
        return self._responses.pop(0)


def make_client(responses: List[MockResponse]) -> tuple:
    session = MockSession(responses)
    client = VaultKey(api_key="testnet_key", api_secret="secret", session=session)
    return client, session


# ── Wallets ───────────────────────────────────────────────────────────────────

def test_wallet_create_sends_correct_body() -> None:
    client, session = make_client([
        MockResponse({"id": "w_123", "user_id": "u_1", "chain_type": "evm", "address": "0xabc", "created_at": "2026-01-01"})
    ])
    wallet, err = client.wallets.create({"user_id": "u_1", "chain_type": "evm"})

    assert err is None
    assert wallet["id"] == "w_123"
    assert session.calls[0]["method"] == "POST"
    assert session.calls[0]["url"].endswith("/sdk/wallets")
    assert session.calls[0]["json"] == {"user_id": "u_1", "chain_type": "evm"}


def test_wallet_get_uses_correct_path() -> None:
    client, session = make_client([
        MockResponse({"id": "w_abc", "user_id": "u_1", "chain_type": "solana", "address": "9taBf", "created_at": "2026-01-01"})
    ])
    wallet, err = client.wallets.get("w_abc")

    assert err is None
    assert session.calls[0]["method"] == "GET"
    assert session.calls[0]["url"].endswith("/sdk/wallets/w_abc")


def test_wallet_list_by_user_passes_pagination_params() -> None:
    client, session = make_client([
        MockResponse({"wallets": [], "next_cursor": None, "has_more": False})
    ])
    result, err = client.wallets.list_by_user("u_1", after="cursor_abc", limit=10)

    assert err is None
    assert session.calls[0]["params"] == {"after": "cursor_abc", "limit": "10"}
    assert session.calls[0]["url"].endswith("/sdk/users/u_1/wallets")


# ── Signing ───────────────────────────────────────────────────────────────────

def test_signing_evm_message_sends_correct_path_and_body() -> None:
    client, session = make_client([
        MockResponse({"job_id": "job_123", "status": "pending"})
    ])
    job, err = client.wallets.signing.evm_message(
        "w_abc",
        {"payload": {"message": "Hello"}, "idempotency_key": "idem_1"},
    )

    assert err is None
    assert job["job_id"] == "job_123"
    assert session.calls[0]["method"] == "POST"
    assert session.calls[0]["url"].endswith("/sdk/wallets/w_abc/sign/message/evm")
    assert session.calls[0]["json"] == {"payload": {"message": "Hello"}, "idempotency_key": "idem_1"}


def test_signing_solana_message_uses_correct_path() -> None:
    client, session = make_client([
        MockResponse({"job_id": "job_456", "status": "pending"})
    ])
    job, err = client.wallets.signing.solana_message("w_sol", {"payload": {"data": "abc"}})

    assert err is None
    assert session.calls[0]["url"].endswith("/sdk/wallets/w_sol/sign/message/solana")


# ── Balance ───────────────────────────────────────────────────────────────────

def test_evm_balance_prefers_chain_name_over_chain_id() -> None:
    client, session = make_client([
        MockResponse({"address": "0xabc", "balance": "0.05", "raw_balance": "50000000000000000", "symbol": "ETH", "chain_name": "base", "chain_id": "8453"})
    ])
    bal, err = client.wallets.evm_balance("w_abc", chain_name="base", chain_id="8453")

    assert err is None
    # chain_name must take precedence
    assert session.calls[0]["params"] == {"chain_name": "base"}


def test_solana_balance_uses_correct_path() -> None:
    client, session = make_client([
        MockResponse({"address": "9taBf", "balance": "1.5", "raw_balance": "1500000000", "symbol": "SOL"})
    ])
    bal, err = client.wallets.solana_balance("w_sol")

    assert err is None
    assert session.calls[0]["url"].endswith("/sdk/wallets/w_sol/balance/solana")


# ── Sweep ─────────────────────────────────────────────────────────────────────

def test_sweep_evm_sends_chain_name_not_chain_id_when_both_present() -> None:
    client, session = make_client([MockResponse({"job_id": "job_sweep", "status": "pending"})])
    job, err = client.wallets.sweep(
        "w_abc",
        {"chain_type": "evm", "chain_name": "polygon", "chain_id": "137"},
    )

    assert err is None
    body = session.calls[0]["json"]
    assert body["chain_name"] == "polygon"
    assert "chain_id" not in body


def test_sweep_solana_omits_chain_fields() -> None:
    client, session = make_client([MockResponse({"job_id": "job_sol_sweep", "status": "pending"})])
    client.wallets.sweep("w_sol", {"chain_type": "solana"})

    body = session.calls[0]["json"]
    assert body == {"chain_type": "solana"}


# ── Stablecoin ────────────────────────────────────────────────────────────────

def test_stablecoin_transfer_evm_prefers_chain_name() -> None:
    client, session = make_client([MockResponse({"job_id": "job_stbl", "status": "pending"})])
    client.stablecoin.transfer("w_abc", {
        "token": "usdc",
        "to": "0xRecipient",
        "amount": "50.00",
        "chain_type": "evm",
        "chain_name": "base",
        "chain_id": "8453",
        "gasless": True,
    })

    body = session.calls[0]["json"]
    assert "chain_name" in body
    assert "chain_id" not in body
    assert body["gasless"] is True


def test_stablecoin_transfer_solana_omits_chain_fields() -> None:
    client, session = make_client([MockResponse({"job_id": "job_sol_stbl", "status": "pending"})])
    client.stablecoin.transfer("w_sol", {
        "token": "usdc",
        "to": "RecipientBase58",
        "amount": "100.00",
        "chain_type": "solana",
    })

    body = session.calls[0]["json"]
    assert "chain_name" not in body
    assert "chain_id" not in body
    assert session.calls[0]["url"].endswith("/sdk/wallets/w_sol/stablecoin/transfer/solana")


def test_stablecoin_balance_passes_token_and_chain_as_query_params() -> None:
    client, session = make_client([MockResponse({"balance": "50.00"})])
    client.stablecoin.balance("w_abc", {
        "token": "usdt",
        "chain_type": "evm",
        "chain_name": "polygon",
    })

    assert session.calls[0]["params"] == {"token": "usdt", "chain_name": "polygon"}


# ── Jobs ──────────────────────────────────────────────────────────────────────

def test_jobs_get_uses_correct_path() -> None:
    client, session = make_client([MockResponse({"id": "job_123", "status": "completed"})])
    result, err = client.jobs.get("job_123")

    assert err is None
    assert result["status"] == "completed"
    assert session.calls[0]["url"].endswith("/sdk/jobs/job_123")


# ── Chains ────────────────────────────────────────────────────────────────────

def test_chains_list_uses_correct_path() -> None:
    client, session = make_client([MockResponse([{"name": "base", "chain_id": "8453"}])])
    chains, err = client.chains.list()

    assert err is None
    assert chains[0]["name"] == "base"
    assert session.calls[0]["url"].endswith("/sdk/chains")


# ── Auth headers ──────────────────────────────────────────────────────────────

def test_requests_include_api_key_and_secret_headers() -> None:
    client, session = make_client([MockResponse({"id": "w_123", "user_id": "u_1", "chain_type": "evm", "address": "0xabc", "created_at": "2026-01-01"})])
    client.wallets.get("w_123")

    headers = session.calls[0]["headers"]
    assert headers["X-API-Key"] == "testnet_key"
    assert headers["X-API-Secret"] == "secret"


# ── Error handling ────────────────────────────────────────────────────────────

def test_raise_on_error_false_returns_error_dict_instead_of_raising() -> None:
    session = MockSession([MockResponse({"error": "wallet not found"}, ok=False)])
    client = VaultKey(api_key="testnet_key", api_secret="secret", raise_on_error=False, session=session)

    data, err = client.wallets.get("bad_id")
    assert data is None
    assert err is not None
    assert err["message"] == "wallet not found"