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

You have two 8-GPU nodes: sixteen 80 GB accelerators totaling **1,280 GB of aggregate HBM**. You try to train a 70-billion-parameter (70B) model with AdamW in mixed precision using PyTorch Distributed Data Parallel (DDP), and the job crashes immediately on startup. Why can't DDP tap that 1,280 GB pool? Even a single BF16 copy of 70B weights takes **140 GB**, exceeding every 80 GB GPU before a single gradient, optimizer moment, or activation exists. Because DDP replicates the full model state on every rank, adding more GPUs simply multiplies the same bottleneck.

**Fully Sharded Data Parallel (FSDP)** and **ZeRO (Zero Redundancy Optimizer)** unlock that aggregate memory by partitioning model states across GPUs instead of duplicating them, trading redundant HBM for structured collective communication.[^rajbhandari2020][^zhao2023]

## The memory wall in numbers

Under the classic mixed-precision AdamW recipe analyzed in the ZeRO paper, each parameter carries **16 bytes of model state** before activations, communication buffers, or allocator overhead:[^rajbhandari2020]

- **2 bytes:** BF16 or FP16 compute weight for Tensor Core matrix multiplications.
- **2 bytes:** BF16 or FP16 gradient.
- **4 bytes:** FP32 master parameter copy, preserving small updates that would round away in 16-bit storage.
- **4 bytes:** AdamW first moment ($m_t$, running mean of gradients).
- **4 bytes:** AdamW second moment ($v_t$, running mean of squared gradients).

Notice why that FP32 update copy exists: subtracting `1e-4` from a weight at `1.0` rounds straight back to `1.0` in both FP16 and BF16, while surviving in FP32 (though even FP32 loses increments smaller than half its downward gap of $2^{-24}$, such as `1e-8`):

<!-- leetllm: test, deps=torch, output=show, output_title="Stored update output" -->
```python title="stored_parameter_updates.py"
import torch

for name, dtype in (("FP16", torch.float16), ("BF16", torch.bfloat16), ("FP32", torch.float32)):
    weight = torch.tensor(1.0, dtype=dtype)
    below = torch.nextafter(weight, torch.tensor(0.0, dtype=dtype))
    gap_below = (weight - below).item()
    tiny = (weight.float() - 1e-8).to(dtype)
    larger = (weight.float() - 1e-4).to(dtype)
    print(f"{name}: gap_below_1={gap_below:.3e}, 1e-8_survives={tiny.item() != 1.0}, 1e-4_survives={larger.item() != 1.0}")
```

<!-- leetllm: output:start -->
```text title="Stored update output" output compact
FP16: gap_below_1=4.883e-04, 1e-8_survives=False, 1e-4_survives=False
BF16: gap_below_1=3.906e-03, 1e-8_survives=False, 1e-4_survives=False
FP32: gap_below_1=5.960e-08, 1e-8_survives=False, 1e-4_survives=True
```
<!-- leetllm: output:end -->

Scale 16 bytes per parameter to real model sizes: 1B parameters need **16 GB**, 7B need **112 GB**, and 70B need **1.12 TB** of model state alone. Notice that FP32 master weights plus Adam moments (`12 bytes/param`, or **840 GB** at 70B) consume **75%** of the total:

<!-- leetllm: test, output=show, output_title="Model-state memory output" -->
```python title="the-memory-wall-in-numbers.py"
params_b = 70
weights_gb = params_b * 2
grads_gb = params_b * 2
opt_and_master_gb = params_b * 12
total_gb = weights_gb + grads_gb + opt_and_master_gb

print(f"weights={weights_gb} GB, gradients={grads_gb} GB, optimizer+master={opt_and_master_gb} GB")
print(f"total_model_states={total_gb} GB")
print(f"ZeRO-3 model states per GPU on 256 GPUs: {total_gb / 256:.2f} GB")
```

<!-- leetllm: output:start -->
```text title="Model-state memory output" output compact
weights=140 GB, gradients=140 GB, optimizer+master=840 GB
total_model_states=1120 GB
ZeRO-3 model states per GPU on 256 GPUs: 4.38 GB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/model_state_memory_wall_dark.png" alt="The 70B 16-byte recipe totals 1,120 GB of model states: parameters 140, gradients 140, FP32 master parameters 280, and Adam moments 560. Equal sharding over 16, 32, 64, or 256 ranks uses 70, 35, 17.5, or 4.375 GB of an 80 GB device." />
  <figcaption>At 70B parameters, master weights and Adam moments dominate model-state memory (840 of 1,120 GB). Sharding reduces persistent state linearly with rank count, leaving the remaining VRAM for gathered layers, activations, communication buffers, and allocator overhead.</figcaption>
</figure>

## Why DDP hits a limit

Standard **DDP** gives every GPU a full model copy, feeds each rank a different batch slice via your sampler, and averages gradients across ranks during backward via bucketed all-reduce (overlapped with backward compute).[^pytorchDdpDocs2026]

When ranks hold different numbers of supervised tokens (common with packing or response-masked SFT), naive DDP averaging weights every rank equally rather than every token equally. Let rank $r$ hold $n_r$ valid targets with local loss sum $L_r$. With $N$ ranks and default DDP averaging, scaling each rank's local loss sum by $N / \sum_j n_j$ (equivalently scaling its local mean by $N n_r / \sum_j n_j$) recovers the exact global token-mean gradient:

<!-- leetllm: test, deps=torch, output=show, output_title="Rank loss weighting output" -->
```python title="unequal_rank_loss_weighting.py"
import torch

targets = [torch.tensor([1.0]), torch.tensor([3.0, 3.0, 3.0])]
counts = [t.numel() for t in targets]
ranks, total = len(targets), sum(counts)

