#!/usr/bin/env python3
"""
Validate article reading-time estimates are derived from content length.

The estimate is intentionally mechanical:
    ceil(weighted_words / WORDS_PER_MINUTE * difficulty_coefficient)

Usage:
    uv run scripts/update-time-estimates.py          # show persisted metadata fields to remove
    uv run scripts/update-time-estimates.py --check  # fail if timeEstimate is still persisted
"""

import argparse
import math
import re
import sys
from pathlib import Path

from content_bundle import ContentBundle, iter_content_bundles

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "web" / "src" / "content"

WORDS_PER_MINUTE = 260
CODE_WORD_WEIGHT = 0.45
TABLE_CELL_WEIGHT = 0.35
MIN_MINUTES_BY_DIFFICULTY = {
    "Easy": 5,
    "Medium": 7,
    "Hard": 9,
}
MIN_BLOG_MINUTES = 5
MAX_LESSON_MINUTES = 120
MAX_BLOG_MINUTES = 60

DIFFICULTY_COEFFICIENTS = {
    "Easy": 1.0,
    "Medium": 1.25,
    "Hard": 1.5,
}

WORD_RE = re.compile(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?")
FENCED_BLOCK_RE = re.compile(r"```.*?```", re.DOTALL)


def count_words(text: str) -> int:
    return len(WORD_RE.findall(text))


def split_fenced_blocks(markdown: str) -> tuple[str, list[str]]:
    blocks: list[str] = []

    def replace(match: re.Match[str]) -> str:
        block = match.group(0)
        if not block.startswith("```mastery-quiz"):
            blocks.append(block)
        return "\n"

    prose = FENCED_BLOCK_RE.sub(replace, markdown)
    return prose, blocks


def strip_markdown_noise(markdown: str) -> str:
    lines = []
    for line in markdown.splitlines():
        stripped = line.strip()
        if stripped.startswith("!["):
            continue
        if stripped.startswith("[^") and "]:" in stripped:
            continue
        lines.append(line)

    text = "\n".join(lines)
    text = re.sub(r"!\[[^\]]*]\([^)]+\)", " ", text)
    text = re.sub(r"\[([^\]]+)]\([^)]+\)", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"[*_>#~]", " ", text)
    return text


def estimate_minutes(content: str, difficulty: str, is_blog: bool) -> int:
    prose, code_blocks = split_fenced_blocks(content)
    prose_text = strip_markdown_noise(prose)

    prose_words = count_words(prose_text)
    code_words = sum(count_words(block) for block in code_blocks)
    table_cells = sum(
        max(0, line.count("|") - 1)
        for line in prose.splitlines()
        if line.strip().startswith("|") and line.strip().endswith("|")
    )

    weighted_words = prose_words + (code_words * CODE_WORD_WEIGHT) + (table_cells * TABLE_CELL_WEIGHT)
    coefficient = DIFFICULTY_COEFFICIENTS.get(difficulty, DIFFICULTY_COEFFICIENTS["Medium"])
    estimate = math.ceil((weighted_words / WORDS_PER_MINUTE) * coefficient)
    min_minutes = MIN_BLOG_MINUTES if is_blog else MIN_MINUTES_BY_DIFFICULTY.get(difficulty, MIN_MINUTES_BY_DIFFICULTY["Medium"])
    max_minutes = MAX_BLOG_MINUTES if is_blog else MAX_LESSON_MINUTES
    return max(min_minutes, min(max_minutes, estimate))


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate LeetLLM reading times are derived from WPM")
    parser.add_argument("--check", action="store_true", help="fail if timeEstimate is still persisted")
    args = parser.parse_args()

    persisted_fields: list[tuple[ContentBundle, int, int, str]] = []

    for bundle in iter_content_bundles(CONTENT_DIR, "website"):
        metadata = bundle.metadata
        is_blog = bundle.article_dir.parent.name == "blog"
        difficulty = metadata.get("difficulty", "Medium")
        new_time_estimate = estimate_minutes(bundle.body, difficulty, is_blog)

        if "timeEstimate" in metadata:
            old_time_estimate = metadata["timeEstimate"]
            persisted_fields.append((bundle, old_time_estimate, new_time_estimate, difficulty))

    if not persisted_fields:
        print("All reading times are derived; no persisted timeEstimate metadata.")
        return 0

    for bundle, old, new, difficulty in persisted_fields:
        rel = bundle.metadata_source.relative_to(ROOT)
        print(f"{rel}: remove persisted timeEstimate {old}; derived value is {new} ({difficulty})")

    if args.check:
        print(f"\n{len(persisted_fields)} persisted timeEstimate value(s). Inspect and edit each reported bundle directly.")
        return 1

    print(f"\nFound {len(persisted_fields)} persisted timeEstimate value(s); no files changed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
