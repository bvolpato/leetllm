# Security Policy

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues or pull requests.

Instead, report vulnerabilities privately via **GitHub Private Vulnerability Reporting** on this repository (`Security` -> `Advisories` -> `Report a vulnerability`).

Include:

- Affected component, endpoint, or file path.
- Clear reproduction steps or a minimal proof of concept.
- Expected security impact and any suggested remediation.

We aim to acknowledge reports within 48 hours and provide a remediation timeline once reproduced.

## Security Architecture

LeetLLM uses defense-in-depth across its web application, database, and coding practice execution pipeline:

1. **Isolated Practice Execution Sandbox (`leetllm-sandbox`)**
   - Production never executes untrusted user Python or Java code inside the main web container (`PRACTICE_RUNNER_REQUIRE_REMOTE=true`; Python and JDK are omitted from the production web `Dockerfile`).
   - User practice submissions are forwarded to a separate Cloud Run Gen2 service (`leetllm-sandbox`) running under a dedicated **zero-privilege service account** (`leetllm-sandbox@<project>.iam.gserviceaccount.com`) with **zero project IAM roles**, **zero Secret Manager access**, and **zero secrets mounted**.
   - `leetllm-sandbox` disables unauthenticated ingress (`--no-allow-unauthenticated`) and accepts IAM-authenticated OIDC invocations solely from `leetllm-runtime@<project>.iam.gserviceaccount.com`.
   - Inside the sandbox, executions run with Linux `bubblewrap` namespace isolation (isolated network, PID, mount, IPC, and UTS namespaces where supported by the host kernel), strict `rlimit` caps, an irremovable CPython `sys.addaudithook` + AST filter for Python, and source + `.class` bytecode allowlist verification for Java.
   - `/api/practice/run` enforces per-IP rate limiting, request size caps, and concurrency caps.

2. **Least-Privilege Runtime Identity (`leetllm-runtime`)**
   - The main web Cloud Run service runs as `leetllm-runtime@<project>.iam.gserviceaccount.com`, which holds **zero project-level IAM roles**.
   - Access is scoped strictly per secret in Google Cloud Secret Manager (`roles/secretmanager.secretAccessor` on required runtime secrets only) plus `roles/run.invoker` scoped solely to `leetllm-sandbox`.

3. **Database Row Level Security (Supabase)**
   - Every user-owned table in `supabase/schema/` enforces PostgreSQL Row Level Security (RLS) scoped to `auth.uid()`.
   - `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`, and `CODEX_AUTH_JSON_B64` are server-only secrets injected from Secret Manager and never exposed to browsers.

4. **Secret Hygiene**
   - All local secrets, environment files, and Apple signing certificates live exclusively in gitignored paths (`web/.env.local`, `.env`, `secrets/`, `private/`) and are excluded from Git, Docker builds (`.dockerignore`), and Cloud Build uploads (`.gcloudignore`).

## Supported Versions

Only the latest `main` branch and the live deployment at [leetllm.com](https://leetllm.com) receive security updates.
