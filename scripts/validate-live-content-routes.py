#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Validate deployed content routes for known-good learn and blog slugs."""

from __future__ import annotations

import argparse
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen

from content_bundle import iter_content_bundles
from content_audience import is_visible_to_audience


REPO_ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = REPO_ROOT / "web" / "src" / "content"
BLOG_DIR = CONTENT_DIR / "blog"
PRACTICE_DIR = CONTENT_DIR / "practice"

DEFAULT_LEARN_SLUGS = [
    "numpy-and-tensor-shapes",
    "rnns-lstms-grus-sequence-modeling",
    "autoencoders-vaes-generative-modeling-basics",
    "chunking-strategies-document-processing",
    "build-gpt-from-scratch-lab",
]

DEFAULT_BLOG_SLUGS = [
    "how-to-build-ai-agent-from-scratch",
    "what-does-an-ai-engineer-do",
    "top-50-llm-interview-questions-2026",
    "llm-inference-engine-comparison-2026",
    "run-gemma4-local-ollama",
    "run-qwen36-local-unsloth-gguf",
    "best-ai-plan-openclaw-2026",
]

KNOWN_LEARN_ALIAS = "decoder-only-lm-pretraining-lab"
KNOWN_LEARN_ALIAS_TARGET = "build-gpt-from-scratch-lab"
MAX_MARKDOWN_BODY_BYTES = 2 * 1024 * 1024

GZIP_ROUTE_PATHS = [
    "/",
    "/learn",
    "/blog",
    "/glossary",
    "/api/content-asset/training/build-gpt-from-scratch-lab/assets/shakespeare.txt",
]


def load_learn_slugs() -> set[str]:
    slugs: set[str] = set()
    for bundle in iter_content_bundles(CONTENT_DIR):
        if bundle.article_dir.parent in {BLOG_DIR, PRACTICE_DIR}:
            continue
        metadata = bundle.metadata
        if metadata.get("draft") or not is_visible_to_audience(metadata, "website") or metadata.get("status") == "hidden":
            continue
        slug = metadata.get("slug")
        if isinstance(slug, str) and slug:
            slugs.add(slug)
    return slugs


def load_learn_aliases() -> dict[str, str]:
    aliases: dict[str, str] = {}
    for bundle in iter_content_bundles(CONTENT_DIR):
        if bundle.article_dir.parent in {BLOG_DIR, PRACTICE_DIR}:
            continue
        metadata = bundle.metadata
        if not is_visible_to_audience(metadata, "website"):
            continue
        slug = metadata.get("slug")
        declared_aliases = metadata.get("aliases", [])
        if not isinstance(slug, str) or not isinstance(declared_aliases, list):
            continue
        for alias in declared_aliases:
            if isinstance(alias, str):
                aliases[alias] = slug
    return aliases


def load_blog_slugs() -> set[str]:
    slugs: set[str] = set()
    for bundle in iter_content_bundles(CONTENT_DIR):
        if bundle.article_dir.parent != BLOG_DIR:
            continue
        metadata = bundle.metadata
        if metadata.get("draft") or not is_visible_to_audience(metadata, "website") or metadata.get("status") == "hidden":
            continue
        slug = metadata.get("slug")
        if isinstance(slug, str) and slug:
            slugs.add(slug)
    return slugs


def load_blog_redirects() -> dict[str, str]:
    redirects: dict[str, str] = {}
    for bundle in iter_content_bundles(CONTENT_DIR):
        if bundle.article_dir.parent != BLOG_DIR:
            continue
        metadata = bundle.metadata
        if not is_visible_to_audience(metadata, "website"):
            continue
        redirect_to = metadata.get("redirectTo")
        slug = metadata.get("slug")
        if isinstance(slug, str) and isinstance(redirect_to, str):
            redirects[slug] = redirect_to
        aliases = metadata.get("aliases", [])
        if isinstance(slug, str) and isinstance(aliases, list):
            for alias in aliases:
                if isinstance(alias, str):
                    redirects[alias] = f"/blog/{slug}"
    return redirects


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        return None


