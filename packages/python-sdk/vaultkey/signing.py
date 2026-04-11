"""Signing sub-resource — sign EVM and Solana messages."""
from __future__ import annotations

from typing import Optional, Tuple

from .types import APIError, SigningJob


class Signing:
    """Sign EVM and Solana messages for a specific wallet.

    All signing operations are asynchronous — they return a ``job_id``
    which you poll via ``vk.jobs.get(job_id)`` until status is
    ``"completed"`` or ``"failed"``.

    Access via ``vk.wallets.signing``.

    Example
    -------
    ```python
    job, err = vk.wallets.signing.evm_message(
        "wallet_id",
        {"payload": {"message": "Hello from VaultKey"}},
    )
    # Poll
    result, err = vk.jobs.get(job["job_id"])
    ```
    """

    def __init__(self, client: "VaultKey") -> None:
        self._client = client

    def evm_message(
        self,
        wallet_id: str,
        params: dict,
    ) -> Tuple[Optional[SigningJob], Optional[APIError]]:
        """Sign an EVM message or typed data (EIP-712).

        Parameters
        ----------
        wallet_id:
            The wallet to sign with.
        params:
            Dict with ``payload`` (required) and optional ``idempotency_key``.

        Returns
        -------
        (SigningJob, None) on success, (None, APIError) on failure.
        """
        body = {"payload": params["payload"]}
        if params.get("idempotency_key"):
            body["idempotency_key"] = params["idempotency_key"]

        data, err = self._client.post(
            f"/wallets/{wallet_id}/sign/message/evm", body
        )
        return data, err  # type: ignore[return-value]

    def solana_message(
        self,
        wallet_id: str,
        params: dict,
    ) -> Tuple[Optional[SigningJob], Optional[APIError]]:
        """Sign a Solana message.

        Parameters
        ----------
        wallet_id:
            The wallet to sign with.
        params:
            Dict with ``payload`` (required) and optional ``idempotency_key``.

        Returns
        -------
        (SigningJob, None) on success, (None, APIError) on failure.
        """
        body = {"payload": params["payload"]}
        if params.get("idempotency_key"):
            body["idempotency_key"] = params["idempotency_key"]

        data, err = self._client.post(
            f"/wallets/{wallet_id}/sign/message/solana", body
        )
        return data, err  # type: ignore[return-value]


from .vaultkey import VaultKey  # noqa: E402