# Sliding Window Error Counter

A lifetime error total can hide a problem that started recently. Count events inside a rolling window so a reader can see what is happening now.

## Requirements

- Define `ErrorCounter(window_seconds, now)`.
- `record(message)` stores one error occurrence at the current time.
- `count()` returns the number of non-expired errors.
- `top(k)` returns `(message, count)` pairs for the top `k` messages, ordered by count descending then message ascending.
- If `k <= 0`, `top(k)` returns an empty list.
- Every read path must treat expired events as missing. `record` may also purge expired events, preventing unbounded storage growth.
- An event expires when `now() - event_time >= window_seconds`.
- Ties in `top(k)` sort alphabetically by message (already implied by count-desc then message-asc).

## Example

```python
clock = {"t": 0}
counter = ErrorCounter(10, now=lambda: clock["t"])
counter.record("timeout")
counter.record("timeout")
counter.record("rate_limit")
assert counter.count() == 3
assert counter.top(2) == [("timeout", 2), ("rate_limit", 1)]
clock["t"] = 10
assert counter.count() == 0
```

## Constraints

- Use deterministic injected time.
- Assume injected timestamps move forward <span data-glossary="time-monotonic">monotonically</span>; an ordered <span data-glossary="collections-deque">deque</span> can't safely expire events after the clock moves backward.
- `window_seconds` is finite and positive. `now()` returns finite numeric timestamps in seconds and may repeat a timestamp. Use one clock snapshot per operation. Messages are strings counted exactly, including empty strings; `k` is an integer.
- Use standard-library Python only.
- Don't scan expired data forever if many events are recorded.
- Retain events only in the active window. Memory grows with the event rate inside that window, so high-volume systems need a separate limit or aggregation policy.
