---
title: time.monotonic
aliases: ["monotonic clock"]
importance: 54
kind: code
---
`time.monotonic()` returns the value of a **monotonic clock**: a clock that never goes backward. Values are fractional seconds from an **undefined origin**, so only the difference between two reads is meaningful. Use readings for elapsed-time calculations on the same host and boot; use wall-clock timestamps for calendar records and cross-host coordination. System clock updates that step civil time (NTP steps, admin `date` / `settimeofday`) leave this clock progressing forward.

Use it for **elapsed-time math**: timeouts, latency, TTL age, retry schedules, token-bucket refill, and deadline remaining. Use wall-clock time (`time.time()`, timezone-aware `datetime`) for **calendar answers**: logs, DB `created_at`, signed token expiry, cross-host coordination.

## Intuition

Two different questions need two different clocks.

| Question | Clock | Why |
|---|---|---|
| How long has this request been running? | `time.monotonic()` | Must not shrink when the OS clock steps |
| What calendar time did this event happen? | wall clock | Humans, databases, and other hosts share civil time |

Wall clock is a calendar. Monotonic is a stopwatch. If NTP steps the wall clock back by 30 seconds while you are mid-timeout, a wall-based deadline can fire late, never, or immediately. A monotonic deadline keeps the same elapsed interval regardless of that step.

PEP 418 and the Python documentation specify an undefined origin. Use readings for same-host elapsed-time differences and wall-clock timestamps for calendar records. Current Python documents the clock as the same across processes, so a process restart alone need not invalidate a reading on the same host and boot. Comparisons remain host- and boot-local; reboot, host changes, or a different clock domain invalidate them.

## Formula

For a budget of $T$ seconds started at monotonic reading $t_0$:

$$
\mathrm{elapsed}(t) = t - t_0,\qquad
\mathrm{remaining}(t) = T - (t - t_0),\qquad
\mathrm{expired}(t) \iff t \ge t_0 + T.
$$

For a TTL written at $t_w$ with duration $\tau$:

$$
\mathrm{expires\_at} = t_w + \tau,\qquad
\mathrm{stale}(t) \iff t \ge \mathrm{expires\_at}.
$$

$t$, $t_0$, and $t_w$ must all come from the **same** monotonic clock. Mixing wall and monotonic readings in one subtraction is undefined and often silent.

## Example

A streaming LLM client must cancel if the whole turn exceeds 8 seconds, including tool calls. Capture the start once, check remaining budget before each hop, and inject `now` so tests do not sleep.

```python title="monotonic-deadline.py"
from typing import Callable
import time


def has_budget(
    start: float,
    timeout_s: float,
    now: Callable[[], float] = time.monotonic,
) -> bool:
    return now() - start < timeout_s


def remaining(
    start: float,
    timeout_s: float,
    now: Callable[[], float] = time.monotonic,
) -> float:
    return max(0.0, timeout_s - (now() - start))


# Production: one stopwatch for the whole turn
start = time.monotonic()
timeout_s = 8.0

# ... retrieval / prefill / tool hop ...
if not has_budget(start, timeout_s):
    raise TimeoutError("turn budget exhausted")

# Pass the remaining budget to the next hop; zero means do not start it
hop_timeout = min(2.0, remaining(start, timeout_s))
if hop_timeout <= 0:
    raise TimeoutError("turn budget exhausted")
# call_provider(..., timeout=hop_timeout)

# Tests: advance a fake clock; never sleep
clock = {"t": 100.0}
assert has_budget(100.0, 8.0, now=lambda: clock["t"])
clock["t"] = 107.999
assert has_budget(100.0, 8.0, now=lambda: clock["t"])
clock["t"] = 108.0
assert not has_budget(100.0, 8.0, now=lambda: clock["t"])
```

## Worked numbers

Suppose a request starts at wall $W_0 = 1\,000$ and monotonic $M_0 = 50$, with a 5 s deadline.

| Event | Wall $W$ | Mono $M$ | Wall remaining $5 - (W-W_0)$ | Mono remaining $5 - (M-M_0)$ |
|---|---:|---:|---:|---:|
| Start | 1000.0 | 50.0 | 5.0 | 5.0 |
| After 2 s real work | 1002.0 | 52.0 | 3.0 | 3.0 |
| NTP steps wall back 10 s | 992.0 | 52.0 | **13.0** (wrong) | **3.0** (correct) |
| After 3 more real seconds | 995.0 | 55.0 | 10.0 (still open) | **0.0** (expired) |

