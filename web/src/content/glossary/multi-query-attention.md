---
title: Multi-query attention
aliases: ["MQA"]
importance: 86
---
**Multi-query attention (MQA)** is a multi-head attention variant where every query head shares **one** key head and **one** value head. Query diversity stays ($n_q$ separate $Q$ projections); the tensors that grow in the [KV cache](glossary://kv-cache) collapse to $n_{\mathrm{kv}} = 1$. Shazeer (2019) introduced it so autoregressive decoding would spend less memory bandwidth reloading $K$ and $V$ at every step.

Full multi-head attention (MHA) stores a separate $K$/$V$ history per query head. MQA keeps multiple query heads (as in Vaswani et al.) but drops the head axis from the cached keys and values. Each head still forms its own attention distribution over the shared history; only the memory payload is shared.

## Intuition

During [decode](glossary://decode-phase), each new token must stream past keys and values from [HBM](glossary://hbm). Cache size and that stream scale with **KV heads**, not with how many different questions the model asks. MHA multiplies that cost by $n_q$. MQA multiplies by $1$.

MQA keeps $n_q$ independent query heads but shares one set of past keys and values. Each head still computes its own query and softmax weights. Serving stacks allocate, page, and reload only the shared KV state at each step.

The spectrum (Ainslie et al., 2023):

| Layout | $n_{\mathrm{kv}}$ | Role |
| --- | --- | --- |
| MHA | $n_q$ | richest KV subspaces, largest cache |
| [GQA](glossary://grouped-query-attention) | $1 < n_{\mathrm{kv}} < n_q$ | production compromise |
| MQA | $1$ | smallest cache, least KV diversity |

Configs expose this as `num_attention_heads` ($n_q$) vs `num_key_value_heads` ($n_{\mathrm{kv}}=1$ for pure MQA).

## How it works

For residual states $X \in \mathbb{R}^{B \times N \times d_{\mathrm{model}}}$ at a layer:

$$
Q = X W^Q,\quad
K = X W^K,\quad
V = X W^V
$$

with $W^Q \in \mathbb{R}^{d_{\mathrm{model}} \times n_q d_k}$ but $W^K, W^V \in \mathbb{R}^{d_{\mathrm{model}} \times d_k}$ (one head each). Reshape $Q$ to $n_q$ heads; keep $K$ and $V$ with a singleton head axis that broadcasts:

$$
\mathrm{head}_i = \mathrm{softmax}\!\left(\frac{Q_i K^{\top}}{\sqrt{d_k}}\right) V,
\quad i = 1,\ldots,n_q
$$

Concatenate the $n_q$ head outputs and apply $W^O$ as in multi-head attention. Prefill still writes $K$ and $V$ for every position; decode appends **one** new $k_t$ and $v_t$ per layer (not $n_q$ of them) and reuses the shared cache.

Shazeer's incremental-decode intuition: at long context, each decode step's dominant extra traffic is reloading past $K$/$V$ while matmul work per new token stays proportional to head width $d$. Sharing one $K$/$V$ across $h$ query heads cuts that KV reload term by about a factor of $h$. Prefer the concrete per-step **byte** and **FLOP** counts in the sizing section below over bare asymptotic ratios (batch size, weight traffic, and kernel fusion all change the constant factors). Training remains parallel over sequence length; the win shows up in **incremental** generation.

## Formula and sizing

KV cache for a batch of equally long sequences (keys **and** values, all layers), same structure as the [KV cache](glossary://kv-cache) entry:

$$
\text{KV bytes}
=
2 \times L \times n_{\mathrm{kv}} \times d_k \times T \times B \times b
$$

Under pure MQA, $n_{\mathrm{kv}} = 1$, so versus MHA with $n_q$ KV heads the cache shrinks by $n_q$:

$$
\frac{\text{MHA cache}}{\text{MQA cache}} = n_q
\quad\text{when } d_k, L, T, B, b \text{ match.}
$$

| Symbol | Meaning |
| --- | --- |
| $2$ | store $K$ and $V$ |
| $L$ | transformer layers |
| $n_{\mathrm{kv}}$ | $1$ for MQA |
| $d_k$ | head dimension |
| $T$ | tokens in the sequence so far |
| $B$ | concurrent sequences |
| $b$ | bytes per element (2 for FP16/BF16) |

Weight parameter count barely moves relative to a full model ($W^K$ and $W^V$ shrink from $n_q d_k$ to $d_k$ columns). **Serving memory and decode bandwidth** track $n_{\mathrm{kv}}$, not parameter count.

## Worked numbers

Take $L = 32$, $d_k = 128$, $b = 2$ (FP16), $T = 8192$, $B = 4$, and $n_q = 32$:

```python
def kv_bytes(layers, kv_heads, head_dim, seq_len, batch, bytes_per=2):
    return 2 * layers * kv_heads * head_dim * seq_len * batch * bytes_per

L, d, T, B = 32, 128, 8192, 4
for name, n_kv in [("MHA n_kv=32", 32), ("GQA n_kv=8", 8), ("MQA n_kv=1", 1)]:
    gb = kv_bytes(L, n_kv, d, T, B) / 1e9
    print(f"{name}: {gb:.2f} GB")
```

| Layout | $n_{\mathrm{kv}}$ | Cache at 8k $\times$ batch 4 |
| --- | --- | --- |
| MHA | 32 | $\approx 17.18$ GB |
| GQA | 8 | $\approx 4.29$ GB |
| MQA | 1 | $\approx 0.54$ GB |

Per-token storage under MQA is $2 L d_k b = 2 \times 32 \times 128 \times 2 = 16{,}384$ bytes $= 16$ KiB, independent of query head count. At a 72B-class geometry ($L=80$, $n_q=64$, $d_k=128$, $T=4096$, $B=32$, FP16), full MHA needs on the order of $344$ GB of cache; pure MQA needs about $5.4$ GB for the same workload.

Shazeer's WMT EN-DE experiment (6-layer Transformer, $h=8$, $d_k=128$) kept quality close to multi-head (test BLEU about $27.5$/$28.5$ greedy/beam vs $27.7$/$28.4$ for MHA) while dropping amortized incremental decoder cost from about $46$ µs/token to about $3.8$ µs/token on their TPUv2 setup. Training cost stayed almost the same. Alternatives that only reduced $h$ or $d_k$ hurt quality more for less speedup.

## Example

You size a chat service for a 32-layer decoder with $n_q=32$, $d_k=128$, and an FP16 KV cache. Average live context is $8$k tokens and you want $B=16$ concurrent sessions.

- **MHA** ($n_{\mathrm{kv}}=32$): cache $\approx 2 \times 32 \times 32 \times 128 \times 8192 \times 16 \times 2 \approx 68.7$ GB.
- **MQA** ($n_{\mathrm{kv}}=1$): same geometry $\approx 2.15$ GB of cache.

The MQA fleet can admit far more concurrent long sessions before KV memory becomes the OOM limit; weight storage remains a separate budget. Prefill FLOPs still score every query head against the sequence. The large win is **decode**: each step reloads roughly $n_q\times$ less KV traffic, and continuous batching can pack a larger effective batch into the free HBM. If relation-heavy evals drop after an MQA-from-scratch train (or after uptraining), raise $n_{\mathrm{kv}}$ into the GQA regime and measure the quality and serving tradeoff.

## Trade-offs

- **Quality and capacity.** One shared KV subspace can lose patterns that specialized K/V heads would hold. Shazeer reported minor degradation on translation and LM; Ainslie et al. later reported quality gaps and training/finetuning instability for pure MQA on some long-input T5 setups, which motivated GQA.
- **Speed vs GQA.** MQA is the lower bound on KV bytes for a given $d_k$ and $L$. GQA with a modest $n_{\mathrm{kv}}$ (often $8$) recovers most MHA quality at nearly MQA decode cost; that is why many open LLMs ship GQA.
- **Tensor parallel.** With $n_{\mathrm{kv}}=1$, tensor-parallel shards often **replicate** the single KV head across ranks while splitting query heads. That wastes some capacity relative to a GQA layout where $n_{\mathrm{kv}}$ divides the parallel width cleanly.
- **Prefill and serving scope.** Prefill still pays attention work over the full prompt. MQA mainly helps when KV load and capacity dominate (long decode, high concurrency). Pair it with [FlashAttention](glossary://flashattention)-style kernels, paging, and continuous batching for a complete serving stack.
- **Uptraining.** Ainslie et al. convert MHA checkpoints by mean-pooling $W^K$ and $W^V$ into one head, then continue pretraining for a small fraction of original steps (about $5\%$ in their recipe). From-scratch MQA is also common in older efficient open models (for example Falcon-7B-style pure multi-query layouts).

## Debug path

When two models with similar parameter counts serve differently, record $n_q$, $n_{\mathrm{kv}}$, $d_k$, $L$, dtype, max context, and concurrent batch. Estimate KV bytes with $n_{\mathrm{kv}}$, never with $n_q$ alone. Shape bugs in custom kernels usually show up as failed head-axis broadcasts (`K`/`V` missing a singleton head dim, or accidental `repeat` that materializes full MHA cache). If quality collapses after a "GQA config" change, confirm the checkpoint was trained or uptrained with $n_{\mathrm{kv}}=1$; setting the load-time config alone does not change its trained architecture.

## Why it matters here

MQA is the architectural extreme that made KV-cache bandwidth a first-class design target for LLM inference. It explains why decode capacity is not determined by parameter count alone, why GQA exists as a softer sharing schedule, and why model cards list query heads and key-value heads separately. When you plan long-context product limits, GPU packing, or tokens-per-second under load, $n_{\mathrm{kv}}=1$ is the lower bound of the head-sharing spectrum.

## Related terms

- [Grouped-query attention](glossary://grouped-query-attention)
- [KV cache](glossary://kv-cache)
- [Attention head](glossary://attention-head)
- [Decode phase](glossary://decode-phase)
- [Self-attention](glossary://self-attention)
