---
{
  "id": "distributed-training-fsdp-deepspeed-zero",
  "title": "Distributed Training: FSDP & ZeRO",
  "slug": "distributed-training-fsdp-deepspeed-zero",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/distributed_training_dark.png",
  "companies": [
    "Meta",
    "Google",
    "Microsoft",
    "Nvidia",
    "OpenAI"
  ],
  "shortDescription": "One replicated 70B AdamW state exceeds an 80 GB GPU. Shard the optimizer, gradients, and parameters, then see when the layer or the sequence still has to be split.",
  "keyConceptsTested": [
    "ZeRO stages (1, 2, 3) memory savings",
    "FSDP1 vs FSDP2 fully_shard and DTensors",
    "reshard_after_forward lifecycle and prefetching",
    "16-byte mixed precision AdamW memory breakdown",
    "4D parallelism topology (DP, TP, PP, CP)",
    "Megatron-LM ColumnParallel and RowParallel tensor parallelism",
    "1F1B pipeline schedule and bubble mechanics",
    "Context parallelism with Ring Attention",
    "NCCL collective primitives: All-Reduce, Reduce-Scatter, and All-Gather",
    "NVLink vs InfiniBand interconnect hierarchy"
  ],
  "prerequisites": [
    "supervised-fine-tuning-pipeline",
    "mixed-precision-training-loss-scaling",
    "pytorch-training-loops",
    "cuda-gpu-computing-for-ml"
  ],
  "section": "Advanced Training & Adaptation",
  "order": 8
}
---

Suppose you have two 8-GPU nodes providing sixteen 80 GB GPUs (1,280 GB aggregate HBM). You want to train a 70-billion-parameter (70B) model using AdamW in mixed precision. Why can't ordinary Distributed Data Parallel (DDP) use that combined capacity? Even a single BF16 parameter replica needs 140 GB, so placing it on any one of these GPUs already fails before activation or optimizer allocations begin. Ordinary DDP replicates the entire model state on every rank, meaning that adding more GPUs simply multiplies identical memory bottlenecks rather than partitioning them.

The combined 1,280 GB cannot help until that model state is split across the GPUs. Fully Sharded Data Parallel (FSDP) and ZeRO (Zero Redundancy Optimizer) shard the state instead of copying it, trading redundant memory footprint for structured collective communication.

Tracking memory across a 70-billion-parameter model grounds these mechanics in concrete numbers. Under standard mixed-precision conventions used in ZeRO analysis, training employs low-precision parameters and gradients alongside an FP32 master copy and FP32 Adam moments.[^rajbhandari2020] Under this baseline recipe, each parameter requires **16 bytes of model-state memory** before activations, workspace buffers, or allocator overhead:

- **2 bytes** for the BF16 (`bfloat16`, short for Brain Floating Point) or FP16 (16-bit half precision) weight, used in high-throughput Tensor Core matrix multiplications.
- **2 bytes** for the BF16 / FP16 gradient, computed during backward propagation.
- **4 bytes** for an FP32 master parameter copy in this recipe. It reduces the rounding loss from updating low-precision stored weights. It doesn't preserve arbitrarily small updates: subtracting `1e-8` from a weight of `1.0` rounds back to `1.0` even in FP32. The issue is the spacing around the weight, which differs from whether the update itself is representable.
- **4 bytes** for Adam's first moment ($m_t$), the running exponential moving average of past gradients (momentum).
- **4 bytes** for Adam's second moment ($v_t$), the running exponential moving average of squared gradients (an uncentered second moment).

For a 1B model, that's **16 GB of model states** alone. Scale this recipe to 7B parameters and it reaches **112 GB**. At 70B parameters, it is **1.12 TB** before activations. Those totals describe the buffers when they exist; ordinary PyTorch AdamW creates its moment buffers lazily at the first update. The 140 GB parameter replica already explains the startup failure on an 80 GB GPU.

To see which numerical precision preserves small gradient updates, consider a decrement of `1e-4` at `1.0`. The following experiment performs subtraction in FP32 before rounding to the candidate parameter storage format, isolating rounding behavior without confounding AdamW optimizer dynamics:

<!-- leetllm: test, deps=torch, output=show, output_title="Stored update output" -->
```python title="stored_parameter_updates.py"
import torch

for name, dtype in [("FP16", torch.float16), ("BF16", torch.bfloat16), ("FP32", torch.float32)]:
    weight = torch.tensor(1.0, dtype=dtype)
    below = torch.nextafter(weight, torch.tensor(0.0, dtype=dtype))
    gap_below = (weight - below).item()
    tiny = (weight.float() - 1e-8).to(dtype)
    larger = (weight.float() - 1e-4).to(dtype)
    assert tiny.item() == 1.0
    assert (larger.item() != 1.0) == (dtype == torch.float32)
    print(f"{name}: gap_below_1={gap_below:.3e}, 1e-8_survives={tiny.item() != 1.0}, 1e-4_survives={larger.item() != 1.0}")
```

<!-- leetllm: output:start -->
```text title="Stored update output" output compact
FP16: gap_below_1=4.883e-04, 1e-8_survives=False, 1e-4_survives=False
BF16: gap_below_1=3.906e-03, 1e-8_survives=False, 1e-4_survives=False
FP32: gap_below_1=5.960e-08, 1e-8_survives=False, 1e-4_survives=True
```
<!-- leetllm: output:end -->

At this power-of-two boundary, the gap below `1.0` is half the gap above it. With round-to-nearest-even, a decrement below half the downward gap disappears. FP32 offers finer spacing, not exact accumulation of every increment. Low-precision optimizer methods with stochastic rounding are another design choice, discussed in the preceding lesson; this sixteen-byte inventory is one convention rather than a universal requirement.

Sharding that `16 GB` evenly across eight data-parallel ranks suggests `2 GB` of steady-state model state per rank, not a `2 GB` peak allocation. The currently gathered layer, activations, communication buffers, and allocator overhead still need their own memory budget. The accompanying figure tracks only model states, keeping activations and transient buffers outside the columns because sharding model states alone does not remove those execution costs.

<figure>
  <img src="illustrations/_generated/distributed_training_dark.png" alt="Four same-scale stacked bars show model-state ownership per GPU for a 70B, 16-byte recipe in an eight-rank data-parallel group. DDP stores P=140, G=140, O=840 GB for 1,120 total. ZeRO-1 stores P=140, G=140, O=105 for 385 GB. ZeRO-2 stores P=140, G=17.5, O=105 for 262.5 GB. ZeRO-3 stores P=17.5, G=17.5, O=105 for 140 GB. P is parameters, G gradients, and O the FP32 master plus Adam moments; bars share a 0–1,120 GB axis." />
  <figcaption>Each row uses the same 0–1,120 GB model-state scale for N = 8. P, G, and O mean parameters, gradients, and <span data-glossary="optimizer-state">optimizer state</span> under the stated 16-byte recipe. The chart shows storage ownership; the implementation's collective schedule depends on the strategy and runtime.</figcaption>
</figure>

## The memory wall in numbers

In this mixed-precision recipe, the FP32 master weight and two Adam moments demand twelve bytes per parameter, dwarfing the two bytes needed for compute weights. Evaluating the model-state inventory for a 70B parameter model demonstrates why standard data parallelism fails immediately without parameter partitioning:

- Weights: $70 \times 10^9 \times 2 \text{ bytes} \approx$ **140 GB**
- Gradients: $70 \times 10^9 \times 2 \text{ bytes} \approx$ **140 GB**
- Adam state + FP32 master weights: $70 \times 10^9 \times (4 + 4 + 4) \text{ bytes} \approx$ **840 GB**

That produces roughly **1.12 TB of model states** before activations, temporary buffers, or allocator overhead. Optimizer states and master weights ($840\text{ GB}$) consume $75\%$ of this total inventory. The arithmetic is small enough to turn into a quick executable verification function:

<!-- leetllm: test, output=show, output_title="Model-state memory output" -->
```python title="the-memory-wall-in-numbers.py"
GB = 10**9

def state_memory_gb(params_billions: float, bytes_per_param: int) -> float:
    return params_billions * 1_000_000_000 * bytes_per_param / GB

recipe_bytes = {
    "low_precision_parameters": 2,
    "low_precision_gradients": 2,
    "fp32_master_and_adam": 12,
}
weights = state_memory_gb(70, recipe_bytes["low_precision_parameters"])
gradients = state_memory_gb(70, recipe_bytes["low_precision_gradients"])
optimizer_and_master = state_memory_gb(70, recipe_bytes["fp32_master_and_adam"])
total_model_states = weights + gradients + optimizer_and_master
zero3_per_gpu = total_model_states / 256

print("bytes_per_parameter=", sum(recipe_bytes.values()))
print(f"weights={weights:.0f} GB")
print(f"optimizer_and_master={optimizer_and_master:.0f} GB")
print(f"total_model_states={total_model_states:.0f} GB")
print(f"ZeRO-3 model states per GPU on 256 GPUs: {zero3_per_gpu:.2f} GB")
```

<!-- leetllm: output:start -->
```text title="Model-state memory output" output compact
bytes_per_parameter= 16
weights=140 GB
optimizer_and_master=840 GB
total_model_states=1120 GB
ZeRO-3 model states per GPU on 256 GPUs: 4.38 GB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/model_state_memory_wall_dark.png" alt="The stated 70B recipe totals 1,120 decimal GB of model states: parameters 140, gradients 140, FP32 master parameters 280, and Adam moments 560. A shared 0–560 GB component scale shows each amount. Below, equal sharding over 16, 32, 64, or 256 ranks uses 70, 35, 17.5, or 4.375 GB of an 80 GB capacity reference, leaving 10, 45, 62.5, or 75.625 GB as a budget for other live memory, not a fit guarantee." />
  <figcaption>The top bars compare the four parts of one specified recipe; their sum is 1,120 GB before sharding. The lower plot uses one 0–80 GB scale for ideal state per rank and the remaining capacity budget. Gathered units, activations, gradients in flight, communication buffers, and allocator costs must still fit inside the real device limit.</figcaption>
</figure>

## Why DDP hits a limit

Use the running 70B example to test the first instinct: if you add more data-parallel ranks, does each rank's model-state copy get smaller? It doesn't. Replication increases the number of copies while splitting only the input batch.

Ordinary **DDP** (Distributed Data Parallel) places a model replica on each rank, usually one process per GPU. Your sampler or input pipeline must give ranks different batches; DDP doesn't split the input for you. During backward, DDP synchronizes gradient buckets with all-reduce and, under its default behavior, averages gradients across ranks. Collectives can overlap with the remaining backward computation.[^pytorchDdpDocs2026]

For equal-size local batches and a mean loss on each rank, this produces the mean gradient of the combined batch. Unequal token counts need careful loss weighting: averaging two local means isn't generally the same as averaging all valid tokens. More ranks may improve throughput when the model fits, but don't shrink the replicated model state.

For a token-mean objective, let rank $r$ have $n_r$ valid targets and local loss sum $L_r$. With $N$ ranks and default DDP gradient averaging, backpropagate $N L_r / \sum_j n_j$ on each rank. Equivalently, multiply its local mean by $N n_r / \sum_j n_j$. The final average then differentiates the global token mean. The denominator counts unmasked targets, not padded sequence positions. A custom communication hook or join policy can change the averaging convention.[^pytorchDdpDocs2026]

Consider the loss weighting error when rank 0 evaluates one target token while rank 1 evaluates three tokens. The following cell differentiates loss terms directly and models cross-rank averaging within a single process to demonstrate why simple mean-of-means reduction skews updates:

<!-- leetllm: test, deps=torch, output=show, output_title="Rank loss weighting output" -->
```python title="unequal_rank_loss_weighting.py"
import torch

targets = [torch.tensor([1.]), torch.tensor([3., 3., 3.])]
counts = [target.numel() for target in targets]
ranks, total = len(targets), sum(counts)

def rank_gradient(target, multiplier):
    weight = torch.tensor(0., requires_grad=True)
    loss = (weight - target).square().mean() * multiplier
    return torch.autograd.grad(loss, weight)[0]