def rank_gradient(target, multiplier):
    w = torch.tensor(0.0, requires_grad=True)
    loss = (w - target).square().mean() * multiplier
    return torch.autograd.grad(loss, w)[0]

naive = torch.stack([rank_gradient(t, 1.0) for t in targets]).mean()
weighted = torch.stack([rank_gradient(t, ranks * c / total) for t, c in zip(targets, counts)]).mean()

w = torch.tensor(0.0, requires_grad=True)
pooled = torch.autograd.grad((w - torch.cat(targets)).square().mean(), w)[0]

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
  <img src="illustrations/_generated/ddp_token_weighting_dark.png" alt="At w=0 with squared-error loss, rank 0 has one target [1] and local mean gradient -2; rank 1 has three targets [3,3,3] and local mean gradient -6. Averaging rank means gives -4, while the pooled four-target mean gives -5, reproduced by scaling local means by N * n_r / total." />
  <figcaption>Equal-rank averaging skews toward the sparse rank (−4); scaling each rank's mean by $N n_r / \sum_j n_j$ reproduces the pooled token-mean gradient (−5).</figcaption>
</figure>

Across gradient accumulation, count valid targets across all micro-batches and ranks together (having any rank with zero valid targets participate in the count reduction with a zero loss sum).

Even with perfect loss weighting, DDP cannot shrink per-GPU model state: sixteen GPUs still hold sixteen 1.12 TB copies. **ZeRO** and **FSDP** eliminate that redundancy stage by stage.

## ZeRO stages: removing redundancy one layer at a time

Let $N$ be the number of GPUs in the **data-parallel sharding group**. Each ZeRO stage removes one more replicated buffer from every rank:[^rajbhandari2020]

<figure>
  <img src="illustrations/_generated/distributed_training_dark.png" alt="Stacked bars show per-GPU model state for a 70B 16-byte recipe across 8 ranks: DDP stores 1,120 GB (P=140, G=140, O=840), ZeRO-1 stores 385 GB (O=105), ZeRO-2 stores 262.5 GB (G=17.5, O=105), and ZeRO-3 stores 140 GB (P=17.5, G=17.5, O=105)." />
  <figcaption>Per-GPU persistent model state for 70B parameters across $N = 8$ ranks under the 16-byte recipe (P: parameters, G: gradients, O: FP32 master + Adam moments).</figcaption>
</figure>

### ZeRO stage 1: shard optimizer states

Each GPU holds optimizer states (and FP32 master weights) for only $1/N$ of parameters while keeping weights and gradients replicated. On 8 GPUs, 70B optimizer state falls from `840 GB` to `105 GB` per GPU. After backward, each rank updates its owned slice and broadcasts updated weights via all-gather.

### ZeRO stage 2: shard optimizer + gradients

Stage 2 also partitions gradients so each rank stores only the gradient shard matching its optimizer partition. During backward, **reduce-scatter** sums gradients across ranks and hands each GPU its $1/N$ slice; after the local optimizer step, **all-gather** refreshes full compute weights for the next forward pass. In the paper's equal-dtype model, reduce-scatter ($1\Psi$) plus all-gather ($1\Psi$) matches DDP's $2\Psi$ communication volume while slashing memory dramatically.

### ZeRO stage 3: shard everything

Stage 3 partitions parameters as well. No rank keeps full weights persistently; instead, each layer's weights are materialized on demand right before execution and freed immediately afterward:
1. **Forward:** All-gather the current layer/unit weights, compute activations, then reshard (release the unsharded copy).
2. **Backward:** All-gather the unit's weights again, compute local gradients, reduce-scatter gradient shards, and release full weights. After backward, each rank runs AdamW locally on its owned shard.

> **Key insight:** DDP on $N$ ranks stores $N$ full copies of the 1.12 TB model state; ZeRO-3 stores roughly **one** copy split across all $N$ ranks (`4.38 GB/GPU` on 256 GPUs) at the price of raising modeled communication volume from $2\Psi$ to $3\Psi$ (1.5x DDP).

| Component (70B on 256 GPUs) | DDP | ZeRO-1 | ZeRO-2 | ZeRO-3 |
|:---|:---|:---|:---|:---|
| Weights (2B) | 140 GB | 140 GB | 140 GB | **0.55 GB** |
| Gradients (2B) | 140 GB | 140 GB | **0.55 GB** | **0.55 GB** |
| Optimizer + FP32 master (12B) | 840 GB | **3.28 GB** | **3.28 GB** | **3.28 GB** |
| **Model states / GPU** | **1,120 GB** | **283.3 GB** | **143.8 GB** | **4.38 GB** |

<!-- leetllm: test, output=show, output_title="ZeRO stage memory output" -->
```python title="zero_stage_memory.py"
state_gb = {"parameters": 140, "gradients": 140, "optimizer_and_master": 840}
sharded_by_stage = {
    0: set(),
    1: {"optimizer_and_master"},
    2: {"optimizer_and_master", "gradients"},
    3: {"optimizer_and_master", "gradients", "parameters"},
}

for stage, sharded in sharded_by_stage.items():
    per_rank = sum(v / 256 if k in sharded else v for k, v in state_gb.items())
    print(f"ZeRO-{stage}: {per_rank:7.2f} GB/rank")
```

<!-- leetllm: output:start -->
```text title="ZeRO stage memory output" output compact
ZeRO-0: 1120.00 GB/rank
ZeRO-1:  283.28 GB/rank
ZeRO-2:  143.83 GB/rank
ZeRO-3:    4.38 GB/rank
```
<!-- leetllm: output:end -->

