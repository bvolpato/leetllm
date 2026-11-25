#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""Validate mastery-quiz structure. Teaching quality requires manual review."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from content_bundle import iter_content_bundles
from content_audience import is_visible_to_audience

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "web" / "src" / "content"
THEORY_QUIZZES_PATH = ROOT / "web" / "src" / "data" / "theory-quizzes.json"
MIN_QUESTIONS = 3
MAX_QUESTIONS = 10
LEARN_SECTIONS = {
    "Math & Tensor Foundations",
    "Classical ML & Evaluation",
    "Deep Learning Foundations",
    "Core LLM Foundations",
    "Applied LLM Engineering & RAG",
    "Transformer & Multimodal Architectures",
    "Training, Fine-Tuning & Alignment",
    "Advanced Agents & Retrieval",
    "GPU Systems & LLM Inference",
    "AI System Design & Interviewing",
    "Project Deep Dives",
}
QUIZ_RE = re.compile(r"^```mastery-quiz\s*\n([\s\S]*?)\n```[ \t]*$", re.MULTILINE)
FINAL_CALLOUT_RE = re.compile(r"^>\s*\*\*(?:Next:|Course complete:)\*\*", re.IGNORECASE)


def non_empty_string(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_question(
    slug: str,
    index: int,
    value: object,
) -> list[str]:
    prefix = f"{slug}: question {index + 1}"
    if not isinstance(value, dict):
        return [f"{prefix} must be an object"]

    issues: list[str] = []
    for field in ("question", "answer", "explanation"):
        if not non_empty_string(value.get(field)):
            issues.append(f"{prefix} needs a non-empty {field}")

    options = value.get("options")
    if not isinstance(options, list) or len(options) != 4:
        issues.append(f"{prefix} needs exactly 4 options")
        return issues
    if any(not non_empty_string(option) for option in options):
        issues.append(f"{prefix} options must be non-empty strings")
        return issues
    # Match the runtime's case-sensitive labels after trimming outer whitespace.
    options = [option.strip() for option in options]
    if len(set(options)) != len(options):
        issues.append(f"{prefix} has duplicate options")
    answer = value.get("answer")
    if not isinstance(answer, str) or answer.strip() not in options:
        issues.append(f"{prefix} answer must exactly match one option")
    return issues


def main() -> int:
    issues: list[str] = []
    quiz_count = 0
    question_count = 0
    question_counts: set[int] = set()

    for bundle in iter_content_bundles(CONTENT_DIR, "website"):
        if not is_visible_to_audience(bundle.metadata, "website"):
            continue
        if bundle.metadata.get("section") not in LEARN_SECTIONS:
            continue

        slug = str(bundle.metadata.get("slug") or bundle.article_dir.name)
        matches = list(QUIZ_RE.finditer(bundle.body))
        if len(matches) != 1:
            issues.append(f"{slug}: expected exactly one mastery-quiz block, found {len(matches)}")
            continue

        match = matches[0]
        raw_trailing = bundle.body[match.end():]
        trailing = raw_trailing.strip()
        if trailing and not FINAL_CALLOUT_RE.match(trailing):
            issues.append(f"{slug}: mastery-quiz block must be last, immediately before final callout")
        elif trailing and not raw_trailing.startswith("\n\n"):
            issues.append(f"{slug}: mastery-quiz block needs a blank line before final callout")

        try:
            questions = json.loads(match.group(1))
        except json.JSONDecodeError as exc:
            issues.append(f"{slug}: mastery-quiz contains invalid JSON: {exc}")
            continue

        if not isinstance(questions, list):
            issues.append(f"{slug}: mastery-quiz must contain a JSON array")
            continue
        if len(questions) < MIN_QUESTIONS:
            issues.append(f"{slug}: mastery-quiz needs at least {MIN_QUESTIONS} questions, found {len(questions)}")
        if len(questions) > MAX_QUESTIONS:
            issues.append(f"{slug}: mastery-quiz allows at most {MAX_QUESTIONS} questions, found {len(questions)}")

        for index, question in enumerate(questions):
            issues.extend(validate_question(slug, index, question))

        quiz_count += 1
        question_count += len(questions)
        question_counts.add(len(questions))

    try:
        theory_quizzes = json.loads(THEORY_QUIZZES_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        issues.append(f"theory quizzes could not be loaded: {exc}")
        theory_quizzes = []

    if not isinstance(theory_quizzes, list):
        issues.append("theory quizzes must contain a JSON array")
        theory_quizzes = []

    theory_question_count = 0
    for deck in theory_quizzes:
        if not isinstance(deck, dict):
            issues.append("theory quiz deck must be an object")
            continue
        slug = f"theory:{deck.get('slug', 'unknown')}"
        questions = deck.get("questions")
        if not isinstance(questions, list) or len(questions) < 10:
            issues.append(f"{slug}: needs at least 10 questions")
            continue
        for index, question in enumerate(questions):
            issues.extend(validate_question(slug, index, question))
        theory_question_count += len(questions)

    if issues:
        print("Mastery quiz validation failed:", file=sys.stderr)
        for issue in issues:
            print(f"  - {issue}", file=sys.stderr)
        return 1

    print(
        f"OK {quiz_count} mastery quizzes with {question_count} questions "
        f"(question counts: {', '.join(map(str, sorted(question_counts)))}) and "
        f"{len(theory_quizzes)} theory decks with {theory_question_count} questions"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
