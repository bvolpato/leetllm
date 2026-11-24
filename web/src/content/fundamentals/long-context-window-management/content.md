---
{
  "id": "long-context-window-management",
  "title": "Long Context Window Management",
  "slug": "long-context-window-management",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 22,
  "coverImage": "illustrations/_generated/context_strategies_dark.png",
  "companies": [
    "Google",
    "Anthropic",
    "OpenAI",
    "Meta",
    "DeepSeek"
  ],
  "shortDescription": "A multi-module codebase can fit inside an advertised context window and still bury the constant you need, or cost more KV cache than model weights.",
  "keyConceptsTested": [
    "RoPE position extensions (interpolation, NTK-aware scaling, YaRN)",
    "Sliding-window attention and local-vs-global attention trade-offs",
    "Prefill-vs-decode bottlenecks in long-context serving",
    "Lost-in-the-Middle effect and position-dependent retrieval accuracy",
    "Context window vs. effective context utilization",
    "Chunking, caching, and retrieval vs. full long-context ingestion",
    "KV-cache memory, GQA, MLA, and prefix reuse",
    "Needle-in-a-haystack evaluation"
  ],
  "prerequisites": [
    "speculative-decoding",
    "scaling-llm-inference-batching-kv-cache",
    "kv-cache-paged-attention-llm-serving",
    "prefix-caching-prompt-caching",
    "flashattention-memory-efficient-attention",
    "positional-encoding-rope-alibi"
  ],
  "relatedQuestions": [
    "long-context-engineering-beyond-management",
    "multi-query-grouped-query-attention",
    "rag-evaluation-faithfulness-relevance",
    "design-production-rag-pipeline",
    "advanced-rag-query-rewriting-self-rag",
    "llm-deployment-gpu-serving-autoscaling"
  ]
}
---

Paste a 100,000-token ML codebase into a model with a 128K context window and ask which layer defines a deprecated normalization constant. The API accepts every token without complaint. Yet two things often go wrong at once: the model misses the definition buried near the middle of the prompt, and serving just four concurrent requests requires more GPU memory for the <span data-glossary="kv-cache">KV cache</span> than for the entire 70-billion-parameter model itself.

That gap separates **advertised capacity** (how many <span data-glossary="token">tokens</span> a <span data-glossary="context-window">context window</span> accepts) from **effective utilization** (whether the model can find and reason over the right evidence under real memory, latency, and cost constraints). Standard [self-attention](/learn/scaled-dot-product-attention) compares every prompt token against every earlier token during <span data-glossary="prefill">prefill</span>, driving quadratic compute, and retains keys and values across every layer during decode. <span data-glossary="flashattention">FlashAttention</span>[^dao2022] and [paged KV-cache serving](/learn/kv-cache-paged-attention-llm-serving)[^kwon2023] cut memory traffic and allocation waste without changing how many token pairs full attention evaluates.

<figure>
  <img src="illustrations/_generated/context_strategies_dark.png" alt="A ten-position sequence places target fact F1 at index 1 and question Q9 at index 9. Full causal attention exposes all 55 lower-triangular query-key pairs and connects Q9 directly to F1. A width-4 sliding window exposes 34 pairs and blocks that direct link in a single layer. Retrieval instead selects chunks F1, 4, and 7 ahead of Q9." />
  <figcaption>Figure 1: Three ways to reach fact F1 from question Q9 across ten spans: full causal attention (55 pairs, direct link), a width-4 sliding window (34 pairs, no single-layer link), and top-k retrieval packing candidate chunks F1, 4, and 7 ahead of Q9.</figcaption>
</figure>

Those three paths represent the core architectural choices of long-context engineering: attend to everything, bound each layer's local window, or retrieve only the candidate spans before prefill begins.

```checkpoint
Why is advertised context length different from effective context use?
---
Advertised length says how many tokens the model can accept. Effective use asks whether the model can find and reason over the right evidence at every position, under real cost, memory, and latency constraints.
```

## Can the prompt fit, and what does it cost?

A context window is a shared budget, not an input-only bucket. System instructions, chat template tokens, tool schemas, history, retrieved evidence, and the reserved output length must satisfy:

$$
\text{serialized\_input\_tokens} + \text{reserved\_output\_tokens} \le \text{context\_limit}
$$

Once a long prompt fits, it hits two separate hardware bills: **prefill compute** and **decode KV-cache memory**.

### The quadratic prefill wall and the KV-cache memory bill

During prefill, full causal attention scores $n(n+1)/2$ token pairs per layer, scaling as $O(n^2)$ in <span data-glossary="big-o-notation">Big-O notation</span>. Growing a prompt 32x from 4K to 128K tokens multiplies pairwise attention checks by $32^2 = 1{,}024\times$. Linear projections and FFNs grow linearly, so attention increasingly dominates time-to-first-token (TTFT) at long lengths.

During decode, every generated token reads all cached keys and values from GPU HBM. For a uniform decoder with $L$ layers, $H_{\text{kv}}$ KV heads of width $d_h$, sequence length $n$, and $b$ bytes per element:

$$
\text{KV cache bytes} = 2 \cdot L \cdot H_{\text{kv}} \cdot d_h \cdot n \cdot b
$$

