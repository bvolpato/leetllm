#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Guard against overpacked article illustrations."""

from __future__ import annotations

import re
import sys
from argparse import ArgumentParser
from dataclasses import dataclass
from pathlib import Path

from content_bundle import EMBEDDED_ILLUSTRATION_RE, ContentBundle, iter_content_bundles, parse_attributes


REPO_ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = REPO_ROOT / "web" / "src" / "content"

MAX_AREA = 900_000
MAX_HEIGHT = 900
MAX_ASPECT_RATIO = 1.40
MAX_SOURCE_LINES = 180
MAX_TEXT_WORDS = 220
MAX_DENSE_GROUPS = 12
CRITICAL_SIGNAL_COUNT = 5
STRICT_HERO_TEXT_WORDS = 140
STRICT_TEXT_WORDS = 260
STRICT_LONG_TEXT_ITEMS = 5
STRICT_MAX_TEXT_ITEM_WORDS = 24
TEXT_REPORT_LIMIT = 40
NON_ARTICLE_SECTIONS = {"glossary", "practice"}
EXCLUDED_ILLUSTRATION_DIRS = {"_generated", "_parts", "node_modules"}

DENSE_GROUP_RE = re.compile(r"\b(?:Panel|CalloutCard|MetricCard|BarChart|DataTable|Flow)\b")
STRING_LITERAL_RE = re.compile(
    r"(?:^|(?<=[\s:=,(\[{]))(['\"`])"
    r"((?:\\.|(?!\1).)*?[A-Za-z](?:\\.|(?!\1).)*?)\1",
    re.S | re.M,
)
VISIBLE_PROP_RE = re.compile(
    r"\b(?:text|title|subtitle|eyebrow|label|sublabel|valueLabel|xAxisLabel|yAxisLabel|"
    r"note|caption|footer|block|hash|grant|grants)\s*:\s*(['\"`])"
    r"((?:\\.|(?!\1).)*?[A-Za-z](?:\\.|(?!\1).)*?)\1",
    re.S | re.M,
)
ALT_EXPORT_RE = re.compile(
    r"export\s+const\s+alt\s*=\s*(['\"`])"
    r"(?:\\.|(?!\1).)*?\1\s*;?",
    re.S | re.M,
)
WORD_RE = re.compile(r"\b[A-Za-z][A-Za-z0-9+-]*\b")
ELEMENT_NAME_RE = re.compile(r"^(?:div|span|svg|path|rect|circle|line|defs|linearGradient|stop|text|p|h[1-6])$")

LOW_SIGNAL_STRINGS = {
    "blue",
    "purple",
    "green",
    "warm",
    "cyan",
    "pink",
    "red",
    "critical",
    "neutral",
    "center",
    "stretch",
    "left",
    "right",
    "column",
    "row",
    "Inter",
    "JetBrains Mono",
    "nowrap",
    "relative",
    "absolute",
}

# Existing slide-like visuals. New visuals should not join this list.
LEGACY_CRITICAL_ALLOWLIST = {
}


@dataclass(frozen=True)
class DensityIssue:
    key: str
    path: Path
    line: int
    signals: tuple[str, ...]


@dataclass(frozen=True)
class TextStats:
    text_words: int
    text_items: int
    long_text_items: int
    max_text_item_words: int
    max_text_item_chars: int


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def exported_int(source: str, name: str) -> int:
    """Return an integer exported via `export const <name> = <int>`, or 0 if absent."""
    match = re.search(rf"export\s+const\s+{name}(?:\s*:\s*\w+)?\s*=\s*(\d+)", source)
    return int(match.group(1)) if match else 0


def visible_text_values(source: str) -> list[str]:
    source_without_imports = "\n".join(
        line for line in source.splitlines()
        if not line.strip().startswith("import ")
    )
    source_without_imports = ALT_EXPORT_RE.sub("", source_without_imports)
    values: list[str] = []
    seen: set[str] = set()

    def add_value(value: str, *, allow_single_word: bool = False) -> None:
        value = value.replace("\\n", " ")
        if "\n" in value:
            return
        if "${" in value:
            return
        if "../" in value or "/" in value:
            return
        if re.fullmatch(r"[MmLlHhVvCcSsQqTtAaZz0-9.,\s+-]+", value):
            return
        if re.fullmatch(r"[A-Za-z0-9_-]+", value) and not allow_single_word:
            return
        if ELEMENT_NAME_RE.fullmatch(value):
            return
        if value in LOW_SIGNAL_STRINGS:
            return
        if not WORD_RE.search(value):
            return
        if value in seen:
            return
        seen.add(value)
        values.append(value)

    for _, value in VISIBLE_PROP_RE.findall(source_without_imports):
        add_value(value, allow_single_word=True)
    for _, value in STRING_LITERAL_RE.findall(source_without_imports):
        add_value(value)
    return values


