#!/usr/bin/env python3
"""
Validate every declared coverImage field points to an existing file.

coverImage values are relative to the article's directory (e.g., for an
article at content/{section}/{slug}/ the coverImage path
illustrations/_generated/foo_dark.png resolves to
content/{section}/{slug}/illustrations/_generated/foo_dark.png on disk).

Usage:
    python3 scripts/validate-coverimages.py

Exit codes:
    0 — all coverImages exist
    1 — one or more declared coverImage files are missing
"""

import sys
from pathlib import Path

from content_bundle import iter_content_bundles

CONTENT_DIR = Path(__file__).resolve().parent.parent / "web" / "src" / "content"
NON_ARTICLE_SECTIONS = {"glossary", "practice"}


def validate_coverimages() -> int:
    errors = 0

    for bundle in iter_content_bundles(CONTENT_DIR):
        if bundle.article_dir.parent.name in NON_ARTICLE_SECTIONS:
            continue
        label = f"{bundle.article_dir.parent.name}/{bundle.article_dir.name}"
        cover_image = bundle.metadata.get("coverImage")
        if not cover_image:
            print(f"   ✅ {label}: no explicit coverImage; runtime fallback applies")
            continue

        cover_path = bundle.article_dir / str(cover_image)
        if not cover_path.exists():
            print(f"   ❌ {label}: coverImage file not found: {cover_image}")
            errors += 1
        else:
            print(f"   ✅ {label}: {cover_image}")

    return errors


if __name__ == "__main__":
    errors = validate_coverimages()
    if errors > 0:
        print(f"\n❌ {errors} declared coverImage error(s) found")
        sys.exit(1)
    print("\n✅ All declared coverImages exist")
    sys.exit(0)