Take a Llama 3 70B profile ($L=80$, 64 query heads, 8 <span data-glossary="grouped-query-attention">GQA</span> KV heads, $d_h=128$, <span data-glossary="bf16">BF16</span> at 2 bytes) at 128K tokens (`131,072`):[^dubey2024]

- **1 sequence (GQA-8, BF16):** **40 GiB** of KV cache (below the ~130 GiB BF16 weights).
- **4 concurrent sequences (GQA-8, BF16):** **160 GiB** of KV cache, already larger than the model weights!
- **1 sequence (MHA-64, BF16):** **320 GiB** of KV cache, more than 2.4x the model weights.

<figure>
  <img src="illustrations/_generated/attention_cost_curve_dark.png" alt="Prefill attention FLOPs on a log2 scale relative to 4K rise to 10 (1,024x) at 128K under full attention, while a 4K sliding window rises to 5 (32x). At 128K, BF16 GQA KV state uses 40 GiB for one sequence and 160 GiB for four, exceeding ~130 GiB model weights, while MHA reaches 320 GiB." />
  <figcaption>Figure 2: Prefill attention work relative to 4K on a log₂ scale (full $O(n^2)$ vs. a 4K sliding window $O(nw)$), paired with 128K BF16 KV cache memory on an 80-layer model against ~130 GiB of weights.</figcaption>
</figure>

Modern hybrid models mix short local sliding-window layers with fewer global full-attention layers, so never multiply one layer's shape uniformly across all layers. Sum layer by layer instead:

$$
\text{logical KV bytes} = \sum_\ell n_\ell \big(H_{K,\ell} d_{K,\ell} b_{K,\ell} + H_{V,\ell} d_{V,\ell} b_{V,\ell}\big)
$$

In Gemma 4 12B, 40 local sliding-window layers (8 KV heads, width 256, window 1,024) pair with 8 global layers (1 KV head, width 512).[^gemma4config2026][^gemma4CacheImplementation2026] Assuming the local shape everywhere at 128K overestimates KV memory by more than 20x (`48.0 GiB` vs. the true `2.3125 GiB`):

<!-- leetllm: test, output=show -->
```python title="kv_cache_capacity.py"
def kv_gib(layers, kv_heads, head_dim, seq_len, elem_bytes=2):
    return (2 * layers * kv_heads * head_dim * seq_len * elem_bytes) / 2**30

weights_gib = (70e9 * 2) / 2**30
for label, kv_heads, elem_bytes, n_seq in [
    ("1x Llama-70B GQA BF16", 8, 2, 1),
    ("1x Llama-70B GQA FP8 ", 8, 1, 1),
    ("4x Llama-70B GQA BF16", 8, 2, 4),
    ("1x Llama-70B MHA BF16", 64, 2, 1),
]:
    cache = n_seq * kv_gib(80, kv_heads, 128, 131_072, elem_bytes)
    print(f"{label}: {cache:5.1f} GiB KV vs {weights_gib:.0f} GiB weights")

# Hybrid Gemma 4 12B at 128K: 40 local (1K window) + 8 global (128K)
local = kv_gib(40, 8, 256, 1_024, 2)
global_ = kv_gib(8, 1, 512, 131_072, 2)
wrong_uniform = kv_gib(48, 8, 256, 131_072, 2)
print(f"Hybrid sum: {local + global_:.4f} GiB (local {local:.4f} + global {global_:.4f}) vs wrong uniform {wrong_uniform:.1f} GiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1x Llama-70B GQA BF16:  40.0 GiB KV vs 130 GiB weights
1x Llama-70B GQA FP8 :  20.0 GiB KV vs 130 GiB weights
4x Llama-70B GQA BF16: 160.0 GiB KV vs 130 GiB weights
1x Llama-70B MHA BF16: 320.0 GiB KV vs 130 GiB weights
Hybrid sum: 2.3125 GiB (local 0.3125 + global 2.0000) vs wrong uniform 48.0 GiB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/mixed_layer_cache_ownership_dark.png" alt="A 48-layer Gemma configuration separates 40 local 1K sliding-window layers (8 heads of dim 256, using 0.3125 GiB or 13.5%) from 8 global 128K layers (1 head of dim 512, using 2.000 GiB or 86.5%), totaling 2.3125 GiB in BF16 versus 48.0 GiB when assigning the local shape and full length to every layer." />
  <figcaption>Figure 3: Layer-specific BF16 KV cache accounting across 40 local 1K layers (0.3125 GiB) and 8 global 128K layers (2.000 GiB) sums to 2.3125 GiB instead of a 48.0 GiB uniform overestimate.</figcaption>
</figure>

Match each optimization to the phase it relieves: FlashAttention cuts prefill attention I/O, [chunked prefill](/learn/continuous-batching-request-scheduling) interleaves long prefills with active decodes,[^vllm2026optimization] prefix reuse skips duplicate prefill, and PagedAttention, GQA, MLA, or KV quantization shrink decode cache memory and bandwidth.

### Sliding windows, attention sinks, and history budgeting

**Sliding-window attention (SWA)** caps each layer's visibility to the most recent $w$ tokens, moving attention cost from $O(n^2)$ to $O(n w)$.[^jiang2023] Gemma 2 alternates 4,096-token local layers with 8,192-token global layers so distant tokens still have periodic global highways.[^gemma2team2024] When a pure sliding window rolls forward and evicts the very first tokens of a sequence, generation quality can abruptly collapse: Xiao et al. showed that initial tokens act as **attention sinks** absorbing excess softmax mass, so StreamingLLM keeps a handful of sink KV entries alongside the recent window to keep long streams stable (without restoring evicted middle facts).[^xiao2023streaming]

When a multi-turn conversation or agent transcript outgrows the window, reserve the output budget and mandatory instructions first, then either **truncate** whole turns from the oldest end or run **<span data-glossary="context-compaction">context compaction</span>** (summarizing older turns while pinning exact file paths, constants, and unresolved items outside the lossy prose summary). Always drop complete user/assistant or tool-call/result pairs so an answer never loses its question.

<figure>
  <img src="illustrations/_generated/serialized_budget_and_compaction_dark.png" alt="A prompt-budget pipeline reserves output tokens first, validates whether mandatory system instructions and the user query fit in the remaining input limit, packs complete recent turns intact, compacts older turns if needed, and recounts the serialized request. In a 16-unit window with 4 reserved output units and 11 mandatory units, only 1 free unit remains, so an older 13-unit turn (9 user plus 4 assistant) is omitted whole." />
  <figcaption>Figure 4: Turn-atomic prompt budgeting. Reserve output tokens first, verify mandatory messages fit, and drop or compact complete exchanges rather than splitting questions from answers.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="fit_history.py"
def fit_history(system, exchanges, latest_user, context_limit, reserved_output, count_fn):
    budget = context_limit - reserved_output
    mandatory = [system, latest_user]
    if count_fn(mandatory) > budget:
        raise ValueError("mandatory input and reserved output exceed context limit")
    kept = []
    for turn in reversed(exchanges):
        if count_fn([system, *turn, *kept, latest_user]) > budget:
            break
        kept = [*turn, *kept]
    return [system, *kept, latest_user]

count_words = lambda msgs: sum(1 + len(m["content"].split()) for m in msgs)
system = {"role": "system", "content": "You are a PyTorch codebase assistant."}
exchanges = [[
    {"role": "user", "content": "check cosine learning rate warmup schedule setup details"},
    {"role": "assistant", "content": "verified warmup steps config"},
]]
latest = {"role": "user", "content": "where is rope scaling?"}

kept = fit_history(system, exchanges, latest, 16, 4, count_words)
print("kept roles:", [m["role"] for m in kept], f"used={count_words(kept)}/12 input budget")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
kept roles: ['system', 'user'] used=12/12 input budget
```
<!-- leetllm: output:end -->

