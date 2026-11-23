When an alert delivery is retried, sending it twice can create noise without adding information. Build a per-channel <span data-glossary="rate-limit">notification throttle</span> that uses dedupe keys and gives callers a useful retry delay.

Implement `NotificationLimiter`.

## Requirements

- Constructor receives `limit`, `window_seconds`, and injected `now`.
  Raise `ValueError` if `limit <= 0` or `window_seconds <= 0`.
- `allow(channel, dedupe_key)` returns `(allowed, retry_after_seconds)`.
- A channel may send at most `limit` unique dedupe keys per <span data-glossary="rolling-quota">rolling window</span>.
- Dedupe keys are scoped per channel (the same key may be allowed on another channel).
- Repeating the same dedupe key inside the window is blocked without consuming a new slot.
- Check duplicates before capacity, so a duplicate in a full channel uses its own retry delay.
  Denied attempts leave the record set and accepted timestamps unchanged.
- Expired records for the requested channel are removed on every call. A record expires when
  `now - timestamp >= window_seconds` (half-open window).
- `retry_after_seconds` is `0` when allowed.
- On capacity deny: `retry_after_seconds = max(0, window_seconds - (now - oldest_active_timestamp))`.
- On duplicate-key deny: the same formula using that key's stored timestamp.

## Example

This trace separates duplicate denial from capacity denial, then crosses the half-open expiry boundary so a new key can enter.

```python
clock = {"now": 0.0}
limiter = NotificationLimiter(2, 10.0, lambda: clock["now"])
assert limiter.allow("slack", "a") == (True, 0.0)
assert limiter.allow("slack", "a") == (False, 10.0)  # duplicate: full window remains
assert limiter.allow("slack", "b") == (True, 0.0)
assert limiter.allow("slack", "c") == (False, 10.0)  # channel is at capacity
clock["now"] = 10.0
assert limiter.allow("slack", "c") == (True, 0.0)
```

## Constraints

- Use injected time. Keep tests free of sleeps.
- `limit` is an integer; time and window values are finite seconds. The injected clock is nondecreasing.
- Calls are sequential. Synchronizing concurrent callers is a follow-up.
- Keep channels isolated.
