---
title: queue.PriorityQueue
aliases: ["PriorityQueue"]
importance: 54
kind: code
---
`queue.PriorityQueue` is Python's **thread-safe, blocking priority queue**. Producers call `put`; consumers call `get`. Entries are stored with the [`heapq`](https://docs.python.org/3/library/heapq.html) module, so the **lowest-valued** entry is returned first (the same order as `min(entries)`). Locks and condition variables make multi-producer / multi-consumer use safe without writing mutexes by hand.

It is the priority-ordered sibling of [`queue.Queue`](glossary://queue-queue) (FIFO) and `queue.LifoQueue` (stack). Same blocking API and unfinished-work accounting; only the retrieve order changes.

## Intuition

Two contracts share one object:

1. **Ordering:** next work is the smallest entry, not the earliest arrival.
2. **Coordination:** a worker that finds the queue empty **blocks** until a producer enqueues something (or a timeout / shutdown fires). A producer that finds a full bounded queue **blocks** until a consumer frees a slot.

That combination is what you want when real OS threads share an in-process job buffer and urgency matters more than arrival order: interactive LLM requests ahead of bulk embeds, high-SLO tenants ahead of free-tier batch, deadline-sensitive retries ahead of housekeeping.

Under the hood it is still a **min-heap**. `PriorityQueue` is not a different algorithm from `heapq`; it is `heapq` plus a lock, blocking wait, `maxsize` backpressure, and `task_done` / `join` bookkeeping. The tradeoff is that every `put` / `get` pays for that coordination. Single-threaded code that only needs "next best item" should use `heapq` on a list instead.

## How it works

**Construction.** `PriorityQueue(maxsize=0)` creates an unbounded queue when `maxsize <= 0`. With a positive `maxsize`, `put` blocks (or raises `Full` if non-blocking) once that many items are waiting. That bound is the usual in-process [backpressure](glossary://backpressure) knob.

**Ordering.** On each `get`, the queue returns the entry that would win `min(entries)`. The [official docs](https://docs.python.org/3/library/queue.html#queue.PriorityQueue) recommend the pattern:

$$
(\textit{priority\_number},\ \textit{data})
$$

with **smaller** `priority_number` meaning **higher** urgency. If `data` is not comparable, equal priorities fall through to comparing `data` and can raise `TypeError`. Two standard fixes (also in the `heapq` priority-queue notes):

| Pattern | Shape | Role of the middle field / wrapper |
|---------|--------|-------------------------------------|
| Sequence tie-breaker | `(priority, sequence, payload)` | Unique `sequence` from `itertools.count()` so ties never compare payloads |
| Dataclass wrapper | `@dataclass(order=True)` `PrioritizedItem` with `item: Any = field(compare=False)` | Only `priority` participates in ordering (`order=True` is required so comparisons exist) |

**API surface** (same as `queue.Queue`):

| Method | Behavior |
|--------|----------|
| `put(item, block=True, timeout=None)` | Enqueue; may wait for space |
| `get(block=True, timeout=None)` | Dequeue lowest entry; may wait for work |
| `put_nowait` / `get_nowait` | Raise `Full` / `Empty` instead of blocking |
| `task_done()` | Mark one fetched item fully processed |
| `join()` | Block until unfinished count reaches zero |
| `shutdown(immediate=False)` | Stop growth; wind down or drain (Python 3.13+) |

Unfinished-work accounting is independent of the heap:

- Every successful `put` increments an unfinished-task counter.
- Each consumer must call `task_done()` once per `get()` (typically in a `finally`).
- `join()` returns only when that counter is zero.

Skip `task_done()` and `join()` hangs forever. Call it too often and you get `ValueError`.

**Complexity.** Heap insert and extract-min are $O(\log n)$ in the number of waiting items. The lock serializes concurrent `put`/`get`, so high contention adds wall-clock cost beyond the heap arithmetic. Approximate size checks (`qsize`, `empty`, `full`) are not atomic with a following `get`/`put`; they are hints, not exclusive claims.

**Scope and alternatives.** This queue coordinates OS threads within one process. Use `multiprocessing.Queue` or a broker for multiple processes, and [`asyncio.PriorityQueue`](glossary://asyncio-queue) for coroutines on one event loop. Its entries live in process memory, so work does not survive process death. Fairness, aging, and SLO mapping belong in policy layered on top of the heap.

## Example

A small serving helper prefers interactive chat over background embedding on a shared thread pool. Lower priority numbers win. A monotonic sequence breaks ties and keeps payloads out of comparisons.

```python title="thread-priority-queue.py"
from itertools import count
from queue import PriorityQueue
from threading import Thread

# (priority, sequence, kind, job_id)
# priority: 0 = interactive, 10 = batch
jobs: PriorityQueue[tuple[int, int, str, str]] = PriorityQueue(maxsize=256)
seq = count()


def worker(name: str) -> None:
    while True:
        priority, _, kind, job_id = jobs.get()
        try:
            print(name, "running", kind, job_id, "p=", priority)
            # call model / embedder here
        finally:
            jobs.task_done()


jobs.put((10, next(seq), "embed", "batch-77"))
jobs.put((0, next(seq), "chat", "sess-19"))
jobs.put((0, next(seq), "chat", "sess-20"))
jobs.put((10, next(seq), "embed", "batch-78"))

for i in range(2):
    Thread(target=worker, args=(f"w{i}",), daemon=True).start()

jobs.join()
# All four jobs were queued before workers started, so dequeue order is chat first.
# Printed/start/finish order across two workers can still differ.
```

**Worked order.** With all four entries waiting, the first `get` yields `(0, …, "chat", "sess-19")`, then `(0, …, "chat", "sess-20")`, then the two embeds. The unique sequence preserves FIFO dequeue order within a priority. If workers had started before the `put`s, they could already have claimed `batch-77` before either chat arrived: priority orders currently waiting jobs and does not preempt in-flight work.

Without the sequence field, two equal-priority chats whose job ids were non-orderable objects (dicts, custom classes without `__lt__`) would raise `TypeError` during heap sifting when priorities tied.

## Diagram


Producers and consumers never touch the heap without the queue's lock. Blocking `get` sleeps until a `put` (or shutdown); bounded `put` sleeps until a `get` frees capacity.

## Trade-offs

| Need | Prefer |
|------|--------|
| OS threads + priority order | `queue.PriorityQueue` |
| OS threads + pure FIFO | `queue.Queue` |
| Single thread, no blocking | `heapq` on a `list` |
| Coroutines on one event loop | `asyncio.PriorityQueue` |
| Multi-process or multi-host durability | Redis, SQS, Kafka, etc. |
| Strict fairness / no starvation | Separate lanes, aging, quotas; not a bare heap alone |

**What fails in production**

- **Starvation.** A continuous stream of priority-0 work never lets priority-10 work run. That is correct min-heap behavior and a bad product policy. Add aging (raise effective priority with age), reserved worker capacity per class, rate limits on urgent classes, or separate queues with weighted drain.
- **Missing sequence / wrapper.** Equal priorities + unorderable payloads → `TypeError` deep inside a worker, often intermittent.
- **Missing `task_done`.** Exceptions that skip the `finally` leave `join()` blocked; deploys hang on shutdown.
- **Unbounded queue.** Default `maxsize=0` accepts unlimited backlog. Memory and queue wait dominate latency long before workers look "busy" in CPU metrics. Bound the queue and shed, reject, or block producers under overload.
- **Wrong concurrency model.** Calling `PriorityQueue` from async code without a thread boundary blocks the event loop on every wait. Using bare `heapq` across threads without a lock races and corrupts the heap.
- **In-process only.** Process crash drops the queue. Horizontal scale needs an external broker; this type stays a process-local handoff.

## Why it matters here

LLM and ML services constantly mix traffic classes on limited workers or GPUs: interactive chat vs offline eval, paying tenants vs free batch, tool-call fanout vs index refresh. `queue.PriorityQueue` is the standard-library way to express "threads share a buffer, and urgency beats arrival order" without inventing locks. The same structure shows up in local serving sketches, ingestion pipelines, and interview problems that ask for a priority job system.

Choosing it well means three decisions: entry shape (priority + tie-break + payload), bound (`maxsize` as backpressure), and fairness policy when urgent work never stops. Get those right and the heap does the rest; get them wrong and you get hangs, `TypeError`, OOM, or permanently delayed batch work that still "looks healthy" because high-priority traffic is fine.

## Related terms

- [queue.Queue](glossary://queue-queue)
- [heapq](glossary://heapq)
- [Priority scheduling](glossary://priority-scheduling)
- [Backpressure](glossary://backpressure)
- [Thread safety](glossary://thread-safety)
