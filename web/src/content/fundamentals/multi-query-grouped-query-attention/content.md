---
{
  "id": "multi-query-grouped-query-attention",
  "title": "Multi-Query & Grouped-Query Attention",
  "slug": "multi-query-grouped-query-attention",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 2,
  "coverImage": "illustrations/_generated/attention_variants_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "NVIDIA",
    "Mistral",
    "DeepSeek"
  ],
  "shortDescription": "Eight query heads don't need eight key and value histories. Sharing them changes how much cache a long conversation stores.",
  "keyConceptsTested": [
    "Multi-Head Attention (MHA) memory bottlenecks",
    "Multi-Query Attention (MQA) shared KV projections",
    "Grouped-Query Attention (GQA) architecture",
    "KV cache memory bandwidth vs capacity",
    "Uptraining MHA checkpoints to GQA",
    "Llama 3 8-KV-head layouts",
    "Tensor Parallelism constraints for KV heads",
    "Multi-Head Latent Attention (MLA) compression"
  ],
  "prerequisites": [
    "inference-mechanics-ttft-tps-kv-cache",
    "scaled-dot-product-attention"
  ],
  "relatedQuestions": [
    "kv-cache-paged-attention-llm-serving",
    "flashattention-memory-efficient-attention",
    "model-parallelism-for-llm-inference",
    "model-quantization-gptq-awq-gguf",
    "long-context-window-management"
  ]
}
---

Eight query heads can attend to the same conversation and produce eight different outputs. Do they need eight different key/value histories? Multi-query attention says no: keep the queries distinct and share one K/V representation. Grouped-query attention shares within smaller groups. The change reduces stored history while preserving separate attention weights for each query head.

Standard Multi-Head Attention (MHA) gives each query head a corresponding K/V head.[^vaswani2017] During full-attention decode, growing cached history consumes capacity and contributes memory traffic.[^pope2023] Whether that traffic dominates the whole model depends on context, batch size, active weights, kernels, and hardware. Head sharing targets the K/V term, not every source of latency.

For equal head widths and precision, an 8:1 query/KV ratio gives eightfold smaller **raw K/V payload**.[^shazeer2019][^ainslie2023] Real concurrency and speed also depend on other state, physical replication, and latency constraints. DeepSeek-V2's Multi-Head Latent Attention (MLA) instead caches a learned compact representation and a positional component.[^deepseekv2_2024] These are trained architecture choices; selecting a smaller cache shape alone cannot convert an arbitrary checkpoint.

```checkpoint
What do MQA and GQA change compared with standard multi-head attention?
---
They keep multiple query heads but reduce the number of cached key and value heads. MQA shares one KV head across all queries, while GQA shares KV heads within groups of query heads.
```

## Why KV cache memory becomes the bottleneck

The reason to share K/V heads shows up during decode rather than in the attention equation itself. Transformer inference splits into two distinct phases with very different arithmetic intensities: prompt prefill and autoregressive decode. Understanding how those two phases read memory explains why cache size and memory bandwidth govern serving throughput.

Prefill processes multiple uncached token rows together, either in a full prompt pass or in chunks. For a single head, computing $QK^\top$ multiplies shapes $(S \times d_k)$ and $(d_k \times S)$. Processing many rows together creates data reuse across keys and values, though matrix shape alone does not determine measured HBM traffic or whether Tensor Cores saturate. Tiling strategy, activation movement, chunk size, and kernel launch overhead all influence the observed bottleneck.

Ordinary decode advances each request by one consumed token per step, while a batch can contain many requests. Full-attention queries use retained K/V from the prefix and the current token. Caching avoids repeatedly projecting old positions; it does not remove the growing cost of attending to their history.

Attention kernels stream keys and values through on-chip SRAM tiles rather than loading the entire cache into fast memory at once. Head sharing shrinks the number of distinct cached bytes fetched from HBM across those tiles. How much HBM traffic actually drops still depends on whether the kernel reuses each loaded key-value tile across all queries in its group.

### The autoregressive memory wall and operational intensity

The roofline model quantifies this decode traffic cleanly. Consider a single attention layer decoding one token for a batch of $B$ sequences with context length $S$, $H_q$ query heads, $H_{kv}$ key-value heads, head dimension $d_k$, and numerical precision $P$ bytes per element (such as $P = 2$ for FP16 or BF16). Ignoring softmax and linear projections for a first-order estimate, decode attention compute comes from two main matrix products, query-key dot products ($2 B H_q S d_k$ FLOPs) and softmax-value weighting ($2 B H_q S d_k$ FLOPs), which sum to total compute:

$$
\text{Attention FLOPs} = 4 B H_q S d_k
$$

Now trace the memory reads when a fused kernel loads each distinct cached key and value element from HBM once and reuses it across its query group. The key tensor moves $B \cdot H_{kv} \cdot S \cdot d_k \cdot P$ bytes, and the value tensor moves an equal share. Summing both transfers yields the ideal attention HBM read traffic:

$$
\text{Attention Memory Traffic} = 2 B H_{kv} S d_k P \text{ bytes}
$$

Dividing matrix-product FLOPs by ideal cache-read bytes reveals which architectural parameters actually govern decode operational intensity. Notice that batch size $B$, context length $S$, and head dimension $d_k$ cancel out cleanly between numerator and denominator. What remains depends strictly on precision $P$ and the head sharing ratio $H_q / H_{kv}$:

$$
\text{Operational Intensity} = \frac{4 B H_q S d_k \text{ FLOPs}}{2 B H_{kv} S d_k P \text{ bytes}} = \frac{2}{P} \times \frac{H_q}{H_{kv}} \quad [\text{FLOPs/byte}]
$$

Notice what happens in standard Multi-Head Attention (MHA), where every query head owns a dedicated K/V head ($H_q = H_{kv}$). At 16-bit precision ($P = 2$ bytes per element), operational intensity drops to unity, meaning every byte fetched from HBM fuels just one arithmetic operation before the compute units stall waiting on memory:

$$
\text{Operational Intensity}_{\text{MHA}} = \frac{2}{2} \times 1 = \mathbf{1 \text{ FLOP/byte}}
$$

H100 SXM's rounded shipping specification implies about 989.5 TFLOPS of **dense BF16** Tensor Core throughput and 3.35 TB/s HBM bandwidth; the advertised 1,979 TFLOPS includes structured sparsity.[^nvidia2026h100][^nvidia2022hopper] Its simple dense-BF16/HBM ridge is approximately:

$$
\text{Ridge Point} = \frac{989.5 \times 10^{12} \text{ FLOP/s}}{3.35 \times 10^{12} \text{ bytes/s}} \approx \mathbf{295.4 \text{ FLOPs/byte}}
$$

At a **measured** 1 FLOP/byte, this roofline bounds arithmetic rate at 3.35 TFLOPS, about 0.34% of dense peak. Measure utilization and stall cycles to estimate idle time. The ideal calculation also omits query/output traffic and repeated loads; tiny kernels, communication, or other limits can keep actual performance below either roof.

### Count the stored numbers first

Before looking at full serving configurations, trace how many numbers one token adds to the cache in a miniature layer with 2 attention heads and 4 values per head. Keeping these starting dimensions tiny lets you follow individual key and value elements directly. Real models multiply this per-token unit across dozens of layers and long contexts.

| Component | Count | Numbers stored |
|---|---|---|
| Key vectors | 2 heads | 2 x 4 = 8 |
| Value vectors | 2 heads | 2 x 4 = 8 |
| **Total per token** | | **16** |

Multiply by 8 requests and 2,048 cached positions: $16 \times 2048 \times 8 = 262,144$ numbers for one layer. Across 80 uniform layers, that is 20,971,520 numbers before counting bytes. This estimates cache capacity; profile serving to identify which resource limits throughput or concurrency.

<!-- leetllm: test, output=show -->
```python title="count-kv-elements.py"
def kv_elements(layers: int, tokens: int, batch: int, kv_heads: int, head_dim: int) -> int:
    dimensions = (layers, tokens, batch, kv_heads, head_dim)
    if any(value < 0 for value in dimensions):
        raise ValueError("Dimensions must be nonnegative integers.")
    if layers == 0 or kv_heads == 0 or head_dim == 0:
        raise ValueError("Layers, KV heads, and head dimension must be positive.")
    return 2 * layers * tokens * batch * kv_heads * head_dim


tiny_one_layer = kv_elements(layers=1, tokens=2048, batch=8, kv_heads=2, head_dim=4)
scaled_layers = kv_elements(layers=80, tokens=2048, batch=8, kv_heads=2, head_dim=4)
print("tiny one-layer elements:", tiny_one_layer)
print("with 80 layers:", scaled_layers)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tiny one-layer elements: 262144
with 80 layers: 20971520
```
<!-- leetllm: output:end -->

```checkpoint
For the tiny 2-head example, how much KV cache does one layer need for 8 concurrent requests at 2,048 tokens each?
---
Each token stores 16 numbers. The one-layer cache is $16 \times 2{,}048 \times 8 = 262{,}144$ numbers. A real model then multiplies again by layers and bytes per number.
```

<figure>
  <img src="illustrations/_generated/attention_variants_dark.png" alt="Three attention head sharing topologies across eight query heads: MHA uses eight key-value heads, GQA uses two groups of four query heads, and MQA uses one shared key-value head." />
  <figcaption>Eight query heads stay fixed while stored K/V pairs fall from eight in MHA to two in GQA and one in MQA. Each pair stores a separate key and value vector, so with equal head widths and precision, raw K/V payload drops to one-quarter in GQA (Q0–Q3 share KV0, Q4–Q7 share KV1) and one-eighth in MQA.</figcaption>
</figure>

In standard MHA, each of the $h$ attention heads maintains its own Key ($K$) and Value ($V$) projections alongside its Query ($Q$) matrix. Softmax converts scaled query-key dot products into normalized weights over the value vectors, masking future positions before normalization during causal generation. Under full-prefix processing, $Q$, $K$, and $V$ have shape $h \times n \times d_k$, whereas during single-token decode $Q$ shrinks to $h \times 1 \times d_k$ while $K$ and $V$ span the full cached prefix including the newest token:

$$
\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

### KV cache memory with standard MHA