naive = torch.stack([rank_gradient(t, 1.) for t in targets]).mean()
weighted = torch.stack([
    rank_gradient(t, ranks * count / total)
    for t, count in zip(targets, counts)
]).mean()
weight = torch.tensor(0., requires_grad=True)
pooled_loss = (weight - torch.cat(targets)).square().mean()
pooled = torch.autograd.grad(pooled_loss, weight)[0]
torch.testing.assert_close(weighted, pooled)
assert naive.item() == -4. and pooled.item() == -5.
print(f"mean_of_rank_means_gradient={naive.item():.1f}")
print(f"weighted_DDP_average_gradient={weighted.item():.1f}")
print(f"pooled_target_mean_gradient={pooled.item():.1f}")
```

<!-- leetllm: output:start -->
```text title="Rank loss weighting output" output compact
mean_of_rank_means_gradient=-4.0
weighted_DDP_average_gradient=-5.0
pooled_target_mean_gradient=-5.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/ddp_token_weighting_dark.png" alt="At w=0 with squared-error loss, rank 0 has one target [1] and local mean gradient −2; rank 1 has three targets [3,3,3] and local mean gradient −6. Equal averaging of rank means gives (−2−6)/2=−4. The pooled four-target mean gives (−2−6−6−6)/4=−5, which default DDP reproduces with factors 2×1/4=0.5 and 2×3/4=1.5 when both ranks use the shared total-target denominator." />
  <figcaption>Each target contributes equally to the pooled mean, so the rank with three valid targets carries three times the weight. Default DDP first averages rank gradients; scaling each local mean by $N n_r / \sum_j n_j$ gives the same result. The example's equal-rank mean is −4, while the pooled-token mean and correctly weighted DDP mean are −5.</figcaption>
</figure>

For accumulation, count valid targets across the whole update's micro-batches and ranks. Averaging each micro-batch independently gives it equal weight regardless of its target count. All ranks must participate in the count reduction, including a rank with zero valid targets; form a zero loss sum rather than an undefined local mean. A globally empty update needs a coordinated skip before any optimizer or scheduler update.

That stops helping when the model itself is the problem. DDP replicates the full 1.12 TB of 70B model states on every rank (process/GPU). Sixteen GPUs give you sixteen copies, not a smaller copy. <span data-glossary="fsdp">FSDP</span> and ZeRO attack that redundancy by sharding model states across the data-parallel group.

ZeRO partitions model state incrementally across three distinct stages.[^rajbhandari2020] ZeRO-1 shards optimizer states, ZeRO-2 adds gradient sharding, and ZeRO-3 shards parameters as well. While DDP minimizes communication complexity at the cost of massive memory duplication, ZeRO minimizes persistent memory by introducing structured all-gather and reduce-scatter collectives throughout the training loop.

## ZeRO stages: removing redundancy one layer at a time

Each stage answers one storage question: which model state can stop being replicated while each rank still completes its update? Let $N$ be the number of ranks in the **data-parallel sharding group**, not necessarily the whole cluster. As training scales out, each successive stage removes another redundant category of model state:

### ZeRO stage 1: shard optimizer states

Under Stage 1, each GPU keeps optimizer state for only $1/N$ of the parameters, while parameters and gradients remain fully replicated across all ranks.

- Memory savings: Optimizer state drops from 840 GB total to roughly $840/N$ GB per GPU. For an 8-GPU node, that's $105\text{ GB}$ per GPU instead of 840 GB.
- Communication: Each rank updates its owned parameter partition, then shares the updated parameters. Don't count a full gradient all-reduce plus a parameter all-gather as just $2\Psi$: that schedule has three collective phases. The paper's $2\Psi$ analysis explicitly uses reduced gradient partitions plus a parameter all-gather for **stages 1 and 2 together**. Stage 1's storage policy alone doesn't determine the implementation's collectives.

### ZeRO stage 2: shard optimizer + gradients

Stage 2 extends this partitioning to gradients, ensuring each GPU owns only the gradient shard that matches its optimizer shard while maintaining replicated model weights during forward and backward compute.

- Memory savings: Optimizer states and gradients both scale down by roughly $1/N$. For an 8-GPU node, gradients drop from 140 GB to $17.5\text{ GB}$ per GPU.
- Communication: **Reduce-scatter** combines gradients across ranks and leaves each rank its owned slice. After local optimizer updates, **all-gather** distributes updated parameter slices so every rank again has full compute weights. In the paper's equal-dtype, large-group model, those two phases cost $2\Psi$, matching DDP's modeled volume. Actual DeepSpeed reductions can use different bucket schedules and collectives.

### ZeRO stage 3: shard everything

Stage 3 removes weight replication entirely by partitioning parameters across the sharding group alongside gradients and optimizer states. Because no rank maintains a full persistent copy of the model weights, parameters must be dynamically materialized right before execution and discarded immediately after.

- Memory savings: Parameters, gradients, and optimizer states are all partitioned. For the 70B example on 256 GPUs, the model-state footprint falls to about **4.4 GB per GPU** before activations.
- Communication: Parameters now have to be materialized on demand for computation.
    1. **Forward:** all-gather (collect shards from all GPUs to rebuild the full tensor) the current layer or <span data-glossary="fsdp">FSDP</span> unit, run compute, then reshard.
    2. **Backward:** all-gather that unit again, compute gradients, then reduce-scatter gradient shards. After backward and any accumulation finish, each rank's optimizer updates its owned shard.
- Trade-off: Memory scales almost linearly with the data-parallel group size, but communication becomes a first-class bottleneck. Total volume climbs to $3\Psi$, roughly 1.5x DDP.

> **ZeRO memory trade-off:** One unreplicated copy of this recipe needs 1.12 TB. DDP on $N$ ranks stores $N$ such copies; ideal ZeRO-3 approaches one copy distributed across them. Temporary materialized units, replicated small parameters, padding, and communication buffers add to that lower bound.

### Memory per GPU (70B model, 256 GPUs)

This table assumes BF16/FP16 weights and gradients with Adam states in FP32. The totals are for **model states only**. Activation memory is listed separately because it depends heavily on sequence length, hidden size, micro-batch size, checkpointing, and attention implementation.

| Component | DDP | ZeRO-1 | ZeRO-2 | ZeRO-3 |
|:----------|:----|:-------|:-------|:-------|
| Weights | 140 GB | 140 GB | 140 GB | **0.55 GB** |
| Gradients | 140 GB | 140 GB | **0.55 GB** | **0.55 GB** |
| Optimizer + FP32 master weights | 840 GB | **3.3 GB** | **3.3 GB** | **3.3 GB** |
| Activations | Extra and workload-dependent | Extra and workload-dependent | Extra and workload-dependent | Extra and workload-dependent |
| **Model states / GPU** | **1120 GB** | **283 GB** | **144 GB** | **4.4 GB** |

ZeRO-3 or `FULL_SHARD` is often paired with <span data-glossary="activation-checkpointing">activation checkpointing</span> (recomputing activations during the backward pass to save memory, also called gradient checkpointing). Sharding fixes model-state memory, but activations can still dominate the actual training footprint. Rather than copying static numbers into a sizing document, the table should be generated directly from the model recipe and cluster topology:

<!-- leetllm: test, output=show, output_title="ZeRO stage memory output" -->
```python title="zero_stage_memory.py"
state_gb = {"parameters": 140, "gradients": 140, "optimizer_and_master": 840}
world_size = 256

def per_rank_gb(stage, ranks=world_size):
    if not isinstance(ranks, int) or ranks < 1:
        raise ValueError("ranks must be a positive integer")
    sharded = {
        0: set(),
        1: {"optimizer_and_master"},
        2: {"optimizer_and_master", "gradients"},
        3: {"optimizer_and_master", "gradients", "parameters"},
    }[stage]
    return sum(value / ranks if name in sharded else value for name, value in state_gb.items())

for stage in [0, 1, 2, 3]:
    print(f"ZeRO-{stage}: {per_rank_gb(stage):.2f} GB/model-state rank")
    assert per_rank_gb(stage, ranks=1) == 1120  # One rank has no sharing benefit.
try:
    per_rank_gb(3, ranks=0)
except ValueError:
    print("zero_rank_group=rejected")
```

<!-- leetllm: output:start -->
```text title="ZeRO stage memory output" output compact
ZeRO-0: 1120.00 GB/model-state rank
ZeRO-1: 283.28 GB/model-state rank
ZeRO-2: 143.83 GB/model-state rank
ZeRO-3: 4.38 GB/model-state rank
zero_rank_group=rejected
```
<!-- leetllm: output:end -->

## Communication overhead analysis

Once model state is sharded across devices, the substantial memory savings incur a corresponding communication bill. Rather than deleting model state, ZeRO-3 distributes persistent copies across ranks and pays interconnect bandwidth whenever a layer executes. Understanding this communication overhead requires tracing how parameter shards flow through collective primitives before comparing framework configurations or cluster hardware.

### Communication primitives you need to know

The NVIDIA Collective Communications Library (NCCL) powers inter-GPU communication across clusters.[^nccl2026collectives] Three primitives form the foundation of distributed training:

| Primitive | What it does (sum reduction shown) | Bytes sent per rank (ring model) | Where it shows up |
|:----------|:-------------|:-------------------------------------|:------------------|
| **All-reduce** | Sums buffers across all ranks, then returns the full reduced sum to every rank | $2 \times \frac{N-1}{N} \cdot S \approx 2S$ | Classic DDP gradient sync, Megatron-LM TP RowParallel |
| **Reduce-scatter** | Sums buffers across all ranks, but scatters only one $1/N$ chunk to each rank | $\frac{N-1}{N} \cdot S \approx 1S$ | ZeRO-2/3 and FSDP gradient sync |
| **All-gather** | Collects $1/N$ shards from all ranks to reconstruct the full tensor on every rank | $\frac{N-1}{N} \cdot S \approx 1S$ | ZeRO-3 and FSDP parameter materialization before compute |

Here $N$ is the collective's group size, and $S$ is the **full** tensor size: the reduction input for all-reduce/reduce-scatter, or the reconstructed output for all-gather. Each all-gather input is only $S/N$. The approximations require large $N$ and count sent bytes, excluding received bytes and protocol overhead. NCCL chooses algorithms for the operation and topology; the table isn't a measurement of every NCCL call.[^nccl2026Environment]

For the same reduction and shard layout, the primitives satisfy this mathematical identity:

$$
\text{All-Reduce}(X) \equiv \text{Reduce-Scatter}(X) \to \text{All-Gather}(X)
$$

A ring all-reduce uses a reduce-scatter phase followed by an all-gather phase. Bytes sent per rank total $2\frac{N-1}{N}S$. Floating-point reductions in a different order can round differently, so an alternative implementation of the identity does not necessarily return bit-identical values. NCCL also supports reductions other than sum; DDP's usual mean gradient includes division by the group size.

<figure>
  <img src="illustrations/_generated/collective_primitives_map_dark.png" alt="Three two-rank tensor transformations: All-Reduce adds [1, 2] and [10, 20] by coordinate, then gives both ranks [11, 22]; Reduce-Scatter assigns 11 at index 0 to rank 0 and 22 at index 1 to rank 1; All-Gather joins those shards and gives both ranks [11, 22]. Arrows show tensor semantics rather than NCCL wire routing." />
  <figcaption>The two-rank examples show the resulting tensors. The formulas count ring bytes sent per rank for a full tensor of size S. At N = 2, all-reduce sends S, while reduce-scatter and all-gather each send S/2. The familiar 2S and S estimates apply at large N.</figcaption>
</figure>

The following verification script executes these tensor transformations in a single Python process to validate the numerical identities and shard mappings directly:

<!-- leetllm: test, output=show, output_title="Collectives output" -->
```python title="collective_primitives.py"
rank_gradients = [[1, 2], [10, 20]]
summed = [sum(values) for values in zip(*rank_gradients)]

all_reduce_result = [summed.copy(), summed.copy()]
reduce_scatter_result = [[summed[0]], [summed[1]]]

parameter_shards = [["p0"], ["p1"]]
full_parameters = [token for shard in parameter_shards for token in shard]
all_gather_result = [full_parameters.copy(), full_parameters.copy()]

print("all_reduce=", all_reduce_result)
print("reduce_scatter=", reduce_scatter_result)
print("all_gather=", all_gather_result)
mean_gradient = [value / len(rank_gradients) for value in summed]
assert mean_gradient == [5.5, 11.0]
print("DDP_mean_gradient=", mean_gradient)
```

