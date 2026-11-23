#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
import importlib.util
import io
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

scripts = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(scripts))
spec = importlib.util.spec_from_file_location("validate_mastery_quizzes", scripts / "validate-mastery-quizzes.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class MasteryAudienceTest(unittest.TestCase):
    def test_website_quiz_requirement_applies_only_to_website_articles(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-quiz-audiences-") as directory:
            theory = Path(directory) / "theory.json"
            theory.write_text("[]")
            for visibility, expected in [({"website": False, "book": True}, 0), ({"website": True, "book": False}, 1)]:
                with self.subTest(visibility=visibility):
                    bundle = SimpleNamespace(
                        article_dir=Path(directory) / "chapter",
                        metadata={"slug": "chapter", "section": "Core LLM Foundations", "visibility": visibility},
                        body="A chapter without a website quiz.",
                    )
                    with patch.object(validator, "iter_content_bundles", return_value=[bundle]), patch.object(validator, "THEORY_QUIZZES_PATH", theory), redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                        self.assertEqual(validator.main(), expected)


if __name__ == "__main__":
    unittest.main()
