---
title: Post-training quantization
aliases: ["PTQ"]
importance: 82
---
**Post-training quantization** converts an already-trained model into a lower-precision representation without repeating its original training run. Depending on the method, it may quantize weights, activations, or the key-value cache. Some paths simply round values using measured ranges; others use calibration examples, activation-aware scaling, or approximate second-order corrections to preserve model behavior.

## Calibration changes what survives compression

A calibration set exposes representative activations before scales and packing parameters are chosen. If production requests contain code, tool schemas, or long documents, generic conversational samples may miss the channels that those workloads rely on. A small perplexity shift on a short public dataset describes token prediction on that dataset; test structured output, long-context retrieval, and safety with representative tasks.

Calibration is method-dependent: weight-only rounding can derive scales directly from weights without example inputs. GPTQ uses calibration activations for approximate second-order weight corrections; AWQ uses activation statistics to guide scaling of weight channels. Choose activation and KV-cache precision separately from the method name. The diagram follows a calibrated PTQ path. [GPTQ](https://arxiv.org/abs/2210.17323), [AWQ](https://arxiv.org/abs/2306.00978)

Post-training quantization differs from quantization-aware training. Quantization-aware training simulates lower precision during optimization so the model can adapt its weights; that extra training may recover quality but requires a more expensive optimization workflow.

## Example

An eight-billion-parameter BF16 checkpoint stores roughly 16 GB of weight values. Four-bit weight-only post-training quantization reduces the raw codes to approximately 4 GB, plus scales and format metadata. Keep the activations in BF16 when the runtime uses a W4A16 path, and budget separately for KV cache, temporary buffers, and concurrent requests. Evaluate valid tool-call rate, task accuracy, long-context behavior, and latency against the original checkpoint before changing production traffic.

These decimal calculations estimate raw weight-value storage: $8\times10^9\times2$ bytes for BF16 and $8\times10^9\times0.5$ bytes for four-bit codes. Measure device-memory use and speed on the target runtime; metadata, activations, concurrency, kernel support, and dequantization overhead affect both.

## Why it matters here

The curriculum compares GPTQ, AWQ, GGUF conversions, and hardware-native low-precision runtimes. All can start after model training, but they differ in calibration evidence, supported numeric formats, kernel requirements, and the kinds of quality regressions they can introduce.

## Related terms

- [Quantization](glossary://quantization)
- [Calibration](glossary://calibration)
- [Mixed precision](glossary://mixed-precision)
- [GGUF](glossary://gguf)
