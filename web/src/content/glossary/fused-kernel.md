---
title: Fused kernel
aliases: ["fused kernels"]
importance: 78
kind: term
---
**Fused kernel** performs several neighboring tensor operations in one GPU launch and often keeps intermediate values in registers or on-chip memory instead of writing them to HBM.

## Example

Separate implementation can run matrix multiplication, bias addition, activation, dropout, and residual update as individual kernels. Fused implementation combines some or all operations. Arithmetic may stay similar while launch overhead and memory traffic fall.

Fusion has specifications: supported shapes, dtypes, layouts, masks, dropout behavior, and backward formulas. Unsupported input can fall back to slower path. Numerical parity and profiler evidence matter more than kernel name.

## Fusion perimeter

Best perimeter keeps expensive intermediates on chip without making register pressure or compilation explosion worse. Forward fusion also needs backward implementation when training. Serving-only kernel may be unusable for learner. Inspect kernel count, HBM bytes, occupancy, compile time, graph compatibility, and first unsupported shape. A single slow fallback at long context can dominate average.

## Why it matters here

GLM-5.3 repeats attention, normalization, routing, and expert operations across many layers. Saving one launch or intermediate HBM write can compound, but unsupported sparse shapes can also fall back silently. Profile the actual dtype, tensor shape, and engine revision instead of assuming that an installed kernel library supplies every fast path.

## Related terms

- [CUDA](glossary://cuda)
- [GEMM](glossary://gemm)
- [cuBLASLt](glossary://cublaslt)
- [Triton language](glossary://triton-language)
