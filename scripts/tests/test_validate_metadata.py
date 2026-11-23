#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

from __future__ import annotations

import importlib.util
import sys
import unittest
from datetime import date
from pathlib import Path


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))
spec = importlib.util.spec_from_file_location(
    "validate_metadata",
    SCRIPTS_DIR / "validate-metadata.py",
)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load validate-metadata.py")
validate_metadata = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validate_metadata)


class BlogFreshnessTest(unittest.TestCase):
    today = date(2026, 7, 14)

    def test_requires_freshness_dates_as_a_pair(self) -> None:
        errors = validate_metadata.validate_blog_freshness(
            {"verifiedAt": "2026-07-14"},
            self.today,
        )

        self.assertEqual(errors, ["$.verifiedAt and $.refreshAfter must be provided together"])

    def test_requires_refresh_date_after_verification(self) -> None:
        errors = validate_metadata.validate_blog_freshness(
            {
                "verifiedAt": "2026-07-14",
                "refreshAfter": "2026-07-14",
            },
            self.today,
        )

        self.assertIn("$.refreshAfter must be later than $.verifiedAt", errors)

    def test_rejects_expired_published_post(self) -> None:
        errors = validate_metadata.validate_blog_freshness(
            {
                "verifiedAt": "2026-06-01",
                "refreshAfter": "2026-07-13",
            },
            self.today,
        )

        self.assertIn(
            "$.refreshAfter: published blog freshness expired on 2026-07-13 "
            "(current date 2026-07-14)",
            errors,
        )

    def test_accepts_refresh_date_on_current_day(self) -> None:
        errors = validate_metadata.validate_blog_freshness(
            {
                "verifiedAt": "2026-07-13",
                "refreshAfter": "2026-07-14",
            },
            self.today,
        )

        self.assertEqual(errors, [])

    def test_drafts_and_private_posts_do_not_expire(self) -> None:
        freshness = {
            "verifiedAt": "2026-06-01",
            "refreshAfter": "2026-07-13",
        }

        self.assertEqual(
            validate_metadata.validate_blog_freshness(
                {**freshness, "draft": True},
                self.today,
            ),
            [],
        )
        self.assertEqual(
            validate_metadata.validate_blog_freshness(
                {**freshness, "private": True},
                self.today,
            ),
            [],
        )


if __name__ == "__main__":
    unittest.main()
