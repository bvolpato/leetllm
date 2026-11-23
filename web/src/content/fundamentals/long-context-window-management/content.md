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

Suppose a deprecated normalization constant sits somewhere inside a multi-module ML repository, and someone asks which layer defines it and how downstream modules scale it. Sending the entire repository may fit inside a model's advertised limit, yet the decisive definition can still go unread or push KV cache costs above what the deployment can afford. As prompt lengths grow from thousands to hundreds of thousands of tokens, the bottleneck shifts smoothly from pure ingestion work to memory residency, positional extrapolation, and retrieval reachability.

Speculative decoding can amortize weight traffic across useful proposed tokens. Long context adds a different pressure. <span data-glossary="prefill">Prefill</span> must ingest more input, the model must keep the state its attention architecture needs, and the answer still has to find the right evidence. Full-attention layers retain growing <span data-glossary="kv-cache">KV caches</span>, whereas local sliding-window or recurrent layers bound their per-layer state differently.

**Advertised capacity** is how many <span data-glossary="token">tokens</span> a <span data-glossary="context-window">context window</span> accepts. **Effective utilization** is whether the model can find and reason over the right evidence under real compute, memory, and latency constraints. A long codebase query has to clear both hurdles: the prompt and reserved answer must fit cleanly, and the target definition must remain reachable once you pay for prefill, KV storage, and positional encoding. Because the [attention mechanism](/learn/scaled-dot-product-attention) in a standard <span data-glossary="transformer">transformer</span> compares queries against keys across earlier tokens during prompt ingestion, compute grows steeply with sequence length. <span data-glossary="flashattention">FlashAttention</span>[^dao2022] and [paged KV-cache serving](/learn/kv-cache-paged-attention-llm-serving)[^kwon2023] cut memory traffic and allocation fragmentation, improving wall-clock latency without altering how many pairs full attention evaluates.

<figure>
  <img src="illustrations/_generated/context_strategies_dark.png" alt="A ten-position sequence places target fact F1 at index 1 and question Q9 at index 9. Full causal attention exposes all 55 lower-triangular query-key pairs and connects Q9 directly to F1. A width-4 sliding window exposes 34 pairs and blocks that direct link in a single layer. Retrieval instead selects chunks F1, 4, and 7 ahead of Q9." />
  <figcaption>Figure 1: Three ways to reach target fact F1 from question Q9 across a ten-span sequence: full causal attention (55 pairs), a width-4 sliding window (34 pairs, dropping the direct F1-to-Q9 edge in one layer), and top-k retrieval packing candidate chunks F1, 4, and 7 ahead of Q9.</figcaption>
</figure>

Read Figure 1 as three architectural bets on the same codebase question. Full attention gives `Q9` a direct attention path back to `F1` at the highest prefill and KV cache cost. A width-4 sliding window keeps each layer local, trimming active pairs from `55` to `34` while relying on stacked layers or global layers for long-range routing. Retrieval narrows ten spans down to three before prefill starts, so recall hinges on whether top-k selection captures `F1`.

```checkpoint
Why is advertised context length different from effective context use?
---
Advertised length says how many tokens the model can accept. Effective use asks whether the model can find and reason over the right evidence at every position, under real cost, memory, and latency constraints.
```

## First gate: can the prompt fit, and what does it cost?

Treat a context window as a shared budget, not as an input-only bucket. System instructions, conversation history, retrieved evidence, the user request, and the output you reserve all compete for the model's limit. A prompt that fits with a ten-token answer may overflow once you reserve a multi-step generation allowance.

For a decoder-only model, start with `serialized_input_tokens + reserved_generation_tokens <= context_limit`. Count the actual chat template, tool schemas, separators, and any multimodal tokens using the deployment's tokenizer rules. Check separate input/output caps and server configuration alongside quality benchmarks: a checkpoint's trained limit, an API request limit, and your verified accuracy window need not match. The 128K calculation below profiles an 80-layer 70B GQA configuration as a concrete reference point.

### The quadratic bottleneck

Before tuning kernels or retrieval parameters, measure how prefill work scales as a prompt grows from 4K to 128K tokens. Standard full attention forms $O(n^2)$ token-pair scores in <span data-glossary="big-o-notation">Big-O notation</span> for sequence length $n$. Causal masking retains $n(n+1)/2$ lower-triangular pairs, still quadratic in $n$. Doubling context length quadruples attention pairs; scaling 32x from 4K to 128K multiplies pairwise checks by roughly 32² = 1,024x during prefill. Linear projections and feed-forward layers scale linearly with $n$, so end-to-end wall-clock slowdown sits below 1,024x, though attention increasingly dominates at long sequence lengths.

Optimized GPU kernels shrink memory traffic without erasing quadratic attention scaling. Meanwhile, full-attention decoding hits a second bottleneck: every generated token attends across the stored prefix keys and values, turning long prompts into both a prefill compute problem and a <span data-glossary="gpu">GPU</span>-memory capacity problem.

<figure>
  <img src="illustrations/_generated/attention_cost_curve_dark.png" alt="Prefill attention FLOPs on a log2 scale relative to 4K rise to 10 (1,024x) at 128K under full attention, while a 4K sliding window rises to 5 (32x). At 128K, BF16 GQA KV state uses 40 GiB for one sequence and 160 GiB for four, exceeding ~130 GiB model weights, while MHA reaches 320 GiB." />
  <figcaption>Figure 2: Leading-term prefill work normalized to 4K on a log₂ scale (full O(L²) vs. a 4K sliding window O(Lw)), paired with 128K BF16 decode KV memory on an 80-layer, 128-dim head model against ~130 GiB of model weights.</figcaption>
</figure>

Prefill pays for the pairwise comparison: $O(n^2)$ score computations per layer. Decode pays for keeping prior key/value <span data-glossary="vector">vectors</span> in the KV cache and reading them again for each new token. Extending the usable range adds a third question about training and careful <span data-glossary="rope">RoPE</span> scaling. These are separate costs, so one successful benchmark won't answer all three.

```checkpoint
Why can moving from 4K to 128K context become more than 32 times harder for full attention?
---
Full attention compares token pairs, so prefill attention work scales with $n^2$. A 32x increase in sequence length creates about 32² = 1,024x more pairwise attention scores before kernel and hardware optimizations.
```

### Memory in concrete numbers

Put a number on the second bill. Llama 3 70B is an 80-layer decoder with 64 query heads, 8 KV heads, hidden size 8192, and head dimension 128.[^dubey2024] Llama 3.1 keeps that shape and advertises a 128K window. Take an 80-layer Llama 3 70B profile as a reference calculation: <span data-glossary="bf16">BF16</span> KV <span data-glossary="tensor">tensors</span>, 2 bytes per cached element, and a 128K prompt (131,072 tokens).

With <span data-glossary="grouped-query-attention">GQA</span>, the cache holds 8 KV heads, so the calculation gives **40 GiB per active sequence**. Replace those 8 heads with the 64 heads of full <span data-glossary="multi-head-attention">multi-head attention (MHA)</span> and the cache becomes **320 GiB**. The BF16 weight file is about **130 GiB** ($70 \times 10^9 \times 2$ bytes). One GQA request fits below the weight file; four concurrent requests need **160 GiB** of KV before activations or runtime buffers.

For uniform layers with separate, equal-width K/V arrays, the formula that produced those numbers is:

$$
\begin{aligned}
\text{KV cache size}
&= 2 \times \text{num\_layers} \times \text{num\_kv\_heads} \\
&\quad \times \text{head\_dim} \times \text{seq\_len} \times \text{bytes\_per\_element}
\end{aligned}
$$

Read the result as **logical, unshared KV per active sequence**, summed across all layers. Multiply by concurrent sequences, include generated tokens as the cache grows, then account for paging, prefix sharing, quantization scales, and runtime buffers. A sharded model distributes this state across devices, sometimes with replicated KV heads; don't charge the entire 40 GiB to every GPU or assume perfectly even sharding. The code below isolates the raw tensor term. Its one-byte row models the payload only, not scale metadata or validated FP8 support.