Remember that sharding shrinks **model states**, not activations. Long sequences and large micro-batches still require <span data-glossary="activation-checkpointing">activation checkpointing</span> (recomputing intermediates during backward) to keep peak VRAM under control.

## Communication overhead analysis

### Communication primitives you need to know

NCCL implements three collective building blocks across GPUs:[^nccl2026collectives][^nccl2026Environment]

| Primitive | Operation | Ring bytes sent / rank | Primary role |
|:---|:---|:---|:---|
| **All-reduce** | Sums tensors across all ranks; every rank gets the full sum | $2\frac{N-1}{N} S \approx 2S$ | DDP gradient sync, TP RowParallel |
| **Reduce-scatter** | Sums tensors across ranks; each rank keeps its $1/N$ slice | $\frac{N-1}{N} S \approx 1S$ | ZeRO-2/3 and FSDP gradient reduction |
| **All-gather** | Reconstructs the full tensor on every rank from $1/N$ shards | $\frac{N-1}{N} S \approx 1S$ | ZeRO-3 / FSDP parameter materialization |

Here $S$ is the **full** tensor size (each rank starts all-gather with $S/N$). Algebraically, an all-reduce decomposes directly into reduce-scatter followed by all-gather:

$$
\text{All-Reduce}(X) \equiv \text{Reduce-Scatter}(X) \to \text{All-Gather}(X)
$$

<figure>
  <img src="illustrations/_generated/collective_primitives_map_dark.png" alt="Two-rank tensor operations: All-Reduce adds [1,2] and [10,20] and returns [11,22] to both ranks; Reduce-Scatter gives [11] to rank 0 and [22] to rank 1; All-Gather joins shards into [11,22] on both ranks." />
  <figcaption>Tensor semantics of the three NCCL collectives on two ranks. Ring traffic scales as $(N-1)/N \cdot S$ per reduce-scatter or all-gather, approaching $S$ (and $2S$ for all-reduce) at large $N$.</figcaption>
</figure>

<!-- leetllm: test, output=show, output_title="Collectives output" -->
```python title="collective_primitives.py"
rank_gradients = [[1, 2], [10, 20]]
summed = [sum(col) for col in zip(*rank_gradients)]

print("all_reduce=", [summed, summed])
print("reduce_scatter=", [[summed[0]], [summed[1]]])
print("all_gather=", [["p0", "p1"], ["p0", "p1"]])
print("DDP_mean_gradient=", [v / len(rank_gradients) for v in summed])
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

Interconnect speed governs where to place each communication group:
- **Intra-node / NVLink domain:** DGX H100 quotes **900 GB/s** aggregate bidirectional NVLink per GPU; DGX B200 quotes **1,800 GB/s**; GB200 NVL72 links **72 GPUs across a rack** in one NVLink domain.[^nvidiaCuFFTMpInterconnect2025][^nvidia2026gb200nvl72]
- **Inter-node / InfiniBand or RoCE:** ConnectX-7 (`400 Gb/s`) and ConnectX-8 (`800 Gb/s`) deliver **50 GB/s** and **100 GB/s** unidirectional line rate per port before protocol overhead.[^nvidia2026infinibandAdapters] **GPUDirect RDMA** lets NICs read and write GPU HBM directly without bouncing through host RAM, avoiding CPU staging bottlenecks.[^nvidia2026gpudirectRdma]

Keep the most frequent, fine-grained per-layer collectives (like tensor parallelism) inside your fastest NVLink domain whenever possible, and place coarser collectives (FSDP or pipeline stage boundaries) across inter-node links.

### The 1.5x heuristic

With equal BF16 parameter and gradient dtypes ($\Psi$ elements), DDP moves $2\Psi$ per rank (reduce-scatter + all-gather) while ZeRO-3 / full-shard FSDP moves $3\Psi$ (forward all-gather + backward all-gather + backward reduce-scatter), yielding a **1.5x** modeled volume ratio.[^rajbhandari2020] Notice that if reductions run in FP32 (`280 GB` at 70B) while parameter gathers run in BF16 (`140 GB`), the volume ratio drops to `1.0x`:

<!-- leetllm: test, output=show, output_title="Communication heuristic output" -->
```python title="communication_heuristic.py"
param_gb, grad_gb, ranks = 140, 140, 256
ring = (ranks - 1) / ranks
ddp_gb = 2 * grad_gb * ring
zero3_gb = (2 * param_gb + grad_gb) * ring

print(f"DDP modeled sent/rank:   {ddp_gb:.2f} GB")
print(f"ZeRO-3 modeled sent/rank:{zero3_gb:.2f} GB (ratio={zero3_gb / ddp_gb:.2f}x)")

