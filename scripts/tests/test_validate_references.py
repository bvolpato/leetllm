#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path
from urllib.error import HTTPError
from unittest.mock import patch


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))
spec = importlib.util.spec_from_file_location(
    "validate_references",
    SCRIPTS_DIR / "validate-references.py",
)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load validate-references.py")
validate_references = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = validate_references
spec.loader.exec_module(validate_references)


class BotProtectionClassificationTest(unittest.TestCase):
    def test_eur_lex_403_is_warning(self) -> None:
        url = "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
        blocked = HTTPError(url, 403, "Forbidden", {}, None)

        with patch.object(validate_references, "open_url", side_effect=blocked):
            issues = validate_references.check_url("euAiAct2024", {"url": url})

        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["severity"], "warning")
        self.assertEqual(issues[0]["check"], "http_403_blocked")

    def test_eur_lex_non_403_http_failures_are_errors(self) -> None:
        url = "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"

        for status in (404, 500):
            with self.subTest(status=status):
                failure = HTTPError(url, status, "HTTP failure", {}, None)
                with patch.object(validate_references, "open_url", side_effect=failure):
                    issues = validate_references.check_url("euAiAct2024", {"url": url})

                self.assertEqual(len(issues), 1)
                self.assertEqual(issues[0]["severity"], "error")
                self.assertEqual(issues[0]["check"], "http_error")

    def test_eur_lex_get_fallback_exposes_non_403_failures(self) -> None:
        url = "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"

        for status in (404, 500):
            with self.subTest(status=status):
                head_blocked = HTTPError(url, 403, "Forbidden", {}, None)
                get_failure = HTTPError(url, status, "HTTP failure", {}, None)
                with patch.object(
                    validate_references,
                    "open_url",
                    side_effect=(head_blocked, get_failure),
                ):
                    issues = validate_references.check_url("euAiAct2024", {"url": url})

                self.assertEqual(len(issues), 1)
                self.assertEqual(issues[0]["severity"], "error")
                self.assertEqual(issues[0]["check"], "http_error")


if __name__ == "__main__":
    unittest.main()
