---
title: TileLang
aliases: ["Tile Language", "tile-lang"]
importance: 61
kind: code
---
**TileLang** is a domain-specific language and compiler stack for writing high-performance GPU, CPU, and accelerator kernels through tiled tensor programs. Its Pythonic frontend uses TVM-based compiler infrastructure. For GPU kernels, authors describe tiles, memory movement, and compute structure at a higher level than raw CUDA while retaining hardware-aware scheduling control. Available operations and targets depend on the backend and release.

TileLang compiles mathematical kernel programs for supported targets. Surrounding frameworks still own autograd, process groups, batching, and model state.

## Tiled execution

Large tensor operations are divided into tiles that fit shared memory and registers. A kernel loads tiles from global memory, performs computation, and writes results back. Performance depends on coalesced access, reuse, synchronization, occupancy, and target architecture.

## Example

A sparse-attention implementation can express its top-k selector or attention kernel in TileLang and compile it for a supported GPU, including supported Blackwell paths. For a concrete tiling choice, a $1024\times1024$ GEMM output divided into $128\times128$ tiles has $8\times8=64$ output tiles; each accumulates over tiles of the reduction axis. Edge tiles need bounds handling when dimensions are not multiples of tile sizes. First-run compilation and cache compatibility are separate from steady-state kernel time.

## Why it matters here

Kernel-engineering lessons use TileLang to connect the mathematical operation with memory movement, tile sizes, and synchronization. For sparse DSA, profiles should separate compilation, top-k selection, cross-GPU gathering when applicable, and sparse attention execution; a particular trainer's architecture flags are integration details rather than a TileLang-wide contract.

Primary reference: [TileLang project](https://github.com/tile-ai/tilelang).

## Related terms

- [CUDA](glossary://cuda)
- [Triton language](glossary://triton-language)
- [DeepSeek Sparse Attention](glossary://deepseek-sparse-attention)
- [GEMM](glossary://gemm)
- [PyTorch](glossary://pytorch)
