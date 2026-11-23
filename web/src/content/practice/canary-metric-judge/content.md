A canary with few requests can look healthy by chance. Evaluate traffic, latency, error rate, and quality as separate gates so a latency gain comes with a clear quality check. Turn the release policy into a small deterministic judge that explains which gate decided the outcome.

Decide whether a <span data-glossary="canary-rollout">canary release</span> should promote, hold, or <span data-glossary="rollback">roll back</span>.

## Requirements

- Define `judge_canary(baseline, candidate, thresholds)`.
- Return `{"decision": ..., "reasons": [...]}`.
- Decisions are `"promote"`, `"hold"`, or `"rollback"`.
- If candidate requests are below `thresholds["min_requests"]`, return hold with exactly `["not_enough_traffic"]`; rollback reasons are excluded.
- Treat a missing candidate `requests` value as zero, so the traffic gate holds before inspecting any other missing metrics.
- Roll back if candidate `error_rate` is missing or exceeds `max_error_rate` → reason token `"error_rate"`.
- Roll back if baseline/candidate latency is missing, baseline latency is zero, or candidate latency divided by baseline latency exceeds `max_latency_ratio` → reason token `"latency"`.
- Quality is higher-is-better. Define `quality_delta = candidate["quality"] - baseline["quality"]`. Roll back if either quality is missing or `quality_delta < min_quality_delta` → reason token `"quality"`.
- Comparisons are strict: traffic holds when `requests < min_requests`; error and latency roll back on `>`; quality rolls back on `<`. Equality passes each gate.
- Rollback reason tokens must be exactly `"error_rate"`, `"latency"`, and `"quality"` (not `"error"`, `"latency_ratio"`, or `"quality_delta"`).
- Promote only when no rollback reason exists.
- Reason order: `not_enough_traffic` (hold only), then rollback reasons in order `error_rate`, `latency`, `quality`.

Latency uses the `p95_latency_ms` field in both dictionaries. A missing metric means an absent key or `None` for error rate, latency, or quality. A supplied request count is a nonnegative integer; omit the key to represent unknown traffic. Thresholds contain all four required keys, with positive integer `min_requests`, finite `max_error_rate` in `[0, 1]`, positive finite `max_latency_ratio`, and finite `min_quality_delta`. Present metrics are finite numbers; error rates are in `[0, 1]` and latencies are nonnegative. Validation of malformed values such as `NaN` isn't part of this exercise.

Use ordinary numeric comparisons without rounding or adding an epsilon. This deterministic policy applies thresholds to already aggregated metrics. Estimate confidence from request-level observations with an appropriate statistical method when the rollout decision needs it.

## Example

```python
baseline = {"p95_latency_ms": 100, "quality": 0.8}
candidate = {"requests": 1000, "error_rate": 0.01, "p95_latency_ms": 110, "quality": 0.81}
thresholds = {"min_requests": 100, "max_error_rate": 0.05, "max_latency_ratio": 1.5, "min_quality_delta": 0}
assert judge_canary(baseline, candidate, thresholds)["decision"] == "promote"
assert judge_canary(baseline, {}, thresholds) == {
    "decision": "hold",
    "reasons": ["not_enough_traffic"],
}
```

For a permitted quality drop, baseline quality `1.0`, candidate quality `0.75`, and `min_quality_delta=-0.25` pass exactly at the boundary. Candidate quality `0.5` fails because its delta is `-0.5`. Keep evaluating error rate and latency too, so a traffic-qualified candidate failing all three gates returns all three reason tokens in the stated order.

## Constraints

- Don't divide by zero.
- After the traffic gate passes, missing metrics should <span data-glossary="fail-closed">fail closed</span> with rollback reasons.
- Keep reason ordering deterministic.