<!-- leetllm: test, output=show -->
```python title="kv_cache_capacity.py"
def kv_cache_gib(
    layers: int,
    kv_heads: int,
    head_dim: int,
    sequence_tokens: int,
    bytes_per_element: int,
) -> float:
    if any(x <= 0 for x in (layers, kv_heads, head_dim, bytes_per_element)):
        raise ValueError("architecture dimensions and element size must be positive integers")
    if sequence_tokens < 0:
        raise ValueError("sequence_tokens must be nonnegative")
    bytes_used = (
        2 * layers * kv_heads * head_dim * sequence_tokens * bytes_per_element
    )
    return bytes_used / (1024**3)


WEIGHTS_GIB = (70 * 10**9 * 2) / (1024**3)

for label, heads, dtype_bytes, n_seq in [
    ("1x GQA BF16", 8, 2, 1),
    ("1x GQA FP8", 8, 1, 1),
    ("4x GQA BF16", 8, 2, 4),
    ("1x MHA BF16", 64, 2, 1),
]:
    cache = n_seq * kv_cache_gib(80, heads, 128, 131_072, dtype_bytes)
    print(
        f"{label}: {cache:.0f} GiB KV vs {WEIGHTS_GIB:.0f} GiB weights "
        f"({'KV wins' if cache > WEIGHTS_GIB else 'weights still larger'})"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1x GQA BF16: 40 GiB KV vs 130 GiB weights (weights still larger)
1x GQA FP8: 20 GiB KV vs 130 GiB weights (weights still larger)
4x GQA BF16: 160 GiB KV vs 130 GiB weights (KV wins)
1x MHA BF16: 320 GiB KV vs 130 GiB weights (KV wins)
```
<!-- leetllm: output:end -->

```checkpoint
For long-context serving, why can a few 128K requests crowd out other users even when one cache is smaller than the weights?
---
The KV cache is per active sequence. On a Llama 3 70B-class decoder, one 128K GQA cache is about 40 GiB, still under the ~130 GiB weight file, but four concurrent 128K sequences already store about 160 GiB of KV before weights, activations, and runtime buffers.
```

### Sum mixed layers separately

Before using the 40 GiB result for another checkpoint, inspect its layer schedule carefully rather than extrapolating uniformly. Modern hybrid architectures frequently mix short local sliding-window layers with fewer global full-attention layers, so each layer retains a different sequence span $n_\ell$ alongside potentially distinct key/value head counts and widths:

$$
\text{logical KV bytes}=\sum_\ell n_\ell\big(H_{K,\ell}d_{K,\ell}b_{K,\ell}+H_{V,\ell}d_{V,\ell}b_{V,\ell}\big)
$$

Here $n_\ell$ denotes the retained token count in layer $\ell$, which caps at the local window under active cache eviction while full layers continue growing across the entire context. Multi-head latent attention (MLA) replaces explicit per-head keys and values with compressed latent caches, and recurrent state-space layers replace KV history with fixed-size recurrent tensors. Always verify physical allocator buffers to confirm that a sliding-window attention mask actually evicts older entries rather than masking scores over a full-length buffer.

**Architecture check:** the Gemma 4 12B configuration pairs 40 local sliding-window layers (8 KV heads, width 256, window 1,024) with eight global layers (1 KV head, width 512).[^gemma4config2026] Mistakenly applying the local head width uniformly across all 48 layers at 128K overstates cache size by more than twenty-fold, turning a 2.3125 GiB cache footprint into an apparent 48.0 GiB requirement:

<!-- leetllm: test, output=show -->
```python title="layer_specific_cache.py"
n, b = 131_072, 2
local = 2 * 40 * 8 * 256 * min(n, 1_024) * b
full = 2 * 8 * 1 * 512 * n * b
wrong_uniform = 2 * 48 * 8 * 256 * n * b
print(f"local layers: {local / 2**30:.4f} GiB")
print(f"full layers: {full / 2**30:.4f} GiB")
print(f"layer-specific sum: {(local + full) / 2**30:.4f} GiB")
print(f"wrong uniform estimate: {wrong_uniform / 2**30:.4f} GiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
local layers: 0.3125 GiB
full layers: 2.0000 GiB
layer-specific sum: 2.3125 GiB
wrong uniform estimate: 48.0000 GiB
```
<!-- leetllm: output:end -->

This calculation assumes separate key and value buffers, BF16 payloads, no cross-layer sharing, and active eviction to each layer's local window. Gemma's shared global key/value projection leaves cache size unchanged because the implementation projects distinct states into `cache.update`.[^gemma4CacheImplementation2026] Model-weight precision does not dictate cache precision either, so verify retained allocator buffers and peak GPU memory directly before sizing concurrency limits.

<figure>
  <img src="illustrations/_generated/mixed_layer_cache_ownership_dark.png" alt="A 48-layer Gemma configuration separates 40 local 1K sliding-window layers (8 heads of dim 256, using 0.3125 GiB or 13.5%) from 8 global 128K layers (1 head of dim 512, using 2.000 GiB or 86.5%), totaling 2.3125 GiB in BF16 versus 48.0 GiB when assigning the local shape and full length to every layer." />
  <figcaption>Figure 3: Layer-specific BF16 KV cache accounting across 40 local 1K layers (0.3125 GiB) and 8 full 128K layers (2.000 GiB) sums to 2.3125 GiB, avoiding the 48.0 GiB error from uniform scaling. Eviction frees memory whereas attention masking alone only hides distant positions.</figcaption>
</figure>

### Prefill vs. decode: two different bottlenecks

The same 128K request strains hardware twice, for distinct architectural reasons.[^kwon2023] During prefill, the model ingests the full prompt in parallel and pays for constructing its quadratic score matrix across all prompt pairs. During decode, the model generates one token per forward step; cached keys and values avoid recomputing old projections, yet every emitted token must still sweep across all retained prefix blocks in HBM. For a dense-attention step ignoring newly written tokens and weight loads, the logical KV volume read per step follows the cache residency expression:

$$
\text{bytes/decode step (KV reads)} \approx 2 \cdot L \cdot H_{kv} \cdot d_h \cdot n_{\text{ctx}} \cdot b
$$

where $L$ is layers, $H_{kv}$ is KV heads, $d_h$ is head dim, $n_{\text{ctx}}$ is cached tokens, and $b$ is bytes per element. It mirrors the residency equation because each stored entry participates in every new query dot product. On-chip SRAM reuse reduces raw DRAM transfers in fused kernels, whereas scattered page lookups and synchronization can amplify memory transactions, so always profile hardware counters directly.

Compare that with **weight-stream bytes** using an idealized decode batch that loads the dense model's weights once for the batch. One 128K sequence needs about 40 GiB of logical KV reads versus about 130 GiB of BF16 weights; four independent sequences raise the KV side to 160 GiB while reusing the same weights. This explains why batching and context length can shift a weight-bandwidth bottleneck toward KV bandwidth. Measure the crossover on the target stack because kernels, reuse, sharding, and compute utilization determine where it occurs.

Keep the phase attached to each intervention. FlashAttention reduces attention-kernel IO, which matters most during large prefills and <span data-glossary="ttft">time to first token (TTFT)</span>. [Chunked prefill](/learn/continuous-batching-request-scheduling) lets the scheduler interleave a long ingestion with in-flight decodes.[^vllm2026optimization] PagedAttention, GQA, and KV-cache <span data-glossary="quantization">quantization</span> reduce allocation waste or bytes per cached token. <span data-glossary="prefix-cache">Prefix reuse</span> skips repeated prefill for matching prefixes. The right fix is whichever moves your measured bottleneck.

