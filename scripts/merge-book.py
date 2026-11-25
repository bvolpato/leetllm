#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pypdf>=6,<7", "pypdfium2>=5,<6", "reportlab>=4,<5"]
# ///
"""Scan and assemble a validated book build with continuous folios and outlines."""

import argparse
from bisect import bisect_right
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import parse_qs, unquote, urlsplit

import pypdfium2 as pdfium
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, Fit, NameObject
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def verify_inputs(inputs, manifest):
    expected = ["part-0a-cover.pdf", "part-0b-toc.pdf"] + [
        f"part-{part['partNumber']}.pdf" for part in manifest["parts"]
    ] + manifest.get("backMatter", [])
    if [Path(path).name for path in inputs] != expected:
        raise ValueError("Input PDFs must contain the cover, TOC, every planned part, and the back matter in order")
    for path in inputs:
        artifact = manifest.get("artifacts", {}).get(Path(path).name)
        if not artifact:
            raise ValueError(f"Unrecorded PDF: {path}. Re-render it with the current preset.")
        with open(path, "rb") as source:
            digest = hashlib.file_digest(source, "sha256").hexdigest()
        if digest != artifact["sha256"]:
            raise ValueError(f"PDF changed since rendering: {path}. Re-render it before merging.")


def page_text(page, limit=None):
    text_page = page.get_textpage()
    try:
        count = text_page.count_chars()
        return text_page.get_text_range(0, min(limit, count) if limit else count)
    finally:
        text_page.close()


def starts_on_recto(next_page):
    """Physical page numbers are odd on the right-hand side of a spread."""
    return next_page % 2 == 1


def chapter_label(text):
    """Letter spacing on the label can extract as "C H A PTER 3 8"."""
    match = re.search(r"(?:^|[\r\n])\s*C ?H ?A ?P ?T ?E ?R +(\d(?: ?\d)*) *(?:[\r\n]|$)", text, re.I)
    return match[1].replace(" ", "") if match else None


def chapter_pages(path):
    """Report the page count of one rendered part and the 1-based page of each chapter opening."""
    document = pdfium.PdfDocument(path)
    chapters, last = [], None
    for index in range(len(document)):
        page = document[index]
        try:
            label = chapter_label(page_text(page, 600))
        finally:
            page.close()
        # Chapters run in order, so a body line that only reads "Chapter 9" is not an opening.
        if label and (last is None or int(label) == last + 1):
            chapters.append(index + 1)
            last = int(label)
    return {"pages": len(document), "chapters": chapters}