fp32_grad_gb = 280
mixed_ratio = (2 * param_gb + fp32_grad_gb) / (2 * fp32_grad_gb)
print(f"BF16 gathers + FP32 reductions ratio: {mixed_ratio:.2f}x")
```

<!-- leetllm: output:start -->
```text title="Communication heuristic output" output compact
DDP modeled sent/rank:   278.91 GB
ZeRO-3 modeled sent/rank:418.36 GB (ratio=1.50x)
BF16 gathers + FP32 reductions ratio: 1.00x
```
<!-- leetllm: output:end -->

```checkpoint
Why can ZeRO-3 be slower than DDP even if the modeled byte ratio is only 1.5x?
---
Total bytes are only half the story. ZeRO-3 splits communication into many layer-level all-gathers and reduce-scatters. On higher-latency interconnects, small unhidden collectives sit on the critical path and stall compute far more than coarse DDP buckets.
```

## FSDP (Fully Sharded Data Parallel)

PyTorch's native sharding API is **`torch.distributed.fsdp.fully_shard` (FSDP2)**, which stores per-parameter `DTensor` shards in place on original modules (superseding the deprecated `FullyShardedDataParallel` / FSDP1 `FlatParameter` wrapper).[^pytorchFsdp2Docs2025][^pytorchFsdp2Tutorial2025] FSDP2 composes cleanly with `DeviceMesh`, `torch.compile`, standard profilers, and Distributed Checkpoint (DCP).[^pytorchCompileDocs2025][^pytorchFsdpDocs2025]

### How full sharding materializes one unit: the FSDP lifecycle

Trace one transformer block with `reshard_after_forward=True`, FP32 persistent shards, BF16 compute, and FP32 gradient reductions:[^pytorchFsdp2Docs2025][^pytorchFsdp2Tutorial2025]

1. **At rest:** Each rank holds its FP32 parameter shard and AdamW moments (`.grad` is `None` after `zero_grad(set_to_none=True)`).
2. **Forward all-gather:** Ranks gather the block's full BF16 weights. Wrapping each transformer block separately prevents gathering the whole model at once.
3. **Forward compute and reshard:** Run the block, keep activations needed for backward, and immediately free the gathered BF16 weights.
4. **Backward all-gather:** Re-gather the block's full BF16 weights to compute input gradients ($dX = dY W^T$).
5. **Backward compute and reduce-scatter:** Compute full local weight gradients ($dW = X^T dY$), then reduce-scatter so each rank keeps only its reduced FP32 gradient shard and frees the full weights and full gradient buffer.
6. **Optimizer update:** Run local AdamW on each owned shard (note that global gradient-norm clipping still requires a distributed norm reduction).

<figure>
  <img src="illustrations/_generated/fsdp_unit_lifecycle_dark.png" alt="Six-event FSDP2 lifecycle for one 1B-parameter unit across 4 ranks: FP32 shard stays resident at 1 GB; forward and backward temporarily materialize 2 GB BF16 full weights; backward computes full-unit dW before reduce-scatter keeps only the shard." />
  <figcaption>For a 1B-parameter block across 4 ranks, each rank holds a 1 GB FP32 shard and temporarily gathers a 2 GB BF16 compute copy during forward and backward before reduce-scattering gradients.</figcaption>
</figure>

### Prefetching: overlapping communication with compute

Running gathers and matrix multiplies sequentially stalls the GPU on every layer. FSDP2 uses **implicit prefetching** by default, issuing the next block's all-gather on a separate NCCL stream while the current block computes.[^pytorchFsdp2Tutorial2025] Exposed transfer time is roughly $\max(0, T_{\text{gather}} - T_{\text{window}})$: a 4 ms gather launched at the start of a 6 ms layer disappears completely, whereas launching it 1 ms before the next layer exposes 3 ms of idle wait. When profiling reveals exposed communication on CPU-bound runs, explicit `set_modules_to_forward_prefetch` and `set_modules_to_backward_prefetch` can prefetch further ahead at the cost of holding extra gathered blocks in VRAM.

### FSDP2: `fully_shard` on DTensors

> **Common mistake:** Constructing the optimizer before calling `fully_shard`, or wrapping the root model before its transformer blocks. Always apply `fully_shard` **bottom-up** (each transformer block first, then the root module), and instantiate `AdamW` **after** sharding so it binds to sharded `DTensor` parameters.[^pytorchFsdp2Docs2025][^pytorchFsdp2Tutorial2025]

`reshard_after_forward` replaces FSDP1's sharding strategy enum: `True` frees weights after forward (`FULL_SHARD`), `False` retains them through backward (`SHARD_GRAD_OP`), and an integer divisor (such as `4` on an 8-rank group) retains partial shards to trade VRAM for smaller backward gathers. `MixedPrecisionPolicy(param_dtype=torch.bfloat16, reduce_dtype=torch.float32)` keeps persistent FP32 shards directly as the optimizer parameters without a separate master weight tensor:

```python title="fsdp2_structure.py"
import torch
from torch.distributed.fsdp import MixedPrecisionPolicy, fully_shard

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

Notice how FSDP2's mixed-precision inventory still totals **16 bytes/param** across the shard group once FP32 gradient shards exist, just allocated differently (`4B FP32 shard + 4B FP32 grad shard + 8B Adam moments` instead of `2B + 2B + 4B master + 8B moments`):

<!-- leetllm: test, output=show, output_title="Two model-state recipes" -->
```python title="fsdp2_vs_zero_recipe.py"
params_b = 70
zero_paper = {"param_bf16": 2, "grad_bf16": 2, "master_fp32": 4, "adam_fp32": 8}
fsdp2 = {"param_fp32": 4, "grad_fp32": 4, "adam_fp32": 8}

print(f"ZeRO paper recipe: {sum(zero_paper.values())} B/param -> {params_b * sum(zero_paper.values())} GB")
print(f"FSDP2 persistent (before grads): {(fsdp2['param_fp32'] + fsdp2['adam_fp32']) * params_b} GB")
print(f"FSDP2 with FP32 grads: {sum(fsdp2.values())} B/param -> {params_b * sum(fsdp2.values())} GB")
```

<!-- leetllm: output:start -->
```text title="Two model-state recipes" output compact
ZeRO paper recipe: 16 B/param -> 1120 GB
FSDP2 persistent (before grads): 840 GB
FSDP2 with FP32 grads: 16 B/param -> 1120 GB
```
<!-- leetllm: output:end -->

During gradient accumulation, `set_requires_gradient_sync(False)` skips intermediate reduce-scatters (keeping full unsharded gradients in VRAM until the final micro-batch), while `set_reshard_after_backward(False)` retains full weights to skip the next gather.[^pytorchFsdp2Docs2025]

