---
{
  "id": "scaling-llm-inference-batching-kv-cache",
  "title": "Scaling LLM Inference",
  "slug": "scaling-llm-inference-batching-kv-cache",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/kv_memory_capacity_dark.png",
  "shortDescription": "Size a serving replica from memory bandwidth and KV residency, then pick the batch, precision, and speculation the latency target can afford.",
  "keyConceptsTested": [
    "Prefill vs decode resource ceilings",
    "Arithmetic intensity and memory-bound decode",
    "KV-cache residency as a concurrency cap",
    "Throughput-latency-cost operating points",
    "Batching as weight-read amortization",
    "Paged packing and prefix copy-on-write",
    "Speculative decoding as fewer target passes",
    "Weight quantization as a bandwidth lever",
    "Prefill-decode disaggregation break-even",
    "Context parallelism for long-context KV"
  ],
  "prerequisites": [
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving",
    "flashattention-memory-efficient-attention",
    "multi-query-grouped-query-attention"
  ],
  "relatedQuestions": [
    "model-parallelism-for-llm-inference",
    "model-quantization-gptq-awq-gguf",
    "speculative-decoding",
    "local-llm-deployment-hardware-quantization",
    "long-context-window-management",
    "llm-deployment-gpu-serving-autoscaling"
  ],
  "companies": [
    "Google",
    "Meta",
    "NVIDIA",
    "Anyscale",
    "Together AI"
  ],
  "section": "Inference & Production Scale",
  "order": 7
}
---

[Continuous batching](/learn/continuous-batching-request-scheduling) can refill decode slots as soon as a request finishes. A full queue can still hide a capacity failure: once the scheduler is ready to queue or accept more work, what runs out first on the GPU serving a large language model (LLM)?

A code-assistant pool makes the constraint concrete. Short completions and long patch explanations share one model replica, and each request advances one <span data-glossary="token">token</span> at a time during ordinary decode.

Each decode step reads model weights from <span data-glossary="gpu">GPU</span> <span data-glossary="hbm">high-bandwidth memory (HBM)</span> and consults a growing <span data-glossary="kv-cache">KV cache</span>. For small-batch dense-model decode, moving those bytes often costs far more time than the arithmetic. Memory capacity separately limits how many concurrent streams fit in VRAM.

Start with an 8B-class replica on one GPU. As we add requests, its weights stay fixed but its KV occupancy grows. The larger 70B architecture stress-tests the same calculation. The CPU examples below check arithmetic, scheduling, and sampling behavior; they don't measure GPU throughput or run a live serving engine.

```checkpoint
Why isn't "keep the batch full" enough to scale LLM serving?
---
A full batch still has to fit in HBM and still has to move weights plus KV state every decode step. If bandwidth or KV residency is the ceiling, extra queued requests wait or stall instead of raising useful tokens per second.
```

## Decode sits under a bandwidth roof

You already know the two phases from [inference mechanics](/learn/inference-mechanics-ttft-tps-kv-cache). <span data-glossary="prefill">Prefill</span> reads known prompt tokens in parallel and is compute-heavy.

<span data-glossary="decode-phase">Decode</span> emits one new token per request step. This sequential dependency is why a request can have prompt processing behind it but still need hundreds of serial iterations to finish.

Users wait for queueing, prompt processing, and delivery before the first token: together these make up <span data-glossary="ttft">time to first token (TTFT)</span>. During decode they experience <span data-glossary="itl">inter-token latency (ITL)</span>, also called time between tokens (TBT). For a response with at least two tokens, <span data-glossary="tpot">time per output token (TPOT)</span> averages the interval from first to last over the remaining tokens. A steady mean can easily mask a terrible <span data-glossary="p95-latency">p95</span> ITL.[^zhong2024]

The root physical constraint is the split in arithmetic intensity. <span data-glossary="arithmetic-intensity">Arithmetic intensity</span> measures FLOPs performed per byte loaded from HBM.

Prefill reuses each weight <span data-glossary="matrix">matrix</span> across many prompt positions in matrix multiplications (GEMMs). One-request decode makes the dense linear operations matrix-vector products (GEMVs); batched decode uses thin GEMMs. Attention over cached history adds separate work.

For a dense model with $P$ parameters, use roughly $2P$ FLOPs per token for the parameter-dependent linear work. This omits context-dependent attention and counts multiply-add as two FLOPs. If one step streams the weights once across batch size $B$ and weight reads dominate traffic, the simplified intensity is:

$$
I_{\text{decode}} \approx \frac{2 \times P \times B}{P \times P_{\text{bytes}}} = \frac{2 B}{P_{\text{bytes}}}
$$

For FP16 precision ($P_{\text{bytes}} = 2$), the operational intensity simplifies to $I_{\text{decode}} \approx B$ FLOPs per byte.

The <span data-glossary="roofline-model">roofline model</span> bounds performance by the smaller of a compatible compute peak and <span data-glossary="memory-bandwidth">memory bandwidth</span> times intensity.[^williams2009][^pope2023] Below the ridge, the bandwidth roof is lower; above it, the compute roof is lower. Reaching either roof still requires suitable kernels and achieved hardware rates.

For H100 SXM, use peak HBM bandwidth of 3.35 TB/s and about 989.5 TFLOP/s of dense FP16/BF16 Tensor Core compute. NVIDIA's 1,979 figure includes sparsity and must be halved for this dense comparison.[^nvidia2026h100] The dense ridge point is:

$$
I_{\text{ridge}} = \frac{989.5 \times 10^{12}\text{ FLOP/s}}{3.35 \times 10^{12}\text{ bytes/s}} \approx 295.4\text{ FLOPs/byte}
$$

At $B=1$, the weight-only approximation gives 1 FLOP/byte and a 3.35 TFLOP/s bandwidth roof, about 0.34% of that compute peak. This compares rates; it does **not** mean the tensor cores are idle for 99.66% of elapsed time. Device counters and a trace are needed to describe utilization.

<figure>
  <img src="illustrations/_generated/roofline_decode_dark.png" alt="Log₂-spaced H100 SXM roofline. Bandwidth is 3.35 TB/s and dense FP16 compute is 989.5 TFLOP/s; their curves meet at 295.4 FLOP/byte. The plotted ceilings are 3.35, 107.2, and 428.8 TFLOP/s at intensity 1, 32, and 128, then 989.5 TFLOP/s at the ridge. The lower of the byte-transfer and arithmetic ceilings limits the rate. I approximately equals batch size only when FP16 weights dominate; KV traffic changes intensity." />
  <figcaption>HBM bytes set the traffic ceiling, and dense FP16 operations set the compute ceiling. At each intensity, the lower rate bounds performance. These are H100 ceilings, not measured kernel rates. With weight-only FP16 traffic, I ≈ B; KV bytes and attention work change intensity. At I=1, 0.34% compares ceilings, not elapsed idle time.</figcaption>
</figure>

Llama 3 8B is an 8B-parameter dense model.[^dubey2024] An <span data-glossary="fp16">FP16</span> copy of those weights occupies about 16 GB ($8\times10^9\times2$ bytes).

If one uncached decode step streams that entire footprint for one active token, the weight-read upper bound on H100 SXM is $3{,}350/16\approx209$ single-token steps per second. This is an idealized bandwidth upper bound; production throughput also depends on KV traffic, attention calculations, and runtime overhead.

Under that full-read assumption, dynamic KV cache traffic, attention calculations, and runtime overhead push the achievable rate lower. Weight quantization, speculative decoding, and batching change the bound. Use it as an immediate diagnosis: if a trace saturates HBM while tensor cores sit idle, buying more FLOPs won't speed up decode.

<!-- leetllm: test, output=show -->
```python title="decode-bandwidth-lower-bound.py"
parameters = 8_000_000_000  # Llama 3 8B-class dense count
bytes_per_parameter = 2  # FP16
h100_sxm_hbm_gb_s = 3_350  # decimal GB/s, NVIDIA H100 SXM

weight_gb = parameters * bytes_per_parameter / 1_000_000_000
ideal_steps_per_second = h100_sxm_hbm_gb_s / weight_gb

print(f"FP16 weight footprint: {weight_gb:.1f} GB")
print(f"H100 SXM weight-read upper bound: {ideal_steps_per_second:.1f} single-token steps/s")
print("Under this full-read model, extra traffic and overhead can only lower the bound.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP16 weight footprint: 16.0 GB
H100 SXM weight-read upper bound: 209.4 single-token steps/s
Under this full-read model, extra traffic and overhead can only lower the bound.
```
<!-- leetllm: output:end -->

```checkpoint
You profile decode and see tensor cores idle while HBM bandwidth is near saturation. Should you first buy more FLOPs or reduce memory traffic?
---
Reduce bytes per emitted token or amortize them across a larger effective batch. Weight quantization targets weight reads; KV quantization targets cache reads and capacity. Paging improves allocation, not the payload bytes read. GQA/MQA requires choosing or adapting a checkpoint, not flipping an allocator flag.
```

## KV bytes cap the batch you can form

