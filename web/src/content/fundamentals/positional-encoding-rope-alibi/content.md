---
{
  "id": "positional-encoding-rope-alibi",
  "title": "Positional Encoding: RoPE & ALiBi",
  "slug": "positional-encoding-rope-alibi",
  "section": "Transformer & Multimodal Architectures",
  "category": "Transformer Architecture",
  "difficulty": "Hard",
  "order": 2,
  "prerequisites": [],
  "coverImage": "social_banner.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "DeepMind",
    "NVIDIA"
  ],
  "shortDescription": "Unmasked attention follows tokens when they move. Sinusoids, RoPE, and ALiBi put order back in different places, and a longer formula still needs a retrieval test.",
  "keyConceptsTested": [
    "Permutation Equivariance",
    "Sinusoidal Positional Encoding",
    "Learned Embeddings",
    "Rotary Position Embeddings (RoPE)",
    "ALiBi",
    "Long-Context Extrapolation",
    "Position Interpolation",
    "NTK-Aware Scaling",
    "YaRN",
    "Attention Bias"
  ],
  "aliases": [
    "long-context-window-management"
  ]
}
---

*"The model loaded the checkpoint"* and *"The checkpoint loaded the model"* contain the exact same five words, yet reverse who acted on whom. Without a position signal, unmasked <span data-glossary="self-attention">self-attention</span> cannot tell those two sentences apart: shuffle the input rows by any permutation $P$, and the output rows simply shuffle by the exact same $P$.

Transformers put order back at three completely different points in the block: **additive <span data-glossary="positional-encoding">position embeddings</span>** at the input, **<span data-glossary="rope">RoPE</span>** rotating projected queries and keys, or **<span data-glossary="alibi">ALiBi</span>** adding a linear distance penalty directly to attention <span data-glossary="logits">logits</span>. Understanding *where* order enters explains both how checkpoints scale to 128K+ context and why subtle bugs (like `bfloat16` position rounding or adjacent vs. split-half rotary layouts) silently break attention.

## First, watch attention lose the order

