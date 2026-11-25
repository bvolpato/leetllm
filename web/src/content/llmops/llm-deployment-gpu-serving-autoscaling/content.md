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
  "order": 15,
  "prerequisites": [
    "inference-mechanics-ttft-tps-kv-cache",
    "kv-cache-paged-attention-llm-serving",
    "continuous-batching-request-scheduling",
    "model-parallelism-for-llm-inference",
    "model-quantization-gptq-awq-gguf"
  ],
  "relatedQuestions": [
    "model-parallelism-for-llm-inference",
    "serving-benchmark-engineering",
    "experiment-design-ab-testing",
    "llm-cost-engineering-token-economics",
    "design-multi-tenant-llm-serving-platform",
    "design-reasoning-agent-test-time-compute"
  ],
  "aliases": [
    "observability-monitoring-llm-systems",
    "advanced-mlops-devops-ai",
    "model-versioning-continuous-deployment"
  ]
}
---
<!-- leetllm: edition:reference:start -->
At 8:59, a single warm GPU handles traffic without building a queue. At 9:00, a surge sends 100 requests to the endpoint in one wave. Queue age climbs, first-token latency blows past interactive budgets, and reactive autoscaling finishes booting replacement GPU pods minutes after callers have timed out. Meanwhile, every response that *did* finish returned `200 OK`, hiding silent generation defects unless request-level telemetry records what actually reached the user.

Unlike stateless HTTP services whose containers boot in seconds, GPU inference engines pin tens of gigabytes of weights in HBM and hold growing <span data-glossary="kv-cache">KV cache</span> state across every active <span data-glossary="token">token</span> stream (plus fixed recurrent state on hybrid linear-attention models). Operating a reliable fleet requires pairing **latency-aware serving and autoscaling** with **structured LLM observability, tracing, and SLO alerting**.

## Latency SLIs: TTFT, ITL, and TPOT

Production inference tracks three complementary latency quantities against explicit <span data-glossary="slo">SLOs</span>:

- **Time To First Token (TTFT):** Request arrival to first emitted token (queue wait + cold startup + <span data-glossary="prefill">prefill</span>).
- **Inter-Token Latency (ITL / TBT):** Individual gaps between consecutive emitted tokens, exposing tail pauses hidden by averages.
- **Time Per Output Token (TPOT):** $(\text{total\_ms} - \text{TTFT}) / (N_{\text{out}} - 1)$ for $N_{\text{out}} \ge 2$ (its inverse is post-first-token throughput in tok/s).

Measure server and client streams separately. Network buffering and speculative decoding routinely bundle several tokens into one Server-Sent Event (SSE): delivering 1 token at `300 ms` and 3 bundled tokens at `340 ms` exposes one `40 ms` inter-event gap while request TPOT is `40 / 3 = 13.33 ms`. Also align collector definitions: vLLM Prometheus histograms log `0 s` TPOT for single-token replies whereas `vllm bench serve` excludes them.[^vllm2026metrics]