def scan_offsets(inputs, manifest):
    """Find part and chapter pages, using the manifest for titles and expected membership.

    The front matter, parts, and back matter open on a right-hand page. A blank page is
    inserted when one would fall on the left, so offsets count those pages too. The
    cover is a single page, so a blank inside cover puts the title page on the right.
    """
    frontmatter_pages = 0
    current_page = 0
    toc_page = None
    front_pages = {}
    chapter_offsets = {}
    part_offsets = {}
    back_offsets = {}
    pads = []
    part_count = len(manifest["parts"])
    for input_index, input_path in enumerate(inputs):
        with pdfium.PdfDocument(input_path) as document:
            if input_index < 2:
                if input_index == 1:
                    if not starts_on_recto(current_page + 1):
                        pads.append(input_index)
                        current_page += 1
                    toc_heading = re.compile(r"(?:^|[\r\n])\s*(?:TABLE\s+OF\s+)?CONTENTS\s*(?:[\r\n]|$)", re.I)
                    fallback_reader = None
                    for page_index in range(len(document)):
                        page = document[page_index]
                        try:
                            text = page_text(page, 600)
                        finally:
                            page.close()
                        if toc_page is None and not toc_heading.search(text):
                            # Chromium can emit adjacent glyphs that PDFium splits into separate lines.
                            if fallback_reader is None:
                                fallback_reader = PdfReader(input_path)
                            text = (fallback_reader.pages[page_index].extract_text() or "")[:600]
                        if toc_page is None and toc_heading.search(text):
                            toc_page = current_page + page_index + 1
                        for key, title in (("howToRead", "How to read this book"), ("aboutTheNumbers", "About the numbers")):
                            if key not in front_pages and text.lstrip().lower().startswith(title.lower()):
                                front_pages[key] = current_page + page_index + 1
                    if toc_page is None:
                        raise ValueError(f"Table of Contents opening page not found in {input_path}")
                current_page += len(document)
                if input_index == 1:
                    if not starts_on_recto(current_page + 1):
                        pads.append(input_index + 1)
                        current_page += 1
                    frontmatter_pages = current_page
                continue
            if not starts_on_recto(current_page + 1):
                pads.append(input_index)
                current_page += 1
            if input_index - 2 >= part_count:
                back_offsets[Path(input_path).stem.split("-", 2)[2]] = current_page + 1
                current_page += len(document)
                continue
            part = manifest["parts"][input_index - 2]
            part_offsets[str(part["partNumber"])] = current_page + 1
            expected = [str(chapter["chapterNumber"]) for chapter in part["chapters"]]
            found = []
            for page_index in range(len(document)):
                page = document[page_index]
                try:
                    text = page_text(page, 600)
                finally:
                    page.close()
                number = chapter_label(text)
                if number in expected:
                    if number in chapter_offsets:
                        raise ValueError(f"Chapter {number} has duplicate opening labels in {input_path}")
                    chapter_offsets[number] = current_page + page_index + 1
                    if not starts_on_recto(chapter_offsets[number]):
                        print(f"Warning: chapter {number} opens on a left-hand page ({chapter_offsets[number]})", file=sys.stderr)
                    found.append(number)
            if found != expected:
                raise ValueError(f"Chapter scan mismatch in {input_path}: expected {expected}, found {found}")
            current_page += len(document)
    return {
        "fingerprint": manifest["fingerprint"],
        "frontmatterPages": frontmatter_pages,
        "totalPages": current_page,
        "tocPage": toc_page,
        "frontPages": front_pages,
        "parts": part_offsets,
        "chapters": chapter_offsets,
        "backMatter": back_offsets,
        "pads": pads,
    }


def write_atomic(path, data):
    target = Path(path)
    temporary = target.with_suffix(target.suffix + ".tmp")
    try:
        with temporary.open("wb") as output:
            if isinstance(data, PdfWriter):
                data.write(output)
            else:
                output.write(json.dumps(data, indent=2).encode("utf-8"))
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)


FONT_DIRECTORY = Path(__file__).resolve().parent.parent / "web" / "tools" / "book" / "fonts"
FURNITURE_FONT = "BookFurniture"
FURNITURE_BOLD = "BookFurnitureBold"
# The text block's outer edge, in points, for the 7.5 by 9.25 inch trim. Letter and A4 use the same inset.
OUTER_MARGIN = 61.2
INNER_MARGIN = 72.0
HEAD_FROM_TOP = 40.0
FOLIO_FROM_BOTTOM = 34.0


def register_fonts():
    if FURNITURE_FONT not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(FURNITURE_FONT, str(FONT_DIRECTORY / "Inter-Regular.ttf")))
        pdfmetrics.registerFont(TTFont(FURNITURE_BOLD, str(FONT_DIRECTORY / "Inter-SemiBold.ttf")))


def fit(text, font, size, width):
    if stringWidth(text, font, size) <= width:
        return text
    words = text.split(" ")
    while len(words) > 1 and stringWidth(" ".join(words) + "...", font, size) > width:
        words.pop()
    return " ".join(words).rstrip(" ,:;") + "..."


