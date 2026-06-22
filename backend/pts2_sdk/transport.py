"""HTTP transport for jsonPTS over HTTP/HTTPS."""

from __future__ import annotations

import logging
import json
from collections.abc import Mapping
from typing import Any

import requests
import urllib3
from requests import Session
from requests.exceptions import ConnectionError as RequestsConnectionError
from requests.exceptions import RequestException, Timeout
from urllib3.exceptions import InsecureRequestWarning

from .auth import build_auth
from .exceptions import (
    PTS2AuthenticationError,
    PTS2ConnectionError,
    PTS2ProtocolError,
    PTS2ResponseError,
    PTS2TimeoutError,
)
from .retry import build_retry_adapter

JSONPTS_HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "*/*",
}


class PTS2Transport:
    """Requests-based transport for the PTS-2 jsonPTS endpoint."""

    def __init__(
        self,
        *,
        host: str,
        port: int,
        https: bool = False,
        username: str | None = None,
        password: str | None = None,
        auth_type: str = "basic",
        verify_ssl: bool = False,
        timeout: int | float = 10,
        retries: int = 3,
        endpoint: str = "/jsonPTS",
        session: Session | None = None,
        logger: logging.Logger | None = None,
    ) -> None:
        self.host = host
        self.port = port
        self.https = https
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self.endpoint = endpoint if endpoint.startswith("/") else f"/{endpoint}"
        self.logger = logger or logging.getLogger("pts2_sdk.transport")
        self.session = session or requests.Session()
        self.session.auth = build_auth(username, password, auth_type)
        self.session.headers.update(JSONPTS_HEADERS)

        adapter = build_retry_adapter(retries)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        if not self.verify_ssl:
            urllib3.disable_warnings(InsecureRequestWarning)

    @property
    def scheme(self) -> str:
        return "https" if self.https else "http"

    @property
    def base_url(self) -> str:
        return f"{self.scheme}://{self.host}:{self.port}"

    @property
    def url(self) -> str:
        return f"{self.base_url}{self.endpoint}"

    def post(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        """POST a jsonPTS payload and return the decoded JSON response."""

        self.logger.debug("jsonPTS request url=%s payload=%s", self.url, payload)
        try:
            response = self.session.post(
                self.url,
                json=dict(payload),
                timeout=self.timeout,
                verify=self.verify_ssl,
            )
        except Timeout as exc:
            self.logger.error("jsonPTS timeout url=%s timeout=%s", self.url, self.timeout)
            raise PTS2TimeoutError(f"Timeout communicating with PTS-2 at {self.url}") from exc
        except RequestsConnectionError as exc:
            self.logger.error("jsonPTS connection error url=%s error=%s", self.url, exc)
            raise PTS2ConnectionError(f"Unable to connect to PTS-2 at {self.url}") from exc
        except RequestException as exc:
            self.logger.error("jsonPTS request error url=%s error=%s", self.url, exc)
            raise PTS2ConnectionError(f"HTTP request to PTS-2 failed: {exc}") from exc

        self.logger.debug(
            "jsonPTS response status=%s body=%s",
            response.status_code,
            response.text[:5000],
        )

        if response.status_code in {401, 403}:
            raise PTS2AuthenticationError(
                f"Authentication failed with PTS-2 at {self.url} (HTTP {response.status_code})"
            )
        if response.status_code >= 400:
            raise PTS2ResponseError(
                f"PTS-2 returned HTTP {response.status_code}: {response.text[:500]}",
                status_code=response.status_code,
                response=response,
            )

        decoded = self._decode_json_response(response.text)

        if not isinstance(decoded, dict):
            raise PTS2ProtocolError("PTS-2 response must be a JSON object")
        return decoded

    def _decode_json_response(self, text: str) -> Any:
        try:
            return json.loads(text)
        except ValueError as first_error:
            # Clean trailing commas which are common in some PTS-2 firmware versions
            import re
            cleaned = re.sub(r',\s*([\]}])', r'\1', text)
            try:
                return json.loads(cleaned)
            except ValueError:
                pass

            decoder = json.JSONDecoder()
            try:
                decoded, index = decoder.raw_decode(text)
            except ValueError as exc:
                raise PTS2ProtocolError("PTS-2 returned invalid JSON") from exc

            trailing = text[index:].strip()
            if trailing:
                self.logger.warning("PTS-2 response contained trailing data after JSON: %r", trailing[:200])
            if decoded is None:
                raise PTS2ProtocolError("PTS-2 returned empty JSON") from first_error
            return decoded

    def close(self) -> None:
        self.session.close()
