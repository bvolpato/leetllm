---
title: GLM-5.3
aliases: ["GLM 5.3"]
importance: 92
---
GLM-5.3 is Z.AI's text-only, decoder-only mixture-of-experts language model. Its [model card](https://huggingface.co/zai-org/GLM-5.3) attributes the improvement over GLM-5.2 to post-training on the same base model. A new policy can behave differently even when its layer dimensions and tensor names stay unchanged.

## Architecture and artifact are different questions

The [released BF16 configuration](https://huggingface.co/zai-org/GLM-5.3-BF16/blob/304b8051cfb2b260b61ce0cbe330e02a98e73639/config.json) has 78 main layers and hidden width 6,144. Its 75 sparse feed-forward layers select eight of 256 routed experts, plus one shared expert. Multi-head Latent Attention (MLA) compresses cached attention state; DeepSeek Sparse Attention (DSA) selects context positions; IndexShare reuses those selections. One additional decoder-style block supports multi-token prediction.

The unsuffixed `zai-org/GLM-5.3` repository contains FP8 weights. `zai-org/GLM-5.3-BF16` is the wider-precision artifact. Choosing the correct repository is separate from configuring the precision of activations, KV cache, or optimizer state.

## Example

A training team starts with the BF16 checkpoint, converts it into learner shards, then exports an FP8 serving copy for rollouts. Matching tensor keys proves only part of the conversion. The team still compares fixed-token outputs, tool formatting, expert routing, and refreshed policy versions before accepting training data.

## Why it matters here

GLM-5.3 connects sparse architecture, checkpoint conversion, and agent post-training. Adoption requires reviewing its reasoning settings, chat template, and [custom license](https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE). GLM-5.3-Flash uses a separate architecture, so evaluate it as its own model in this graph.

## Related terms

- [GLM-5.2](glossary://glm-52)
- [DeepSeek Sparse Attention](glossary://deepseek-sparse-attention)
- [Mixture of experts](glossary://mixture-of-experts)
- [FP8](glossary://fp8)
- [Reasoning effort](glossary://reasoning-effort)
- [Chat template](glossary://chat-template)
