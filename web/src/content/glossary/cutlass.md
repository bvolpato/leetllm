---
title: CUTLASS
aliases: ["CUDA Templates for Linear Algebra Subroutines"]
importance: 78
---
CUTLASS is NVIDIA's collection of CUDA building blocks for high-performance linear algebra, especially matrix multiplication. Its name expands to CUDA Templates for Linear Algebra Subroutines. Kernel authors use its components to choose data layouts, tiling, memory movement, and arithmetic operations for particular GPU architectures and workloads.

## Building a kernel differs from calling a library


A cuBLAS call asks a library to execute an operation using its available implementations. CUTLASS exposes lower-level components for constructing specialized kernels. That flexibility can help fuse a bias, activation, or output conversion into the work, but it also makes the author responsible for compatibility, layout, resource use, and validation.

The [CUTLASS overview](https://docs.nvidia.com/cutlass/latest/overview.html) describes its programming abstractions and supported operations. A framework listing CUTLASS as a dependency does not prove which request or layer actually dispatched to a CUTLASS kernel.

## Example

A serving engine repeatedly multiplies a small decode batch by a large weight matrix. A kernel developer compares two tile layouts at the same shape and dtype. One reduces memory traffic but consumes more shared memory, limiting concurrent blocks. Only measurement reveals whether that trade improves the complete operation.

## Why it matters here

CUTLASS is an implementation toolkit used in attention, quantization, and GEMM kernels inside inference engines. Its kernel-building abstractions implement operations within model architectures and across supported precision formats. Record shapes, compiler settings, hardware, correctness tolerances, and profiler evidence before attributing a speedup to it. A fast isolated kernel can still lose when launch or communication costs dominate the surrounding workload.

## Related terms

- [CUDA](glossary://cuda)
- [GEMM](glossary://gemm)
- [cuBLAS](glossary://cublas)
- [Tensor Core](glossary://tensor-core)
- [Fused kernel](glossary://fused-kernel)
- [PTX](glossary://ptx)
