#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Focused executable contracts for the offline paper crop tool."""

import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import time
import unittest


spec = importlib.util.spec_from_file_location(
    "paper_figure", Path(__file__).with_name("prepare-paper-figure.py")
)
tool = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tool)


def small_pdf(rotation=0):
    """Two vector pages, each a different solid color; no external fixture."""
    streams = [b"1 0 0 rg 0 0 200 100 re f", b"0 0 1 rg 0 0 200 100 re f"]
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Contents 4 0 R >>",
        b"<< /Length %d >>\nstream\n%s\nendstream" % (len(streams[0]), streams[0]),
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Rotate %d /Contents 6 0 R >>"
        % rotation,
        b"<< /Length %d >>\nstream\n%s\nendstream" % (len(streams[1]), streams[1]),
    ]
    content = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, body in enumerate(objects, 1):
        offsets.append(len(content))
        content.extend(f"{index} 0 obj\n".encode() + body + b"\nendobj\n")
    xref = len(content)
    content.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        content.extend(f"{offset:010} 00000 n \n".encode())
    content.extend(
        f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    )
    return bytes(content)


class PaperPreparationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.pdf = self.root / "source.pdf"
        self.pdf.write_bytes(small_pdf())
        self.recipe = {
            "schemaVersion": 1,
            "source": {
                "url": "https://example.org/paper-v1.pdf",
                "version": "v1",
                "sha256": hashlib.sha256(self.pdf.read_bytes()).hexdigest(),
                "title": "A bounded test figure",
                "authors": ["Example Author"],
                "year": 2026,
            },
            "figures": [
                {
                    "id": "crop",
                    "locator": "Page 2 crop",
                    "page": 2,
                    "crop": {"x": 10, "y": 20, "width": 30, "height": 25},
                    "dpi": 144,
                    "output": "crop.png",
                }
            ],
        }
        self.recipe_path = self.root / "recipe.json"

    def prepare(self, recipe=None):
        self.recipe_path.write_text(json.dumps(recipe or self.recipe))
        return tool.prepare(
            self.recipe_path, root=self.root, local_pdf=self.pdf, offline=True
        )

    def test_actual_poppler_crop_is_repeatable_and_binds_exact_inputs(self):
        first = self.prepare()
        png = (self.root / "crop.png").read_bytes()
        manifest = (self.root / "manifest.json").read_bytes()
        self.assertEqual(tool.png_dimensions(png), (60, 50))
        self.assertEqual(first["assets"][0]["sha256"], hashlib.sha256(png).hexdigest())
        self.assertEqual(
            first["assets"][0]["source"]["sha256"], self.recipe["source"]["sha256"]
        )
        self.assertNotIn("path", first["assets"][0]["source"])
        self.assertEqual(first, self.prepare())
        self.assertEqual(manifest, (self.root / "manifest.json").read_bytes())
        self.assertEqual(png, (self.root / "crop.png").read_bytes())
        changed = copy.deepcopy(self.recipe)
        changed["figures"][0]["page"] = 1
        self.prepare(changed)
        self.assertNotEqual(
            png,
            (self.root / "crop.png").read_bytes(),
            "selected page changes the actual rendered pixels",
        )

    def test_rotated_page_uses_displayed_cropbox_coordinates(self):
        self.pdf.write_bytes(small_pdf(rotation=90))
        self.recipe["source"]["sha256"] = hashlib.sha256(
            self.pdf.read_bytes()
        ).hexdigest()
        manifest = self.prepare()
        geometry = manifest["assets"][0]["derivation"]["pageGeometry"]
        self.assertEqual(
            (geometry["displayWidthPt"], geometry["displayHeightPt"]), (100, 200)
        )
        self.assertEqual(geometry["rotation"], 90)
        self.assertEqual(
            tool.png_dimensions((self.root / "crop.png").read_bytes()), (60, 50)
        )

    def test_hash_and_missing_pdf_fail_before_emitting_a_derivative(self):
        self.recipe["source"]["sha256"] = "0" * 64
        with self.assertRaisesRegex(tool.PreparationError, "SHA-256 mismatch"):
            self.prepare()
        self.assertFalse((self.root / "crop.png").exists())
        self.pdf.unlink()
        with self.assertRaisesRegex(tool.PreparationError, "unavailable"):
            self.prepare()

    def test_out_of_page_crop_and_invalid_page_do_not_replace_prior_output(self):
        self.prepare()
        before = (self.root / "crop.png").read_bytes()
        self.recipe["figures"][0]["crop"]["width"] = 201
        with self.assertRaisesRegex(tool.PreparationError, "beyond"):
            self.prepare()
        self.assertEqual(before, (self.root / "crop.png").read_bytes())
        self.recipe["figures"][0]["crop"]["width"] = 30
        self.recipe["figures"][0]["page"] = 3
        with self.assertRaises(tool.PreparationError):
            self.prepare()

    def test_invalid_dimensions_and_traversal_are_rejected(self):
        for field, value in [
            ("dpi", float("nan")),
            ("page", True),
            ("output", "../escaped.png"),
        ]:
            recipe = copy.deepcopy(self.recipe)
            recipe["figures"][0][field] = value
            with self.assertRaises(tool.PreparationError):
                self.prepare(recipe)
        with self.assertRaisesRegex(tool.PreparationError, "escapes"):
            tool.inside_root(self.root.parent / "escaped.png", self.root)

    def test_stream_enforces_size_and_total_deadline(self):
        with self.assertRaisesRegex(tool.PreparationError, "exceeds 4 bytes"):
            tool.copy_bounded_stream(
                io.BytesIO(b"12345"),
                io.BytesIO(),
                limit=4,
                deadline=time.monotonic() + 1,
            )
        with self.assertRaisesRegex(tool.PreparationError, "time limit"):
            tool.copy_bounded_stream(
                io.BytesIO(b"1"), io.BytesIO(), limit=4, deadline=time.monotonic() - 1
            )
        with self.assertRaisesRegex(tool.PreparationError, "HTTPS"):
            tool.https_url("http://example.org/paper.pdf")


if __name__ == "__main__":
    unittest.main()