def text_stats(source: str) -> TextStats:
    text_words = 0
    text_items = 0
    long_text_items = 0
    max_text_item_words = 0
    max_text_item_chars = 0
    for value in visible_text_values(source):
        words = WORD_RE.findall(value)
        word_count = len(words)
        if word_count == 0:
            continue
        text_words += word_count
        text_items += 1
        max_text_item_words = max(max_text_item_words, word_count)
        max_text_item_chars = max(max_text_item_chars, len(value))
        if word_count >= 10 or len(value) >= 90:
            long_text_items += 1
    return TextStats(
        text_words=text_words,
        text_items=text_items,
        long_text_items=long_text_items,
        max_text_item_words=max_text_item_words,
        max_text_item_chars=max_text_item_chars,
    )


def density_signals(source: str, *, is_hero: bool = False, strict_text: bool = False) -> tuple[str, ...]:
    width = exported_int(source, "width")
    height = exported_int(source, "height")
    source_lines = len(source.strip().splitlines())
    stats = text_stats(source)
    dense_groups = len(DENSE_GROUP_RE.findall(source))

    signals: list[str] = []
    if width * height > MAX_AREA:
        signals.append(f"area {width * height} > {MAX_AREA}")
    if height > MAX_HEIGHT:
        signals.append(f"height {height} > {MAX_HEIGHT}")
    if width > 0 and height / width > MAX_ASPECT_RATIO:
        signals.append(f"aspect ratio {height / width:.2f} > {MAX_ASPECT_RATIO:.2f}")
    if source_lines > MAX_SOURCE_LINES:
        signals.append(f"source lines {source_lines} > {MAX_SOURCE_LINES}")
    if stats.text_words > MAX_TEXT_WORDS:
        signals.append(f"text words {stats.text_words} > {MAX_TEXT_WORDS}")
    if dense_groups > MAX_DENSE_GROUPS:
        signals.append(f"dense groups {dense_groups} > {MAX_DENSE_GROUPS}")
    if strict_text:
        if is_hero and stats.text_words > STRICT_HERO_TEXT_WORDS and stats.long_text_items >= 3:
            signals.append(
                f"hero text burden {stats.text_words} words with {stats.long_text_items} long text item(s)"
            )
        if stats.text_words > STRICT_TEXT_WORDS and stats.long_text_items >= STRICT_LONG_TEXT_ITEMS:
            signals.append(
                f"text burden {stats.text_words} words with {stats.long_text_items} long text item(s)"
            )
        if stats.max_text_item_words > STRICT_MAX_TEXT_ITEM_WORDS:
            signals.append(
                f"longest text item {stats.max_text_item_words} words > {STRICT_MAX_TEXT_ITEM_WORDS}"
            )
    return tuple(signals)


def _display_path(path: Path) -> Path:
    """Return a repository-relative path when possible, falling back to the given path."""
    try:
        return path.relative_to(REPO_ROOT)
    except ValueError:
        return path


def _iter_bundle_illustrations(
    bundle: ContentBundle,
    seen_keys: set[str],
) -> list[tuple[str, Path, int, str, bool, TextStats | None]]:
    """Yield deduplicated embedded and standalone illustrations for one content bundle."""
    items: list[tuple[str, Path, int, str, bool, TextStats | None]] = []
    raw_content = bundle.content_path.read_text(encoding="utf-8")
    article = bundle.article_dir.relative_to(CONTENT_DIR).as_posix()

    for index, match in enumerate(EMBEDDED_ILLUSTRATION_RE.finditer(raw_content)):
        attrs = parse_attributes(match.group(1))
        name = attrs.get("name", "unnamed").removesuffix(".tsx")
        key = f"{article}/{name}"
        if key in seen_keys:
            continue
        seen_keys.add(key)
        is_hero = index == 0 or name == "chapter_flow"
        items.append((
            key,
            bundle.content_path,
            line_number(raw_content, match.start()),
            match.group(2),
            is_hero,
            None,
        ))

    illustration_dir = bundle.article_dir / "illustrations"
    if not illustration_dir.exists():
        return items

    for source_path in sorted(illustration_dir.rglob("*.tsx")):
        rel_parts = source_path.relative_to(illustration_dir).parts
        if any(part in EXCLUDED_ILLUSTRATION_DIRS for part in rel_parts):
            continue
        name = source_path.relative_to(illustration_dir).with_suffix("").as_posix()
        key = f"{article}/{name}"
        if key in seen_keys:
            continue
        seen_keys.add(key)
        source = source_path.read_text(encoding="utf-8")
        is_hero = source_path.stem == "chapter_flow"
        items.append((key, source_path, 1, source, is_hero, None))

    return items