<!-- leetllm: output:start -->
```text title="Collectives output" output compact
all_reduce= [[11, 22], [11, 22]]
reduce_scatter= [[11], [22]]
all_gather= [['p0', 'p1'], ['p0', 'p1']]
DDP_mean_gradient= [5.5, 11.0]
```
<!-- leetllm: output:end -->

### The interconnect hierarchy: NVLink vs InfiniBand

Start with the actual topology because systems differ. DGX H100 systems use NVLink/NVSwitch with a quoted **900 GB/s per GPU**; DGX B200 quotes **1,800 GB/s**. These specifications describe aggregate bidirectional GPU interconnect bandwidth. Measure one-way tensor-transfer rates on the target workload.[^nvidiaCuFFTMpInterconnect2025] Some servers have only PCIe peer connections. A GB200 NVL72 joins **72 GPUs across a rack** into one NVLink domain, extending a fast link domain beyond a server boundary.[^nvidia2026gb200nvl72]

Across network interfaces, ConnectX-7 and ConnectX-8 offer examples of **400 Gb/s** and **800 Gb/s** networking.[^nvidia2026infinibandAdapters] Divide by eight: those line rates correspond to **50 GB/s** and **100 GB/s** per port in one direction, before overhead. Measure usable bandwidth per GPU under the target workload. NIC sharing, PCIe paths, switch contention, message sizes, and collective algorithms all affect it; compare links using the same direction and aggregation basis.

GPU peer access over NVLink/PCIe and **GPUDirect RDMA** through a network adapter are different mechanisms. GPUDirect RDMA lets a compatible NIC transfer GPU-memory data without staging every payload through host memory; it doesn't turn the network into NVLink.[^nvidia2026gpudirectRdma]

Frequent per-layer collectives often benefit most from the fastest available domain. Place tensor-parallel groups there when practical, and measure whether pipeline boundaries or FSDP collectives can use the remaining network efficiently. Tensor and context parallelism can span nodes. Their feasibility depends on exposed communication and memory savings, rather than an absolute prohibition against InfiniBand or Ethernet.

### The 1.5x heuristic

Engineers often summarize ZeRO-3 communication as "about 1.5x DDP", but this figure represents a modeled volume ratio rather than an empirical throughput guarantee.[^rajbhandari2020] Using the 140 GB low-precision weights from earlier, if gradients also occupy 140 GB, a large-group estimate sends about 280 GB per rank for DDP and 420 GB for full sharding. The resulting ratio of 1.5 assumes one forward/backward pass pair, parameters released immediately after forward execution, and equal parameter and gradient communication dtypes across ranks.

Writing the element count as $\Psi$, the paper's simplified accounting is:

1. **DDP** implements gradient all-reduce as reduce-scatter plus all-gather, modeled as **$2\Psi$** moved per rank per step.
2. **ZeRO with optimizer and gradient partitioning** replaces gradient all-reduce with reduce-scatter, then all-gathers updated parameters: **$2\Psi$** in the same model. Check the actual stage-1 implementation before assigning it this schedule.
3. **ZeRO-3 / FULL_SHARD** adds a second parameter all-gather so backward can run after the forward copy was freed. Two all-gathers plus one gradient reduce-scatter land at **$3\Psi$**.

That gives **$3\Psi / 2\Psi = 1.5x$**. A ring-style all-gather or reduce-scatter actually sends a fraction $(N-1)/N$ of a full payload per rank; all-reduce has two such phases. Here "traffic" counts bytes sent, not sent plus received. Changing the algorithm, reduction dtype, resharding, or gradient-accumulation schedule changes the accounting.

Scheduling dynamics also influence runtime efficiency. DDP groups gradients into coarse buckets, whereas full sharding introduces fine-grained parameter gathers at communication-unit boundaries. Small collectives can become latency-bound, and waiting for an unshielded gather exposes communication on the step's critical path. Consequently, ZeRO-3 is most attractive when device memory is the binding constraint; if the model comfortably fits without parameter sharding on a bandwidth-constrained network, DDP or ZeRO-2 often delivers superior training throughput.

<!-- leetllm: test, output=show, output_title="Communication heuristic output" -->
```python title="communication_heuristic.py"
parameter_gb = 140
gradient_gb = 140
ranks = 256
ring_fraction = (ranks - 1) / ranks
ddp_modeled_gb = 2 * gradient_gb * ring_fraction
full_shard_modeled_gb = (2 * parameter_gb + gradient_gb) * ring_fraction

print("DDP_modeled_traffic_GB=", ddp_modeled_gb)
print("FULL_SHARD_modeled_traffic_GB=", full_shard_modeled_gb)
print("byte_ratio=", full_shard_modeled_gb / ddp_modeled_gb)
print("warning=latency_and_overlap_still_determine_step_time")
fp32_gradient_gb = 280
mixed_ratio = (2 * parameter_gb + fp32_gradient_gb) / (2 * fp32_gradient_gb)
assert mixed_ratio == 1.0
print("BF16_gathers_FP32_reductions_ratio=", mixed_ratio)
```

<!-- leetllm: output:start -->
```text title="Communication heuristic output" output compact
DDP_modeled_traffic_GB= 278.90625
FULL_SHARD_modeled_traffic_GB= 418.359375
byte_ratio= 1.5
warning=latency_and_overlap_still_determine_step_time
BF16_gathers_FP32_reductions_ratio= 1.0
```
<!-- leetllm: output:end -->

```checkpoint
Why can ZeRO-3 be slower than DDP even if the back-of-the-envelope byte ratio is only about 1.5x?
---
Because the real cost isn't total bytes alone. ZeRO-3 and FSDP break communication into many layer-level all-gathers and reduce-scatters. On a weak or high-latency interconnect, those smaller, more frequent collectives can hurt throughput more than the simple `3P` versus `2P` byte model suggests.
```

## FSDP (Fully Sharded Data Parallel)

ZeRO names the sharding strategy; FSDP is PyTorch's native way to express much of that strategy in a model and training loop.[^zhao2023] The choice now becomes an API and composition decision, not another memory formula.

Current docs start new designs on `torch.distributed.fsdp.fully_shard` (FSDP2): per-parameter `DTensor` shards, no `FlatParameter` wrapper, and a clean migration path from `FullyShardedDataParallel` (FSDP1). The tutorial marks FSDP1 deprecated. You'll still read FSDP1 in older repos; start new work on `fully_shard`.[^pytorchFsdp2Docs2025][^pytorchFsdp2Tutorial2025]

People pick FSDP when they want PyTorch-native profilers, checkpointing, and `DeviceMesh` composition. `torch.compile` guidance is still to compile the highest-level train or eval step, or the top-level module, and to fall back to the inner module if a distributed wrapper causes issues. FSDP1 compile also needs `use_orig_params=True`. FSDP2 always uses original parameters, so that flag is gone.[^pytorchCompileDocs2025][^pytorchFsdpDocs2025]

FSDP solves model-state memory. It doesn't solve activation memory. Long sequences and large micro-batches still push activations up, which is why FSDP is often paired with activation checkpointing.

### How full sharding materializes one unit: the FSDP lifecycle

Follow one block with `reshard_after_forward=True`. For this example, stored parameter shards are FP32, the gathered compute copy is BF16, gradients reduce in FP32, and no CPU offload or accumulation is enabled.[^pytorchFsdp2Docs2025][^pytorchFsdp2Tutorial2025]

1. **At rest:** Each rank holds its parameter shard and matching optimizer moments. After `zero_grad(set_to_none=True)`, `.grad` is `None`, rather than an allocated zero tensor. Moment buffers exist after the first optimizer update.
2. **Forward all-gather:** Shards are gathered into full **unit** parameters in the policy's compute dtype. Wrapping each block separately prevents this from gathering the entire model at once.
3. **Forward compute and reshard:** The block computes with full parameters and saves what backward needs. FSDP releases the unsharded parameter copy after forward. Activations, other units' prefetched parameters, and allocator reservations can remain; process memory does not necessarily return to an exact baseline.
4. **Backward all-gather:** The unit's full parameters are gathered again. For a linear layer, weights are needed for $dX = dY W^T$ when computing its input gradient.
5. **Backward compute and reduce-scatter:** Each rank computes **local unsharded parameter gradients**, such as $dW = X^T dY$. They temporarily exist before reduce-scatter combines contributions and leaves each rank its reduced gradient shard. Full parameters can be released after their backward uses finish. Sharding the stored gradient result doesn't eliminate these transient full-unit gradients.
6. **Optimizer update:** After backward and required synchronization, ordinary AdamW updates each owned shard using its gradient and moments. Pure full sharding needs no additional parameter synchronization for this local update. Other operations can still communicate: global gradient-norm clipping needs a distributed norm, and hybrid sharding also synchronizes replica gradients. `optimizer.step()` doesn't clear `.grad`; call `zero_grad` when appropriate.

<figure>
  <img src="illustrations/_generated/fsdp_unit_lifecycle_dark.png" alt="A six-event FSDP2 timeline follows one rank through a training step. Its FP32 parameter shard stays resident at 1 GB throughout. Separate forward and backward intervals show a gathered BF16 full unit at 2 GB per rank, with the forward copy released at reshard. A distinct FP32 gradient track changes from full-unit dW to shard dWᵣ through Reduce-Scatter; local AdamW updates the owned shard and zero_grad clears .grad. Activations, moments and other units stay separate, and the bands show states rather than elapsed time." />
  <figcaption>This parameter-storage example uses a 1B-parameter unit and four ranks: each FP32 shard is 1 GB and its gathered BF16 copy is 2 GB. Those numbers exclude moments, gradients, activations, and other units. Backward temporarily computes full-unit gradients before keeping only the reduced shard.</figcaption>
</figure>

### Prefetching: overlapping communication with compute

Executing compute and collectives strictly in sequence exposes every transfer. FSDP2 starts with **implicit prefetching**: the CPU can enqueue the next unit's all-gather on a communication stream while the current unit's kernels run on the compute stream. Backward prefetch follows the reverse recorded forward order.[^pytorchFsdp2Tutorial2025]

The next parameters have to arrive **before compute needs them**. In an ideal overlap window, exposed transfer time is $\max(0, T_{\text{gather}} - T_{\text{window}})$. A 4 ms gather launched at the start of a 6 ms window can be hidden; launched only 1 ms before the next layer, it still exposes 3 ms. Different streams don't guarantee simultaneous progress: CPU issue delays, shared communication resources, and memory contention can shorten the window.

Start by profiling implicit prefetching. Explicit `set_modules_to_forward_prefetch` and `set_modules_to_backward_prefetch` can help CPU-bound workloads or gather multiple future units, at a cost in live parameter memory. The first gather also needs an earlier launch opportunity to overlap; there isn't always previous layer compute to hide it behind.

The lifecycle figure follows one unit's ownership through both gathers, the forward reshard, backward reduce-scatter, and local optimizer update. Every rank in the group must enter matching collectives. Its arrows describe tensor operations rather than NCCL's wire routing. Prefetch may overlap the next unit's gather with current compute, which can make multiple units' parameters live at once.

### FSDP2: `fully_shard` on DTensors

If you construct the optimizer before sharding, it binds to unsharded parameters and creates unpartitioned optimizer state. To avoid this, always apply `fully_shard` bottom-up before instantiating the optimizer: each transformer block becomes an individual communication unit, the root call shards remaining embeddings and heads, and the optimizer is initialized over the resulting `DTensor` parameters.[^pytorchFsdp2Docs2025][^pytorchFsdp2Tutorial2025]

`reshard_after_forward` controls the old sharding-strategy trade-off. Setting it to `True` releases the full unit after forward and gathers again for backward (`FULL_SHARD` behavior), while `False` retains unsharded parameters until backward completes (`SHARD_GRAD_OP` behavior). Under PyTorch's default setting of `None`, the runtime selects `True` for submodules and `False` for the root module, preventing redundant gathers at the iteration boundary. In PyTorch 2.14, specifying an integer divisor (e.g. `reshard_after_forward=4` on an 8-rank group) retains partial shards to balance memory footprint against backward gather group diameter.[^pytorchFsdp2Docs2025]

