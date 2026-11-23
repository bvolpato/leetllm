Track a rolling <span data-glossary="token-budget">token budget</span> per key with deterministic expiry. Unlike a continuously refilling bucket, each accepted spend returns to the budget only when that exact event ages out of its window.

## Requirements

- Define `TokenBudget(limit, window_seconds, now)`.
- `spend(key, tokens)` records spend if it fits the current rolling window.
- Return `True` when spend is accepted, otherwise `False`.
- A rejected spend must not add an event or consume budget. Expiry may still restore older spend as time advances.
- `remaining(key)` returns remaining tokens in the current window.
- Events expire when `now() - event_time >= window_seconds`.
- Expired spend must not count on reads or writes.
- Different keys are independent.
- Zero-token spend is allowed when it fits (`tokens == 0`); only negative spends are rejected for sign.
- `remaining` on a never-seen key is the full `limit`.
- Sample `now()` once at the start of each operation. Use that same timestamp for expiry and any accepted event, even if the injected clock advances when called.

## Example

For a `10`-token limit and a `60`-second window, the expiry boundary is exact:

| Time | Operation | Accepted? | Remaining budget |
|---:|---|---|---:|
| `0` | spend `7` | yes | `3` |
| `20` | spend `4` | no | `3` |
| `59` | read remaining | not applicable | `3` |
| `60` | read remaining | not applicable | `10` |

The rejected four-token request creates no hidden event. These assertions exercise that invariant directly:

```python
clock = {"t": 0}
budget = TokenBudget(10, 60, now=lambda: clock["t"])
assert budget.spend("org", 7)
assert budget.remaining("org") == 3
assert not budget.spend("org", 4)
assert budget.remaining("org") == 3
clock["t"] = 59
assert budget.remaining("org") == 3
clock["t"] = 60
assert budget.remaining("org") == 10
```

Each event has its own expiry. Spending 3 tokens at time 0 and 4 at time 1 under a five-second window restores only the first 3 at time 5; the other 4 remain charged until time 6. Resetting an entire key's balance at the first expiry would permit too much spend.

## Constraints

- `limit` is a nonnegative integer and `window_seconds` is a finite positive number. The constructor can assume these input preconditions.
- Token counts are integers. Return `False` for negative counts or counts above the limit; zero consumes no budget.
- Use injected finite, nondecreasing time in seconds. This order is what makes head-only deque expiry correct.
- Keys are hashable identifiers with stable equality. Operations run sequentially in one process; distributed or concurrent quota coordination is outside this exercise.
- Don't allow negative spends.
- Don't share spend across keys.
- Purge expired events before both `spend` and `remaining`.
