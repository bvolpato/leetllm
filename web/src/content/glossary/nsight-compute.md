---
title: Nsight Compute
importance: 63
kind: code
---
**Nsight Compute** is NVIDIA kernel profiler that reports instruction, memory, occupancy, Tensor Core, cache, and warp-level behavior for selected CUDA kernels.

Use it after timeline profile identifies important kernel. Capturing every kernel in full training step is expensive and noisy. Isolate representative attention, expert GEMM, or fused optimizer kernel and compare achieved behavior against shape and hardware limits.

Collecting many counters can require replaying kernels or the application, saving and restoring memory, and changing cache state or concurrency. Record the replay and cache-control settings because they affect counter-heavy profiles. Confirm end-to-end latency improvements with a separate representative benchmark.

## Reading report

Start with duration and launch dimensions, then inspect compute and memory throughput, achieved occupancy, warp stalls, cache hit rates, and roofline position. High occupancy can coexist with wasted hardware when memory access diverges or matrix dimensions are skinny. Compare same kernel name and input shape across builds because compiler specialization changes counters and instruction mix.


## Example

Profile one grouped expert GEMM after Nsight Systems identifies it as dominant. Tensor Core activity and memory throughput show whether shape, occupancy, or HBM limits it.

## Why it matters here

Kernel-level counters prevent vague “GPU is slow” diagnosis. They should be used after phase and kernel are proven material to end-to-end goodput.

## Related terms

- [Nsight Systems](glossary://nsight-systems)
- [Tensor Core](glossary://tensor-core)
- [HBM](glossary://hbm)
- [CUDA](glossary://cuda)
