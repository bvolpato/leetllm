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

Your phone buzzes. Users say the assistant feels slow. You open the dashboards and find zero errors, a healthy request rate, and GPUs that look busy. A colleague insists the model is fine. Then a customer sends a screen recording: the chat window sits blank for several seconds, and the reply arrives in uneven bursts.

Both observations are right, and that is the core puzzle of LLM serving. "Slow" bundles at least two distinct complaints coming from two different phases of the same request. The initial wait before the first token and the streaming cadence after it hit different hardware walls, respond to different optimizations, and often trade off against one another.

Here we trace one request through a GPU serving engine. You already know what a single forward step computes from [Decoding Strategies](/learn/decoding-strategies-greedy-beam-nucleus). Now that step has to share finite memory bandwidth, Tensor Core compute, and HBM capacity across live traffic. By the end you will read a latency trace cleanly, place prefill and decode on a GPU roofline, size a <span data-glossary="kv-cache">KV cache</span> pool accurately, and choose between chunked prefill, disaggregation, and cache quantization.

## Two clocks, not one

Start with a healthy trace from one request. It arrives at time `0 ms`, and four output tokens arrive at `320`, `355`, `392`, and `428 ms`. Look at the rhythm: one long pause, then a steady beat.

- **<span data-glossary="ttft">Time to First Token (TTFT)</span>:** Elapsed time from request arrival to the first observed output token ($t_1 - t_{\text{arrival}} = 320\text{ ms}$). Users feel this blank screen directly.
- **Inter-Token Latency (ITL):** Each consecutive gap after token 1 ($\text{ITL}_k = t_k - t_{k-1}$ for $k \ge 2$). Here the gaps are `35`, `37`, and `36 ms`. Tail ITL (p95/p99) exposes stuttering that averages hide.
- **Time Per Output Token (TPOT) and <span data-glossary="tokens-per-second">Decode TPS</span>:** Mean post-first-token gap and its per-request inverse for $O > 1$ output tokens:

$$
\text{TPOT} = \frac{t_O - t_1}{O - 1}, \qquad \text{Per-Request Decode TPS} = \frac{O - 1}{t_O - t_1}
$$

Those three decode gaps span `108 ms`, giving `TPOT = 36.0 ms` and a decode rate of $3 / 0.108 = \mathbf{27.8\text{ tokens/s}}$. Dividing all four tokens by the full `428 ms` gives an **end-to-end output rate** of $4 / 0.428 = \mathbf{9.35\text{ tokens/s}}$. Both rates are valid, and they answer different questions. Whenever someone quotes tokens per second, ask for the numerator, the interval, and whether they mean one stream or **aggregate cluster throughput** ($\sum \text{output tokens} / \Delta t_{\text{wall}}$).

| Clock metric | From trace `[320, 355, 392, 428]` ms | Value |
|---|---|---|
| TTFT | First token arrival $t_1$ | **320 ms** |
| Inter-token gaps (ITL) | `[355-320, 392-355, 428-392]` | **35, 37, 36 ms** |
| TPOT | $(428 - 320) / 3$ | **36.0 ms** |
| Decode rate (per-request TPS) | $3 / 0.108\text{ s}$ | **27.8 tokens/s** |
| End-to-end rate | $4 / 0.428\text{ s}$ | **9.35 tokens/s** |

<figure>
  <img src="illustrations/_generated/latency_breakdown_dark.png" alt="On a linear 0–428 ms request clock, token 1 at 320 ms ends TTFT. A separately scaled decode inset shows tokens at 320, 355, 392, and 428 ms, with gaps of 35, 37, and 36 ms. The 108 ms decode window averages 36 ms per token and 27.8 tokens/s; all four tokens over 428 ms give 9.35 tokens/s." />
  <figcaption>One request, two clocks. Three quarters of this request's wall time elapses before token 1. Decode speed is 27.8 tokens/s over the 108 ms decode window, whereas the end-to-end output rate over 428 ms is 9.35 tokens/s.</figcaption>
</figure>

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
    tps = 1000 / tpot if tpot is not None and tpot > 0 else None
    return {"ttft": times_ms[0] - arrival_ms, "itls": gaps,
            "tpot": tpot, "tps": tps}


