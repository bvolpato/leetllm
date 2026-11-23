#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Explore a numerical bug with real tools and a replaceable action chooser."""

import argparse
import copy
import inspect
import json
import math
from pathlib import Path


def baseline(values):
    weights = [math.exp(value) for value in values]
    return [weight / sum(weights) for weight in weights]


def clip(values):
    weights = [math.exp(max(-700, min(700, value))) for value in values]
    return [weight / sum(weights) for weight in weights]


def shift(values):
    largest = max(values)
    weights = [math.exp(value - largest) for value in values]
    return [weight / sum(weights) for weight in weights]


CANDIDATES = {"baseline": baseline, "clip": clip, "shift": shift}
PAIR = [1 / (1 + math.e), math.e / (1 + math.e)]
CASES = [
    ("small", [0.0, 1.0], PAIR),
    ("large positive", [1000.0, 1001.0], PAIR),
    ("large negative", [-1001.0, -1000.0], PAIR),
    ("equal", [3.0, 3.0, 3.0], [1 / 3] * 3),
]

GOAL = "Investigate the failing softmax implementation and choose a numerically stable candidate that preserves the expected probabilities."
TOOLS = {
    "read_source": "Read Python source for candidate baseline, clip, or shift. Argument: candidate.",
    "evaluate": "Run all numerical tests on baseline, clip, or shift. Argument: candidate.",
    "finish": "Return candidate and a concise summary after examining test results.",
}


def evaluate(candidate):
    results = []
    for name, values, expected in CASES:
        try:
            actual = CANDIDATES[candidate](values)
            passed = len(actual) == len(expected) and all(
                math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-12)
                for a, b in zip(actual, expected)
            )
            result = {"case": name, "passed": passed, "actual": [round(x, 6) for x in actual]}
        except (OverflowError, ZeroDivisionError) as error:
            result = {"case": name, "passed": False, "error": f"{type(error).__name__}: {error}"}
        results.append(result)
    return {"candidate": candidate, "passed": sum(row["passed"] for row in results), "total": len(results), "results": results}


def execute(action):
    name, candidate = action["tool"], action["candidate"]
    if candidate not in CANDIDATES:
        raise ValueError(f"Unknown candidate: {candidate}")
    if name == "read_source":
        return {"candidate": candidate, "source": inspect.getsource(CANDIDATES[candidate])}
    if name == "evaluate":
        return evaluate(candidate)
    raise ValueError(f"Unknown tool: {name}")


def run(choose, max_turns=8):
    history = []
    verified = set()
    for _ in range(max_turns):
        action = choose({"goal": GOAL, "tools": TOOLS, "history": history})
        if action["tool"] == "finish":
            candidate = action["candidate"]
            return {"status": "completed" if candidate in verified else "unverified", "answer": action, "history": history}
        observation = execute(action)
        history.append({"action": action, "observation": observation})
        if action["tool"] == "evaluate" and observation["passed"] == observation["total"]:
            verified.add(action["candidate"])
    return {"status": "turn_limit", "history": history}


def interactive(state):
    print(json.dumps(state, indent=2))
    return json.loads(input('Next action, e.g. {"tool":"evaluate","candidate":"baseline"}: '))


def replay(path):
    recording = json.loads(Path(path).read_text())
    turns = iter(recording["turns"])

    def comparable(state):
        state = copy.deepcopy(state)
        for turn in state["history"]:
            for row in turn["observation"].get("results", []):
                if "error" in row:
                    row["error"] = row["error"].split(":", 1)[0]
        return state

    def choose(state):
        turn = next(turns)
        if comparable(state) != comparable(turn["input"]):
            raise ValueError("Live observations differ from the recorded run")
        return turn["action"]

    return run(choose)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--replay", type=Path, help="Replay recorded choices through the current tools")
    args = parser.parse_args()
    result = replay(args.replay) if args.replay else run(interactive)
    print(json.dumps(result, indent=2))