<!-- leetllm: test, output=show, deps=numpy -->
```python title="stream-latency.py"
import numpy as np

times = np.array([300.0, 340.0, 380.0, 500.0])
gaps = np.diff(times)
tpot = (times[-1] - times[0]) / (times.size - 1)
print(f"TTFT={times[0]:.1f}ms TPOT={tpot:.1f}ms p95_gap={np.percentile(gaps, 95):.1f}ms max_gap={gaps.max():.1f}ms")

# Bundled SSE events: (timestamp_ms, token_count)
events = [(300.0, 1), (340.0, 3)]
tot_toks = sum(c for _, c in events)
print(f"bundled events: event_gap={events[1][0]-events[0][0]:.1f}ms vs request_tpot={(events[-1][0]-events[0][0])/(tot_toks-1):.2f}ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
TTFT=300.0ms TPOT=66.7ms p95_gap=112.0ms max_gap=120.0ms
bundled events: event_gap=40.0ms vs request_tpot=13.33ms
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/bundled_event_observability_dark.png" alt="Comparison of per-token streaming intervals against chunked SSE output events: four tokens delivered as one token at 300 ms and three bundled tokens at 340 ms expose only one 40 ms inter-event gap while hiding the internal token intervals inside the chunk." />
  <figcaption>Two SSE output events expose only a 40 ms chunk interval, while dividing by three post-first-token steps puts request TPOT at 13.3 ms.</figcaption>
</figure>

## The GPU serving stack and worker lifecycle

Reliable inference splits into two loops on incompatible clocks: a **sub-second data path** (edge gateway, concurrency gate, waiting queue, engine scheduler, GPU decode) that protects active streams by shedding excess load with `429 Retry-After`, and a **multi-minute control loop** (<span data-glossary="prometheus">Prometheus</span> + <span data-glossary="keda">KEDA</span> for pods + <span data-glossary="karpenter">Karpenter</span> for GPU nodes) that provisions and warms future replicas.[^keda2026][^karpenter2026]

<figure>
  <img src="illustrations/_generated/gpu_serving_dark.png" alt="Two connected serving loops. A queue with an original deadline enters capacity gating, a ready batch, GPU decode, and a token stream. Rejected requests return 429 with Retry-After and signal the capacity loop. Future replicas join the ready batch only after their engines are loaded, warm, and healthy." />
  <figcaption>The fast data path protects ready capacity with queue deadlines and concurrency limits, while the slower control loop provisions, loads, and warms future GPU replicas.</figcaption>
</figure>

### Scheduled, started, and ready are different states

Kubernetes pod scheduling, container start, checkpoint load, kernel warmup, and readiness span minutes.[^kubernetes2026Probes] Misconfigured probes turn traffic bursts into self-inflicted crash loops: a short **startup probe** kills loading pods, a sidecar **readiness probe** leaks traffic before weights load, and a **liveness probe** that fails when batch slots fill restarts healthy saturated workers. Return `503` while booting/draining, `409` on duplicate request IDs, `429` when full (keeping liveness green), and `200` when admitted:

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

w = Worker()
assert w.enqueue("a") == 503
w.loaded = w.warmed = True
assert (w.enqueue("a"), w.enqueue("b"), w.enqueue("b"), w.enqueue("c")) == (200, 200, 409, 429)
w.draining = True
assert w.enqueue("d") == 503
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

## Serving engine fundamentals

Modern engines combine three core optimizations covered in detail in earlier lessons:

- **<span data-glossary="continuous-batching">Continuous batching</span>** refills freed decode slots on every iteration instead of waiting for the longest reply in a static batch, lifting two-slot occupancy on replies `[8, 2, 5, 3]` from `69%` (`13` steps) to `90%` (`10` steps).[^yu2022]
- **<span data-glossary="pagedattention">PagedAttention</span> and <span data-glossary="prefix-cache">prefix caching</span>** map logical blocks onto non-contiguous physical HBM pages (bounding slack to at most `15` tokens per sequence at `block_size=16`, reclaiming `81%` of worst-case fixed buffers across mixed prompts `[320, 75, 900, 250]`) and share cached prefix blocks across requests.[^kwon2023][^vllm2026prefix]
- **Chunked prefill** caps prompt tokens per iteration (`max_num_batched_tokens`) so long prompts do not stall active decode steps; separating queue wait (`180 ms`), prefill (`120 ms`), and per-step decode (`40`, `40`, `120 ms`) pinpoints where tail latency grew.

<figure>
  <img src="illustrations/_generated/continuous_batching_dark.png" alt="Batch scheduling comparison on two decode slots serving replies of 8, 2, 5, and 3 tokens: static batching takes 13 total steps with 8 wasted empty slot-steps waiting for the longest reply, while continuous batching takes 10 steps with only 2 wasted empty slot-steps, raising slot occupancy from 69 percent to 90 percent." />
  <figcaption>Refilling freed decode slots on iteration boundaries trims total steps from 13 to 10 and raises occupancy from 69% to 90%.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/paged_attention_blocks_dark.png" alt="PagedAttention virtual-to-physical KV cache mapping: contiguous logical token blocks L0, L1, and L2 translate through the per-sequence Block Table to scattered physical HBM blocks P5, P2, and P8 while free block P1 remains available for the next generated page." />
  <figcaption>Per-sequence block tables map logical blocks L0..L2 to scattered physical blocks P5, P2, and P8 while leaving P1 free.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/paged_allocation_slack_dark.png" alt="KV cache slot utilization across four prompts of 320, 75, 900, and 250 tokens: 1,545 active tokens occupy 98 paged blocks (1,568 slots, only 23 trailing slack slots) compared against 512 fixed maximum-length blocks (8,192 slots), saving 6,624 KV slots." />
  <figcaption>Dynamic paging holds 1,545 tokens in 98 blocks (23 slack slots) instead of 512 fixed blocks, saving 6,624 KV slots.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/request_lifecycle_dark.png" alt="Server-side LLM request timeline: 180 ms queue wait plus 120 ms prefill produces a 300 ms TTFT. Subsequent decoded tokens arrive at 340, 380, and 500 ms, exposing inter-token intervals of 40 ms, 40 ms, and a 120 ms tail stall behind a 66.7 ms mean TPOT." />
  <figcaption>Queue wait (180 ms) plus prefill (120 ms) sets TTFT (300 ms), while per-token intervals expose a 120 ms stall behind 66.7 ms mean TPOT.</figcaption>
</figure>

| Engine | Best fit | Operational watchpoints |
|---|---|---|
| **<span data-glossary="vllm">vLLM</span>** | General high-throughput GPU serving with PagedAttention and LoRA | Align Prometheus histogram rules with client SLIs[^vllm2026metrics][^vllm2026optimization] |
| **SGLang**[^zheng2023a] | Tree-structured prefix caching (`RadixAttention`), multi-turn agents | Track radix pool eviction under multi-tenant traffic |
| **TensorRT-LLM**[^nvidia2026TensorRtBackendRemoval] | Maximum NVIDIA throughput (migrating to PyTorch backend) | Pin release versions across backend transitions |
| **TGI**[^huggingface2026tgi] / **llama.cpp**[^llamacpp2023] | Legacy HF stacks (maintenance mode) / edge GGUF serving | Plan TGI migration to vLLM/SGLang; validate edge batch limits |

## GPU sizing, decode ceilings, and parallelism

Total <span data-glossary="vram">VRAM</span> combines weights, growing full-attention KV cache ($\text{KV}_{\text{req}} = 2 \cdot L_{\text{kv}} \cdot H_{\text{kv}} \cdot d_h \cdot 2 \cdot L$), fixed recurrent state on hybrid models (e.g., `Qwen3.6-27B`'s 48 linear-attention layers alongside 16 full-attention layers[^qwen3627b2026]), and ~15% runtime/CUDA-graph reserve. Pair VRAM sizing with an Erlang-C (M/M/k) queueing calculation to size replica counts for low wait probabilities:

<!-- leetllm: test, output=show, deps=numpy,scipy -->
```python title="sizing-and-selection.py"
import math, numpy as np
from scipy.special import gammaln

def budget_gb(params_b, kv_layers, kv_heads, head_dim, ctx, conc, fixed_b=0.0):
    w = params_b * 2e9
    kv = conc * ctx * (2 * kv_layers * kv_heads * head_dim * 2)
    hyb = conc * fixed_b
    return w / 1e9, kv / 1e9, hyb / 1e9, (w + kv + hyb) * 1.15 / 1e9

