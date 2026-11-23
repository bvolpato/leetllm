---
title: asyncio.Queue
importance: 54
kind: code
---
`asyncio.Queue` is a coroutine-friendly FIFO queue for handoff between producers and consumers on **one event loop**. Producers `await put(...)` when the queue is full; consumers `await get()` when it is empty. Waiting suspends the coroutine only. It does not block an OS thread, so other tasks on the same loop keep running.

`asyncio.Queue` is safe for tasks on its owning event loop. Worker threads should communicate through a thread-safe queue or schedule work onto the loop. Bounded `maxsize` is the usual backpressure knob: if fetches, tool calls, or embedding jobs arrive faster than workers finish them, growth stops at the bound instead of becoming hidden RAM and unbounded latency.

Variants in the same module: `asyncio.PriorityQueue` (lowest priority number first) and `asyncio.LifoQueue` (stack order). Methods have no built-in timeout; wrap with `asyncio.wait_for(...)` when you need one. Python 3.13+ adds `shutdown()` and `QueueShutDown` for a clean stop of puts and (when empty) gets.

## How it works

On a single loop, `await queue.put(item)` enqueues and may wait for space; `await queue.get()` dequeues and may wait for an item. Non-blocking siblings raise instead of waiting: `put_nowait` raises `QueueFull`, `get_nowait` raises `QueueEmpty`.

Unfinished-work accounting is separate from the item list:

- Every successful `put` / `put_nowait` increments an unfinished-task counter.
- Each consumer must call `task_done()` once per item it finished (including failures), usually in a `finally`.
- `await queue.join()` returns only when that counter is zero.

If a worker skips `task_done()`, `join()` hangs forever. If you call `task_done()` too many times, you get `ValueError`. `qsize()`, `empty()`, and `full()` report the current buffer; with default `maxsize=0` (unbounded), `full()` never returns `True`.

`join()` means items were accounted for, not that their processing succeeded. With `shutdown(immediate=True)`, queued items can be drained and `join()` released without their work being performed; use that emergency path deliberately.

## Example

An embedding pipeline keeps at most $64$ document chunks buffered and runs $8$ worker coroutines against a rate-limited API. Producers enqueue chunk IDs; workers embed and always mark the item done so shutdown can wait for in-flight work.

```python title="async-queue.py"
import asyncio

async def embed_worker(name: str, queue: asyncio.Queue[str]) -> None:
    while True:
        chunk_id = await queue.get()
        try:
            # await provider call here
            print(name, "embedded", chunk_id)
        finally:
            queue.task_done()

async def main() -> None:
    queue: asyncio.Queue[str] = asyncio.Queue(maxsize=64)
    workers = [
        asyncio.create_task(embed_worker(f"w{i}", queue))
        for i in range(8)
    ]

    for i in range(200):
        await queue.put(f"chunk-{i}")

    await queue.join()
    for w in workers:
        w.cancel()
    await asyncio.gather(*workers, return_exceptions=True)

asyncio.run(main())
```

With $200$ puts, $8$ concurrent workers, and `maxsize=64`, at most $64$ unclaimed chunks sit in memory while producers wait when the buffer is full. Wall time is roughly batch length over worker throughput, not the sum of serial calls.

Each `get()` pairs with exactly one `task_done()`. Pick one shutdown contract (cancel workers after `join()`, sentinels, a task group, or `queue.shutdown()` on 3.13+). Mixing contracts without care is a common source of hung `join()` or lost work.

## Trade-offs

| Need | Prefer |
|------|--------|
| Coroutines on one loop | `asyncio.Queue` |
| OS threads sharing in-process work | `queue.Queue` |
| No concurrency, just FIFO structure | `collections.deque` |
| Work must survive process death / multi-host | Redis, SQS, or another durable broker |

Bounded `maxsize` trades producer wait time for bounded memory. Unbounded queues feel simpler until a slow consumer or stuck worker turns the process into a memory leak. For timeouts on `get`/`put`, use `asyncio.wait_for`; a timeout does not cancel the other side of the handoff by itself.

## Why it matters here

Async crawlers, embedding batches, eval runners, and LLM tool fanout need bounded concurrency without spinning threads. `asyncio.Queue` is the standard in-process place to put that bound, apply backpressure, and join until in-flight work finishes. Interview and production code both fail in the same places: missing `task_done()`, unbounded growth, and using the queue across threads.

## Related terms

- [Backpressure](glossary://backpressure)
- [queue.Queue](glossary://queue-queue)
- [Worker fanout](glossary://worker-fanout)
- [as_completed](glossary://as-completed)
- [collections.deque](glossary://collections-deque)
