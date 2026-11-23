#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Exercise selected speech-adapter provenance without rendering or packaging movies."""

import hashlib
import json
import math
import runpy
import subprocess
import tempfile
import unittest
import zipfile
from unittest.mock import patch
from pathlib import Path

package_api = runpy.run_path(
    str(Path(__file__).resolve().parents[1] / "package.py")
)
verify_render_sources = package_api["verify_render_sources"]
verify_frame_coverage = package_api["verify_frame_coverage"]
verify_encoded_review = package_api["verify_encoded_review"]
select_lessons = package_api["select_lessons"]
archive_filename = package_api["archive_filename"]
editable_source_files = package_api["editable_source_files"]
manifest_source_files = package_api["manifest_source_files"]
write_manifest_sources = package_api["write_manifest_sources"]
verify_article = package_api["verify_article"]
verify_aggregate_occlusion = package_api["verify_aggregate_occlusion"]
verify_text_ink = package_api["verify_text_ink"]
run_motion_audit = package_api["run_motion_audit"]
verify_motion_audit = package_api["verify_motion_audit"]


class SourceManifestPackageTests(unittest.TestCase):
    def test_non_code_derivatives_and_paper_provenance_are_export_inputs_and_stale_bytes_reject(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-manifest-package-") as temporary:
            repository = Path(temporary)
            records = []
            for name, data in (("videos/films/example/scene.mjs", b"export const value = 1;"),
                               ("videos/assets/example/figure.png", b"image derivative"),
                               ("videos/assets/example/paper.pdf", b"%PDF-original paper"),
                               ("videos/assets/example/provenance.json", b'{"locator":"Figure 2"}')):
                target = repository / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                records.append({"path": name, "sha256": hashlib.sha256(data).hexdigest()})
            receipt = {"sourceManifest": {"version": 1, "kind": "leetllm.production-source", "closure": {"files": records}}}
            self.assertEqual(manifest_source_files(repository, receipt), [repository / item["path"] for item in records])
            inputs = {repository / item["path"]: item["sha256"] for item in records}
            archive = repository / "sources.zip"
            with zipfile.ZipFile(archive, "w") as bundle:
                write_manifest_sources(bundle, repository, inputs)
            with zipfile.ZipFile(archive) as bundle:
                self.assertEqual(set(bundle.namelist()), {item["path"] for item in records})
                for item in records:
                    self.assertEqual(hashlib.sha256(bundle.read(item["path"])).hexdigest(), item["sha256"])
            (repository / records[2]["path"]).write_bytes(b"changed paper")
            with self.assertRaisesRegex(ValueError, "input changed"):
                manifest_source_files(repository, receipt)
            with zipfile.ZipFile(repository / "stale.zip", "w") as bundle, self.assertRaisesRegex(ValueError, "input changed before packaging"):
                write_manifest_sources(bundle, repository, inputs)

    def test_manifest_export_rejects_lexical_and_symlink_escapes(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-manifest-confinement-") as temporary:
            root = Path(temporary)
            repository = root / "repository"
            repository.mkdir()
            outside = root / "outside.pdf"
            outside.write_bytes(b"outside")
            (repository / "linked.pdf").symlink_to(outside)
            for name in ("../outside.pdf", "linked.pdf", str(outside)):
                receipt = {"sourceManifest": {"version": 1, "kind": "leetllm.production-source", "closure": {"files": [
                    {"path": name, "sha256": hashlib.sha256(b"outside").hexdigest()}]}}}
                with self.subTest(name=name), self.assertRaisesRegex(ValueError, "escapes repository"):
                    manifest_source_files(repository, receipt)


class TextInkReceiptTests(unittest.TestCase):
    def test_final_sample_coverage_matches_native_tool_and_rejects_stale_or_failed_evidence(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-text-ink-receipt-") as temporary:
            root = Path(temporary)
            source, folder = root / "videos", root / "delivery"
            (source / "lib").mkdir(parents=True)
            folder.mkdir()
            (source / "audit-text-ink.mjs").write_bytes(b"text CLI")
            helper = source / "lib/text-ink-audit.mjs"
            helper.write_bytes(b"pixel rule")
            timeline = {"fps": 10, "intro": {"id": "intro", "frames": 20, "duration": 2},
                        "scenes": [{"id": "scene", "frames": 40, "duration": 4,
                                    "beats": [{"start": 0, "until": 2}, {"start": 2, "until": 4}]}]}
            receipt = {"id": "example", "sha256": "movie", "fingerprint": "current-source", "width": 1920, "height": 1080}
            (folder / "verification.json").write_text(json.dumps(receipt))
            (folder / "timeline.json").write_text(json.dumps(timeline))
            module = (Path(__file__).resolve().parents[1] / "audit-text-ink.mjs").as_uri()
            script = f"import{{textInkSampleFrames}}from {json.dumps(module)}; const t={json.dumps(timeline)}; console.log(JSON.stringify([t.intro,...t.scenes].map(s=>({{scene:s.id,totalFrames:s.frames,sampleFrames:textInkSampleFrames(s,t.fps),issueFrames:0}}))));"
            scenes = json.loads(subprocess.run(["node", "--input-type=module", "-e", script], check=True, capture_output=True, text=True).stdout)
            for scene in scenes:
                scene["checkedFrames"] = len(scene["sampleFrames"])
                scene["checkedLabels"] = 50
                scene["skippedLabels"] = 0
            digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
            report = {"version": 1, "mode": "sampled-final", "id": "example", "rule": "native-fillText-zero-discernible-ink",
                      "videoSha256": "movie", "sourceFingerprint": "current-source", "timingSource": "measured-final",
                      "toolSha256": hashlib.sha256(b"text CLIpixel rule").hexdigest(),
                      "timelineSha256": digest(folder / "timeline.json"), "receiptSha256": digest(folder / "verification.json"),
                      "width": 1920, "height": 1080, "fps": 10, "totalFrames": 60,
                      "checkedFrames": sum(scene["checkedFrames"] for scene in scenes), "checkedLabels": 100, "skippedLabels": 0,
                      "scenes": scenes, "issueFrames": 0, "issues": [], "passed": True}
            path = folder / "text-ink-audit.json"
            self.assertIsNone(verify_text_ink(folder, receipt, timeline, 60, source))
            with self.assertRaisesRegex(ValueError, "missing"):
                verify_text_ink(folder, receipt, timeline, 60, source, required=True)
            path.write_text(json.dumps(report))
            self.assertEqual(verify_text_ink(folder, receipt, timeline, 60, source, required=True), path)
            for malformed in ([], {**report, "scenes": None}, {**report, "scenes": [None]},
                              {**report, "scenes": [{**scenes[0], "checkedLabels": None}, scenes[1]]}):
                with self.subTest(malformed=malformed), self.assertRaisesRegex(ValueError, "has not passed"):
                    path.write_text(json.dumps(malformed))
                    verify_text_ink(folder, receipt, timeline, 60, source)
            for change in ({"mode": "sampled-author"}, {"passed": False}, {"issues": [{"text": "invisible"}]},
                           {"videoSha256": "old"}, {"sourceFingerprint": "old"}, {"toolSha256": "old"},
                           {"timelineSha256": "old"}, {"receiptSha256": "old"}, {"checkedLabels": True},
                           {"checkedLabels": 99}, {"skippedLabels": 1},
                           {"checkedFrames": report["checkedFrames"] - 1}, {"scenes": scenes[:-1]}):
                with self.subTest(change=change), self.assertRaisesRegex(ValueError, "has not passed"):
                    path.write_text(json.dumps({**report, **change}))
                    verify_text_ink(folder, receipt, timeline, 60, source)
            incomplete = json.loads(json.dumps(report))
            incomplete["scenes"][1]["sampleFrames"].pop()
            incomplete["scenes"][1]["checkedFrames"] -= 1
            incomplete["checkedFrames"] -= 1
            path.write_text(json.dumps(incomplete))
            with self.assertRaisesRegex(ValueError, "has not passed"):
                verify_text_ink(folder, receipt, timeline, 60, source)
            path.write_text(json.dumps(report))
            helper.write_bytes(b"changed pixel rule")
            with self.assertRaisesRegex(ValueError, "has not passed"):
                verify_text_ink(folder, receipt, timeline, 60, source)


class AggregateOcclusionReceiptTests(unittest.TestCase):
    def test_requires_complete_current_movie_and_tool_coverage(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-aggregate-receipt-") as temporary:
            root = Path(temporary)
            source, folder = root / "videos", root / "delivery"
            (source / "lib").mkdir(parents=True)
            folder.mkdir()
            (source / "audit-occlusion.mjs").write_bytes(b"audit CLI")
            helper = source / "lib/aggregate-occlusion.mjs"
            helper.write_bytes(b"aggregate rule")
            receipt = {"id": "example", "sha256": "movie", "fingerprint": "render-sources"}
            report = {
                "version": 1, "mode": "all-frames", "id": "example",
                "rule": "aggregate-later-fill-glyph-occlusion",
                "videoSha256": "movie", "sourceFingerprint": "render-sources",
                "toolSha256": hashlib.sha256(b"audit CLIaggregate rule").hexdigest(),
                "frames": 120, "expectedFrames": 120, "issueFrames": 0,
                "passed": True, "issues": [],
            }
            path = folder / "aggregate-occlusion.json"
            path.write_text(json.dumps(report))
            self.assertEqual(verify_aggregate_occlusion(folder, receipt, 120, source), path)
            for changed in (
                {"mode": "estimated-samples"}, {"frames": 119}, {"expectedFrames": 119},
                {"videoSha256": "previous movie"}, {"sourceFingerprint": "old source"},
                {"issueFrames": 1, "issues": [{"text": "covered label"}]}, {"passed": False},
            ):
                with self.subTest(changed=changed), self.assertRaises(ValueError):
                    path.write_text(json.dumps({**report, **changed}))
                    verify_aggregate_occlusion(folder, receipt, 120, source)
            path.write_text(json.dumps(report))
            helper.write_bytes(b"changed aggregate rule")
            with self.assertRaises(ValueError):
                verify_aggregate_occlusion(folder, receipt, 120, source)


class MotionAuditReceiptTests(unittest.TestCase):
    def fixture(self, root: Path):
        source, folder = root / "videos", root / "delivery" / "example"
        (source / "lib").mkdir(parents=True)
        (source / "lessons").mkdir()
        folder.mkdir(parents=True)
        (source / "audit-motion.mjs").write_bytes(b"motion CLI")
        helper = source / "lib/motion-audit.mjs"
        helper.write_bytes(b"motion pixel rule")
        lesson = source / "lessons/example.lesson.yaml"
        lesson.write_text("lesson source fixture\n")
        movie = folder / "example.mp4"
        movie.write_bytes(b"encoded lesson")
        timeline = {"id": "example", "width": 1920, "height": 1080, "fps": 30, "duration": 4,
                    "scenes": [{"id": "trace", "start": 0, "frames": 120, "duration": 4,
                                "beats": [
                                    {"start": 0, "end": 1, "until": 1.5,
                                     "motion_check": {"region": [100, 100, 200, 100], "minimumChangedFraction": .002}},
                                    {"start": 1.5, "end": 2.5, "until": 3},
                                ]}]}
        timeline_path = folder / "timeline.json"
        timeline_path.write_text(json.dumps(timeline))
        movie_hash = hashlib.sha256(movie.read_bytes()).hexdigest()
        receipt = {"id": "example", "source": "foundations/example/content.md", "fullDecode": "passed",
                   "width": 1920, "height": 1080, "fps": "30/1", "duration": 4, "scenes": 1,
                   "fingerprint": "render-current", "sha256": movie_hash,
                   "frameAudit": {"passed": True, "frames": 120}}
        receipt_path = folder / "verification.json"
        receipt_path.write_text(json.dumps(receipt))
        expected_samples = []
        for progress in (.12, .5, .88):
            requested_time = progress * (1.5 - 0)
            frame = math.floor(requested_time * 30 + .5)
            expected_samples.append({"progress": progress, "requestedTime": requested_time,
                                     "frame": frame, "time": frame / 30})
        area, changed = 20_000, 100
        report = {"version": 1, "id": "example", "mode": "declared-regions-encoded",
                  "rule": "declared-region-pixel-change",
                  "scope": "Pixel change inside an explicitly declared teaching region. This does not verify semantic correctness, causal explanation, meaningful object motion, or aesthetics.",
                  "movieSha256": movie_hash, "videoSha256": movie_hash,
                  "timelineSha256": hashlib.sha256(timeline_path.read_bytes()).hexdigest(),
                  "receiptSha256": hashlib.sha256(receipt_path.read_bytes()).hexdigest(),
                  "lessonSha256": hashlib.sha256(lesson.read_bytes()).hexdigest(),
                  "sourceFingerprint": receipt["fingerprint"],
                  "toolSha256": hashlib.sha256(b"motion CLImotion pixel rule").hexdigest(),
                  "timingSource": "measured-final", "width": 1920, "height": 1080, "fps": 30,
                  "thresholds": {"minimumChannelDelta": 12, "minimumChangedPixels": 32},
                  "sampleProgress": [.12, .5, .88],
                  "coverage": {"narratedBeats": 2, "declaredChecks": 1, "checkedBeats": 1,
                               "fraction": .5, "status": "declared-subset"},
                  "checks": [{"scene": "trace", "sceneIndex": 0, "beat": 0,
                              "region": [100, 100, 200, 100], "minimumChangedFraction": .002,
                              "samples": expected_samples, "passed": True,
                              "pairs": [{"from": left, "to": right, "changedPixels": changed,
                                         "regionPixels": area, "changedFraction": changed / area, "passed": True}
                                        for left, right in ((0, 1), (1, 2), (0, 2))]}],
                  "issues": [], "passed": True}
        report_path = folder / "motion-audit.json"
        report_path.write_text(json.dumps(report))
        return source, folder, timeline, receipt, report, report_path

    def test_current_declared_region_receipt_passes_and_stale_or_failed_evidence_is_rejected(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-motion-receipt-") as temporary:
            source, folder, timeline, receipt, report, path = self.fixture(Path(temporary))
            self.assertEqual(verify_motion_audit(folder, receipt, timeline, 120, source, required=True), path)
            self.assertEqual(verify_motion_audit(folder, receipt, timeline, 120, source), path)
            with self.assertRaisesRegex(ValueError, "missing"):
                path.unlink()
                verify_motion_audit(folder, receipt, timeline, 120, source, required=True)
            self.assertIsNone(verify_motion_audit(folder, receipt, timeline, 120, source))
            source, folder, timeline, receipt, report, path = self.fixture(Path(temporary) / "again")
            for changed in (
                {"passed": False}, {"videoSha256": "old movie"}, {"sourceFingerprint": "old source"},
                {"toolSha256": "old tool"}, {"timelineSha256": "old timeline"},
                {"receiptSha256": "old receipt"}, {"lessonSha256": "old lesson"},
                {"coverage": {**report["coverage"], "checkedBeats": 0}}, {"checks": []},
                {"checks": [{**report["checks"][0], "passed": False}]},
            ):
                with self.subTest(changed=changed), self.assertRaisesRegex(ValueError, "has not passed"):
                    path.write_text(json.dumps({**report, **changed}))
                    verify_motion_audit(folder, receipt, timeline, 120, source, required=True)
            path.write_text(json.dumps(report))
            (source / "lib/motion-audit.mjs").write_bytes(b"changed motion rule")
            with self.assertRaisesRegex(ValueError, "has not passed"):
                verify_motion_audit(folder, receipt, timeline, 120, source, required=True)

    def test_required_motion_rejects_a_current_but_empty_diagnostic(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-motion-coverage-") as temporary:
            source, folder, timeline, receipt, report, path = self.fixture(Path(temporary))
            del timeline["scenes"][0]["beats"][0]["motion_check"]
            (folder / "timeline.json").write_text(json.dumps(timeline))
            report.update(timelineSha256=hashlib.sha256((folder / "timeline.json").read_bytes()).hexdigest(),
                          checks=[], coverage={"narratedBeats": 2, "declaredChecks": 0, "checkedBeats": 0,
                                               "fraction": 0, "status": "none"})
            path.write_text(json.dumps(report))
            self.assertEqual(verify_motion_audit(folder, receipt, timeline, 120, source), path)
            with self.assertRaisesRegex(ValueError, "needs a declared teaching region"):
                verify_motion_audit(folder, receipt, timeline, 120, source, required=True)

    def test_packager_reaudits_native_encoded_regions_through_the_motion_cli(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-motion-cli-") as temporary:
            root = Path(temporary)
            source, directory = root / "videos", root / "delivery"
            source.mkdir(); directory.mkdir()
            with patch.object(package_api["subprocess"], "run") as run:
                run_motion_audit(source, directory, "example")
            run.assert_called_once_with(
                ["node", str(source / "audit-motion.mjs"), "--lesson", "example", "--input", str(directory.resolve())],
                check=True,
            )


class BatchSelectionTests(unittest.TestCase):
    def test_selects_new_catalog_entries_and_preserves_requested_order(self):
        catalog = [{"id": "original"}, {"id": "new-lesson"}]
        self.assertEqual(select_lessons(catalog, None), ["original", "new-lesson"])
        self.assertEqual(select_lessons(catalog, ["new-lesson"]), ["new-lesson"])
        self.assertEqual(select_lessons(catalog, ["new-lesson", "original"]), ["new-lesson", "original"])
        for invalid in ([], ["missing"], ["original", "original"]):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                select_lessons(catalog, invalid)

    def test_editable_archive_includes_registry_restore_policy_and_its_test(self):
        source = Path(__file__).resolve().parents[1]
        included = {
            (Path("videos") / path.relative_to(source)).as_posix()
            for path in editable_source_files(source, [])
        }
        required = {
            "videos/.npmrc",
            "videos/check-npm-release-age.mjs",
            "videos/test/check-npm-release-age.test.mjs",
        }
        self.assertTrue(required.issubset(included), f"Missing editable archive sources: {required - included}")

    def test_extracted_sources_run_review_consumers_and_load_measured_fixtures(self):
        source = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory(prefix="leetllm-editable-export-") as temporary:
            root = Path(temporary)
            archive = root / "editable.zip"
            with zipfile.ZipFile(archive, "w") as bundle:
                for file in editable_source_files(source, []):
                    bundle.write(file, Path("videos") / file.relative_to(source))
            extracted = root / "extracted"
            with zipfile.ZipFile(archive) as bundle:
                bundle.extractall(extracted)
            (extracted / "videos/node_modules").symlink_to(source / "node_modules", target_is_directory=True)
            script = """
                import assert from 'node:assert/strict';
                import {readFile} from 'node:fs/promises';
                import './videos/test/assemble-delivery.test.mjs';
                import {parseArguments} from './videos/prepare-curation-review.mjs';
                import {loadMeasuredTimeline} from './videos/test/helpers/measured-narration.mjs';
                const options = parseArguments(['--input', 'build/render', '--output', 'build/review', '--shards', '2']);
                assert.equal(options.shards, 2);
                const rubric = JSON.parse(await readFile('videos/curation-rubric.json', 'utf8'));
                assert.equal(rubric.dimensions.reduce((sum, dimension) => sum + dimension.maximum, 0), 100);
                const timeline = await loadMeasuredTimeline('model-merging');
                assert(timeline.scenes.some(scene => scene.sounds.some(sound => sound.words.length > 0)));
            """
            result = subprocess.run(["node", "--input-type=module", "-e", script],
                                    cwd=extracted, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_editable_sources_exclude_media_caches_and_dependency_trees(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-source-selection-") as temporary:
            source = Path(temporary)
            included = ("future-tool.mjs", "future-rubric.json", "gallery/template.html", "assets/concepts/LICENSE")
            excluded = ("movie.mp4", "assets/generated.png", "test/__pycache__/module.py",
                        "test/.cache/snapshot.json", "test/build/receipt.json", "lib/node_modules/module/index.mjs")
            for relative in (*included, *excluded):
                file = source / relative
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text("fixture")
            selected = {file.relative_to(source).as_posix() for file in editable_source_files(source, [])}
            self.assertEqual(selected, set(included))

    def test_archive_stays_inside_the_delivery_directory(self):
        self.assertEqual(archive_filename("six-lessons.zip"), "six-lessons.zip")
        for invalid in ("../other.zip", "/tmp/other.zip", "output.mp4", ".zip"):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                archive_filename(invalid)

    def test_each_delivery_binds_its_own_source_even_when_lessons_share_an_article(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-source-binding-") as temporary:
            root = Path(temporary)
            article = root / "web/src/content/example/content.md"
            article.parent.mkdir(parents=True)
            article.write_text("First source revision")
            lesson = {"id": "first", "source": "example/content.md"}
            receipt = {**lesson, "sourceSha256": hashlib.sha256(article.read_bytes()).hexdigest()}
            self.assertEqual(verify_article(root, lesson, receipt), article)
            with self.assertRaisesRegex(ValueError, "does not match"):
                verify_article(root, lesson, {**receipt, "id": "second"})
            article.write_text("A changed source revision")
            current = {"id": "second", "source": lesson["source"]}
            latest = {**current, "sourceSha256": hashlib.sha256(article.read_bytes()).hexdigest()}
            self.assertEqual(verify_article(root, current, latest), article)
            with self.assertRaisesRegex(ValueError, "changed after rendering"):
                verify_article(root, lesson, receipt)


class QualityPublicationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="leetllm-package-quality-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.source = Path(__file__).resolve().parents[1]
        folder = self.root / "example"
        (folder / "encoded-review").mkdir(parents=True)
        (folder / "previews/scenes").mkdir(parents=True)
        payloads = {
            "timeline.json": json.dumps({"scenes": [{"id": "intro"}]}).encode(),
            "frame-gallery.json": json.dumps({"samples": [{"image": "frame.png", "issues": []}]}).encode(),
        }
        names = {
            "timeline.json", "frame-gallery.json", "frame-gallery.html", "contact-sheet.png",
            "frame-audit.json", "layout-review.html", "layout-review.json", "leetllm-intro.mp4",
            "01-intro.png", "frame.png", "previews/scenes/intro.png",
            *(f"example.{suffix}" for suffix in ("mp4", "srt", "vtt", "script.md", "chapters.txt")),
        }
        for name in names:
            (folder / name).write_bytes(payloads.get(name, b"fixture"))
        (folder / "encoded-review/verification.json").write_text(json.dumps({"samples": [], "artifactSha256": {}}))
        digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
        self.receipt = {
            "id": "example", "title": "Example", "source": "unused", "fingerprint": "sources",
            "sha256": digest(folder / "example.mp4"), "fullDecode": "passed",
            "videoEngine": "vizmatic.renderRgbaVideo",
            "videoProfile": {"burnedCaptions": False, "progressIndicator": False},
            "duration": 2, "width": 1920, "height": 1080, "fps": 30, "bytes": 7,
            "artifactSha256": {name: digest(folder / name) for name in names},
        }
        (folder / "verification.json").write_text(json.dumps(self.receipt))
        (self.root / "review.png").write_bytes(b"review image")
        rubric_path = self.source / "quality-rubric.json"
        rubric = json.loads(rubric_path.read_text())
        self.review = {
            "version": 1, "rubricId": rubric["id"], "rubricSha256": digest(rubric_path), "scope": "Fixture review",
            "lessons": [{
                "id": "example", "movieSha256": self.receipt["sha256"], "sourceFingerprint": "sources",
                "scores": {dimension["id"]: dimension["maximum"] for dimension in rubric["dimensions"]},
                "rationale": {dimension["id"]: "Fixture assessment" for dimension in rubric["dimensions"]},
                "strengths": [], "improvements": [], "blockers": [], "fixes": [], "reviewer": "Fixture reviewer",
                "reviewedScenes": ["intro"], "viewedImages": [{"path": "review.png", "sha256": digest(self.root / "review.png")}],
            }],
        }
        self.reviews_path = self.root / "reviews.json"
        self.existing = {"index.html": b"EXISTING REVIEWED GALLERY", "manifest.json": b'[{"id":"previous"}]\n'}
        for name, content in self.existing.items():
            (self.root / name).write_bytes(content)

    def test_rejected_reviews_preserve_existing_gallery_and_manifest(self):
        package = package_api["package"]
        # Separate provenance tests cover these checks; keep real review validation and publication here.
        checks = {
            "verify_article": lambda *args: None,
            "verify_render_sources": lambda *args: self.source / "tts.py",
            "verify_frame_coverage": lambda *args: 1,
            "verify_aggregate_occlusion": lambda *args: self.root / "aggregate-occlusion.json",
            "verify_text_ink": lambda *args: None,
            "verify_motion_audit": lambda *args: None,
            "verify_encoded_review": lambda *args: set(),
        }
        catalog = subprocess.CompletedProcess([], 0, stdout=json.dumps([{"id": "example", "source": "unused"}]))
        for defect, error in (("stale", "Stale quality review"), ("malformed", "Invalid quality score"),
                              ("missing-image", "Review image is missing or changed")):
            with self.subTest(defect=defect):
                review = json.loads(json.dumps(self.review))
                item = review["lessons"][0]
                if defect == "stale":
                    item["movieSha256"] = "old movie"
                elif defect == "malformed":
                    item["scores"]["correctness"] = True
                else:
                    item["viewedImages"][0]["path"] = "missing.png"
                self.reviews_path.write_text(json.dumps(review))
                with patch.dict(package.__globals__, checks), patch.object(subprocess, "run", return_value=catalog):
                    with self.assertRaisesRegex(ValueError, error):
                        package(self.root, ["example"], reviews=self.reviews_path)
                for name, content in self.existing.items():
                    self.assertEqual((self.root / name).read_bytes(), content)
                self.assertFalse((self.root / "quality-reviews.json").exists())


class AdapterProvenanceTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="leetllm-adapter-provenance-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.source = self.root / "videos"
        self.pipeline = (
            "lessons/example.lesson.yaml",
            "animations/example.mjs",
            "render.mjs",
            "lib/scene.mjs",
            "lib/lesson.mjs",
            "lib/narration-cues.mjs",
            "lib/captions.mjs",
            "lib/delivery.mjs",
            "lib/brand.mjs",
            "lib/frame-audit.mjs",
            "lib/layout-review.mjs",
            "assets/leetllm-mark.svg",
            "package-lock.json",
            "lib/concepts.mjs",
            "assets/concepts/manifest.json",
            "assets/concepts/query.svg",
        )
        for relative in (*self.pipeline, "tts.py", "adapters/custom voice.py"):
            path = self.source / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f"original {relative}\n")

    def receipt(self, script):
        fingerprint = hashlib.sha256()
        for relative in self.pipeline:
            fingerprint.update((self.source / relative).read_bytes())
        adapter_bytes = script.read_bytes()
        fingerprint.update(adapter_bytes)
        return {
            "fingerprint": fingerprint.hexdigest(),
            "ttsAdapter": {
                "path": script.relative_to(self.root).as_posix(),
                "sha256": hashlib.sha256(adapter_bytes).hexdigest(),
            },
        }

    def test_source_fingerprint_matches_the_canonical_renderer(self):
        source = Path(__file__).resolve().parents[1]
        repository = source.parent
        lesson_id = "vectors"
        fingerprint_module = (source / "lib/source-fingerprint.mjs").as_uri()
        engine_module = (source / "lib/render-engine.mjs").as_uri()
        script = f"""
            import {{currentSourceFingerprint}} from {json.dumps(fingerprint_module)};
            import {{renderEngineProvenance}} from {json.dumps(engine_module)};
            const [root, id] = process.argv.slice(1);
            const fingerprint = await currentSourceFingerprint(root, id, {{ttsAdapter: {{path: 'videos/tts.py'}}}});
            console.log(JSON.stringify({{fingerprint, renderEngine: renderEngineProvenance()}}));
        """
        receipt = json.loads(subprocess.run(
            ["node", "--input-type=module", "-e", script, str(repository), lesson_id],
            check=True, capture_output=True, text=True,
        ).stdout)
        adapter = source / "tts.py"
        receipt["ttsAdapter"] = {
            "path": "videos/tts.py",
            "sha256": hashlib.sha256(adapter.read_bytes()).hexdigest(),
        }
        self.assertEqual(verify_render_sources(source, lesson_id, receipt), adapter)

    def test_changed_default_and_custom_adapters_reject_old_narration(self):
        for relative in ("tts.py", "adapters/custom voice.py"):
            with self.subTest(adapter=relative):
                script = self.source / relative
                receipt = self.receipt(script)
                self.assertEqual(verify_render_sources(self.source, "example", receipt), script)
                script.write_text("changed synthesis behavior\n")
                with self.assertRaisesRegex(ValueError, "TTS adapter changed after rendering"):
                    verify_render_sources(self.source, "example", receipt)

    def test_custom_adapter_provenance_uses_the_selected_file(self):
        script = self.source / "adapters/custom voice.py"
        receipt = self.receipt(script)
        (self.source / "tts.py").write_text("an unused default adapter changed\n")
        self.assertEqual(verify_render_sources(self.source, "example", receipt), script)

    def test_editing_an_icon_invalidates_the_render_receipt(self):
        script = self.source / "tts.py"
        receipt = self.receipt(script)
        icon = self.source / "assets/concepts/query.svg"
        icon.write_text("changed query geometry")
        with self.assertRaisesRegex(ValueError, "different source code"):
            verify_render_sources(self.source, "example", receipt)

    def test_adapter_bytes_are_also_bound_into_the_canonical_fingerprint(self):
        script = self.source / "tts.py"
        receipt = self.receipt(script)
        script.write_text("changed adapter\n")
        receipt["ttsAdapter"]["sha256"] = hashlib.sha256(script.read_bytes()).hexdigest()
        with self.assertRaisesRegex(ValueError, "different source code"):
            verify_render_sources(self.source, "example", receipt)

    def test_old_receipts_require_adapter_provenance(self):
        receipt = self.receipt(self.source / "tts.py")
        del receipt["ttsAdapter"]
        with self.assertRaisesRegex(TypeError, "TTS adapter provenance is missing"):
            verify_render_sources(self.source, "example", receipt)

    def test_packaging_rejects_external_and_absolute_adapter_paths(self):
        script = self.root / "external.py"
        script.write_text("external adapter\n")
        receipt = self.receipt(self.source / "tts.py")
        for path in ("external.py", "videos/../external.py", str(script), str(self.source / "tts.py")):
            with self.subTest(path=path):
                receipt["ttsAdapter"]["path"] = path
                with self.assertRaisesRegex(ValueError, "TTS adapter inside videos/"):
                    verify_render_sources(self.source, "example", receipt)

    def test_internal_symlink_keeps_its_portable_archive_path(self):
        script = self.source / "adapters/alias.py"
        script.symlink_to(self.source / "tts.py")
        self.assertEqual(verify_render_sources(self.source, "example", self.receipt(script)), script)
        script.unlink()
        external = self.root / "external.py"
        external.write_text("external adapter\n")
        script.symlink_to(external)
        with self.assertRaisesRegex(ValueError, "TTS adapter inside videos/"):
            verify_render_sources(self.source, "example", self.receipt(script))


    def test_changed_logo_or_brand_source_rejects_the_old_render(self):
        for relative in ("assets/leetllm-mark.svg", "lib/brand.mjs", "lib/frame-audit.mjs"):
            with self.subTest(source=relative):
                receipt = self.receipt(self.source / "tts.py")
                (self.source / relative).write_text("changed logo or drawing code\n")
                with self.assertRaisesRegex(ValueError, "different source code"):
                    verify_render_sources(self.source, "example", receipt)


class CompleteDeliveryInspectionTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="leetllm-full-frame-coverage-")
        self.addCleanup(temporary.cleanup)
        self.folder = Path(temporary.name)
        self.timeline = {
            "fps": 10,
            "intro": {"id": "leetllm-intro", "start": 0, "duration": 4, "frames": 40, "fps": 10},
            "scenes": [{"id": "example", "start": 4, "duration": 2, "frames": 20, "beats": [
                {"start": 0.4, "until": 1.1}, {"start": 1.1, "until": 1.7},
            ]}],
        }
        self.receipt = {"brandIntro": {"duration": 4, "frames": 40, "logoSha256": "logo"}, "frameAudit": {"frames": 60, "passed": True}}
        self.layout = {"passed": True, "frames": 60, "expectedFrames": 60, "issueFrames": 0, "scenes": [
            {"scene": scene["id"], "fps": 10, "frames": scene["frames"], "issues": [], "passed": True}
            for scene in [self.timeline["intro"], *self.timeline["scenes"]]
        ]}
        (self.folder / "frame-audit.json").write_text(json.dumps(self.layout))
        decoded = {"passed": True, "frames": 60, "expectedFrames": 60, "metrics": "decoded-frame-metrics.json"}
        self.encoded = {"videoSha256": "movie", "inspectorSha256": "inspector", "decodedFrameAudit": decoded, "samples": [], "sceneSheets": [
            {"scene": scene["id"], "image": f"scenes/{scene['id']}.png"}
            for scene in [self.timeline["intro"], *self.timeline["scenes"]]
        ]}
        samples = {}

        def add(time, scene, phase, beat=None):
            frame = max(0, min(59, math.floor(time * 10 + 0.5)))
            sample = samples.setdefault(frame, {"frame": frame, "time": frame / 10, "image": f"frames/{frame}.png", "targets": []})
            target = {"scene": scene, "phase": phase}
            if beat is not None:
                target["beat"] = beat
            sample["targets"].append(target)

        for scene in [self.timeline["intro"], *self.timeline["scenes"]]:
            add(scene["start"], scene["id"], "start")
            add(scene["start"] + (scene["frames"] - 1) / 10, scene["id"], "end")
            for phase, progress in (("early", 0.12), ("middle", 0.5), ("late", 0.88)):
                if scene is self.timeline["intro"]:
                    add(scene["duration"] * progress, scene["id"], phase)
                else:
                    for beat, timing in enumerate(scene["beats"]):
                        add(scene["start"] + timing["start"] + (timing["until"] - timing["start"]) * progress, scene["id"], phase, beat)
        self.encoded["samples"] = sorted(samples.values(), key=lambda sample: sample["frame"])
        (self.folder / "decoded-frame-metrics.json").write_text(json.dumps([[i, 0, 0, 0] for i in range(60)]))
        (self.folder / "decoded-frame-audit.json").write_text(json.dumps(decoded))

    def test_complete_layout_and_encoded_frame_coverage_pass(self):
        self.assertEqual(verify_frame_coverage(self.folder, self.timeline, self.receipt, "logo"), 60)
        required = verify_encoded_review(self.folder, self.timeline, self.encoded, "movie", 60, "inspector")
        self.assertIn("scenes/leetllm-intro.png", required)
        self.assertIn("decoded-frame-metrics.json", required)

    def test_unbranded_archive_can_be_inspected_but_cannot_be_packaged_for_delivery(self):
        self.timeline.update(opening="lesson", intro=None)
        self.timeline["scenes"][0]["start"] = 0
        self.receipt.update(opening="lesson", brandIntro=None, frameAudit={"frames": 20, "passed": True})
        self.layout.update(frames=20, expectedFrames=20, scenes=self.layout["scenes"][1:])
        (self.folder / "frame-audit.json").write_text(json.dumps(self.layout))
        with self.assertRaisesRegex(ValueError, "four-second logo intro"):
            verify_frame_coverage(self.folder, self.timeline, self.receipt, "logo")
        decoded = self.encoded["decodedFrameAudit"]
        decoded.update(frames=20, expectedFrames=20)
        (self.folder / "decoded-frame-audit.json").write_text(json.dumps(decoded))
        (self.folder / "decoded-frame-metrics.json").write_text(json.dumps([[i, 0, 0, 0] for i in range(20)]))
        self.encoded["samples"] = [s for s in self.encoded["samples"] if s["frame"] >= 40]
        for sample in self.encoded["samples"]:
            sample["frame"] -= 40
            sample["time"] = sample["frame"] / 10
        self.encoded["sceneSheets"] = self.encoded["sceneSheets"][1:]
        required = verify_encoded_review(self.folder, self.timeline, self.encoded, "movie", 20, "inspector")
        self.assertIn("scenes/example.png", required)
        self.assertNotIn("scenes/leetllm-intro.png", required)

    def test_incomplete_layout_scene_is_rejected(self):
        self.layout["scenes"][1]["frames"] = 19
        (self.folder / "frame-audit.json").write_text(json.dumps(self.layout))
        with self.assertRaisesRegex(ValueError, "layout audit is incomplete"):
            verify_frame_coverage(self.folder, self.timeline, self.receipt, "logo")

    def test_logo_receipt_must_match_the_actual_source_logo(self):
        with self.assertRaisesRegex(ValueError, "Logo intro provenance"):
            verify_frame_coverage(self.folder, self.timeline, self.receipt, "changed-logo")

    def test_missing_single_beat_phase_is_rejected(self):
        for sample in self.encoded["samples"]:
            sample["targets"] = [target for target in sample["targets"] if target != {"scene": "example", "phase": "late", "beat": 1}]
        with self.assertRaisesRegex(ValueError, "missing example beat 1 late"):
            verify_encoded_review(self.folder, self.timeline, self.encoded, "movie", 60, "inspector")

    def test_missing_decoded_frame_is_rejected(self):
        (self.folder / "decoded-frame-metrics.json").write_text(json.dumps([[i, 0, 0, 0] for i in range(59)]))
        with self.assertRaisesRegex(ValueError, "metrics skip or duplicate"):
            verify_encoded_review(self.folder, self.timeline, self.encoded, "movie", 60, "inspector")

    def test_changed_inspector_requires_a_fresh_encoded_review(self):
        with self.assertRaisesRegex(ValueError, "different inspection code"):
            verify_encoded_review(self.folder, self.timeline, self.encoded, "movie", 60, "changed-inspector")

    def test_multiple_diagnostic_targets_preserve_required_beat_coverage(self):
        narrative = [sample for sample in self.encoded["samples"] if sample["frame"] >= 40]
        for phase in ("change-peak", "long-hold"):
            with self.subTest(phase=phase):
                for sample in narrative[:2]:
                    sample["targets"].append({"scene": "example", "phase": phase})
                verify_encoded_review(self.folder, self.timeline, self.encoded, "movie", 60, "inspector")

    def test_required_sample_roles_still_reject_contradictory_frames(self):
        narrative = [sample for sample in self.encoded["samples"] if sample["frame"] >= 40]
        narrative[1]["targets"].append({"scene": "example", "phase": "start"})
        with self.assertRaisesRegex(ValueError, "contradictory sample roles"):
            verify_encoded_review(self.folder, self.timeline, self.encoded, "movie", 60, "inspector")

    def test_javascript_inspector_matches_package_sampling_and_preserves_transition_diagnostics(self):
        module = (Path(__file__).resolve().parents[1] / "inspect.mjs").as_uri()
        script = f"""
            import {{ inspectionTargets, DecodedFrameAudit }} from {json.dumps(module)};
            const timeline = {json.dumps(self.timeline)};
            const audit = new DecodedFrameAudit(timeline, 32, 18);
            for(let frame = 0; frame < 60; frame++) audit.observe(Buffer.alloc(32*18, frame === 41 ? 100 : 20));
            const summary = audit.finish();
            const incomplete = new DecodedFrameAudit(timeline, 32, 18);
            let rejected = false;
            try {{ incomplete.finish(); }} catch {{ rejected = true; }}
            console.log(JSON.stringify({{samples: inspectionTargets(timeline), summary, rejected}}));
        """
        output = json.loads(subprocess.run(["node", "--input-type=module", "-e", script], check=True, capture_output=True, text=True).stdout)
        expected = [{key: sample[key] for key in ("frame", "time", "targets")} for sample in self.encoded["samples"]]
        for sample in expected:
            sample["targets"].sort(key=lambda target: json.dumps(target, sort_keys=True))
        for sample in output["samples"]:
            sample["targets"].sort(key=lambda target: json.dumps(target, sort_keys=True))
        self.assertEqual(output["samples"], expected)
        self.assertTrue(output["rejected"])
        self.assertEqual(output["summary"]["frames"], 60)
        self.assertTrue(output["summary"]["decodePassed"])
        self.assertFalse(output["summary"]["passed"])
        self.assertTrue(output["summary"]["unexplainedBlankRuns"])
        self.assertTrue(any(peak["knownTransitions"] for peak in output["summary"]["peakChanges"]))


if __name__ == "__main__":
    unittest.main()