Attach a concrete byte count to that tensor picture for standard MHA with $h$ heads of dimension $d_k$. The leading factor of **2** accounts for separate Key and Value tensors, $h$ counts heads, $d_k$ counts coordinates inside each head, and $P$ is storage width in bytes (2 for FP16 or BF16, 1 for INT8 or FP8). Multiplying that single-token unit across $L$ layers, $S$ sequence positions, and $B$ concurrent requests gives the complete serving estimate:

$$
\text{KV cache per token per layer} = 2 \times h \times d_k \times P \text{ bytes}
$$

$$
\text{Total KV cache} = 2 \times L \times S \times B \times h \times d_k \times P \text{ bytes}
$$

In these formulas, $L$ denotes layer count, $S$ stored tokens per request, $B$ concurrent batch size, and $P$ bytes per element. Both expressions measure the logical dense payload assuming equal K/V widths, uniform full-attention layers, unshared prefixes, and zero allocator overhead. Actual GPU allocations add workspace buffers, paged block fragmentation, and runtime overhead on top of this raw byte count.

Throughout the tables, GB means $10^9$ bytes and TB means $10^{12}$ bytes. KiB means $2^{10}$ bytes and GiB means $2^{30}$ bytes. Context labels use 4K = 4,096, 32K = 32,768, 128K = 131,072, and 1M = 1,048,576 positions. Read actual configured head dimensions; they need not equal model width divided by query heads.

> [!WARNING]
> $2 \times h \times d_k \times P$ is only the cache for **one token in one layer**. For a full serving estimate, you must multiply by layers, sequence length, and batch size.

### Concrete example (72B-style decoder dimensions)

Put concrete numbers into the formula. Consider dimensions matching a large 70B- to 72B-parameter decoder: 80 layers, 64 query heads, and a head dimension of 128 (model width $d_{\text{model}} = 64 \times 128 = 8192$). If this model used standard MHA ($h_{kv} = 64$):

| Parameter | Value |
|---|---|
| $d_{\text{model}}$ | 8192 |
| Query heads ($H_q$) | 64 |
| KV heads ($H_{kv}$) in MHA | 64 |
| Head dimension ($d_k$) | 128 |
| Layers ($L$) | 80 |
| Sequence length ($S$) | 4096 |
| Batch size ($B$) | 32 |
| Precision ($P$) | 2 bytes (FP16/BF16) |

$$
\text{KV cache}_{\text{MHA}} = 2 \times 80 \times 4096 \times 32 \times 64 \times 128 \times 2 \text{ bytes} \approx \mathbf{343.6 \text{ GB}}
$$

Under **64-head MHA**, about 344 GB of raw K/V cache exceeds a 72-billion-parameter BF16 weight estimate of 144 GB. Notice too that parameter count alone never determines head layout, because production checkpoints at this size routinely use GQA rather than 64 KV heads. Furthermore, the same total of 131,072 stored positions can arrive either as 32 concurrent 4K requests or as a single 128K long-context document, giving both serving patterns an identical element count.

<figure>
  <img src="illustrations/_generated/kv_heads_comparison_dark.png" alt="Bar chart comparing 70B 128K FP16 KV cache across MHA (343.6 GB), GQA-8 (42.95 GB), and MQA (5.37 GB) alongside an H100 80 GB limit badge and a 32x4K versus 1x128K shape comparison." />
  <figcaption>All three raw cache payloads span 131,072 retained positions per layer on a common GB scale, compared against a single H100 GPU's 80 GB HBM limit. Whether partitioned as 32 requests of 4K tokens or 1 request of 128K tokens, the element count is 40M floats per layer. About 144 GB of weights, activation buffers, and allocator overhead remain extra, so a 42.95 GB cache alone never means the entire model fits on one 80 GB card.</figcaption>
</figure>

That gap separates an MHA cache that overflows even four 80 GB GPUs from a GQA-8 cache around 43 GB and an MQA cache near 5.4 GB. Running the formula directly in Python verifies those exact raw byte footprints for the three head configurations. With those concrete numbers established, we can examine why sharing one K/V pair across all query heads works mathematically and what quality tradeoffs it introduces.

<!-- leetllm: test, output=show -->
```python title="compare-attention-kv-footprints.py"
def kv_cache_gb(kv_heads: int, tokens: int = 4096, batch: int = 32) -> float:
    bytes_used = 2 * 80 * tokens * batch * kv_heads * 128 * 2
    return bytes_used / 1e9


for name, kv_heads in (("MHA", 64), ("GQA-8", 8), ("MQA", 1)):
    print(f"{name}: {kv_cache_gb(kv_heads):.2f} GB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MHA: 343.60 GB
GQA-8: 42.95 GB
MQA: 5.37 GB
```
<!-- leetllm: output:end -->

```checkpoint
What is the most common KV cache sizing mistake?
---
Using the per-token-per-layer formula as if it were the full cache. A full serving estimate must multiply by layers, sequence length, batch size, KV heads, head dimension, and bytes per element.
```

---

## Multi-query attention (MQA)

### One shared K/V pair

Those byte counts assume every query head keeps its own K/V history, raising an immediate design question: does that history have to be separate per head at all? Multi-Query Attention (MQA), introduced by Noam Shazeer in 2019, shares one Key and Value projection across every query head in the layer while keeping all $H_q$ query projections independent.[^shazeer2019] Because the cache stores only a single Key vector and a single Value vector per token position per layer, raw storage falls by the full query-head multiplier $H_q$:

$$
\text{Raw Payload Reduction Factor}_{\text{MQA}} = \frac{H_q}{H_{kv}} = \frac{H_q}{1} = H_q
$$

$$
\text{MQA KV cache per token per layer} = 2 \times 1 \times d_k \times P \text{ bytes}
$$

Here the factor of $1$ denotes that single shared KV head, so per-token storage scales only with $d_k$ instead of $H_q \cdot d_k$. In our 72B-style layout with batch size 32 and sequence length 4,096, reducing $H_{kv}$ from 64 to 1 shrinks raw cache size from **343.6 GB** down to **~5.37 GB**, cutting per-token-per-layer storage from 32 KiB to 512 bytes:

| Method | KV heads | Cache per token per layer (FP16) | Relative footprint | Ideal distinct-cache-read reduction |
|---|---|---|---|---|
| **MHA** | 64 | $2 \times 64 \times 128 \times 2 = 32\text{ KiB}$ | 1x | 1x |
| **MQA** | 1 | $2 \times 1 \times 128 \times 2 = 512\text{ B}$ | **1/64x** | **64x** |

Sharing one KV head across 64 queries also lifts ideal attention decode operational intensity from 1 FLOP/byte to **64 FLOPs/byte**. Each loaded K/V byte can fuel 64 multiply-add pairs across the query heads before another historical position must be fetched. Whether an actual serving engine reaches that 64x arithmetic intensity or speeds up latency proportionally still depends on kernel reuse, linear projection traffic, and feed-forward overhead:

$$
\text{Operational Intensity}_{\text{MQA}} = \frac{2}{P} \times \frac{H_q}{1} = \frac{2}{2} \times 64 = \mathbf{64 \text{ FLOPs/byte}}
$$

```checkpoint
Compare an MHA layout and a trained MQA layout with 64 queries, equal K/V widths, precision, layers, and cached positions. Which term produces a 64x raw-payload reduction?
---
The KV-head count dropped from 64 to 1. MHA stores K and V for all 64 heads, while MQA stores one shared K head and one shared V head, so the cache shrinks by the same 64x factor.
```

### Performance vs. quality tradeoffs in MQA

That massive memory savings comes with a representational price. Every query head still computes its own query vector $q_i$, meaning heads can weight cached tokens differently through softmax, yet all query heads project onto the identical Key subspace and retrieve from the identical Value subspace. Shared K/V restricts the layer's expressivity even while queries preserve per-head attention patterns. Empirical studies find that MQA can degrade validation quality relative to MHA, with the magnitude depending on model scale, training recipe, and task.[^shazeer2019][^ainslie2023] Cache footprints measure memory capacity directly, whereas downstream benchmarks reveal whether sharing hurt head specialization.

### A minimal MQA decode step

This minimal Python trace demonstrates how separate query heads interact with one shared K/V sequence during decode. Tensor $Q$ keeps one vector per query head, while $K$ and $V$ hold only single shared per-token sequences. Each query computes distinct attention scores against the shared keys and returns its own weighted blend of the shared values:

<!-- leetllm: test, output=show -->
```python title="mqa-decode-step.py"
import math


def dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b, strict=True))


def softmax(xs: list[float]) -> list[float]:
    peak = max(xs)
    exps = [math.exp(x - peak) for x in xs]
    total = sum(exps)
    return [e / total for e in exps]


def mqa_decode_step(
    query_heads: list[list[float]],
    keys: list[list[float]],
    values: list[list[float]],
) -> list[list[float]]:
    """Attend h query heads over one shared, entirely visible K/V prefix."""
    if not query_heads or not keys or not values or len(keys) != len(values):
        raise ValueError("Need queries and a nonempty aligned K/V prefix.")
    d_k, d_v = len(query_heads[0]), len(values[0])
    if not d_k or not d_v or any(len(row) != d_k for row in query_heads + keys):
        raise ValueError("Queries and keys must have a common positive width.")
    if any(len(row) != d_v for row in values):
        raise ValueError("Values must have a common positive width.")
    scale = math.sqrt(len(query_heads[0]))
    outputs: list[list[float]] = []
    for query in query_heads:
        weights = softmax([dot(query, key) / scale for key in keys])
        outputs.append([
            sum(weight * value[dim] for weight, value in zip(weights, values, strict=True))
            for dim in range(len(values[0]))
        ])
    return outputs


# Two query heads, one shared cache of two tokens, d_k = 2.
q_heads = [[1.0, 0.0], [0.0, 1.0]]
shared_k = [[1.0, 0.0], [0.0, 1.0]]
shared_v = [[1.0, 0.0], [0.0, 1.0]]
out = mqa_decode_step(q_heads, shared_k, shared_v)
assert len(out) == 2
assert len(out[0]) == 2
print("head0 output:", [round(x, 3) for x in out[0]])
print("head1 output:", [round(x, 3) for x in out[1]])
print("shared KV tokens:", len(shared_k))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
head0 output: [0.67, 0.33]
head1 output: [0.33, 0.67]
shared KV tokens: 2
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/shared_kv_different_queries_dark.png" alt="Two query vectors read the same shared key and value rows. Scaling by square root of two gives score rows [0.707, 0] and [0, 0.707]; softmax gives [0.67, 0.33] and [0.33, 0.67]. With value rows [1, 0] and [0, 1], each output equals its own weights." />
  <figcaption>Both queries read the same two K rows and two V rows. Their distinct softmax weights produce distinct outputs, and because V matches the identity basis here, each output equals its weight vector. Displayed scores round to three or two decimals while Python runs in full float precision.</figcaption>
</figure>

```checkpoint
Why can the two query heads produce different outputs if they share one K/V cache?
---
They have different query vectors, so they put different softmax weights on the same cached keys. Sharing K/V changes stored state, not the fact that each head can ask a different question.
```

---

## Grouped-query attention (GQA)

### Groups of queries, fewer K/V heads

While sharing a single history keeps queries distinct, forcing every head onto one key-value pair leaves little room for specialized retrieval channels. Grouped-Query Attention (GQA), proposed by Ainslie et al. in 2023, interpolates between MHA and MQA by keeping $g$ intermediate K/V heads where $1 < g < H_q$ and $g$ divides $H_q$.[^ainslie2023] Each group of $G = H_q / g$ queries shares one Key head and one Value head, giving intermediate savings in both capacity and read traffic:

$$
\text{Group Size } G = \frac{H_q}{g} = \text{queries per KV group}
$$

$$
\text{Raw Payload Reduction Factor}_{\text{GQA}} = \frac{H_q}{g}
$$

$$
\text{Ideal Tokens in a Fixed Raw-KV Budget Multiplier}_{\text{GQA}} = \frac{H_q}{g}
$$

$$
\text{Operational Intensity}_{\text{GQA}} = \frac{2}{P} \times \frac{H_q}{g} \quad [\text{FLOPs/byte}]
$$

With $H_q = 64$ and $g = 8$, each cached K or V tensor has shape $8 \times n \times d_k$ instead of $64 \times n \times d_k$. Raw payload falls eightfold. If the kernel reads each distinct cached value once, the ideal ratio above rises from 1 to 8 FLOPs/byte. Neither total model traffic nor end-to-end throughput must change eightfold.

<!-- leetllm: test, output=show -->
```python title="map-query-heads-to-kv-groups.py"
def kv_group_for_query(query_head: int, query_heads: int, kv_heads: int) -> int:
    if query_heads <= 0 or kv_heads <= 0 or query_heads % kv_heads:
        raise ValueError("Positive query-head count must be divisible by KV heads.")
    if not 0 <= query_head < query_heads:
        raise ValueError("Query-head index is out of range.")
    return query_head // (query_heads // kv_heads)


