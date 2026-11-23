#!/usr/bin/env python3
"""
LeetLLM Book Offset Scanner — Computes exact page numbers for TOC and bookmarks
Uses native pypdfium2 (C++ PDFium) for lightning-fast page scanning (<3s across 4,000+ pages).
"""

import sys
import os
import re
import json
import argparse
import pypdfium2 as pdfium

def scan_book_offsets(cover_path: str, toc_path: str, part_paths: list[str], output_json: str):
    frontmatter_pages = 0

    if os.path.exists(cover_path):
        cover = pdfium.PdfDocument(cover_path)
        frontmatter_pages += len(cover)

    if os.path.exists(toc_path):
        toc = pdfium.PdfDocument(toc_path)
        frontmatter_pages += len(toc)

    print(f"📄 Frontmatter pages: {frontmatter_pages} (cover + TOC)")

    chapter_offsets = {}
    part_offsets = {}
    current_page = frontmatter_pages

    for part_file in part_paths:
        if not os.path.exists(part_file):
            continue

        pdf = pdfium.PdfDocument(part_file)
        basename = os.path.basename(part_file)
        part_match = re.search(r"part-(\d+)", basename)
        part_num = int(part_match.group(1)) if part_match else None

        if part_num is not None and part_num not in part_offsets:
            part_offsets[part_num] = current_page + 1

        for page_idx, page in enumerate(pdf):
            tp = page.get_textpage()
            # Chapter header is in the first 250 characters of the page
            txt = tp.get_text_range(0, 250)
            m = re.search(r"CHAPTER\s+(\d+)", txt, re.IGNORECASE)
            if m:
                ch_num = int(m.group(1))
                if ch_num not in chapter_offsets:
                    chapter_offsets[ch_num] = current_page + page_idx + 1

        current_page += len(pdf)

    result = {
        "frontmatterPages": frontmatter_pages,
        "totalPages": current_page,
        "parts": part_offsets,
        "chapters": chapter_offsets,
    }

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(f"✅ Scanned {len(chapter_offsets)} chapters across {current_page} pages -> {output_json}")

def main():
    parser = argparse.ArgumentParser(description="Scan PDF part files to compute chapter and part page offsets")
    parser.add_argument("--cover", required=True, help="Path to cover PDF")
    parser.add_argument("--toc", required=True, help="Path to draft TOC PDF")
    parser.add_argument("--output", required=True, help="Output JSON path")
    parser.add_argument("parts", nargs="+", help="Part PDF files in sequential order")
    args = parser.parse_args()

    scan_book_offsets(args.cover, args.toc, args.parts, args.output)

if __name__ == "__main__":
    main()