Wrapping each block separately cuts peak gathered parameter memory by the number of blocks: for four 3.5 GB blocks, root-only wrapping gathers `14.0 GB` at once whereas blockwise wrapping gathers `3.5 GB` (a 4x drop).

| Feature | FSDP1 (`FullyShardedDataParallel`) | FSDP2 (`fully_shard`) |
|:---|:---|:---|
| **Sharding mechanism** | Wrapper module with `FlatParameter` | In-place hooks with per-parameter `DTensor` |
| **Parameter names** | Flattened internal names | Original parameter names preserved |
| **TP & frozen-param mix** | Awkward; extra grad cost for frozen mix | Native `DeviceMesh` composition; clean frozen params |
| **Prefetch / rate limit** | `backward_prefetch`, `limit_all_gathers` | Implicit prefetch + explicit module prefetch APIs |
| **CPU offload** | `CPUOffload(offload_params=True)` | `CPUOffloadPolicy()` |
| **Gradient clipping** | `fsdp_model.clip_grad_norm_()` | Standard `torch.nn.utils.clip_grad_norm_(...)` |

<details>
<summary>Deep dive: legacy FSDP1 wrapper code and strategy mapping</summary>

In older FSDP1 codebases, map strategies as follows: `FULL_SHARD` corresponds to `reshard_after_forward=True`, `SHARD_GRAD_OP` to `reshard_after_forward=False`, `HYBRID_SHARD` to a 2D `DeviceMesh` (sharding inside each node and replicating across nodes), and `NO_SHARD` to plain DDP. Note that hybrid sharding on 4 nodes of 8 GPUs divides 70B state by 8 (`140 GB/GPU`), not 32 (`35 GB/GPU`), because sharding happens only within each 8-GPU node!

```python title="fsdp1_existing_code.py"
import functools
import torch
from torch.distributed.fsdp import (
    BackwardPrefetch,
    FullyShardedDataParallel as FSDP,
    MixedPrecision,
    ShardingStrategy,
)
from torch.distributed.fsdp.wrap import transformer_auto_wrap_policy

wrap_policy = functools.partial(
    transformer_auto_wrap_policy,
    transformer_layer_cls={TransformerDecoderLayer},
)
fsdp_model = FSDP(
    model,
    auto_wrap_policy=wrap_policy,
    sharding_strategy=ShardingStrategy.FULL_SHARD,
    mixed_precision=MixedPrecision(param_dtype=torch.bfloat16, reduce_dtype=torch.bfloat16, buffer_dtype=torch.bfloat16),
    backward_prefetch=BackwardPrefetch.BACKWARD_PRE,
    limit_all_gathers=True,  # CPU rate limiter for peak memory, NOT an overlap knob
    device_id=torch.cuda.current_device(),
)
optimizer = torch.optim.AdamW(fsdp_model.parameters(), lr=2e-5)
```

</details>

## Checkpointing, resume, and fault recovery

A training setup that cannot resume faithfully is incomplete. Reloading weights alone drops AdamW's moments, learning-rate phase, AMP scaler, RNG states, and dataloader cursor.[^torchtune2026checkpointer] Save **sharded checkpoints** in parallel via DCP (or DeepSpeed Universal Checkpointing when changing world size) at completed optimizer-step boundaries rather than gathering terabytes onto rank 0.[^pytorchFsdp2Docs2025][^deepspeedUniversalCheckpointing2026]

Watch why matching the first resumed loss is not enough to prove a clean restore: a weights-only reload sees the identical pre-update loss on step 4, yet takes a different AdamW parameter update because moments and step count reset:

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
buf = io.BytesIO()
torch.save({"model": model.state_dict(), "optimizer": optimizer.state_dict(),
            "rng": torch.get_rng_state()}, buf)

expected_loss = step(model, optimizer)
expected_params = torch.cat([p.detach().flatten() for p in model.parameters()])

def restore(include_optimizer):
    buf.seek(0)
    saved = torch.load(buf, weights_only=True)
    m, opt = make_run()
    m.load_state_dict(saved["model"])
    if include_optimizer:
        opt.load_state_dict(saved["optimizer"])
    torch.set_rng_state(saved["rng"])
    loss = step(m, opt)
    return loss, torch.cat([p.detach().flatten() for p in m.parameters()])

res_loss, res_params = restore(True)
wo_loss, wo_params = restore(False)

print("full_resume_next_update_equal=", torch.equal(res_params, expected_params))
print("weights_only_same_loss=", torch.equal(wo_loss, expected_loss))
print("weights_only_same_update=", torch.equal(wo_params, expected_params))
```

<!-- leetllm: output:start -->
```text title="Checkpoint continuation output" output compact
full_resume_next_update_equal= True
weights_only_same_loss= True
weights_only_same_update= False
```
<!-- leetllm: output:end -->

## DeepSpeed ZeRO

DeepSpeed implements ZeRO-1/2/3 alongside hierarchical host-RAM and NVMe offloading (**ZeRO-Offload** and **ZeRO-Infinity**).[^rajbhandari2020][^rajbhandari2021] When CPU offload is enabled, specifying `"AdamW"` selects `DeepSpeedCPUAdam` automatically, and bucket sizes (`reduce_bucket_size`, `stage3_prefetch_bucket_size`) count **elements** rather than bytes (500M BF16 elements = 1 GB).[^deepspeed2026optimizerSelection][^deepspeedZeroDocs2026] Under default `managed_gradient_accumulation=True`, call `model_engine.backward(loss)` and `model_engine.step()` on every micro-batch without manually dividing the loss by `gradient_accumulation_steps`. For dynamic-routing architectures like MoE, mark routed blocks as ZeRO-3 leaf modules so ranks never deadlock on unmatched parameter gathers.[^deepspeedTrainingDocs2026]

<details>
<summary>Deep dive: sample DeepSpeed ZeRO-3 + CPU offload configuration</summary>

```python title="deepspeed-zero.py"
import deepspeed

