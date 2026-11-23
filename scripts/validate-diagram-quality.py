#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

from __future__ import annotations

import argparse
import re
import struct
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "web" / "src" / "content"
MERMAID_FENCE_RE = re.compile(r"```mermaid\n(.*?)\n```", re.DOTALL)
GENERATED_NAME_RE = re.compile(r"^content_diagram_\d+_(dark|light)\.png$")
THEMES = ("dark", "light")


@dataclass(frozen=True)
class Issue:
    path: Path
    message: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate rendered Mermaid diagram outputs for current content."
    )
    parser.add_argument(
        "--article",
        help="Limit validation to one article path like fundamentals/attention",
    )
    parser.add_argument(
        "--max-ratio",
        type=float,
        default=6.5,
        help="Maximum allowed width/height ratio for rendered PNGs (default: 6.5)",
    )
    return parser.parse_args()


def iter_article_dirs(article_filter: str | None) -> list[Path]:
    if article_filter:
        article_dir = CONTENT_DIR / article_filter
        if not article_dir.exists():
            raise SystemExit(f"Article not found: {article_dir}")
        return [article_dir]

    article_dirs: list[Path] = []
    for section_dir in sorted(CONTENT_DIR.iterdir()):
        if not section_dir.is_dir():
            continue
        for article_dir in sorted(section_dir.iterdir()):
            if article_dir.is_dir():
                article_dirs.append(article_dir)
    return article_dirs


def read_png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as handle:
        header = handle.read(24)

    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError("invalid PNG header")

    width, height = struct.unpack(">II", header[16:24])
    return width, height


def collect_expected_pngs(source_path: Path) -> set[str]:
    content = source_path.read_text()
    blocks = MERMAID_FENCE_RE.findall(content)
    expected: set[str] = set()
    for index, _block in enumerate(blocks):
        for theme in THEMES:
            expected.add(f"{source_path.stem}_diagram_{index}_{theme}.png")
    return expected


def validate_article(article_dir: Path, max_ratio: float) -> list[Issue]:
    issues: list[Issue] = []
    source_path = article_dir / "content.md"
    if not source_path.exists():
        return issues

    expected = collect_expected_pngs(source_path)
    generated_dir = article_dir / "diagrams" / "_generated"

    if expected and not generated_dir.exists():
        issues.append(Issue(source_path, "missing diagrams/_generated output directory"))
        return issues

    if generated_dir.exists():
        for path in sorted(generated_dir.iterdir()):
            if not path.is_file() or not GENERATED_NAME_RE.match(path.name):
                continue
            if path.name not in expected:
                issues.append(Issue(path, "stale generated Mermaid PNG not referenced by current content.md"))

    for filename in sorted(expected):
        png_path = generated_dir / filename
        if not png_path.exists():
            issues.append(Issue(png_path, "missing rendered Mermaid PNG"))
            continue

        try:
            width, height = read_png_size(png_path)
        except ValueError as exc:
            issues.append(Issue(png_path, f"invalid PNG: {exc}"))
            continue

        if height == 0:
            issues.append(Issue(png_path, "PNG height is zero"))
            continue

        ratio = width / height
        if ratio > max_ratio:
            issues.append(
                Issue(
                    png_path,
                    f"rendered diagram too wide: ratio {ratio:.2f} > {max_ratio:.2f}; split flow into rows or coalesce nodes",
                )
            )

    return issues


def main() -> int:
    args = parse_args()

    issues: list[Issue] = []
    for article_dir in iter_article_dirs(args.article):
        issues.extend(validate_article(article_dir, args.max_ratio))

    if issues:
        for issue in issues:
            rel_path = issue.path.relative_to(ROOT)
            print(f"ERROR {rel_path}: {issue.message}")
        print(f"\n{len(issues)} diagram quality issue(s) found.")
        return 1

    print("OK diagram quality checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
