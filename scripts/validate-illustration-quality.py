#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow"]
# ///
"""Validate LeetLLM illustration source and generated PNG integrity."""

from __future__ import annotations

import argparse
from functools import lru_cache
import json
import os
import re
import struct
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageChops

REPO_ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = REPO_ROOT / "web" / "src" / "content"
ILLUSTRATION_LIB_DIR = REPO_ROOT / "web" / "tools" / "illustrations" / "lib"
LAYOUT_BASELINE_PATH = REPO_ROOT / "scripts" / "illustration-layout-baseline.json"

FORBIDDEN_ARROWHEAD_GLYPHS = set("▶▼▲◀")
STANDALONE_ARROW_GLYPH_RE = re.compile(r"(['\"`])\s*<?->\s*\1")
ARROW_SIZE_RE = re.compile(r"\barrowSize\s*(?::|=)\s*\{?\s*(\d+(?:\.\d+)?)")
ARROW_MARKER_SIZE_RE = re.compile(
    r"ArrowMarkerDef\(\s*\{[^}]*?\bsize\s*:\s*(\d+(?:\.\d+)?)",
    re.MULTILINE,
)
MAX_ARROW_SIZE = 8.0
NEGATIVE_LAYOUT_RE = re.compile(r"\b(?:margin(?:Top|Bottom|Left|Right)?|top|bottom|left|right):\s*-\d")
UNSUPPORTED_LAYERING_RE = re.compile(r"\bzIndex\b|z-index")
RAW_ABSOLUTE_RE = re.compile(r"position\s*:\s*['\"]absolute['\"]")
MANUAL_EDGE_OFFSET_RE = re.compile(r"\b(?:left|right|top|bottom)\s*:\s*(?:-?\d|[A-Za-z_$][\w$]*(?:\s*[+\-*/]|,))")
TYPED_PARAMETER_CANDIDATE_RE = re.compile(r":\s*(?:number|string|boolean)\s*,\s*$")
RAW_SVG_COORD_RE = re.compile(r"\b(?:x|y|x1|x2|y1|y2|cx|cy)\s*:\s*(?:-?\d|[A-Za-z_$][\w$]*(?:\s*[+\-*/]|,))")
RAW_SVG_ELEMENT_RE = re.compile(
    r"React\.createElement\(\s*['\"](?:circle|ellipse|line|path|polygon|polyline|rect|svg|text)['\"]\s*,\s*\{([\s\S]*?)\}\s*[,)]",
    re.MULTILINE,
)
ROTATED_BORDER_ARROW_RE = re.compile(r"transform\s*:\s*['\"]rotate\(45deg\)['\"]")
EMBEDDED_ILLUSTRATION_RE = re.compile(
    r"```(?:tsx|typescript)([^\n]*(?:render\s*=\s*[\"']?illustration[\"']?|leetllm:illustration)[^\n]*)\r?\n([\s\S]*?)\r?\n```",
    re.MULTILINE,
)
NAME_ATTR_RE = re.compile(r"\bname=(?:\"([^\"]+)\"|'([^']+)'|([^\s]+))")
ALT_EXPORT_RE = re.compile(r"\bexport\s+const\s+alt\s*=\s*(['\"`])([\s\S]*?)\1\s*;?\s*", re.MULTILINE)


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def read_png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as fh:
        header = fh.read(24)

    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError("not a valid PNG")

    width, height = struct.unpack(">II", header[16:24])
    return width, height


def is_background_pixel(
    pixel: tuple[int, int, int, int],
    bg_rgb: tuple[int, int, int],
    tolerance: int = 6,
    alpha_threshold: int = 10,
) -> bool:
    r, g, b, a = pixel
    if a < alpha_threshold:
        return True
    return (
        abs(r - bg_rgb[0]) <= tolerance
        and abs(g - bg_rgb[1]) <= tolerance
        and abs(b - bg_rgb[2]) <= tolerance
    )


