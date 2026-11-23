#!/usr/bin/env python3
"""
Validate article Markdown illustration references.

Generated illustrations are rendered as dark/light pairs, for example:
    illustrations/_generated/foo_dark.png
    illustrations/_generated/foo_light.png

Markdown should point at an actual file on disk, usually the dark variant.
The site renderer strips the _dark/_light suffix and emits both themed images.

Usage:
    python3 scripts/validate-illustration-refs.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from content_bundle import load_content_bundle

CONTENT_DIR = Path(__file__).resolve().parent.parent / "web" / "src" / "content"
SECTIONS = [
    "agents",
    "blog",
    "foundations",
    "fundamentals",
    "projects",
    "preparation",
    "llmops",
    "retrieval",
    "system-design",
    "training",
]

MARKDOWN_IMAGE_RE = re.compile(
    r"!\[[^\]]*\]\((?:\./)?illustrations/_generated/([^)]+\.png)\)"
)
HTML_IMAGE_RE = re.compile(
    r"<img\s+[^>]*src=\"(?:\./)?illustrations/_generated/([^\"]+\.png)\"[^>]*>"
)


def counterpart(path: Path) -> Path | None:
    stem = path.stem
    if stem.endswith("_dark"):
        return path.with_name(f"{stem[:-5]}_light{path.suffix}")
    if stem.endswith("_light"):
        return path.with_name(f"{stem[:-6]}_dark{path.suffix}")
    return None


def validate_article(article_dir: Path, section: str) -> int:
    bundle = load_content_bundle(article_dir)
    if bundle is None:
        return 0

    slug = article_dir.name
    content = bundle.body
    errors = 0

    refs = [
        match.group(1)
        for regex in (MARKDOWN_IMAGE_RE, HTML_IMAGE_RE)
        for match in regex.finditer(content)
    ]

    for ref in refs:
        image_path = article_dir / "illustrations" / "_generated" / ref
        if not image_path.exists():
            base = image_path.with_suffix("")
            dark = image_path.with_name(f"{base.name}_dark.png")
            light = image_path.with_name(f"{base.name}_light.png")
            if dark.exists() and light.exists():
                print(
                    f"   ERR {section}/{slug}: {ref} does not exist. "
                    f"Use {dark.name} so raw Markdown points at a real file."
                )
            else:
                print(f"   ERR {section}/{slug}: missing illustration file {ref}")
            errors += 1
            continue

        pair = counterpart(image_path)
        if pair is not None and not pair.exists():
            print(
                f"   ERR {section}/{slug}: {ref} exists but theme counterpart "
                f"{pair.name} is missing"
            )
            errors += 1

    illustration_dir = article_dir / "illustrations"
    if illustration_dir.exists():
        for source_file in sorted(illustration_dir.glob("*.tsx")):
            name = source_file.stem
            if not re.search(rf"\b{re.escape(name)}(?:_(?:dark|light))?\.png\b", content):
                print(
                    f"   ERR {section}/{slug}: illustration source "
                    f"{source_file.name} is not referenced in content.md"
                )
                errors += 1

    if errors == 0 and refs:
        print(f"   OK  {section}/{slug}: {len(refs)} illustration reference(s)")
    return errors


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--path", help="Validate one article, e.g. foundations/python-for-ai-engineering")
    args = parser.parse_args()

    errors = 0
    if args.path:
        if "/" not in args.path:
            print(f"FAIL article path must be folder/slug: {args.path}")
            return 1
        folder, slug = args.path.split("/", 1)
        article_dir = CONTENT_DIR / folder / slug
        if not article_dir.is_dir():
            print(f"FAIL article not found: {args.path}")
            return 1
        errors += validate_article(article_dir, folder)
    else:
        for section in SECTIONS:
            section_dir = CONTENT_DIR / section
            if not section_dir.is_dir():
                continue

            for article_dir in sorted(path for path in section_dir.iterdir() if path.is_dir()):
                errors += validate_article(article_dir, section)

    if errors:
        print(f"\nFAIL {errors} illustration reference error(s) found")
        return 1

    if args.path:
        print(f"\nOK illustration references for {args.path}")
    else:
        print("\nOK all Markdown illustration references point at real files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