def draw_furniture(drawing, width, height, recto, folio, head="", opening=False):
    """Draw a page's folio and hairline-ruled running head. Opening pages carry only a folio at the foot."""
    drawing.setPageSize((width, height))
    if opening:
        drawing.setFillColorRGB(0.28, 0.31, 0.34)
        drawing.setFont(FURNITURE_FONT, 7.5)
        drawing.drawCentredString(width / 2, FOLIO_FROM_BOTTOM, folio)
    else:
        limit = width - OUTER_MARGIN - INNER_MARGIN - 34
        title = fit(head, FURNITURE_FONT, 7.25, limit) if head else ""
        baseline = height - HEAD_FROM_TOP
        rule_y = baseline - 5.5
        if recto:
            left_edge = INNER_MARGIN
            right_edge = width - OUTER_MARGIN
            drawing.setFillColorRGB(0.06, 0.30, 0.36)
            drawing.setFont(FURNITURE_BOLD, 7.5)
            drawing.drawRightString(right_edge, baseline, folio)
            if title:
                drawing.setFillColorRGB(0.35, 0.38, 0.41)
                drawing.setFont(FURNITURE_FONT, 7.25)
                drawing.drawRightString(right_edge - stringWidth(folio, FURNITURE_BOLD, 7.5) - 11, baseline, title)
        else:
            left_edge = OUTER_MARGIN
            right_edge = width - INNER_MARGIN
            drawing.setFillColorRGB(0.06, 0.30, 0.36)
            drawing.setFont(FURNITURE_BOLD, 7.5)
            drawing.drawString(left_edge, baseline, folio)
            if title:
                drawing.setFillColorRGB(0.35, 0.38, 0.41)
                drawing.setFont(FURNITURE_FONT, 7.25)
                drawing.drawString(left_edge + stringWidth(folio, FURNITURE_BOLD, 7.5) + 11, baseline, title)
        drawing.setStrokeColorRGB(0.83, 0.82, 0.79)
        drawing.setLineWidth(0.45)
        drawing.line(left_edge, rule_y, right_edge, rule_y)
    drawing.showPage()


def furniture_pages(specs):
    """Draw all furniture in one document, so that every page shares one embedded font subset."""
    output = io.BytesIO()
    drawing = canvas.Canvas(output, initialFontName=FURNITURE_FONT)
    for spec in specs:
        draw_furniture(drawing, **spec)
    drawing.save()
    output.seek(0)
    return PdfReader(output).pages


def roman(number):
    numerals = (("x", 10), ("ix", 9), ("v", 5), ("iv", 4), ("i", 1))
    text = ""
    for symbol, value in numerals:
        while number >= value:
            text += symbol
            number -= value
    return text


def page_is_blank(document, index):
    """Check for ink, because Chromium adds invisible clip paths to even an empty page."""
    page = document[index]
    try:
        if page_text(page, 8).strip():
            return False
        bitmap = page.render(scale=0.25)
        try:
            return set(bytes(bitmap.buffer)) == {255}
        finally:
            bitmap.close()
    finally:
        page.close()


def section_map(reader, part):
    """Map a part PDF's page indexes to the section that the page opens or continues.

    Returns {chapter slug: [(page index, section title), ...]} in page order.
    """
    result = {}
    for chapter in part["chapters"]:
        sections = []
        for section in chapter.get("sections") or []:
            # Chromium's destination names keep the leading slash of a PDF name.
            destination = reader.named_destinations.get(f"/{section['id']}")
            if destination is None:
                continue
            page_index = reader.get_destination_page_number(destination)
            if page_index is not None and page_index >= 0:
                sections.append((page_index, section["title"]))
        result[chapter["slug"]] = sorted(sections, key=lambda item: item[0])
    return result


