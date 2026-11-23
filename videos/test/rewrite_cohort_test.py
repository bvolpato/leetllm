import importlib.util
import json
import contextlib
import io
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch


spec = importlib.util.spec_from_file_location(
    "rewrite_cohort", Path(__file__).resolve().parents[1] / "tools/rewrite-cohort.py")
cohort = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cohort)


class RewriteCohortTest(unittest.TestCase):
    def test_stale_reviewed_scene_is_rejected_even_with_a_current_script(self):
        lesson = "example"
        narration = "videos/lessons/example.lesson.yaml"
        scene = "videos/films/example/scenes/closing.mjs"
        manifest = {
            "lessonFile": narration, "moduleFile": "videos/animations/example.mjs",
            "fingerprint": "d" * 64,
            "closure": {"files": [{"path": narration, "sha256": "a" * 64},
                                  {"path": scene, "sha256": "b" * 64},
                                  {"path": "videos/animations/example.mjs", "sha256": "e" * 64}]},
        }
        reviews = {lesson: {"editorThread": "editor", "reviewerThread": "viewer",
                            "sourceFingerprint": "d" * 64,
                            "files": {narration: "a" * 64, scene: "c" * 64,
                                      "videos/animations/example.mjs": "e" * 64}}}
        manifest["closure"]["files"].append({"path": "adapter.py", "sha256": "f" * 64})
        profile = {name: "fixture" for name in cohort.NARRATOR_FIELDS}
        profile["ttsScript"] = "adapter.py"
        with patch.object(cohort.subprocess, "check_output", return_value=json.dumps(manifest)), \
                patch.object(cohort, "read", return_value=profile):
            with self.assertRaisesRegex(ValueError, "stale review"):
                cohort.inspect_source((lesson, "canvas"), {"canvas": Path.cwd()}, reviews)
            reviews[lesson]["files"][scene] = "b" * 64
            self.assertEqual(cohort.inspect_source((lesson, "canvas"), {"canvas": Path.cwd()}, reviews)
                             ["fingerprint"], "d" * 64)

    def test_editor_submission_binds_both_fingerprints_across_only_a_renderer_change(self):
        import copy
        lesson = "example"
        narration = "videos/lessons/example.lesson.yaml"
        picture = "videos/animations/example.mjs"
        renderer = "videos/render.mjs"
        original = {"lessonFile": narration, "moduleFile": picture, "fingerprint": "old",
                    "renderEngine": {"runtimeSha256": "engine"},
                    "closure": {"fingerprint": "old-closure", "files": [
                        {"path": narration, "sha256": "script"}, {"path": picture, "sha256": "picture"},
                        {"path": renderer, "bytes": 20, "sha256": "previous-renderer"},
                        {"path": "adapter.py", "sha256": "voice"}]}}
        actual = copy.deepcopy(original)
        actual["fingerprint"] = "new"
        actual["closure"]["fingerprint"] = "new-closure"
        actual["closure"]["files"][2].update(bytes=24, sha256=cohort.digest(cohort.ROOT / renderer))
        review = {"id": lesson, "editorThread": "editor", "sourceFingerprint": "old",
                  "files": {narration: "script", picture: "picture"}}
        profile = {name: "fixture" for name in cohort.NARRATOR_FIELDS}
        profile["ttsScript"] = "adapter.py"
        with tempfile.TemporaryDirectory() as temp:
            ledger = Path(temp) / "live.json"
            original_root, technical_root = Path("original"), Path("technical")
            ledger.write_text(json.dumps({"lessons": [review]}))
            def manifest(command, cwd):
                return json.dumps(original if cwd == original_root else actual)
            read = cohort.read
            with patch.object(cohort.subprocess, "check_output", side_effect=manifest), \
                    patch.object(cohort, "read", side_effect=lambda p: read(p) if p == ledger else profile):
                def freeze():
                    return cohort.freeze_lesson((lesson, "canvas"), 8, {"canvas": technical_root},
                                                ledger, editor_submission=True, submitted_root=original_root)
                frozen = freeze()
                self.assertEqual(frozen["lessons"][0]["editorFingerprint"], "old")
                self.assertEqual(frozen["lessons"][0]["fingerprint"], "new")
                self.assertEqual(frozen["submissionSha256"], cohort.json_digest(review))
                with self.assertRaisesRegex(ValueError, "independent review"):
                    cohort.freeze_lesson((lesson, "canvas"), 8, {"canvas": technical_root}, ledger)
                actual["renderEngine"]["runtimeSha256"] = "changed"
                with self.assertRaisesRegex(ValueError, "beyond the delivery renderer"):
                    freeze()
                # Current-runtime delivery proves the authored bytes with the original receipt.
                review["sourceFingerprint"] = "e" * 64
                receipt = Path(temp) / "submission.json"
                receipt.write_text(json.dumps({**review, "lesson": narration, "module": picture}))
                review.update(submissionFile=str(receipt), submissionSha256=cohort.digest(receipt))
                ledger.write_text(json.dumps({"lessons": [review]}))
                def current():
                    return cohort.freeze_lesson((lesson, "canvas"), 8, {"canvas": technical_root},
                                                ledger, editor_submission=True)
                current_freeze = current()
                self.assertEqual(current_freeze["lessons"][0]["editorFingerprint"], "e" * 64)
                self.assertEqual(current_freeze["lessons"][0]["fingerprint"], "new")
                actual["fingerprint"] = "changed-after-freeze"
                self.assertNotEqual(current_freeze, current())
                receipt.write_text("{}")
                with self.assertRaisesRegex(ValueError, "editor receipt has changed"):
                    current()
                review["editorThread"] = " "
                ledger.write_text(json.dumps({"lessons": [review]}))
                with self.assertRaisesRegex(ValueError, "missing source editor"):
                    freeze()

    def test_stage_submission_binds_reachable_canvas_source_for_the_same_film(self):
        lesson, picture = "videos/stage-lessons/example.lesson.yaml", "videos/stage-lessons/example.film.mjs"
        heads = "videos/films/example/stages/heads.mjs"
        foreign = "videos/films/elsewhere/index.mjs"
        owned = {lesson: "narration", picture: "picture"}
        inputs = {**owned, heads: "heads", foreign: "other", "adapter.py": "voice",
                  "videos/render.mjs": cohort.digest(cohort.ROOT / "videos/render.mjs")}
        manifest = {"fingerprint": "original", "lessonFile": lesson, "moduleFile": picture,
                    "closure": {"files": [{"path": k, "sha256": v} for k, v in inputs.items()]}}
        review = {"editorThread": "editor", "sourceFingerprint": "original", "files": dict(owned)}
        profile = {name: "fixture" for name in cohort.NARRATOR_FIELDS}
        profile["ttsScript"] = "adapter.py"
        with patch.object(cohort.subprocess, "check_output", side_effect=lambda *a, **kw: json.dumps(manifest)), \
                patch.object(cohort, "read", return_value=profile):
            def check():
                return cohort.inspect_source(("example", "stage"), {"stage": Path.cwd()}, {"example": review},
                                             editor_submission=True)
            check()
            manifest["fingerprint"] = "changed"
            with self.assertRaisesRegex(ValueError, "incomplete production"):
                check()
            manifest["fingerprint"] = "original"
            review["files"][heads] = "heads"
            check()
            for path, value in ((heads, "wrong"), (foreign, "other"), ("videos/films/example/unused.mjs", "extra")):
                with self.subTest(path=path):
                    with patch.dict(review["files"], {path: value}):
                        with self.assertRaisesRegex(ValueError, "incomplete production"):
                            check()

    def test_existing_movies_cannot_be_claimed_as_a_new_generation(self):
        with tempfile.TemporaryDirectory() as tmp:
            flat = Path(tmp) / "baseline"
            flat.mkdir()
            film = flat / "001-old.mp4"
            film.write_bytes(b"previous edition")
            with self.assertRaisesRegex(ValueError, "empty flat directory"):
                cohort.deliver({"version": 1, "lessons": []}, {}, flat)
            self.assertEqual(film.read_bytes(), b"previous edition")

    def test_later_worker_can_finish_first_and_publication_is_ordered(self):
        with tempfile.TemporaryDirectory() as tmp:
            flat = Path(tmp) / "review"
            second_ready = threading.Event()
            films = [{"id": lesson} for lesson in ["first", "second"]]

            def fake_render(film, roots, workspace):
                path = workspace / f"{film['id']}.mp4"
                path.write_bytes(film["id"].encode())
                if film["id"] == "second":
                    self.assertEqual(list(flat.iterdir()), [])
                    second_ready.set()
                else:
                    self.assertTrue(second_ready.wait(2))
                return path

            with patch.object(cohort, "render_one", side_effect=fake_render):
                with contextlib.redirect_stdout(io.StringIO()) as published:
                    cohort.deliver({"version": 1, "lessons": films}, {}, flat)
            names = [Path(line).name for line in published.getvalue().splitlines()]
            self.assertEqual(names, ["001-first.mp4", "002-second.mp4"])

    def test_one_film_keeps_its_number_and_supports_independent_revisions(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            flat, ledger = directory / "flat", directory / "reviews.json"
            row = ("second", "canvas")
            review = {"id": "second", "cut": "first"}
            ledger.write_text(json.dumps({"lessons": [review]}))
            film = {"id": "second", "mode": "canvas", "fingerprint": "source"}
            with patch.object(cohort, "inspect_source", return_value=film):
                first = cohort.freeze_lesson(row, 2, {}, ledger)
                accelerated = cohort.freeze_lesson(row, 2, {}, ledger, h264_encoder="videotoolbox")
                self.assertNotEqual(accelerated["generation"], first["generation"])
                self.assertEqual(accelerated["settings"][-2:], ["--h264-encoder", "videotoolbox"])
                self.assertEqual(accelerated["lessons"][0]["requestedH264Encoder"], "videotoolbox")
                ledger.write_text(json.dumps({"lessons": [{"id": "other"}, review]}))
                self.assertEqual(first, cohort.freeze_lesson(row, 2, {}, ledger))

            def build(film, roots, workspace, *, speech_cache):
                result = workspace / "masters" / film["id"] / "second.mp4"
                if not result.exists():
                    result.parent.mkdir(parents=True)
                    result.write_bytes(workspace.name.encode())
                    result.with_name("review-copy.json").write_text(json.dumps({"sha256": cohort.digest(result)}))
                return result

            with patch.object(cohort, "render_one", side_effect=build), contextlib.redirect_stdout(io.StringIO()):
                cohort.deliver_lesson(first, {}, flat, ledger)
                target = flat / "002-second.mp4"
                first_inode = target.stat().st_ino
                cohort.deliver_lesson(first, {}, flat, ledger)
                self.assertEqual(target.stat().st_ino, first_inode)
                review["cut"] = "revision"
                ledger.write_text(json.dumps({"lessons": [review]}))
                with self.assertRaisesRegex(ValueError, "review changed"):
                    cohort.deliver_lesson(first, {}, flat, ledger)
                with patch.object(cohort, "inspect_source", return_value=film):
                    second = cohort.freeze_lesson(row, 2, {}, ledger)
                cohort.deliver_lesson(second, {}, flat, ledger)
                self.assertNotEqual(first_inode, target.stat().st_ino)
                editions = directory / ".flat-rewrite" / "editions" / "002-second"
                self.assertEqual((editions / first["generation"] / "masters/second/second.mp4").stat().st_ino,
                                 first_inode)
                self.assertEqual(json.loads((editions / "published.json").read_text())["generation"],
                                 second["generation"])
                target.unlink()
                target.write_bytes(b"foreign")
                with self.assertRaisesRegex(ValueError, "unrelated"):
                    cohort.deliver_lesson(second, {}, flat, ledger)
                self.assertEqual(target.read_bytes(), b"foreign")

    def test_retry_preserves_rejected_private_master_and_isolates_render_outputs(self):
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            master = workspace / "masters/example"
            master.mkdir(parents=True)
            (master / "example.mp4").write_bytes(b"incomplete")
            attempts = []

            def interrupted(command, **kwargs):
                attempts.append(Path(command[command.index("--output") + 1]))
                raise InterruptedError("test interrupted the renderer")

            with patch.object(cohort.subprocess, "run", side_effect=interrupted):
                for _ in range(2):
                    with self.assertRaises(InterruptedError):
                        cohort.render_one({"id": "example", "mode": "canvas"}, {"canvas": workspace}, workspace)
            self.assertNotEqual(*attempts)
            rejected, = workspace.glob("rejected-master-*/example/example.mp4")
            self.assertEqual(rejected.read_bytes(), b"incomplete")

    def test_invalid_master_with_visible_hardlink_is_preserved(self):
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            master = workspace / "masters/example/example.mp4"
            master.parent.mkdir(parents=True)
            master.write_bytes(b"visible")
            public = workspace / "001-example.mp4"
            public.hardlink_to(master)
            with self.assertRaisesRegex(ValueError, "linked master"):
                cohort.render_one({"id": "example", "mode": "canvas"}, {"canvas": workspace}, workspace)
            self.assertTrue(master.samefile(public))
            self.assertEqual(public.read_bytes(), b"visible")

    def test_rendered_receipt_must_match_the_frozen_dependencies(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            (directory / "example.mp4").write_bytes(b"fixture")
            receipt = {"id": "example", "sourceManifest": {"fingerprint": "previous"},
                       "fullDecode": "passed", "frameAudit": {"passed": True},
                       "fps": "30/1", "width": 1920, "height": 1080, "audioCodec": "aac",
                       "sha256": cohort.digest(directory / "example.mp4")}
            (directory / "verification.json").write_text(json.dumps(receipt))
            with self.assertRaisesRegex(ValueError, "encoder selection"):
                cohort.checked_master({"id": "example", "requestedH264Encoder": "videotoolbox"}, directory)
            with self.assertRaisesRegex(ValueError, "does not match"):
                cohort.checked_master({"id": "example", "fingerprint": "current"}, directory)


if __name__ == "__main__":
    unittest.main()
