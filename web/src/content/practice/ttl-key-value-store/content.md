A cached value should have one exact moment when it stops being visible, and a test shouldn't need to sleep to reach it. Build an in-memory `Store` with `set`, `get`, `delete`, and `scan` around a <span data-glossary="ttl-deadline">time-to-live (TTL) deadline</span>.

## Requirements

- `Store(now)` receives a zero-argument clock function.
- `set(key, value, ttl=None)` stores a value. `ttl` is measured in seconds.
- Keys, prefixes, and values are strings. Empty strings are valid; stored `None` / Java `null` values are outside scope.
- Each operation samples the clock once. A TTL deadline is that sample plus `ttl`; a scan checks every key against its one sample.
- A zero or negative TTL makes the new value immediately expired, including when it replaces a live value.
- Overwriting a key replaces both its value and expiry; `ttl=None` clears any prior expiry.
- `get(key)` returns the value or `None` when missing or expired.
- `delete(key)` removes a key and returns `True` if it existed and was not expired.
- `scan(prefix)` returns sorted `(key, value)` pairs for non-expired keys whose key starts with `prefix`.
- Expiry is inclusive: a key is expired when `now() >= expires_at`.
- An empty prefix matches all live keys. Scan results are sorted lexicographically by key in the chosen language.

## Example

A value written at time `0` with `ttl=10` stays visible at `9.999` and expires at exactly `10`. Overwriting it without a TTL clears the old deadline, so the stale expiry cannot remove the replacement.

The following assertions test that inclusive expiry boundary:

```python
clock = {"t": 0}
store = Store(lambda: clock["t"])
store.set("user:1", "Ada", ttl=10)
assert store.get("user:1") == "Ada"
clock["t"] = 10
assert store.get("user:1") is None
```

## Constraints

- Don't use `sleep` in tests or implementation.
- Use standard-library Python only.
- Calls are sequential; the injected clock is finite and nondecreasing, and TTL deadlines are finite.
- Apply the same expiry rule on reads, deletes, and prefix scans.