def erlang_c(rps, svc_s, reps, slots):
    k, rho = reps * slots, rps * svc_s
    u = rho / k
    if u >= 1.0: return 1.0
    lt = np.array([n * math.log(rho) - gammaln(n + 1) for n in range(k)])
    lpk = k * math.log(rho) - gammaln(k + 1) - math.log(1.0 - u)
    m = max(float(lt.max()), lpk)
    return float(math.exp(lpk - m) / (np.exp(lt - m).sum() + math.exp(lpk - m)))

qwen_lin = 48 * 16 * 128 * 3 * 128 * 4
for name, res in [("8B BF16 (4k, c=8)", budget_gb(8, 32, 8, 128, 4096, 8)),
                  ("Qwen3.6-27B (8k, c=4)", budget_gb(27, 16, 4, 256, 8192, 4, qwen_lin))]:
    print(f"{name}: w={res[0]:.1f} kv={res[1]:.1f} hyb={res[2]:.1f} total={res[3]:.1f} GB -> {math.ceil(res[3]/76)} H100")
for r in (4, 5, 6):
    print(f"replicas={r} (slots={r*4}): P(queue_wait)={erlang_c(1.8, 8.0, r, 4):.3f}")
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
  <figcaption>Under a 76 GB usable H100 budget, Qwen3.6-27B leaves room for 16 full-attention KV layers, 48 fixed linear-attention states, and runtime overhead at 8k context.</figcaption>
</figure>

For small models (`1B`–`8B`), **NVIDIA MIG** partitions an A100/H100 into hardware-isolated SM and memory slices (also dividing HBM bandwidth).[^nvidia2026mig] At batch size 1, single-stream decode is memory-bandwidth bound ($\text{tok/s} \approx \text{HBM BW} / \text{Active Weight Bytes}$): on a `3,350 GB/s` H100 SXM,[^nvidia2026h100] quantizing `27B` weights from BF16 (`54 GB`) to FP8/INT8 (`27 GB`) doubles the single-stream ceiling from `62.0` to `124.1 tok/s` (`8B` BF16 reaches `209.4 tok/s`). When models span GPUs, keep **Tensor Parallelism (TP)** inside fast NVLink domains (`5,120` all-reduces across 80 layers x 32 steps) and use **Pipeline Parallelism (PP)** (`96` stage handoffs) across slower inter-node links.[^shoeybi2019][^pope2023]

<figure>
  <img src="illustrations/_generated/decode_bandwidth_chart_dark.png" alt="Weight-only batch-size-one decode ceilings on an H100 SXM GPU at 3,350 GB/s HBM bandwidth: 8B BF16 (16 GB weights) reaches 209.4 tokens/s, dense 27B INT8 (27 GB weights) reaches 124.1 tokens/s, and dense 27B BF16 (54 GB weights) reaches 62.0 tokens/s." />
  <figcaption>Halving active weight bytes with INT8/FP8 doubles the single-stream H100 decode ceiling from 62.0 to 124.1 tok/s.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/parallelism_topologies_dark.png" alt="Tensor parallelism versus pipeline parallelism across 4 GPUs on an 80-layer model over 32 decode steps: tensor parallelism splits every layer inside an NVLink node with 2 all-reduce syncs per layer (5,120 sync events), while pipeline parallelism splits layers into sequential stage handoffs across nodes (96 boundary transfers) at the cost of pipeline bubbles." />
  <figcaption>TP synchronizes twice per layer over NVLink (5,120 syncs), while PP limits cross-node traffic to stage handoffs (96 transfers).</figcaption>
</figure>

## Autoscaling, warm pools, and cold-start math

Scale on **queue depth, oldest queue age, and active KV pressure** (`vllm:num_requests_waiting`, `vllm:num_requests_running`, `vllm:kv_cache_usage_perc` on a `0.0..1.0` scale) paired with <span data-glossary="nvidia-dcgm">NVIDIA DCGM</span> hardware health (ECC/XID faults), rather than raw GPU utilization alone.[^vllm2026metrics] Exclude evictable unreferenced prefix-cache blocks from live KV pressure.

Compute an **absolute desired target** `ceil((waiting + running) / slots_per_replica)` that includes pending pods so repeated polls do not stack duplicate boots, hold desired steady if telemetry goes stale, and protect scale-down with HPA `stabilizationWindowSeconds` (`300 s`) and KEDA `cooldownPeriod` so warm weights and prefix caches are not thrashed.[^keda2026ScaledObject][^kubernetes2026Hpa]