@dataclass(frozen=True)
class RouteResponse:
    status: int
    body: str
    body_bytes: int
    content_type: str | None
    time_to_first_byte: float
    total_time: float


@dataclass(frozen=True)
class RouteExpectation:
    status: int
    markers: tuple[str, ...]


def redirect_status(url: str, timeout: float) -> tuple[int, str | None]:
    request = Request(url, headers={"User-Agent": "leetllm-deploy-smoke/1.0"})
    try:
        with build_opener(NoRedirect).open(request, timeout=timeout) as response:
            return response.status, response.headers.get("Location")
    except HTTPError as exc:
        return exc.code, exc.headers.get("Location")
    except (TimeoutError, URLError) as exc:
        reason = getattr(exc, "reason", str(exc))
        raise RuntimeError(f"{url}: {reason}") from exc


def post_redirect_status(url: str, timeout: float) -> tuple[int, str | None]:
    request = Request(
        url,
        data=b"",
        method="POST",
        headers={"User-Agent": "leetllm-deploy-smoke/1.0"},
    )
    try:
        with build_opener(NoRedirect).open(request, timeout=timeout) as response:
            return response.status, response.headers.get("Location")
    except HTTPError as exc:
        return exc.code, exc.headers.get("Location")
    except (TimeoutError, URLError) as exc:
        reason = getattr(exc, "reason", str(exc))
        raise RuntimeError(f"{url}: {reason}") from exc


def redirect_status_with_retries(
    url: str,
    timeout: float,
    retries: int,
    backoff: float,
) -> tuple[int, str | None]:
    last_error: RuntimeError | None = None
    for attempt in range(1, retries + 1):
        try:
            return redirect_status(url, timeout)
        except RuntimeError as exc:
            last_error = exc
            if attempt == retries:
                break
            print(f"   WARN {url} attempt {attempt}/{retries} error={exc}; retrying", flush=True)
            time.sleep(backoff * attempt)

    if last_error is None:
        raise RuntimeError(f"{url}: redirect check failed")
    raise last_error


def post_redirect_status_with_retries(
    url: str,
    timeout: float,
    retries: int,
    backoff: float,
) -> tuple[int, str | None]:
    last_error: RuntimeError | None = None
    for attempt in range(1, retries + 1):
        try:
            return post_redirect_status(url, timeout)
        except RuntimeError as exc:
            last_error = exc
            if attempt == retries:
                break
            print(f"   WARN {url} attempt {attempt}/{retries} error={exc}; retrying", flush=True)
            time.sleep(backoff * attempt)

    if last_error is None:
        raise RuntimeError(f"{url}: POST redirect check failed")
    raise last_error


def route_status(url: str, timeout: float) -> int:
    request = Request(url, headers={"User-Agent": "leetllm-deploy-smoke/1.0"})
    try:
        with urlopen(request, timeout=timeout) as response:
            return response.status
    except HTTPError as exc:
        return exc.code
    except (TimeoutError, URLError) as exc:
        reason = getattr(exc, "reason", str(exc))
        raise RuntimeError(f"{url}: {reason}") from exc


def route_status_with_retries(url: str, timeout: float, retries: int, backoff: float) -> int:
    last_error: RuntimeError | None = None
    for attempt in range(1, retries + 1):
        try:
            status = route_status(url, timeout)
            if not 500 <= status < 600 or attempt == retries:
                return status
            print(f"   WARN {url} attempt {attempt}/{retries} status={status}; retrying", flush=True)
        except RuntimeError as exc:
            last_error = exc
            if attempt == retries:
                break
            print(f"   WARN {url} attempt {attempt}/{retries} error={exc}; retrying", flush=True)
        time.sleep(backoff * attempt)

    if last_error is None:
        raise RuntimeError(f"{url}: route check failed")
    raise last_error