```checkpoint
When should you compact history instead of truncating it?
---
Truncate when older turns are disposable and no summary call is needed. Compact when early facts still matter, then verify that required constants, file IDs, and unresolved work survived the summary.
```

## Stretching positional encodings beyond training length

Even if a 32K prompt fits in VRAM, a model trained at 8K tokens can produce gibberish past position 8,192 because **Rotary Position <span data-glossary="embedding">Embeddings</span> (RoPE)**[^su2021] enters unseen rotation angles. RoPE rotates pairs of query and key dimensions at geometric frequencies $\omega_j = \theta^{-2j/d_{\text{rot}}}$:

$$
\text{RoPE}(x_m, m)_j = e^{i m \omega_j} x_j
$$

Picture each dimension pair as a clock hand spinning at a different speed: fast hands resolve adjacent tokens, while slow hands track long-range distance. Extending the window requires reshaping those frequencies cleanly:

- **Base frequency scaling:** Raising the RoPE base $\theta$ (Llama 3 raised $\theta$ to 500,000) slows all rotations to stretch native range.[^dubey2024]
- **Linear position interpolation:** Compresses every position coordinate uniformly via $m' = m \cdot (L_{\text{train}} / L_{\text{target}})$, keeping angles inside the trained range at the cost of crowding nearby tokens.
- **NTK-aware scaling & YaRN (Yet another RoPE extensioN):** High-frequency bands carry local syntax, so compressing them blurs nearby order. **YaRN** combines **NTK-by-parts** (leaving fast frequencies untouched, compressing slow long-wavelength frequencies, and ramping linearly in between) with an attention-logit scaling factor.[^peng2023] Modern serving configs (such as <span data-glossary="hugging-face-transformers">Hugging Face Transformers</span> `rope_parameters`) expose `linear`, `dynamic`, `yarn`, `longrope`, and `llama3` scaling modes.[^huggingface2026rope][^ding2024longrope]

<figure>
  <img src="illustrations/_generated/rope_frequency_scaling_dark.png" alt="Uniform 4x position interpolation maps extended indices 0 through 32,768 down to 0 through 8,192 (m prime equals m over 4). Below, angular step factors across six RoPE frequency bands compare uniform 0.25 scaling against YaRN NTK-by-parts blending, which keeps local high-frequency steps near 1.0, linearly ramps transition bands, and compresses long-wavelength low-frequency steps to 0.25." />
  <figcaption>Figure 5: Uniform 4x position interpolation compresses every frequency equally, whereas YaRN preserves fast local frequencies near 1.0 and concentrates compression in slow long-range bands.</figcaption>
</figure>

