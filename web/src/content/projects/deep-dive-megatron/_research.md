# Research notes: Megatron rank meshes, optimizer state, and research lineage

## Define the question before inspecting flags

How do Megatron-LM and Megatron Core turn one 64-GPU world into distinct tensor, pipeline, context, expert, and data-parallel communication groups without confusing the reference trainer with the Core library or the separate checkpoint bridge?

## Original systems research and current operational sources

- Shoeybi and collaborators' Megatron-LM paper introduced efficient model-parallel Transformer training: https://arxiv.org/abs/1909.08053
- Narayanan and collaborators studied large-scale model-parallel GPU-cluster training, schedules, and communication tradeoffs: https://arxiv.org/abs/2104.04473
- Korthikanti and collaborators introduced sequence parallelism alongside selective activation recomputation: https://arxiv.org/abs/2205.05198
- Liu and collaborators developed MoE parallel folding with distinct attention and expert parallelism mappings: https://arxiv.org/abs/2504.14960
- NVIDIA's current Megatron-LM repository owns source layout, examples, benchmark descriptions, model support, and the Core versus reference-trainer distinction: https://github.com/NVIDIA/Megatron-LM
- The official Core parallelism guide defines TP, PP, CP, EP, DP, compatible combinations, and topology-planning assumptions: https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/parallelism-guide.html
- Distributed-optimizer and MoE guides supply current sharding, expert routing, and dispatcher behavior: https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/features/dist_optimizer.html and https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/features/moe.html
- NVIDIA's checkpoint/bridge documentation explains model-specific import, distributed state, and conversion caveats: https://docs.nvidia.com/nemo/megatron-bridge/latest/training/checkpointing.html
- The pinned repository license is composite and preserves third-party notices rather than proving one identical license for every file: https://github.com/NVIDIA/Megatron-LM/blob/9829b3f1dd16f5233ff7bf50e67f6443c527c2bc/LICENSE

## Verify the lattice, not just the product

The dense fixture sets `TP=4`, `PP=2`, `CP=2`, `EP=1`, and `DP=4`, so the world size is `4 * 2 * 2 * 1 * 4 = 64`. For the article's `tp-cp-ep-dp-pp` ordering, rank `3` has coordinates `tp=3, cp=0, ep=0, dp=0, pp=0`; its TP group is `[0,1,2,3]`, PP group `[3,35]`, and DP group `[3,11,19,27]`.

Rank-order formulas describe the specified fixture. Installed Core versions, expert-parallel folding, physical placement, custom process-group construction, and launcher mapping can differ. Validate actual group membership and topology rather than assuming consecutive global IDs imply shared NVLink.

The numbering fixture and separate dense/expert grid products were checked against `megatron/core/parallel_state.py` at commit `8971d19dda0f2bda87783353dde93a5134422a96` on September 23, 2026. The commit dates to August 11, 2026; it is a reproducible source baseline, not a claim to be the newest release.

## Benchmark and recovery boundaries

README MFU percentages belong to specific H100 model sizes, sequence length, vocabulary, overlap flags, and measurement assumptions. They aren't convergence results or portable performance promises. Low precision requires compatible Transformer Engine recipes, amax/scales, kernels, optimizer precision, and numerical checks. A saved directory establishes little until parameter shards, optimizer state, expert placement, RNG/data cursor, resharding, and a fixed-token reload have been verified.
