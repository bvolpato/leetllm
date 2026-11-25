---
{
  "id": "scaled-dot-product-attention",
  "title": "Scaled Dot-Product Attention",
  "slug": "scaled-dot-product-attention",
  "category": "Transformer Architecture",
  "difficulty": "Hard",
  "coverImage": "social_banner.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Microsoft",
    "NVIDIA"
  ],
  "shortDescription": "Each token mixes content from positions it may read. The score scale, the mask, and the memory traffic decide whether that mix stays usable.",
  "prerequisites": [
    "embeddings-cosine-dot-product-quantization"
  ],
  "keyConceptsTested": [
    "Scaled dot-product attention formula derivation",
    "Q/K/V projections and their roles (routing vs content)",
    "Variance proof for √d_k scaling factor",
    "Three attention types: bidirectional, causal, cross",
    "Multi-head attention: parallel subspaces, same asymptotic attention FLOPs",
    "Multi-head routing capacity without assumed head interpretations",
    "Single-head vs full multi-head attention complexity",
    "Training vs inference bottlenecks: score matrix vs KV cache bandwidth",
    "MQA/GQA: shrinking KV-cache traffic and measuring decode trade-offs",
    "FlashAttention: IO-aware tiling with O(n) auxiliary attention state",
    "Softmax numerical stability (max-shift technique)",
    "Gradients through attention scores and values"
  ],
  "section": "Transformer & Multimodal Architectures",
  "order": 1
}
---

Read the sentence *"Birds in the garden sing softly at dawn."* When a model reaches *"sing,"* it needs to know *who* is singing and *how* the sentence fits together. Because the right source word shifts with every sentence, a fixed lookup table cannot solve this routing problem.

<span data-glossary="self-attention">Self-attention</span> solves it with a soft, differentiable lookup.[^vaswani2017] Each <span data-glossary="token">token</span> projects its hidden state into three vectors: a **query** asking what context it needs, a **key** advertising what it holds, and a **value** carrying the payload to share. Dot products score every query against every key, <span data-glossary="softmax">softmax</span> turns each score row into probability weights, and multiplying by the values blends the chosen context into a fresh representation. Zooming into *"Birds sing"* under a <span data-glossary="causal-mask">causal mask</span>, *"Birds"* reads only itself while *"sing"* blends 42% of *"Birds"* with 58% of itself into `[1.42, 1.58]`.

<figure>
  <img src="illustrations/_generated/attention_flow_dark.png" alt="Two-token causal attention for Birds and sing: the Birds query reads only the Birds value; the sing query assigns about 42 percent to Birds and 58 percent to sing, producing context [1.42, 1.58]." />
  <figcaption>One causal attention pass on "Birds sing." The mask restricts Birds to its own value, while sing blends 42% of Birds with 58% of itself to produce [1.42, 1.58].</figcaption>
</figure>

---

## Three views of one token

Raw <span data-glossary="dot-product">dot products</span> $X X^T$ force every token to ask for context and advertise context in the same subspace. Three learned linear projections $W_Q, W_K \in \mathbb{R}^{d_{\text{model}} \times d_k}$ and $W_V \in \mathbb{R}^{d_{\text{model}} \times d_v}$ split routing from content cleanly:[^vaswani2017]

$$
Q = XW_Q, \quad K = XW_K, \quad V = XW_V
$$

- **Query ($Q$):** what context this position needs (scores candidate sources).
- **Key ($K$):** when another position should read this token (matched against incoming queries).
- **Value ($V$):** what payload this token contributes once selected.

Even when raw scores $QK^T$ are symmetric, attention weights are asymmetric because each query row normalizes by its own softmax denominator and causal masking removes future edges.

<figure>
  <img src="illustrations/_generated/qkv_projections_dark.png" alt="The hidden state x for token Birds projects through W_Q, W_K, and W_V into query [1.0, 0.5], key [0.8, 0.2], and value [2.0, 1.0]. Query and key meet to compute routing score 0.90, while value carries the content that attention weights mix." />
  <figcaption>One hidden state splits into three views. Query [1.0, 0.5] and key [0.8, 0.2] compute routing score 0.90, while value [2.0, 1.0] waits to be mixed by the normalized weights.</figcaption>
</figure>

> **Key insight:** Queries and keys decide *where* information flows; values decide *what* information flows.

---

## The core formula

Scaled dot-product attention packs scoring, scaling, masking, normalization, and value mixing into one <span data-glossary="matrix">matrix</span> expression:[^vaswani2017]

$$
\text{Attention}(Q, K, V; M) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}} + M\right)V
$$

The additive mask $M$ puts $0$ on allowed keys and $-\infty$ on blocked keys so $e^{-\infty} = 0$ removes blocked positions before normalization while the remaining weights still sum to 1.

| Step | Operation | Shape | Role |
|------|-----------|-------|------|
| Score & scale | $L = QK^T / \sqrt{d_k}$ | $(B, h, N_q, N_k)$ | Pairwise compatibility with steady variance |
| Mask | $Z = L + M$ | $(B, h, N_q, N_k)$ | Blocks disallowed keys with $-\infty$ |
| Normalize | $\alpha = \text{softmax}(Z, \text{dim}=-1)$ | $(B, h, N_q, N_k)$ | Row-wise probability weights over keys |
| Mix | $O = \alpha V$ | $(B, h, N_q, d_v)$ | Weighted average of visible value vectors |

