---
title: Parallelism
importance: 90
---
Parallelism is the practice of splitting work so multiple processors (usually GPUs) make progress on it at the same time. In AI/ML and LLM systems that means partitioning **data**, **model state**, **layer depth**, **sequence length**, or **experts** across ranks, then using collectives or point-to-point messages so the combined result matches (or intentionally approximates) a single-device run.

Parallelism runs work on multiple processors at once. Concurrency interleaves tasks that may still take turns on one device (async I/O, request queues, continuous batching). Distributed parallelism can raise throughput, cut wall time, or fit a model that one accelerator cannot hold. It adds communication, load imbalance, and more complex failure modes.

In modern LLM stacks the word almost always means a **topology**: how many ranks form a data-parallel group, how matrices split inside a layer, how layers stage across devices, and (for MoE or long context) how experts or sequence chunks are sharded. Frameworks such as Megatron-LM, DeepSpeed, FSDP, and vLLM expose integer degrees with framework-specific grouping rules. Independent axes multiply; an axis nested within an existing group does not add another world-size factor.

## Intuition

Start from a single GPU that cannot hit your tokens/sec target or cannot hold weights plus activations (and, in training, optimizer state). The classic training layout has three axes; long context and MoE add two more:

| Pressure | First axis to try | What you split |
| --- | --- | --- |
| Too many examples / tokens per step | Data parallelism | The batch across replicas |
| Layer too wide or memory-heavy | Tensor (intra-layer) parallelism | Weight matrices and activations inside a layer |
| Model too deep for one device | Pipeline (inter-layer) parallelism | Contiguous layer ranges across stages |
| MoE experts do not fit | Expert parallelism | Expert modules across ranks |
| Sequence / context too long | Sequence or context parallelism | Sequence-dimension work or activations |

**Data parallelism** multiplies replicas (or sharded replicas) so each rank trains or serves different inputs. **Model parallelism** keeps one logical model but partitions its parameters or activations. Tensor and pipeline parallelism are the two main model-parallel styles; expert, sequence, and context parallelism are specialized variants used heavily for MoE and long-context transformers.

When you compose tensor, pipeline, and data parallelism you get classic **3D parallelism** from Megatron-scale training: tensor groups stay on fast links (often within a node), pipeline stages span nodes with cheaper point-to-point traffic, and data-parallel groups multiply replicas for tokens/sec.

In Megatron, **sequence parallelism** shards selected activations along the sequence dimension within an existing tensor-parallel group, such as around LayerNorm and dropout. It does not add an independent world-size factor. **Context parallelism** partitions the input sequence across a separate group and exchanges the information attention needs across those partitions. Check which meaning a framework uses before multiplying degrees.

| Constraint | Partition or scaling choice |
| --- | --- |
| One GPU fits; need throughput | Data parallel replicas |
| Per-layer width or memory | Tensor parallelism inside layers |
| Model depth across devices | Pipeline stages |
| Long sequence state | Context or sequence parallelism |

Compose degrees so their product divides the world size, then budget the required collectives and point-to-point traffic.

## How it works

