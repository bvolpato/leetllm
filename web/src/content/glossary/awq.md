---
title: AWQ
aliases: ["Activation-aware Weight Quantization"]
importance: 84
---
**AWQ** is activation-aware weight quantization, a post-training method that compresses a model's weights while protecting channels that matter disproportionately to real activations. It observes representative inputs, identifies salient channels from their activation patterns, and rescales weights before low-bit quantization. Unlike a mixed-precision scheme that leaves selected channels uncompressed, AWQ can keep the stored weights in a hardware-friendly low-bit format.

## Activation salience is different from weight size

A large weight isn't automatically important, and a small weight can be critical when its input activation is consistently large. AWQ therefore estimates importance from the interaction between inputs and weights rather than ranking weight magnitudes alone. Channel scaling enlarges the effective precision available to sensitive channels, while an inverse activation adjustment preserves the original computation before rounding.

For input activations $X$, weights $W$, and channel scales $s$, the transformed computation aims to preserve:

$$
XW \approx (X/s)\,Q(sW)
$$

The exact packing, scaling granularity, and kernel support depend on the runtime and checkpoint implementation.

## Example

A 14-billion-parameter model occupies about 28 GB in BF16 weights. Four-bit weight storage reduces the raw codes to around 7 GB before scales and metadata. If that checkpoint must produce valid JSON tool arguments, calibration should include tool-calling prompts instead of only generic text. Measure schema validity, task accuracy, and output tokens per second against the original checkpoint. A runtime that falls back to slow dequantization can erase the expected latency improvement even when the model fits comfortably.

## Why it matters here

Inference and local-deployment articles compare AWQ with GPTQ because both can compress weights to four bits but protect model quality using different evidence. Choosing an artifact requires checking workload-shaped evaluation, checkpoint compatibility, and the actual serving engine's kernel support.

## Related terms

- [Quantization](glossary://quantization)
- [Calibration](glossary://calibration)
- [GPU](glossary://gpu)
- [TensorRT-LLM](glossary://tensorrt-llm)
