---
title: Causal mask
aliases: ["look-ahead mask", "autoregressive attention mask"]
importance: 92
---
A **causal mask** (also called a look-ahead mask or autoregressive attention mask) blocks each query position from attending to keys that come *after* it. Position $i$ may use keys $j \leq i$ only. That is the structural rule that makes decoder-only self-attention match next-token language modeling: when the model scores the prediction at $i$, it must not read tokens it is not allowed to know yet.

Unmasked self-attention is bidirectional: every token can see every other token in the sequence. Language modeling needs a left-to-right dependency instead. The original Transformer decoder introduced this by masking illegal connections inside scaled dot-product attention: disallowed scores are set to $-\infty$ before softmax so their weights become zero (Vaswani et al., 2017). GPT-style decoder-only models keep the same mask on every layer and drop the separate encoder stack.

Training still feeds the full sequence in one forward pass (teacher forcing). The mask is what makes that parallel pass *honest*: every position is scored at once for speed, but information never flows from future tokens into past predictions. At generation time the same rule matches left-to-right decoding: predict one token, append it, predict the next.

## Formula

Scaled attention with an additive mask $M$:

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}} + M\right)V
$$

For a square sequence of length $n$, the causal pattern is lower-triangular:

$$
M_{ij} =
\begin{cases}
0 & \text{if } j \leq i \\
-\infty & \text{if } j > i
\end{cases}
$$

After softmax along keys, each row $i$ is a distribution over positions $0,\ldots,i$ only. Implementations usually build a boolean upper triangle and `masked_fill` disallowed logits with a large negative (conceptually $-\infty$). For square query/key sequences, PyTorch's `F.scaled_dot_product_attention(..., is_causal=True)` applies an equivalent lower-triangular pattern without you materializing $M$ yourself. For cached decoding with unequal query/key lengths, check alignment: SDPA documents an upper-left causal bias for non-square inputs, which can exclude valid cached keys if used blindly.

The mask is **not** the same object as a padding mask. Padding marks missing batch slots; the causal mask marks future time. Real training often combines both: block pad positions *and* future positions in one additive bias.

## Diagram

Allowed edges for $n = 4$ (rows = queries, columns = keys; $\bullet$ = allowed):

```text
j→  0  1  2  3
0   •  ·  ·  ·
1   •  •  ·  ·
2   •  •  •  ·
3   •  •  •  •
```

## Example

Tokens: `["Deploy", "passed", "all", "checks"]` at positions $0..3$. When computing attention for `"all"` (query $i=2$), legal keys are `"Deploy"`, `"passed"`, and `"all"`. The score for `"checks"` is forced to $-\infty$ and drops out of softmax.

Toy pre-mask scores for that row (already scaled):

| key $j$ | token | raw score | after causal mask |
|--------:|-------|----------:|------------------:|
| 0 | Deploy | 2.0 | 2.0 |
| 1 | passed | 1.0 | 1.0 |
| 2 | all | 0.5 | 0.5 |
| 3 | checks | 5.0 | $-\infty$ |

Without the mask, softmax would put almost all mass on the future token `"checks"` (score $5.0$). With the mask, only the first three logits compete:

```python
import math

scores = [2.0, 1.0, 0.5]  # future already removed
m = max(scores)
exps = [math.exp(s - m) for s in scores]
weights = [e / sum(exps) for e in exps]
# ≈ [0.63, 0.23, 0.14] over Deploy, passed, all
```

A tiny mask builder for unit tests:

```python
def causal_bool_mask(n: int) -> list[list[bool]]:
    # True = allowed (j <= i)
    return [[j <= i for j in range(n)] for i in range(n)]

assert causal_bool_mask(3) == [
    [True, False, False],
    [True, True, False],
    [True, True, True],
]
```

**Packed batches.** If packed documents are intended to be independent examples, combine the causal triangle with a document / block mask. A pure causal triangle already blocks later document B from being read by earlier document A; it still lets B read A's earlier tokens. Test isolation by changing A and checking that B's predictions remain unchanged. Choose isolation based on the training objective because some pretraining intentionally allows cross-document attention.

## How it works in train and serve

1. **Training (parallel, teacher-forced).** The full target is known. One forward pass scores every next-token position. Row $i$ may attend to keys $j \le i$ (self included, as in the `"all"` example above). Those logits train against the **next** token $x_{i+1}$ under the usual label shift, so the factorization is $P(x_{i+1} \mid x_{\le i})$. The model never reads future keys when forming that prediction; it does use the current token as a key for later positions.
2. **Prefill.** The prompt is fully known. The model runs causal attention over the prompt, writes keys and values for every position into the KV cache, and emits the first output distribution.
3. **Decode.** Each new token produces one new query (and one new K/V slice). That query attends only *backward* into the cache. There is no future key to leak from; the causal rule is still the contract between training and generation.
4. **Kernels.** FlashAttention and SDPA often apply causality inside the kernel (skip whole future tiles, mask only the diagonal tile) instead of storing a dense $n \times n$ mask in HBM. Math stays the same; the mask becomes a schedule constraint.

If the mask is wrong in training, gradients flow through illegal future positions and the model learns shortcuts it cannot use at inference: train loss looks great, free-running generation falls apart. If padding is omitted but causality is correct, padded batch slots still pollute attention. Debug both.

## Why it matters here

Causal masking is the bridge between attention math and the next-token objective used across the LLM curriculum: decoder-only transformers, teacher-forced pretraining, KV-cache serving, packed training, and streaming generation. Understanding the lower triangle is what makes "why GPT cannot look ahead" and "why a bad pack mask leaks" concrete rather than slogans.

## Related terms

- [Self-attention](glossary://self-attention)
- [Softmax](glossary://softmax)
- [Teacher forcing](glossary://teacher-forcing)
- [KV cache](glossary://kv-cache)
- [Autoregressive decoding](glossary://autoregressive-decoding)
