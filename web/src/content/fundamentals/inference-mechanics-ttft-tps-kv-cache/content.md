---
{
  "id": "inference-mechanics-ttft-tps-kv-cache",
  "slug": "inference-mechanics-ttft-tps-kv-cache",
  "title": "Inference: TTFT, TPS & KV Cache",
  "shortDescription": "A blank chat window and a busy GPU can both be right: prefill and decode hit different limits, and the KV cache decides how many sequences fit.",
  "difficulty": "Hard",
  "category": "Inference Optimization",
  "section": "GPU Systems & LLM Inference",
  "coverImage": "illustrations/_generated/inference_pipeline_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta",
    "Together AI",
    "Fireworks AI"
  ],
  "keyConceptsTested": [
    "Two-phase inference: long-prompt prefill vs low-batch decode bottlenecks",
    "TTFT, TPS, ITL, TPOT: what each measures and what drives it",
    "KV cache memory formula derivation from model architecture",
    "GQA/MQA effect on KV cache size",
    "Arithmetic intensity: why prefill and decode bottlenecks differ",
    "Chunked prefill for smoothing TTFT-TPS tradeoff",
    "Prefill-decode disaggregation onto separate GPU pools",
    "Dynamic token budgeting for concurrent serving",
    "KV cache quantization for concurrency"
  ],
  "prerequisites": [
    "tokenization-bpe-wordpiece-sentencepiece",
    "scaled-dot-product-attention"
  ],
  "relatedQuestions": [
    "multi-query-grouped-query-attention",
    "kv-cache-paged-attention-llm-serving",
    "continuous-batching-request-scheduling",
    "model-quantization-gptq-awq-gguf",
    "model-parallelism-for-llm-inference"
  ],
  "order": 1
}
---

<!-- leetllm: edition:reference:start -->

A chat window stays blank, then the reply arrives in uneven chunks. A GPU dashboard reports a healthy compute rate. Which observation should guide the investigation? Both can be true: processing a prompt and extending a response run the same model with different shapes, reuse patterns, and scheduling pressures.

Trace that call from the instant the user hits Send. Network transit, queueing, and tokenization kick off the pipeline. Then <span data-glossary="prefill">prefill</span> processes the uncached prompt, possibly in chunks, and builds reusable attention state. After the first output token, ordinary <span data-glossary="decode-phase">decode</span> consumes one newly generated token per request per step. The <span data-glossary="kv-cache">key-value (KV) cache</span> retains earlier attention keys and values. Full-attention cache grows as tokens are consumed; hybrid models can also maintain recurrent state.

Three operational counters tell the story: <span data-glossary="ttft">time to first token (TTFT)</span> measures the initial wait, <span data-glossary="tokens-per-second">tokens per second (TPS)</span> measures a defined output rate, and KV cache occupancy tracks memory capacity. More uncached prompt work can increase TTFT, but prefix reuse and scheduling change the relationship. A longer full-attention history can slow decode because each new query reads more cached K/V.

> **Working hypothesis:** Long-prompt prefill often has enough weight reuse to approach a compute limit. Low-batch decode often approaches a memory-bandwidth limit. Short prompts, long histories, batching, sharding, and kernel overhead can change the bottleneck. [KV cache paging](/learn/kv-cache-paged-attention-llm-serving), [continuous batching](/learn/continuous-batching-request-scheduling), and disaggregation target different parts of this serving problem.

---

## The two phases of LLM inference

Under standard autoregressive generation without speculation, distinguish prompt processing from response extension. For an uncached full-attention prompt, prefill computes K/V for its tokens. Decode consumes the latest output token, appends its K/V, attends to the retained prefix, and samples the next output.[^hfCacheExplanation2026] A serving iteration can batch requests in both phases; these labels do not require separate kernel launches or separate workers.

<figure>
  <img src="illustrations/_generated/inference_pipeline_dark.png" alt="Full-attention example: prefill consumes four prompt tokens, caches four positions, and emits y1. Decode consumes y1, caches five positions, and emits y2. Consuming y2 caches six positions and emits y3. Batched decode can use matrix-matrix work." />
  <figcaption>The cache holds consumed tokens, not the newest prediction. With ordinary full-attention decode, all positions retained, and at least one output, P prompt tokens and O emitted outputs leave P + O - 1 cached positions. This counts logical positions, excluding page padding. Batched decode uses multiple token rows and need not execute GEMV kernels.</figcaption>
</figure>

The operational handoff between phases is sequential even though prompt processing is parallel:

### Phase 1: Prefill (processing the prompt via GEMM)

Consider an uncached prefill or one prefill chunk containing $N$ token rows. Its activations form a matrix $X \in \mathbb{R}^{N \times d_{\text{model}}}$. Linear projections against $W \in \mathbb{R}^{d_{\text{model}} \times d_{\text{out}}}$ use General Matrix-Matrix Multiplication (**GEMM**). Token rows can be processed together within a layer; transformer layers still depend on preceding layers.

A projection's weight tiles can be reused across token rows. More rows make it easier to amortize weight traffic and approach a **compute bound**, but the actual intensity also includes activations, attention, and repeated tile loads. Profile the target shapes and kernels to determine Tensor Core utilization, even for long prompts. In a simple unchunked full-attention trace:

```text
Input prompt (N tokens): "Explain why decode slows as context grows"
→ Tokenize prompt into N integer IDs
→ Ingest all N token embeddings simultaneously (matrix of shape N × d_model)
→ Execute parallel GEMM across all transformer layers (causal mask applied)
→ Write N Key and Value vector pairs into HBM (initial KV cache)
→ Produce logits for position N and sample output token y1
```

The wall-clock interval from request arrival to the moment token 1 emerges is **TTFT**. Users feel that blank pause directly. A snappy chat experience needs low TTFT, but different products place different pressures on that initial clock:

| Use Case | Primary Pressure | What to Measure |
|----------|------------------|-----------------|
| Real-time voice | Turn-taking delay | End-to-end TTFT including audio framing and transport |
| Code completion | Interruption to typing flow | Tail (p95/p99) TTFT on the product's actual context distribution |
| Conversational chat | Visible waiting screen | TTFT plus streaming inter-token cadence |
| Offline batch pipelines | Total job duration | Aggregate throughput (tokens/sec) over TTFT |

### Phase 2: Decode (generating tokens via GEMV)

Once token 1 is sampled, we don't reprocess the prompt. The model switches to generating tokens **one by one**, autoregressively: feed the newest token through the network, reuse the cached Keys and Values for the prefix, append the newest token's K/V slice, and sample the next token.

Notice the fundamental linear algebra change: the input activation is no longer an $N \times d_{\text{model}}$ matrix. It's a single token vector of shape $1 \times d_{\text{model}}$. Multiplying this single row vector by layer weight matrices $W \in \mathbb{R}^{d_{\text{model}} \times d_{\text{out}}}$ is a General Matrix-Vector Multiplication (**GEMV**).

At batch size 1, projection weights cannot be amortized across multiple token rows. Large dense layers can therefore require substantial weight traffic for little arithmetic. This does not mean every model parameter is read from HBM on every step: embedding lookups, routed experts, on-chip caching, and kernel implementations change the active bytes. Full attention also reads the retained K/V prefix. The generation loop proceeds step by step:

```text
After prefill: cache contains P prompt positions; sample output token y1
Decode step 1: feed y1 (1 × d vector) → compute/append K_y1, V_y1 → attend over P+1 → sample y2
Decode step 2: feed y2 (1 × d vector) → compute/append K_y2, V_y2 → attend over P+2 → sample y3
After emitting y3: cache contains exactly P+2 positions (y3 is not cached yet)
```

Low-batch decode often reaches a **memory-bandwidth bound** before its arithmetic throughput reaches peak. With a longer full-attention history, K/V traffic can become a larger term. Measure the bottleneck rather than interpreting low FLOPs relative to peak as a percentage of idle GPU cycles.

The following timeline records one instrumented request. Arrival is 0 ms; four output tokens are captured at 320, 355, 392, and 428 ms. The first timestamp closes TTFT. Only the intervals after it describe decode cadence; measure the target service to characterize its latency.

<!-- leetllm: test, output=show -->
```python title="measure-prefill-and-decode.py"
from math import isfinite


def token_metrics(arrival_ms: float, times_ms: list[float]) -> dict:
    if not isfinite(arrival_ms) or any(not isfinite(t) for t in times_ms):
        raise ValueError("timestamps must be finite")
    if any(b < a for a, b in zip([arrival_ms] + times_ms, times_ms)):
        raise ValueError("timestamps must be nondecreasing after arrival")
    if not times_ms:
        return {"ttft": None, "itls": [], "tpot": None, "tps": None}
    gaps = [b - a for a, b in zip(times_ms, times_ms[1:])]
    tpot = sum(gaps) / len(gaps) if gaps else None
    # Equal timestamps can reflect clock resolution or coalesced delivery.
    tps = 1000 / tpot if tpot is not None and tpot > 0 else None
    return {"ttft": times_ms[0] - arrival_ms, "itls": gaps,
            "tpot": tpot, "tps": tps}


m = token_metrics(0, [320, 355, 392, 428])
ttft_ms, itls_ms, tps = m["ttft"], m["itls"], m["tps"]
assert token_metrics(0, [])['ttft'] is None
assert token_metrics(0, [320])['tpot'] is None
assert token_metrics(0, [320, 320])['tps'] is None

print("TTFT:", ttft_ms, "ms")
print("decode ITLs:", itls_ms, "ms")
print(f"decode TPS: {tps:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
TTFT: 320 ms
decode ITLs: [35, 37, 36] ms
decode TPS: 27.8
```
<!-- leetllm: output:end -->

### Why prefill and decode hit different roofs

To see why prefill and decode can put different pressure on a GPU, start with **<span data-glossary="arithmetic-intensity">operational intensity</span>** (also called arithmetic intensity): the ratio of floating-point operations (FLOPs) performed to bytes fetched from high-bandwidth memory (HBM).

$$
I = \frac{\text{FLOPs}}{\text{Bytes fetched from HBM}}
$$

For an ideal BF16 linear projection, each weight serves $N$ rows: $2N$ FLOPs per weight against 2 bytes of weight payload gives $I_{\text{weight-only}} \approx N$ FLOPs/byte. Actual HBM intensity includes activation and attention traffic and any repeated loads. This idealization isolates the effect of weight reuse; use measured traffic and operations to estimate phase-wide intensity.

At $N = 1$, the same weight-only approximation gives about 1 FLOP/byte. If we deliberately model 27 billion parameters as dense multiply weights streamed once per step, BF16 traffic is 54 GB and multiply work is 54 GFLOPs. Actual model traffic can differ; this is an explanatory approximation:

$$
I_{\text{decode}} \approx \frac{2 \times \text{Params}}{2 \text{ bytes} \times \text{Params}} \approx 1.0 \text{ FLOP/byte}
$$

The <span data-glossary="roofline-model">roofline model</span>[^williams2009] maps this arithmetic reality directly against hardware limits. At operational intensity $I$, attainable performance $P$ is bounded by the minimum of two physical ceilings:

$$
P_{\text{measured}} \le \min\left(P_{\text{compute}}, \; I \times \text{BW}_{\text{HBM}}\right)
$$

The sloped roof represents memory-bandwidth saturation ($I \times \text{BW}_{\text{HBM}}$), and the horizontal flat roof represents peak Tensor Core compute ($P_{\text{compute}}$). The two lines intersect at the **hardware ridge point**:

$$
I_{\text{ridge}} = \frac{P_{\text{compute}}}{\text{BW}_{\text{HBM}}}
$$