```checkpoint
Which optimizations mostly help prefill, and which mostly help decode?
---
FlashAttention reduces attention IO in prefill and can also help decode kernels. Chunked prefill changes scheduling, often protecting ongoing decodes; smaller chunks can worsen the long request's TTFT. Prefix reuse cuts repeated prefill. PagedAttention reduces allocation waste, while GQA and cache quantization reduce stored bytes; those savings also matter while ingesting the prompt.
```

### Attention variants that cut long-context cost

Instead of keeping every position visible, change the visibility pattern. Mistral 7B pairs GQA with **sliding window attention (SWA)**: each token attends to a fixed local window rather than the entire prefix.[^jiang2023] If that window has width $w$, attention cost moves from $O(n^2)$ toward $O(n \times w)$. Gemma 2 alternates local layers with global-attention layers, using a 4096-token local window and an 8192-token global span in its report.[^gemma2team2024] Local layers pay less; global layers provide occasional long-range paths.

Test the dependency before choosing that trade. A width-$w$ window limits **direct attention in one layer**; stacked layers can propagate information across a wider receptive field. Mistral's report describes this larger receptive field.[^jiang2023] An evicted raw fact has no direct cache entry, and recall through an indirect path depends on the model and task. Evaluate it on the target workload. Sliding-window attention reduces visible positions per layer to a local band; full-prefix access requires a global attention path or another retrieval mechanism.

Here's a second failure to predict when the window rolls forward. Once early tokens leave the cache, quality can collapse in some models. Xiao et al. linked this behavior in their evaluated models to **attention sinks**, initial tokens that attract disproportionate attention; their StreamingLLM experiments retained a few sink KV entries alongside the recent window for stable long generation without fine-tuning.[^xiao2023streaming] Sink count and quality need model-specific tests. Retaining sinks can stabilize generation, but it doesn't restore lookup of every evicted fact.

```checkpoint
When is sliding-window attention a good fit, and when is it dangerous?
---
It fits tasks where most dependencies are local, such as continuation or code near the cursor. It's dangerous for forensic QA, policy lookup, or multi-hop reasoning where an answer may depend on evidence far outside the local window. A naive window that evicts the very first tokens can also destabilize generation unless it retains attention-sink tokens.
```

### When the input doesn't fit: truncation and compaction

Visibility matters only after the prompt fits safely inside the window. In a multi-turn chat or agent workflow, conversation history expands with every step, forcing the runtime to decide which state survives into the next forward pass. **Truncation** applies a hard boundary: preserve the system instructions and latest user prompt, then trim older exchanges until the serialized request fits inside the remaining budget. It executes predictably in constant time without extra model calls, though any dropped fact disappears permanently; always count serialized tokens rather than characters or turn counts because structured code consumes more tokens per word than plain prose.

**Summarization** folds older exchanges into a compact natural-language state note, and agentic <span data-glossary="context-compaction">context compaction</span> generalizes that pattern across multi-step tool transcripts before resuming execution. Both strategies preserve more semantic meaning per token than raw truncation at the expense of extra inference latency and subtle omission risk when critical flags or constants vanish during rewriting. Whether truncating or compacting, enforce the same <span data-glossary="token-budget">token-budgeting</span> discipline: reserve system prompts and expected generation length first, pack intact turns from newest to oldest, and explicitly tag which historical state can be dropped versus compacted.

<figure>
  <img src="illustrations/_generated/serialized_budget_and_compaction_dark.png" alt="A prompt-budget pipeline reserves output tokens first, validates whether mandatory system instructions and the user query fit in the remaining input limit, packs complete recent turns intact, compacts older turns if needed, and recounts the serialized request. In a 16-unit window with 4 reserved output units and 11 mandatory units, only 1 free unit remains, so an older 13-unit turn (9 user plus 4 assistant) is omitted whole." />
  <figcaption>Figure 4: Four-stage prompt budget pipeline reserving output tokens first (4 of 16 units), verifying mandatory inputs fit within the remaining budget, and dropping an entire 13-unit prior exchange rather than splitting questions from answers. Mandatory inputs exceeding the input budget at limit 14 raise ValueError.</figcaption>
</figure>

Reserve non-negotiable space before touching history, and fail explicitly if mandatory inputs already overflow. Drop complete conversational turns so an answer never loses its question or a tool result its matching call. Because compaction summarizes earlier text lossily, keep exact identifiers and unresolved dependencies outside the prose summary, recount the serialized request afterward, and never promote summarized untrusted context into system instructions.

The helper below illustrates turn-atomic packing on plain user/assistant messages; tool-call transcripts need an analogous rule grouping each call with its output. Using a whole-request counting callback `count_request` lets your production adapter apply the deployment's chat template and framing tokens accurately instead of summing raw field strings.

<!-- leetllm: test, output=show -->
```python title="fit_history.py"
def fit_history(
    system: dict,
    exchanges: list[list[dict]],
    latest_user: dict,
    context_limit: int,
    reserved_output: int,
    count_request,
) -> list[dict]:
    """Preserve mandatory messages and a contiguous suffix of complete exchanges."""
    if context_limit <= 0 or reserved_output < 0:
        raise ValueError("invalid context or output budget")
    if system["role"] != "system" or latest_user["role"] != "user":
        raise ValueError("expected a system message and latest user message")
    if any([m["role"] for m in turn] != ["user", "assistant"] for turn in exchanges):
        raise ValueError("this example accepts complete plain-chat exchanges only")
    budget = context_limit - reserved_output
    mandatory = [system, latest_user]
    if count_request(mandatory) > budget:
        raise ValueError("mandatory input and reserved output exceed context limit")
    kept = []
    for turn in reversed(exchanges):
        candidate = [system, *turn, *kept, latest_user]
        if count_request(candidate) > budget:
            break
        kept = [*turn, *kept]
    return [system, *kept, latest_user]

def count_request(messages: list[dict]) -> int:
    return sum(1 + len(m["content"].split()) for m in messages)

system = {"role": "system", "content": "You are a PyTorch codebase assistant."}
exchanges = [[
    {"role": "user", "content": "check cosine learning rate warmup schedule setup details"},
    {"role": "assistant", "content": "verified warmup steps config"},
]]
latest = {"role": "user", "content": "where is rope scaling?"}
kept = fit_history(system, exchanges, latest, 16, 4, count_request)
print([m["role"] for m in kept])
print(f"input={count_request(kept)}, output reserved=4, limit=16")
try:
    fit_history(system, exchanges, latest, 14, 4, count_request)
except ValueError as error:
    print(error)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
['system', 'user']
input=12, output reserved=4, limit=16
mandatory input and reserved output exceed context limit
```
<!-- leetllm: output:end -->

In the run above, the older exchange drops cleanly so the system prompt and current query remain intact. That works cleanly when earlier turns are disposable, whereas if turn `0` carries a critical module invariant or exact constant needed downstream, compact that state into a structured summary before it falls outside the window. Even once the full conversation fits comfortably inside the budget, however, positioning distant text beyond the model's pretrained sequence span introduces a second failure mode around coordinate scaling.

```checkpoint
When should you compact history instead of truncating it?
---
Truncate when older turns are disposable and no summary call is needed. Compact when early facts still matter, then check that required facts, source IDs, and unresolved work survived. A shorter summary reduces input, but extra calls and summary errors are real costs.
```

## Second gate: do stretched positions still mean what you think?

The [positional encoding article](/learn/positional-encoding-rope-alibi) explains why attention needs a position signal. Past the training range, the model can see rotations and frequency combinations it didn't learn. **Rotary Position <span data-glossary="embedding">Embeddings</span> (RoPE)**[^su2021] rotates those <span data-glossary="positional-encoding">position encodings</span> into attention, and interpolation or rescaling tries to extend that learned coordinate system. Llama 3 also raised its RoPE base $\theta$ to 500,000, stretching the useful range before interpolation.[^dubey2024]

### RoPE basics

