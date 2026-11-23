#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "requests",
# ]
# ///
"""Provision or rotate LeetLLM's ordinary Supabase integration-test user."""

from __future__ import annotations

import argparse
import json
import os
import secrets
import subprocess
import sys
from pathlib import Path
from typing import Any

import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV_FILE = REPO_ROOT / "web" / ".env.local"
DEFAULT_DEPLOY_ENV_FILE = REPO_ROOT / "secrets" / "deploy.env"
DEFAULT_EMAIL = "leety-integration@leetllm.com"
DEFAULT_DISPLAY_NAME = "Leety Integration Runner"
DEFAULT_CREDENTIALS_SECRET = "leetllm-e2e-user"
DEFAULT_SERVICE_ROLE_SECRET = "leetllm-supabase-service-role-key"


class ProvisionError(RuntimeError):
    """Raised when integration-user provisioning cannot complete safely."""


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


def run_gcloud(args: list[str], *, stdin: str | None = None) -> str:
    result = subprocess.run(
        ["gcloud", *args],
        input=stdin,
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
        raise ProvisionError(detail)
    return result.stdout.strip()


def secret_exists(project: str, secret_name: str) -> bool:
    result = subprocess.run(
        ["gcloud", "secrets", "describe", secret_name, "--project", project],
        text=True,
        capture_output=True,
        check=False,
    )
    return result.returncode == 0


def read_secret(project: str, secret_name: str) -> dict[str, Any] | None:
    if not secret_exists(project, secret_name):
        return None
    raw = run_gcloud(
        [
            "secrets",
            "versions",
            "access",
            "latest",
            "--secret",
            secret_name,
            "--project",
            project,
        ]
    )
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ProvisionError(
            f"Secret {secret_name} does not contain valid JSON"
        ) from exc
    if not isinstance(value, dict):
        raise ProvisionError(f"Secret {secret_name} must contain a JSON object")
    return value


def read_service_role_key(project: str, secret_name: str, env: dict[str, str]) -> str:
    local_value = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    if local_value:
        return local_value
    if not secret_exists(project, secret_name):
        raise ProvisionError(f"Missing service-role secret {secret_name}")
    return run_gcloud(
        [
            "secrets",
            "versions",
            "access",
            "latest",
            "--secret",
            secret_name,
            "--project",
            project,
        ]
    )


def auth_headers(service_role_key: str) -> dict[str, str]:
    return {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }


def response_error(response: requests.Response, action: str) -> ProvisionError:
    try:
        payload = response.json()
    except requests.JSONDecodeError:
        payload = {}
    message = payload.get("msg") or payload.get("message") or payload.get("error")
    suffix = f": {message}" if isinstance(message, str) and message else ""
    return ProvisionError(f"{action} failed with HTTP {response.status_code}{suffix}")


def find_user(
    supabase_url: str, service_role_key: str, email: str
) -> dict[str, Any] | None:
    headers = auth_headers(service_role_key)
    for page in range(1, 101):
        response = requests.get(
            f"{supabase_url}/auth/v1/admin/users",
            headers=headers,
            params={"page": page, "per_page": 1000},
            timeout=30,
        )
        if response.status_code != 200:
            raise response_error(response, "Listing Supabase users")
        payload = response.json()
        users = payload.get("users", []) if isinstance(payload, dict) else []
        if not isinstance(users, list):
            raise ProvisionError("Supabase returned an invalid user list")
        for user in users:
            if (
                isinstance(user, dict)
                and str(user.get("email", "")).lower() == email.lower()
            ):
                return user
        if len(users) < 1000:
            return None
    raise ProvisionError("Supabase user lookup exceeded 100 pages")


def write_credentials_secret(
    project: str,
    secret_name: str,
    credentials: dict[str, str | int],
) -> str:
    if not secret_exists(project, secret_name):
        run_gcloud(
            [
                "secrets",
                "create",
                secret_name,
                "--project",
                project,
                "--replication-policy",
                "automatic",
                "--labels",
                "service=leetllm,purpose=integration-test",
                "--quiet",
            ]
        )
    return run_gcloud(
        [
            "secrets",
            "versions",
            "add",
            secret_name,
            "--project",
            project,
            "--data-file=-",
            "--format=value(name)",
            "--quiet",
        ],
        stdin=json.dumps(credentials, separators=(",", ":")),
    )


def disable_secret_version(project: str, secret_name: str, version_name: str) -> None:
    version = version_name.rsplit("/", 1)[-1]
    subprocess.run(
        [
            "gcloud",
            "secrets",
            "versions",
            "disable",
            version,
            "--secret",
            secret_name,
            "--project",
            project,
            "--quiet",
        ],
        text=True,
        capture_output=True,
        check=False,
    )


def disable_previous_secret_versions(
    project: str, secret_name: str, current_version_name: str
) -> None:
    current_version = current_version_name.rsplit("/", 1)[-1]
    enabled = run_gcloud(
        [
            "secrets",
            "versions",
            "list",
            secret_name,
            "--project",
            project,
            "--filter=state=enabled",
            "--format=value(name)",
        ]
    )
    for version_name in enabled.splitlines():
        version = version_name.rsplit("/", 1)[-1]
        if version and version != current_version:
            run_gcloud(
                [
                    "secrets",
                    "versions",
                    "disable",
                    version,
                    "--secret",
                    secret_name,
                    "--project",
                    project,
                    "--quiet",
                ]
            )


def create_or_update_user(
    supabase_url: str,
    service_role_key: str,
    existing_user: dict[str, Any] | None,
    email: str,
    password: str,
) -> str:
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {
            "full_name": DEFAULT_DISPLAY_NAME,
            "integration_test": True,
        },
    }
    headers = auth_headers(service_role_key)
    if existing_user:
        user_id = existing_user.get("id")
        if not isinstance(user_id, str) or not user_id:
            raise ProvisionError("Existing Supabase user has no ID")
        response = requests.put(
            f"{supabase_url}/auth/v1/admin/users/{user_id}",
            headers=headers,
            json=payload,
            timeout=30,
        )
        action = "Updating integration user"
    else:
        response = requests.post(
            f"{supabase_url}/auth/v1/admin/users",
            headers=headers,
            json=payload,
            timeout=30,
        )
        action = "Creating integration user"
    if response.status_code not in {200, 201}:
        raise response_error(response, action)
    created = response.json()
    user_id = created.get("id") if isinstance(created, dict) else None
    if not isinstance(user_id, str) or not user_id:
        raise ProvisionError(f"{action} returned no user ID")
    return user_id