Notice that $d_k$ contracts away during $QK^T$, while $d_v$ determines the output width directly. They are usually equal, though the math never requires it.

### A trace with real numbers

Take two tokens with 2-dimensional projections ($d_k = d_v = 2$): *"Birds"* has $q=[1.0, 0.5]$, $k=[0.8, 0.2]$, $v=[2.0, 1.0]$, and *"sing"* has $q=[0.5, 1.0]$, $k=[0.3, 0.9]$, $v=[1.0, 2.0]$. Multiplying $Q K^T$, dividing by $\sqrt{2} \approx 1.414$, and running row-wise softmax gives:

$$
\begin{aligned}
S = QK^T &= \begin{bmatrix} 0.90 & 0.75 \\ 0.60 & 1.05 \end{bmatrix}, \qquad
L = \frac{S}{\sqrt{2}} \approx \begin{bmatrix} 0.64 & 0.53 \\ 0.42 & 0.74 \end{bmatrix}, \qquad
\alpha = \text{softmax}(L) \approx \begin{bmatrix} 0.53 & 0.47 \\ 0.42 & 0.58 \end{bmatrix}
\end{aligned}
$$

Multiplying $\alpha V$ blends *"Birds"* into $0.53[2,1] + 0.47[1,2] = [1.53, 1.47]$ and *"sing"* into $0.42[2,1] + 0.58[1,2] = [1.42, 1.58]$. Because each valid row of $\alpha$ is a probability distribution, every output stays inside the convex hull of visible values. Verify both unmasked and lower-triangular causal attention in NumPy:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="scaled-dot-product-attention.py"
import numpy as np

Q = np.array([[1.0, 0.5], [0.5, 1.0]])
K = np.array([[0.8, 0.2], [0.3, 0.9]])
V = np.array([[2.0, 1.0], [1.0, 2.0]])

def attention(Q, K, V, mask=None):
    scores = (Q @ K.T) / np.sqrt(Q.shape[-1])
    if mask is not None:
        scores = np.where(mask, scores, -np.inf)
    shifted = scores - scores.max(axis=-1, keepdims=True)
    weights = np.exp(shifted)
    weights /= weights.sum(axis=-1, keepdims=True)
    return weights @ V, weights

out_bi, w_bi = attention(Q, K, V)
causal = np.tril(np.ones((2, 2), dtype=bool))
out_causal, w_causal = attention(Q, K, V, mask=causal)

