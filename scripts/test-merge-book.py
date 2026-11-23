#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pypdf>=6,<7", "pypdfium2>=5,<6", "reportlab>=4,<5"]
# ///
"""Exercise real PDF pagination, links, and stale-build protection."""

import hashlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from pypdf import PdfReader, PdfWriter
from pypdf.annotations import Link
from pypdf.generic import NameObject, TextStringObject
from reportlab.pdfgen import canvas

spec = importlib.util.spec_from_file_location("merge_book", Path(__file__).with_name("merge-book.py"))
merge_book = importlib.util.module_from_spec(spec)
spec.loader.exec_module(merge_book)


def clip_path_page():
    output = io.BytesIO()
    drawing = canvas.Canvas(output, pagesize=(540, 666))
    path = drawing.beginPath()
    path.rect(72, 59, 406, 541)
    drawing.clipPath(path, stroke=0, fill=0)
    drawing.showPage()
    drawing.save()
    output.seek(0)
    return output


class BookMergeTest(unittest.TestCase):
    def test_complete_book_and_rejected_stale_inputs(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-book-test-") as temporary:
            directory = Path(temporary)
            inputs = []
            fixtures = [
                ("part-0a-cover.pdf", ["Cover"]),
                ("part-0b-toc.pdf", ["Copyright", "Table of Contents"]),
                ("part-1.pdf", ["Part 1", "", "CHAPTER 1\nA long chapter title that\nwraps across two lines", "Body", "Body two", "", "CHAPTER 2\nAnother title"]),
                ("part-zb-bibliography.pdf", ["Bibliography"]),
                ("part-zi-index.pdf", ["Index"]),
            ]
            for name, pages in fixtures:
                path = directory / name
                drawing = canvas.Canvas(str(path), pagesize=(540, 666))
                for text in pages:
                    for line, content in enumerate(text.splitlines()):
                        drawing.drawString(54, 600 - line * 20, content)
                    drawing.showPage()
                drawing.save()
                inputs.append(str(path))
            part_path = inputs[2]

            # Model Chromium's named citation and section targets and public lesson links.
            part = PdfWriter(clone_from=part_path)
            part.add_named_destination("/citation", 6)
            part.add_named_destination("/section-one", 4)
            # Chromium's empty pages hold invisible clip paths, and those pages still count as blank.
            part.pages[5].merge_page(PdfReader(clip_path_page()).pages[0])
            citation = Link(rect=(10, 10, 50, 50), target_page_index=6)
            citation[NameObject("/Dest")] = TextStringObject("/citation")
            part.add_annotation(page_number=3, annotation=citation)
            part.add_annotation(page_number=3, annotation=Link(rect=(60, 10, 100, 50), url="https://leetllm.com/learn/chapter-two#heading"))
            part.add_annotation(page_number=3, annotation=Link(rect=(110, 10, 150, 50), url="https://leetllm.com/learn/excluded"))
            part.add_annotation(page_number=3, annotation=Link(rect=(160, 10, 200, 50), url="https://leetllm.com/learn/chapter-two?view=online"))
            with open(part_path, "wb") as output:
                part.write(output)

            manifest = {
                "fingerprint": "fixture",
                "config": {"title": "Fixture", "subtitle": "Book test", "author": "Author", "publisher": "Publisher"},
                "parts": [{"partNumber": 1, "title": "Part title", "chapters": [
                    {"chapterNumber": 1, "title": "A long chapter title that wraps across two lines", "slug": "chapter-one",
                     "sections": [{"id": "section-one", "title": "Section one"}]},
                    {"chapterNumber": 2, "title": "Another title", "slug": "chapter-two", "sections": []},
                ]}],
                "backMatter": ["part-zb-bibliography.pdf", "part-zi-index.pdf"],
                "artifacts": {Path(path).name: {"sha256": hashlib.sha256(Path(path).read_bytes()).hexdigest()} for path in inputs},
            }
            merge_book.verify_inputs(inputs, manifest)
            offsets = merge_book.scan_offsets(inputs, manifest)
            # A blank page keeps the part and back matter on right-hand pages.
            self.assertEqual(offsets["chapters"], {"1": 7, "2": 11})
            self.assertEqual(offsets["parts"], {"1": 5})
            self.assertEqual(offsets["backMatter"], {"bibliography": 13, "index": 15})
            self.assertEqual(offsets["frontmatterPages"], 4)
            self.assertEqual(offsets["totalPages"], 15)
            original_text_range = merge_book.pdfium.PdfTextPage.get_text_range

            def fragmented_heading(page, *args, **kwargs):
                text = original_text_range(page, *args, **kwargs)
                return text.replace("Contents", "\r\n".join("Contents"))

            with patch.object(merge_book.pdfium.PdfTextPage, "get_text_range", fragmented_heading):
                self.assertEqual(merge_book.scan_offsets(inputs, manifest), offsets)
            output = directory / "book.pdf"
            merge_book.merge_book(inputs, manifest, offsets, output)
            reader = PdfReader(output)
            self.assertEqual(len(reader.pages), 15)
            self.assertEqual(reader.page_labels, ["i", "ii", "iii", "iv", *(str(folio) for folio in range(1, 12))])

            def text(index):
                return reader.pages[index].extract_text().split()

            # The inside cover is blank. Folios begin at the contents, and blank pages carry nothing.
            self.assertEqual(text(1), [])
            self.assertEqual(text(2), ["Copyright"])
            self.assertIn("iv", text(3))
            self.assertEqual(text(5), [])
            # Openings carry only a folio. A left page names the chapter, a right page the section.
            opening = reader.pages[6].extract_text()
            self.assertNotIn("A long chapter title that wraps", opening)
            self.assertIn("3", opening.split())
            self.assertIn("A long chapter title that wraps across two lines", " ".join(text(7)))
            self.assertIn("4", text(7))
            self.assertIn("Section one", " ".join(text(8)))
            self.assertIn("5", text(8))

            part_item, chapters = reader.outline[3], reader.outline[4]
            self.assertEqual(reader.get_destination_page_number(reader.outline[1]), 2)
            self.assertEqual(part_item["/Title"], "Part 1: Part title")
            self.assertEqual(chapters[0]["/Title"], "Chapter 1: A long chapter title that wraps across two lines")
            self.assertEqual(reader.get_destination_page_number(chapters[0]), 6)
            self.assertEqual([item["/Title"] for item in reader.outline[-2:]], ["Bibliography", "Index"])
            self.assertEqual(reader.get_destination_page_number(reader.outline[-1]), 14)
            self.assertEqual(reader.get_destination_page_number(reader.named_destinations["/citation"]), 10)
            links = [annotation.get_object() for annotation in reader.pages[7]["/Annots"]]
            self.assertEqual(links[0]["/Dest"], "/citation")
            self.assertEqual(links[1]["/Dest"][0], reader.pages[10].indirect_reference)
            self.assertEqual(links[2]["/A"]["/URI"], "https://leetllm.com/learn/excluded")
            self.assertEqual(links[3]["/A"]["/URI"], "https://leetllm.com/learn/chapter-two?view=online")

            terms = directory / "terms.json"
            terms.write_text('[{"title": "Body", "aliases": []}, {"title": "Absent", "aliases": []}]')
            index = directory / "index.json"
            merge_book.build_index(inputs, manifest, offsets, terms, index, common_share=1)
            self.assertEqual(merge_book.read_json(index), [{"title": "Body", "pages": [4, 5]}])

            with self.assertRaisesRegex(ValueError, "every planned part"):
                merge_book.verify_inputs(inputs[:2], manifest)
            missing_chapter = {**manifest, "parts": [{**manifest["parts"][0], "chapters": [*manifest["parts"][0]["chapters"], {"chapterNumber": 3}]}]}
            with self.assertRaisesRegex(ValueError, "Chapter scan mismatch"):
                merge_book.scan_offsets(inputs, missing_chapter)
            with self.assertRaisesRegex(ValueError, "offsets no longer match"):
                merge_book.merge_book(inputs, manifest, {**offsets, "totalPages": 9}, output)
            Path(part_path).write_bytes(Path(part_path).read_bytes() + b"changed")
            with self.assertRaisesRegex(ValueError, "changed since rendering"):
                merge_book.verify_inputs(inputs, manifest)


if __name__ == "__main__":
    unittest.main()
