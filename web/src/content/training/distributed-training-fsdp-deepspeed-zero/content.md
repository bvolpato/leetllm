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
  "shortDescription": "One replicated 70B AdamW state exceeds an 80 GB GPU. Shard optimizer, gradients, and parameters with FSDP2 or DeepSpeed ZeRO, manage offload and checkpoints, and compose 4D parallelism when layers or sequences overflow.",
  "keyConceptsTested": [
    "16-byte and 18-byte mixed-precision AdamW memory breakdown",
    "ZeRO stages (1, 2, 3) and reduce-before-update Adam semantics",
    "FSDP2 fully_shard, DTensors, and reshard_after_forward lifecycle",
    "DeepSpeed ds_config.json, grad_accum_dtype, and managed accumulation",
    "ZeRO-Offload and ZeRO-Infinity CPU/NVMe bandwidth tradeoffs",
    "Resumable checkpoints vs consolidated inference exports (zero_to_fp32)",
    "NCCL collectives: All-Reduce, Reduce-Scatter, and All-Gather",
    "4D parallelism (DP, TP, PP, CP), 1F1B bubbles, and Ring Attention"
  ],
  "prerequisites": [
    "mixed-precision-training-loss-scaling",
    "pytorch-training-loops",
    "cuda-gpu-computing-for-ml"
  ],
  "section": "Training, Fine-Tuning & Alignment",
  "order": 6,
  "aliases": [
    "deep-dive-deepspeed",
    "training-run-operations"
  ]
}
---

Two 8-GPU nodes give you sixteen 80 GB accelerators: **1,280 GB of aggregate HBM**. Launch a 70B mixed-precision AdamW job with PyTorch Distributed Data Parallel (DDP), and it crashes immediately. Even one BF16 copy of 70B weights takes **140 GB**, overflowing every 80 GB GPU before a single gradient, optimizer moment, or activation exists. Because DDP replicates the full model state on every rank, adding GPUs merely duplicates the bottleneck.

**Fully Sharded Data Parallel (FSDP)** and **<span data-glossary="deepspeed">DeepSpeed</span> <span data-glossary="zero">ZeRO (Zero Redundancy Optimizer)</span>** unlock aggregate HBM by partitioning optimizer states, gradients, and parameters across data-parallel ranks, trading redundant memory for structured collective communication.[^rajbhandari2020][^zhao2023]

## The memory wall in numbers

Under the classic mixed-precision AdamW recipe, each parameter carries **16 bytes of model state** before activations, communication buckets, or allocator overhead:[^rajbhandari2020]

| Tensor | Bytes / param | Role |
|---|---:|---|
| Compute weight (BF16/FP16) | 2 | Forward and backward Tensor Core matmuls |
| Gradient (BF16/FP16) | 2 | Gradient awaiting optimizer step (4 B if FP32 grad accum) |
| FP32 master parameter | 4 | Full-precision weights preserving small updates |
| FP32 Adam moments ($m_t, v_t$) | 8 | Running mean of gradients and uncentered squared gradients |
| **Total** | **16** | **Model state only (18 B with FP32 grad accum)** |

Two subtleties break naive budgets. First, BF16 compute does not force BF16 gradient accumulation: setting `data_types.grad_accum_dtype: "fp32"` in DeepSpeed raises the ZeRO master-weight layout from 16 to **18 bytes/param**.[^deepspeedConfigJson2026] Second, FP32 master weights exist because subtracting `1e-4` from `1.0` rounds back to `1.0` in FP16 and BF16 while surviving in FP32 (though even FP32 loses decrements below half its $2^{-24}$ gap, such as `1e-8`):

<!-- leetllm: test, deps=torch, output=show, output_title="Stored update output" -->
```python title="stored_parameter_updates.py"
import torch

for name, dtype in (("FP16", torch.float16), ("BF16", torch.bfloat16), ("FP32", torch.float32)):
    w = torch.tensor(1.0, dtype=dtype)
    gap = (w - torch.nextafter(w, torch.tensor(0.0, dtype=dtype))).item()
    print(f"{name}: gap={gap:.3e}, 1e-8={(w.float()-1e-8).to(dtype).item()!=1.0}, 1e-4={(w.float()-1e-4).to(dtype).item()!=1.0}")
```

<!-- leetllm: output:start -->
```text title="Stored update output" output compact
FP16: gap=4.883e-04, 1e-8=False, 1e-4=False
BF16: gap=3.906e-03, 1e-8=False, 1e-4=False
FP32: gap=5.960e-08, 1e-8=False, 1e-4=True
```
<!-- leetllm: output:end -->

At 70B parameters, 16 bytes/param totals **1,120 GB**: 140 GB weights, 140 GB gradients, and **840 GB** (75%) in FP32 master weights and Adam moments.