Batching only helps if extra requests fit. The [KV cache lesson](/learn/kv-cache-paged-attention-llm-serving) derived the payload formula: each token stores a Key vector and a Value vector at every layer and KV head.

$$
\text{KV\_bytes\_per\_token} = 2 \times N_{\text{layers}} \times N_{\text{kv\_heads}} \times d_{\text{head}} \times P_{\text{bytes}}
$$

Llama 3 uses <span data-glossary="grouped-query-attention">grouped-query attention</span> with 8 KV heads at 8B, 70B, and 405B.[^dubey2024][^ainslie2023] That head count is why KV state is much smaller than a full multi-head attention cache, but it still grows linearly with layers, sequence length, and concurrency.

For Llama 3 70B in FP16 ($N_{\text{layers}} = 80, N_{\text{kv\_heads}} = 8, d_{\text{head}} = 128, P_{\text{bytes}} = 2$), one single token demands $2\times80\times8\times128\times2=327{,}680$ bytes, or 320 KiB. Multiplying by 8,192 tokens yields **2.5 GiB** per request. Sixty-four concurrent 8K streams require **160 GiB** of KV cache alone, before loading a single weight byte. An 80 GB H100 can't hold that batch: a plan to keep cranking batch size until the roofline saturates crashes into VRAM residency first.

The smaller 8B model fits on a single accelerator. Llama 3 8B has 32 layers, 8 KV heads, and $d_{\text{head}} = 128$, requiring 128 KiB per token. A 4,096-token request takes exactly 0.5 GiB.[^dubey2024]

For independent, unshared full-attention histories of the **same** length $L$, a fixed pool gives a payload-only batch ceiling:

$$
B_{\text{max}}(L) = \left\lfloor \frac{M_{\text{KV\_pool}}}{\text{KV\_bytes\_per\_request}(L)} \right\rfloor = \left\lfloor \frac{M_{\text{KV\_pool}}}{2 \times L \times N_{\text{layers}} \times N_{\text{kv\_heads}} \times d_{\text{head}} \times P_{\text{bytes}}} \right\rfloor
$$

Assume a 51.60 GiB pool, derived from an explicit byte budget below. The 8B dimensions give these capacities. For the longer rows, use a checkpoint such as **Llama 3.1 8B** that supports 128K.[^dubey2024] The original April Llama 3 8B has an 8K limit.[^meta2024llama3Card] Matching memory geometry doesn't extend a model's supported context.

| Sequence length ($L$) | KV per request (FP16) | Max concurrent streams ($B_{\text{max}}$) | Concurrency drop |
|---|---|---|---|
| **4,096 tokens (4K)** | 0.50 GiB | **103 requests** | Baseline |
| **16,384 tokens (16K)** | 2.00 GiB | **25 requests** | -76% |
| **32,768 tokens (32K)** | 4.00 GiB | **12 requests** | -88% |
| **65,536 tokens (64K)** | 8.00 GiB | **6 requests** | -94% |
| **131,072 tokens (128K)** | 16.00 GiB | **3 requests** | -97% |

Before flooring, payload capacity scales as $1/L$. The 128K row shows room for three streams under the stated pool assumption; measure throughput separately. A fourth independent full-payload request can't join that snapshot; it must wait, be rejected, or cause another request to be preempted. A serving policy chooses among those outcomes.

<figure>
  <img src="illustrations/_generated/kv_memory_capacity_dark.png" alt="Five equal 51.60 GiB tracks divide into one cell per unshared KV history. The rows show 103 requests of 0.50 GiB at 4K, 25 of 2 GiB at 16K, 12 of 4 GiB at 32K, 6 of 8 GiB at 64K, and 3 of 16 GiB at 128K. Unused tails show free space. A fourth 128K history needs 16 GiB when only 3.60 GiB remains." />
  <figcaption>At 128K, three 16 GiB histories use 48 GiB, leaving 3.60 GiB; a fourth cannot fit. The fixed 51.60 GiB pool counts equal, unshared payload only, not safe scheduling concurrency or throughput. Growth, page rounding, sharing, runtime memory, and latency targets need margin. Long rows require a checkpoint that supports 128K.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="llama70b-kv-residency.py"
def kv_cache_gib(
    batch_size: int,
    seq_len: int,
    num_layers: int,
    num_kv_heads: int,
    head_dim: int,
    dtype_bytes: int = 2,
) -> float:
    dimensions = (batch_size, seq_len, num_layers, num_kv_heads, head_dim, dtype_bytes)
    if any(value <= 0 for value in dimensions):
        raise ValueError("all dimensions and dtype_bytes must be positive integers")
    total_bytes = (
        2 * batch_size * seq_len * num_layers * num_kv_heads * head_dim * dtype_bytes
    )
    return total_bytes / (1024 ** 3)

one_8k = kv_cache_gib(1, 8_192, 80, 8, 128)
batch_64 = kv_cache_gib(64, 8_192, 80, 8, 128)

print(f"Llama 3 70B, one 8K request: {one_8k:.1f} GiB")
print(f"64 active 8K requests: {batch_64:.0f} GiB")
print("single-request estimate correct:", one_8k == 2.5)
print("64-request estimate correct:", batch_64 == 160.0)
assert kv_cache_gib(1, 4_096, 32, 8, 128) == 0.5
assert kv_cache_gib(2, 8_192, 80, 8, 128) == 2 * one_8k
try:
    kv_cache_gib(1, -1, 80, 8, 128)
except ValueError:
    pass
else:
    raise AssertionError("negative sequence length accepted")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Llama 3 70B, one 8K request: 2.5 GiB
64 active 8K requests: 160 GiB
single-request estimate correct: True
64-request estimate correct: True
```
<!-- leetllm: output:end -->

That 160 GiB figure assumes every request occupies a live 8K payload. A max-context slab reservation is far worse: it reserves memory for tokens that never arrive.

[PagedAttention](/learn/kv-cache-paged-attention-llm-serving) allocates fixed-size blocks (e.g. 16 tokens) as needed and maps logical order through a block table.[^kwon2023] Exclusively owned pages become reusable after their readers finish; shared or cached pages need separate ownership/eviction accounting. Paging avoids maximum-length reservations without shrinking live-token payload. A partial last block wastes at most fifteen slots here, **not** universally less than 4%: a one-token history wastes $15/16$ slots, or $93.75\%$.

<figure>
  <img src="illustrations/_generated/scaling_inference_dark.png" alt="Two allocation snapshots hold the same eleven live blocks: A has two, B five, C three, and D one. Four maximum-length slabs reserve 32 blocks, leaving 21 unused. A separate 15-block paged pool holds the same blocks in interleaved physical order, with four available. Logical A0 and A1 map to nonadjacent physical slots." />
  <figcaption>Both states hold eleven populated blocks. Slabs reserve 21 of 32; the separate paged pool has four free of 15 and maps A's logical order to nonadjacent locations. Paging changes allocation; this example makes no throughput claim.[^kwon2023]</figcaption>
</figure>

```checkpoint
In the KV-cache formula, which terms can the serving stack change without shortening user context?
---
KV-cache quantization reduces the stored bytes per element, with scale metadata and quality trade-offs. Scheduling policy changes batch size. For a fixed checkpoint, KV-head count, layer count, and head dimension are architectural constants; choosing a GQA/MQA model is a model choice.
```

## The throughput, latency, cost triangle

Once bandwidth and KV residency are in view, "maximize tokens per second" is not a complete objective. Start with the product promise: interactive users care about TTFT and p95 ITL, while offline batch jobs care about completion throughput and cost per token.

Larger batches amortize weight reads. They also bring more KV history and arithmetic into each iteration. The roughly 4.8 ms calculation is an ideal **weight serialization floor** under a full-read, peak-bandwidth assumption. Decode duration also depends on per-request KV traffic, arithmetic, cache reuse, launches, and queueing, especially at batch sixteen.

Try an explicit full-read thought experiment: 16 GB of weights plus 0.5 GiB of KV per active 4K history, all read once from HBM per step at peak 3.35 TB/s. Exclude attention FLOPs, writes, launches, cache reuse, and queueing. The assumed byte cost already makes step duration rise with batch size:

<figure>
  <img src="illustrations/_generated/throughput_scaling_dark.png" alt="Three aligned plots use the same batch positions. With 16 decimal GB of weights and 0.536870912 GB of KV per 4K request, bytes per step rise from 16.54 to 50.36 GB as batch grows from 1 to 64. At assumed 3.35 TB/s those reads give 4.94 to 15.03 ms serialization floors and 202.6 to 4257.4 aggregate tokens per second. Linear intensity is 1.0, 6.3, 15.4, and 20.3 FLOPs per byte. These are assumed floors, not measured latency." />
  <figcaption>The same byte total sets each serialization floor, aggregate rate, and linear intensity. The example excludes attention FLOPs and writes, launches, cache reuse, and queueing; measure the workload before forecasting TTFT or ITL.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="kv-traffic-changes-batch-scaling.py"
import numpy as np

weight_bytes = 16_000_000_000.0
kv_per_request = float(2 * 4096 * 32 * 8 * 128 * 2)
peak_bytes_per_second = 3.35e12
linear_flops_per_token = 2 * 8_000_000_000.0

batches = np.array([1, 8, 32, 64], dtype=np.float64)
bytes_read = weight_bytes + batches * kv_per_request
seconds = bytes_read / peak_bytes_per_second
intensities = batches * linear_flops_per_token / bytes_read

for batch, sec, intensity in zip(batches.astype(int), seconds, intensities):
    print(f"B={batch}: {sec * 1000:.2f} ms, {batch / sec:.1f} tokens/s, {intensity:.1f} linear FLOPs/byte")
print("Assumed full weight+KV reads at peak bandwidth; ideal serialization floor.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
B=1: 4.94 ms, 202.6 tokens/s, 1.0 linear FLOPs/byte
B=8: 6.06 ms, 1320.5 tokens/s, 6.3 linear FLOPs/byte
B=32: 9.90 ms, 3230.9 tokens/s, 15.4 linear FLOPs/byte
B=64: 15.03 ms, 4257.4 tokens/s, 20.3 linear FLOPs/byte
Assumed full weight+KV reads at peak bandwidth; ideal serialization floor.
```
<!-- leetllm: output:end -->

