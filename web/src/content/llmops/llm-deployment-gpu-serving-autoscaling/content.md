---
{
  "id": "llm-deployment-gpu-serving-autoscaling",
  "title": "GPU Serving & Autoscaling",
  "slug": "llm-deployment-gpu-serving-autoscaling",
  "category": "MLOps & Deployment",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/autoscaling_control_loop_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Amazon",
    "Microsoft",
    "Anthropic"
  ],
  "shortDescription": "At 9:00 a release freeze sends 100 incident summaries at one warm GPU. Queue age, not utilization, decides whether to add replicas.",
  "keyConceptsTested": [
    "Model serving frameworks (vLLM, TGI, TensorRT-LLM, llama.cpp)",
    "Continuous batching for throughput",
    "PagedAttention, prefix caching, and logical vs physical KV blocks",
    "GPU autoscaling strategies (Queue Depth, KV Utilization)",
    "Multi-Instance GPU (MIG) for cost efficiency",
    "Cold start mitigation (warm pools, local caching, predictive scaling)",
    "Quantization methods (FP8, INT8, AWQ, GPTQ)",
    "Cost optimization: spot instances, multi-tenancy",
    "Latency metrics: TTFT, ITL/TBT, and TPOT"
  ],
  "section": "GPU Systems & LLM Inference",
  "order": 20,
  "prerequisites": [
    "inference-mechanics-ttft-tps-kv-cache",
    "kv-cache-paged-attention-llm-serving",
    "continuous-batching-request-scheduling",
    "model-parallelism-for-llm-inference",
    "model-quantization-gptq-awq-gguf"
  ],
  "relatedQuestions": [
    "distributed-inference-data-plane",
    "serving-benchmark-engineering",
    "experiment-design-ab-testing",
    "llm-cost-engineering-token-economics",
    "design-multi-tenant-llm-serving-platform",
    "design-reasoning-agent-test-time-compute"
  ]
}
---
<!-- leetllm: edition:reference:start -->
At 8:59, a single warm GPU handles incident summaries without accumulating a backlog. At 9:00, a release freeze sends 100 requests to the endpoint in one burst. Queue age begins to climb, first-token latency breaches interactive budgets, and reactive replica scaling starts provisioning new machines minutes after callers have timed out. High GPU utilization alone never tells you whether to add replicas, throttle incoming load, or adjust batch memory; you need the end-to-end request path, the per-request memory footprint, and the clock on which new GPUs actually become ready.

[Advanced MLOps and DevOps for AI](/learn/observability-monitoring-llm-systems) covered promotion gates, artifact lineage, <span data-glossary="rollout">rollout</span> policy, and automated <span data-glossary="rollback">rollback</span> triggers. Serving engineering extends that discipline to live <span data-glossary="gpu">GPU</span> fleets so promoted checkpoints stay within latency and cost targets under shifting production traffic. Unlike a stateless HTTP service that releases memory once a handler returns, an inference engine keeps multi-gigabyte model weights resident in HBM and holds attention keys and values across every generated <span data-glossary="token">token</span>. That **<span data-glossary="kv-cache">KV cache</span>** sets the concurrency ceiling in standard transformers, while hybrid models with linear-attention layers add a fixed per-request recurrent state alongside it.

Production inference teams monitor three complementary latency quantities and attach <span data-glossary="slo">service-level objectives (SLOs)</span> to each. **Time To First Token (TTFT)** measures elapsed time from request arrival to the first emitted token. It combines queue wait, any cold startup delay, and the compute-heavy **<span data-glossary="prefill">prefill</span>** pass across prompt tokens. **Inter-Token Latency (ITL)**, often called Time Between Tokens (TBT), records individual gaps between consecutive outputs so p95 and p99 percentiles expose pauses hidden inside averages. Always check what your collector samples: in vLLM, `vllm:inter_token_latency_seconds` records gaps between streamed output events that can hold multiple tokens.[^vllm2026metrics] **Time Per Output Token (TPOT)** divides total generation time after the first token by `(output_tokens - 1)` when at least two tokens are produced, summarizing average streaming throughput while tail <span data-glossary="itl">ITL</span> tracks decode stalls.

Measure server-side and client-side streams separately because network buffering and speculative decoding routinely pack several tokens into a single Server-Sent Event (SSE). When multiple tokens ride inside one chunk, event-level timestamps conceal the true step-by-step generation cadence inside the batch. In the following NumPy calculation, a stream arrives at `0 ms`, emits its first token at `300 ms`, and delivers later tokens at `340`, `380`, and `500 ms`. Mean TPOT reads as a moderate `66.7 ms`, whereas inspecting individual intervals reveals a `120 ms` tail stall on the final token step.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="stream-latency.py"
import numpy as np

def analyze_stream(arrival_ms: float, token_ms: list[float]) -> dict[str, float]:
    times = np.asarray(token_ms, dtype=float)
    if times.size == 0 or np.any(times < arrival_ms) or np.any(np.diff(times) < 0):
        raise ValueError("token timestamps must be non-decreasing from arrival_ms")
    ttft = float(times[0] - arrival_ms)
    gaps = np.diff(times)
    tpot = float((times[-1] - times[0]) / (times.size - 1)) if times.size >= 2 else np.nan
    return {
        "ttft_ms": ttft,
        "mean_tpot_ms": tpot,
        "p95_gap_ms": float(np.percentile(gaps, 95)) if gaps.size else 0.0,
        "max_gap_ms": float(np.max(gaps)) if gaps.size else 0.0,
    }

