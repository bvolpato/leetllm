When a provider times out, retrying immediately can add pressure just as it is struggling. Plan deterministic <span data-glossary="retry-backoff">retry-backoff</span> for retryable failures, and make the attempt budget visible so callers know when to stop.

## Requirements

- Define `RetryPolicy(max_attempts, base_delay, max_delay, retryable_errors)`.
- `next_delay(attempt, error_code)` returns the delay before the next try.
- `attempt` is the failed attempt number, starting at `1` for the first failure.
- Return `None` if the error isn't retryable.
- Return `None` if `attempt >= max_attempts`.
- Otherwise return exponential backoff:
  `base_delay * 2 ** max(0, attempt - 1)`.
  The `max(0, …)` clamp keeps the exponent non-negative if `attempt < 1` (e.g. `attempt=0` uses exponent `0` and returns `base_delay` before the cap).
- Cap the delay at `max_delay`.
- Constructor inputs are valid: `max_attempts` is a positive integer; delays are finite nonnegative numbers in seconds; `attempt` is an integer. Zero delay means retry immediately, while `None` means stop.
- The policy only plans a delay. It doesn't sleep, count failures, or perform the retry; the caller supplies the failed-attempt number each time.

## Example

Four total attempts allow three retry delays. After the fourth failure, the budget is exhausted:

```python
policy = RetryPolicy(4, 0.5, 5, {"timeout"})
assert policy.next_delay(1, "timeout") == 0.5
assert policy.next_delay(4, "timeout") is None
```

| Failed attempt | Delay before another attempt | Next attempt |
| --- | --- | --- |
| 1 | 0.5 seconds | 2 |
| 2 | 1 second | 3 |
| 3 | 2 seconds | 4 |
| 4 | `None` | Stop |

The waiting time is 3.5 seconds if all four attempts fail, excluding time spent on requests. `max_attempts` counts the initial call too rather than four additional retries. When `attempt <= 0`, the clamped exponent is `0`, so the policy checks retryability, attempt budget, and `max_delay` against `base_delay`.

## Cap before exponential overflow

With a very large allowed attempt count, the mathematical delay can dwarf the cap. Computing `2 ** 9999` and converting it to a Python float can raise `OverflowError` before `min` gets to apply the cap. The solution uses floating-point exponent scaling, handles overflow by returning the cap, and handles a zero base delay separately. A zero base stays zero even on attempt 10,000.

## Constraints

- Don't use randomness.
- Keep decisions deterministic and testable.
- Treat unknown errors as non-retryable.
- In production, combine this deterministic delay calculation with <span data-glossary="jitter">jitter</span>, `Retry-After` handling, and <span data-glossary="idempotency">idempotency</span> checks.