<figure>
  <img src="illustrations/_generated/model_state_memory_wall_dark.png" alt="70B 16-byte recipe totals 1,120 GB (P=140, G=140, master=280, moments=560). Equal sharding over 16, 32, 64, or 256 ranks uses 70, 35, 17.5, or 4.375 GB per 80 GB GPU." />
  <figcaption>Master weights and Adam moments dominate 70B memory (840 of 1,120 GB). Sharding scales persistent state down linearly with rank count.</figcaption>
</figure>

## Why DDP hits a limit (and uneven token weighting)

DDP replicates the full model on every GPU, feeds each rank a different batch slice, and averages gradients via bucketed all-reduce overlapped with backward compute.[^pytorchDdpDocs2026] When packed or response-masked batches give rank $r$ an unequal count of $n_r$ supervised tokens across $N$ ranks, default DDP averages each rank's *local mean* equally rather than every token equally. Scaling rank $r$'s local mean by $N n_r / \sum_j n_j$ (summed across microbatches and ranks) recovers the exact pooled token-mean gradient:

<!-- leetllm: test, deps=torch, output=show, output_title="Rank loss weighting output" -->
```python title="unequal_rank_loss_weighting.py"
import torch

targets = [torch.tensor([1.0]), torch.tensor([3.0, 3.0, 3.0])]
counts, ranks = [t.numel() for t in targets], len(targets)
total = sum(counts)

def rank_grad(t, mult):
    w = torch.tensor(0.0, requires_grad=True)
    return torch.autograd.grad((w - t).square().mean() * mult, w)[0]

naive = torch.stack([rank_grad(t, 1.0) for t in targets]).mean()
weighted = torch.stack([rank_grad(t, ranks * c / total) for t, c in zip(targets, counts)]).mean()
w = torch.tensor(0.0, requires_grad=True)
pooled = torch.autograd.grad((w - torch.cat(targets)).square().mean(), w)[0]
print(f"naive={naive.item():.1f} | token_weighted_DDP={weighted.item():.1f} | pooled={pooled.item():.1f}")
```

<!-- leetllm: output:start -->
```text title="Rank loss weighting output" output compact
naive=-4.0 | token_weighted_DDP=-5.0 | pooled=-5.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/ddp_token_weighting_dark.png" alt="Rank 0 has one target [1] (grad -2); rank 1 has three targets [3,3,3] (grad -6). Equal-rank mean gives -4; scaling by N * n_r / total matches the pooled mean -5." />
  <figcaption>Equal-rank averaging skews toward sparse ranks (−4); scaling each rank by $N n_r / \sum_j n_j$ restores the exact pooled gradient (−5).</figcaption>
</figure>

## ZeRO stages: sharding state and preserving Adam math

For $P$ parameters owned by a data-parallel group of $N$ ranks with $(p, g, o)$ bytes/param for compute weights, gradients, and optimizer-plus-master state, each ZeRO stage shards one more buffer:[^rajbhandari2020]

$$
\begin{aligned}
M_{\text{DP}} &= P(p + g + o), &
M_{\text{Z1}} &= P(p + g + o/N), \\
M_{\text{Z2}} &= P(p + (g + o)/N), &
M_{\text{Z3}} &= P(p + g + o)/N.
\end{aligned}
$$

<figure>
  <img src="illustrations/_generated/distributed_training_dark.png" alt="Per-GPU 70B 16-byte model state across 8 ranks: DDP 1,120 GB, ZeRO-1 385 GB, ZeRO-2 262.5 GB, ZeRO-3 140 GB." />
  <figcaption>Per-GPU persistent state for 70B parameters across $N = 8$ ranks under the 16-byte recipe (P: parameters, G: gradients, O: master + moments).</figcaption>
</figure>

- **ZeRO-1** shards optimizer states ($1/N$ of the 12-byte block), updating owned slices and all-gathering updated weights.
- **ZeRO-2** also shards gradients via **reduce-scatter** during backward so unowned gradients are discarded immediately, followed by an **all-gather** of updated weights.
- **ZeRO-3** shards parameters too: forward all-gathers each layer on demand and frees it afterward; backward re-gathers weights, reduce-scatters gradient shards, and releases full buffers.

Why can't ranks run local Adam updates and average weights afterward? Because Adam's second moment $v_t$ squares the gradient:[^kingma2015] for gradients `1` and `3`, reducing first yields $2^2 = 4$, while squaring locally and averaging yields $(1^2+3^2)/2 = 5$. ZeRO preserves exact Adam math by always **reducing gradients first** so the owner updates once on the averaged slice.

In ZeRO-3, remember **live working sets**: each rank retains its local shard while allocating a separate padded gather buffer for the active layer (plus another if prefetching).[^deepspeed2026source] Also remember sharding shrinks model state, not activations; pair with <span data-glossary="activation-checkpointing">activation checkpointing</span> for long sequences.

<!-- leetllm: test, output=show, output_title="ZeRO memory and working set" -->
```python title="zero_stage_memory.py"
import numpy as np

