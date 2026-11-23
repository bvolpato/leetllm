#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "audit_quiz_cues", Path(__file__).resolve().parents[1] / "audit-quiz-cues.py"
)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class ExplicitQuizScopeTest(unittest.TestCase):
    def test_unknown_requested_slug_cannot_silently_leave_a_partial_audit(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-quiz-cues-") as directory:
            root = Path(directory)
            article = root / "core" / "known" / "content.md"
            article.parent.mkdir(parents=True)
            article.write_text("```mastery-quiz\n" + json.dumps([
                {"options": ["1", "2", "3", "4"], "answer": "2"}
            ]) + "\n```\n")
            output, error = io.StringIO(), io.StringIO()
            with patch.object(audit, "ROOT", root), patch.object(
                sys, "argv", ["audit-quiz-cues.py", "known", "lesson-id"]
            ), redirect_stdout(output), redirect_stderr(error):
                self.assertEqual(audit.main(), 2)
            self.assertIn("lesson-id", error.getvalue())
            self.assertNotIn("overall", output.getvalue())

    def test_requested_article_without_a_quiz_is_an_explicit_failure(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-quiz-cues-") as directory:
            root = Path(directory)
            article = root / "core" / "no-quiz" / "content.md"
            article.parent.mkdir(parents=True)
            article.write_text("A lesson with no mastery quiz.\n")
            error = io.StringIO()
            with patch.object(audit, "ROOT", root), patch.object(
                sys, "argv", ["audit-quiz-cues.py", "no-quiz"]
            ), redirect_stderr(error):
                self.assertEqual(audit.main(), 2)
            self.assertIn("no-quiz", error.getvalue())


if __name__ == "__main__":
    unittest.main()
