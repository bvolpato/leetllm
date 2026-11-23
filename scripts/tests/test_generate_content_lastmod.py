#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))
spec = importlib.util.spec_from_file_location(
    "generate_content_lastmod",
    SCRIPTS_DIR / "generate-content-lastmod.py",
)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load generate-content-lastmod.py")
generate_content_lastmod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generate_content_lastmod)


def blog_bundle(slug: str, **metadata: object) -> SimpleNamespace:
    article_dir = Path("/content/blog") / slug
    return SimpleNamespace(
        article_dir=article_dir,
        metadata={"slug": slug, **metadata},
        metadata_source=article_dir / "content.md",
    )


class BlogAliasValidationTest(unittest.TestCase):
    def test_private_canonical_post_can_preserve_its_old_url(self) -> None:
        bundles = [blog_bundle("new-private-slug", private=True, aliases=["old-private-slug"])]

        with (
            tempfile.TemporaryDirectory() as temp_dir,
            patch.object(generate_content_lastmod, "REPO_ROOT", Path(temp_dir)),
            patch.object(generate_content_lastmod, "OUTPUT_PATH", Path(temp_dir) / "lastmod.json"),
            patch.object(generate_content_lastmod, "ALIASES_OUTPUT_PATH", Path(temp_dir) / "aliases.json"),
            patch.object(generate_content_lastmod, "iter_content_bundles", return_value=bundles),
            patch.object(generate_content_lastmod, "load_committed_manifest", return_value={}),
            patch.object(
                generate_content_lastmod,
                "article_lastmod",
                return_value=datetime(2026, 9, 2, tzinfo=timezone.utc),
            ),
        ):
            self.assertEqual(generate_content_lastmod.main(), 0)
            aliases = json.loads((Path(temp_dir) / "aliases.json").read_text())
            self.assertEqual(aliases["blog"], {"old-private-slug": "new-private-slug"})

    def test_rejects_redirect_chain_target(self) -> None:
        bundles = [
            blog_bundle("canonical"),
            blog_bundle("retired", redirectTo="/blog/canonical"),
            blog_bundle("older", redirectTo="/blog/retired", private=True),
        ]

        with (
            patch.object(generate_content_lastmod, "iter_content_bundles", return_value=bundles),
            patch.object(generate_content_lastmod, "load_committed_manifest", return_value={}),
            patch.object(
                generate_content_lastmod,
                "article_lastmod",
                return_value=datetime(2026, 7, 16, tzinfo=timezone.utc),
            ),
        ):
            with self.assertRaisesRegex(
                ValueError,
                "Blog aliases and redirects must target non-draft canonical posts: retired",
            ):
                generate_content_lastmod.main()

    def test_dirty_social_banner_does_not_decode_binary_git_content(self) -> None:
        banner = Path("/content/fundamentals/example/social_banner.png")

        with (
            patch.object(generate_content_lastmod, "is_dirty", return_value=True),
            patch.object(generate_content_lastmod, "committed_file_text") as committed,
        ):
            self.assertTrue(generate_content_lastmod.is_substantively_dirty(banner))
            committed.assert_not_called()


if __name__ == "__main__":
    unittest.main()