print("Unmasked weights:\n", np.round(w_bi, 3))
print("Unmasked output:\n", np.round(out_bi, 3))
print("Causal weights:\n", np.round(w_causal, 3))
print("Causal output:\n", np.round(out_causal, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Unmasked weights:
 [[0.526 0.474]
 [0.421 0.579]]
Unmasked output:
 [[1.526 1.474]
 [1.421 1.579]]
Causal weights:
 [[1.    0.   ]
 [0.421 0.579]]
Causal output:
 [[2.    1.   ]
 [1.421 1.579]]
```
<!-- leetllm: output:end -->

With the causal mask, *"Birds"* puts weight `1.0` on itself and returns `[2.0, 1.0]`, while *"sing"* sees both tokens and keeps `[1.421, 1.579]`.

<figure>
  <img src="illustrations/_generated/attention_heatmap_dark.png" alt="Scaled QK compatibility heatmap [[0.636, 0.530], [0.424, 0.742]] paired with row-softmax attention weights [[0.527, 0.473], [0.421, 0.579]], showing how the sing query mixes values into [1.421, 1.579]." />
  <figcaption>Read attention row by row from scaled scores to normalized weights to mixed values. Every query row sums to 1, while columns do not need to because many queries can read the same key.</figcaption>
</figure>

> **Common mistake:** Forgetting `K.transpose(-2, -1)` runs silently whenever $N_k = d_k$ by coincidence (always test with $N_k \neq d_k$), and applying softmax along the query axis instead of `dim=-1` normalizes columns rather than query rows.

---

## Why scale by $\sqrt{d_k}$? The variance proof

With $d_k = 2$, dividing by $\sqrt{2}$ barely shifts the scores. At $d_k = 64$ or $128$, omitting that factor silently stalls learning.

Model the coordinates of $q$ and $k$ at initialization as mutually independent with mean $0$ and variance $1$.[^vaswani2017] Each coordinate product $q_i k_i$ has mean $0$ and variance $\mathbb{E}[q_i^2]\mathbb{E}[k_i^2] = 1$. Summing $d_k$ independent terms yields $\text{Var}(q \cdot k) = d_k$ and standard deviation $\sqrt{d_k}$. Dividing by $\sqrt{d_k}$ restores unit variance:

$$
\text{Var}\!\left(\frac{q \cdot k}{\sqrt{d_k}}\right) = \frac{1}{d_k}\text{Var}(q \cdot k) = 1
$$

### Why wide logits kill gradients

Softmax exponentiates logit **gaps**. When one score beats its neighbors by 20, $e^{20} \approx 4.85 \times 10^8$, snapping the winning weight to $a_{\max} \approx 1$ and crushing every other weight to $0$. From the softmax Jacobian $\partial a_i / \partial z_j = a_i (\delta_{ij} - a_j)$, when $a_{\max} \to 1$, both $a_{\max}(1 - a_{\max})$ and every off-diagonal term $a_i a_j$ collapse toward zero, starving $Q$ and $K$ of routing gradients. Adding a uniform constant (`+1000`) changes nothing because softmax is shift-invariant; it is logit *spread* that saturates it.

<figure>
  <img src="illustrations/_generated/variance_scaling_dark.png" alt="Under mutually independent, mean-zero, unit-variance query and key components, raw score standard deviation grows with the square root of head width. Scaling brings its population variance to one." />
  <figcaption>Raw dot-product standard deviation climbs as $\sqrt{d_k}$ across head widths, while dividing by $\sqrt{d_k}$ holds score spread steady at 1.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="variance-scaling-simulation.py"
import numpy as np

rng = np.random.default_rng(7)
for d_k in (16, 64, 512):
    q = rng.standard_normal((5000, d_k))
    k = rng.standard_normal((5000, d_k))
    raw = np.sum(q * k, axis=1)
    scaled = raw / np.sqrt(d_k)
    print(f"d_k={d_k:3d}: raw std={raw.std():5.2f}, scaled std={scaled.std():4.2f}")

def softmax(z):
    e = np.exp(z - np.max(z))
    return e / e.sum()

for name, logits in [("uniform", [0., 0., 0.]), ("shifted", [1000., 1000., 1000.]), ("gapped", [20., 0., 0.])]:
    a = softmax(np.array(logits))
    print(f"{name:8s}: p0={a[0]:.4f}, self-grad p0(1-p0)={a[0]*(1-a[0]):.2e}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
d_k= 16: raw std= 3.99, scaled std=1.00
d_k= 64: raw std= 8.08, scaled std=1.01
d_k=512: raw std=22.74, scaled std=1.00
uniform : p0=0.3333, self-grad p0(1-p0)=2.22e-01
shifted : p0=0.3333, self-grad p0(1-p0)=2.22e-01
gapped  : p0=1.0000, self-grad p0(1-p0)=4.12e-09
```
<!-- leetllm: output:end -->

A 20-point gap shrinks the self-derivative from `0.222` to `4.12e-09`. Dividing by $\sqrt{d_k}$ keeps initialization-time logits in softmax's responsive zone rather than over-shrinking them by $d_k$.

---

## Three types of attention

The attention operator stays identical across Transformer families; only the mask $M$ and where $Q, K, V$ originate change.[^vaswani2017]

| Attention Type | $Q$ Source | $K, V$ Source | Mask | Typical Models |
|---|---|---|---|---|
| **Bidirectional Self** | Same sequence | Same sequence | Padding only | BERT, ViT |
| **Causal Self** | Same sequence | Same sequence | Lower-triangular ($k \le q$) + padding | GPT, Llama |
| **<span data-glossary="cross-attention">Cross-Attention</span>** | Target sequence ($N_q$) | Source sequence ($N_k$) | Source padding | T5, original Transformer |

Bidirectional encoders let every real token read every other token; causal decoders block future keys ($k > q$) so training runs in parallel without leaking upcoming tokens; cross-attention forms a rectangular $N_q \times N_k$ routing grid from reader queries to source keys/values.

<figure>
  <img src="illustrations/_generated/attention_types_dark.png" alt="Three attention weight matrices: bidirectional self-attention allocates weight across all four columns, causal self-attention masks future columns above the diagonal with minus infinity, and cross-attention forms a rectangular 2 by 4 routing grid from decoder queries to encoder keys." />
  <figcaption>One operator powers all three patterns: dense bidirectional rows, lower-triangular causal rows, and rectangular $N_q \times N_k$ cross-attention between two sequences.</figcaption>
</figure>

### Cached queries and PyTorch mask conventions

During <span data-glossary="kv-cache">KV-cache</span> decoding, a new token at absolute position 4 attends to all five cached keys `[0..4]`, even though its local query row index is `0`. Passing `is_causal=True` to <span data-glossary="pytorch">PyTorch</span>'s `F.scaled_dot_product_attention` aligns the triangle to the **upper-left**, blinding the query to keys `1..4`.[^pytorchSdpaDocs2026] Build explicit masks from **absolute positions** (`key_pos <= query_pos`) intersected with valid non-padding keys, and keep PyTorch's inverted boolean conventions straight: in `F.scaled_dot_product_attention`, `True` means **allowed**, whereas in `nn.MultiheadAttention`'s `key_padding_mask`, `True` means **ignored**.[^pytorchSdpaDocs2026][^pytorchMhaMasks2026]

<!-- leetllm: test, deps=torch, output=show -->
```python title="cached-causal-and-padding.py"
import torch
import torch.nn.functional as F

# Query at absolute position 2 reading 3 cached keys, where position 1 is padding.
q = torch.tensor([[[[1.0, 0.0]]]])
k = torch.tensor([[[[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]]])
v = torch.tensor([[[[1.0, 0.0], [0.0, 1.0], [2.0, 2.0]]]])
allowed = torch.tensor([[True, False, True]])  # True = participating key in SDPA

cached = F.scaled_dot_product_attention(q, k, v, attn_mask=allowed)
wrong_upper_left = F.scaled_dot_product_attention(q, k, v, is_causal=True)

print("explicit cached mask (reads keys 0 & 2):", cached.flatten().tolist())
print("wrong is_causal=True (reads key 0 only):", wrong_upper_left.flatten().tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
explicit cached mask (reads keys 0 & 2): [1.5, 1.0]
wrong is_causal=True (reads key 0 only): [1.0, 0.0]
```
<!-- leetllm: output:end -->

<details>
<summary>Deep dive: left-padded batches and all-masked query rows</summary>

In left-padded batches (`[PAD, birds, sing]`), padded query row `0` has no allowed key. Passing all `-inf` to softmax yields `NaN`, while filling blocked logits with a finite constant like `-1e4` makes every key tie and returns a bogus uniform row `[1/3, 1/3, 1/3]`. Substitute zero logits on inactive rows before softmax and zero them back out afterward so both forward outputs and backward gradients stay exact zeros:

<!-- leetllm: test, deps=torch, output=show -->
```python title="batched-causal-padding-reference.py"
import math
import torch

q = torch.tensor([[[[1., 0.], [1., 0.], [1., 0.]]]], requires_grad=True)
k = torch.tensor([[[[9., 9.], [1., 0.], [1., 1.]]]], requires_grad=True)
v = torch.tensor([[[[999., 999.], [2., 1.], [1., 2.]]]], requires_grad=True)
valid = torch.tensor([[False, True, True]])  # [PAD, birds, sing]

pos = torch.arange(3)
causal = pos[None, :] <= pos[:, None]
active = valid[:, None, :, None]
allowed = causal[None, None] & valid[:, None, None, :] & active

logits = (q @ k.transpose(-2, -1)) / math.sqrt(q.shape[-1])
safe_logits = torch.where(active, logits.masked_fill(~allowed, -torch.inf), 0.0)
weights = torch.softmax(safe_logits, dim=-1).masked_fill(~active, 0.0)
context = weights @ v
context[..., 0].sum().backward()

print("row sums:", weights.sum(dim=-1).flatten().tolist())
print("context:", context.detach()[0, 0].tolist())
print("pad token grad norm:", q.grad[0, 0, 0].norm().item())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
row sums: [0.0, 1.0, 1.0]
context: [[0.0, 0.0], [2.0, 1.0], [1.5, 1.5]]
pad token grad norm: 0.0
```
<!-- leetllm: output:end -->

</details>

---

## Multi-head attention

One head averages every relationship into a single weight row. **Multi-Head Attention (MHA)** runs $h$ parallel heads of width $d_k = d_v = d_{\text{model}} / h$, concatenates their outputs, and mixes them with $W^O$:[^vaswani2017]

$$
\text{head}_i = \text{Attention}(XW_i^Q, XW_i^K, XW_i^V), \qquad
\text{MultiHead}(X) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h) W^O
$$

Each head learns an independent routing pattern (for example, local syntax or copy-like induction circuits),[^voita2019][^olsson2022] though ablation studies show trained heads vary widely in importance.[^michel2019]

<figure>
  <img src="illustrations/_generated/multi_head_layout_dark.png" alt="A width-8 residual stream is projected into Q, K, and V, split into four width-2 heads attending in parallel subspaces, concatenated into width 8, and mixed by the output projection W_O." />
  <figcaption>A width-8 stream projects into Q, K, and V, splits into four width-2 parallel heads, concatenates back to width 8, and mixes through $W^O$.</figcaption>
</figure>

> **Key insight:** Splitting $d_{\text{model}}$ into $h$ heads of width $d_{\text{model}} / h$ leaves core attention FLOPs unchanged ($h \cdot 2n^2(d_{\text{model}}/h) = 2n^2 d_{\text{model}}$), while multiplying materialized score memory by $h$.

### Gradient flow through attention

Writing one query output as $o = \sum_j a_j v_j$ and plugging in the softmax Jacobian gives:[^dao2022]

$$
\frac{\partial o}{\partial z_j} = a_j (v_j - o)
$$

Raising key $j$'s score pulls $o$ toward $v_j$ and away from the current blend $o$. If all visible keys carry identical values ($v_j = o$) or only one key is unmasked ($a_j = 1$), routing gradients vanish ($\partial o / \partial z_j = 0$) while the value path still receives nonzero gradient $\partial \ell / \partial V = A^T G$. With upstream scalar score $t_j = g^T v_j$, backward attention avoids building an $N_k \times N_k$ Jacobian via one row-wise dot product:[^dao2022]

$$
\frac{\partial \ell}{\partial z_j} = a_j \left(t_j - \sum_i a_i t_i\right), \qquad
\frac{\partial \ell}{\partial q} = \frac{1}{\sqrt{d_k}}\sum_j \frac{\partial \ell}{\partial z_j} k_j, \qquad
\frac{\partial \ell}{\partial V} = A^T G
$$

<!-- leetllm: test, deps=torch, output=show -->
```python title="mha-reshape-and-backward.py"
import torch

# 1. Verify (B, N, D) -> (B, h, N, d_k) -> (B, N, D) round-trip
B, N, D, h = 2, 3, 8, 4
x = torch.arange(B * N * D, dtype=torch.float64).reshape(B, N, D)
heads = x.view(B, N, h, D // h).transpose(1, 2)
restored = heads.transpose(1, 2).contiguous().view(B, N, D)
assert torch.equal(x, restored)
print("head tensor shape:", tuple(heads.shape))

# 2. Verify Jacobian-free softmax backward with a masked third key
z = torch.tensor([[0.0, 0.0, 5.0]], dtype=torch.float64, requires_grad=True)
allowed = torch.tensor([[True, True, False]])
a = torch.softmax(z.masked_fill(~allowed, -torch.inf), dim=-1)
upstream = torch.tensor([[2.0, 1.0, 99.0]], dtype=torch.float64)

manual_dz = a * (upstream - (a * upstream).sum(dim=-1, keepdim=True))
(a * upstream).sum().backward()
assert torch.allclose(manual_dz, z.grad)
print("weights:", a.detach().flatten().tolist())
print("logit gradients (masked key gets 0):", z.grad.flatten().tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
head tensor shape: (2, 4, 3, 2)
weights: [0.5, 0.5, 0.0]
logit gradients (masked key gets 0): [0.25, -0.25, 0.0]
```
<!-- leetllm: output:end -->

Each logit gradient row sums to zero (reflecting shift invariance), and the masked key receives exact `0.0` gradient regardless of its upstream signal.

---

## Complexity analysis

Attention hits two completely different walls depending on whether you are training/prefilling or decoding.

| Cost | Complexity | Driver |
|------|------------|--------|
| **Attention core** | $O(n^2 d_{\text{model}})$ | $QK^T$ and $\alpha V$ across all token pairs |
| **Q/K/V and $W^O$ projections** | $O(n d_{\text{model}}^2)$ | Four dense linear layers per block |
| **Naive score memory** | $O(h n^2)$ | Materializing one $n \times n$ matrix per head |
| **KV-cache memory (decode)** | $O(L \cdot h_{\text{KV}} \cdot d_k \cdot n)$ | Storing past keys and values across $L$ layers |

For batch 8, 32 heads, and $n = 8{,}192$ in <span data-glossary="fp16">FP16</span> (2 bytes), a single layer's naive score matrix takes $8 \times 32 \times 8{,}192^2 \times 2 = 34.4\text{ GB}$ ($32\text{ GiB}$) before weights or <span data-glossary="optimizer-state">optimizer state</span>.

<figure>
  <img src="illustrations/_generated/attention_complexity_dark.png" alt="Standard attention writes an N-by-N score matrix to HBM, growing quadratically from 2 MB at sequence length 1024 to 512 MB at length 16384 per head in FP16, while tiled FlashAttention keeps one active block in on-chip SRAM with O(N) HBM traffic." />
  <figcaption>Naive attention writes an $N \times N$ FP16 score matrix per head to HBM (2 MB at $N=1{,}024$ up to 512 MB at $N=16{,}384$). Tiled FlashAttention keeps only one active block in on-chip SRAM so temporary HBM memory stays $O(N)$.</figcaption>
</figure>

### Training vs. decoding: two different hardware walls

- **Training and prompt prefill** hit the $O(n^2)$ temporary score-matrix memory wall in GPU HBM.
- **Autoregressive decoding** ($N_q = 1$) produces a tiny $1 \times N_k$ score vector, flipping the bottleneck to **persistent KV-cache bandwidth**: reading every cached key and value from HBM on every generated token.[^shazeer2019]

The persistent KV footprint across $L$ layers, batch $B$, length $N$, $h_{\text{KV}}$ KV heads, width $d_k$, and $P_{\text{bytes}}$ bytes/element is:

$$
\text{Memory}_{\text{KV}} = 2 \cdot L \cdot h_{\text{KV}} \cdot d_k \cdot N \cdot B \cdot P_{\text{bytes}}
$$

Sharing KV heads across query heads shrinks that read and boosts decode arithmetic intensity by $h_Q / h_{\text{KV}}$: **MHA** uses $h_{\text{KV}} = h_Q$; **Multi-Query Attention (MQA)** shares one KV head ($h_{\text{KV}} = 1$);[^shazeer2019] and **Grouped-Query Attention (GQA)** shares $G$ KV heads across query groups (Llama 3.1 70B uses $L=80, h_Q=64, h_{\text{KV}}=8, d_k=128$, cutting a 320 GiB batch-16 cache 8x to 40 GiB).[^ainslie2023][^dubey2024]

<!-- leetllm: test, output=show -->
```python title="kv-head-bandwidth.py"
layers, tokens, d_head, bytes_fp16, q_heads = 32, 8192, 128, 2, 32

for label, kv_heads in [("MHA", 32), ("GQA-8", 8), ("MQA", 1)]:
    cache_gib = (2 * layers * kv_heads * d_head * tokens * bytes_fp16) / 1024**3
    core_flops = 4 * tokens * q_heads * d_head
    kv_bytes = 2 * tokens * kv_heads * d_head * bytes_fp16
    print(f"{label:5s}: cache={cache_gib:.3f} GiB, decode intensity={core_flops / kv_bytes:2.0f} FLOPs/byte")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MHA  : cache=4.000 GiB, decode intensity= 1 FLOPs/byte
GQA-8: cache=1.000 GiB, decode intensity= 4 FLOPs/byte
MQA  : cache=0.125 GiB, decode intensity=32 FLOPs/byte
```
<!-- leetllm: output:end -->

**FlashAttention** and **MQA/GQA** solve opposite bottlenecks: FlashAttention eliminates temporary $O(n^2)$ score traffic during training/prefill, while MQA/GQA shrink persistent KV-cache bandwidth during decode.

---

## Softmax numerical stability

Raw $e^x$ overflows float32 near $x > 88$ and float16 near $x > 11$. Subtracting the row maximum $m = \max_j x_j$ cancels algebraically while capping every exponent at $e^0 = 1$:[^milakov2018]

$$
\text{softmax}(x_i) = \frac{e^{x_i - m}}{\sum_j e^{x_j - m}}
$$

On `[1000, 1001, 999]`, subtracting `1001` passes `[-1, 0, -2]` to `exp`, giving `[0.2447, 0.6652, 0.0900]`.

<details>
<summary>Deep dive: FP16 score overflow before softmax</summary>

Max-shifting cannot fix scores that already overflowed to `inf` inside FP16 `Q @ K.T` (e.g., `300 * 300 = 90,000 > 65,504`). Accumulate scores in FP32 before softmax, and always pass `dropout_p=0.0` at evaluation so attention dropout does not perturb outputs:

<!-- leetllm: test, deps=torch, output=show -->
```python title="score-overflow-precedes-softmax.py"
import torch

q = torch.tensor([[300.]], dtype=torch.float16)
k = torch.tensor([[300.], [0.]], dtype=torch.float16)

late_cast = torch.softmax((q @ k.T).float(), dim=-1)
wide_first = torch.softmax(q.float() @ k.float().T, dim=-1)

print("late FP32 cast:", late_cast.flatten().tolist())
print("FP32 matmul first:", wide_first.flatten().tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
late FP32 cast: [nan, nan]
FP32 matmul first: [1.0, 0.0]
```
<!-- leetllm: output:end -->

</details>

---

## FlashAttention: tiled exact attention

Naive GPU attention writes $S$, reads $S$, writes $P$, and reads $P$ across HBM. [FlashAttention](/learn/flashattention-memory-efficient-attention) computes **exact** dense attention with zero HBM score writes by streaming $Q$, $K$, and $V$ tiles through on-chip SRAM using **<span data-glossary="online-softmax">online softmax</span>**:[^dao2022][^milakov2018]

$$
\begin{aligned}
m_{\text{new}} &= \max(m_{\text{old}}, \tilde{m}), \qquad \alpha = \exp(m_{\text{old}} - m_{\text{new}}) \\
\ell_{\text{new}} &= \alpha \cdot \ell_{\text{old}} + \sum_k \exp(\tilde{S}_{ij, k} - m_{\text{new}}), \qquad
u_{\text{new}} = \alpha \cdot u_{\text{old}} + \sum_k \exp(\tilde{S}_{ij, k} - m_{\text{new}}) V_{j, k}
\end{aligned}
$$

After streaming every key/value tile, one division $O_i = u_{\text{final}} / \ell_{\text{final}}$ recovers the exact attention row. Backward saves only $O(n)$ row log-sum-exp statistics and recomputes score tiles on chip. Verify that tiled online attention matches full-row attention to 12 decimal places, even across `[1000, 1001, 999]` or a fully masked leading tile:

<!-- leetllm: test, output=show -->
```python title="online-tiled-attention.py"
import math

def online_attention(tiles):
    m, denom, num = -math.inf, 0.0, 0.0
    for logits, values in tiles:
        if not logits or max(logits) == -math.inf:
            continue  # Skip empty or fully masked tiles cleanly
        m_new = max(m, max(logits))
        scale = math.exp(m - m_new)
        w = [math.exp(x - m_new) for x in logits]
        denom = scale * denom + sum(w)
        num = scale * num + sum(wi * vi for wi, vi in zip(w, values))
        m = m_new
    return num / denom

scores, values = [1000.0, 1001.0, 999.0], [2.0, 1.0, 4.0]
exps = [math.exp(s - max(scores)) for s in scores]
full = sum(w * v for w, v in zip(exps, values)) / sum(exps)

tiled = online_attention([(scores[:1], values[:1]), (scores[1:], values[1:])])
with_masked = online_attention([([-math.inf], [20.0]), (scores, values)])
assert abs(tiled - full) < 1e-12 and abs(with_masked - full) < 1e-12
print(f"full-row: {full:.6f}, two-tile: {tiled:.6f}, with masked tile: {with_masked:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full-row: 1.514820, two-tile: 1.514820, with masked tile: 1.514820
```
<!-- leetllm: output:end -->

In PyTorch, `F.scaled_dot_product_attention` dispatches fused FlashAttention kernels automatically without custom <span data-glossary="cuda">CUDA</span> code.[^pytorchSdpaDocs2026]

---

## Mistakes that break attention

- **Untransposed keys or wrong softmax axis:** Test with $N_k \neq d_k$ and always apply softmax over keys (`dim=-1`).
- **Missing $1/\sqrt{d_k}$ scaling:** Saturates softmax at large $d_k$ and kills routing gradients.
- **Upper-left `is_causal=True` during cached decode:** Build explicit masks from absolute positions `k_pos <= q_pos`.
- **All-masked query rows:** Suppress padded queries explicitly before and after softmax to avoid `NaN` (with `-inf`) or bogus uniform weights (with `-1e4`).
- **Wrong bottleneck:** Use FlashAttention for $O(n^2)$ score-matrix I/O and MQA/GQA for persistent KV-cache reads.

<details>
<summary>Going deeper: additive attention vs. dot-product, and attending to nothing</summary>

- **Dot-product vs. additive attention:** Bahdanau et al. (2015)[^bahdanau2015] scored compatibility via $u^T \tanh(W_q q + W_k k)$; dot products match its quality while mapping directly to GPU matrix multiplications.[^vaswani2017]
- **Attending to nothing:** Valid softmax rows always sum to 1, so layers either cancel value vectors to zero or park unused weight on a low-norm sink token.

</details>

## Practice drill

In the two-token NumPy script above, set both rows of `V` to `[3.0, -1.0]` while keeping `Q` and `K` distinct: every blend returns `[3.0, -1.0]`, so $\partial \ell / \partial Q = 0$ even while $\partial \ell / \partial V \neq 0$. Restore distinct values and mask out key 1 so only key 0 remains visible: again $\partial \ell / \partial Q = 0$, confirming that routing gradients flow only when a query sees multiple keys carrying distinct values.

```mastery-quiz
[
  {
    "question": "An image encoder produces seven patch vectors. Four summary tokens each read all seven patches through one cross-attention head. Which inputs supply Q, K, and V, and what shape does the weight matrix have?",
    "options": [
      "Q from the summary tokens, K and V from the patches, weights 7 × 4.",
      "Q from the summary tokens, K and V from the patches, weights 4 × 7.",
      "Q from the patches, K and V from the summary tokens, weights 7 × 4.",
      "Q from the patches, K and V from the summary tokens, weights 4 × 7."
    ],
    "answer": "Q from the summary tokens, K and V from the patches, weights 4 × 7.",
    "explanation": "Each summary token supplies a query. It compares that query with a key from each patch and uses the resulting weights to mix the patch values. Four readers therefore produce four rows of seven weights. A 7 × 4 matrix swaps the reader and source axes. Taking Q from the patches would make the patches read the summary tokens, reversing the direction of the update."
  },
  {
    "question": "In scaled dot-product attention, Q has shape (B, h, 5, 64), K has shape (B, h, 20, 64), and V has shape (B, h, 20, 128). What are the shapes of the attention weights and the output?",
    "options": [
      "Weights (B, h, 5, 20) and output (B, h, 5, 128).",
      "Weights (B, h, 20, 5) and output (B, h, 20, 64).",
      "Weights (B, h, 5, 20) and output (B, h, 5, 64).",
      "Weights (B, h, 20, 5) and output (B, h, 20, 128)."
    ],
    "answer": "Weights (B, h, 5, 20) and output (B, h, 5, 128).",
    "explanation": "K must be transposed, so Q @ K^T multiplies (5 x 64) by (64 x 20). That gives one score for each query-key pair, which is 5 x 20. Softmax over the keys keeps that shape. Multiplying by V, (5 x 20) times (20 x 128), gives 5 x 128. The output has one row per query and the width of V. A width of 64 is wrong because d_k is used only for scoring. A 20 x 5 weight matrix has rows for keys, and it cannot multiply a V that has 20 rows."
  },
  {
    "question": "A query attends to two keys. Each vector has 81 coordinates, and all coordinates are mutually independent with mean 0 and variance 1. What is the population standard deviation of a raw dot product? For two unequal scores, how does skipping the usual scaling affect the larger softmax weight and its sensitivity to its own logit?",
    "options": [
      "The standard deviation is 9. The larger weight moves toward 1 and becomes less sensitive.",
      "The standard deviation is 81. The larger weight moves toward 1 and becomes less sensitive.",
      "The standard deviation is 9. The larger weight moves toward 1/2 and becomes more sensitive.",
      "The standard deviation is 81. The larger weight moves toward 1/2 and becomes more sensitive."
    ],
    "answer": "The standard deviation is 9. The larger weight moves toward 1 and becomes less sensitive.",
    "explanation": "Each coordinate product has mean 0 and variance 1. Adding 81 independent products gives variance 81 and standard deviation 9. Skipping division by 9 makes the gap between the two logits nine times as large. The larger weight $p$ moves closer to 1. Its sensitivity to its own logit is $p(1-p)$, which decreases as $p$ rises above 1/2. A dominant weight near 1 can therefore leave little gradient for learning through the scores. Moving toward 1/2 would require a smaller gap."
  },
  {
    "question": "Two attention rows each start with logits [2, 1, 5] over three keys. The code fills blocked logits with -1e4 and then applies softmax over the keys. In the active row, only key 3 is blocked. In the padded query row, all three keys are blocked. What weights does each row get?",
    "options": [
      "Active row [0.73, 0.27, 0] and padded row [1/3, 1/3, 1/3].",
      "Active row [0.05, 0.02, 0] and padded row [0, 0, 0].",
      "Active row [0.05, 0.02, 0] and padded row [1/3, 1/3, 1/3].",
      "Active row [0.73, 0.27, 0] and padded row [0, 0, 0]."
    ],
    "answer": "Active row [0.73, 0.27, 0] and padded row [1/3, 1/3, 1/3].",
    "explanation": "The mask is applied before softmax, so the active row normalizes over the allowed logits. Softmax of [2, 1] is about [0.73, 0.27], and the blocked key gets about 0. The row [0.05, 0.02, 0] comes from running softmax first and zeroing afterward, and it no longer sums to 1. In the padded row, every logit becomes -1e4. They tie, so softmax returns a uniform row that reads blocked keys. Zeros appear only through explicit handling, so the code must reject the row, skip it, or set its weights to zero on purpose."
  },
  {
    "question": "During cached decoding, a two-token chunk at absolute positions 3 and 4 reads keys at positions 0 to 4. Position 1 is padding. Using T for allowed and F for blocked, which masks are correct for the two queries?",
    "options": [
      "Query 3: T F F F F. Query 4: T F F F F.",
      "Query 3: T F T T F. Query 4: T F T T T.",
      "Query 3: T T T T F. Query 4: T T T T T.",
      "Query 3: T F T F F. Query 4: T F T T F."
    ],
    "answer": "Query 3: T F T T F. Query 4: T F T T T.",
    "explanation": "A key is allowed when its absolute position is at or before the query's position and it is not padding. Query 3 reads keys 0, 2, and 3. Query 4 reads keys 0, 2, 3, and 4. Allowing position 1 leaves the padding key open. Blocking each query's own position is wrong, because causal attention includes the current position. Allowing only position 0 uses local row numbers 0 and 1 in place of absolute positions, so each new token sees only the start of its history."
  },
  {
    "question": "A dense self-attention layer changes from two heads of width 192 to six heads of width 64. Within each head, Q, K, and V have the same width. The batch, sequence length, and score precision stay fixed. Relative to the old layout, how many multiply-adds does the attention core need for scoring and mixing values? How much memory does it need to store all scores?",
    "options": [
      "Three times the work and three times the score memory.",
      "The same work and six times the score memory.",
      "Three times the work and six times the score memory.",
      "The same work and three times the score memory."
    ],
    "answer": "The same work and three times the score memory.",
    "explanation": "For each token pair, scoring takes 2 × 192 = 384 coordinate products across the old heads and 6 × 64 = 384 across the new heads. Mixing the values has the same count in each layout. Tripling the work would count the extra heads while ignoring their smaller width. Each head still stores one score per token pair, so memory grows by a factor of 6/2 = 3. A factor of six would use one head as the starting point."
  },
  {
    "question": "A naive attention implementation stores one FP16 score for every query-key pair in every head. With batch size 4, 16 heads, and sequence length 4096, how large is that score tensor?",
    "options": [
      "About 128 MiB",
      "About 1 GiB",
      "About 512 MiB",
      "About 2 GiB"
    ],
    "answer": "About 2 GiB",
    "explanation": "The size is batch x heads x n x n x bytes: 4 x 16 x 4096 x 4096 x 2 = 2,147,483,648 bytes, or 2 GiB. Because n appears twice, doubling the sequence length makes this tensor four times larger. The value 1 GiB forgets that each FP16 score takes 2 bytes. The value 128 MiB forgets the 16 heads, and 512 MiB forgets the batch size of 4."
  },
  {
    "question": "Keys A, B, and C have scalar values 6, −2, and 6. A mask blocks B before softmax. With attention-weight dropout off, A gets one quarter of the weight and C gets the rest. The loss equals this row's output. Which scores before masking and which individual values have nonzero gradients from this loss?",
    "options": [
      "Scores at A and C. Values at A and C.",
      "None of the scores. Values at A, B, and C.",
      "None of the scores. Values at A and C.",
      "Scores at A and C. Values at A, B, and C."
    ],
    "answer": "None of the scores. Values at A and C.",
    "explanation": "The output is ¼ × 6 + ¾ × 6 = 6. Raising the score for A or C shifts weight between two equal values, so the output stays at 6. Changing the score for B has no effect because the mask blocks it. Each value gradient equals its weight here because the loss is the output itself. A gets a gradient of ¼ and C gets ¾. Giving B a value gradient would count a value with zero weight."
  },
  {
    "question": "A team has two problems. Training on long sequences runs out of memory because it stores every attention score. Serving is limited by the bandwidth needed to read the growing KV cache for each new token. Which pair of changes targets these problems?",
    "options": [
      "Training: FlashAttention. Serving: FlashAttention.",
      "Training: MQA or GQA. Serving: FlashAttention.",
      "Training: FlashAttention. Serving: MQA or GQA.",
      "Training: MQA or GQA. Serving: MQA or GQA."
    ],
    "answer": "Training: FlashAttention. Serving: MQA or GQA.",
    "explanation": "FlashAttention computes exact attention in tiles, so the full $n \\times n$ score matrix is never written to high-bandwidth memory. It does not shrink the cached K and V. MQA and GQA share K/V heads, so each new token reads fewer cached bytes. They do not shrink the score matrix, because every query head still scores every query-key pair. Each change therefore helps only one of these problems. MQA and GQA also need a model trained or uptrained for that layout."
  },
  {
    "question": "Online softmax processes one row in tiles. After the first tile, which has the single score 1000, the running maximum is 1000 and the running sum of exponentials is $e^{1000-1000} = 1$. The next tile has scores 1002 and 999. What is the running sum after this tile?",
    "options": [
      "About 1.05",
      "About 2.05",
      "About 1.19",
      "About 8.44"
    ],
    "answer": "About 1.19",
    "explanation": "The new maximum is 1002, so earlier work must be rescaled by exp(1000 - 1002) = 0.135. The new tile adds exp(0) + exp(-3) = 1.050. The sum is 0.135 + 1.050 = 1.19, which equals the denominator of a full-row max-shifted softmax on [1000, 1002, 999]. The value 2.05 forgets to rescale, so it mixes terms measured against two different maxima. The value 1.05 drops the first tile and loses that key's share. The value 8.44 rescales in the wrong direction. Working relative to the running maximum keeps every exponent at 0 or below, so nothing overflows."
  }
]
```

> **Next:** Continue to [Positional Encoding: RoPE & ALiBi](/learn/positional-encoding-rope-alibi).