def route_response(url: str, timeout: float) -> RouteResponse:
    request = Request(
        url,
        headers={
            "User-Agent": "leetllm-deploy-smoke/1.0",
            "Accept-Encoding": "identity",
        },
    )
    started = time.perf_counter()
    try:
        with urlopen(request, timeout=timeout) as response:
            first_byte = response.read(1)
            time_to_first_byte = time.perf_counter() - started
            body = first_byte + response.read(MAX_MARKDOWN_BODY_BYTES)
            total_time = time.perf_counter() - started
            status = response.status
            content_type = response.headers.get("Content-Type")
    except HTTPError as exc:
        try:
            first_byte = exc.read(1)
            time_to_first_byte = time.perf_counter() - started
            body = first_byte + exc.read(MAX_MARKDOWN_BODY_BYTES)
            content_type = exc.headers.get("Content-Type")
        finally:
            exc.close()
        total_time = time.perf_counter() - started
        status = exc.code
    except (TimeoutError, URLError) as exc:
        reason = getattr(exc, "reason", str(exc))
        raise RuntimeError(f"{url}: {reason}") from exc

    if len(body) > MAX_MARKDOWN_BODY_BYTES:
        raise RuntimeError(
            f"{url}: response body exceeds {MAX_MARKDOWN_BODY_BYTES} bytes"
        )

    return RouteResponse(
        status=status,
        body=body.decode("utf-8", errors="replace"),
        body_bytes=len(body),
        content_type=content_type,
        time_to_first_byte=time_to_first_byte,
        total_time=total_time,
    )


def route_response_with_retries(
    url: str,
    timeout: float,
    retries: int,
    backoff: float,
) -> RouteResponse:
    last_error: RuntimeError | None = None
    for attempt in range(1, retries + 1):
        try:
            return route_response(url, timeout)
        except RuntimeError as exc:
            last_error = exc
            if attempt == retries:
                break
            print(
                f"   WARN {url} attempt {attempt}/{retries} error={exc}; retrying",
                flush=True,
            )
            time.sleep(backoff * attempt)

    if last_error is None:
        raise RuntimeError(f"{url}: response check failed")
    raise last_error


