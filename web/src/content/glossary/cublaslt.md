---
title: cuBLASLt
importance: 76
kind: code
---
**cuBLASLt** is flexible matrix-multiplication API in NVIDIA cuBLAS. It exposes layouts, algorithm heuristics, mixed-precision scaling, and fused epilogues beyond traditional BLAS-style interface.

## LLM role

Linear layer can combine matrix multiplication with bias, activation, scale handling, or other epilogue work. Fusing that work reduces intermediate memory traffic and kernel launches. Transformer Engine and framework backends may use cuBLASLt underneath higher-level primitives.

cuBLASLt performance depends on shape, alignment, dtype, workspace, and the selected heuristic. Compare effective kernels on representative token counts before applying results from a square GEMM benchmark.

## Algorithm selection

Application describes operation, layouts, scaling, epilogue, and workspace cap. cuBLASLt returns candidate heuristics compatible with request. Framework can benchmark or choose one, then cache selection for repeated shapes. Dynamic MoE token counts weaken cache reuse. A larger workspace can unlock faster algorithm while increasing peak HBM and OOM risk.


## Example

Linear layer can use cuBLASLt matmul with bias and activation epilogue, avoiding separate bias-add and activation launches.

## Why it matters here

TP shards and expert token counts produce unusual matrix shapes. cuBLASLt algorithm and epilogue selection can determine whether those shapes use Tensor Cores efficiently.

## Related terms

- [cuBLAS](glossary://cublas)
- [GEMM](glossary://gemm)
- [Transformer Engine](glossary://transformer-engine)
- [FP8](glossary://fp8)
- [Fused kernel](glossary://fused-kernel)
