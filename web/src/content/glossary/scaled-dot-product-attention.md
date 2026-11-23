---
title: Scaled dot-product attention
aliases: ["SDPA", "scaled dot product attention"]
importance: 95
---
Scaled dot-product attention (SDPA) computes query-key similarity scores, scales them by the square root of the key dimension, normalizes them with softmax, and uses the resulting weights to combine value vectors. Queries describe what a position seeks; keys describe what other positions offer; values contain the information being combined.

## Scores become a weighted mixture

For query matrix $Q$, key matrix $K$, value matrix $V$, and key width $d_k$, the basic operation is

$$
\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_k}}+M\right)V.
$$

The additive mask $M$ can exclude disallowed positions before normalization. A causal mask prevents a token from reading future tokens. Scaling keeps score magnitudes from growing solely because the dot products use more dimensions.

## Example

Suppose one query has two unmasked scores, 2 and 0, after scaling. Softmax gives weights about 0.88 and 0.12. With scalar values 10 and 0, the output is about 8.8. If the first position is masked out, the second receives all the weight and the output becomes 0. The mask changes which information can influence the result.

## Why it matters here

[PyTorch's SDPA function](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html) can dispatch to different implementations. SDPA names the operation; inspect the selected backend to confirm FlashAttention ran. Shapes, dtype, masks, and backend support affect dispatch. Set its explicit dropout probability to zero for evaluation when dropout is unwanted; switching a surrounding module to evaluation mode leaves a supplied nonzero argument unchanged.

## Related terms

- [Self-attention](glossary://self-attention)
- [Attention head](glossary://attention-head)
- [Softmax](glossary://softmax)
- [Causal mask](glossary://causal-mask)
- [FlashAttention](glossary://flashattention)
