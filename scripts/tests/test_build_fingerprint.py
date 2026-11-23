#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

import importlib.util
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "build_fingerprint", Path(__file__).resolve().parents[1] / "build-fingerprint.py"
)
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)
BASE = "node:22-alpine@sha256:" + "a" * 64


class BuildFingerprintTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "source"
        self.root.mkdir()
        self.files = [
            "Dockerfile",
            "web/pnpm-lock.yaml",
            "web/src/page.tsx",
            "web/illustrations/_generated/plot.png",
        ]
        for name in self.files:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(name.encode())

    def fingerprints(self, files=None, base=BASE, snapshot=None):
        return build.fingerprint(self.root, files or self.files, base, snapshot)

    def test_order_mtime_and_excluded_work_do_not_change_identity(self):
        before = self.fingerprints()
        os.utime(self.root / self.files[0], (1, 1))
        (self.root / "video-not-uploaded.mp4").write_bytes(b"unrelated work")
        self.assertEqual(before, self.fingerprints(list(reversed(self.files))))

    def test_source_and_rendered_asset_changes_require_new_image_but_reuse_toolchain_cache(
        self,
    ):
        for name in ("web/src/page.tsx", "web/illustrations/_generated/plot.png"):
            before, cache_before = self.fingerprints()
            (self.root / name).write_bytes(b"changed input")
            after, cache_after = self.fingerprints()
            self.assertNotEqual(before, after)
            self.assertEqual(cache_before, cache_after)

    def test_lockfile_and_base_changes_invalidate_both_keys(self):
        before = self.fingerprints()
        (self.root / "web/pnpm-lock.yaml").write_bytes(b"new dependency")
        after = self.fingerprints()
        self.assertTrue(all(a != b for a, b in zip(before, after)))
        updated_base = self.fingerprints(base=BASE.replace("a" * 64, "b" * 64))
        self.assertTrue(all(a != b for a, b in zip(after, updated_base)))

    def test_removed_inputs_and_executable_permissions_invalidate_identity(self):
        before = self.fingerprints()
        self.assertNotEqual(before[0], self.fingerprints(self.files[:-1])[0])
        (self.root / "web/src/page.tsx").chmod(0o755)
        self.assertNotEqual(before[0], self.fingerprints()[0])

    def test_snapshot_matches_fingerprinted_bytes_and_is_isolated_from_later_edits(
        self,
    ):
        snapshot = Path(self.temp.name) / "snapshot"
        before = self.fingerprints(snapshot=snapshot)
        self.assertEqual(before, build.fingerprint(snapshot, self.files, BASE))
        (self.root / "web/src/page.tsx").write_bytes(b"concurrent edit")
        self.assertEqual(before, build.fingerprint(snapshot, self.files, BASE))
        self.assertNotEqual(before, self.fingerprints())

    def test_rejects_paths_and_links_outside_the_build_root(self):
        outside = Path(self.temp.name) / "outside.txt"
        outside.write_text("outside source")
        (self.root / "link").symlink_to(outside)
        for name in ("../outside.txt", str(outside), "link"):
            with self.assertRaises(ValueError):
                self.fingerprints([name])

    @patch.object(build.subprocess, "run")
    def test_resolves_base_image_digest_and_rejects_non_digest_output(self, run):
        run.return_value = subprocess.CompletedProcess(
            [], 0, '"sha256:' + "a" * 64 + '"\n', ""
        )
        self.assertEqual(BASE, build.resolve_base_image(self.root, "node:22-alpine"))
        run.return_value = subprocess.CompletedProcess([], 0, '"invalid"', "")
        with self.assertRaises(ValueError):
            build.resolve_base_image(self.root, "node:22-alpine")

    @patch.object(build.subprocess, "run")
    def test_only_missing_image_is_a_cache_miss(self, run):
        run.return_value = subprocess.CompletedProcess(
            [], 1, "", "NOT_FOUND: image not found"
        )
        self.assertEqual("-", build.existing_image("repo/app", "abc", "project"))
        run.return_value = subprocess.CompletedProcess(
            [],
            1,
            "",
            "ERROR: (gcloud.artifacts.docker.images.describe) Image not found.\n",
        )
        self.assertEqual("-", build.existing_image("repo/app", "abc", "project"))
        for error in (
            "PERMISSION_DENIED: forbidden",
            "ERROR: (gcloud.artifacts.docker.images.describe) HTTPError 403: forbidden",
            "ERROR: (gcloud.artifacts.docker.images.describe) PERMISSION_DENIED: NOT_FOUND detail",
        ):
            run.return_value = subprocess.CompletedProcess([], 1, "", error)
            with self.subTest(error=error), self.assertRaises(RuntimeError):
                build.existing_image("repo/app", "abc", "project")
        run.side_effect = subprocess.TimeoutExpired("gcloud", 90)
        with self.assertRaises(subprocess.TimeoutExpired):
            build.existing_image("repo/app", "abc", "project")

    @patch.object(build.subprocess, "run")
    def test_reuses_digest_and_rejects_malformed_registry_response(self, run):
        run.return_value = subprocess.CompletedProcess(
            [], 0, "sha256:" + "c" * 64 + "\n", ""
        )
        self.assertEqual(
            "sha256:" + "c" * 64, build.existing_image("repo/app", "abc", "project")
        )
        run.return_value = subprocess.CompletedProcess([], 0, "", "")
        with self.assertRaises(ValueError):
            build.existing_image("repo/app", "abc", "project")


if __name__ == "__main__":
    unittest.main()
