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
  "section": "GPU Systems & LLM Inference",
  "order": 5,
  "aliases": [
    "scaling-llm-inference-batching-kv-cache"
  ]
}
---
A shared code-assistant <span data-glossary="gpu">GPU</span> receives three requests at once: a one-line completion (A, 10 decode steps), a failing-test explanation (B, 50 steps), and a migration plan (C, 200 steps). More work is queued behind them. Under **<span data-glossary="static-batching">static batching</span>**, A finishes at step 10 and B at step 50, yet both seats stay idle until C ends at step 200.

[FlashAttention](/learn/flashattention-memory-efficient-attention) speeds up a single attention kernel; it never decides who shares the next forward pass. **<span data-glossary="continuous-batching">Continuous batching</span>** (iteration-level scheduling, introduced in Orca) rebuilds the active batch after every <span data-glossary="token">token</span> step.[^yu2022][^kwon2023] As soon as A retires at step 10, queued request D takes its seat at step 11. As soon as B retires at step 50, E takes its seat at step 51.

<figure>
  <img src="illustrations/_generated/batch_scheduling_dark.png" alt="Static and continuous schedules use the same 0 to 200 completed-iteration axis and three seats. Static requests A, B, and C need 10, 50, and 200 iterations, leaving the first two seats idle. Continuous batching schedules D for iteration 11 and E for iteration 51; both continue beyond the view." />
  <figcaption>On a 200-step horizon with three seats, static batching delivers 260 useful seat-steps and leaves 340 idle (43.3% occupancy). Continuous batching refills freed seats immediately with D at step 11 and E at step 51.</figcaption>
</figure>

## Why autoregressive batches break static scheduling

Unlike image classifiers with fixed inputs and one forward pass, autoregressive LLMs have two properties that defeat static batching:

1. **Two distinct phases:** <span data-glossary="prefill">Prefill</span> reads all prompt tokens in parallel (compute-heavy, governing <span data-glossary="ttft">Time To First Token, TTFT</span>). <span data-glossary="decode-phase">Decode</span> emits one token per step (memory-bandwidth-bound at small batches, governing inter-token latency <span data-glossary="itl">ITL</span> and average <span data-glossary="tpot">TPOT</span>).
2. **Unknown output lengths:** Generation stops on EOS or `max_tokens`, so the <span data-glossary="inference-scheduler">scheduler</span> cannot pack equal-length jobs in advance.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="static-versus-continuous-slot-use.py"
import numpy as np