def per_rank_gb(params_b: int, ranks: int, p: int, g: int, o: int) -> dict[str, float]:
    return {"DP": params_b*(p+g+o), "Z1": params_b*(p+g+o/ranks),
            "Z2": params_b*(p+(g+o)/ranks), "Z3": params_b*(p+g+o)/ranks}

print("70B/256r (16B BF16 grad):", {k: round(v, 2) for k, v in per_rank_gb(70, 256, 2, 2, 12).items()})
print("70B/256r (18B FP32 grad):", {k: round(v, 2) for k, v in per_rank_gb(70, 256, 2, 4, 12).items()})

sizes, ranks = np.array([8, 8, 8, 8]), 4
shards = np.ceil(sizes / ranks).astype(int)
for live in ([], [0], [0, 1]):
    g = int(np.sum(shards[live] * ranks)) if live else 0
    print(f"live={len(live)}: shards={int(shards.sum())} + gathered={g} = {int(shards.sum())+g} elems")
```

<!-- leetllm: output:start -->
```text title="ZeRO memory and working set" output compact
70B/256r (16B BF16 grad): {'DP': 1120, 'Z1': 283.28, 'Z2': 143.83, 'Z3': 4.38}
70B/256r (18B FP32 grad): {'DP': 1260, 'Z1': 423.28, 'Z2': 144.38, 'Z3': 4.92}
live=0: shards=8 + gathered=0 = 8 elems
live=1: shards=8 + gathered=8 = 16 elems
live=2: shards=8 + gathered=16 = 24 elems
```
<!-- leetllm: output:end -->

## Communication collectives and the 1.5x heuristic

NCCL implements three collective building blocks across GPUs:[^nccl2026collectives]

| Primitive | Operation | Ring bytes sent / rank | Primary role |
|---|---|---|---|
| **All-reduce** | Sums tensors across ranks; every rank gets the full sum | $2\frac{N-1}{N} S \approx 2S$ | DDP gradient sync, TP RowParallel |
| **Reduce-scatter** | Sums tensors across ranks; each rank keeps its $1/N$ slice | $\frac{N-1}{N} S \approx 1S$ | ZeRO-2/3 and FSDP gradient reduction |
| **All-gather** | Reconstructs the full tensor on every rank from $1/N$ shards | $\frac{N-1}{N} S \approx 1S$ | ZeRO-3 / FSDP parameter materialization |

Here $S$ is the full tensor size. Algebraically, $\text{All-Reduce}(X) \equiv \text{Reduce-Scatter}(X) \to \text{All-Gather}(X)$.

<figure>
  <img src="illustrations/_generated/collective_primitives_map_dark.png" alt="Two-rank collectives: All-Reduce returns [11,22] to both ranks; Reduce-Scatter gives [11] and [22]; All-Gather reconstructs [11,22] on both." />
  <figcaption>NCCL collective semantics on two ranks. Ring traffic scales as $(N-1)/N \cdot S$ per reduce-scatter or all-gather.</figcaption>
</figure>

Interconnect hierarchy sets placement: intra-node **NVLink** quotes **900 GB/s** bidirectional per GPU on DGX H100 and **1,800 GB/s** on B200 (with GB200 NVL72 spanning 72 GPUs),[^nvidiaCuFFTMpInterconnect2025][^nvidia2026gb200nvl72] while inter-node **InfiniBand / RoCE** (ConnectX-7 400 Gb/s, ConnectX-8 800 Gb/s) delivers **50–100 GB/s** unidirectional per port via GPUDirect RDMA.[^nvidia2026infinibandAdapters][^nvidia2026gpudirectRdma] Keep frequent per-layer collectives (tensor parallelism) inside NVLink and place coarser data-parallel or pipeline boundaries across nodes.

With equal BF16 parameter and gradient widths ($\Psi$ elements), DDP and ZeRO-2 move $2\Psi$ per rank while ZeRO-3 / full-shard FSDP moves $3\Psi$ (forward gather + backward gather + backward reduce-scatter), yielding the classic **1.5x** volume ratio.[^rajbhandari2020] Using BF16 gathers (`140 GB`) with FP32 reductions (`280 GB`) drops the modeled byte ratio to `1.0x`, yet **volume is not elapsed time**: small unhidden layer gathers on higher-latency networks stall compute far more than coarse buckets:

<!-- leetllm: test, output=show, output_title="Communication heuristic output" -->
```python title="communication_heuristic.py"
param_gb, grad_gb, ranks = 140, 140, 256
ring = (ranks - 1) / ranks
ddp_gb = 2 * grad_gb * ring
zero3_gb = (2 * param_gb + grad_gb) * ring
print(f"DDP sent/rank: {ddp_gb:.2f} GB | ZeRO-3: {zero3_gb:.2f} GB (ratio={zero3_gb / ddp_gb:.2f}x)")
fp32_grad_gb = 280
print(f"BF16 gathers + FP32 reductions ratio: {(2 * param_gb + fp32_grad_gb) / (2 * fp32_grad_gb):.2f}x")
```

<!-- leetllm: output:start -->
```text title="Communication heuristic output" output compact
DDP sent/rank: 278.91 GB | ZeRO-3: 418.36 GB (ratio=1.50x)
BF16 gathers + FP32 reductions ratio: 1.00x
```
<!-- leetllm: output:end -->

## FSDP2: native PyTorch sharding on DTensors

PyTorch's **`torch.distributed.fsdp.fully_shard` (FSDP2)** stores per-parameter `DTensor` shards in place (replacing legacy FSDP1 `FlatParameter` wrappers), preserving parameter names and composing natively with `DeviceMesh`, `torch.compile`, `clip_grad_norm_`, and Distributed Checkpoint (DCP).[^pytorchFsdp2Docs2025][^pytorchFsdp2Tutorial2025][^pytorchCompileDocs2025]

Trace one transformer block with `reshard_after_forward=True`, FP32 persistent shards, BF16 compute, and FP32 reductions: at rest each rank holds 4B FP32 parameter shards + 8B Adam moments (reaching the same 16B/param total once 4B FP32 gradient shards materialize). Forward all-gathers BF16 weights, computes activations, and frees weights; backward re-gathers BF16 weights for $dX = dY W^T$, computes local $dW = X^T dY$, reduce-scatters FP32 gradient shards, and frees full buffers before the local AdamW step.

<figure>
  <img src="illustrations/_generated/fsdp_unit_lifecycle_dark.png" alt="Six-event FSDP2 lifecycle for a 1B unit on 4 ranks: 1 GB FP32 shard stays resident; forward and backward materialize 2 GB BF16 weights; backward reduce-scatters gradients." />
  <figcaption>For a 1B block on 4 ranks, each rank keeps a 1 GB FP32 shard and transiently gathers 2 GB BF16 weights during forward and backward.</figcaption>
</figure>

FSDP2 hides communication via **implicit prefetching** on a separate NCCL stream (exposed wait $\approx \max(0, T_{\text{gather}} - T_{\text{window}})$).[^pytorchFsdp2Tutorial2025] Always shard **bottom-up** (transformer blocks first, then root) so peak gather memory divides by block count, and construct `AdamW` **after** `fully_shard` so it binds to sharded `DTensor`s:

```python title="fsdp2_structure.py"
import torch
from torch.distributed.fsdp import MixedPrecisionPolicy, fully_shard