def merge_book(inputs, manifest, offsets, output_path):
    actual_offsets = scan_offsets(inputs, manifest)
    if offsets != actual_offsets:
        raise ValueError("Page offsets no longer match the PDFs. Run --all to regenerate the TOC.")
    register_fonts()
    config = manifest["config"]
    writer = PdfWriter()
    frontmatter = offsets["frontmatterPages"]
    pads = set(offsets.get("pads", []))
    parts = manifest["parts"]
    starts = sorted(
        (offsets["chapters"][str(chapter["chapterNumber"])], part["title"], chapter["title"], chapter["slug"], part_index)
        for part_index, part in enumerate(parts) for chapter in part["chapters"]
    )
    start_pages = [entry[0] for entry in starts]
    openings = set(start_pages) | set(offsets["parts"].values()) | set(offsets.get("backMatter", {}).values())
    # Pages before the contents carry no folio: cover, title page, and copyright page.
    first_numbered_front = offsets["tocPage"]
    physical_page = 0
    furnished = []
    for input_index, input_path in enumerate(inputs):
        reader = PdfReader(input_path)
        if input_index in pads:
            first = reader.pages[0]
            writer.add_blank_page(float(first.mediabox.width), float(first.mediabox.height))
            physical_page += 1
        input_page_offset = physical_page
        is_part = 2 <= input_index < 2 + len(parts)
        sections = section_map(reader, parts[input_index - 2]) if is_part else {}
        back_title = None
        if input_index >= 2 + len(parts):
            back_title = "Bibliography" if "bibliography" in Path(input_path).name else "Index"
        with pdfium.PdfDocument(input_path) as document:
            blanks = {index for index in range(len(document)) if page_is_blank(document, index)}
        for page_index, source_page in enumerate(reader.pages):
            physical_page += 1
            page = writer.add_page(source_page)
            size = {"width": float(page.mediabox.width), "height": float(page.mediabox.height), "recto": physical_page % 2 == 1}
            if input_index == 0 or page_index in blanks:
                continue
            if physical_page <= frontmatter:
                if physical_page >= first_numbered_front:
                    furnished.append((page, {**size, "folio": roman(physical_page), "opening": True}))
                continue
            folio = str(physical_page - frontmatter)
            head = ""
            if is_part and physical_page not in openings:
                index = bisect_right(start_pages, physical_page) - 1
                if index >= 0:
                    _, _, chapter_title, slug, _ = starts[index]
                    if size["recto"]:
                        # A section that starts on this page names it; otherwise the section in progress does.
                        current = [title for start, title in sections.get(slug, []) if start == page_index]
                        earlier = [title for start, title in sections.get(slug, []) if start < page_index]
                        head = (current or earlier[-1:] or [chapter_title])[0]
                    else:
                        head = chapter_title
            elif back_title and physical_page not in openings:
                head = back_title
            furnished.append((page, {**size, "folio": folio, "head": head, "opening": physical_page in openings}))
        for name, destination in reader.named_destinations.items():
            page_index = reader.get_destination_page_number(destination)
            if page_index is None or page_index < 0:
                raise ValueError(f"Invalid named destination {name} in {input_path}")
            writer.add_named_destination(name, input_page_offset + page_index, Fit(destination.typ, destination.dest_array[2:]))
    for (page, _), overlay in zip(furnished, furniture_pages([spec for _, spec in furnished])):
        page.merge_page(overlay)
        # Merging decodes the page's content stream and does not compress it again.
        page.compress_content_streams()
    chapter_pages = {
        chapter["slug"]: offsets["chapters"][str(chapter["chapterNumber"])] - 1
        for part in manifest["parts"] for chapter in part["chapters"]
    }
    converted_links = 0
    for page in writer.pages:
        for annotation_reference in page.get("/Annots", []):
            annotation = annotation_reference.get_object()
            action = annotation.get("/A")
            if action is None:
                continue
            action = action.get_object()
            if action.get("/S") != "/URI":
                continue
            uri = urlsplit(str(action.get("/URI", "")))
            if parse_qs(uri.query).get("view") == ["online"]:
                continue
            match = re.fullmatch(r"/learn/([^/]+)/?", unquote(uri.path))
            if uri.scheme not in ("http", "https") or uri.hostname not in ("leetllm.com", "www.leetllm.com") or not match:
                continue
            destination_page = chapter_pages.get(match[1])
            if destination_page is not None:
                annotation[NameObject("/Dest")] = ArrayObject([writer.pages[destination_page].indirect_reference, NameObject("/Fit")])
                del annotation["/A"]
                converted_links += 1
    writer.add_outline_item("Cover", 0)
    with pdfium.PdfDocument(inputs[0]) as cover:
        cover_pages = len(cover)
    writer.add_outline_item("Title Page", cover_pages + (1 if 1 in pads else 0))
    writer.add_outline_item("Contents", offsets["tocPage"] - 1)
    for key, title in (("howToRead", "How to Read This Book"), ("aboutTheNumbers", "About the Numbers")):
        if key in offsets.get("frontPages", {}):
            writer.add_outline_item(title, offsets["frontPages"][key] - 1)
    for part in manifest["parts"]:
        part_item = writer.add_outline_item(
            f"Part {part['partNumber']}: {part['title']}",
            offsets["parts"][str(part["partNumber"])] - 1,
        )
        for chapter in part["chapters"]:
            writer.add_outline_item(
                f"Chapter {chapter['chapterNumber']}: {chapter['title']}",
                offsets["chapters"][str(chapter["chapterNumber"])] - 1,
                parent=part_item,
            )
    for key, title in (("bibliography", "Bibliography"), ("index", "Index")):
        if key in offsets.get("backMatter", {}):
            writer.add_outline_item(title, offsets["backMatter"][key] - 1)
    writer.add_metadata({
        "/Title": config["title"],
        "/Author": config["author"],
        "/Subject": config["subtitle"],
        "/Creator": f"{config['publisher']} Book Engine (Chromium)",
    })
    writer.page_mode = "/UseOutlines"
    if frontmatter > 0:
        writer.set_page_label(0, frontmatter - 1, style="/r", start=1)
    writer.set_page_label(frontmatter, len(writer.pages) - 1, style="/D", start=1)
    writer.compress_identical_objects()
    write_atomic(output_path, writer)
    print(f"Compiled {physical_page} pages to {output_path} ({os.path.getsize(output_path) / 1024 / 1024:.2f} MB); {converted_links} chapter links target the book")


