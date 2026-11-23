---
title: Transformer layer
aliases: ["transformer block"]
importance: 89
---
A **Transformer layer** is one repeated model block that reads token representations and returns updated representations at the same hidden width. Decoder layers normally combine normalization, causal attention, residual connections, and feed-forward transformation. Layers usually own distinct learned weights, though architectures such as [ALBERT](https://openreview.net/forum?id=H1eA7AEtvS) share parameters across layers.

Tokens pass through layers sequentially. Hardware can shard work inside one layer or place different layers on pipeline stages. A layer belongs to the model graph; GPUs and distributed ranks are execution resources.

## Layer anatomy

A decoder layer usually updates one residual stream twice. The attention branch lets the current token read allowed context, then a residual add preserves its earlier representation while adding the attention result. The feed-forward branch transforms each token independently, followed by another residual add. Normalization stabilizes inputs to these branches. MoE replaces the dense feed-forward transformation without changing the layer's role in the stack.

## Example

For hidden width 4,096 and sequence length 2,000, one layer receives tensor shaped roughly `2,000 × 4,096`, mixes information through attention, transforms each token through feed-forward path, and emits another `2,000 × 4,096` tensor for next layer.

## Why it matters here

Layer count controls model depth and repeated compute. Pipeline parallelism decides where layers live; tensor parallelism decides how matrices inside each layer are split. Confusing these axes leads to wrong memory and communication estimates.

## Related terms

- [Transformer](glossary://transformer)
- [Self-attention](glossary://self-attention)
- [Feed-forward network](glossary://feed-forward-network)
- [Residual stream](glossary://residual-stream)
- [Pipeline parallelism](glossary://pipeline-parallelism)
