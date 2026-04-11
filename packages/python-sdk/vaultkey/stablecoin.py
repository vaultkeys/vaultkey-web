"""Stablecoin resource — transfer and balance for USDC/USDT."""
from __future__ import annotations

from typing import Dict, Optional, Tuple

from .types import (
    APIError,
    StablecoinBalanceParams,
    StablecoinBalanceResult,
    StablecoinTransferParams,
    StablecoinTransferResult,
)


class Stablecoin:
    """Stablecoin transfers and balance lookups (USDC, USDT).

    Supports EVM chains and Solana.

    Example
    -------
    ```python
    # Transfer USDC on Base
    result, err = vk.stablecoin.transfer("wallet_id", {
        "token": "usdc",
        "to": "0xRecipient",
        "amount": "50.00",
        "chain_type": "evm",
        "chain_name": "base",
        "gasless": True,
    })

    # Check USDC balance on Polygon
    bal, err = vk.stablecoin.balance("wallet_id", {
        "token": "usdc",
        "chain_type": "evm",
        "chain_name": "polygon",
    })
    print(bal["balance"])  # "50.00"
    ```
    """

    def __init__(self, client: "VaultKey") -> None:
        self._client = client

    def transfer(
        self,
        wallet_id: str,
        params: StablecoinTransferParams,
    ) -> Tuple[Optional[StablecoinTransferResult], Optional[APIError]]:
        """Transfer a stablecoin from a wallet.

        - For EVM: provide ``chain_name`` (preferred) or ``chain_id``.
        - For Solana: omit both chain fields (server rejects them if present).
        - Use ``idempotency_key`` to safely retry without double-sending.
        - Operation is async — poll ``vk.jobs.get(result["job_id"])``.

        Parameters
        ----------
        wallet_id:
            The source wallet.
        params:
            Transfer parameters. See :class:`~vaultkey.types.StablecoinTransferParams`.
        """
        body: Dict = {
            "token": params["token"],
            "to": params["to"],
            "amount": params["amount"],
        }

        chain_type = params["chain_type"]

        if chain_type == "evm":
            # chain_name takes precedence — mirrors Go handler logic
            if params.get("chain_name"):
                body["chain_name"] = params["chain_name"]
            elif params.get("chain_id"):
                body["chain_id"] = params["chain_id"]
        # Solana: chain fields must NOT be sent — server returns 400 if they are

        if params.get("gasless") is not None:
            body["gasless"] = params["gasless"]
        if params.get("speed"):
            body["speed"] = params["speed"]
        if params.get("idempotency_key"):
            body["idempotency_key"] = params["idempotency_key"]

        data, err = self._client.post(
            f"/wallets/{wallet_id}/stablecoin/transfer/{chain_type}", body
        )
        return data, err  # type: ignore[return-value]

    def balance(
        self,
        wallet_id: str,
        params: StablecoinBalanceParams,
    ) -> Tuple[Optional[StablecoinBalanceResult], Optional[APIError]]:
        """Get the stablecoin balance for a wallet.

        - For EVM: provide ``chain_name`` (preferred) or ``chain_id``.
        - For Solana: omit both chain fields.

        Parameters
        ----------
        wallet_id:
            The wallet to check.
        params:
            Balance query parameters. See :class:`~vaultkey.types.StablecoinBalanceParams`.
        """
        chain_type = params["chain_type"]
        query: Dict[str, str] = {"token": params["token"]}

        if chain_type == "evm":
            if params.get("chain_name"):
                query["chain_name"] = params["chain_name"]
            elif params.get("chain_id"):
                query["chain_id"] = params["chain_id"]

        data, err = self._client.get(
            f"/wallets/{wallet_id}/stablecoin/balance/{chain_type}",
            params=query,
        )
        return data, err  # type: ignore[return-value]


from .vaultkey import VaultKey  # noqa: E402