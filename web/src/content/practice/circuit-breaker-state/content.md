Repeated failures can trigger a wave of retries just as a dependency is struggling. Let a small <span data-glossary="circuit-breaker">circuit breaker</span> pause calls, wait through a cooldown, and then allow one probe to see whether the service has recovered.

## Requirements

- Define `CircuitBreaker(failure_threshold, cooldown_seconds, now)`.
- `allow()` returns whether a request may be attempted.
- `record_success()` records a successful attempt.
- `record_failure()` records a failed attempt.
- `state()` returns `"closed"`, `"open"`, or `"half_open"`.
- In `closed`, requests are allowed and consecutive failures are counted.
- A success while `closed` resets the consecutive-failure count to zero.
- Reaching `failure_threshold` opens the breaker.
- In `open`, requests are blocked until cooldown has elapsed.
- The open → half_open transition happens only inside `allow()` when cooldown has elapsed. `state()` must not transition or report half_open solely because cooldown elapsed. Until `allow()` permits the probe, `state()` stays `"open"`.
- After cooldown, exactly one trial request is allowed while `half_open`. Further `allow()` calls return `False` until that trial is recorded as success or failure.
- A half-open success closes the breaker; a half-open failure opens it again.

## Example

```python
clock = {"t": 0}
breaker = CircuitBreaker(2, 10, now=lambda: clock["t"])
breaker.record_failure()
breaker.record_failure()
assert breaker.state() == "open"
assert not breaker.allow()
clock["t"] = 10
assert breaker.state() == "open"  # cooldown alone doesn't half-open
assert breaker.allow() is True
assert breaker.state() == "half_open"
assert breaker.allow() is False  # only one half-open trial
breaker.record_success()
assert breaker.state() == "closed"

breaker.record_failure()
breaker.record_success()
breaker.record_failure()
assert breaker.state() == "closed"  # success reset the consecutive-failure count
```

## Constraints

- Count consecutive failures only while closed.
- Ignore `record_success` and `record_failure` while `open` because no probe was allowed. An open-state record leaves `opened_at` unchanged.
- Use deterministic injected time.
- Avoid hidden background timers.
- `failure_threshold` is a positive integer; `cooldown_seconds` is finite and nonnegative. `now()` returns finite, nondecreasing time in seconds. Equality at the cooldown boundary permits the trial.
- Calls are serialized. While closed, records represent completed attempts and can be submitted directly. While half-open, the next record belongs to the single permitted trial; no old attempt completes during that trial. Handling overlapping attempts would require request identities or generations in addition to this API.

The clock measures elapsed time, so a real caller can inject [`time.monotonic`](https://docs.python.org/3/library/time.html#time.monotonic). A failed trial restarts cooldown from its failure time, not the original opening time. For example, opening at `0` with cooldown `5`, then failing a probe at `7`, blocks the next probe until `12`.