def encoding_response(
    url: str,
    accept_encoding: str,
    timeout: float,
) -> tuple[int, str | None, str | None]:
    request = Request(
        url,
        headers={
            "User-Agent": "leetllm-deploy-smoke/1.0",
            "Accept-Encoding": accept_encoding,
        },
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            return (
                response.status,
                response.headers.get("Content-Encoding"),
                response.headers.get("Vary"),
            )
    except HTTPError as exc:
        return exc.code, exc.headers.get("Content-Encoding"), exc.headers.get("Vary")
    except (TimeoutError, URLError) as exc:
        reason = getattr(exc, "reason", str(exc))
        raise RuntimeError(f"{url}: {reason}") from exc


def encoding_response_with_retries(
    url: str,
    accept_encoding: str,
    timeout: float,
    retries: int,
    backoff: float,
) -> tuple[int, str | None, str | None]:
    last_error: RuntimeError | None = None
    for attempt in range(1, retries + 1):
        try:
            return encoding_response(url, accept_encoding, timeout)
        except RuntimeError as exc:
            last_error = exc
            if attempt == retries:
                break
            print(f"   WARN {url} attempt {attempt}/{retries} error={exc}; retrying", flush=True)
            time.sleep(backoff * attempt)

    if last_error is None:
        raise RuntimeError(f"{url}: compression check failed")
    raise last_error


def header_tokens(value: str | None) -> set[str]:
    return {token.strip().lower() for token in (value or "").split(",") if token.strip()}


def check_gzip_negotiation(
    base_url: str,
    route_paths: list[str],
    timeout: float,
    retries: int,
    backoff: float,
) -> list[tuple[str, int | str]]:
    failures: list[tuple[str, int | str]] = []

    for route_path in route_paths:
        url = f"{base_url}{route_path}"
        try:
            status, content_encoding, vary = encoding_response_with_retries(
                url,
                "gzip",
                timeout,
                retries,
                backoff,
            )
        except RuntimeError as exc:
            failures.append((url, str(exc)))
            print(f"   FAIL {url} error={exc}", flush=True)
            continue

        if (
            status != 200
            or "gzip" not in header_tokens(content_encoding)
            or "accept-encoding" not in header_tokens(vary)
        ):
            detail = f"status={status} content-encoding={content_encoding} vary={vary}"
            failures.append((url, detail))
            print(f"   FAIL {url} {detail}", flush=True)
        else:
            print(f"   OK {url} content-encoding=gzip", flush=True)

    identity_url = f"{base_url}/glossary"
    try:
        status, content_encoding, _ = encoding_response_with_retries(
            identity_url,
            "identity",
            timeout,
            retries,
            backoff,
        )
    except RuntimeError as exc:
        failures.append((identity_url, str(exc)))
        print(f"   FAIL {identity_url} identity error={exc}", flush=True)
    else:
        if status != 200 or (content_encoding and content_encoding.lower() != "identity"):
            detail = f"identity status={status} content-encoding={content_encoding}"
            failures.append((identity_url, detail))
            print(f"   FAIL {identity_url} {detail}", flush=True)
        else:
            print(f"   OK {identity_url} content-encoding=identity", flush=True)

    return failures


def validate_known_slugs(kind: str, slugs: list[str], known_slugs: set[str]) -> None:
    missing = [slug for slug in slugs if slug not in known_slugs]
    if missing:
        raise ValueError(f"Unknown {kind} smoke slug(s): {', '.join(missing)}")


def resolve_default_slugs(kind: str, defaults: list[str], known_slugs: set[str]) -> list[str]:
    missing = [slug for slug in defaults if slug not in known_slugs]
    if missing:
        raise ValueError(f"Unknown default {kind} smoke slug(s): {', '.join(missing)}")
    return defaults


def check_routes(
    base_url: str,
    route_prefix: str,
    slugs: list[str],
    timeout: float,
    retries: int,
    backoff: float,
) -> list[tuple[str, int | str]]:
    failures: list[tuple[str, int | str]] = []

    for slug in slugs:
        url = f"{base_url}/{route_prefix}/{slug}"
        try:
            status = route_status_with_retries(url, timeout, retries, backoff)
        except RuntimeError as exc:
            failures.append((url, str(exc)))
            print(f"   FAIL {url} error={exc}", flush=True)
            continue

        if status != 200:
            failures.append((url, status))
            print(f"   FAIL {url} status={status}", flush=True)
        else:
            print(f"   OK {url}", flush=True)

    return failures


def check_route_expectations(
    base_url: str,
    expectations: dict[str, RouteExpectation],
    timeout: float,
    retries: int,
    backoff: float,
    cold_start: bool,
    max_cold_total: float,
) -> list[tuple[str, int | str]]:
    failures: list[tuple[str, int | str]] = []

    for index, (route_path, expectation) in enumerate(expectations.items()):
        url = f"{base_url}{route_path}"
        is_cold_request = cold_start and index == 0
        request_retries = 1 if is_cold_request else retries
        try:
            response = route_response_with_retries(
                url,
                timeout,
                request_retries,
                backoff,
            )
        except RuntimeError as exc:
            failures.append((url, str(exc)))
            print(f"   FAIL {url} error={exc}", flush=True)
            continue

        problems: list[str] = []
        if response.status != expectation.status:
            problems.append(f"status={response.status} expected={expectation.status}")
        if not (response.content_type or "").lower().startswith("text/markdown"):
            problems.append(f"content-type={response.content_type} expected=text/markdown")
        missing_markers = [marker for marker in expectation.markers if marker not in response.body]
        if missing_markers:
            problems.append(f"missing-markers={missing_markers!r}")
        if is_cold_request and response.total_time > max_cold_total:
            problems.append(
                f"cold-total={response.total_time:.3f}s max={max_cold_total:.3f}s"
            )

        timing = (
            f"ttfb={response.time_to_first_byte:.3f}s "
            f"total={response.total_time:.3f}s bytes={response.body_bytes}"
        )
        if problems:
            detail = f"{' '.join(problems)} {timing}"
            failures.append((url, detail))
            print(f"   FAIL {url} {detail}", flush=True)
        else:
            prefix = "COLD " if is_cold_request else ""
            print(
                f"   OK {prefix}{url} ({response.status}, {timing})",
                flush=True,
            )

    return failures


def check_redirects(
    base_url: str,
    redirects: dict[str, str],
    timeout: float,
    retries: int,
    backoff: float,
) -> list[tuple[str, int | str]]:
    failures: list[tuple[str, int | str]] = []
    for slug, expected_path in sorted(redirects.items()):
        url = f"{base_url}/blog/{slug}"
        try:
            status, location = redirect_status_with_retries(url, timeout, retries, backoff)
        except RuntimeError as exc:
            failures.append((url, str(exc)))
            print(f"   FAIL {url} error={exc}", flush=True)
            continue
        actual_path = None
        if location:
            actual_path = urlparse(location).path
        if status not in {301, 308} or actual_path != expected_path:
            detail = f"status={status} location={location} expected={expected_path}"
            failures.append((url, detail))
            print(f"   FAIL {url} {detail}", flush=True)
        else:
            print(f"   OK {url} -> {expected_path} ({status})", flush=True)
    return failures


def check_auth_transition_stability(
    base_url: str,
    learn_slug: str,
    blog_slug: str,
    timeout: float,
    retries: int,
    backoff: float,
) -> list[tuple[str, int | str]]:
    failures: list[tuple[str, int | str]] = []
    signout_url = f"{base_url}/api/auth/signout"

    try:
        status, location = post_redirect_status_with_retries(
            signout_url,
            timeout,
            retries,
            backoff,
        )
    except RuntimeError as exc:
        failures.append((signout_url, str(exc)))
        print(f"   FAIL {signout_url} error={exc}", flush=True)
    else:
        parsed_location = urlparse(location) if location else None
        parsed_base_url = urlparse(base_url)
        redirect_path = parsed_location.path if parsed_location else None
        redirect_origin = (
            f"{parsed_location.scheme}://{parsed_location.netloc}"
            if parsed_location and parsed_location.netloc
            else None
        )
        expected_origin = f"{parsed_base_url.scheme}://{parsed_base_url.netloc}"
        if (
            status != 303
            or redirect_path != "/"
            or (redirect_origin is not None and redirect_origin != expected_origin)
        ):
            detail = f"status={status} location={location} expected={expected_origin}/"
            failures.append((signout_url, detail))
            print(f"   FAIL {signout_url} {detail}", flush=True)
        else:
            print(f"   OK {signout_url} -> / ({status})", flush=True)

    failures.extend(check_routes(base_url, "learn", [learn_slug], timeout, retries, backoff))
    failures.extend(check_routes(base_url, "blog", [blog_slug], timeout, retries, backoff))
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("base_url", help="Base URL to validate, e.g. Cloud Run service URL")
    parser.add_argument("--learn-slug", action="append", dest="learn_slugs", help="Known learn slug to validate")
    parser.add_argument("--blog-slug", action="append", dest="blog_slugs", help="Known blog slug to validate")
    parser.add_argument("--all-learn", action="store_true", help="Validate every learn slug")
    parser.add_argument("--all-blog", action="store_true", help="Validate every published blog slug")
    parser.add_argument("--timeout", type=float, default=30.0, help="Per-request timeout in seconds")
    parser.add_argument("--retries", type=int, default=3, help="Attempts per route before failing")
    parser.add_argument("--backoff", type=float, default=2.0, help="Retry backoff multiplier in seconds")
    parser.add_argument(
        "--cold-start",
        action="store_true",
        help="Treat the first Markdown request as a non-retried cold-start probe",
    )
    parser.add_argument(
        "--max-cold-total",
        type=float,
        default=30.0,
        help="Maximum total seconds for the cold-start probe",
    )
    args = parser.parse_args()
    if args.max_cold_total <= 0:
        parser.error("--max-cold-total must be greater than zero")

    known_learn_slugs = load_learn_slugs()
    known_learn_aliases = load_learn_aliases()
    known_blog_slugs = load_blog_slugs()
    blog_redirects = load_blog_redirects()
    if known_learn_aliases.get(KNOWN_LEARN_ALIAS) != KNOWN_LEARN_ALIAS_TARGET:
        raise ValueError(
            f"Known Learn alias {KNOWN_LEARN_ALIAS} must target {KNOWN_LEARN_ALIAS_TARGET}"
        )

    if args.all_learn:
        learn_slugs = sorted(known_learn_slugs)
    elif args.learn_slugs:
        learn_slugs = args.learn_slugs
        validate_known_slugs("learn", learn_slugs, known_learn_slugs)
    else:
        learn_slugs = resolve_default_slugs("learn", DEFAULT_LEARN_SLUGS, known_learn_slugs)

    if args.all_blog:
        blog_slugs = sorted(known_blog_slugs)
    elif args.blog_slugs:
        blog_slugs = args.blog_slugs
        validate_known_slugs("blog", blog_slugs, known_blog_slugs)
    else:
        blog_slugs = resolve_default_slugs("blog", DEFAULT_BLOG_SLUGS, known_blog_slugs)

    base_url = args.base_url.rstrip("/")
    failures: list[tuple[str, int | str]] = []
    gzip_route_paths = [*GZIP_ROUTE_PATHS, f"/api/md/{learn_slugs[0]}"]
    canonical_learn_slug = learn_slugs[0]
    markdown_expectations = {
        f"/api/md/{canonical_learn_slug}": RouteExpectation(
            status=200,
            markers=(
                "# ",
                f"| URL | https://leetllm.com/learn/{canonical_learn_slug} |",
            ),
        ),
        f"/api/md/{KNOWN_LEARN_ALIAS}": RouteExpectation(
            status=200,
            markers=(
                "# ",
                f"| URL | https://leetllm.com/learn/{KNOWN_LEARN_ALIAS_TARGET} |",
            ),
        ),
        "/api/md/ab-testing": RouteExpectation(
            status=200,
            markers=("# A/B testing", "| Type | Glossary |"),
        ),
        "/api/md/does-not-exist": RouteExpectation(
            status=404,
            markers=("# Not Found", "No article, blog post, or glossary entry found"),
        ),
    }

    print("   Checking canonical, glossary, and missing Markdown routes")
    failures.extend(
        check_route_expectations(
            base_url,
            markdown_expectations,
            args.timeout,
            args.retries,
            args.backoff,
            args.cold_start,
            args.max_cold_total,
        )
    )

    print(f"   Checking {len(learn_slugs)} learn route(s)")
    failures.extend(check_routes(base_url, "learn", learn_slugs, args.timeout, args.retries, args.backoff))

    print(f"   Checking {len(blog_slugs)} blog route(s)")
    failures.extend(check_routes(base_url, "blog", blog_slugs, args.timeout, args.retries, args.backoff))

    print(f"   Checking {len(blog_redirects)} blog alias/redirect(s)")
    failures.extend(check_redirects(base_url, blog_redirects, args.timeout, args.retries, args.backoff))

    print("   Checking content stability after sign-out")
    failures.extend(
        check_auth_transition_stability(
            base_url,
            learn_slugs[0],
            blog_slugs[0],
            args.timeout,
            args.retries,
            args.backoff,
        )
    )

    print(f"   Checking gzip negotiation on {len(gzip_route_paths)} public text route(s)")
    failures.extend(
        check_gzip_negotiation(
            base_url,
            gzip_route_paths,
            args.timeout,
            args.retries,
            args.backoff,
        )
    )

    if failures:
        print(f"\nFAIL {len(failures)} content smoke route(s) failed")
        for url, detail in failures:
            print(f"   {url} -> {detail}")
        return 1

    print(
        f"\nOK {len(learn_slugs) + len(blog_slugs)} content smoke route(s) returned 200; "
        f"{len(markdown_expectations)} Markdown route expectations passed; "
        f"{len(blog_redirects)} blog alias/redirect(s) valid; auth transition preserved content routes; "
        f"{len(gzip_route_paths)} public text route(s) negotiated gzip"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