NVIDIA lists H100 SXM BF16 Tensor Core performance as **1,979 TFLOPS with sparsity**, and HBM bandwidth as 3.35 TB/s.[^nvidia2026h100] Its structured-sparse mode doubles the corresponding dense throughput.[^nvidia2022hopper] For dense BF16 work, use approximately $1{,}979 / 2 = 989.5$ TFLOPS, derived from those rounded specifications:

$$
I_{\text{ridge,dense}} = \frac{989.5 \times 10^{12}}{3.35 \times 10^{12}} \approx 295.4 \text{ FLOPs/byte}
$$

In this simple dense-BF16/HBM roofline:

- **At $I = 1$ FLOP/byte:** The bandwidth roof is 3.35 TFLOPS, about **0.34%** of the dense compute peak. This ratio compares arithmetic rates; measure utilization and stall cycles to estimate GPU idle time.
- **At measured $I = 600$ FLOPs/byte:** The compute roof is lower than the bandwidth roof. The kernel can still fall below it because of occupancy, launch overhead, communication, or other limits. Having 2,048 prompt tokens does not by itself yield $I = 600$.

| Phase | Tokens per Step | Weight Reuse | Operational Intensity ($I$) | Hardware Bottleneck |
|-------|-----------------|--------------|-----------------------------|---------------------|
| **Prefill** | $N$ prompt/chunk rows | Across token rows | Ideal weight-only $\approx N$ | Often compute at long prompts; measure |
| **Decode ($B=1$)** | 1 token row | No reuse across rows | Ideal weight-only $\approx 1$ | Often bandwidth; overhead can dominate |
| **Decode ($B=64$)** | 64 token rows | Across batch rows | Ideal weight-only $\approx 64$ | KV traffic and kernels change the result |

> **Key insight:** Reaching only 0.34% of dense peak FLOPs at $I = 1$ does not mean the GPU is 99.66% idle. It means HBM bandwidth is saturated moving weights for a single token row, leaving Tensor Cores starved until batching or prefill raises arithmetic intensity.

Before trusting a specification, check its precision, sparsity footnote, and units. This CPU calculation catches the factor-of-two error:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="compare-dense-and-sparse-roofs.py"
import numpy as np

sparse_bf16_tflops = 1979.0
dense_bf16_tflops = sparse_bf16_tflops / 2.0
bandwidth_tb_s = 3.35
intensities = np.array([1.0, 64.0, 2048.0], dtype=np.float64)
attainable_tflops = np.minimum(dense_bf16_tflops, bandwidth_tb_s * intensities)
assert dense_bf16_tflops == 989.5
print(f"dense ridge: {dense_bf16_tflops / bandwidth_tb_s:.1f} FLOPs/byte")
print(f"sparse ridge: {sparse_bf16_tflops / bandwidth_tb_s:.1f} FLOPs/byte")
print(f"I=1 arithmetic rate / dense peak: {100 * attainable_tflops[0] / dense_bf16_tflops:.2f}%")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dense ridge: 295.4 FLOPs/byte
sparse ridge: 590.7 FLOPs/byte
I=1 arithmetic rate / dense peak: 0.34%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/dense_roofline_dark.png" alt="A logarithmic dense-BF16 H100 roofline rises from the 3.35 TB/s bandwidth ceiling and meets the 989.5 TFLOPS compute ceiling at 295.4 FLOPs per byte. At intensity 1, the bandwidth ceiling is 3.35 TFLOPS, 0.34% of dense peak. No measured throughput point is plotted. A weight tile reused across 64 activation rows illustrates why the weight-only intensity estimate increases with row count." />
  <figcaption>The dense roof is $\min(989.5\ \text{TFLOPS}, 3.35\ \text{TB/s} \times I)$. The sparse specification is 1,979 TFLOPS; the dense ceiling uses half that rate. $N/B$ estimates weight reuse only, not full phase traffic or time spent idle.</figcaption>
</figure>

#### How batching shifts decode along the roofline

Notice how batching transforms decode economics. When the serving engine batches $B$ concurrent decode requests together, the input activation changes from a $1 \times d_{\text{model}}$ vector to a $B \times d_{\text{model}}$ matrix.

Projection weight tiles can now serve $B$ independent query rows. A weight-only estimate becomes:

$$
I_{\text{weight-only}}(B) \approx \frac{2 B \cdot W_{\text{params}}}{2 W_{\text{params}}} = B \text{ FLOPs/byte}
$$

Including K/V and activation traffic changes the intensity; include their associated FLOPs too when measuring a whole phase. Larger batches can increase aggregate throughput by amortizing weights; the gain depends on per-request state, step duration, and queueing. Sweep batch size and concurrency while measuring both throughput and per-request latency.

#### Putting a measured point on the roofline

Use one kernel or one clearly defined phase at a time. Record elapsed time, FLOPs, and actual HBM traffic. NVIDIA Nsight Compute exposes hardware counters such as `dram__bytes.sum`; query supported metrics for your GPU/tool version with `ncu --query-metrics`.[^nsightCompute2026] Profiling can replay or perturb execution, so distinguish profiled kernel duration from unprofiled service latency. Then compute:

$$
P_{\text{measured}} = \frac{\text{FLOPs}}{\text{time}}, \quad I = \frac{\text{FLOPs}}{\text{HBM bytes}}
$$

Plot $(I, P_{\text{measured}})$ against the roofline curves for your specific GPU architecture and precision:

- **Near the sloped ceiling:** Reducing traffic is a candidate. Quantization can help if saved bytes outweigh conversion overhead and quality remains acceptable. Caching avoids repeated computation but can add retained-state reads.
- **Near the flat ceiling:** Investigate math efficiency, precision, and parallelism. [FlashAttention](/learn/flashattention-memory-efficient-attention)[^dao2022] specifically reduces attention HBM traffic; its value depends on which kernels consume the time.
- **Far below both ceilings:** Investigate launch overhead, small grids, synchronization, communication, or other ceilings. The roofline alone cannot identify the cause.

```checkpoint
Why is prefill usually compute-bound while single-stream decode is usually memory-bandwidth-bound?
---
Long-prompt projection work can reuse weights across many token rows. Single-stream projection work has one row, giving little reuse across tokens. This makes long prefill more likely to approach a compute roof and low-batch decode more likely to approach a bandwidth roof. Actual intensity includes all phase traffic; short prompts, long K/V histories, and kernel overhead can change the diagnosis.
```

---

## Four numbers for one request

When diagnosing serving latency, define the interval before averaging. TTFT ends at the first observed token; decode cadence uses the subsequent gaps. End-to-end output rate includes the initial wait and answers another useful question.

<figure>
  <img src="illustrations/_generated/latency_breakdown_dark.png" alt="On a linear 0–428 ms request clock, token 1 at 320 ms ends TTFT. A separately scaled decode inset shows tokens at 320, 355, 392, and 428 ms, with gaps of 35, 37, and 36 ms. The 108 ms decode window averages 36 ms per token and 27.8 tokens/s; all four tokens over 428 ms give 9.35 tokens/s." />
  <figcaption>In this timing trace, TTFT is 320 ms. The later gaps are 35, 37, and 36 ms, giving TPOT of 36 ms and decode rate of 27.8 tokens/s. Dividing all four tokens by 428 ms gives an end-to-end output rate of 9.35 tokens/s. Both rates are valid; their intervals and numerators differ.</figcaption>
</figure>

### TTFT (time to first token)

TTFT is the elapsed time from request arrival to the emission of the first output token. It's the critical metric for human-perceived responsiveness:

$$
\text{TTFT} = t_{\text{first\_token}} - t_{\text{arrival}}
$$

Define **client TTFT** and **server TTFT** separately. A UI clock from Send to first rendered token can include serialization, transport, proxy buffering, and rendering. A server clock begins at its instrumented arrival point; whether tokenization and front-end queues are included depends on that point. For example, vLLM's metrics documentation starts front-end `arrival_time` when tokenization begins.[^vllm2026metrics] Do not compare clocks with different start or end points as if they measured the same interval.

In real-world applications, user-visible TTFT can also include streaming buffering and hidden reasoning chains (such as "thinking" tokens before visible answer text). Ensure your instrumentation tracks whether "first token" means the first generated token, the first reasoning token, or the first visible token rendered in the UI.

### TPS (tokens per second)

Define the interval and population whenever reporting TPS. Two common rates are:

1. **Per-request decode rate:** The pacing at which tokens stream to a single user after token 1 has arrived. For $N > 1$ tokens observed at times $t_1, \ldots, t_N$, calculate:
   $$
   \text{Per-Request TPS} = \frac{N - 1}{t_N - t_1}
   $$
   With times expressed in seconds, the denominator spans $N - 1$ intervals, not $N$. Our three gaps span 0.108 seconds, giving $3 / 0.108 = 27.8$ tokens/s. The end-to-end output rate is $4 / 0.428 = 9.35$ tokens/s. Label that rate with its full-request interval rather than calling it decode speed.
2. **Aggregate cluster throughput:** Total output tokens produced across all active requests divided by total elapsed wall-clock time:
   $$
   \text{Cluster TPS} = \frac{\sum_{\text{all requests}} \text{Output Tokens}}{\Delta t_{\text{wall}}}
   $$
   This measures throughput. Assess efficiency or cost by also reporting GPU resources, precision, quality, workload, and spend. Continuous batching[^yu2022] can improve throughput by starting and retiring requests between iterations instead of waiting for an entire batch to finish.

### ITL (inter-token latency)

ITL is the elapsed time between consecutive output tokens during decode:

$$
\text{ITL}_k = t_k - t_{k-1} \quad \text{for } k \ge 2
$$

An **ITL distribution** exposes stuttering that a mean can hide. A stream alternating between short gaps and long pauses feels different from an evenly paced one. There is no universal comfortable rate in model tokens: tokenizer, language, task, and rendering all matter.

Check what an event contains. If a server or network emits several tokens together, event-to-event latency is not an observed gap between each individual token. Speculative generation and buffered delivery can both produce such chunks. Current vLLM metrics explicitly distinguish iteration events from per-token averages.[^vllm2026metrics]

Under concurrency, scheduling, preemption, communication, and prefill interference can increase tail gaps. Report event or token granularity, measurement side, and percentile population with p95/p99 rather than treating every emitted chunk as one token.

### TPOT (time per output token)

TPOT is the average duration required to generate each output token after token 1:

$$
\text{TPOT} = \frac{t_N - t_1}{N - 1} = \frac{1}{\text{Per-Request TPS}}
$$

In our example, TPOT is $108 / 3 = 36$ ms/token, so decode TPS is $1{,}000 / 36$. They are inverses **for the same request**, with consistent units. Requests with zero or one output token have no measured post-first-token interval; state how your metrics handle them. In particular, the inverse of mean request TPOT is not mean request TPS.

vLLM records a zero in its Prometheus request-TPOT histogram for responses with at most one token, while `vllm bench serve` excludes those responses from TPOT statistics.[^vllm2026metrics] A traffic shift toward one-token replies can therefore lower the histogram mean without improving decode. Compare the same eligible request population, output lengths, and event granularity before attributing a mean change to a faster kernel.

To make that non-linearity concrete, compare two request streams with 10 ms and 100 ms inter-token gaps alongside a four-token batched delivery event:

| Measurement | Calculation | Result |
|---|---|---|
| Two streams (10 ms and 100 ms TPOT) | Mean request TPS: $(100 + 10) / 2$ | **55.0 tokens/s** |
| Inverse of mean request TPOT | $1000 / ((10 + 100) / 2)$ | **18.2 tokens/s** (not equal to mean TPS) |
| Four-token batched event (40 ms gap) | Interval average: $40\text{ ms} / 4$ | **10.0 ms/token** (averaged, not 4 timestamps) |

