# Research notes: exact attention, online normalization, and package generations

## Editorial research question

Why can FlashAttention avoid a materialized attention matrix without changing exact dense-attention semantics, and which current repository package actually supplies FA2, FA3, or FA4?

## Original research and implementation authority

- The original FlashAttention paper establishes IO-aware exact attention, SRAM/HBM tiling, recomputation, and the paper-era complexity analysis: https://arxiv.org/abs/2205.14135
- FlashAttention-2 describes improved parallelism and work partitioning rather than a new approximate attention definition: https://arxiv.org/abs/2307.08691
- FlashAttention-3 reports Hopper-oriented asynchronous execution and hardware-dependent design: https://arxiv.org/abs/2407.08608
- The online normalizer paper supports the streaming max-and-denominator recurrence behind numerically stable tile merging: https://arxiv.org/abs/1805.02867
- The first-party repository owns current package names, hardware requirements, separate `hopper/` surfaces, kernel arguments, causal-mask alignment, and release-specific support: https://github.com/Dao-AILab/flash-attention
- PyTorch's SDPA documentation is the authority for dispatch, fused-backend selection, and fallback behavior in the framework API: https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html
- Pinned license and author records support BSD-3-Clause and attribution claims: https://github.com/Dao-AILab/flash-attention/blob/c75d019dea9d910312974417bc28f190dfdda6d9/LICENSE and https://github.com/Dao-AILab/flash-attention/blob/c75d019dea9d910312974417bc28f190dfdda6d9/AUTHORS

## Worked recurrence and ownership boundary

For score tiles `[1, 2]` and `[3, 0]`, the running maximum changes from `2` to `3`; the old normalizer and numerator must be rescaled by `exp(2 - 3)`. The merged normalizer is about `1.5530`, and the example's final output is `[4.380, 5.620]` rounded to three decimals. A dense stable-softmax calculation should match apart from rounding.

Dense attention still performs work over visible query-key pairs; removing a global `n x n` score allocation doesn't make its arithmetic complexity linear. A paged-KV kernel consumes a caller's block table but doesn't become the serving system's allocator or cache manager. Bottom-right causal alignment for unequal query/key lengths is a versioned API semantic that must be verified in the pinned code.

## What must be rechecked before publication

FA2, FA3, and FA4 don't necessarily arrive through the same wheel, import, supported GPU, CUDA version, ROCm path, or maturity level. Hardware claims and installation commands must come from the repository version actually cited. Research throughput results compare a defined model, sequence length, dtype, GPU, and baseline; they aren't general production promises.

## September 23, 2026 manual check

- Read the current README's generation/install, CUDA/ROCm, GQA/local/cache, and causal-alignment selections: https://github.com/Dao-AILab/flash-attention. Added CUDA 13's FA4 extra, Linux/source-build prerequisites, and AIter/Triton environment controls. The two system-dependency flags affect different packages and don't establish compatibility.
- Preserved source commit `ce088ab9ce0fc0434dcd8afa0a791da9fcc3a820`. Read its FA2 import fallback, private/public forward and saved state, public/varlen/cache contracts; FA4 head guards, public signature and tuple return; Hopper package setup; selected output/gradient tolerance assertions. Current FA4 signature and tuple-return selections still agree. These are selected source paths, not a complete upstream source review.
- Read the complete BSD-3-Clause license at the actual walkthrough commit, and the cited author file. Root licensing doesn't settle all bundled artifacts. The Hopper setup classifier's Apache label differs from the root license; package metadata alone isn't license evidence.
- Read PyTorch 2.14 SDPA's mask, dropout, backend, numerical, causal and shape selections: https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html. Added the missing MHA-padding/SDPA-keep polarity distinction, a runnable CPU counterexample, and a quiz question. A boolean inversion isn't an additive-bias translation.
- Read the FA1 algorithm/IO theorem selections and FA2/FA3/online-normalizer abstracts. Checked FA4's abstract, exponential emulation, benchmark/caption and Appendix A.1 selections: https://arxiv.org/html/2603.05451v1. Preserved the dated B200/B100 inconsistency and cuDNN-version caveat instead of asserting a clean current hardware or vendor ranking. Reused preceding profiling lessons' stable Nsight distinctions.
- The four original examples pass on Python 3.12, including the pinned PyTorch 2.13.0 CPU output/gradient reference. Corrected research's three-decimal rounding. The added mask experiment is a CPU API demonstration, not a GPU kernel or service measurement.

No GPU installation, actual FlashAttention execution, upstream GPU suite, profiler trace, throughput reproduction, model-quality evaluation, or deployment is claimed.
