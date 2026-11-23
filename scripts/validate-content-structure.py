#!/usr/bin/env python3
"""
Validate Markdown/content structure that can render incorrectly while still
passing metadata and reference checks.

Checks:
  - Article and blog content bodies do not repeat page-owned H1 titles.
  - Display math uses delimiter-only lines:
      $$
      equation
      $$
    One-line $$x = 1$$ parses as inline math and is rejected.
  - Foundation/preparation HTML illustration refs are wrapped in <figure> with
    a nonempty <figcaption>.
  - Markdown table header, separator, and body rows have matching column counts.
  - Local asset and glossary references resolve.

Teaching quality, factual accuracy, and visual layout require manual review.
Rendered diagram dimensions are checked by validate-diagram-quality.py.

Usage:
    python3 scripts/validate-content-structure.py
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from content_audience import filter_content_for_audience

CONTENT_DIR = Path(__file__).resolve().parent.parent / "web" / "src" / "content"
GLOSSARY_DIR = CONTENT_DIR / "glossary"
SECTIONS = [
    "agents",
    "blog",
    "foundations",
    "fundamentals",
    "interviewing",
    "projects",
    "preparation",
    "llmops",
    "retrieval",
    "system-design",
    "training",
]

FENCE_RE = re.compile(r"^\s*(?:`{3,}|~{3,})")
TOP_LEVEL_HEADING_RE = re.compile(r"^#\s+\S")
GENERATED_HTML_IMG_RE = re.compile(
    r"<img\s+[^>]*src=\"illustrations/_generated/([^\"]+\.png)\"[^>]*>",
    re.IGNORECASE,
)
MARKDOWN_ASSET_LINK_RE = re.compile(r"\[[^\]]+\]\(assets/([^)]+)\)")
HTML_ASSET_LINK_RE = re.compile(r'href="assets/([^"]+)"', re.IGNORECASE)
FIGURE_RE = re.compile(r"<figure>[\s\S]*?</figure>", re.IGNORECASE)
FIGCAPTION_RE = re.compile(r"<figcaption>([\s\S]*?)</figcaption>", re.IGNORECASE)
TABLE_SEPARATOR_RE = re.compile(r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$")
GLOSSARY_SPAN_RE = re.compile(r"<span\s+[^>]*data-glossary=\"([^\"]+)\"", re.IGNORECASE)


@dataclass
class Issue:
    path: Path
    message: str
    line: int | None = None

    def format(self) -> str:
        rel = self.path.relative_to(CONTENT_DIR.parent.parent.parent)
        suffix = f":{self.line}" if self.line is not None else ""
        return f"   ERR {rel}{suffix}: {self.message}"


def content_files() -> list[tuple[str, Path]]:
    files: list[tuple[str, Path]] = []
    for section in SECTIONS:
        section_dir = CONTENT_DIR / section
        if not section_dir.is_dir():
            continue

        for article_dir in sorted(path for path in section_dir.iterdir() if path.is_dir()):
            content_path = article_dir / "content.md"
            if content_path.exists():
                files.append((section, content_path))
    return files


def validate_display_math(path: Path, content: str) -> list[Issue]:
    issues: list[Issue] = []
    in_fence = False
    in_math_block = False
    math_start_line: int | None = None

    for line_number, line in enumerate(content.splitlines(), start=1):
        stripped = line.strip()

        if FENCE_RE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        if not in_math_block:
            if stripped == "$$":
                in_math_block = True
                math_start_line = line_number
                continue

            if (stripped.startswith("$$") or stripped.endswith("$$")) and stripped.count("$$") >= 2:
                issues.append(
                    Issue(
                        path,
                        "display math delimiters must be on their own lines; use single dollars for inline math",
                        line_number,
                    )
                )
                continue

            if stripped.startswith("$$") and not stripped.endswith("$$"):
                issues.append(
                    Issue(
                        path,
                        "multiline display math opener must be on its own line",
                        line_number,
                    )
                )
                in_math_block = True
                math_start_line = line_number
                continue

            if stripped.endswith("$$") and not stripped.startswith("$$"):
                issues.append(
                    Issue(
                        path,
                        "display math closer found without an opener on its own line",
                        line_number,
                    )
                )
            continue

        if stripped == "$$":
            in_math_block = False
            math_start_line = None
            continue

        if stripped.endswith("$$"):
            issues.append(
                Issue(
                    path,
                    "multiline display math closer must be on its own line",
                    line_number,
                )
            )
            in_math_block = False
            math_start_line = None
            continue

        if stripped.startswith("$$"):
            issues.append(
                Issue(
                    path,
                    "nested or repeated display math opener inside math block",
                    line_number,
                )
            )

    if in_math_block:
        issues.append(
            Issue(
                path,
                f"unclosed display math block opened on line {math_start_line}",
                math_start_line,
            )
        )

    return issues


def validate_page_owned_h1(path: Path, content: str) -> list[Issue]:
    issues: list[Issue] = []
    in_fence = False

    for line_number, line in enumerate(content.splitlines(), start=1):
        if FENCE_RE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if TOP_LEVEL_HEADING_RE.match(line):
            issues.append(
                Issue(
                    path,
                    "content body must not include an H1; page shell renders metadata title",
                    line_number,
                )
            )

    return issues


def figure_for_offset(figures: list[re.Match[str]], offset: int) -> re.Match[str] | None:
    for figure in figures:
        if figure.start() <= offset < figure.end():
            return figure
    return None


def validate_generated_figure_captions(section: str, path: Path, content: str) -> list[Issue]:
    if section not in {"foundations", "preparation"}:
        return []

    issues: list[Issue] = []
    figures = list(FIGURE_RE.finditer(content))

    for match in GENERATED_HTML_IMG_RE.finditer(content):
        figure = figure_for_offset(figures, match.start())
        if figure is None:
            issues.append(
                Issue(
                    path,
                    f"{match.group(1)} must be wrapped in <figure> with a caption",
                )
            )
            continue

        caption_match = FIGCAPTION_RE.search(figure.group(0))
        if caption_match is None:
            issues.append(Issue(path, f"{match.group(1)} figure missing <figcaption>"))
            continue

        caption = " ".join(re.sub(r"<[^>]+>", "", caption_match.group(1)).split())
        if not caption:
            issues.append(Issue(path, f"{match.group(1)} figure caption is empty"))

    return issues


def split_table_cells(line: str) -> list[str]:
    stripped = line.strip()
    if stripped.startswith("|"):
        stripped = stripped[1:]
    if stripped.endswith("|") and not stripped.endswith(r"\|"):
        stripped = stripped[:-1]

    cells: list[str] = []
    current: list[str] = []
    escaped = False

    for char in stripped:
        if escaped:
            current.append(char)
            escaped = False
            continue
        if char == "\\":
            current.append(char)
            escaped = True
            continue
        if char == "|":
            cells.append("".join(current))
            current = []
            continue
        current.append(char)

    cells.append("".join(current))
    return cells


def validate_markdown_tables(path: Path, content: str) -> list[Issue]:
    issues: list[Issue] = []
    lines = content.splitlines()
    in_fence = False
    in_math_block = False
    index = 0

    while index < len(lines):
        line = lines[index]
        stripped = line.strip()

        if FENCE_RE.match(line):
            in_fence = not in_fence
            index += 1
            continue
        if in_fence:
            index += 1
            continue
        if stripped == "$$":
            in_math_block = not in_math_block
            index += 1
            continue
        if in_math_block:
            index += 1
            continue

        if (
            index + 1 < len(lines)
            and stripped.startswith("|")
            and TABLE_SEPARATOR_RE.match(lines[index + 1])
        ):
            expected = len(split_table_cells(line))
            separator_count = len(split_table_cells(lines[index + 1]))
            if expected != separator_count:
                issues.append(
                    Issue(
                        path,
                        f"markdown table separator has {separator_count} columns; header has {expected}",
                        index + 2,
                    )
                )

            row_index = index + 2
            while row_index < len(lines) and lines[row_index].strip().startswith("|"):
                row_count = len(split_table_cells(lines[row_index]))
                if row_count != expected:
                    issues.append(
                        Issue(
                            path,
                            f"markdown table row has {row_count} columns; header has {expected}",
                            row_index + 1,
                        )
                    )
                row_index += 1

            index = row_index
            continue

        index += 1

    return issues


def validate_asset_links(path: Path, content: str) -> list[Issue]:
    issues: list[Issue] = []

    for regex in (MARKDOWN_ASSET_LINK_RE, HTML_ASSET_LINK_RE):
        for match in regex.finditer(content):
            relative_asset_path = match.group(1)
            line = content.count("\n", 0, match.start()) + 1
            if ".." in Path(relative_asset_path).parts:
                issues.append(
                    Issue(
                        path,
                        f"asset link must stay inside assets/: {relative_asset_path}",
                        line,
                    )
                )
                continue

            asset_path = path.parent / "assets" / relative_asset_path
            if not asset_path.exists():
                issues.append(
                    Issue(
                        path,
                        f"asset link target does not exist: assets/{relative_asset_path}",
                        line,
                    )
                )

    return issues


def validate_glossary_refs(path: Path, content: str, glossary_ids: set[str]) -> list[Issue]:
    issues: list[Issue] = []

    for match in GLOSSARY_SPAN_RE.finditer(content):
        glossary_id = match.group(1)
        if glossary_id not in glossary_ids:
            line = content.count("\n", 0, match.start()) + 1
            issues.append(Issue(path, f"glossary id has no web/src/content/glossary/{glossary_id}.md entry", line))

    return issues


def files_for_path(rel_path: str | None) -> list[tuple[str, Path]]:
    if not rel_path:
        return content_files()
    if "/" not in rel_path:
        print(f"FAIL article path must be folder/slug: {rel_path}")
        sys.exit(1)
    folder, slug = rel_path.split("/", 1)
    content_path = CONTENT_DIR / folder / slug / "content.md"
    if not content_path.exists():
        print(f"FAIL article not found: {rel_path}")
        sys.exit(1)
    return [(folder, content_path)]


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--path", help="Validate one article, e.g. foundations/python-for-ai-engineering")
    args = parser.parse_args()

    issues: list[Issue] = []
    glossary_ids = {
        path.stem
        for path in GLOSSARY_DIR.glob("*.md")
    }

    for section, path in files_for_path(args.path):
        source = path.read_text()
        seen_views: set[str] = set()
        for audience, edition in (("website", "reference"), ("book", "reference"), ("book", "reader")):
            try:
                content = filter_content_for_audience(source, audience, str(path), edition)
            except ValueError as exc:
                issues.append(Issue(path, str(exc)))
                break
            if content in seen_views:
                continue
            seen_views.add(content)
            issues.extend(validate_page_owned_h1(path, content))
            issues.extend(validate_display_math(path, content))
            issues.extend(validate_markdown_tables(path, content))
            issues.extend(validate_generated_figure_captions(section, path, content))
            issues.extend(validate_asset_links(path, content))
            issues.extend(validate_glossary_refs(path, content, glossary_ids))

    if issues:
        for issue in issues:
            print(issue.format())
        print(f"\nFAIL {len(issues)} content structure issue(s) found")
        return 1

    if args.path:
        print(f"OK content structure checks passed for {args.path}")
    else:
        print("OK content structure checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
