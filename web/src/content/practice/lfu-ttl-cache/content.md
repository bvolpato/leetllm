# LFU TTL Cache

A frequently used key may deserve to stay in a cache, but an expired value must stop being returned once its deadline passes. Track both signals in a bounded cache with <span data-glossary="least-frequently-used-cache">least-frequently-used (LFU)</span> eviction and optional <span data-glossary="ttl-deadline">time-to-live (TTL)</span> expiry.

LFU counts successful accesses; a TTL deadline removes an entry when its lifetime runs out, regardless of frequency.

## Requirements

- Define `LFUTTLCache(capacity, now)`.
- `put(key, value, ttl=None)` stores a value.
- `get(key)` returns the value or `None` when missing or expired.
- A successful `get` increments the key frequency.
- Updating an existing live key updates its value and TTL, and counts as an access. Passing `ttl=None` removes any previous expiration.
- New keys start with frequency `1`.
- When capacity is exceeded, evict expired entries first, then the key with lowest frequency.
- If multiple keys have the same lowest frequency, evict the least recently used key within that frequency.
- Expiry is inclusive: a key is expired when `now() >= expires_at`.
- A non-positive capacity stores no entries. A non-positive TTL expires immediately.
- An immediately expired `put` removes that key if present and doesn't evict another live key. Re-inserting an expired key starts at frequency `1`.

## Example

This trace raises `a` above `b` in frequency, evicts `b`, then advances the injected clock to `a`'s inclusive expiry boundary.

```python
clock = {"now": 0.0}
cache = LFUTTLCache(capacity=2, now=lambda: clock["now"])
cache.put("a", 1, ttl=5)
cache.put("b", 2)
assert cache.get("a") == 1
cache.put("c", 3)
assert cache.get("b") is None
clock["now"] = 5.0
assert cache.get("a") is None
```

## Constraints

- Use standard-library Python only.
- `capacity` is an integer; keys are strings. `now` returns finite, nondecreasing numeric timestamps, and TTLs are finite numbers or `None`, in the same time units. Evaluate each operation against one clock snapshot.
- Prefer `dict` plus <span data-glossary="ordered-dict">ordered</span> frequency buckets over a full scan on every eviction.