The four-token event supplies an average over its preceding interval, not four individual generation timestamps. A token-weighted aggregate, a request-weighted mean, and a histogram of iteration gaps describe different populations.

The four metrics form a coherent diagnostic picture:

| Metric | What It Measures | Target Phase | Primary Drivers | Key Aggregation |
|--------|------------------|--------------|-----------------|-----------------|
| **TTFT** | Elapsed time until token 1 appears | Prefill path | Prompt length, server queueing, network | Median & p99 latency |
| **TPS** | Generation rate after token 1 | Decode | HBM bandwidth, batch size, model size | Per-request & cluster rate |
| **ITL** | Gap between consecutive tokens | Decode | Scheduler contention, prefill interference | Distribution & tail jitter |
| **TPOT** | Average time per output token | Decode | Batch size, memory bus traffic, context length | Request & benchmark mean |

```checkpoint
If users complain that nothing appears for a long time, which metric do you inspect first? What if streaming looks choppy after it starts?
---
Inspect TTFT first when the initial pause is too long, because that points to prefill, queueing, tokenization, or scheduling before the first token. Inspect ITL, TPOT, and TPS when streaming is choppy after generation begins, because those describe decode pacing and system contention.
```

This router maps threshold rules onto explicit diagnostic paths for target SLO monitoring:

<!-- leetllm: test, output=show -->
```python title="route-latency-investigation.py"
def investigate(ttft_p95_ms: int, itl_p95_ms: int) -> str:
    if min(ttft_p95_ms, itl_p95_ms) < 0:
        raise ValueError("latencies must be nonnegative")
    paths = []
    if ttft_p95_ms > 900:
        paths.append("inspect queueing and prefill")
    if itl_p95_ms > 120:
        paths.append("inspect decode scheduling and memory pressure")
    return "; ".join(paths) or "within example thresholds"


print("long initial pause:", investigate(ttft_p95_ms=1100, itl_p95_ms=60))
print("choppy stream:", investigate(ttft_p95_ms=350, itl_p95_ms=160))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
long initial pause: inspect queueing and prefill
choppy stream: inspect decode scheduling and memory pressure
```
<!-- leetllm: output:end -->

### Back-of-the-envelope: a bandwidth upper bound

A serving benchmark is easier to interpret once you have estimated one optimistic limit. For a single low-batch decode stream, most model weights must be read for each token, so memory bandwidth is a useful first bound:

$$
\text{Max TPS} \approx \frac{\text{HBM Bandwidth}}{\text{Model size (bytes)}}
$$

For this calculation, assume dense Qwen3.6-27B language weights in BF16, one H100 SXM, weights resident on that GPU, one low-batch stream, and ideal peak HBM bandwidth. The model card implies about 54 GB of language weights, before KV cache, runtime buffers, extra tensors, and allocator headroom.[^qwen3627b2026]

NVIDIA lists 3.35 TB/s peak HBM bandwidth for H100 SXM.[^nvidia2026h100] Use it as the hardware roof; measure sustained bandwidth on the selected application workload.

$$
\text{Ideal weight-read bound} \approx \frac{3{,}350 \text{ GB/s}}{54 \text{ GB}} \approx 62 \text{ tokens/sec}
$$

Under the full-weight-streaming assumption, **62 tok/s is an idealized rate**: all 54 GB move through HBM once per step. Actual active tensors, embedding access, cache reuse, and auxiliary heads can change that traffic, so measure the selected model and engine to estimate a model-specific ceiling. Two refinements keep this estimate useful:

1. **Sustained bandwidth** comes from a benchmark on selected hardware and kernel mix. Replace 3,350 GB/s with that measured value rather than applying a fixed peak-to-sustained percentage.
2. **KV-prefix traffic** grows with sequence length $s$: each full-attention decode step also reads prior K/V for that request and any batch mates. As $s$ rises, weight streaming is no longer the only HBM term, so the effective ceiling falls below this pure weight-read bound.

The bound omits activation memory, kernel overhead, scheduling, and interconnect traffic when the model is sharded. Benchmark selected engine, parallelism layout, model precision, prompt/output distribution, and concurrency to get real TPS. Batched inference can improve aggregate throughput by sharing weight reads, but it changes arithmetic intensity and per-request ITL at the same time.

<!-- leetllm: test, output=show -->
```python title="estimate-bandwidth-bound.py"
def ideal_weight_stream_tps(model_bytes: int, bandwidth_bytes_per_s: int) -> float:
    if model_bytes <= 0 or bandwidth_bytes_per_s <= 0:
        raise ValueError("weight bytes and bandwidth must be positive")
    return bandwidth_bytes_per_s / model_bytes


model_gb = 54
h100_capacity_gb = 80
print("weights alone fit in 80 GB:", model_gb <= h100_capacity_gb)
bound = ideal_weight_stream_tps(54 * 10**9, 3350 * 10**9)
print(f"single-GPU ideal weight-read bound: {bound:.1f} tokens/s")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
weights alone fit in 80 GB: True
single-GPU ideal weight-read bound: 62.0 tokens/s
```
<!-- leetllm: output:end -->

> **Research note:** For low-batch decode, quantization can move the weight-streaming bound by reducing bytes read per token. PagedAttention[^kwon2023] improves KV-cache packing and sharing; continuous batching[^yu2022] improves utilization across requests. Each technique targets a different serving constraint.

```checkpoint
Why does the rough bandwidth estimate divide HBM bandwidth by model size?
---
If the entire dense weight footprint streams once per step, bandwidth divided by weight bytes gives an idealized rate. Use the model's actual active tensor traffic, K/V reads, and runtime overhead when estimating its ceiling.
```

---

## The KV cache: the dynamic capacity bottleneck

The 62 tok/s calculation answered how fast bytes can move through memory. Capacity asks a different question: after static model weights and runtime buffers are loaded, how much HBM remains for active request state?

In long-context or high-concurrency serving, the **KV cache** can dominate the remaining memory. Recurrent state, activations, workspaces, graph buffers, and retained prefix blocks also need a budget.

### Cached keys and values

Full-attention layers compute **Key** and **Value** projections for token positions. Discarding their history forces later steps to regenerate prefix state. Repeating projection work over successively longer prefixes gives quadratic total projection work in sequence length. Repeating naive full-prefix attention can be even more expensive.

> **What the cache saves:** Retaining K/V avoids repeating old projections. It does not make full-attention generation constant-cost: a new query still attends to a prefix whose length grows. Over a growing sequence, those cached attention steps still perform quadratic total attention work.

The generation trace indexes **consumed** tokens, not newly emitted predictions:

```text
Prompt prefill: Compute [K1..KP], [V1..VP] → Store in cache (P positions)
Decode step 1:  Consume y1 → Compute/append K_y1, V_y1 → Attend over P+1 positions → Emit y2
Decode step 2:  Consume y2 → Compute/append K_y2, V_y2 → Attend over P+2 positions → Emit y3
...
After emitting y3: cache holds exactly P+2 positions (y3 is not cached yet)
```

### Why dynamic allocation exhausts VRAM: fragmentation

Output length varies even when the server enforces a maximum. Generation can stop at a configured EOS token, stop sequence, length limit, or cancellation; the literal EOS token is model-specific.

Two allocation strategies illustrate wasted capacity:

1. **Internal fragmentation:** Reserving 4,096 positions for a sequence that uses 120 **total cached positions** leaves about 97% of that reservation unused. Count prompt and consumed output, not output alone.
2. **External fragmentation:** Repeatedly growing and freeing allocations can leave free regions that an allocator cannot use for a requested block. Allocation can fail despite substantial total free bytes, depending on allocator and driver behavior. Inspect free-region layout and allocator behavior when an allocation request fails.

<span data-glossary="pagedattention">PagedAttention</span> maps logical sequences to fixed-size physical K/V blocks, inspired by <span data-glossary="virtual-memory">virtual memory</span>.[^kwon2023] A block pool avoids needing one large contiguous cache allocation per sequence and confines unused tail positions to the last block. Other GPU allocations can still fragment. Tail waste also depends on block size: with a 16-token block, a one-token sequence reserves fifteen unused positions.

<!-- leetllm: test, output=show -->
```python title="measure-paged-tail-waste.py"
block_tokens = 16
for cached_tokens in (1, 120):
    blocks = (cached_tokens + block_tokens - 1) // block_tokens
    reserved_tokens = blocks * block_tokens
    unused = reserved_tokens - cached_tokens
    assert 0 <= unused < block_tokens
    print(f"{cached_tokens} cached: {reserved_tokens} reserved, "
          f"{100 * unused / reserved_tokens:.2f}% unused")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1 cached: 16 reserved, 93.75% unused
120 cached: 128 reserved, 6.25% unused
```
<!-- leetllm: output:end -->

```checkpoint
What does the KV cache save, and what does it cost?
---
It avoids recomputing previously processed K/V. The raw full-attention payload grows with cached positions, KV heads, vector dimensions, layers, and value precision. Full-attention queries still read growing history; paging and other model state add allocation costs outside the raw formula.
```

### A raw KV payload formula

For $B$ equal-length sequences, uniform full-attention layers, equal key/value head dimensions, and uncompressed values, the raw tensor payload is:

$$
\text{KV Cache Memory (bytes)} = 2 \times n_{\text{layers}} \times n_{\text{kv\_heads}} \times d_{\text{head}} \times L_{\text{seq}} \times b \times B
$$

Each factor names a different part of that payload:
- **$2$:** For every token position, we must store both a **Key** vector and a **Value** vector.
- **$n_{\text{layers}}$:** The number of transformer layers that maintain an attention cache. In hybrid models (like Qwen3.6-27B), DeltaNet or recurrent layers don't store standard K/V caches.
- **$n_{\text{kv\_heads}}$:** KV heads per layer. MHA has as many K/V heads as query heads; [GQA](/learn/multi-query-grouped-query-attention) shares K/V across groups.[^ainslie2023] Relative to matching MHA, raw KV payload shrinks by the query-head/KV-head ratio. The model's actual head counts determine whether that ratio is 4×, 8×, or another value.
- **$d_{\text{head}}$:** The configured key/value vector dimension. It is often $d_{\text{model}} / n_{\text{query\_heads}}$, but not always. Read the actual architecture: Qwen3.6-27B lists attention head dimension 256, hidden size 5,120, and 24 query heads, so dividing 5,120 by 24 would be wrong.[^qwen3627b2026]
- **$L_{\text{seq}}$:** Cached positions. Unequal lengths require their sum. Under ordinary full-history decode with $O \ge 1$ outputs, this is $P + O - 1$; reserving $P + O$ is a conservative planning convention.
- **$b$:** Precision in bytes per value ($b = 2$ for FP16/BF16, $b = 1$ for FP8/INT8, $b = 0.5$ for FP4).
- **$B$:** The batch size (number of concurrent sequences).

For different attention-layer layouts, sum each layer's own $n_{\text{kv\_heads}}(d_K + d_V)b$ times its retained positions. Sliding-window layers can retain fewer positions; latent-attention caches and recurrent layers require their own state formulas. Page padding, quantization scales, and allocator overhead are not raw tensor payload.

### Concrete example: Qwen3.6-27B-style GQA sizing

The same formula, filled in with Qwen3.6-27B-style GQA dimensions:

| Parameter | Architectural Value | Rationale |
|-----------|---------------------|-----------|
| Attention layers ($n_{\text{layers}}$) | 16 | 64 total layers; 48 Gated DeltaNet layers use fixed-size recurrent state |
| KV heads ($n_{\text{kv\_heads}}$) | 4 | Grouped-Query Attention (GQA) sharing 24 query heads across 4 KV heads |
| Head dimension ($d_{\text{head}}$) | 256 | Dimension per attention head |
| Cached length ($L_{\text{seq}}$) | 4,096 positions | Chosen example length; native context is 262,144 tokens |
| Precision ($b$) | 2 bytes | 16-bit float (FP16 or BF16) |

