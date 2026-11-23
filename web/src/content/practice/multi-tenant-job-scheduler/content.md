A busy organization can keep filling a shared queue while another waits for its first job. Build a <span data-glossary="priority-scheduling">priority scheduler</span> that preserves priority, supports cancellation, and limits one tenant's consecutive dispatches when others are waiting.

Implement `FairJobScheduler`. Its <span data-glossary="fair-use-limit">fair-use rule</span> limits consecutive dispatches when another tenant has live work waiting.

## Requirements

- Constructor receives `max_consecutive_per_org`.
  Raise `ValueError` if `max_consecutive_per_org <= 0`.
- `enqueue(org, job_id, priority)` adds a job. Lower priority number runs first.
  Raise `ValueError` if `job_id` is already active (pending, including soft-canceled
  jobs that have not yet been reaped).
- `cancel(job_id)` marks a pending job canceled and returns whether it was still active. After a job has been successfully dispatched, later `cancel` returns `False`.
- Canceling an already soft-canceled but unreaped ID also returns `True`. Cancellation does not immediately free its ID.
- `dispatch(count)` returns up to `count` job IDs.
- <span data-glossary="fifo-work-queue">FIFO order</span> breaks ties within the same priority.
- When the fairness cap blocks the next job from `last_org`, pick the highest-priority pending job from another org (FIFO among equals).
- If another org has pending work, dispatch may not return more than
  `max_consecutive_per_org` jobs from the same org in a row.
  The fairness streak is global and persists across separate `dispatch` calls.
- Canceled jobs are skipped and reaped (their IDs leave the active set) when dropped from the pending queue.
- At the start of each positive-count dispatch iteration, remove all canceled entries before choosing a job. Only live jobs count toward the streak or qualify as another org's pending work.
- A dispatched or reaped ID may be enqueued again; the new arrival gets a new FIFO position.
- `dispatch(count)` with `count <= 0` returns `[]` without changing state or reaping cancellations. If only one org has live work, continue dispatching it even beyond the cap.

## Example

Although `b1` has lower priority than `a3`, the two-job fairness cap gives organization `b` a turn before more work from `a`.

```python
s = FairJobScheduler(2)
s.enqueue("a", "a1", 1)
s.enqueue("a", "a2", 1)
s.enqueue("a", "a3", 1)
s.enqueue("b", "b1", 5)
assert s.dispatch(4) == ["a1", "a2", "b1", "a3"]
```

Splitting that request into `dispatch(2)` followed by `dispatch(2)` must return `["a1", "a2"]`, then `["b1", "a3"]`. Starting a new API call does not reset the streak. Skipping a canceled job also does not reset it.

The cap controls job counts. Compute time and long-term service still depend on priority: if `a` and `b` continuously supply high-priority jobs, alternating them can keep a low-priority `c` waiting forever. Aging or weighted scheduling handles that case with a different policy. Dispatch removes queued jobs; actual worker execution is outside this exercise.

## Constraints

- Keep state in memory.
- Org and job IDs are strings, priorities and counts are integers, and the fairness cap is an integer. Negative priorities are valid and sort before zero. Type validation is outside the scope; the specified invalid-cap and duplicate-ID errors are required.
- Calls are sequential. Cancel applies only to pending work and cannot stop a job that has already been dispatched.
- Maintain per-tenant and cross-tenant priority queues so dispatch scales logarithmically with active tenants and queued jobs rather than re-sorting the full queue on every step.
