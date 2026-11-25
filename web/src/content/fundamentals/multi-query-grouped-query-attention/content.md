---
{
  "id": "multi-query-grouped-query-attention",
  "title": "Multi-Query & Grouped-Query Attention",
  "slug": "multi-query-grouped-query-attention",
  "section": "GPU Systems & LLM Inference",
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

Eight query heads can attend to the exact same conversation and produce eight completely different outputs. Do they really need eight separate copies of the key and value history? **Multi-Query Attention (MQA)** says no: keep every query head distinct, and share one key/value head across all of them.[^shazeer2019] **Grouped-Query Attention (GQA)** sits in the sweet spot between MQA and full Multi-Head Attention (MHA), sharing one KV head across each group of queries.[^ainslie2023]

Why does that one architectural tweak matter so much? Because during autoregressive decoding on a 72B-class model (80 layers, 64 heads, $d_k = 128$, FP16), 32 concurrent 4K requests consume **343.6 GB** of raw MHA KV cache, more than double the model's 144 GB of weights! Sharing KV heads in groups of 8 (GQA-8) slashes that cache 8x to **42.95 GB**, and DeepSeek's **Multi-Head Latent Attention (MLA)** compresses it even further into a learned 512-dim latent plus a 64-dim RoPE vector.[^deepseekv2_2024]

<figure>
  <img src="illustrations/_generated/attention_variants_dark.png" alt="Three attention head sharing topologies across eight query heads: MHA uses eight key-value heads, GQA uses two groups of four query heads, and MQA uses one shared key-value head." />
  <figcaption>All eight query heads stay distinct while stored KV pairs drop from 8 (MHA) to 2 (GQA) and 1 (MQA), shrinking raw KV storage by 4x and 8x.</figcaption>
</figure>

```checkpoint
What do MQA and GQA change compared with standard multi-head attention?
---
They keep all query heads distinct but reduce the number of stored key and value heads. MQA shares one KV head across all queries; GQA shares KV heads across groups of queries.
```

## Why KV cache memory becomes the bottleneck

During autoregressive decode, each step generates one token ($N_q = 1$) while reading the entire stored KV history from HBM.[^vaswani2017][^pope2023] For a batch of $B$ sequences at length $S$ with $H_q$ query heads, $H_{kv}$ KV heads of width $d_k$, and $P$ bytes per element (`2` for FP16/BF16):

- **Attention FLOPs ($QK^\top$ + $\alpha V$):** $4 B H_q S d_k$
- **Ideal KV HBM traffic (each distinct KV head loaded once):** $2 B H_{kv} S d_k P\text{ bytes}$

Divide the two and $B$, $S$, and $d_k$ cancel completely, leaving decode **operational intensity**:

$$
\text{Operational Intensity} = \frac{4 B H_q S d_k}{2 B H_{kv} S d_k P} = \frac{2}{P} \cdot \frac{H_q}{H_{kv}} \text{ FLOPs/byte}
$$

In FP16 MHA ($H_q = H_{kv}$, $P = 2$), operational intensity is **1 FLOP/byte**. On an NVIDIA H100 SXM (989.5 TFLOPS dense BF16, 3.35 TB/s HBM, ridge point **295.4 FLOPs/byte**),[^nvidia2026h100][^nvidia2022hopper] 1 FLOP/byte caps compute at `3.35 TFLOPS`, leaving over 99.6% of Tensor Core throughput idle waiting on memory!

### Total KV cache formula

Multiply per-token-per-layer KV storage ($2 \cdot H_{kv} \cdot d_k \cdot P$) across $L$ layers, $S$ tokens, and $B$ concurrent requests:

$$
\text{Total KV cache} = 2 \cdot L \cdot S \cdot B \cdot H_{kv} \cdot d_k \cdot P \text{ bytes}
$$

On 72B-style dimensions ($L=80, H_q=64, d_k=128, P=2$) over `131,072` stored positions (either `32 × 4K` or `1 × 128K`):
- **MHA (`64` KV heads):** **343.60 GB** (`32 KiB` per token per layer)
- **GQA-8 (`8` KV heads):** **42.95 GB** (`4 KiB` per token per layer, **8x** smaller, **8 FLOPs/byte**)
- **MQA (`1` KV head):** **5.37 GB** (`512 B` per token per layer, **64x** smaller, **64 FLOPs/byte**)

<figure>
  <img src="illustrations/_generated/kv_heads_comparison_dark.png" alt="Bar chart comparing 70B 128K FP16 KV cache across MHA (343.6 GB), GQA-8 (42.95 GB), and MQA (5.37 GB) alongside an H100 80 GB limit badge and a 32x4K versus 1x128K shape comparison." />
  <figcaption>Raw 70B/128K FP16 KV cache drops from 343.6 GB (MHA) to 42.95 GB (GQA-8) and 5.37 GB (MQA).</figcaption>
</figure>

## Multi-Query and Grouped-Query Attention

Why can two query heads sharing the *exact same* keys and values still extract completely different information? Because each query head multiplies those shared keys by its own distinct query vector $q_i$, producing a different softmax weight distribution over the shared values!

<figure>
  <img src="illustrations/_generated/shared_kv_different_queries_dark.png" alt="Two query vectors read the same shared key and value rows. Scaling by square root of two gives score rows [0.707, 0] and [0, 0.707]; softmax gives [0.67, 0.33] and [0.33, 0.67]. With value rows [1, 0] and [0, 1], each output equals its own weights." />
  <figcaption>Two distinct queries attend over the same shared K/V rows and produce completely distinct outputs (`[0.67, 0.33]` vs. `[0.33, 0.67]`).</figcaption>
</figure>

MQA gives the maximum $H_q\times$ savings at the cost of squeezing every head through one shared KV subspace, which can slightly degrade quality on complex tasks.[^shazeer2019] **GQA** keeps $g$ KV heads ($1 < g < H_q$), serving $G = H_q / g$ queries per KV group and matching MHA quality closely across modern open-weight models:[^ainslie2023]

| Model | $H_q$ | $H_{kv}$ | Ratio | Context notes |
|---|---:|---:|---:|---|
| **Llama 3.1 8B / 70B / 405B**[^dubey2024] | 32 / 64 / 128 | 8 / 8 / 8 | 4:1 / 8:1 / 16:1 | 128K |
| **Llama 2 70B**[^touvron2023a] | 64 | 8 | 8:1 | 4K |
| **Qwen2.5-72B-Instruct**[^qwen2572bCard2026] | 64 | 8 | 8:1 | 32K (128K w/ YaRN) |
| **Mistral 7B v0.3**[^jiang2023][^mistral7bv03Config2026] | 32 | 8 | 4:1 | 32K (`sliding_window: null`) |
| **Gemma 2 9B**[^gemma2team2024] | 16 | 8 | 2:1 | Alternating 4K local / 8K global |
| **Qwen3.6-27B attention path**[^qwen3627b2026] | 24 | 4 | 6:1 | 256K native (hybrid recurrent layers) |

### Tensor parallelism and KV-head replication

In engines like vLLM, `TP` must divide $H_q$. When $\text{TP} \le H_{kv}$, each rank owns $H_{kv} / \text{TP}$ unique KV heads with zero duplication. When $\text{TP} > H_{kv}$ (for instance, Llama 3.1 70B's 8 KV heads at `TP=16`), each rank stores 1 KV head, duplicating every logical KV head across $\text{TP} / H_{kv} = 2$ ranks and trimming the aggregate savings from `8x` down to `4x`.[^vllmLlamaAttention2026]

<figure>
  <img src="illustrations/_generated/kv_shard_replication_dark.png" alt="Tensor-parallel KV head sharding for Hkv=8: TP=4 stores two unique KV heads per GPU (8 physical total), whereas TP=16 replicates KV heads twice across GPUs (16 physical total)." />
  <figcaption>At TP=4, 8 KV heads split cleanly (2/GPU, 8x savings). At TP=16, every KV head replicates onto 2 GPUs (16 physical copies, 4x savings).</figcaption>
</figure>

## Converting MHA to GQA via uptraining

You do not need to retrain from scratch to turn an MHA checkpoint into GQA. Ainslie et al.'s **uptraining** recipe initializes each grouped KV head as the **mean** of its $G$ original MHA head projections, keeps $W_Q$ and $W_O$ intact, and runs continued pretraining for roughly **5%** of original steps:[^ainslie2023]

$$
W_{K, j}^{\text{GQA}} = \frac{1}{G} \sum_{i \in \text{group } j} W_{K, i}^{\text{MHA}}, \qquad
W_{V, j}^{\text{GQA}} = \frac{1}{G} \sum_{i \in \text{group } j} W_{V, i}^{\text{MHA}}
$$

Why is uptraining mandatory after mean-pooling? Because averaging two opposing heads (`k = [1, -1]` and `[-1, 1]`) cancels their keys to `[0, 0]` and smears their outputs from `8.81` down to `5.00` before gradient steps adapt the queries to share!

<figure>
  <img src="illustrations/_generated/gqa_uptraining_dark.png" alt="GQA uptraining pipeline: train MHA, mean-pool key and value heads per group, uptrain queries for 5% of pretraining budget, and evaluate GQA quality, alongside an opposing-key mean-pool output shift chart." />
  <figcaption>Uptraining mean-pools MHA KV heads into GQA groups and continues training (~5% of pretraining steps) to repair the immediate output shift caused by averaging opposing heads.</figcaption>
</figure>

## Beyond GQA: Multi-head latent attention (MLA)

Instead of dropping KV heads, DeepSeek-V2 and DeepSeek-V3's **Multi-Head Latent Attention (MLA)** compresses every token's keys and values into a single shared low-rank latent $c_t^{KV} = W^{DKV} h_t \in \mathbb{R}^{d_c}$ ($d_c = 512$ vs. $128 \times 128 = 16{,}384$!).[^deepseekv2_2024][^deepseekv3_2024]

During decode, **matrix absorption** lets the engine never materialize expanded per-head keys $k_{s,i}^C = W_i^{UK} c_s^{KV}$: by associativity, absorb $(W_i^{UK})^\top$ directly into the current query vector:

$$
(q_{t,i}^C)^\top (W_i^{UK} c_s^{KV}) = \big((W_i^{UK})^\top q_{t,i}^C\big)^\top c_s^{KV}
$$

Wait: why does MLA keep a separate **decoupled RoPE** vector $k_s^R \in \mathbb{R}^{64}$ outside $c_s^{KV}$? Because RoPE inserts a position-dependent rotation matrix $\mathcal{R}_s$ between $q_t$ and $W_i^{UK}$, and $\mathcal{R}_s$ does not commute with $W_i^{UK}$! Leaving RoPE on the compressed key would force a different absorbed query $(W_i^{UK})^\top \mathcal{R}_s^\top \mathcal{R}_t q_t$ for every single past position $s$. Decoupling content ($512$) from position ($64$) keeps cache size at just **576 floats/token/layer** (`3.56x` smaller than GQA-8's `2,048` and `56.9x` smaller than 128-head MHA's `32,768`, equivalent to `2.25` GQA heads!).

<figure>
  <img src="illustrations/_generated/mla_vs_gqa_dark.png" alt="Comparison of per-token KV cache elements across GQA-8 (2,048), GQA-4 (1,024), MLA (576), and MQA (256), alongside naive expansion versus matrix-absorbed MLA decode paths reaching 398.0423." />
  <figcaption>MLA caches 512 latent + 64 RoPE floats per token (576 total) vs. 2,048 for GQA-8, absorbing $W^{UK}$ into the query during decode for exact numerical parity.</figcaption>
</figure>

<!-- leetllm: test, deps=torch, output=show -->
```python title="mla-absorption-and-rope-decoupling.py"
import torch

# 1. Exact MLA matrix absorption: (q @ W_UK) @ c == q @ (W_UK @ c)
W_UK = torch.tensor([[2.0, -1.0], [1.0, 3.0]], dtype=torch.float64)
q = torch.tensor([1.0, 2.0], dtype=torch.float64)
c = torch.tensor([3.0, 1.0], dtype=torch.float64)
absorbed_q = W_UK.T @ q
print(f"expanded score={torch.dot(q, W_UK @ c):.1f}, absorbed score={torch.dot(absorbed_q, c):.1f}")

# 2. Why RoPE must be decoupled: different positions s need different absorbed queries
rot90 = torch.tensor([[0.0, -1.0], [1.0, 0.0]], dtype=torch.float64)
q_pos0 = W_UK.T @ torch.eye(2, dtype=torch.float64).T @ q
q_pos1 = W_UK.T @ rot90.T @ q
print("same absorbed query across positions?:", torch.equal(q_pos0, q_pos1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
expanded score=17.0, absorbed score=17.0
same absorbed query across positions?: False
```
<!-- leetllm: output:end -->

## Serving impact, native kernels, and KV cache correctness

In a fixed **10 GiB** raw KV pool on a 72B-style model at 4K context, MHA fits **1** request (`10.74 GB`), GQA-8 fits **8** (`1.34 GB`), and MQA fits **64** (`0.17 GB`), directly unlocking larger decode batches.

<figure>
  <img src="illustrations/_generated/serving_ceiling_dark.png" alt="A fixed 10 GiB KV cache pool partitioned across 4K-context requests fits 1 MHA request, 8 GQA-8 requests, or 64 MQA requests." />
  <figcaption>Inside a 10 GiB KV budget at 4K context, GQA-8 holds 8x as many concurrent sequences as MHA, unlocking batching headroom.</figcaption>
</figure>

Three runtime implementation details separate fast, bug-free GQA serving from silent corruption or OOMs:

1. **Never materialize `repeat_interleave` in production:** Expanding $H_{kv}$ heads to $H_q$ heads allocates temporary MHA-sized copies in VRAM. Use native grouped kernels such as FlashAttention (`flash_attn_with_kvcache`) or FlashInfer.[^flashattention2026repo][^ye2025]
2. **Track per-request cursors and RoPE positions:** Rotate new $Q$ and $K$ at logical position $t$, write only the $H_{kv}$ compact heads into persistent cache, and track separate cursors per sequence in ragged batches.
3. **Watch non-square causal masks:** PyTorch's `F.scaled_dot_product_attention(..., is_causal=True)` aligns the triangle **upper-left**, hiding cached keys `k1, k2` from a single latest query (`output = 1.0` instead of `4.0`)![^pytorchSdpaDocs2026] Disable the mask only for a single unpadded latest query, and build explicit position-aware masks (`k_pos <= q_pos`) for multi-token chunks.

<figure>
  <img src="illustrations/_generated/cache_update_dark.png" alt="GQA incremental decode step writes only two KV heads at slot t=1 and keeps temporary eight-head expansion strictly ephemeral during compute." />
  <figcaption>Incremental GQA decode rotates Q and K at logical cursor $t=1$ and writes only the 2 compact KV heads to persistent cache.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/latest_query_visibility_dark.png" alt="Visibility matrices for latest-token decode: upper-left causal masking hides k1 and k2 (mean 1.0), explicit full-prefix visibility recovers 4.0, and a two-query chunk requires per-row cutoffs so q3 never attends to k4." />
  <figcaption>Upper-left `is_causal=True` blinds a single decode query to keys k1–k2; multi-token chunks need row-specific causal cutoffs.</figcaption>
</figure>

Let's verify grouped attention + RoPE + incremental single-step and two-token chunk decoding against full-prefix recomputation in PyTorch:

<!-- leetllm: test, deps=torch, output=show -->
```python title="gqa-cached-decode-parity.py"
import math
import torch
import torch.nn.functional as F

torch.manual_seed(7)

def rope(t, start):
    d = t.shape[-1]
    pos = torch.arange(start, start + t.shape[-2], dtype=t.dtype)
    freq = 10000.0 ** (-torch.arange(0, d, 2, dtype=t.dtype) / d)
    ang = pos[:, None] * freq[None, :]
    e, o = t[..., 0::2], t[..., 1::2]
    return torch.stack((e * ang.cos() - o * ang.sin(), e * ang.sin() + o * ang.cos()), dim=-1).flatten(-2)

def grouped_attn(q, k, v, q_start=0):
    B, H, L, D = q.shape
    G, S = k.shape[1:3]
    qg = q.reshape(B, G, H // G, L, D)
    scores = torch.einsum("bgrld,bgsd->bgrls", qg, k) / math.sqrt(D)
    visible = torch.arange(S)[None, :] <= torch.arange(q_start, q_start + L)[:, None]
    w = scores.masked_fill(~visible, -torch.inf).softmax(dim=-1)
    return torch.einsum("bgrls,bgsd->bgrld", w, v).reshape(B, H, L, v.shape[-1])

B, H, G, T, D = 2, 8, 2, 6, 4
x = torch.randn(B, T, H * D, dtype=torch.float64)
wq, wk, wv = [torch.randn(H * D, n * D, dtype=torch.float64) / math.sqrt(H * D) for n in (H, G, G)]

def proj(toks, start=0):
    b, n, _ = toks.shape
    q = (toks @ wq).reshape(b, n, H, D).transpose(1, 2)
    k = (toks @ wk).reshape(b, n, G, D).transpose(1, 2)
    v = (toks @ wv).reshape(b, n, G, D).transpose(1, 2)
    return rope(q, start), rope(k, start), v

q_all, k_all, v_all = proj(x)
full = grouped_attn(q_all, k_all, v_all)
ref_sdpa = F.scaled_dot_product_attention(q_all, k_all.repeat_interleave(H // G, 1), v_all.repeat_interleave(H // G, 1), is_causal=True)
torch.testing.assert_close(full, ref_sdpa)

# Step-by-step cached decode + 2-token chunk check
kc, vc, outs = torch.empty(B, G, 0, D, dtype=x.dtype), torch.empty(B, G, 0, D, dtype=x.dtype), []
for pos in range(T):
    qn, kn, vn = proj(x[:, pos:pos+1], start=pos)
    kc, vc = torch.cat((kc, kn), 2), torch.cat((vc, vn), 2)
    outs.append(grouped_attn(qn, kc, vc, q_start=pos))
torch.testing.assert_close(torch.cat(outs, 2), full)

q_chunk, _, _ = proj(x[:, 3:5], start=3)
chunk_out = grouped_attn(q_chunk, k_all[:, :, :5], v_all[:, :, :5], q_start=3)
torch.testing.assert_close(chunk_out, full[:, :, 3:5])
print("cached single-step & 2-token chunk parity: exact | compact K shape:", tuple(kc.shape))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cached single-step & 2-token chunk parity: exact | compact K shape: (2, 2, 6, 4)
```
<!-- leetllm: output:end -->

## Common pitfalls before deployment

- **Expecting an 8x KV cut to give an 8x speedup:** Model weights (e.g., 56 GB weights vs. 8 GB KV) still stream on every decode step, so shrinking KV 8x moves total reads from `64 GB` to `57 GB` (~`1.12x` faster at batch 1) until larger batches shift the bottleneck onto KV.
- **Expecting GQA to speed up pretraining:** Every query head still computes $QK^\top$ and $\alpha V$; GQA primarily accelerates memory-bound decoding and raises serving concurrency.
- **Shipping a converted GQA model without parity checks:** Always validate single-token and multi-token cached parity against full-prefix recompute, ragged-batch cursor isolation, per-rank TP memory (including KV replication), and held-out task quality.

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
    "explanation": "Forty old K/V heads pooled into 5 groups use 8 original heads per group. Pool compatible K/V biases too. Q and output projections retain their initialization; later training can update them."
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
    "explanation": "96/12=8 queries per rank. TP=12 exceeds 6 KV heads and 12/6=2, so every rank stores one physical head and 6 logical identities appear twice."
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

> **Next:** Continue to [KV Cache & PagedAttention](/learn/kv-cache-paged-attention-llm-serving).
