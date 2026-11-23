---
title: GPTQ
aliases: ["Generative Pre-trained Transformer Quantization"]
importance: 84
---
**GPTQ** is a post-training, weight-only quantization method that compresses a pretrained transformer without rerunning its original training job. It uses representative calibration inputs and approximate second-order information to choose low-bit weights while compensating for errors in weights that haven't been quantized yet. A GPTQ checkpoint commonly stores four-bit weights while computations still use higher-precision activations.

## Why the Hessian changes the rounding decision

Rounding every weight independently ignores which input directions actually affect a layer's output. GPTQ instead minimizes a layer reconstruction objective, approximately:

$$
\widehat W \approx \arg\min_{Q\ \text{on the quantization grid}} \lVert WX-QX\rVert_F^2
$$

Here, $W$ is the original weight matrix, $X$ contains calibration activations, and $Q$ is the quantized matrix. The Frobenius norm sums squared output errors across rows and calibration examples. The quadratic reconstruction Hessian is based on $XX^\top$, with damping used for stable inversion; GPTQ approximately solves the discrete quantization problem through sequential quantization and compensation. As weights are committed to a low-bit grid, it adjusts remaining weights to reduce reconstruction error. The method protects observed layer behavior rather than simply preserving every weight equally ([original paper](https://arxiv.org/abs/2210.17323)).

## Example

An eight-billion-parameter checkpoint needs roughly 16 GB for BF16 weights. Four-bit GPTQ reduces the raw weight codes to approximately 4 GB, plus group scales and packing metadata. That arithmetic doesn't include the KV cache, temporary activations, allocator headroom, or graph buffers. A coding assistant calibrated entirely on conversational text can also retain general perplexity while producing worse syntax or malformed tool arguments. Compare the quantized model against its BF16 baseline on representative code, long-context prompts, and structured outputs.

## Why it matters here

Serving lessons compare GPTQ with activation-aware weight quantization and GGUF artifacts because the algorithm, checkpoint layout, and runtime kernel must all agree. A smaller checkpoint only improves throughput when its serving engine can efficiently unpack or fuse the low-bit matrix multiplication.

## Related terms

- [Quantization](glossary://quantization)
- [Calibration](glossary://calibration)
- [KV cache](glossary://kv-cache)
- [GGUF](glossary://gguf)