def normalized_page_text(page):
    text = page_text(page)
    # Join words the typesetter hyphenated across lines, then flatten whitespace.
    text = re.sub(r"[-\u00ad\u2010]\s*[\r\n]+\s*", "", text)
    return re.sub(r"\s+", " ", text)


# Adding "s" to these makes a different word, so "trie" must not find the verb "tries".
NO_PLURAL = {"trie"}
SOURCE_LIST = re.compile(r"sources and further reading", re.I)


def index_term_pattern(name):
    """Match a term as a whole word. Capitals after the first letter mean the case matters."""
    escaped = re.escape(name).replace(r"\ ", r"\s+")
    exact = any(character.isupper() for character in name[1:])
    plural = "" if name.lower() in NO_PLURAL else "(?:s|es)?"
    return re.compile(rf"(?<![\w-]){escaped}{plural}(?![\w-])", 0 if exact else re.I)


def index_phrase_pattern(phrase):
    """Match a phrase exactly as typeset, whatever the line breaks did to its spaces."""
    return re.compile(r"\s+".join(re.escape(word) for word in phrase.split()))


def body_pages(inputs, manifest, offsets):
    """Pages a reader should be sent to. Part dividers and source lists only repeat other words."""
    pages = []
    frontmatter = offsets["frontmatterPages"]
    for part_index, part in enumerate(manifest["parts"]):
        start = offsets["parts"][str(part["partNumber"])]
        in_sources = False
        with pdfium.PdfDocument(inputs[2 + part_index]) as document:
            for page_index in range(1, len(document)):
                page = document[page_index]
                try:
                    if chapter_label(page_text(page, 600)):
                        in_sources = False
                    text = "" if in_sources else normalized_page_text(page)
                finally:
                    page.close()
                source_list = SOURCE_LIST.search(text)
                if source_list:
                    text = text[:source_list.start()]
                    in_sources = True
                pages.append((start + page_index - frontmatter, text))
    return pages


