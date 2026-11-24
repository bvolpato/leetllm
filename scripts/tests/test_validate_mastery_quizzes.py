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
from types import SimpleNamespace
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch

scripts = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(scripts))
spec = importlib.util.spec_from_file_location("validate_mastery_quizzes", scripts / "validate-mastery-quizzes.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def _make_quiz_body(question_count: int) -> str:
    questions = [
        {
            "question": f"Question {i + 1}?",
            "options": ["Correct", "Distractor A", "Distractor B", "Distractor C"],
            "answer": "Correct",
            "explanation": "Correct is supported by the lesson.",
        }
        for i in range(question_count)
    ]
    return (
        "Lesson body.\n\n"
        f"```mastery-quiz\n{json.dumps(questions)}\n```\n\n"
        "> **Next:** Continue to [Next](/learn/next). Builds directly on this mechanism.\n"
    )


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

    def test_question_count_bounds_allow_3_to_10_and_reject_outside(self):
        with tempfile.TemporaryDirectory(prefix="leetllm-quiz-counts-") as directory:
            theory = Path(directory) / "theory.json"
            theory.write_text("[]")
            for count, expected in [(2, 1), (3, 0), (6, 0), (10, 0), (11, 1)]:
                with self.subTest(count=count):
                    bundle = SimpleNamespace(
                        article_dir=Path(directory) / "chapter",
                        metadata={"slug": "chapter", "section": "Core LLM Foundations", "visibility": {"website": True}},
                        body=_make_quiz_body(count),
                    )
                    with patch.object(validator, "iter_content_bundles", return_value=[bundle]), patch.object(validator, "THEORY_QUIZZES_PATH", theory), redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                        self.assertEqual(validator.main(), expected)

    def test_schema_and_answer_integrity_remain_strict(self):
        issues = validator.validate_question(
            "chapter",
            0,
            {
                "question": "Which option wins?",
                "options": ["A", "A", "B", "C"],
                "answer": "D",
                "explanation": "Explanation.",
            },
        )
        self.assertTrue(any("duplicate options" in issue for issue in issues))
        self.assertTrue(any("answer must exactly match one option" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