At B=64, the parameter-dependent work has intensity about 20.3 FLOPs/byte in this model, rather than the weight-only estimate of 64. Actual attention adds FLOPs, and actual layouts/cache reuse change traffic. Neither formula is a substitute for profiling. The useful question is which bytes and operations your estimate omitted.

In a live endpoint, inspect three additional pressures:

- KV reads and arithmetic can increase iteration duration as membership and history grow.
- Mixed prefills, transfers, and client buffering can change token gaps.
- Offered arrivals beyond sustainable service capacity build queues unless work is rejected or expired. KV exhaustion may cause waiting or preemption, depending on policy.

| Objective | Typical lever | Trade-off |
|---|---|---|
| **Throughput** (tokens/s across replica) | Amortize reads with effective batches | More resident history/work can increase per-step latency |
| **Lower latency** (TTFT, p95 ITL) | Bound work, queue wait, and prompt interference | May leave capacity unused; measure the arrival mix |
| **Lower cost per useful token** | Sustain quality/<span data-glossary="slo">SLO</span>-qualified output per billed interval | Include idle time, retries, other workers, and fixed costs |

The **GPU-only** cost component is hourly GPU spend divided by sustained output. It excludes CPU/network/storage and other service costs. Use useful, quality-qualified output if that is the product's objective:

$$
\text{cost per token} = \frac{\text{GPU \$ per hour}}{\text{sustained tokens per second} \times 3600}
$$

Treat **\$3.00/hour** as a worked arithmetic rate, not a cloud quote. Suppose a replica sustains 2,500 output tokens/s across active requests over the billed interval, including prompt processing and idle periods:

- Tokens per hour = $2{,}500\times3{,}600=9{,}000{,}000$
- Cost per million tokens = $\frac{3.00}{9{,}000{,}000}\times1{,}000{,}000\approx0.33$ dollars (**\$0.33**)

At 250 output tokens/s, it rises to **\$3.33**. Latency constraints can justify that gap, but throughput alone doesn't identify the cause: low demand or an inefficient runtime can also produce it.

<!-- leetllm: test, id=cost-example, output=show -->
```python title="cost-per-million-tokens.py"
from math import isfinite

def cost_per_million(hourly_cost: float, sustained_tps: int) -> float:
    if not isfinite(hourly_cost) or hourly_cost < 0 or sustained_tps <= 0:
        raise ValueError("cost must be finite/nonnegative; throughput a positive integer")
    cost = hourly_cost / (sustained_tps * 3600) * 1_000_000
    if not isfinite(cost):
        raise ValueError("reported cost overflowed")
    return cost

well_batched = cost_per_million(3.00, 2_500)
starved = cost_per_million(3.00, 250)

print(f"2,500 tokens/s: ${well_batched:.2f} per million tokens")
print(f"250 tokens/s: ${starved:.2f} per million tokens")
print(f"cost multiplier: {starved / well_batched:.0f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2,500 tokens/s: $0.33 per million tokens
250 tokens/s: $3.33 per million tokens
cost multiplier: 10x
```
<!-- leetllm: output:end -->

A missing price encoded as NaN must not become a reported cost. The helper rejects nonfinite financial inputs instead of passing them into a dashboard:

<!-- leetllm: test, continue=cost-example, output=show -->
```python title="missing-price-is-not-a-cost.py"
for malformed_price in (float("nan"), float("inf")):
    try:
        cost_per_million(malformed_price, 250)
    except ValueError:
        pass
    else:
        raise AssertionError("nonfinite price became a reported cost")
print("missing/infinite prices rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
missing/infinite prices rejected
```
<!-- leetllm: output:end -->

Optimized kernels or schedulers can improve throughput and latency together. A Pareto frontier contains measured configurations where improving one objective requires worsening another, under the same workload and evaluation rules. There is no universal B=32–64 sweet spot. Find feasible configurations under your latency and quality targets, then compare their cost.

| Operating point | Batch pressure | Cost per token | Latency profile | Workload fit |
|---|---|---|---|---|
| Latency-first | Limit mixed-step work and waiting | Can be higher if fewer tokens amortize spend | Must meet measured TTFT/ITL targets | Chat, autocomplete |
| Balanced | Fit batch limits to the measured workload | Compare feasible cost points | Check tails by request class | Assistant endpoints |
| Throughput-first | Keep sustained useful work available | Can be lower with good amortization | Accept the workload's completion targets | Offline batch, evaluations |

> **Production tip:** Watch KV occupancy, prefill backlog, queue age, and HBM bandwidth together. High KV occupancy plus preemptions suggests a residency limit. Low KV occupancy and idle compute may mean low demand, a CPU bottleneck, or bandwidth-bound decode; they don't by themselves prove that a larger batch is available.

```checkpoint
Two teams serve the same 8B model on the same GPU SKU but report a 5x gap in cost per million tokens. The interactive team is more expensive. Why isn't that automatically a misconfiguration?
---
Interactive serving caps batch size to protect TTFT and ITL, so each GPU-hour spreads over fewer tokens. The batch team pushes until throughput saturates. Both can be correct operating points for their SLOs.
```

## Batching raises arithmetic intensity

The previous chapter treated <span data-glossary="continuous-batching">continuous batching</span> as slot reuse: when request A finishes, D can enter at the next decode iteration instead of waiting for C's long answer.[^yu2022] Slot reuse is only half the story. One decode step still streams the weight tensor roughly once for the whole batch. More active tokens on that step means more useful FLOPs per byte, which is how serving climbs the roofline without changing the model.

Static batching fights that climb. If three assistant requests need 2, 2, and 5 remaining tokens, a request-level batch of size 3 spends later steps on padding or idle slots. Iteration-level scheduling keeps the weight read attached to live work.

Notice that finished slots start new work sooner under iteration-level scheduling. Both policies receive the same five requests with remaining lengths `[2, 2, 5, 3, 1]` and three slots. This sketch counts decode iterations as idealized full-weight reads, not milliseconds. Prompts are assumed already processed; there are no prefill costs, KV limits, arrivals, or kernel timing.

<!-- leetllm: test, output=show -->
```python title="batch-amortizes-weight-reads.py"
from collections import deque

lengths = [2, 2, 5, 3, 1]
static_steps = max(lengths[:3]) + max(lengths[3:])
static_tokens = sum(lengths)

queue = deque([2, 2, 5, 3, 1])
active: list[int] = []
max_batch = 3
weight_reads = 0
emitted = 0

while queue or active:
    while queue and len(active) < max_batch:
        active.append(queue.popleft())
    if not active:
        break
    weight_reads += 1
    nxt: list[int] = []
    for remaining in active:
        remaining -= 1
        emitted += 1
        if remaining > 0:
            nxt.append(remaining)
    active = nxt

print(f"static batch: {static_tokens} tokens in {static_steps} weight reads")
print(f"continuous batch: {emitted} tokens in {weight_reads} weight reads")
print(f"tokens per weight read (static): {static_tokens / static_steps:.2f}")
print(f"tokens per weight read (continuous): {emitted / weight_reads:.2f}")
assert emitted == static_tokens == 13
assert (static_steps, weight_reads) == (8, 5)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
static batch: 13 tokens in 8 weight reads
continuous batch: 13 tokens in 5 weight reads
tokens per weight read (static): 1.62
tokens per weight read (continuous): 2.60
```
<!-- leetllm: output:end -->

Both policies emit 13 tokens. <span data-glossary="static-batching">Static batching</span> takes five iterations for the first group, then three for the second. Continuous batching starts the last two requests after iteration two and finishes everything in five iterations. The schedule reduces idealized weight reads from eight to five. Measure step duration across changing batch membership and context length before estimating throughput. Scheduling past the cache budget can trigger eviction or preemption.

