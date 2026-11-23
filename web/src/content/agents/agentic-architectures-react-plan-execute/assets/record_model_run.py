#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Use a configured Codex CLI to choose actions for the numerical investigation."""

import argparse
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import tempfile

from investigation import run


INSTRUCTIONS = """Choose the next action for this numerical investigation.
All available tools are described in the input. The host will execute your chosen
action and return its real output on the next turn. Use only those observations
and tool descriptions. Do not invoke any of your own tools, browse, or read files.
Return one JSON object with tool and candidate. For finish, also include a short
summary of the diagnosis and supporting test result. Do not include Markdown or
private reasoning. You may inspect and compare any listed candidate. Finish when
you have enough evidence to choose a fix. There are at most eight turns.
"""


def record():
    turns = []
    with tempfile.TemporaryDirectory(prefix="react-model-") as directory:
        output = Path(directory) / "action.json"

        def choose(state):
            completed = subprocess.run(
                ["codex", "--sandbox", "read-only", "--ask-for-approval", "never",
                 "exec", "--ephemeral", "--skip-git-repo-check", "--json",
                 "--cd", directory, "--output-last-message", str(output), "-"],
                input=INSTRUCTIONS + "\n" + json.dumps(state),
                text=True, capture_output=True, timeout=180, check=True,
            )
            events = [json.loads(line) for line in completed.stdout.splitlines() if line.strip()]
            items = [event["item"] for event in events if event.get("type") == "item.completed"]
            if any(item["type"] not in {"agent_message", "reasoning", "error"} for item in items):
                raise RuntimeError(f"Unexpected model item types: {[item['type'] for item in items]}")
            action = json.loads(output.read_text())
            usage = next((event.get("usage") for event in events if event.get("type") == "turn.completed"), None)
            turns.append({"input": copy.deepcopy(state), "action": action, "usage": usage})
            print(f"turn {len(turns)}: {action['tool']} {action['candidate']}", flush=True)
            return action

        result = run(choose)
    return {
        "recordedAt": datetime.now(timezone.utc).isoformat(),
        "runner": subprocess.check_output(["codex", "--version"], text=True).strip(),
        "python": sys.version,
        "modelSelection": "Configured CLI default; no model override",
        "instructions": INSTRUCTIONS,
        "turns": turns,
        "result": result,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.write_text(json.dumps(record(), indent=2) + "\n")
