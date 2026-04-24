"""Core client for the VaultKey API."""
from __future__ import annotations

import os
from typing import Any, Dict, Optional, Tuple

import requests


DEFAULT_BASE_URL = "https://app.vaultkeys.com"  # kept for self-hosted override fallback
MAINNET_BASE_URL = "https://app.vaultkeys.com"
TESTNET_BASE_URL = "https://testnet.vaultkeys.com"


def _resolve_base_url(api_key: str, override: Optional[str] = None) -> str:
    """Resolve the correct base URL from the API key prefix.

    - ``testnet_`` keys  → https://testnet.vaultkeys.com
    - ``vk_live_`` keys  → https://app.vaultkeys.com
    - explicit ``base_url`` override always wins.
    """
    if override:
        return override
    return TESTNET_BASE_URL if api_key.startswith("testnet_") else MAINNET_BASE_URL


class VaultKeyHTTPError(Exception):
    """Raised when ``raise_on_error=True`` and a request returns a non-2xx response."""

    def __init__(self, status_code: int, error: Dict[str, Any], method: str, path: str) -> None:
        self.status_code = status_code
        self.error = error
        self.method = method
        self.path = path
        super().__init__(self.__str__())

    def __str__(self) -> str:
        code = self.error.get("code", "UNKNOWN_ERROR")
        message = self.error.get("message", "")
        return f"{self.method} {self.path} -> {self.status_code} {code}: {message}"


class VaultKey:
    """VaultKey API client.

    Parameters
    ----------
    api_key:
        Your VaultKey API key. Testnet keys start with ``testnet_``,
        live keys start with ``vk_live_``. Falls back to the
        ``VAULTKEY_API_KEY`` environment variable.

        The SDK automatically routes requests to the correct endpoint:

        - ``testnet_`` → https://testnet.getvaultkey.com
        - ``vk_live_`` → https://app.getvaultkey.com
    api_secret:
        Your VaultKey API secret. Falls back to ``VAULTKEY_API_SECRET``.
    base_url:
        Override the base URL (e.g. for self-hosted deployments).
    raise_on_error:
        When ``True`` (default), raise :class:`VaultKeyHTTPError` on non-2xx.
        When ``False``, return ``(None, error_dict)`` instead.
    session:
        Optional ``requests.Session`` for connection reuse and custom config.

    Example
    -------
    ```python
    from vaultkey import VaultKey

    vk = VaultKey(api_key="vk_live_...", api_secret="...")

    # Create a wallet
    wallet, err = vk.wallets.create({"user_id": "user_123", "chain_type": "evm"})

    # Sign a message (async — returns a job)
    job, err = vk.wallets.signing.evm_message("wallet_id", {"payload": {"message": "Hello"}})

    # Poll until done
    result, err = vk.jobs.get(job["job_id"])
    ```
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        base_url: Optional[str] = None,
        *,
        raise_on_error: bool = True,
        session: Optional[requests.Session] = None,
    ) -> None:
        self.api_key = api_key or os.getenv("VAULTKEY_API_KEY")
        self.api_secret = api_secret or os.getenv("VAULTKEY_API_SECRET")

        if not self.api_key:
            raise ValueError(
                "Missing API key. Pass it to VaultKey(api_key='vk_live_...') "
                "or set the VAULTKEY_API_KEY environment variable."
            )
        if not self.api_secret:
            raise ValueError(
                "Missing API secret. Pass it to VaultKey(api_secret='...') "
                "or set the VAULTKEY_API_SECRET environment variable."
            )

        resolved_base = _resolve_base_url(self.api_key, base_url or os.getenv("VAULTKEY_BASE_URL"))
        self.url = f"{resolved_base}/api/v1/sdk"

        self.raise_on_error = raise_on_error
        self._session = session or requests.Session()

        # Resource clients
        self.wallets = Wallets(self)
        self.jobs = Jobs(self)
        self.stablecoin = Stablecoin(self)
        self.chains = Chains(self)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _headers(self, extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        headers = {
            "X-API-Key": self.api_key,
            "X-API-Secret": self.api_secret,
            "Content-Type": "application/json",
        }
        if extra:
            headers.update({k: v for k, v in extra.items() if v is not None})
        return headers

    def _request(
        self,
        method: str,
        path: str,
        json: Optional[Any] = None,
        params: Optional[Dict[str, str]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        resp = self._session.request(
            method,
            f"{self.url}{path}",
            headers=self._headers(headers),
            json=json,
            params=params,
        )
        default_error: Dict[str, Any] = {
            "code": "INTERNAL_SERVER_ERROR",
            "message": resp.reason,
        }

        if not resp.ok:
            try:
                body = resp.json()
                # Handle { "error": { "code": ..., "message": ... } }
                if isinstance(body.get("error"), dict):
                    error = body["error"]
                # Handle { "error": "some string" }
                elif isinstance(body.get("error"), str):
                    error = {"code": str(resp.status_code), "message": body["error"]}
                else:
                    error = default_error
            except Exception:
                error = default_error

            if self.raise_on_error:
                raise VaultKeyHTTPError(resp.status_code, error, method, path)
            return None, error

        try:
            return resp.json(), None
        except Exception:
            return None, default_error

    def post(self, path: str, body: Any, headers: Optional[Dict[str, str]] = None) -> Tuple[Optional[Any], Optional[Any]]:
        return self._request("POST", path, json=body, headers=headers)

    def get(self, path: str, params: Optional[Dict[str, str]] = None, headers: Optional[Dict[str, str]] = None) -> Tuple[Optional[Any], Optional[Any]]:
        return self._request("GET", path, params=params, headers=headers)

    def put(self, path: str, body: Any, headers: Optional[Dict[str, str]] = None) -> Tuple[Optional[Any], Optional[Any]]:
        return self._request("PUT", path, json=body, headers=headers)

    def patch(self, path: str, body: Any, headers: Optional[Dict[str, str]] = None) -> Tuple[Optional[Any], Optional[Any]]:
        return self._request("PATCH", path, json=body, headers=headers)

    def delete(self, path: str, body: Optional[Any] = None, headers: Optional[Dict[str, str]] = None) -> Tuple[Optional[Any], Optional[Any]]:
        return self._request("DELETE", path, json=body, headers=headers)


from .wallets import Wallets      # noqa: E402
from .jobs import Jobs            # noqa: E402
from .stablecoin import Stablecoin  # noqa: E402
from .chains import Chains        # noqa: E402