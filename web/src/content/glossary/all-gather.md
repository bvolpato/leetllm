---
title: All-gather
aliases: ["allgather"]
importance: 80
---
**All-gather** is a collective operation that collects a different tensor shard from every rank and makes the concatenated set available on every rank. It moves data without reducing values together.

If rank 0 holds shard A, rank 1 holds B, and rank 2 holds C, all-gather leaves all three ranks with [A, B, C]. The concatenation dimension and shard shapes are part of the caller's contract.

## Where it appears

Tensor and sequence parallelism use all-gather when a later operation needs a full activation assembled from local shards. Distributed optimizers may all-gather updated parameter shards. Context parallel attention can also gather remote K/V segments, though ring or hybrid exchanges may overlap better.


## Example

Three ranks each hold 1,024 hidden features for the same token positions. An all-gather across the feature dimension reconstructs a 3,072-feature activation on every participant before an operation that expects the full vector.

## Why it matters here

The GLM-5.3 masterclass examines a CP-aware all-gather path for sparse DSA selection. That gather must account for padding and global position identity so top-k context indexes still refer to the correct tokens. A collective that completes without error can still produce incorrect attention if shard-local indexes are mistaken for global positions.

## Related terms

- [Reduce-scatter](glossary://reduce-scatter)
- [All-reduce](glossary://all-reduce)
- [Context parallelism](glossary://context-parallelism)
- [Sequence parallelism](glossary://sequence-parallelism)
- [NCCL](glossary://nccl)