`MixedPrecisionPolicy` establishes the operational dtype partition. Compute and all-gather operations execute in `param_dtype` (such as BF16), while gradient reductions occur in `reduce_dtype` (such as FP32). Sharded parameters remain in their persistent precision, which AdamW updates directly without allocating an additional master parameter tensor.[^pytorchFsdp2Docs2025][^pytorchFsdp2Tutorial2025] Under `torchrun`, initialize the NCCL process group, configure the precision policy, shard the layers bottom-up, and instantiate the optimizer:

```python title="fsdp2_structure.py"
import torch
import torch.distributed as dist
from torch.distributed.fsdp import MixedPrecisionPolicy, fully_shard

assert dist.is_initialized(), "initialize the process group before sharding"
mp_policy = MixedPrecisionPolicy(
    param_dtype=torch.bfloat16,
    reduce_dtype=torch.float32,
)

model = TransformerModel()
for block in model.blocks:
    fully_shard(block, mp_policy=mp_policy, reshard_after_forward=True)
fully_shard(model, mp_policy=mp_policy, reshard_after_forward=False)

optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
```

Write the two recipes down before you size a cluster. The ZeRO paper's 16-byte convention stores low-precision parameters and gradients plus an FP32 master. FSDP2 mixed precision keeps the high-precision shard as the optimizer parameter, so you don't add that extra master on top.

<!-- leetllm: test, output=show, output_title="Two model-state recipes" -->
```python title="fsdp2_vs_zero_recipe.py"
params_billions = 70

def state_gb(bytes_per_param: int) -> int:
    return params_billions * bytes_per_param

zero_paper = {
    "stored_param": 2,
    "stored_grad": 2,
    "fp32_master": 4,
    "adam_moments": 8,
}
fsdp2_persistent = {
    "sharded_param_original_dtype": 4,
    "adam_moments": 8,
}
fsdp2_after_backward = {**fsdp2_persistent, "fp32_sharded_grad": 4}

print("zero_paper_bytes_per_param=", sum(zero_paper.values()))
print("zero_paper_states_GB=", state_gb(sum(zero_paper.values())))
print("fsdp2_persistent_param_and_adam_GB=", state_gb(sum(fsdp2_persistent.values())))
print("fsdp2_extra_master_bytes=", 0)
print("fsdp2_with_gradients_GB=", state_gb(sum(fsdp2_after_backward.values())))
assert sum(fsdp2_after_backward.values()) == 16
print("unsharded_bf16_copy=transient_around_compute")
```

<!-- leetllm: output:start -->
```text title="Two model-state recipes" output compact
zero_paper_bytes_per_param= 16
zero_paper_states_GB= 1120
fsdp2_persistent_param_and_adam_GB= 840
fsdp2_extra_master_bytes= 0
fsdp2_with_gradients_GB= 1120
unsharded_bf16_copy=transient_around_compute
```
<!-- leetllm: output:end -->

The 840 GB subtotal counts FP32 parameters and two FP32 moments **before gradients**. Once FP32 gradient shards exist, this FSDP2 recipe also totals 1,120 GB across the shard group. It reaches sixteen bytes differently: 4-byte parameters + 4-byte gradients + 8-byte moments. Gathered BF16 compute parameters are extra temporary storage. `zero_grad(set_to_none=True)` can release gradient storage between updates; retaining or accumulating gradients changes the live inventory.

Accumulation has a separate communication choice. FSDP2's `set_requires_gradient_sync(False)` suppresses gradient reductions, retaining unsharded accumulated gradients until synchronization resumes. Keeping reductions enabled preserves sharded gradient accumulation but pays for each reduction. `set_reshard_after_backward(False)` instead retains full parameters to avoid the next gather. These controls affect different buffers; disabling synchronization doesn't by itself suppress parameter gathers.[^pytorchFsdp2Docs2025]

| Feature | FSDP1 (`FullyShardedDataParallel`) | FSDP2 (`fully_shard`) |
|:--------|:-----------------------------------|:----------------------|
| **How it applies sharding** | Wrapper module with flat parameters | In-place hooks on original modules |
| **Sharding representation** | `FlatParameter` groups | Per-parameter `DTensor`, usually `Shard(0)` |
| **Parameter names** | Flattened internals; state-dict APIs translate original names | Original fully qualified parameter names stay intact |
| **Composition with TP / frozen params** | More awkward | Better fit with `DeviceMesh` and frozen params |
| **Prefetch / rate limits** | `backward_prefetch`, `limit_all_gathers` | Implicit prefetch by default; `set_modules_to_forward_prefetch` / `set_modules_to_backward_prefetch` when you need explicit control. `limit_all_gathers` is gone because FSDP2 dropped that CPU sync. |
| **CPU offload** | `CPUOffload(offload_params=True)` offloads parameters and gradients; optimizer runs on CPU | `CPUOffloadPolicy()`: parameters, gradients, and optimizer states on host; optimizer step runs on CPU |
| **Checkpointing style** | Full and sharded state dict APIs | DTensor state dicts; Distributed Checkpoint (DCP) saves and reloads shards |
| **Gradient clipping** | `fsdp_model.clip_grad_norm_()` for sharded strategies | `torch.nn.utils.clip_grad_norm_(model.parameters(), ...)` works on DTensors |

FSDP2 also handles mixed frozen and trainable parameters in one communication group without FSDP1's extra gradient-memory cost for that mixture. Frozen weights still need materialization for computation, and can be needed to propagate input gradients. LoRA reduces what gets updated; it doesn't automatically remove all parameter gathers.

### FSDP1 you'll still meet

Older code wraps `FullyShardedDataParallel`. The same three rules still matter:

1. Wrap transformer blocks, not the whole model as one unit.
2. Create the optimizer **after** wrapping.
3. Don't treat `limit_all_gathers=True` as an overlap knob. `backward_prefetch` is the overlap control; `limit_all_gathers` caps in-flight all-gathers to control peak memory.[^pytorchFsdpDocs2025]

This legacy integration fragment assumes `torch.distributed.init_process_group()` has already run under `torchrun` and that each rank has selected its local CUDA device. Its small attention stack demonstrates wrapping, not an SFT model: a language-model run also needs causal masking, token embeddings, labels, and a loss.

```python title="fsdp1_existing_code.py"
import torch
import torch.nn as nn
import functools
from torch.distributed.fsdp import (
    BackwardPrefetch,
    FullyShardedDataParallel as FSDP,
    MixedPrecision,
    ShardingStrategy,
)
from torch.distributed.fsdp.wrap import transformer_auto_wrap_policy

class TransformerDecoderLayer(nn.Module):
    def __init__(self, d_model=1024, n_heads=16):
        super().__init__()
        self.self_attn = nn.MultiheadAttention(d_model, n_heads, batch_first=True)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, 4 * d_model),
            nn.GELU(),
            nn.Linear(4 * d_model, d_model),
        )
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)

    def forward(self, x, mask=None):
        attn_out, _ = self.self_attn(x, x, x, attn_mask=mask, need_weights=False)
        x = self.norm1(x + attn_out)
        ffn_out = self.ffn(x)
        x = self.norm2(x + ffn_out)
        return x

my_auto_wrap_policy = functools.partial(
    transformer_auto_wrap_policy,
    transformer_layer_cls={TransformerDecoderLayer},
)

mixed_precision_policy = MixedPrecision(
    param_dtype=torch.bfloat16,
    reduce_dtype=torch.bfloat16,
    buffer_dtype=torch.bfloat16,
)

model = nn.Sequential(*[
    TransformerDecoderLayer(d_model=1024, n_heads=16)
    for _ in range(8)
])

fsdp_model = FSDP(
    model,
    auto_wrap_policy=my_auto_wrap_policy,
    sharding_strategy=ShardingStrategy.FULL_SHARD,
    mixed_precision=mixed_precision_policy,
    backward_prefetch=BackwardPrefetch.BACKWARD_PRE,
    limit_all_gathers=True,
    device_id=torch.cuda.current_device(),
)

optimizer = torch.optim.AdamW(fsdp_model.parameters(), lr=2e-5)
```

The most important FSDP choice is usually sharding granularity. Use transformer blocks as communication units. If one root unit owns the entire model, every all-gather becomes too large and peak memory shoots back up.

Use a smaller four-block stack to isolate granularity. Each block has an assumed 3.5 GB compute-weight payload. This calculation counts only gathered copies; persistent shards, activations, and prefetched neighboring blocks are additional:

<!-- leetllm: test, output=show, output_title="Sharding granularity output" -->
```python title="fsdp_unit_granularity.py"
block_parameter_gb = [3.5, 3.5, 3.5, 3.5]

root_only_peak_full_materialization = sum(block_parameter_gb)
blockwise_peak_full_materialization = max(block_parameter_gb)

print("root_only_active_parameters_GB=", root_only_peak_full_materialization)
print("blockwise_active_parameters_GB=", blockwise_peak_full_materialization)
print("modeled_reduction=", root_only_peak_full_materialization / blockwise_peak_full_materialization)
```

<!-- leetllm: output:start -->
```text title="Sharding granularity output" output compact
root_only_active_parameters_GB= 14.0
blockwise_active_parameters_GB= 3.5
modeled_reduction= 4.0
```
<!-- leetllm: output:end -->

### Sharding strategy names

| Behavior | FSDP1 | FSDP2 | What it does |
|:---------|:------|:------|:-------------|
| Full shard | `FULL_SHARD` | `reshard_after_forward=True` | Shards parameters, gradients, and optimizer states. Frees the full unit after forward. |
| Keep params through backward | `SHARD_GRAD_OP` | `reshard_after_forward=False` | Unshards for forward, keeps them until backward finishes, then reshards. Higher peak, fewer all-gathers. |
| Hybrid shard | `HYBRID_SHARD` | 2D `DeviceMesh` plus `reshard_after_forward=True` | Shard across mesh dimension 1, replicate across dimension 0. Rank placement must map dimension 1 to the intended fast-link group. |
| Replicate | `NO_SHARD` | Don't shard; use DDP | Full model states on every rank. No sharded parameter materialization. |

Hybrid sharding saves cross-node communication by giving up some memory savings. With four nodes of eight GPUs, full sharding across all 32 ranks gives the 70B recipe a 35 GB model-state lower bound per GPU. Sharding only within each eight-GPU node gives 140 GB per GPU instead: `1120 / 8`, not `1120 / 32`. Four replicas of the shard group remain. That hybrid arrangement doesn't fit the assumed 80 GB capacity without another change.

## Checkpointing, resume, and fault recovery

An out-of-memory fix that cannot resume faithfully is an incomplete training system. Distributed nodes reboot, spot instances get preempted, and cluster schedulers evict jobs unexpectedly. A weights-only checkpoint restores the model parameters but permanently loses Adam's moment history, the learning-rate schedule position, and the exact dataloader cursor, causing optimization instability upon restart.[^torchtune2026checkpointer] A true production resume point requires preserving all state components needed to take the exact next optimizer step:

| Must-save state | Why it matters on resume |
|:----------------|:-------------------------|
| **Model weights** | Restores current parameters |
| **Optimizer state** | Preserves momentum and adaptive moments |
| **Scheduler state** | Keeps warmup and decay aligned with training step |
| **Gradient-scaler / AMP state, if used** | Preserves mixed-precision control state across resume |
| **Consumed step or token count** | Lets logs, schedulers, and stop rules stay honest |
| **Sampler / dataloader cursor** | Prevents replaying or skipping large data regions |
| **RNG state** | Keeps dropout, shuffling, and sampling reproducible when needed |

In a sharded training system, the most robust default is to save **sharded checkpoints** in parallel across ranks rather than gathering all weights onto rank 0 first. Gathering terabytes of parameters onto a single host exhausts host RAM and creates an untenable I/O bottleneck, which is why modern frameworks like FSDP2 and DCP stream shards directly to distributed storage.[^pytorchFsdp2Docs2025][^torchtune2026checkpointer] When cluster topology changes between runs, runtimes like DeepSpeed support **Universal Checkpointing** through an explicit workflow: saving standard ZeRO shards, converting them with `ds_to_universal.py`, and loading with `checkpoint.load_universal` enabled.[^deepspeedUniversalCheckpointing2026]

The operational rule is simple:

1. Save checkpoints by **training step and consumed tokens**, not vague names like `latest-final`.
2. Test one real resume path early in the run, before trusting a week-long job to it.
3. Compare the next batch, loss, gradients, updated parameters, and optimizer counters with an uninterrupted run, using tolerances appropriate to the kernels and dtype.

