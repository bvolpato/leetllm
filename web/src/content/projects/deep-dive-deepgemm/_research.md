# Research notes: DeepGEMM tile contracts and workload-specific Mega MoE

## What this project study needs to establish

Separate DeepGEMM's actual low-precision matrix-multiply, indexer, grouped-expert, and communication-overlap implementation from claims about the model architecture, serving engine, or end-to-end application speed.

## Primary source map by claim type

- The DeepGEMM repository defines exported GEMM families, architecture-specific layouts, input scales, JIT behavior, hardware/toolchain requirements, and current examples: https://github.com/deepseek-ai/DeepGEMM
- The Mega MoE implementation pull request is the engineering record for communication-compute overlap and feature scope: https://github.com/deepseek-ai/DeepGEMM/pull/304
- The benchmark pull request defines the measured expert-parallel topology, token counts, timing setup, and interpretation of the reported numbers: https://github.com/deepseek-ai/DeepGEMM/pull/316
- The DeepSeek-V3 technical report establishes the sparse-MoE motivation, 671B total versus 37B activated parameters, and model architecture behind the earlier workload: https://arxiv.org/abs/2412.19437
- The pinned repository license supports the kernel-library source-license claim independently of model and dataset licensing: https://github.com/deepseek-ai/DeepGEMM/blob/559d79fb6994a58b8a15b4b93bf13ccc16edf247/LICENSE
- NVIDIA's CUDA programming guide is the first-party execution-model reference when explaining kernels, asynchronous work, and device scheduling: https://docs.nvidia.com/cuda/cuda-programming-guide/

## Exact arithmetic and layout checks

For NT GEMM, `A[M,K] @ B[N,K].T` produces `D[M,N]`. With `M=512`, `N=4096`, and `K=4096`, the operation performs `8,589,934,592` multiply-add pairs, or `17,179,869,184` FLOPs under the two-FLOP convention. Dividing by `10` microseconds yields about `1,718` TFLOP/s for that hypothetical kernel time, not a reported universal benchmark.

The article's Flash-shaped fixture uses `256` experts, top-k `6`, hidden size `4096`, intermediate size `2048`, and expert-parallel size `8`, yielding `32` experts per rank. `512` tokens per rank across `8` ranks means `4,096` node-level tokens. Preserve the distinction between per-rank and full-node denominators.

SM90 FP8 paths and SM100 FP8/FP4 paths can require different scale types, packed layouts, K-group widths, and CUDA toolchains. UE8M0 packing, Tensor Memory Accelerator stride constraints, tensor-memory usage, and `tcgen05` belong to the supported architecture path; a tensor with the right mathematical values can still violate the required physical layout.

## Evidence limits

DeepGEMM doesn't own request scheduling, HTTP serving, training convergence, or model licensing. A successful isolated GEMM microbenchmark doesn't establish product latency or expert-routing correctness. Mega MoE support, PyTorch minimums, CUDA requirements, pull-request status, model checkpoint shapes, and hardware availability change with the checked commit and must be reverified before publication.

## Manual recheck: September 23, 2026

- Kept the July source pin and checked its README requirements, complete license, compiler selection/cache publication/local-memory check, indexer wrapper/cleanup/compressed allocation, Mega MoE recipe/dtype/architecture assertions, and Python symmetric allocation/rendezvous/interleaving selections.
- Read selected SM100 tile TMA-wait, shared-to-TMEM scale-copy, and matrix-instruction code, plus scheduler warmup/task-publication ordering. The figures show one selected path and invented dependency-preserving durations, not a GPU trace.
- Rechecked April PR #304's capability constraints and the complete PR #316 benchmark description/tables and merge date. Read pinned test selections for optional baseline imports, conditional correctness checks, FLOP/byte estimates, and reporting: printed bandwidth isn't measured physical traffic. No missing historical GPU environment was invented.
- Read the complete current 205-line README at `78b69000794d0937b47ae3387eff7663410264d1`. Updated PyTorch/CUDA/C++ standard-library requirements, current FP8-weight mode, cache roots and prefixed-setting fallback. Checked the configured alignment default of 128 against the theoretical SM100 helper's 256 and ignored `expected_m`. Preserved July requirements as historical facts rather than current install advice.
- Read the full September announcement body at https://github.com/deepseek-ai/DeepGEMM/pull/432 (merged September 10), actual DeepJIT integration, determinism configuration/default and mHC split-selector selections, sparse non-paged metadata/output contracts, and Mega Gate/mHC API descriptions. Added a batch-invariance exercise and question; copied no announced speedup into the April benchmark.
- Verified the actual DeepJIT submodule SHA `e5bdee2bc4ca519eba00cfc5f0c6e950e6a96a16`. Read its shared-cache/compiler and CUDA-digest/dump/implicit-input selections: https://github.com/deepseek-ai/DeepJIT/blob/e5bdee2bc4ca519eba00cfc5f0c6e950e6a96a16/README.md. Its cache contract agrees with the same selected portions of September 22 HEAD, but the citation uses the submodule. No assertion that a cache key captures every environment input.
- Read V3's parameter-count abstract, V3.2 weighted-ReLU/top-k architecture selections, and current V4 abstract. Reused earlier GPU-kernel/profiling reviews' stable CUDA, sanitizer, and Nsight distinctions; rechecked the PTX scale-factor/TMEM selection. Relevant selections read, not every full linked source.
- All four marked CPU references pass. No DeepGEMM/DeepJIT installation, real low-bit cast, GPU kernel, symmetric-memory process group, distributed benchmark, sanitizer run, model-quality evaluation, or deployment was performed.