mp = MixedPrecisionPolicy(param_dtype=torch.bfloat16, reduce_dtype=torch.float32)
model = TransformerModel()
for block in model.blocks:
    fully_shard(block, mp_policy=mp, reshard_after_forward=True)
fully_shard(model, mp_policy=mp, reshard_after_forward=False)
optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
```

Setting `reshard_after_forward=False` keeps full weights through backward (higher peak VRAM than ZeRO-2); passing a 2D `DeviceMesh` enables **hybrid sharding** (sharding within each 8-GPU node and replicating across nodes, dividing 70B state by 8 instead of total ranks).[^pytorchFsdpDocs2025] During gradient accumulation, `set_requires_gradient_sync(False)` defers intermediate reduce-scatters by holding full local gradients.

## DeepSpeed ZeRO: config, engine, and CPU/NVMe offload

DeepSpeed centralizes sharding, accumulation, precision, and hierarchical offload inside `DeepSpeedEngine` and `ds_config.json`.[^deepspeed2026source][^deepspeedZeroDocs2026] Under default `managed_gradient_accumulation=True`, call `engine.backward(loss)` and `engine.step()` on **every** microbatch without manually dividing `loss` by `gradient_accumulation_steps` (stepping only every $k$ microbatches delays updates $k\times$; dividing `loss` scales gradients twice).[^deepspeedTrainingDocs2026] DeepSpeed rejects DDP `no_sync()` for ZeRO-2/3; use `engine.coalesce_grad_reduction()` when trading local gradient memory for fewer collectives.

```json title="ds_config.json"
{
  "train_batch_size": 64,
  "train_micro_batch_size_per_gpu": 2,
  "gradient_accumulation_steps": 8,
  "bf16": { "enabled": true },
  "data_types": { "grad_accum_dtype": "fp32" },
  "zero_optimization": {
    "stage": 3, "contiguous_gradients": true, "overlap_comm": true,
    "reduce_bucket_size": 200000000, "stage3_prefetch_bucket_size": 50000000,
    "offload_optimizer": { "device": "cpu", "pin_memory": true },
    "offload_param": { "device": "nvme", "nvme_path": "/local_nvme/deepspeed" }
  },
  "optimizer": { "type": "AdamW", "params": { "lr": 2e-5, "weight_decay": 0.01 } }
}
```

Four DeepSpeed rules prevent silent bugs:
1. **Batch identity:** `train_batch_size = micro_batch * grad_accum * DP_degree` ($2 \times 8 \times 4 = 64$), using `DP_degree`, not total GPUs when TP/PP is active.[^deepspeedConfigJson2026]
2. **Buckets count elements, not bytes:** `reduce_bucket_size: 200_000_000` takes 400 MB in BF16 or 800 MB with `grad_accum_dtype: "fp32"`.[^deepspeedZeroDocs2026]
3. **External parameters vs dynamic routing:** Initialize huge models under `deepspeed.zero.Init()`. Register tied cross-module weights via `register_external_parameter()` or `GatheredParameters(...)`; mark dynamic MoE routers as ZeRO-3 leaf modules (`set_z3_leaf_modules()`) so ranks never deadlock on unmatched expert gathers.[^deepspeedZeroDocs2026][^deepspeedTrainingDocs2026]
4. **Compatibility:** AutoTP supports ZeRO 0–3, whereas `PipelineModule` supports only ZeRO 0–1 (rejecting ZeRO 2–3).[^deepspeedPipelineDocs2026]

### CPU/NVMe offload tradeoffs (ZeRO-Offload & ZeRO-Infinity)

**ZeRO-Offload** moves optimizer states and updates to host RAM (selecting `DeepSpeedCPUAdam` automatically for `"AdamW"`);[^ren2021][^deepspeed2026optimizerSelection] **ZeRO-Infinity** spills optimizer and ZeRO-3 parameter shards to local NVMe (updates still run on CPU cores).[^rajbhandari2021] Never confuse GPU HBM bandwidth (3.35 TB/s H100 SXM; 8 TB/s B200)[^nvidia2026hgxComponents] with PCIe/NVMe links: moving 12 GB over a 6 GB/s link takes at least `2.0 s`. With 3.0 s of independent GPU compute, ideal overlap takes $\max(2, 3) = 3.0\text{ s}$, whereas serialized transfer-before-compute exposes `5.0 s`.

**FSDP2 vs DeepSpeed comparison:**

| Feature | FSDP2 (`fully_shard`) | DeepSpeed ZeRO |
|---|---|---|
| **Runtime & tooling** | Native PyTorch (`DTensor`, `DeviceMesh`, `torch.profiler`) | Centralized `DeepSpeedEngine` + `ds_config.json` |
| **Sharding modes** | `reshard_after_forward=True/False` + 2D hybrid mesh | Native ZeRO-1, ZeRO-2, ZeRO-3 |
| **Offloading** | CPU offload via `CPUOffloadPolicy()` | CPU (`ZeRO-Offload`) and NVMe (`ZeRO-Infinity`) |
| **Parallelism mix** | Native TP + PyTorch pipelining on `DeviceMesh` | AutoTP (ZeRO 0–3); `PipelineModule` (ZeRO 0–1 only) |
| **Checkpointing** | PyTorch Distributed Checkpoint (DCP) | Sharded save + `zero_to_fp32` / Universal Checkpointing |

Default to **FSDP2** for native PyTorch tooling, `DeviceMesh` TP/PP composition, and DCP whenever GPU HBM or `CPUOffloadPolicy()` suffices. Choose **DeepSpeed** when NVMe spillover via ZeRO-Infinity is essential or you are extending a DeepSpeed stack. In legacy FSDP1 codebases, `FULL_SHARD` maps to `reshard_after_forward=True`, `SHARD_GRAD_OP` to `reshard_after_forward=False`, `HYBRID_SHARD` to a 2D `DeviceMesh`, and `limit_all_gathers=True` is a CPU peak-memory rate limiter (not an overlap knob).

## Checkpointing, PyTorch DCP, and failure recovery

At cluster scale, hardware faults become routine rather than exceptional. If a single device has mean time between failures $\text{MTBF}_{\text{device}}$, $N$ independent devices fail at:

$$
\text{MTBF}_{\mathrm{cluster}} = \frac{\text{MTBF}_{\mathrm{device}}}{N}
$$

Across thousands of GPUs, interruptions happen every few hours (Meta reported 419 unexpected interruptions across its 54-day Llama 3 405B run on 16K H100s).[^dubey2024] Fast, atomic checkpointing and topology-flexible recovery are therefore core distributed-training infrastructure.

| Goal | Required state | Verification check |
|---|---|---|
| **Resume training** | Sharded weights, Adam moments ($m_t, v_t$), step counters, LR scheduler, RNG, dataloader cursor (`client_state`) | Next resumed parameter update matches an uninterrupted run |
| **Export for inference** | Consolidated weights plus model/tokenizer config (no optimizer state) | Forward outputs on fixed inputs match within tolerance |

**PyTorch Distributed Checkpoint (DCP)** writes per-rank shards in parallel and automatically **reshards** model and optimizer state across different world sizes or topologies on restore (for example, resuming a 16-GPU checkpoint on 12 or 32 GPUs without a single-node consolidation bottleneck).[^pytorch2026dcp][^pytorchDcpAsync2026] When overlapping I/O with `async_save`, distinguish two completion points:

1. **Staging completion:** Live GPU tensors have been copied into pinned host memory, so training ranks can safely resume forward/backward passes without mutating the snapshot.
2. **Storage completion:** Every shard has flushed to durable storage and the manifest pointer has been published atomically (`fsync` plus atomic rename on POSIX filesystems, or a generation-matched pointer update on object stores).[^google2026storagePreconditions] Only after storage completion is a checkpoint durable and safe to mark as `latest`.

Treat preemption signals (`SIGTERM`) as a hard deadline budget covering step finish (or clean abort), staging, flush, and atomic publish. Always align the **stateful dataloader cursor** to the exact completed optimizer step stored in the checkpoint: pairing step-$t$ weights with a prefetched cursor past step $t$ silently drops the intervening microbatches.[^torchdata2026statefulLoader]

In DeepSpeed, **every rank** must call `engine.save_checkpoint(save_dir, tag)` with one shared tag (rank-0-only calls hang; per-rank timestamps fragment directories), and ZeRO-3 reloads must target a fresh engine.[^deepspeed2026source] Export dense ZeRO weights for inference with `zero_to_fp32.py` (`get_fp32_state_dict_from_zero_checkpoint`, budgeting full-model CPU RAM); for world-size changes, use Universal Checkpointing (`ds_to_universal.py`) or PyTorch DCP.[^deepspeedCheckpointDocs2026][^deepspeedUniversalCheckpointing2026]

Matching the first resumed loss never confirms a valid training resume: a weights-only reload computes the exact same step-4 loss yet takes a different AdamW step because moments reset:

<!-- leetllm: test, deps=torch, output=show, output_title="Checkpoint continuation output" -->
```python title="checkpoint_next_update.py"
import io, torch
from torch import nn