report = analyze_stream(0.0, [300.0, 340.0, 380.0, 500.0])
print(
    f"TTFT={report['ttft_ms']:.1f}ms TPOT={report['mean_tpot_ms']:.1f}ms "
    f"p95_gap={report['p95_gap_ms']:.1f}ms max_gap={report['max_gap_ms']:.1f}ms"
)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
TTFT=300.0ms TPOT=66.7ms p95_gap=112.0ms max_gap=120.0ms
```
<!-- leetllm: output:end -->

Bundled SSE chunks separate event cadence from token speed even further. Consider two logged SSE events where `1` token lands at `300 ms` and `3` bundled tokens arrive together at `340 ms`: the inter-event histogram records one `40 ms` gap, yet `4` tokens total give `3` post-first-token intervals and a request TPOT of `40 / 3 = 13.33 ms`. Keep collector definitions consistent when comparing dashboards against load generators as well, because vLLM Prometheus request histograms log zero-second TPOT entries for single-token generations whereas `vllm bench serve` excludes them.[^vllm2026metrics]

<!-- leetllm: test, output=show -->
```python title="bundled-output-events.py"
events = [(300.0, 1), (340.0, 3)]  # (timestamp_ms, token_count)
total_tokens = sum(count for _, count in events)
event_gaps = [events[i][0] - events[i - 1][0] for i in range(1, len(events))]
request_tpot_ms = (events[-1][0] - events[0][0]) / (total_tokens - 1)
print(f"tokens={total_tokens} event_gaps_ms={event_gaps} request_tpot_ms={request_tpot_ms:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tokens=4 event_gaps_ms=[40.0] request_tpot_ms=13.33
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/bundled_event_observability_dark.png" alt="Comparison of per-token streaming intervals against chunked SSE output events: four tokens delivered as one token at 300 ms and three bundled tokens at 340 ms expose only one 40 ms inter-event gap while hiding the internal token intervals inside the chunk." />
  <figcaption>Two SSE output events expose only a 40 ms chunk interval, while dividing by three post-first-token steps puts request TPOT at 13.3 ms.</figcaption>
</figure>

## Why GPU serving isn't web serving

Stateless web autoscalers react comfortably in a few seconds because lightweight containers pull quickly and per-request heap allocations vanish as soon as an endpoint returns. GPU workers allocate multi-gigabyte weight tensors up front, require minutes to provision accelerator nodes and pull large runtime images, and dedicate substantial HBM to active sequence KV blocks throughout generation. Furthermore, prefix-cache blocks with zero live references remain evictable for reuse, whereas active streams pin physical KV blocks until completion or cancellation. Scaling mechanically on raw GPU compute duty cycle misreads memory bandwidth stalls and hides rising queue wait times until callers are already dropping.

## The GPU serving stack

Reliable inference splits into two feedback loops operating on completely different timescales: a sub-second data path that schedules or sheds incoming requests against existing capacity, and a multi-minute control loop that provisions GPU nodes and initializes fresh workers. When demand outruns active workers, only the fast data path can protect tail latency by holding queue bounds and shedding excess traffic cleanly with `429 Retry-After`. Meanwhile, pressure telemetry feeds the slower control plane so replacement replicas come online in the background without dragging active tokens down.

<figure>
  <img src="illustrations/_generated/gpu_serving_dark.png" alt="Two connected serving loops. A queue with an original deadline enters capacity gating, a ready batch, GPU decode, and a token stream. Rejected requests return 429 with Retry-After and signal the capacity loop. Future replicas join the ready batch only after their engines are loaded, warm, and healthy." />
  <figcaption>The fast data path protects ready capacity with queue deadlines and concurrency limits, while the slower control loop provisions, loads, and warms future GPU replicas.</figcaption>
</figure>

Three distinct layers cooperate across this split architecture. At the front door, the **edge gateway** enforces end-to-end request deadlines, strips stale retry loops, honors `Retry-After` backoff headers, and prevents timeout storms from amplifying overload. Below it, the **<span data-glossary="control-plane">control layer</span>** pairs <span data-glossary="prometheus">Prometheus</span> telemetry with <span data-glossary="keda">KEDA</span> for <span data-glossary="kubernetes">Kubernetes</span> replica scaling (including scale-to-zero wakeups) and <span data-glossary="karpenter">Karpenter</span> for provisioning matching GPU instances when pending pods have nowhere to land.[^keda2026][^karpenter2026] Finally, the **inference engine** (vLLM, SGLang, or TensorRT-LLM) manages weight execution, <span data-glossary="continuous-batching">continuous batching</span>, paged KV memory, and the <span data-glossary="inference-scheduler">inference scheduler</span>.

### Scheduled, started, and ready are different states

Scheduling a pod onto a GPU node, starting the container process, finishing checkpoint loads, compiling runtime kernels, and serving live requests are distinct operational phases.[^kubernetes2026Probes] Misaligned Kubernetes health probes frequently turn a heavy traffic surge into a self-inflicted crash loop. A **startup probe** shorter than true cold load duration kills workers while weights are still streaming into HBM. A **readiness probe** wired to an auxiliary HTTP sidecar leaks traffic before the model finishes initializing, while a **liveness probe** that treats full batch slots as an error forces Kubernetes to terminate healthy workers and wipe all active generations.

Every worker should maintain explicit lifecycle state transitions and expose unambiguous HTTP responses rather than overloading `500` or crashing. While loading weights, warming kernels, failing internal health checks, or draining, the engine immediately returns `503` locally because Service endpoint propagation lags behind pod updates. Duplicate request IDs return `409` while preserving the existing stream, full capacity sheds load with `429` while liveness stays green, and open slots accept requests with `200` until graceful drain closes local intake while active streams finish.

<!-- leetllm: test, output=show -->
```python title="worker-readiness.py"
from dataclasses import dataclass, field

@dataclass
class Worker:
    max_slots: int = 2
    loaded: bool = False
    warmed: bool = False
    healthy: bool = True
    draining: bool = False
    active: set[str] = field(default_factory=set)

    def enqueue(self, req_id: str) -> int:
        if not (self.loaded and self.warmed and self.healthy) or self.draining:
            return 503
        if req_id in self.active:
            return 409
        if len(self.active) >= self.max_slots:
            return 429
        self.active.add(req_id)
        return 200

    def release(self, req_id: str) -> None:
        self.active.discard(req_id)

w = Worker()
assert w.enqueue("a") == 503
w.loaded = w.warmed = True
assert (w.enqueue("a"), w.enqueue("b"), w.enqueue("b"), w.enqueue("c")) == (200, 200, 409, 429)
w.draining = True
assert w.enqueue("d") == 503
w.release("a")
assert w.active == {"b"} and w.enqueue("e") == 503
print("lifecycle verified: load/warm=503, ready=200, dup=409, full=429, drain=503")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
lifecycle verified: load/warm=503, ready=200, dup=409, full=429, drain=503
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/worker_readiness_lifecycle_dark.png" alt="Inference worker readiness and drain lifecycle: a pod progresses from loading weights and warmup to ready serving, returns HTTP 409 for duplicate IDs and HTTP 429 when capacity is full without failing liveness, and returns HTTP 503 during drain while active streams finish." />
  <figcaption>A full worker returns HTTP 429 while staying healthy on liveness checks. Draining flips local intake to 503 immediately while active generations finish.</figcaption>
</figure>

## Serving frameworks

### Static batches wait for the longest reply

Under classic static batching, shorter generations in a batch hold their slots idle until the longest response completes and emits an end-of-sequence token. Orca introduced iteration-level **continuous batching**, letting the engine reclaim freed slots on every single forward decode step and insert newly queued requests immediately.[^yu2022] Consider four replies of `8`, `2`, `5`, and `3` generated tokens running across two batch slots. Static batching takes `max(8, 2) + max(5, 3) = 13` steps and wastes `8` empty slot-steps (`69%` occupancy), whereas continuous batching finishes in `10` steps with only `2` tail idle slot-steps (`90%` occupancy).

<!-- leetllm: test, output=show -->
```python title="continuous-batching-slot-steps.py"
replies = [8, 2, 5, 3]
static_steps = max(replies[0], replies[1]) + max(replies[2], replies[3])
static_idle = 2 * static_steps - sum(replies)

slots = [0, 0]
queue = list(replies)
cont_steps = 0
cont_idle = 0
while any(s > 0 for s in slots) or queue:
    for i in range(len(slots)):
        if slots[i] == 0 and queue:
            slots[i] = queue.pop(0)
    cont_steps += 1
    cont_idle += sum(1 for s in slots if s == 0)
    slots = [max(0, s - 1) for s in slots]

print(f"static: steps={static_steps} idle={static_idle} occ={sum(replies)/(2*static_steps):.0%}")
print(f"continuous: steps={cont_steps} idle={cont_idle} occ={sum(replies)/(2*cont_steps):.0%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
static: steps=13 idle=8 occ=69%
continuous: steps=10 idle=2 occ=90%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/continuous_batching_dark.png" alt="Batch scheduling comparison on two decode slots serving replies of 8, 2, 5, and 3 tokens: static batching takes 13 total steps with 8 wasted empty slot-steps waiting for the longest reply, while continuous batching takes 10 steps with only 2 wasted empty slot-steps, raising slot occupancy from 69 percent to 90 percent." />
  <figcaption>Refilling freed decode slots on iteration boundaries trims total steps from 13 to 10 and cuts idle slot-steps from 8 to 2.</figcaption>
</figure>

### vLLM and PagedAttention

Early engines also starved batch concurrency by reserving contiguous KV buffers sized for the worst-case `max_model_len` up front. Most interactive prompts never reach maximum sequence length, so huge fractions of HBM sat untouched while incoming requests waited in queues. **<span data-glossary="pagedattention">PagedAttention</span>** eliminates this internal fragmentation by dividing each sequence's KV cache into fixed-size logical blocks (typically `16` tokens per block) mapped through a per-request block table onto scattered physical HBM blocks.[^kwon2023] Only the trailing block of each active request holds unallocated slack tokens, allowing memory to grow one page at a time as decoding proceeds.

<figure>
  <img src="illustrations/_generated/paged_attention_blocks_dark.png" alt="PagedAttention virtual-to-physical KV cache mapping: contiguous logical token blocks L0, L1, and L2 translate through the per-sequence Block Table to scattered physical HBM blocks P5, P2, and P8 while free block P1 remains available for the next generated page." />
  <figcaption>Per-sequence block tables map contiguous logical blocks L0, L1, and L2 to scattered physical blocks P5, P2, and P8 while leaving P1 free for growth or sharing.</figcaption>
</figure>

When requests share common system instructions, schemas, or retrieved context prefixes, **automatic <span data-glossary="prefix-cache">prefix caching</span>** hashes parent blocks and maps matching prefixes to shared read-only physical blocks using copy-on-write on divergence.[^vllm2026prefix] The memory accounting script below compares dynamic block paging against worst-case fixed buffers (`max_model_len = 2048`, `block_size = 16`) for four active prompts of `320`, `75`, `900`, and `250` tokens. Paging consumes `98` blocks (`1,568` slots with `23` trailing slack tokens) instead of `512` worst-case blocks (`8,192` slots). That keeps `6,624` slots (`81%` of worst-case space) free for additional concurrent users.

<!-- leetllm: test, output=show -->
```python title="paged-kv-block-accounting.py"
import math

seq_lengths = [320, 75, 900, 250]
block_size = 16
max_len = 2048

paged_blocks = sum(math.ceil(n / block_size) for n in seq_lengths)
paged_slots = paged_blocks * block_size
fixed_slots = len(seq_lengths) * max_len
slack = paged_slots - sum(seq_lengths)

print(f"tokens={sum(seq_lengths)} paged_blocks={paged_blocks} paged_slots={paged_slots} slack={slack}")
print(f"fixed_slots={fixed_slots} saved_slots={fixed_slots - paged_slots} ({1 - paged_slots/fixed_slots:.0%})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tokens=1545 paged_blocks=98 paged_slots=1568 slack=23
fixed_slots=8192 saved_slots=6624 (81%)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/paged_allocation_slack_dark.png" alt="KV cache slot utilization across four prompts of 320, 75, 900, and 250 tokens: 1,545 active tokens occupy 98 paged blocks (1,568 slots, only 23 trailing slack slots) compared against 512 fixed maximum-length blocks (8,192 slots), saving 6,624 KV slots." />
  <figcaption>Dynamic block paging bounds per-sequence waste to at most 15 tokens in the final page, reclaiming 6,624 KV slots across four mixed-length prompts.</figcaption>
</figure>

Even with paged memory, long prefills compete directly with decode steps unless chunked prefill bounds how many tokens enter a single iteration. Separating queue wait (`180 ms`), prefill (`120 ms`), and per-step decode intervals (`40`, `40`, and `120 ms`) pinpoints where latency accumulated. Engineers can tell at a glance whether delays happened waiting in the queue before prefill or during a mid-stream scheduling stall.

<figure>
  <img src="illustrations/_generated/request_lifecycle_dark.png" alt="Server-side LLM request timeline: 180 ms queue wait plus 120 ms prefill produces a 300 ms TTFT. Subsequent decoded tokens arrive at 340, 380, and 500 ms, exposing inter-token intervals of 40 ms, 40 ms, and a 120 ms tail stall behind a 66.7 ms mean TPOT." />
  <figcaption>Queue wait and prefill combine into TTFT (300 ms), while individual inter-token intervals expose the 120 ms decode stall inside the 200 ms generation phase.</figcaption>
</figure>

### Compare engines against one request shape

Choice of serving runtime shapes kernel throughput, prefix sharing semantics, and operational support overhead:

| Engine | Best fit | Operational watchpoints |
|---|---|---|
| **<span data-glossary="vllm">vLLM</span>** | High-throughput GPU serving with PagedAttention, continuous batching, and LoRA | Keep Prometheus histogram rules aligned with client SLIs[^vllm2026metrics][^vllm2026optimization] |
| **SGLang**[^zheng2023a] | Tree-structured prefix caching (`RadixAttention`), multi-turn agents, and constrained decoding | Track runtime memory pool and radix eviction behavior under multi-tenant workloads |
| **TensorRT-LLM**[^nvidia2026TensorRtBackendRemoval] | Maximum NVIDIA throughput; current migration moves execution to a PyTorch backend | Pin release versions carefully during backend transitions |
| **TGI**[^huggingface2026tgi] | Legacy Hugging Face serving stacks | Officially in maintenance mode; plan migration paths toward vLLM or SGLang |
| **llama.cpp**[^llamacpp2023] | Quantized GGUF execution on CPU, Apple Silicon, or mixed edge nodes | Validate per-backend latency and context batch limits directly |

Here is a reference <span data-glossary="vllm">vLLM</span> configuration pairing paged prefix caching with `enable_chunked_prefill` so large prompt arrivals cannot starve ongoing decode streams:

```python title="vllm-prod-config.py"
# vllm_prod_config.py (configuration reference; requires GPU runtime)
from vllm import AsyncEngineArgs

engine_args = AsyncEngineArgs(
    model="Qwen/Qwen3.6-27B",
    max_model_len=8192,
    gpu_memory_utilization=0.90,
    enable_prefix_caching=True,
    enable_chunked_prefill=True,
    max_num_batched_tokens=4096,
    max_num_seqs=64,
)
```

## Benchmark the path you'll operate

Engine microbenchmarks rarely capture what users experience behind an edge ingress tier. Replay representative prompt-length distributions, prefix cache hit ratios, and timeout policies through the complete gateway and load balancer. Measuring the full serving path exposes HTTP queue overhead, SSE framing jitter, and SLO attainment at realistic concurrency before rollout.

## GPU infrastructure

### Sizing and selection

Total <span data-glossary="vram">VRAM</span> consumption decomposes into resident weights, growing attention KV cache, fixed hybrid recurrent state when present, and activation/CUDA graph reserves (budgeted at `15%` here). For <span data-glossary="multi-head-attention">attention</span> with grouped-query heads (`num_kv_heads`, `head_dim`, and `num_kv_layers` full-attention layers in 2-byte FP16/BF16), KV bytes per active request at sequence length $L$ equal:

$$
\text{KV}_{\text{req}} = 2 \times \text{num\_kv\_layers} \times \text{num\_kv\_heads} \times \text{head\_dim} \times 2\text{ bytes} \times L
$$

`Qwen3.6-27B` arranges `64` language layers into `16` repeating `[3 linear + 1 full]` blocks, meaning only `16` full-attention layers expand KV with sequence length while `48` linear-attention layers maintain a fixed per-request matrix state.[^qwen3627b2026] Beyond single-card memory fits, pairing VRAM accounting with an Erlang-C (M/M/k) queueing calculation via NumPy and SciPy exposes how much replica concurrency you need to keep queue wait probabilities low as arrival rates approach capacity.

<!-- leetllm: test, output=show, deps=numpy,scipy -->
```python title="sizing-and-selection.py"
import math
import numpy as np
from scipy.special import gammaln

def memory_budget_gb(
    params_b: float,
    kv_layers: int,
    kv_heads: int,
    head_dim: int,
    context_len: int,
    concurrency: int,
    fixed_state_bytes: float = 0.0,
) -> dict[str, float]:
    weights = params_b * 2.0e9
    kv_per_tok = 2 * kv_layers * kv_heads * head_dim * 2
    kv_bytes = concurrency * context_len * kv_per_tok
    hybrid_bytes = concurrency * fixed_state_bytes
    subtotal = weights + kv_bytes + hybrid_bytes
    return {
        "weights_gb": weights / 1e9,
        "kv_gb": kv_bytes / 1e9,
        "hybrid_gb": hybrid_bytes / 1e9,
        "total_gb": (subtotal * 1.15) / 1e9,
    }

def erlang_c_wait_prob(arrival_rps: float, service_s: float, replicas: int, slots_per_rep: int) -> float:
    k = replicas * slots_per_rep
    rho = arrival_rps * service_s
    u = rho / k
    if u >= 1.0:
        return 1.0
    log_terms = np.array([n * math.log(rho) - gammaln(n + 1) for n in range(k)])
    log_pk = k * math.log(rho) - gammaln(k + 1) - math.log(1.0 - u)
    m = max(float(np.max(log_terms)), log_pk)
    return float(math.exp(log_pk - m) / (np.sum(np.exp(log_terms - m)) + math.exp(log_pk - m)))

chat_8b = memory_budget_gb(8.0, 32, 8, 128, 4096, 8)
qwen_linear = 48 * 16 * 128 * (48 // 16) * 128 * 4  # 48 linear layers, FP32 recurrent state
qwen_27b = memory_budget_gb(27.0, 16, 4, 256, 8192, 4, fixed_state_bytes=qwen_linear)

for name, spec in [("8B BF16 (4k, c=8)", chat_8b), ("Qwen3.6-27B (8k, c=4)", qwen_27b)]:
    gpus = math.ceil(spec["total_gb"] / 76.0)
    print(f"{name}: w={spec['weights_gb']:.1f} kv={spec['kv_gb']:.1f} hyb={spec['hybrid_gb']:.1f} total={spec['total_gb']:.1f} GB -> {gpus} H100")

for reps in [4, 5, 6]:
    pw = erlang_c_wait_prob(arrival_rps=1.8, service_s=8.0, replicas=reps, slots_per_rep=4)
    print(f"replicas={reps} (slots={reps*4}): P(queue_wait)={pw:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
8B BF16 (4k, c=8): w=16.0 kv=4.3 hyb=0.0 total=23.3 GB -> 1 H100
Qwen3.6-27B (8k, c=4): w=54.0 kv=2.1 hyb=0.6 total=65.3 GB -> 1 H100
replicas=4 (slots=16): P(queue_wait)=0.591
replicas=5 (slots=20): P(queue_wait)=0.117
replicas=6 (slots=24): P(queue_wait)=0.014
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/hybrid_memory_budget_dark.png" alt="GPU memory footprint comparison under a 76 GB budget: a dense 8B BF16 deployment uses 16.0 GB weights, 4.3 GB growing KV, and 3.0 GB overhead (23.3 GB total), while Qwen3.6-27B language component combines 54.0 GB weights, 2.1 GB KV across 16 full-attention layers, 0.6 GB fixed state across 48 linear layers, and 8.5 GB overhead for 65.3 GB total." />
  <figcaption>Under a 76 GB usable H100 budget, Qwen3.6-27B language weights leave room for 16 full-attention KV layers, 48 fixed linear-attention states, and runtime overhead at 8k context and concurrency 4.</figcaption>
</figure>

#### Multi-Instance GPU (MIG)

For smaller `1B` to `8B` models or isolated tenant pools, **NVIDIA MIG** carves an A100 or H100 into hardware-partitioned GPU instances with dedicated SM slices and memory controllers (up to `7` `1g.10gb` slices on an 80 GB H100).[^nvidia2026mig] Hardware isolation prevents noisy-neighbor interference across co-located workloads far better than software time-slicing. Always benchmark sliced instances under realistic prompts before deploying, because partitioning also divides available HBM bandwidth per worker.

### Find the decode ceiling

At batch size `1`, generating one autoregressive token reads almost every active model weight from HBM, making decode throughput memory-bandwidth bound:

$$
\text{Tokens/s ceiling} \approx \frac{\text{HBM Bandwidth}}{\text{Active Weight Bytes}}
$$

An H100 SXM card provides roughly `3,350 GB/s` peak HBM3 bandwidth.[^nvidia2026h100] Compressing a `27B` checkpoint from BF16 (`54 GB`) to INT8 or FP8 (`27 GB`) halves weight traffic and doubles the single-stream decode ceiling from `62.0` to `124.1` tokens/s. A smaller `8B` BF16 checkpoint (`16 GB`) pushes the weight-only ceiling to `209.4` tokens/s before KV cache fetches or kernel launch latency take effect.

<!-- leetllm: test, output=show -->
```python title="decode-bandwidth-ceiling.py"
hbm_gb_s = 3350.0
for label, active_gb in [("8B BF16", 16.0), ("27B INT8/FP8", 27.0), ("27B BF16", 54.0)]:
    print(f"{label:14s}: {hbm_gb_s / active_gb:6.1f} tok/s (weight-only batch=1 ceiling)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
8B BF16       :  209.4 tok/s (weight-only batch=1 ceiling)
27B INT8/FP8  :  124.1 tok/s (weight-only batch=1 ceiling)
27B BF16      :   62.0 tok/s (weight-only batch=1 ceiling)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/decode_bandwidth_chart_dark.png" alt="Weight-only batch-size-one decode ceilings on an H100 SXM GPU at 3,350 GB/s HBM bandwidth: 8B BF16 (16 GB weights) reaches 209.4 tokens/s, dense 27B INT8 (27 GB weights) reaches 124.1 tokens/s, and dense 27B BF16 (54 GB weights) reaches 62.0 tokens/s." />
  <figcaption>Memory bandwidth caps single-stream decode throughput: halving active weight bytes with INT8 or FP8 doubles the H100 ceiling from 62.0 to 124.1 tokens/s.</figcaption>
</figure>

### Tensor parallelism

When checkpoints exceed a single GPU's memory or TTFT targets require multi-GPU matrix splits, **Tensor Parallelism (TP)** shards every layer inside one node and triggers two all-reduce collectives per transformer layer under <span data-glossary="nvidia-megatron">Megatron</span> layout.[^shoeybi2019][^pope2023] Keep TP confined to fast intra-node NVLink or NVSwitch interconnects whenever possible so collective synchronization stays fast. Across slower inter-node links, **Pipeline Parallelism (PP)** replaces per-layer syncs (`5,120` collectives on `80` layers over `32` steps) with infrequent stage handoffs (`96` transfers across `4` stages), trading synchronization count for pipeline bubbles.

<!-- leetllm: test, output=show -->
```python title="parallelism-communication-check.py"
layers, stages, decode_steps = 80, 4, 32
tp_syncs = layers * 2 * decode_steps
pp_handoffs = (stages - 1) * decode_steps
print(f"TP_syncs={tp_syncs} PP_handoffs={pp_handoffs}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
TP_syncs=5120 PP_handoffs=96
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/parallelism_topologies_dark.png" alt="Tensor parallelism versus pipeline parallelism across 4 GPUs on an 80-layer model over 32 decode steps: tensor parallelism splits every layer inside an NVLink node with 2 all-reduce syncs per layer (5,120 sync events), while pipeline parallelism splits layers into sequential stage handoffs across nodes (96 boundary transfers) at the cost of pipeline bubbles." />
  <figcaption>Tensor parallelism synchronizes inside every transformer layer over fast NVLink, while pipeline parallelism limits communication to stage handoffs at the cost of bubbles.</figcaption>
</figure>

## Autoscaling strategies

### Key metrics

Combine hardware telemetry from <span data-glossary="nvidia-dcgm">NVIDIA DCGM</span> (`DCGM_FI_DEV_GPU_UTIL`, memory copy duty cycle, ECC/XID fault counters) with vLLM <span data-glossary="prometheus">Prometheus</span> metrics (`vllm:num_requests_waiting`, `vllm:num_requests_running`, `vllm:kv_cache_usage_perc`, `vllm:time_to_first_token_seconds`). Remember that vLLM reports `vllm:kv_cache_usage_perc` on a `0.0` to `1.0` scale where `0.85` means `85%`.[^vllm2026metrics] Always separate active KV reservation from evictable prefix blocks so reusable cache history never triggers false scale alerts.

#### KEDA and Karpenter integration

**<span data-glossary="autoscaling">Autoscaling</span>** turns waiting plus active demand into an absolute desired replica count `ceil((waiting + running) / slots_per_replica)` on every fresh control-plane sample. Because pending pods take minutes to reach readiness, subsequent polls must keep pending capacity inside the desired target rather than stacking duplicate replica requests on top of boots already in progress. On the downscale path, **KEDA** scales workloads toward zero once `cooldownPeriod` elapses, while **Kubernetes HPA** relies on `stabilizationWindowSeconds` (typically `300 s`) to stop thrashing across brief lulls; stale metrics must hold current replica counts steady rather than terminating healthy GPUs.[^keda2026ScaledObject][^kubernetes2026Hpa]

<!-- leetllm: test, output=show -->
```python title="keda-and-karpenter-integration.py"
import math

def step_replicas(
    waiting: int,
    running: int,
    ready: int,
    pending: int,
    slots: int,
    low_demand_age_s: int,
    cooldown_s: int = 300,
    telemetry_fresh: bool = True,
) -> tuple[int, int]:
    current = ready + pending
    if not telemetry_fresh:
        return current, 0
    needed = max(1, math.ceil((waiting + running) / slots))
    if needed > current:
        return needed, 0
    if needed < current:
        return (current - 1, 0) if low_demand_age_s >= cooldown_s else (current, cooldown_s - low_demand_age_s)
    return current, 0

print("poll 0 (50 reqs, 4 ready):", step_replicas(30, 20, 4, 0, 5, 0))
print("poll 1 (50 reqs, 6 pending):", step_replicas(30, 20, 4, 6, 5, 0))
print("poll 2 (56 reqs, 6 pending):", step_replicas(36, 20, 4, 6, 5, 0))
print("low demand 299s vs 300s:", step_replicas(0, 4, 7, 0, 5, 299), step_replicas(0, 4, 7, 0, 5, 300))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
poll 0 (50 reqs, 4 ready): (10, 0)
poll 1 (50 reqs, 6 pending): (10, 0)
poll 2 (56 reqs, 6 pending): (12, 0)
low demand 299s vs 300s: (7, 1) (6, 0)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/autoscaling_control_loop_dark.png" alt="Thirty waiting requests and 20 running streams make a 50-request snapshot. At five active slots per replica, demand points to ten replicas: four ready with all 20 slots of current capacity full and six pending. Polls raise desired replicas from 4 to 10, keep 10 when 4 are ready, then raise to 12 for 56 requests. Unplaced GPU pods pass through node provisioning, image and weight loading, warmup, and readiness before joining traffic; existing streams continue." />
  <figcaption>Autoscaling sets an absolute desired target from active plus waiting demand, keeping pending replicas in the target rather than double-counting them across polls.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/autoscaler_queue_dynamics_dark.png" alt="Autoscaler replica and queueing dynamics over 450 seconds: desired replicas jump immediately from 4 to 12 during the traffic burst while ready capacity stays at 4 across the 207-second cold startup lag, pushing queue backlog up before draining once new GPUs warm up. After demand drops at 100 s, a 300-second cooldown holds capacity steady until gracefully draining one replica at 400 s." />
  <figcaption>Queue depth spikes across the 207-second cold-start window while ready capacity waits on node and weight initialization; cooldown then prevents scale-down oscillation.</figcaption>
</figure>

### A burst needs capacity before its deadline

Because cold GPU pods take minutes (`207 s` in our startup trace) to join serving endpoints, reactive scale-out arrives too late for requests carrying `30 s` wait deadlines. When `100` prompts hit at `t = 0` (`5` slots per replica, `10 s` service time), each warm replica runs four waves (`t = 0, 10, 20, 30 s`) and rescues `20` requests before deadlines expire. Only pre-warmed capacity covers short-horizon spikes, so teams size warm pools using Poisson burst quantiles (`scipy.stats.poisson.ppf`) over the sub-cold-start window.

<!-- leetllm: test, output=show, deps=numpy,scipy -->
```python title="capacity-warm-buffer.py"
import numpy as np
from scipy.stats import poisson

def burst_served(warm_replicas: int, requests: int = 100, slots: int = 5, service_s: int = 10, max_wait_s: int = 30) -> tuple[int, int]:
    waves = max_wait_s // service_s + 1
    served = min(requests, warm_replicas * slots * waves)
    return served, requests - served

for w in [0, 1, 3, 20]:
    served, expired = burst_served(w)
    print(f"warm={w:2d}: served={served:3d} expired={expired:3d}")

burst_99 = int(poisson.ppf(0.99, mu=1.2 * 30))
needed_warm = int(np.ceil(burst_99 / (5 * 4)))
print(f"99th-pct 30s burst demand={burst_99} reqs -> min warm replicas={needed_warm}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
warm= 0: served=  0 expired=100
warm= 1: served= 20 expired= 80
warm= 3: served= 60 expired= 40
warm=20: served=100 expired=  0
99th-pct 30s burst demand=51 reqs -> min warm replicas=3
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/warm_buffer_deadline_dark.png" alt="Requests served vs expired from a 100-request burst with a 30-second wait deadline and 207-second cold replica startup: 0 warm replicas lose all 100, 1 warm serves 20 and loses 80, 3 warm serve 60 and lose 40, and 20 warm serve all 100 before any cold replica is ready." />
  <figcaption>With a 30-second wait deadline and 207-second cold startup, only warm capacity running at t=0 starts burst requests before deadlines expire.</figcaption>
</figure>

### Handling cold starts

GPU startup delays pile up sequentially across four stages, each offering its own engineering lever:

| Stage | Typical span | Mitigation lever |
|---|---|---|
| **GPU node provisioning** | `60 - 180 s` | Maintain over-provisioned placeholder pods or warm node pools |
| **Container image pull** | `15 - 60 s` | Strip non-runtime toolchains and pre-pull images onto node AMIs |
| **Checkpoint load** | `30 - 120 s` | Stage safetensors on local NVMe or parallel object-store readers |
| **Runtime warmup** | `5 - 30 s` | Cache compilation artifacts and run minimal warmup prompts[^nvidia2026TensorRtBackendRemoval] |

Notice how lead time governs whether `95 + 22 + 78 + 12 = 207 s` lands ahead of or behind a scheduled spike. Triggering pre-warming at `8:56` finishes `33 s` ahead of a `9:00` release freeze, giving new GPUs time to pass readiness before requests arrive. Waiting for reactive metrics at `8:58` lands `87 s` after the wave hits, forcing queued traffic to expire while weights are still loading.

<!-- leetllm: test, output=show -->
```python title="cold-start-readiness.py"
cold_start_s = 95 + 22 + 78 + 12
for lead_s in [120, 240]:
    margin = lead_s - cold_start_s
    print(f"lead={lead_s}s ready={cold_start_s}s margin={margin:+d}s")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
lead=120s ready=207s margin=-87s
lead=240s ready=207s margin=+33s
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cold_start_timeline_dark.png" alt="One shared clock runs from 8:56 to 9:02. A serial startup trace takes 95 seconds for node provisioning, 22 for the image, 78 for weights, and 12 for warmup, reaching readiness after 207 seconds. Starting at 8:58 reaches readiness at 9:01:27, 87 seconds after the surge; starting at 8:56 reaches readiness at 8:59:27, 33 seconds before it. The first request starts only after readiness." />
  <figcaption>A 207-second startup trace reaches readiness 33 seconds early when triggered at 8:56, or 87 seconds after the 9:00 surge when triggered reactively at 8:58.</figcaption>
</figure>

## Cost optimization

### Spot instances and fault tolerance

Spot instances reduce compute costs dramatically when paired with deterministic preemption draining. Provider warning intervals differ sharply across clouds: AWS provides a two-minute stop or termination notice (`0 s` for hibernation),[^awsSpotInterruptions2026] Azure offers up to `30 seconds`,[^azureSpotVms2026] and Google Cloud Spot VMs provide none by default with an optional `120 s` notice and up to `30 s` best-effort shutdown.[^googleSpotVms2026] The moment a preemption warning fires, flip local intake to `503` and subtract cleanup overhead (`20 s` out of `120 s` leaves `100 s`). Finish short active streams inside that remaining budget, reroute unstarted queued requests within their original deadline, and emit an explicit interruption event for overrunning streams rather than splicing text across workers.

<!-- leetllm: test, output=show -->
```python title="spot-drain-deadline.py"
def classify_spot_work(notice_s: float, cleanup_s: float, remaining_s: float, streamed: bool) -> str:
    budget = notice_s - cleanup_s
    if remaining_s <= budget:
        return "finish"
    return "interrupt" if streamed else "retry"

for rem, streamed in [(12, True), (84, True), (100, True), (170, False), (170, True)]:
    print(f"rem={rem:3d}s streamed={str(streamed):5s} -> {classify_spot_work(120, 20, rem, streamed)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rem= 12s streamed=True  -> finish
rem= 84s streamed=True  -> finish
rem=100s streamed=True  -> finish
rem=170s streamed=False -> retry
rem=170s streamed=True  -> interrupt
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/spot_drain_deadline_dark.png" alt="Spot instance preemption drain schedule under a 120-second cloud notice: subtracting 20 seconds reserved for worker cleanup leaves 100 seconds of drain budget. Short 12 s and 84 s generations fit and finish gracefully, while 170 s work must retry if unstarted or emit an explicit interruption signal if already streaming." />
  <figcaption>Reserving 20 seconds for cleanup out of a 120-second spot notice leaves 100 seconds to finish short generations while safely rerouting unstarted queued prompts.</figcaption>
</figure>

### Scale-down cooldown & thrashing

Aggressive scale-down destroys inference efficiency by evicting resident weights and warm prefix caches only to pay cold-start penalties minutes later when load recovers. Re-loading tens of gigabytes across a fleet costs far more in tail latency than keeping a minimal warm buffer idle between dips. Distinguish active sequence memory from evictable prefix pages so reusable cache entries never block scale-down permanently once HPA `stabilizationWindowSeconds` expires cleanly.

### Deployment options

Most mature fleets layer capacity tiers intentionally rather than relying on a single instance market. Run **reserved on-demand instances** for steady baseline traffic plus burst headroom, and dispatch asynchronous or short interactive overflow onto **spot GPUs** behind deterministic drain handlers. For irregular low-duty endpoints where dedicated HBM sits mostly idle, offload bursts to **serverless token APIs** until request volume justifies keeping GPUs resident.

## Diagnose a stalled spike

When p95 latency spikes unexpectedly, classify the queue and token timeline before adding nodes:

1. **Waiting queue climbs while ready replicas stay flat:** Cold initialization lags behind traffic arrivals; protect existing streams with concurrency caps and `429` shedding until warm pools absorb the burst.
2. **Inter-token gaps spike mid-generation while TTFT stays steady:** Active batch size or HBM bandwidth has saturated; inspect `kv_cache_usage_perc`, prefill chunk interference, and node health telemetry.
3. **Callers time out and immediately retry:** Unchecked retries amplify backlog even when user traffic stops growing; enforce original end-to-end deadlines and `Retry-After` delays across gateways.

## When the baseline isn't enough

### Prefill-decode disaggregation

Mixing heavy document ingestion (`61%` long-context prompts) with low-latency interactive chat on unified GPUs lets compute-bound prefill chunks stall ongoing decode steps. **Prefill-decode disaggregation** (such as Splitwise and NVIDIA Dynamo) splits engines into separate prefill and decode worker pools linked over RDMA or NVLink, transferring initial KV blocks alongside layout, model, and dtype metadata.[^zhong2024][^patel2023][^nvidia2026dynamodisaggregated] KV shipping adds real operational complexity, including transfer backpressure and coordinated cancellation across pools. Adopt disaggregation only after traces demonstrate that chunked prefill on unified workers breaches TTFT (`<= 1500 ms`) or TPOT (`<= 60 ms`) budgets.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="disaggregation-trigger.py"
import numpy as np

traces = np.array([
    [820.0, 44.0, 0.08],   # p95_ttft_ms, p95_tpot_ms, long_prompt_share
    [800.0, 90.0, 0.20],
    [2450.0, 93.0, 0.61],
])
names = ["short-chat", "decode-pressure", "doc-surge"]
ttft_slo, tpot_slo = 1500.0, 60.0

for name, (ttft, tpot, share) in zip(names, traces):
    status = "PASS" if (ttft <= ttft_slo and tpot <= tpot_slo) else "EVALUATE_SPLIT"
    print(f"{name:16s} ttft={ttft:6.0f}ms tpot={tpot:4.0f}ms long={share:4.0%} -> {status}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
short-chat       ttft=   820ms tpot=  44ms long=  8% -> PASS
decode-pressure  ttft=   800ms tpot=  90ms long= 20% -> EVALUATE_SPLIT
doc-surge        ttft=  2450ms tpot=  93ms long= 61% -> EVALUATE_SPLIT
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/disaggregated_prefill_decode_dark.png" alt="Disaggregated prefill-decode serving pipeline and workload SLO evaluation: requests route to a prefill pool that ships KV blocks and layout metadata to a decode pool. In a dual-SLO scatter plot (TTFT target <= 1500 ms, TPOT target <= 60 ms), short incident chat (820 ms TTFT, 44 ms TPOT) satisfies both targets in a mixed pool, whereas decode pressure (800 ms, 90 ms) and policy-document surges (2450 ms, 93 ms) justify testing separate pools." />
  <figcaption>Evaluate prefill-decode disaggregation only when mixed pools fail TTFT (1,500 ms) or TPOT (60 ms) SLOs under sustained long-prompt interference.</figcaption>
</figure>

### Speculative decoding

**Speculative decoding** uses a lightweight draft model or multi-token head to propose $K$ candidate tokens that the target model verifies in one parallel forward pass, preserving the target checkpoint's exact output distribution.[^leviathan2022] Speedups shrink at very high batch concurrency where matrix verification competes for compute rather than memory bandwidth, and hybrid checkpoints like `Qwen3.6-27B` require verifying exact tokenizer and prediction-module compatibility first.

### Multi-region failover

Keep regional failover outside individual token streams because KV state lives exclusively inside one active worker's GPU memory. Route complete new requests via regional health checks and maintain replicable prompt and retrieval stores across zones. When regional latency degrades, drain queues gracefully between regions before token emission begins rather than attempting mid-generation migration.

### Multi-tenancy with LoRA

Deploying separate `27B` weight footprints per customer quickly exhausts GPU budgets and fractures cluster utilization. **Multi-tenant <span data-glossary="lora">LoRA</span>** (S-LoRA, vLLM LoRA) keeps one shared base checkpoint resident while hot-swapping compact per-tenant low-rank adapters per request.[^hu2021][^sheng2023][^vllm2026lora] Always derive tenant membership from verified authentication credentials instead of raw HTTP `X-Tenant-ID` headers, and return `403` on revoked accounts or incompatible base models rather than falling back silently. Isolate reusable prefix-cache blocks as well by passing an immutable per-tenant `cache_salt` so shared instructions never leak between organizations.

<!-- leetllm: test, output=show -->
```python title="tenant-adapter-policy.py"
MEMBERSHIP = {"user-eng-1": {"org-alpha"}, "user-ops-2": {"org-beta"}}
REGISTRY = {
    "org-alpha": {"adapter": "adapter_A_v3", "id": 101, "base": "base-v7"},
    "org-beta": {"adapter": "adapter_B_v2", "id": 102, "base": "base-v7"},
}

def resolve_lora(principal: str, tenant: str, loaded_base: str) -> tuple[int, str, str]:
    if tenant not in MEMBERSHIP.get(principal, set()):
        return 403, "", ""
    entry = REGISTRY.get(tenant)
    if not entry or entry["base"] != loaded_base:
        return 403, "", ""
    return 200, f"{entry['adapter']}#{entry['id']}", f"salt:{tenant}:{entry['id']}"

print("authorized:", resolve_lora("user-eng-1", "org-alpha", "base-v7"))
print("cross-tenant header spoof:", resolve_lora("user-eng-1", "org-beta", "base-v7"))
print("revoked user:", resolve_lora("user-revoked", "org-alpha", "base-v7"))
print("wrong base:", resolve_lora("user-ops-2", "org-beta", "base-v6"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
authorized: (200, 'adapter_A_v3#101', 'salt:org-alpha:101')
cross-tenant header spoof: (403, '', '')
revoked user: (403, '', '')
wrong base: (403, '', '')
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/tenant_lora_routing_dark.png" alt="Multi-tenant LoRA serving isolation on a shared base-v7 model: verified tenant credentials validate current group membership and compatible adapter metadata to select adapter_A_v3 (ID 101) or adapter_B_v2 (ID 102) with isolated prefix cache_salt values, while rejecting raw X-Tenant-ID headers, revoked members, or mismatched base checkpoints with 403." />
  <figcaption>Multi-tenant LoRA routing binds verified tenant credentials to compatible adapter metadata and isolated prefix cache salts, denying spoofed headers and revoked users cleanly.</figcaption>
</figure>

## Choose the next capacity change

Base every architectural upgrade on measured latency telemetry rather than rules of thumb. When first tokens stall, inspect queue gating, cold-start latency, cache misses, and prefill interference; when generation pauses mid-stream, measure active batch size, HBM bandwidth, and hardware errors. Keep unified worker pools with continuous batching, PagedAttention, prefix reuse, and chunked prefill as your baseline until traces prove disaggregation or cross-node parallelism improves SLO attainment.

```mastery-quiz
[
  {
    "question": "A client logs one timestamp per output event. It receives one token at 210 ms, three tokens together at 270 ms and two together at 390 ms. What are the consecutive event gaps and the request's mean time per output token (TPOT) after the first token? What does the log tell you about generation gaps within each bundle?",
    "options": [
      "Event gaps of 60 and 120 ms, TPOT of 90 ms, generation gaps of 0 ms within bundles.",
      "Event gaps of 60 and 180 ms, TPOT of 36 ms, generation gaps of 0 ms within bundles.",
      "Event gaps of 60 and 120 ms, TPOT of 36 ms, unknown generation gaps within bundles.",
      "Event gaps of 60 and 180 ms, TPOT of 90 ms, unknown generation gaps within bundles."
    ],
    "answer": "Event gaps of 60 and 120 ms, TPOT of 36 ms, unknown generation gaps within bundles.",
    "explanation": "The consecutive event gaps are 270 - 210 = 60 ms and 390 - 270 = 120 ms, spanning 180 ms total. Six delivered tokens create five post-first-token intervals, so request TPOT is 180 / 5 = 36 ms (90 ms is only the mean gap across events). A shared delivery timestamp hides internal generation timing inside each bundle."
  },
  {
    "question": "A ready two-slot worker is streaming R and S. A new request T arrives, followed by a duplicate of S. The worker then begins draining. R finishes and a new request U reaches the worker while S is still streaming. Under the worker's intake policy, which HTTP statuses do T, the duplicate of S, and U receive in order, and who holds a slot afterward?",
    "options": [
      "429, 409, 503. S owns a slot.",
      "429, 429, 503. S owns a slot.",
      "429, 409, 200. S and U own slots.",
      "429, 429, 200. S and U own slots."
    ],
    "answer": "429, 409, 503. S owns a slot.",
    "explanation": "T gets 429 because both slots are occupied while the worker is healthy. Duplicate ID detection runs before capacity rejection, so the duplicate of S gets 409. After drain starts, R's completion frees a slot but local intake stays closed (503 for U) while S finishes."
  },
  {
    "question": "Three sequences currently store 17, 33, and 65 tokens. Paging uses 16 slots per block without sharing or lookahead. How many blocks are allocated, and how many final-block slots remain unused?",
    "options": [
      "9 blocks; 29 unused slots.",
      "10 blocks; 13 unused slots.",
      "8 blocks; 13 unused slots.",
      "10 blocks; 45 unused slots."
    ],
    "answer": "10 blocks; 45 unused slots.",
    "explanation": "Rounding each sequence up separately requires 2 + 3 + 5 = 10 blocks (160 slots). Subtracting 17 + 33 + 65 = 115 active tokens leaves 45 unused final-block slots."
  },
  {
    "question": "A hybrid model has 8 full-attention layers with 4 KV heads per layer. Each head stores a 64-scalar key and a 64-scalar value per position at 2 bytes per scalar. Five active requests each retain 1,536 positions without sharing and use 10 MiB of fixed recurrent state apiece. How much growing KV, fixed state, and total payload do the five requests consume, excluding weights and overhead?",
    "options": [
      "30 MiB growing + 50 MiB fixed = 80 MiB.",
      "60 MiB growing + 50 MiB fixed = 110 MiB.",
      "60 MiB growing + 10 MiB fixed = 70 MiB.",
      "30 MiB growing + 10 MiB fixed = 40 MiB."
    ],
    "answer": "60 MiB growing + 50 MiB fixed = 110 MiB.",
    "explanation": "One request needs 8 * 4 * (64 + 64) * 2 * 1,536 bytes = 12 MiB of KV, so five requests use 60 MiB of KV plus 5 * 10 = 50 MiB of per-request recurrent state, totaling 110 MiB."
  },
  {
    "question": "A homogeneous controller uses 4 active-request slots per replica. Fresh demand has 17 waiting and 9 running requests. Seven replicas are already desired, with only three ready. The next fresh poll reports the exact same waiting and running counts. What desired targets follow on these two polls?",
    "options": [
      "7 then 11; add another four pending replicas.",
      "3 then 7; count only workers currently ready.",
      "7 then 7; pending capacity is already counted.",
      "6 then 6; floor the total active demand."
    ],
    "answer": "7 then 7; pending capacity is already counted.",
    "explanation": "Demand of 26 requests divided by 4 rounds up to 7 desired replicas. Because pending workers remain part of desired capacity while loading, the second poll keeps desired at 7 while queue gating handles excess requests."
  },
  {
    "question": "Seven desired replicas are all ready. A fresh low-demand window begins at 20 s and persists with fresh telemetry and zero pending pods. A controller waits 300 s and drains one eligible replica per stabilization step. What desired counts occur at 319 s and 320 s?",
    "options": [
      "7 at 319; 6 at 320.",
      "6 at 319; 5 at 320.",
      "7 at 319; 7 at 320.",
      "1 at 319; 1 at 320."
    ],
    "answer": "7 at 319; 6 at 320.",
    "explanation": "Low demand has lasted 299 s at t = 319 s (holding 7 replicas) and reaches the inclusive 300 s stabilization mark at t = 320 s, stepping desired replicas down cleanly from 7 to 6."
  },
  {
    "question": "At time zero, 54 requests arrive together at an idle warm pool where each replica has four slots. Each request holds a slot for exactly 5 s, and the next request starts as soon as a slot frees. Cold capacity arrives at 120 s. What minimum warm pool lets every request start within 10 s of arrival, and what if the deadline is 9 s (starts exactly on the deadline count)?",
    "options": [
      "4 replicas at 10 s and 6 at 9 s.",
      "5 replicas at 10 s and 7 at 9 s.",
      "7 replicas at 10 s and 14 at 9 s.",
      "14 replicas at 10 s and 14 at 9 s."
    ],
    "answer": "5 replicas at 10 s and 7 at 9 s.",
    "explanation": "At a 10 s wait limit, each replica runs waves at 0, 5, and 10 s (12 requests per replica), needing ceil(54 / 12) = 5 replicas. At a 9 s limit, the third wave misses the deadline, leaving 8 requests per replica and needing ceil(54 / 8) = 7 replicas."
  },
  {
    "question": "A draining spot worker has 75 s until shutdown and reserves the final 18 s for cleanup. Three active generations need 58 s, 21 s, and 57 s remaining, and partial streams cannot resume elsewhere. Assuming those estimates hold, which replies should finish locally and how should the worker handle the rest?",
    "options": [
      "Finish the 21 s reply. Mark each remaining stream as interrupted.",
      "Finish the 21 s and 57 s replies. Append a fresh generation to each remaining stream.",
      "Finish the 21 s reply. Append a fresh generation to each remaining stream.",
      "Finish the 21 s and 57 s replies. Mark each remaining stream as interrupted."
    ],
    "answer": "Finish the 21 s and 57 s replies. Mark each remaining stream as interrupted.",
    "explanation": "Subtracting 18 s cleanup from 75 s leaves 57 s of usable drain budget. Both the 21 s and 57 s replies complete within budget, whereas the 58 s stream must be marked explicitly as interrupted rather than splicing two separate answers."
  },
  {
    "question": "Authenticated principal user-eng-7 previously belonged to tenant C on shared base-v7 with an approved tenant-C adapter, but her membership has now been revoked. Meanwhile, the HTTP request carries a raw X-Tenant-ID header for tenant B. What action must the gateway take?",
    "options": [
      "Deny revoked membership; select no adapter and ignore the raw header.",
      "Load the approved tenant-C adapter; artifact approval preserves revoked membership.",
      "Load tenant-B adapter; the raw header replaces the principal's former membership.",
      "Use the base model silently; an unavailable tenant adapter can drop its policy."
    ],
    "answer": "Deny revoked membership; select no adapter and ignore the raw header.",
    "explanation": "Tenant selection requires live membership from verified credentials, not static artifact approval or spoofable client headers, and must return 403 rather than falling back silently to the base model."
  },
  {
    "question": "Two benchmark runs share a full 20-second window on identical quality gates. Run A offers 160 requests and qualifies 148; Run B offers 200 and qualifies 178. Required SLO attainment is 90%. Which attainment, qualified goodput, and highest passing offered rate follow?",
    "options": [
      "A 92.5%, 8/s; B 89%, 10/s; capacity 8 RPS.",
      "A 92.5%, 7.4/s; B 89%, 8.9/s; capacity 10 RPS.",
      "A 92.5%, 7.4/s; B 89%, 8.9/s; capacity 8 RPS.",
      "A 90%, 7.4/s; B 90%, 8.9/s; capacity 10 RPS."
    ],
    "answer": "A 92.5%, 7.4/s; B 89%, 8.9/s; capacity 8 RPS.",
    "explanation": "Run A meets the 90% attainment threshold at 148 / 160 = 92.5% and 148 / 20 = 7.4 qualified RPS (8 offered RPS). Run B reaches 8.9 qualified RPS but misses attainment at 178 / 200 = 89%, leaving 8 RPS as the highest tested passing rate."
  }
]
```

> **Next:** Continue to [GPU Failure Operations](/learn/gpu-failure-operations).
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
At 8:59, one warm worker handles incident summaries without accumulating a queue. At 9:00, a release freeze sends 100 requests to the endpoint in a single wave. Your autoscaler immediately reacts to the surge, requesting 19 more replicas so the desired count jumps from 1 to 20.

Eighty of those requests are going to expire before help arrives. Each caller gives up after 30 seconds, while a cold GPU worker takes 207 seconds to provision hardware, pull its container, load model weights, and become useful.

This timing mismatch defines GPU serving and surprises engineers accustomed to stateless web fleets. A lightweight web container boots in seconds, making reactive autoscaling fast enough for sudden spikes. A GPU pod must wait on accelerator allocation, gigabytes of image layers, checkpoint loads, and runtime warmup before it serves token one. **Desired replicas** describe a future plan, whereas **ready capacity** serves requests right now, and most of this chapter examines how to measure that gap, size warm headroom, and shed traffic you cannot rescue in time.

The [release chapter](/learn/observability-monitoring-llm-systems) settled which model combination should serve. Now we need healthy GPUs running that combination before user deadlines expire.

## Two loops on two clocks

Every serving cluster runs two control loops on incompatible clocks. Requests arrive on the fast data path: gateway, queue concurrency check, waiting queue, engine scheduler, GPU batch decode, and streamed output tokens. Meanwhile, a separate capacity loop reads telemetry, updates replica counts, and waits minutes for nodes and weights to initialize before new replicas enter the ready pool.

<figure>
  <img src="illustrations/_generated/gpu_serving_dark.png" alt="Two connected serving loops. A queue with an original deadline enters capacity gating, a ready batch, GPU decode, and a token stream. Rejected requests return 429 with Retry-After and signal the capacity loop. Future replicas join the ready batch only after their engines are loaded, warm, and healthy." />
  <figcaption>The data path serves the work you have now, and the capacity loop changes what you will have later. Carrying the original deadline and Retry-After prevents retries from multiplying overload.</figcaption>
</figure>

Three distinct layers divide this work cleanly. The inference engine manages prompt prefill, continuous batching, and KV cache slots on the GPU itself. A replica controller watches engine gauges and requests Kubernetes pods, while a node autoscaler provisions physical accelerators whenever pending pods cannot schedule. Keeping those layers separate makes clear why even a correct scale-up signal cannot rescue an immediate spike.

## Busy isn't the signal you want

Traditional autoscalers trigger on CPU or GPU compute utilization, yet high utilization on an LLM server can mean efficient continuous batching rather than overload. Conversely, a [modest compute duty cycle can still coexist with an HBM memory-bandwidth bottleneck](/learn/inference-mechanics-ttft-tps-kv-cache) during small-batch decode, and sparse traffic creates uneven bursts. Queue depth and oldest queue age directly measure whether callers are sitting idle waiting for an available slot.

| Signal | Comes from | What it tells you |
|---|---|---|
| Queue depth and queue age | Serving framework or gateway | Backlog, and how long the oldest work has waited |
| KV cache use | Serving framework | Memory pressure that can stop new work from starting |
| GPU duty cycle | NVIDIA DCGM | Supporting detail, easy to misread alone |
| Time to first token | Serving framework | The initial wait users actually feel |
| Stream gaps and time per output token | Token or event collector | Decode pacing and tail stalls after generation starts |

Verify exact metric semantics before converting any gauge into an autoscaling rule. Cached prefix pages with zero active users may be evictable rather than exhausted live state, and vLLM publishes `kv_cache_usage_perc` as a fraction where `0.85` means 85%.[^vllm2026metrics] Inspect tail inter-token gaps alongside mean TPOT as well, because isolated stalls vanish inside request-wide averages, and remember that adding replicas never cures an upstream outage or failing node.

## What "ready" has to mean

Kubernetes pod phases move through scheduling, container start, weight load, warmup, and true readiness, often separated by minutes on large checkpoints. Three Kubernetes probes govern those phases independently, and misconfiguring any of them turns heavy load into a cluster outage:[^kubernetes2026Probes]

| Probe&nbsp;type | Its job | Common mistake |
|---|---|---|
| Startup | Protect slow startup from early restarts | Setting a timeout shorter than real weight load time |
| Readiness | Control live Service traffic | Probing a healthy sidecar while the model failed to load |
| Liveness | Restart a wedged process | Failing the probe merely because all batch slots are full |

> **Common mistake:** Tripping a Kubernetes liveness probe when all batch slots are full. A saturated worker is healthy; killing it destroys active generations, drops warm prefix caches, and triggers a multi-minute cold boot during peak load. Shed extra work with HTTP `429`, and flip local intake to `503` during graceful drain while active streams finish.

<!-- leetllm: test, output=show, id=reader-gpu-worker-lifecycle -->
```python title="worker-lifecycle.py"
from dataclasses import dataclass, field

@dataclass
class Worker:
    loaded: bool = False
    warmed: bool = False
    healthy: bool = True
    draining: bool = False
    active: set = field(default_factory=set)

    def enqueue(self, request_id):
        ready = self.loaded and self.warmed and self.healthy
        if not ready or self.draining:
            return 503
        if request_id in self.active:
            return 409
        if len(self.active) >= 2:
            return 429
        self.active.add(request_id)
        return 200

worker = Worker()
assert worker.enqueue("a") == 503
worker.loaded = worker.warmed = True
assert worker.enqueue("a") == worker.enqueue("b") == 200
assert worker.enqueue("c") == 429
worker.draining = True
assert worker.enqueue("d") == 503
assert worker.active == {"a", "b"}
worker.active.remove("a")
worker.active.remove("b")
assert not worker.active
print("load, warm, accept, reject excess, drain active work")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
load, warm, accept, reject excess, drain active work
```
<!-- leetllm: output:end -->

Each HTTP status gives callers and load balancers clear instructions: `503` signals a booting or draining worker to skip, `429` indicates healthy saturation for backoff, and `409` protects active streams from duplicate submission. Production servers additionally wrap slot reservation in atomic locks and handle client cancellations.

<figure>
  <img src="illustrations/_generated/worker_readiness_lifecycle_dark.png" alt="Inference worker readiness and drain lifecycle: a pod progresses from loading weights and warmup to ready serving, returns HTTP 409 for duplicate IDs and HTTP 429 when capacity is full without failing liveness, and returns HTTP 503 during drain while active streams finish." />
  <figcaption>Full, draining, and failed are separate states, and only hardware or process faults should trigger a restart.</figcaption>
</figure>

## Will it fit on the card?

Before calculating fleet replica counts, check what one GPU holds comfortably inside latency budgets. Resident model weights, per-request KV cache (plus fixed recurrent state on hybrid models), and runtime scratch buffers share HBM together. Quantizing weights from BF16 to FP8 or INT8 often doubles single-stream decode ceilings alongside freeing HBM, while PagedAttention prevents wasted sequence buffers from starving concurrent requests.

## From a benchmark to a replica count

Load testing under realistic prompt shapes establishes how many concurrent streams one replica handles while hitting TTFT and TPOT targets. When `20` requests are streaming across `4` ready workers (`5` slots apiece) and `30` sit queued, total demand of `50` requires `ceil(50 / 5) = 10` replicas. On the very next poll, `6` pods are pending initialization while `4` remain ready; because the controller computes an absolute target including pending workers, desired stays cleanly at `10` rather than repeatedly double-counting the queue.

<figure>
  <img src="illustrations/_generated/autoscaling_control_loop_dark.png" alt="Thirty waiting requests and 20 running streams make a 50-request snapshot. At five active slots per replica, demand points to ten replicas: four ready with all 20 slots of current capacity full and six pending. Polls raise desired replicas from 4 to 10, keep 10 when 4 are ready, then raise to 12 for 56 requests. Unplaced GPU pods pass through node provisioning, image and weight loading, warmup, and readiness before joining traffic; existing streams continue." />
  <figcaption>Desired replicas and ready capacity move on different clocks: a larger desired target is a plan, while only ready workers take traffic.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-gpu-desired-replicas -->
```python title="desired-replicas.py"
import math

def desired_replicas(waiting, running, slots_per_replica):
    return max(1, math.ceil((waiting + running) / slots_per_replica))

assert desired_replicas(30, 20, 5) == 10
assert desired_replicas(36, 20, 5) == 12
print("poll 0: 50 requests -> desired 10")
print("poll 1: still 50 (4 ready, 6 pending) -> desired stays 10")
print("poll 2: 56 requests -> desired 12")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
poll 0: 50 requests -> desired 10
poll 1: still 50 (4 ready, 6 pending) -> desired stays 10
poll 2: 56 requests -> desired 12
```
<!-- leetllm: output:end -->

## Will the burst make its deadline?

Now trace what happens when `100` requests arrive simultaneously at 9:00 with a `30 s` wait limit, `10 s` service time per slot, and `207 s` cold pod startup. Each warm replica starts `5` requests at `0, 10, 20, 30 s` (`20` requests total) before deadlines run out. Cold capacity finishes long after the burst expires, meaning warm capacity present at `t = 0` determines survival rate.

<!-- leetllm: test, output=show, id=reader-gpu-burst-deadline -->
```python title="burst-deadline.py"
def burst(warm_replicas, *, requests=100, slots=5, service_s=10, cold_ready_s=207, max_wait_s=30):
    served = 0
    for t in range(0, max_wait_s + 1, service_s):
        replicas = warm_replicas + (19 if t >= cold_ready_s else 0)
        take = min(requests - served, replicas * slots)
        served += take
    return served, requests - served

for warm, expected in [(0, 0), (1, 20), (3, 60), (20, 100)]:
    served, expired = burst(warm)
    assert served == expected
    print(f"warm={warm}: served={served}, expired={expired}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
warm=0: served=0, expired=100
warm=1: served=20, expired=80
warm=3: served=60, expired=40
warm=20: served=100, expired=0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/warm_buffer_deadline_dark.png" alt="Requests served vs expired from a 100-request burst with a 30-second wait deadline and 207-second cold replica startup: 0 warm replicas lose all 100, 1 warm serves 20 and loses 80, 3 warm serve 60 and lose 40, and 20 warm serve all 100 before any cold replica is ready." />
  <figcaption>Cold capacity misses this burst's deadline entirely. Warm headroom and acceptable waiting time determine how much traffic survives.</figcaption>
</figure>

Teams combine three techniques to survive sudden traffic spikes faster than cold startups:

- **Warm capacity:** Keep headroom replicas running on baseline pools for known traffic peaks.
- **Placeholder pods:** Low-priority dummy pods can pre-hold GPU nodes so real engines skip cloud node provisioning.
- **Predictive warmup:** Trigger scheduled scaling minutes ahead of recurring surges such as release freezes or morning shifts.

Spikes larger than your budgeted warm headroom cannot be hidden safely. Asynchronous jobs can sit in durable queues until nodes boot, while interactive APIs should fail fast with `429` rather than burning GPU cycles on expired requests.

## A cold start is a chain

Cold readiness depends on four sequential steps that sum to `207 s` in our startup trace: `95 s` for cloud node provisioning, `22 s` for pulling the container image, `78 s` for loading checkpoint weights, and `12 s` for engine warmup. Even without changing startup speed, moving the trigger ahead by two minutes shifts readiness from `87 s` after the 9:00 surge to `33 s` before it hits. Speeding up startup permanently means attacking the largest serial bottlenecks: pre-warmed node pools, slimmed images, and NVMe weight staging.

<figure>
  <img src="illustrations/_generated/cold_start_timeline_dark.png" alt="One shared clock runs from 8:56 to 9:02. A serial startup trace takes 95 seconds for node provisioning, 22 for the image, 78 for weights, and 12 for warmup, reaching readiness after 207 seconds. Starting at 8:58 reaches readiness at 9:01:27, 87 seconds after the surge; starting at 8:56 reaches readiness at 8:59:27, 33 seconds before it. The first request starts only after readiness." />
  <figcaption>The exact same 207-second startup finishes either 33 seconds ahead of the burst or 87 seconds too late, depending solely on when scaling starts.</figcaption>
</figure>

## Scale up fast, scale down slowly

Production fleets pair rapid scale-up with conservative scale-down so initialized weights and warm prefix caches stay intact across brief traffic dips. Dropping GPUs aggressively saves pennies only to incur multi-minute cold starts moments later when demand rebounds. In Kubernetes, KEDA pushes Prometheus queue metrics into horizontal scaling and wakes idle workloads from zero while Karpenter handles node placement; remember that KEDA's `cooldownPeriod` applies to zero-scaling whereas HPA's `stabilizationWindowSeconds` smooths active pool reductions.[^keda2026][^karpenter2026][^kubernetes2026Hpa]

## When capacity can't arrive in time

Because no autoscaler produces ready GPUs inside a `30 s` timeout when boot time is `207 s`, immediate overload protection falls to queue gating at the gateway and worker. Cap queued depth, reject excess work promptly with `429` and `Retry-After`, forward original request deadlines on every internal call, and constrain client retries so overload cannot amplify itself.

## Draining and spot capacity

Spot instances save substantial compute budget when drain logic respects cloud notice periods. AWS issues two-minute notices for stop or termination (and zero seconds for hibernation),[^awsSpotInterruptions2026] Azure offers up to 30 seconds,[^azureSpotVms2026] and Google Cloud offers none by default with an optional 120-second notice and a 30-second best-effort shutdown window.[^googleSpotVms2026] Reserving `20 s` for cleanup out of a `120 s` warning leaves `100 s` to finish short generations cleanly, reroute unstarted queued requests elsewhere, and mark overrun streams explicitly as interrupted rather than splicing two separate runs.

<!-- leetllm: test, output=show, id=reader-gpu-drain-decision -->
```python title="drain-decision.py"
def on_preempt(notice_s, cleanup_s, remaining_s, streamed):
    if remaining_s <= notice_s - cleanup_s:
        return "finish"
    return "interrupt" if streamed else "retry"

assert on_preempt(120, 20, 12, True) == "finish"
assert on_preempt(120, 20, 84, True) == "finish"
assert on_preempt(120, 20, 170, False) == "retry"
assert on_preempt(120, 20, 170, True) == "interrupt"
print("drain decisions verified")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
drain decisions verified
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/spot_drain_deadline_dark.png" alt="Spot instance preemption drain schedule under a 120-second cloud notice: subtracting 20 seconds reserved for worker cleanup leaves 100 seconds of drain budget. Short 12 s and 84 s generations fit and finish gracefully, while 170 s work must retry if unstarted or emit an explicit interruption signal if already streaming." />
  <figcaption>Unstarted work safely moves to another replica; once tokens stream to a user, anything past the drain budget needs a clean interruption signal.</figcaption>
</figure>

Returning to the 9:00 surge, asking for `20` replicas correctly sizes steady capacity for `100` concurrent users (`100 / 5`), yet warm headroom, pre-warming before predictable peaks, and strict queue gating determine whether requests survive the `207 s` ramp.

## Three ways a spike stalls

- **Waiting queue climbs while ready replicas stay unchanged:** Cold startup lag exceeds the request deadline; keep warm capacity or pre-warm earlier.
- **Mean TPOT looks healthy while token stalls hit interactive users:** Examine tail `ITL` and separate output-event chunks from token generation intervals.
- **Retries flood already-full workers:** Enforce queue depth caps, carry original request deadlines, and pace client retries with `Retry-After`.

## Choose the next change from what you measured

Diagnose before re-architecting your serving stack. If first tokens lag, isolate queue wait, cold startup, prefix cache misses, and prefill stalls; if output slows mid-stream, examine batch concurrency, HBM bandwidth, and node telemetry. Start from a shared worker pool running continuous batching, PagedAttention, prefix caching, and chunked prefill, and introduce disaggregated prefill/decode pools or multi-node parallelism only when measurements demonstrate your baseline misses SLOs.[^zhong2024]
<!-- leetllm: edition:reader:end -->
