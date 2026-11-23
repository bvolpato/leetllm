A high-priority task may still need to wait until its scheduled time, while a lower-priority task is ready now. Build a <span data-glossary="priority-scheduling">priority scheduler</span> that chooses among due tasks and skips ones whose lifetime has ended.

## Requirements

- Define `DeadlineScheduler(now)`.
- `add(task_id, priority, run_at=0, ttl=None)` stores a task. The same `task_id` may be added more than once (multi-entry is allowed).
- `pop()` returns the due, non-expired task with highest priority, or `None` when no due non-expired task exists.
- Higher numeric `priority` wins.
- Ties use insertion order.
- A task is due when `run_at <= now()`.
- A task with a <span data-glossary="ttl-deadline">time-to-live (TTL)</span> expires when `now() >= run_at + ttl`.
- Expired tasks are treated as missing.
- `ttl=None` means no expiration; zero TTL is allowed and expires exactly when the task becomes due.
- Use one clock reading for each `pop()` so eligibility and expiration share the same time.

Assume a single-threaded caller, a nondecreasing clock, finite numeric times, integer priorities, and nonnegative TTL values when present. Inputs satisfy these types and ranges; input validation isn't part of this exercise. `pop()` removes exactly the selected entry, so repeated IDs can be returned more than once.

## Example

The lower-priority ready task runs immediately; the higher-priority task remains pending until its scheduled time:

```python
clock = {"t": 0}
scheduler = DeadlineScheduler(now=lambda: clock["t"])
scheduler.add("later", priority=10, run_at=5)
scheduler.add("now", priority=1, run_at=0)
assert scheduler.pop() == "now"
clock["t"] = 5
assert scheduler.pop() == "later"
```

TTL starts at `run_at`, not when `add()` is called. A task added at time 0 with `run_at=5` and `ttl=2` is eligible during `[5, 7)` and expired at time 7. A task added late at time 8 with those same values is already expired.

## Constraints

- Use deterministic injected time.
- Don't return tasks before `run_at`.
- Don't let expired high-priority tasks block lower-priority due tasks.
