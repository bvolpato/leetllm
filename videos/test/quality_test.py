#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Exercise editorial score freshness, coverage, and safe gallery publication."""

import copy
import hashlib
import json
from pathlib import Path
import runpy
import tempfile
import unittest

API = runpy.run_path(str(Path(__file__).resolve().parents[1] / "quality.py"))


class QualityReviewTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="leetllm-quality-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        folder = self.root / "example"
        folder.mkdir()
        (folder / "example.mp4").write_bytes(b"movie")
        (folder / "timeline.json").write_text(json.dumps({"scenes": [{"id": "intro"}, {"id": "explanation"}]}))
        sha = hashlib.sha256(b"movie").hexdigest()
        image = self.root / "image.png"
        image.write_bytes(b"review image")
        image_sha = hashlib.sha256(image.read_bytes()).hexdigest()
        self.receipts = [{"id": "example", "title": "A < B", "sha256": sha, "fingerprint": "sources"}]
        self.rubric = self.root / "rubric.json"
        self.rubric.write_text(json.dumps({"id": "test", "dimensions": [
            {"id": "teaching", "title": "Teaching", "maximum": 100, "criteria": "Teach clearly."}],
            "bands": [{"minimum": 0, "label": "Reviewed"}], "scoring": "Use evidence."}))
        self.item = {"id": "example", "movieSha256": sha, "sourceFingerprint": "sources",
                     "scores": {"teaching": 85}, "rationale": {"teaching": "Clear <script>alert(1)</script>"},
                     "strengths": ["Useful example"], "improvements": ["More intuition | less density"],
                     "blockers": [], "fixes": [], "reviewer": "Reviewer", "viewedImages": [{"path": "image.png", "sha256": image_sha}],
                     "reviewedScenes": ["intro", "explanation"]}
        self.reviews = self.root / "reviews.json"
        self.save([self.item])
        (self.root / "index.html").write_text('<main><section id="lessons"><article><h2>A &lt; B</h2><video><source src="example/example.mp4?v=abc"></video></article></section></main>')

    def save(self, lessons):
        self.reviews.write_text(json.dumps({"version": 1, "rubricId": "test", "rubricSha256": hashlib.sha256(self.rubric.read_bytes()).hexdigest(), "scope": "Sampled review", "lessons": lessons}))

    def load(self):
        return API["load_reviews"](self.reviews, self.rubric, self.receipts, self.root)

    def test_total_is_derived_and_coverage_must_be_exact(self):
        self.assertEqual(self.load()[1][0]["total"], 85)
        for rows in ([], [self.item, self.item], [{**self.item, "id": "another"}]):
            with self.subTest(rows=rows), self.assertRaisesRegex(ValueError, "cover"):
                self.save(rows)
                self.load()

    def test_rejects_changed_movie_and_render_sources(self):
        for field in ("movieSha256", "sourceFingerprint"):
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, "Stale"):
                self.save([{**self.item, field: "old"}])
                self.load()
        self.save([self.item])
        (self.root / "example/example.mp4").write_bytes(b"replacement")
        with self.assertRaisesRegex(ValueError, "Stale"):
            self.load()

    def test_a_changed_rubric_requires_reassessment(self):
        rubric = json.loads(self.rubric.read_text())
        rubric["dimensions"][0]["criteria"] = "A different assessment."
        self.rubric.write_text(json.dumps(rubric))
        with self.assertRaisesRegex(ValueError, "rubric"):
            self.load()

    def test_rejects_invented_totals_out_of_range_scores_and_missing_reasons(self):
        changes = [{"total": 99}, {"scores": {"teaching": 101}}, {"scores": {"teaching": -1}},
                   {"scores": {"teaching": True}}, {"scores": {"teaching": 8.5}},
                   {"rationale": {"teaching": " "}}, {"scores": {}}, {"rationale": {}}]
        for change in changes:
            with self.subTest(change=change), self.assertRaises(ValueError):
                self.save([{**self.item, **change}])
                self.load()

    def test_requires_every_scene_in_order_and_review_provenance(self):
        for change in ({"reviewedScenes": ["intro"]}, {"reviewedScenes": ["explanation", "intro"]},
                       {"viewedImages": []}, {"reviewer": ""}, {"blockers": "none"}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                self.save([{**self.item, **change}])
                self.load()

    def test_publication_escapes_notes_preserves_blockers_and_is_repeatable(self):
        item = copy.deepcopy(self.item)
        item["blockers"] = ["Fix <overlap>"]
        self.save([item])
        publish = lambda: API["publish_quality"](self.root, self.reviews, self.rubric, self.receipts)
        publish()
        first = (self.root / "index.html").read_text()
        self.assertNotIn("<script>alert(1)</script>", first)
        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", first)
        self.assertIn("Needs repair", first)
        self.assertIn("Fix &lt;overlap&gt;", first)
        publish()
        self.assertEqual(first, (self.root / "index.html").read_text())
        data = json.loads((self.root / "quality-reviews.json").read_text())
        self.assertEqual(data["lessons"][0]["total"], 85)
        exported_image = self.root / data["lessons"][0]["viewedImages"][0]["path"]
        self.assertEqual(exported_image.read_bytes(), b"review image")
        self.assertIn("Fix <overlap>", (self.root / "quality-scores.csv").read_text())

    def test_changed_review_image_cannot_publish_a_score(self):
        before = (self.root / "index.html").read_bytes()
        (self.root / "image.png").write_bytes(b"different image")
        with self.assertRaisesRegex(ValueError, "image is missing or changed"):
            API["publish_quality"](self.root, self.reviews, self.rubric, self.receipts)
        self.assertEqual(before, (self.root / "index.html").read_bytes())

    def test_stale_review_cannot_partially_replace_gallery(self):
        old = (self.root / "index.html").read_bytes()
        self.save([{**self.item, "movieSha256": "stale"}])
        with self.assertRaisesRegex(ValueError, "Stale"):
            API["publish_quality"](self.root, self.reviews, self.rubric, self.receipts)
        self.assertEqual(old, (self.root / "index.html").read_bytes())
        self.assertFalse((self.root / "quality-reviews.json").exists())

    def test_minimum_score_blocks_publication_and_accepts_the_boundary(self):
        before = (self.root / "index.html").read_bytes()
        report = json.loads(self.reviews.read_text())
        report["minimumScore"] = 90
        self.reviews.write_text(json.dumps(report))
        with self.assertRaisesRegex(ValueError, "below required minimum"):
            API["publish_quality"](self.root, self.reviews, self.rubric, self.receipts)
        self.assertEqual(before, (self.root / "index.html").read_bytes())
        self.assertFalse((self.root / "quality-reviews.json").exists())
        report["lessons"][0]["scores"]["teaching"] = 90
        self.reviews.write_text(json.dumps(report))
        API["publish_quality"](self.root, self.reviews, self.rubric, self.receipts)
        published = json.loads((self.root / "quality-reviews.json").read_text())
        self.assertEqual(published["minimumScore"], 90)
        self.assertEqual(published["lessons"][0]["total"], 90)
        published_gallery = (self.root / "index.html").read_bytes()
        report["lessons"][0]["scores"]["teaching"] = 95
        report["lessons"][0]["blockers"] = ["Unresolved overlap"]
        self.reviews.write_text(json.dumps(report))
        with self.assertRaisesRegex(ValueError, "Unresolved quality blocker"):
            API["publish_quality"](self.root, self.reviews, self.rubric, self.receipts)
        self.assertEqual(published_gallery, (self.root / "index.html").read_bytes())
        report["lessons"][0]["blockers"] = []
        for invalid in (True, -1, 101, 90.5):
            with self.subTest(minimum=invalid), self.assertRaisesRegex(ValueError, "minimum score"):
                report["minimumScore"] = invalid
                self.reviews.write_text(json.dumps(report))
                self.load()


if __name__ == "__main__":
    unittest.main()