Save at a completed optimizer-step boundary for the simplest resume contract. A checkpoint taken mid-accumulation also needs accumulated gradients and the microstep position. Changing world size can change batch grouping and floating-point reduction order even when tensor reshaping succeeds.

The CPU experiment below tests one part of that contract with real PyTorch updates. A small layer with dropout takes three AdamW steps, saves to an in-memory checkpoint, then takes a fourth step. A restored run must reproduce that fourth update. A weights-only restore sees the same pre-update loss but takes a different update because it lost Adam's moments and step counter.

<!-- leetllm: test, deps=torch, output=show, output_title="Checkpoint continuation output" -->
```python title="checkpoint_next_update.py"
import io
import torch
from torch import nn

torch.set_num_threads(1)
torch.manual_seed(7)
x = torch.tensor([[1., 0.], [0., 1.], [1., 1.], [-1., 2.]])
y = torch.tensor([[1.], [-1.], [0.], [-3.]])

def make_run():
    model = nn.Sequential(nn.Linear(2, 4), nn.Tanh(), nn.Dropout(0.25), nn.Linear(4, 1))
    return model, torch.optim.AdamW(model.parameters(), lr=0.01)

def step(model, optimizer):
    optimizer.zero_grad(set_to_none=True)
    loss = (model(x) - y).square().mean()
    loss.backward()
    optimizer.step()
    return loss.detach()

model, optimizer = make_run()
for _ in range(3):
    step(model, optimizer)
buffer = io.BytesIO()
torch.save({"model": model.state_dict(), "optimizer": optimizer.state_dict(),
            "rng": torch.get_rng_state(), "completed_steps": 3}, buffer)
expected_loss = step(model, optimizer)
expected_params = torch.cat([p.detach().flatten() for p in model.parameters()])

def restore(include_optimizer):
    buffer.seek(0)
    saved = torch.load(buffer, weights_only=True)
    restored, restored_optimizer = make_run()
    restored.load_state_dict(saved["model"])
    if include_optimizer:
        restored_optimizer.load_state_dict(saved["optimizer"])
    # Model construction consumed RNG; restore it after construction and loading.
    torch.set_rng_state(saved["rng"])
    loss = step(restored, restored_optimizer)
    params = torch.cat([p.detach().flatten() for p in restored.parameters()])
    return loss, params

resumed_loss, resumed_params = restore(True)
weights_only_loss, weights_only_params = restore(False)
torch.testing.assert_close(resumed_loss, expected_loss, rtol=0, atol=0)
torch.testing.assert_close(resumed_params, expected_params, rtol=0, atol=0)
torch.testing.assert_close(weights_only_loss, expected_loss, rtol=0, atol=0)
assert not torch.equal(weights_only_params, expected_params)
print("full_resume_next_update_equal=", torch.equal(resumed_params, expected_params))
print("weights_only_same_loss=", torch.equal(weights_only_loss, expected_loss))
print("weights_only_same_update=", torch.equal(weights_only_params, expected_params))
```

<!-- leetllm: output:start -->
```text title="Checkpoint continuation output" output compact
full_resume_next_update_equal= True
weights_only_same_loss= True
weights_only_same_update= False
```
<!-- leetllm: output:end -->

This is a CPU checkpoint round trip, not an FSDP or DeepSpeed restore test. A distributed test must also exercise shard loading on every rank, per-rank RNG and data position, scheduler state, and the intended world size. Matching the first resumed loss alone would miss the broken weights-only case above.

## DeepSpeed ZeRO

When GPU memory alone remains insufficient despite native sharding, runtimes must leverage host DRAM or NVMe storage to expand the effective memory hierarchy. DeepSpeed, an open-source training runtime developed at Microsoft, implements ZeRO sharding alongside hierarchical offloading via ZeRO-Offload and ZeRO-Infinity.[^rajbhandari2020][^rajbhandari2021] In practice, ZeRO-3 relies on consistent module execution order across all data-parallel ranks. Dynamic routing architectures such as Mixture of Experts (MoE) risk deadlocking parameter all-gathers if ranks invoke submodules asynchronously, which is why DeepSpeed introduces explicit ZeRO-3 leaf module declarations to preserve collective synchronization.[^deepspeedTrainingDocs2026]

The configuration fragment below sets up a sharded training workflow with ZeRO-3 and CPU offloading under the DeepSpeed launcher. When CPU offload is enabled, specifying `AdamW` in the configuration automatically selects `DeepSpeedCPUAdam` with AdamW semantics internally.[^deepspeed2026optimizerSelection] Note that DeepSpeed bucket settings count **elements** rather than bytes: 500 million BF16 values alone occupy 1 GB of memory, making bucket sizing a critical parameter to tune against accelerator bandwidth.[^deepspeedZeroDocs2026] Micro-batch 1 with 8 accumulation steps yields an effective batch of `8 * data_parallel_size` sequences per optimizer update.

```python title="deepspeed-zero.py"
import deepspeed
import torch.nn as nn

ds_config = {
    "train_micro_batch_size_per_gpu": 1,
    "gradient_accumulation_steps": 8,
    "bf16": {
        "enabled": True,
    },
    "optimizer": {
        "type": "AdamW",
        "params": {
            "lr": 2e-5,
            "betas": [0.9, 0.999],
            "eps": 1e-8,
            "weight_decay": 0.01,
        },
    },
    "zero_optimization": {
        "stage": 3,
        "offload_optimizer": {
            "device": "cpu",
            "pin_memory": True,
        },
        "offload_param": {
            "device": "cpu",
            "pin_memory": True,
        },
        "overlap_comm": True,
        "contiguous_gradients": True,
        "reduce_bucket_size": 500_000_000,
        "stage3_prefetch_bucket_size": 50_000_000,
        "stage3_param_persistence_threshold": 100_000,
    }
}

class SimpleTransformer(nn.Module):
    def __init__(self, d_model=1024, n_layers=4):
        super().__init__()
        self.layers = nn.ModuleList([
            nn.TransformerEncoderLayer(d_model, nhead=16, batch_first=True)
            for _ in range(n_layers)
        ])
        self.proj = nn.Linear(d_model, 1000)

    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        return self.proj(x)

model = SimpleTransformer(d_model=1024, n_layers=4)

model_engine, optimizer, _, _ = deepspeed.initialize(
    model=model,
    config=ds_config,
    model_parameters=model.parameters(),
)

# for batch in dataloader:
#     outputs = model_engine(batch)
#     loss = compute_loss(outputs)
#     model_engine.backward(loss)
#     model_engine.step()
```

With the current default `managed_gradient_accumulation=True`, call `model_engine.step()` after every micro-batch as shown. The engine updates only at the configured boundary and `backward(loss)` applies its accumulation scaling. Dividing the same mean loss by eight yourself would scale it twice. Unmanaged accumulation transfers boundary ownership to the caller; variable target counts still require the intended token weighting, rather than a mean of micro-batch means.[^deepspeedTrainingDocs2026]

### ZeRO-Infinity: CPU and NVMe offloading

DeepSpeed extends ZeRO-3 with **ZeRO-Infinity**, which offloads sharded parameters and optimizer states to host CPU RAM or high-speed NVMe storage.[^rajbhandari2021] While offloading enables multi-hundred-billion parameter models to train on hardware setups that would otherwise suffer immediate out-of-memory crashes, it shifts the system bottleneck from compute to interconnect bandwidth. Throughput becomes strictly constrained by PCIe and NVLink-C2C bandwidth, host DRAM saturation, and the runtime's capacity to overlap asynchronous data transfers with active GPU kernel execution.

| Tier | What lives there | Transfer boundary to measure | Example use |
|:-----|:------------|:----------|:---------|
| **GPU** | HBM | Device-memory traffic under the actual kernels | Active parameters, activations, temporary buffers |
| **CPU** | Host RAM | Host DRAM bandwidth **and separately** the GPU-host link, such as PCIe or NVLink-C2C | Offloaded parameter/gradient shards and optimizer states |
| **NVMe** | Local storage | Sustained reads/writes at the intended queue depth, plus storage-host and host-GPU transfers | State spillover when host RAM is insufficient |

Avoid treating host DRAM bandwidth as GPU-host transfer bandwidth. Even GPU specifications vary: the cited HGX reference lists H100 SXM memory bandwidth at 3.35 TB/s and B200 at up to 8 TB/s.[^nvidia2026hgxComponents] Neither number is a measured offload rate, nor does storage generation alone determine an NVMe array's sustained throughput.

DeepSpeed's configuration reference supports AutoTP training across ZeRO stages 0 through 3, while `PipelineModule` excludes ZeRO-2 and ZeRO-3 combinations.[^deepspeedConfigJson2026][^deepspeedPipelineDocs2026] Because framework feature matrices evolve across releases, compatibility constraints should be validated directly within launch automation. The following check encodes documented stage restrictions to prevent invalid configurations before distributed workers initialize:

<!-- leetllm: test, output=show, output_title="Compatibility gate output" -->
```python title="deepspeed_compatibility_gate.py"
requested_runs = [
    {"feature": "AutoTP", "zero_stage": 2},
    {"feature": "AutoTP", "zero_stage": 3},
    {"feature": "PipelineModule", "zero_stage": 2},
]

def supported(run):
    if run["feature"] == "AutoTP":
        return run["zero_stage"] in {0, 1, 2, 3}
    if run["feature"] == "PipelineModule":
        return run["zero_stage"] in {0, 1}
    return False

for run in requested_runs:
    print(run["feature"], f"ZeRO-{run['zero_stage']}", "stage_gate_pass=", supported(run))
```

<!-- leetllm: output:start -->
```text title="Compatibility gate output" output compact
AutoTP ZeRO-2 stage_gate_pass= True
AutoTP ZeRO-3 stage_gate_pass= True
PipelineModule ZeRO-2 stage_gate_pass= False
```
<!-- leetllm: output:end -->

## FSDP vs DeepSpeed comparison

Both stacks can shard the same model state. FSDP stays inside PyTorch's distributed APIs. DeepSpeed adds its own runtime, including NVMe offload and a pipeline module with stage limits.

| Feature | FSDP | DeepSpeed ZeRO |
|:--------|:-----|:---------------|
| **Runtime model** | Native PyTorch distributed stack | Separate DeepSpeed runtime |
| **ZeRO stages** | ZeRO-2-like and ZeRO-3-like sharding modes | Native ZeRO-1/2/3 |
| **CPU offloading** | FSDP2 `CPUOffloadPolicy()` moves parameters, gradients, and optimizer states to host memory; optimizer runs on CPU. FSDP1 `CPUOffload(offload_params=True)` also offloads gradients and runs the optimizer on CPU. | CPU and NVMe via ZeRO-Offload / ZeRO-Infinity |
| **NVMe offloading** | No built-in FSDP policy | Supported by ZeRO-Infinity |
| **Compile story** | Compile the train step or top-level module first; fall back to the inner module if the wrapper causes issues. FSDP1 needs `use_orig_params=True` | Depends on integration path |
| **Pipeline parallel** | Compose with PyTorch distributed pipelining separately from FSDP | Built-in, but `PipelineModule` excludes ZeRO-2/3 |
| **Tensor parallel** | FSDP2 composes with TP on a `DeviceMesh`; not a Megatron replacement | AutoTP or Megatron integration (AutoTP supports ZeRO-0/1/2/3) |
| **Checkpointing / tooling** | Standard PyTorch APIs | DeepSpeed-specific runtime APIs |
| **Debugging** | Standard PyTorch stack traces and profiler | More runtime-specific behavior |

### Which stack to start with

- **Use FSDP** when you want the PyTorch-native path, `DeviceMesh` composition, and standard profilers and checkpoints. GPU memory after sharding, or FSDP2's CPU offload, is enough.
- **Use DeepSpeed** when NVMe spillover is non-negotiable, you need ZeRO-Infinity's host/storage hierarchy, or you're already in a DeepSpeed or Megatron-DeepSpeed stack whose TP/PP requirements fit the current stage-compatibility rules.