Take unmasked self-attention $\text{Attention}(X) = \text{softmax}(Q K^T / \sqrt{d_k}) V$ and left-multiply the input rows by a permutation matrix $P$ ($X' = P X$).[^vaswani2017] Because linear projections act on columns, $Q' = P Q$, $K' = P K$, and $V' = P V$. Substituting $(P K)^T = K^T P^T$ and using orthogonality $P^T P = I$:

$$
A' = \text{softmax}\!\left(P \frac{Q K^T}{\sqrt{d_k}} P^T\right) = P A P^T, \qquad
Y' = A' V' = (P A P^T)(P V) = P(A V) = P Y
$$

That property, $\text{Attention}(P X) = P\,\text{Attention}(X)$, is **permutation equivariance**. A fixed <span data-glossary="causal-mask">causal mask</span> breaks that symmetry by letting token $i$ count visible predecessors $j \le i$ (enough for Haviv et al.'s NoPos causal decoders to recover approximate positions, while unmasked bidirectional encoders collapse without position signals).[^haviv2022]

<figure>
  <img src="illustrations/_generated/position_blind_attention_dark.png" alt="Two attention traces compare token order before and after permutation P=[2,0,1]. Token rows and attention-weight matrices reorder together, producing Y' = P Y and showing permutation equivariance without a position signal." />
  <figcaption>Without a position signal or fixed mask, shuffling input rows `[model, loaded, ckpt]` simply shuffles the attention weights and output rows by the exact same permutation.</figcaption>
</figure>

| Approach | Where position enters | Extra parameters | Examples |
|---|---|---|---|
| **Absolute (sinusoidal / learned)** | Added to token embeddings | $0$ / $L_{\max} \times d$ | Original Transformer, BERT, GPT-2[^vaswani2017][^devlin2019][^radford2019code] |
| **Rotary (RoPE)** | Rotates projected $Q$ and $K$ ($V$ untouched) | $0$ | RoFormer, Llama family[^su2021][^dubey2024] |
| **Linear bias (ALiBi)** | Added to pre-softmax attention logits | $0$ | ALiBi[^press2022] |

<figure>
  <img src="illustrations/_generated/positional_encoding_dark.png" alt="Three attention pipelines compare where position enters: additive embeddings modify token vectors before QKV projections, RoPE rotates projected queries and keys in 2D pairs while leaving values unrotated, and ALiBi adds a distance penalty directly to pre-softmax logits." />
  <figcaption>Three insertion points inside one attention block: input embeddings (additive), projected Q/K (RoPE), or pre-softmax logits (ALiBi).</figcaption>
</figure>

## Absolute position: give every slot a multi-speed fingerprint

The original Transformer adds geometric sine/cosine pairs to each token embedding:[^vaswani2017]

$$
PE_{(\text{pos}, 2i)} = \sin\!\left(\frac{\text{pos}}{10000^{2i/d_{\text{model}}}}\right), \qquad
PE_{(\text{pos}, 2i+1)} = \cos\!\left(\frac{\text{pos}}{10000^{2i/d_{\text{model}}}}\right)
$$

Every pair acts like a dial turning at a different wavelength $\lambda_{2i} = 2\pi \cdot 10000^{2i/d_{\text{model}}}$: at $d_{\text{model}} = 512$, pair `(0, 1)` cycles every ~6 tokens to distinguish neighbors, pair `(64, 65)` cycles every ~20 tokens, and pair `(510, 511)` takes ~60,611 tokens. By trigonometric addition formulas, stepping forward by $k$ is a linear $2\times 2$ rotation depending only on $k$:

$$
\begin{bmatrix} \sin((p+k)\omega) \\ \cos((p+k)\omega) \end{bmatrix}
= \begin{bmatrix} \cos(k\omega) & \sin(k\omega) \\ -\sin(k\omega) & \cos(k\omega) \end{bmatrix}
\begin{bmatrix} \sin(p\omega) \\ \cos(p\omega) \end{bmatrix}
$$

Why add instead of concatenate? Concatenation doubles hidden width from $d$ to $2d$, quadrupling the size of every $W_Q, W_K, W_V$ matrix ($4\times$ entries). Adding keeps width $d$, at the cost of mixing content and position into four cross terms when computing $(x_m + p_m) W_Q W_K^T (x_n + p_n)^T$. And although the sinusoidal formula is defined past training length, Press et al. showed sinusoidal models still suffer sharp perplexity spikes past $L_{\text{train}}$.[^press2022]

<figure>
  <img src="illustrations/_generated/sinusoidal_waves_dark.png" alt="Sinusoidal waves across dimension pairs (0,1), (64,65), and (510,511) for d_model=512 over positions 0 to 32. At position 12, sine and cosine equal [-0.537, 0.844], [-0.608, -0.794], and [0.001, 1.000], with cumulative phases 12.00, 3.80, and 0.001 radians." />
  <figcaption>Multi-speed sinusoidal dials for $d_{\text{model}} = 512$: pair (0,1) oscillates rapidly while pair (510,511) barely moves across 32 tokens.</figcaption>
</figure>

## RoPE: make a shared offset visible inside QK

**Rotary Position Embedding (RoPE)** moves position out of the embedding table and straight into query-key geometry.[^su2021] For each 2D coordinate pair $(q_{2i}, q_{2i+1})$ with frequency $\theta_i = b^{-2i/d_{\text{rotary}}}$, RoPE rotates the pair by angle $m\theta_i$:

$$
\begin{pmatrix} q_{2i}^{(m)} \\ q_{2i+1}^{(m)} \end{pmatrix}
= \begin{pmatrix} \cos(m\theta_i) & -\sin(m\theta_i) \\ \sin(m\theta_i) & \cos(m\theta_i) \end{pmatrix}
\begin{pmatrix} q_{2i} \\ q_{2i+1} \end{pmatrix}
$$

Equivalently, viewing each pair as a complex number $z = x + i y$, rotation is simply multiplication by $e^{i m \theta_i}$. Now take the dot product between a query at position $m$ and a key at position $n$. Because $R_{\theta, m}^T R_{\theta, n} = R_{\theta, n - m}$, **both absolute positions cancel completely**, leaving only the relative offset $n - m$:

$$
(R_{\Theta, m} q)^T (R_{\Theta, n} k) = q^T R_{\Theta, n - m} k
$$

Shift both tokens forward by `+100` (from `(2, 1)` to `(102, 101)`), and their dot product stays identical (`0.878`). RoPE preserves vector norms $\|R_{\Theta, m} q\|_2 = \|q\|_2$, adds zero parameters, and leaves **values $V$ unrotated** so position governs *routing* without scrambling the content payload.

<figure>
  <img src="illustrations/_generated/rope_rotation_dark.png" alt="Two RoPE unit-circle panels compare positions (m=2, n=1) and (m=102, n=101) for q=k=[1,0] at theta=0.5. Shifting both positions by 100 rotates both vectors around the circle, while keeping relative angle -0.5 rad and dot product q′·k′=0.878 identical." />
  <figcaption>Shifting both $m$ and $n$ by +100 rotates $q'$ and $k'$ around the circle while keeping their angular gap ($-0.5$ rad) and dot product ($0.878$) identical.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/rope_pair_mechanics_dark.png" alt="RoPE with rotary and key dimensions both 8. Four pairs at frequencies 1, 0.1, 0.01, and 0.001 contribute -0.416, 0.980, 1.000, and 1.000. Their dot-product sum is 2.564; dividing by sqrt(8) gives attention logit 0.906." />
  <figcaption>An 8-dim RoPE head at offset $-2$: the fast pair turns negative ($-0.416$) while slower pairs remain near $+1$, summing to $2.564$ (scaled logit $0.906$).</figcaption>
</figure>

### Three RoPE implementation traps you will meet in real code

1. **Adjacent vs. split-half pairing:** Meta's Llama reference pairs adjacent coordinates `[x0, y0, x1, y1]`, while Hugging Face Transformers pairs split halves `[x0, x1, y0, y1]` (`rotate_half`).[^metaLlama31Rope2026][^llamaRotaryImplementation2026] Both preserve norms, so a norm check never catches a mismatch; converting checkpoints requires permuting the Q/K projection rows (`[0, 2, 1, 3]` for width 4).
2. **`bfloat16` position rounding:** Never cast integer position IDs to `bfloat16` before computing angles! In `bfloat16`, positions `4096` and `4097` both round to `4096.0`, giving identical cosines and collapsing adjacent tokens onto the exact same coordinate! Always compute `pos * freq` in `float32`, then cast `sin`/`cos` to the activation dtype.[^llamaRotaryImplementation2026]
3. **2D/3D multimodal coordinates (MRoPE):** Vision-language models like Qwen2.5-VL split rotary pairs across `(time, height, width)` axes so vertical image neighbors keep a constant offset regardless of image width.[^bai2025qwen25vl][^huggingface2026rope]

<!-- leetllm: test, deps=torch, output=show -->
```python title="rope-mechanics-and-traps.py"
import torch

def apply_rope(vec, pos, freqs, split_half=False):
    out = vec.clone()
    half = len(vec) // 2
    for i, f in enumerate(freqs):
        a, b = (i, i + half) if split_half else (2 * i, 2 * i + 1)
        c, s = torch.cos(pos * f), torch.sin(pos * f)
        out[a], out[b] = vec[a] * c - vec[b] * s, vec[a] * s + vec[b] * c
    return out

# 1. Relative offset invariance & adjacent vs split-half conversion
q = torch.tensor([1., 2., 3., 4.], dtype=torch.float64)
k = torch.tensor([4., 3., 2., 1.], dtype=torch.float64)
freqs = torch.tensor([1.0, 0.01], dtype=torch.float64)

s1 = torch.dot(apply_rope(q, torch.tensor(5.), freqs), apply_rope(k, torch.tensor(2.), freqs))
s2 = torch.dot(apply_rope(q, torch.tensor(105.), freqs), apply_rope(k, torch.tensor(102.), freqs))
perm = [0, 2, 1, 3]
s_conv = torch.dot(apply_rope(q[perm], torch.tensor(5.), freqs, True), apply_rope(k[perm], torch.tensor(2.), freqs, True))
s_wrong = torch.dot(apply_rope(q, torch.tensor(5.), freqs, True), apply_rope(k, torch.tensor(2.), freqs, True))
print(f"offset (5,2)={s1:.6f}, shifted (105,102)={s2:.6f}, converted split-half={s_conv:.6f}, wrong layout={s_wrong:.6f}")

# 2. bfloat16 position rounding collapses 4096 and 4097!
pos = torch.tensor([4096, 4097], dtype=torch.int64)
print("bf16 cosines (collapsed!):", [round(x, 6) for x in pos.to(torch.bfloat16).float().cos().tolist()])
print("fp32 cosines (distinct):  ", [round(x, 6) for x in pos.float().cos().tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
offset (5,2)=-0.760002, shifted (105,102)=-0.760002, converted split-half=-0.760002, wrong layout=-1.615580
bf16 cosines (collapsed!): [0.803991, 0.803991]
fp32 cosines (distinct):   [0.803991, 0.934772]
```
<!-- leetllm: output:end -->

Note also that a single RoPE frequency pair does **not** decay monotonically with distance: $\cos(0.5\Delta)$ dips to `-0.990` at $\Delta = 6$ and climbs back up to `-0.654` at $\Delta = 8$. Men et al. showed that too small a RoPE base breaks long-range passkey retrieval even while aggregate perplexity still looks clean.[^men2024]

<figure>
  <img src="illustrations/_generated/rope_decay_curve_dark.png" alt="One chart compares a RoPE pair score S(Δ)=cos(0.5Δ) with the ALiBi bias B(Δ)=−0.1Δ. Between offsets 6 and 8, the RoPE score rises from −0.990 to −0.654 while the ALiBi score falls from −0.600 to −0.800." />
  <figcaption>A single RoPE pair oscillates ($\cos(0.5\Delta)$ rebounds from $-0.990$ to $-0.654$), whereas ALiBi's linear penalty drops monotonically with distance.</figcaption>
</figure>

## ALiBi: make recency a score bias

**ALiBi (Attention with Linear Biases)** skips embeddings and rotations completely, subtracting a fixed head-specific distance penalty directly from scaled pre-softmax logits for visible keys $j \le i$ (while the causal mask still sets $j > i$ to $-\infty$):[^press2022][^alibiReferenceCode2026]

$$
\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}} + B^{(h)}\right) V, \qquad
B^{(h)}_{ij} = -m_h (i - j) \text{ for } j \le i
$$