def detect_png_overflow(
    path: Path,
    edge_tolerance: int = 3,
    min_density: float = 0.05,
    alpha_threshold: int = 128,
    *,
    rgba: Image.Image | None = None,
) -> list[str]:
    if rgba is None:
        with Image.open(path) as image:
            rgba = image.convert("RGBA")

    width, height = rgba.size
    corner = rgba.getpixel((0, 0))
    bg_rgb = (0, 0, 0) if corner[3] < 10 else corner[:3]

    def edge_content_mask(box: tuple[int, int, int, int]) -> Image.Image:
        edge = rgba.crop(box)
        red, green, blue, alpha = edge.split()
        channels = (red, green, blue)
        content = ImageChops.difference(
            channels[0],
            Image.new("L", edge.size, bg_rgb[0]),
        ).point(lambda value: 255 if value > 6 else 0)
        for channel, background in zip(channels[1:], bg_rgb[1:]):
            difference = ImageChops.difference(
                channel,
                Image.new("L", edge.size, background),
            ).point(lambda value: 255 if value > 6 else 0)
            content = ImageChops.lighter(content, difference)
        opaque = alpha.point(lambda value: 255 if value >= alpha_threshold else 0)
        return ImageChops.darker(content, opaque)

    def has_dense_row(mask: Image.Image, reverse: bool = False) -> bool:
        offsets = range(mask.height - 1, -1, -1) if reverse else range(mask.height)
        return any(
            mask.crop((0, offset, mask.width, offset + 1)).histogram()[255] / mask.width >= min_density
            for offset in offsets
        )

    def has_dense_column(mask: Image.Image, reverse: bool = False) -> bool:
        offsets = range(mask.width - 1, -1, -1) if reverse else range(mask.width)
        return any(
            mask.crop((offset, 0, offset + 1, mask.height)).histogram()[255] / mask.height >= min_density
            for offset in offsets
        )

    edges: list[str] = []

    if has_dense_row(edge_content_mask((0, 0, width, edge_tolerance))):
        edges.append("top")
    if has_dense_row(edge_content_mask((0, height - edge_tolerance, width, height)), reverse=True):
        edges.append("bottom")
    if has_dense_column(edge_content_mask((0, 0, edge_tolerance, height))):
        edges.append("left")
    if has_dense_column(edge_content_mask((width - edge_tolerance, 0, width, height)), reverse=True):
        edges.append("right")

    return edges


def detect_png_content_bounds(
    path: Path,
    *,
    rgba: Image.Image | None = None,
) -> tuple[int, int, int, int]:
    if rgba is None:
        with Image.open(path) as image:
            rgba = image.convert("RGBA")

    width, height = rgba.size

    corner = rgba.getpixel((0, 0))
    background = Image.new("RGBA", rgba.size, (0, 0, 0, 0) if corner[3] < 10 else corner)
    diff = ImageChops.difference(rgba, background)
    mask = diff.convert("L").point(lambda value: 255 if value > 6 else 0)
    bbox = mask.getbbox()

    if bbox is None:
        return (0, 0, width, height)

    left, top, right, bottom = bbox
    return (left, top, right - 1, bottom - 1)


def exported_dimension(source: str, name: str) -> int | None:
    match = re.search(rf"export\s+const\s+{name}\s*=\s*(\d+)", source)
    if not match:
        return None
    return int(match.group(1))


BATCH_PARAMETER_POSITIONS_JS = """
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.argv[1]);
const ts = require('typescript');
const sources = JSON.parse(fs.readFileSync(0, 'utf8'));
const results = sources.map((source) => {
  const tree = ts.createSourceFile('illustration.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (tree.parseDiagnostics.length) {
    throw new Error('Cannot classify layout markers in an invalid TypeScript illustration.');
  }
  const positions = [];
  function visit(node) {
    if (ts.isParameter(node) && node.type && ts.isIdentifier(node.name)) {
      positions.push([...source.slice(0, node.name.getStart(tree))].length);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return positions;
});
process.stdout.write(JSON.stringify(results));
"""