ds_config = {
    "train_micro_batch_size_per_gpu": 1,
    "gradient_accumulation_steps": 8,
    "bf16": {"enabled": True},
    "optimizer": {
        "type": "AdamW",
        "params": {"lr": 2e-5, "betas": [0.9, 0.999], "eps": 1e-8, "weight_decay": 0.01},
    },
    "zero_optimization": {
        "stage": 3,
        "offload_optimizer": {"device": "cpu", "pin_memory": True},
        "offload_param": {"device": "cpu", "pin_memory": True},
        "overlap_comm": True,
        "contiguous_gradients": True,
        "reduce_bucket_size": 500_000_000,
        "stage3_prefetch_bucket_size": 50_000_000,
        "stage3_param_persistence_threshold": 100_000,
    },
}
model_engine, optimizer, _, _ = deepspeed.initialize(
    model=model, config=ds_config, model_parameters=model.parameters()
)
```

</details>

### ZeRO-Infinity: CPU and NVMe offloading

ZeRO-Infinity spills sharded states to host DRAM or NVMe arrays.[^rajbhandari2021] That buys capacity at the cost of crossing slower links: never confuse GPU HBM bandwidth (e.g., 3.35 TB/s on H100 SXM or up to 8 TB/s on B200)[^nvidia2026hgxComponents] with the PCIe / NVLink-C2C host link or NVMe throughput that actually gates offloaded transfers. For example, moving a 6 GB payload over a 15 GB/s host-GPU link takes at least `6 / 15 = 0.4 s` regardless of how fast HBM runs.

Also check DeepSpeed's stage compatibility matrix before combining features: **AutoTP** supports ZeRO stages 0 through 3, whereas **`PipelineModule`** supports only ZeRO-0 and ZeRO-1 (excluding ZeRO-2 and ZeRO-3).[^deepspeedConfigJson2026][^deepspeedPipelineDocs2026]

## FSDP vs DeepSpeed comparison

| Feature | FSDP2 | DeepSpeed ZeRO |
|:---|:---|:---|
| **Runtime model** | Native PyTorch distributed stack | Separate DeepSpeed runtime |
| **Sharding modes** | ZeRO-2-like (`reshard_after_forward=False`) and ZeRO-3-like (`True`) | Native ZeRO-1, 2, 3 |
| **Offloading** | CPU offload via `CPUOffloadPolicy()` | CPU and NVMe via ZeRO-Offload / ZeRO-Infinity |
| **Parallelism composition** | `DeviceMesh` with TP and PyTorch pipelining | AutoTP (ZeRO 0–3); `PipelineModule` (ZeRO 0–1 only) |
| **Checkpointing & profiling** | Standard PyTorch DCP and `torch.profiler` | DeepSpeed checkpointing + Universal Checkpointing |

**Default choice:** Start with **FSDP2** for native PyTorch tooling, `DeviceMesh` composition, and standard debugging whenever GPU HBM (or CPU offload) suffices. Reach for **DeepSpeed** when NVMe spillover via ZeRO-Infinity is essential or you are extending an existing DeepSpeed / Megatron-DeepSpeed stack.

```checkpoint
You already know the model-state math fits once sharded. What question decides whether you stay with FSDP or reach for DeepSpeed?
---
Ask what requirement remains unsolved after sharding. If native PyTorch tooling, DeviceMesh composition, and standard checkpoints cover your needs, stay with FSDP. If you need NVMe offload (ZeRO-Infinity) or already run a DeepSpeed stack, choose DeepSpeed.
```

## Beyond data parallelism: 4D parallelism

Data-parallel sharding hits three ceilings at extreme scale:
1. **Batch ceiling:** Pure DP across 1,024 GPUs forces at least 1,024 sequences per step ($B_{\text{global}} = B_{\text{micro}} \times m \times DP$).
2. **Single-layer ceiling:** Even full sharding must gather each wrapped unit; a single $16{,}384 \times 65{,}536$ BF16 projection alone occupies `2.15 GB` before gradients and activations.
3. **Long-context ceiling:** Even with FlashAttention eliminating quadratic score materialization, saved layer activations scale linearly with sequence length and dense attention FLOPs stay quadratic.

**4D parallelism** composes four orthogonal axes across a regular Cartesian mesh:[^shoeybi2019][^narayanan2021][^liu2024ring]

$$
\text{World Size} = DP \times TP \times PP \times CP
$$

Only $DP$ counts **independent sequence replicas**. Ranks along $TP$, $PP$, and $CP$ cooperate on the same replica's sequences and never increase the global batch size.

<figure>
  <img src="illustrations/_generated/parallelism_topology_map_dark.png" alt="One sequence replica spans two 8-GPU nodes as 2 PP stages, each arranged as 2 CP rows by 4 TP columns (16 ranks per replica). Repeating 8 times for DP=8 gives 128 ranks total, and with micro-batch 1 and 4 accumulation steps yields 32 global sequences." />
  <figcaption>A 128-GPU 4D mesh ($DP=8, TP=4, PP=2, CP=2$). Each 16-GPU replica cooperates on one batch slice, so $B_{\text{micro}}=1$ and $m=4$ give $1 \times 4 \times 8 = 32$ global sequences.</figcaption>
</figure>

### Tensor parallelism (Megatron-LM ColumnParallel & RowParallel)

Tensor parallelism (TP) splits individual matrix multiplications inside each transformer block.[^shoeybi2019] In an MLP $Z = \text{GeLU}(X W_1) W_2$:
1. **ColumnParallelLinear ($W_1$):** Slice $W_1$ along columns into $k$ shards. Each rank computes $Y_i = X W_{1,i}$ and applies elementwise $\text{GeLU}(Y_i)$ with **zero communication**.
2. **RowParallelLinear ($W_2$):** Slice $W_2$ along rows. Each rank computes $Z_i = \text{GeLU}(Y_i) W_{2,i}$, followed by one **All-Reduce** to sum $Z = \sum_i Z_i$.

Self-attention mirrors this pair: $W_Q, W_K, W_V$ are column-parallel (partitioning attention heads across ranks), and $W_O$ is row-parallel followed by one **All-Reduce**. That yields **2 forward + 2 backward all-reduces per transformer layer**,[^narayanan2021] which is why TP belongs inside fast NVLink domains.

### Pipeline parallelism & 1F1B bubble mechanics

Pipeline parallelism (PP) assigns contiguous layer ranges to stages (e.g., layers 1–16 on Stage 0, 17–32 on Stage 1), passing activations forward and gradients backward via point-to-point sends.[^narayanan2021]

In **GPipe**, every stage runs all $m$ forward micro-batches before any backward pass, holding $m$ live activation sets at once. For $p$ balanced stages, fill-and-drain idle time creates a **pipeline bubble**:

$$
\text{Bubble overhead (vs. useful work)} = \frac{p - 1}{m}, \qquad
\text{Idle fraction (of elapsed time)} = \frac{p - 1}{m + p - 1}
$$

**1F1B (PipeDream-Flush)** alternates one forward and one backward pass during steady state before flushing the batch synchronously.[^narayanan2019pipedream][^narayanan2021] Stage $i$ ($0$-indexed) runs $\min(m, p - i - 1)$ warmup forwards and holds at most $\min(m, p - i)$ live activation sets at peak.[^megatron2026pipelineSchedule]

> **Key insight:** Plain non-interleaved 1F1B slashes peak activation memory from $O(m)$ down to $O(p)$, **without shrinking the fill/drain bubble** compared to GPipe! Reducing the bubble itself requires increasing $m$ (e.g., $m \ge 4p$ brings elapsed idle time below 20%) or interleaving multiple non-contiguous layer chunks per stage.

<!-- leetllm: test, output=show, output_title="Pipeline bubble output" -->
```python title="pipeline_bubble_ratios.py"
for p, m in ((8, 1), (8, 32), (64, 256)):
    overhead = (p - 1) / m
    idle = (p - 1) / (m + p - 1)
    print(f"p={p:>2}, m={m:>3}: overhead={overhead:7.2%}, elapsed_idle={idle:6.2%}")

