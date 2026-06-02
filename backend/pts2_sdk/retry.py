"""Retry configuration for HTTP transport."""

from __future__ import annotations

import logging

from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

LOGGER = logging.getLogger("pts2_sdk.retry")


def build_retry(total: int, backoff_factor: float = 0.3) -> Retry:
    """Create a retry policy for jsonPTS POST calls."""

    retries = max(0, int(total))
    if retries == 0:
        LOGGER.debug("HTTP retries disabled")

    return Retry(
        total=retries,
        connect=retries,
        read=retries,
        status=retries,
        backoff_factor=backoff_factor,
        status_forcelist=(408, 429, 500, 502, 503, 504),
        allowed_methods=frozenset({"POST"}),
        raise_on_status=False,
    )


def build_retry_adapter(total: int, backoff_factor: float = 0.3) -> HTTPAdapter:
    return HTTPAdapter(max_retries=build_retry(total=total, backoff_factor=backoff_factor))