```checkpoint
Why does batching help decode even though every request still needs its own next token?
---
The model weights can be read once for a larger set of active tokens, so that memory movement is amortized across requests. Batching doesn't remove the sequential dependency inside each request. It raises useful work per weight read until KV memory or latency SLOs say stop.
```

## Sharing, chunking, and phase isolation

Three more levers change the same budget without training a new model. Each targets a different source of pressure: repeated prompt work, prompt interference, or movement between phase-specific workers.

### Reuse identical prefixes

Many assistant requests start from the same system prompt. [Prefix caching](/learn/prefix-caching-prompt-caching) is the lookup that finds reuse across independent requests.

Copy-on-write protects shared state: if two continuations share a partially filled block, a writer first clones that block before appending to it.[^kwon2023] Existing prefix tokens aren't edited. A full shared block stays immutable, and new tokens go into private tail blocks. Independent prefix caches often reuse only full blocks, so they do not need to clone a partial block on every hit.

For Llama 3 8B, an identical 4K prefix has a 0.5 GiB KV payload stored once if sharing is supported. Each later session still needs metadata, private continuation KV, and decode attention over that prefix. Reuse requires identical effective model state, token IDs and positions, plus an appropriate tenant-isolation policy. It saves prefix computation and duplicate storage, not all subsequent attention work.

<figure>
  <img src="illustrations/_generated/copy_on_write_dark.png" alt="Three states show copy-on-write for A and B. Both first map to partial block 7 containing p, q, r and an empty slot, with reference count two. B clones block 7 into block 12; each private block then has one reference. A appends a to block 7 and B appends b to block 12, preserving the shared prefix values." />
  <figcaption>Clone the partially filled physical page before either private write. A shared partial block still needs isolation when both next tokens match; full shared prefix blocks remain immutable, and prefix lookup is a separate operation.</figcaption>
</figure>

### Bound prompt interference

A 10K RAG prompt on the same worker as live streams can increase token gaps. SARATHI studies combining chunked prefills with decode work.[^agrawal2023] Checked October 10, 2026: <span data-glossary="vllm">vLLM</span> V1 enables chunked prefill when possible, prioritizes pending decode work, then spends remaining `max_num_batched_tokens` budget on prompt chunks.[^vllm2026optimization]

Chunking doesn't add HBM or guarantee smoother delivery. Smaller mixed iterations can reduce interference, but extra chunk transitions and context work can increase prefill cost. Remeasure TTFT and ITL together; details live in the [scheduling chapter](/learn/continuous-batching-request-scheduling).

### Separate phases when transfer is worth paying

Splitwise and DistServe move prefill and decode onto separate pools when avoided interference or better resource allocation pays for KV transfer.[^patel2023][^zhong2024] This changes worker placement, not payload size.

For a Llama 3 70B 8K request, payload is 2.5 GiB. At an assumed effective one-way rate of 200 GiB/s, serializing the whole payload takes at least 12.5 ms before protocol and scheduling. This isn't a named interconnect specification. Overlap, sharding, contention, and already-cached blocks change the transfer's critical-path cost. In a simple non-overlapped comparison, the split must save more time than transfer plus coordination adds.

<!-- leetllm: test, output=show -->
```python title="kv-handoff-lower-bound.py"
kv_cache_gib = 2.5  # Llama 3 70B, one 8K request
interconnect_gib_s = 200  # binary GiB/s

ideal_transfer_ms = kv_cache_gib / interconnect_gib_s * 1000
mixed_ms = (kv_cache_gib * 1024**3) / (200 * 1_000_000_000) * 1000

print(f"KV state to transfer: {kv_cache_gib:.1f} GiB")
print(f"ideal one-way floor at {interconnect_gib_s} GiB/s: {ideal_transfer_ms:.1f} ms")
print(f"mixed GiB / decimal-GB/s floor (for comparison): {mixed_ms:.1f} ms")
print("Queueing saved must exceed transfer plus protocol and scheduling overhead.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KV state to transfer: 2.5 GiB
ideal one-way floor at 200 GiB/s: 12.5 ms
mixed GiB / decimal-GB/s floor (for comparison): 13.4 ms
Queueing saved must exceed transfer plus protocol and scheduling overhead.
```
<!-- leetllm: output:end -->

Bandwidth sets how hard you can push the batch. KV residency sets how many requests that batch can contain. The operating point is where those two ceilings meet the product's latency SLO.

```checkpoint
When can prefill-decode disaggregation make latency worse?
---
When KV-cache transfer, coordination, or extra scheduling cost more than the head-of-line blocking they remove. Short prompts, light traffic, or a slow interconnect often favor a colocated worker.
```

## Speculative decoding buys tokens per weight read

Batching amortizes one target-model weight read across concurrent requests. <span data-glossary="speculative-decoding">Speculative decoding</span> applies the same insight within a single stream: one target weight read can verify several sequential future tokens.[^leviathan2023]

In the classic algorithm, a draft model proposes $\gamma$ candidate tokens. Target verification computes $\gamma+1$ conditional distributions: one for each proposal and one for a possible concluding token.[^leviathan2023] A causal forward pass can evaluate the drafted prefixes together; cached logits and runtime layout determine how many new input positions it schedules. Verification cost depends on attention/cache work and backend efficiency, so measure it against ordinary one-token decode.

Let $c=T_{\text{draft}}/T_{\text{target}}$ be draft-step cost relative to ordinary target decode. Measure it; parameter-count ratios don't determine it. Let $v$ be verification plus remaining cycle overhead in the same units. For serial draft generation followed by verification:

$$
T_{\text{cycle}} = (\gamma c + v) T_{\text{target}}
$$

Acceptance decisions follow proposal order, using scores already computed by verification. For a proposal actually sampled from $q$, use target distribution $p$ conditioned on the same prefix. Both distributions include the intended sampling transformations, such as temperature or top-p.[^leviathan2023] Accept with probability:

$$
\alpha_i = \min\left(1, \frac{p(x_i)}{q(x_i)}\right)
$$

On the first rejection at position $i$, the remaining draft tokens are discarded, and the engine immediately samples a replacement token from the normalized positive residual distribution:

$$
p_{\text{residual}}(x) = \frac{\max(0, p(x) - q(x))}{\sum_{x'} \max(0, p(x') - q(x'))}
$$

If all proposals survive, sample an extra token from the target distribution conditioned on the accepted prefix. The ideal algorithm emits 1 through $\gamma+1$ tokens before stopping/truncation and preserves the intended target distribution, not an identical seeded sequence. Real finite-precision implementations require their own numerical and sampling checks.

The paper's geometric expectation assumes acceptance rates are independent and identically distributed, with mean $\alpha$.[^leviathan2023] Under that assumption, the probability that the first $i$ proposals all survive is $\alpha^i$. A fleet-wide mean alone does not guarantee those survival probabilities. Add the concluding correction/bonus sample:

$$
\mathbb{E}[N] = 1 + \sum_{i=1}^\gamma \alpha^i = \sum_{i=0}^\gamma \alpha^i = \frac{1 - \alpha^{\gamma+1}}{1 - \alpha}
$$

For $\alpha=1$, the limit is $\gamma+1$. Compare the resulting expected rate with ordinary target decode, assuming long enough generations and the costs above:

$$
\text{Speedup} = \frac{\mathbb{E}[N]}{\gamma c + v}
$$

For an **assumed** $v=1$, $\gamma=4$, $c=0.10$, and iid acceptance mean $\alpha=0.80$:

$$
\mathbb{E}[N] = \frac{1 - 0.8^5}{1 - 0.8} = \frac{0.67232}{0.2} = 3.36\text{ tokens}
$$

$$
\text{Speedup} = \frac{3.3616}{4 \times 0.10 + 1} = \frac{3.3616}{1.40} \approx 2.40\times
$$

The expectation predicts 3.36 tokens per cycle costing 1.40 baseline-step units, or a $2.40\times$ rate ratio. Measure cycles on the target engine to estimate the observed speedup.

Now consider the failure mode: if the draft model struggles on code or dense reasoning, and acceptance drops to $\alpha = 0.30$ while draft cost is $c = 0.15$:

$$
\mathbb{E}[N] = \frac{1 - 0.3^5}{1 - 0.3} = \frac{0.99757}{0.7} \approx 1.425\text{ tokens}
$$

$$
\text{Speedup} = \frac{1.425}{4 \times 0.15 + 1} = \frac{1.425}{1.60} \approx 0.89\times
$$

The modeled token rate is about 11% lower; **time per token is about 12% higher**, since it scales as the reciprocal. The break-even condition for this serial cost model is $\mathbb{E}[N]>\gamma c+v$. Acceptance, span length, and verification overhead must be measured together.

<figure>
  <img src="illustrations/_generated/speculative_decode_dark.png" alt="One gamma-four speculative cycle drafts x1 through x4. A target pass scores p1 through p5 together, while acceptance decisions inspect x1, x2, x3, then reject x4. The residual sample x4-prime replaces the rejection, so this cycle emits four tokens. Separately, iid alpha 0.8 with draft cost 0.1 and verify cost 1T gives expected 3.3616 tokens per 1.4T cycle and a 2.40x rate ratio; other assumed costs give 1.40x or 0.89x." />
  <figcaption>The upper trace follows one gamma-four draft-and-verify cycle. The lower rows model an iid acceptance assumption and separate draft/verify costs; the article's seeded gamma-two CPU scenario remains a different example. Measure the target engine.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, id=spec-example, output=show -->
```python title="speculative-accept-reject.py"
import random
import numpy as np


def sample_categorical(dist: np.ndarray, rng: random.Random) -> int:
    masses = dist / dist.sum()
    return int(np.searchsorted(np.cumsum(masses), rng.random(), side="right"))


def residual_sample(p: np.ndarray, q: np.ndarray, rng: random.Random) -> int:
    leftover = np.maximum(p - q, 0.0)
    if leftover.sum() <= 0.0:
        raise ValueError("rejection requires positive residual mass")
    return sample_categorical(leftover, rng)


def speculative_step(
    draft_tokens: list[int],
    draft_dists: np.ndarray,
    target_dists: np.ndarray,
    rng: random.Random,
) -> list[int]:
    accepted: list[int] = []
    for i, token in enumerate(draft_tokens):
        p, q = target_dists[i], draft_dists[i]
        if q[token] <= 0.0:
            raise ValueError("draft token must have positive proposal probability")
        if rng.random() < min(1.0, float(p[token] / q[token])):
            accepted.append(token)
            continue
        return accepted + [residual_sample(p, q, rng)]
    return accepted + [sample_categorical(target_dists[len(draft_tokens)], rng)]


def speculative_speedup(gamma: int, alpha: float, c: float, verify_cost: float = 1.0) -> float:
    expected_tokens = float(np.sum(np.power(alpha, np.arange(gamma + 1, dtype=np.float64))))
    return expected_tokens / (gamma * c + verify_cost)


rng = random.Random(0)
draft_tokens = [0, 1]
draft_dists = np.array([[0.8, 0.2], [0.3, 0.7]], dtype=np.float64)
target_dists = np.array([[0.7, 0.3], [0.2, 0.8], [0.4, 0.6]], dtype=np.float64)
emitted = speculative_step(draft_tokens, draft_dists, target_dists, rng)

print(f"emitted tokens: {emitted}")
assert emitted == [0, 1, 1]
rejected = speculative_step(
    [0],
    np.array([[1.0, 0.0]]),
    np.array([[0.0, 1.0], [0.5, 0.5]]),
    random.Random(1),
)
assert rejected == [1]
print(f"forced rejection emits: {rejected}")

speedup_fast = speculative_speedup(4, 0.8, 0.1)
speedup_slow = speculative_speedup(4, 0.3, 0.15)
print(f"speedup (gamma=4, alpha=0.8, c=0.1): {speedup_fast:.2f}x")
print(f"speedup (gamma=4, alpha=0.3, c=0.15): {speedup_slow:.2f}x")
assert np.isclose(speedup_fast, 2.401, atol=0.01)
assert speedup_slow < 1.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
emitted tokens: [0, 1, 1]
forced rejection emits: [1]
speedup (gamma=4, alpha=0.8, c=0.1): 2.40x
speedup (gamma=4, alpha=0.3, c=0.15): 0.89x
```
<!-- leetllm: output:end -->

Keep verification cost explicit. Measure how much the same acceptance profile changes if verification takes twice the ordinary target step:

<!-- leetllm: test, continue=spec-example, output=show -->
```python title="verification-cost-changes-the-win.py"
print(f"verification cost 1T: {speculative_speedup(4, 0.8, 0.1):.2f}x")
print(f"verification cost 2T: {speculative_speedup(4, 0.8, 0.1, verify_cost=2.0):.2f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
verification cost 1T: 2.40x
verification cost 2T: 1.40x
```
<!-- leetllm: output:end -->

With this seed both drafts survive, so the first call emits two accepted tokens plus one extra. The second call rejects a proposal with zero target probability and emits its residual correction. Boundary checks aren't a proof of distributional exactness, but they prevent the acceptance-only demo from hiding a broken rejection branch. Follow-on methods such as EAGLE use a lightweight feature-level drafting network informed by target hidden states.[^li2024]

Serving question stays the same: did accepted tokens repay the extra draft and verification work?

```checkpoint
Why can speculative decoding be exact yet still slower than normal decoding?
---
The accept/reject rule can preserve the target distribution, but runtime depends on acceptance and overhead. If the draft is wrong too often, or verification is expensive, saved target passes don't cover the extra work.
```

## Lower precision cuts the bytes in that read

If decode repeatedly streams weights and past KV states, reducing precision is the most direct hardware bandwidth lever. The key is distinguishing which memory stream you are compressing: static model weights or dynamic KV cache buffers.

Many production stacks begin with BF16 or FP16, then adopt FP8 execution when modern accelerators (like NVIDIA Hopper or Ada Lovelace) provide native FP8 Tensor Cores, or use weight-only INT4/INT8 formats (such as AWQ or GPTQ) when the primary goal is shrinking decode memory traffic.[^micikevicius2022][^gptq2023]

### Weight quantization: shifting decode toward the compute roof

When weight reads dominate, moving an ideal 8B payload from FP16 (2 bytes/parameter) to an 8-bit format (1 byte) or packed INT4 (0.5 byte) reduces it from 16 GB to 8 GB or 4 GB. Scales, padding, unquantized tensors, and kernel layouts add to those payloads:

- **Serialization:** $4\text{ GB}/(3{,}350\text{ GB/s})$ is about 1.2 ms versus 4.8 ms for 16 GB. These full-read floors assume peak bandwidth; benchmark decode timings and speedup on the target workload.
- **Intensity:** The weight-only formula increases fourfold at the same batch. KV traffic, dequantization, and the compatible compute format change the complete roofline. Compare the $B=75$ estimate with the target GPU's ridge point, then profile whether Tensor Cores execute the kernel.
- **Capacity:** Saving 12 decimal GB releases about 11.18 GiB. If all of it can join the unchanged KV pool, the example's 4K payload capacity rises from 103 to **125**, adding 22 streams before scales, output growth, or latency limits. That capacity gain is about 22 half-GiB histories.

Keep the batch and histories fixed to isolate traffic. In the earlier full-read model, 64 requests with 4K histories read about 34.36 decimal GB of KV per iteration, already more than the 16 GB weights, so quartering the weights doesn't quarter the combined read; check how the ratio shifts when histories grow to 16K:

<!-- leetllm: test, output=show -->
```python title="weight-compression-with-kv-traffic.py"
batch = 64
fp16_weights, int4_weights = 16_000_000_000, 4_000_000_000
kv_bytes_per_token = 2 * 32 * 8 * 128 * 2
for history in (4096, 16384):
    kv_read = batch * history * kv_bytes_per_token
    before = fp16_weights + kv_read
    after = int4_weights + kv_read
    # Same achieved bandwidth, full KV reads, unchanged batch and cache width.
    traffic_rate_ratio = before / after
    assert 1 < traffic_rate_ratio < 4
    print(f"history={history}: KV read={kv_read / 1e9:.2f} GB; rate ratio={traffic_rate_ratio:.2f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
history=4096: KV read=34.36 GB; rate ratio=1.31x
history=16384: KV read=137.44 GB; rate ratio=1.08x
```
<!-- leetllm: output:end -->

This yields about 1.31× at 4K and 1.08× at 16K for the assumed bandwidth-only rate, before dequantization or any other overhead. The 64-stream 16K case needs 128 GiB of raw KV, so it exceeds our earlier single-GPU pool; it is a traffic extrapolation for sufficient storage, not a feasible admission setting on that replica. Profile the actual read mix before choosing weight compression, KV compression, or a smaller retained history. Recompute the model if weight savings instead fund a larger batch.

<figure>
  <img src="illustrations/_generated/weight_kv_read_mix_dark.png" alt="Four stacked byte-read rows share a 0-to-160 decimal-GB scale for batch 64. At 4K, KV stays 34.36 GB while weight reads fall from 16 to 4 GB, changing the assumed total from 50.36 to 38.36 GB and the rate ratio to 1.31x. At 16K, KV stays 137.44 GB and totals fall from 153.44 to 141.44 GB, a 1.08x ratio. The 16K traffic case needs 128 GiB of KV, above the 51.6 GiB pool." />
  <figcaption>KV stays fixed within each pair as weight reads fall from 16 to 4 decimal GB. At 16K the 64-request KV payload is 128 GiB, above the 51.6 GiB pool, so that row is a traffic extrapolation with sufficient storage, not a feasible single-GPU batch.</figcaption>
</figure>

### KV cache quantization: doubling concurrency and slashing attention bandwidth

KV precision is a separate choice from weight precision, though an execution mode can also quantize queries or other operations. Current vLLM FP8 documentation describes backend-specific schemes, scale calibration, and leaving selected layers unquantized.[^vllm2026kvquant] Formats such as INT8/INT4 require their own supported model/backend path. Compare two ideal payload effects:

1. **Capacity:** One byte rather than two halves raw 8B KV from 128 KiB to 64 KiB/token. Flooring prevents exact stream-count doubling: a fixed 51.6 GiB pool's 8K payload capacity goes from 51 to 103, before scale/layout overhead. At 128K it goes from 3 to 6. Feasible and SLO-qualified capacity may differ.
2. **Traffic:** If each active request's full retained K/V payload is read once from HBM, the model's byte count is:

   $$
   \text{Attention\_KV\_Bytes} = 2 \times B \times L \times N_{\text{layers}} \times N_{\text{kv\_heads}} \times d_{\text{head}} \times P_{\text{bytes\_kv}}
   $$

   Whether it exceeds weight traffic depends on batch, architecture, and history. Halving element width halves this raw term; device bandwidth remains fixed, and measured ITL also reflects cache reuse, repeated loads, scales, conversion, and other work. Evaluate output quality too.

<figure>
  <img src="illustrations/_generated/quantization_bandwidth_dark.png" alt="The top tensor stream packs the same 8B parameters into 2B-parameter groups: FP16 occupies 16 decimal GB, INT8 8 GB, and INT4 4 GB before scales or padding. The lower stream holds 8K KV requests in the same 51.6 GiB pool: 16-bit elements fit 51, 8-bit fit 103, and 4-bit fit 206. Cells group eight requests except each final partial group; exact request tails are shown in labels." />
  <figcaption>The top keeps the weight count fixed while packing each 2B-parameter group at a different width. The bottom fixes weights and pool size while changing KV width. These raw payload floors exclude scales, layouts, backend support, quality, and runtime overhead.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="weight-bytes-by-precision.py"
import math

parameters = 8_000_000_000
bytes_per_weight = {"FP16": 2.0, "INT8": 1.0, "INT4": 0.5}

for precision, width in bytes_per_weight.items():
    traffic_gb = parameters * width / 1_000_000_000
    print(f"{precision}: {traffic_gb:.1f} GB of weights per full read")

print("INT4 weight traffic is 0.25x FP16 before kernel overhead.")
pool_gib = (80_000_000_000 - 16_000_000_000) / 1024**3 - 8
freed_gib = 12_000_000_000 / 1024**3
old_capacity = math.floor(pool_gib / 0.5)
new_capacity = math.floor((pool_gib + freed_gib) / 0.5)
print(f"12 decimal GB released: {freed_gib:.2f} GiB")
print(f"4K raw KV capacity: {old_capacity} -> {new_capacity} (+{new_capacity - old_capacity})")
assert (old_capacity, new_capacity) == (103, 125)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP16: 16.0 GB of weights per full read
INT8: 8.0 GB of weights per full read
INT4: 4.0 GB of weights per full read
INT4 weight traffic is 0.25x FP16 before kernel overhead.
12 decimal GB released: 11.18 GiB
4K raw KV capacity: 103 -> 125 (+22)
```
<!-- leetllm: output:end -->

> **Common mistake:** 4-bit weights aren't primarily an artifact to save disk space. The real serving win is fewer bytes transferred across the memory bus during each decode step. Whether that translates to lower user-facing latency still depends on kernel dequantization overhead and whether model accuracy passes your evaluations.

```checkpoint
Why does weight-only INT4 often help decode latency more directly than prefill latency?
---
Decode repeatedly streams model weights for small per-token work, so fewer bytes per weight cut bandwidth pressure. Prefill uses larger matrix operations and can be compute-heavy, so weight compression isn't always the dominant lever there.
```

## When one request no longer fits

The 8B replica was a fit-and-batch problem. To stress-test the formula, extrapolate the 70B architecture to 1,000,000 cached tokens: $2\times1{,}000{,}000\times80\times8\times128\times2$ bytes, about **305 GiB** of KV payload. This extrapolation exceeds the documented context length: the original Llama 3 release supports 8K and Llama 3.1 extends it to 128K.[^meta2024llama3Card][^dubey2024] Sharding memory leaves the checkpoint's trained positional behavior unchanged.

One request has crossed the single-device residency limit; plan on a shorter context or a sharded serving layout.

<span data-glossary="context-parallelism">Context parallelism (CP)</span> splits the sequence dimension across devices, not the layer stack or the batch. Each GPU holds a shard of the prompt and its KV.

Attention still needs information from other shards. Ring Attention is one approach for long-sequence processing: while a device computes blockwise attention on local queries, K/V blocks rotate around the ring.[^liu2024ring] Decode implementations can instead combine partial attention results across cache shards. The communication pattern depends on phase and implementation; don't assume every system circulates all KV on each generated token.

That isn't <span data-glossary="tensor-parallelism">tensor parallelism</span>, which shards work and weights inside a layer, or pipeline parallelism, which shards layers. These techniques can be combined, and tensor parallelism may also shard KV heads.

Llama 3 70B in FP16 is about 140 GB of parameters, so it can't reside on one 80 GB GPU even at batch 1.[^dubey2024] The next chapter, [model parallelism](/learn/model-parallelism-for-llm-inference), makes that split its main subject.

<!-- leetllm: test, output=show -->
```python title="context-parallel-kv-shards.py"
def kv_gib(sequence_tokens: int) -> float:
    total_bytes = 2 * sequence_tokens * 80 * 8 * 128 * 2
    return total_bytes / 1024**3

total_kv = kv_gib(1_000_000)
devices = 4
print(f"1M-token KV with 70B dimensions: {total_kv:.1f} GiB")
print(f"evenly sharded over {devices} devices: {total_kv / devices:.1f} GiB/device")
print("KV only: weights, communication buffers, and runtime need additional memory.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1M-token KV with 70B dimensions: 305.2 GiB
evenly sharded over 4 devices: 76.3 GiB/device
KV only: weights, communication buffers, and runtime need additional memory.
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/context_parallel_shards_dark.png" alt="A one-million-token request with Llama 3 70B dimensions requires 305.2 GiB of raw KV, or 76.3 GiB on each of four equal sequence shards; each device also needs unquantified weights and buffers. During one prefill Ring Attention approach, K/V blocks rotate between sequence shards. During decode, shard-local partial attention states combine into one result; the figure does not imply every decode circulates all KV. The lower axis diagrams distinguish context parallelism across tokens, tensor parallelism within a layer, and pipeline parallelism across layer depth. Sharding does not extend supported context." />
  <figcaption>The 1M-token example extrapolates 70B FP16 geometry beyond supported context. Ring Attention is one prefill communication pattern; decode can combine shard-local partial results. Neither layout removes weights, buffers, communication, or the checkpoint context limit.</figcaption>
</figure>

```checkpoint
What bottleneck does context parallelism target, and what bottleneck can it introduce?
---
It targets per-request context and KV that no longer fit on one GPU. It can introduce communication overhead because devices must exchange partial attention state across sequence shards.
```

## When the budget lies

These traces show up when formulas look fine on paper but users or profiles disagree. Start with the symptom, name the ceiling it points to, then test one targeted fix.

### "I bought a higher-FLOP GPU and decode barely moved"

Peak compute went up, but tokens per second didn't. That observation alone doesn't identify the bottleneck. Profile HBM, kernels, transfers, and host scheduling. If full reads saturate bandwidth while <span data-glossary="tensor">tensor</span> compute has headroom, test amortization or fewer bytes before expecting extra peak FLOPs to help.

### "Throughput is up and chat feels worse"

Aggregate TPS rose after you lifted max batch, but users report sluggish streams. Inspect iteration duration, queue wait, and delivery by request class; mean TPOT can hide gaps. Gate on the product's TTFT and ITL targets, not replica tokens/s alone. Separate traffic classes if their interference is the measured problem.

### "Speculative decoding added latency"

A draft model is in the path, and p50 decode got worse. Acceptance may be too low, or draft-plus-verify overhead may exceed the saved target passes. Measure accepted tokens per draft span before <span data-glossary="rollout">rollout</span>. If most proposals die early, keep ordinary decode.

### "HBM climbs even though every session shares a system prompt"

KV usage looks close to $B\times L_{\text{prompt}}$ despite repeated text. Copy-on-write isolates writes **after** sharing begins; it doesn't discover matching prefixes. Cross-request prefix caching needs a compatible available entry and trusted sharing scope. Branching inside one request can share directly. Inspect allocated pool bytes separately from live/cached block ownership, then confirm actual reuse and reference counts.

```checkpoint
A dashboard shows high TTFT, a rising prefill backlog, stable TPOT, and moderate KV memory. Which subsystem should you inspect first?
---
Inspect prefill scheduling and queue limits first. Stable TPOT suggests decode isn't currently degrading, while high TTFT plus a prefill backlog points to prompt work or queueing before the first token.
```

## Size the 8B replica

Put the pieces together with an explicit accounting budget. This simplified partition includes reserved/unavailable space in the last term; real engines have more detailed categories:

$$
M_{\text{total}} = M_{\text{weights}} + M_{\text{KV\_pool}} + M_{\text{activations}} + M_{\text{slack}}
$$

For this worked layout, account for:

1. **Weights:** Approximate the 8B-class FP16 payload as $16.0\times10^9$ bytes, or 14.90 GiB. The exact checkpoint, packing, adapters, and execution path determine its real allocation.
2. **KV pool:** Physical storage from which requests use blocks. A preallocated pool can keep the same device allocation while live block ownership grows or shrinks.
3. **Activations/workspace:** Intermediate tensors, kernel scratch, and captured-graph buffers depend on model, batch/chunk shapes, dtype, and backend. FlashAttention avoids the full score/probability intermediates; it doesn't remove all workspace. Measure the peak rather than assume 2–4 GiB universally.
4. **Other allocations/reserve:** Runtime allocations, allocator slack, other GPU users, and intentionally unused headroom. Host scheduling queues aren't automatically VRAM allocations. vLLM's `gpu_memory_utilization` limits the model executor's fraction, rather than specifying a fixed activation/slack split; explicit `kv_cache_memory_bytes` overrides automatic pool sizing.[^vllm2026cacheConfig]

GB means $10^9$ bytes; GiB means $2^{30}$ bytes. **Assume exactly 80,000,000,000 budget bytes** here, or 74.51 GiB. Don't infer the runtime's available byte count from a nominal “80 GB” product label; inspect device-reported total/free memory and engine allocations. Subtract the approximate weights and an **assumed** 8 GiB combined workspace/other reserve:

$$
M_{\text{KV\_pool}} = 74.51 - 14.90 - 8.00 = \mathbf{51.60\text{ GiB}}
$$

Now compute single-request payload for a 4,096-token sequence on Llama 3 8B:

$$
\text{KV bytes} = 2\times1\times4096\times32\times8\times128\times2
= 536{,}870{,}912\text{ bytes}
= 0.50\text{ GiB}
$$

The theoretical payload ceiling is:

$$
B_{\text{max}} = \left\lfloor \frac{51.60\text{ GiB}}{0.50\text{ GiB}} \right\rfloor = \mathbf{103\text{ concurrent requests}}
$$

That snapshot counts 4,096 retained positions per request with no future growth. Reserve 512 more positions, giving 4,608 positions or 0.5625 GiB per request, and the growth-budget ceiling drops to:

$$
B_{\text{max\_safe}} = \left\lfloor \frac{51.60\text{ GiB}}{0.5625\text{ GiB}} \right\rfloor = \mathbf{91\text{ concurrent requests}}
$$

Average context lengths aren't admission guarantees: a sudden burst of long prompts can exhaust physical blocks even if the historical average was 4K.

<!-- leetllm: test, output=show -->
```python title="vram-capacity-headroom.py"
import math

kv_bytes = 2 * 1 * 4_096 * 32 * 8 * 128 * 2
kv_per_request_gib = kv_bytes / 1024**3
device_gib = 80_000_000_000 / 1024**3
weight_gib = 16_000_000_000 / 1024**3
runtime_gib = 8
kv_budget_gib = device_gib - weight_gib - runtime_gib
arithmetic_ceiling = math.floor(kv_budget_gib / kv_per_request_gib)
growth_gib = (4_096 + 512) * (2 * 32 * 8 * 128 * 2) / 1024**3
growth_ceiling = math.floor(kv_budget_gib / growth_gib)

print(f"KV per 4K request: {kv_per_request_gib:.2f} GiB")
print(f"KV budget after weights and runtime: {kv_budget_gib:.2f} GiB")
print(f"arithmetic-only batch ceiling: {arithmetic_ceiling}")
print(f"ceiling with 512 output tokens reserved: {growth_ceiling}")
assert arithmetic_ceiling == 103 and growth_ceiling == 91
assert 91 * growth_gib <= kv_budget_gib < 92 * growth_gib
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KV per 4K request: 0.50 GiB
KV budget after weights and runtime: 51.60 GiB
arithmetic-only batch ceiling: 103
ceiling with 512 output tokens reserved: 91
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/replica_budget_admission_dark.png" alt="An assumed 80,000,000,000-byte device budget is 74.5058 GiB. A proportional partition subtracts 14.9012 GiB of 8B FP16 weights and an assumed 8 GiB runtime reserve, leaving a 51.6046 GiB KV pool. On one shared pool scale, 103 current 4K payloads use 51.5 GiB; reserving 512 output tokens leaves room for 91 requests at 0.5625 GiB each. A 92nd requires 51.75 GiB and exceeds the pool by 0.1454 GiB." />
  <figcaption>The total, weight estimate, and 8 GiB reserve are assumptions, not a device measurement. Counts show payload-only ceilings; page rounding, future growth, latency, and workload tails affect safe concurrency.</figcaption>
</figure>

```checkpoint
Why isn't that 103-request snapshot a safe production max concurrency?
---
It counts current payload, not future output growth, page rounding, or workload tails. The runtime reserve is an assumption and latency may fail much earlier. Reserving 512 more tokens already lowers this layout to 91 requests before measuring any SLO.
```

Try a page-aware reservation calculation next. Use 16-token blocks, count each request's prompt plus reserved output, and sum the rounded allocations. For prompts `[4090, 4096, 4100]` with 512 reserved output tokens each, check whether three times the average length gives the exact allocation.

<!-- leetllm: test, output=show -->
```python title="page-aware-admission.py"
BYTES_PER_TOKEN = 2 * 32 * 8 * 128 * 2
BLOCK_TOKENS = 16

def reserved_bytes(prompt_tokens: int, output_tokens: int) -> int:
    if prompt_tokens <= 0 or output_tokens < 0:
        raise ValueError("use integer counts: prompt positive, output reserve nonnegative")
    blocks = (prompt_tokens + output_tokens + BLOCK_TOKENS - 1) // BLOCK_TOKENS
    return blocks * BLOCK_TOKENS * BYTES_PER_TOKEN

prompts = [4090, 4096, 4100]
allocations = [reserved_bytes(prompt, 512) for prompt in prompts]
payload = sum(prompt + 512 for prompt in prompts) * BYTES_PER_TOKEN
reserved = sum(allocations)
assert reserved >= payload
assert reserved - payload < len(prompts) * BLOCK_TOKENS * BYTES_PER_TOKEN
assert reserved_bytes(4096, 512) < reserved_bytes(4097, 512)
print("reserved token slots:", [value // BYTES_PER_TOKEN for value in allocations])
print("unused rounded slots:", (reserved - payload) // BYTES_PER_TOKEN)

def admit(current_bytes: int, new_request_bytes: int, budget_bytes: int) -> bool:
    return current_bytes + new_request_bytes <= budget_bytes

exact_fit = admit(sum(allocations[:2]), allocations[2], reserved)
too_small = admit(sum(allocations[:2]), allocations[2], reserved - 1)
assert exact_fit and not too_small
print("last request fits exact budget:", exact_fit)
print("last request fits one byte less:", too_small)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reserved token slots: [4608, 4608, 4624]
unused rounded slots: 18
last request fits exact budget: True
last request fits one byte less: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/page_aware_admission_dark.png" alt="A zoom into each request’s final 16-token KV block shows prompt plus 512 reserved output positions. A 4,090-token prompt needs 4,602 positions, so 4,608 are allocated and six slots remain unused. A 4,096-token prompt lands exactly on 4,608. A 4,100-token prompt needs 4,612, so 4,624 are allocated and twelve slots remain unused. The three reservations total 13,840 slots with 18 unused; an exact budget equal to their summed bytes fits, while one byte less rejects the third request." />
  <figcaption>The figure magnifies each final 16-token block; earlier blocks are omitted. Rounding is per request, with 18 unused slots total. The exact-fit budget is defined by these three reservations and is separate from the full 51.60 GiB pool.</figcaption>
</figure>

The answer is 4,608, 4,608, and 4,624 slots: 18 unused slots in total. The last prompt crosses a page boundary. This calculation deliberately excludes shared prefixes and cache eviction. It models a conservative reservation for these requests, not a complete allocator. On a serving engine, verify peak allocated memory, preemptions, TTFT, and token-gap percentiles under mixed-length load before turning such a calculation into a scheduler batch limit.

Check whether a replica is waiting on bandwidth or on KV residency. Turn the 80 GB label into a batch ceiling that still has room for the answer to grow.

```mastery-quiz
[
  {
    "question": "A full-attention model has 24 layers and 4 KV heads per layer. At each token position, each head stores a key and a value, both vectors of 64 elements at 2 bytes per element. Each request needs space for 6,000 prompt positions and 1,281 output positions in its own 16-position pages. How many requests fit in a 3 GiB KV pool with no other overhead, and how many bytes does the pool reserve per request?",
    "options": [
      "18 reservations of 178,937,856 bytes each.",
      "17 reservations of 179,306,496 bytes each.",
      "21 reservations of 147,456,000 bytes each.",
      "35 reservations of 89,653,248 bytes each."
    ],
    "answer": "17 reservations of 179,306,496 bytes each.",
    "explanation": "The key and value together take 2 × 24 × 4 × 64 × 2 = 24,576 bytes per position. The 7,281 positions need 456 pages, or 7,296 slots. Each request reserves 179,306,496 bytes, so 17 fit in 3 GiB. The estimate of 18 skips the 15 unused slots in each request's last page. Counting only the prompt gives 21. Counting only the keys gives 35."
  },
  {
    "question": "A single decode step has 8 active requests. It reads 12 decimal GB of weights and 4 decimal GB of total current KV once, at an achieved 500 GB/s. Ignore other work. What serialization time and aggregate output rate follow?",
    "options": [
      "24 ms and 333.3 tokens/s.",
      "32 ms and 31.25 tokens/s.",
      "16 ms and 500 tokens/s.",
      "32 ms and 250 tokens/s."
    ],
    "answer": "32 ms and 250 tokens/s.",
    "explanation": "Add both streams: 16/500 seconds=0.032 seconds. Eight output tokens divided by 0.032 gives 250 tokens/s. 24 ms omits KV; 31.25 treats one step as one aggregate token; 16 ms incorrectly subtracts the KV stream from the weights."
  },
  {
    "question": "Two deployments each cost $4.80 per hour over their complete billed intervals. One sustains 800 useful output tokens/s, the other 400. What are their GPU-only costs per million useful tokens?",
    "options": [
      "$1.67 and $3.33.",
      "$0.60 and $0.30.",
      "$6.00 and $12.00.",
      "$3.33 and $1.67."
    ],
    "answer": "$1.67 and $3.33.",
    "explanation": "Divide hourly spend by sustained tokens/s×3600, then multiply by one million. The results are 1.6667 and 3.3333 dollars. Taking reciprocal costs gives 0.60 and 0.30, which have the wrong units; using 1000 instead of 3600 or omitting time conversion gives a different denominator. These are GPU-only arithmetic costs, not service-wide prices."
  },
  {
    "question": "Four already-prefilled requests have remaining lengths [1, 4, 2, 2] and two slots. A static policy finishes each consecutive pair before starting the next. A continuous policy refills a vacated slot before the next iteration. Each live request emits one token per iteration. How many idealized weight reads do the policies need?",
    "options": [
      "Static 5; continuous 6.",
      "Static 6; continuous 4.",
      "Static 6; continuous 5.",
      "Static 7; continuous 5."
    ],
    "answer": "Static 6; continuous 5.",
    "explanation": "Static takes max(1, 4)+max(2, 2)=6. Continuous memberships are [1, 2], [2, 3], [2, 3], [2, 4], [4], for 5 iterations and the same 9 tokens. It preserves the survivor rather than restarting it; the newly admitted request cannot emit before the next iteration."
  },
  {
    "question": "Requests A and B map to the same partially filled four-slot page 9 containing [u, v, empty, empty], with reference count 2. They will append different private tokens. The shared prefix is already found. Which state transition preserves both histories?",
    "options": [
      "Keep page 9 shared; append each token there and distinguish the two writers using their separate logical lengths.",
      "Copy page 9 to a new page and redirect one request; each writer then owns its page and still attends to u, v.",
      "Copy page 9 to a new page and redirect B; stop both requests from reading u, v after their private appends.",
      "Redirect B to an empty new page and append there; preserve its earlier logical indices without copying u, v."
    ],
    "answer": "Copy page 9 to a new page and redirect one request; each writer then owns its page and still attends to u, v.",
    "explanation": "Clone the shared partial page before a private write, copy its valid prefix and redirect one owner. Logical lengths do not isolate writes in shared storage. Dropping prefix values changes the history; copying all immutable pages after every token adds work and removing their attention changes the computation."
  },
  {
    "question": "In a chunked-prefill scheduler, 4 live decode requests each take one new-position slot from a 10-position mixed-step budget; one prompt still has 20 positions. Separately, a phase split transfers 1.5 GiB at 100 GiB/s, adds 4 ms coordination and avoids 18 ms interference, with no overlap. What first prompt chunk and net latency change follow?",
    "options": [
      "10 prompt positions; 1 ms slower.",
      "6 prompt positions; 3 ms faster.",
      "10 prompt positions; 3 ms faster.",
      "6 prompt positions; 1 ms slower."
    ],
    "answer": "6 prompt positions; 1 ms slower.",
    "explanation": "Decode consumes 4 of 10 scheduled-position slots, leaving 6. Transfer takes 1.5/100 seconds=15 ms; adding 4 and subtracting 18 leaves 1 ms extra latency. The token budget is not a cache-length budget, and comparing only transfer or only coordination omits part of the path."
  },
  {
    "question": "A serial speculative model uses gamma 3, iid acceptance mean 0.5, draft-step cost 0.2 baseline steps and verification-plus-overhead 1.2 steps. Assume long outputs. What expected tokens per cycle and rate ratio follow?",
    "options": [
      "1.875 tokens; about 1.042×.",
      "1.875 tokens; about 1.172×.",
      "1.750 tokens; about 0.972×.",
      "3.000 tokens; about 1.667×."
    ],
    "answer": "1.875 tokens; about 1.042×.",
    "explanation": "Expected tokens are 1+0.5+0.25+0.125=1.875. Cycle cost is 3×0.2+1.2=1.8, so the ratio is 1.875/1.8≈1.042. Using v=1 gives the tempting 1.172; omitting the final survival term gives 1.75; counting every draft as accepted gives 3."
  },
  {
    "question": "For the same prefix, the target model gives probabilities p = [0.50, 0.20, 0.30] and the draft model gives q = [0.20, 0.60, 0.20] for token IDs 0, 1, and 2 in that order. The draft proposes ID 1 and has more proposals pending. Which distribution would supply a replacement if ID 1 were rejected? What should the verifier do with a uniform draw of 0.55?",
    "options": [
      "Use [0.625, 0, 0.375] on rejection. With this draw, accept ID 1 and check the next proposal.",
      "Use [0.625, 0, 0.375] on rejection. With this draw, reject ID 1, discard the tail, and sample a replacement.",
      "Use [0.75, 0, 0.25] on rejection. With this draw, reject ID 1, discard the tail, and sample a replacement.",
      "Use [0.75, 0, 0.25] on rejection. With this draw, accept ID 1 and check the next proposal."
    ],
    "answer": "Use [0.75, 0, 0.25] on rejection. With this draw, reject ID 1, discard the tail, and sample a replacement.",
    "explanation": "For ID 1, the acceptance threshold is 0.20 / 0.60 = 1/3. The draw of 0.55 exceeds it, so reject ID 1. The pending proposals assumed that ID 1 was accepted. Discard them. Subtract the draft probabilities from the target probabilities and keep the positive differences, [0.30, 0, 0.10]. Dividing by their sum of 0.40 gives [0.75, 0, 0.25]. The vector [0.625, 0, 0.375] comes from removing ID 1 and rescaling the remaining target probabilities, which skips the subtraction. Reversing the acceptance ratio gives a threshold of 1 after capping and would accept ID 1 in error."
  },
  {
    "question": "A fixed-batch inference step moves 10 GB of weights and 30 GB of KV each step at unchanged achieved bandwidth. Compare two separate changes: quarter only the weights, or halve only the KV. What bandwidth-only rate ratios follow, before conversion or kernel overhead?",
    "options": [
      "4.00× and 2.00×.",
      "1.23× and 1.60×.",
      "1.60× and 1.23×.",
      "1.23× and 2.00×."
    ],
    "answer": "1.23× and 1.60×.",
    "explanation": "Original bytes are 40. Quartered weights give 2.5+30=32.5, so 40/32.5≈1.23. Halved KV gives 10+15=25, so 40/25=1.60. Compressing one stream does not scale the total by that factor, and the two streams cannot be swapped."
  },
  {
    "question": "A freshly initialized replica has 32 GiB total HBM, 8 GiB weights and 4 GiB runtime reserve. After a cache-width change, each current history is 0.25 GiB and each output-reserved allocation 0.3125 GiB. Read weights plus current histories once at 400 GiB/s. Among batches 16/32/48/64, choose the largest fitting the pool and a 40 ms iteration limit. What choice and modeled aggregate rate follow?",
    "options": [
      "B 64 and 1066.7 tokens/s.",
      "B 48 and 960 tokens/s.",
      "B 16 and 533.3 tokens/s.",
      "B 32 and 800 tokens/s."
    ],
    "answer": "B 32 and 800 tokens/s.",
    "explanation": "The pool is 20 GiB, so all listed reservations fit through B 64. Iteration time is (8+0.25 B)/400 seconds, giving 30/40/50/60 ms. B 32 is the largest at most 40 ms, and 32/0.040=800 tokens/s. B 64 uses the memory-only ceiling; B 48 violates latency; B 16 leaves a larger eligible candidate unused."
  }
]
```

> **Next:** Continue to [Model Parallelism for LLM Inference](/learn/model-parallelism-for-llm-inference). An 8B replica fits within an 80 GB GPU memory budget. Llama 3 70B's FP16 weights need roughly 140 GB before caching a single token, so one device cannot hold the model. The next chapter partitions that model across GPUs.