p, m = 4, 8
print("warmup_forwards (p=4, m=8):", [min(m, p - i - 1) for i in range(p)])
print("max_live_activations:      ", [min(m, p - i) for i in range(p)])
```

<!-- leetllm: output:start -->
```text title="Pipeline bubble output" output compact
p= 8, m=  1: overhead=700.00%, elapsed_idle=87.50%
p= 8, m= 32: overhead= 21.88%, elapsed_idle=17.95%
p=64, m=256: overhead= 24.61%, elapsed_idle=19.75%
warmup_forwards (p=4, m=8): [3, 2, 1, 0]
max_live_activations:       [4, 3, 2, 1]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pipeline_flush_schedule_dark.png" alt="For p=4 stages and m=8 micro-batches, warmup forwards are [3,2,1,0] and max live activation sets under 1F1B are [4,3,2,1] versus 8 under GPipe, while both share the same ideal fill/drain bubble." />
  <figcaption>GPipe and plain 1F1B share identical bubble ratios for balanced stages; 1F1B wins by bounding peak live activation sets per stage to $\min(m, p - i)$.</figcaption>
</figure>

### Context parallelism (Ring Attention)

When extreme sequence lengths overflow VRAM, **context parallelism (CP)** splits the sequence dimension $S$ across $C$ GPUs.[^liu2024ring] In **Ring Attention**, each rank holds its local query block $Q$ stationary while key/value blocks rotate asynchronously around a ring, combining block outputs via online softmax while overlapping KV transfers with attention compute.

| Axis | What it splits | Typical communication | Primary constraint |
|:---|:---|:---|:---|
| **Data / FSDP (DP)** | Independent sequences (+ sharded model state) | All-reduce or all-gather / reduce-scatter | Overlap collectives with layer compute |
| **Tensor (TP)** | Weight matrices inside each layer | 2 fwd + 2 bwd all-reduces per layer | Requires fast intra-node bandwidth (NVLink) |
| **Pipeline (PP)** | Contiguous layer ranges | Point-to-point activations & gradients | Balance stage compute; keep $m \gg p$ |
| **Context (CP)** | Tokens within each sequence | Ring KV transfers | Keep block compute larger than KV transfer time |

<!-- leetllm: test, output=show, output_title="Topology size output" -->
```python title="parallelism_topology_size.py"
dp, tp, pp, cp = 8, 4, 2, 2
world_size = dp * tp * pp * cp
micro_batch, accum = 1, 4

print("world_size=", world_size)
print("ranks_per_data_replica=", tp * pp * cp)
print("global_batch_sequences=", micro_batch * accum * dp)
```

<!-- leetllm: output:start -->
```text title="Topology size output" output compact
world_size= 128
ranks_per_data_replica= 16
global_batch_sequences= 32
```
<!-- leetllm: output:end -->

## Debugging & profiling distributed training

Distributed bugs rarely crash loudly on one line; more often a rank hangs in NCCL, a straggler drags step time down, or an unsharded buffer spikes VRAM.

### Common failure modes and profiler workflow