> **Common mistake:** Under dynamic RoPE scaling, changing the rotary frequency mid-sequence without re-rotating cached keys silently corrupts attention scores. A stale key at position `1` under unscaled frequency `1.0` lands at `1.0 rad`, colliding identically (`dot = 1.0`) with a new query at position `2` under scaled frequency `0.5`! Always cache unrotated keys or invalidate the cache when the RoPE scale changes.[^peng2023]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="rope_interpolation_and_cache_basis.py"
import numpy as np

# 1. Linear 4x interpolation: 32K target -> 8K trained scale
positions = np.array([0, 8_192, 16_384, 32_767])
print("interpolated coords:", np.round(positions * (8_192 / 32_768), 2).tolist())

# 2. Stale vs. consistent RoPE basis in KV cache
rot = lambda pos, freq: np.array([np.cos(pos * freq), np.sin(pos * freq)])
q_new = rot(2, 0.5)
k_stale = rot(1, 1.0)       # Cached before scale changed
k_fixed = rot(1, 0.5)       # Re-rotated under consistent frequency
print(f"stale key dot: {np.dot(q_new, k_stale):.6f}  (spurious exact match!)")
print(f"fixed key dot: {np.dot(q_new, k_fixed):.6f}  (true cos(0.5))")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
interpolated coords: [0.0, 2048.0, 4096.0, 8191.75]
stale key dot: 1.000000  (spurious exact match!)
fixed key dot: 0.877583  (true cos(0.5))
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cached_rotation_consistency_dark.png" alt="Two unit-circle plots compare RoPE basis consistency for a query at position 2 with scaled frequency 0.5 (1 radian). A stale cached key stored under unscaled frequency 1 at position 1 also sits at 1 radian, producing dot product 1.000000. Re-rotating the key under scaled frequency 0.5 puts it at 0.5 radians and restores the true dot product cos(0.5) = 0.877583." />
  <figcaption>Figure 6: Mixing rotary bases in a KV cache causes a stale key at position 1 to collide at 1.0 radian with a scaled query at position 2. Re-rotating under the same frequency restores $\cos(0.5) = 0.877583$.</figcaption>
</figure>

## Lost in the middle: can the model find the evidence?