Picture each pair of embedding dimensions as a dial. Dials rotate at different speeds, so a token's position is a combination of angles rather than one scalar. Comparing two rotated vectors exposes their relative offset, which gives attention distance-aware information without adding a separate lookup row for every position.

RoPE rotates pairs of **query and key head dimensions**, not the residual token embedding itself. Write each pair as a complex number $x_j$ with frequency $\omega_j$:

$$
\text{RoPE}(x_m, m)_j = e^{i m \omega_j} x_j, \qquad \omega_j = \theta^{-2j/d_{\text{rot}}}
$$

#### Reading the formula

Here $d_{\text{rot}}$ is the even number of rotated head dimensions and $j$ indexes pairs. Position $m$ rotates pair $j$ by $m\omega_j$ radians. In a query-key dot product, the two rotations yield a relative-position angle. Fast frequencies distinguish nearby positions; slow frequencies change more gradually. These are periodic signals, not unique position IDs.

### Position interpolation and NTK-aware scaling

Suppose training stopped at 8,192 tokens and deployment targets 32,768. Naive extrapolation introduces relative offsets and joint frequency patterns outside the trained range, even though individual angles are periodic. **Position interpolation** instead compresses the position coordinate:

$$
m' = m \times \frac{L_{\text{train}}}{L_{\text{target}}}
$$

Uniform interpolation protects the range by compressing every frequency band equally. NTK-aware (Neural Tangent Kernel) scaling changes that compromise: it stretches low-frequency dimensions more while keeping high-frequency dimensions closer to their original behavior. Try it to protect local precision, not because every checkpoint tolerates the same factor.

<!-- leetllm: test, output=show -->
```python title="interpolate_position.py"
import numpy as np

def interpolate_position(positions: np.ndarray, trained_window: int, target_window: int) -> np.ndarray:
    """Map extended token indices into the original trained position range."""
    if trained_window <= 0 or target_window < trained_window:
        raise ValueError("require positive windows with target_window >= trained_window")
    if np.any((positions < 0) | (positions >= target_window)):
        raise ValueError("positions must fall within [0, target_window)")
    return positions * (trained_window / target_window)


positions = np.array([0, 8_192, 16_384, 32_767])
mapped = interpolate_position(positions, trained_window=8_192, target_window=32_768)
for pos, coord in zip(positions, mapped):
    print(f"extended position {pos:>5} -> trained coordinate {coord:7.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
extended position     0 -> trained coordinate    0.00
extended position  8192 -> trained coordinate 2048.00
extended position 16384 -> trained coordinate 4096.00
extended position 32767 -> trained coordinate 8191.75
```
<!-- leetllm: output:end -->

The arithmetic explains the idea; serving code selects a checkpoint-compatible variant. <span data-glossary="hugging-face-transformers">Hugging Face Transformers</span> 5.19.0 uses `rope_parameters`: `linear` is uniform interpolation, `dynamic` rescales the RoPE base, `yarn` is YaRN, `longrope` follows LongRoPE, and `llama3` is the Llama 3.1 frequency split.[^huggingface2026rope][^ding2024longrope] These settings are not interchangeable across architectures, and some hybrid models configure RoPE separately for local sliding-window layers and global layers.

<!-- leetllm: test, output=show, deps=transformers==5.19.0 -->
```python title="rope_parameters.py"
from transformers import LlamaConfig

config = LlamaConfig(
    max_position_embeddings=8_192,
    rope_parameters={
        "rope_type": "dynamic",
        "rope_theta": 10000.0,
        "factor": 4.0,
    },
)
print(f"RoPE type={config.rope_parameters['rope_type']} factor={config.rope_parameters['factor']}")
print(f"configured max positions={config.max_position_embeddings}")
assert config.max_position_embeddings == 8_192
```

<!-- leetllm: output:start -->
```text title="Output" output compact
RoPE type=dynamic factor=4.0
configured max positions=8192
```
<!-- leetllm: output:end -->

This constructs and validates a configuration in Transformers 5.19.0 on CPU without loading weights. Notice that adding `factor=4.0` leaves `max_position_embeddings` at `8,192` and does not train extended attention or raise serving engine caps by itself. Match the checkpoint's published scaling parameters and evaluate quality after extending; a `"yarn"` configuration also sets fields such as `original_max_position_embeddings` and optional `attention_factor`, whereas Llama 3 checkpoints use a larger frequency base than this reference 10,000.[^huggingface2026rope]

Dynamic scaling introduces a cache-consistency constraint too. Whenever position scaling changes the rotary basis for longer contexts, previously cached keys must share that same basis. The YaRN paper notes how mixing old and updated rotary frames corrupts attention scores.[^peng2023] Compare one unit-vector pair with a key at position 1 and a query at position 2:

<!-- leetllm: test, output=show -->
```python title="cached_rotation_basis.py"
import numpy as np

def rotated(position: int, frequency: float) -> np.ndarray:
    angle = position * frequency
    return np.array([np.cos(angle), np.sin(angle)])

query = rotated(2, 0.5)
old_key = rotated(1, 1.0)
consistent_key = rotated(1, 0.5)
print(f"new query / stale key: {np.dot(query, old_key):.6f}")
print(f"new query / consistent key: {np.dot(query, consistent_key):.6f}")
assert abs(float(np.dot(query, consistent_key)) - float(np.cos(0.5))) < 1e-12
```

<!-- leetllm: output:start -->
```text title="Output" output compact
new query / stale key: 1.000000
new query / consistent key: 0.877583
```
<!-- leetllm: output:end -->

A stale cached key at position `1` under unscaled frequency `1.0` happens to align with the new query at position `2` under scaled frequency `0.5`, spuriously colliding at `1.000000` instead of the true cosine `0.877583`. Serving engines avoid this by caching unrotated keys, keeping a fixed scaling basis, or invalidating cached prefixes across context thresholds whenever RoPE scaling parameters change.

<figure>
  <img src="illustrations/_generated/cached_rotation_consistency_dark.png" alt="Two unit-circle plots compare RoPE basis consistency for a query at position 2 with scaled frequency 0.5 (1 radian). A stale cached key stored under unscaled frequency 1 at position 1 also sits at 1 radian, producing dot product 1.000000. Re-rotating the key under scaled frequency 0.5 puts it at 0.5 radians and restores the true dot product cos(0.5) = 0.877583." />
  <figcaption>Figure 5: Cached RoPE basis consistency on the unit circle. A stale cached key at 1.0 radian collides with the rotated query (dot product 1.000000), whereas recomputing the key under the scaled 0.5 frequency restores cos(0.5) = 0.877583.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/rope_frequency_scaling_dark.png" alt="Uniform 4x position interpolation maps extended indices 0 through 32,768 down to 0 through 8,192 (m prime equals m over 4). Below, angular step factors across six RoPE frequency bands compare uniform 0.25 scaling against YaRN NTK-by-parts blending, which keeps local high-frequency steps near 1.0, linearly ramps transition bands, and compresses long-wavelength low-frequency steps to 0.25." />
  <figcaption>Figure 6: Linear 4x position interpolation versus YaRN frequency-band blending. Uniform scaling compresses every rotary frequency by 4x, whereas YaRN preserves local high-frequency resolution and concentrates interpolation into slow, long-range wavelengths.</figcaption>
</figure>

```checkpoint
Why does naive RoPE extrapolation degrade when context exceeds the training range?
---
The model sees position rotations and frequency combinations it didn't learn during training. Scaling methods map or reshape those positions to preserve useful relative distances, but aggressive extension still needs validation and often continued training.
```

### YaRN (Yet another RoPE extensioN)

YaRN makes the selective compromise explicit. It combines **NTK-by-parts interpolation**, rather than only the NTK-aware base change, with a <span data-glossary="temperature">temperature</span> factor on attention <span data-glossary="logits">logits</span>.[^peng2023] High-frequency dimensions receive no interpolation to protect local order, low-frequency dimensions receive full interpolation to gain range, and middle frequencies use a linear ramp. Attention scaling is distinct from the output sampler's temperature.

