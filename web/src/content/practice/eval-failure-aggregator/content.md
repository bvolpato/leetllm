An aggregate pass rate is useful for an <span data-glossary="offline-evaluation">offline evaluation</span>, but it can hide a case that failed on one attempt and passed on retry. Summarize the run history so both the overall rate and the failures remain visible.

## Requirements

- Define `summarize_runs(runs)`.
- Each run is a dict with `case_id`, `passed`, and optional `error`. An optional `category` field may appear on runs; ignore it in this problem (used only in follow-ups).
- Return a dict with:
  - `total`
  - `passed`
  - `pass_rate`
  - `failing_cases`
  - `top_errors`
- `failing_cases` contains unique failed case IDs sorted alphabetically.
- `top_errors` contains `(error, count)` pairs for failed rows with a non-empty error.
- Ignore error strings on passing rows; only failed attempts contribute to error counts.
- Sort top errors by count descending, then error alphabetically.
- For no runs, `pass_rate` is `0`.

This is an attempt-level pass rate: `passed / total`, without rounding. A case that fails once and passes on retry still appears in `failing_cases`, because that list records any observed failure. A repeated failure increments its error count each time. `top_errors` contains every distinct non-empty error from failed attempts.

## Example

```python
runs = [
    {"case_id": "a", "passed": True},
    {"case_id": "b", "passed": False, "error": "timeout"},
]
assert summarize_runs(runs) == {
    "total": 2,
    "passed": 1,
    "pass_rate": 0.5,
    "failing_cases": ["b"],
    "top_errors": [("timeout", 1)],
}
```

## Constraints

- Don't mutate input runs.
- Count each run toward `total`, even repeated case IDs.
- Count unique case IDs only in `failing_cases`.
- Every run has a string `case_id` and boolean `passed`. If present, `error` is a string; malformed rows are outside this exercise. Extra fields, including `category`, do not affect this global summary.
- Preserve error strings exactly. Ignore a missing or empty error, but count `" "` and `"timeout "` as non-empty strings distinct from `"timeout"`. Use case-sensitive lexicographic string order for the requested sorts.

For one failed `"same"` attempt followed by one passing `"same"` attempt, return `total=2`, `passed=1`, and `pass_rate=0.5`, while keeping `"same"` in `failing_cases`. Keep both observations in the summary. The result describes the supplied batch; repeated attempts give frequently retried cases extra weight, so use a representative sample to estimate population performance.