torch.set_num_threads(1)
torch.manual_seed(7)
x = torch.tensor([[1., 0.], [0., 1.], [1., 1.], [-1., 2.]])
y = torch.tensor([[1.], [-1.], [0.], [-3.]])

def make_run():
    m = nn.Sequential(nn.Linear(2, 4), nn.Tanh(), nn.Dropout(0.25), nn.Linear(4, 1))
    return m, torch.optim.AdamW(m.parameters(), lr=0.01)

def step(m, o):
    o.zero_grad(set_to_none=True)
    loss = (m(x) - y).square().mean()
    loss.backward(); o.step()
    return loss.detach()

m, o = make_run()
for _ in range(3): step(m, o)
buf = io.BytesIO()
torch.save({"m": m.state_dict(), "o": o.state_dict(), "rng": torch.get_rng_state()}, buf)
exp_loss = step(m, o)
exp_p = torch.cat([p.detach().flatten() for p in m.parameters()])

def restore(with_opt: bool):
    buf.seek(0)
    s = torch.load(buf, weights_only=True)
    m2, o2 = make_run()
    m2.load_state_dict(s["m"])
    if with_opt: o2.load_state_dict(s["o"])
    torch.set_rng_state(s["rng"])
    return step(m2, o2), torch.cat([p.detach().flatten() for p in m2.parameters()])