<!-- leetllm: test, output=show, deps=numpy,scipy -->
```python title="autoscaler-and-warm-buffer.py"
import math, numpy as np
from scipy.stats import poisson

def step_replicas(waiting, running, ready, pending, slots, low_age_s, cooldown_s=300, fresh=True):
    cur = ready + pending
    if not fresh: return cur
    need = max(1, math.ceil((waiting + running) / slots))
    if need > cur: return need
    return (cur - 1) if (need < cur and low_age_s >= cooldown_s) else cur

print("polls 0/1/2:", step_replicas(30, 20, 4, 0, 5, 0), step_replicas(30, 20, 4, 6, 5, 0), step_replicas(36, 20, 4, 6, 5, 0))
print("cooldown 299s vs 300s:", step_replicas(0, 4, 7, 0, 5, 299), step_replicas(0, 4, 7, 0, 5, 300))

# 100-req burst, 30s wait limit, 10s service, 5 slots/rep -> 4 waves (20 reqs/warm rep)
for w in (0, 1, 3, 20):
    served = min(100, w * 5 * (30 // 10 + 1))
    print(f"warm={w:2d}: served={served:3d} expired={100 - served:3d}")
burst_99 = int(poisson.ppf(0.99, mu=1.2 * 30))
print(f"99th-pct 30s burst={burst_99} -> min warm replicas={int(np.ceil(burst_99 / 20))}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
polls 0/1/2: 10 10 12
cooldown 299s vs 300s: 7 6
warm= 0: served=  0 expired=100
warm= 1: served= 20 expired= 80
warm= 3: served= 60 expired= 40
warm=20: served=100 expired=  0
99th-pct 30s burst=51 -> min warm replicas=3
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/autoscaling_control_loop_dark.png" alt="Thirty waiting requests and 20 running streams make a 50-request snapshot. At five active slots per replica, demand points to ten replicas: four ready with all 20 slots of current capacity full and six pending. Polls raise desired replicas from 4 to 10, keep 10 when 4 are ready, then raise to 12 for 56 requests. Unplaced GPU pods pass through node provisioning, image and weight loading, warmup, and readiness before joining traffic; existing streams continue." />
  <figcaption>Desired replicas include pending pods so repeated polls never double-count the same queue.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/autoscaler_queue_dynamics_dark.png" alt="Autoscaler replica and queueing dynamics over 450 seconds: desired replicas jump immediately from 4 to 12 during the traffic burst while ready capacity stays at 4 across the 207-second cold startup lag, pushing queue backlog up before draining once new GPUs warm up. After demand drops at 100 s, a 300-second cooldown holds capacity steady until gracefully draining one replica at 400 s." />
  <figcaption>Queue depth spikes across the 207-second cold-start lag before new GPUs warm up; a 300 s cooldown prevents premature scale-down.</figcaption>
</figure>

Cold GPU readiness chains four serial stages (`95 s` node provision + `22 s` image pull + `78 s` weight load + `12 s` warmup = **`207 s`**). Reactive scaling cannot rescue requests carrying a `30 s` wait deadline: pre-warmed headroom (sized with Poisson burst quantiles), placeholder GPU pods, NVMe weight staging, and scheduled pre-warming ahead of known peaks (`8:56` finishes `33 s` early vs. `8:58` finishing `87 s` late) bridge that gap.

<figure>
  <img src="illustrations/_generated/warm_buffer_deadline_dark.png" alt="Requests served vs expired from a 100-request burst with a 30-second wait deadline and 207-second cold replica startup: 0 warm replicas lose all 100, 1 warm serves 20 and loses 80, 3 warm serve 60 and lose 40, and 20 warm serve all 100 before any cold replica is ready." />
  <figcaption>With a 30 s deadline and 207 s cold startup, only warm capacity running at t=0 rescues burst traffic.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/cold_start_timeline_dark.png" alt="One shared clock runs from 8:56 to 9:02. A serial startup trace takes 95 seconds for node provisioning, 22 for the image, 78 for weights, and 12 for warmup, reaching readiness after 207 seconds. Starting at 8:58 reaches readiness at 9:01:27, 87 seconds after the surge; starting at 8:56 reaches readiness at 8:59:27, 33 seconds before it. The first request starts only after readiness." />
  <figcaption>A 207 s startup finishes 33 s early when pre-warmed at 8:56, or 87 s late when triggered reactively at 8:58.</figcaption>
</figure>

## Structured LLM telemetry, tracing, drift, and SLO alerts

Green infrastructure dashboards routinely mask broken LLM behavior: every request can return `200 OK` under `500 ms` TTFT while delivering hallucinated or policy-violating outputs.[^sreMonitoringDistributedSystems] Production observability layers **serving-gate verdicts**, **OpenTelemetry GenAI traces**, **independent SLO alerts**, and **unbiased drift/sampling math** on top of GPU metrics.

### Serving-gate denominators and versioned cost attribution

Record whether substantive text reached the user (`substantive_output_served`) separately from an independent tri-state verdict (`unsafe_claim_served`: `True`, `False`, or `None` pending; never default `None` to safe!). Across six reviewed calls where three abstained, one answered safely, and two leaked unsafe claims, request-level incidence is `2/6` (`33.3%`) while **delivered-answer risk** is `2/3` (`66.7%`). Pair zero-violation windows with sample size $N$ and a 95% Wilson score bound (`(0.0000, 0.0713)` for `0/50`). Store raw disjoint token counters (`input_tokens`, `cached_input_tokens`, `output_tokens`) separately from **versioned rate cards** and reject impossible counts (`cached_input > input_tokens`) loudly rather than clamping bugs silently.

### OpenTelemetry GenAI spans, data minimization, and agent loop budgets

Under W3C Trace Context and OpenTelemetry GenAI conventions,[^w3cTraceContext2021][^otelgenaispans2026] one `trace_id` links distinct `span_id` / `parent_span_id` nodes across retrieval, model generation (`gen_ai.operation.name`, `gen_ai.request.model`), tool calls, and serving guardrails. Tagging `first_failed_stage` (e.g., `claim_generation`) separately from `escape_stage` (`serving_gate`) isolates model regressions from guardrail regressions immediately.

Follow three telemetry hygiene rules:

1. **Low-cardinality metrics, pinned release digests:** Keep Prometheus labels low-cardinality (version, model, route) and keep `request_id` on trace spans and exemplars.[^otelgenaimetrics2026] Emit a content-addressed SHA-256 `release_id` hashing the entire entangled tuple (weights/snapshot, prompt bytes, tool schemas, retrieval index, container digest) on every span so replay and compare-and-swap (CAS) promotions stay reproducible.[^ociDescriptorDigest2026]
2. **Data minimization:** Retain IDs, digests, verdicts, latencies, and token counts by default; keep raw prompt/completion capture opt-in with tight TTL.[^otelsensitivedata2026]
3. **Agent loop budgets:** When each turn appends $g$ tokens to starting context $s$, cumulative input tokens grow quadratically: $N s + g \frac{N(N-1)}{2}$. Enforce three guards before every tool call: a consecutive identical-state repeat cap, a wall-clock deadline, and a spend reservation check.

### Independent SLO alerts, drift detection, and count-before-sampling

Include exemplar `trace_id` values and release tags directly in alerts, and evaluate channels **independently**: if latency emits `NaN` or usage accounting fails, emit confirmed safety/SLO pages first and mark degraded channels `UNKNOWN`, reconciling terminal events against an independent ingress counter to expose dropped telemetry.

Track unlabeled distribution shift with **Population Stability Index (PSI)** (`< 0.10` stable, `0.10`–`0.25` watch, `> 0.25` major shift), two-sample **Kolmogorov-Smirnov (KS)** tests, and RBF-kernel **$\text{MMD}^2$** on query embeddings.[^chen2023drift][^potgieter2026psi] Crucially, when **tail sampling** keeps 100% of error/flagged traces and probability $p$ of routine traces, raw trace-store percentages grossly inflate failure rates.[^otelTailSampling2026] Always **count total ingress and flagged events before sampling**, and apply **inverse-probability weighting (IPW)** ($1/p$ per routine trace) when estimating population rates from sampled traces:

<!-- leetllm: test, id=serving-telemetry-ipw, deps=numpy,scipy, output=show -->
```python title="serving-telemetry-and-ipw.py"
import numpy as np
from scipy.stats import binomtest, ks_2samp

