#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Measure how often a script with no topic knowledge picks the correct quiz answer.

It ranks options by length, hedged wording, and absolutes, which are common test-taking cues.
Chance is 25% for four options. A high rate means the wording gives answers away. A low rate
does not prove that a question is good, so questions still need a person or reviewer.

Run: uv run scripts/audit-quiz-cues.py [article slug ...]
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "web" / "src" / "content"
HEDGES = re.compile(r"\b(can|may|might|could|usually|often|typically|depends?|measure|compare|verify|check|test|rather than|instead of|not necessarily)\b", re.I)
ABSOLUTES = re.compile(r"\b(always|never|only|guarantees?|guaranteed|proves?|every|all|automatically|must|impossible|no longer|entirely)\b", re.I)


def score(option: str, longest: int) -> float:
    # A reader cannot notice a small length difference, so options near the longest count as equal.
    length = 1.0 if len(option) >= 0.85 * longest else len(option) / longest
    return length + 0.5 * bool(HEDGES.search(option)) - 0.5 * bool(ABSOLUTES.search(option))


def guess_rate(questions: list[dict]) -> float:
    hits = 0.0
    for question in questions:
        options = question["options"]
        longest = max(len(option) for option in options)
        scores = [score(option, longest) for option in options]
        best = max(scores)
        tied = [option for option, value in zip(options, scores) if value == best]
        hits += (question["answer"] in tied) / len(tied)
    return hits / len(questions)


def main() -> int:
    wanted = set(sys.argv[1:])
    rows, everything = [], []
    for path in sorted(ROOT.glob("*/*/content.md")):
        slug = path.parent.name
        if wanted and slug not in wanted:
            continue
        match = re.search(r"```mastery-quiz\n(.*?)\n```", path.read_text(), re.S)
        if match:
            questions = json.loads(match.group(1))
            rows.append((guess_rate(questions), len(questions), slug))
            everything += questions
    missing = wanted - {slug for _, _, slug in rows}
    if missing:
        print(
            "No mastery quiz found for requested article slug(s): "
            + ", ".join(sorted(missing))
            + ". Pass article slugs, not video lesson IDs.",
            file=sys.stderr,
        )
        return 2
    if not everything:
        print("No mastery quizzes found.", file=sys.stderr)
        return 2
    for rate, count, slug in sorted(rows, reverse=True)[: 15 if not wanted else None]:
        print(f"{rate:6.1%}  {count:3d} questions  {slug}")
    print(f"{guess_rate(everything):6.1%}  {len(everything)} questions overall (chance is 25.0%)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