_, res_p = restore(True)
wo_loss, wo_p = restore(False)
print("full_resume_equal=", torch.equal(res_p, exp_p), "wo_same_loss=", torch.equal(wo_loss, exp_loss), "wo_same_update=", torch.equal(wo_p, exp_p))
```

<!-- leetllm: output:start -->
```text title="Checkpoint continuation output" output compact
full_resume_equal= True wo_same_loss= True wo_same_update= False
```
<!-- leetllm: output:end -->

## Beyond data parallelism: 4D parallelism

Pure DP hits three walls at scale: global batch size ($B_{\text{global}} = B_{\text{micro}} \times m \times DP$), single-layer gather size, and long-context activations. **4D parallelism** composes four orthogonal axes across a Cartesian mesh:[^shoeybi2019][^narayanan2021][^liu2024ring]

$$
\text{World Size} = DP \times TP \times PP \times CP
$$

Only $DP$ multiplies independent sequence replicas; $TP$, $PP$, and $CP$ cooperate on one replica.

<figure>
  <img src="illustrations/_generated/parallelism_topology_map_dark.png" alt="128-GPU 4D mesh (DP=8, TP=4, PP=2, CP=2): each 16-GPU replica spans two 8-GPU nodes; microbatch 1 and 4 accumulation steps yield 32 global sequences." />
  <figcaption>A 128-GPU 4D mesh ($DP=8, TP=4, PP=2, CP=2$): $B_{\text{micro}}=1$ and $m=4$ give $1 \times 4 \times 8 = 32$ global sequences.</figcaption>
</figure>

- **Tensor parallelism (TP):** Megatron-LM splits MLP $Z = \text{GeLU}(XW_1)W_2$ via column-parallel $W_1$ (no comm before GeLU) and row-parallel $W_2$ (one **All-Reduce**), mirroring attention ($W_{QKV}$ column-parallel by head, $W_O$ row-parallel) for **2 forward + 2 backward all-reduces per layer** inside NVLink.[^shoeybi2019][^narayanan2021]
- **Pipeline parallelism (PP) & 1F1B:** Assigns contiguous layer ranges to $p$ stages over point-to-point links.[^narayanan2021] For $m$ balanced microbatches, GPipe and plain **1F1B** share the exact same bubble overhead $(p-1)/m$ and elapsed idle fraction $(p-1)/(m+p-1)$;[^narayanan2019pipedream] 1F1B wins on memory by holding at most $\min(m, p-i)$ live activation sets on stage $i$ instead of GPipe's $m$.[^megatron2026pipelineSchedule] Cutting the bubble itself requires $m \ge 4p$ or interleaved stages.
- **Context parallelism (CP / Ring Attention):** Splits sequence length $S$ across $C$ ranks, keeping local $Q$ stationary while rotating $K, V$ blocks around a ring with online softmax overlapped against compute.[^liu2024ring]

<!-- leetllm: test, output=show, output_title="Pipeline bubble output" -->
```python title="pipeline_bubble_ratios.py"
for p, m in ((8, 1), (8, 32), (64, 256)):
    print(f"p={p:>2}, m={m:>3}: overhead={(p-1)/m:7.2%}, idle={(p-1)/(m+p-1):6.2%}")
