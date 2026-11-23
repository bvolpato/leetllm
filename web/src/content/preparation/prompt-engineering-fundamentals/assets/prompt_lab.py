#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Compare the lesson's captured responses, or run both prompts on a chat endpoint."""

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen


def evaluate(cases, predictions):
    by_id = {row["id"]: row for row in predictions}
    expected_ids = {case["id"] for case in cases}
    if len(by_id) != len(predictions) or set(by_id) != expected_ids:
        raise ValueError("Each review must have exactly one prediction with its original id.")
    results = []
    for case in cases:
        prediction = by_id[case["id"]]
        quote = prediction["evidence"]
        results.append({
            "id": case["id"],
            "label": prediction["label"],
            "expected": case["expected"],
            "correct": prediction["label"] == case["expected"],
            "quoted": quote == "" or quote in case["text"],
        })
    return results


def call_model(prompt, base_url, model):
    payload = {"model": model, "messages": [{"role": "user", "content": prompt}]}
    headers = {"Content-Type": "application/json"}
    if api_key := os.environ.get("LLM_API_KEY"):
        headers["Authorization"] = f"Bearer {api_key}"
    request = Request(
        base_url.rstrip("/") + "/chat/completions",
        data=json.dumps(payload).encode(),
        headers=headers,
    )
    with urlopen(request, timeout=120) as response:
        completion = json.load(response)
    return completion["choices"][0]["message"]["content"], completion.get("model", model)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--capture", type=Path, default=Path(__file__).with_name("prompt-capture.json"))
    parser.add_argument("--live", action="store_true", help="Make two real model requests")
    parser.add_argument("--base-url", default=os.environ.get("LLM_BASE_URL"))
    parser.add_argument("--model", default=os.environ.get("LLM_MODEL"))
    parser.add_argument("--save", type=Path, help="Save a fresh live run including raw responses")
    args = parser.parse_args()
    if args.live and (not args.base_url or not args.model):
        parser.error("--live requires --base-url and --model, or LLM_BASE_URL and LLM_MODEL")
    if args.save and not args.live:
        parser.error("--save is for a fresh --live run")

    capture = json.loads(args.capture.read_text())
    runs = capture["runs"]
    if args.live:
        runs = []
        for run in capture["runs"]:
            raw, model = call_model(run["prompt"], args.base_url, args.model)
            runs.append({
                "id": run["id"], "prompt": run["prompt"], "raw_response": raw,
                "model": model, "recorded_at": datetime.now(timezone.utc).isoformat(),
            })
        if args.save:
            args.save.write_text(json.dumps({
                "runner": "Chat Completions HTTP", "cases": capture["cases"], "runs": runs,
            }, indent=2) + "\n")

    reports = {
        run["id"]: evaluate(capture["cases"], json.loads(run["raw_response"]))
        for run in runs
    }

    for name, rows in reports.items():
        print(f"{name}: {sum(row['correct'] for row in rows)}/{len(rows)} food labels match")
        print(f"  copied evidence: {sum(row['quoted'] for row in rows)}/{len(rows)}")
    baseline = {row["id"]: row for row in reports["baseline"]}
    for row in reports["food"]:
        before = baseline[row["id"]]
        if before["label"] != row["label"]:
            print(f"{row['id']}: {before['label']} -> {row['label']} (expected {row['expected']})")


if __name__ == "__main__":
    main()