def index_subentries(term, counts, pages, max_locators):
    """A subentry lists the pages where the term and one of the subentry's phrases meet."""
    entries = []
    for sub in term.get("sub", []):
        patterns = [index_term_pattern(name) for name in sub["match"]]
        found = {}
        for folio, text in pages:
            if folio in counts or sub.get("anywhere"):
                count = sum(len(pattern.findall(text)) for pattern in patterns)
                if count:
                    found[folio] = count
        if found:
            strongest = sorted(found, key=lambda folio: (-found[folio], folio))[:max_locators]
            entries.append({"title": sub["title"], "pages": sorted(strongest)})
    return entries


def build_index(inputs, manifest, offsets, terms_path, output_path, max_locators=8, common_share=0.2):
    """Find index terms on body pages and keep the pages that discuss each term most."""
    terms = read_json(terms_path)
    pages = body_pages(inputs, manifest, offsets)
    entries, undefined = [], []
    for term in terms:
        if term.get("see"):
            entries.append({"title": term["title"], "see": term["see"]})
            continue
        patterns = [index_term_pattern(name) for name in [term["title"], *term.get("aliases", [])]]
        counts = {}
        for folio, text in pages:
            count = sum(len(pattern.findall(text)) for pattern in patterns)
            if count:
                counts[folio] = count
        defined = []
        if term.get("defined"):
            phrase = index_phrase_pattern(term["defined"])
            defined = [folio for folio, text in pages if phrase.search(text)][:1]
            if not defined:
                undefined.append(term["title"])
        # A term on many pages says little, unless it is one of the book's central topics.
        if not counts and not defined:
            continue
        if len(counts) > common_share * len(pages) and not term.get("core"):
            continue
        strongest = sorted(counts, key=lambda folio: (-counts[folio], folio))[:max_locators]
        entry = {"title": term["title"], "pages": sorted({*strongest, *defined})}
        if defined:
            entry["defined"] = defined
        sub = index_subentries(term, counts, pages, 3)
        if sub:
            entry["sub"] = sub
        if term.get("seeAlso"):
            entry["seeAlso"] = term["seeAlso"]
        entries.append(entry)
    titles = {entry["title"] for entry in entries}
    broken = sorted({entry["see"] for entry in entries if entry.get("see") and entry["see"] not in titles}
                    | {target for entry in entries for target in entry.get("seeAlso", []) if target not in titles})
    if broken:
        raise ValueError(f"Index cross-references have no entry: {', '.join(broken)}")
    write_atomic(output_path, entries)
    print(f"Indexed {len(entries)} of {len(terms)} terms across {len(pages)} pages")
    if undefined:
        print(f"Warning: index definition phrases not found for: {', '.join(undefined)}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", help="Manifest from the current book build")
    parser.add_argument("--output")
    parser.add_argument("--chapter-pages", action="store_true", help="Print one part's chapter opening pages as JSON")
    parser.add_argument("--scan", action="store_true", help="Write offsets instead of merging")
    parser.add_argument("--offsets", help="Verified offsets used to typeset the final TOC")
    parser.add_argument("--index-terms", help="Glossary terms to locate on body pages")
    parser.add_argument("inputs", nargs="+")
    args = parser.parse_args()
    if args.chapter_pages:
        print(json.dumps(chapter_pages(args.inputs[0])))
        return
    if not args.manifest or not args.output:
        parser.error("--manifest and --output are required")
    manifest = read_json(args.manifest)
    verify_inputs(args.inputs, manifest)
    if args.index_terms:
        build_index(args.inputs, manifest, read_json(args.offsets), args.index_terms, args.output)
    elif args.scan:
        offsets = scan_offsets(args.inputs, manifest)
        write_atomic(args.output, offsets)
        print(f"Scanned {len(offsets['chapters'])} chapters across {offsets['totalPages']} pages")
    elif args.offsets:
        merge_book(args.inputs, manifest, read_json(args.offsets), args.output)
    else:
        parser.error("--offsets is required when merging")


if __name__ == "__main__":
    main()