p, m = 4, 8
print("1F1B warmup:", [min(m, p-i-1) for i in range(p)], "max_live:", [min(m, p-i) for i in range(p)])
```

<!-- leetllm: output:start -->
```text title="Pipeline bubble output" output compact
p= 8, m=  1: overhead=700.00%, idle=87.50%
p= 8, m= 32: overhead= 21.88%, idle=17.95%
p=64, m=256: overhead= 24.61%, idle=19.75%
1F1B warmup: [3, 2, 1, 0] max_live: [4, 3, 2, 1]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pipeline_flush_schedule_dark.png" alt="For p=4 stages and m=8 microbatches, 1F1B warms up [3,2,1,0] forwards and caps live activation sets at [4,3,2,1] vs 8 in GPipe with identical bubble ratios." />
  <figcaption>GPipe and plain 1F1B share identical bubble ratios; 1F1B cuts peak live activation sets per stage to $\min(m, p - i)$.</figcaption>
</figure>

## Sizing, scaling, and debugging a real run

Always size above the static model-state floor. For 70B under ZeRO-3 (`1,120 GB`), $1{,}120 / 80 = \mathbf{14\text{ GPUs}}$ leaves 0 GB for activations, gathered layers, and allocator overhead. Adding a profiled `18 GB/GPU` transient budget pushes 16 GPUs to `70 + 18 = 88 GB` (OOM), whereas 24 GPUs (`46.7 + 18 = 64.7 GB`) and 32 GPUs (`35.0 + 18 = 53.0 GB`) run comfortably.

When node failures shrink the cluster, keep global batch size constant by adjusting `gradient_accumulation_steps` rather than silently altering update dynamics. If you intentionally scale global batch size by multiplier $\kappa$ under Adam, Malladi et al.'s SDE scaling rule adjusts learning rate, betas, and epsilon together ($\eta' = \sqrt{\kappa}\,\eta$, $\beta'_i = 1 - \kappa(1 - \beta_i)$, $\epsilon' = \epsilon / \sqrt{\kappa}$), subject to diminishing returns once batch size passes the gradient noise scale $\mathcal{B}_{\mathrm{simple}} = \operatorname{Tr}(\Sigma) / \|G\|^2$.[^malladi2022adaptiveScaling][^mccandlish2018] Before committing to a multi-day run, rehearse a restart drill: interrupt a short job, resume across a changed GPU count, and verify step $t+1$ weights, moments, and dataloader cursor match the uninterrupted run.

When distributed runs fail, turn symptoms into profiler checks:[^pytorchNcclEnvironment2026][^megatronCoreParallelism2026]
- **NCCL hang/timeout:** Read the *earliest* failing rank log with `TORCH_NCCL_DUMP_ON_TIMEOUT=1` and positive `TORCH_NCCL_TRACE_BUFFER_SIZE`; check dynamic MoE gather alignment.
- **Startup OOM:** Instantiate on `torch.device("meta")` (FSDP2) or `deepspeed.zero.Init()` (DeepSpeed) before loading shards.
- **Exposed collectives in `torch.profiler`:** Tune block granularity, prefetching, or switch to hybrid sharding / intra-node TP.
- **Loss shift after scaling out or resuming:** Audit global batch ($B_{\text{micro}} \times m \times DP$), unequal-rank token weighting, `grad_accum_dtype`, managed `engine.step()` cadence, and dataloader cursor alignment.

