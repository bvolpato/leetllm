#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Run the shared TypeScript/Python audience contract examples."""

import json
import re
from pathlib import Path
import unittest

from content_audience import filter_content_for_audience, is_visible_to_audience


FIXTURES = json.loads((Path(__file__).resolve().parents[1] / "web/src/lib/content-audience.fixtures.json").read_text(encoding="utf-8"))


class ContentAudienceTest(unittest.TestCase):
    def test_authored_editions_match_typescript_contract(self):
        for fixture in FIXTURES["editions"]:
            with self.subTest(name=fixture["name"]):
                selected = filter_content_for_audience(fixture["content"], fixture["audience"], "chapter.md", fixture["edition"])
                self.assertEqual(selected, fixture["expected"])
                masked = filter_content_for_audience(fixture["content"], fixture["audience"], "chapter.md", fixture["edition"], preserve_offsets=True)
                self.assertEqual(len(masked), len(fixture["content"]))
                self.assertEqual([i for i, c in enumerate(masked) if c == "\n"], [i for i, c in enumerate(fixture["content"]) if c == "\n"])
                self.assertEqual(re.sub(r"\s+", "", masked), re.sub(r"\s+", "", selected))

    def test_hidden_edition_mismatches_fail(self):
        with self.assertRaisesRegex(ValueError, "Mismatched edition:reader:end"):
            filter_content_for_audience("<!-- leetllm: edition:reference:start -->hidden\n<!-- leetllm: edition:reader:end -->", "book", "chapter.md", "reader")

    def test_passages(self):
        for audience in ("book", "website"):
            for fixture in FIXTURES["passages"]:
                with self.subTest(audience=audience, name=fixture["name"]):
                    self.assertEqual(filter_content_for_audience(fixture["content"], audience, "lesson/content.md"), fixture[audience])

    def test_malformed_markers_fail_in_both_channels(self):
        for audience in ("book", "website"):
            for fixture in FIXTURES["errors"]:
                with self.subTest(audience=audience, name=fixture["name"]):
                    with self.assertRaises(ValueError) as caught:
                        filter_content_for_audience(fixture["content"], audience, "lesson/content.md")
                    self.assertIn(f'lesson/content.md:{fixture["line"]}:', str(caught.exception))
                    self.assertIn(fixture["message"], str(caught.exception))

    def test_visibility_and_legacy_flags_without_mutation(self):
        for audience in ("book", "website"):
            for fixture in FIXTURES["visibility"]:
                with self.subTest(audience=audience, name=fixture["name"]):
                    original = json.dumps(fixture["metadata"])
                    self.assertEqual(is_visible_to_audience(fixture["metadata"], audience), fixture[audience])
                    self.assertEqual(json.dumps(fixture["metadata"]), original)

    def test_invalid_visibility_cannot_hide_behind_quarantine(self):
        for audience in ("book", "website"):
            for metadata in FIXTURES["invalidVisibility"]:
                with self.subTest(audience=audience, metadata=metadata):
                    with self.assertRaisesRegex(ValueError, "Invalid content visibility"):
                        is_visible_to_audience(metadata, audience)


if __name__ == "__main__":
    unittest.main()
