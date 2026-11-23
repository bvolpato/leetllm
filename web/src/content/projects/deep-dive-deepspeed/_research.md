# Research notes: what ZeRO shards and what DeepSpeed owns

## Research problem

Explain why a model that fits for inference can fail at its first Adam update, then trace which engine, collective, memory tier, and checkpoint owns each state under ZeRO stages 1 through 3.

## Paper-to-implementation chain

- The original ZeRO paper defines staged partitioning, mixed-precision memory accounting, and its modeled communication comparison: https://arxiv.org/abs/1910.02054
- ZeRO-Offload studies moving optimizer-related work and state to CPU: https://www.usenix.org/conference/atc21/presentation/ren-jie
- ZeRO-Infinity extends the heterogeneous-memory discussion to larger model state and offload tiers: https://arxiv.org/abs/2104.07857
- The DeepSpeed systems tutorial documents the broader engine rather than equating the entire project with ZeRO: https://dl.acm.org/doi/10.1145/3394486.3406703
- Current ZeRO and training-engine documentation owns stage semantics, configuration, gather/release behavior, and runtime interfaces: https://deepspeed.readthedocs.io/en/stable/zero3.html and https://deepspeed.readthedocs.io/en/latest/training.html
- Universal checkpoint guidance describes supported recovery and conversion paths without guaranteeing every topology change: https://www.deepspeed.ai/tutorials/universal-checkpointing/
- Pinned governance, committer, source, and license records identify the current multi-organization TSC and source terms: https://github.com/deepspeedai/DeepSpeed/blob/c455031422641a825588c926455458c82b27b6c0/GOVERNANCE.md and https://github.com/deepspeedai/DeepSpeed/tree/c455031422641a825588c926455458c82b27b6c0

## Reproduce the four-rank memory ledger

The paper's illustrated mixed-precision Adam recipe stores two bytes each for model weights and gradients plus four bytes each for FP32 master weights, first moment, and second moment. Total replicated model state is `16` bytes per parameter before activations.

For four data ranks, the article's idealized stage receipts are:

- ZeRO-1: `4 + 12/4 = 7` bytes per parameter.
- ZeRO-2: `2 + 14/4 = 5.5` bytes per parameter.
- ZeRO-3: `16/4 = 4` bytes per parameter.

The ZeRO paper models stage-3 communication around `1.5x` the stated data-parallel baseline. Both memory and communication formulas exclude implementation-dependent buffers, activations, fragmentation, temporary all-gathers, quantized optimizer states, and alternative BF16 recipes.

## Deployment limits worth retaining

DeepSpeedEngine owns enough of backward, gradient accumulation, optimizer stepping, communication, precision, and checkpointing to make a configuration change a behavior change. Sharding parameters doesn't automatically fix long-sequence activation OOM. CPU/NVMe offload can exchange a capacity failure for PCIe, host-memory, or storage latency. Pipeline, tensor-parallel, ZeRO-stage, and checkpoint combinations must be checked against the installed release rather than inferred from a paper.
