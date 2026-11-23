---
title: Tensor Core
importance: 80
---
A **Tensor Core** is NVIDIA's specialized GPU execution unit for matrix multiply-accumulate tiles. GPU libraries compose many tiles into GEMM, convolution, and attention kernels. Tensor Cores trade generality for high throughput on shapes and numerical formats supported by the particular GPU architecture.

A Tensor Core is a matrix-math execution unit within an NVIDIA GPU. One GPU contains many streaming multiprocessors, and each multiprocessor contains several execution resources, including Tensor Cores on supported NVIDIA architectures and CUDA cores for general-purpose execution.

## Tile pipeline

An efficient kernel stages aligned operand tiles from HBM through on-chip memory, issues a matrix multiply-accumulate instruction, retains an accumulator tile, then writes output. Libraries such as cuBLAS, CUTLASS, Triton, and framework-specific fused kernels choose tiling and scheduling. A programmer normally calls a high-level GEMM rather than addressing an individual Tensor Core directly.


## Example

BF16 GEMM can multiply low-precision input tiles while accumulating into wider precision. FP8 increases potential throughput and lowers data movement further, but requires suitable scaling and aligned shapes.

## Why it matters here

Peak GPU FLOPs assume Tensor Cores stay fed. Tiny batches, skinny shards, misaligned dimensions, memory stalls, and communication gaps can leave them underused even when total model FLOPs look enormous.

## Related terms

- [GPU](glossary://gpu)
- [GEMM](glossary://gemm)
- [BF16](glossary://bf16)
- [FP8](glossary://fp8)
- [Arithmetic intensity](glossary://arithmetic-intensity)
