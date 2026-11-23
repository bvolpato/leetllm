---
title: VRAM
aliases: ["video random-access memory", "video RAM", "GPU memory"]
importance: 88
---
**VRAM** is memory used by a graphics processor for storing model weights, activations, key-value caches, and other device-resident data. Consumer discrete GPUs commonly use graphics DRAM, while many datacenter accelerators use high-bandwidth memory. Both are described operationally as GPU memory, but their capacity, bandwidth, and connection to the processor differ. On discrete systems, VRAM and host RAM are separate even with unified virtual addressing. Integrated unified-memory systems can share physical RAM between CPU and GPU instead.

## Runtime memory extends beyond the checkpoint

A model can fit as a file and still fail during inference. The complete device allocation includes weights, the growing KV cache, intermediate tensors, runtime workspaces, allocator fragmentation, graph buffers, and safety headroom. Tensor parallelism may distribute some weights across devices, but replication and communication buffers still consume local memory.

$$
\text{VRAM required} \approx \text{weights}+\text{KV cache}+\text{workspaces}+\text{runtime reserve}
$$

Buying a card with more memory increases the capacity ceiling. Speed also depends on memory bandwidth and host-device transfer costs.

## Example

An eight-billion-parameter BF16 model needs roughly 16 GB for weights alone. On a 24 GB GPU, only about 8 GB remains before runtime buffers and the KV cache are counted. A four-bit weight checkpoint might reduce raw weight storage to approximately 4 GB, leaving considerably more room for longer prompts or additional simultaneous sequences. Confirm actual usage with the runtime's memory metrics rather than subtracting the downloaded file size from the marketing capacity.

## Why it matters here

Deployment, quantization, batching, and long-context lessons all use VRAM as the admission constraint. Correct sizing explains why a single request succeeds while a second concurrent request causes an out-of-memory error.

## Related terms

- [GPU](glossary://gpu)
- [HBM](glossary://hbm)
- [KV cache](glossary://kv-cache)
- [Quantization](glossary://quantization)
