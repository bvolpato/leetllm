---
title: INT8
aliases: ["8-bit integer", "signed 8-bit integer", "integer 8"]
importance: 87
---
**INT8** is an eight-bit integer representation that stores one value in one byte. A signed INT8 value normally ranges from `-128` through `127`; an unsigned eight-bit value ranges from `0` through `255`. Machine-learning systems often combine these integer codes with scale factors and, for asymmetric schemes, zero points so that higher-precision values can be approximately reconstructed.

## Integer and floating-point storage

INT8 and FP8 both occupy one byte, but they encode numbers differently. INT8 uses integer levels whose real-world meaning comes from external quantization metadata. FP8 uses a floating-point layout with sign, exponent, and fraction fields. Equal storage size doesn't imply equal numerical behavior, kernel support, or quality.

For a symmetric signed quantization scheme, one common mapping is $q=\operatorname{clip}(\operatorname{round}(x/s),-127,127)$, followed by $\hat{x}=s q$. The positive scale $s$ controls the distance between representable real values.

## Example

Choose a scale of `0.1` for a weight of `0.73`. Dividing by the scale gives `7.3`; rounding produces the INT8 code `7`. Reconstructing with `7 × 0.1` yields `0.7`, so the quantization error is `0.03`.

For one billion values, raw INT8 codes require one billion bytes, compared with four billion bytes for FP32. Actual storage is larger than the raw code payload because scales, optional zero points, alignment, and runtime buffers also consume memory. Measure inference latency with the target kernels and workload; the speedup depends on kernel support and the workload's bottleneck.

## Why it matters here

Model quantization, embedding storage, accelerator kernels, and key-value caches all use eight-bit representations. Separating integer codes, scale metadata, storage savings, and execution support prevents readers from treating INT8, FP8, and lossless compression as interchangeable.

## Related terms

- [Quantization](glossary://quantization)
- [FP8](glossary://fp8)
- [FP32](glossary://fp32)
- [Post-training quantization](glossary://post-training-quantization)
- [Quantization-aware training](glossary://quantization-aware-training)
