"""Chains resource — discover supported EVM chains."""
from __future__ import annotations

from typing import List, Optional, Tuple

from .types import APIError, Chain


class Chains:
    """List supported EVM chains for the current environment.

    The chains returned depend on your API key — testnet keys return
    testnets, live keys return mainnets.

    Example
    -------
    ```python
    chains, err = vk.chains.list()
    for chain in chains:
        print(chain["name"], chain["chain_id"])
    ```
    """

    def __init__(self, client: "VaultKey") -> None:
        self._client = client

    def list(self) -> Tuple[Optional[List[Chain]], Optional[APIError]]:
        """List all supported chains for the current environment."""
        data, err = self._client.get("/chains")
        return data, err  # type: ignore[return-value]


from .vaultkey import VaultKey  # noqa: E402