```checkpoint
You already know the model-state math fits once sharded. What question decides whether you stay with FSDP or reach for DeepSpeed?
---
Ask what requirement remains unsolved after sharding. If you mainly want native PyTorch tooling and standard checkpointing, stay with FSDP. If you still need NVMe offload, ZeRO-Infinity, or the rest of the stack already depends on DeepSpeed-specific runtime features, DeepSpeed becomes the better operational fit.
```

## Beyond data parallelism: 4D parallelism

When sharding alone leaves either one layer or one sequence too large, data-parallel sharding hits hard limits:

1. **Batch constraints:** With equal local micro-batches, $B_{\text{global}} = B_{\text{micro}} \times m \times DP$, where $m$ is the number of accumulated micro-batches per optimizer update. Pure DP on 1,024 ranks with at least one sequence per rank implies at least 1,024 sequences per update. That may exceed the desired token batch, but it doesn't automatically make training unstable. Check the optimization budget and learning-rate recipe.
2. **One unit is too large:** Full sharding still gathers each wrapped unit. For example, a single BF16 projection matrix of shape $16{,}384 \times 65{,}536$ occupies 2.15 GB unsharded. Several matrices, transient gradients, and activations can coexist. Splitting the matrix computation is a different memory intervention from sharding its persistent storage.
3. **A sequence is too large:** Materializing attention scores uses $O(S^2)$ memory. FlashAttention avoids that full matrix with tiled exact attention, but saved tensors and layer outputs still grow with sequence length, and dense attention's arithmetic remains quadratic. Whether 128k or 1M tokens fit depends on model shape, implementation, checkpointing, and available memory.

These constraints motivate combining four axes, often called **4D parallelism**:[^shoeybi2019][^narayanan2021][^liu2024ring]

$$
\text{World Size} = DP \times TP \times PP \times CP
$$

This formula assumes a regular Cartesian mesh with one process per device and no extra expert-parallel axis. Here DP counts **independent sequence replicas**. TP, PP, and CP cooperate on each replica's data; multiplying any of them doesn't add independent examples to the global batch. Some frameworks include CP ranks in gradient-reduction groups, so distinguish group membership from this batch-counting definition.

<figure>
  <img src="illustrations/_generated/parallelism_topology_map_dark.png" alt="One authored sequence replica uses two nodes as PP stages. Each node has eight GPUs arranged as CP rows 0 and 1 by TP columns 0 through 3: 16 ranks per replica. The PP boundary sends activations forward and gradients backward. Repeat this replica eight times for DP=8, giving DP×TP×PP×CP=8×4×2×2=128 ranks. With one sequence per micro-batch and four accumulated micro-batches, the global sequence batch is 1×4×8=32; CP splits sequence tokens rather than adding examples." />
  <figcaption>Each grid uses TP columns to split hidden dimensions and CP rows to split sequence tokens. The PP arrows connect the two layer ranges; DP repeats the complete 16-rank pipeline eight times. This is one authored fast-domain placement, not a topology requirement. With one sequence per micro-batch and four accumulated micro-batches, DP = 8 gives a 32-sequence global batch.</figcaption>
</figure>

### Tensor parallelism (Megatron-LM ColumnParallel & RowParallel)

Tensor parallelism (TP) splits individual weight matrices **inside** a transformer block across multiple GPUs.[^shoeybi2019] Shoeybi et al. designed a pairing of column-parallel and row-parallel linear layers that minimizes collective communication. In a standard transformer MLP, activations pass through two linear layers: $Z = \text{GeLU}(X W_1) W_2$, structured to eliminate intermediate communication:

1. **ColumnParallelLinear ($W_1$):** The weight matrix $W_1 \in \mathbb{R}^{h \times 4h}$ is sliced along its columns into $k$ shards: $W_1 = [W_{1,1}, W_{1,2}, \dots, W_{1,k}]$, where each shard has size $h \times (4h/k)$.
   - Input $X$ is duplicated across all $k$ TP ranks.
   - Each rank computes its slice of the output: $Y_i = X W_{1,i}$.
   - Because the activation function $\text{GeLU}$ operates elementwise, each rank evaluates $\text{GeLU}(Y_i)$ locally **without any cross-GPU communication**!
2. **RowParallelLinear ($W_2$):** The second weight matrix $W_2 \in \mathbb{R}^{4h \times h}$ is sliced along its rows: $W_2 = [W_{2,1}; W_{2,2}; \dots; W_{2,k}]$, where each shard has size $(4h/k) \times h$.
   - Each rank computes partial product $Z_i = \text{GeLU}(Y_i) W_{2,i} \in \mathbb{R}^{b \times s \times h}$.
   - To produce the final layer output $Z = \sum_{i=1}^k Z_i$, the ranks execute an **All-Reduce**!

#### The Self-Attention block decomposition

For classic multi-head attention with replicated token inputs and complete heads on each TP rank:
- Projections $W_Q, W_K, W_V$ are **ColumnParallelLinear**: attention heads are partitioned across ranks (e.g. 32 heads across 4 GPUs = 8 heads per GPU). Each rank computes attention for its assigned heads without a TP exchange inside that attention calculation. Adding CP introduces a separate exchange of sequence information.
- Output projection $W_O$ is **RowParallelLinear**, followed by a single **All-Reduce** to sum attention outputs across heads.

This classic Megatron layout uses **two all-reduces in forward and two in backward** per transformer layer.[^narayanan2021] It assumes the replicated-input/output layout just described. Sequence parallelism and other layouts can replace those collectives with all-gather/reduce-scatter patterns. Frequent per-layer synchronization makes placement and overlap important, but it doesn't impose a particular NVLink bandwidth as a correctness requirement.

### Pipeline parallelism & 1F1B bubble mechanics

Pipeline parallelism (PP) partitions the model **across depth** by assigning consecutive layer ranges to different devices or server nodes (e.g. Stage 0 holds layers 1-16, while Stage 1 holds layers 17-32).[^narayanan2021] Pipeline boundaries rely primarily on point-to-point transfers: stage $i$ streams forward activations to stage $i+1$ and receives backward activation gradients in return, keeping communication localized to adjacent pipeline stages.

#### The GPipe bubble problem

GPipe schedules all $m$ forward micro-batches before executing any backward passes. Each stage retains activation state for all $m$ micro-batches simultaneously, which causes memory usage to scale linearly with pipeline depth. Assuming balanced stages with per-micro-batch forward and backward durations $t_f$ and $t_b$, useful execution time is $m(t_f+t_b)$ while the pipeline fill and drain bubble consumes $(p-1)(t_f+t_b)$.[^narayanan2021] This yields two distinct operational measures:

$$
\text{Bubble overhead relative to useful work} = \frac{p-1}{m}
$$

$$
\text{Idle fraction of elapsed iteration time} = \frac{p-1}{m+p-1}
$$

With eight stages and one micro-batch, overhead is 700%, while the idle fraction is 87.5%: a severe pipeline bubble since a fraction of elapsed time cannot exceed 100%. To combat this idle penalty, **one forward, one backward (1F1B)** scheduling was introduced in PipeDream before its refinement in Megatron-LM.[^narayanan2019pipedream] Megatron's default **PipeDream-Flush** variant completes all micro-batch backward passes before executing the optimizer update, strictly preserving synchronous gradient semantics without requiring complex asynchronous weight versioning.[^narayanan2021]

For the classic non-interleaved flush schedule, number stages from $i=0$:

- **Warmup:** stage $i$ runs $\min(m,p-i-1)$ forward micro-batches before its alternating phase.
- **Steady state:** run one forward, then one backward for an earlier micro-batch.
- **Drain:** finish the remaining backward passes before the batch update.

The maximum outstanding forwards on stage $i$ is $\min(m,p-i)$, including a steady-state forward before its paired backward. The current Megatron implementation reflects the warmup count and releases completed entries.[^megatron2026pipelineSchedule] This bounds retained activation sets for the stated schedule. Total memory also depends on parameters, gradients, optimizer state, communication buffers, and allocator behavior. Interleaved schedules have different retention patterns.

**Plain 1F1B reduces activation retention; it has the same ideal fill/drain bubble as GPipe.** Increasing $m$ reduces that bubble for either schedule. At $p=8,m=32$, the idle fraction is $7/39 \approx 17.95\%$. The general choice $m\ge4p$ gives an idle fraction below 20%, not always below 18%.

<!-- leetllm: test, output=show, output_title="Pipeline bubble output" -->
```python title="pipeline_bubble_ratios.py"
for stages, microbatches in [(8, 1), (8, 32), (64, 256)]:
    overhead = (stages - 1) / microbatches
    idle_fraction = (stages - 1) / (microbatches + stages - 1)
    assert 0 <= idle_fraction < 1
    print(f"p={stages}, m={microbatches}: overhead={overhead:.2%}, elapsed_idle={idle_fraction:.2%}")

assert 63 / 319 > 0.18  # m = 4p doesn't always put idle time below 18%.
stages, microbatches = 4, 8
warmup = [min(microbatches, stages - stage - 1) for stage in range(stages)]
live = [min(microbatches, stages - stage) for stage in range(stages)]
print("warmup_forwards=", warmup)
print("max_outstanding_forwards=", live)
```

<!-- leetllm: output:start -->
```text title="Pipeline bubble output" output compact
p=8, m=1: overhead=700.00%, elapsed_idle=87.50%
p=8, m=32: overhead=21.88%, elapsed_idle=17.95%
p=64, m=256: overhead=24.61%, elapsed_idle=19.75%
warmup_forwards= [3, 2, 1, 0]
max_outstanding_forwards= [4, 3, 2, 1]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pipeline_flush_schedule_dark.png" alt="For p=4 stages and m=8 micro-batches, per-stage warm-up forward counts are [3,2,1,0]. GPipe can retain eight outstanding forward activation sets per stage before backward begins; plain non-interleaved 1F1B has maximum outstanding counts [4,3,2,1]. For p=8, GPipe and plain 1F1B have the same ideal fill/drain bubble: at m=1, overhead relative to useful work is 700% and idle time is 87.50% of elapsed time; at m=32, these are 21.88% and 17.95%." />
  <figcaption>For the stated balanced flush model, GPipe and plain non-interleaved 1F1B share the same bubble ratios. The plotted live-forward counts describe activation retention, not elapsed time or measured GPU utilization. Overhead uses useful work as its denominator; idle fraction uses total elapsed iteration time.</figcaption>
</figure>

Interleaving multiple model chunks per device can reduce the ideal bubble at the cost of additional boundary transfers. When sequence length rather than depth creates an out-of-memory barrier, **context parallelism (CP)** partitions the sequence dimension $S$ across $C$ devices, ensuring each rank processes only $S/C$ query positions while sharing key and value states globally.[^liu2024ring]

Ring Attention coordinates this sequence partition without materializing full $S \times S$ attention matrices:
1. Query tokens $Q$ remain stationary on each local GPU.
2. Key and value blocks rotate around a logical ring. PyTorch implementations can use asynchronous point-to-point transfers; the original paper's JAX implementation uses `lax.ppermute`.
3. Block attention computes while transfers for subsequent blocks progress. Online softmax statistics combine the blocks without constructing the full $S\times S$ matrix.

Hiding transfers requires sufficient block compute time and a suitable schedule. Short blocks, limited bandwidth, and workload imbalance can expose communication. CP also includes implementations with other exchange patterns, including the Ring Attention paper's 32-A100 InfiniBand setup. Longer feasible context reduces memory constraints; measure step time and task quality separately.

| Parallelism | What is divided | Example communication | Placement question |
|:------------|:---------------|:----------------------|:----------------|
| **Data / FSDP (DP)** | Independent sequences; FSDP also shards model states | DDP all-reduce, or FSDP all-gather/reduce-scatter | Can collectives overlap across the chosen group? |
| **Tensor (TP)** | Matrices and computation inside layers | Classic layout: 2 forward + 2 backward all-reduces per layer | What is the exposed per-layer exchange cost? |
| **Pipeline (PP)** | Layer groups | Boundary activations and their gradients | Are stage compute times balanced? |
| **Context (CP)** | Tokens of one sequence | Ring KV transfers, or another supported exchange | Can block compute hide exchange time? |

Each parallelism dimension multiplies into the required cluster scale. The configuration script below checks the resulting global batch size and GPU allocation across the 4D topology:

<!-- leetllm: test, output=show, output_title="Topology size output" -->
```python title="parallelism_topology_size.py"
topology = {
    "data_parallel": 8,
    "tensor_parallel": 4,
    "pipeline_parallel": 2,
    "context_parallel": 2,
}

