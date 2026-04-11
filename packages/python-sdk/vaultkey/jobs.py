"""Jobs resource — poll async operation status."""
from __future__ import annotations

from typing import Optional, Tuple

from .types import APIError, Job


class Jobs:
    """Poll the status of async operations (signing, sweeps).

    Most VaultKey operations that touch the chain are asynchronous and
    return a ``job_id``. Use this resource to check status until
    ``"completed"`` or ``"failed"``.

    Example
    -------
    ```python
    import time

    job, _ = vk.wallets.signing.evm_message("wallet_id", {"payload": {...}})

    while True:
        result, err = vk.jobs.get(job["job_id"])
        if result["status"] in ("completed", "failed"):
            break
        time.sleep(1)
    ```
    """

    def __init__(self, client: "VaultKey") -> None:
        self._client = client

    def get(self, job_id: str) -> Tuple[Optional[Job], Optional[APIError]]:
        """Retrieve the current state of an async job.

        Parameters
        ----------
        job_id:
            The job ID returned by a signing, sweep, or transfer call.
        """
        data, err = self._client.get(f"/jobs/{job_id}")
        return data, err  # type: ignore[return-value]


from .vaultkey import VaultKey  # noqa: E402