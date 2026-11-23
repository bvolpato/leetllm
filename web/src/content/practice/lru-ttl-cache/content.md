# LRU TTL Cache

If a request keeps using one cache key, its recent access should protect it from eviction. A deadline has the final say, though: an expired value must be treated as missing even if it is popular. Model both rules in a bounded cache.

Use <span data-glossary="lru-cache">least-recently-used (LRU)</span> eviction and optional <span data-glossary="ttl-deadline">time-to-live (TTL)</span> expiry. Recency chooses among live entries; an expired TTL deadline always takes priority.

## Requirements

- Define `LRUTTLCache(capacity, now)`.
- `put(key, value, ttl=None)` stores a value. For an existing live key, overwrite the value, move it to most recently used, and replace its TTL from `now()` (`ttl=None` means no expiry).
- `get(key)` returns the value or `None` when missing or expired.
- `get` marks a key as most recently used.
- When capacity is exceeded, evict expired entries first, then least recently used entries. Cleanup of expired keys must happen on `put` when reclaiming capacity, independent of any earlier `get` for the expired key.
- Expiry is inclusive: a key is expired when `now() >= expires_at`.
- A non-positive capacity stores no entries. A non-positive TTL expires immediately.

## Example

This trace makes `a` most recently used, evicts `b`, then advances the injected clock to `a`'s inclusive expiry boundary.

```python
clock = {"now": 0.0}
cache = LRUTTLCache(capacity=2, now=lambda: clock["now"])
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
- Don't use `functools.lru_cache`.
- `capacity` is an integer. Keys are strings; values may be any Python object. A stored `None` is indistinguishable from a miss through this API.
- Calls are serialized. `now()` returns finite, nondecreasing seconds; TTLs are finite seconds or `None`. A successful read changes recency but never extends the deadline.
- Writing an expired key creates a fresh entry. Writing a non-positive TTL over a live key invalidates its old value immediately and must not evict another live key to retain the expired replacement.
