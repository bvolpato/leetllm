---
{
  "id": "continuous-batching-request-scheduling",
  "title": "Continuous Batching & Scheduling",
  "slug": "continuous-batching-request-scheduling",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/batch_scheduling_dark.png",
  "shortDescription": "A finished one-line completion can keep its GPU seat while a long plan runs. Refill that seat without letting the next prompt stall every live stream.",
  "keyConceptsTested": [
    "Static vs continuous (in-flight) batching",
    "Prefill vs decode phase scheduling",
    "TTFT, TPOT, and inter-token latency (ITL/TBT)",
    "Priority scheduling and preemption",
    "Goodput vs raw throughput",
    "GPU utilization optimization",
    "KV cache management"
  ],
  "prerequisites": [
    "flashattention-memory-efficient-attention",
    "kv-cache-paged-attention-llm-serving",
    "inference-mechanics-ttft-tps-kv-cache"
  ],
  "relatedQuestions": [
    "scaling-llm-inference-batching-kv-cache",
    "model-parallelism-for-llm-inference",
    "model-quantization-gptq-awq-gguf",
    "speculative-decoding",
    "llm-deployment-gpu-serving-autoscaling",
    "local-llm-deployment-hardware-quantization"
  ],
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta",
    "NVIDIA"
  ],
  "section": "Inference & Production Scale",
  "order": 6
}
---
<!-- leetllm: edition:reference:start -->
Continuous batching lets an LLM server replace finished requests before the rest of a batch completes. Take a shared code-assistant <span data-glossary="gpu">GPU</span> receiving three requests: a one-line completion (A), an explanation of a failing test (B), and a migration plan (C). In this trace they require exactly 10, 50, and 200 remaining generation iterations. More work is already queued.

If the server starts those requests together, A disappears after 10 generation steps and B after 50. Their seats still belong to the batch while C runs for another 150 steps. That leaves a real choice: protect streams already producing tokens, or start waiting work that hasn't produced its first token?

[FlashAttention](/learn/flashattention-memory-efficient-attention) makes one attention kernel cheaper. It doesn't decide who shares the next forward pass.

**<span data-glossary="static-batching">Static batching</span>** treats the trio as one job: fill a batch, run it, and wait for the longest completion before anyone new can start. **<span data-glossary="continuous-batching">Continuous batching</span>** (iteration-level scheduling) rebuilds the active set after every <span data-glossary="token">token</span> step. When A stops, queued request D can take that slot on the next iteration. The model doesn't change. The GPU keeps more useful work in flight.[^yu2022][^kwon2023]

Scheduling new work still depends on available compatible <span data-glossary="kv-cache">KV-cache</span> storage. [Paged KV management](/learn/kv-cache-paged-attention-llm-serving) is one way to allocate that storage flexibly; iteration-level scheduling doesn't require paging specifically.

To see the refill decision clearly, start after prefill. Assume each active request advances one token per iteration and replacement requests already have ready KV state. These are **remaining decode iterations**, excluding the first token produced by prefill. Iterations count work, not milliseconds. We'll add prefill and memory pressure back into the schedule later.

<figure>
  <img src="illustrations/_generated/batch_scheduling_dark.png" alt="Static and continuous schedules use the same 0 to 200 completed-iteration axis and three seats. Static requests A, B, and C need 10, 50, and 200 iterations, leaving the first two seats idle. Continuous batching schedules D for iteration 11 and E for iteration 51; both continue beyond the view." />
  <figcaption>Each axis unit is a completed decode iteration. Static batching completes 260 useful seat-iterations and leaves 340 idle of 600 available. D starts at iteration 11 after A finishes at 10; E starts at 51 after B finishes at 50. D and E each enter with 250 iterations remaining and continue beyond the 200-iteration view.</figcaption>
</figure>

---

## Why LLM batches don't stay the same shape

Image classifiers usually have a fixed input shape and finish in one forward pass. Autoregressive LLMs don't.

**Prefill** reads the prompt. The <span data-glossary="prefill">prefill</span> phase can process those tokens in parallel and normally supplies logits for the first output token. Ordinary **decode** then emits one new token per subsequent step. A one-liner might have ten <span data-glossary="decode-phase">decode</span> steps left. A migration plan might have two hundred.

The engine also doesn't know the output length up front. Generation stops on an end-of-sequence token or a length limit, so the <span data-glossary="inference-scheduler">scheduler</span> can't freeze a batch shape that will still make sense 200 steps later.

Those two facts are why a request-level batch wastes capacity on mixed traffic. Once A is done, its seat is empty, but static batching still owns the whole group until C finishes.

| Request | Task | Remaining decode iterations | Static fate |
|---------|------|---------------|-------------|
| A | One-line completion | 10 | Done at step 10, waits 190 more |
| B | Failing-test explanation | 50 | Done at step 50, waits 150 more |
| C | Migration plan | 200 | Finishes at step 200 |

With three decode seats, this static schedule spends $3 \times 200 = 600$ seat-steps to do $10 + 50 + 200 = 260$ useful tokens. The other 340 seat-steps are idle. Even an implementation that frees A's and B's memory early can't accept D and E if it only schedules whole request-level batches.

Count each active output token as one useful slot-iteration:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="static-versus-continuous-slot-use.py"
import numpy as np

remaining_iterations = np.array([10, 50, 200], dtype=np.int64)
batch_slots = remaining_iterations.size
static_capacity = int(remaining_iterations.max()) * batch_slots
useful_work = int(remaining_iterations.sum())
idle_work = static_capacity - useful_work

