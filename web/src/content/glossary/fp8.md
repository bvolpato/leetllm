---
title: FP8
aliases: ["8-bit floating-point", "float8"]
importance: 82
---
**FP8** means an 8-bit floating-point format used to store or compute neural-network tensors with half the bytes of FP16 or BF16. FP8 includes multiple number formats. NVIDIA training and inference stacks commonly expose **E4M3**, which spends four bits on the exponent and three on the mantissa, and **E5M2**, which trades one precision bit for a wider numeric range. Scaling metadata, often derived from an [amax](glossary://amax), maps real tensor values into the chosen FP8 range.

FP8 can reduce weight, activation, and [KV cache](glossary://kv-cache) traffic, but only when kernels and calibration rules match the workload. A model advertised as "FP8" may use FP8 weights while retaining BF16 accumulation, FP32 router scores, or another dtype for sensitive operations.

## Precision and range

E4M3 keeps more mantissa precision and is common for forward weights and activations. E5M2 has more exponent range and can better tolerate large gradients. Inference checkpoints often pair FP8 tensors with per-tensor, per-channel, or block scaling factors. Those scales are part of the checkpoint contract, not optional decoration.


## Example

A 100 GB BF16 weight payload is roughly 50 GB at one byte per FP8 value before scale metadata and alignment. That weight-storage reduction may let an inference replica fit on fewer GPUs. Benchmark model quality and end-to-end speed on the target workload.

## Why it matters here

The unsuffixed GLM-5.3 release is an FP8 artifact; a separate BF16 checkpoint is available. Neither repository name establishes the serving engine's KV-cache dtype or the learner's compute precision. The masterclass considers FP8 serving with BF16 learning, a split that can change sparse-attention selections or expert-routing decisions. Verify tensor dtypes, scaling metadata, routing replay, and logprob parity before accepting that configuration.

## Related terms

- [BF16](glossary://bf16)
- [amax](glossary://amax)
- [Mixed precision](glossary://mixed-precision)
- [Quantization](glossary://quantization)
- [KV cache](glossary://kv-cache)
- [GEMM](glossary://gemm)
