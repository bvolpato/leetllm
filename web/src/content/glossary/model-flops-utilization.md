---
title: Model FLOPs utilization
aliases: ["MFU", "model FLOP utilization"]
importance: 73
---
**Model FLOPs utilization (MFU)** estimates the fraction of an accelerator's theoretical floating-point throughput consumed by the model's useful mathematical work. It compares model FLOPs per processed unit and observed processing rate with the hardware's peak supported FLOPs. A low value can signal stalls or inefficient kernels, but it can also be the expected result of a memory-bandwidth-bound decode workload.

## Utilization needs a named numerator

A simplified estimate is:

$$
\operatorname{MFU} = \frac{\text{useful model FLOPs per token}\times\text{tokens per second}}{\text{hardware peak FLOPs per second}}
$$

The numerator should describe intended model operations, not blindly count extra work introduced by recomputation, padding, or an inefficient kernel. Peak FLOPs depend on accelerator, numeric precision, sparsity assumptions, and the hardware features actually used. For aggregate multi-accelerator throughput, divide by the sum of all participating accelerators' matching peaks; per-device throughput needs a per-device denominator. Training FLOPs include forward and backward work, whereas inference FLOPs do not. Comparing a BF16 workload against an unrelated advertised sparse FP8 peak produces a misleading utilization number.


## Example

Suppose a model needs an estimated 20 billion useful floating-point operations per output token and a server generates 100 tokens per second. That is 2 trillion useful FLOPs per second. Against a matching 20-trillion-FLOP-per-second hardware ceiling, the simplified MFU is 10%. If memory bandwidth is saturated during small-batch decode, adding more tensor-core capacity won't necessarily improve that number. Batching requests or reducing weight traffic may increase useful throughput even though the workload never approaches the accelerator's compute peak.

## Why it matters here

Continuous-batching and deployment lessons distinguish occupied request slots, GPU busy time, memory bandwidth, and model arithmetic utilization. A full batch can still have low MFU when decode waits for weights or KV state, so capacity decisions must combine utilization with queues, latency, and memory measurements.

## Related terms

- [Arithmetic intensity](glossary://arithmetic-intensity)
- [Roofline model](glossary://roofline-model)
- [GPU](glossary://gpu)
- [Tokens per second](glossary://tokens-per-second)