1. **Choose the pressure.** Fit problem (weights, activations, KV cache, optimizer) versus throughput problem (global batch, concurrent requests). Wrong axis wastes interconnect without fixing the wall.
2. **Pick degrees that match hardware.** Keep high-bandwidth collectives (tensor-parallel all-reduces every layer) on NVLink/NVSwitch. Prefer pipeline or data-parallel scale-out across nodes. Sequence/context parallel when activation or attention memory grows with length.
3. **Partition state and work.** Each rank owns a shard or a microbatch slice. Training still needs a correct gradient or optimizer semantics (all-reduce, reduce-scatter, flush-before-step). Inference needs a correct forward graph and, for decode, low-latency per-token collectives.
4. **Communicate.** [NCCL](glossary://nccl) (or equivalent) moves gradients, parameters, activations, or KV pieces. Profile communication time alongside FLOPs because it contributes directly to step time.
5. **Measure end-to-end.** Tokens/sec, step time, bubble fraction, collective time, HBM occupancy, and TTFT/TPS for serving. Communication and imbalance commonly make scaling sublinear.

Sharded data-parallel methods such as [ZeRO](glossary://zero) and [FSDP](glossary://fsdp) still *are* data parallelism: they split the batch, then also partition optimizer state (and often grads and params) so per-rank memory scales down. Combine them with tensor or pipeline splits when a single layer or the full model depth still exceeds device capacity.

## Formula

**World size product (dense layout).** With pipeline degree $p$, tensor degree $t$, and data-parallel degree $d$:

$$
N_{\mathrm{GPU}} = p \times t \times d
$$

With context-parallel degree $c$ as well (Megatron-style accounting):

$$
d = \frac{N_{\mathrm{GPU}}}{t \times p \times c}
$$

The product of independent degrees must divide the world size cleanly; divisibility of each degree alone is insufficient. For MoE, expert parallelism may reuse ranks already assigned to dense layers rather than add another free factor to that denominator. With no context parallelism and matching dense/expert tensor degrees, a common layout nests expert degree $e$ within data parallelism ($e$ divides $d$). Current Megatron can give expert layers a different tensor-parallel degree and rank grid, so check its parallel-state rules before extending that relation to other layouts.

**Amdahl upper bound (fixed work).** If fraction $f$ of wall time is parallelizable and you use $N$ workers with ideal load balance and zero communication:

$$
S(N) = \frac{1}{(1-f) + \frac{f}{N}} \le \frac{1}{1-f}
$$

Real distributed training and serving also pay communication and imbalance, so observed speedup is lower. Treat Amdahl as a ceiling on how much a purely serial fraction (orchestration, unoverlapped collectives, single-rank bottlenecks) can ever improve.

**Scaling efficiency.** If $T_1$ is single-replica time for a fixed workload and $T_N$ is time on $N$ workers:

$$
\eta = \frac{T_1}{N\, T_N}
$$

$\eta \approx 1$ means near-linear scaling. In practice $\eta$ falls as collective volume, pipeline bubble, or stragglers grow.

**Pipeline bubble vs ideal work** (equal stages, non-interleaved GPipe / 1F1B; Megatron-LM form). With $p$ stages and $m$ microbatches, fill-plus-drain idle time relative to useful microbatch work is:

$$
\frac{t_{\mathrm{bubble}}}{t_{\mathrm{ideal}}} = \frac{p-1}{m}
$$

As a share of total step wall time the same schedule gives $(p-1)/(m+p-1)$. Raise $m$ (or interleave model chunks) to shrink the bubble; you pay activation memory or a larger global batch.

## Example

You pretrain a dense decoder-only model on **64** GPUs (8 nodes × 8 GPUs). Topology:

- Tensor parallel $t = 8$ (one full node; collectives stay on NVLink)
- Pipeline parallel $p = 4$ (four stages across nodes)
- Data parallel $d = 2$

$$
N = 4 \times 8 \times 2 = 64
$$

Each pipeline stage holds one quarter of the transformer blocks. Global batch is 256 sequences; each data-parallel group sees 128 sequences per step, cut into $m = 32$ microbatches. Ideal pipeline bubble versus useful work is $(4-1)/32 \approx 9\%$. Gradient sync for the DP group runs after the pipeline flush (or via a distributed optimizer on each stage's shards).

Same numbers, different *serving* read: for a single replica, vLLM-style guidance is often "use one GPU if the model fits; else raise tensor parallel on one node; if still too large, add pipeline parallel across nodes," then scale *replicas* (data parallel at the serving layer) for QPS. Decode is sensitive to per-token TP all-reduces, so oversizing $t$ can *hurt* tokens/sec even when memory looks fine.

```python
# Conceptual layout check (training world)
world_size = 64
tensor_parallel_size = 8
pipeline_parallel_size = 4
context_parallel_size = 1
assert world_size % (tensor_parallel_size * pipeline_parallel_size * context_parallel_size) == 0
data_parallel_size = world_size // (
    tensor_parallel_size * pipeline_parallel_size * context_parallel_size
)
# data_parallel_size == 2
```

## Trade-offs

| Axis | Wins | Costs |
| --- | --- | --- |
| Data parallel | Throughput, simple mental model | Replicates (or shards) state; all-reduce / reduce-scatter volume; global batch grows with $d$ |
| Tensor parallel | Fits wide layers; cuts per-GPU activation size | Collectives every layer; needs fast interconnect; decode latency risk |
| Pipeline parallel | Fits deep models; P2P across nodes | Bubble idle time; stage balance; microbatch and activation memory |
| Expert parallel | MoE capacity without full dense FLOPs | Token routing traffic; load imbalance across experts |
| Sequence / context parallel | Long-context activation / attention memory | Extra collectives along sequence; more complex attention kernels |

Prefer the smallest topology that meets memory and SLO targets. Extra parallel degree that does not relieve a real bottleneck usually adds communication without proportional speedup.

## Why it matters here

Almost every multi-GPU lesson on LeetLLM (FSDP/ZeRO, Megatron, model parallelism for inference, MoE serving, NCCL debugging) assumes you can name *which* axis is active and what it costs. Parallelism is the shared vocabulary: data for batch and replicas, tensor for width, pipeline for depth, plus expert and context when the architecture or sequence length demands them. In production, wrong topology shows up as OOM on one rank, sublinear tokens/sec, pipeline bubble, or NCCL timeouts long before the math in the paper looks wrong.

## Related terms

- [Data parallelism](glossary://data-parallelism)
- [Tensor parallelism](glossary://tensor-parallelism)
- [Pipeline parallelism](glossary://pipeline-parallelism)
- [NCCL](glossary://nccl)
- [FSDP](glossary://fsdp)
