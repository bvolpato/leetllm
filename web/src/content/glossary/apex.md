---
title: NVIDIA Apex
aliases: ["Apex (A PyTorch Extension)"]
importance: 67
kind: code
---
**NVIDIA Apex** is collection of optional PyTorch extensions from NVIDIA. It includes fused optimizers, normalization kernels, distributed helpers, and mixed-precision utilities.

## Boundary

Apex predates several native PyTorch and Transformer Engine capabilities. Modern stack may use one Apex extension, many, or none. Package presence does not prove model executes Apex kernels.

Compiled extensions are sensitive to Python, PyTorch, CUDA, compiler, and C++ ABI compatibility. Import failure, undefined symbol, or silent fallback after container upgrade should be treated as environment-contract failure.

## Build verification

Record Apex commit, PyTorch build, CUDA toolkit, compiler, architecture flags, and enabled extensions. Exercise intended optimizer or normalization on GPU and inspect loaded module path. Rebuild after changing container ABI. A wheel copied from another image can import successfully yet omit optional kernels or fail only when first fused operation launches.


## Example

Training container may load Apex fused Adam extension. Startup logs and profiler should show fused optimizer class and kernels; `import apex` alone is insufficient.

## Why it matters here

Large models amplify small per-layer overhead. Fused normalization or optimizer path can matter across dozens of layers and billions of parameters, but only profiler and startup logs can establish active implementation.

## Related terms

- [PyTorch](glossary://pytorch)
- [CUDA](glossary://cuda)
- [Transformer Engine](glossary://transformer-engine)
- [Fused kernel](glossary://fused-kernel)
