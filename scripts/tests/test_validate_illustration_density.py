from __future__ import annotations

import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

SCRIPT_PATH = SCRIPTS_DIR / "validate-illustration-density.py"
SPEC = importlib.util.spec_from_file_location("validate_illustration_density", SCRIPT_PATH)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _write_article(
    content_root: Path,
    rel_path: str,
    body: str,
    *,
    hidden: bool = False,
) -> Path:
    article_dir = content_root / rel_path
    article_dir.mkdir(parents=True, exist_ok=True)
    metadata = {
        "title": "Test Lesson",
        "shortDescription": "Concise lesson summary.",
        "hidden": hidden,
    }
    text = f"---\n{json.dumps(metadata, indent=2)}\n---\n\n{body}\n"
    (article_dir / "content.md").write_text(text, encoding="utf-8")
    return article_dir


class ValidateIllustrationDensityTests(unittest.TestCase):
    """Unit tests for embedded and standalone illustration density checks."""

    def test_standalone_vertical_tower_caught_and_parts_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            content_root = root / "web" / "src" / "content"
            article_dir = _write_article(content_root, "foundations/sample-lesson", "Clean prose.")
            illus_dir = article_dir / "illustrations"
            illus_dir.mkdir(parents=True, exist_ok=True)

            # Oversized vertical receipt tower with TypeScript type annotations.
            (illus_dir / "tower.tsx").write_text(
                "\n".join(
                    [
                        "export const width: number = 500",
                        "export const height: number = 760",
                        "export const alt = 'Vertical diagram'",
                    ]
                ),
                encoding="utf-8",
            )
            # Clean illustration should not fail.
            (illus_dir / "compact.tsx").write_text(
                "export const width = 680\nexport const height = 420\n",
                encoding="utf-8",
            )
            # Excluded directories must not be flagged even if huge.
            for subdir in ("_parts", "_generated"):
                d = illus_dir / subdir
                d.mkdir(parents=True, exist_ok=True)
                (d / "helper.tsx").write_text(
                    "export const width = 300\nexport const height = 2400\n",
                    encoding="utf-8",
                )

            with patch.object(MODULE, "CONTENT_DIR", content_root), patch.object(MODULE, "REPO_ROOT", root):
                issues = MODULE.collect_issues()

            self.assertEqual([issue.key for issue in issues], ["foundations/sample-lesson/tower"])
            self.assertEqual(issues[0].path, illus_dir / "tower.tsx")
            self.assertIn("aspect ratio 1.52 > 1.40", issues[0].signals)

    def test_height_over_900_flagged_even_with_square_aspect_ratio(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            content_root = root / "web" / "src" / "content"
            article_dir = _write_article(content_root, "agents/tall-canvas", "Body.")
            illus_dir = article_dir / "illustrations"
            illus_dir.mkdir(parents=True, exist_ok=True)
            (illus_dir / "tall.tsx").write_text(
                "export const width = 900\nexport const height = 950\n",
                encoding="utf-8",
            )

            with patch.object(MODULE, "CONTENT_DIR", content_root), patch.object(MODULE, "REPO_ROOT", root):
                issues = MODULE.collect_issues()

            self.assertEqual(len(issues), 1)
            self.assertIn("height 950 > 900", issues[0].signals)

    def test_embedded_fence_and_standalone_deduplication(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            content_root = root / "web" / "src" / "content"
            embedded_only = (
                "```tsx render=illustration name=\"embedded_tall\"\n"
                "export const width = 500\n"
                "export const height = 750\n"
                "```\n\n"
                "```tsx render=illustration name=\"shared_diagram\"\n"
                "export const width = 400\n"
                "export const height = 950\n"
                "```\n"
            )
            article_dir = _write_article(content_root, "retrieval/dedup-lesson", embedded_only)
            illus_dir = article_dir / "illustrations"
            illus_dir.mkdir(parents=True, exist_ok=True)
            # Standalone file matching embedded name is deduplicated, while unique standalone is scanned.
            (illus_dir / "shared_diagram.tsx").write_text(
                "export const width = 520\nexport const height = 800\n",
                encoding="utf-8",
            )
            (illus_dir / "standalone_tall.tsx").write_text(
                "export const width = 520\nexport const height = 800\n",
                encoding="utf-8",
            )

            with patch.object(MODULE, "CONTENT_DIR", content_root), patch.object(MODULE, "REPO_ROOT", root):
                issues = MODULE.collect_issues()

            keys = [issue.key for issue in issues]
            self.assertEqual(len(keys), 3)
            self.assertEqual(keys.count("retrieval/dedup-lesson/shared_diagram"), 1)
            self.assertEqual(
                sorted(keys),
                [
                    "retrieval/dedup-lesson/embedded_tall",
                    "retrieval/dedup-lesson/shared_diagram",
                    "retrieval/dedup-lesson/standalone_tall",
                ],
            )
            by_key = {issue.key: issue for issue in issues}
            self.assertEqual(by_key["retrieval/dedup-lesson/embedded_tall"].path, article_dir / "content.md")
            self.assertGreater(by_key["retrieval/dedup-lesson/embedded_tall"].line, 1)
            # Embedded fence comes first in _iter_bundle_illustrations (matching text_report()).
            self.assertEqual(by_key["retrieval/dedup-lesson/shared_diagram"].path, article_dir / "content.md")
            self.assertEqual(by_key["retrieval/dedup-lesson/standalone_tall"].path, illus_dir / "standalone_tall.tsx")
            self.assertEqual(by_key["retrieval/dedup-lesson/standalone_tall"].line, 1)

    def test_path_filter_and_cli_exit_codes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            content_root = root / "web" / "src" / "content"
            dir_a = _write_article(content_root, "sec-a/bad-standalone", "Text.")
            (dir_a / "illustrations").mkdir()
            (dir_a / "illustrations" / "chart.tsx").write_text(
                "export const width = 400\nexport const height = 700\n",
                encoding="utf-8",
            )
            _write_article(
                content_root,
                "sec-b/bad-embedded",
                "```tsx render=illustration name=\"emb\"\nexport const width = 400\nexport const height = 700\n```\n",
            )
            dir_c = _write_article(content_root, "sec-c/clean-lesson", "Text.")
            (dir_c / "illustrations").mkdir()
            (dir_c / "illustrations" / "ok.tsx").write_text(
                "export const width = 680\nexport const height = 420\n",
                encoding="utf-8",
            )

            with patch.object(MODULE, "CONTENT_DIR", content_root), patch.object(MODULE, "REPO_ROOT", root):
                only_a = MODULE.collect_issues(article_path="sec-a/bad-standalone")
                self.assertEqual([i.key for i in only_a], ["sec-a/bad-standalone/chart"])

                only_b = MODULE.collect_issues(article_path="sec-b/bad-embedded")
                self.assertEqual([i.key for i in only_b], ["sec-b/bad-embedded/emb"])

                buf = io.StringIO()
                with (
                    patch.object(sys, "argv", ["validate-illustration-density.py", "--path", "sec-a/bad-standalone"]),
                    contextlib.redirect_stdout(buf),
                ):
                    self.assertEqual(MODULE.main(), 1)
                self.assertIn("sec-a/bad-standalone/chart", buf.getvalue())

                buf_clean = io.StringIO()
                with (
                    patch.object(sys, "argv", ["validate-illustration-density.py", "--path", "sec-c/clean-lesson"]),
                    contextlib.redirect_stdout(buf_clean),
                ):
                    self.assertEqual(MODULE.main(), 0)
                self.assertIn("OK illustration density for sec-c/clean-lesson", buf_clean.getvalue())

                buf_invalid = io.StringIO()
                with (
                    patch.object(sys, "argv", ["validate-illustration-density.py", "--path", "missing"]),
                    contextlib.redirect_stdout(buf_invalid),
                ):
                    self.assertEqual(MODULE.main(), 1)

    def test_strict_text_and_text_report_and_non_article_exclusion(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            content_root = root / "web" / "src" / "content"
            article_dir = _write_article(content_root, "training/prose-heavy", "Text.")
            illus_dir = article_dir / "illustrations"
            illus_dir.mkdir(parents=True, exist_ok=True)
            long_caption = " ".join(["word"] * 28)
            (illus_dir / "wordy.tsx").write_text(
                f"export const width = 720\nexport const height = 400\nconst label = '{long_caption}'\n",
                encoding="utf-8",
            )
            # Bundles in glossary/practice must be skipped by collect_issues.
            practice_dir = _write_article(content_root, "practice/ignored-practice", "Text.")
            (practice_dir / "illustrations").mkdir()
            (practice_dir / "illustrations" / "tall.tsx").write_text(
                "export const width = 300\nexport const height = 999\n",
                encoding="utf-8",
            )

            with patch.object(MODULE, "CONTENT_DIR", content_root), patch.object(MODULE, "REPO_ROOT", root):
                normal_issues = MODULE.collect_issues(strict_text=False)
                self.assertEqual(normal_issues, [])

                strict_issues = MODULE.collect_issues(strict_text=True)
                self.assertEqual([i.key for i in strict_issues], ["training/prose-heavy/wordy"])
                self.assertTrue(
                    any(sig.startswith("longest text item 28 words > 24") for sig in strict_issues[0].signals)
                )

                buf = io.StringIO()
                with (
                    patch.object(sys, "argv", ["validate-illustration-density.py", "--text-report"]),
                    contextlib.redirect_stdout(buf),
                ):
                    self.assertEqual(MODULE.main(), 0)
                self.assertIn("training/prose-heavy/wordy", buf.getvalue())

    def test_repository_illustrations_pass_strict_text(self) -> None:
        issues = MODULE.collect_issues(strict_text=True)
        self.assertEqual(
            issues,
            [],
            f"Expected zero --strict-text illustration density issues, got: {[i.key for i in issues]}",
        )


if __name__ == "__main__":
    unittest.main()