# 1. Denominator separation + 95% Wilson bound + IPW tail-sampling recovery
reviewed_unsafe, reviewed_total, served_total = 2, 6, 3
ci = binomtest(0, 50).proportion_ci(0.95, method="wilson")
kept_flagged, kept_routine, p_routine = 3, 12, 0.20
ipw_rate = kept_flagged / (kept_flagged + kept_routine / p_routine)
print(f"unsafe: {reviewed_unsafe}/{reviewed_total} reviewed ({reviewed_unsafe/reviewed_total:.1%}) vs {reviewed_unsafe}/{served_total} served ({reviewed_unsafe/served_total:.1%})")
print(f"wilson(0/50)=({ci.low:.4f}, {ci.high:.4f}) | tail-sampled naive={kept_flagged/(kept_flagged+kept_routine):.1%} vs IPW={ipw_rate:.2%}")

# 2. PSI & KS latency drift check + agent loop quadratic token growth
rng = np.random.default_rng(42)
ref_t = rng.lognormal(np.log(190.0), 0.18, 250)
cur_t = rng.lognormal(np.log(265.0), 0.25, 250)
edges = np.quantile(ref_t, np.linspace(0, 1, 11)); edges[0], edges[-1] = -np.inf, np.inf
p = np.clip(np.histogram(ref_t, bins=edges)[0] / len(ref_t), 1e-6, None)
q = np.clip(np.histogram(cur_t, bins=edges)[0] / len(cur_t), 1e-6, None)
psi = float(np.sum((q - p) * np.log(q / p)))
ks = ks_2samp(ref_t, cur_t)
loop_toks = [n * 100 + 20 * n * (n - 1) // 2 for n in (4, 8, 16)]
print(f"drift: PSI={psi:.3f}, KS={ks.statistic:.3f} | agent loop tokens (4/8/16 calls)={loop_toks}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unsafe: 2/6 reviewed (33.3%) vs 2/3 served (66.7%)
wilson(0/50)=(0.0000, 0.0713) | tail-sampled naive=20.0% vs IPW=4.76%
drift: PSI=2.218, KS=0.644 | agent loop tokens (4/8/16 calls)=[520, 1360, 4000]
```
<!-- leetllm: output:end -->

## Spot draining, disaggregation, and multi-tenant LoRA

Layer **reserved on-demand GPUs** for steady baseline + warm headroom with **spot instances** for burst/async overflow. Cloud preemption windows vary sharply (AWS `120 s`, Azure up to `30 s`, GCP none by default with optional `120 s` notice).[^awsSpotInterruptions2026][^azureSpotVms2026][^googleSpotVms2026] On notice, flip intake to `503`, reserve cleanup time (`20 s` out of `120 s` leaves `100 s`), finish short streams inside budget, retry unstarted work, and mark overrun streams explicitly as interrupted rather than splicing text across workers.

<figure>
  <img src="illustrations/_generated/spot_drain_deadline_dark.png" alt="Spot instance preemption drain schedule under a 120-second cloud notice: subtracting 20 seconds reserved for worker cleanup leaves 100 seconds of drain budget. Short 12 s and 84 s generations fit and finish gracefully, while 170 s work must retry if unstarted or emit an explicit interruption signal if already streaming." />
  <figcaption>Reserving 20 s for cleanup out of a 120 s spot notice leaves 100 s to finish short generations while safely rerouting unstarted queued prompts.</figcaption>
</figure>

When heavy long-prompt traffic (`61%` long documents) pushes unified chunked-prefill pools past TTFT (`1,500 ms`) or TPOT (`60 ms`) SLOs, evaluate **prefill-decode disaggregation** (Splitwise, NVIDIA Dynamo), shipping KV blocks over NVLink/RDMA.[^zhong2024][^patel2023][^nvidia2026dynamodisaggregated] Keep regional failover at request boundaries (never mid-stream, since KV state is GPU-local). For multi-tenant customization, **multi-tenant LoRA** shares one resident base model across hot-swapped per-tenant adapters;[^hu2021][^sheng2023][^vllm2026lora] derive tenant identity strictly from verified auth credentials (ignoring raw `X-Tenant-ID` headers), return `403` on revoked accounts or base mismatches, and isolate prefix caches with a per-tenant `cache_salt`.

<figure>
  <img src="illustrations/_generated/disaggregated_prefill_decode_dark.png" alt="Disaggregated prefill-decode serving pipeline and workload SLO evaluation: requests route to a prefill pool that ships KV blocks and layout metadata to a decode pool. In a dual-SLO scatter plot (TTFT target <= 1500 ms, TPOT target <= 60 ms), short incident chat (820 ms TTFT, 44 ms TPOT) satisfies both targets in a mixed pool, whereas decode pressure (800 ms, 90 ms) and policy-document surges (2450 ms, 93 ms) justify testing separate pools." />
  <figcaption>Adopt prefill-decode disaggregation only after traces show mixed chunked-prefill pools breaching TTFT or TPOT SLOs.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/tenant_lora_routing_dark.png" alt="Multi-tenant LoRA serving isolation on a shared base-v7 model: verified tenant credentials validate current group membership and compatible adapter metadata to select adapter_A_v3 (ID 101) or adapter_B_v2 (ID 102) with isolated prefix cache_salt values, while rejecting raw X-Tenant-ID headers, revoked members, or mismatched base checkpoints with 403." />
  <figcaption>Bind verified tenant credentials to compatible LoRA adapters and isolated prefix `cache_salt` keys, rejecting spoofed headers and revoked accounts with 403.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="spot-and-tenant-policy.py"
def classify_spot(notice_s, cleanup_s, rem_s, streamed):
    return "finish" if rem_s <= notice_s - cleanup_s else ("interrupt" if streamed else "retry")

MEMBERSHIP = {"user-eng-1": {"org-alpha"}, "user-ops-2": {"org-beta"}}
REGISTRY = {"org-alpha": ("adapter_A_v3#101", "base-v7"), "org-beta": ("adapter_B_v2#102", "base-v7")}
def resolve_lora(principal, tenant, base):
    if tenant not in MEMBERSHIP.get(principal, set()) or REGISTRY.get(tenant, (None, None))[1] != base:
        return 403, "", ""
    adp = REGISTRY[tenant][0]
    return 200, adp, f"salt:{tenant}:{adp.split('#')[1]}"

print("spot (84s/170s unstarted/170s streamed):", classify_spot(120, 20, 84, True), classify_spot(120, 20, 170, False), classify_spot(120, 20, 170, True))
print("lora (valid / spoof / wrong base):", resolve_lora("user-eng-1", "org-alpha", "base-v7")[0], resolve_lora("user-eng-1", "org-beta", "base-v7")[0], resolve_lora("user-ops-2", "org-beta", "base-v6")[0])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
spot (84s/170s unstarted/170s streamed): finish retry interrupt
lora (valid / spoof / wrong base): 200 403 403
```
<!-- leetllm: output:end -->

```mastery-quiz
[
  {
    "question": "A client logs one timestamp per output event. It receives one token at 210 ms, three tokens together at 270 ms and two together at 390 ms. What are the consecutive event gaps and the request's mean TPOT after the first token?",
    "options": [
      "Event gaps of 60 and 120 ms, TPOT of 90 ms, generation gaps of 0 ms within bundles.",
      "Event gaps of 60 and 180 ms, TPOT of 36 ms, generation gaps of 0 ms within bundles.",
      "Event gaps of 60 and 120 ms, TPOT of 36 ms, unknown generation gaps within bundles.",
      "Event gaps of 60 and 180 ms, TPOT of 90 ms, unknown generation gaps within bundles."
    ],
    "answer": "Event gaps of 60 and 120 ms, TPOT of 36 ms, unknown generation gaps within bundles.",
    "explanation": "Event gaps are 60 and 120 ms over 180 ms total. Six tokens create five post-first-token intervals, giving TPOT = 180 / 5 = 36 ms, while internal intervals inside each SSE bundle remain hidden."
  },
  {
    "question": "A ready two-slot worker is streaming R and S. A new request T arrives, followed by a duplicate of S. The worker then begins draining. R finishes and U arrives while S is still streaming. Which HTTP statuses do T, duplicate S, and U receive?",
    "options": [
      "429, 409, 503. S owns a slot.",
      "429, 429, 503. S owns a slot.",
      "429, 409, 200. S and U own slots.",
      "429, 429, 200. S and U own slots."
    ],
    "answer": "429, 409, 503. S owns a slot.",
    "explanation": "Full capacity returns 429 (liveness stays green), duplicate detection returns 409, and draining flips local intake to 503 while S finishes."
  },
  {
    "question": "A homogeneous controller uses 4 slots per replica. Fresh demand has 17 waiting and 9 running requests with 7 desired replicas (3 ready, 4 pending). The next poll reports the exact same counts. What desired targets follow on these two polls?",
    "options": [
      "7 then 11; add another four pending replicas.",
      "3 then 7; count only workers currently ready.",
      "7 then 7; pending capacity is already counted.",
      "6 then 6; floor the total active demand."
    ],
    "answer": "7 then 7; pending capacity is already counted.",
    "explanation": "ceil(26 / 4) = 7 desired replicas. Pending workers remain counted inside desired capacity while booting, preventing runaway duplicate scale-out."
  },
  {
    "question": "At t=0, 54 requests arrive at an idle warm pool (4 slots/replica, 5 s service time, 120 s cold startup). What minimum warm pool lets every request start within 10 s, and what if the deadline is 9 s?",
    "options": [
      "4 replicas at 10 s and 6 at 9 s.",
      "5 replicas at 10 s and 7 at 9 s.",
      "7 replicas at 10 s and 14 at 9 s.",
      "14 replicas at 10 s and 14 at 9 s."
    ],
    "answer": "5 replicas at 10 s and 7 at 9 s.",
    "explanation": "At a 10 s wait limit, each warm replica runs waves at 0, 5, and 10 s (12 requests/replica), needing ceil(54 / 12) = 5 replicas. At 9 s, wave 3 misses the deadline (8 requests/replica), needing ceil(54 / 8) = 7 replicas."
  },
  {
    "question": "A draining spot worker has 75 s until shutdown and reserves 18 s for cleanup. Three active streams need 58 s, 21 s, and 57 s remaining. Which should finish locally and how should the rest be handled?",
    "options": [
      "Finish the 21 s reply. Mark each remaining stream as interrupted.",
      "Finish the 21 s and 57 s replies. Append a fresh generation to each remaining stream.",
      "Finish the 21 s reply. Append a fresh generation to each remaining stream.",
      "Finish the 21 s and 57 s replies. Mark each remaining stream as interrupted."
    ],
    "answer": "Finish the 21 s and 57 s replies. Mark each remaining stream as interrupted.",
    "explanation": "75 - 18 = 57 s usable drain budget: both 21 s and 57 s fit, while the 58 s stream must emit an explicit interruption event rather than splicing outputs."
  },
  {
    "question": "A tail sampler keeps 100% of flagged unsafe traces and 5% of routine traces. Stored logs show 40 flagged traces and 60 routine traces (40% raw). What is the IPW-estimated true unsafe rate, and what pre-sampling telemetry is still required?",
    "options": [
      "40.0%; no pre-sampling counters are needed.",
      "3.2%; count total ingress and flagged events before sampling.",
      "2.0%; store raw prompt text on every span.",
      "12.5%; drop routine traces entirely to save storage."
    ],
    "answer": "3.2%; count total ingress and flagged events before sampling.",
    "explanation": "Weighting each routine trace by 1 / 0.05 = 20 yields 40 / (40 + 60 * 20) = 40 / 1240 = 3.2%. Counting total ingress and flagged events before sampling preserves exact baseline volume without sampling variance."
  }
]
```

> **Next:** Continue to [Serving Benchmark Engineering](/learn/serving-benchmark-engineering).
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
At 8:59, one warm worker handles traffic without accumulating a queue. At 9:00, a surge sends 100 requests to the endpoint in a single wave. Your autoscaler immediately reacts, requesting 19 more replicas so the desired count jumps from 1 to 20.

Eighty of those requests are going to expire before help arrives. Each caller gives up after 30 seconds, while a cold GPU worker takes 207 seconds to provision hardware, pull its container, load model weights, and become useful.

This timing mismatch defines GPU serving and surprises engineers accustomed to stateless web fleets. A lightweight web container boots in seconds, making reactive autoscaling fast enough for sudden spikes. A GPU pod must wait on accelerator allocation, gigabytes of image layers, checkpoint loads, and runtime warmup before it serves token one. **Desired replicas** describe a future plan, whereas **ready capacity** serves requests right now.

## Two loops on two clocks

Every serving cluster runs two control loops on incompatible clocks. Requests arrive on the fast data path: gateway, queue concurrency check, waiting queue, engine scheduler, GPU batch decode, and streamed output tokens. Meanwhile, a separate capacity loop reads telemetry, updates replica counts, and waits minutes for nodes and weights to initialize before new replicas enter the ready pool.

<figure>
  <img src="illustrations/_generated/gpu_serving_dark.png" alt="Two connected serving loops. A queue with an original deadline enters capacity gating, a ready batch, GPU decode, and a token stream. Rejected requests return 429 with Retry-After and signal the capacity loop. Future replicas join the ready batch only after their engines are loaded, warm, and healthy." />
  <figcaption>The data path serves the work you have now, and the capacity loop changes what you will have later. Carrying the original deadline and Retry-After prevents retries from multiplying overload.</figcaption>
</figure>

Three distinct layers divide this work cleanly. The inference engine manages prompt prefill, continuous batching, and KV cache slots on the GPU itself. A replica controller watches engine gauges and requests Kubernetes pods, while a node autoscaler provisions physical accelerators whenever pending pods cannot schedule.

## Busy isn't the signal you want

Traditional autoscalers trigger on CPU or GPU compute utilization, yet high utilization on an LLM server can mean efficient continuous batching rather than overload. Conversely, a [modest compute duty cycle can coexist with an HBM memory-bandwidth bottleneck](/learn/inference-mechanics-ttft-tps-kv-cache) during small-batch decode. Queue depth and oldest queue age directly measure whether callers are sitting idle waiting for an available slot.

| Signal | Comes from | What it tells you |
|---|---|---|
| Queue depth and queue age | Serving framework or gateway | Backlog, and how long the oldest work has waited |
| KV cache use | Serving framework | Memory pressure that can stop new work from starting |
| GPU duty cycle | NVIDIA DCGM | Supporting detail, easy to misread alone |
| Time to first token | Serving framework | The initial wait users actually feel |
| Stream gaps and time per output token | Token or event collector | Decode pacing and tail stalls after generation starts |

Verify exact metric semantics before converting any gauge into an autoscaling rule. Cached prefix pages with zero active users are evictable rather than exhausted live state, and vLLM publishes `kv_cache_usage_perc` as a fraction where `0.85` means 85%.[^vllm2026metrics] Inspect tail inter-token gaps alongside mean TPOT as well, because isolated stalls vanish inside request-wide averages.

## What "ready" has to mean

Kubernetes pod phases move through scheduling, container start, weight load, warmup, and true readiness, often separated by minutes on large checkpoints. Three Kubernetes probes govern those phases independently:[^kubernetes2026Probes]

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
print("load, warm, accept, reject excess, drain active work")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
load, warm, accept, reject excess, drain active work
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/worker_readiness_lifecycle_dark.png" alt="Inference worker readiness and drain lifecycle: a pod progresses from loading weights and warmup to ready serving, returns HTTP 409 for duplicate IDs and HTTP 429 when capacity is full without failing liveness, and returns HTTP 503 during drain while active streams finish." />
  <figcaption>Full, draining, and failed are separate states, and only hardware or process faults should trigger a restart.</figcaption>
</figure>

## Will it fit on the card?

Before calculating fleet replica counts, check what one GPU holds comfortably inside latency budgets. Resident model weights, per-request KV cache (plus fixed recurrent state on hybrid models), and runtime scratch buffers share HBM together. Quantizing weights from BF16 to FP8 or INT8 often doubles single-stream decode ceilings alongside freeing HBM, while PagedAttention prevents wasted sequence buffers from starving concurrent requests.

## From a benchmark to a replica count

Load testing under realistic prompt shapes establishes how many concurrent streams one replica handles while hitting TTFT and TPOT targets. When `20` requests are streaming across `4` ready workers (`5` slots apiece) and `30` sit queued, total demand of `50` requires `ceil(50 / 5) = 10` replicas. On the very next poll, `6` pods are pending initialization while `4` remain ready; because the controller computes an absolute target including pending workers, desired stays cleanly at `10` rather than double-counting the queue.

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

Trace what happens when `100` requests arrive simultaneously at 9:00 with a `30 s` wait limit, `10 s` service time per slot, and `207 s` cold pod startup. Each warm replica starts `5` requests at `0, 10, 20, 30 s` (`20` requests total) before deadlines run out. Cold capacity finishes long after the burst expires, meaning warm capacity present at `t = 0` determines survival rate.

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

Teams survive sudden spikes faster than cold startups with three levers: **warm capacity** (headroom on baseline pools), **placeholder pods** (low-priority pods pre-holding GPU nodes), and **predictive warmup** ahead of recurring surges. Spikes beyond your warm budget must shed fast with `429` and `Retry-After` rather than burning GPU cycles on expired requests.

## A cold start is a chain

Cold readiness chains four sequential steps summing to `207 s`: `95 s` for cloud node provisioning, `22 s` for pulling the image, `78 s` for loading checkpoint weights, and `12 s` for warmup. Moving the trigger ahead by two minutes shifts readiness from `87 s` after the 9:00 surge to `33 s` before it hits. Attacking startup permanently means pre-warmed node pools, slimmed images, and NVMe weight staging.

<figure>
  <img src="illustrations/_generated/cold_start_timeline_dark.png" alt="One shared clock runs from 8:56 to 9:02. A serial startup trace takes 95 seconds for node provisioning, 22 for the image, 78 for weights, and 12 for warmup, reaching readiness after 207 seconds. Starting at 8:58 reaches readiness at 9:01:27, 87 seconds after the surge; starting at 8:56 reaches readiness at 8:59:27, 33 seconds before it. The first request starts only after readiness." />
  <figcaption>The exact same 207-second startup finishes either 33 seconds ahead of the burst or 87 seconds too late, depending solely on when scaling starts.</figcaption>
</figure>

Pair rapid scale-up with conservative scale-down (`stabilizationWindowSeconds` on HPA, `cooldownPeriod` on KEDA) so initialized weights and warm prefix caches survive brief traffic dips.[^keda2026][^karpenter2026][^kubernetes2026Hpa]

## Draining and spot capacity

Spot instances cut compute spend when drain logic respects cloud notice periods: AWS issues two-minute notices (zero for hibernation),[^awsSpotInterruptions2026] Azure up to 30 seconds,[^azureSpotVms2026] and Google Cloud none by default with an optional 120-second notice.[^googleSpotVms2026] Reserving `20 s` for cleanup out of `120 s` leaves `100 s` to finish short generations, reroute unstarted queued prompts elsewhere, and mark overrun streams explicitly as interrupted rather than splicing two runs.

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

## Observe what reached the user: tracing, alerts, and sampling

Fast HTTP `200 OK` responses do not mean the system is healthy if the model delivered fabricated or unsafe advice.[^sreMonitoringDistributedSystems] Complete serving observability adds four practices alongside GPU gauges:

1. **Separate outcome denominators:** Record whether substantive output reached the user alongside an independent tri-state verdict (`True`, `False`, `None` pending; never treat unreviewed `None` as safe). If two of six reviewed calls leaked an unsafe answer while three abstained, request incidence is `2/6` (`33.3%`), whereas **delivered-answer risk** is `2/3` (`66.7%`).
2. **Trace every stage with pinned release digests:** Emit W3C / OpenTelemetry GenAI spans (`trace_id`, `span_id`, `parent_span_id`) across retrieval, model generation, tool calls, and serving guardrails so failures pinpoint both `first_failed_stage` and `escape_stage`.[^otelgenaispans2026] Pin a SHA-256 `release_id` hashing weights, prompt, tool schemas, and container image on every span, keep Prometheus labels low-cardinality, and keep raw prompt text out of long-term logs by default.[^otelsensitivedata2026]
3. **Alert on independent channels and bound agent loops:** If latency emits `NaN` or usage counters drop, still fire confirmed safety/SLO alerts with trace exemplars and flag missing channels as `UNKNOWN`. Guard multi-turn tool loops (whose cumulative input tokens grow quadratically as $Ns + g\frac{N(N-1)}{2}$) with consecutive repeat caps, wall deadlines, and spend limits.
4. **Watch drift and count before sampling:** Track latency and embedding shifts with **PSI** (`> 0.25` major shift) and two-sample **KS** tests. When tail sampling retains 100% of errors and only probability $p$ of routine calls, raw stored logs overstate error rates; count total ingress and errors **before** sampling, and weight sampled routine traces by $1/p$ (**inverse-probability weighting**) to recover the true rate.[^otelTailSampling2026]

## Three ways a spike stalls

- **Waiting queue climbs while ready replicas stay unchanged:** Cold startup lag exceeds the request deadline; keep warm capacity or pre-warm earlier.
- **Mean TPOT looks healthy while token stalls hit interactive users:** Examine tail `ITL` and separate SSE output-event chunks from token generation intervals.
- **Retries flood already-full workers:** Enforce queue depth caps, carry original request deadlines, and pace client retries with `Retry-After`.

## Choose the next change from what you measured

Diagnose from traces before re-architecting. If first tokens lag, isolate queue wait, cold startup, prefix cache misses, and prefill stalls; if output slows mid-stream, examine batch concurrency, HBM bandwidth, and node telemetry. Start from a shared worker pool running continuous batching, PagedAttention, prefix caching, and chunked prefill, and introduce disaggregated prefill/decode pools or multi-node parallelism only when measurements demonstrate your baseline misses SLOs.[^zhong2024]
<!-- leetllm: edition:reader:end -->
