#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

from __future__ import annotations

import importlib.util
import io
import json
import sys
import threading
import tempfile
import unittest
from contextlib import redirect_stdout
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import call, patch


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))
spec = importlib.util.spec_from_file_location(
    "validate_live_content_routes",
    SCRIPTS_DIR / "validate-live-content-routes.py",
)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load validate-live-content-routes.py")
validator = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = validator
spec.loader.exec_module(validator)


class MarkdownHandler(BaseHTTPRequestHandler):
    requests: list[str] = []
    responses: dict[str, tuple[int, bytes]] = {}

    def do_GET(self) -> None:  # noqa: N802
        self.requests.append(self.path)
        status, body = self.responses[self.path]
        self.send_response(status)
        self.send_header("Content-Type", "text/markdown; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        pass


class LiveMarkdownValidationTest(unittest.TestCase):
    def setUp(self) -> None:
        MarkdownHandler.requests = []
        MarkdownHandler.responses = {
            "/api/md/canonical": (
                200,
                b"# Canonical\n\n| URL | https://leetllm.com/learn/canonical |\n",
            ),
            "/api/md/legacy": (
                200,
                b"# Canonical\n\n| URL | https://leetllm.com/learn/canonical |\n",
            ),
            "/api/md/missing": (404, b"# Not Found\n"),
        }
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), MarkdownHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        host, port = self.server.server_address
        self.base_url = f"http://{host}:{port}"

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def test_cold_probe_reads_body_reports_timings_then_checks_alias(self) -> None:
        expectations = {
            "/api/md/canonical": validator.RouteExpectation(
                status=200,
                markers=("# Canonical", "https://leetllm.com/learn/canonical"),
            ),
            "/api/md/legacy": validator.RouteExpectation(
                status=200,
                markers=("https://leetllm.com/learn/canonical",),
            ),
            "/api/md/missing": validator.RouteExpectation(
                status=404,
                markers=("# Not Found",),
            ),
        }

        output = io.StringIO()
        with redirect_stdout(output):
            failures = validator.check_route_expectations(
                self.base_url,
                expectations,
                timeout=1,
                retries=2,
                backoff=0,
                cold_start=True,
                max_cold_total=1,
            )

        self.assertEqual(failures, [])
        self.assertEqual(
            MarkdownHandler.requests,
            ["/api/md/canonical", "/api/md/legacy", "/api/md/missing"],
        )
        self.assertIn("OK COLD", output.getvalue())
        self.assertIn("ttfb=", output.getvalue())
        self.assertIn("total=", output.getvalue())

    def test_response_body_limit_is_enforced(self) -> None:
        MarkdownHandler.responses["/api/md/large"] = (200, b"12345")
        with patch.object(validator, "MAX_MARKDOWN_BODY_BYTES", 4):
            with self.assertRaisesRegex(RuntimeError, "response body exceeds 4 bytes"):
                validator.route_response(f"{self.base_url}/api/md/large", timeout=1)

    def test_cold_http_5xx_probe_is_not_retried(self) -> None:
        MarkdownHandler.responses["/api/md/canonical"] = (503, b"Unavailable")
        output = io.StringIO()
        with redirect_stdout(output), patch.object(validator.time, "sleep") as sleep:
            failures = validator.check_route_expectations(
                self.base_url,
                {"/api/md/canonical": validator.RouteExpectation(200, ("# Canonical",))},
                timeout=1,
                retries=3,
                backoff=0.25,
                cold_start=True,
                max_cold_total=1,
            )

        self.assertEqual(MarkdownHandler.requests, ["/api/md/canonical"])
        self.assertEqual(len(failures), 1)
        self.assertIn("status=503 expected=200", failures[0][1])
        sleep.assert_not_called()


class RouteStatusRetryTest(unittest.TestCase):
    def test_http_500_then_200_retries_and_reports_the_initial_failure(self) -> None:
        url = "https://example.test/blog/post"
        output = io.StringIO()
        with (
            patch.object(validator, "route_status", side_effect=[500, 200]) as route,
            patch.object(validator.time, "sleep") as sleep,
            redirect_stdout(output),
        ):
            status = validator.route_status_with_retries(url, 1, 3, 0.25)

        self.assertEqual(status, 200)
        self.assertEqual(route.call_count, 2)
        sleep.assert_called_once_with(0.25)
        self.assertIn(f"WARN {url} attempt 1/3 status=500; retrying", output.getvalue())

    def test_persistent_http_503_exhausts_the_budget_and_fails_the_route(self) -> None:
        output = io.StringIO()
        with (
            patch.object(validator, "route_status", return_value=503) as route,
            patch.object(validator.time, "sleep") as sleep,
            redirect_stdout(output),
        ):
            failures = validator.check_routes("https://example.test", "blog", ["post"], 1, 3, 0.25)

        self.assertEqual(failures, [("https://example.test/blog/post", 503)])
        self.assertEqual(route.call_count, 3)
        self.assertEqual(sleep.call_args_list, [call(0.25), call(0.5)])
        self.assertEqual(output.getvalue().count("WARN"), 2)
        self.assertIn("FAIL https://example.test/blog/post status=503", output.getvalue())

    def test_non_5xx_statuses_return_without_retry(self) -> None:
        for expected in (200, 301, 308, 400, 404, 429):
            with (
                self.subTest(status=expected),
                patch.object(validator, "route_status", return_value=expected) as route,
                patch.object(validator.time, "sleep") as sleep,
            ):
                self.assertEqual(
                    validator.route_status_with_retries("https://example.test", 1, 3, 0.25),
                    expected,
                )
                route.assert_called_once()
                sleep.assert_not_called()

    def test_network_error_then_200_keeps_existing_retry_behavior(self) -> None:
        output = io.StringIO()
        with (
            patch.object(validator, "route_status", side_effect=[RuntimeError("connection closed"), 200]) as route,
            patch.object(validator.time, "sleep") as sleep,
            redirect_stdout(output),
        ):
            status = validator.route_status_with_retries("https://example.test", 1, 3, 0.25)

        self.assertEqual(status, 200)
        self.assertEqual(route.call_count, 2)
        sleep.assert_called_once_with(0.25)
        self.assertIn("error=connection closed; retrying", output.getvalue())


class PublicationAudienceRoutesTest(unittest.TestCase):
    def test_book_only_articles_and_aliases_are_not_website_smoke_targets(self) -> None:
        with tempfile.TemporaryDirectory(prefix="leetllm-smoke-audiences-") as directory:
            root = Path(directory)
            for section, slug, visibility in [
                ("fundamentals", "shared-lesson", {"book": False}),
                ("fundamentals", "book-chapter", {"website": False}),
                ("blog", "shared-post", {"book": False}),
                ("blog", "book-post", {"website": False}),
            ]:
                article = root / section / slug
                article.mkdir(parents=True)
                metadata = {"slug": slug, "aliases": [f"old-{slug}"], "visibility": visibility}
                (article / "content.md").write_text("---\n" + json.dumps(metadata) + "\n---\n\nShared text.\n")
            with patch.object(validator, "CONTENT_DIR", root), patch.object(validator, "BLOG_DIR", root / "blog"), patch.object(validator, "PRACTICE_DIR", root / "practice"):
                self.assertEqual(validator.load_learn_slugs(), {"shared-lesson"})
                self.assertEqual(validator.load_learn_aliases(), {"old-shared-lesson": "shared-lesson"})
                self.assertEqual(validator.load_blog_slugs(), {"shared-post"})
                self.assertEqual(validator.load_blog_redirects(), {"old-shared-post": "/blog/shared-post"})


if __name__ == "__main__":
    unittest.main()