@lru_cache(maxsize=16)
def typed_parameter_positions(source: str) -> frozenset[int]:
    """Classify ambiguous primitive type annotations with the actual TSX parser."""
    helper = Path(__file__).with_name("illustration-parameter-positions.mjs")
    result = subprocess.run(
        ["node", str(helper)], input=source, text=True, capture_output=True, check=True,
    )
    return frozenset(json.loads(result.stdout))


def needs_typed_parameter_check(source: str) -> bool:
    return any(
        TYPED_PARAMETER_CANDIDATE_RE.search(match.group())
        for match in MANUAL_EDGE_OFFSET_RE.finditer(source)
    )


def batch_typed_parameter_positions(sources: list[str]) -> dict[str, frozenset[int]]:
    """Classify ambiguous primitive type annotations for many TSX sources in one Node invocation."""
    candidates = list(dict.fromkeys(source for source in sources if needs_typed_parameter_check(source)))
    if not candidates:
        return {}
    result = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            BATCH_PARAMETER_POSITIONS_JS,
            str(REPO_ROOT / "web" / "package.json"),
        ],
        input=json.dumps(candidates),
        text=True,
        capture_output=True,
        check=True,
    )
    parsed = json.loads(result.stdout)
    return {
        source: frozenset(positions)
        for source, positions in zip(candidates, parsed, strict=True)
    }


def layout_risk_counts(
    source: str,
    parameter_positions: frozenset[int] | None = None,
) -> dict[str, int]:
    """Count raw layout primitives that tend to produce brittle images."""
    edge_markers = list(MANUAL_EDGE_OFFSET_RE.finditer(source))
    if any(TYPED_PARAMETER_CANDIDATE_RE.search(match.group()) for match in edge_markers):
        parameters = typed_parameter_positions(source) if parameter_positions is None else parameter_positions
        edge_markers = [match for match in edge_markers if match.start() not in parameters]
    raw_svg_coordinate_count = sum(
        len(RAW_SVG_COORD_RE.findall(match.group(1)))
        for match in RAW_SVG_ELEMENT_RE.finditer(source)
    )
    rotated_border_arrow_count = 0
    for match in ROTATED_BORDER_ARROW_RE.finditer(source):
        window = source[max(0, match.start() - 500):match.end() + 500]
        if "borderTop" in window and "borderRight" in window:
            rotated_border_arrow_count += 1

    return {
        "absolute_position": len(RAW_ABSOLUTE_RE.findall(source)),
        "manual_edge_offset": len(edge_markers),
        "raw_svg_coordinate": raw_svg_coordinate_count,
        "rotated_border_arrow": rotated_border_arrow_count,
    }


def risk_total(counts: dict[str, int]) -> int:
    return sum(counts.values())


