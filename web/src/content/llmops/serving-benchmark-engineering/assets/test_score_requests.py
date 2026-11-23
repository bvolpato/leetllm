#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Local accounting tests. No endpoint, GPU, or serving benchmark is run."""
from copy import deepcopy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import score_requests as scorer

ROOT = Path(__file__).resolve().parent


class ScorerTests(unittest.TestCase):
    def setUp(self):
        self.manifest = scorer.decode((ROOT / "example-trace.json").read_text())
        self.events = [scorer.decode(line) for line in (ROOT / "example-events.jsonl").read_text().splitlines()]

    def test_cohort_denominators_and_timing(self):
        result = scorer.score(self.manifest, self.events)
        self.assertEqual((result["offered_requests"], result["successful_requests"], result["qualified_requests"]), (6, 5, 3))
        self.assertEqual(result["attainment_all_offered"], .5)
        self.assertEqual((result["realized_offered_rps"], result["cohort_horizon_s"], result["cohort_qualified_rps"]), (3, 2.5, 1.2))
        first = result["requests"][0]
        self.assertEqual((first["ttft_sent_ms"], first["tpot_ms"], first["e2e_sent_ms"]), (240, 60, 500))
        self.assertIsNone(result["requests"][1]["tpot_ms"])
        self.assertTrue(result["requests"][1]["qualified"])
        self.assertEqual(result["successful_only"]["tpot_count"], 4)
        self.assertEqual(result["successful_only"]["p99_pooled_itl_ms"], 120)
        self.assertIsNone(result["capacity_estimate_rps"])

    def test_schedule_delay_cannot_improve_validity(self):
        self.events[3]["sent_ms"] = 800
        result = scorer.score(self.manifest, self.events)
        self.assertEqual(result["requests"][3]["ttft_sent_ms"], 250)
        self.assertEqual(result["requests"][3]["schedule_lag_ms"], 40)
        self.assertFalse(result["schedule_valid"])

    def test_failed_outcomes_stay_in_denominator(self):
        for status in ("error", "timeout", "rejected", "cancelled", "not_sent"):
            with self.subTest(status=status):
                events = deepcopy(self.events)
                events[0].update(status=status, quality_pass=False)
                if status == "not_sent":
                    events[0].update(sent_ms=None, token_ms=[])
                result = scorer.score(self.manifest, events)
                self.assertEqual(result["offered_requests"], 6)
                self.assertEqual(result["qualified_requests"], 2)
        for event in self.events:
            event.update(status="not_sent", sent_ms=None, token_ms=[], quality_pass=False)
        result = scorer.score(self.manifest, self.events)
        self.assertEqual(result["attainment_all_offered"], 0)
        self.assertIsNone(result["successful_only"]["p95_ttft_ms"])

    def test_invalid_events_and_cohorts(self):
        mutations = [
            {"id": "unknown"}, {"status": "running"}, {"quality_pass": 1},
            {"sent_ms": -1}, {"sent_ms": True}, {"sent_ms": float("nan")},
            {"terminal_ms": float("inf")}, {"terminal_ms": 10**400}, {"terminal_ms": 400},
            {"token_ms": []}, {"token_ms": [240, 230]}, {"token_ms": [-1]},
            {"token_ms": [501]}, {"token_ms": [True]}, {"token_ms": "240"},
            {"status": "error"}, {"unexpected": 1},
        ]
        for patch in mutations:
            with self.subTest(patch=patch):
                events = deepcopy(self.events); events[0].update(patch)
                with self.assertRaises(ValueError): scorer.score(self.manifest, events)
        for events in (self.events[:-1], self.events + [self.events[0]]):
            with self.assertRaises(ValueError): scorer.score(self.manifest, events)
        for window in ([0, 0], [0, 1900], [1, 2000]):
            manifest = deepcopy(self.manifest); manifest["arrival_window_ms"] = window
            with self.assertRaises(ValueError): scorer.score(manifest, self.events)

    def test_unrepresentable_window_and_rate(self):
        for end in (5e-324, 1e-320):
            with self.subTest(end=end):
                manifest = {"schema": 1, "evidence_kind": "synthetic", "arrival_window_ms": [0, end],
                            "requests": [{"id": "tiny", "scheduled_ms": 0, "class": "interactive"}]}
                events = [{"id": "tiny", "sent_ms": 0, "terminal_ms": 0, "token_ms": [0],
                           "status": "success", "quality_pass": True}]
                with self.assertRaises(ValueError): scorer.score(manifest, events)

    def test_percentiles_and_strict_json(self):
        self.assertEqual(scorer.percentile(list(range(1, 21)), .95), 19)
        self.assertEqual(scorer.percentile(list(range(1, 81)), .99), 80)
        self.assertIsNone(scorer.percentile([], .95))
        for q in (0, -1, 1.1, True, float("nan"), 10**400):
            with self.assertRaises(ValueError): scorer.percentile([1], q)
        for text in ('{"x":1,"x":2}', '{"x":NaN}', '{"x":Infinity}', '{'):
            with self.assertRaises(ValueError): scorer.decode(text)

    def test_cli_exit_codes_and_hashes(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "events.jsonl"
            def run(events):
                path.write_text("\n".join(json.dumps(e) for e in events))
                return subprocess.run([sys.executable, str(ROOT / "score_requests.py"), str(ROOT / "example-trace.json"), str(path)], capture_output=True, text=True)
            result = run(self.events)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout)["input_sha256"]["events"], scorer.hashlib.sha256(path.read_bytes()).hexdigest())
            self.events[3]["sent_ms"] = 800
            self.assertEqual(run(self.events).returncode, 2)
            self.assertEqual(run(self.events[:-1]).returncode, 1)


if __name__ == "__main__":
    unittest.main()