For $H$ heads (power of two), slopes follow the geometric ladder $m_h = 2^{-8h/H}$ (for $H = 8$: `1/2, 1/4, ..., 1/256`). Steep heads stay local (Head 1 subtracts `-8.0` at distance 16); gentle heads reach far back (Head 8 subtracts only `-0.0625` at distance 16). Crucially, ALiBi is a **soft recency preference, not a hard mask**: even at distance 16,384 where Head 8 subtracts `-64`, a far key with a `+65` content-score advantage still beats the self-key (`softmax([65 - 64, 0]) = 0.731`).

<figure>
  <img src="illustrations/_generated/alibi_bias_dark.png" alt="ALiBi recency penalties across 8 heads at distance 16 range from -8.0 in Head 1 to -0.06 in Head 8, paired with the 4x4 Head 1 causal bias matrix and a query i=2 trace showing finite past weights [0.186, 0.307, 0.506] and masked future weight 0.000." />
  <figcaption>ALiBi spans steep local heads ($-8.0$ at lag 16) to gentle long-range heads ($-0.06$), biasing past weights toward recency while causal masking zeroes future keys.</figcaption>
</figure>

## Extending RoPE to long contexts

Extending a 4K-trained RoPE checkpoint to 16K or 128K ($s = L_{\text{target}} / L_{\text{train}}$) requires rescaling frequencies cleanly and validating both short-context quality and long-range retrieval:

- **Position Interpolation (PI):** Divides every frequency uniformly by $s$ ($m' = m / s$), mapping `[0, 16383]` back into `[0, 4095.75]` at the cost of compressing fast local bands.[^chen2023b]
- **NTK-aware scaling:** Raises the RoPE base to $b' = b \cdot s^{d/(d-2)}$ so $\theta_i' = \theta_i \cdot s^{-2i/(d-2)}$, keeping the fastest band $\theta_0' = 1$ intact while stretching the slowest band by $1/s$.[^peng2023][^roziere2023]
- **YaRN (Yet another RoPE extensioN):** Splits frequencies by how many full rotations $r_i = L_{\text{train}} \theta_i / (2\pi)$ they complete inside the training window: bands above $\beta = 32$ turns stay untouched, bands below $\alpha = 1$ turn scale by $1/s$, middle bands ramp linearly, and an empirical attention scale $a = 1 + 0.1\ln s$ scales $Q$ and $K$ (multiplying logits by $a^2$, equivalent to temperature $t = 1/a^2$).[^peng2023][^transformersYarn5172026]
- **Modern checkpoint recipes:** Llama 3.1 starts at base `500,000` with a piecewise wavelength ramp;[^metaLlama31Rope2026][^dubey2024] Gemma 3 mixes 5 local layers (`base = 10,000`) per global layer (`base = 1,000,000`);[^gemma3Technical2025] and LongRoPE2 searches per-dimension ratios directly against needle retrieval loss.[^shang2025longrope2]

<figure>
  <img src="illustrations/_generated/rope_scaling_methods_dark.png" alt="Comparison of PI, NTK-aware scaling, and YaRN for 4K-to-16K extension (s=4, d=128). PI compresses all frequency pairs uniformly to 0.25x and maps index 16,383 to 4,095.75, NTK-aware base 40,890 decays geometrically from 1.0x to 0.25x, and YaRN keeps fast bands at 1.0x while scaling attention logits by a^2=1.296 (t=0.771)." />
  <figcaption>Comparing 4K→16K ($s=4$) RoPE extensions: uniform PI (0.25x everywhere), NTK-aware smooth geometric decay, and YaRN band preservation plus attention amplitude scaling ($a = 1.139$).</figcaption>
</figure>

<!-- leetllm: test, deps=torch, output=show -->
```python title="yarn-and-cache-consistency.py"
import math
import torch
import torch.nn.functional as F

# 1. YaRN band ratios (d=8, L_train=4096, s=4) & attention temperature
orig = [10000.0 ** (-2 * i / 8) for i in range(4)]
yarn = []
for f in orig:
    turns = 4096 * f / (2 * math.pi)
    keep = min(1.0, max(0.0, (turns - 1.0) / 31.0))
    yarn.append(f * (keep + (1.0 - keep) / 4.0))
amp = 1.0 + 0.1 * math.log(4.0)
print("YaRN freq ratios:", [round(n / o, 3) for n, o in zip(yarn, orig)], f"| a={amp:.3f}, a^2={amp**2:.3f}")

# 2. Cached chunk RoPE consistency vs schedule mismatch
def rot(rows, pos, freqs):
    p = rows.reshape(rows.shape[0], -1, 2)
    ang = pos[:, None] * freqs[None, :]
    c, s = ang.cos(), ang.sin()
    return torch.stack((p[..., 0] * c - p[..., 1] * s, p[..., 0] * s + p[..., 1] * c), -1).flatten(1)

q = torch.tensor([[1., 0., 1., 0.], [0., 1., 1., 1.], [1., 1., 0., 1.]], dtype=torch.float64)
k = torch.tensor([[1., 1., 1., 0.], [1., 0., 0., 1.], [0., 1., 1., 1.]], dtype=torch.float64)
v = torch.eye(3, dtype=torch.float64)
pos = torch.arange(800, 803, dtype=torch.float64)
f_old, f_new = torch.tensor([1., 0.01], dtype=torch.float64), torch.tensor([1., 0.005], dtype=torch.float64)

sdpa = lambda qq, kk, vv, c=False, m=None: F.scaled_dot_product_attention(qq[None, None], kk[None, None], vv[None, None], is_causal=c, attn_mask=m)[0, 0]
rq, rk = rot(q, pos, f_old), rot(k, pos, f_old)
full = sdpa(rq, rk, v, c=True)
chunk_mask = pos[None, :] <= pos[1:, None]
chunk_ok = sdpa(rq[1:], rk, v, m=chunk_mask)
mixed_bad = sdpa(rot(q[-1:], pos[-1:], f_new), rk, v)
all_new = sdpa(rot(q, pos, f_new), rot(k, pos, f_new), v, c=True)
print("chunk matches full:", torch.allclose(chunk_ok, full[1:]), "| mixed schedule matches new pass:", torch.allclose(mixed_bad, all_new[-1:]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
YaRN freq ratios: [1.0, 1.0, 0.384, 0.25] | a=1.139, a^2=1.296
chunk matches full: True | mixed schedule matches new pass: False
```
<!-- leetllm: output:end -->

> **Key insight:** During cached decoding, logical position IDs and the rotary frequency schedule are part of the computation. Changing the schedule mid-conversation without caching unrotated keys or recomputing the prefix mixes incompatible rotary bases and silently corrupts attention scores.[^peng2023]

## Long-context budgets, Ring Attention, and depth retrieval

A longer positional formula only defines valid angles; serving long prompts reliably also requires fitting the shared window budget, managing quadratic prefill and KV memory, and verifying retrieval across every depth.

### Shared context budgets, sliding windows, and hybrid KV accounting

Every prompt shares one hard limit with its reply:

$$
\text{serialized\_input\_tokens} + \text{reserved\_output\_tokens} \le \text{context\_limit}
$$

When multi-turn history outgrows the input budget, reserve system instructions and output tokens first, then drop or compact **complete user/assistant or tool-call/result turns** from the oldest end while pinning exact file paths, constants, and identifiers outside any lossy summary.

Hardware costs then split across two phases. Full causal prefill compares $n(n+1)/2$ token pairs per layer ($O(n^2)$): growing a prompt $32\times$ from 4K to 128K tokens multiplies pairwise attention scores by $32^2 = 1{,}024\times$. **Sliding-window attention (SWA)** bounds each local layer to the last $w$ tokens, reducing cost to $O(n w)$.[^jiang2023] Because evicting the very first tokens of a stream can destabilize softmax mass, StreamingLLM preserves a few initial **attention-sink** KV slots alongside the rolling window.[^xiao2023streaming]

On hybrid checkpoints that mix short local layers with periodic global layers, never multiply one layer's shape uniformly across all layers; sum layer by layer instead:

$$
\text{logical KV bytes} = \sum_\ell n_\ell \big(H_{K,\ell} d_{K,\ell} b_{K,\ell} + H_{V,\ell} d_{V,\ell} b_{V,\ell}\big)
$$

At 128K tokens in BF16, a uniform 80-layer Llama 3 70B profile (8 GQA KV heads, $d_h = 128$) consumes **40 GiB** per sequence (`160 GiB` for four concurrent requests, exceeding the ~130 GiB weights). By contrast, a hybrid 48-layer profile with 40 local 1K layers (8 KV heads, $d_h = 256$) and 8 global 128K layers (1 KV head, $d_h = 512$) uses only `0.3125 + 2.0000 = 2.3125 GiB`, whereas assuming the local shape everywhere overestimates memory by more than $20\times$ (`48.0 GiB`).

### Ring Attention and decode context parallelism

When a single ultra-long prompt outgrows one GPU's HBM, **Ring Attention** shards sequence blocks across GPUs arranged in a ring: each rank pins its local query block, circulates KV blocks clockwise around the ring overlapped with local FlashAttention, and merges partial outputs via online softmax.[^liu2024ring] During decode, **Decode Context Parallelism (DCP)** distributes KV positions across ranks so each logical block covers $\text{DCP} \times \text{block\_size}$ tokens (e.g., 64 positions per logical block at `DCP = 4`, physical block size 16), letting a 1M-token sequence run without duplicating KV state per device. See [Model Parallelism for LLM Inference](/learn/model-parallelism-for-llm-inference) for the full mass-aware merge mechanics.

### Lost in the middle and per-slice NIAH/RULER verification

Accepting 128K tokens never proves the model can retrieve a fact buried at 50% depth. Liu et al. demonstrated a **U-shaped accuracy curve** ("Lost in the Middle"), where recall stays sharp near the start and end of a prompt while dipping sharply in the center, and distractor tokens progressively induce context rot.[^liu2023lost] Three habits guard retrieval quality:

1. **Edge-priority packing:** Place the two highest-relevance excerpts at the head (after instructions) and tail (right before the question), pushing lower-priority background into the middle.
2. **Match strategy to query structure:** Use full context for self-contained packets, RAG for targeted lookups over large corpora, and exact code/SQL filters for counting or aggregation questions (top-$k$ similarity retrieval clusters in high-scoring files and reverses true counts).
3. **Evaluate every `(length, depth)` slice:** Run **Needle-in-a-Haystack (NIAH)**[^kamradt2023niah] and **RULER** (multi-needle lookup, variable tracking, aggregation)[^hsieh2024] and gate on the worst slice, never a pooled average: a candidate scoring `(100%, 70%, 100%)` across `(head, middle, tail)` matches a `(90%, 90%, 90%)` baseline's `90%` mean while silently failing an `85%` middle-depth floor.

## Choose by mechanism, then earn the window

Pick the insertion point that matches your architecture (additive embeddings, RoPE on Q/K, or ALiBi on logits), inspect the checkpoint's exact config (base, rotary width, pairing layout, local/global layer mix), and verify both short-context stability and long-range passkey/multi-needle retrieval at your target window before shipping.

```mastery-quiz
[
  {
    "question": "An unmasked, position-free attention block with dropout disabled gives output rows A=[2,1], B=[4,3], C=[6,5] and D=[8,7]. Its input order changes from A/B/C/D to C/A/D/B, with each token vector unchanged. Which output row order should the recomputed block produce?",
    "options": [
      "[2,1], [4,3], [6,5], [8,7]",
      "[5,6], [1,2], [7,8], [3,4]",
      "[8,7], [6,5], [4,3], [2,1]",
      "[6,5], [2,1], [8,7], [4,3]"
    ],
    "answer": "[6,5], [2,1], [8,7], [4,3]",
    "explanation": "Permutation equivariance moves outputs with the same token rows, giving C/A/D/B. Keeping the old row order would assert invariance; swapping coordinates or reversing the order is a different transformation. The conditions remove both positional signals and a fixed causal mask."
  },
  {
    "question": "A sine-first absolute position pair uses 0.25 radians per slot at position 3. A separate design concatenates content and position vectors, each of width 96, and widens its square attention projections from 96 to the combined width. What values does the position pair store, and by what factor does the number of entries in each projection matrix grow?",
    "options": [
      "[0.682, 0.732] and 4× as many entries",
      "[0.732, 0.682] and 4× as many entries",
      "[0.682, 0.732] and 2× as many entries",
      "[0.732, 0.682] and 2× as many entries"
    ],
    "answer": "[0.682, 0.732] and 4× as many entries",
    "explanation": "At position 3 the angle is 3 × 0.25 = 0.75 radians. Storing sine first gives [0.682, 0.732]. Concatenation doubles both the row count and the column count, so each matrix has 192² / 96² = 4 times as many entries. The pair [0.732, 0.682] puts cosine first. Counting only the rows gives 2×. Choosing the reversed pair with 2× makes both mistakes."
  },
  {
    "question": "One RoPE pair has fixed unrotated q=[2,0], k=[1,0] and frequency 0.25. Compare positions (m=7,n=4) with (m=37,n=34). The standard attention setup leaves V unrotated. Which score pair follows?",
    "options": [
      "0.732 and 0.732",
      "1.463 and 0.986",
      "1.463 and 1.463",
      "2.000 and 2.000"
    ],
    "answer": "1.463 and 1.463",
    "explanation": "The norm product is 2 and both offsets are −3, so both dot products are 2 cos(−0.75)≈1.463. The smaller 0.732 result drops the query magnitude. A shared shift changes absolute angles while preserving their difference; it does not require a direct rotation of V."
  },
  {
    "question": "A six-coordinate head stores adjacent rotary pairs in its first four coordinates: [1,2,3,4,5,6]. The last two coordinates are outside the rotary region. Which coordinate order converts it to a matching split-half convention without changing the represented pairs?",
    "options": [
      "[1,4,2,5,3,6]",
      "[1,3,2,4,5,6]",
      "[1,2,3,4,6,5]",
      "[3,1,4,2,5,6]"
    ],
    "answer": "[1,3,2,4,5,6]",
    "explanation": "The first four coordinates are [x₀,y₀,x₁,y₁]. Split halves require [x₀,x₁,y₀,y₁], producing [1,3,2,4], while the untouched suffix stays [5,6]. Changing pair order or mixing in suffix coordinates fails to preserve the same pair-to-frequency assignment. A checkpoint conversion must apply the matching permutation to both affected Q/K projection outputs and their biases."
  },
  {
    "question": "One RoPE pair encodes height and another encodes width. On each axis, the unrotated query and key both equal [1, 0], and the rotation is 0.25 radians per position. The query patch is at (3, 2) and the key patch is at (1, 1), in (height, width) order. What is the dot product of the rotated vectors before and after both patches shift by (7, 9)?",
    "options": [
      "0.732 then 0.732",
      "1.969 then 1.969",
      "1.846 then −1.429",
      "1.846 then 1.846"
    ],
    "answer": "1.846 then 1.846",
    "explanation": "The key is two rows and one column behind the query. The two pairs contribute cos(−0.5) + cos(−0.25) ≈ 1.846 in total. Moving both patches preserves both offsets. Combining the angles inside one cosine gives 0.732. Dropping the height offset makes the height contribution 1 and the total 1.969. Moving only the query leaves the key nine rows and ten columns behind, giving −1.429."
  },
  {
    "question": "An ALiBi query at 12 compares a visible key at 5. Its already-scaled content logit is 5.0. Two head slopes are 1/4 and 1/32. Which pair of logits enters softmax?",
    "options": [
      "6.750 and 5.219",
      "3.250 and 4.781",
      "1.750 and 0.219",
      "3.250 and 3.250"
    ],
    "answer": "3.250 and 4.781",
    "explanation": "Distance is 7. Subtract 7/4=1.75 and 7/32=0.21875 from the already-scaled 5.0, giving 3.25 and 4.78125. The positive alternatives add the bias; the small pair reports penalties rather than logits; equal penalties ignore the different head slopes. These finite past-key penalties are distinct from the future mask."
  },
  {
    "question": "Apply the stated NTK-aware base transform to rotary width 6 and extension scale 9. For pair indices 0,1,2, which frequency ratios new/original follow?",
    "options": [
      "[1,1/3,1/9]",
      "[1/9,1/9,1/9]",
      "[1,1/9,1/81]",
      "[1,1/√3,1/3]"
    ],
    "answer": "[1,1/3,1/9]",
    "explanation": "The ratio is scale raised to −2i/(d−2). With d = 6 the exponents are 0, −1/2, −1, so scale 9 gives 1, 1/3, 1/9. Uniform 1/9 is Position Interpolation instead; the other schedules use an incorrect denominator or exponent."
  },
  {
    "question": "An attention head uses softmax at temperature 1. For each permitted key, the logit equals the rotated query–key dot product divided by the square root of the head width. The head now multiplies both rotated vectors by 1.2. By what factor does it scale the logits, and what temperature on the original logits gives the same weights for every input?",
    "options": [
      "1.20 and 0.833",
      "1.00 and 1.000",
      "1.44 and 0.694",
      "0.694 and 1.440"
    ],
    "answer": "1.44 and 0.694",
    "explanation": "Each term in the dot product picks up one factor of 1.2 from the query and one from the key. The head width stays fixed, so the logit multiplier is 1.2² = 1.44. Dividing the original logits by a temperature of 1 / 1.44 ≈ 0.694 gives the same weights. A multiplier of 1.20 counts one vector, and 1.00 treats the amplitude change as a pure rotation. Using 0.694 as the multiplier swaps the multiplier and the temperature."
  },
  {
    "question": "A cached chunk has query logical positions 51 and 54. Its cached keys are physically stored in the order [54,49,52], and their rotary coordinates are correct. If true means allowed, which permission rows preserve causal visibility in that physical storage order?",
    "options": [
      "Query 51: [true,true,false]; query 54: [true,true,true].",
      "Query 51: [false,true,false]; query 54: [true,true,true].",
      "Query 51: [false,true,true]; query 54: [false,true,true].",
      "Query 51: [true,false,true]; query 54: [true,true,true]."
    ],
    "answer": "Query 51: [false,true,false]; query 54: [true,true,true].",
    "explanation": "A query permits each key whose logical position is no greater than its own. In storage order [54,49,52], query 51 permits only key 49, while query 54 permits all three. Storage-column order does not define causal age. Correct RoPE cannot repair an incorrect permitted-key set."
  },
  {
    "question": "A deployment specification requires at most 8192 total prompt-plus-generation tokens, short-task accuracy at least 0.85, long-task accuracy at least 0.80, and cache computation matching the evaluated frequency schedule. Candidate A uses 6200 prompt+1800 generation tokens, scores 0.88/0.83 and recomputes the entire prefix under the evaluated schedule. Candidate B uses 6000+1500 tokens and scores 0.90/0.86, but changes only new-query frequencies while retaining old-schedule cached keys. Which decision follows?",
    "options": [
      "A needs a shorter prompt; B satisfies the listed requirements.",
      "A satisfies the listed requirements; B satisfies the listed requirements.",
      "A needs a shorter prompt; B needs consistent-cache recomputation.",
      "A satisfies the listed requirements; B needs consistent-cache recomputation."
    ],
    "answer": "A satisfies the listed requirements; B needs consistent-cache recomputation.",
    "explanation": "A totals 8000 tokens, within 8192, and meets both quality floors with a matching prefix. B meets its token and quality numbers but mixes incompatible rotary schedules in the KV cache."
  }
]
```

> **Next:** Continue to [Layer Normalization: Pre-LN vs Post-LN](/learn/layer-normalization-pre-ln-post-ln).