assignments = [kv_group_for_query(head, query_heads=8, kv_heads=2) for head in range(8)]
print("query to KV group:", assignments)
print("cache reduction:", 8 // 2, "x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
query to KV group: [0, 0, 0, 0, 1, 1, 1, 1]
cache reduction: 4 x
```
<!-- leetllm: output:end -->

### GQA in practice

These published model versions illustrate different grouping ratios. They are architectural examples, not a current model ranking or an exhaustive list of frontier designs. Context limits and layer layouts require separate checks:

| Model | Query heads ($H_q$) | KV heads ($g$) | Ratio | Context Window |
|---|---|---|---|---|
| **Qwen2.5-72B-Instruct**[^qwen2572bCard2026] | 64 | 8 | 8:1 | Configured 32K; model card describes 128K with YaRN |
| **Llama 3.1 70B**[^dubey2024] | 64 | 8 | 8:1 | 128K |
| **Llama 3.1 8B**[^dubey2024] | 32 | 8 | 4:1 | 128K |
| **Llama 3.1 405B**[^dubey2024] | 128 | 8 | 16:1 | 128K |
| **Llama 2 70B**[^touvron2023a] | 64 | 8 | 8:1 | 4K |
| **Mistral 7B v0.3**[^mistral7bv03Config2026] | 32 | 8 | 4:1 | Configured 32K |
| **Gemma 2 9B**[^gemma2team2024] | 16 | 8 | 2:1 | 8K |
| **Qwen3.6-27B attention path**[^qwen3627b2026] | 24 | 4 | 6:1 | Native 256K; recurrent layers have different state |

Llama **3.1** fixes eight KV heads across 8B, 70B, and 405B, while the query count and sharing ratio grow.[^dubey2024] The original April 2024 Llama 3 8B/70B releases had [8K context](https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md), not 128K. Notice that choosing GQA by itself does not set a model's context length or make context extension reliable.

> [!NOTE]
> Gemma 2 alternates 4K sliding-window and 8K global attention; sum each layer's actual retained positions when estimating cache.[^gemma2team2024] The original Mistral 7B paper describes sliding-window attention,[^jiang2023] while the v0.3 configuration above has `sliding_window: null`.[^mistral7bv03Config2026] A family name alone does not specify retention policy. Qwen2.5's model card and default configuration also distinguish supported extended context from configured context.[^qwen2572bCard2026]

### Tensor Parallelism interactions

Head ratios meet an engineering constraint when sharding layers across multiple GPUs. <span data-glossary="tensor-parallelism">Tensor parallelism</span> splits attention heads across device ranks, though head sharding is just one way to partition layer weights and intermediate activations. In serving engines like vLLM, simple head sharding requires query heads to divide evenly across TP ranks ($H_q \pmod{\text{TP}} = 0$), while KV heads fall into two regimes:[^vllmLlamaAttention2026]

1. **$\text{TP} \le g$:** In this vLLM Llama layout, $g$ must divide evenly across TP ranks. Each rank stores $g / \text{TP}$ KV heads without KV-head replication.
2. **$\text{TP} > g$:** This implementation requires $\text{TP}$ divisible by $g$ and gives each rank one KV head. Each original KV head appears on $\text{TP} / g$ ranks. Other attention or distributed layouts can differ.

Consider the Llama 3.1 70B head layout ($H_q = 64, g = 8$) at $\text{TP} = 16$:
- Query heads split cleanly: $64 / 16 = 4$ query heads per GPU.
- But there are only 8 KV heads. To ensure each GPU rank has KV state, each KV head is duplicated across $16 / 8 = 2$ GPUs.
- Each rank stores one KV head, so the aggregate is sixteen physical head copies rather than eight. With all other dimensions equal, this doubles GQA payload relative to the unreplicated layout. Against MHA's 64 physical heads, the replicated layout retains a 4x payload reduction, compared with 8x for unreplicated GQA.

<!-- leetllm: test, output=show -->
```python title="check-vllm-kv-head-sharding.py"
def vllm_sharding_plan(query_heads: int, kv_heads: int, tensor_parallel: int) -> str:
    if any(value <= 0 for value in (query_heads, kv_heads, tensor_parallel)):
        return "invalid: head counts and TP must be positive integers"
    if query_heads % kv_heads != 0:
        return "invalid: query heads must divide into KV groups"
    if query_heads % tensor_parallel != 0:
        return "invalid: query heads must divide evenly across TP shards"
    if tensor_parallel <= kv_heads:
        if kv_heads % tensor_parallel != 0:
            return "invalid: KV heads must divide evenly across TP shards"
        return f"even: {kv_heads // tensor_parallel} KV heads per shard"
    if tensor_parallel % kv_heads != 0:
        return "invalid: TP must be divisible by the KV-head count for replication"
    replicas_per_kv_head = tensor_parallel // kv_heads
    return f"replicated: each KV head appears on {replicas_per_kv_head} shards"


print("TP=4:", vllm_sharding_plan(query_heads=64, kv_heads=8, tensor_parallel=4))
print("TP=16:", vllm_sharding_plan(query_heads=64, kv_heads=8, tensor_parallel=16))
print("24Q, 6KV, TP=4:", vllm_sharding_plan(query_heads=24, kv_heads=6, tensor_parallel=4))
for tp in (4, 16):  # both valid for this 64Q/8KV layout
    local_kv_heads = max(1, 8 // tp)
    physical_kv_heads = tp * local_kv_heads
    print(f"TP={tp} aggregate KV head copies: {physical_kv_heads}; "
          f"matching MHA/raw GQA ratio: {64 / physical_kv_heads:.1f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
TP=4: even: 2 KV heads per shard
TP=16: replicated: each KV head appears on 2 shards
24Q, 6KV, TP=4: invalid: KV heads must divide evenly across TP shards
TP=4 aggregate KV head copies: 8; matching MHA/raw GQA ratio: 8.0x
TP=16 aggregate KV head copies: 16; matching MHA/raw GQA ratio: 4.0x
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/kv_shard_replication_dark.png" alt="Tensor-parallel KV head sharding for Hkv=8: TP=4 stores two unique KV heads per GPU (8 physical total), whereas TP=16 replicates KV heads twice across GPUs (16 physical total)." />
  <figcaption>For this 64Q/8KV layout, TP=4 stores two distinct KV heads per GPU rank, matching 8 aggregate physical copies and keeping the full 8x saving over 64-head MHA. TP=16 repeats each logical KV identity across two ranks, yielding 16 physical copies and trimming the saving from 8x to 4x.</figcaption>
</figure>

```checkpoint
A teammate says "32 query heads and 8 KV groups means 8x savings." What is correct, and why?
---
It's 4x savings, not 8x. The factor comes from $H_q / H_{kv} = 32 / 8 = 4$, so each KV head is shared by four query heads.
```

```checkpoint
Why can a 64-query-head, 8-KV-head model lose part of its cache saving at TP=16 in vLLM?
---
The 64 query heads divide cleanly across 16 shards, but there are only 8 KV heads. vLLM gives every shard at least one KV head, so each KV head is replicated on two shards. The model still uses GQA, but the physical serving layout duplicates some cached state.
```

---

## Converting MHA to GQA via uptraining

An existing MHA checkpoint provides learned representations, yet reducing its KV-head count immediately alters the attention computation. Rather than pretraining a grouped model from random weights, Ainslie et al. introduced **uptraining**: initialize each grouped KV projection by averaging a slice of existing MHA heads, then run continued pretraining so queries and keys adapt to sharing.[^ainslie2023] Starting from trained weights recovers accuracy far faster than training a new GQA architecture from scratch.

<figure>
  <img src="illustrations/_generated/gqa_uptraining_dark.png" alt="GQA uptraining pipeline: train MHA, mean-pool key and value heads per group, uptrain queries for 5% of pretraining budget, and evaluate GQA quality, alongside an opposing-key mean-pool output shift chart." />
  <figcaption>Uptraining pools 64 MHA K/V heads into 8×8 groups, runs continued pretraining for 5% of original steps, and evaluates quality. Averaging [3, 5] with [1, 3] initializes mean KV vector [2, 4], yet when paired group heads oppose one another, immediate mean pooling shifts output coordinate 0 from 8.81 to 5.00 before uptraining begins.</figcaption>
</figure>

### The mean-pooling initialization

Conversion starts by partitioning existing Key and Value projection matrices into contiguous groups and averaging within each group. Suppose an MHA checkpoint has $H_q = 64$ heads that convert to GQA with $g = 8$ groups, placing $G = 64 / 8 = 8$ original heads into each group. Let $W_{K, i}^{\text{MHA}} \in \mathbb{R}^{d_{\text{model}} \times d_k}$ and $W_{V, i}^{\text{MHA}} \in \mathbb{R}^{d_{\text{model}} \times d_k}$ denote the projection slices for head $i$, so the initialized weights for group $j \in \{0, \dots, g-1\}$ take the arithmetic mean:

$$
W_{K, j}^{\text{GQA}} = \frac{1}{G} \sum_{i \in \text{group } j} W_{K, i}^{\text{MHA}}, \quad W_{V, j}^{\text{GQA}} = \frac{1}{G} \sum_{i \in \text{group } j} W_{V, i}^{\text{MHA}}
$$

The original experiments favored mean pooling over selecting one representative head or resetting projections randomly.[^ainslie2023] Even with mean pooling, averaging can cancel opposing directions and alter attention outputs right after conversion, so treat pooled weights strictly as a starting point. If the layer uses attention biases, pool them along the same head groups while leaving query and output projections intact at initialization for subsequent training to refine.

<!-- leetllm: test, output=show -->
```python title="mean-pool-kv-heads-for-uptraining.py"
def mean_pool_heads(heads: list[list[float]], group_size: int) -> list[list[float]]:
    if group_size <= 0 or not heads or len(heads) % group_size:
        raise ValueError("Need a positive group size that divides nonempty heads.")
    if not heads[0] or any(len(head) != len(heads[0]) for head in heads):
        raise ValueError("Head slices must have the same nonzero width.")
    pooled: list[list[float]] = []
    for start in range(0, len(heads), group_size):
        group = heads[start : start + group_size]
        pooled.append([
            sum(values) / len(group)
            for values in zip(*group, strict=True)
        ])
    return pooled


mha_k_heads = [[1.0, 3.0], [3.0, 5.0], [10.0, 12.0], [14.0, 16.0]]
print("GQA initial K heads:", mean_pool_heads(mha_k_heads, group_size=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
GQA initial K heads: [[2.0, 4.0], [12.0, 14.0]]
```
<!-- leetllm: output:end -->

### The uptraining recipe and compute budget

Mean pooling provides a clean numerical average, yet it does not preserve attention outputs identically when grouped heads specialize in distinct directions. Consider a pair of heads whose keys point along opposite coordinates while their value vectors concentrate mass on opposite tokens. Averaging their weights collapses the keys toward zero and smears the values, shifting output coordinate 0 from 8.808 down to 5.0 before any gradient steps run:

<!-- leetllm: test, output=show -->
```python title="mean-pooling-is-not-output-parity.py"
import math


def attend(keys: list[float], values: list[float]) -> float:
    # One scalar query of 1; two entirely visible positions; head width 1.
    peak = max(keys)
    weights = [math.exp(key - peak) for key in keys]
    return sum(w * v for w, v in zip(weights, values, strict=True)) / sum(weights)


old_keys = [[1.0, -1.0], [-1.0, 1.0]]
old_values = [[10.0, 0.0], [0.0, 10.0]]
pooled_keys = [sum(pair) / 2 for pair in zip(*old_keys, strict=True)]
pooled_values = [sum(pair) / 2 for pair in zip(*old_values, strict=True)]
before = [attend(k, v) for k, v in zip(old_keys, old_values, strict=True)]
after = [attend(pooled_keys, pooled_values)] * 2
assert all(not math.isclose(a, b) for a, b in zip(before, after, strict=True))
print("original head outputs:", [round(x, 3) for x in before])
print("pooled head outputs:", [round(x, 3) for x in after])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original head outputs: [8.808, 8.808]
pooled head outputs: [5.0, 5.0]
```
<!-- leetllm: output:end -->

That functional gap explains why pooling alone is never the finished model and why continued training matters. After measuring baseline drift, follow three stages to adapt the weights and verify task performance:

1. **Initialize:** Pool K/V projection slices and compatible biases; retain query/output projections at conversion time.
2. **Adapt:** The paper continued T5.1.1's original pretraining setup and dataset for **5% of original steps**, using T5's Adafactor recipe. Match that setup when reproducing the experiment; choose and evaluate a separate recipe for a different architecture or objective.
3. **Evaluate:** Its T5-XXL comparison reported average task score 47.1 for GQA-8 versus 47.2 for MHA across summarization, translation, and TriviaQA. It explicitly excluded GLUE. These historical scores describe one experiment; measure conversion quality on the target model and tasks.[^ainslie2023]

```checkpoint
How do you initialize GQA from an existing MHA checkpoint?
---
Group the old K/V heads and mean-pool their projection weights into fewer KV heads. Then uptrain the converted model so it adapts to the reduced K/V capacity.
```

---

## Beyond GQA: Multi-head latent attention (MLA)

GQA shrinks the cache by reducing the number of distinct KV heads, whereas Multi-Head Latent Attention (MLA), introduced in DeepSeek-V2 and retained in DeepSeek-V3, compresses keys and values jointly through a learned low-rank projection.[^deepseekv2_2024][^deepseekv3_2024] Both DeepSeek models run 128 query heads, yet an absorbed decode kernel scores content directly against cached latent vectors without materializing expanded key tensors across sequence history. This section derives that algebraic equivalence and explains why positional components must stay separated from the latent compression. When evaluating an MLA checkpoint, always test numerical output parity and verify which cache layout and decode kernel your runtime actually selects.

### Low-rank joint KV compression and decoupled RoPE

In standard attention, a hidden state $h_t \in \mathbb{R}^d$ projects independently into full key and value tensors of total width $h \cdot d_h$. MLA replaces those separate per-head projections with a single down-projection matrix $W^{DKV} \in \mathbb{R}^{d_c \times d}$, where the compressed latent dimension $d_c$ is much smaller than $h \cdot d_h$. Every token position $t$ writes only that shared low-rank vector $c_t^{KV}$ into cache:

$$
c_t^{KV} = W^{DKV} h_t \in \mathbb{R}^{d_c}
$$

In DeepSeek-V2 and DeepSeek-V3, $d_c = 512$, compared with a standard full-head width of $h \cdot d_h = 128 \times 128 = 16,384$. Storing a single 512-dimensional vector $c_t^{KV}$ captures the compressed content representation for both Keys and Values at token $t$. At inference time, per-head up-projection matrices bridge that shared latent back to the attention heads.

#### Why the positional component is separate

In modern Transformers, Rotary Position Embedding (RoPE) multiplies query and key coordinate pairs by position-dependent 2D rotation matrices $\mathcal{R}_t$ indexed by token position $t$. Although RoPE is linear for any fixed position and matrix multiplication stays associative, $\mathcal{R}_s$ sits between the head query and the learned up-projection matrix $W_i^{UK}$ and generally does not commute with $W_i^{UK}$. If a model rotated expanded content keys at cached positions $s$, one head's score would take the form:

$$
(\mathcal{R}_t q_t)^\top \mathcal{R}_s W_i^{UK} c_s^{KV} = \left((W_i^{UK})^\top \mathcal{R}_s^\top \mathcal{R}_t q_t\right)^\top c_s^{KV}
$$

Here $q_t \in \mathbb{R}^{d_h}$ and the rotation matrices have shape $d_h \times d_h$. Notice that the regrouped query $(W_i^{UK})^\top \mathcal{R}_s^\top \mathcal{R}_t q_t$ still depends on every past position $s$, so it cannot be computed once per decode step and shared across history, and shifting rotations into the smaller latent space would change the layer's function.[^deepseekv2_2024] In the 2D probe below, identity rotation and a 90-degree rotation both preserve dot-product equality between expansion and regrouping at each position, while requiring two distinct absorbed query vectors:

<!-- leetllm: test, deps=torch, output=show -->
```python title="rotation-does-not-break-associativity.py"
import torch

torch.set_num_threads(1)
up = torch.tensor([[1.0, 2.0], [0.0, 1.0]], dtype=torch.float64)
query = torch.tensor([1.0, 0.0], dtype=torch.float64)  # current query already rotated
latent = torch.tensor([1.0, 2.0], dtype=torch.float64)
rotations = [torch.eye(2, dtype=torch.float64),
             torch.tensor([[0.0, -1.0], [1.0, 0.0]], dtype=torch.float64)]
absorbed_queries = []
for position, rotation in enumerate(rotations):
    absorbed = up.T @ rotation.T @ query
    direct = torch.dot(query, rotation @ up @ latent)
    regrouped = torch.dot(absorbed, latent)
    torch.testing.assert_close(direct, regrouped)
    absorbed_queries.append(absorbed)
    print(f"position {position}: direct={direct.item():.1f}, regrouped={regrouped.item():.1f}")
assert not torch.equal(absorbed_queries[0], absorbed_queries[1])
print("one shared absorbed query works here:", False)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
position 0: direct=5.0, regrouped=5.0
position 1: direct=-2.0, regrouped=-2.0
one shared absorbed query works here: False
```
<!-- leetllm: output:end -->

DeepSeek avoids that position entanglement with **decoupled RoPE**, splitting queries and keys into content projections (without RoPE) and dedicated positional projections (with RoPE):

1. **Content Key (compressed):**
   $k_{t,i}^C = W_i^{UK} c_t^{KV} \in \mathbb{R}^{d_h}$. Here, $W_i^{UK} \in \mathbb{R}^{d_h \times d_c}$ is the up-projection matrix for head $i$.
2. **RoPE Key (uncompressed, shared):**
   $k_t^R = \text{RoPE}(W^{KR} h_t) \in \mathbb{R}^{d_r}$. Here, $W^{KR} \in \mathbb{R}^{d_r \times d}$ and $d_r = 64$.
3. **Content Query and RoPE Query:**
   Queries undergo a similar low-rank compression into $c_t^Q \in \mathbb{R}^{d_c'}$, then up-project into $q_{t,i}^C \in \mathbb{R}^{d_h}$ and $q_{t,i}^R = \text{RoPE}(W_i^{QR} c_t^Q) \in \mathbb{R}^{d_r}$.

With content and position decoupled, the full attention logit between query token $t$ and cached token $s$ for head $i$ simply adds the two dot products and scales by the combined head width $\sqrt{d_h + d_r}$. Leaving RoPE outside $c_s^{KV}$ keeps the content term completely independent of relative rotation matrices between $t$ and $s$. That structural separation is what enables exact algebraic weight absorption during decoding:

$$
\text{Score}_{t,s,i} = \frac{(q_{t,i}^C)^\top k_{s,i}^C + (q_{t,i}^R)^\top k_s^R}{\sqrt{d_h + d_r}}
$$

### Matrix absorption for content attention

Here is the central mathematical trick of MLA: during autoregressive decoding, the engine never needs to up-project and materialize $k_{s,i}^C = W_i^{UK} c_s^{KV}$ for past tokens. By associativity of matrix multiplication, we can transpose the static up-projection matrix $W_i^{UK}$ directly onto the current query vector $q_{t,i}^C$ instead of applying it to every cached latent vector $c_s^{KV}$. Because $(W_i^{UK})^\top q_{t,i}^C$ depends strictly on token $t$ and static model weights, we define a single 512-dimensional **absorbed query** $\tilde{q}_{t,i} \in \mathbb{R}^{d_c}$ and take dot products straight against the cached 512-dimensional latent $c_s^{KV}$:

$$
(q_{t,i}^C)^\top k_{s,i}^C = (q_{t,i}^C)^\top \left( W_i^{UK} c_s^{KV} \right) = \left( (W_i^{UK})^\top q_{t,i}^C \right)^\top c_s^{KV} = \tilde{q}_{t,i}^\top c_s^{KV}, \quad \tilde{q}_{t,i} = (W_i^{UK})^\top q_{t,i}^C \in \mathbb{R}^{d_c}
$$

The identical algebraic regrouping simplifies the Value sum $\sum_s A_{t,s,i} v_{s,i}$ without expanding $v_{s,i} = W_i^{UV} c_s^{KV}$ across every sequence position $s$. Pulling the static linear up-projection $W_i^{UV}$ outside the sum over tokens lets attention accumulate weights directly over the compact cached vectors $c_s^{KV} \in \mathbb{R}^{d_c}$, applying $W_i^{UV}$ once to the final sum (or fusing it directly into the layer output projection $W^O$):

$$
o_{t,i} = \sum_s A_{t,s,i} \left( W_i^{UV} c_s^{KV} \right) = W_i^{UV} \left( \sum_s A_{t,s,i} c_s^{KV} \right)
$$

<!-- leetllm: test, deps=torch, output=show -->
```python title="mla-matrix-absorption.py"
import torch

torch.manual_seed(42)
d_c, d_h = 512, 128
w_uk = torch.randn(d_h, d_c, dtype=torch.float64)
c_kv = torch.randn(d_c, dtype=torch.float64)  # cached latent vector in KV cache
q_c = torch.randn(d_h, dtype=torch.float64)    # content query for current token

# Path 1: Naive decompression (up-project key in cache, then dot product)
k_decompressed = w_uk @ c_kv
score_naive = torch.dot(q_c, k_decompressed)

# Path 2: Matrix absorption (absorb W_UK into query, dot product with cached latent)
q_absorbed = w_uk.T @ q_c
score_absorbed = torch.dot(q_absorbed, c_kv)

print("naive score:", round(float(score_naive), 4))
print("absorbed score:", round(float(score_absorbed), 4))
torch.testing.assert_close(score_naive, score_absorbed, rtol=1e-12, atol=1e-10)
print("numerically close:", True)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
naive score: 398.0423
absorbed score: 398.0423
numerically close: True
```
<!-- leetllm: output:end -->

The regrouping is exact algebra within this MLA parameterization; floating-point paths need numerical tolerance. An absorbed implementation can retain compressed content plus positional keys rather than full historical K/V. Prefill kernels or fallback implementations can choose to materialize expanded tensors, so inspect the engine's actual allocations.

### MLA vs. GQA: exact payload comparison

For each token position and layer, an MLA engine writes only two vectors into HBM: the compressed content latent $c_t^{KV}$ ($d_c = 512$ numbers) and the shared decoupled RoPE key $k_t^R$ ($d_r = 64$ numbers), giving $512 + 64 = \mathbf{576}$ stored values per token per layer. Compare **chosen raw cache layouts** with 128 queries below, where MHA, GQA, and MQA use 128-wide keys and values while MLA combines a 512-dimensional content latent with a 64-wide positional key. Note that these element counts summarize persistent storage rather than implying identical attention score dimensions, compute budgets, trained functions, or benchmark quality:

$$
\text{MLA KV Cache Payload} = d_c + d_r = 512 + 64 = \mathbf{576 \text{ numbers}}
$$

| Architecture | Query heads ($H_q$) | Cache representation | Elements per token per layer | Relative cache footprint | Query outputs |
|---|---|---|---|---|---|
| **MHA** | 128 | 128 (full K + V) | $2 \times 128 \times 128 = \mathbf{32,768}$ | 1x (baseline) | 128 |
| **GQA-8** | 128 | 8 (full K + V) | $2 \times 8 \times 128 = \mathbf{2,048}$ | 1/16x (16x smaller) | 128 |
| **GQA-4** | 128 | 4 (full K + V) | $2 \times 4 \times 128 = \mathbf{1,024}$ | 1/32x (32x smaller) | 128 |
| **MLA (DeepSeek)** | 128 | 512 latent + 64 RoPE | $512 + 64 = \mathbf{576}$ | **1/56.9x (56.9x smaller)** | 128 |
| **MQA** | 128 | 1 (full K + V) | $2 \times 1 \times 128 = \mathbf{256}$ | 1/128x (128x smaller) | 128 |

<figure>
  <img src="illustrations/_generated/mla_vs_gqa_dark.png" alt="Comparison of per-token KV cache elements across GQA-8 (2,048), GQA-4 (1,024), MLA (576), and MQA (256), alongside naive expansion versus matrix-absorbed MLA decode paths reaching 398.0423." />
  <figcaption>Each cached MLA token stores 512 content latent numbers plus 64 decoupled RoPE numbers (576 total), compared against 2,048 elements for GQA-8 and 1,024 for GQA-4. During decode, absorbing the up-projection matrix into the query avoids reconstructing the 128-wide key vector for past positions and matches naive key expansion numerically at score 398.0423.</figcaption>
</figure>

For these layouts, $32{,}768 / 576 \approx 56.9$ and $2{,}048 / 576 \approx 3.56$ are raw element-count ratios. All retain separate query outputs, but their parameterizations and representational constraints differ. Low-rank compression does not preserve every possible full-MHA function.

<!-- leetllm: test, output=show -->
```python title="compare-cached-state-widths.py"
def gqa_cached_values_per_token(kv_heads: int, head_dim: int) -> int:
    return 2 * kv_heads * head_dim


gqa_8_values = gqa_cached_values_per_token(kv_heads=8, head_dim=128)
mla_example_values = 512 + 64  # compact content latent plus positional component
equivalent_gqa_heads = mla_example_values / (2 * 128)
print("GQA-8 cached values:", gqa_8_values)
print("MLA-style cached values:", mla_example_values)
print("MLA-style width in GQA-head units:", equivalent_gqa_heads)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
GQA-8 cached values: 2048
MLA-style cached values: 576
MLA-style width in GQA-head units: 2.25
```
<!-- leetllm: output:end -->

```checkpoint
Your stack supports both GQA and MLA. What evidence justifies choosing an MLA checkpoint?
---
The MLA checkpoint must pass the same quality evaluation, and measured per-rank memory and latency must improve at the intended context and concurrency. A smaller latent alone does not confirm either outcome, and MLA cannot be enabled as a cache-format flag on an arbitrary GQA checkpoint.
```

---

## Serving impact

### Memory capacity vs. memory bandwidth

When evaluating serving performance, separate memory capacity from memory bandwidth because they limit throughput in very different ways:

1. **Memory capacity:** Available VRAM limits how much state can stay resident at once. Cache, weights, workspaces, and reservations must fit on each device, and concurrency or scheduling policies can impose an even tighter request limit.
2. **Memory bandwidth:** The rate at which bytes move between HBM and compute units governs decode speed whenever memory transfers become the limiting resource. Shrinking cached bytes shortens decode attention reads, though kernel execution, collective communication, and queueing also contribute to ITL and TPOT.

For equal K/V widths and precision, GQA reduces the raw cache payload by $H_q/H_{kv}$, whereas MLA's reduction comes from its latent and positional widths. Smaller representations create headroom for more concurrent requests and cut attention HBM traffic during autoregressive steps. How much latency or throughput improves in practice still depends on batch composition, weight reads, and kernel scheduling.

### Concurrency ceilings (72B-style dimensions, 4K context)

Set aside a fixed budget of **10 GiB** (10.74 GB) of VRAM dedicated purely to logical KV cache payload. With 4,096 tokens per request, 80 layers, 128 head dimension, and FP16 precision:
- MHA requires ~10.74 GB per request, so a 10 GiB budget holds **1 concurrent request**.
- GQA-8 requires ~1.34 GB per request, so the identical budget holds **8 concurrent requests**.
- MQA requires ~0.17 GB per request, accommodating **64 concurrent requests**.

<figure>
  <img src="illustrations/_generated/serving_ceiling_dark.png" alt="A fixed 10 GiB KV cache pool partitioned across 4K-context requests fits 1 MHA request, 8 GQA-8 requests, or 64 MQA requests." />
  <figcaption>Each complete rectangle is the same 10 GiB raw-KV budget, partitioned into 1, 8, or 64 whole request footprints. All budgets are fully occupied. These are ideal capacity counts at the stated dimensions, not throughput or guaranteed latency.</figcaption>
</figure>

| Configuration | Raw KV per Request (4K seq) | Requests in 10 GiB Raw KV | Relative Stored Payload |
|---|---|---|---|
| **MHA (64 KV)** | ~10.74 GB | 1 request (baseline) | 1x |
| **GQA-8 (8 KV)** | ~1.34 GB | 8 requests (**8x**) | 1/8x |
| **MQA (1 KV)** | ~0.17 GB | 64 requests (**64x**) | 1/64x |

Now suppose eight requests arrive concurrently. MHA's raw cache budget leaves room for only one resident request at a time, whereas GQA-8 holds all eight resident in memory and creates an immediate batching opportunity. Measure whether the larger batch increases completed tokens per second while meeting tail-latency targets, because concurrently running requests also share compute and queue time.

### Long-context impact and serving ceilings

Longer context lengths magnify those architectural differences linearly with sequence position count. Extending prompts from 4K to 128K multiplies each request's stored K/V payload thirty-two-fold, quickly turning manageable single-request state into a multi-GPU capacity problem. The table below holds model geometry fixed while scaling context from 4K up to 1M tokens:

| Context Length | MHA KV Cache (approx.) | GQA-8 KV Cache (approx.) | Savings Factor |
|---|---|---|---|
| **4K** | ~10.7 GB | ~1.34 GB | 8x |
| **32K** | ~85.9 GB | ~10.7 GB | 8x |
| **128K** | ~343.6 GB | ~42.9 GB | 8x |
| **1M** | ~2.75 TB | ~343.6 GB | 8x |

The ungrouped 128K MHA KV payload reaches 343.6 GB, exceeding four 80 GB devices even before weights. Five devices is only a capacity lower bound, not a valid sharding plan: the head counts and engine may disallow TP=5. GQA-8 reduces this payload to 42.9 GB, but feasibility and cost still require per-rank weights, state, workspaces, and a supported parallel layout.

<!-- leetllm: test, output=show -->
```python title="budget-long-context-cache.py"
def kv_cache_gb(kv_heads: int, tokens: int) -> float:
    return 2 * 80 * tokens * kv_heads * 128 * 2 / 1e9


mha_128k = kv_cache_gb(kv_heads=64, tokens=131_072)
gqa_128k = kv_cache_gb(kv_heads=8, tokens=131_072)
print(f"MHA 128K cache: {mha_128k:.1f} GB")
print(f"GQA-8 128K cache: {gqa_128k:.1f} GB")
print("GQA cache plus 144 GB weights fits in 4x80 GB raw:", gqa_128k + 144 <= 320)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MHA 128K cache: 343.6 GB
GQA-8 128K cache: 42.9 GB
GQA cache plus 144 GB weights fits in 4x80 GB raw: True
```
<!-- leetllm: output:end -->

```checkpoint
Why doesn't the example's 43 GB cache prove that the 72B-style model fits on one 80 GB device?
---
The unquantized weight estimate alone is about 144 GB. Add the 43 GB cache, buffers, and allocation overhead. Sharding or weight quantization changes that budget; paging manages allocation waste but doesn't shrink the logical bytes of this request.
```

---

## How serving engines handle GQA head expansion

During attention computation, the query tensor carries $H_q$ heads while cached Key and Value tensors store only $H_{kv}$ heads. A simple reference path expands K/V with `repeat_interleave` to match query shape, yet materializing those expanded tensors inflates temporary VRAM back toward MHA proportions even while persistent cache stays small. Production backends such as FlashAttention (`flash_attn_with_kvcache`) and FlashInfer natively support grouped indexing without duplicating historical cache in HBM, though inspecting memory allocations confirms whether a given kernel path avoids materialization.[^flashattention2026repo][^ye2025]

<!-- leetllm: test, output=show -->
```python title="gqa-head-index.py"
def kv_index_for_query(query_head: int, query_heads: int, kv_heads: int) -> int:
    if query_heads <= 0 or kv_heads <= 0 or query_heads % kv_heads or not 0 <= query_head < query_heads:
        raise ValueError("Invalid head counts or query index.")
    return query_head // (query_heads // kv_heads)


def gqa_scores(
    queries: list[list[float]],
    kv_keys: list[list[float]],
) -> list[float]:
    """Raw dot products at one cached position, not full attention."""
    if not queries or not kv_keys or not queries[0]:
        raise ValueError("Queries and KV keys must be nonempty.")
    if any(len(row) != len(queries[0]) for row in queries + kv_keys):
        raise ValueError("All query and key widths must match.")
    scores: list[float] = []
    for i, query in enumerate(queries):
        kv_key = kv_keys[kv_index_for_query(i, len(queries), len(kv_keys))]
        scores.append(sum(q * k for q, k in zip(query, kv_key, strict=True)))
    return scores


queries = [[float(i + 1), 0.0] for i in range(8)]
kv_keys = [[1.0, 0.0], [10.0, 0.0]]
scores = gqa_scores(queries, kv_keys)
assert scores == [1.0, 2.0, 3.0, 4.0, 50.0, 60.0, 70.0, 80.0]
print("query to KV index:", [kv_index_for_query(i, 8, 2) for i in range(8)])
print("per-head scores:", scores)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
query to KV index: [0, 0, 0, 0, 1, 1, 1, 1]
per-head scores: [1.0, 2.0, 3.0, 4.0, 50.0, 60.0, 70.0, 80.0]
```
<!-- leetllm: output:end -->

```checkpoint
Why should a serving engine avoid materializing repeat_interleave for GQA?
---
Materializing repeated K/V heads creates a larger temporary tensor. Native grouped kernels can operate on compact K/V directly. Check peak allocations and traffic; the temporary expansion and the retained cache are separate memory costs.
```

---

## KV cache update correctness

Even an exact attention formula produces corrupted outputs if a cache cursor, causal mask, or position offset slips during autoregressive generation. Therefore, always validate token-by-token state transitions alongside grouped-head arithmetic. For ordinary full attention with RoPE on Q/K, trace one decode step at logical sequence cursor $t$ (which tracks sequence position rather than physical ring-buffer address):

<figure>
  <img src="illustrations/_generated/cache_update_dark.png" alt="GQA incremental decode step writes only two KV heads at slot t=1 and keeps temporary eight-head expansion strictly ephemeral during compute." />
  <figcaption>In one decode step at logical cursor 1, the layer projects 8 query heads and 2 K/V heads, rotates Q and K at position 1, writes slots 0 and 1 in persistent 2-head storage, and attends across positions 0 through 1. Expanding K/V to 8 heads happens only inside ephemeral compute, never inside persistent cache storage.</figcaption>
</figure>

1. **Projection:** Project the hidden state of the new token into $Q$ ($H_q$ heads), $K$ ($H_{kv}$ heads), and $V$ ($H_{kv}$ heads).
2. **RoPE application:** Transform Q/K using the model's position IDs and RoPE convention. In this example, use position $t$, leave V unrotated, and retain already rotated keys.
3. **Cache write:** Store the new K/V at the physical locations assigned to position $t$. A dense example might use `(batch, n_kv_heads, max_seq, d_k)`; paged, sliding-window, and MLA caches have different layouts.
4. **Attention computation:** Attend the newly projected query heads against all cached key and value positions from $0$ to $t$.
5. **Cursor increment:** Advance the sequence length cursor for this request.

<!-- leetllm: test, output=show -->
```python title="enforce-cache-append-cursor.py"
def append_kv(cache: list[str], cursor: int, token_value: str) -> int:
    if cursor != len(cache):
        raise ValueError("cursor would overwrite or skip cache state")
    cache.append(token_value)
    return cursor + 1


cache: list[str] = []
cursor = append_kv(cache, cursor=0, token_value="token-0-kv")
cursor = append_kv(cache, cursor=cursor, token_value="token-1-kv")
print("cache length:", len(cache))
try:
    append_kv(cache, cursor=1, token_value="stale-write")
except ValueError as exc:
    print("blocked:", exc)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cache length: 2
blocked: cursor would overwrite or skip cache state
```
<!-- leetllm: output:end -->

### Common cache update bugs and diagnostic checks

| Symptom | Possible cause | Verification check |
|---|---|---|
| Cached outputs diverge from full-prefix outputs | Overwriting old state or skipping a position | Check written locations, retained values, and the per-sequence length cursor |
| Works at batch size 1, crashes or outputs nonsense under batching | Shared single global cursor across requests of differing lengths | Track separate per-sequence length cursors in the batch metadata |
| GQA memory footprint matches MHA | Query-head-sized allocation or temporary expansion | Inspect retained and peak memory; check the engine's actual cache layout |
| Long-prefix cached decode fails | Incorrect positions, masking, or context configuration | Compare position IDs and visible keys with full-prefix recomputation |

### Verify non-square causal visibility

A causal mask must know where each query sits inside stored history whenever the query sequence is shorter than the key cache. PyTorch's `scaled_dot_product_attention(..., is_causal=True)` aligns the causal triangle to the **upper-left** corner on non-square score matrices, so passing one query against three cached keys exposes only `k0` and masks `k1` and `k2`.[^pytorchSdpaDocs2026] FlashAttention instead uses bottom-right alignment for non-square causal kernels.[^flashattention2026repo] Because zero query-key logits yield uniform softmax weights over visible keys, PyTorch returns `1.0` under `is_causal=True` versus the full prefix mean `(1 + 2 + 9) / 3 = 4.0` when explicit visibility includes all three keys:

<!-- leetllm: test, deps=torch, output=show -->
```python title="latest-query-causal-alignment.py"
import torch
import torch.nn.functional as F

q = torch.zeros(1, 1, 1, 2, dtype=torch.float64)
k = torch.zeros(1, 1, 3, 2, dtype=torch.float64)
v = torch.tensor([1.0, 2.0, 9.0], dtype=torch.float64).reshape(1, 1, 3, 1)

upper_left = F.scaled_dot_product_attention(q, k, v, dropout_p=0.0, is_causal=True)
all_prefix = F.scaled_dot_product_attention(q, k, v, dropout_p=0.0, is_causal=False)
torch.testing.assert_close(upper_left, torch.ones_like(upper_left))
torch.testing.assert_close(all_prefix, torch.full_like(all_prefix, 4.0))
print("upper-left causal mask:", upper_left.item())
print("latest query sees complete prefix:", all_prefix.item())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
upper-left causal mask: 1.0
latest query sees complete prefix: 4.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/latest_query_visibility_dark.png" alt="Visibility matrices for latest-token decode: upper-left causal masking hides k1 and k2 (mean 1.0), explicit full-prefix visibility recovers 4.0, and a two-query chunk requires per-row cutoffs so q3 never attends to k4." />
  <figcaption>With zero logits against values 1, 2, and 9, upper-left alignment hides keys k1 and k2 and outputs 1.00 instead of the true prefix average 4.00. Disabling the mask works for a single newest query without padding, whereas a two-query chunk at positions 3 and 4 requires row-specific causal cutoffs so q3 never sees future key k4.</figcaption>
</figure>

Disabling masking (`is_causal=False`) is safe only for a single newest query when zero padding or future keys sit in the buffer, whereas chunked queries and ragged batches must build explicit masks from logical positions and valid sequence lengths. Test cached and recomputed execution paths within the **same model**, picking tolerances suited to the precision and backend since even tiny logit shifts can flip greedy token selection near an argmax tie. The float64 GQA check below compares single-step decode and two-query chunks directly against full-prefix recomputation (using expanded heads strictly as a reference check):

<!-- leetllm: test, deps=torch, output=show -->
```python title="gqa-cached-decode-parity.py"
import math
import torch
import torch.nn.functional as F

torch.manual_seed(7)
torch.set_num_threads(1)


def grouped_attention(q, k, v, query_start=0):
    # q: [B,H,L,D], k: [B,G,S,D], v: [B,G,S,Dv]
    b, h, length, d = q.shape
    groups, stored = k.shape[1:3]
    if query_start < 0 or query_start + length > stored:
        raise ValueError("Queries must correspond to positions inside the stored prefix.")
    queries = q.reshape(b, groups, h // groups, length, d)
    scores = torch.einsum("bgrld,bgsd->bgrls", queries, k) / math.sqrt(d)
    query_positions = torch.arange(query_start, query_start + length, device=q.device)
    visible = torch.arange(stored, device=q.device)[None, :] <= query_positions[:, None]
    weights = scores.masked_fill(~visible, -torch.inf).softmax(dim=-1)
    output = torch.einsum("bgrls,bgsd->bgrld", weights, v)
    return output.reshape(b, h, length, v.shape[-1])


def rope(tensor, start):
    d = tensor.shape[-1]
    if d % 2:
        raise ValueError("Paired-coordinate RoPE requires even head width.")
    positions = torch.arange(start, start + tensor.shape[-2], dtype=tensor.dtype)
    frequencies = 10000.0 ** (-torch.arange(0, d, 2, dtype=tensor.dtype) / d)
    angles = positions[:, None] * frequencies[None, :]
    even, odd = tensor[..., 0::2], tensor[..., 1::2]
    return torch.stack((even * angles.cos() - odd * angles.sin(),
                        even * angles.sin() + odd * angles.cos()), dim=-1).flatten(-2)


B, H, G, T, D = 2, 8, 2, 6, 4
model_dim = H * D
x = torch.randn(B, T, model_dim, dtype=torch.float64)
wq = torch.randn(model_dim, H * D, dtype=torch.float64) / math.sqrt(model_dim)
wk = torch.randn(model_dim, G * D, dtype=torch.float64) / math.sqrt(model_dim)
wv = torch.randn(model_dim, G * D, dtype=torch.float64) / math.sqrt(model_dim)
wo = torch.randn(H * D, 11, dtype=torch.float64) / math.sqrt(H * D)


def project(tokens, start=0):
    b, n, _ = tokens.shape
    q = (tokens @ wq).reshape(b, n, H, D).transpose(1, 2)
    k = (tokens @ wk).reshape(b, n, G, D).transpose(1, 2)
    v = (tokens @ wv).reshape(b, n, G, D).transpose(1, 2)
    return rope(q, start), rope(k, start), v


def to_logits(heads):
    return heads.transpose(1, 2).reshape(B, heads.shape[2], H * D) @ wo


q, k, v = project(x)
expanded_k = k.repeat_interleave(H // G, dim=1)
expanded_v = v.repeat_interleave(H // G, dim=1)
reference = F.scaled_dot_product_attention(q, expanded_k, expanded_v,
                                          dropout_p=0.0, is_causal=True)
full = grouped_attention(q, k, v)
torch.testing.assert_close(full, reference, rtol=1e-10, atol=1e-10)

k_cache = torch.empty(B, G, 0, D, dtype=x.dtype)
v_cache = torch.empty_like(k_cache)
cached_outputs = []
for position in range(T):
    q_new, k_new, v_new = project(x[:, position:position + 1], start=position)
    k_cache = torch.cat((k_cache, k_new), dim=2)
    v_cache = torch.cat((v_cache, v_new), dim=2)
    cached = grouped_attention(q_new, k_cache, v_cache, query_start=position)
    q_prefix, k_prefix, v_prefix = project(x[:, :position + 1])
    recomputed = grouped_attention(q_prefix, k_prefix, v_prefix)[:, :, -1:]
    torch.testing.assert_close(to_logits(cached), to_logits(recomputed), rtol=1e-10, atol=1e-10)
    cached_outputs.append(cached)

torch.testing.assert_close(torch.cat(cached_outputs, dim=2), full, rtol=1e-10, atol=1e-10)

# Two new queries after an existing prefix: each has a different causal cutoff.
for start in (1, 3):
    stop = start + 2
    q_chunk, _, _ = project(x[:, start:stop], start=start)
    chunk = grouped_attention(q_chunk, k[:, :, :stop], v[:, :, :stop], query_start=start)
    torch.testing.assert_close(chunk, full[:, :, start:stop], rtol=1e-10, atol=1e-10)
    unmasked = F.scaled_dot_product_attention(
        q_chunk, expanded_k[:, :, :stop], expanded_v[:, :, :stop], dropout_p=0.0)
    # The first query can wrongly read the second query's future K/V.
    assert not torch.allclose(unmasked[:, :, :1], chunk[:, :, :1], rtol=1e-10, atol=1e-10)

print("grouped matches repeated-head SDPA:", True)
print("cached logits match full-prefix recompute at every step:", True)
print("two-query chunks match full-prefix slices:", True)
print("unmasked chunks leak future values:", True)
print("stored K shape:", tuple(k_cache.shape))
print("logical K/V element reduction:", (expanded_k.numel() + expanded_v.numel()) //
      (k_cache.numel() + v_cache.numel()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
grouped matches repeated-head SDPA: True
cached logits match full-prefix recompute at every step: True
two-query chunks match full-prefix slices: True
unmasked chunks leak future values: True
stored K shape: (2, 2, 6, 4)
logical K/V element reduction: 4
```
<!-- leetllm: output:end -->

In a two-query chunk starting at position 3, the first query sees keys 0 through 3 while the second sees keys 0 through 4. This comparison verifies both rows against full-prefix execution and confirms that omitting the mask lets future key 4 leak into the first row. Therefore, the single-query no-mask shortcut shown earlier cannot be applied safely to multi-token chunks, and ragged batches still require per-request length and position metadata.

```checkpoint
Cached decode starts drifting after token 200, while full-prefix recompute still looks correct. Which invariants do you inspect first?
---
Check per-request positions, valid lengths, append locations, and visible keys. Verify KV-head counts using the actual cache layout. Find the first divergent step on a small reproducible prefix; a symptom alone doesn't identify its cause.
```

---

## Common pitfalls

A correct head-sharing formula can still be misapplied to the wrong memory budget or kernel configuration. Those mismatches typically surface when a model that fits on paper triggers an out-of-memory error under concurrent load, or when shrinking cached state barely speeds up token generation. Reviewing weights, temporary expansion buffers, and parallel head placement together exposes where resources are actually spent.

### Conflating model weights with KV cache memory

- **Symptom:** An engineering team calculates that an unquantized 70B model requires 140 GB of VRAM, deploys it across two 80 GB GPUs (160 GB total VRAM), and watches the server crash with Out-Of-Memory errors after serving just four concurrent long-context requests.
- **Cause:** Model weights are static. The KV cache is dynamic per-request memory that grows with concurrent batch size and sequence length ($B \times S$).
- **Remedy:** Budget weights, cache, temporary tensors, runtime reservations, and allocation overhead separately on each device. Measure peak memory at the intended sequence lengths and concurrency; a fixed reserve percentage cannot guarantee fit.

### Assuming GQA accelerates pretraining throughput

- **Symptom:** A team switches their training pipeline from MHA to GQA and wonders why pretraining steps take almost the identical wall-clock time.
- **Cause:** Fewer K/V projections reduce some parameters and projection FLOPs, but every query head still computes attention scores and weighted values. Training time also depends on backward kernels, activations, communication, and the rest of the model.
- **Remedy:** Measure training and serving separately. GQA can affect both; a large decode-cache saving need not yield a matching training speedup.

### Believing an 8x KV cache cut guarantees an 8x throughput speedup

- **Symptom:** Your measured raw cache shrinks by 8x, while completed tokens per second changes little.
- **Cause:** Cache reads are one part of execution. Weight traffic, feed-forward layers, other kernels, communication, and scheduling can dominate. Their relative costs change with context length, batch size, precision, and hardware.
- **Remedy:** Measure service latency and throughput, then profile the limiting work. Try batching within a latency budget if arrivals and memory allow it. Report the measured gain and workload instead of inferring a speedup from bytes saved.

### Expanding KV heads with repeat_interleave in serving kernels

- **Symptom:** A custom serving implementation of GQA runs out of memory during inference despite using an 8x smaller KV cache.
- **Cause:** The implementation called `repeat_interleave` in PyTorch to expand KV heads before running attention, temporarily materializing the full MHA tensor in VRAM.
- **Remedy:** Use native grouped-attention kernels like FlashAttention or FlashInfer that take separate query and KV head counts directly.

### Overlooking KV head replication in tensor parallelism

- **Symptom:** Deploying an 8-KV-head model across 16 GPUs uses significantly more KV cache memory than anticipated.
- **Cause:** When TP degree exceeds the KV head count ($\text{TP} > g$), engines like vLLM replicate KV heads so each GPU owns at least one KV head.
- **Remedy:** Account for the engine's physical copies. In the illustrated vLLM Llama layout, TP=8 avoids KV-head replication; TP=16 may still be necessary for other memory or latency constraints. Compare per-rank fit, communication, and serving results rather than choosing TP from the KV count alone.

---

## Validate a GQA conversion before rollout

Before promoting a newly converted or trained GQA model to production, verify numerical parity, batch isolation, sharding allocations, and downstream quality together. Walking through these five validation checks ensures you know the exact head layout, physical byte count, and where any replication or masking error might hide:

1. **Parity testing:** Compare cached and full-prefix execution within the converted model, using justified absolute and relative tolerances. Include one-token and multi-token cached queries.
2. **Batch consistency:** Run test requests with ragged sequence lengths (e.g., prompt lengths 128, 512, and 2,048 in the same batch) to ensure per-request cursors don't overwrite adjacent cache buffers.
3. **Tensor parallel verification:** Test the production layout against a trusted reference layout that can fit the model. Compare outputs and measured per-rank allocations, including replicated heads.
4. **Context configuration:** Verify the checkpoint's supported context, positional configuration, and retention rules. Test long-prefix quality and retrieval at the intended lengths; a larger allocation or RoPE scaling flag does not guarantee model capability.
5. **Quality and serving evaluation:** Set acceptable quality changes against the old model before testing held-out tasks. Separately measure latency, throughput, and peak memory at the intended workload. Cache parity doesn't certify the conversion's quality.

```mastery-quiz
[
  {
    "question": "A decoder keeps 60 query heads and 10 key/value heads. Which sharing pattern follows?",
    "options": [
      "MQA with 10 separate query results total.",
      "MHA with one KV history per query.",
      "GQA with 6 queries per KV group.",
      "GQA with 10 queries per KV group."
    ],
    "answer": "GQA with 6 queries per KV group.",
    "explanation": "The group size is 60/10=6. Query vectors and outputs remain separate; 10 KV heads is intermediate between 1 and 60."
  },
  {
    "question": "A decode layer has 24 query heads, 6 KV heads and 1 byte per cached value. Count only QK and AV products and one distinct K/V read. What ideal intensity follows?",
    "options": [
      "8 FLOPs/byte, using 2×24/(1×6).",
      "4 FLOPs/byte, using 24/6.",
      "2 FLOPs/byte, using the two stored arrays.",
      "16 FLOPs/byte, using 4×24/(1×6)."
    ],
    "answer": "8 FLOPs/byte, using 2×24/(1×6).",
    "explanation": "Divide 4 BHqSd operations by 2 BHkvSdP bytes: 2 Hq/(PHkv)=8. This assumes one distinct cached read and reuse within groups, while omitting other work."
  },
  {
    "question": "A decoder has 36 identical full-attention layers, each with 24 query heads and 6 KV heads. Each key and each value has 64 elements at 2 bytes per element. The decoder caches 4,096 positions separately for each of 4 requests. What is the total raw K/V payload in decimal GB, rounded to three decimal places?",
    "options": [
      "0.453 GB",
      "3.624 GB",
      "0.025 GB",
      "0.906 GB"
    ],
    "answer": "0.906 GB",
    "explanation": "At each position, one layer stores a key and a value for each of 6 heads. That takes 2 × 6 × 64 × 2 = 1,536 bytes. Across all requests and layers, 1,536 × 4,096 × 4 × 36 = 905,969,664 bytes, or about 0.906 GB. Counting only one layer gives 0.025 GB. Counting only the keys gives 0.453 GB. Storing a K/V pair for each of the 24 query heads would take 3.624 GB in matching MHA. The grouped cache uses one quarter of that payload."
  },
  {
    "question": "A read-only timing model moves 56 GB of weights and 8 GB of K/V per step over 1 TB/s. A GQA change reduces only K/V bytes eightfold. What lower bounds and speed ratio follow before other work?",
    "options": [
      "64 ms to 8 ms, exactly 8×.",
      "64 ms to 57 ms, about 1.12×.",
      "64 ms to 56 ms, about 1.14×.",
      "64 ms to 7 ms, about 9.14×."
    ],
    "answer": "64 ms to 57 ms, about 1.12×.",
    "explanation": "The original reads 56+8=64 GB. After K/V falls to 1 GB, total reads are 57 GB. At 1000 GB/s those become 64 and 57 ms; 64/57≈1.123. This lower bound assumes these reads determine time and omits compute and other traffic."
  },
  {
    "question": "For an MLA content term, W has rows [2,−1] and [1,3], query q=[1,2], and cached latent c=[3,1]. Which absorbed query can be reused across history, and what score does it give for c?",
    "options": [
      "Wᵀq=[4,5], giving score 17.",
      "Wq=[0,7], giving score 7.",
      "Wc=[5,6], giving score 21.",
      "The first W row [2,−1], giving score 5."
    ],
    "answer": "Wᵀq=[4,5], giving score 17.",
    "explanation": "Wc=[5,6] and q·Wc=5+12=17. Wᵀq=[4,5] depends on q and W rather than historical c, and [4,5]·[3,1]=17. The alternative expanded key is position-specific storage, not the reusable query."
  },
  {
    "question": "Keep W rows [2,−1],[1,3], current rotated query [1,0] and latent [3,1]. One cached position uses identity key rotation; another rotates the expanded key 90° counterclockwise. Which absorbed-query and score pairs follow?",
    "options": [
      "[2,−1] gives 5; [2,−1] gives 5.",
      "[2,−1] gives 5; [1,3] gives 6.",
      "[2,−1] gives 5; [−1,−3] gives−6.",
      "[1,3] gives 6; [2,−1] gives 5."
    ],
    "answer": "[2,−1] gives 5; [−1,−3] gives−6.",
    "explanation": "The expanded key is [5,6]. Identity gives query dot 5; rotating it gives[−6,5] and score −6. WᵀRᵀq is [2,−1] at identity and [−1,−3] at 90°. Associativity holds separately, but the absorbed query depends on cached position. Separate positional scoring permits reusable content absorption."
  },
  {
    "question": "An older MHA checkpoint has 40 K/V heads. You want to convert it to a GQA model with 5 K/V heads without training from scratch. What plan matches the uptraining recipe?",
    "options": [
      "Mean-pool Q slices within 5 groups, retain K/V initialization, then adapt and evaluate the converted model.",
      "Mean-pool K/V slices within 5 groups, retain Q/output initialization, then adapt and evaluate the converted model.",
      "Keep 40 K/V slices, retain every eighth cached position, then adapt and evaluate the converted model.",
      "Randomize 5 K/V slices, freeze Q/output, then accept the converted model after checking its stored shape."
    ],
    "answer": "Mean-pool K/V slices within 5 groups, retain Q/output initialization, then adapt and evaluate the converted model.",
    "explanation": "Forty old K/V heads pooled into 5 groups use 8 original heads per group. Pool compatible K/V biases too. Q and output projections retain their initialization; later training can update them. The historical T5 experiment used 5% of original steps and does not guarantee another checkpoint quality."
  },
  {
    "question": "In the illustrated vLLM Llama layout, 96 query heads and 6 KV heads run at TP=12. Which physical count follows?",
    "options": [
      "16 queries/rank; 1 KV/rank; 12 physical copies; 2 copies per logical head.",
      "8 queries/rank; 2 KV/rank; 24 physical copies; 4 copies per logical head.",
      "8 queries/rank; 1 KV/rank; 6 physical copies; 1 copy per logical head.",
      "8 queries/rank; 1 KV/rank; 12 physical copies; 2 copies per logical head."
    ],
    "answer": "8 queries/rank; 1 KV/rank; 12 physical copies; 2 copies per logical head.",
    "explanation": "96/12=8 queries per rank. TP=12 exceeds 6 KV heads and 12/6=2, so every rank stores one physical head and 6 logical identities appear twice. This implementation layout need not describe all engines."
  },
  {
    "question": "One decode layer has 24 query heads and 6 KV heads. Its compact cache holds 1,024 positions for each of 2 requests. Keys and values each have width 64 and use 2 bytes per element. The compact cache stays live while the layer holds separate copies of both arrays expanded to 24 heads. How much memory do these K/V arrays occupy at peak?",
    "options": [
      "12 MiB",
      "24 MiB",
      "15 MiB",
      "13.5 MiB"
    ],
    "answer": "15 MiB",
    "explanation": "The compact keys take 2 × 1,024 × 6 × 64 × 2 bytes, or 1.5 MiB. The values take another 1.5 MiB. Expanding from 6 to 24 heads makes each copy four times as large, or 6 MiB. At peak, all four arrays occupy 1.5 + 1.5 + 6 + 6 = 15 MiB. Counting only the expanded copies gives 12 MiB. Including just one compact array with those copies gives 13.5 MiB. Pricing both the compact cache and the copies at 24 heads gives 24 MiB."
  },
  {
    "question": "One latest query at position 2 has zero scores and valid cached values 2,4,12 at positions 0,1,2. Which position-aware visibility and output are correct?",
    "options": [
      "Keys 0,1,2; output 6.",
      "Key 0 only; output 2.",
      "Keys 0,1; output 3.",
      "Keys 1,2; output 8."
    ],
    "answer": "Keys 0,1,2; output 6.",
    "explanation": "The latest query can see all 3 keys, so (2+4+12)/3=6. A one-row upper-left mask exposes only the first key. The no-mask shortcut requires one latest query and no padding or future keys; chunks need row-specific causal cutoffs."
  }
]
```

> **Next:** Continue to [KV Cache & PagedAttention](/learn/kv-cache-paged-attention-llm-serving). We have counted the state an attention architecture needs. Next, trace how an engine allocates that state, shares prefixes, and manages page reservations as requests arrive and finish.
