#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Score normalized token-event records, not raw SSE or server capacity.

Run: uv run score_requests.py trace.json events.jsonl
Exit 0: valid accounting; 2: client schedule invalid; 1: malformed input.
Neither exit 0 nor a high attainment fraction approves a deployment.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys


def require(condition, message):
    if not condition:
        raise ValueError(message)


def number(value, name):
    require(type(value) in (int, float) and value >= 0,
            f"{name} must be finite and nonnegative")
    try:
        finite = math.isfinite(value)
    except OverflowError:
        finite = False
    require(finite, f"{name} must be finite and nonnegative")
    return value


def exact_keys(value, keys, name):
    require(type(value) is dict and set(value) == set(keys), f"invalid {name} fields")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f"duplicate JSON key: {key}")
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError(f"nonfinite JSON constant: {value}")


def decode(text):
    return json.loads(text, object_pairs_hook=unique_object, parse_constant=reject_constant)


def percentile(values, q):
    require(type(q) in (int, float) and 0 < q <= 1 and math.isfinite(q),
            "percentile q must be in (0, 1]")
    if not values:
        return None
    for value in values:
        number(value, "percentile sample")
    return sorted(values)[math.ceil(q * len(values)) - 1]


def score(manifest, events, ttft_limit_ms=300, tpot_limit_ms=80, lag_limit_ms=20):
    for name, value in (("TTFT limit", ttft_limit_ms), ("TPOT limit", tpot_limit_ms), ("lag limit", lag_limit_ms)):
        number(value, name)
    exact_keys(manifest, ("schema", "evidence_kind", "arrival_window_ms", "requests"), "manifest")
    require(type(manifest["schema"]) is int and manifest["schema"] == 1, "unsupported schema")
    require(manifest["evidence_kind"] in ("synthetic", "recorded"), "invalid evidence kind")
    window = manifest["arrival_window_ms"]
    require(type(window) is list and len(window) == 2, "window must contain start and end")
    start, end = (number(x, "window") for x in window)
    require(end > start, "window must have positive duration")
    window_s = (end - start) / 1000
    require(window_s > 0, "window duration must be representable in seconds")
    require(type(manifest["requests"]) is list and bool(manifest["requests"]), "empty request cohort")
    expected = {}
    for request in manifest["requests"]:
        exact_keys(request, ("id", "scheduled_ms", "class"), "request")
        rid = request["id"]
        require(type(rid) is str and bool(rid) and rid not in expected, "empty or duplicate request id")
        require(type(request["class"]) is str and bool(request["class"]), "invalid request class")
        scheduled = number(request["scheduled_ms"], "scheduled time")
        require(start <= scheduled < end, "request outside half-open arrival window")
        expected[rid] = request
    require(type(events) is list, "events must be a list")
    by_id = {}
    statuses = ("success", "error", "timeout", "rejected", "cancelled", "not_sent")
    for event in events:
        exact_keys(event, ("id", "sent_ms", "terminal_ms", "token_ms", "status", "quality_pass"), "event")
        rid = event["id"]
        require(type(rid) is str and rid in expected and rid not in by_id, "unknown or duplicate event id")
        require(event["status"] in statuses, "unknown terminal status")
        require(type(event["quality_pass"]) is bool, "quality_pass must be boolean")
        tokens = event["token_ms"]
        require(type(tokens) is list, "token_ms must be a list")
        terminal = number(event["terminal_ms"], "terminal time")
        scheduled = expected[rid]["scheduled_ms"]
        require(terminal >= scheduled, "terminal time precedes schedule")
        if event["status"] == "not_sent":
            require(event["sent_ms"] is None and not tokens and not event["quality_pass"],
                    "not_sent must have no send, tokens, or quality pass")
        else:
            sent = number(event["sent_ms"], "sent time")
            require(scheduled <= sent <= terminal, "invalid send time")
            previous = sent
            for token in tokens:
                number(token, "token time")
                require(previous <= token <= terminal, "token times must be ordered within request")
                previous = token
            if event["status"] == "success":
                require(bool(tokens), "success needs at least one output token")
            else:
                require(not event["quality_pass"], "failed request cannot have quality_pass=true")
        by_id[rid] = event
    require(set(by_id) == set(expected), "missing terminal outcomes for offered requests")
    offered_rps = number(len(expected) / window_s, "offered rate")

    records = []
    ttfts, tpots, itls = [], [], []
    for rid, request in expected.items():
        event = by_id[rid]
        sent = event["sent_ms"]
        tokens = event["token_ms"]
        lag = None if sent is None else sent - request["scheduled_ms"]
        ttft = None if not tokens else tokens[0] - sent
        gaps = [b - a for a, b in zip(tokens, tokens[1:])]
        tpot = sum(gaps) / len(gaps) if gaps else None
        success = event["status"] == "success"
        # Single-token success has no decode interval: TPOT criterion is N/A.
        qualified = success and event["quality_pass"] and ttft <= ttft_limit_ms and (tpot is None or tpot <= tpot_limit_ms)
        if success:
            ttfts.append(ttft)
            itls.extend(gaps)
            if tpot is not None:
                tpots.append(tpot)
        records.append({"id": rid, "class": request["class"], "status": event["status"],
                        "schedule_lag_ms": lag, "ttft_sent_ms": ttft, "tpot_ms": tpot,
                        "e2e_sent_ms": None if sent is None else event["terminal_ms"] - sent,
                        "terminal_scheduled_ms": event["terminal_ms"] - request["scheduled_ms"],
                        "qualified": qualified})
    qualified_count = sum(r["qualified"] for r in records)
    successful = sum(r["status"] == "success" for r in records)
    horizon_s = (max(end, max(e["terminal_ms"] for e in events)) - start) / 1000
    valid_schedule = all(r["schedule_lag_ms"] is not None and r["schedule_lag_ms"] <= lag_limit_ms for r in records)
    return {
        "evidence_kind": manifest["evidence_kind"],
        "offered_requests": len(records), "successful_requests": successful,
        "qualified_requests": qualified_count, "attainment_all_offered": qualified_count / len(records),
        "arrival_window_s": window_s,
        "realized_offered_rps": offered_rps,
        "cohort_horizon_s": horizon_s,
        "cohort_successful_rps": successful / horizon_s,
        "cohort_qualified_rps": qualified_count / horizon_s,
        "schedule_valid": valid_schedule,
        "capacity_estimate_rps": None,
        "limits_ms": {"ttft_sent": ttft_limit_ms, "tpot": tpot_limit_ms, "schedule_lag": lag_limit_ms},
        "successful_only": {
            "ttft_count": len(ttfts), "p95_ttft_ms": percentile(ttfts, .95),
            "tpot_count": len(tpots), "p95_tpot_ms": percentile(tpots, .95),
            "pooled_gap_count": len(itls), "p99_pooled_itl_ms": percentile(itls, .99)},
        "requests": records,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("events", type=Path)
    args = parser.parse_args()
    try:
        manifest_bytes = args.manifest.read_bytes()
        event_bytes = args.events.read_bytes()
        manifest = decode(manifest_bytes.decode("utf-8"))
        events = [decode(line) for line in event_bytes.decode("utf-8").splitlines() if line.strip()]
        result = score(manifest, events)
        result["input_sha256"] = {
            "manifest": hashlib.sha256(manifest_bytes).hexdigest(),
            "events": hashlib.sha256(event_bytes).hexdigest()}
        print(json.dumps(result, indent=2, allow_nan=False))
        return 0 if result["schedule_valid"] else 2
    except (ValueError, TypeError, KeyError, OSError, OverflowError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