That treatment improved long-context <span data-glossary="perplexity">perplexity</span> over plain interpolation at aggressive extension ratios in the YaRN evaluation.[^peng2023] Treat those results as motivation to benchmark YaRN rather than a universal guarantee, because each checkpoint family requires its own recall and perplexity sweep across length bands. Moreover, placing a target normalization constant at an extended coordinate never guarantees that attention heads will read it reliably once irrelevant code distractors accumulate around it.

```checkpoint
Why does YaRN treat frequency bands differently instead of scaling every RoPE dimension the same way?
---
High-frequency bands carry local order and syntax, so over-compressing them hurts short-range precision. Lower-frequency bands can stretch more to represent longer distances. YaRN blends those regimes instead of applying one uniform scale.
```

## Third gate: can the model reach the evidence?

Now return to the repository search problem. Even with a valid budget and an extended position range, recall often depends on where the target definition sits. Liu et al. found that model accuracy varied strongly with evidence position across multi-document tasks, scoring markedly higher near the start or end than in the middle.[^liu2023lost] Prompt layout is therefore part of system design, since a model can ingest every module in the window and still overlook a normalization constant buried in the weak middle. Treat the context window as a position-sensitive retrieval surface rather than a bag whose positions receive uniform attention.

### What the curve looks like

Liu et al.'s benchmarks commonly produce this U-shaped accuracy profile.[^liu2023lost] The Chroma context-rot report later observed flatter depth profiles on one NIAH task even as longer prompts degraded overall accuracy.[^hong2025contextrot] Because sequence-length degradation and midpoint dropoff reflect distinct attention mechanics, measure both across representative prompt formats for your chosen model.

| Placement | Typical Pattern |
|-----------|-----------------|
| **Beginning** of context | Often among the strongest positions |
| **Middle** of context | Most failure-prone |
| **End** of context | Usually recovers relative to the middle |

```checkpoint
What does the lost-in-the-middle curve imply for prompt layout?
---
For a model and task showing middle dropoff, place the highest-ranked excerpts near the beginning or end rather than burying them between weaker chunks, and compare edge-packed prompts against the baseline using the same unique evidence and output budget.
```

### Mitigation strategies

#### Strategic information placement

When a depth sweep exposes a middle miss, adjust ordering before swapping models. Suppose retrieval returns five repository excerpts: the `Attention` normalization code, the `RoPE` scaling configuration, the `KV` layer schedule, a build log, and a `README` section. Placing the two highest-scoring specs at the beginning and end pushes lower-scoring background excerpts into the center.

The helper below applies that edge-first ordering so you can compare it directly against default descending rank order on identical evaluation cases:

<!-- leetllm: test, output=show -->
```python title="arrange_context.py"
from dataclasses import dataclass

@dataclass
class Document:
    text: str
    relevance: float

def arrange_context(
    system_prompt: str,
    retrieved_docs: list[Document],
    user_query: str,
) -> str:
    """Put the two strongest chunks at the edges; leave the rest in the middle."""
    ranked_docs = sorted(retrieved_docs, key=lambda d: d.relevance, reverse=True)
    head_docs = ranked_docs[:1]
    tail_docs = ranked_docs[1:2]
    middle_docs = ranked_docs[2:]

    context = [system_prompt]
    context.extend(d.text for d in head_docs)
    context.extend(d.text for d in middle_docs)
    context.extend(d.text for d in tail_docs)
    context.append(user_query)

    return "\n\n".join(context)

docs = [
    Document("Attention module sets eps=1e-6 before softmax scaling.", 0.95),
    Document("RoPE config scales low-frequency bands via YaRN factor 4.", 0.92),
    Document("KV layout splits 40 local layers and 8 global layers.", 0.88),
    Document("Build log excerpt: checkpoint kernels compiled cleanly.", 0.45),
    Document("README overview section on evaluation scripts.", 0.30),
]

prompt = arrange_context(
    system_prompt="Answer using only the repository excerpts below.",
    retrieved_docs=docs,
    user_query="How is attention position scaled?",
)
print(prompt)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Answer using only the repository excerpts below.

Attention module sets eps=1e-6 before softmax scaling.

KV layout splits 40 local layers and 8 global layers.

Build log excerpt: checkpoint kernels compiled cleanly.

README overview section on evaluation scripts.

RoPE config scales low-frequency bands via YaRN factor 4.

How is attention position scaled?
```
<!-- leetllm: output:end -->

The output puts the normalization constant excerpt first and the RoPE scaling excerpt next to the query, pushing lower-ranked context into the middle. Keep explicit file IDs and delimiters intact in production adapters, treat retrieval scores as ranking keys rather than calibrated probabilities, and evaluate this ordering against unshuffled baselines.

```checkpoint
Why does the sample packing function split high-relevance chunks between head and tail?
---
It keeps the highest-scoring evidence near the beginning and end edges where attention is typically strongest, leaving weaker support in the middle. That edge-first hypothesis neither duplicates facts nor proves universal superiority across every model family, since system framing and query wording shift serialized positions.
```

#### Repeated key information

If a fact is essential and cheap to restate, put a source-labeled excerpt near the evidence head and near the query. Keep retrieved facts as evidence, not system-level instructions. Duplication consumes tokens and can amplify stale or conflicting facts, so compare with the same unique evidence and evaluate whether the extra copy helps.

#### Chunked processing

If one prompt still holds too much distractor text, process the corpus in chunks and merge partial extractions downstream. Chunking shifts the failure mode from single-pass middle loss to whether your merge logic retains every fact needed for synthesis.

<figure>
  <img src="illustrations/_generated/context_packing_layout_dark.png" alt="Five ranked code and spec chunks (A 0.95 Attention, B 0.92 RoPE, C 0.88 KV Layout, D 0.45 Logs, E 0.30 README) are reordered into prompt slots so high-relevance evidence sits at the head and tail (A and B) while lower-scoring background chunks fill the center between System instructions and Query." />
  <figcaption>Figure 7: Relevance-ordered chunks packed by edge priority. The two top-scoring specifications (A at 0.95 and B at 0.92) anchor the head and tail beside System instructions and Query, placing lower-scoring middle support in the center.</figcaption>
</figure>

The packing policy places the two strongest facts at the prompt edges and lower-priority support in the middle. Test this layout with depth-sliced evaluation; if the model still overlooks key details, tighten retrieval to fewer chunks rather than keeping noisy middle context.

## Fourth gate: should you read everything or retrieve first?

The routing choice starts with the question structure, not the model's maximum window. Ask whether the working corpus fits comfortably with output headroom, whether exact citations or fresh edits matter, whether queries repeat over the same files, and whether the question needs joint synthesis or an exact count.

<figure>
  <img src="illustrations/_generated/long_context_decision_dark.png" alt="Three evidence routing paths depend on question structure. A single self-contained packet uses a full-context baseline with recall testing. A targeted single-fact query retrieves top-k labeled chunks for RAG with miss-risk checks. Cross-file questions filter candidates, pack labeled snippets, or aggregate exact counts over all matches." />
  <figcaption>Figure 8: Routing decisions by query type. Self-contained corpora that fit comfortably can start with full context; large archives with targeted questions use RAG with miss audits; cross-file analysis combines filtering with exact aggregation for counts.</figcaption>
</figure>

The core architectural choice compares reading the whole prompt directly against <span data-glossary="rag">retrieval-augmented generation (RAG)</span>. Full context exposes every selected snippet jointly, preserving cross-file relationships at higher prefill compute. RAG narrows the prompt first, trimming generation latency while adding a retrieval stage that can miss relevant definitions.

For one question over a stable specification packet, full context is a clean baseline. For repeated queries over changing repositories or targeted lookups across thousands of files, retrieval is the natural baseline to compare against.

