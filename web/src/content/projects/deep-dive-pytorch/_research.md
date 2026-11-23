# Research notes: tracing a PyTorch tensor from storage to distributed recovery

## Source-reading problem

How does one LLM-shaped attention call pass from a Python tensor view through operator dispatch, reverse-mode autograd, optional graph compilation, fused attention, process groups, parameter sharding, and a recoverable distributed checkpoint?

## Evidence ladder from papers to active APIs

- The original PyTorch paper documents imperative execution, Python-first tensors, GPU acceleration, and tape-based automatic differentiation: https://arxiv.org/abs/1912.01703
- The PyTorch 2 research paper explains graph capture and compilation while preserving eager-program behavior: https://doi.org/10.1145/3620665.3640366
- The public repository is authoritative for operator registration, dispatcher implementation, compiler modules, distributed packages, and tests: https://github.com/pytorch/pytorch
- Autograd notes explain graph construction, saved tensors, in-place version checks, and gradient tracking: https://docs.pytorch.org/docs/stable/notes/autograd.html
- Compiler documentation and troubleshooting define `torch.compile`, graph breaks, guards, and recompilation caveats: https://docs.pytorch.org/docs/main/generated/torch.compile.html and https://docs.pytorch.org/docs/main/user_guide/torch_compiler/torch.compiler_troubleshooting.html
- Distributed APIs and the distributed-checkpoint recipe define process groups, device meshes, sharding, and persisted state contracts: https://docs.pytorch.org/docs/main/distributed.html and https://docs.pytorch.org/tutorials/recipes/distributed_checkpoint_recipe.html
- SDPA documentation specifies backend eligibility and fallback rather than guaranteeing one fused kernel. The 2.14 reference checked September 23, 2026 lists experimental GQA support on CUDA FlashAttention, cuDNN, and math, plus memory-efficient attention on NVIDIA CUDA, with divisible query-head count and matching key/value-head counts: https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html
- Governance, source license, and package metadata distinguish individual technical stewardship, BSD-3-Clause core source, and separately licensed bundled components: https://docs.pytorch.org/docs/stable/community/governance.html and https://github.com/pytorch/pytorch/blob/4ee8fea1f8cbb27acf0dac1c4f2e8b8bb6aef7f7/LICENSE

## Invariants to carry through the lesson

Shared storage `[0,1,2,3,4,5]` with shape `[2,3]` and strides `[3,1]` becomes a transpose with shape `[3,2]` and strides `[1,3]`; `x[1,0]` and `y[0,1]` both address stored value `3`. A view changes indexing metadata rather than copying storage, although a later backend can require and allocate a contiguous copy.

Autograd detects a saved-value version mismatch when that value is accessed during backward, so this error may appear far from the mutation. Other checks can reject a write immediately, such as an in-place update to a leaf requiring gradients in a grad-enabled region. Attention backend choice depends on dtype, device, mask, shape, and kernel support. FSDP2 parameter gathers have temporary live-memory costs even when persistent weights are sharded; TP composition can retain another DTensor shard axis during compute.

## Reproducibility boundaries

A compiled graph isn't guaranteed for arbitrary Python control flow or changing shape/stride guards. Accelerator backends don't imply identical operator availability or numerics. A distributed checkpoint must include the state required by the actual application, potentially optimizer, scheduler, step, RNG, data cursor, and mesh metadata. Pin PyTorch source/release, accelerator, CUDA, NCCL, and model family before making current compatibility or performance claims.

The lesson's source-reading snapshot is commit `4ee8fea1f8cbb27acf0dac1c4f2e8b8bb6aef7f7` (August 2, 2026); its six CPU examples use PyTorch 2.13.0, while current API review uses 2.14 documentation checked September 23, 2026. These establish different evidence: source structure, small single-process behavior, and documented newer API limits. None establishes GPU performance, mixed-precision compiled-backward correctness, or distributed worker recovery.
