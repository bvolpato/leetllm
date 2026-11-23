Implement a per-key <span data-glossary="token-bucket">token bucket</span> limiter. Each caller owns a refillable balance, so one caller's burst must never spend another caller's capacity.

## Requirements

- Define `Decision(allowed, retry_after, reason)`.
- Define `TokenBucketLimiter(capacity, refill_rate_per_second, now)`.
- `allow(key, cost=1)` returns a `Decision`.
- Each key has an independent bucket that starts at full capacity.
- Tokens refill continuously based on elapsed time and never exceed `capacity`.
- A blocked request does not consume tokens.
- Enforce a monotonic per-key refill watermark: if `now()` moves backward (`now() < last_refill_time`), clamp `effective_now = max(now(), last_refill_time)` so elapsed time is zero, existing tokens are never subtracted, and `last_refill_time` stays at its previous higher value. Returning to `last_refill_time` later produces zero refill credit; tokens resume refilling only after `now()` advances past `last_refill_time`.
- If a request is blocked, `retry_after` is the token-deficit delay `(cost - tokens) / refill_rate_per_second` from the preserved refill watermark, assuming forward clock progress from that watermark and no intervening consumption. It does not reserve tokens.
- When a request is allowed: `reason == "allowed"` and `retry_after == 0`.
- When a request is blocked: `reason == "rate_limited"` and
  `retry_after == (cost - tokens) / refill_rate_per_second` (using the bucket's current tokens after refill).
- Assume finite values with `capacity > 0`, `0 < cost <= capacity`, and `refill_rate_per_second > 0`.

## Example

The following clock trace starts with capacity `2` and a refill rate of `1` token per second:

| Time | Request cost | Tokens before decision | Decision | Tokens afterward |
|---:|---:|---:|---|---:|
| `0.0` | `2` | `2` | allowed | `0` |
| `0.5` | `1` | `0.5` | blocked, retry after `0.5` | `0.5` |
| `1.0` | `1` | `1` | allowed | `0` |

The blocked middle request leaves its half-token intact. The runnable assertions below cover the full-bucket and empty-bucket boundaries:

```python
clock = {"t": 0.0}
limiter = TokenBucketLimiter(capacity=2, refill_rate_per_second=1, now=lambda: clock["t"])
assert limiter.allow("org").allowed
assert limiter.allow("org").allowed
blocked = limiter.allow("org")
assert not blocked.allowed and blocked.retry_after == 1
assert blocked.reason == "rate_limited"
full = TokenBucketLimiter(3, 1, now=lambda: 0).allow("org", cost=3)
assert (full.allowed, full.retry_after, full.reason) == (True, 0, "allowed")
```

## Constraints

- Use deterministic injected time.
- Use standard-library Python only.
- Keys are hashable and calls are sequential. Thread safety is a follow-up.
- Preserve the last valid refill timestamp when the injected clock moves backward.