| Factor | Long Context | RAG |
|--------|-------------|-----|
| **Latency** | One generation call, though large prefills dominate | Retrieval adds a stage, while shorter prompts speed decode |
| **Cost** | Pays for packed input on uncached requests | Pays for indexing, retrieval, and selected chunks |
| **Failure mode** | Evidence present in prompt may be missed by position or distractors | Relevant chunk may be dropped before generation |
| **Corpus scale** | Constrained by usable prompt budget | Searches repositories larger than one prompt |
| **Operational work** | Prompt packing, KV prefix reuse, depth evals | <span data-glossary="chunking">Chunking</span>, indexing, ranking, recall evals |

Repeated queries over a fixed prefix also split along cache economics. Resending uncached text repeats prefill compute, while keeping it warm occupies GPU cache memory. Neither option provides citations automatically, so keep file paths, line ranges, or symbol versions attached to every excerpt.

```checkpoint
When should you prefer RAG or hybrid retrieval even if a document technically fits in the model context?
---
Prefer RAG or hybrid retrieval when queries repeat over a large or fast-changing corpus, when only a sparse subset of files applies, or when distractor volume hurts full-window accuracy. Measure retrieval recall directly against long-context position sensitivity on the same queries.
```

### A concrete decision example

Suppose a multi-version repository index exceeds a single 128K context window, and a developer asks, “In release `v2`, which module contains more `legacy_softmax` call sites?” A <span data-glossary="top-k">top-k</span> similarity retriever stops after selecting the highest-scoring matches and can invert the true distribution. Counting requires an exhaustive code or AST query over **all** qualifying records, leaving the language model to explain the exact counts.

Semantic similarity scores measure local relevance, not subset completeness. As shown in `complete_counts.py`, the two top-ranked hits (`m1` at 0.99 and `m2` at 0.98) both live in `encoder`, hiding the three lower-scored `v2` matches (`m3`, `m4`, `m5`) in `decoder`:

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
partial = Counter(r[2] for r in top_two)
complete = Counter(r[2] for r in v2_legacy)
print(f"top-2 counts: {dict(partial)}")
print(f"complete counts: {dict(complete)}")
assert partial.most_common(1)[0][0] != complete.most_common(1)[0][0]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
top-2 counts: {'encoder': 2}
complete counts: {'encoder': 2, 'decoder': 3}
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/complete_counts_counterexample_dark.png" alt="Seven module scan records show why similarity top-k cannot replace exhaustive counting. Filtering v2 legacy_softmax call sites keeps m1 through m5. Top-2 retrieval selects m1 (0.99) and m2 (0.98), both in encoder (encoder 2, decoder 0), whereas counting all five matches gives encoder 2 and decoder 3." />
  <figcaption>Figure 9: Why top-k similarity retrieval reverses exact aggregates. Filtering for v2 and legacy_softmax leaves m1 through m5; top-2 selects only encoder (2 vs. 0), whereas scanning every qualifying record yields decoder as the leader (3 vs. 2).</figcaption>
</figure>

Top-2 selects the wrong winner because high similarity clusters around one module while lower-scored matches accumulate elsewhere. Across large codebases or databases, define deterministic symbol identity, deduplication, and snapshot revision filters in code or SQL, then pass the verified aggregate plus matching identifiers to the model for explanation.

```checkpoint
Why can't a larger top-k guarantee a correct winner in the module scan example?
---
Unless retrieval covers every qualifying record under the filter predicates, omitted lower-scoring rows can flip the aggregate total. Run deterministic filters and exact counting in code or SQL first, then let the model explain the verified table and matching file IDs.
```

## Fifth gate: can the chosen path run on real GPUs?

Once the evidence path is chosen, capacity becomes the release constraint. Long-context serving often saturates HBM with KV caches well before model weights fill the device, particularly when multiple long sessions decode concurrently. Every design decision from attention head structure to floating-point cache layout directly controls how many requests fit in memory alongside weights and workspace activations.

### Grouped query attention (GQA)

GQA (Grouped-Query Attention)[^ainslie2023] lowers KV-cache bytes by sharing key/value heads across query groups; full architecture details appear in our [MQA/GQA deep-dive](/learn/multi-query-grouped-query-attention). MHA allocates separate key/value projections for every query head, GQA shares KV heads across groups, and MQA collapses keys and values to a single shared head per layer. Moving from 64 KV heads down to 8 cuts per-token KV storage by 8x, and collapsing to 1 cuts it by 64x, though altering head counts requires training or an evaluated uptraining procedure rather than changing inference flags alone.

Head sharing isn't the only architectural KV cut. <span data-glossary="multi-head-latent-attention">Multi-head latent attention (MLA)</span> caches a compressed latent plus positional-key state rather than full K/V heads. DeepSeek-V2 reports a 93.3% KV-memory reduction versus DeepSeek 67B.[^deepseekv2_2024] That's a comparison of those architectures, not a generic compression ratio. MLA is a trained architecture choice, not a serving flag for a GQA checkpoint.

<!-- leetllm: test, output=show -->
```python title="kv_head_sharing.py"
def relative_kv_bytes(query_heads: int, kv_heads: int) -> float:
    if query_heads <= 0 or kv_heads <= 0 or query_heads % kv_heads:
        raise ValueError("positive KV heads must divide query heads")
    return kv_heads / query_heads


query_heads = 64
for label, kv_heads in [("MHA", 64), ("GQA", 8), ("MQA", 1)]:
    fraction = relative_kv_bytes(query_heads, kv_heads)
    print(f"{label}: {fraction:.3f}x MHA KV bytes ({1 / fraction:.0f}x smaller)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MHA: 1.000x MHA KV bytes (1x smaller)
GQA: 0.125x MHA KV bytes (8x smaller)
MQA: 0.016x MHA KV bytes (64x smaller)
```
<!-- leetllm: output:end -->

```checkpoint
Why does GQA matter so much for long context?
---
The KV cache stores key and value heads, not query heads. Sharing K/V heads across query groups reduces bytes per token, so the savings multiply across long context length and concurrent requests.
```

### Quantized KV-cache

If the cache still crowds out concurrency, reduce bytes per element. BF16 or FP16 stores each cached element in 2 bytes, whereas an **FP8 KV-cache** uses 1 byte, cutting the 40 GiB BF16 cache down to about 20 GiB. Lower precision trades memory capacity against attention accuracy, so calibrated scales and long-depth benchmarks decide whether the quantization holds for your workload.

| Cache dtype | Bytes per cached element | Relative KV size |
|-------------|--------------------------|------------------|
| **BF16 / FP16** | 2 bytes | 1.0x |
| **FP8** | 1 byte | ~0.5x |

The configuration below follows vLLM's FP8 KV-cache option, where uncalibrated scales default to `1.0` unless calibrated via `llm-compressor` and selected layers can be exempted with `kv_cache_dtype_skip_layers`.[^vllm2026kvquant] Note that a `"sliding_window"` skip rule only applies when matching local layers exist, and FP8 kernels such as FlashAttention 3 quantize queries during attention as well, so verify exact runtime behavior and layer coverage on your target GPU.

```python title="fp8_kv_cache.py"
from vllm import LLM

llm = LLM(
    model="your-org/your-model",
    kv_cache_dtype="fp8",
    kv_cache_dtype_skip_layers=["sliding_window"],
)
```

<!-- leetllm: test, output=show -->
```python title="concurrent_sequences.py"
def concurrent_sequences(memory_budget_bytes: int, kv_per_request_bytes: int) -> int:
    if memory_budget_bytes < 0 or kv_per_request_bytes <= 0:
        raise ValueError("require nonnegative memory budget and positive per-request cache bytes")
    return memory_budget_bytes // kv_per_request_bytes


cache_budget = 64 * 2**30
for dtype, kv_gib in [("BF16", 40), ("FP8 candidate", 20)]:
    slots = concurrent_sequences(cache_budget, kv_gib * 2**30)
    print(f"{dtype}: at most {slots} full-length request(s) in cache budget")
assert concurrent_sequences(0, 1) == 0
assert concurrent_sequences(10, 1) == 10
```