1. **NCCL timeouts or hangs:** One rank crashed earlier or diverged in collective call order. Inspect rank 0 and the *earliest* failing rank log; enable `TORCH_NCCL_DUMP_ON_TIMEOUT=1` with a positive `TORCH_NCCL_TRACE_BUFFER_SIZE` (and `NCCL_DEBUG=INFO`, `TORCH_DISTRIBUTED_DEBUG=DETAIL` when reproducing deadlocks).[^pytorchNcclEnvironment2026]
2. **Startup OOM:** Initialize massive models on `torch.device("meta")` before sharding and loading checkpoints so no rank ever materializes the full unsharded model at once.
3. **Sharded gradient clipping:** Use `torch.nn.utils.clip_grad_norm_` with FSDP2 `DTensor`s (or `fsdp_model.clip_grad_norm_()` in legacy FSDP1).

Pair loss curves with systems telemetry so hardware regressions never hide behind healthy convergence:[^megatronCoreParallelism2026]

| Telemetry signal | Bottleneck it exposes | Actionable lever |
|:---|:---|:---|
| **Step time split** | Data loading vs. forward/backward vs. optimizer vs. checkpoint | Fix dataloader workers or overlap async checkpointing |
| **Exposed `ncclAllGather` / `ncclReduceScatter`** | Sharding traffic exceeding compute overlap | Adjust wrapping granularity, prefetching, or switch to hybrid shard / TP |
| **Pipeline idle gaps** | Bubble dominating elapsed step time | Raise micro-batch count $m$ or enable interleaved 1F1B |
| **Peak HBM & allocator retries** | Activations or transient full-unit grads near OOM | Enable activation checkpointing, reduce micro-batch, or shard finer |
| **Low MFU despite full HBM** | Memory-bound kernels, tiny batches, or host stalls | Enable FlashAttention, `torch.compile`, and inspect CPU traces |

When debugging, shrink to the smallest rank count that reproduces the failure, confirm matched collective sequences across ranks, capture a `torch.profiler` trace, and change one axis at a time.

## A worked sizing exercise

How many 80 GB GPUs does our 70B model need under ZeRO-3 (16 bytes/param = `1,120 GB` model state)?

1. **Static model-state floor:** $1{,}120 / 80 = \mathbf{14\text{ GPUs}}$. That leaves **0 GB** for activations, gathered blocks, communication buffers, and allocator overhead, so 14 GPUs will OOM immediately.
2. **Add transient live memory:** Assume `18 GB` per GPU for activations, gathered parameters, and workspace buffers (always profile this number on your actual sequence length and batch size):

<!-- leetllm: test, output=show, output_title="Workload memory budget output" -->
```python title="zero3_workload_budget.py"
import math

state_total_gb, gpu_cap_gb, extra_peak_gb = 70 * 16, 80, 18
print("static_model_state_floor_gpus=", math.ceil(state_total_gb / gpu_cap_gb))

for gpus in (14, 16, 24, 32):
    state = state_total_gb / gpus
    peak = state + extra_peak_gb
    print(f"{gpus:>2} GPUs -> states={state:5.1f} GB, peak_est={peak:5.1f} GB, fits_80GB={peak <= gpu_cap_gb}")
```

<!-- leetllm: output:start -->
```text title="Workload memory budget output" output compact
static_model_state_floor_gpus= 14
14 GPUs -> states= 80.0 GB, peak_est= 98.0 GB, fits_80GB=False
16 GPUs -> states= 70.0 GB, peak_est= 88.0 GB, fits_80GB=False
24 GPUs -> states= 46.7 GB, peak_est= 64.7 GB, fits_80GB=True
32 GPUs -> states= 35.0 GB, peak_est= 53.0 GB, fits_80GB=True
```
<!-- leetllm: output:end -->

On 16 GPUs, model states leave only `10 GB` of headroom, failing the `18 GB` workload budget. Moving to 24 or 32 GPUs (3 or 4 eight-GPU nodes) brings persistent state down to `46.7` or `35.0 GB` and restores comfortable room for activations and prefetching.

```checkpoint
The raw model-state math says a 70B run needs at least 14 GPUs with ZeRO-3, and you have sixteen 80 GB cards. Why is that still risky?
---
Fourteen GPUs is only the static model-state floor. On 16 GPUs, model states still occupy 70 GB per card, leaving only 10 GB for activations, gathered layer parameters, communication buffers, and CUDA allocator overhead.
```

## Common pitfalls

- **Confusing sharding with tensor parallelism:** ZeRO and FSDP shard persistent model state across DP ranks; each rank still runs whole-layer matmuls. Tensor parallelism splits individual matmuls across GPUs.
- **Wrapping the entire model as one FSDP unit:** A single root wrapper gathers every parameter at once, erasing layer-by-layer memory savings. Always shard each transformer block before the root.
- **Treating `limit_all_gathers=True` (FSDP1) as an overlap knob:** It is a CPU rate limiter that caps peak memory, not a prefetch schedule. Use `backward_prefetch` (FSDP1) or FSDP2's implicit/explicit module prefetch APIs for overlap.
- **Equating `SHARD_GRAD_OP` / `reshard_after_forward=False` with ZeRO-2:** PyTorch keeps parameters unsharded across both forward and backward before resharding, raising peak memory relative to `FULL_SHARD` / `reshard_after_forward=True`.[^pytorchFsdpDocs2025][^pytorchFsdp2Tutorial2025]
- **Forgetting activation memory:** Sharding cuts model-state HBM, not long-context activations. Pair FSDP/ZeRO-3 with activation checkpointing when sequences grow.
- **Combining incompatible DeepSpeed features:** `PipelineModule` rejects ZeRO-2 and ZeRO-3; verify the compatibility matrix before designing a hybrid launch.

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
