---
title: Expert parallelism
aliases: ["EP"]
importance: 86
---
**Expert parallelism (EP)** partitions a mixture-of-experts layer's expert modules across ranks. A router chooses experts for each token, dispatches token representations to the ranks that own them, runs local expert MLPs, then sends weighted outputs back to the token's original path.

EP shards stored expert capacity, not ordinary attention layers. Megatron can create a separate expert process-group factorization so the same physical GPUs look like TP×CP ranks in dense regions and an EP group inside sparse MoE regions.

## Dispatch path

Expert routing usually produces an all-to-all communication pattern. Performance depends on token balance, message size, dispatcher implementation, grouped GEMMs, and whether the EP group stays inside a fast fabric. One overloaded rank can delay the whole layer.


## Example

GLM-5.3 has 256 routed experts per sparse layer. EP=64 places four routed experts on each rank when ownership is uniform. A token choosing eight experts may visit several ranks before its outputs are combined.

## Why it matters here

The masterclass's candidate EP64 layout divides expert storage instead of making 64 independent model replicas. It doesn't prove that the complete training allocation fits: optimizer states, dense layers, activations, communication buffers, and offload still need accounting. Measure dispatch and combine time before declaring EP the dominant bottleneck.

## Related terms

- [Mixture of experts](glossary://mixture-of-experts)
- [MoE router](glossary://moe-router)
- [Expert tensor parallelism](glossary://expert-tensor-parallelism)
- [All-to-all](glossary://all-to-all)
- [GEMM](glossary://gemm)
- [NVIDIA Megatron](glossary://nvidia-megatron)
