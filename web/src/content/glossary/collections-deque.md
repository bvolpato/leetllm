---
title: collections.deque
aliases: ["deque", "double-ended queue", "double ended queue"]
importance: 54
kind: code
---
`collections.deque` (pronounced "deck") is Python's double-ended queue: amortized $O(1)$ appends and pops on **either** end. A plain `list` is fast only at the right end; `list.pop(0)` and `list.insert(0, x)` cost $O(n)$ because every later element shifts. When the hot path is a FIFO queue, a stack, a sliding window, or a BFS frontier, `deque` is the standard-library tool that matches those access patterns.

## Intuition

Name the policy in the variable alongside the container type. The same container implements several shapes:

| Policy | "In" | "Out" | Typical use |
|--------|------|-------|-------------|
| FIFO queue | `append` | `popleft` | Ready work, crawler URLs, token streams |
| Stack (LIFO) | `append` | `pop` | DFS, undo, nested tool frames |
| Sliding window | `append` with `maxlen` | auto-drop oldest | Rolling latency, last-$N$ events |
| Double-ended buffer | mix of left/right | mix | Round-robin, rotate-based recipes |

Indexed access is $O(1)$ at both ends (`d[0]`, `d[-1]`) but degrades toward $O(n)$ in the middle. Prefer a `list` when you need random access or heavy slicing; prefer a `deque` when ends dominate.

## How it works

Construct with an optional seed and optional bound:

```python
from collections import deque

q = deque(["a", "b"])       # left-to-right from iterable
bounded = deque(maxlen=100) # maxlen is read-only after construction
```

Core end operations:

- `append` / `appendleft`, `pop` / `popleft`: amortized $O(1)$
- `extend` / `extendleft`: $O(k)$ for $k$ items (`extendleft` reverses the input order as it left-appends)
- `rotate(n)`: moves items right by $n$ steps (or left if $n < 0$). CPython reduces the distance modulo the length and chooses the shorter equivalent rotation; work scales with that effective distance, with $O(len(d))$ worst case, rather than the magnitude of an arbitrarily large $n$.

Empty `pop` / `popleft` raises `IndexError`. Membership `x in d` and `index` / `remove` / `insert` are linear scans; do not put those on a hot path over large deques.

**Bounded `maxlen`.** When the deque is full and you `append`, the **leftmost** item is discarded so length stays at `maxlen`. `appendleft` discards from the right. That is silent eviction, not backpressure: producers never block, memory stays capped, and old data is gone. For producer-wait semantics use a bounded `queue.Queue` or `asyncio.Queue` instead.

The bound limits retained entries, not their total byte size. `maxlen=0` retains none. In contrast to end appends, `insert(i, x)` into an already full bounded deque raises `IndexError` instead of evicting an item. [Python deque documentation](https://docs.python.org/3/library/collections.html#collections.deque)

**Thread notes.** Python documents thread-safe end appends and pops. That does not make a multi-operation protocol atomic: `if d: d.popleft()` can race with another consumer, and iterating while another thread mutates the deque is not a stable snapshot. Use a lock or `queue.Queue` when those coordinated behaviors are required. `deque` is an in-process structure, not a durable or multi-host broker.

## Example

**FIFO work queue.** Jobs enter on the right and leave on the left so arrival order is preserved:

```python title="deque-fifo.py"
from collections import deque

ready: deque[str] = deque()
ready.append("embed-chunk-1")
ready.append("embed-chunk-2")
next_job = ready.popleft()  # "embed-chunk-1"
```

**Bounded sliding window of latencies.** Keep the last $100$ samples for a rolling mean without manual eviction:

```python title="deque-window.py"
from collections import deque

latencies_ms: deque[float] = deque(maxlen=100)
for sample in (12.0, 15.0, 11.0, 40.0):
    latencies_ms.append(sample)

# After 100+ appends, len stays 100; oldest samples fall off the left.
window_mean = sum(latencies_ms) / len(latencies_ms)
```

With `maxlen=3` and samples $[12, 15, 11, 40]$, the deque holds $[15, 11, 40]$ after the fourth append; $12$ was discarded automatically.

**BFS frontier.** Level-order graph walk needs cheap left pops:

```python title="deque-bfs.py"
from collections import deque

graph = {"A": ["B", "C"], "B": ["D"], "C": [], "D": []}
seen = {"A"}
frontier: deque[str] = deque(["A"])

while frontier:
    node = frontier.popleft()
    for nxt in graph[node]:
        if nxt not in seen:
            seen.add(nxt)
            frontier.append(nxt)

assert seen == {"A", "B", "C", "D"}
```

Using a `list` and `pop(0)` here is correct but $O(n)$ per pop and becomes a quiet quadratic trap on large frontiers.


## Trade-offs

| Need | Prefer |
|------|--------|
| Fast ends, single thread or simple handoff | `collections.deque` |
| Threads that block / join / `task_done` | `queue.Queue` |
| Coroutines on one event loop | `asyncio.Queue` |
| Smallest priority / next deadline | `heapq` |
| Random access, sort, slice | `list` |
| Survive process death or span hosts | Redis, SQS, or another broker |

`maxlen` bounds memory but drops data. That is the right tool for "last $N$ metrics," not for "never lose a job." For jobs, bound the queue and make producers wait or reject.

## Why it matters here

LLM and ML engineering code is full of ordered buffers: crawler frontiers, chunk ready queues, retry buffers, decode-side event rings, and rolling latency windows for SLO checks. Interview problems (BFS, sliding window maximum with a monotonic deque, rate windows) use the same container. Choosing `deque` over `list.pop(0)` is a correctness-of-complexity choice; choosing `deque` over `queue.Queue` is a concurrency-contract choice. Get the policy and the bound right, and the rest of the pipeline stays predictable.

## Related terms

- [queue.Queue](glossary://queue-queue)
- [asyncio.Queue](glossary://asyncio-queue)
- [FIFO work queue](glossary://fifo-work-queue)
- [heapq](glossary://heapq)
- [Backpressure](glossary://backpressure)
