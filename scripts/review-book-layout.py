#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "pypdfium2==5.14.0",
#     "Pillow==13.0.0",
#     "pypdf==6.21.2",
# ]
# ///
"""Raster every PDF page and build a heuristic layout-review queue.

Run: uv run scripts/review-book-layout.py book.pdf --out build/layout-review --dpi 80
Findings are review candidates, not a layout pass/fail verdict. Intentional
headers, footers, full-bleed art, and part-opening whitespace can be flagged.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
from importlib.metadata import version
import json
import math
from pathlib import Path
import statistics
import sys

from PIL import Image, ImageDraw, ImageFont
import pypdfium2 as pdfium
from pypdf import PdfReader


def bounds(points):
    return [
        min(point[0] for point in points),
        min(point[1] for point in points),
        max(point[0] for point in points),
        max(point[1] for point in points),
    ]


def corners(box):
    left, bottom, right, top = box
    return [(left, bottom), (right, bottom), (right, top), (left, top)]


def display_bounds(points, crop, rotation, user_unit):
    """PDF coordinates to physical points, rotated, with a top-left origin."""
    left, bottom, right, top = crop
    converted = []
    for x, y in points:
        if rotation == 0:
            point = (x - left, top - y)
        elif rotation == 90:
            point = (y - bottom, x - left)
        elif rotation == 180:
            point = (right - x, y - bottom)
        elif rotation == 270:
            point = (top - y, right - x)
        else:
            raise ValueError(f"unsupported page rotation: {rotation}")
        converted.append((point[0] * user_unit, point[1] * user_unit))
    return bounds(converted)


def outside_edges(box, width, height, inset=0, tolerance=0.75):
    left, top, right, bottom = box
    return [
        edge
        for edge, outside in (
            ("left", left < inset - tolerance),
            ("top", top < inset - tolerance),
            ("right", right > width - inset + tolerance),
            ("bottom", bottom > height - inset + tolerance),
        )
        if outside
    ]


def rounded(box):
    return [round(value, 3) for value in box]


def character_findings(page, crop, rotation, unit, width, height, margin):
    findings = []
    groups = {name: [] for name in (
        "text_outside_page", "text_in_margin", "replacement_glyph", "unicode_mapping_error"
    )}
    body = []
    visible_count = 0
    textpage = page.get_textpage()
    try:
        for index in range(textpage.count_chars()):
            codepoint = pdfium.raw.FPDFText_GetUnicode(textpage, index)
            char = chr(codepoint) if 0 < codepoint <= 0x10FFFF else ""
            if char.isspace():
                continue
            box = textpage.get_charbox(index)
            if not all(math.isfinite(value) for value in box):
                continue
            transformed = display_bounds(corners(box), crop, rotation, unit)
            sample = {"character_index": index, "character": char, "bounds_pt": rounded(transformed)}
            if char == "\ufffd":
                groups["replacement_glyph"].append(sample)
            if pdfium.raw.FPDFText_HasUnicodeMapError(textpage, index) == 1:
                groups["unicode_mapping_error"].append(sample)
            if not char or box[0] >= box[2] or box[1] >= box[3]:
                continue
            visible_count += 1
            edges = outside_edges(transformed, width, height)
            if edges:
                groups["text_outside_page"].append({**sample, "edges": edges})
            elif margin and (edges := outside_edges(transformed, width, height, margin)):
                groups["text_in_margin"].append({**sample, "edges": edges})
            # Running headers/footers should not inflate the sparse-body span.
            center_y = (transformed[1] + transformed[3]) / 2
            if margin <= center_y <= height - margin:
                body.append(transformed)
    finally:
        textpage.close()
    for kind, samples in groups.items():
        if samples:
            findings.append({"kind": kind, "count": len(samples), "samples": samples[:12]})
    return findings, body, visible_count


def image_findings(page, crop, rotation, unit, width, height, margin):
    findings, images, body = [], [], []
    for index, image in enumerate(page.get_objects(filter=[pdfium.raw.FPDF_PAGEOBJ_IMAGE])):
        points = image.get_quad_points()
        # Nested Form XObjects supply ancestor transforms not included in the
        # child's local coordinates. Transform corners before taking a bbox.
        container = image.container
        while container is not None:
            matrix = container.get_matrix()
            points = [matrix.on_point(*point) for point in points]
            container = container.container
        box = display_bounds(points, crop, rotation, unit)
        if not all(math.isfinite(value) for value in box):
            findings.append({"kind": "invalid_image_bounds", "image_index": index})
            continue
        edges = outside_edges(box, width, height)
        margin_edges = outside_edges(box, width, height, margin) if margin else []
        images.append({
            "image_index": index,
            "bounds_pt": rounded(box),
            "pixel_size": list(image.get_px_size()),
            "form_depth": image.level,
            "outside_page_edges": edges,
            "margin_edges": margin_edges,
        })
        if edges:
            findings.append({"kind": "image_outside_page", "image_index": index,
                             "bounds_pt": rounded(box), "edges": edges})
        elif margin_edges:
            findings.append({"kind": "image_in_margin", "image_index": index,
                             "bounds_pt": rounded(box), "edges": margin_edges})
        if box[2] > box[0] and box[3] > box[1]:
            body.append(box)
    return findings, body, images


def raster_metrics(image):
    gray = image.convert("L")
    size = min(8, gray.width, gray.height)
    patches = [(0, 0), (gray.width - size, 0),
               (0, gray.height - size), (gray.width - size, gray.height - size)]
    corner_values = []
    for x, y in patches:
        corner_values.extend(gray.crop((x, y, x + size, y + size)).get_flattened_data())
    background = int(statistics.median(corner_values))
    histogram = gray.histogram()
    ink = sum(count for value, count in enumerate(histogram) if abs(value - background) > 24)
    return {"estimated_background_gray": background,
            "non_background_fraction": round(ink / (gray.width * gray.height), 6)}


def contact_sheet(rows, out_path):
    columns, rows_per_sheet = 4, 4
    tile_width, tile_height, gap = 300, 420, 16
    sheet = Image.new("RGB", (columns * tile_width + 5 * gap, rows_per_sheet * tile_height + 5 * gap), "#e9edf2")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=15)
    urgent = {"text_outside_page", "image_outside_page", "replacement_glyph",
              "unicode_mapping_error", "invalid_image_bounds", "sparse_page"}
    for position, row in enumerate(rows):
        x = gap + position % columns * (tile_width + gap)
        y = gap + position // columns * (tile_height + gap)
        draw.rectangle((x, y, x + tile_width, y + tile_height), fill="white")
        label = f"PDF page {row['page']}  |  label {row['page_label']}"
        draw.text((x + 10, y + 9), label[:42], fill="#17212e", font=font)
        with Image.open(out_path.parent.parent / row["raster"]) as image:
            image.thumbnail((tile_width - 20, tile_height - 54), Image.Resampling.LANCZOS)
            sheet.paste(image.convert("RGB"), (x + (tile_width - image.width) // 2, y + 39))
        color = "#b76b12" if any(item["kind"] in urgent for item in row["findings"]) else "#c2cbd6"
        draw.rectangle((x, y, x + tile_width, y + tile_height), outline=color, width=2)
    sheet.save(out_path)
    sheet.close()


def page_fill(raster, points_to_pixels, top_pt, bottom_pt):
    """Return how far down the text block the last ink reaches, from 0 to 1.

    Only the text block counts, so running heads and folios do not hide a hole.
    """
    width, height = raster.size
    top, bottom = round(top_pt * points_to_pixels), round(height - bottom_pt * points_to_pixels)
    if bottom <= top:
        return 0.0
    box = raster.crop((0, top, width, bottom)).convert("L").point(lambda value: 255 if value < 235 else 0).getbbox()
    return round(box[3] / (bottom - top), 4) if box else 0.0


def outline_pages(reader):
    """Return the physical page indexes that the PDF outline points to."""
    pages, stack = set(), list(reader.outline)
    while stack:
        item = stack.pop()
        if isinstance(item, list):
            stack.extend(item)
            continue
        page = reader.get_destination_page_number(item)
        if page is not None:
            pages.add(page)
    return pages


def fill_findings(pages, openings, max_hole):
    """Queue body pages that end early and return the page-fill summary.

    A chapter may end anywhere, and an opening page has a designed layout, so these
    pages do not count. Neither do blank pages or roman-numbered front matter.
    """
    measured = []
    for index, row in enumerate(pages):
        fill = row["metrics"]["text_block_fill"]
        following = pages[index + 1] if index + 1 < len(pages) else None
        ends_flow = following is None or following["metrics"]["text_block_fill"] == 0 or index + 1 in openings
        front_matter = not row["page_label"].isdigit()
        if fill == 0 or ends_flow or front_matter or index in openings:
            continue
        hole = round(1 - fill, 4)
        measured.append((row, hole))
        if hole > max_hole:
            row["findings"].append({"kind": "underfilled_page", "hole_fraction": hole})
    holes = sorted(hole for _, hole in measured)
    return {
        "max_hole_fraction": max_hole,
        "measured_pages": len(measured),
        "mean_hole_fraction": round(sum(holes) / len(holes), 4) if holes else 0,
        "p90_hole_fraction": holes[int(0.9 * (len(holes) - 1))] if holes else 0,
        "underfilled_pages": sum(hole > max_hole for hole in holes),
        "worst_pages": [{"page": row["page"], "page_label": row["page_label"], "hole_fraction": hole}
                        for row, hole in sorted(measured, key=lambda item: -item[1])[:20] if hole > max_hole],
    }


def review(args):
    source = args.pdf.resolve()
    with source.open("rb") as handle:
        digest = hashlib.file_digest(handle, "sha256").hexdigest()
    args.out.mkdir(parents=True, exist_ok=True)
    report_path = args.out / "findings.json"
    if report_path.exists():
        previous = json.loads(report_path.read_text())
        if previous.get("input", {}).get("sha256") != digest:
            raise ValueError("output directory contains another PDF review; choose a new --out directory")
    pages_dir, contacts_dir = args.out / "pages", args.out / "contact-sheets"
    pages_dir.mkdir(exist_ok=True)
    contacts_dir.mkdir(exist_ok=True)
    metadata = PdfReader(source)
    labels = metadata.page_labels
    report = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "input": {"path": str(source), "sha256": digest},
        "settings": {"dpi": args.dpi, "margin_pt": args.margin_pt,
                     "bounds_tolerance_pt": 0.75, "sparse_ink_fraction": args.sparse_ink_fraction,
                     "sparse_body_height_fraction": 0.32, "contact_grid": [4, 4],
                     "text_top_pt": args.text_top_pt, "text_bottom_pt": args.text_bottom_pt, "max_hole": args.max_hole},
        "coordinates": "Physical points, top-left origin, visible crop/media intersection, page rotation applied.",
        "limitations": [
            "Heuristic review queue, not a pass/fail verdict or a substitute for visual inspection.",
            "Margin hints can include intentional running text and full-bleed images.",
            "Text checks use the PDF text layer; rasterized text and vector-outline glyphs need visual review.",
            "Replacement detection covers U+FFFD and PDFium Unicode-map errors, not every visible missing-glyph box.",
            "Image geometry follows nested form transforms but does not interpret clipping paths or transparency.",
            "Sparse-page heuristics can flag intentional title pages and whitespace; corner colors estimate background.",
            "The utility does not detect every overlap, prove illustration correctness, or measure reading order.",
            "Page fill measures the lowest ink in the text block; it does not see white space between blocks.",
        ],
        "versions": {name: version(name) for name in ("pypdfium2", "Pillow", "pypdf")},
        "pages": [], "contact_sheets": [],
    }
    with pdfium.PdfDocument(source) as document:
        if len(document) != len(metadata.pages):
            raise ValueError("PDF readers disagree about the page count")
        for index in range(len(document)):
            page = document[index]
            try:
                unit = float(metadata.pages[index].user_unit)
                if not math.isfinite(unit) or unit <= 0:
                    raise ValueError(f"page {index + 1}: invalid UserUnit")
                crop, rotation = page.get_bbox(), page.get_rotation()
                width, height = (crop[2] - crop[0]) * unit, (crop[3] - crop[1]) * unit
                if rotation in (90, 270):
                    width, height = height, width
                findings, body, chars = character_findings(page, crop, rotation, unit, width, height, args.margin_pt)
                image_issues, image_boxes, images = image_findings(page, crop, rotation, unit, width, height, args.margin_pt)
                findings.extend(image_issues)
                body.extend(image_boxes)
                bitmap = page.render(scale=args.dpi * unit / 72)
                try:
                    raster = bitmap.to_pil().convert("RGB")
                    raster_path = pages_dir / f"page-{index + 1:04d}.png"
                    raster.save(raster_path)
                    metrics = raster_metrics(raster)
                    metrics["text_block_fill"] = page_fill(raster, args.dpi * unit / 72, args.text_top_pt, args.text_bottom_pt)
                    pixel_size = list(raster.size)
                    raster.close()
                finally:
                    bitmap.close()
                if body:
                    top = max(args.margin_pt, min(box[1] for box in body))
                    bottom = min(height - args.margin_pt, max(box[3] for box in body))
                    span = max(0, bottom - top) / max(1, height - 2 * args.margin_pt)
                else:
                    span = 0
                metrics.update({"body_height_fraction": round(span, 6), "nonspace_text_characters": chars})
                if metrics["non_background_fraction"] < args.sparse_ink_fraction or span < 0.32:
                    findings.append({"kind": "sparse_page", "metrics": metrics.copy()})
                report["pages"].append({
                    "page": index + 1, "page_label": str(labels[index]),
                    "crop_box_pdf_units": rounded(crop), "rotation": rotation, "user_unit": unit,
                    "size_pt": rounded([width, height]), "raster_size_px": pixel_size,
                    "raster": str(raster_path.relative_to(args.out)), "metrics": metrics,
                    "images": images, "findings": findings,
                })
            finally:
                page.close()
            if (index + 1) % 16 == 0 or index + 1 == len(document):
                sheet_path = contacts_dir / f"contact-{len(report['contact_sheets']) + 1:04d}.png"
                contact_sheet(report["pages"][-((index % 16) + 1):], sheet_path)
                report["contact_sheets"].append(str(sheet_path.relative_to(args.out)))
                print(f"Rendered {index + 1}/{len(document)} pages; wrote {sheet_path.name}", flush=True)
    fill = fill_findings(report["pages"], outline_pages(metadata), args.max_hole)
    counts = Counter(item["kind"] for page in report["pages"] for item in page["findings"])
    report["summary"] = {"page_count": len(report["pages"]),
                         "pages_with_findings": sum(bool(page["findings"]) for page in report["pages"]),
                         "findings_by_kind": dict(sorted(counts.items())),
                         "page_fill": fill}
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(f"Review queue: {report_path}")
    print(json.dumps(report["summary"], sort_keys=True))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--dpi", type=int, default=80)
    parser.add_argument("--margin-pt", type=float, default=24,
                        help="Review inset in physical points; running headers/footers may be intentional (default: 24).")
    parser.add_argument("--sparse-ink-fraction", type=float, default=0.012,
                        help="Queue pages with less estimated non-background raster area (default: 0.012).")
    parser.add_argument("--text-top-pt", type=float, default=66.24,
                        help="Top page margin, which holds the running head (default: 66.24, the 7.5 by 9.25 in trim).")
    parser.add_argument("--text-bottom-pt", type=float, default=59.04,
                        help="Bottom page margin, which holds the folio (default: 59.04, the 7.5 by 9.25 in trim).")
    parser.add_argument("--max-hole", type=float, default=0.25,
                        help="Queue body pages whose text block ends with more than this share empty (default: 0.25).")
    args = parser.parse_args()
    if not 0 < args.max_hole < 1:
        parser.error("max-hole must be between 0 and 1")
    if args.dpi <= 0 or not math.isfinite(args.margin_pt) or args.margin_pt < 0:
        parser.error("dpi must be positive and margin-pt must be finite and nonnegative")
    if not math.isfinite(args.sparse_ink_fraction) or not 0 <= args.sparse_ink_fraction <= 1:
        parser.error("sparse-ink-fraction must be between 0 and 1")
    try:
        review(args)
    except (OSError, ValueError, pdfium.PdfiumError) as error:
        print(f"Layout review failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
