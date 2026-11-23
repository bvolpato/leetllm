#!/usr/bin/env python3
"""
Validate that every non-final learn article ends with a correct "Next" callout
that matches the canonical curriculum order defined in questions.ts.

Usage:
  python3 scripts/validate-next-callouts.py

This validator is intended to be run as part of deployment validation.
It will exit with code 1 if any article has a missing, malformed, or incorrect "Next" anchor.
"""

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple

from content_bundle import load_content_bundle

REPO_ROOT = Path(__file__).resolve().parents[1]
WEB_DIR = REPO_ROOT / "web"
CONTENT_DIR = WEB_DIR / "src" / "content"

# Regex for a valid Next callout (flexible but must contain the slug)
NEXT_PATTERN = re.compile(
    r'>\s*\*\*Next:\*\*[^\n]*?\[([^\]]+)\]\(/learn/([^)]+)\)[^\n]*',
    re.IGNORECASE
)


def get_canonical_order() -> List[str]:
    """Load the flat ordered list of learn article slugs using the TS source of truth."""
    try:
        # Import tsx through Node instead of invoking its CLI. The CLI starts
        # an IPC server, which fails in restricted build and validation sandboxes.
        source = """
const { getQuestions } = require('./src/lib/questions.ts');
const learn = getQuestions().filter((question) => question.section !== 'blog');
process.stdout.write(JSON.stringify(learn.map((question) => question.slug)));
"""
        try:
            cmd = ["node", "--import", "tsx", "-e", source]
            result = subprocess.run(
                cmd,
                cwd=WEB_DIR,
                capture_output=True,
                text=True,
                check=True,
                timeout=90
            )
        except (subprocess.CalledProcessError, FileNotFoundError):
            cmd = ["pnpm", "exec", "tsx", "-e", source]
            result = subprocess.run(
                cmd,
                cwd=WEB_DIR,
                capture_output=True,
                text=True,
                check=True,
                timeout=90
            )

        slugs: List[str] = json.loads(result.stdout.strip())
        return slugs
    except Exception as e:
        print(f"ERROR: Failed to load canonical order from questions.ts: {e}", file=sys.stderr)
        sys.exit(1)


def find_content_md(slug: str) -> Path | None:
    """Find the content.md for a given slug by walking the content directory."""
    for md_path in CONTENT_DIR.rglob("content.md"):
        if md_path.parent.name == slug:
            return md_path
    return None


def get_last_lines(path: Path, n: int = 10) -> str:
    """Return the last n lines of a file as a single string."""
    try:
        bundle = load_content_bundle(path.parent, "website")
        if bundle is None:
            return ""
        lines = bundle.body.splitlines()
        return "\n".join(lines[-n:]).strip()
    except Exception:
        return ""


def extract_next_slug_from_tail(tail_text: str) -> str | None:
    """Extract the target slug from a Next callout in the given text."""
    match = NEXT_PATTERN.search(tail_text)
    if match:
        return match.group(2).strip()
    return None


def main() -> int:
    print("🔍 Validating 'Next' callouts against canonical curriculum order...")

    canonical_slugs = get_canonical_order()
    if not canonical_slugs:
        print("ERROR: No learn articles found in canonical order.", file=sys.stderr)
        return 1

    content_paths_by_slug = {
        path.parent.name: path for path in CONTENT_DIR.rglob("content.md")
    }
    errors: List[Tuple[str, str]] = []

    for i, slug in enumerate(canonical_slugs):
        is_last = (i == len(canonical_slugs) - 1)
        content_path = content_paths_by_slug.get(slug)

        if not content_path or not content_path.exists():
            errors.append((slug, f"Could not find content.md for slug '{slug}'"))
            continue

        tail = get_last_lines(content_path, n=10)

        if is_last:
            if "> **Course complete:**" not in tail or "](/learn)" not in tail:
                errors.append((
                    slug,
                    "Final lesson must end with a '**Course complete:**' callout "
                    "linking back to /learn.",
                ))
            continue

        next_slug_in_callout = extract_next_slug_from_tail(tail)

        if not next_slug_in_callout:
            errors.append((
                slug,
                "Missing or malformed 'Next' callout in the last 10 lines.\n"
                "Expected something like:\n"
                "> **Next:** Continue to [Exact Title](/learn/exact-next-slug). ..."
            ))
            continue

        expected_next = canonical_slugs[i + 1]

        if next_slug_in_callout != expected_next:
            errors.append((
                slug,
                f"Wrong 'Next' target in callout.\n"
                f"  Found:    /learn/{next_slug_in_callout}\n"
                f"  Expected: /learn/{expected_next}\n"
                f"  (Canonical order is defined in web/src/lib/questions.ts)"
            ))
            continue

        next_content_path = content_paths_by_slug.get(expected_next)
        next_bundle = (
            load_content_bundle(next_content_path.parent, "website")
            if next_content_path is not None
            else None
        )
        expected_title = next_bundle.metadata.get("title") if next_bundle else None
        callout_match = NEXT_PATTERN.search(tail)
        actual_title = callout_match.group(1).strip() if callout_match else None

        if expected_title and actual_title != expected_title:
            errors.append((
                slug,
                f"Wrong 'Next' article title in callout.\n"
                f"  Found:    {actual_title}\n"
                f"  Expected: {expected_title}\n"
                f"  Target:   /learn/{expected_next}",
            ))

    if errors:
        print("\n❌ 'Next' callout validation failed!\n", file=sys.stderr)
        for slug, msg in errors:
            print(f"  • {slug}", file=sys.stderr)
            print(f"    {msg}\n", file=sys.stderr)
        print("Fix the 'Next' callouts at the end of the listed content.md files.", file=sys.stderr)
        return 1

    print(
        f"✅ All {len(canonical_slugs) - 1} non-final articles have correct "
        "'Next' titles and targets; the final course-complete callout is valid."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
