#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pypdfium2==5.14.0", "Pillow==13.0.0", "pypdf==6.21.2"]
# ///
"""Check which pages the page-fill review counts, on real rasters."""

import importlib.util
from pathlib import Path
import unittest

from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location("review_book_layout", Path(__file__).with_name("review-book-layout.py"))
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


def row(number, label, fill):
    return {"page": number, "page_label": label, "metrics": {"text_block_fill": fill}, "findings": []}


class PageFillTest(unittest.TestCase):
    def test_furniture_does_not_hide_a_hole(self):
        page = Image.new("RGB", (540, 666), "white")
        drawing = ImageDraw.Draw(page)
        drawing.rectangle((100, 40, 300, 46), fill="black")  # running head
        drawing.rectangle((100, 620, 120, 626), fill="black")  # folio
        drawing.rectangle((100, 66, 400, 300), fill="black")  # text
        fill = review.page_fill(page, 1, 66.24, 59.04)
        self.assertAlmostEqual(fill, (301 - 66) / (607 - 66), places=2)
        self.assertEqual(review.page_fill(Image.new("RGB", (540, 666), "white"), 1, 66.24, 59.04), 0.0)

    def test_only_unplanned_holes_are_queued(self):
        pages = [
            row(1, "iv", 0.2),  # front matter
            row(2, "1", 0.3),  # an opening, which has a designed layout
            row(3, "2", 0.5),  # a hole inside a chapter
            row(4, "3", 0.9),
            row(5, "4", 0.1),  # a chapter ending, because a blank page follows
            row(6, "5", 0.0),  # blank
            row(7, "6", 0.4),  # a chapter ending, because an opening follows
            row(8, "7", 0.4),  # an opening
        ]
        summary = review.fill_findings(pages, {1, 7}, 0.25)
        self.assertEqual(summary["measured_pages"], 2)
        self.assertEqual(summary["underfilled_pages"], 1)
        self.assertEqual(summary["worst_pages"], [{"page": 3, "page_label": "2", "hole_fraction": 0.5}])
        self.assertEqual([page["page"] for page in pages if page["findings"]], [3])


if __name__ == "__main__":
    unittest.main()
