In a build pipeline, embedding can't start before extraction finishes, and a temporary task failure may deserve another attempt. Build a scheduler that respects dependencies, gives ready work a predictable order, and stops cleanly when retries run out.

Implement `schedule(tasks, run, max_attempts=2)`.

## Requirements

- `tasks` is a list of dictionaries with a string `id` and optional list of string `deps` (default empty).
- Deduplicate each task's dependency list when building the <span data-glossary="directed-acyclic-graph">dependency graph</span> so repeated edges leave indegree accurate.
- A task can run when every unique dependency has completed.
- Pick ready tasks in lexicographic order for deterministic output.
- Call `run(task_id)` for each attempt.
- If `run` raises an ordinary exception, retry the same task immediately (before the next ready task) until `max_attempts` is exhausted. `max_attempts` counts the initial attempt too; a return without an exception is success regardless of its return value.
- Return task IDs in successful completion order.
- Raise `ValueError` for cycles, missing dependencies, or duplicate task IDs.
- Raise `ValueError` if `max_attempts` is not positive (`max_attempts < 1`).
- Raise `RuntimeError` when a task fails all attempts.

The attempt limit is an integer. Invalid IDs or missing dependencies are rejected before calling `run`. Cycle detection may happen after runnable tasks have completed; this scheduler doesn't roll back their side effects. A failed task aborts the schedule without releasing its dependents.

## Example

```python
tasks = [
    {"id": "extract", "deps": []},
    {"id": "embed", "deps": ["extract"]},
    {"id": "index", "deps": ["embed"]},
]

assert schedule(tasks, lambda task_id: None) == ["extract", "embed", "index"]

repeated = [{"id": "extract"}, {"id": "index", "deps": ["extract", "extract"]}]
assert schedule(repeated, lambda task_id: None) == ["extract", "index"]
```

Reconsider the entire ready set after each success. If `b` and `z` are initially ready and `b` releases `a`, the order becomes `b`, `a`, `z`; recalculating readiness lets `a` run immediately. If `b` fails once, the attempt log is `b`, `b`, `a`, `z`, while the successful completion order contains `b` once.

## Constraints

- Single-threaded base version.
- Use standard-library Python only.
