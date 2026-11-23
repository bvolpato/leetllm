A batching service has to balance how full each batch gets against how long requests wait. Hold requests briefly to form a batch, then let the caller release all pending requests when the oldest one has waited long enough.

Group request IDs into deterministic <span data-glossary="static-batching">inference batches</span>. A size limit bounds each batch, and a wait limit determines when the caller may release a partial one.

## Requirements

- Define `BatchScheduler(max_batch_size, max_wait_ms, now_ms)`.
- `add(request_id)` appends a pending request.
- If the batch reaches `max_batch_size`, return the emitted batch list.
- Otherwise return `None`.
- `flush_due()` emits when the oldest pending request has waited at least `max_wait_ms`.
- When due, emit **all** currently pending request IDs in <span data-glossary="fifo-work-queue">FIFO order</span> and clear the queue. Late arrivals join the due batch, so emission includes entries beyond the oldest item.
- `flush_all()` returns all pending requests as one batch.
- Empty flushes return `None`.
- After any emission, the next request starts a fresh wait timer; an old batch's deadline never carries over.
- Preserve FIFO order.
- `add()` checks batch size. The caller checks wait deadlines by invoking `flush_due()` periodically; the exercise creates no background timer.

## Example

```python
clock = {"t": 0}
s = BatchScheduler(2, 50, now_ms=lambda: clock["t"])
assert s.add("a") is None
assert s.add("b") == ["a", "b"]

clock = {"t": 0}
s = BatchScheduler(4, 10, now_ms=lambda: clock["t"])
assert s.add("a") is None
clock["t"] = 5
assert s.add("b") is None
clock["t"] = 10
assert s.flush_due() == ["a", "b"]
assert s.flush_due() is None
```

The deadline belongs to `a`, which arrived at time 0. Adding `b` at time 5 leaves the deadline at time 10. If `b` arrives at time 10 before the caller checks the deadline, it still joins `a`'s emitted batch. The wait limit makes a partial batch eligible for flushing; the caller's polling schedule determines when `flush_due()` runs and affects end-to-end response latency.

## Constraints

- `max_batch_size` is a positive integer; `max_wait_ms` is a finite, nonnegative number. The constructor can assume these input preconditions.
- `now_ms` is an injected callable returning finite, nondecreasing time in milliseconds. Do not read the wall clock directly.
- Request IDs are opaque values; repeated IDs are separate arrivals and must not be deduplicated.
- Don't reorder requests.
- A full batch emits immediately.
- With `max_wait_ms=0`, a partial batch is due immediately when `flush_due()` is called. `add()` still follows its size-only rule.