m = token_metrics(0, [320, 355, 392, 428])
assert token_metrics(0, [])["ttft"] is None
assert token_metrics(0, [320])["tpot"] is None
assert token_metrics(0, [320, 320])["tps"] is None

print("TTFT:", m["ttft"], "ms")
print("decode ITLs:", m["itls"], "ms")
print(f"decode TPS: {m['tps']:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
TTFT: 320 ms
decode ITLs: [35, 37, 36] ms
decode TPS: 27.8
```
<!-- leetllm: output:end -->

Three subtle measurement traps break dashboards if left unchecked:

1. **Client vs. server clocks:** Client TTFT starts when the user hits Send (capturing transport, proxy buffering, and hidden reasoning tokens before visible text). Server TTFT starts at an internal hook: vLLM starts front-end `arrival_time` when tokenization begins.[^vllm2026metrics] Never compare mismatched clocks directly.
2. **Bundled streaming chunks and one-token replies:** If a server or speculative decoder delivers four tokens in one `40 ms` chunk, dividing by four gives a `10 ms` interval average rather than four observed token timestamps. Single-token replies have no post-first-token gap at all: vLLM's Prometheus histogram records `0` while `vllm bench serve` excludes them, so a traffic shift toward one-token answers can drop the histogram mean without speeding up decode.[^vllm2026metrics]
3. **Inverting mean TPOT is not mean TPS:** Across two streams with `10 ms` (`100 tok/s`) and `100 ms` (`10 tok/s`) TPOT, mean request TPS is $(100 + 10) / 2 = \mathbf{55.0\text{ tok/s}}$, whereas inverting the mean TPOT of `55 ms` gives $1{,}000 / 55 = \mathbf{18.2\text{ tok/s}}$. TPOT and TPS are reciprocals only for a single request.

```checkpoint
If users complain that nothing appears for a long time, which metric do you inspect first? What if streaming looks choppy after it starts?
---
Inspect TTFT first for a long initial pause, which points to queueing, tokenization, or prefill. Inspect ITL percentiles, TPOT, and TPS when streaming stutters after token 1 arrives, which points to decode bandwidth, batching, or prefill interference.
```

## Prefill and decode: two shapes on the same weights

Every autoregressive request passes through two distinct execution phases.[^hfCacheExplanation2026] A modern serving iteration can mix requests from both phases in one batch, yet each phase has a completely different tensor shape:

- **<span data-glossary="prefill">Prefill</span> (parallel prompt processing via GEMM):** All $N$ uncached prompt tokens are known upfront, so the model stacks them into an activation matrix $X \in \mathbb{R}^{N \times d_{\text{model}}}$, multiplies against weight matrices $W \in \mathbb{R}^{d_{\text{model}} \times d_{\text{out}}}$ using matrix-matrix multiplication (**GEMM**), writes $N$ Key and Value pairs into HBM, and samples token $y_1$. Every weight tile loaded from HBM is reused across $N$ token rows.
- **<span data-glossary="decode-phase">Decode</span> (autoregressive token extension via GEMV):** Once $y_1$ exists, generation proceeds one token at a time. At batch size 1, the input is a single $1 \times d_{\text{model}}$ row vector multiplied against each layer's weight matrix (**GEMV**). The model computes $(K_{y_t}, V_{y_t})$, appends it to the cached history, attends over all retained positions, and samples $y_{t+1}$.

Notice one counting rule that trips up capacity math: **the KV cache holds tokens the model has consumed, not the newest prediction.** Walk through a four-token prompt: prefill consumes 4 prompt tokens, caches 4 positions, and emits $y_1$. Step 1 consumes $y_1$, grows the cache to 5, and emits $y_2$. Step 2 consumes $y_2$, grows the cache to 6, and emits $y_3$. After $P$ prompt tokens and $O \ge 1$ outputs under ordinary full attention, the cache holds exactly **$P + O - 1$** positions.

<figure>
  <img src="illustrations/_generated/inference_pipeline_dark.png" alt="Full-attention example: prefill consumes four prompt tokens, caches four positions, and emits y1. Decode consumes y1, caches five positions, and emits y2. Consuming y2 caches six positions and emits y3. Batched decode can use matrix-matrix work." />
  <figcaption>The KV cache trails the newest emitted token by one position: after P prompt tokens and O outputs, ordinary full attention holds P + O - 1 cached positions. Batching multiple decode requests turns single-row GEMV back into multi-row matrix work.</figcaption>
</figure>

Different products feel these two clocks differently: real-time voice and code completion live or die on tail TTFT, conversational chat balances TTFT against smooth ITL, and offline batch pipelines maximize aggregate cluster TPS.

## The same GPU, two different walls

Now we can answer the opening mystery: how can a GPU look busy while streaming feels slow?

Every GPU kernel is bounded by either how fast Tensor Cores multiply or how fast HBM delivers bytes. **<span data-glossary="arithmetic-intensity">Operational (arithmetic) intensity</span>** $I$ measures floating-point operations performed per byte fetched from HBM:

$$
I = \frac{\text{FLOPs}}{\text{Bytes fetched from HBM}}
$$

The **<span data-glossary="roofline-model">roofline model</span>**[^williams2009] bounds attainable compute rate $P$ by the lower of two ceilings:

$$
P_{\text{measured}} \le \min\left(P_{\text{compute}}, \; I \times \text{BW}_{\text{HBM}}\right), \qquad I_{\text{ridge}} = \frac{P_{\text{compute}}}{\text{BW}_{\text{HBM}}}
$$

Check hardware specs carefully before plotting the ridge. NVIDIA lists the H100 SXM at **1,979 TFLOPS BF16 with structured sparsity** and **3.35 TB/s** HBM bandwidth.[^nvidia2026h100][^nvidia2022hopper] Structured sparsity doubles the dense rate, so dense BF16 peak is $1{,}979 / 2 = \mathbf{989.5\text{ TFLOPS}}$, putting the dense ridge point at $989.5 / 3.35 = \mathbf{295.4\text{ FLOPs/byte}}$ (missing that footnote puts your ridge off by $2\times$!).

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

For a BF16 linear projection serving $N$ token rows, each 2-byte weight executes $2N$ multiply-add FLOPs, giving a weight-only operational intensity of $I \approx N$ FLOPs/byte:

- **Long-prompt prefill ($N = 2{,}048$):** Reuses each weight tile across thousands of rows, sitting well right of the ridge on the flat **compute roof**.
- **Single-stream decode ($B = 1$):** Reads every active weight for a single row ($I \approx 1$ FLOP/byte), pinning performance on the sloped **memory-bandwidth roof** at just `3.35 TFLOPS`, or **0.34%** of dense compute peak.
- **Batched decode ($B = 64$):** Stacks 64 active requests into a $64 \times d_{\text{model}}$ activation matrix, reusing each weight tile across 64 rows ($I_{\text{weight-only}} \approx 64$) to lift aggregate throughput until KV reads and per-step latency grow too large.

<figure>
  <img src="illustrations/_generated/dense_roofline_dark.png" alt="A logarithmic dense-BF16 H100 roofline rises from the 3.35 TB/s bandwidth ceiling and meets the 989.5 TFLOPS compute ceiling at 295.4 FLOPs per byte. At intensity 1, the bandwidth ceiling is 3.35 TFLOPS, 0.34% of dense peak. No measured throughput point is plotted. A weight tile reused across 64 activation rows illustrates why the weight-only intensity estimate increases with row count." />
  <figcaption>The dense H100 BF16 roofline is $\min(989.5\text{ TFLOPS}, 3.35\text{ TB/s} \times I)$, meeting at 295.4 FLOPs/byte. Prefill sits toward the compute roof; single-stream decode sits at $I \approx 1$ on the bandwidth slope, and batching shifts decode rightward.</figcaption>
</figure>

> **Key insight:** Reaching only 0.34% of dense peak FLOPs at $I = 1$ does not mean the GPU is 99.66% idle. HBM bandwidth is saturated streaming weights for one token row while Tensor Cores wait. That is why shrinking weight bytes ([quantization](/learn/model-quantization-gptq-awq-gguf)) or reusing weights across rows ([continuous batching](/learn/continuous-batching-request-scheduling)) speeds up decode far more than adding raw FLOPs.

This bandwidth roof gives an immediate back-of-the-envelope ceiling for single-stream decode:

$$
\text{Ideal Weight-Read TPS} \approx \frac{\text{HBM Bandwidth}}{\text{Model Weight Bytes}}
$$

Take Qwen3.6-27B's roughly `54 GB` of BF16 language weights on one H100 SXM (`3,350 GB/s`):[^qwen3627b2026]

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

**62.0 tokens/s** is an optimistic ceiling for one stream (real sustained bandwidth is lower than peak, and reading a growing KV prefix adds more HBM traffic on every decode step). In thirty seconds you know that unless [speculative decoding](/learn/speculative-decoding) amortizes several tokens per weight pass or quantization shrinks those 54 GB, no prompt tweak can push a single stream to 500 tokens/s. To locate a real kernel on your roofline, measure elapsed time, FLOPs, and hardware traffic counters such as `dram__bytes.sum` via NVIDIA Nsight Compute (`ncu --query-metrics`):[^nsightCompute2026] near the sloped roof means attack memory traffic (quantization, [FlashAttention](/learn/flashattention-memory-efficient-attention)[^dao2022]), near the flat roof means attack math/precision/parallelism, and far below both means launch overhead or synchronization stalls.

```checkpoint
A teammate says, "Decode only reaches 0.34% of peak FLOPs, so the GPU must be almost idle." What is wrong with that reasoning?
---
0.34% compares arithmetic throughput against dense Tensor Core peak at $I = 1$. The memory bus is saturated moving weights for one token row; the GPU is bandwidth-bound, not idle.
```

## The KV cache: the dynamic capacity bottleneck

Memory bandwidth sets single-stream speed; HBM capacity decides how many users fit before requests queue, preempt, or fail.

Deleting cached Key and Value tensors after each token would force the model to recompute $K$ and $V$ for the entire prefix on every decode step ($O(T^2)$ projection work). Retaining the **KV cache** eliminates those redundant projections, though each new query still reads every cached position in full attention, so longer contexts slow decode and grow memory linearly.

For $B$ sequences of cached length $L_{\text{seq}}$ across $n_{\text{layers}}$ full-attention layers, $n_{\text{kv\_heads}}$ KV heads, head dimension $d_{\text{head}}$, and $b$ bytes per stored value (`2` for FP16/BF16, `1` for FP8/INT8):

$$
\text{KV Cache Memory (bytes)} = 2 \times n_{\text{layers}} \times n_{\text{kv\_heads}} \times d_{\text{head}} \times L_{\text{seq}} \times b \times B
$$

Plug in Qwen3.6-27B's architecture: `64` total layers, of which **16** use full attention (the other 48 are Gated DeltaNet linear-attention layers with fixed-size recurrent state), `4` KV heads shared across `24` query heads via [Grouped-Query Attention (GQA)](/learn/multi-query-grouped-query-attention),[^ainslie2023] and explicit head dimension `256` (notice `5120 / 24` would be wrong; always read `head_dim` and `num_key_value_heads` from the model config!).[^qwen3627b2026]

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
  <figcaption>Raw KV payload scales linearly with sequence length: $2 \times 16 \times 4 \times 256 \times 4{,}096 \times 2 = 268.4\text{ MB}$ (0.25 GiB). Sharing 4 KV heads across 24 query heads shrinks KV storage $6\times$ relative to 24-head MHA.</figcaption>
</figure>

> **Common mistake:** Plugging `num_attention_heads` (24 query heads) or all 64 layers (including linear-attention layers) into the KV formula inflates your capacity estimate by several times. Always read `num_key_value_heads`, `head_dim`, and the exact full-attention layer count from the model config.

### Fragmentation and dynamic token budgeting

Reserving one contiguous `max_model_len` buffer per request wastes huge amounts of VRAM: a sequence stopping at 120 tokens inside a 4,096-token reservation leaves 97% unused (**internal fragmentation**), and freeing variable-sized buffers leaves scattered holes (**external fragmentation**). [<span data-glossary="pagedattention">PagedAttention</span>](/learn/kv-cache-paged-attention-llm-serving) allocates fixed-size KV blocks (typically 16 tokens), eliminating contiguous-buffer fragmentation and confining unused slack to at most 15 trailing slots per sequence (17 cached tokens round up to two 16-token blocks = 32 reserved slots).[^kwon2023]

A model's advertised context window (262,144 tokens for Qwen3.6-27B) is an architectural limit, not your production concurrency budget. Subtract static weights, runtime activations/CUDA graphs, prefix caches, and any hybrid recurrent state from HBM; what remains is your KV pool. Dividing an `18 GB` KV pool across 50 concurrent users in 16-token blocks leaves **5,488 tokens** per user (and `2,736` at 100 users). Similarly, an online admission check rejects a `64K` request that would overflow a `12 GB` pool already holding 40 active `4K` sequences (`10.74 GB`), while admitting a `16K` request (`11.81 GB`):

<!-- leetllm: test, output=show -->
```python title="reserve-request-by-token-budget.py"
BYTES_PER_TOKEN = 2 * 16 * 4 * 256 * 2


def max_context_for_budget(
    kv_pool_bytes: int, bytes_per_token: int, num_concurrent: int,
    block_tokens: int = 16, context_limit: int = 262_144,
) -> int:
    blocks_per_user = kv_pool_bytes // (bytes_per_token * block_tokens * num_concurrent)
    return min(blocks_per_user * block_tokens, context_limit)


def reservation_bytes(tokens: int, block_tokens: int = 16) -> int:
    blocks = (tokens + block_tokens - 1) // block_tokens
    return blocks * block_tokens * BYTES_PER_TOKEN


def fits_kv_budget(existing_tokens: list[int], new_tokens: int, kv_budget_bytes: int) -> bool:
    reservations = existing_tokens + [new_tokens]
    needed = sum(reservation_bytes(tokens) for tokens in reservations)
    return max(reservations) <= 262_144 and needed <= kv_budget_bytes


print(f"50 users in 18 GB pool: {max_context_for_budget(18 * 10**9, BYTES_PER_TOKEN, 50):,} tokens each")
active = [4096] * 40
print("fit 16K request in 12 GB pool:", fits_kv_budget(active, 16_384, kv_budget_bytes=12 * 10**9))
print("fit 64K request in 12 GB pool:", fits_kv_budget(active, 65_536, kv_budget_bytes=12 * 10**9))
assert reservation_bytes(17) == reservation_bytes(32)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
50 users in 18 GB pool: 5,488 tokens each
fit 16K request in 12 GB pool: True
fit 64K request in 12 GB pool: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/kv_pool_admission_dark.png" alt="A 12 GB pool limit is compared on one scale with 40 current 4,096-token reservations totaling 10,737,418,240 bytes. Adding 16,384 tokens reaches 11,811,160,064 bytes and fits; adding 65,536 reaches 15,032,385,536 bytes and exceeds the pool. Separately, 17 logical positions round to two 16-token pages: 32 allocated, with a 15-token unused tail." />
  <figcaption>Admission control checks total active plus incoming reservations against the KV pool while rounding each sequence up to whole 16-token pages.</figcaption>
</figure>

Always leave an explicit runtime reserve (activations, workspace, allocator slack) before promising concurrency: a 7B FP16 model (`14 GB` weights, 32 layers, 8 KV heads, 128 head dim) serving 200 users at 2,048 tokens uses `67.69 GB` of raw weights plus KV, which clears an `80 GB` card under an `8 GB` reserve (`75.69 GB`) but overflows under a `16 GB` reserve (`83.69 GB`).

## Stop a new prefill from stalling live streams

A request can fit comfortably in HBM and still wreck interactive latency. Suppose one worker serves 32 live decode streams with `35 ms` token gaps when a new `8,192`-token prompt arrives. If that monolithic prefill holds the GPU exclusively for `200 ms`, all 32 live streams experience a **`235 ms` generation stall** before their next token appears.

### Chunked prefill

**Chunked prefill** (Sarathi-Serve; default in vLLM V1) slices long prompts into bounded chunks (e.g., 2,048 tokens) and co-batches them with active decode steps under a shared per-step token budget.[^agrawal2023][^agrawal2024sarathiServe][^vllm2026optimization] Live decode streams keep advancing between chunks instead of waiting behind an entire document, trading a small amount of extra scheduling overhead and slightly longer TTFT for much tighter tail ITL.

<!-- leetllm: test, output=show -->
```python title="interleave-prefill-with-active-decode.py"
def chunked_schedule(prompt_tokens: int, chunk_tokens: int) -> list[str]:
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
  <figcaption>Monolithic prefill stretches active streams from a 35 ms gap to 235 ms; chunked prefill splits long prompts into smaller scheduling units so live decode streams keep advancing.</figcaption>
</figure>

### Prefill-decode disaggregation

When heavy prompt bursts still violate tight streaming SLOs on a shared pool, **prefill-decode disaggregation** (Splitwise, DistServe, Mooncake) separates prompt processing and token decoding onto dedicated GPU pools with independent sharding and scaling.[^patel2023][^zhong2024][^qin2024]

Separation eliminates direct compute contention at the cost of transferring KV state (and any hybrid recurrent state) across the interconnect:

$$
T_{\text{transfer}} \ge \frac{\text{Payload Size (bytes)}}{\text{Interconnect Bandwidth (bytes/sec)}}
$$

Notice carefully which request pays which clock: on a shared worker, a `95 ms` prefill for request B delays active chat A's next decode gap; on disaggregated pools, if B emits its first token on the prefill worker and then copies state for `20 ms` before decoding token 2, that `20 ms` copy lands on B's gap between tokens 1 and 2 (or on TTFT if token 1 is buffered). Over a `200 Gbps` (`25 GB/s`) link, raw Qwen3.6-27B KV serialization takes at least `10.7 ms` at 4K tokens and `171.8 ms` at 64K tokens before protocol overhead and recurrent state:

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

<figure>
  <img src="illustrations/_generated/state_handoff_dark.png" alt="Separate prefill and decode worker pools hand off compatible KV state, request metadata, and any needed recurrent state. A bandwidth-only estimate isolates raw K/V payload: 4K is 0.268 GB and takes at least 10.7 ms; 64K is 4.295 GB and takes at least 171.8 ms over an ideal 25 GB/s (200 Gbps) link. State serialization, network overhead, and scheduling are outside these payload-only floors." />
  <figcaption>Disaggregated serving eliminates prefill-decode compute interference by shipping KV state across pools, adding a transfer floor that grows linearly with prompt length.</figcaption>
</figure>

## Shrinking per-request state: KV quantization and hybrid models

When cache capacity rather than scheduling interference limits concurrency, quantizing the KV cache from 16-bit (FP16/BF16) to 8-bit (FP8/INT8) cuts raw per-token KV bytes in half.[^hooper2024][^liu2024kivi][^vllm2026kvquant] Weight quantization shrinks static model memory (expanding the leftover pool), whereas KV quantization shrinks each active user's dynamic footprint.

On our `18 GB` leftover pool (`80 - 54 - 8 GB`) with `5,120` tokens per user, switching from FP16 to FP8 KV cache nearly doubles KV-only capacity from `53` to `107` users. On hybrid models, however, fixed recurrent state changes the ratio dramatically. Qwen3.6-27B's 48 DeltaNet layers keep a fixed FP32 recurrent matrix of $48 \times 48 \times 128 \times 128 \times 4 = \mathbf{144\text{ MiB}}$ per active sequence regardless of context length.[^qwen3627b2026][^transformers2026Qwen35State] At `128` cached positions inside an `8 GiB` state pool, halving only the `8 MiB` growing KV portion raises capacity from `53` to `55` sequences (`1.04x`), not $2\times$:

<!-- leetllm: test, output=show -->
```python title="count-hybrid-state-before-promising-double-concurrency.py"
mib = 2**20
recurrent_bytes = 48 * 48 * 128 * 128 * 4
kv_bytes = 2 * 16 * 4 * 256 * 128 * 2
state_pool = 8 * 2**30
full_state = recurrent_bytes + kv_bytes
half_kv_state = recurrent_bytes + kv_bytes // 2
before, after = state_pool // full_state, state_pool // half_kv_state

assert recurrent_bytes == 144 * mib and kv_bytes == 8 * mib
print(f"Per sequence (128 tok): recurrent={recurrent_bytes // mib} MiB, KV={kv_bytes // mib} MiB")
print(f"Only KV halved: total state {full_state // mib} -> {half_kv_state // mib} MiB")
print(f"8 GiB pool capacity: {before} -> {after} sequences ({after / before:.2f}x)")

kv_budget = 18 * 10**9
fp16_5k = 2 * 16 * 4 * 256 * 5120 * 2
print(f"18 GB KV-only pool (5,120 tok): FP16={kv_budget // fp16_5k}, FP8={kv_budget // (fp16_5k // 2)} users")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Per sequence (128 tok): recurrent=144 MiB, KV=8 MiB
Only KV halved: total state 152 -> 148 MiB
8 GiB pool capacity: 53 -> 55 sequences (1.04x)
18 GB KV-only pool (5,120 tok): FP16=53, FP8=107 users
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/hybrid_state_quantization_dark.png" alt="At 128 positions in an 8 GiB per-sequence-state pool, 144 MiB of recurrent state plus 8 MiB of FP16 KV totals 152 MiB. Halving only KV changes the total to 148 MiB and capacity from 53 to 55 sequences, 1.04 times. A separate KV-only 18 GB pool at 5,120 tokens per user gives 53 FP16 users and 107 8-bit users." />
  <figcaption>KV quantization halves only the growing full-attention portion. When 144 MiB of fixed recurrent state dominates at short contexts, halving KV adds just 4% capacity; at long contexts where KV dominates, concurrency nearly doubles.</figcaption>
</figure>

## Read the symptom first

When the pager goes off, start from what users actually feel, name the clock and the hardware ceiling, and verify with a real load sweep (tracking goodput over all offered requests, including timeouts and rejections):

| Symptom | Check first | Likely culprits |
|---|---|---|
| Long blank wait, then smooth streaming | Queue time vs. prefill time | Queueing, long uncached prompts, cold workers |
| Fast first token, then widening gaps under load | Active streams and batch size | Decode HBM bandwidth, growing KV traffic |
| Smooth stream with occasional long freezes | Whether pauses align with new arrivals | Monolithic prefill generation stalls |
| Requests fail or stall mid-generation | KV pool occupancy and preemptions | Exhausted KV pool, unbudgeted output growth |
| Busy GPU dashboard, low tokens/s | Memory traffic per phase | Sloped HBM bandwidth roof, not compute roof |

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
    "question": "Chat A is streaming when the shared worker spends 110 ms on prefill for request B. A has a decode turn ready throughout that wait. In a replay on separate workers, B emits its first token, copies its state for 25 ms, then starts decoding its second token. Which interpretation should the team use when comparing the traces?",
    "options": [
      "Credit A with an 85 ms shorter token gap after subtracting the copy time from the shared-worker delay.",
      "Charge the 110 ms wait to B’s first-token latency and the 25 ms copy to A’s next token gap.",
      "Charge the 110 ms wait to A’s next token gap and the 25 ms copy to B’s first-token latency.",
      "Charge the 110 ms wait to A’s next token gap and the 25 ms copy to B’s gap between tokens one and two."
    ],
    "answer": "Charge the 110 ms wait to A’s next token gap and the 25 ms copy to B’s gap between tokens one and two.",
    "explanation": "A waits for its next decode turn while B holds the shared worker. In the replay, B has already emitted its first token when its state starts moving. The copy delays B’s second token. Charging the copy to B’s first-token latency places it before it happened. Charging the wait to B and the copy to A swaps the affected requests. The 85 ms subtraction combines two requests’ clocks. To choose a layout, compare first-token waits, tail gaps, correct on-time replies per second, and total cost under the same offered load."
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