world_size = 1
for degree in topology.values():
    world_size *= degree

print("world_size=", world_size)
print("ranks_per_data_replica=", topology["tensor_parallel"] * topology["pipeline_parallel"] * topology["context_parallel"])
assert world_size == 128
micro_batch_sequences = 1
accumulated_microbatches = 4
global_batch_sequences = micro_batch_sequences * accumulated_microbatches * topology["data_parallel"]
assert global_batch_sequences == 32
print("global_batch_sequences=", global_batch_sequences)
```

<!-- leetllm: output:start -->
```text title="Topology size output" output compact
world_size= 128
ranks_per_data_replica= 16
global_batch_sequences= 32
```
<!-- leetllm: output:end -->

## Debugging & profiling distributed training

Distributed training turns a local symptom into a coordination question. Unlike single-GPU training where bugs manifest as direct exceptions, distributed jobs frequently hang silently, stall on trailing ranks, or suffer severe throughput regressions driven by communication contention rather than arithmetic bottlenecks. Before altering configuration parameters, systematically determine whether the root failure is an unhandled rank exception, a transient memory peak, a dataloader starvation issue, or an unsynchronized collective schedule.

### Common failure modes

1. **NCCL timeouts or hangs:** A rank may have died earlier or entered a different collective pattern. Find the first error across rank logs. `TORCH_NCCL_BLOCKING_WAIT` changes whether `wait()` blocks; it isn't a general hang fix. Timeout dumps require both `TORCH_NCCL_DUMP_ON_TIMEOUT=1` and a positive `TORCH_NCCL_TRACE_BUFFER_SIZE`.[^pytorchNcclEnvironment2026]
2. **Startup OOM:** Large models can OOM before training starts if you materialize full parameters too early. Lazy or meta-device initialization (`torch.device("meta")`) matters.
3. **Wrong gradient clipping:** With an FSDP1 sharded strategy, use `fsdp_model.clip_grad_norm_()` because it computes across sharded gradients. FSDP2's DTensor-based parameters instead support `torch.nn.utils.clip_grad_norm_(model.parameters(), ...)` in the current tutorial.[^pytorchFsdpDocs2025][^pytorchFsdp2Tutorial2025]

### Profiling tools

Throughput (tokens/sec) only moves after you know whether the step is compute-bound or communication-bound. A credible comparison records accelerator model and count, topology, model and sequence shape, micro-batch and accumulation, dtype, sharding and prefetch settings, warmup and steady-state window, exact baseline, and correctness or convergence checks. Count unique input tokens across independent DP replicas; TP and PP ranks share those examples, while CP ranks split tokens within each sequence.

Always report the specific system boundary modified alongside measured results. Claiming that "FSDP is faster" provides zero actionable engineering value unless the comparison explicitly details cluster topology, per-device batch sizes, sequence lengths, communication overlap, and identical loss convergence. For evasive distributed deadlocks or synchronization discrepancies, capture a deterministic execution trace with `NCCL_DEBUG=INFO` and `TORCH_DISTRIBUTED_DEBUG=DETAIL` before attempting higher-level refactorings.

- `torch.profiler`: Look at `ncclAllGather`, `ncclReduceScatter`, and gaps where GPUs wait for communication. For FSDP1, tune wrapping granularity and `backward_prefetch`; use `limit_all_gathers=True` for peak-memory rate limiting, not as the overlap knob. For FSDP2, use its module prefetch APIs when implicit scheduling is insufficient.[^pytorchFsdpDocs2025][^pytorchFsdp2Docs2025]
- DeepSpeed's FLOPs Profiler estimates model compute and module timing. Pair it with communication logs and device/CPU traces to attribute collective waits or offload transfers; FLOP counts alone don't separate those costs.

### Training observability signals that matter

Once the job runs, you still need to know *why* it's slow or unstable. Good training dashboards separate data, compute, communication, and memory instead of showing only one loss curve.[^megatronCoreParallelism2026]

| Signal | What it answers | Bad symptom |
|:-------|:----------------|:------------|
| **tokens/sec** | Is end-to-end throughput improving? | flat or falling throughput after adding GPUs |
| **step time split** | Is time spent in data load, forward, backward, optimizer, or checkpoint save? | one phase dominates without explanation |
| **all-gather / reduce-scatter share** | Is sharding traffic now bottlenecking the job? | communication time grows faster than compute time |
| **dataloader wait time** | Are GPUs starved by CPU preprocessing or storage? | GPU idle gaps before forward |
| **peak HBM and reserved memory** | Are you close to OOM or fragmenting memory? | retries, allocator spikes, sudden OOM at checkpoint save |
| **MFU or FLOP utilization** | Are expensive kernels doing useful math? | very low utilization despite full memory use |
| **checkpoint save duration** | Is fault tolerance becoming a throughput tax? | long pauses every save interval |

Monitoring training loss alone can mask critical hardware inefficiencies: a run may converge mathematically while GPU throughput quietly collapses due to memory thrashing or network head-of-line blocking. Rigorous distributed observability demands granular systems telemetry alongside loss curves, directly connecting each parallelism abstraction to its physical bandwidth and memory constraints:

### Training-system bottleneck map

Strong distributed-training debugging connects the abstraction to the physical bottleneck. A rigorous diagnosis names the specific parallelism split, the active communication primitive, and the exact telemetry signals measured in profiling traces:

| Topic | What to explain | Debug signal |
|:------|:----------------|:-------------|
| **Data parallelism** | each rank owns a batch shard and synchronizes gradients | all-reduce time rises with parameter size |
| **Tensor parallelism** | one layer is split across ranks | frequent collectives inside attention and MLP blocks |
| **Pipeline parallelism** | different ranks own different layer ranges | idle bubbles when micro-batching is too small |
| **ZeRO / FSDP** | optimizer states, gradients, and parameters are sharded | all-gather and reduce-scatter dominate step time |
| **Activation checkpointing** | save memory by recomputing activations in backward | lower peak memory, higher compute time |
| **NCCL bottlenecks** | collectives depend on rank order, topology, and matching calls | hangs, timeouts, or wide gaps in profiler traces |
| **FlashAttention** | reduce attention memory traffic with tiled kernels | better long-context throughput when attention is memory-bound |

A structured debugging workflow proceeds as follows:
1. Reproduce on the smallest rank count that still fails.
2. Confirm every rank enters the identical collective sequence.
3. Capture profiler traces and separate compute, communication, and idle time.
4. Check peak memory before and after forward, backward, and optimizer step.
5. Change one axis at a time: sharding granularity, micro-batch size, checkpointing, or placement. For the 70B example, a backward OOM after persistent states fit indicates unmanaged gathered units or activation accumulation, whereas a low-memory run with long stalls before layer forward calls points toward exposed communication.

## A worked sizing exercise

Translating theoretical sharding formulas into actual cluster provisioning requires separating ideal mathematical lower bounds from runnable system capacity. Consider the standard sizing problem: determining how many 80 GB GPUs are required to train a 70B parameter model with ZeRO-3 under the standard 16-byte mixed-precision recipe.

Step 1: count the model states

Reuse the specific mixed-precision Adam recipe from the opening:
- 2 bytes (BF16 weight)
- 2 bytes (BF16 gradient)
- 12 bytes (FP32 master weight + Adam moments)

Total: 16 bytes per parameter. For 70B parameters: $70 \times 10^9 \times 16 \text{ bytes} = 1{,}120 \text{ GB}$ of model states.

Step 2: compute the model-state lower bound

Dividing this $1{,}120\text{ GB}$ requirement across 80 GB accelerators establishes an absolute mathematical lower bound of $1{,}120 / 80 = 14$ GPUs for static model states alone. This theoretical minimum allocates zero memory for activations, communication buffers, temporary workspace, or memory fragmentation, making a 14-GPU deployment immediately unrunnable. The arithmetic can be verified directly:

<!-- leetllm: test, output=show, output_title="GPU lower-bound output" -->
```python title="zero3_gpu_floor.py"
import math

total_state_gb = 70 * 16
gpu_memory_gb = 80

raw_floor = math.ceil(total_state_gb / gpu_memory_gb)
print("raw_lower_bound_gpus=", raw_floor)

for gpus in [14, 16, 24]:
    per_gpu = total_state_gb / gpus
    headroom = gpu_memory_gb - per_gpu
    print(f"{gpus:>2} GPUs -> {per_gpu:5.1f} GB states/GPU, {headroom:5.1f} GB before activations")
```

<!-- leetllm: output:start -->
```text title="GPU lower-bound output" output compact
raw_lower_bound_gpus= 14
14 GPUs ->  80.0 GB states/GPU,   0.0 GB before activations
16 GPUs ->  70.0 GB states/GPU,  10.0 GB before activations
24 GPUs ->  46.7 GB states/GPU,  33.3 GB before activations
```
<!-- leetllm: output:end -->

Step 3: add overhead

```checkpoint
The raw model-state math says a 70B-style run needs about 14 GPUs with ZeRO-3, but you only have sixteen 80 GB cards. Why is that still a shaky plan?
---
Because 14 GPUs is only the lower bound for model states. On 16 GPUs, model states still land around 70 GB per card, leaving little room for activations, communication buffers, and allocator overhead. ZeRO-3 shrinks memory by sharding optimizer states, gradients, and parameters, but it doesn't remove the need for headroom.
```

The math above is for model states only. Real training also needs:
- Activations (depends on sequence length and batch size)
- Communication buffers for all-gather and reduce-scatter
- CUDA allocator overhead and fragmentation

There isn't one fixed headroom percentage: context length, accumulation, and prefetching can change the peak. For a sensitivity calculation, **assume** 18 GB of additional live memory at every candidate topology. This is an exercise assumption. A real run must determine the joint peak; adding unrelated phase maxima can overestimate it, while ignoring gathered parameters can underestimate it.

<!-- leetllm: test, output=show, output_title="Workload memory budget output" -->
```python title="zero3_workload_budget.py"
state_total_gb = 1120
gpu_capacity_gb = 80
assumed_extra_peak_gb = 18  # Exercise assumption for additional live memory.

def fits(world_size):
    state_per_gpu = state_total_gb / world_size
    peak = state_per_gpu + assumed_extra_peak_gb
    return state_per_gpu, peak, peak <= gpu_capacity_gb

for world_size in [16, 24, 32]:
    state, peak, ok = fits(world_size)
    print(f"{world_size} GPUs -> states={state:.1f} GB peak_estimate={peak:.1f} GB fits={ok}")
