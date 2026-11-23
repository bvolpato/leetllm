#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "requests",
# ]
# ///

from __future__ import annotations

import argparse
import base64
import json
import os
from pathlib import Path
import time
from typing import Any

import requests

CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
ISSUER = "https://auth.openai.com"
DEVICE_URL = f"{ISSUER}/codex/device"
DEVICE_CODE_URL = f"{ISSUER}/api/accounts/deviceauth/usercode"
DEVICE_TOKEN_URL = f"{ISSUER}/api/accounts/deviceauth/token"
TOKEN_URL = f"{ISSUER}/oauth/token"
DEVICE_REDIRECT_URI = f"{ISSUER}/deviceauth/callback"
USER_AGENT = "codex/leetllm"
REPO_ROOT = Path(__file__).resolve().parent.parent
AUTH_PATH = REPO_ROOT / "secrets" / "codex" / "auth.json"


def request_json(
    method: str,
    url: str,
    *,
    json_body: dict[str, Any] | None = None,
    form_body: dict[str, str] | None = None,
    timeout: int = 60,
) -> dict[str, Any]:
    headers = {"User-Agent": USER_AGENT}
    if json_body is not None:
        headers["Content-Type"] = "application/json"
    if form_body is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    response = requests.request(
        method,
        url,
        headers=headers,
        json=json_body,
        data=form_body,
        timeout=timeout,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"{url} failed: HTTP {response.status_code}")
    return response.json()


def decode_jwt_payload(token: str | None) -> dict[str, Any]:
    if not token:
        return {}
    parts = token.split(".")
    if len(parts) < 2:
        return {}
    try:
        payload = parts[1] + "=" * (-len(parts[1]) % 4)
        return json.loads(base64.urlsafe_b64decode(payload.encode()).decode())
    except Exception:
        return {}


def extract_account_id(tokens: dict[str, Any]) -> str | None:
    for token_name in ("id_token", "access_token"):
        claims = decode_jwt_payload(tokens.get(token_name))
        account_id = (
            claims.get("chatgpt_account_id")
            or (claims.get("https://api.openai.com/auth") or {}).get("chatgpt_account_id")
            or ((claims.get("organizations") or [{}])[0]).get("id")
        )
        if account_id:
            return str(account_id)
    return None


def request_device_code() -> dict[str, Any]:
    return request_json("POST", DEVICE_CODE_URL, json_body={"client_id": CLIENT_ID})


def poll_device_authorization(device: dict[str, Any], timeout: int) -> dict[str, Any]:
    device_auth_id = str(device.get("device_auth_id") or "")
    user_code = str(device.get("user_code") or "")
    if not device_auth_id or not user_code:
        raise RuntimeError("Device authorization returned an invalid response")

    try:
        interval = max(int(device.get("interval") or 5), 1)
    except ValueError:
        interval = 5
    deadline = time.monotonic() + timeout

    while time.monotonic() < deadline:
        response = requests.post(
            DEVICE_TOKEN_URL,
            headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
            json={"device_auth_id": device_auth_id, "user_code": user_code},
            timeout=60,
        )
        if response.ok:
            payload = response.json()
            if payload.get("authorization_code") and payload.get("code_verifier"):
                return payload
            raise RuntimeError("Device authorization returned an incomplete response")
        if response.status_code not in {403, 404}:
            raise RuntimeError(f"{DEVICE_TOKEN_URL} failed: HTTP {response.status_code}")
        time.sleep(interval + 3)

    raise TimeoutError(f"Timed out waiting for OpenAI device authorization after {timeout}s")


def exchange_tokens(authorization: dict[str, Any]) -> dict[str, Any]:
    return request_json(
        "POST",
        TOKEN_URL,
        form_body={
            "grant_type": "authorization_code",
            "code": str(authorization["authorization_code"]),
            "redirect_uri": DEVICE_REDIRECT_URI,
            "client_id": CLIENT_ID,
            "code_verifier": str(authorization["code_verifier"]),
        },
    )


def write_codex_auth(tokens: dict[str, Any]) -> None:
    access_token = str(tokens.get("access_token") or "")
    refresh_token = str(tokens.get("refresh_token") or "")
    id_token = str(tokens.get("id_token") or "")
    if not access_token or not refresh_token or not id_token:
        raise RuntimeError("Token exchange returned incomplete Codex credentials")

    token_data: dict[str, Any] = {
        "id_token": id_token,
        "access_token": access_token,
        "refresh_token": refresh_token,
    }
    account_id = extract_account_id(tokens)
    if account_id:
        token_data["account_id"] = account_id

    auth = {
        "OPENAI_API_KEY": None,
        "auth_mode": "chatgpt",
        "tokens": token_data,
        "last_refresh": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    AUTH_PATH.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    AUTH_PATH.parent.chmod(0o700)
    temporary_path = AUTH_PATH.with_name(f".{AUTH_PATH.name}.{os.getpid()}.tmp")
    temporary_path.write_text(json.dumps(auth, indent=2), encoding="utf-8")
    temporary_path.chmod(0o600)
    os.replace(temporary_path, AUTH_PATH)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Issue isolated LeetLLM Codex credentials without reading ~/.codex/auth.json."
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=900,
        help="Seconds to wait for browser/device authorization.",
    )
    args = parser.parse_args()
    if args.timeout <= 0:
        parser.error("timeout must be positive")

    device = request_device_code()
    user_code = str(device.get("user_code") or "")
    if not user_code:
        raise RuntimeError("Device authorization returned an invalid response")

    print(f"Open: {DEVICE_URL}")
    print(f"Code: {user_code}")
    print("Waiting for authorization...", flush=True)

    authorization = poll_device_authorization(device, args.timeout)
    write_codex_auth(exchange_tokens(authorization))
    print(f"Saved isolated LeetLLM Codex credentials: {AUTH_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