print(f"useful slot-iterations: {useful_work}")
print(f"static idle slot-iterations: {idle_work}")
print(f"static slot occupancy: {useful_work / static_capacity:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
useful slot-iterations: 260
static idle slot-iterations: 340
static slot occupancy: 43.3%
```
<!-- leetllm: output:end -->

**Slot utilization isn't GPU utilization.** 43.3% is *batch-seat occupancy*: how often a request-shaped seat is busy. Filling every seat still leaves <span data-glossary="tensor">tensor</span> cores idle when decode is limited by <span data-glossary="memory-bandwidth">memory bandwidth</span>, and <span data-glossary="hbm">HBM</span> can be nearly full while <span data-glossary="model-flops-utilization">model FLOPs utilization (MFU)</span> stays low.

| Regime | Seat occupancy | Typical decode MFU |
|---|---|---|
| Static batch, mixed lengths | Low after short finishes | Still often bandwidth-bound |
| Continuous batch, full seats | High | Still often low MFU on pure decode |
| Larger <span data-glossary="token-budget">token budget</span> / chunked prefill co-batch | High, more prefill tokens per step | Higher arithmetic intensity on that mixed step |

Continuous batching is a *capacity* win because it keeps more useful work in flight. SM occupancy and MFU still depend on batch shape, kernel efficiency, and hardware. The open question is how the server actually refills those seats without waiting for C.

> **Key insight:** Filling every batch seat does not mean the GPU is compute-bound. Pure decode can hit 100% seat occupancy while staying memory-bandwidth-bound with low MFU; combining decode rows with chunked prefill tokens is what lifts per-step arithmetic intensity.

---

## Continuous batching: schedule every iteration

Orca calls this **iteration-level scheduling**: after each generation step (or prefill chunk in engines that chunk prefills), the server checks who finished, frees their slots, and schedules waiting work if memory and token-budget limits allow.[^yu2022]

Start with `[A, B, C]`. After iteration 10, A finishes and D joins for iteration 11. After iteration 50, B finishes and E joins for iteration 51. Give D and E 250 remaining iterations each, so both are still active when C finishes. Those lengths let us trace the refills; the real scheduler doesn't know them in advance.

| Completed iterations | Next active set | What changed |
|------|------------|--------------|
| 0 | A, B, C | Initial batch |
| 10 | D, B, C | A done, D joins |
| 50 | D, E, C | B done, E joins |
| 200 | D, E, (C done) | C leaves; next queued work can take the seat |

The key is to rebuild the active set at every step, before the next forward pass. First *retire* finished sequences and free their KV. Then *schedule* waiting work that fits the batch and token budgets.

If the projected next token would exceed the KV budget, *preempt* a victim before running the pass. Otherwise, run one forward pass. The order makes the trade-off visible: reuse freed capacity, protect the next token from an OOM, then do useful work.

<figure>
  <img src="illustrations/_generated/scheduler_kv_pressure_dark.png" alt="Urgent priority 1 and background priority 0 each have a 16-token prompt and one KV block in a two-block budget. At 17 tokens, each needs a second block, projecting four blocks. The scheduler preempts background and releases its block, reserves both blocks for urgent, then runs urgent. After urgent completes and releases KV, background resumes and completes. The trace uses one preemption and ends with zero of two blocks used." />
  <figcaption>Both requests start with one block, and their next tokens project four blocks against a budget of two. The scheduler pauses priority-0 background, frees its exclusively owned page, and runs priority-1 urgent. Once urgent completes, its KV is freed and background resumes. At each scheduling point, finish the in-flight pass, retire finished or cancelled requests, release only exclusive KV ownership, resume or start queued requests within batch and KV budgets, check projected growth, and recheck after priority preemption before running one pass. This CPU trace ends at 0/2 blocks after one preemption. Its counts trace state changes; runtime duration depends on the engine and workload.</figcaption>
</figure>

Real engines add prefix-cache hits, cancellations, and speculative drafts on top of this loop. The core rule stays the same: the active set can change at every iteration step.

Seat count alone can't tell you how much work a batch contains. One long prefill can consume more scheduler work than many short decode-only streams. Modern schedulers cap a **per-step token budget** (vLLM's `max_num_batched_tokens`) and a **KV-cache block budget**, not only `max_num_seqs`.

An available compatible [prefix-cache](/learn/prefix-caching-prompt-caching) hit reduces uncached prefill work; decode speed depends on the remaining workload and bottleneck. Decode-first scheduling then spends leftover budget on a capped prefill chunk.

Suppose 96 live completions already need a decode token each, and a 1,800-token test-log prefill is waiting. With `max_num_batched_tokens = 1024`, decode takes 96 slots first. The remaining 928 tokens can run as a prefill chunk. The other 872 prompt tokens wait for later steps.

<figure>
  <img src="illustrations/_generated/continuous_batching_dark.png" alt="On one shared 0 to 1,800 position scale, the current 1,024-position iteration contains 96 decode positions and 928 prefill positions. The 1,800-token prompt sends 928 positions now and leaves 872 queued. Position counts describe work placed into the step." />
  <figcaption>Decode uses 96 of the 1,024 positions first. The remaining 928 positions take one prefill chunk from the 1,800-token prompt, leaving 872 queued. A full prefill alongside those decodes would total 1,896 positions in one step. These counts describe work in the iteration; runtime and workload determine its duration.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="decode-first-token-budget.py"
max_num_batched_tokens = 1024
decode_requests = 96
pending_prefill_tokens = 1800
prefill_budget = max_num_batched_tokens - decode_requests
assert 0 <= decode_requests <= max_num_batched_tokens
scheduled_prefill = min(pending_prefill_tokens, prefill_budget)

print(f"decode tokens scheduled first: {decode_requests}")
print(f"prefill tokens scheduled now: {scheduled_prefill}")
print(f"prefill tokens left for later: {pending_prefill_tokens - scheduled_prefill}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
decode tokens scheduled first: 96
prefill tokens scheduled now: 928
prefill tokens left for later: 872
```
<!-- leetllm: output:end -->

This arithmetic assumes one input position per ordinary decode and sufficient KV space. If decode alone exceeds the token budget, select a subset; a negative prefill allowance isn't a schedule. The token budget caps work placed into an iteration, not its wall-clock duration. KV-block capacity separately limits resident state.

---

## Paged KV makes freed memory reusable

During decode, the model stores a KV cache: attention keys and values for every token so far. Under continuous batching, sequences join and leave at unpredictable times. A contiguous `max_seq_len` reservation per request then fails in two ways:

1. **Internal fragmentation.** A maximum-length reservation can greatly exceed the request's actual *prompt plus generated history*.
2. **External fragmentation.** When A leaves, it can punch a hole that D's prompt doesn't fit into, even if the GPU has enough free bytes overall.

The KV cache for a sequence grows with every decode step. For Qwen3.6-27B's published Gated Attention geometry (16 full-attention layers, 4 KV heads, head dimension 256, FP16 cache), each new token adds about **64 KiB** of KV state.[^qwen3627b2026] A 4,096-token test log therefore needs roughly **0.25 GiB**. If those same 16 layers stored separate K/V tensors for all 24 query heads instead of <span data-glossary="grouped-query-attention">GQA</span>, the cache would grow to roughly **1.5 GiB** at 4K tokens. Modest over-allocation can strand enough <span data-glossary="vram">VRAM</span> to block D.

$$
M_{KV} = 2 \times L \times s \times H_{kv} \times d \times b
$$

$L$ is the number of full-attention layers that store K/V, $s$ is sequence length, $H_{kv}$ is KV heads, $d$ is head dimension, and $b$ is bytes per element (2 for FP16). The leading 2 counts key and value tensors. Qwen3.6-27B has 64 layers total, but 48 use Gated DeltaNet; only the 16 full-attention layers grow this cache. **The 0.25 GiB counts attention K/V only**, not the linear-attention layers' recurrent state, block rounding, model weights, or workspace. It isn't the whole model's serving-memory requirement.

<!-- leetllm: test, output=show -->
```python title="kv-cache-budget.py"
layers, kv_heads, head_dim, bytes_per_value = 16, 4, 256, 2
tokens = 4096
bytes_per_token = 2 * layers * kv_heads * head_dim * bytes_per_value
cache_bytes = bytes_per_token * tokens

print(f"KV state per token: {bytes_per_token / 1024:.0f} KiB")
print(f"KV state at {tokens:,} tokens: {cache_bytes / 1024**3:.2f} GiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KV state per token: 64 KiB
KV state at 4,096 tokens: 0.25 GiB
```
<!-- leetllm: output:end -->

```checkpoint
Which term makes KV-cache memory grow during decoding?
---
$s$, the cached sequence length in ordinary full attention. Processing a new token adds its K/V. Recurrent or sliding-window layers have different state-growth rules.
```

[PagedAttention](/learn/kv-cache-paged-attention-llm-serving)[^kwon2023] combines paged KV management with attention kernels that read those pages. It splits KV into fixed-size blocks and maps logical block indices to physical GPU pages through a per-request block table. Block size depends on the engine and backend; use 16 tokens in this example. When A leaves, exclusively owned pages can return to the free list. D can take nonadjacent free pages. Pages shared with another sequence or retained in a prefix cache need separate reference and eviction accounting.

<figure>
  <img src="illustrations/_generated/paged_kv_blocks_dark.png" alt="Eight physical blocks hold C in P2 through P4 and B in P5, leaving free pairs at P0/P1 and P6/P7. A contiguous three-block request for D cannot fit. Paging maps D logical blocks 0, 1, and 2 to P0, P1, and P6, leaving P7 free while B and C keep their blocks. Each physical block holds 16 tokens, and final-block slack remains reserved for its owning sequence." />
  <figcaption>D's logical blocks map to P0, P1, and P6. B and C keep their pages; P7 stays free. Each 16-token block retains final-block slack for its owning request.</figcaption>
</figure>

The vLLM paper reports **near-zero** KV-cache waste in its evaluated design versus large reservation waste in the baselines.[^kwon2023] That claim is about dropping `max_seq_len` over-allocation, not about last-block rounding. Fixed blocks still leave slack in the final page of each sequence. On short sequences that slack looks large. On long ones it's at most `block_size - 1` tokens per request.

<!-- leetllm: test, output=show -->
```python title="paged-kv-slack.py"
block_size = 16
sequence_lengths = [17, 31, 48, 65]
reserved = sum(((length + block_size - 1) // block_size) * block_size for length in sequence_lengths)
used = sum(sequence_lengths)
slack = reserved - used

print(f"active tokens: {used}")
print(f"reserved block slots: {reserved}")
print(f"last-block slack: {slack} tokens ({slack / reserved:.1%})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
active tokens: 161
reserved block slots: 192
last-block slack: 31 tokens (16.1%)
```
<!-- leetllm: output:end -->

Paged KV management decides where state lives; [FlashAttention](/learn/flashattention-memory-efficient-attention) avoids full attention intermediates. Engines combine them through paged-KV attention kernels whose block layout and scheduler bookkeeping match.

Memory is now flexible enough to refill seats. The next fight is that prefill and decode want different things from the same GPU.

---

## Prefill and decode fight over the same step

Now the scheduler has to choose how much work from each phase belongs in one iteration. Prefill and decode put different pressure on the GPU:

### Prefill (prompt processing)
- Processes input tokens in **parallel**.
- Often **compute-heavy** because many prompt tokens hit <span data-glossary="matrix">matrix</span> multiplies.
- Runs once per request at the start (or in chunks).
- Latency goal: <span data-glossary="ttft">Time To First Token (TTFT)</span>.

### Decode (token generation)
- Emits tokens **one at a time**.
- Often **memory-bandwidth limited** at practical batch sizes: each step reads model weights and KV to produce few new tokens.
- Runs once per subsequent output token in ordinary autoregressive decoding.
- Latency goal: inter-token latency (ITL), also called time between tokens (TBT). <span data-glossary="tpot">TPOT</span> is related but not identical. DistServe defines TPOT as the average time per output token after the first.[^zhong2024]

| Phase | <span data-glossary="arithmetic-intensity">Arithmetic intensity</span> | Bottleneck | What you want to batch |
|-------|---------------------|------------|-------------------|
| **Prefill** | Often high | Frequently compute | Prompt tokens |
| **Decode** | Often lower | Frequently memory bandwidth | Active streams |

Mixing a *full* 4k test-log prefill with those 96 live streams can stall <span data-glossary="itl">ITL</span>. Every in-flight completion waits for the whole prompt before its next token. Chunked prefill, disaggregated pools, and decode-first priority are three ways to bound that interference.

Measure TTFT from the client's request start to the first received token, including queueing and transport. For $N > 1$ received tokens, TPOT is $(t_N - t_1)/(N - 1)$: the mean of the inter-token gaps. Report single-token completions separately because that denominator is zero. A good mean TPOT can hide one very long gap.

---

## Who gets the next seat

The scheduler rebuilds the active set every iteration. The scheduling rule decides which waiting work wins.

### First-come-first-served (FCFS)
Schedule in arrival order. Easy to reason about, usually fair, and a long migration plan at the head of the queue can block many one-liners.

### Shortest-job-first (SJF)
Prioritize estimated service cost. Remaining output length matters, but so do prefill length, context-dependent attention, and batch composition. Prompt buckets can approximate one part of that cost. Tenant priority and token caps are resource controls, not inherently SJF estimates.

Unknown lengths turn scheduling into a fairness problem too. A stream of short requests can keep winning an estimate-based SJF queue while a long request waits forever. Use estimates as hints, age waiting requests, or allocate per-tenant shares; cap consecutive wins when a class is falling behind.

Track p99 and maximum queue wait by request class. If short-job latency improves while long-job wait grows, the scheduler is trading fairness for mean completion time, not finding free capacity.

For a **single serial worker**, with every job ready at time zero and no preemption, known job lengths let SJF minimize average completion time. This idealized queue isolates that scheduling result; a GPU that co-batches jobs has iteration costs that vary with batch membership and context length:

<!-- leetllm: test, output=show -->
```python title="shortest-job-first-bound.py"
jobs = [("long", 50), ("quick", 5), ("medium", 20)]

def average_completion(order):
    elapsed = 0
    completion_times = []
    for _, tokens in order:
        elapsed += tokens
        completion_times.append(elapsed)
    return sum(completion_times) / len(completion_times)

fcfs = average_completion(jobs)
oracle_sjf = average_completion(sorted(jobs, key=lambda job: job[1]))
print(f"FCFS average completion: {fcfs:.1f} steps")
print(f"oracle SJF average completion: {oracle_sjf:.1f} steps")
print("production caveat: output length is not known up front")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FCFS average completion: 60.0 steps
oracle SJF average completion: 35.0 steps
production caveat: output length is not known up front
```
<!-- leetllm: output:end -->

### Decode-first and priority
Users notice ITL jitter immediately. That makes decode-first scheduling reasonable: protect streams already producing tokens, then spend leftover budget on new prefills. Per-tenant priorities and <span data-glossary="slo">SLO</span>-aware scheduling make that preference explicit.[^zhong2024]

Decode-first still needs a backstop when live streams exhaust the work or memory budget. Age waiting work or reserve a scheduling slot. Fairness can't make an infeasible deadline achievable; under overload, rejection or expiration may be necessary.

vLLM V1 exposes `--scheduling-policy` choices for FCFS and priority scheduling.[^vllm2026v1] Its priority queue processes smaller priority values first, breaking ties by arrival time.[^vllm2026requestqueue] The CPU simulation below deliberately defines larger integers as more urgent; translate the convention before applying a real engine's flag.

### Preemption when KV is full
When GPU KV blocks run out, the scheduler has to pause work, drop state, or stop accepting new requests. Two recovery designs:

1. **Recompute.** Drop the victim's KV and replay its token history when it's rescheduled, including already-generated tokens. Preserve the output and generation count; rebuild state without sampling or streaming those tokens again.
   - Pros: no CPU copy; simple.
   - Cons: spends GPU compute; replay cost grows with the full cached history, including generated tokens.
2. **Swap-out.** Move the victim's KV from GPU VRAM to CPU RAM.
   - Pros: keeps progress; can beat replay when the prompt is long.
   - Cons: burns host-device bandwidth and adds resume latency.

These are design options. Current vLLM V1 defaults to `RECOMPUTE`; its guide notes that legacy KV swapping is no longer required for preemption.[^vllm2026optimization][^vllm2026v1] V1 also offers optional KV offloading through connectors as a separate mechanism.[^vllm2026kvoffload] Check your engine's active default and trace its actual state transfers.

The CPU scheduler below models **swap-out bookkeeping** in block counts so you can trace the state transitions directly. `schedule_step` reserves capacity before a pass; `finish_decode_step` records one generated token per active request and conservatively reserves a slot for it. To keep progress verifiable, submission rejects requests whose maximum token history could not fit even when running alone.

<!-- leetllm: test, id=scheduler-trace, output=show -->

```python title="preemption-strategies.py"
from dataclasses import dataclass


@dataclass
class Request:
    id: str
    prompt_len: int
    max_new_tokens: int
    priority: int = 0  # Higher value = higher priority
    generated_tokens: int = 0
    allocated_blocks: int = 0
    swapped_to_cpu: bool = False
    canceled: bool = False
    eos: bool = False

    @property
    def total_tokens(self) -> int:
        return self.prompt_len + self.generated_tokens

    def is_finished(self) -> bool:
        """Check if request has reached EOS or max_new_tokens."""
        return self.canceled or self.eos or self.generated_tokens >= self.max_new_tokens

class ContinuousBatchScheduler:
    """
    Simplified iteration-level scheduler.

    Real engines also track per-request token budgets, prefix-cache hits,
    EOS detection, and beam-search groups. This example focuses on the core
    loop: retire finished requests, resume paused work, schedule queued work, then
    preempt if the next decode step would overflow KV-cache capacity.
    """
    BLOCK_SIZE = 16

    def __init__(self, max_batch_size: int, max_memory_blocks: int):
        if max_batch_size <= 0 or max_memory_blocks <= 0:
            raise ValueError("capacities must be positive integers")
        self.max_batch_size = max_batch_size
        self.max_memory_blocks = max_memory_blocks
        self.running: list[Request] = []  # Currently generating on GPU
        self.waiting: list[Request] = []  # Queued requests
        self.swapped: list[Request] = []  # Preempted to CPU RAM
        self.used_memory_blocks = 0
        self.preemptions = 0
        self.in_flight = False
        self.seen_ids: set[str] = set()

    def submit(self, req: Request) -> None:
        if not req.id or req.id in self.seen_ids:
            raise ValueError("request IDs must be unique nonempty strings")
        if req.prompt_len < 1 or req.max_new_tokens < 1:
            raise ValueError("use positive integer lengths")
        if req.generated_tokens or req.allocated_blocks or req.swapped_to_cpu or req.is_finished():
            raise ValueError("submit only fresh requests")
        maximum = self._blocks_for_tokens(req.prompt_len + req.max_new_tokens)
        if maximum > self.max_memory_blocks:
            raise ValueError("request cannot finish within the KV capacity")
        self.seen_ids.add(req.id)
        self.waiting.append(req)

    def cancel(self, request_id: str) -> None:
        # Mark now; release at a safe step, not during a GPU read.
        for req in self.running + self.waiting + self.swapped:
            if req.id == request_id:
                req.canceled = True

    def schedule_step(self) -> list[Request]:
        if self.in_flight:
            raise RuntimeError("finish the previous pass first")
        # 1. Retire finished requests and free their KV cache.
        active = []
        for req in self.running:
            if req.is_finished():
                self._free_kv_cache(req)
            else:
                active.append(req)
        self.running = active
        self.waiting = [r for r in self.waiting if not r.is_finished()]
        self.swapped = [r for r in self.swapped if not r.is_finished()]

        # 2. Prefer resumption. Track wait age or reserved service to enforce fairness.
        self._schedule_queue(self.swapped, from_cpu=True)

        # 3. Schedule fresh waiting requests.
        self._schedule_queue(self.waiting, from_cpu=False)

        # 4. Preempt only if the next decode step would exceed the safe budget.
        while self.running and not self._can_run_next_decode_step(self.running):
            victim = min(self.running, key=lambda r: (r.priority, r.generated_tokens))
            self.running.remove(victim)
            self._swap_out_to_cpu(victim)
            victim.swapped_to_cpu = True
            self.swapped.append(victim)
            self.preemptions += 1

        for req in self.running:
            growth = self._projected_growth_for_next_token(req)
            req.allocated_blocks += growth
            self.used_memory_blocks += growth
        assert self.used_memory_blocks <= self.max_memory_blocks
        self.in_flight = True
        return list(self.running)

    def finish_decode_step(self, eos_ids: frozenset[str] = frozenset()) -> None:
        # Call this after the model emits one token for each running request.
        if not self.in_flight:
            raise RuntimeError("schedule a pass first")
        if not eos_ids <= {req.id for req in self.running}:
            raise ValueError("EOS must belong to this pass")
        for req in self.running:
            req.generated_tokens += 1
            req.eos = req.id in eos_ids
        self.in_flight = False

    def _schedule_queue(self, queue: list[Request], from_cpu: bool) -> None:
        queue.sort(key=lambda r: r.priority, reverse=True)

        while (
            queue
            and len(self.running) < self.max_batch_size
            and self._can_allocate_current_state(queue[0])
        ):
            req = queue.pop(0)
            if from_cpu:
                self._swap_in_from_cpu(req)
            else:
                self._allocate_kv_cache(req)
            req.swapped_to_cpu = False
            self.running.append(req)

    def _blocks_for_tokens(self, token_count: int) -> int:
        return (token_count + self.BLOCK_SIZE - 1) // self.BLOCK_SIZE

    def _can_allocate_current_state(self, req: Request) -> bool:
        return self.used_memory_blocks + self._blocks_for_tokens(req.total_tokens) <= self.max_memory_blocks

    def _allocate_kv_cache(self, req: Request) -> None:
        req.allocated_blocks = self._blocks_for_tokens(req.total_tokens)
        self.used_memory_blocks += req.allocated_blocks

    def _free_kv_cache(self, req: Request) -> None:
        self.used_memory_blocks -= req.allocated_blocks
        req.allocated_blocks = 0

    def _swap_out_to_cpu(self, req: Request) -> None:
        self._free_kv_cache(req)

    def _swap_in_from_cpu(self, req: Request) -> None:
        self._allocate_kv_cache(req)

    def _projected_growth_for_next_token(self, req: Request) -> int:
        next_blocks = self._blocks_for_tokens(req.total_tokens + 1)
        return max(0, next_blocks - req.allocated_blocks)

    def _can_run_next_decode_step(self, batch: list[Request]) -> bool:
        growth = sum(self._projected_growth_for_next_token(req) for req in batch)
        return self.used_memory_blocks + growth <= self.max_memory_blocks


scheduler = ContinuousBatchScheduler(max_batch_size=3, max_memory_blocks=16)
for request in [
    Request("req_A", prompt_len=8, max_new_tokens=3),
    Request("req_B", prompt_len=8, max_new_tokens=1),
    Request("req_C", prompt_len=8, max_new_tokens=2),
    Request("req_D", prompt_len=8, max_new_tokens=2),
    Request("req_E", prompt_len=8, max_new_tokens=1),
]:
    scheduler.submit(request)

timeline: list[list[str]] = []
peak_blocks = 0
for _ in range(6):
    active = scheduler.schedule_step()
    timeline.append([req.id for req in active])
    peak_blocks = max(peak_blocks, scheduler.used_memory_blocks)
    scheduler.finish_decode_step()
    peak_blocks = max(peak_blocks, scheduler.used_memory_blocks)

print(timeline[:3])
print(f"peak blocks: {peak_blocks}/{scheduler.max_memory_blocks}")

assert timeline[0] == ["req_A", "req_B", "req_C"]
assert timeline[1] == ["req_A", "req_C", "req_D"]
assert "req_E" in timeline[2]
assert peak_blocks <= scheduler.max_memory_blocks

# A tight KV-block budget forces an actual preemption before decode.
pressure = ContinuousBatchScheduler(max_batch_size=2, max_memory_blocks=2)
for request in [
    Request("urgent", prompt_len=16, max_new_tokens=2, priority=1),
    Request("background", prompt_len=16, max_new_tokens=2, priority=0),
]:
    pressure.submit(request)
active_under_pressure = pressure.schedule_step()
print([req.id for req in active_under_pressure], f"preemptions={pressure.preemptions}")
assert [req.id for req in active_under_pressure] == ["urgent"]
assert pressure.preemptions == 1

# Finish urgent, then resume background without losing generated progress.
for _ in range(5):
    pressure.finish_decode_step()
    pressure.schedule_step()
pressure.finish_decode_step()
assert not pressure.running and not pressure.swapped
assert pressure.used_memory_blocks == 0

# EOS and cancellation release at the next step, including queued work.
retirement = ContinuousBatchScheduler(2, 4)
for name in ["eos", "cancel", "queued"]:
    retirement.submit(Request(name, 8, 8))
retirement.schedule_step()
retirement.cancel("cancel")
retirement.cancel("queued")
retirement.finish_decode_step(frozenset({"eos"}))
assert retirement.schedule_step() == []
retirement.finish_decode_step()
assert retirement.used_memory_blocks == 0

try:
    retirement.submit(Request("too-large", 64, 1))
except ValueError as error:
    print(error)
else:
    raise AssertionError("oversize request was silently queued")
print("resume, cancellation, EOS, and capacity checks passed")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[['req_A', 'req_B', 'req_C'], ['req_A', 'req_C', 'req_D'], ['req_A', 'req_D', 'req_E']]
peak blocks: 3/16
['urgent'] preemptions=1
request cannot finish within the KV capacity
resume, cancellation, EOS, and capacity checks passed
```
<!-- leetllm: output:end -->

`schedule_step()` rebuilds the active set every iteration: retire finished requests, schedule queued work under the batch and KV budgets, then preempt if the next token won't fit.

In a GPU engine, retiring or preempting a request also requires waiting for in-flight readers before reusing its blocks, tracking shared prefix references, and suppressing any late output from a canceled stream. Resuming swapped work ahead of fresh arrivals and inspecting only the queue head can also stall smaller requests behind a blocked large prompt.

Make that queue-head trade-off concrete. Two of three KV blocks belong to a resident stream throughout this short trace. The oldest waiting request needs two blocks; a newer one needs one. Strict head order accepts neither. Scanning for a fitting request can use the free block, but continuous one-block arrivals can keep winning while the two-block request waits. The original SGLang scheduling algorithm scans candidates against available state capacity.[^zheng2023a] Measure wait-time distributions under sustained arrivals to assess fairness.

<!-- leetllm: test, output=show -->
```python title="queue-head-versus-fitting-work.py"
def select_from_queue(queue, free_blocks, bypass_head):
    selected = []
    for name, blocks in queue:
        if blocks > free_blocks:
            if not bypass_head:
                break
            continue
        selected.append(name)
        free_blocks -= blocks
    return selected

queue = [("older-large", 2), ("newer-small", 1)]
strict = select_from_queue(queue, free_blocks=1, bypass_head=False)
fitting = select_from_queue(queue, free_blocks=1, bypass_head=True)
assert strict == [] and fitting == ["newer-small"]
print("head order / fit scan:", strict, "/", fitting)

# Each small request finishes before the next step. The resident stream
# still holds two blocks; this trace deliberately offers no second free block.
small_completed = 0
for iteration in range(4):
    candidates = [("older-large", 2), (f"small-{iteration}", 1)]
    chosen = select_from_queue(candidates, free_blocks=1, bypass_head=True)
    assert "older-large" not in chosen
    small_completed += len(chosen)
print(f"small completions: {small_completed}; older request still waiting")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
head order / fit scan: [] / ['newer-small']
small completions: 4; older request still waiting
```
<!-- leetllm: output:end -->

To start the older request before the resident stream ends, the scheduler needs two blocks at once. Raising its priority can't manufacture the missing block. Instead, the scheduler must either preempt the resident or reserve newly freed blocks until two accumulate rather than refilling them immediately. Compare replay or transfer cost, per-class wait, and SLO attainment before enabling head-of-line bypass, because skipping a blocked head trades fairness for short-term occupancy.

Recomputation needs a different counter: **tokens already computed into KV**. Reset that counter, not the accepted output. This minimal history example makes the distinction executable:

<figure>
  <img src="illustrations/_generated/preemption_recompute_dark.png" alt="The client-visible output IDs 201 and 202 remain accepted through preemption. Before the pause, KV contains prompt positions 101, 102, and 103 plus generated position 201; sampled token 202 has no KV position yet. The pause releases those four cached positions. Resume replays 101, 102, 103, and 201 without sampling or emitting them again, then uses 202 as the next decode input." />
  <figcaption>The accepted output IDs [201, 202] stay in the client transcript while the four cached positions are released. Resume replays [101, 102, 103, 201] without sampling or emitting them again, then consumes 202 as the next decode input.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="recompute-keeps-output.py"
prompt_ids = [101, 102, 103]
output_ids = [201, 202]  # Already sent to the client; never resample these.
history = prompt_ids + output_ids
computed_tokens = len(history) - 1  # Last sampled token has no KV yet.
before = output_ids.copy()

computed_tokens = 0  # Preemption discarded all cached state.
replay_ids = history[:-1]
computed_tokens += len(replay_ids)  # Model this replay; no sampling or emission.
next_decode_input = history[computed_tokens]

assert output_ids == before
assert replay_ids == [101, 102, 103, 201]
assert next_decode_input == 202
print(f"rebuild {computed_tokens} cached positions; next decode input: {next_decode_input}")
print(f"accepted output is unchanged: {output_ids}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rebuild 4 cached positions; next decode input: 202
accepted output is unchanged: [201, 202]
```
<!-- leetllm: output:end -->

Swap-out pays host-device bandwidth to keep KV. Recompute pays forward-pass work to rebuild it. Choose from measured history length, transfer bandwidth, and preemption frequency. Neither recovery path should restart the answer or duplicate tokens already delivered.

> **Common mistake:** Replaying all tokens up to `output_ids[-1]` and sampling during recomputation either mutates already-delivered text or duplicates tokens on the client stream. Replay `[prompt + accepted[:-1]]` to rebuild KV state only, then feed `accepted[-1]` as the next decode input.

### Continuous batching times speculative decoding

Speculative decoding can improve per-request speed and changes the **token-budget math** for the whole batch:

1. **More work per scheduled request.** A target verification pass processes multiple input positions, and an accepted draft may yield up to `k + 1` output tokens including a bonus token. Budget the engine's scheduled verification positions and reserve its required KV lookahead. Accepted output count isn't the same quantity as scheduled input-token work.
2. **ITL jitter from acceptance <span data-glossary="variance">variance</span>.** High acceptance packs more useful tokens per step. Rejects free partial work unevenly and can stall one stream while neighbors look fine, even when mean TPOT looks healthy.
3. **Mixed work.** In an engine that mixes verification widths or speculative and plain streams, those positions share the work budget. Large verification batches can delay other work. Check what the runtime actually supports rather than assuming every request can independently enable speculation.

The accept/reject rule lives in [speculative decoding](/learn/speculative-decoding). Keep the iteration loop and token budget from this lesson when you read it.

```checkpoint
Why does continuous batching usually schedule by token or KV-cache budget instead of only request count?
---
Requests have different prompt lengths and generated lengths. One long prompt can consume far more prefill work and KV-cache memory than many short chats, so request count alone misstates GPU capacity.
```

---

## Serving engines

The same ideas show up across stacks. Some rows are production engines. DistServe is a research system that shaped later pool-splitting designs:

| System | Mechanism | Connection to this lesson |
|-----------|--------------------|-----------------|
| **vLLM**[^vllm2026optimization] | Continuous batching, paged KV, chunked prefill | Current V1 token-budget and preemption controls |
| **SGLang**[^zheng2023a] | Continuous batching and <span data-glossary="prefix-cache">prefix reuse</span> (RadixAttention) | Available cached work changes scheduling and prefill demand |
| **TensorRT-LLM**[^nvidia2024] | NVIDIA runtime with in-flight batching and paged KV | Scheduler and kernel features must match the installed build |
| **Sarathi-Serve**[^agrawal2024sarathiServe] | Chunked-prefills and stall-free scheduling | Research design starting new prompts without pausing ongoing decodes |
| **DistServe**[^zhong2024] | Phase separation and bandwidth-aware placement | Optimizes SLO-qualified per-GPU capacity |
| **Mooncake**[^qin2024] | Disaggregated KV store using DRAM/SSD and RDMA | Cache placement, state transfers, and early rejection are scheduling inputs |

Feature matrices move quickly. Check current docs before you pick an engine.

---

## Throughput vs goodput

A server can win raw tokens/sec and still feel slow for long prompts or live streams. Judge it by whether *your* mix of one-liners, test logs, and long plans stays inside TTFT, TPOT, and ITL targets.

| Source | What it measured | Why it matters |
|--------|------------------|----------------|
| **Orca**[^yu2022] | Iteration-level scheduling against request-level baselines | Per-iteration scheduling can raise throughput and cut latency together |
| **vLLM**[^kwon2023] | PagedAttention plus continuous batching against prior serving systems | Shows why memory allocation and iteration-level scheduling must be evaluated together |
| **DistServe**[^zhong2024] | Phase-disaggregated serving under TTFT/TPOT SLOs | Treats prefill/decode placement as an SLO and goodput decision, not a raw-TPS contest |

Raw tokens/sec doesn't tell you how many requests meet their latency targets. DistServe optimizes **<span data-glossary="goodput">goodput</span>** per provisioned GPU.[^zhong2024] For a fixed deployment, goodput asks for the highest offered rate $\lambda$ that keeps the required fraction $\alpha$ within chosen TTFT/TPOT objectives:

$$
\text{Goodput} = \max\left\{\lambda : P(\text{TTFT} \le T_{\text{TTFT}} \text{ and } \text{TPOT} \le T_{\text{TPOT}}) \ge \alpha\right\}
$$

Here $\lambda$ is the whole deployment's offered requests per second for a fixed GPU count. Divide by that count when comparing **per-GPU** goodput. The original DistServe form uses TTFT and TPOT. When smooth streaming is part of your service target, extend the acceptance predicate with ITL:

$$
\text{Goodput}_{\text{stream}} = \max\left\{\lambda :
P\left(
\text{TTFT} \le T_{\text{TTFT}} \land \text{TPOT} \le T_{\text{TPOT}}
\land \text{ITL} \le T_{\text{ITL}}
\right) \ge \alpha\right\}
$$

Define ITL aggregation before measuring: per-stream p99 ITL or a required fraction of tokens under $T_{\text{ITL}}$ are different tests. $T_{\text{TTFT}}$, $T_{\text{TPOT}}$, and $T_{\text{ITL}}$ are the chosen limits; $\alpha$ is the attainment fraction, for example 90%. Raise offered load and keep the highest rate whose attainment stays at or above $\alpha$. Optimize <span data-glossary="tokens-per-second">tokens/sec</span> only after those targets exist.

One 10-second window cannot determine that maximum. It can still report **observed SLO-compliant throughput**, which is what you use when raw TPS is hiding latency failures:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="goodput-under-slo.py"
import numpy as np

window_seconds = 10.0
ttft_ms = np.array([120, 450, 180, 190], dtype=np.float64)
tpot_ms = np.array([25, 22, 42, 27], dtype=np.float64)
within_slo = (ttft_ms <= 300.0) & (tpot_ms <= 30.0)

print(f"raw throughput: {ttft_ms.size / window_seconds:.2f} req/s")
print(f"observed SLO-compliant throughput: {int(within_slo.sum()) / window_seconds:.2f} req/s")
print(f"SLO-compliant requests: {int(within_slo.sum())}/{ttft_ms.size}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw throughput: 0.40 req/s
observed SLO-compliant throughput: 0.20 req/s
SLO-compliant requests: 2/4
```
<!-- leetllm: output:end -->

```checkpoint
Why doesn't this 10-second window determine goodput?
---
It measures compliant completions at one offered load. Determining goodput requires sweeping offered request rates and finding the maximum rate that still meets the chosen SLO-attainment target.
```

This small benchmark checks TTFT and TPOT only. A streaming endpoint should add its ITL rule to the same acceptance test, then hold that rule fixed across scheduler configurations.

## Turn a mixed-load trace into an operating point

The 10-second window makes SLO filtering concrete, but it doesn't tell us the endpoint's capacity. It has no arrival process, queue pressure, or output-length mix. A hand-picked batch can pass while live traffic fails between iterations.

As offered arrival rate $\lambda$ rises, queue wait and TTFT climb while decode-first scheduling keeps ITL steady, whereas launching aggressive prefills hurts ITL first. Past a sustainable operating point, queues grow or requests are rejected. An open-loop client sends according to preassigned timestamps, while a closed-loop client that waits for responses hides overload by slowing its own arrivals. Record both scheduled and actual send times so a saturated load generator does not quietly shift arrivals forward and erase its own queueing delay.

MLPerf's Server/Interactive rules make this workload distinction explicit: its load generator sends queries with a Poisson arrival process, tests multiple offered QPS values, and reports the maximum supported rate under scenario latency and quality requirements. It also samples the performance trace from a fixed library with a deterministic seed.[^mlcommons2026inference] Use that discipline for an API benchmark without claiming MLPerf compliance: replay a public or production trace, or publish a fixed-seed distribution with the realized prompt and output lengths.

Fix the benchmark setup before tuning. Otherwise a scheduler change can quietly change the workload it's being judged on:

| Setup item | Record before the sweep |
|---------------|-------------------------|
| Endpoint and system | Endpoint URL and protocol, streaming mode, model and tokenizer revision, engine commit, GPU model/count/topology, driver/runtime, and precision or quantization |
| Workload | A replayable public/production trace or fixed-seed distribution; prompt-length and output-length buckets, sampling and stop rules, and the exact request order |
| Arrival and concurrency | Open-loop arrival timestamps or the named arrival process at each offered $\lambda$; client concurrency, max in-flight requests, and observed server concurrency |
| Warmup and window | Warmup requests or duration until compilation, allocators, and chosen caches are steady; measurement duration, drain time, and the samples excluded from warmup |
| Baseline | The exact scheduler/engine configuration being compared, with equivalent tuning and the same trace, system, and SLOs |
| Correctness | Deterministic or fixed-seed decoding where available, output validity, reference outputs or task-quality checks, token-count checks, and error, cancel, and timeout counts |
| Metrics and operating point | Queue wait, TTFT, per-token ITL, TPOT, raw throughput, p50 and p99 for each latency signal, KV pressure, preemptions, SLO attainment, and goodput; report the highest $\lambda$ that passes every latency and correctness target plus its neighboring pass/fail points |

One mixed-length workload is enough to expose why one uniform batch is weak: 60% short requests with 128-256 prompt tokens and 16-64 output tokens, 30% medium requests with 512-2,048 prompt tokens and 128-512 output tokens, and 10% long requests with 2,048-4,096 prompt tokens and 512-2,048 output tokens. These proportions let us compare scheduling behavior; production capacity needs a measured or replayable workload. Keep the realized lengths and arrival timestamps so every scheduler sees the same work.

For streaming, p50 alone can hide a stutter. Etalon shows why TTFT, TPOT, and related averages don't fully capture user-facing behavior, and proposes a fluidity-index for that gap.[^agrawal2024etalon] You don't have to adopt its metric, but you do need an explicit ITL aggregation and a p99 report if smooth token delivery is an SLO.

Read the curve with the trace. Stable p50 with rising p99 suggests queue variance or starvation; confirm it with per-class waits. Rising TTFT with stable ITL can suggest scheduling or prefill wait. Rising p99 ITL can suggest prefill interference or oversized iterations, but transfer stalls and client buffering can look similar. Mark the operating point from measured SLO attainment, not from one latency signature alone.

This checklist tells you how to judge a change. It doesn't yet say what to change when a long prefill still freezes the live streams.

---

## Chunked prefill keeps streams moving

Chunk the prompt so live decodes can run between slices. An unchunked 4,000-token test log can make a mixed iteration far too slow for interactive streams: how many milliseconds that step takes depends on the model, hardware, context, and batch size, and every active decode waits until the entire iteration finishes.

The 2023 SARATHI paper combines **chunked-prefills** and **decode-maximal batching**.[^agrawal2023] Sarathi-Serve's 2024 scheduler develops stall-free scheduling: new prefills join without pausing ongoing decodes.[^agrawal2024sarathiServe] That stall-free property still leaves ITL and SLO outcomes dependent on the workload and implementation.

For a decode-first illustration, slice the prompt into chunks such as 512 tokens and schedule a chunk within leftover budget:

$$
N_{\text{decode}} + N_{\text{prefill}} \leq B_{\text{max}}
$$

The mixed step amortizes weight reads across more tokens and can use compute that small decode batches underuse. Prefill still adds work, including attention over earlier chunks. A fixed token count does not make every chunk equally costly, and the extra wall-clock cost can still be measurable.

<figure>
  <img src="illustrations/_generated/chunked_prefill_latency_dark.png" alt="Eight iteration columns show prefill chunks of 512 tokens in the first seven steps and 416 in the tail. The same 96-position decode lane continues through every iteration. The first seven steps total 608 positions each and the tail totals 512. The queue bars shrink after each slice, with seven rescheduling checkpoints; column widths do not represent time." />
  <figcaption>The remaining prompt queue shrinks as each slice completes while the decode row keeps its 96 positions. Seven checkpoints let the scheduler recheck the batch. Column widths show iteration order; measure the engine to compare elapsed time.</figcaption>
</figure>

Without <span data-glossary="chunking">chunking</span>, concurrent decode requests wait for the whole prompt. Average TBT can still look fine while the stream hitch is obvious in the UI.

With a 512-token chunk, the log becomes eight pieces (seven 512-token chunks plus a 416-token tail). Each scheduler step also batches 96 decode positions, giving 608 positions in the first seven and 512 in the last. The scheduler re-evaluates at each step. Extra launches, repeated state access, and context-dependent attention can increase prefill cost. Streams get more chances to advance; their measured gaps may still miss an ITL target.

Current inference engines like vLLM V1 enable chunked prefill by default whenever possible: decode requests run first, leftover `max_num_batched_tokens` budget goes to prefills, and any prefill exceeding that allowance is chunked.[^vllm2026optimization] Larger budgets can favor prefill throughput and TTFT; tighter budgets can protect ITL smoothness. Measure the target workload to choose values that meet its latency objectives.

<!-- leetllm: test, output=show -->
```python title="chunked-prefill-plan.py"
prompt_tokens = 4000
chunk_size = 512
chunks = []
remaining = prompt_tokens
while remaining:
    current = min(chunk_size, remaining)
    chunks.append(current)
    remaining -= current

print(f"chunk count: {len(chunks)}")
print(f"first/last chunk: {chunks[0]}/{chunks[-1]} tokens")
print(f"decode rescheduling steps: {len(chunks) - 1}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
chunk count: 8
first/last chunk: 512/416 tokens
decode rescheduling steps: 7
```
<!-- leetllm: output:end -->

Chunking still shares one GPU between phases. If prefill and decode want different hardware, can separate pools remove that interference without creating a worse wait?

---

## Disaggregated prefill and decode

Separate pools can take the prefill off the decode GPU, and they add a state handoff that can become the new wait. **<span data-glossary="prefill-decode-disaggregation">Disaggregated serving</span>** (phase splitting) runs prefill and decode on separate worker pools. Splitwise[^patel2023] and DistServe[^zhong2024] study this split directly: prefill often wants dense matrix throughput, decode often wants KV capacity and memory bandwidth.

Chunking bounds each prefill slice when phases share a GPU. Pool separation changes that resource trade-off, but two questions remain:

1. **HBM contention.** Where state capacity is shared, long prefills and growing streams compete for it. Queue controls can defer work; preemption thrashing isn't inevitable.
2. **Different operating points.** Prompt-heavy and decode-heavy workloads can favor different batching and parallelism. Neither phase is always bound by one resource; context, model architecture, and achieved batch size matter.

Separate workers can be on different nodes or different GPUs within one node. A connector hands off compatible state. Model/tokenizer revisions, exact token positions, cache layout/dtype, and other recurrent state must agree or be converted/reconstructed. Direct GPU-to-GPU network transfer is one transport choice, not the definition of disaggregation.[^vllm2026disaggregatedprefill]

<figure>
  <img src="illustrations/_generated/prefill_decode_disaggregation_dark.png" alt="On one assumed 0 to 145 millisecond timeline, prefill queueing takes 20 ms, prefill 60 ms, state handoff 40 ms, decode queueing 15 ms, and the next decode step 10 ms. Early delivery sends token one at 80 ms and token two at 145 ms: TTFT 80 ms passes a 90 ms target, while the 65 ms first gap misses a 30 ms target. Buffered delivery sends token one at 135 ms and token two at 145 ms: TTFT misses, while the 10 ms gap passes. Both policies miss the combined target. Attention KV alone is 0.25 GiB for 4,096 positions; recurrent state and transfer overhead are additional." />
  <figcaption>In this assumed schedule, prefill queueing (20 ms) plus prefill (60 ms) puts token one at 80 ms. After a 40 ms state handoff and 15 ms decode queue, the decoder is ready at 135 ms; a 10 ms decode step delivers token two at 145 ms. Early delivery meets TTFT 90 ms and misses the 30 ms first-gap target. Buffered delivery misses TTFT and meets the first-gap target. Both miss the combined rule. Attention KV alone is 0.25 GiB for 4,096 positions; recurrent state and transfer overhead add to the handoff.</figcaption>
</figure>

For a simplified **serial handoff**, readiness for the next decode includes both queues:

$$
T_{\text{ready}} = T_{\text{queue, prefill}} + T_{\text{prefill}} + T_{\text{exposed handoff}} + T_{\text{queue, decode}}
$$

Layer-wise transfer can overlap work, so count the *exposed* handoff delay on the critical path rather than always summing complete stage durations. First-token delivery is a separate choice: prefill may produce a token before handoff completes, leaving a large first-to-second-token gap. A gateway that buffers it until the decode worker is ready instead pays that delay in TTFT. Measure both.

For a chosen payload and available payload bandwidth, estimate the ideal serialization component with:

$$
T_{\text{serialization}} = \frac{M_{\text{payload}}}{B_{\text{payload}}}
$$

This estimates payload serialization; add setup, queueing, layout conversion, and other state. At theoretical 10/25 Gbit/s line rates, 0.25 GiB alone takes about **215/86 ms**, before overhead. Benchmark the target interconnect and workload to determine whether splitting is worthwhile. DistServe's testbed used **25 Gbit/s cross-node links** and placed corresponding prefill/decode stages within a node to use NVLink.[^zhong2024]

The paper reports up to 7.4× higher supported request rates versus DeepSpeed-MII in its chatbot comparison, under the evaluated OPT models, A100 deployment, and TTFT/TPOT targets with over 90% attainment.[^zhong2024] Use that result for its evaluated setup; measure TP=4/TP=1 and other splits on the target workload. Current vLLM documentation describes separate TTFT/ITL tuning and explicitly states that its experimental disaggregated-prefill feature does not improve throughput.[^vllm2026disaggregatedprefill]

<!-- leetllm: test, output=show -->
```python title="kv-handoff-cost.py"
layers, kv_heads, head_dim, bytes_per_value = 16, 4, 256, 2
prompt_tokens = 4096
link_gib_per_second = 50
kv_bytes = 2 * layers * kv_heads * head_dim * bytes_per_value * prompt_tokens
transfer_ms = kv_bytes / (link_gib_per_second * 1024**3) * 1000

print(f"attention KV portion: {kv_bytes / 1024**3:.2f} GiB")
print(f"idealized transfer time at {link_gib_per_second} GiB/s: {transfer_ms:.1f} ms")
print("not total handoff time: add other model state and transfer overhead")
for line_gbps in (10, 25):
    line_bytes_per_second = line_gbps * 1e9 / 8
    floor_ms = kv_bytes / line_bytes_per_second * 1000
    print(f"serialization floor at {line_gbps} Gbit/s: {floor_ms:.1f} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
attention KV portion: 0.25 GiB
idealized transfer time at 50 GiB/s: 5.0 ms
not total handoff time: add other model state and transfer overhead
serialization floor at 10 Gbit/s: 214.7 ms
serialization floor at 25 Gbit/s: 85.9 ms
```
<!-- leetllm: output:end -->

Compare how early streaming versus gateway buffering shifts observed first-token latency and inter-token gaps across fixed stage durations:

<!-- leetllm: test, output=show -->
```python title="first-token-does-not-finish-handoff.py"
prefill_queue, prefill = 20, 60
handoff, decode_queue, next_decode = 40, 15, 10
prefill_done = prefill_queue + prefill
decode_ready = prefill_done + handoff + decode_queue
second_token = decode_ready + next_decode

for mode, first_token in (
    ("early", prefill_done), ("buffered", decode_ready)
):
    gap = second_token - first_token
    meets_targets = first_token <= 90 and gap <= 30
    print(f"{mode}: TTFT={first_token} ms, first gap={gap} ms, targets met={meets_targets}")
assert second_token == 145
print(f"second token arrives at {second_token} ms under both modes")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
early: TTFT=80 ms, first gap=65 ms, targets met=False
buffered: TTFT=135 ms, first gap=10 ms, targets met=False
second token arrives at 145 ms under both modes
```
<!-- leetllm: output:end -->

Neither delivery mode satisfies the 90 ms TTFT and 30 ms gap targets here. Buffering changes where the delay is visible; it doesn't create capacity or finish the second token earlier.

---

## Read the failure signature

A scheduler usually reveals its bottleneck in the trace long before it fails in headline throughput:

- **Symptom 1: High raw TPS, but P99 ITL spikes violently.**
  *Check:* Correlate long gaps with scheduled prefill positions and measured iteration duration. Transfers, device stalls, or buffered delivery can produce similar symptoms.
  *Try:* Chunk prefills and reduce the mixed-step budget, then remeasure both ITL and TTFT. Gap uniformity depends on step duration, queueing, and state growth.

- **Symptom 2: Stable P50 ITL, but P99 TTFT inflates under load while decode throughput stays high.**
  *Check:* Inspect prefill wait by request class and whether decode consumes all available work or state capacity. Offered overload can resemble scheduler starvation.
  *Try:* Age waiting work or reserve prefill slots within the budgets. Reject or expire requests whose deadlines can't be met; use deadline-aware scheduling to protect TTFT.

- **Symptom 3: Out-of-memory crashes or sudden preemption thrashing mid-generation.**
  *Check:* Trace resident blocks, projected growth, workspace, and preemption counts. A request-count cap alone misses variable state cost; other allocations can also cause OOM.
  *Try:* Enforce state headroom and lower queued work and concurrency. Compare replay and transfer costs for the actual histories and engine instead of assuming recomputation is always faster.

- **Symptom 4: Disaggregated serving exhibits worse TTFT than colocated serving.**
  *Check:* Break down prefill queue, execution, exposed state handoff, decode queue, and first-token delivery. Placement, conversion, and unbalanced pools matter alongside link bandwidth.
  *Try:* Improve locality or the measured transfer path, rebalance pools, and compare the complete critical path with colocation. Use GPUDirect RDMA only when measurements show that it improves the split's critical path.

A chat stream and a background summarizer can have different targets, but neither target is served by a chart that omits queue wait.

---

## What to carry into a serving design

A finished request no longer has to hold its seat until the longest neighbor ends. You can budget the next iteration's tokens and KV growth, and you can tell whether chunking or a split pool is the response when a prefill stalls live streams. Compare those choices on the same mixed-load trace, using SLO-qualified goodput rather than raw tokens per second.

---

## Run a mixed-load trace

Replay the same mixed trace across scheduler settings. Warm up until the endpoint reaches its declared steady state, send requests with the chosen open-loop arrival process, and drain every response before ending the run. Record per-request queue wait, TTFT, ITL, output length, correctness, token-budget use, KV-block pressure, preemptions, and errors.

Plot offered $\lambda$ against p50 and p99 latency, raw throughput, SLO attainment, and goodput. Compare each curve with the scheduling rule you configured, then keep the trace and pass/fail operating points as the reference baseline for the next scheduler change.

Count all offered requests when reporting SLO attainment, including rejected, timed-out, and invalid responses as failures. Declare whether throughput uses the arrival window or elapsed time including drain; never silently drop unfinished requests. Goodput is the load-sweep operating point, not a separate throughput curve that falls at each offered load. Plot compliant throughput at each load, then mark the highest passing offered rate.

### Follow-up questions

- The scheduler can fit a prompt now but not its maximum generation when running alone. Would you reject it, enforce a shorter output limit, or support state offload? What does the client observe?
- A 512-token prefill chunk fits the token budget but p99 ITL still misses its target. Which measurements would distinguish long-context attention cost, transfer delay, and an oversized decode batch?
- A preempted request has emitted 500 tokens. Which token history must survive a recompute, and which outputs must not be sent again?

### Evaluation rubric

- Trace slot reuse across explicit iteration steps and distinguish that count from GPU utilization or elapsed time.
- Enforce both per-iteration work and resident KV capacity, including growth, completion, cancellation, and oversize rejections.
- Preserve accepted output when swapping or recomputing state; explain what the CPU simulation leaves untested.
- Explain chunking and phase separation with their overheads, and how each shifts latency between TTFT and ITL.
- Define the arrival process, failure denominator, latency aggregation, and highest passing load before comparing serving configurations.

```mastery-quiz
[
  {
    "question": "A decode-ready simulator has three seats and five FCFS requests with remaining lengths [4,9,6,5,2], all arriving at zero. Each active request advances once per iteration. Static batches are [4,9,6] then [5,2]; prefill and transfer are excluded. What continuous finish time and saving follow?",
    "options": [
      "Finish 14; save 0 iterations.",
      "Finish 9; save 5 iterations.",
      "Finish 11; save 3 iterations.",
      "Finish 8; save 6 iterations."
    ],
    "answer": "Finish 9; save 5 iterations.",
    "explanation": "A finishes at 4 and D runs 5 more, finishing 9. C finishes 6 and E runs 2 more, finishing 8. B finishes 9. Static takes 9 + 5 = 14, so refill finishes 9 and saves 5 abstract iterations; these are not milliseconds."
  },
  {
    "question": "V is canceled at 4 ms, just after the pass finishes reading its KV pages. The pass ends at 7 ms when a write to V's private page 5 finishes. W still uses prefix page 8, which it shares with V. At the earliest safe time, which of these pages can a new request overwrite?",
    "options": [
      "At 4 ms, it can overwrite pages 5 and 8.",
      "At 7 ms, it can overwrite pages 5 and 8.",
      "At 7 ms, it can overwrite page 5 only.",
      "At 4 ms, it can overwrite page 5 only."
    ],
    "answer": "At 7 ms, it can overwrite page 5 only.",
    "explanation": "At 4 ms, the outstanding write could still corrupt new data on page 5. Wait for all in-flight accesses to finish at 7 ms. The scheduler can then retire V, release page 5 and drop V's reference to page 8. W still needs page 8, so overwriting both pages would destroy its prefix. The scheduler discards any late output from V."
  },
  {
    "question": "An urgent request and a lower-priority background request each own a full, private eight-position KV page. Each will write position nine into its own tail page. The pool has three physical pages in total. How many pages would running both requests require, and what should the scheduler do before launch?",
    "options": [
      "Two pages. Pause the background request before launch.",
      "Three pages. Run both requests in this pass.",
      "Four pages. Run both requests in this pass.",
      "Four pages. Pause the background request before launch."
    ],
    "answer": "Four pages. Pause the background request before launch.",
    "explanation": "The two full pages hold the existing histories. Each request needs one more page for position nine, bringing the total to four. Two counts just the new pages. Three counts one new page for two private tails. Running both would require the fourth page before either request produces output. Pause the background request and reserve the one free page for the urgent request."
  },
  {
    "question": "A decode-first step has budget 48 input positions and 11 ordinary decode streams. A waiting prompt has 90 positions left; KV fits. What prompt work runs now and remains?",
    "options": [
      "48 now; 42 remain.",
      "37 now; 53 remain.",
      "11 now; 79 remain.",
      "90 now; 0 remain."
    ],
    "answer": "37 now; 53 remain.",
    "explanation": "Decode consumes 11 positions first, leaving 48 − 11 = 37. The remaining 90 − 37 = 53 prompt positions wait for later chunks. Position counts alone do not determine mixed-step elapsed time."
  },
  {
    "question": "A trace shows stable live-stream gaps, but queued prefills miss first-token deadlines while all work positions stay assigned to decode. Which scheduling change addresses this evidence?",
    "options": [
      "Reserve aged-prefill work within token/KV limits; assess both latency classes.",
      "Increase sequence seats within current KV limits; retain existing work selection.",
      "Lower decode output limits within current budgets; omit queued-wait attainment.",
      "Reserve aged-prefill work within token/KV limits; rank aggregate output TPS."
    ],
    "answer": "Reserve aged-prefill work within token/KV limits; assess both latency classes.",
    "explanation": "Aging or reserved prefill slots can address prefill wait while retaining resource checks. A seat increase alone leaves the work-selection constraint, and omitting waits or ranking only raw TPS hides the stated objective. Deadlines that remain infeasible need rejection or expiration."
  },
  {
    "question": "A client has received output IDs [21, 22, 23] for prompt IDs [11, 12]. The server loses the request's KV cache just after sampling 23. The first decode step after replay must predict the next new token. Where should replay end, which ID should that step consume, and what should the client receive during replay?",
    "options": [
      "Replay through 12. Use 21 next. Resend the saved outputs.",
      "Replay through 22. Use 23 next. Resend the saved outputs.",
      "Replay through 22. Use 23 next. Send nothing during replay.",
      "Replay through 12. Use 21 next. Send nothing during replay."
    ],
    "answer": "Replay through 22. Use 23 next. Send nothing during replay.",
    "explanation": "The server had consumed [11, 12, 21, 22] when it sampled 23. Replay those four inputs without sampling, then feed in 23 to predict the next token. Stopping at 12 and decoding from 21 would predict the second output again. Resending the saved outputs would show the client the same three tokens twice."
  },
  {
    "question": "Ten requests arrive in a 20-second window. Five expire and five return correct replies. Their (TTFT, TPOT) pairs, in milliseconds, are (90, 20), (140, 38), (310, 17), (220, 26) and (160, 22). The limits are 250 ms for TTFT and 30 ms for TPOT. Using the arrival window, what are the completed rate, the rate meeting both limits, and the percentage of offered requests meeting both?",
    "options": [
      "0.50 req/s, 0.15 req/s, 60%.",
      "0.25 req/s, 0.20 req/s, 40%.",
      "0.50 req/s, 0.20 req/s, 80%.",
      "0.25 req/s, 0.15 req/s, 30%."
    ],
    "answer": "0.25 req/s, 0.15 req/s, 30%.",
    "explanation": "Five replies in 20 seconds give 0.25 req/s. The 38 ms TPOT and the 310 ms TTFT disqualify different replies. Three meet both limits, giving 3/20 = 0.15 req/s and 3/10 = 30% attainment. Counting replies by TTFT alone gives four, or 0.20 req/s and 40%. Swapping the offered and completed counts gives the arrival rate of 0.50 req/s and a completion-only attainment of 3/5 = 60%. Making both mistakes gives 4/5 = 80%."
  },
  {
    "question": "A pass has room for 24 input positions and enough KV space. The target model processes five positions for one speculative stream and accepts two draft tokens. Four ordinary streams each consume one position. What is the largest chunk of a long waiting prompt that can fit in this pass?",
    "options": [
      "15 positions",
      "18 positions",
      "13 positions",
      "19 positions"
    ],
    "answer": "15 positions",
    "explanation": "The target processes five verification inputs and four ordinary inputs. That leaves 24 − 5 − 4 = 15 positions for the prompt. Counting just the two accepted tokens as verification work gives 18. Charging them again on top of the five inputs gives 13. Counting the speculative stream as one ordinary input gives 19."
  },
  {
    "question": "A request waits 15 ms for prefill, which takes 45 ms and produces token one. State handoff takes 35 ms, the decode queue takes 20 ms, and decode takes 5 ms to produce token two. The stages run in sequence and delivery is instantaneous. Early delivery sends token one when prefill ends. Buffered delivery holds it until decode can start. What are the (TTFT, first gap) pairs in ms, and which delivery modes meet both limits of 100 ms for TTFT and 70 ms for the gap?",
    "options": [
      "Early (60, 60) passes. Buffered (115, 5) fails.",
      "Early (45, 75) fails. Buffered (95, 25) passes.",
      "Early (45, 75) fails. Buffered (115, 5) fails.",
      "Early (60, 60) passes. Buffered (95, 25) passes."
    ],
    "answer": "Early (60, 60) passes. Buffered (115, 5) fails.",
    "explanation": "Prefill ends at 15 + 45 = 60 ms. Decode starts at 60 + 35 + 20 = 115 ms and token two arrives at 120 ms under either mode. Early delivery gives a 60 ms first gap and meets both limits. Buffering leaves a 5 ms gap but misses the 100 ms TTFT limit. An early TTFT of 45 ms omits the prefill queue. A buffered TTFT of 95 ms ends at handoff while the request still has 20 ms to wait for decode."
  },
  {
    "question": "A fixed four-GPU deployment is tested at 8, 10 and 12 offered requests/s, with joint attainment 0.96, 0.91 and 0.88. The requirement is at least 0.90. What highest tested passing rate and per-GPU rate are supported?",
    "options": [
      "12 req/s; 3.0 req/s/GPU.",
      "10 req/s; 2.5 req/s/GPU.",
      "8 req/s; 2.0 req/s/GPU.",
      "11 req/s; 2.75 req/s/GPU."
    ],
    "answer": "10 req/s; 2.5 req/s/GPU.",
    "explanation": "The tested rates 8 and 10 pass; 12 fails. The highest tested passing point is 10, giving 10/4 = 2.5 per GPU. Untested 11 cannot be interpolated into a verified operating limit; retain neighboring pass/fail points and repeat/refine."
  }
]
```

> **Next:** Continue to [Scaling LLM Inference](/learn/scaling-llm-inference-batching-kv-cache). You can now rebuild a batch at every decode step under KV and token budgets. Scaling inference asks the capacity question under that loop: when weights, KV state, and concurrency compete for HBM, what actually limits tokens per second and cost.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
Request A finishes a one-line code completion in ten steps and can deliver its completed response. A queued request D still waits: a static request-level batch keeps A's freed seat reserved while another request runs a 200-step migration plan. The queue grows outside, that seat sits empty, and a fully loaded GPU dashboard hides the delay before D can enter.

This is what **static batching** does, and it comes from applying an idea that works beautifully for image classifiers to a workload that breaks it. An image batch has one shape and finishes in one pass. A language model's batch has a different problem: nobody knows how long anything will run. A reply stops when the model emits a stop token or reaches a limit, so the scheduler can't plan a batch shape that will still make sense 200 steps later.

The fix, called **continuous batching**, looks almost too simple: decide who runs again on every single step.[^yu2022] Everything hard in this chapter comes from what that decision has to account for. The [cache chapters](/learn/kv-cache-paged-attention-llm-serving) showed where state lives and when it can be reused. Scheduling decides who gets to compute next, and it has three jobs: keep useful work moving, protect interactive latency, and never lose an answer a user has already seen.

## Count the empty seats

Say requests A, B, and C need 10, 50, and 200 decode steps. They arrive together and your batch has three seats. To keep the math clean for now, every step takes the same time, and we'll ignore prefill and memory limits.

A static batch holds its seats until the longest request ends. That's $3 \times 200 = 600$ seat-steps spent to produce $10 + 50 + 200 = 260$ useful tokens.

<!-- leetllm: test, output=show, id=reader-batch-seat-use -->
```python title="static-seat-use.py"
remaining = [10, 50, 200]
capacity = max(remaining) * len(remaining)
useful = sum(remaining)
print(f"useful seat-steps: {useful}")
print(f"idle seat-steps: {capacity - useful}")
print(f"seat occupancy: {useful / capacity:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
useful seat-steps: 260
idle seat-steps: 340
seat occupancy: 43.3%
```
<!-- leetllm: output:end -->

More than half your seats sit empty. Now add two more requests, D and E, needing 250 steps each. A static scheduler can't start them until the first batch finishes at step 200, so everything ends at step 450. A continuous scheduler puts D into A's seat right after step 10 and E into B's seat right after step 50, and the last request finishes at step 300.

<figure>
  <img src="illustrations/_generated/batch_scheduling_dark.png" alt="Static and continuous schedules use the same 0 to 200 completed-iteration axis and three seats. Static requests A, B, and C need 10, 50, and 200 iterations, leaving the first two seats idle. Continuous batching starts D at iteration 11 and E at iteration 51; both continue beyond the view." />
  <figcaption>The same three seats over the first 200 steps. The static batch leaves two seats empty for most of the run. The continuous schedule gives D the first seat as soon as A finishes and gives E the second as soon as B does.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-batch-seat-schedule -->
```python title="seat-schedule.py"
from collections import deque

def finish_time(lengths, seats, refill):
    waiting = deque(lengths)
    active = []
    step = empty = 0
    while waiting or active:
        if not active or refill:
            while waiting and len(active) < seats:
                active.append(waiting.popleft())
        empty += seats - len(active)
        step += 1
        active = [left - 1 for left in active if left > 1]
    return step, empty

lengths = [10, 50, 200, 250, 250]
static = finish_time(lengths, 3, False)
continuous = finish_time(lengths, 3, True)
assert static[0] == 450
assert continuous[0] == 300
print("static:", static)
print("continuous:", continuous)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
static: (450, 590)
continuous: (300, 140)
```
<!-- leetllm: output:end -->

Don't overread this. Seat occupancy isn't GPU utilization, and full seats don't mean a busy chip, since [decode can still be limited by memory bandwidth](/learn/inference-mechanics-ttft-tps-kv-cache) with every seat occupied. Real steps also vary in length with batch shape and sequence length. What the arithmetic shows is the opportunity, and to capture it you need a better model than "one seat per request," because a long prompt can demand thousands of positions while a decode step needs one.

## Three budgets, and any one can stop you

A free seat doesn't mean a request can run. A scheduler is watching three separate limits, and you can hit any of them with plenty of room on the others.

| Budget | What it limits | How it stops you |
|---|---|---|
| Active sequences | How many requests run at once | The configured request limit is reached |
| Scheduled positions | Prompt and decode work in the next step | One long prompt consumes the whole step |
| Cache capacity | Storage held by active requests and reservations | The next position needs a physical block that doesn't exist |

The work budget counts positions, and positions aren't time. A prompt position and a decode position have very different costs, so treat a fixed token budget as a cap on scheduled work rather than on step duration.

The memory budget is the sneaky one, because it changes while requests run. A sequence near the end of a block will need a new allocation on its next token. Prefix reuse can shrink fresh prefill work, while shared blocks and private tails still follow the [ownership rules](/learn/kv-cache-paged-attention-llm-serving) you've seen. If you only check the current payload when accepting a request, you can accept one just before the next step runs out of memory. Find out how your runtime actually reserves: some keep lookahead slots, some account for speculative proposals, and hybrid models have extra state of their own.

## Change the batch only between steps

Requests can only join or leave at a safe point. Each scheduling cycle follows the same order:

1. Retire finished and cancelled work, and release what it owned.
2. Look at what's left in each budget.
3. Choose decode work and prompt chunks according to your scheduling rule.
4. Allocate or reserve the state those need before launching the step.
5. Execute, record accepted output, and advance processed lengths.
6. Return to the queue at the next safe point.

The ordering isn't bureaucracy. A kernel must never read a block table while another transition invalidates its blocks. Real engines use synchronization and atomic ownership updates to enforce this. Cancellation belongs in the same cycle: stop scheduling the request, propagate the cancellation, and free its state once nothing can read it anymore.

Treat the queue as a resource too. An unlimited wait queue can keep your GPU busy while every user behind it waits past their deadline. That's the most expensive kind of utilization there is, since you're spending compute on answers nobody will read. Cap queued work, check whether a request can still finish usefully, and carry its original deadline through any retry.

## Who goes next?

No scheduling rule wins everywhere. Each one fails in a recognizable way, and that's the useful way to think about them.

**First-come-first-served** is easy to explain and fair in an obvious sense. Its weakness is head-of-line blocking: a huge request at the front that can't fit holds up small requests behind it that could run right now.

**Shortest-job-first** can cut average completion time when you know job lengths. On one serial worker with every job ready at time zero, the arithmetic is striking:

<!-- leetllm: test, output=show, id=reader-batch-sjf -->
```python title="shortest-job-first.py"
jobs = [("long", 50), ("quick", 5), ("medium", 20)]

def average_completion(order):
    elapsed, finished = 0, []
    for _, steps in order:
        elapsed += steps
        finished.append(elapsed)
    return sum(finished) / len(finished)

shortest = sorted(jobs, key=lambda job: job[1])
print(f"arrival order: {average_completion(jobs):.1f} steps")
print(f"shortest first: {average_completion(shortest):.1f} steps")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
arrival order: 60.0 steps
shortest first: 35.0 steps
```
<!-- leetllm: output:end -->

That 35 needs an oracle, and you don't have one. The output limit is an upper bound and a poor prediction, and a GPU that batches jobs together has step costs that shift with its neighbors. Estimates also turn this into a fairness problem, because a steady stream of short requests can keep winning while a long one waits forever. Use estimates as hints, age the requests that are waiting, or give each tenant a share. Then track p99 and maximum queue wait by request class. If short-job latency improves while long-job wait grows, the scheduler has traded fairness for a better average, and it hasn't found any free capacity.

**Decode-first** protects streams people are already watching, and it's often the right default for interactive traffic. vLLM V1 prioritizes pending decodes and then fits prefill chunks into the remaining budget in the same batch.[^vllm2026optimization] Under sustained load, though, decode-first can hold a new prompt back for as long as running streams fill the budget. At the 35 ms per token from the [inference chapter](/learn/inference-mechanics-ttft-tps-kv-cache), a 200-step reply takes seven seconds, which can easily outlast your first-token target. You need an aging rule or a reserved prefill budget that keeps new work moving.

Tenant quotas and priority tiers add another layer. A big background job shouldn't quietly consume the interactive budget you promised everyone else. Give it a limited share, fair scheduling, or a separate pool if measurements justify the extra machinery.

Whatever you choose, make it explainable from telemetry: what waited, how long, and which budget stopped it. Averages hide starvation, and the requests that starve are the ones users actually notice.

## Pause without losing the answer

Sooner or later the state pool fills up, and the scheduler has to pause a running request. That's **preemption**, and there are two ways to recover.[^kwon2023] **Recomputing** drops the request's cache and rebuilds it later, which spends compute. **Swapping** moves the state to CPU memory and back, which spends bandwidth and needs a compatible restore. vLLM V1 defaults to recomputing.[^vllm2026optimization]

The danger is in what you rebuild. A paused request has two histories that are easy to confuse: the tokens it has accepted, and the positions it has processed. Suppose the prompt IDs are 101, 102, and 103. The model has accepted outputs 201 and 202, and the user may have already seen both. The cache holds only the prompt plus 201, because 202 was just sampled and hasn't been fed back in yet.

<figure>
  <img src="illustrations/_generated/preemption_recompute_dark.png" alt="Accepted output tokens 201 and 202 survive while missing processed cache state is rebuilt." />
  <figcaption>Pausing releases the cache and keeps the output. On resume, the engine replays four processed positions to rebuild state, then uses 202 as its next input. It never samples 201 or 202 again.</figcaption>
</figure>

To resume, replay 101, 102, 103, and 201, then feed in 202. Replay rebuilds state only. If your engine samples again during replay, the user can see a reply change midway through. If it emits again, they see tokens twice.

<!-- leetllm: test, output=show, id=reader-batch-recompute-history -->
```python title="accepted-history.py"
prompt = [101, 102, 103]
accepted = [201, 202]
processed_before_pause = prompt + accepted[:-1]
emitted = accepted.copy()

rebuilt_cache = processed_before_pause.copy()
next_decode_input = accepted[-1]
assert rebuilt_cache == [101, 102, 103, 201]
assert next_decode_input == 202
assert emitted == [201, 202]
print("replay:", rebuilt_cache)
print("next input:", next_decode_input)
print("already emitted:", emitted)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
replay: [101, 102, 103, 201]
next input: 202
already emitted: [201, 202]
```
<!-- leetllm: output:end -->

A real engine also has to replay with the correct model, positions, and adapter, and preserve sampling state consistently.

> **Common mistake:** Sampling again during recomputation changes text the client has already seen, and emitting during replay sends duplicate tokens. Rebuild KV state over `[prompt + accepted[:-1]]` silently, then feed `accepted[-1]` as the next decode input.

Treat frequent preemption as a capacity alarm. Each pause costs replay work that produces no new output, and the longer the history, the higher the cost. A system that survives only by constantly rebuilding itself may look fine on memory and terrible on useful throughput. Count preemptions per request and recomputed positions, and put them on a dashboard.

## Slice long prompts so streams keep moving

In the [inference chapter](/learn/inference-mechanics-ttft-tps-kv-cache), one long prompt made 32 streams stutter. That's a generation stall, and **chunked prefill** is the standard defense: split prompt processing into smaller pieces, so decode work can join between them.[^agrawal2024sarathiServe]

Take a 4,000-position prompt with a 512-position chunk limit and 96 decode positions per step. Seven steps carry 512 prompt positions each, and the eighth carries the remaining 416. The prompt still gets all its work. Existing streams now get eight turns where they'd otherwise wait behind one monolithic step.

<figure>
  <img src="illustrations/_generated/chunked_prefill_latency_dark.png" alt="Eight iterations split 4,000 prompt positions into seven 512-position chunks and a 416-position tail, alongside 96 decode positions per iteration." />
  <figcaption>The prompt shares every step with running streams. Each column counts scheduled positions, and these widths don't represent elapsed time, so measure before you promise a latency improvement.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-batch-prefill-plan -->
```python title="prefill-plan.py"
remaining = 4000
chunks = []
while remaining:
    chunk = min(512, remaining)
    chunks.append(chunk)
    remaining -= chunk
scheduled = [chunk + 96 for chunk in chunks]
assert chunks == [512] * 7 + [416]
assert sum(chunks) == 4000
assert scheduled == [608] * 7 + [512]
print("prefill:", chunks)
print("total positions:", scheduled)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prefill: [512, 512, 512, 512, 512, 512, 512, 416]
total positions: [608, 608, 608, 608, 608, 608, 608, 512]
```
<!-- leetllm: output:end -->

Chunk size is a real trade-off, and you can't escape it by going small. Small chunks shorten each interruption but add more rescheduling steps and less efficient prompt work, which can delay the new request's first token. Large chunks do the reverse. Tune it on your actual mix of prompts and streams. Chunks also stay dependent: a later section of the prompt still attends to every earlier one, and chunking only changes when that work runs.

If chunking isn't enough, some systems run prefill and decode on separate worker pools.[^zhong2024] That separates direct competition for compute, but now you have compatible cache state to hand off, plus placement, backpressure, and cancellation across two pools. The workers can share a node; choose a cross-node example to expose network cost. Moving the 2.5 GiB cache of one 8,192-position request from the [cache chapter](/learn/kv-cache-paged-attention-llm-serving) over an ideal 200 Gbit/s link takes at least 107 ms before any overhead, so try a well-tuned shared pool first. Reach for a split only when measurements show the shared pool can't meet its targets.

## Measure what users get

Now for the metric that should be on the wall. A scheduler can raise tokens per second while making nearly everyone's experience worse. So count the requests that met their targets, and call the rate of those requests **goodput**.

<!-- leetllm: test, deps=numpy, output=show, id=reader-batch-goodput -->
```python title="goodput-under-slo.py"
import numpy as np

window_seconds = 10.0
ttft_ms = np.array([120, 450, 180, 190], dtype=np.float64)
tpot_ms = np.array([25, 22, 42, 27], dtype=np.float64)
within_slo = (ttft_ms <= 300.0) & (tpot_ms <= 30.0)
raw = ttft_ms.size / window_seconds
good = int(within_slo.sum()) / window_seconds
print(f"raw throughput: {raw:.2f} req/s")
print(f"within targets: {good:.2f} req/s")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw throughput: 0.40 req/s
within targets: 0.20 req/s
```
<!-- leetllm: output:end -->

Half of this server's throughput doesn't count. One window at one load isn't the whole picture, though. DistServe uses the same word for something stricter: the highest offered rate per GPU that keeps a required fraction of requests within their targets, which means sweeping the load upward until you find where it breaks.[^zhong2024] The [benchmark chapter](/learn/serving-benchmark-engineering) shows how to do that properly, and it calls that result capacity to keep the two apart.

Be careful with denominators here. Rejected and timed-out requests belong in the count of what was offered, or your numbers will improve whenever you drop work. And check the shape of each stream as well as its average: a steady 30 ms per token feels very different from a stream that's quick for 20 tokens and then freezes for two seconds, even when the mean is identical.

```checkpoint
You double your scheduled-token budget. Total tokens per second rises 40%, but goodput falls. How can both be true?
---
Larger steps fit more work, which raises total throughput. They also lengthen each step, so every stream's token gaps grow and more requests miss their latency targets. Goodput only counts requests within target, so it can fall while raw throughput rises.
```

## Read the failure signature

Schedulers usually tell you what's wrong well before headline throughput moves. These patterns are worth learning to recognize:

| What you see | Check first | Try |
|---|---|---|
| High throughput, but p99 token gaps spike | Whether long gaps line up with prompt work | Smaller chunks or a smaller mixed-step budget, then remeasure both clocks |
| Steady token gaps, but p99 TTFT climbs with load | Prefill wait by request class | Age waiting work, or reject requests that can't meet a deadline |
| Out-of-memory errors or a preemption storm | Resident blocks and projected growth | Enforce memory headroom and accept less. A request-count cap alone misses variable state size. |
| A split deployment has worse TTFT than a shared one | Queue, handoff, and first-token time in sequence | Fix placement or the transfer path, rebalance pools, and compare the full path |

## A full worker is not a broken worker

This mistake takes down healthy fleets. A worker at its limit should defer or reject extra work cleanly. If your health check treats "full" as "unhealthy" and restarts it, you've thrown away live streams, destroyed its cache, and added a cold start, all at the moment you were already out of capacity. Then the load shifts to the next worker, and it happens again.

Health, readiness, and load are three different observations. A worker with a failed engine should stop taking traffic even with an empty queue. A busy one should stay up. The [GPU deployment chapter](/learn/llm-deployment-gpu-serving-autoscaling) turns this distinction into worker and fleet controls.

Overload needs explicit rules too: maximum queued work, a waiting deadline, a retry budget, and how priorities behave. Rejections have to stay visible in your offered-load numbers. And a client that immediately retries every rejection amplifies load at the worst moment, so limit retries and back off. Active streams need care as well. If a stream gets interrupted, don't start a fresh sample and append it to the partial answer, because the combined text can be misleading. Use a supported continuation, or tell the client it was interrupted.

## Start simple

Begin with one shared pool, a limit on what you accept, explicit budgets, and chunked prefill. Verify that finished requests free their state and that paused requests resume with their history intact. That setup is far easier to reason about than the alternatives, so make it prove inadequate before you replace it.

When something goes wrong, let the symptom pick your next move. If short summaries slow down only during long document ingestion, look at prefill interference. If memory pressure causes repeated rebuilds, look at your length distribution and what you're accepting. If every class of request waits while new workers load, the problem has moved up a level, from scheduling to readiness and fleet capacity.

The scheduler has now squeezed what it can from your memory and compute, but the weights themselves remain enormous. [Quantization](/learn/model-quantization-gptq-awq-gguf) stores them in far fewer bits, and the question it raises is how much you can shrink a model before it stops being the model you evaluated.

<!-- leetllm: edition:reader:end -->