```mastery-quiz
[
  {
    "question": "A 2B-parameter model uses 2B compute weights, 4B FP32 gradient accumulation (grad_accum_dtype='fp32'), and 12B/param for FP32 master weights plus Adam moments. Across 8 data ranks, what are persistent per-rank totals under ZeRO-2 and ZeRO-3?",
    "options": [
      "ZeRO-2: 4.5 GB; ZeRO-3: 4.5 GB.",
      "ZeRO-2: 8.0 GB; ZeRO-3: 4.5 GB.",
      "ZeRO-2: 12.0 GB; ZeRO-3: 6.0 GB.",
      "ZeRO-2: 8.0 GB; ZeRO-3: 8.0 GB."
    ],
    "answer": "ZeRO-2: 8.0 GB; ZeRO-3: 4.5 GB.",
    "explanation": "Full weights are 4 GB; sharded gradients (8 GB) + optimizer/master (24 GB) add 32/8 = 4 GB, giving ZeRO-2 8.0 GB/rank. ZeRO-3 shards all 36 GB across 8 ranks for 4.5 GB/rank."
  },
  {
    "question": "An FSDP2 model has 7 blocks of 4 GB compute weights each and a 6 GB budget per parameter all-gather. Which setup fits the gather budget and binds AdamW to sharded DTensors?",
    "options": [
      "Shard root, shard each block, then build AdamW.",
      "Build AdamW, shard each block, then shard root.",
      "Shard each block, shard root, then build AdamW.",
      "Build AdamW, then shard root only."
    ],
    "answer": "Shard each block, shard root, then build AdamW.",
    "explanation": "Sharding each block first gives each 4 GB unit its own gather lifecycle (under 6 GB). Building AdamW after sharding binds it to the DTensor shards."
  },
  {
    "question": "A DeepSpeed ZeRO-3 job with managed_gradient_accumulation=True (accum=8) offloads 18 GB across a 6 GB/s PCIe/NVMe link with 4 s of independent GPU compute. How often must the loop call engine.step(), and what are ideal-overlap vs serialized step lower bounds?",
    "options": [
      "Every microbatch; overlap 4 s, serialized 7 s.",
      "Every 8th microbatch; overlap 4 s, serialized 7 s.",
      "Every microbatch; overlap 3 s, serialized 4 s.",
      "Every 8th microbatch; overlap 7 s, serialized 7 s."
    ],
    "answer": "Every microbatch; overlap 4 s, serialized 7 s.",
    "explanation": "Managed accumulation tracks the microstep clock inside engine.step(), so calling it every microbatch updates on every 8th step. Transfer takes 18/6 = 3 s, giving max(3,4) = 4 s overlapped and 3+4 = 7 s serialized."
  },
  {
    "question": "A ZeRO-3 checkpoint saves after batch 37. Run A exports weights via zero_to_fp32 and passes forward parity (0.003 <= 0.005). Run B restores weights, Adam moments, scheduler, and RNG, but its dataloader replays batch 37. Which goals pass?",
    "options": [
      "Both inference export (A) and exact training resume (B).",
      "Inference export (A) only.",
      "Exact training resume (B) only.",
      "Neither."
    ],
    "answer": "Inference export (A) only.",
    "explanation": "Inference export needs only consolidated weights and passes parity. Training resume must start at batch 38; replaying batch 37 changes the next gradient even with restored moments."
  },
  {
    "question": "A 4D mesh has DP=6, TP=2, PP=3, CP=2 with microbatch 2 and 5 accumulation steps. Separately, a 5-stage pipeline runs plain 1F1B over 12 microbatches. What are world size, global sequence batch, 1F1B peak live activation sets, and idle fraction?",
    "options": [
      "72 ranks, 60 sequences; [5, 4, 3, 2, 1] live sets, 1/4 idle.",
      "72 ranks, 360 sequences; [5, 4, 3, 2, 1] live sets, 1/4 idle.",
      "72 ranks, 60 sequences; [4, 3, 2, 1, 0] live sets, 1/3 idle.",
      "36 ranks, 60 sequences; [5, 4, 3, 2, 1] live sets, 1/3 idle."
    ],
    "answer": "72 ranks, 60 sequences; [5, 4, 3, 2, 1] live sets, 1/4 idle.",
    "explanation": "World size = 6*2*3*2 = 72; global sequences = 2*5*6 = 60. For p=5, m=12, 1F1B peaks at min(12, 5-i) = [5,4,3,2,1] with idle fraction (5-1)/(12+4) = 1/4."
  }
]
```

> **Next:** Continue to [Synthetic Data Pipelines](/learn/synthetic-data-generation-pipelines-llms).
