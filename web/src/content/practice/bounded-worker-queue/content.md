When workers fall behind, a queue has two jobs: keep new arrivals within a bound and preserve work that needs a retry. Build a small queue that makes the difference between waiting work and claimed work visible.

Implement a deterministic <span data-glossary="fifo-work-queue">FIFO queue</span> that tracks pending and in-progress work.

## Requirements

- Define `WorkQueue(max_pending)`.
- Items must be non-null (`None` in Python or `null` in Java).
- `enqueue(item)` appends pending work and returns `True`; if pending capacity is full, return `False`.
- `start(worker_id)` assigns the next pending item to an idle worker and returns it.
- If there is no pending work, `start(worker_id)` returns `None` without creating an active assignment.
- If a worker already has in-progress work, `start(worker_id)` returns `None`.
- `complete(worker_id)` removes and returns the worker's in-progress item.
- `complete` / `fail` on an unknown or idle `worker_id` return `None` (no-op on queue state).
- `fail(worker_id, retry=True)` removes the worker's item and optionally requeues it at the back.
- `fail` returns the removed item whether it is retried or dropped.
- Capacity applies to `enqueue` only. Retry requeues even when pending is already at `max_pending` (retry may temporarily make `len(pending) > max_pending`).
- `snapshot()` returns `{"pending": [...], "in_progress": {...}}`.
- Return independent snapshot collections: mutating a snapshot must not mutate the queue's internal state.
- Snapshot isolation applies to the returned list and dictionary, not to deep copies of item payloads. Items are opaque values; repeated equal values are separate work items.

## Example

```python
queue = WorkQueue(max_pending=2)
assert queue.enqueue("a")
assert queue.enqueue("b")
assert not queue.enqueue("c")
assert queue.start("w1") == "a"
assert queue.enqueue("c")
assert queue.complete("w1") == "a"

snapshot = queue.snapshot()
snapshot["pending"].clear()
assert queue.snapshot()["pending"] == ["b", "c"]
```

Retry preserves accepted work even when new arrivals have filled the pending queue:

```python
queue = WorkQueue(max_pending=1)
assert queue.enqueue("a")
assert queue.start("w1") == "a"
assert queue.enqueue("b")
assert queue.fail("w1") == "a"
assert queue.snapshot() == {"pending": ["b", "a"], "in_progress": {}}
assert not queue.enqueue("c")
assert queue.start("w2") == "b"
assert not queue.enqueue("c")  # One pending item still fills capacity.
assert queue.start("w3") == "a"
assert queue.enqueue("c")
```

The bound covers pending queue admissions. Items held by workers remain accepted work outside that count. A retry returns accepted work to the queue, even when this temporarily pushes pending length above `max_pending`. A failed item goes behind work already waiting, so repeated failures never jump it ahead of the queue.

## Constraints

- Use FIFO order for pending work.
- `max_pending` is a nonnegative integer. Zero capacity rejects every enqueue. The constructor can assume these input preconditions.
- Worker IDs are hashable identifiers with stable equality. Calls run sequentially in one thread; the exercise models worker state without launching worker threads.
- Treat `None` / `null` items as outside the input specification.
- Other falsey values, such as `0`, `False`, and `""`, are valid items. Test ownership by worker membership, not item truthiness.
- Capacity applies to pending items only on `enqueue`; fail-retry bypasses the capacity check.
- Don't allow one worker to hold two active items.
