---
title: ZeRO
aliases: ["Zero Redundancy Optimizer"]
importance: 84
---
ZeRO (Zero Redundancy Optimizer) is a family of distributed-training techniques that **shard** optimizer state, gradients, and parameters across data-parallel ranks instead of fully replicating them on every GPU. Introduced by Rajbhandari et al. (2019) and shipped in [DeepSpeed](glossary://deepspeed), ZeRO keeps the computational pattern of [data parallelism](glossary://data-parallelism) (each rank still processes its own microbatch) while making per-GPU model-state memory scale with the number of ranks. [FSDP](glossary://fsdp) implements the same core idea in native PyTorch (closest to ZeRO stage 3).

Naive DDP runs out of memory on large models because training state exceeds the weight file: mixed-precision Adam commonly needs on the order of $16\Psi$ bytes of *replicated* model state for $\Psi$ parameters before activations. ZeRO partitions that redundancy so a job that OOMs under full replication can fit, and larger models can train with pure data parallelism while preserving the model architecture.

## Intuition

Classic data parallelism copies three model states onto every rank:

1. **Parameters** $\theta$ (the weights you load and save)
2. **Gradients** $\nabla\theta$ (backward outputs, reduced across ranks)
3. **Optimizer state** (for Adam: FP32 master weights plus first and second moments $m$ and $v$)

ZeRO keeps the *batch* split of data parallelism but asks: which of those three need to be fully resident on every GPU at all times? Stages answer by partitioning more state:

| Stage | Partitioned | Still full per rank (steady state) |
| --- | --- | --- |
| ZeRO-1 | Optimizer state | Parameters, gradients |
| ZeRO-2 | Optimizer state + gradients | Parameters |
| ZeRO-3 | Optimizer state + gradients + parameters | None (only shards + temporary gather buffers) |

Higher stages free more HBM. Stages 1 and 2 keep communication volume comparable to standard DP. Stage 3 adds parameter all-gathers during forward and backward, so step time becomes more network-sensitive.

## Formula

**Replicated model state (mixed-precision Adam).** Let $\Psi$ be the parameter count. A common accounting (ZeRO paper / DeepSpeed) stores FP16/BF16 parameters and gradients ($2\Psi + 2\Psi$ bytes) plus FP32 master weights and two Adam moments ($4\Psi + 4\Psi + 4\Psi = 12\Psi$ bytes). Total:

$$
M_{\mathrm{DP}} \approx 16\Psi \text{ bytes per rank}
$$

(activations, fragmentation, and workspace are separate). The paper writes the optimizer term as $K\Psi$ with $K = 12$ for Adam under this layout. This estimate assumes the stated dtype layout. FP32 gradients instead of 16-bit gradients raise it to $18\Psi$. Inspect gradient accumulation dtype, master weights, moments, and temporary buffers in the actual stack.

**After ZeRO, steady-state model state per rank** with data-parallel degree $N_d$:

| Stage | Approx. model-state bytes / rank |
| --- | --- |
| Baseline DP | $16\Psi$ |
| ZeRO-1 ($P_{\mathrm{os}}$) | $4\Psi + \frac{12\Psi}{N_d}$ |
| ZeRO-2 ($P_{\mathrm{os}+g}$) | $2\Psi + \frac{14\Psi}{N_d}$ |
| ZeRO-3 ($P_{\mathrm{os}+g+p}$) | $\frac{16\Psi}{N_d}$ (+ temporary unsharded layer buffers) |

Under that $16\Psi$ layout, optimizer partitioning approaches a **4×** reduction as $N_d$ grows; adding gradient partitioning approaches **8×**. Finite groups save less: at $N_d=8$, stage 1 gives $16/(4+12/8)\approx2.91\times$ and stage 2 gives $16/(2+14/8)\approx4.27\times$. Parameter partitioning makes steady-state model-state memory scale **linearly in $N_d$**. Stage 3 communication volume is higher than DP (around ~1.5× in the original analysis) because parameters must be all-gathered when used.

**Peak under ZeRO-3.** If the largest compute unit (layer / module) has $\Psi_i$ parameters gathered in low precision for a pass:

$$
M_{\mathrm{peak}} \approx \frac{16\Psi}{N_d} + 2\Psi_i \quad (+ \text{activations and other buffers})
$$

Use this as a planning estimate. Shard-storage reuse, prefetching several modules, communication buffers, and parameter persistence change the measured peak. Peak typically tracks **gathered unit size** plus **local shards**. That is why wrap/granularity choices matter: one giant gather of the whole model destroys the memory win.

## Worked numbers

**DeepSpeed tutorial case (ZeRO-1).** A **1.5B-parameter** GPT-2-style model on **8× V100 (32 GB)**, microbatch 1, no model parallelism. Adam optimizer state alone is about $12\Psi \approx 18$ GB. Under full replication, optimizer state leaves limited room for parameters, gradients, activations, and fragmentation on a 32 GB GPU, which can cause OOM. With **ZeRO-1**, those ~18 GB of optimizer states are partitioned across 8 ranks:

$$
\frac{18\ \mathrm{GB}}{8} = 2.25\ \mathrm{GB}
$$

of optimizer state per GPU. The same model then trains with pure data parallelism and no model-code rewrite.

**Stage-3 scale sketch.** A 7B model under the $16\Psi$ rule is about $7 \times 10^9 \times 16 \approx 112$ GB of *replicated* model state per rank. With $N_d = 8$ under ZeRO-3, steady-state model state is roughly $112/8 \approx 14$ GB per rank, leaving headroom on 80 GB GPUs for activations (often still the real limiter; pair with [activation checkpointing](glossary://activation-checkpointing)).

**Paper-scale headline.** The ZeRO analysis notes that a trillion-parameter model with Adam-style mixed precision needs on the order of **16 TB** of model state; across **1024** GPUs that is about **16 GB** of partitioned state per device if aggregate memory is fully used, before activations and temporary buffers.

## How it works

1. **Keep DP batching.** Rank $r$ still owns microbatch $B_r$ and runs forward/backward on its data. Global batch is still $B_{\mathrm{micro}} \times G_{\mathrm{accum}} \times N_d$.
2. **ZeRO-1 (optimizer partition).** After gradients are reduced, each rank updates only its slice of parameters and stores only that slice’s optimizer moments / FP32 masters. Updated parameter shards are broadcast or all-gathered so every rank ends the step with full parameters for the next forward (parameters stay replicated between steps).
3. **ZeRO-2 (add gradient partition).** Instead of an all-reduce that leaves a full gradient on every rank, a **reduce-scatter** leaves each rank with only the gradient shard matching its optimizer partition. Memory for gradients scales as $1/N_d$.
4. **ZeRO-3 (add parameter partition).** Parameters are sharded in steady state. Before a module’s forward (and again in backward if reshared), ranks **all-gather** that module’s parameters into a temporary full copy, compute, then free or re-shard. Gradients are reduce-scattered; the optimizer steps only on owned shards. No rank keeps a permanent full model.
5. **Offload extensions.** CPU optimizer offload is supported with stages **1, 2, and 3**, often using optimized CPU Adam. **ZeRO-Infinity** (stage 3) can place parameters and optimizer state on CPU or NVMe and overlap transfers with compute. Parameter offload requires stage 3. Fitting then depends on host or storage bandwidth as well as HBM. [DeepSpeed ZeRO configuration](https://deepspeed.readthedocs.io/en/latest/zero3.html)
6. **Checkpoints.** Saves are often **sharded by rank** and tied to stage and world size. Gather Stage-3 `state_dict` placeholders to produce a full weight dump (DeepSpeed: `stage3_gather_16bit_weights_on_model_save`, `zero_to_fp32.py`, or equivalent).

## Example

Eight GPUs fine-tune a multi-billion-parameter model that fails under plain DDP because Adam moments fill HBM. Enable ZeRO-2 in a DeepSpeed JSON config (no architecture rewrite):

```json
{
  "train_batch_size": 64,
  "train_micro_batch_size_per_gpu": 2,
  "gradient_accumulation_steps": 4,
  "bf16": { "enabled": true },
  "zero_optimization": {
    "stage": 2,
    "contiguous_gradients": true,
    "overlap_comm": true,
    "reduce_scatter": true,
    "reduce_bucket_size": 5e8,
    "allgather_bucket_size": 5e8
  },
  "optimizer": {
    "type": "AdamW",
    "params": { "lr": 2e-5, "betas": [0.9, 0.999], "eps": 1e-8, "weight_decay": 0.01 }
  }
}
```

```python
import deepspeed

# Here model is a Hugging Face causal LM; batch includes labels for scalar loss.
model_engine, optimizer, _, _ = deepspeed.initialize(
    model=model,
    model_parameters=model.parameters(),
    config="ds_config.json",
)
loss = model_engine(**batch).loss
model_engine.backward(loss)
model_engine.step()
```

Each rank still runs the full forward/backward over parameters (ZeRO-2 keeps full parameters resident), but only holds a shard of gradients and optimizer moments. Peak GPU memory drops enough to raise microbatch size or sequence length. If it still does not fit, raise the stage to 3 and/or offload:

```json
"zero_optimization": {
  "stage": 3,
  "offload_optimizer": { "device": "cpu" },
  "offload_param": { "device": "cpu" }
}
```

In pure PyTorch, the same stage-3 *idea* is FSDP: `fully_shard` per block, all-gather for compute, reduce-scatter for grads, optimizer on shards.

## Trade-offs

| Choice | Memory | Cost you pay |
| --- | --- | --- |
| ZeRO-1 | Optimizer sharded (approaches 4× under the paper's layout as $N_d$ grows) | Mild change vs DDP; params still full |
| ZeRO-2 | + gradient shards (approaches 8× under that layout as $N_d$ grows) | Reduce-scatter bookkeeping; params still full |
| ZeRO-3 | Params + grads + optim ~$1/N_d$ | Frequent all-gather; trickier init, hooks, checkpoints |
| CPU/NVMe offload | Large extra headroom | Host/NVMe bandwidth, pinned memory, slower steps |
| Activation checkpointing | Less activation HBM | Extra recompute in backward |
| Prefer lowest stage that fits | Best tokens/sec for a given fit | Escalating stage when the real pressure is activations wastes comm |

On a fat NVLink node, compute often hides stage-3 all-gathers. Across nodes on a weak fabric, step time becomes network-bound and a lower stage (or hybrid shard within node) can be faster even if a higher stage *fits*.

## What fails in production

- **Activations still OOM.** ZeRO stages 1–3 partition *model states*. Long sequences, large microbatches, or no activation-memory measures can OOM even at stage 3. Profile peak memory by component before bumping the stage.
- **Wrong stage for the bottleneck.** Stage 3 on a model that already fits under stage 2 can cut tokens/sec with no benefit. Prefer the lowest stage that meets the memory target.
- **Checkpoint / export bugs.** Rank-local ZeRO-3 shards loaded as a single full `state_dict` look like corrupt weights. Always test save → kill → restore and consolidated export (`zero_to_fp32.py` or gather-on-save) before multi-day runs.
- **Init and external parameter access (stage 3).** Building models larger than local memory needs partition-aware init (`deepspeed.zero.Init` or equivalent). Accessing weights outside a module’s `forward` needs gather APIs; silent wrong tensors are worse than a loud OOM.
- **World-size and resume mismatch.** Sharded checkpoints often assume a fixed $N_d$ and stage unless you use a universal/elastic format. Changing GPU count without conversion breaks resume.
- **NCCL hangs.** Mismatched control flow across ranks, uneven graph branches, or a rank that never enters an all-gather/reduce-scatter will hang. Compare loss for a few steps against a small non-sharded baseline at the same global batch and precision.

Debug by locking math (optimizer, LR, precision, global batch), then comparing unsharded vs ZeRO loss for a few iterations; inspect per-rank peak memory, all-gather / reduce-scatter time, offload bandwidth, and checkpoint round-trip.

## Why it matters here

ZeRO is the mental model behind almost every large-model training stack: DeepSpeed’s stages, FSDP’s full sharding, and hybrid DP designs all answer the same question (which training state is replicated, and when do you gather it?). Curriculum topics on multi-GPU fine-tuning, pretraining memory planning, and production checkpoint hygiene assume you can map a stage number to what is partitioned, what communication appears, and what still OOMs when activations dominate.

## Related terms

- [DeepSpeed](glossary://deepspeed)
- [FSDP](glossary://fsdp)
- [Optimizer state](glossary://optimizer-state)
- [Data parallelism](glossary://data-parallelism)
- [Activation checkpointing](glossary://activation-checkpointing)