def validate_login(
    supabase_url: str, publishable_key: str, email: str, password: str
) -> None:
    response = requests.post(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        headers={"apikey": publishable_key, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=30,
    )
    if response.status_code != 200:
        raise response_error(response, "Validating integration-user login")
    payload = response.json()
    if (
        not isinstance(payload, dict)
        or not payload.get("access_token")
        or not payload.get("refresh_token")
    ):
        raise ProvisionError("Integration-user login returned an incomplete session")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--rotate",
        action="store_true",
        help="Replace password and add a new secret version",
    )
    parser.add_argument(
        "--email", help=f"Integration-user email (default: {DEFAULT_EMAIL})"
    )
    parser.add_argument("--env-file", type=Path, default=DEFAULT_ENV_FILE)
    parser.add_argument("--project", default="")
    parser.add_argument("--credentials-secret", default=DEFAULT_CREDENTIALS_SECRET)
    parser.add_argument("--service-role-secret", default=DEFAULT_SERVICE_ROLE_SECRET)
    args = parser.parse_args()

    deploy_env = load_env_file(DEFAULT_DEPLOY_ENV_FILE)
    project = args.project or os.environ.get("GCLOUD_PROJECT") or deploy_env.get("GCLOUD_PROJECT") or ""
    if not project:
        raise ProvisionError("Missing GCP project: pass --project, set GCLOUD_PROJECT, or configure secrets/deploy.env")
    args.project = project

    env = load_env_file(args.env_file)
    supabase_url = (
        os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        or env.get("NEXT_PUBLIC_SUPABASE_URL")
        or ""
    ).rstrip("/")
    publishable_key = (
        os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
        or env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
        or ""
    )
    if not supabase_url or not publishable_key:
        raise ProvisionError(
            f"Missing Supabase public configuration in {args.env_file}"
        )

    stored = read_secret(args.project, args.credentials_secret)
    stored_email = stored.get("email") if stored else None
    email = args.email or (
        stored_email if isinstance(stored_email, str) else DEFAULT_EMAIL
    )
    if stored and not args.rotate:
        password = stored.get("password")
        if not isinstance(password, str) or not password:
            raise ProvisionError(f"Secret {args.credentials_secret} has no password")
        validate_login(supabase_url, publishable_key, email, password)
        print(f"Integration user ready: {email} ({args.credentials_secret})")
        return 0

    password = secrets.token_urlsafe(36)
    credentials: dict[str, str | int] = {
        "version": 1,
        "email": email,
        "password": password,
    }
    version_name = write_credentials_secret(
        args.project, args.credentials_secret, credentials
    )
    try:
        service_role_key = read_service_role_key(
            args.project, args.service_role_secret, env
        )
        existing_user = find_user(supabase_url, service_role_key, email)
        user_id = create_or_update_user(
            supabase_url, service_role_key, existing_user, email, password
        )
        validate_login(supabase_url, publishable_key, email, password)
        disable_previous_secret_versions(
            args.project, args.credentials_secret, version_name
        )
    except Exception:
        disable_secret_version(args.project, args.credentials_secret, version_name)
        raise

    action = "Rotated" if existing_user else "Created"
    version = version_name.rsplit("/", 1)[-1]
    print(
        f"{action} integration user: {email} (user {user_id}, secret version {version})"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ProvisionError, requests.RequestException) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