remaining = np.array([10, 50, 200], dtype=np.int64)
static_capacity = int(remaining.max()) * remaining.size
useful = int(remaining.sum())
print(f"useful seat-steps: {useful} / {static_capacity} ({useful / static_capacity:.1%})")
print(f"idle seat-steps:   {static_capacity - useful}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
useful seat-steps: 260 / 600 (43.3%)
idle seat-steps:   340
```
<!-- leetllm: output:end -->

> **Key insight:** Filling every batch seat does not mean the GPU is compute-bound. Pure decode can hit 100% seat occupancy while staying memory-bandwidth-bound with low <span data-glossary="model-flops-utilization">MFU</span>; co-batching decode tokens with chunked prefill tokens is what lifts per-step arithmetic intensity.

## The throughput, latency, cost triangle

Why not pack as many concurrent streams into a continuous batch as <span data-glossary="vram">VRAM</span> allows? Because every extra active stream adds its own <span data-glossary="kv-cache">KV cache</span> to the bytes read on every decode step. Bigger batches amortize model weight reads, raising aggregate throughput and cutting dollar cost per million tokens, while simultaneously lengthening each step.

Watch the math for Llama 3 8B FP16 (16 GB weights, 32 layers, 8 <span data-glossary="grouped-query-attention">GQA</span> KV heads, head dim 128) serving 4,096-token streams on an H100 SXM (3.35 TB/s peak bandwidth). Each token holds $2 \times 32 \times 8 \times 128 \times 2 = 128\text{ KiB}$ of KV state, so one 4K stream adds 0.50 GiB (0.537 decimal GB) per decode step:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="kv-traffic-and-unit-cost.py"
import numpy as np

weight_bytes = 16_000_000_000.0
kv_per_req = float(2 * 4096 * 32 * 8 * 128 * 2)  # 8B FP16, 4K context (0.50 GiB)
peak_bw = 3.35e12
linear_flops = 2 * 8_000_000_000.0

batches = np.array([1, 8, 32, 64], dtype=np.float64)
bytes_read = weight_bytes + batches * kv_per_req
step_sec = bytes_read / peak_bw
intensities = batches * linear_flops / bytes_read

for b, s, inten in zip(batches.astype(int), step_sec, intensities):
    print(f"B={b:>2}: floor={s * 1000:5.2f} ms, agg={b / s:6.1f} tok/s, intensity={inten:4.1f} FLOPs/byte")

for tps in (2_500, 250):
    cost_per_m = 3.00 / (tps * 3600) * 1_000_000
    print(f"At {tps:>4} sustained tok/s ($3.00/hr GPU) -> ${cost_per_m:.2f} / 1M tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
B= 1: floor= 4.94 ms, agg= 202.6 tok/s, intensity= 1.0 FLOPs/byte
B= 8: floor= 6.06 ms, agg=1320.5 tok/s, intensity= 6.3 FLOPs/byte
B=32: floor= 9.90 ms, agg=3230.9 tok/s, intensity=15.4 FLOPs/byte
B=64: floor=15.03 ms, agg=4257.4 tok/s, intensity=20.3 FLOPs/byte
At 2500 sustained tok/s ($3.00/hr GPU) -> $0.33 / 1M tokens
At  250 sustained tok/s ($3.00/hr GPU) -> $3.33 / 1M tokens
```
<!-- leetllm: output:end -->

Scaling from $B=1$ to $B=64$ multiplies aggregate throughput 21x, yet KV traffic triples the per-step bandwidth floor from 4.94 ms to 15.03 ms and caps linear arithmetic intensity at 20.3 FLOPs/byte. That 10x gap between \$0.33 and \$3.33 per million tokens at \$3.00/hr GPU rent is the core serving trade-off: interactive chat caps batch size to protect p95 ITL, whereas offline batch pipelines saturate the KV pool to minimize unit cost.

### Sizing an 8B replica end-to-end

Now partition one 80 GB card ($80 \times 10^9\text{ B} = 74.51\text{ GiB}$) into weights, runtime activations, and the KV pool:

$$
M_{\text{KV\_pool}} = M_{\text{total}} - M_{\text{weights}} - M_{\text{activations + slack}}
$$

Subtracting 14.90 GiB for 8B FP16 weights and an 8.00 GiB activation/runtime reserve leaves **51.60 GiB** for KV. At 0.50 GiB per 4,096-token prompt, a naive snapshot fits $\lfloor 51.60 / 0.50 \rfloor = 103$ streams. Live requests also generate tokens: reserving 512 output positions (4,608 total = 0.5625 GiB) drops the safe ceiling to **91** concurrent requests. With [PagedAttention](/learn/kv-cache-paged-attention-llm-serving) 16-token blocks, each sequence rounds up individually to whole blocks, eliminating contiguous-allocation external fragmentation while leaving up to 15 unused tail-block slots per request:[^kwon2023]

<figure>
  <img src="illustrations/_generated/paged_kv_blocks_dark.png" alt="Eight physical blocks hold C in P2 through P4 and B in P5, leaving free pairs at P0/P1 and P6/P7. A contiguous three-block request for D cannot fit. Paging maps D logical blocks 0, 1, and 2 to P0, P1, and P6, leaving P7 free while B and C keep their blocks. Each physical block holds 16 tokens, and final-block slack remains reserved for its owning sequence." />
  <figcaption>PagedAttention maps D's three logical blocks to scattered free physical pages P0, P1, and P6 without moving B or C, leaving P7 free. Final-block rounding leaves at most `block_size - 1` slack slots per active stream.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="replica-budget-and-page-admission.py"
import math

BYTES_PER_TOK = 2 * 32 * 8 * 128 * 2  # 128 KiB/token (Llama 3 8B FP16)
BLOCK = 16

device_gib = 80_000_000_000 / 1024**3
weight_gib = 16_000_000_000 / 1024**3
kv_pool_gib = device_gib - weight_gib - 8.0

raw_4k = math.floor(kv_pool_gib / (4096 * BYTES_PER_TOK / 1024**3))
with_512_out = math.floor(kv_pool_gib / ((4096 + 512) * BYTES_PER_TOK / 1024**3))
print(f"KV pool: {kv_pool_gib:.2f} GiB -> {raw_4k} raw 4K streams, {with_512_out} with 512-token headroom")

prompts = [4090, 4096, 4100]
reserved_slots = [((p + 512 + BLOCK - 1) // BLOCK) * BLOCK for p in prompts]
actual_slots = [p + 512 for p in prompts]
print("Reserved slots per request:", reserved_slots)
print("Unused tail-block slots:   ", sum(reserved_slots) - sum(actual_slots))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KV pool: 51.60 GiB -> 103 raw 4K streams, 91 with 512-token headroom
Reserved slots per request: [4608, 4608, 4624]
Unused tail-block slots:    18
```
<!-- leetllm: output:end -->

Note that hybrid architectures store KV only in their full-attention layers: Qwen3.6-27B has 64 layers, but 48 use Gated DeltaNet and only 16 use full attention (4 KV heads, head dim 256, FP16), giving 64 KiB/token (0.25 GiB at 4K) plus separate recurrent state.[^qwen3627b2026]

## The iteration-level scheduling loop

Modern engines cap three independent limits on every step: active sequences (`max_num_seqs`), **per-step token budget** (`max_num_batched_tokens`), and **KV-block capacity**. One 4,000-token prefill consumes far more compute than 96 single-token decodes, so request count alone misstates GPU load.

Suppose 96 decode streams are active and a 1,800-token prompt arrives under `max_num_batched_tokens = 1024`. Decode-first scheduling reserves 96 positions for live streams and hands the remaining 928 positions to a prefill chunk, leaving 872 prompt tokens for the next iteration:

<figure>
  <img src="illustrations/_generated/continuous_batching_dark.png" alt="On one shared 0 to 1,800 position scale, the current 1,024-position iteration contains 96 decode positions and 928 prefill positions. The 1,800-token prompt sends 928 positions now and leaves 872 queued. Position counts describe work placed into the step." />
  <figcaption>With a 1,024-token budget, 96 live decode tokens run first and the remaining 928 slots take a chunk of the 1,800-token prompt, queuing 872 tokens for later steps.</figcaption>
</figure>

### Scheduling policies and preemption

Every policy trades throughput against fairness:

- **FCFS:** Simple and arrival-ordered, but suffers head-of-line blocking when an oversized prompt stalls behind insufficient KV blocks. Scanning past the head fills idle blocks immediately, yet a steady stream of small requests can starve the large request unless you age waiting work or reserve freeing blocks.[^zheng2023a]
- **SJF:** Minimizes average completion time on an idealized serial worker when lengths are known, but LLM output lengths are unknown up front (`max_tokens` is a poor proxy) and batch step times depend on co-scheduled neighbors.
- **Decode-first & priority:** Protects interactive ITL by serving active streams before new prefills, backed by aging or reserved prefill slots so new prompts never starve. Note engine conventions: vLLM V1's `--scheduling-policy priority` serves *smaller* numeric priority values first.[^vllm2026v1][^vllm2026requestqueue]

When growing streams exhaust the KV-block pool mid-generation, the scheduler must **preempt** a victim before launching the next forward pass:

<figure>
  <img src="illustrations/_generated/scheduler_kv_pressure_dark.png" alt="Urgent priority 1 and background priority 0 each have a 16-token prompt and one KV block in a two-block budget. At 17 tokens, each needs a second block, projecting four blocks. The scheduler preempts background and releases its block, reserves both blocks for urgent, then runs urgent. After urgent completes and releases KV, background resumes and completes. The trace uses one preemption and ends with zero of two blocks used." />
  <figcaption>When two active 16-token streams both need a second block in a 2-block pool, the scheduler pauses the lower-priority victim, frees its exclusive block, completes the urgent request, and then resumes the victim.</figcaption>
</figure>

Two recovery paths exist: **Recompute** drops the victim's KV and replays its token history when space opens (default in vLLM V1; simple, no PCIe copy, costs GPU compute), while **Swap-out** copies KV to CPU RAM and back (preserves progress for long histories, costs host-device bandwidth).[^vllm2026optimization][^vllm2026kvoffload]

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
        return self.canceled or self.eos or self.generated_tokens >= self.max_new_tokens


class ContinuousBatchScheduler:
    BLOCK_SIZE = 16

    def __init__(self, max_batch_size: int, max_memory_blocks: int):
        self.max_batch_size = max_batch_size
        self.max_memory_blocks = max_memory_blocks
        self.running: list[Request] = []
        self.waiting: list[Request] = []
        self.swapped: list[Request] = []
        self.used_blocks = 0
        self.preemptions = 0

    def _blocks(self, tokens: int) -> int:
        return (tokens + self.BLOCK_SIZE - 1) // self.BLOCK_SIZE

    def submit(self, req: Request) -> None:
        if self._blocks(req.prompt_len + req.max_new_tokens) > self.max_memory_blocks:
            raise ValueError("request cannot finish within KV capacity")
        self.waiting.append(req)

    def _admit(self, queue: list[Request]) -> None:
        queue.sort(key=lambda r: r.priority, reverse=True)
        while queue and len(self.running) < self.max_batch_size:
            needed = self._blocks(queue[0].total_tokens)
            if self.used_blocks + needed > self.max_memory_blocks:
                break
            req = queue.pop(0)
            req.allocated_blocks = needed
            self.used_blocks += needed
            req.swapped_to_cpu = False
            self.running.append(req)

    def schedule_step(self) -> list[Request]:
        # 1. Retire finished/canceled streams and free exclusively owned KV.
        active = []
        for req in self.running:
            if req.is_finished():
                self.used_blocks -= req.allocated_blocks
                req.allocated_blocks = 0
            else:
                active.append(req)
        self.running = active

        # 2. Resume paused work first, then admit waiting work.
        self._admit(self.swapped)
        self._admit(self.waiting)

        # 3. Preempt lowest-priority victim if next decode token exceeds KV budget.
        while self.running:
            growth = sum(
                max(0, self._blocks(r.total_tokens + 1) - r.allocated_blocks)
                for r in self.running
            )
            if self.used_blocks + growth <= self.max_memory_blocks:
                break
            victim = min(self.running, key=lambda r: (r.priority, r.generated_tokens))
            self.running.remove(victim)
            self.used_blocks -= victim.allocated_blocks
            victim.allocated_blocks = 0
            victim.swapped_to_cpu = True
            self.swapped.append(victim)
            self.preemptions += 1

        for r in self.running:
            g = max(0, self._blocks(r.total_tokens + 1) - r.allocated_blocks)
            r.allocated_blocks += g
            self.used_blocks += g
        return list(self.running)

    def finish_decode_step(self) -> None:
        for r in self.running:
            r.generated_tokens += 1


# Trace 1: Refill seats immediately as requests finish.
sched = ContinuousBatchScheduler(max_batch_size=3, max_memory_blocks=16)
for r in [
    Request("req_A", 8, 3), Request("req_B", 8, 1), Request("req_C", 8, 2),
    Request("req_D", 8, 2), Request("req_E", 8, 1),
]:
    sched.submit(r)
timeline = []
for _ in range(3):
    timeline.append([r.id for r in sched.schedule_step()])
    sched.finish_decode_step()
print("refill timeline:", timeline)
assert timeline == [["req_A", "req_B", "req_C"], ["req_A", "req_C", "req_D"], ["req_A", "req_D", "req_E"]]

# Trace 2: Tight 2-block budget triggers priority preemption before decode.
pressure = ContinuousBatchScheduler(max_batch_size=2, max_memory_blocks=2)
pressure.submit(Request("urgent", 16, 2, priority=1))
pressure.submit(Request("background", 16, 2, priority=0))
active = pressure.schedule_step()
print("under KV pressure:", [r.id for r in active], f"preemptions={pressure.preemptions}")
assert [r.id for r in active] == ["urgent"] and pressure.preemptions == 1
```

<!-- leetllm: output:start -->
```text title="Output" output compact
refill timeline: [['req_A', 'req_B', 'req_C'], ['req_A', 'req_C', 'req_D'], ['req_A', 'req_D', 'req_E']]
under KV pressure: ['urgent'] preemptions=1
```
<!-- leetllm: output:end -->

When recomputing a preempted request, separate **accepted client outputs** from **computed KV positions**. Suppose prompt `[101, 102, 103]` has already emitted `[201, 202]`; the KV cache held `[101, 102, 103, 201]` because `202` was just sampled. On resume, silently replay `[101, 102, 103, 201]` to rebuild KV state without sampling or streaming, then feed `202` as the next decode input.

<figure>
  <img src="illustrations/_generated/preemption_recompute_dark.png" alt="The client-visible output IDs 201 and 202 remain accepted through preemption. Before the pause, KV contains prompt positions 101, 102, and 103 plus generated position 201; sampled token 202 has no KV position yet. The pause releases those four cached positions. Resume replays 101, 102, 103, and 201 without sampling or emitting them again, then uses 202 as the next decode input." />
  <figcaption>Preemption discards cached KV while preserving accepted outputs `[201, 202]`. Resume replays `[101, 102, 103, 201]` silently and feeds `202` as the next decode input.</figcaption>
</figure>

> **Common mistake:** Replaying all tokens up to `output_ids[-1]` and sampling during recomputation mutates already-delivered text or duplicates tokens on the client stream. Also note that [speculative decoding](/learn/speculative-decoding) charges the token budget for all verification input positions (and lookahead KV), not just accepted output tokens.

## Chunked prefill and disaggregated serving

Running a monolithic 4,000-token prefill alongside 96 live decode streams stalls every stream's ITL until the full prompt finishes. **Chunked prefill** (SARATHI / Sarathi-Serve, enabled by default in vLLM V1) slices long prompts into bounded chunks (for example 512 tokens) and co-batches each slice with ongoing decodes under $N_{\text{decode}} + N_{\text{prefill}} \le B_{\text{max}}$.[^agrawal2023][^agrawal2024sarathiServe][^vllm2026optimization]

<figure>
  <img src="illustrations/_generated/chunked_prefill_latency_dark.png" alt="Eight iteration columns show prefill chunks of 512 tokens in the first seven steps and 416 in the tail. The same 96-position decode lane continues through every iteration. The first seven steps total 608 positions each and the tail totals 512. The queue bars shrink after each slice, with seven rescheduling checkpoints; column widths do not represent time." />
  <figcaption>A 4,000-token prompt splits into seven 512-token chunks plus a 416-token tail, sharing each step with 96 decode tokens so live streams advance at every checkpoint.</figcaption>
</figure>

Smaller chunks smooth ITL at the cost of extra kernel launches and slightly longer TTFT; larger chunks favor prompt throughput.

When one shared GPU still cannot satisfy both tight TTFT and tight ITL under heavy prompts, **<span data-glossary="prefill-decode-disaggregation">disaggregated serving</span>** (Splitwise, DistServe) splits prefill and decode onto separate worker pools.[^patel2023][^zhong2024] That eliminates cross-phase interference but introduces a KV state handoff on the critical path:

$$
T_{\text{ready}} = T_{\text{queue, prefill}} + T_{\text{prefill}} + T_{\text{exposed handoff}} + T_{\text{queue, decode}}
$$

<figure>
  <img src="illustrations/_generated/prefill_decode_disaggregation_dark.png" alt="On one assumed 0 to 145 millisecond timeline, prefill queueing takes 20 ms, prefill 60 ms, state handoff 40 ms, decode queueing 15 ms, and the next decode step 10 ms. Early delivery sends token one at 80 ms and token two at 145 ms: TTFT 80 ms passes a 90 ms target, while the 65 ms first gap misses a 30 ms target. Buffered delivery sends token one at 135 ms and token two at 145 ms: TTFT misses, while the 10 ms gap passes. Both policies miss the combined target. Attention KV alone is 0.25 GiB for 4,096 positions; recurrent state and transfer overhead are additional." />
  <figcaption>With a 40 ms handoff and 15 ms decode queue, early token-1 delivery meets a 90 ms TTFT limit (80 ms) but suffers a 65 ms first gap; buffering token 1 until decode readiness hides the gap (10 ms) but pushes TTFT to 135 ms.</figcaption>
</figure>

Serialization alone makes interconnect bandwidth decisive: moving 0.25 GiB of attention KV takes 5.0 ms at 50 GiB/s, 85.9 ms at 25 Gbit/s, and 214.7 ms at 10 Gbit/s before overhead. Always tune chunked prefill on a shared pool first; vLLM's own documentation notes that disaggregated prefill targets separate TTFT/ITL control rather than higher aggregate throughput.[^vllm2026disaggregatedprefill]

## Goodput, engines, and failure signatures

Raw tokens/sec hides missed deadlines. DistServe defines **<span data-glossary="goodput">goodput</span>** as the highest offered request rate $\lambda$ per GPU whose joint SLO attainment (TTFT, TPOT, and optionally p99 ITL) stays at or above a threshold $\alpha$ (such as 90%):[^zhong2024]

$$
\text{Goodput} = \max\left\{\lambda : P(\text{TTFT} \le T_{\text{TTFT}} \land \text{TPOT} \le T_{\text{TPOT}} \land \text{ITL} \le T_{\text{ITL}}) \ge \alpha\right\}
$$

Sweep $\lambda$ with an **open-loop** Poisson or replayed production trace (a closed-loop client hides overload by slowing its own arrivals), count rejected and timed-out requests as failures in the denominator, and report p50/p99 ITL alongside TTFT.[^mlcommons2026inference][^agrawal2024etalon]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="goodput-under-slo.py"
import numpy as np

window_seconds = 10.0
ttft_ms = np.array([120, 450, 180, 190], dtype=np.float64)
tpot_ms = np.array([25, 22, 42, 27], dtype=np.float64)
within_slo = (ttft_ms <= 300.0) & (tpot_ms <= 30.0)

print(f"raw throughput:       {ttft_ms.size / window_seconds:.2f} req/s")
print(f"SLO-compliant rate:   {int(within_slo.sum()) / window_seconds:.2f} req/s ({int(within_slo.sum())}/{ttft_ms.size})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw throughput:       0.40 req/s
SLO-compliant rate:   0.20 req/s (2/4)
```
<!-- leetllm: output:end -->

Across production engines, the same primitives recur: **vLLM V1** pairs paged KV with default chunked prefill and recompute preemption;[^vllm2026optimization] **SGLang** combines continuous batching with RadixAttention <span data-glossary="prefix-cache">prefix reuse</span>;[^zheng2023a] **TensorRT-LLM** implements in-flight batching;[^nvidia2024] and **Mooncake** separates KV storage across DRAM/SSD/RDMA with early rejection.[^qin2024]

| Failure signature | Check first | Lever to test |
|---|---|---|
| High raw TPS, violent p99 ITL spikes | Whether long gaps align with large prefill steps | Shrink chunk size or `max_num_batched_tokens`; recheck TTFT and ITL |
| Stable p50 ITL, climbing p99 TTFT | Prefill queue wait by class under decode-first | Age waiting prompts, reserve prefill budget, or shed infeasible load |
| Mid-generation OOM or preemption storms | Resident blocks + projected decode growth | Reserve output headroom and lower concurrency; check swap vs. recompute cost |
| Disaggregated TTFT worse than colocated | Queue + exposed handoff + first-token buffering | Improve KV locality/link bandwidth, rebalance P/D pools, or return to chunked colocation |

Always separate **health** from **load**: a worker at its KV or queue limit should reject or defer new requests cleanly rather than failing its liveness probe, because restarting a full worker destroys live streams and warm caches right when capacity is tightest.

```mastery-quiz
[
  {
    "question": "A decode-ready simulator has 3 seats and 5 FCFS requests with remaining lengths [4, 9, 6, 5, 2], arriving together. Static runs [4, 9, 6] then [5, 2]. What continuous finish step and saving follow?",
    "options": [
      "Finish 14; save 0 steps.",
      "Finish 9; save 5 steps.",
      "Finish 11; save 3 steps.",
      "Finish 8; save 6 steps."
    ],
    "answer": "Finish 9; save 5 steps.",
    "explanation": "Seat 1 runs 4 then 5 (finishes at 9), Seat 2 runs 9 (finishes at 9), Seat 3 runs 6 then 2 (finishes at 8). Static takes 9 + 5 = 14, so continuous batching finishes at step 9 and saves 5 steps."
  },
  {
    "question": "An 80 GB card (74.51 GiB) reserves 14.90 GiB for 8B FP16 weights and 8.00 GiB for runtime activations, leaving 51.60 GiB for KV (128 KiB/token). Each stream has a 4,096-token prompt and reserves 512 output tokens. How many concurrent streams fit?",
    "options": [
      "103 streams",
      "91 streams",
      "128 streams",
      "64 streams"
    ],
    "answer": "91 streams",
    "explanation": "4,608 total tokens at 128 KiB/token take 0.5625 GiB per stream, so floor(51.60 / 0.5625) = 91 streams. 103 ignores the 512-token output reservation."
  },
  {
    "question": "A decode-first step has a budget of 48 input positions and 11 active decode streams. A waiting prompt has 90 positions left and KV fits. How many prompt positions run now and how many remain?",
    "options": [
      "48 now; 42 remain.",
      "37 now; 53 remain.",
      "11 now; 79 remain.",
      "90 now; 0 remain."
    ],
    "answer": "37 now; 53 remain.",
    "explanation": "Decode takes 11 positions first, leaving 48 - 11 = 37 for the prompt chunk and 90 - 37 = 53 queued for subsequent steps."
  },
  {
    "question": "A client has received outputs [21, 22, 23] for prompt [11, 12] when the request is preempted just after sampling 23. On recompute resume, what should replay rebuild, what is the next decode input, and what goes to the client during replay?",
    "options": [
      "Replay through 12; input 21; resend saved outputs.",
      "Replay through 22; input 23; resend saved outputs.",
      "Replay through 22; input 23; send nothing during replay.",
      "Replay through 12; input 21; send nothing during replay."
    ],
    "answer": "Replay through 22; input 23; send nothing during replay.",
    "explanation": "KV held [11, 12, 21, 22] when 23 was sampled. Replay those four tokens silently without sampling or emitting, then feed 23 as the next decode input."
  },
  {
    "question": "Ten requests arrive in 20 seconds; 5 time out and 5 finish with (TTFT, TPOT) in ms: (90, 20), (140, 38), (310, 17), (220, 26), (160, 22). Limits are 250 ms TTFT and 30 ms TPOT. What are completed rate, compliant rate, and offered SLO attainment?",
    "options": [
      "0.50 req/s, 0.15 req/s, 60%.",
      "0.25 req/s, 0.20 req/s, 40%.",
      "0.50 req/s, 0.20 req/s, 80%.",
      "0.25 req/s, 0.15 req/s, 30%."
    ],
    "answer": "0.25 req/s, 0.15 req/s, 30%.",
    "explanation": "5 completions / 20 s = 0.25 req/s. Three replies meet both limits, giving 3/20 = 0.15 req/s compliant rate and 3/10 = 30% attainment over all 10 offered requests (timeouts count as failures)."
  },
  {
    "question": "A request waits 15 ms for prefill (45 ms), followed by 35 ms KV handoff, 20 ms decode queue, and 5 ms decode for token 2. Limits are 100 ms TTFT and 70 ms first gap. Compare early token-1 delivery vs. buffering until decode starts.",
    "options": [
      "Early (60, 60) passes; buffered (115, 5) fails.",
      "Early (45, 75) fails; buffered (95, 25) passes.",
      "Early (45, 75) fails; buffered (115, 5) fails.",
      "Early (60, 60) passes; buffered (95, 25) passes."
    ],
    "answer": "Early (60, 60) passes; buffered (115, 5) fails.",
    "explanation": "Prefill ends at 60 ms and decode starts at 115 ms, with token 2 at 120 ms in both cases. Early delivery gives TTFT 60 ms and gap 60 ms (passes); buffering gives TTFT 115 ms (fails) and gap 5 ms."
  }
]
```

> **Next:** Continue to [Speculative Decoding](/learn/speculative-decoding).