$$
\begin{aligned}
\text{KV Cache per sequence} &= 2 \times 16 \times 4 \times 256 \times 4{,}096 \times 2 \text{ bytes} \\
&= 268{,}435{,}456 \text{ bytes} \approx \mathbf{0.27 \text{ GB}} \; (\approx \mathbf{0.25 \text{ GiB}})
\end{aligned}
$$

Storing 4 KV heads instead of a 24-head MHA layout reduces this payload by $24 / 4 = \mathbf{6\times}$. That MHA layout would need $1.61$ GB ($1.5$ GiB) per 4K sequence. Supported concurrency also depends on recurrent state, buffers, other reservations, and latency constraints, so the payload ratio alone cannot set the sequence limit.

<!-- leetllm: test, output=show -->
```python title="calculate-kv-cache-footprint.py"
def kv_cache_bytes(
    layers: int, kv_heads: int, head_dim: int, tokens: int, bytes_per_value: int
) -> int:
    dimensions = (layers, kv_heads, head_dim, bytes_per_value)
    if any(x <= 0 for x in dimensions) or tokens < 0:
        raise ValueError("cache dimensions must be positive and tokens nonnegative")
    return 2 * layers * kv_heads * head_dim * tokens * bytes_per_value


gqa_bytes = kv_cache_bytes(16, 4, 256, 4096, 2)
mha_bytes = kv_cache_bytes(16, 24, 256, 4096, 2)

print(f"GQA cache: {gqa_bytes / 1e9:.2f} GB")
print(f"MHA cache: {mha_bytes / 1e9:.2f} GB")
print("MHA / GQA:", mha_bytes // gqa_bytes)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
GQA cache: 0.27 GB
MHA cache: 1.61 GB
MHA / GQA: 6
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/kv_cache_scaling_dark.png" alt="A Qwen3.6-27B-style GQA cache has 16 attention layers, four KV heads, separate key and value vectors of 256 values at each of 4,096 positions, and two bytes per value: 268,435,456 bytes, or 0.268 GB and 0.25 GiB. Common-scale bars show FP16 and 8-bit growth at 2K, 4K, 6K, and 8K. At 4K, four shared KV heads use 0.268 GB; an ungrouped MHA layout with one KV head per query head (24) uses 1.611 GB, six times as much." />
  <figcaption>For this GQA layout, raw KV payload scales linearly with cached length. The displayed 4K tensor factors are $2 \times 16 \times 4 \times 256 \times 4{,}096 \times 2$ bytes. The 24-head MHA comparison isolates head-sharing storage savings; changing head counts on an existing checkpoint requires uptraining or distillation.</figcaption>
</figure>

> **Production note:** Qwen3.6-27B's BF16 language weights are about 54 GB, so they fit on one H100-80GB on paper. Your serving budget must still reserve the remaining HBM for KV cache, DeltaNet state, runtime buffers, <span data-glossary="prefix-cache">prefix cache</span>, optional vision-encoder weights, and allocator overhead. Expose its 262,144-token native window only when that budget leaves enough memory for active prompt-plus-output tokens.[^qwen3627b2026]

> **Try it yourself:** A colleague says a 7B model (32 layers, 8 KV heads, 128 head dimension, FP16) can serve 200 concurrent users on one 80 GB GPU. The weights take about 14 GB. Use the formula, then leave a runtime reserve, to test that claim.

<!-- leetllm: test, output=show -->
```python title="check-capacity-with-runtime-headroom.py"
def kv_gb_per_sequence(tokens: int) -> float:
    values = 2 * 32 * 8 * 128 * tokens
    return values * 2 / 1e9


