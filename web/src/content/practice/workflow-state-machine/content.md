A job pipeline needs a clear answer to two questions: which jobs are ready, and what happens after a failure? Keep each transition visible so a retry doesn't accidentally run before its dependencies finish.

Implement `WorkflowRunner`, an in-memory <span data-glossary="state-machine">state machine</span> for dependent jobs. Jobs move through a small set of stored states:

```text
pending -> running -> succeeded
pending -> running -> failed
running -> retrying -> pending
pending/running/retrying/failed -> canceled
```

## Requirements

- `add_job(job_id, deps=None, max_attempts=1)` registers a job.
- `add_job` raises `ValueError` on duplicate ids, `max_attempts < 1`, or dependencies that aren't already registered.
- `ready()` returns pending jobs whose dependencies have succeeded, in insertion order.
- `transition(job_id, state, reason=None)` validates state transitions and returns the final state.
- Starting a job increments its attempt count.
- `transition` to `running` is allowed only when the job is currently `pending` and appears in `ready()`; otherwise raise `ValueError` (message must include `"dependencies"` when the job is blocked on unsatisfied dependencies).
- Other illegal edges raise `ValueError` whose message includes `"invalid transition"`.
- If a running job fails and still has attempts left, move it to `retrying`; otherwise move it to `failed`. Requesting `"failed"` may therefore return `"retrying"` when attempts remain.
- `retrying` jobs aren't ready. The caller must explicitly `transition(..., "pending")` to re-queue them.
- `status(job_id)` returns
  `{"state": str, "attempts": int, "history": list[dict]}` where each
  history entry is `{"state": str, "reason": str | None, "attempt": int}` in transition order.
  `attempt` is the job's attempt count at the time of that transition.
- Registration starts at `pending`, attempt 0, with empty history. Record one entry for each accepted transition using its final stored state. Rejected transitions leave state, attempts, and history unchanged.
- `status()` returns independent collections and history-entry dictionaries; editing a returned status must not alter the runner.
- Cancellation affects only the selected job. A failed or canceled prerequisite leaves its dependents pending but blocked. `succeeded` and `canceled` have no outgoing transitions; a `failed` job may only be canceled.
- Raise `ValueError` for invalid transitions or unknown jobs.

## Example

A job with `max_attempts=2` must preserve this retry trace:

| Requested transition | Stored state | Attempt count | Ready to run? |
|---|---|---:|---|
| `running` | `running` | `1` | no |
| `failed` | `retrying` | `1` | no |
| `pending` | `pending` | `1` | yes |
| `running` | `running` | `2` | no |
| `failed` | `failed` | `2` | no |

The examples below show dependency release and insertion-order readiness:

```python
runner = WorkflowRunner()
runner.add_job("extract")
runner.add_job("train", deps=["extract"], max_attempts=2)

assert runner.ready() == ["extract"]
runner.transition("extract", "running")
runner.transition("extract", "succeeded")
assert runner.ready() == ["train"]

# Multiple ready jobs stay in insertion order (not sorted by id).
runner2 = WorkflowRunner()
runner2.add_job("b")
runner2.add_job("a")
runner2.add_job("c", deps=["a"])
assert runner2.ready() == ["b", "a"]
```

Dependency registration only accepts earlier jobs, so every edge points backward in registration order. That rule prevents cycles without a graph traversal. If the API later permits adding dependencies to existing jobs, cycle detection becomes a separate requirement.

Retry history records the state the runner actually stored after each request:

```python
runner = WorkflowRunner()
runner.add_job("job", max_attempts=2)
assert runner.status("job") == {"state": "pending", "attempts": 0, "history": []}
assert runner.transition("job", "running") == "running"
assert runner.transition("job", "failed", reason="timeout") == "retrying"
assert runner.status("job")["history"][-1] == {
    "state": "retrying", "reason": "timeout", "attempt": 1
}
assert runner.ready() == []
assert runner.transition("job", "pending") == "pending"
assert runner.status("job")["attempts"] == 1
assert runner.transition("job", "running") == "running"
assert runner.transition("job", "failed") == "failed"
assert runner.status("job")["attempts"] == 2
```

## Constraints

- Keep it single-process and in memory.
- Job IDs and dependencies are strings; `max_attempts` is an integer. Reasons are strings or `None`. Type validation is outside this exercise, while the explicit registration and transition errors above are required.
- Use deterministic ordering.
- Raise `ValueError` for invalid transitions or unknown jobs.
- Increment attempts only when a pending job successfully enters `running`.
