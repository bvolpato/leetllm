---
title: Streaming multiprocessor
aliases: ["streaming multiprocessors", "SM"]
importance: 85
---

A streaming multiprocessor (SM) is an NVIDIA GPU execution unit that schedules thread blocks and warps while sharing local resources such as registers, shared memory, instruction pipelines, and specialized compute units. A GPU contains many SMs, and the device scheduler distributes eligible thread blocks across them. SM count contributes to available parallel execution; model speed, memory bandwidth, and useful occupancy also depend on workload and resource use.

## Occupancy and resource contention

An SM can host multiple blocks only when their combined thread, register, and shared-memory requirements fit its hardware limits. A kernel with large tiles may run fewer blocks concurrently. That lower occupancy can still be worthwhile if the larger tile avoids expensive global-memory traffic. Conversely, a communication kernel that occupies too many SMs can delay expert matrix multiplication even while its own bandwidth improves.


Occupancy is the ratio of active warps to the maximum supported active warps. Interpret it alongside latency hiding, memory traffic, synchronization, instruction mix, and other concurrently running kernels to determine whether higher occupancy helps. An SM identifier such as `SM90` can also name an architecture capability in documentation; that label describes the hardware generation, not a count of multiprocessors.

## Example

A device might support 2,048 resident threads per multiprocessor. Two blocks with 768 threads each occupy 1,536 resident threads, or 75% of that thread-based limit. A third identical block cannot fit because it would require 2,304 threads. If each block also needs substantial shared memory, the shared-memory limit may reduce residency even further. DeepEP's communication-SM budget therefore needs to be interpreted alongside expert compute and actual routing skew.

## Why it matters here

DeepEP explicitly trades communication SMs against expert computation, DeepGEMM selects architecture-specific tiles, and FlashAttention uses warp specialization to overlap memory movement with arithmetic. Understanding SM ownership prevents readers from confusing a faster standalone communication benchmark with a faster end-to-end mixture-of-experts layer.

## Related terms

- [CUDA kernel](glossary://cuda-kernel)
- [CUDA warp](glossary://cuda-warp)
- [SRAM](glossary://sram)
- [Tensor Memory Accelerator](glossary://tma)
