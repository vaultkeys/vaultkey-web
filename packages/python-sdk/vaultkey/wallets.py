"""Wallets resource — create, retrieve, sign, balance, broadcast, sweep."""
from __future__ import annotations

from typing import Dict, Optional, Tuple

from .signing import Signing
from .types import (
    APIError,
    BroadcastEVMResult,
    BroadcastSolanaResult,
    EVMBalance,
    SigningJob,
    SolanaBalance,
    SweepParams,
    Wallet,
    WalletCreate,
    WalletList,
)


class Wallets:
    """Wallet management and operations.

    Example
    -------
    ```python
    vk = VaultKey(api_key="vk_live_...", api_secret="...")

    # Create
    wallet, err = vk.wallets.create({"user_id": "user_123", "chain_type": "evm"})

    # Get
    wallet, err = vk.wallets.get("wallet_id")

    # List by user
    result, err = vk.wallets.list_by_user("user_123")

    # Sign
    job, err = vk.wallets.signing.evm_message("wallet_id", {"payload": {...}})

    # Balance
    bal, err = vk.wallets.evm_balance("wallet_id", chain_name="base")

    # Broadcast
    result, err = vk.wallets.broadcast_evm("wallet_id", "0x...", chain_name="base")

    # Sweep
    job, err = vk.wallets.sweep("wallet_id", {"chain_type": "evm", "chain_name": "base"})
    ```
    """

    def __init__(self, client: "VaultKey") -> None:
        self._client = client
        self.signing = Signing(client)

    def create(
        self, params: WalletCreate
    ) -> Tuple[Optional[Wallet], Optional[APIError]]:
        """Create a new wallet for a user.

        Parameters
        ----------
        params:
            Dict with ``user_id`` (required), ``chain_type`` (required,
            ``"evm"`` or ``"solana"``), and optional ``label``.
        """
        body: Dict = {
            "user_id": params["user_id"],
            "chain_type": params["chain_type"],
        }
        if params.get("label"):
            body["label"] = params["label"]

        data, err = self._client.post("/wallets", body)
        return data, err  # type: ignore[return-value]

    def get(self, wallet_id: str) -> Tuple[Optional[Wallet], Optional[APIError]]:
        """Retrieve a wallet by its ID."""
        data, err = self._client.get(f"/wallets/{wallet_id}")
        return data, err  # type: ignore[return-value]

    def list_by_user(
        self,
        user_id: str,
        *,
        after: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Tuple[Optional[WalletList], Optional[APIError]]:
        """List all wallets for a user. Results are paginated.

        Parameters
        ----------
        user_id:
            The user whose wallets to list.
        after:
            Cursor from the previous page's ``next_cursor`` field.
        limit:
            Number of results per page.

        Example
        -------
        ```python
        result, err = vk.wallets.list_by_user("user_123")
        if result["has_more"]:
            page2, err = vk.wallets.list_by_user(
                "user_123", after=result["next_cursor"]
            )
        ```
        """
        params: Dict[str, str] = {}
        if after:
            params["after"] = after
        if limit is not None:
            params["limit"] = str(limit)

        data, err = self._client.get(f"/users/{user_id}/wallets", params=params or None)
        return data, err  # type: ignore[return-value]

    def evm_balance(
        self,
        wallet_id: str,
        *,
        chain_name: Optional[str] = None,
        chain_id: Optional[str] = None,
    ) -> Tuple[Optional[EVMBalance], Optional[APIError]]:
        """Get the native token balance for an EVM wallet.

        Provide ``chain_name`` (preferred) or ``chain_id``.
        ``chain_name`` takes precedence if both are supplied.

        Example
        -------
        ```python
        bal, err = vk.wallets.evm_balance("wallet_id", chain_name="base")
        print(bal["balance"])  # "0.05"
        ```
        """
        params: Dict[str, str] = {}
        if chain_name:
            params["chain_name"] = chain_name
        elif chain_id:
            params["chain_id"] = chain_id

        data, err = self._client.get(
            f"/wallets/{wallet_id}/balance/evm", params=params or None
        )
        return data, err  # type: ignore[return-value]

    def solana_balance(
        self, wallet_id: str
    ) -> Tuple[Optional[EVMBalance], Optional[APIError]]:
        """Get the SOL balance for a Solana wallet.

        Example
        -------
        ```python
        bal, err = vk.wallets.solana_balance("wallet_id")
        print(bal["balance"])  # "1.5"
        ```
        """
        data, err = self._client.get(f"/wallets/{wallet_id}/balance/solana")
        return data, err  # type: ignore[return-value]

    def broadcast_evm(
        self,
        wallet_id: str,
        signed_tx: str,
        *,
        chain_name: Optional[str] = None,
        chain_id: Optional[str] = None,
    ) -> Tuple[Optional[BroadcastEVMResult], Optional[APIError]]:
        """Broadcast a pre-signed EVM transaction.

        Provide ``chain_name`` (preferred) or ``chain_id``.

        Example
        -------
        ```python
        result, err = vk.wallets.broadcast_evm(
            "wallet_id", "0x...", chain_name="base"
        )
        print(result["tx_hash"])
        ```
        """
        body: Dict = {"signed_tx": signed_tx}
        if chain_name:
            body["chain_name"] = chain_name
        elif chain_id:
            body["chain_id"] = chain_id

        data, err = self._client.post(f"/wallets/{wallet_id}/broadcast", body)
        return data, err  # type: ignore[return-value]

    def broadcast_solana(
        self,
        wallet_id: str,
        signed_tx: str,
    ) -> Tuple[Optional[BroadcastSolanaResult], Optional[APIError]]:
        """Broadcast a pre-signed Solana transaction.

        Example
        -------
        ```python
        result, err = vk.wallets.broadcast_solana("wallet_id", "base58tx...")
        print(result["signature"])
        ```
        """
        data, err = self._client.post(
            f"/wallets/{wallet_id}/broadcast", {"signed_tx": signed_tx}
        )
        return data, err  # type: ignore[return-value]

    def sweep(
        self,
        wallet_id: str,
        params: SweepParams,
    ) -> Tuple[Optional[SigningJob], Optional[APIError]]:
        """Trigger a sweep — move all funds to the configured master wallet.

        The operation is async. Poll ``vk.jobs.get(job_id)`` for the result.

        Parameters
        ----------
        wallet_id:
            The wallet to sweep from.
        params:
            Dict with ``chain_type`` (required). For EVM, provide
            ``chain_name`` (preferred) or ``chain_id``.

        Example
        -------
        ```python
        # EVM sweep
        job, err = vk.wallets.sweep(
            "wallet_id",
            {"chain_type": "evm", "chain_name": "base"},
        )

        # Solana sweep
        job, err = vk.wallets.sweep("wallet_id", {"chain_type": "solana"})
        ```
        """
        body: Dict = {"chain_type": params["chain_type"]}

        if params["chain_type"] == "evm":
            # chain_name takes precedence — mirrors Go resolveEVMChain logic
            if params.get("chain_name"):
                body["chain_name"] = params["chain_name"]
            elif params.get("chain_id"):
                body["chain_id"] = params["chain_id"]

        data, err = self._client.post(f"/wallets/{wallet_id}/sweep", body)
        return data, err  # type: ignore[return-value]


from .vaultkey import VaultKey  # noqa: E402