With the wall clock, the deadline stretches by the NTP step and the request overruns its latency budget. With monotonic, expiry stays tied to real elapsed time. The reverse step (wall jumps forward) can make wall-based timeouts fire early and cancel healthy work.

## How it works

1. **API contract (Python 3.3+, PEP 418).** `time.monotonic()` returns fractional seconds. It cannot go backward and is not affected by system clock *updates* that jump civil time. Only differences are valid. `time.monotonic_ns()` returns the same clock as an `int` nanosecond count when float precision matters over long uptimes.
2. **OS backends.** CPython picks a platform monotonic source, for example:
   - Linux/Unix: typically `clock_gettime(CLOCK_MONOTONIC)` (or `CLOCK_HIGHRES` on Solaris when available)
   - Windows: `QueryPerformanceCounter` / frequency (current docs)
   - macOS: `mach_absolute_time` + timebase
3. **System clock updates.** Discontinuous wall jumps (admin set, large NTP step) leave the monotonic reading moving forward. On Linux, `CLOCK_MONOTONIC` can still be **frequency-slewed** by NTP/`adjtime` so long intervals stay closer to true elapsed time; `CLOCK_MONOTONIC_RAW` skips that slew. For timeouts and budgets, the Python monotonic clock is the right default.
4. **Suspend / sleep.** Behavior across machine suspend is OS-defined. On Linux, `CLOCK_MONOTONIC` pauses while the system is suspended; `CLOCK_BOOTTIME` continues advancing. A frozen container or sleeping thread on a running host is different: the host's monotonic clock keeps advancing. For suspend-aware intervals on Linux, use `time.clock_gettime(time.CLOCK_BOOTTIME)`; `time.monotonic()` excludes sleep-to-RAM time.
5. **Related Python clocks.**

| Function | Measures | Goes backward? | Typical use |
|---|---|---|---|
| `time.monotonic()` | Elapsed real time (stopwatch) | No | Timeouts, TTL age, rate-limit refill |
| `time.perf_counter()` | Highest-resolution short interval (CPython: same clock family as monotonic) | No | Benchmarks, micro-latency |
| `time.time()` | Civil / Unix time | Yes, if clock steps | Logs, DB stamps, JWT `exp` |
| `time.process_time()` | Process CPU time (excludes sleep) | N/A (CPU, not wall) | Profiling compute, not SLOs |

For latency SLOs and request budgets, prefer monotonic (or `perf_counter` for short probes). For "when did the user click?", use wall time with an explicit timezone.


## Trade-offs

| Choice | Strength | Failure mode |
|---|---|---|
| Monotonic for deadlines | Stable under wall steps | Undefined origin; suspend may not count; not shareable across hosts |
| Wall for deadlines | Human-readable absolute times | NTP/admin steps break remaining-time math |
| Persist monotonic values | Tempting for "expires_at" | Invalid across reboot/host changes; requires explicit clock-domain identity even when process restart preserves the clock |
| Nested budgets with one start | Remaining-time accounting shares one deadline | Child timeout semantics, scheduler delay, or cleanup can still overspend; pass remaining budget and enforce cancellation |

## Debug path

When a timeout "never fires," "fires instantly," or latency math disagrees with wall logs:

1. **Grep the path for clock reads.** Mixed `time.time()` and `time.monotonic()` in one formula is the usual bug.
2. **Confirm equality at the boundary.** Decide `t >= deadline` vs `t > deadline`, document it, and unit-test $t = t_0 + T$.
3. **Replay with an injected clock** (see [injected now](glossary://injected-now)). Advance past the deadline in a test instead of sleeping in CI.
4. **Check suspend and migration.** If elapsed looks short after a laptop sleep or live migration, compare monotonic vs boottime/wall.
5. **Never treat monotonic as a durable timestamp.** Persist wall times for audit; recompute process-local deadlines from a fresh `time.monotonic()` base after restart.

## Why it matters here

AI request paths are soft real-time systems: retrieval TTLs, prompt-cache validity, streaming cancel, provider hop timeouts, token-bucket refill, retry spacing, eval harness budgets, and [latency budget](glossary://latency-budget) accounting all need **stable elapsed intervals**. Wall-clock jumps turn those controls into heisenbugs (stuck streams, leaked concurrency, runaway retries, or premature cancel). `time.monotonic()` is the standard library answer for that math; pair it with injected clocks in tests so budgets are deterministic.

## Related terms

- [Deadlines and TTL](glossary://ttl-deadline)
- [injected now function](glossary://injected-now)
- [Token bucket](glossary://token-bucket)
- [Latency budget](glossary://latency-budget)
- [Retry backoff](glossary://retry-backoff)