<!-- leetllm: output:start -->
```text title="Output" output compact
BF16: at most 1 full-length request(s) in cache budget
FP8 candidate: at most 3 full-length request(s) in cache budget
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cache_capacity_dark.png" alt="A 64 GiB KV cache pool holds only one 40 GiB BF16 128K sequence (leaving 24 GiB unused, short of a second 40 GiB sequence), whereas quantized FP8 KVs at 20 GiB per sequence fit three concurrent sequences with 4 GiB remaining." />
  <figcaption>Figure 10: Raw KV cache capacity inside a 64 GiB memory pool. One 40 GiB BF16 request leaves 24 GiB idle, whereas three 20 GiB FP8 requests pack cleanly before deducting allocator block rounding, scale metadata, and generation headroom.</figcaption>
</figure>

Use exact integer division on byte counts rather than floating-point ratios (`1.0 // 0.1` evaluates to `9.0` in binary IEEE-754 arithmetic despite equal decimal values). This count gives an upper bound on full-length KV tensors; reserve additional memory for paged-block rounding, quantization scales, temporary workspace buffers, and active output growth when configuring server slot limits.

```checkpoint
What should you verify after enabling FP8 KV cache?
---
Verify long-context retrieval, multi-hop reasoning, ordering, and latency on your workload. FP8 can roughly halve KV memory, but poor calibration or unsupported kernels can damage quality or fail to improve throughput.
```

### PagedAttention (vLLM)

Bytes per token are only half of capacity. A contiguous reservation can strand free memory as requests grow and finish. PagedAttention manages KV in non-contiguous blocks or “pages,” like virtual memory, so fixed-size blocks are allocated on demand (see our [KV cache and PagedAttention deep-dive](/learn/kv-cache-paged-attention-llm-serving)). The vLLM paper describes near-zero waste and sharing for common prefixes in its evaluated workloads.[^kwon2023]

That layout reduces reservation and fragmentation waste, but it does **not** change the intrinsic KV bytes for a model and sequence length. It can make more of the GPU usable; it can't make one 128K sequence weigh less. The paper reported higher throughput in its evaluated serving workloads.[^kwon2023]

### Prefix reuse and prompt caching

A repository QA workflow often prepends the same 48K-token prefix to every query: system instructions, tool schemas, and core module files. Prefix caching reuses materialized KV blocks across requests with identical prefixes instead of recomputing projections from token zero, controlled in vLLM via `enable_prefix_caching=True`.[^kwon2023][^vllm2026prefix] Eliminating duplicate prefill cuts time-to-first-token without enlarging the model's context limit or freeing decode memory bandwidth, because suffix generation steps must still read cached prefix blocks. Prefix hits match only up to the first changed token and disappear upon cache eviction, so store durable conversation history outside volatile KV memory.[^vllm2026prefix]

<!-- leetllm: test, output=show -->
```python title="prefix_reuse.py"
def prefill_tokens_without_reuse(shared_prefix: int, unique_suffixes: list[int]) -> int:
    if shared_prefix < 0 or any(x < 0 for x in unique_suffixes):
        raise ValueError("token counts must be nonnegative")
    return sum(shared_prefix + suffix for suffix in unique_suffixes)


def prefill_tokens_with_reuse(shared_prefix: int, unique_suffixes: list[int]) -> int:
    prefill_tokens_without_reuse(shared_prefix, unique_suffixes)
    return shared_prefix + sum(unique_suffixes) if unique_suffixes else 0


shared_prefix = 48_000
questions = [800, 1_200, 600]
uncached = prefill_tokens_without_reuse(shared_prefix, questions)
reused = prefill_tokens_with_reuse(shared_prefix, questions)
print(f"uncached input tokens processed: {uncached:,}")
print(f"with reusable prefix candidate: {reused:,}")
print(f"avoided repeated prefix tokens: {uncached - reused:,}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
uncached input tokens processed: 146,600
with reusable prefix candidate: 50,600
avoided repeated prefix tokens: 96,000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/prefix_reuse_dark.png" alt="Three requests share a 48,000-token prefix plus unique suffixes of 800, 1,200, and 600 tokens. Without prefix caching, prefill computes 146,600 tokens; reusing exact cached prefix blocks computes 50,600 new tokens and skips 96,000 duplicate prefix tokens." />
  <figcaption>Figure 11: Prefix cache savings across three sequential requests sharing a 48,000-token codebase prefix. Reusing cached blocks drops computed prefill tokens from 146,600 to 50,600 (skipping 96,000 tokens), while decode attention still reads the cached prefix KV blocks on each step.</figcaption>
</figure>

### Ring attention across multiple GPUs

PagedAttention reduces memory waste within a single GPU, yet an ultra-long context can still exceed one device's compute or KV residency budget. Ring Attention partitions sequence blocks across GPUs in a communication ring and overlaps remote KV block transfers with local FlashAttention kernels, enabling multi-device execution where interconnect bandwidth governs effective scaling.[^liu2024ring] In serving engines, vLLM documents decode context parallelism (DCP) for GQA and MLA architectures to shard sequence history across existing tensor-parallel ranks, while prefill context parallelism evaluates all-gather versus ring KV exchange.[^vllm2026contextParallel] When auditing paged residency across ranks, track the distinction between physical block size and logical block size (`effective_attention_block_size`): with physical size `16` and `DCP = 4`, each logical block spans `64` tokens, so a `1,025`-token history allocates `17` logical blocks (`1,088` positions) rather than `65` physical blocks (`1,040` positions).[^vllm2026contextParallel]

<figure>
  <img src="illustrations/_generated/context_parallel_block_grid_dark.png" alt="Under decode context parallelism across 4 ranks with physical block size 16, one logical block covers 64 positions (4 x 16). A 1,025-token history allocates 17 logical blocks (1,088 positions), whereas rounding by physical block size 16 yields 65 blocks (1,040 positions)." />
  <figcaption>Figure 12: Logical block sizing under decode context parallelism (DCP=4, physical block size 16). One logical block spans 64 positions across four rank slices, so a 1,025-token sequence occupies 17 logical blocks (1,088 capacity positions) rather than 65 single-device blocks.</figcaption>
</figure>

```checkpoint
How do PagedAttention and Ring Attention solve different long-context problems?
---
PagedAttention reduces KV allocation waste within a GPU. Ring Attention distributes blockwise attention and KV residency across multiple GPUs using context parallelism.
```

## Final gate: does it work at the lengths and depths you will serve?

Capacity numbers and a successful short prompt never guarantee retrieval quality. **NIAH (Needle-in-a-Haystack)** inserts a target fact, the needle, at controlled relative depths inside unrelated filler tokens and evaluates exact recovery, such as retrieving a normalization constant hidden inside tens of thousands of tokens of surrounding modules.[^kamradt2023niah] Sweeping sequence lengths from 4K to 128K and insertion depths from 0% to 100% maps out a retrieval **heatmap**: uniform recall leaves cool miss cells everywhere, whereas position-sensitive models exhibit sharp middle spikes near 50% depth as prompt length climbs.

<figure>
  <img src="illustrations/_generated/niah_heatmap_dark.png" alt="A 4-by-5 heatmap shows needle miss rates rising from 1–3% at 4K to 12%, 37%, 72%, 39%, and 13% across depths 0%, 25%, 50%, 75%, and 100% at 128K. Below, the 128K recall curve traces 1 minus miss rate as a characteristic U-shape dipping to 28% in the middle." />
  <figcaption>Figure 13: Needle-in-a-Haystack miss-rate matrix across context lengths and depths paired with the corresponding 128K recall U-curve (1 minus miss rate), showing severe middle-depth recall dropoff as context length scales.</figcaption>
</figure>

Single-fact NIAH tests simple lookup alone, so benchmarks such as RULER[^hsieh2024] extend evaluation to multi-needle retrieval, multi-hop variable tracking, and cross-span aggregation. Pair retrieval sweeps with position-bucketed perplexity or negative log-likelihood so you spot sudden loss spikes immediately past the pretraining length threshold, and test distractor-heavy inputs as highlighted by Chroma's 2025 **context rot** study of 18 models.[^hong2025contextrot] A reproducible evaluation harness controls exact needle depth while protecting output headroom; the helper below packs integer token sequences so you can audit exact insertion indices, actual depth ratios, and generation room before calling a model.

<!-- leetllm: test, output=show -->
```python title="place_needle.py" id=needle-packer
import math