users = 200
raw_total_gb = 14 + users * kv_gb_per_sequence(tokens=2048)
print(f"raw weights plus KV: {raw_total_gb:.2f} GB")
for reserve_gb in (8, 16):
    admitted = raw_total_gb + reserve_gb <= 80
    print(f"with {reserve_gb} GB runtime reserve: {admitted}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw weights plus KV: 67.69 GB
with 8 GB runtime reserve: True
with 16 GB runtime reserve: False
```
<!-- leetllm: output:end -->

Here 2,048 is each user's **total reserved prompt-plus-output length**. Raw weights plus KV leave a narrow margin. Whether 200 active sequences fit depends on measured activations, workspace, allocator behavior, and fragmentation for the serving engine. The `True` result only confirms that this arithmetic check passes under one reserve; validate concurrency and latency against the engine and its SLO.

```checkpoint
Why must the KV-cache formula use `num_key_value_heads` instead of `num_attention_heads` for GQA models?
---
GQA shares one K/V head across multiple query heads. The cache stores keys and values, not every query head, so using the full query-head count overestimates cache memory by the query-to-KV grouping factor.
```

---

## Dynamic token budgeting

<span data-glossary="context-window">Context length</span> sets the architecture limit. The deployable concurrency budget comes from leftover GPU memory after weights and runtime buffers, divided across active requests. One extra reserved token for request A leaves less room for request B.

When a request arrives, the engine estimates its prompt-plus-output KV demand. If that demand plus live cache exceeds remaining capacity, the scheduler must queue, reject, or preempt it. Track capacity and latency together so overcommit triggers the configured recovery path.

The function below divides an assumed **18 GB pool dedicated to growing K/V** equally among 50 users. It computes available whole 16-token blocks per user, then caps usable positions at the configured context limit, which may not be block-aligned. The pool must already exclude weights, runtime buffers, recurrent state at the intended concurrency, and other reservations. Replace both worksheet assumptions with the target engine's measured pool and page settings:

<!-- leetllm: test, output=show -->
```python title="dynamic-token-budgeting.py"
def max_context_for_budget(
    kv_pool_bytes: int, bytes_per_token: int, num_concurrent: int,
    block_tokens: int = 16, context_limit: int = 262_144,
) -> int:
    positive = (bytes_per_token, num_concurrent, block_tokens, context_limit)
    if any(x <= 0 for x in positive):
        raise ValueError("dimensions, concurrency, block size and limit must be positive")
    if kv_pool_bytes < 0:
        raise ValueError("KV pool must be nonnegative")
    blocks_per_user = kv_pool_bytes // (bytes_per_token * block_tokens * num_concurrent)
    return min(blocks_per_user * block_tokens, context_limit)


max_tokens = max_context_for_budget(
    kv_pool_bytes=18 * 10**9,
    bytes_per_token=2 * 16 * 4 * 256 * 2,
    num_concurrent=50,
)
print(f"max context per user: {max_tokens:,} tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
max context per user: 5,488 tokens
```
<!-- leetllm: output:end -->

This calculation gives a planning limit. Set a production limit after measuring activations, communication buffers, allocator slack, DeltaNet state, and serving-runtime behavior. If 100 users need 5,000 reserved tokens each and the budget falls short, options include additional memory, lower precision, fewer active tokens, or application caps.

> **Common mistake:** Plugging query heads into a KV formula. Qwen3.6-27B lists 24 query heads but 4 KV heads for its Gated Attention path.[^qwen3627b2026] Using 24 overestimates this cache by 6×. Read `num_key_value_heads` and the model's layer layout; using all 64 layers would also count 48 DeltaNet layers outside this growing-KV formula.

An online capacity check can reserve memory from each request's prompt-plus-output <span data-glossary="token-budget">token budget</span> instead of assuming every request consumes the maximum architectural context:

<!-- leetllm: test, output=show -->
```python title="reserve-request-by-token-budget.py"
BYTES_PER_TOKEN = 2 * 16 * 4 * 256 * 2


def reservation_bytes(tokens: int, block_tokens: int = 16) -> int:
    if tokens <= 0 or block_tokens <= 0:
        raise ValueError("reservation and block size must be positive integers")
    blocks = (tokens + block_tokens - 1) // block_tokens
    return blocks * block_tokens * BYTES_PER_TOKEN


def fits_kv_budget(existing_tokens: list[int], new_tokens: int, kv_budget_bytes: int) -> bool:
    if kv_budget_bytes < 0:
        raise ValueError("budget must be nonnegative bytes")
    reservations = existing_tokens + [new_tokens]
    needed = sum(reservation_bytes(tokens) for tokens in reservations)
    return max(reservations) <= 262_144 and needed <= kv_budget_bytes


active = [4096] * 40
print("fit 16K request:", fits_kv_budget(active, 16_384, kv_budget_bytes=12 * 10**9))
print("fit 64K request:", fits_kv_budget(active, 65_536, kv_budget_bytes=12 * 10**9))
assert reservation_bytes(17) == reservation_bytes(32)  # two blocks
assert fits_kv_budget([], 16, reservation_bytes(16))
assert not fits_kv_budget([], 17, reservation_bytes(16))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fit 16K request: True
fit 64K request: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/kv_pool_admission_dark.png" alt="A 12 GB pool limit is compared on one scale with 40 current 4,096-token reservations totaling 10,737,418,240 bytes. Adding 16,384 tokens reaches 11,811,160,064 bytes and fits; adding 65,536 reaches 15,032,385,536 bytes and exceeds the pool. Separately, 17 logical positions round to two 16-token pages: 32 allocated, with a 15-token unused tail." />
  <figcaption>Both bars share one byte scale over a 12 GB KV pool. The block grid shows per-sequence page rounding: 17 tokens round up into two 16-token pages.</figcaption>
</figure>

This reservation check rounds each sequence separately and assumes no shared prefix blocks. A serving allocator must also check and reserve atomically, enforce output limits, and release reservations on completion or cancellation. Budget retained prefix-cache blocks separately. Otherwise two requests can both pass against the same free bytes.

```checkpoint
Why must a production context cap account for more than the model-card window?
---
Every extra active token consumes KV-cache memory. Allowing every user to use the model's full architectural context can collapse concurrency, so production systems cap prompt length, output length, and active tokens based on GPU memory budgets and latency goals.
```

---

## Stop a new prefill from stalling live streams

Memory capacity and request scheduling solve two completely different failure modes. A request can easily fit within available HBM and still wreck your service level objectives (SLOs) if its compute-heavy prompt monopolizes a GPU running active decode streams.

This is a **generation stall**: a long prompt can hold up streams that are already generating.

### Chunked prefill: mitigating generation stalls

Consider a **scheduling trace** where one worker serves 32 active decode streams with 35 ms gaps. A new 8,192-token prompt occupies that worker exclusively for 200 ms before the next decode turn runs, stretching the active streams' gap spanning that work to 235 ms. In practice, total wall-clock stall time also reflects Tensor Core utilization and scheduler preemption rules on the target engine.

Chunked prefill gives the scheduler smaller units to place alongside decode work. A conceptual alternating schedule looks like this:

```text
Without chunked prefill (monolithic prefill blocks the worker):
  [Prefill 8,192 tokens ===========================] [Decode...Decode...Decode...]
  ↑ In the assumed exclusive-worker schedule, no decode turn occurs during prefill

With chunked prefill (chunk_size = 2,048 tokens):
  [Prefill chunk 1][Decode step][Prefill chunk 2][Decode step][Prefill chunk 3]...
  ↑ Smaller scheduling units create opportunities for decode turns; measure tail ITL
```

#### What chunking changes

Smaller prefill units can reduce the time an existing stream waits behind a prompt. The ITL outcome depends on step duration, offered load, K/V history, and preemption. Small chunks can add scheduling or kernel overhead and increase the new request's TTFT; larger chunks can improve prefill efficiency while widening decode gaps.

Current vLLM V1 prioritizes pending decodes, then fits prefill chunks into the remaining batched-token budget **in the same batch**.[^vllm2026optimization] Sarathi likewise studies decode-maximal batches containing a prefill chunk and decode requests.[^agrawal2023] The alternating trace isolates the scheduling idea. Engine-specific mixed-batch behavior needs a trace from the chosen implementation.

<!-- leetllm: test, output=show -->
```python title="interleave-prefill-with-active-decode.py"
def chunked_schedule(prompt_tokens: int, chunk_tokens: int) -> list[str]:
    if prompt_tokens < 0 or chunk_tokens <= 0:
        raise ValueError("prompt length must be nonnegative and chunk size positive")
    actions: list[str] = []
    remaining = prompt_tokens
    while remaining:
        processed = min(chunk_tokens, remaining)
        actions.append(f"prefill {processed}")
        remaining -= processed
        actions.append("decode active streams")
    return actions


for action in chunked_schedule(prompt_tokens=6144, chunk_tokens=2048):
    print(action)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prefill 2048
decode active streams
prefill 2048
decode active streams
prefill 2048
decode active streams
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/prefill_scheduling_dark.png" alt="In the 32-stream schedule, an exclusive 8,192-token prompt prefill occupies 200 ms before an active stream gets its normal 35 ms decode gap, so that stream waits 235 ms between tokens. A separate logical turn rail splits a 6,144-token prompt into three 2,048-token chunks and alternates P1, D1, P2, D2, P3, D3." />
  <figcaption>The 235 ms gap belongs to an assumed exclusive-prefill schedule. The lower rail shows logical chunk/decode turn order only; it assigns no duration to a chunk.</figcaption>
</figure>

This trace gives logical turns without kernel timings. A 2,048-row prefill chunk and 32 one-row decode requests have different work and reuse, so token counts alone cannot compare their durations. Decode context lengths and model architecture also matter; profile the chosen workload rather than treating a token cap as a fixed step duration.

```checkpoint
Why does chunked prefill improve tail latency for existing decode streams?
---
If a monolithic prefill delays decode on a shared worker, smaller prompt chunks give the scheduler opportunities to run decode sooner. Mixed batches can also combine chunks and decode rows. This can improve tail ITL, with actual latency depending on chunk cost, history lengths, engine scheduling, and offered load.
```

### Prefill-decode disaggregation (Splitwise & DistServe)

Chunking can soften interference while both phases still share resources. Disaggregation is another candidate when prompt traffic and streaming demand have different resource or latency needs.

A colocated worker generally uses one model-sharding configuration for both phases. That configuration may not be optimal for both:

- **Prefill:** Larger token-row counts can amortize cross-GPU communication, so sharding may reduce prompt-processing time.
- **Decode:** Communication can dominate small steps, but sharding can also spread weight and K/V reads across more memory bandwidth, or make the model fit at all. Larger batches change this balance.

There is no universal rule that prefill needs TP=8 and decode needs TP=1. Sweep parallelism on the actual model, interconnect, context distribution, and batch sizes. More GPUs can improve decode too; account for their cost.

**Prefill-decode disaggregation** assigns the phases to separate workers, enabling independent resource allocation. Splitwise,[^patel2023] DistServe,[^zhong2024] and Mooncake[^qin2024] explore this design:

1. **Prefill pool:** Processes prompts using a measured configuration and produces state for response extension.
2. **Decode pool:** Extends responses with its own capacity, batching, and sharding choices.
3. **State handoff:** Transfers compatible state and request metadata over the available interconnect. A hybrid model may need recurrent state as well as K/V. The receiving worker must finish the handoff and schedule generation; takeover is not instantaneous.

<figure>
  <img src="illustrations/_generated/state_handoff_dark.png" alt="Separate prefill and decode worker pools hand off compatible KV state, request metadata, and any needed recurrent state. A bandwidth-only estimate isolates raw K/V payload: 4K is 0.268 GB and takes at least 10.7 ms; 64K is 4.295 GB and takes at least 171.8 ms over an ideal 25 GB/s (200 Gbps) link. State serialization, network overhead, and scheduling are outside these payload-only floors." />
  <figcaption>The handoff covers compatible state and metadata between independently configured pools. The lower bounds include only raw K/V payload at an ideal 25 GB/s; they omit recurrent state and other work.</figcaption>
</figure>

#### The disaggregation trade-off

Separate GPU pools remove direct competition between those workers' prefill and decode compute. They can still encounter queueing, memory pressure, handoff delays, and shared-network contention. Separation also permits independent scaling, but scheduling and communication determine whether both latency SLOs improve.

An ideal lower bound for serialized payload transfer is:

$$
T_{\text{transfer}} \ge \frac{\text{Payload Size (bytes)}}{\text{Interconnect Bandwidth (bytes/sec)}}
$$

Consider an otherwise idle 200 Gbps network link (which provides an ideal throughput of $200 \times 10^9 / 8 = 25 \text{ GB/s}$):

- For a **4,096-token prompt**, our example's raw K/V payload is $0.268$ GB, requiring at least $10.7$ ms at 25 GB/s. This omits Qwen's recurrent state and handoff overhead. The transfer affects the new request; the earlier 200 ms stall affected existing streams. Compare both paths' full critical paths to measure net latency impact.
- For a **65,536-token prompt**, the same raw K/V calculation gives $4.295$ GB and at least $171.8$ ms over 200 Gbps (about 86 ms over 400 Gbps). These estimates cover payload transmission at the stated bandwidth; actual handoff time also depends on other state and system overhead.

Prompt bursts and tight streaming SLOs motivate testing separation. Whether it improves goodput depends on phase demand, state-transfer cost, worker capacity, and the interconnect. Compare against a tuned colocated scheduler under the same offered workload and resource budget.

First calculate a lower bound on moving the growing-KV payload. This example assumes an otherwise idle 200 Gbit/s link: divide by eight to get 25 GB/s. It excludes protocol overhead, contention, layout conversion, and any additional recurrent state. Larger prompts increase both transfer bytes and the memory needed at the destination.

<!-- leetllm: test, output=show -->
```python title="compare-disaggregation-overhead.py"
bytes_per_token = 2 * 16 * 4 * 256 * 2
link_bytes_per_s = 200 * 10**9 / 8
for prompt_tokens in (4096, 65_536):
    payload_bytes = prompt_tokens * bytes_per_token
    lower_bound_ms = 1000 * payload_bytes / link_bytes_per_s
    print(f"{prompt_tokens:,} tokens: {payload_bytes / 1e9:.3f} GB, "
          f"at least {lower_bound_ms:.1f} ms transfer")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
4,096 tokens: 0.268 GB, at least 10.7 ms transfer
65,536 tokens: 4.295 GB, at least 171.8 ms transfer
```
<!-- leetllm: output:end -->

```checkpoint
When is prefill-decode disaggregation worth its extra KV-transfer cost?
---
It's a candidate when prefill bursts hurt streaming latency or prompt and decode demand scale differently. Compare both layouts under the same offered workload: new-request TTFT, active-stream ITL, SLO-compliant goodput, quality, and total hardware cost. A transfer-time estimate is only a lower bound; the full load sweep decides whether separation wins.
```

### KV cache quantization

If cache capacity, rather than latency interference, is the failing resource, reduce bytes per cached value. An 8-bit format such as FP8 uses about half the raw payload of FP16/BF16. Research systems also explore 3-bit and 2-bit caches, but quality and kernel support are model-, hardware-, and engine-specific.[^hooper2024][^liu2024kivi] vLLM documents FP8 KV-cache configuration and calibration.[^vllm2026kvquant] See our [model quantization deep-dive](/learn/model-quantization-gptq-awq-gguf) for weight and activation trade-offs:

$$
\text{KV Cache (8-bit)} = \frac{\text{KV Cache (FP16/BF16)}}{2}
$$

An 8-bit K/V payload uses 1 byte per value instead of 2, so raw cache bytes are halved for the same sequence length and concurrency. Scaling metadata, padding, and runtime buffers mean allocated memory savings can be smaller.

Weight quantization shrinks static model memory. KV quantization targets dynamic per-request state. With a fixed leftover KV budget and no other per-request costs, halving bytes doubles continuous capacity, with integer rounding per request. Static weights reduce that leftover budget but don't by themselves reduce this ratio. Unquantized recurrent state, metadata, page slack, other per-request memory, and latency constraints can reduce the realized concurrency gain.

The following planning example reuses Qwen3.6-27B-style GQA dimensions. Each active user reserves 5,120 prompt-plus-output tokens of FP16 KV state. The budget is the 18 GB left after 54 GB of language weights and an 8 GB runtime reserve on one 80 GB GPU:

<!-- leetllm: test, output=show -->
```python title="estimate-kv-quantization-gain.py"
def users_from_kv_budget(kv_budget_bytes: int, bytes_per_user: int) -> int:
    if kv_budget_bytes < 0 or bytes_per_user <= 0:
        raise ValueError("budget must be nonnegative and per-user bytes positive")
    return kv_budget_bytes // bytes_per_user


tokens_per_user = 5120
fp16_bytes_per_user = 2 * 16 * 4 * 256 * tokens_per_user * 2
fp8_bytes_per_user = fp16_bytes_per_user // 2
kv_budget_bytes = (80 - 54 - 8) * 10**9

print(f"KV budget after weights and reserve: {kv_budget_bytes / 1e9:.0f} GB")
print("FP16 users from remaining KV budget:", users_from_kv_budget(kv_budget_bytes, fp16_bytes_per_user))
print("FP8 users from remaining KV budget:", users_from_kv_budget(kv_budget_bytes, fp8_bytes_per_user))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KV budget after weights and reserve: 18 GB
FP16 users from remaining KV budget: 53
FP8 users from remaining KV budget: 107
```
<!-- leetllm: output:end -->

The 53-versus-107 result follows from cache-payload arithmetic. Before enabling FP8 for Qwen, verify the exact engine, attention backend, layer types, scale calibration, and GPU support. Compare task quality and long-context behavior against the original precision, then benchmark latency because cache storage and kernel speed depend on different mechanisms.[^vllm2026kvquant]

Now test a short-context case where hybrid state dominates. Qwen3.6-27B has 48 DeltaNet layers with 48 value heads and 128-dimensional keys and values.[^qwen3627b2026] Transformers' fallback implementation keeps one FP32 recurrent matrix of shape `[batch, value_heads, key_dim, value_dim]` per DeltaNet layer.[^transformers2026Qwen35State] For one sequence, those matrices alone occupy $48\times48\times128\times128\times4=144$ MiB. Their size doesn't depend on the number of consumed tokens. Convolution state and other allocations add more bytes.

Halving only the growing K/V cache at 128 cached positions saves surprisingly little capacity when the 144 MiB recurrent matrix stays constant inside an 8 GiB per-request state pool:

<!-- leetllm: test, output=show -->
```python title="count-hybrid-state-before-promising-double-concurrency.py"
mib = 2**20
recurrent_bytes = 48 * 48 * 128 * 128 * 4
kv_bytes = 2 * 16 * 4 * 256 * 128 * 2
state_pool = 8 * 2**30
full_state = recurrent_bytes + kv_bytes
half_kv_state = recurrent_bytes + kv_bytes // 2
before, after = state_pool // full_state, state_pool // half_kv_state

assert recurrent_bytes == 144 * mib
assert kv_bytes == 8 * mib
assert before * full_state <= state_pool < (before + 1) * full_state
assert after * half_kv_state <= state_pool < (after + 1) * half_kv_state
print(f"Per sequence: recurrent={recurrent_bytes // mib} MiB, growing KV={kv_bytes // mib} MiB")
print(f"Only KV halved: total state {full_state // mib} -> {half_kv_state // mib} MiB")
print(f"Pool capacity: {before} -> {after} sequences ({after / before:.2f}x)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Per sequence: recurrent=144 MiB, growing KV=8 MiB
Only KV halved: total state 152 -> 148 MiB
Pool capacity: 53 -> 55 sequences (1.04x)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/hybrid_state_quantization_dark.png" alt="At 128 positions in an 8 GiB per-sequence-state pool, 144 MiB of recurrent state plus 8 MiB of FP16 KV totals 152 MiB. Halving only KV changes the total to 148 MiB and capacity from 53 to 55 sequences, 1.04 times. A separate KV-only 18 GB pool at 5,120 tokens per user gives 53 FP16 users and 107 8-bit users." />
  <figcaption>The first scale includes 144 MiB of recurrent state per active sequence, so halving the 8 MiB KV portion raises capacity only from 53 to 55. The separate 18 GB example excludes recurrent state and keeps the original code's 53-to-107 KV-only count.</figcaption>
</figure>

The result is 53 to 55 sequences, rather than a doubling. Recurrent state is fixed **per active sequence**, so it must scale with concurrency in the memory budget. This arithmetic covers the stated cache and recurrent-state assumptions. A Qwen memory estimate also depends on state dtype, sharding, stored checkpoints, convolution buffers, allocator choices, and the engine's FP8 backend. Use the chosen implementation's actual allocations to replace these counts.

```checkpoint
Why can KV-cache quantization improve concurrency even if model weights are already quantized?
---
Weight quantization shrinks the static model footprint. KV-cache quantization shrinks per-token, per-request state, which is the dynamic memory cost that grows with context length and concurrent users.
```

---

## Build a serving budget

For a real serving budget, record hardware and engine, model and precision, prompt/output distribution, arrival process, concurrency, correctness result, and measured HBM/compute counters. Then report weight memory, KV bytes per token, TTFT and ITL p50/p99, raw throughput, and goodput under the product SLO. The first release constraint should be visible as compute, bandwidth, capacity, or an unmodeled overhead.

Run a load sweep with a fixed prompt/output mix and explicit arrival rate, including bursts and overload. Report completed, failed, cancelled, and rejected requests alongside latency and output-token throughput. Define goodput as qualifying requests per second under the chosen correctness and latency requirements, divided by the full measurement duration. Report the fraction of offered requests that qualify too; don't omit failures from that fraction. Compare client and server clocks, check cache occupancy and queue growth, then vary one scheduling or memory setting at a time.

Pair the CPU capacity and scheduling calculations above with a real GPU serving run to confirm sustained bandwidth, FP8 accuracy, and safe concurrency under live traffic.

The blank first wait is a different interval from the later token gaps. Long prefill and low-batch decode sit on different roofs, and a KV formula can become a concurrency limit. The head count in that formula is still an input. Why a model stores fewer KV heads than query heads changes both the memory bill and the bytes each new token reads.

```mastery-quiz
[
  {
    "question": "A request arrives at time zero and its token timestamps are [250,290,335,370] ms. What are its TTFT, TPOT and decode TPS?",
    "options": [
      "250 ms, 40 ms and 25 tokens/s.",
      "370 ms, 92.5 ms and about 10.8 tokens/s.",
      "40 ms, 250 ms and 4 tokens/s.",
      "250 ms, 120 ms and about 8.3 tokens/s."
    ],
    "answer": "250 ms, 40 ms and 25 tokens/s.",
    "explanation": "The three decode gaps are 40,45,35 ms, totaling 120 ms. Their mean is 40 ms and 3/0.120=25 tokens/s. The first 250 ms is TTFT and stays outside decode pacing."
  },
  {
    "question": "An accelerator specification lists 1,200 sparse BF16 TFLOPS, with a 2× sparse-to-dense factor, and 2 TB/s HBM bandwidth. Which dense roof and ridge apply?",
    "options": [
      "1,200 TFLOPS and 600 FLOPs/byte.",
      "600 TFLOPS and 300 FLOPs/byte.",
      "600 TFLOPS and 600 FLOPs/byte after halving bandwidth too.",
      "2 TFLOPS at every arithmetic intensity."
    ],
    "answer": "600 TFLOPS and 300 FLOPs/byte.",
    "explanation": "The dense compute roof is 1,200/2=600 TFLOPS. Physical bandwidth stays 2 TB/s. Their ratio is 300 FLOPs/byte; kernels may remain below this upper bound."
  },
  {
    "question": "A team deletes all cached K/V tensors after each emitted token to free GPU memory, but wants identical autoregressive outputs. What computational consequence follows?",
    "options": [
      "Each decode step can use only the newest token, because model weights permanently encode the request prefix.",
      "Each decode step must recompute K/V for the full prior prefix, trading lower cache memory for repeated work.",
      "Prefill becomes unnecessary, because deleting the cache lets decode process the whole prompt in parallel.",
      "Only the K/V write is repeated; attention can still read the deleted prefix state from model weights."
    ],
    "answer": "Each decode step must recompute K/V for the full prior prefix, trading lower cache memory for repeated work.",
    "explanation": "The model still needs key and value tensors for earlier tokens when the newest token attends to its prefix. If those tensors are deleted, they must be regenerated by processing the prior prefix again. The KV cache avoids that repeated computation by retaining the historical K/V state, at the cost of memory that grows with sequence length."
  },
  {
    "question": "A full-attention decode stream grows from 4,000 cached tokens to 32,000 while model weights, batch size, and hardware stay fixed. Its inter-token latency rises. Which mechanism best explains the slowdown?",
    "options": [
      "The model allocates a new copy of its weights for every generated token, so the static weight footprint grows with context length.",
      "The engine repeats the entire prefill phase before every output token, even though the historical K/V tensors remain cached.",
      "Each decode step reads a longer K/V prefix, increasing cache memory traffic even though the model weight footprint is unchanged.",
      "The tokenizer becomes more expensive after every emitted token because it must retokenize the full prompt and response."
    ],
    "answer": "Each decode step reads a longer K/V prefix, increasing cache memory traffic even though the model weight footprint is unchanged.",
    "explanation": "Caching avoids recomputing old K/V projections, but full attention for the newest token still reads keys and values from the growing prefix. That extra HBM traffic can raise inter-token latency as context grows. The weights don't grow, and a working KV cache avoids rerunning full prefill on every step."
  },
  {
    "question": "A hybrid model has 48 layers. Of these, 12 use full attention and the rest use fixed-size recurrent state. Each attention layer has 8 KV heads with a head width of 64. One request has 8,192 cached positions, with 2 bytes per element. How many bytes does its raw KV cache occupy?",
    "options": [
      "805,306,368 bytes",
      "201,326,592 bytes",
      "100,663,296 bytes",
      "402,653,184 bytes"
    ],
    "answer": "201,326,592 bytes",
    "explanation": "At each position, one attention layer stores 8 × 64 elements for keys and the same number for values. At 2 bytes per element, that is 2,048 bytes per layer. Across 12 layers and 8,192 positions, the cache uses 201,326,592 bytes. Counting all 48 layers gives 805,306,368 bytes. Counting just the keys gives 100,663,296 bytes. Applying the 2-byte element width twice gives 402,653,184 bytes."
  },
  {
    "question": "A worker has a dedicated 2 GB KV pool (2 billion bytes). Each reserved position costs 24,576 bytes. Sixteen active requests each reserve 4,096 positions. One new request would reserve either 8,192 or 32,768 positions. For each alternative in that order, what is the total reserved memory to the nearest 0.001 GB, and does it fit?",
    "options": [
      "0.201 GB and 0.805 GB. Either reservation fits.",
      "3.423 GB and 4.027 GB. Neither reservation fits.",
      "1.812 GB and 2.416 GB. Only the smaller reservation fits.",
      "1.812 GB and 2.617 GB. Only the smaller reservation fits."
    ],
    "answer": "1.812 GB and 2.416 GB. Only the smaller reservation fits.",
    "explanation": "The active requests hold 16 × 4,096 = 65,536 positions. Adding the smaller request gives 73,728 positions. Adding the larger one to the same starting total gives 98,304. At 24,576 bytes each, the totals round to 1.812 GB and 2.416 GB, on opposite sides of the 2 GB limit. The 0.201 GB and 0.805 GB totals count just the newcomer. The 3.423 GB and 4.027 GB totals count the active reservations twice. The 2.617 GB total adds both newcomers to the pool."
  },
  {
    "question": "A single decode stream reads 40 GB of weights per output token. Peak HBM bandwidth is 2,400 GB/s. If the stream uses all of that bandwidth for weight reads, what is its token-rate ceiling?",
    "options": [
      "120 tokens/s",
      "30 tokens/s",
      "16.7 tokens/s",
      "60 tokens/s"
    ],
    "answer": "60 tokens/s",
    "explanation": "Each second has a budget of 2,400 GB. It covers 2,400 ÷ 40 = 60 weight reads, one per token. A rate of 120 tokens/s would require two tokens per read. Charging for two full reads per token gives 30 tokens/s. One read takes about 16.7 milliseconds, so 16.7 is a time per token. Cache traffic and other overhead can lower the measured rate."
  },
  {
    "question": "A chat has just emitted a token. On the same worker, a new prompt needs four prefill chunks of 20 ms each. Each decode turn takes 12 ms and emits one token for the chat. The worker runs one operation at a time with no gaps between operations. Which schedule finishes prefill and keeps every gap between the chat’s tokens at or below 40 ms?",
    "options": [
      "Run the four chunks in a row, then resume decode.",
      "Run two chunks in a row before each pair of decode turns.",
      "Alternate one prefill chunk with one decode turn until prefill finishes.",
      "Run one decode turn, then the four chunks in a row before resuming decode."
    ],
    "answer": "Alternate one prefill chunk with one decode turn until prefill finishes.",
    "explanation": "With one chunk between decode turns, the chat waits 20 + 12 = 32 ms for its next token. Two consecutive chunks push a gap to 52 ms. Four consecutive chunks push it to 92 ms. Giving decode the first turn delivers one token after 12 ms, but the next gap still reaches 92 ms. Splitting the prompt creates opportunities to run decode. The order determines whether the chat gets those turns in time."
  },
  {
    "question": "Chat A is streaming when the shared worker spends 95 ms on prefill for request B. A has a decode turn ready throughout that wait. In a replay on separate workers, B emits its first token, copies its state for 20 ms, then starts decoding its second token. Which interpretation should the team use when comparing the traces?",
    "options": [
      "Credit A with a 75 ms shorter token gap after subtracting the copy time from the shared-worker delay.",
      "Charge the 95 ms wait to B’s first-token latency and the 20 ms copy to A’s next token gap.",
      "Charge the 95 ms wait to A’s next token gap and the 20 ms copy to B’s first-token latency.",
      "Charge the 95 ms wait to A’s next token gap and the 20 ms copy to B’s gap between tokens one and two."
    ],
    "answer": "Charge the 95 ms wait to A’s next token gap and the 20 ms copy to B’s gap between tokens one and two.",
    "explanation": "A waits for its next decode turn while B holds the shared worker. In the replay, B has already emitted its first token when its state starts moving. The copy delays B’s second token. Charging the copy to B’s first-token latency places it before it happened. Charging the wait to B and the copy to A swaps the affected requests. The 75 ms subtraction combines two requests’ clocks. To choose a layout, compare first-token waits, tail gaps, correct on-time replies per second, and total cost under the same offered load."
  },
  {
    "question": "An inference service uses quantized weights and stores its keys and values in BF16 (16 bits per element). Long chats fill the KV pool, so the service rejects new chats even though active chats meet their latency targets. The engine supports each change below. Which change would reduce the raw KV bytes per chat at the same reserved length?",
    "options": [
      "Store keys and values at 8 bits per element.",
      "Store the model weights at a lower precision.",
      "Use half as many positions per KV cache page.",
      "Process half as many prompt tokens per prefill chunk."
    ],
    "answer": "Store keys and values at 8 bits per element.",
    "explanation": "Moving keys and values from 16 to 8 bits takes each element from 2 bytes to 1. At the same length, that halves the raw KV payload. Smaller weights can free space for the pool. Smaller pages can reduce unused slots, and smaller prefill chunks can give active chats more decode turns. Each of those changes leaves the bytes per stored KV element intact. Recurrent state, scales, and page padding can limit the capacity gain. Calibrate the 8-bit format and check quality and latency on the same requests."
  }
]
```

> **Next:** Continue to [Multi-Query & Grouped-Query Attention](/learn/multi-query-grouped-query-attention).
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
Your phone buzzes. Users say the assistant feels slow. You open the dashboards and find no errors, a healthy request rate, and GPUs that look busy. A colleague insists the model is fine. A customer sends a screen recording: the chat window sits blank for several seconds, then the reply arrives in uneven bursts.

They're both right, and that is the problem. "Slow" is at least two different complaints, and they come from two different phases of the same request. The wait before the first token and the rhythm of the tokens after it have different causes and different fixes, and a change that improves one can make the other worse. If you can't tell them apart, you'll spend the afternoon tuning the wrong thing.

This chapter follows one request through a serving system. You've already seen what a single token step computes in the [model and decoding chapters](/learn/decoding-strategies-greedy-beam-nucleus). Now that step has to run on real hardware, sharing finite memory and compute with everyone else's requests. By the end you'll be able to read a latency trace, explain why the same GPU hits a different wall in each phase, and work out how many users fit on a machine before you buy one.

## Two clocks, not one

Start with a healthy trace from a single request. It arrives at time zero, and four tokens come back at 320, 355, 392, and 428 milliseconds. Look at the shape of those numbers: one long wait, then a steady beat.

That first wait is the **time to first token**, or TTFT. It runs from the moment you decide the request started to the first output token you observe. Here it's 320 ms. In your customer's recording, the same clock ran for several seconds.

The later gaps of 35, 37, and 36 ms are **inter-token latencies**. They're the rhythm of the stream, steady in this trace and uneven in the recording. People often summarize them as **time per output token**, or TPOT, which is the mean gap after the first token. For $O>1$ outputs observed at times $t_1,\ldots,t_O$:

$$
\operatorname{TPOT}=\frac{t_O-t_1}{O-1},\qquad
\operatorname{decode\ rate}=\frac{O-1}{t_O-t_1}.
$$

Our trace gives a TPOT of 36 ms, which is a decode rate of about 27.8 tokens per second. Now watch what happens if you take the same four tokens and divide by the full 428 ms. You get 9.35 tokens per second. Neither number is wrong, because they answer different questions, and a single rate can be quoted either way. When someone tells you a tokens-per-second figure, ask for the numerator and the interval, because the name alone doesn't tell you what was measured.

| Clock metric | From trace `[320, 355, 392, 428]` ms | Value |
|---|---|---|
| TTFT | First token arrival $t_1$ | **320 ms** |
| Inter-token gaps | $[355-320,\; 392-355,\; 428-392]$ | **35, 37, 36 ms** |
| TPOT | $(428 - 320) / 3$ | **36.0 ms** |
| Decode rate | $3 / 0.108\text{ s}$ | **27.8 tokens/s** |
| End-to-end rate | $4 / 0.428\text{ s}$ | **9.35 tokens/s** |

<figure>
  <img src="illustrations/_generated/latency_breakdown_dark.png" alt="On a linear 0–428 ms request clock, token 1 at 320 ms ends TTFT. A separately scaled decode inset shows tokens at 320, 355, 392, and 428 ms, with gaps of 35, 37, and 36 ms. The 108 ms decode window averages 36 ms per token and 27.8 tokens/s; all four tokens over 428 ms give 9.35 tokens/s." />
  <figcaption>One request, two clocks. Three quarters of this request's time passes before the first token. The rate you quote depends on whether you count that wait: 27.8 tokens/s over the decode window, or 9.35 tokens/s over the whole request.</figcaption>
</figure>

Two measurement traps are easy to miss, so deal with them before you trust a dashboard.

The first is where the clock starts. A client measures TTFT from when the user pressed Send, so its number includes serialization, the network, proxy buffering, and rendering. A server measures from some internal event, and whether that event comes before or after tokenization and queueing depends on the code. vLLM's metrics documentation, for example, starts its front-end arrival time when tokenization begins.[^vllm2026metrics] It's easy to burn days comparing a client number with a server number, arguing over a difference that was only ever the network.

The second is what one event contains. If your server streams chunks, a chunk holding four tokens gives you one arrival time, not four. Dividing that gap by four and calling the result inter-token latency invents timings you never saw. Report chunk gaps as chunk gaps. And watch for one-token replies, which have no later gap at all, so their TPOT is undefined. vLLM's Prometheus histogram records them as zero while its benchmark tool skips them, so a shift toward one-token replies can lower your mean with no change in decode speed.[^vllm2026metrics]

## Prefill reads the whole prompt

So what happens during those 320 ms? Part of it may be queueing, which we'll return to. The rest is **prefill**: the model processing your prompt. (This is a different idea from the [assistant prefill](/learn/supervised-fine-tuning-pipeline), where you write the start of a reply.)

A prompt has many tokens, and the model already knows all of them. There's nothing to wait for, so it can process them together. The causal mask still keeps each position from seeing later ones, which means the result is the same as feeding tokens one at a time, but the work runs as one large matrix operation. The last position's output gives the scores for the first new token.

Here's the part that matters for hardware. Prefill multiplies a matrix of token rows by the layer's weights, and every row reuses those same weights. Read a block of weights into the GPU's fast memory once, and it serves hundreds or thousands of rows. Long prompts are expensive, but they're efficient: you do a lot of arithmetic for each byte you move.

A longer prompt usually means a longer TTFT, but don't jump from "TTFT is high" to "the prompts are too long." Queueing, a prefix cache hit, a batching decision, or the network can each dominate. Split queue time from processing time wherever your instrumentation allows it.

## Decode adds one token at a time

Once the first token exists, the character of the work changes completely. Each **decode** step feeds in only the newest token, computes its keys and values, reads the history, and produces the next token.

To avoid recomputing the history at every step, the model keeps the keys and values it has already computed. That store is the **KV cache**, and it's what makes decode affordable. Here's a detail that trips people up when they count it: the cache holds tokens the model has *consumed*, and the newest prediction hasn't been consumed yet.[^hfCacheExplanation2026]

Walk through a four-token prompt. Prefill caches four positions and emits $y_1$. Consuming $y_1$ grows the cache to five and emits $y_2$. Consuming $y_2$ grows it to six and emits $y_3$. So after three outputs the cache holds six positions, not seven.

<figure>
  <img src="illustrations/_generated/inference_pipeline_dark.png" alt="Full-attention example: prefill consumes four prompt tokens, caches four positions, and emits y1. Decode consumes y1, caches five positions, and emits y2. Consuming y2 caches six positions and emits y3. Batched decode can use matrix-matrix work." />
  <figcaption>The cache grows by one position per step, and it always trails the newest token by one. With P prompt tokens and O outputs, ordinary full attention holds P + O − 1 positions. Batching several requests turns each decode step from one row into many.</figcaption>
</figure>

For ordinary full attention with all history kept, the cached length is $P+O-1$. Sliding windows, hybrid architectures, and speculation change what's actually retained, so check the implementation when you use them.

Notice what the cache does not do. It saves you from recomputing old keys and values, but each new query still has to read all of them. A longer history costs more on every step. The cache makes generation affordable, not free.

## The same GPU, two different walls

Now we can answer the question from the opening: how can a GPU look healthy while a user suffers?

Think about what limits a computation. Sometimes the arithmetic units are the bottleneck. Sometimes they're sitting idle, waiting for numbers to arrive from memory. A useful way to tell which situation you're in is **arithmetic intensity**: how many floating-point operations you perform for each byte you fetch. The **roofline model** turns that ratio into a speed limit.[^williams2009]

$$
\text{attainable FLOPs/s}\le
\min(\text{compute peak},\;\text{memory bandwidth}\times\text{intensity}).
$$

There are two roofs. At low intensity you're limited by how fast memory can deliver data. At high intensity you're limited by how fast the chip can multiply. They meet at a ridge, and real numbers make this concrete. NVIDIA lists the H100 SXM at 1,979 TFLOPS of BF16 compute and 3.35 TB/s of memory bandwidth, but that compute figure assumes structured sparsity, and the dense rate is half of it.[^nvidia2026h100][^nvidia2022hopper] Miss that footnote and your ridge is off by a factor of two.

<!-- leetllm: test, deps=numpy, output=show, id=reader-inference-roofline -->
```python title="compare-dense-and-sparse-roofs.py"
import numpy as np

sparse_bf16_tflops = 1979.0
dense_bf16_tflops = sparse_bf16_tflops / 2.0
bandwidth_tb_s = 3.35
intensities = np.array([1.0, 64.0, 2048.0], dtype=np.float64)
attainable_tflops = np.minimum(dense_bf16_tflops, bandwidth_tb_s * intensities)
assert dense_bf16_tflops == 989.5
dense_ridge = dense_bf16_tflops / bandwidth_tb_s
sparse_ridge = sparse_bf16_tflops / bandwidth_tb_s
share_of_peak = 100 * attainable_tflops[0] / dense_bf16_tflops
print(f"dense ridge: {dense_ridge:.1f} FLOPs/byte")
print(f"sparse ridge: {sparse_ridge:.1f} FLOPs/byte")
print(f"I=1 arithmetic rate / dense peak: {share_of_peak:.2f}%")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dense ridge: 295.4 FLOPs/byte
sparse ridge: 590.7 FLOPs/byte
I=1 arithmetic rate / dense peak: 0.34%
```
<!-- leetllm: output:end -->

Now place the two phases on that roof. For an idealized BF16 projection, each weight takes two bytes and serves $N$ token rows at about two FLOPs per row, so its weight-only intensity is about $N$ FLOPs per byte. A 2,048-token prefill reuses its weights across 2,048 rows and sits well to the right. Single-stream decode has one row, so its intensity falls to about one, way out on the sloped part of the roof. At intensity one, the bandwidth roof allows 3.35 TFLOPS, which is 0.34% of the chip's dense peak.

<figure>
  <img src="illustrations/_generated/dense_roofline_dark.png" alt="A logarithmic dense-BF16 H100 roofline rises from the 3.35 TB/s bandwidth ceiling and meets the 989.5 TFLOPS compute ceiling at 295.4 FLOPs per byte. At intensity 1, the bandwidth ceiling is 3.35 TFLOPS, 0.34% of dense peak. No measured throughput point is plotted. A weight tile reused across 64 activation rows illustrates why the weight-only intensity estimate increases with row count." />
  <figcaption>Long-prompt prefill tends to sit on the flat compute roof. Single-stream decode tends to sit far down the sloped memory roof. Batching decode moves it to the right, because the same weight reads now serve more rows.</figcaption>
</figure>

That 0.34% is easy to misread, so be careful with it. It compares arithmetic rates. It does not mean the GPU is 99.66% idle, and a utilization dashboard won't show it. This is how a busy GPU and a slow user coexist: the chip is working flat out to move weights around, with very little arithmetic to show for each byte.

> **Key insight:** Single-stream decode is slow because memory bandwidth, not Tensor Core math, is full. That is why reducing bytes moved (quantization) or amortizing weight reads across rows (batching) speeds up decode far more than adding raw FLOPs.

It also gives you a quick estimate worth keeping in your head. Suppose every weight gets read once per generated token. Then the most tokens you could produce per second is memory bandwidth divided by model size. Take Qwen3.6-27B, whose language weights come to about 54 GB in BF16.[^qwen3627b2026] On one H100, that's 3,350 GB/s divided by 54 GB, or about 62 tokens per second.

That's a ceiling for one stream, and an optimistic one. Peak bandwidth isn't sustained bandwidth, KV reads add traffic as the history grows, and the real set of active tensors differs from "every weight once." Still, in thirty seconds you've learned that, unless [speculative decoding](/learn/decoding-strategies-greedy-beam-nucleus) gets several tokens out of one pass over the weights, no amount of tuning will get this setup to 500 tokens per second on one stream. You've also learned why smaller weights can help decode directly. [Quantization](/learn/model-quantization-gptq-awq-gguf) comes back to this.

Batching is the other lever. Serve $B$ decode requests together and the weights get reused across $B$ rows, so weight-only intensity rises to about $B$. Total throughput can climb sharply. Each user's gaps may grow, though, because every step now carries more work. That trade-off runs through the rest of this part of the book. To find out where your own workload sits, record elapsed time, FLOPs, and actual memory traffic for one kernel or phase at a time. NVIDIA's Nsight Compute exposes counters for this, though profiling can perturb what it measures, so keep profiled kernel times separate from service latency.[^nsightCompute2026]

```checkpoint
A teammate says, "Decode only reaches 0.34% of peak FLOPs, so the GPU must be almost idle." What's wrong with that reasoning?
---
The 0.34% compares arithmetic rates at a low arithmetic intensity. It says nothing direct about idle cycles. The GPU can be fully occupied moving weights through memory while performing little arithmetic per byte. To learn where time goes, measure stall cycles and actual memory traffic for the phase.
```

## Count the bytes that grow

Speed is one wall. Memory is the other, and it's the one that turns a slow system into a failing one.

Each retained position stores a key and a value in every attention layer. For $B$ sequences of equal cached length $T$, the raw payload is

$$
M_{\mathrm{KV}}=2BLTn_{\mathrm{kv}}d_hs,
$$

where $L$ counts the attention layers with this cache layout, $n_{\mathrm{kv}}$ is the number of KV heads, $d_h$ is each head's width, and $s$ is the bytes per stored value. The leading two is for keys and values. If requests have different lengths, sum them. If layers have different layouts, sum those too.

Run it for Qwen3.6-27B, which has 16 attention layers, four KV heads, head width 256, and two-byte values. One cached position costs 65,536 bytes. A 4,096-position sequence costs a quarter of a GiB, and eight of them cost 2 GiB. That's before the weights, before the runtime, and before anyone's answer gets longer.

Why only 16 layers, when the model has 64? The other 48 are Gated DeltaNet layers, a linear-attention design that keeps a fixed-size state per request in place of a growing history.[^qwen3627b2026] They need their own budget, one that grows with users and not with context. How big? Transformers' fallback code keeps a four-byte matrix of 48 by 128 by 128 values in each of those layers, which comes to 144 MiB per request, whatever the context length.[^transformers2026Qwen35State] Engines can lay it out differently, so measure yours.

<figure>
  <img src="illustrations/_generated/kv_cache_scaling_dark.png" alt="A Qwen3.6-27B-style GQA cache has 16 attention layers, four KV heads, separate key and value vectors of 256 values at each of 4,096 positions, and two bytes per value: 268,435,456 bytes, or 0.268 GB and 0.25 GiB. Common-scale bars show FP16 and 8-bit growth at 2K, 4K, 6K, and 8K. At 4K, four shared KV heads use 0.268 GB; an ungrouped MHA layout with one KV head per query head (24) uses 1.611 GB, six times as much." />
  <figcaption>KV memory grows in a straight line with cached length. Head sharing has a far larger effect than most tuning: four shared KV heads use one sixth of the memory that a 24-head layout would. Only the 16 attention layers enter this formula.</figcaption>
</figure>

Here's the classic capacity-planning bug. This model has 24 query heads but only four KV heads, because grouped-query attention lets several query heads share one set of keys and values.[^ainslie2023] Plug in 24 and your estimate is six times too high. You'd buy hardware you don't need, or reject traffic you could have served. Using all 64 layers instead of the 16 attention layers makes it worse. Read `num_key_value_heads` and the layer layout from the model's configuration, and don't derive either from the hidden width. Head sharing is also part of what the model learned, so you can't change it by editing a spreadsheet. Changing it means transforming the model and evaluating it again.

> **Common mistake:** Plugging `num_attention_heads` (query heads) or total layer count (including linear-attention layers) into the KV formula inflates your capacity estimate by several times. Always read `num_key_value_heads` and the exact full-attention layer count from the model config.

| Memory item | Calculation | Result |
|---|---|---|
| Raw KV per position | $2 \times 16 \times 4 \times 256 \times 2$ | **65,536 bytes (64 KiB)** |
| One 4,096-position sequence | $4{,}096 \times 64\text{ KiB}$ | **0.25 GiB** |
| Eight 4,096-position sequences | $8 \times 0.25\text{ GiB}$ | **2.0 GiB** |
| Paged allocation (17 tokens, 16-token blocks) | $\lceil 17 / 16 \rceil = 2$ blocks | **32 allocated** (**15 unused tail slots**) |

## How many users fit on this machine?

Now you can answer the question your manager is actually asking.

Start with the memory on the device and subtract everything that isn't the growing cache: weights, temporary buffers, allocator metadata, cached prefixes, any recurrent state for hybrid layers. What's left is your KV pool. Suppose that leaves 18 GB for 50 concurrent users. Dividing it evenly gives each user a budget, in whole blocks of 16 positions.

<!-- leetllm: test, output=show, id=reader-inference-token-budget -->
```python title="dynamic-token-budgeting.py"
def max_context_for_budget(pool_bytes, bytes_per_token, users,
                           block_tokens=16, limit=262_144):
    block_bytes = bytes_per_token * block_tokens
    blocks_per_user = pool_bytes // (block_bytes * users)
    return min(blocks_per_user * block_tokens, limit)

for users in (50, 100):
    tokens = max_context_for_budget(
        18 * 10**9, 2 * 16 * 4 * 256 * 2, users
    )
    print(f"{users} users: {tokens:,} tokens each")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
50 users: 5,488 tokens each
100 users: 2,736 tokens each
```
<!-- leetllm: output:end -->

This model advertises a native context of 262,144 positions. On this budget, 50 concurrent users get about 5,500 each. The number on the model card is what the architecture allows. The number your users get comes from this division, and doubling your users halves it. Your options when it falls short are real ones: more memory, smaller weights, a lower-precision cache, fewer active tokens, or a product limit.

Here's what one of those options is worth. Take one 80 GB GPU with 54 GB of language weights and an 8 GB runtime reserve, which is where that 18 GB came from. If each active user reserves 5,120 positions, an 8-bit cache format doubles the users who fit, because each cached value takes one byte in place of two.

<!-- leetllm: test, output=show, id=reader-inference-kv-format -->
```python title="kv-format-users.py"
pool = (80 - 54 - 8) * 10**9
positions = 5120
recurrent = 48 * 48 * 128 * 128 * 4  # 144 MiB per user
for name, value_bytes in (("FP16", 2), ("FP8", 1)):
    cache = 2 * 16 * 4 * 256 * positions * value_bytes
    with_state = pool // (cache + recurrent)
    print(f"{name}: {pool // cache} users, {with_state} with state")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP16: 53 users, 36 with state
FP8: 107 users, 56 with state
```
<!-- leetllm: output:end -->

That's a limit on stored bytes, and the second column shows why it's only a limit. It charges each user the 144 MiB of recurrent state as well, because 53 users' worth is already 8 GB, the whole reserve. That state doesn't shrink with the cache format, so the doubling becomes about one and a half times. Scaling metadata, block slack, and latency pull the gain lower still, and the format needs kernel support and a quality check on your model before you count on it.[^vllm2026kvquant]

The cache also rounds up. Paged allocation hands out fixed-size blocks, so a 17-position sequence with 16-position blocks takes two blocks and strands 15 positions at its tail. That rounding is a good trade, because it avoids the need for one huge contiguous reservation per sequence, and it's the subject of the [next chapter](/learn/kv-cache-paged-attention-llm-serving).[^kwon2023]

The dangerous part is the future. A short prompt can ask for a long answer. If you only count what a request occupies right now, you'll happily accept work that runs out of memory halfway through a reply. Decide whether you reserve the output limit up front or accept requests incrementally and preempt some under pressure, and then test that decision under real cancellation and overload. Weight quantization and cache quantization are separate levers here too. Making the checkpoint smaller leaves each user's two-byte cache the same size, but it grows the pool that cache lives in: with about 14 GB of four-bit weights, this same card has about 58 GB for the cache where it had 18. The [quantization chapter](/learn/model-quantization-gptq-awq-gguf) works that out.

```checkpoint
You estimate KV memory with the 24 query heads from a model card. The model uses grouped-query attention with four KV heads. How far off is your estimate, and what's the operational cost?
---
It's six times too high, since storage scales with KV heads. You'd conclude that far fewer users fit than actually do, and you could buy too much hardware or reject traffic you could serve.
```

## One long prompt can freeze everyone

Memory and speed collide when requests share a device. Suppose one worker serves 32 active streams with 35 ms between tokens, and a new 8,192-token prompt arrives. If that prompt takes the worker for 200 ms, every one of those streams sees a gap of 235 ms. Nothing failed, and the prompt fits in memory. Thirty-two users just watched their replies stutter because of someone else's document, and that's one way to get the uneven bursts in your customer's recording.

This is a **generation stall**, and the standard fix is to process long prompts in smaller chunks so decode work gets a turn between them.[^agrawal2024sarathiServe] Smaller chunks protect running streams, but they can add overhead and delay the new request's first token. There's no free setting, which is why the [scheduling chapter](/learn/continuous-batching-request-scheduling) gets its own treatment.

Throughput deserves a warning here as well. It's a system-wide rate over some interval, and a configuration can serve more total tokens while making every user's experience worse. Whenever someone reports throughput, ask for the latency percentiles, the prompt and output lengths, the concurrency, the hardware, and the quality. Different traffic can rank the same configurations in the opposite order.

## Read the symptom first

When the pager goes off, begin with what users actually experience, then form a hypothesis you can test.

| Symptom | Start by checking | Likely culprits |
|---|---|---|
| Long wait, then a smooth stream | Queue time versus prefill time | Queueing, long uncached prompts, a cold worker |
| Fast start, then gaps that grow under load | Active streams and batch size | Decode competition, weight or KV memory traffic |
| Steady stream with occasional long stalls | Whether stalls line up with new prompts | Generation stalls from large prefills |
| Requests fail or pause under load | Cache occupancy and preemption counts | KV pool exhausted, outputs longer than planned |
| Busy GPUs, poor tokens per second | Memory traffic per phase | The memory roof, not the compute roof |

These are starting points, and you confirm them with measurements. That's the habit worth building: name the clock, name the resource, then measure.

You now have the vocabulary for everything that follows: two clocks, two roofs, and a growing pile of bytes. The [next chapter](/learn/kv-cache-paged-attention-llm-serving) looks closely at that pile. It follows logical attention history down to physical memory blocks, because that mapping is what decides how many requests you can really hold, and what happens when you run out.

<!-- leetllm: edition:reader:end -->