Fit and positional range are necessary, but not sufficient. Liu et al. showed that multi-document accuracy often follows a **U-shaped curve**: models retrieve facts reliably near the beginning or end of the prompt while missing identical facts placed in the middle.[^liu2023lost] Later benchmarks (including Chroma's **context rot** study across 18 models) showed that even when depth profiles flatten, adding distractor tokens steadily degrades reasoning accuracy.[^hong2025contextrot]

Three practical layout habits reduce middle dropoff:

1. **Edge-priority packing:** Place the two highest-relevance excerpts at the head (right after instructions) and tail (right before the question), leaving lower-priority background in the middle.
2. **Keep identifiers intact:** Attach file paths, line ranges, and commit SHAs directly to each excerpt, and keep retrieved text clearly separated from system instructions.
3. **Chunk and merge:** When distractor noise still degrades recall, extract facts per chunk and synthesize the structured extractions in a clean final pass.

<figure>
  <img src="illustrations/_generated/context_packing_layout_dark.png" alt="Five ranked code and spec chunks (A 0.95 Attention, B 0.92 RoPE, C 0.88 KV Layout, D 0.45 Logs, E 0.30 README) are reordered into prompt slots so high-relevance evidence sits at the head and tail (A and B) while lower-scoring background chunks fill the center between System instructions and Query." />
  <figcaption>Figure 7: Edge-priority packing anchors the two top-scoring specifications (A and B) at the start and end of the evidence block, pushing lower-scoring background logs into the center.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="arrange_context.py"
def pack_edge_first(system, docs, query):
    ranked = sorted(docs, key=lambda d: d[1], reverse=True)
    ordered = ranked[:1] + ranked[2:] + ranked[1:2]
    return "\n\n".join([system, *(text for text, _ in ordered), query])

docs = [
    ("Attention module sets eps=1e-6 before softmax scaling.", 0.95),
    ("RoPE config scales low-frequency bands via YaRN factor 4.", 0.92),
    ("KV layout splits 40 local layers and 8 global layers.", 0.88),
    ("Build log excerpt: checkpoint kernels compiled cleanly.", 0.45),
    ("README overview section on evaluation scripts.", 0.30),
]
print(pack_edge_first("Use only the excerpts below.", docs, "How is attention position scaled?"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Use only the excerpts below.

Attention module sets eps=1e-6 before softmax scaling.

KV layout splits 40 local layers and 8 global layers.

Build log excerpt: checkpoint kernels compiled cleanly.

README overview section on evaluation scripts.

RoPE config scales low-frequency bands via YaRN factor 4.

How is attention position scaled?
```
<!-- leetllm: output:end -->

## Full context vs. retrieval

Should you stuff the entire codebase into the prompt or use <span data-glossary="rag">retrieval-augmented generation (RAG)</span>? Let the **question structure** decide:

<figure>
  <img src="illustrations/_generated/long_context_decision_dark.png" alt="Three evidence routing paths depend on question structure. A single self-contained packet uses a full-context baseline with recall testing. A targeted single-fact query retrieves top-k labeled chunks for RAG with miss-risk checks. Cross-file questions filter candidates, pack labeled snippets, or aggregate exact counts over all matches." />
  <figcaption>Figure 8: Choose the evidence path by query structure: full context for self-contained packets, RAG for targeted lookups across large archives, and deterministic code/SQL aggregation for exact counts.</figcaption>
</figure>

| Factor | Long Context | RAG |
|---|---|---|
| **Latency** | Single call, heavy prefill TTFT | Extra retrieval step, fast short prefill |
| **Failure mode** | Distractors or middle-depth dropoff | Relevant chunk missed by top-$k$ retrieval |
| **Corpus scale** | Bounded by usable window | Scales to millions of files |
| **Engineering focus** | Prompt packing, KV prefix reuse, depth evals | <span data-glossary="chunking">Chunking</span>, indexing, recall evals |

> **Key insight:** Never use top-$k$ similarity retrieval to answer a counting or aggregation question (*"Which module has the most `legacy_softmax` calls in `v2`?"*). High-similarity matches often cluster in one module while more numerous, slightly lower-scored matches sit in another. Run exact filters and counts in code or SQL first, then let the model explain the verified table.

<!-- leetllm: test, output=show -->
```python title="complete_counts.py"
from collections import Counter

records = [
    ("m1", "v2", "encoder", "legacy_softmax", 0.99),
    ("m2", "v2", "encoder", "legacy_softmax", 0.98),
    ("m3", "v2", "decoder", "legacy_softmax", 0.80),
    ("m4", "v2", "decoder", "legacy_softmax", 0.79),
    ("m5", "v2", "decoder", "legacy_softmax", 0.78),
    ("m6", "v1", "encoder", "legacy_softmax", 0.97),
    ("m7", "v2", "encoder", "flash_attn", 0.96),
]
v2_legacy = [r for r in records if r[1] == "v2" and r[3] == "legacy_softmax"]
top_two = sorted(v2_legacy, key=lambda r: r[4], reverse=True)[:2]
print("top-2 similarity counts:", dict(Counter(r[2] for r in top_two)))
print("exact complete counts:  ", dict(Counter(r[2] for r in v2_legacy)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
top-2 similarity counts: {'encoder': 2}
exact complete counts:   {'encoder': 2, 'decoder': 3}
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/complete_counts_counterexample_dark.png" alt="Seven module scan records show why similarity top-k cannot replace exhaustive counting. Filtering v2 legacy_softmax call sites keeps m1 through m5. Top-2 retrieval selects m1 (0.99) and m2 (0.98), both in encoder (encoder 2, decoder 0), whereas counting all five matches gives encoder 2 and decoder 3." />
  <figcaption>Figure 9: Top-2 similarity picks only `encoder` (2 vs. 0), reversing the true count where `decoder` leads (3 vs. 2).</figcaption>
</figure>

## Running long contexts on real GPUs

Five system levers turn an infeasible long-context workload into a fast production service:

1. **Head sharing (GQA / MLA):** [GQA](/learn/multi-query-grouped-query-attention) cuts KV bytes by $H_q / H_{\text{kv}}$ (8x for 64:8).[^ainslie2023] <span data-glossary="multi-head-latent-attention">Multi-head latent attention (MLA)</span> compresses K/V into a low-rank latent cache; DeepSeek-V2 reported a 93.3% KV-cache reduction relative to DeepSeek 67B.[^deepseekv2_2024] Both are model-architecture choices, not runtime flags.
2. **Quantized KV cache (FP8):** Halves stored bytes per element from 2 bytes (BF16) to 1 byte (FP8), lifting a 64 GiB KV pool from 1 concurrent 40 GiB request to 3 concurrent 20 GiB requests.[^vllm2026kvquant] Calibrate scales and verify long-depth accuracy after enabling it.
3. **PagedAttention:** Allocates KV memory in fixed-size non-contiguous pages like virtual memory, eliminating contiguous fragmentation waste without shrinking the raw bytes per token.[^kwon2023]
4. **Prefix caching:** When multiple questions share a 48K-token repository prefix, reusing cached prefix KV blocks drops prefill work across three queries (`+800`, `+1,200`, `+600` tokens) from `146,600` tokens down to `50,600`, skipping `96,000` duplicate prefill tokens.[^kwon2023][^vllm2026prefix] (Decode steps still read the cached prefix.)
5. **Context parallelism (Ring Attention / DCP):** When a single ultra-long sequence exceeds one GPU, **Ring Attention** shards sequence blocks across GPUs in a ring and overlaps KV transfers with local FlashAttention.[^liu2024ring] In serving engines such as vLLM's decode context parallelism (DCP), each logical block spans `DCP × physical_block_size` positions: with `DCP = 4` and physical block size `16`, one logical block covers `64` tokens, so a `1,025`-token history allocates `17` logical blocks (`1,088` positions) rather than `65` single-device blocks.[^vllm2026contextParallel]

<figure>
  <img src="illustrations/_generated/cache_capacity_dark.png" alt="A 64 GiB KV cache pool holds only one 40 GiB BF16 128K sequence (leaving 24 GiB unused, short of a second 40 GiB sequence), whereas quantized FP8 KVs at 20 GiB per sequence fit three concurrent sequences with 4 GiB remaining." />
  <figcaption>Figure 10: Inside a 64 GiB KV pool, 40 GiB BF16 fits only 1 full 128K sequence (stranding 24 GiB), while 20 GiB FP8 fits 3 concurrent sequences before allocator and generation headroom.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/prefix_reuse_dark.png" alt="Three requests share a 48,000-token prefix plus unique suffixes of 800, 1,200, and 600 tokens. Without prefix caching, prefill computes 146,600 tokens; reusing exact cached prefix blocks computes 50,600 new tokens and skips 96,000 duplicate prefix tokens." />
  <figcaption>Figure 11: Prefix caching across three queries sharing a 48,000-token codebase cuts computed prefill tokens from 146,600 to 50,600.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/context_parallel_block_grid_dark.png" alt="Under decode context parallelism across 4 ranks with physical block size 16, one logical block covers 64 positions (4 x 16). A 1,025-token history allocates 17 logical blocks (1,088 positions), whereas rounding by physical block size 16 yields 65 blocks (1,040 positions)." />
  <figcaption>Figure 12: With DCP=4 and physical block size 16, each logical block spans 64 positions across four GPUs, allocating 17 logical blocks for a 1,025-token history.</figcaption>
</figure>

```checkpoint
How do PagedAttention and Ring Attention solve different long-context problems?
---
PagedAttention eliminates intra-GPU KV allocation fragmentation across sessions. Ring Attention shards a single ultra-long sequence's attention and KV residency across multiple GPUs.
```

## Evaluating long-context recall across lengths and depths

Never trust an advertised context limit or a single pooled average. **NIAH (Needle-in-a-Haystack)** hides a target fact at controlled depths (0% to 100%) across increasing sequence lengths (4K to 128K) to expose middle-depth cliffs,[^kamradt2023niah] while **RULER** extends testing to multi-needle lookup, variable tracking, and cross-span aggregation.[^hsieh2024]

<figure>
  <img src="illustrations/_generated/niah_heatmap_dark.png" alt="A 4-by-5 heatmap shows needle miss rates rising from 1–3% at 4K to 12%, 37%, 72%, 39%, and 13% across depths 0%, 25%, 50%, 75%, and 100% at 128K. Below, the 128K recall curve traces 1 minus miss rate as a characteristic U-shape dipping to 28% in the middle." />
  <figcaption>Figure 13: NIAH miss-rate heatmap across lengths and depths paired with the 128K recall U-curve dropping to 28% at 50% depth.</figcaption>
</figure>

Why must you inspect every `(length, depth)` slice instead of averaging? Look at a baseline scoring `(90%, 90%, 90%)` across `(head, middle, tail)` versus a candidate scoring `(100%, 70%, 100%)`: both average `90%`, yet the candidate quietly fails an `85%` middle-depth recall floor!

<!-- leetllm: test, output=show -->
```python title="needle_harness_and_slices.py"
def place_needle(haystack, needle, instruction, limit, depth, max_new_tokens):
    filler_budget = limit - max_new_tokens - len(instruction) - len(needle)
    clipped = haystack[:filler_budget]
    idx = int(len(clipped) * depth)
    packed = instruction + clipped[:idx] + needle + clipped[idx:]
    return packed, idx / max(len(clipped), 1)

def contains(seq, sub):
    return any(seq[i:i + len(sub)] == sub for i in range(len(seq) - len(sub) + 1))

needle = [99, 98]
for req_depth in (0.0, 0.5, 1.0):
    packed, actual = place_needle([0] * 30, needle, [1, 2], 24, req_depth, 4)
    doc = packed[2:]
    edge_only = contains(doc[:4], needle) or contains(doc[-4:], needle)
    print(f"depth={actual:.1f}: full_scan={contains(doc, needle)}, edge_only={edge_only}")

for name, slices in [("baseline", (90, 90, 90)), ("candidate", (100, 70, 100))]:
    rates = [c / 100 for c in slices]
    print(f"{name:9s}: mean={sum(rates)/3:.0%}, worst_slice={min(rates):.0%}, passes_85%_floor={min(rates) >= 0.85}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
depth=0.0: full_scan=True, edge_only=True
depth=0.5: full_scan=True, edge_only=False
depth=1.0: full_scan=True, edge_only=True
baseline : mean=90%, worst_slice=90%, passes_85%_floor=True
candidate: mean=90%, worst_slice=70%, passes_85%_floor=False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/needle_harness_and_release_slices_dark.png" alt="A 24-token needle harness reserves 2 instruction tokens, 16 filler tokens, a 2-token needle, and 4 output tokens. At depth 0.5, an edge reader checking only the first and last 4 tokens misses the middle needle while a full scan passes all depths. Across 100-case evaluation slices, baseline scores 90/90/90 and candidate scores 100/70/100: both average 90%, while the candidate fails an 85% per-depth floor." />
  <figcaption>Figure 14: Top: 24-token depth harness reserving output headroom and exposing midpoint blindness in an edge-only reader. Bottom: Candidate scoring 100/70/100 matches a 90% mean while failing an 85% per-depth floor.</figcaption>
</figure>

## What to carry forward

Long-context engineering comes down to five concrete checks: reserve output tokens before packing intact turns, sum KV cache bytes layer by layer, keep RoPE scaling consistent with cached keys, run exact aggregations in code rather than top-$k$ retrieval, and evaluate recall per `(length, depth)` slice alongside TTFT, decode latency, and peak KV residency.

```mastery-quiz
[
  {
    "question": "A model accepts a 160K-token codebase prompt without truncation. It retrieves a normalization constant near either end but misses the same constant at 40% depth. Which experiment best tests whether moving that excerpt improves recall across several seeds?",
    "options": [
      "Move the excerpt toward the tail by deleting modules that follow it while keeping the question and reply budget fixed.",
      "Move the excerpt among the three depths by reordering the same modules while keeping the question and reply budget fixed.",
      "Substitute a different codebase and constant at each of the three depths while matching total token lengths.",
      "Move the excerpt among the three depths in the same prompt while giving middle trials larger output token budgets."
    ],
    "answer": "Move the excerpt among the three depths by reordering the same modules while keeping the question and reply budget fixed.",
    "explanation": "Compare answers for the identical target excerpt at the head, middle, and tail under the same sequence length and output budget. A consistent gain at the edges supports packing high-priority specs near prompt boundaries for this workload. Deleting later files alters total context length, swapping codebases alters difficulty, and giving middle trials extra generation tokens confounds reasoning capacity with retrieval."
  },
  {
    "question": "A decoder uses full causal attention for a 12,000-token prompt and for a 36,000-token prompt. About how many times as many query-key pairs does it compare during prefill for the longer prompt?",
    "options": [
      "3 times",
      "4.5 times",
      "9 times",
      "6 times"
    ],
    "answer": "9 times",
    "explanation": "The longer prompt has three times as many queries, and each query attends over about three times as many prior keys on average. Multiplying those factors yields about 9 times as many pairs. Counting only queries gives 3 times, summing factors gives 6 times, and halving 9 ignores that both prompts use the same triangular causal mask."
  },
  {
    "question": "A full-attention decoder has 64 layers, each with 32 query heads and 4 KV heads of width 128. It stores separate BF16 key and value arrays at 2 bytes per element. Each of eight independent sequences retains 65,536 positions. How much raw logical KV cache do they need in total?",
    "options": [
      "8 GiB",
      "64 GiB",
      "512 GiB",
      "32 GiB"
    ],
    "answer": "64 GiB",
    "explanation": "Each sequence uses 2 arrays × 64 layers × 4 KV heads × 128 elements × 65,536 positions × 2 bytes, or 8 GiB. Eight independent sequences therefore require 64 GiB. Reporting 8 GiB counts one sequence, 32 GiB omits value vectors across the batch, and 512 GiB mistakenly counts all 32 query heads rather than 4 shared KV heads."
  },
  {
    "question": "A serving deployment repeatedly handles queries sharing the same 20K repository prefix, while running too few concurrent decodes because KV caches saturate GPU memory. Which combination addresses both bottlenecks?",
    "options": [
      "Use prefix reuse for repeated prefill, GQA, FP8, or MLA for KV bytes, and PagedAttention for allocation waste.",
      "Use FP8 for repeated prefill, FlashAttention for cached bytes, and RoPE scaling for fragmentation.",
      "Use PagedAttention to make prefill linear, and prefix reuse to raise the model's maximum context length.",
      "Use sliding-window attention to preserve full-prefix access, and disable the KV cache during decode."
    ],
    "answer": "Use prefix reuse for repeated prefill, GQA, FP8, or MLA for KV bytes, and PagedAttention for allocation waste.",
    "explanation": "Prefix reuse eliminates recomputing the shared prefix across queries, while GQA, MLA, or calibrated FP8 shrink per-token KV storage and PagedAttention removes contiguous fragmentation waste. None of these techniques increases the trained context length limit by itself, and disabling KV cache during decode forces full quadratic recomputation every step."
  },
  {
    "question": "You are evaluating sliding-window attention with a fixed local window. Which workload and risk assessment is accurate?",
    "options": [
      "It suits arbitrary long-range cross-file lookup across archives, struggles near the local cursor, and sink-token retention degrades rollout stability without adding span.",
      "It suits local tasks such as code completion near the cursor, risks missing distant facts outside the span, and sink-token retention stabilizes generation without restoring global visibility.",
      "It resolves distant definitions reliably once sink tokens are saved, breaks down inside prompts shorter than the window, and keeps raw key-value tensors pruned identically.",
      "It connects far-apart symbols across a repository cheaply, retains early sink tokens to restore full quadratic attention range, and prevents distant facts from leaving active layers."
    ],
    "answer": "It suits local tasks such as code completion near the cursor, risks missing distant facts outside the span, and sink-token retention stabilizes generation without restoring global visibility.",
    "explanation": "Sliding-window attention reduces cost by bounding each layer's local key range, which works well for local continuation like cursor completion while dropping direct paths to older facts outside the window. Retaining initial sink tokens improves softmax numerical stability across long rollouts without restoring attention to arbitrary middle positions."
  },
  {
    "question": "A parsed repository index holds 500,000 tokens of function call records across module directories. Multiple call sites can appear within the same file, and the v2 deprecation rows alone exceed the model's 128K limit. To determine which module contains the most v2 deprecated calls before asking the model to summarize them, which workflow produces the exact counts?",
    "options": [
      "Filter for v2 deprecated calls, embed and retrieve top-k chunks that fit in 128K, and tally rows by module.",
      "Filter for v2 deprecated calls, group by module, and count only distinct file paths per module.",
      "Count v2 deprecated call rows per module within each directory shard in code, then sum each module's counts across shards.",
      "Count v2 deprecated call rows per module within each directory shard, then tally how many shards each module led."
    ],
    "answer": "Count v2 deprecated call rows per module within each directory shard in code, then sum each module's counts across shards.",
    "explanation": "Summing exact per-module call row counts across disjoint directory shards reproduces the exact global total while producing a compact summary table for the model. Similarity top-k retrieval drops lower-scoring rows, counting distinct file paths merges multiple call sites inside a file, and counting shard wins treats high-volume and low-volume shards equally."
  },
  {
    "question": "Uniform interpolation extends a model's RoPE window from 4,000 to 12,000 tokens. Where does extended position 9,000 land on the training scale, and how does YaRN adjust the fastest frequency bands?",
    "options": [
      "At 1,000; keep the trained per-token rotation in the fastest bands.",
      "At 3,000; compress the fastest bands to one third of their trained per-token rotation.",
      "At 1,000; compress the fastest bands to one third of their trained per-token rotation.",
      "At 3,000; keep the trained per-token rotation in the fastest bands."
    ],
    "answer": "At 3,000; keep the trained per-token rotation in the fastest bands.",
    "explanation": "Linear position interpolation scales 9,000 × (4,000 / 12,000) = 3,000 rather than wrapping modulo 4,000 to 1,000. Unlike uniform interpolation that slows all bands by 3x, YaRN preserves fast high-frequency rotations so nearby tokens stay distinguishable while interpolating slower long-wavelength bands."
  },
  {
    "question": "A 4,000-token chat window must reserve 800 tokens for the reply. The system prompt and latest query take 1,900 tokens plus 300 tokens of template framing. Answering requires citing both the commit SHA and module file ID from an older note costing 300 tokens (whereas a SHA-only note costs 100 tokens). Each recent unrelated exchange costs 300 tokens. Which history keeps the required evidence alongside as many intact recent turns as fit?",
    "options": [
      "Both identifiers and the two most recent exchanges.",
      "Both identifiers and the three most recent exchanges.",
      "The commit SHA only and the three most recent exchanges.",
      "Both identifiers and the five most recent exchanges."
    ],
    "answer": "Both identifiers and the two most recent exchanges.",
    "explanation": "Subtracting the reply reserve, mandatory text, and template overhead leaves 4,000 − 800 − 1,900 − 300 = 1,000 free tokens. Keeping the 300-token note with both identifiers leaves 700 tokens, enough for two 300-token recent exchanges. Three exchanges with both identifiers (1,200 tokens) or five exchanges overflow the budget, and keeping only the commit SHA omits the required module citation."
  },
  {
    "question": "A serving cluster suffers from fragmented single-GPU KV memory across concurrent sessions, and separately a single ultra-long sequence exceeds one GPU's attention budget. Which pair of techniques targets those two constraints?",
    "options": [
      "Ring Attention for intra-GPU allocation waste across sessions, and PagedAttention to split one sequence across devices.",
      "PagedAttention for intra-GPU allocation waste across sessions, and Ring Attention to split one sequence across devices.",
      "PagedAttention for both intra-GPU KV allocation waste and multi-device sequence partitioning across ranks.",
      "Ring Attention for both intra-GPU KV block fragmentation and multi-device sequence partitioning across ranks."
    ],
    "answer": "PagedAttention for intra-GPU allocation waste across sessions, and Ring Attention to split one sequence across devices.",
    "explanation": "PagedAttention maps logical KV blocks onto non-contiguous physical pages on each device to curb fragmentation waste, while Ring Attention shards query and key-value blocks across multiple GPUs using context parallelism. Neither technique alone replaces the other when a single ultra-long request also needs paged allocation on each rank."
  },
  {
    "question": "A team extends a RoPE model's window and enables FP8 KV caching. Short sanity prompts pass, yet production includes extended-length queries. They evaluate paired multi-needle and multi-hop prompts across depths alongside throughput tests tracking TTFT, decode latency, peak KV residency, and concurrency. Which evaluation plan catches regressions hidden by averages?",
    "options": [
      "Report accuracy by length and depth slice, evaluate perplexity inside the trained range, and measure throughput on fixed short prompts.",
      "Pool accuracy across depths per length, check perplexity inside the trained range, and benchmark the production mix of prompt lengths.",
      "Track accuracy per length and depth slice, evaluate perplexity past the trained context threshold, and load-test the production prompt mix.",
      "Pool accuracy across depths per length, test perplexity past the trained context threshold, and load-test fixed short prompt batches."
    ],
    "answer": "Track accuracy per length and depth slice, evaluate perplexity past the trained context threshold, and load-test the production prompt mix.",
    "explanation": "Per-slice reporting exposes midpoint recall failures hidden by pooled depth averages, checking perplexity across the pretrained position threshold reveals extension breakdown immediately past the cutoff, and testing realistic prompt-length mixes validates real prefill queuing and cache residency."
  }
]
```

> **Next:** Continue to [Mixture of Experts Architecture](/learn/mixture-of-experts-architecture). Long context exposed the cost of attention and retained state. MoE changes the feed-forward work by routing tokens to selected experts; its resident weights, communication, and attention cache still need separate accounting.