def place_needle(
    haystack: list[int],
    needle: list[int],
    instruction: list[int],
    context_limit: int,
    requested_depth: float,
    max_new_tokens: int,
) -> tuple[list[int], float]:
    """Insert needle ids at a requested depth and keep input-plus-output inside the limit."""
    if context_limit <= 0 or max_new_tokens < 0:
        raise ValueError("invalid context or generation budget")
    if not math.isfinite(requested_depth) or not 0 <= requested_depth <= 1:
        raise ValueError("depth must be finite and between 0 and 1")
    if not needle:
        raise ValueError("needle must be nonempty")
    document_budget = context_limit - max_new_tokens - len(instruction)
    if document_budget < len(needle):
        raise ValueError("context limit is too small for instruction, needle, and output")

    filler_budget = document_budget - len(needle)
    clipped = haystack[:filler_budget]
    insert_idx = int(len(clipped) * requested_depth)
    document = clipped[:insert_idx] + needle + clipped[insert_idx:]
    packed = instruction + document
    if len(packed) + max_new_tokens > context_limit:
        raise AssertionError("packed prompt plus generation exceeds the context limit")
    actual_depth = insert_idx / max(len(clipped), 1)
    return packed, actual_depth


packed, depth = place_needle(
    haystack=list(range(20)),
    needle=[99, 99],
    instruction=[1, 2],
    context_limit=24,
    requested_depth=0.5,
    max_new_tokens=4,
)
print(packed)
print(f"tokens={len(packed)} actual_depth={depth:.2f}")
short, short_depth = place_needle([], [99], [1], 8, 1.0, 2)
assert short == [1, 99] and short_depth == 0.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[1, 2, 0, 1, 2, 3, 4, 5, 6, 7, 99, 99, 8, 9, 10, 11, 12, 13, 14, 15]
tokens=20 actual_depth=0.50
```
<!-- leetllm: output:end -->

The packed sequence retains 2 instruction tokens, inserts the needle at 50% of the 16 clipped haystack tokens, and reserves 4 generation tokens inside the 24-token limit. Depth is computed over filler tokens alone rather than including instructions or generation tokens; when filler is empty, depth evaluates to zero. Next, probe that harness with a deliberately limited edge reader that scans only the first four and last four document tokens: midpoint failure comes directly from masking the middle span, contrasting with a full-window scan across all three depths.

<!-- leetllm: test, output=show -->
```python title="depth_probe.py" continue=needle-packer
def contains(sequence: list[int], target: list[int]) -> bool:
    return any(sequence[i:i + len(target)] == target
               for i in range(len(sequence) - len(target) + 1))

needle = [99, 98]
for requested_depth in (0.0, 0.5, 1.0):
    packed, actual_depth = place_needle([0] * 30, needle, [1, 2], 24,
                                       requested_depth, 4)
    document = packed[2:]
    full_scan = contains(document, needle)
    edge_scan = contains(document[:4], needle) or contains(document[-4:], needle)
    assert full_scan
    print(f"depth={actual_depth:.1f}: full_scan={full_scan}, edge_scan={edge_scan}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
depth=0.0: full_scan=True, edge_scan=True
depth=0.5: full_scan=True, edge_scan=False
depth=1.0: full_scan=True, edge_scan=True
```
<!-- leetllm: output:end -->

```checkpoint
Why is a single needle-in-a-haystack result not enough to trust a long-context model?
---
One needle tests one fact, one distractor style, one position, and often one seed. Real systems need sweeps over positions, lengths, multiple needles, distractor templates, and synthesis tasks such as RULER-style multi-hop reasoning.
```

In a live model evaluation, log case prompt length, actual depth, needle ID, reference answer, generated output, and scorer outcome alongside negative controls without the needle and multi-hop reasoning tasks. Alongside quality, profile time-to-first-token (TTFT), inter-token latency, peak KV residency, and sustainable concurrency on the target serving stack. Never collapse a retrieval heatmap into a single average before checking individual depth slices: in the comparison below, both runs average 90% across 100-case evaluation slices, yet the candidate boosts edges while failing an 85% floor in the middle:

<!-- leetllm: test, output=show -->
```python title="same_mean_different_release.py"
for name, correct in [('baseline', (90, 90, 90)), ('candidate', (100, 70, 100))]:
    rates = [count / 100 for count in correct]
    overall = sum(correct) / 300
    gate = min(rates) >= 0.85
    print(f"{name}: overall={overall:.0%}, worst depth={min(rates):.0%}, gate={gate}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
baseline: overall=90%, worst depth=90%, gate=True
candidate: overall=90%, worst depth=70%, gate=False
```
<!-- leetllm: output:end -->

The candidate boosts edge recall to 100% while failing the middle-depth floor at 70%. Release gates therefore must evaluate each length and depth cell individually while retaining paired per-example outcomes to catch regressions hidden by pooled averages.[^kamradt2023niah]

<figure>
  <img src="illustrations/_generated/needle_harness_and_release_slices_dark.png" alt="A 24-token needle harness reserves 2 instruction tokens, 16 filler tokens, a 2-token needle, and 4 output tokens. At depth 0.5, an edge reader checking only the first and last 4 tokens misses the middle needle while a full scan passes all depths. Across 100-case evaluation slices, baseline scores 90/90/90 and candidate scores 100/70/100: both average 90%, while the candidate fails an 85% per-depth floor." />
  <figcaption>Figure 14: Top: 24-token depth harness reserving output headroom while testing middle insertion at depth 0.5 against edge-only and full-window readers. Bottom: Per-depth 100-case recall slices where a candidate scoring 100/70/100 matches the baseline's 90% pooled mean while failing the 85% per-depth floor.</figcaption>
</figure>

### Evaluation rubric

- Compute the serialized input/output budget and reject a mandatory-input overflow without silently dropping the latest request.
- Derive raw KV bytes with KV heads, dtype, sequence length, and concurrency; distinguish logical state from per-device residency and measured traffic.
- Show why top-k can reverse an exact count, and choose complete aggregation or coverage-tested retrieval according to the question.
- Design a length/depth evaluation with actual outputs, negative controls, and serving measurements; don't infer effective recall from acceptance alone.

### Follow-up questions

```checkpoint
What happens when fit_history receives a 14-unit context limit and reserves four output units under its whitespace unit counter?
---
The mandatory messages cost eleven units, leaving only ten input units. It raises ValueError rather than sending an incomplete request. A real implementation repeats this check with the deployment's serialized token count.
```

```checkpoint
Why can an empty query list expose a bug in a prefix-reuse cost estimator?
---
An empty query list has zero prefill work. Charging the shared prefix unconditionally would overcount, so the example returns zero for empty input and assumes an exact retained prefix for nonempty input.
```


## What to carry forward

Return to the multi-module repository query. Did the prompt retain the right file version? Did the packer reserve a usable answer budget? Can the checkpoint attend cleanly across extended positions and retrieve facts from every depth slice? Does the serving setup preserve latency targets under concurrent KV residency? An advertised token limit answers only the smallest piece of that checklist, so preserve source file paths and line identifiers outside lossy prose summaries, sum KV cache budgets layer by layer, compute exact aggregates in code or SQL rather than estimating them from top-k similarity hits, and evaluate every optimization across depth-sliced paired benchmarks so pooled averages never mask a localized regression.

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
