#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "requests",
# ]
# ///
"""Exercise Leety through normal web, native, and refreshed Supabase sessions."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DEPLOY_ENV_FILE = REPO_ROOT / "secrets" / "deploy.env"
DEFAULT_CREDENTIALS_SECRET = "leetllm-e2e-user"
DEFAULT_ENV_FILE = REPO_ROOT / "web" / ".env.local"
LESSON_PATH = "/learn/numpy-and-tensor-shapes"
LESSON_TITLE = "NumPy and Tensor Shapes"
QUESTION = "According to this lesson, what does tensor shape (B, T, D) describe? Answer in one sentence."
REQUEST_ID = "leety-deploy-smoke-v1"
USER_AGENT = "leetllm-leety-integration-smoke/1.0"


class SmokeError(RuntimeError):
    """Raised when authenticated Leety integration validation fails."""


def load_env_file(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def read_credentials(project: str, secret_name: str) -> tuple[str, str]:
    result = subprocess.run(
        [
            "gcloud",
            "secrets",
            "versions",
            "access",
            "latest",
            "--secret",
            secret_name,
            "--project",
            project,
        ],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        detail = (
            result.stderr.strip().splitlines()[-1]
            if result.stderr.strip()
            else "gcloud failed"
        )
        raise SmokeError(f"Could not read {secret_name}: {detail}")
    try:
        value = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise SmokeError(f"Secret {secret_name} does not contain valid JSON") from exc
    email = value.get("email") if isinstance(value, dict) else None
    password = value.get("password") if isinstance(value, dict) else None
    if (
        not isinstance(email, str)
        or not email
        or not isinstance(password, str)
        or not password
    ):
        raise SmokeError(f"Secret {secret_name} must contain email and password")
    return email, password


def safe_error(response: requests.Response, action: str) -> SmokeError:
    try:
        payload = response.json()
    except requests.JSONDecodeError:
        payload = {}
    message = (
        payload.get("error_description") or payload.get("msg") or payload.get("error")
    )
    suffix = f": {message}" if isinstance(message, str) and message else ""
    return SmokeError(f"{action} failed with HTTP {response.status_code}{suffix}")


def leety_body() -> dict[str, Any]:
    return {
        "pathname": LESSON_PATH,
        "messages": [{"role": "user", "content": QUESTION}],
        "requestId": REQUEST_ID,
    }


def validate_answer(response: requests.Response, session_name: str) -> None:
    if response.status_code != 200:
        raise safe_error(response, f"Leety request using {session_name}")
    try:
        payload = response.json()
    except requests.JSONDecodeError as exc:
        raise SmokeError(f"Leety returned invalid JSON using {session_name}") from exc
    if not isinstance(payload, dict):
        raise SmokeError(f"Leety returned an invalid response using {session_name}")
    answer = payload.get("answer")
    if (
        payload.get("status") != "answer"
        or not isinstance(answer, str)
        or len(answer.strip()) < 12
    ):
        raise SmokeError(f"Leety returned no grounded answer using {session_name}")
    if payload.get("pageTitle") != LESSON_TITLE or not isinstance(
        payload.get("sources"), list
    ):
        raise SmokeError(f"Leety returned invalid page metadata using {session_name}")


def web_cookie_smoke(base_url: str, email: str, password: str, timeout: float) -> None:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    login = session.post(
        f"{base_url}/api/auth/login",
        headers={"Origin": base_url},
        data={"email": email, "password": password, "next": LESSON_PATH},
        allow_redirects=False,
        timeout=timeout,
    )
    if login.status_code != 303:
        raise safe_error(login, "Web login")
    location = login.headers.get("Location")
    if not location or urlparse(location).path != LESSON_PATH or not session.cookies:
        raise SmokeError(
            "Web login did not return a lesson redirect and session cookies"
        )
    response = session.post(
        f"{base_url}/api/leety",
        headers={"Origin": base_url},
        json=leety_body(),
        timeout=timeout,
    )
    validate_answer(response, "web cookies")


def password_session(
    supabase_url: str,
    publishable_key: str,
    email: str,
    password: str,
    timeout: float,
) -> dict[str, Any]:
    response = requests.post(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        headers={
            "apikey": publishable_key,
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        json={"email": email, "password": password},
        timeout=timeout,
    )
    if response.status_code != 200:
        raise safe_error(response, "Supabase password login")
    payload = response.json()
    if (
        not isinstance(payload, dict)
        or not payload.get("access_token")
        or not payload.get("refresh_token")
    ):
        raise SmokeError("Supabase password login returned an incomplete session")
    return payload


def refresh_session(
    supabase_url: str,
    publishable_key: str,
    refresh_token: str,
    timeout: float,
) -> dict[str, Any]:
    response = requests.post(
        f"{supabase_url}/auth/v1/token?grant_type=refresh_token",
        headers={
            "apikey": publishable_key,
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        json={"refresh_token": refresh_token},
        timeout=timeout,
    )
    if response.status_code != 200:
        raise safe_error(response, "Supabase token refresh")
    payload = response.json()
    if (
        not isinstance(payload, dict)
        or not payload.get("access_token")
        or not payload.get("refresh_token")
    ):
        raise SmokeError("Supabase token refresh returned an incomplete session")
    return payload


def bearer_leety_smoke(
    base_url: str, access_token: str, timeout: float, session_name: str
) -> None:
    response = requests.post(
        f"{base_url}/api/leety",
        headers={"Authorization": f"Bearer {access_token}", "User-Agent": USER_AGENT},
        json=leety_body(),
        timeout=timeout,
    )
    validate_answer(response, session_name)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url", help="LeetLLM origin to validate")
    parser.add_argument("--supabase-url")
    parser.add_argument("--publishable-key")
    parser.add_argument("--env-file", type=Path, default=DEFAULT_ENV_FILE)
    parser.add_argument("--project", default="")
    parser.add_argument("--credentials-secret", default=DEFAULT_CREDENTIALS_SECRET)
    parser.add_argument("--timeout", type=float, default=125.0)
    args = parser.parse_args()

    deploy_env = load_env_file(DEFAULT_DEPLOY_ENV_FILE)
    project = args.project or os.environ.get("GCLOUD_PROJECT") or deploy_env.get("GCLOUD_PROJECT") or ""
    if not project:
        raise SmokeError("Missing GCP project: pass --project, set GCLOUD_PROJECT, or configure secrets/deploy.env")

    env = load_env_file(args.env_file)
    base_url = args.base_url.rstrip("/")
    supabase_url = (
        args.supabase_url
        or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        or env.get("NEXT_PUBLIC_SUPABASE_URL")
        or ""
    ).rstrip("/")
    publishable_key = (
        args.publishable_key
        or os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
        or env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
        or ""
    )
    if not supabase_url or not publishable_key:
        raise SmokeError(f"Missing Supabase public configuration in {args.env_file}")
    email, password = read_credentials(project, args.credentials_secret)
    started = time.monotonic()

    web_cookie_smoke(base_url, email, password, args.timeout)
    print("   OK Leety answered through normal web session cookies", flush=True)

    session = password_session(
        supabase_url, publishable_key, email, password, args.timeout
    )
    bearer_leety_smoke(
        base_url, str(session["access_token"]), args.timeout, "native bearer token"
    )
    print("   OK Leety accepted native-style Bearer authentication", flush=True)

    refreshed = refresh_session(
        supabase_url,
        publishable_key,
        str(session["refresh_token"]),
        args.timeout,
    )
    bearer_leety_smoke(
        base_url, str(refreshed["access_token"]), args.timeout, "refreshed bearer token"
    )
    print("   OK Leety accepted refreshed Bearer authentication", flush=True)
    print(
        f"\nOK authenticated Leety integration smoke passed in {time.monotonic() - started:.1f}s"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (SmokeError, requests.RequestException) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
