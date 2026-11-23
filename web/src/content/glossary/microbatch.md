---
title: Microbatch
aliases: ["micro-batch"]
importance: 80
---
A **microbatch** is the smallest batch slice processed by one model replica before gradients are accumulated or synchronized. It exists because the desired global batch often can't fit through forward and backward in one pass.

Under model parallelism, a microbatch size of one can span several physical GPUs. TP partitions layer work, CP partitions sequence work, and EP partitions expert work. These ranks cooperate on one replica and process different shards of the same sample.

## Batch hierarchy

Microbatches accumulate into a minibatch or optimizer-step batch. In the ordinary fixed-size case, global batch size equals microbatch size per data-parallel replica times accumulation steps times the number of data-parallel replicas. TP, CP, and pipeline ranks do not supply additional independent samples in that formula. Sequence packing can place several variable-length examples inside one microbatch container, so state whether the batch unit is sequences, prompt groups, trajectories, or tokens. Weight losses accordingly when microbatches contain unequal numbers of target tokens.

## Example

With train batch size 32, microbatch size 1, and DP=1, the learner can run and accumulate 32 group records rather than pretending 64 learner GPUs created 64 independent examples at once.

## Why it matters here

Correct batch accounting links rewards, packed trajectories, gradient accumulation, and optimizer steps. Misreading microbatch size changes effective learning-rate and throughput calculations.

## Related terms

- [Gradient accumulation](glossary://gradient-accumulation)
- [Sample packing](glossary://sample-packing)
- [Data parallelism](glossary://data-parallelism)
- [Pipeline parallelism](glossary://pipeline-parallelism)
- [Tensor shape](glossary://tensor-shape)