def relative_key(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def scoped_layout_risks(
    layout_risks: dict[str, dict[str, int]],
    article_root: Path,
) -> dict[str, dict[str, int]]:
    """Select risks belonging to an article using the same repository keys as the baseline."""

    article_prefix = f"{relative_key(article_root).rstrip('/')}/"
    return {
        path: counts
        for path, counts in layout_risks.items()
        if path.startswith(article_prefix)
    }


def normalize_embedded_source(source: str) -> str:
    """Compare synced sources while ignoring optional standalone alt exports."""

    return ALT_EXPORT_RE.sub("", source).replace("\r\n", "\n").strip()


def merge_layout_risk(existing: dict[str, int] | None, incoming: dict[str, int]) -> dict[str, int]:
    if existing is None:
        return incoming
    return {key: max(existing.get(key, 0), incoming.get(key, 0)) for key in set(existing) | set(incoming)}


def load_layout_baseline() -> dict[str, dict[str, int]]:
    if not LAYOUT_BASELINE_PATH.exists():
        return {}

    payload = json.loads(LAYOUT_BASELINE_PATH.read_text(encoding="utf-8"))
    if isinstance(payload, dict) and "sources" in payload:
        return {
            str(path): {str(metric): int(value) for metric, value in counts.items()}
            for path, counts in payload["sources"].items()
        }

    return {
        str(path): {str(metric): int(value) for metric, value in counts.items()}
        for path, counts in payload.items()
    }


def write_layout_baseline(layout_risks: dict[str, dict[str, int]]) -> None:
    sources = {
        path: counts
        for path, counts in sorted(layout_risks.items())
        if risk_total(counts) > 0
    }
    payload = {
        "version": 1,
        "description": (
            "Baseline of existing raw illustration layout risk. "
            "Validation fails if a source adds absolute positioning, manual edge offsets, "
            "raw SVG coordinates, or brittle rotated-border arrows above this baseline."
        ),
        "metrics": [
            "absolute_position",
            "manual_edge_offset",
            "raw_svg_coordinate",
            "rotated_border_arrow",
        ],
        "sources": sources,
    }
    LAYOUT_BASELINE_PATH.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def compare_layout_baseline(layout_risks: dict[str, dict[str, int]], issues: list[str]) -> None:
    if not LAYOUT_BASELINE_PATH.is_file():
        issues.append(
            f"{LAYOUT_BASELINE_PATH}: required layout baseline is missing; "
            "copy the canonical baseline before validating illustrations"
        )
        return

    baseline = load_layout_baseline()
    for path, counts in sorted(layout_risks.items()):
        base_counts = baseline.get(path)
        if base_counts is None:
            if risk_total(counts) > 0:
                issues.append(
                    f"{path}: new raw layout risk {counts}; use shared layout/chart primitives instead of absolute x/y"
                )
            continue

        increases = {
            metric: value - base_counts.get(metric, 0)
            for metric, value in counts.items()
            if value > base_counts.get(metric, 0)
        }
        if increases:
            issues.append(
                f"{path}: raw layout risk increased {increases}; use shared layout/chart primitives instead of absolute x/y"
            )


def scan_source(path: Path, source: str, is_article_illustration: bool, issues: list[str], warnings: list[str]) -> tuple[int | None, int | None]:
    width = exported_dimension(source, "width")
    height = exported_dimension(source, "height")

    for index, char in enumerate(source):
        if char in FORBIDDEN_ARROWHEAD_GLYPHS:
            issues.append(
                f"{path.relative_to(REPO_ROOT)}:{line_number(source, index)} uses text arrowhead glyph {char!r}; use the Arrow primitive or CSS/SVG geometry"
            )

    for match in STANDALONE_ARROW_GLYPH_RE.finditer(source):
        issues.append(
            f"{path.relative_to(REPO_ROOT)}:{line_number(source, match.start())} uses standalone text arrow glyph {match.group(0)}; use FlowArrow/Arrow geometry or a descriptive label"
        )

    for pattern in (ARROW_SIZE_RE, ARROW_MARKER_SIZE_RE):
        for match in pattern.finditer(source):
            size = float(match.group(1))
            if size > MAX_ARROW_SIZE:
                issues.append(
                    f"{path.relative_to(REPO_ROOT)}:{line_number(source, match.start())} uses oversized arrowhead {size:g}; keep arrowSize/ArrowMarkerDef size at or below {MAX_ARROW_SIZE:g}"
                )

    if is_article_illustration:
        if width is None:
            issues.append(f"{path.relative_to(REPO_ROOT)}: missing `export const width`")
        if height is None:
            issues.append(f"{path.relative_to(REPO_ROOT)}: missing `export const height`")

    for match in NEGATIVE_LAYOUT_RE.finditer(source):
        warnings.append(
            f"{path.relative_to(REPO_ROOT)}:{line_number(source, match.start())} has negative positioning `{match.group(0)}`; visually inspect for overlap"
        )

    for match in UNSUPPORTED_LAYERING_RE.finditer(source):
        issues.append(
            f"{path.relative_to(REPO_ROOT)}:{line_number(source, match.start())} uses unsupported z-index layering in Satori output"
        )

    return width, height


def scan_source_file(path: Path, issues: list[str], warnings: list[str]) -> tuple[int | None, int | None]:
    source = path.read_text(encoding="utf-8")
    is_article_illustration = (
        path.is_relative_to(CONTENT_DIR)
        and "illustrations" in path.relative_to(CONTENT_DIR).parts
        and "_parts" not in path.relative_to(CONTENT_DIR).parts
    )
    return scan_source(path, source, is_article_illustration, issues, warnings)


def png_paths_for_source(source_path: Path, source: str) -> list[Path]:
    generated_dir = source_path.parent / "_generated"
    stem = source_path.stem

    if "createScenes" in source:
        return sorted(generated_dir.glob(f"{stem}_scene*_*.png"))

    return [
        generated_dir / f"{stem}_dark.png",
        generated_dir / f"{stem}_light.png",
    ]


def validate_png_outputs(path: Path, source: str, width: int | None, height: int | None, issues: list[str]) -> None:
    if width is None or height is None:
        return

    png_paths = png_paths_for_source(path, source)
    if "createScenes" in source and not png_paths:
        issues.append(f"{path.relative_to(REPO_ROOT)}: no generated scene PNGs found")
        return

    for png_path in png_paths:
        if not png_path.exists():
            issues.append(f"{path.relative_to(REPO_ROOT)}: missing generated PNG {png_path.name}")
            continue

        try:
            actual = read_png_size(png_path)
        except ValueError as exc:
            issues.append(f"{png_path.relative_to(REPO_ROOT)}: {exc}")
            continue

        max_width = width * 2
        min_width = max(120, int(max_width * 0.35))
        max_height = height * 2
        min_height = max(120, int(max_height * 0.35))
        if not min_width <= actual[0] <= max_width:
            issues.append(
                f"{png_path.relative_to(REPO_ROOT)}: width {actual[0]} is outside expected cropped 2x range {min_width}-{max_width}"
            )
        if not min_height <= actual[1] <= max_height:
            issues.append(
                f"{png_path.relative_to(REPO_ROOT)}: height {actual[1]} is outside expected cropped 2x range {min_height}-{max_height}"
            )

        with Image.open(png_path) as image:
            rgba = image.convert("RGBA")

        _, min_y, _, max_y = detect_png_content_bounds(png_path, rgba=rgba)
        top_blank = min_y
        bottom_blank = actual[1] - 1 - max_y
        side_blank_limit = max(64, int(actual[1] * 0.16))
        combined_blank_limit = max(120, int(actual[1] * 0.22))
        if (
            top_blank > side_blank_limit
            or bottom_blank > side_blank_limit
        ) and (top_blank + bottom_blank) > combined_blank_limit:
            issues.append(
                f"{png_path.relative_to(REPO_ROOT)}: excessive vertical whitespace (top={top_blank}px, bottom={bottom_blank}px); reduce empty top/bottom space or let autocrop tighten it"
            )

        overflow_edges = detect_png_overflow(png_path, rgba=rgba)
        if actual[1] < max_height:
            overflow_edges = [edge for edge in overflow_edges if edge not in {"top", "bottom"}]
        if overflow_edges:
            issues.append(
                f"{png_path.relative_to(REPO_ROOT)}: rendered content touches canvas edge(s) {', '.join(overflow_edges)}; increase source dimensions or reduce crowding"
            )


def generated_png_paths() -> set[Path]:
    return set(CONTENT_DIR.glob("**/illustrations/_generated/*.png"))


def png_output_issues(
    validation: tuple[Path, str, int | None, int | None],
) -> list[str]:
    path, source, width, height = validation
    issues: list[str] = []
    validate_png_outputs(path, source, width, height, issues)
    return issues


def validate_no_stale_generated_pngs(
    expected_paths: set[Path],
    issues: list[str],
    *,
    clean_stale: bool = False,
) -> int:
    stale_paths = sorted(generated_png_paths() - expected_paths)
    if not stale_paths:
        return 0

    for stale_path in stale_paths:
        if clean_stale:
            if (
                not stale_path.is_relative_to(CONTENT_DIR)
                or stale_path.parent.name != "_generated"
                or stale_path.parent.parent.name != "illustrations"
                or stale_path.suffix != ".png"
            ):
                raise ValueError(f"Refusing to remove non-generated illustration: {stale_path}")
            stale_path.unlink()
            continue
        issues.append(
            f"{stale_path.relative_to(REPO_ROOT)}: stale generated PNG has no matching illustration source; remove it and rebuild"
        )

    return len(stale_paths) if clean_stale else 0


def embedded_illustration_sources() -> list[tuple[Path, str, Path, int]]:
    sources: list[tuple[Path, str, Path, int]] = []
    for content_path in sorted(CONTENT_DIR.glob("*/*/content.md")):
        markdown = content_path.read_text(encoding="utf-8")
        for match in EMBEDDED_ILLUSTRATION_RE.finditer(markdown):
            info = match.group(1)
            name_match = NAME_ATTR_RE.search(info)
            if not name_match:
                continue
            name = next(group for group in name_match.groups() if group)
            virtual_path = content_path.parent / "illustrations" / f"{name.removesuffix('.tsx')}.tsx"
            sources.append((virtual_path, match.group(2).strip(), content_path, line_number(markdown, match.start())))
    return sources


def validate_embedded_source_sync(
    source_path: Path,
    embedded_source: str,
    content_path: Path,
    line: int,
    issues: list[str],
) -> None:
    if not source_path.exists():
        return

    standalone_source = source_path.read_text(encoding="utf-8")
    if normalize_embedded_source(embedded_source) == normalize_embedded_source(standalone_source):
        return

    rel_content = content_path.relative_to(REPO_ROOT)
    rel_source = source_path.relative_to(REPO_ROOT)
    issues.append(
        f"{rel_content}:{line} embedded illustration `{source_path.stem}` differs from {rel_source}; "
        "run scripts/sync-embedded-illustration-source.py"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--fail-layout-warnings",
        action="store_true",
        help="Treat negative-positioning layout warnings as failures.",
    )
    parser.add_argument(
        "--write-layout-baseline",
        action="store_true",
        help="Write the current raw-positioning risk baseline and exit after source/PNG validation.",
    )
    parser.add_argument(
        "--clean-stale",
        action="store_true",
        help="Remove only ignored generated PNGs with no matching standalone or embedded illustration source.",
    )
    parser.add_argument("--path", help="Validate one article, e.g. foundations/python-for-ai-engineering")
    args = parser.parse_args()

    issues: list[str] = []
    warnings: list[str] = []
    layout_risks: dict[str, dict[str, int]] = {}

    article_root = None
    if args.path:
        if "/" not in args.path:
            print(f"FAIL article path must be folder/slug: {args.path}")
            return 1
        folder, slug = args.path.split("/", 1)
        article_root = CONTENT_DIR / folder / slug
        if not article_root.is_dir():
            print(f"FAIL article not found: {args.path}")
            return 1

    source_paths = sorted(path for path in CONTENT_DIR.glob("**/*.tsx") if "_generated" not in path.parts)
    if article_root is not None:
        source_paths = [p for p in source_paths if article_root in p.parents or p.parent == article_root]
    shared_source_paths = sorted(
        path
        for suffix in ("*.ts", "*.tsx")
        for path in ILLUSTRATION_LIB_DIR.glob(suffix)
    )
    embedded_sources = embedded_illustration_sources()
    expected_pngs: set[Path] = set()
    pending_png_validations: dict[
        tuple[Path, tuple[Path, ...], int | None, int | None],
        tuple[Path, str, int | None, int | None],
    ] = {}
    for path in shared_source_paths:
        scan_source_file(path, issues, warnings)

    article_count = 0
    risk_entries: list[tuple[str, str]] = []
    for path in source_paths:
        source = path.read_text(encoding="utf-8")
        rel_parts = path.relative_to(CONTENT_DIR).parts if path.is_relative_to(CONTENT_DIR) else ()
        is_article_illustration = "illustrations" in rel_parts and "_parts" not in rel_parts
        width, height = scan_source(path, source, is_article_illustration, issues, warnings)
        if "illustrations" in path.parts and "_parts" not in path.parts:
            article_count += 1
            key = relative_key(path)
            risk_entries.append((key, source))
            png_paths = tuple(png_paths_for_source(path, source))
            pending_png_validations[(path, png_paths, width, height)] = (path, source, width, height)
            expected_pngs.update(png_paths)

    for path, source, content_path, line in embedded_sources:
        if article_root is not None and content_path.parent != article_root:
            continue
        validate_embedded_source_sync(path, source, content_path, line, issues)
        width, height = scan_source(path, source, True, issues, warnings)
        article_count += 1
        key = relative_key(path)
        risk_entries.append((key, source))
        png_paths = tuple(png_paths_for_source(path, source))
        pending_png_validations[(path, png_paths, width, height)] = (path, source, width, height)
        expected_pngs.update(png_paths)

    precomputed_positions = batch_typed_parameter_positions([source for _, source in risk_entries])
    for key, source in risk_entries:
        layout_risks[key] = merge_layout_risk(
            layout_risks.get(key),
            layout_risk_counts(source, precomputed_positions.get(source)),
        )

    worker_count = min(8, os.cpu_count() or 1)
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        for png_issues in executor.map(png_output_issues, pending_png_validations.values()):
            issues.extend(png_issues)

    if article_root is None:
        removed_stale = validate_no_stale_generated_pngs(
            expected_pngs,
            issues,
            clean_stale=args.clean_stale,
        )
        if removed_stale:
            print(f"Removed {removed_stale} stale generated illustration PNG(s).")

    if args.write_layout_baseline:
        write_layout_baseline(layout_risks)
        print(f"Wrote {LAYOUT_BASELINE_PATH.relative_to(REPO_ROOT)} with {sum(1 for counts in layout_risks.values() if risk_total(counts) > 0)} risky source baseline(s)")

    if article_root is None:
        compare_layout_baseline(layout_risks, issues)
    else:
        compare_layout_baseline(scoped_layout_risks(layout_risks, article_root), issues)

    if args.fail_layout_warnings:
        issues.extend(warnings)

    if issues:
        print("Illustration quality validation failed:")
        for issue in issues:
            print(f"  - {issue}")
        if warnings and not args.fail_layout_warnings:
            print(f"\nLayout warnings not enforced: {len(warnings)}")
        return 1

    suffix = f" for {args.path}" if args.path else ""
    print(f"OK illustration quality{suffix}: {article_count} illustration sources and {len(source_paths) + len(shared_source_paths)} shared/source helper file(s) validated")
    risky_sources = [(path, counts) for path, counts in layout_risks.items() if risk_total(counts) > 0]
    if risky_sources:
        total_risk = sum(risk_total(counts) for _, counts in risky_sources)
        print(f"Layout risk baseline checked: {len(risky_sources)} source(s), {total_risk} raw-positioning marker(s)")
    if warnings:
        print(f"Layout warnings for manual review: {len(warnings)}")
        for warning in warnings[:12]:
            print(f"  - {warning}")
        if len(warnings) > 12:
            print(f"  ... {len(warnings) - 12} more")
    return 0


if __name__ == "__main__":
    sys.exit(main())