```

<!-- leetllm: output:start -->
```text title="Workload memory budget output" output compact
16 GPUs -> states=70.0 GB peak_estimate=88.0 GB fits=False
24 GPUs -> states=46.7 GB peak_estimate=64.7 GB fits=True
32 GPUs -> states=35.0 GB peak_estimate=53.0 GB fits=True
```
<!-- leetllm: output:end -->

Step 4: answer the question

**Fourteen GPUs is only the ideal model-state lower bound under the 16-byte recipe.** Sixteen fail the exercise's assumed peak, while 24 pass its arithmetic. Neither result proves a real job fits or trains efficiently. Measure the intended workload, including gathered units, and check throughput and convergence before selecting the cluster. Activation checkpointing, a smaller micro-batch, or another parallel axis may change that choice.

## Common pitfalls

Each failure mode outlined below traces back to a specific violated distributed assumption. Diagnosing these errors requires observing the earliest failing boundary, identifying which parallelism axis was misconfigured, and validating the fix on a minimal reproducible cluster slice:

### Misidentifying which axis is split

- Symptom: A team says they "added ZeRO-3 for tensor parallelism," but profiler traces still show whole-layer matmuls on each rank and the real change is only lower model-state memory.
- Cause: ZeRO and FSDP shard model states across data-parallel ranks. They don't split the matrix multiply itself. Tensor parallelism splits layer computation, and pipeline parallelism splits model depth.
- Fix: Check what moved in the trace or memory profile before naming the technique. If weights, gradients, and optimizer states shrank per rank, that's sharding. If one layer's matmul is split across devices, that's tensor parallelism.

### Wrapping the whole model as one FSDP unit

- Symptom: You enable FSDP full sharding, but peak memory is still unexpectedly high and you get OOM during the forward pass.
- Cause: You wrapped the entire model as a single FSDP unit instead of wrapping individual transformer layers. When the whole model is one unit, FSDP all-gathers every parameter at once. That defeats the purpose of layer-by-layer sharding.
- Fix: Apply `fully_shard` to each transformer block, then the root. In FSDP1 code, use `auto_wrap_policy` the same way. The code examples earlier show both.

### Thinking FSDP1 `limit_all_gathers=True` creates overlap

- Symptom: You set `limit_all_gathers=True` and expect faster training, but throughput doesn't improve.
- Cause: `limit_all_gathers` is a CPU-side rate limiter. It caps how many all-gathers are in flight at once to control peak memory. That can affect throughput, but it doesn't directly select which unit to prefetch.
- Fix: In FSDP1, use `backward_prefetch` and communication-unit granularity for overlap. In FSDP2, use its prefetch methods when needed; it doesn't expose FSDP1's `limit_all_gathers` argument.

### Treating `SHARD_GRAD_OP` as identical to ZeRO-2

- Symptom: You switch from ZeRO-2-style reasoning to FSDP `SHARD_GRAD_OP`, then wonder why peak memory is higher than expected even though gradients are sharded.
- Cause: The names are similar, but the parameter lifetime differs. PyTorch's `SHARD_GRAD_OP`, and FSDP2's `reshard_after_forward=False`, keep parameters unsharded through forward and backward, then reshard after backward.[^pytorchFsdpDocs2025][^pytorchFsdp2Tutorial2025] That changes peak memory even when the high-level mental model sounds like ZeRO-2.
- Fix: Confirm the actual parameter lifetime in docs and profiler traces before sizing memory. If you need the lowest parameter footprint, compare against `FULL_SHARD` or `reshard_after_forward=True` rather than assuming the ZeRO-2-like name matches DeepSpeed stage 2.

### Ignoring activation memory

- Symptom: The model-state math says everything should fit, but you still OOM.
- Cause: Activations can be larger than model states for long sequences. A single forward pass with a long context can generate gigabytes of intermediate tensors.
- Fix: Pair ZeRO-3 or FSDP with activation checkpointing. Trade compute for memory by recomputing activations during the backward pass instead of storing them.

### Assuming every DeepSpeed feature composes with every ZeRO stage

- Symptom: You configure `PipelineModule` with ZeRO-3 and the job fails during initialization.
- Cause: DeepSpeed has documented compatibility limits. AutoTP supports ZeRO stages 0 through 3, but `PipelineModule` isn't compatible with ZeRO-2 or ZeRO-3.
- Fix: Check the stage-compatibility matrix before you design your training topology. Don't assume that because DeepSpeed supports both features, they work together.

Sizing a distributed training cluster transforms from guesswork into systematic engineering once each parallelism dimension is mapped to its precise hardware constraint. Memory capacity determines parameter and optimizer sharding, interconnect bandwidth dictates collective placement, and activation headroom governs pipeline depth and context parallelism. Fitting model states onto GPUs is merely the foundation: sustained training efficiency depends on balancing compute intensity against network latency across the entire cluster.

```mastery-quiz
[
  {
    "question": "A 25B-parameter model uses BF16 compute weights and gradients. AdamW keeps a separate FP32 master weight and two FP32 moments per parameter. Before sharding, how many decimal GB go to the compute weights, the gradients, and the master plus moments, in that order?",
    "options": [
      "50 GB, 50 GB, 300 GB",
      "50 GB, 50 GB, 200 GB",
      "100 GB, 100 GB, 300 GB",
      "100 GB, 100 GB, 200 GB"
    ],
    "answer": "50 GB, 50 GB, 300 GB",
    "explanation": "Each byte per parameter accounts for 25 GB. The BF16 weight and gradient take 2 bytes each, so each uses 50 GB. The master and two moments take 3 × 4 bytes per parameter, or 300 GB together. A 100 GB weight or gradient assumes FP32 storage. A 200 GB subtotal counts only the two moments."
  },
  {
    "question": "Before sharding, a 30B-parameter model has 60 GB of weights, 60 GB of gradients, and 360 GB of FP32 master weights and Adam moments combined. With 12 ranks and equal shards, how much persistent model state does each rank hold under ZeRO-2 and ZeRO-3?",
    "options": [
      "ZeRO-2: 40 GB; ZeRO-3: 95 GB.",
      "ZeRO-2: 95 GB; ZeRO-3: 40 GB.",
      "ZeRO-2: 150 GB; ZeRO-3: 40 GB.",
      "ZeRO-2: 95 GB; ZeRO-3: 35 GB."
    ],
    "answer": "ZeRO-2: 95 GB; ZeRO-3: 40 GB.",
    "explanation": "ZeRO-2 keeps all 60 GB of weights on each rank and splits the other 420 GB, giving 60 + 420/12 = 95 GB. ZeRO-3 splits all 480 GB, giving 40 GB. Reversing 95 and 40 swaps the stages. A 150 GB estimate for ZeRO-2 also replicates the gradients. A 35 GB estimate for ZeRO-3 leaves out the weight shard."
  },
  {
    "question": "An FSDP2 model has seven blocks, each with 4 GB of its own compute weights, and no other parameters. Each rank has a 6 GB budget per parameter all-gather. Which setup meets that budget and gives AdamW references to the sharded parameters?",
    "options": [
      "Shard the root, shard each block, then build AdamW.",
      "Build AdamW, shard each block, then shard the root.",
      "Shard each block, shard the root, then build AdamW.",
      "Build AdamW, shard the root, then shard each block."
    ],
    "answer": "Shard each block, shard the root, then build AdamW.",
    "explanation": "Calling fully_shard on each block first gives it ownership of its 4 GB of weights. The root claims any remaining parameters. Starting with the root groups all 7 × 4 = 28 GB together, which exceeds the gather budget. Building AdamW before sharding gives it references to the original parameters. Build it after sharding so it updates the DTensor shards."
  },
  {
    "question": "An 800M-parameter FSDP2 unit uses FP32 gradients on eight ranks. During backward, which inventory is consistent with the taught lifecycle?",
    "options": [
      "0.4 GB local full-unit gradient, then 3.2 GB reduced shard.",
      "3.2 GB local full-unit gradient, then 0.4 GB reduced shard.",
      "0.4 GB local full-unit gradient, then 0.4 GB reduced shard.",
      "3.2 GB local full-unit gradient, then 3.2 GB reduced shard."
    ],
    "answer": "3.2 GB local full-unit gradient, then 0.4 GB reduced shard.",
    "explanation": "The local full-unit gradient is 800 million times 4 bytes=3.2 GB. Reduce-scatter combines rank contributions and leaves one eighth, 0.4 GB, under the even partition."
  },
  {
    "question": "The 480 GB 30B recipe runs on four nodes of eight GPUs. Hybrid sharding divides only within each node. What persistent-state comparison follows?",
    "options": [
      "Hybrid: 15 GB per rank; global full shard: 60 GB per rank.",
      "Hybrid: 60 GB per rank; global full shard: 15 GB per rank.",
      "Hybrid: 60 GB per rank; global full shard: 60 GB per rank.",
      "Hybrid: 15 GB per rank; global full shard: 15 GB per rank."
    ],
    "answer": "Hybrid: 60 GB per rank; global full shard: 15 GB per rank.",
    "explanation": "Hybrid has four replicas of an eight-rank shard group, so 480/8=60 GB. Full sharding over all 32 gives 480/32=15 GB. Both still need a joint transient and activation budget."
  },
  {
    "question": "A balanced five-stage pipeline switches from GPipe to plain non-interleaved 1F1B for a flush of 12 microbatches. Each forward or backward takes one slot. Ignore transfer and optimizer time. Under 1F1B, what are the peak counts of live activation sets from the first stage to the last, and what fraction of elapsed slots is each stage idle?",
    "options": [
      "[5, 4, 3, 2, 1] live sets and 1/4 idle",
      "[4, 3, 2, 1, 0] live sets and 1/4 idle",
      "[4, 3, 2, 1, 0] live sets and 1/3 idle",
      "[5, 4, 3, 2, 1] live sets and 1/3 idle"
    ],
    "answer": "[5, 4, 3, 2, 1] live sets and 1/4 idle",
    "explanation": "The stages warm up with 4, 3, 2, 1, and 0 forwards. Each saves one more activation set before its first backward frees one, so the peaks are 5, 4, 3, 2, and 1. As in GPipe, fill and drain add 2 × (5 − 1) = 8 idle slots to 2 × 12 = 24 working slots per stage. The idle fraction is 8/32 = 1/4. Dividing by the 24 working slots gives 1/3, the overhead relative to useful work."
  },
  {
    "question": "A checkpoint was saved at a completed optimizer-step boundary. Its restore reproduces weights, the next batch, RNG, learning rate, and the same finite unscaled next gradient. Adam nevertheless makes a different next update. Which change directly explains it?",
    "options": [
      "The restore reset Adam moments and its bias-correction step counter.",
      "The restore cleared the previous .grad before the next backward pass.",
      "The restore constructed the model before reloading the saved RNG state.",
      "The restore loaded parameter shards without merging them into a full CPU tensor."
    ],
    "answer": "The restore reset Adam moments and its bias-correction step counter.",
    "explanation": "With the same current weight, gradient and learning rate, Adam still depends on prior moments and bias-correction counters. Clearing old gradients at a completed-step boundary, restoring RNG after construction, and shard-local loading do not reset that update history."
  },
  {
    "question": "An offload plan must move a 6 GB payload over a measured 15 GB/s host-GPU link. A separate GPU specification quotes 8 TB/s HBM bandwidth. What payload-only transfer lower bound follows?",
    "options": [
      "At least 0.4 seconds; GPU HBM bandwidth does not set that host-link transfer rate.",
      "At least 0.00075 seconds; the 8 TB/s HBM figure sets that host-link transfer rate.",
      "At least 2.5 seconds; divide the 15 GB/s host-link rate by the 6 GB payload.",
      "At least 0.05 seconds; multiply the 15 GB/s host-link rate by eight for gigabytes."
    ],
    "answer": "At least 0.4 seconds; GPU HBM bandwidth does not set that host-link transfer rate.",
    "explanation": "Transfer time is payload divided by bandwidth: 6/15=0.4 seconds. HBM bandwidth describes a different boundary. Startup latency, contention and extra transfers can only add to this simple payload estimate."
  },
  {
    "question": "A regular mesh uses DP=6, TP=2, PP=3, and CP=2. Each replica has two sequences per microbatch and accumulates five microbatches. What are world size and global sequence batch?",
    "options": [
      "72 ranks and 60 sequences.",
      "72 ranks and 360 sequences.",
      "36 ranks and 60 sequences.",
      "72 ranks and 120 sequences."
    ],
    "answer": "72 ranks and 60 sequences.",
    "explanation": "World size is 6×2×3×2=72. Independent sequence batch is microbatch×accumulation×DP=2×5×6=60. TP, PP and CP cooperate on each replica rather than creating independent examples."
  },
  {
    "question": "Two separate updates start at 1.0 and subtract 2^-26 or 2^-22 in FP32, then store in FP32, FP16, or BF16. The downward gaps at 1.0 are 2^-24, 2^-11, and 2^-8 respectively. Under round-to-nearest-even, what happens?",
    "options": [
      "The first stays 1.0 in all three; the second is lower only in FP32.",
      "Both become lower in FP32; neither changes in FP16 or BF16.",
      "The first stays 1.0 in all three; the second is lower in all three.",
      "Both stay 1.0 in all three; FP32 cannot represent either decrement."
    ],
    "answer": "The first stays 1.0 in all three; the second is lower only in FP32.",
    "explanation": "The first decrement is smaller than half the FP32 downward gap, so its intermediate result already rounds to 1.0. The larger 2^-22 decrement survives FP32 subtraction but remains far below half a downward FP16 or BF16 gap when stored."
  }
]
```

> **Next:** Continue to [LoRA & Parameter-Efficient Tuning](/learn/lora-parameter-efficient-fine-tuning). FSDP and ZeRO show how to pay for updating every weight by sharding the optimizer state. LoRA takes the alternative path: freeze the base weights completely and train compact low-rank adapter matrices instead.