def collect_issues(*, strict_text: bool = False, article_path: str | None = None) -> list[DensityIssue]:
    """Collect density and vertical receipt-tower issues across embedded and standalone illustrations."""
    issues: list[DensityIssue] = []
    seen_keys: set[str] = set()
    normalized_path = article_path.strip("/") if article_path else None

    for bundle in iter_content_bundles(CONTENT_DIR):
        if bundle.metadata.get("hidden"):
            continue
        if bundle.article_dir.parent.name in NON_ARTICLE_SECTIONS:
            continue

        article = bundle.article_dir.relative_to(CONTENT_DIR).as_posix()
        if normalized_path and article != normalized_path:
            continue

        for key, source_path, line, source, is_hero, _ in _iter_bundle_illustrations(bundle, seen_keys):
            signals = density_signals(source, is_hero=is_hero, strict_text=strict_text)
            vertical_tower = any(signal.startswith(("aspect ratio", "height ")) for signal in signals)
            strict_signal = any(
                signal.startswith(("text burden", "hero text burden", "longest text item"))
                for signal in signals
            )
            if (
                len(signals) < CRITICAL_SIGNAL_COUNT
                and not vertical_tower
                and not (strict_text and strict_signal)
            ):
                continue
            issues.append(DensityIssue(
                key=key,
                path=source_path,
                line=line,
                signals=signals,
            ))

    return issues


def text_report(*, article_path: str | None = None) -> int:
    """Print the top illustrations ranked by visible text burden."""
    rows: list[tuple[int, TextStats, str, Path, int]] = []
    seen_keys: set[str] = set()
    normalized_path = article_path.strip("/") if article_path else None

    for bundle in iter_content_bundles(CONTENT_DIR):
        if bundle.metadata.get("hidden"):
            continue
        if bundle.article_dir.parent.name in NON_ARTICLE_SECTIONS:
            continue

        article = bundle.article_dir.relative_to(CONTENT_DIR).as_posix()
        if normalized_path and article != normalized_path:
            continue

        for key, source_path, line, source, is_hero, _ in _iter_bundle_illustrations(bundle, seen_keys):
            stats = text_stats(source)
            score = (
                stats.text_words
                + stats.long_text_items * 15
                + max(stats.max_text_item_words - 12, 0) * 6
            )
            if is_hero:
                score += 40
            rows.append((score, stats, key, source_path, line))

    rows.sort(reverse=True, key=lambda row: row[0])
    print("Illustration text-load report:")
    for score, stats, key, path, line in rows[:TEXT_REPORT_LIMIT]:
        rel = _display_path(path)
        print(
            f"  - {rel}:{line} `{key}` score={score} "
            f"words={stats.text_words} long_items={stats.long_text_items} "
            f"max_words={stats.max_text_item_words} max_chars={stats.max_text_item_chars}"
        )
    return 0


def main() -> int:
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--strict-text", action="store_true", help="include long in-image prose signals")
    parser.add_argument("--text-report", action="store_true", help="rank illustrations by visible text burden")
    parser.add_argument("--path", help="Validate one article, e.g. foundations/python-for-ai-engineering")
    args = parser.parse_args()

    normalized_path = args.path.strip("/") if args.path else None
    if normalized_path:
        if "/" not in normalized_path:
            print(f"FAIL article path must be folder/slug: {args.path}")
            return 1
        folder, slug = normalized_path.split("/", 1)
        if not (CONTENT_DIR / folder / slug / "content.md").exists():
            print(f"FAIL article not found: {args.path}")
            return 1

    if args.text_report:
        return text_report(article_path=normalized_path)

    issues = collect_issues(strict_text=args.strict_text, article_path=normalized_path)
    new_issues = [issue for issue in issues if issue.key not in LEGACY_CRITICAL_ALLOWLIST]
    legacy_hits = [issue for issue in issues if issue.key in LEGACY_CRITICAL_ALLOWLIST]

    if new_issues:
        print("Illustration density validation failed:")
        for issue in new_issues:
            rel = _display_path(issue.path)
            print(f"  - {rel}:{issue.line} `{issue.key}`")
            print(f"    {'; '.join(issue.signals)}")
        print(
            "\nKeep hero visuals complementary: one mental model, one flow, one supporting panel."
        )
        return 1

    suffix = f" for {normalized_path}" if normalized_path else ""
    print(
        "OK illustration density"
        f"{suffix}: "
        f"{len(legacy_hits)} legacy critical illustration(s) allowlisted, no new critical-density visuals."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
