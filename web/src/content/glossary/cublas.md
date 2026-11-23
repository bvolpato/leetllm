---
title: cuBLAS
importance: 78
kind: code
---
**cuBLAS** is NVIDIA's CUDA library for dense linear algebra on GPUs. Its BLAS-compatible operations include matrix multiplication, vector operations, and batched variants used throughout neural-network training and inference.

## LLM role

Transformer projections, dense feed-forward layers, output heads, and many expert operations reduce to matrix multiplication. PyTorch or a higher-level library can dispatch those operations to cuBLAS without application code calling it directly.

cuBLAS owns numerical kernels and algorithm selection for supported shapes and dtypes. It does not own model architecture, batching, autograd, distributed process groups, or sparse expert routing.

## Operational clue

Profiler traces show whether cuBLAS is on the hot path. Package presence confirms installation; runtime use depends on the executed workload. Low Tensor Core utilization can come from skinny tensor-parallel shards, tiny token batches, poor alignment, or synchronization around otherwise fast GEMMs.

## Example

`torch.matmul` over BF16 matrices may dispatch to cuBLAS Tensor Core kernel. Nsight trace confirms selected operation and dimensions.

## Why it matters here

GLM projections and expert MLPs spend much of arithmetic in GEMMs. Correct shape and backend evidence separates matrix inefficiency from communication or queueing.

## Related terms

- [cuBLASLt](glossary://cublaslt)
- [GEMM](glossary://gemm)
- [CUDA](glossary://cuda)
- [Tensor Core](glossary://tensor-core)
- [Fused kernel](glossary://fused-kernel)
