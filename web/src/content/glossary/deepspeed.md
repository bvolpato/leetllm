---
title: DeepSpeed
importance: 84
---
DeepSpeed is an open-source deep learning optimization library (originated at Microsoft Research) that wraps PyTorch training with system features for large models: ZeRO memory partitioning, CPU/NVMe offload, mixed precision, communication overlap, activation checkpointing hooks, and sharded checkpoint formats. You keep a mostly normal model definition; memory and distribution behavior are driven mainly by a DeepSpeed JSON config and `deepspeed.initialize(...)`.

## Intuition

Classic data parallelism replicates the full training state on every GPU: parameters, gradients, and optimizer buffers. For Adam-style optimizers that state is much larger than the weights alone, so a model that "fits" for inference can still OOM during training.

DeepSpeed's core training idea is ZeRO (Zero Redundancy Optimizer): partition those replicated states across data-parallel ranks instead of copying them everywhere. Stage 1 shards optimizer state, stage 2 also shards gradients, stage 3 also shards parameters. Higher stages free more device memory and usually pay more communication (and, with offload, host or NVMe bandwidth).

## Worked numbers

Mixed-precision Adam roughly stores, for $\Psi$ parameters:

| Component | Bytes (typical) |
|---|---|
| FP16/BF16 parameters | $2\Psi$ |
| FP16/BF16 gradients | $2\Psi$ |
| FP32 master weights | $4\Psi$ |
| FP32 first moment $m$ | $4\Psi$ |
| FP32 second moment $v$ | $4\Psi$ |
| **Total model states** | **$\approx 16\Psi$** |

DeepSpeed's ZeRO tutorial uses a concrete case: a **1.5B-parameter** GPT-2-style model on **8× V100 (32 GB)** with batch size 1. Adam optimizer state alone is about $12\Psi \approx 18$ GB (FP32 master + $m$ + $v$). Without ZeRO, that block already crowds a 32 GB GPU once parameters, gradients, activations, and fragmentation are included, and the run OOMs. With **ZeRO-1**, those ~18 GB of optimizer states are partitioned across 8 ranks, so each GPU holds only about $18/8 = 2.25$ GB of optimizer state. The same 1.5B model then trains with pure data parallelism and no model-code rewrite.

Rule of thumb for planning: naive replicated Adam training needs on the order of $16\Psi$ bytes of *model state* before activations. ZeRO-1 cuts the optimizer share by about $N$ ranks; ZeRO-2 also partitions gradients; ZeRO-3 partitions parameters so steady-state parameter memory scales roughly as $2\Psi/N$ (plus temporary all-gather buffers during compute).

## Example

Eight GPUs fine-tune a multi-billion-parameter model that fails under plain `DistributedDataParallel` because Adam moments fill HBM. A minimal DeepSpeed config enables ZeRO-2, mixed precision, and communication overlap:

```json
{
  "train_batch_size": 64,
  "train_micro_batch_size_per_gpu": 2,
  "gradient_accumulation_steps": 4,
  "fp16": { "enabled": true },
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

In this illustrative training step, `model` is a PyTorch module whose forward method accepts `batch` and returns a scalar loss. The model and optimizer are handed to DeepSpeed rather than wrapped only in DDP:

```python
model_engine, optimizer, _, _ = deepspeed.initialize(
    model=model,
    model_parameters=model.parameters(),
    config="ds_config.json",
)
loss = model_engine(batch)
model_engine.backward(loss)
model_engine.step()
```

Each rank still runs the full forward/backward over parameters (ZeRO-2 keeps full parameters resident), but only holds a shard of gradients and optimizer moments. That can leave room to raise micro-batch size or sequence length; measure peak memory because activations may dominate. If model-state memory still does not fit, replace the `zero_optimization` section with:

```json
{
  "zero_optimization": {
    "stage": 3,
    "offload_optimizer": { "device": "cpu" },
    "offload_param": { "device": "cpu" }
  }
}
```

Offload moves optimizer (and optionally parameter) state to CPU or NVMe (ZeRO-Offload on stages 1-2; ZeRO-Infinity on stage 3). The job may *fit* while becoming bound by PCIe/NVMe bandwidth instead of GPU FLOPs.

## How it works

1. **Config-driven engine.** DeepSpeed replaces the usual PyTorch optimizer step and gradient all-reduce with an engine that owns partitioning, reduction, and (optionally) offload. Hugging Face Transformers, Accelerate, and Lightning expose the same knobs through their DeepSpeed integrations.
2. **ZeRO stages.** Stage $k$ keeps earlier partitions and adds the next state type. Stage 3 all-gathers parameter partitions just-in-time for each submodule's forward/backward, then re-partitions them.
3. **Offload hierarchy.** GPU HBM → host RAM → NVMe. ZeRO-Offload targets optimizer (and related) state on CPU for stage 1/2. ZeRO-Infinity (stage 3) can offload parameters and optimizer state to CPU or NVMe and overlaps transfers with compute when tuned well.
4. **Beyond pure ZeRO.** The broader suite includes activation checkpointing integration, 3D parallelism when combined with tensor/pipeline parallel stacks (for example Megatron-style layouts), MoE training support, and separate inference stacks (DeepSpeed-Inference / FastGen) with kernels and serving paths. For most fine-tuning engineers, ZeRO + mixed precision + checkpointing is the daily path.
5. **Checkpoints.** Saves are often **sharded by rank** and tied to ZeRO stage and world size. Stage 3 `state_dict` placeholders are not a full weight dump unless you gather: set `stage3_gather_16bit_weights_on_model_save` and/or use DeepSpeed's `zero_to_fp32.py` (written next to checkpoints) or `get_fp32_state_dict_from_zero_checkpoint` for consolidated export.

## Trade-offs

| Choice | Memory | Cost you pay |
|---|---|---|
| ZeRO-1 | Optimizer sharded | Mild communication change vs DDP |
| ZeRO-2 | + gradient shards | Reduce-scatter / partition bookkeeping |
| ZeRO-3 | + parameter shards | Frequent all-gather; trickier init and checkpoints |
| CPU/NVMe offload | Large extra headroom | Host bandwidth, pinned memory, slower steps |
| Activation checkpointing | Less activation HBM | Extra recompute in backward |
| Larger micro-batch after fit | Better utilization | May re-OOM or lengthen each training step |

DeepSpeed can make a run **fit** while making each step slower. A useful config fits *and* sustains acceptable tokens/sec. Prefer the lowest stage that meets the memory target; escalate only when profiling shows model-state pressure, not activation pressure alone.

## Debug path

1. Reproduce a **tiny single-GPU or small-DDP baseline** on a fixed batch and seed; lock loss scale / precision settings.
2. Enable DeepSpeed with the same math (optimizer, LR, precision) and compare step loss for a few iterations.
3. Inspect **per-rank peak memory**, all-gather / reduce-scatter time, CPU offload bandwidth, gradient accumulation boundaries, and skipped overflow steps (FP16).
4. Test **save → kill → restore** and conversion to a single FP32/FP16 file for inference *before* multi-day runs. Stage-3 shards are easy to mis-export.
5. If throughput collapses after a stage bump, check bucket sizes, `overlap_comm`, whether activations (not ZeRO state) dominate, and whether NCCL is bottlenecked across nodes.

## Why it matters here

DeepSpeed is the practical system most engineers meet when "the model almost fits" and optimizer state tips the job into OOM. It teaches memory accounting for training alongside inference VRAM, forces clear thinking about stage versus offload versus checkpointing, and sits next to FSDP as the other mainstream ZeRO-style stack in the PyTorch ecosystem. Curriculum topics on distributed training, fine-tuning at 7B+, and production checkpoint hygiene all assume you can read a DeepSpeed config and predict what moves off the GPU.

## Related terms

- [ZeRO](glossary://zero)
- [FSDP](glossary://fsdp)
- [NCCL](glossary://nccl)
- [NVIDIA Megatron](glossary://nvidia-megatron)
- [Optimizer state](glossary://optimizer-state)
- [Activation checkpointing](glossary://activation-checkpointing)
- [Data parallelism](glossary://data-parallelism)
