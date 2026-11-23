---
title: Memory bandwidth
aliases: ["GPU memory bandwidth", "device memory bandwidth"]
importance: 88
---
**Memory bandwidth** is the rate at which data moves between memory and a processor, commonly measured in bytes per second. During autoregressive language-model decoding, a small batch can spend much of each generation step streaming model weights and cached attention state from device memory. In that regime, arithmetic units remain underused because data arrives more slowly than they can consume it.

## A useful decode ceiling

When each generated token requires streaming approximately $W$ bytes of weights, an optimistic single-sequence ceiling is:

$$
\text{tokens per second} \lesssim \frac{\text{sustained memory bandwidth}}{W}
$$

This ignores cache reads, kernel launches, synchronization, sampling, and imperfect utilization, so observed throughput is usually lower. Larger batches reuse the same weight reads across multiple requests, increasing useful work per byte. Quantization can reduce bytes per weight, but only if the runtime's packing and dequantization path support efficient execution.


## Example

A checkpoint that requires 14 GB of weight reads per token on a device sustaining 1.4 TB/s has an idealized upper bound near 100 generated tokens per second for one sequence. A four-bit representation that streams roughly 3.5 GB per step could raise that bandwidth-only ceiling. Measure KV-cache reads, dequantization, batching, and kernel efficiency to determine the actual speedup under the target traffic shape.

## Why it matters here

Serving lessons distinguish compute-heavy prompt prefill from bandwidth-sensitive decode. That distinction explains why continuous batching, lower-bit weights, cache layout, and prefill/decode isolation affect throughput differently from simply adding more theoretical floating-point operations.

## Related terms

- [HBM](glossary://hbm)
- [Arithmetic intensity](glossary://arithmetic-intensity)
- [Roofline model](glossary://roofline-model)
- [Decode phase](glossary://decode-phase)
