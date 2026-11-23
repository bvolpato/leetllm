# Research notes: FlashInfer's irregular attention and composable state

## Investigate the kernel boundary

How can one inference batch combine three requests with different query lengths, paged KV histories, and split-KV work without handing cache allocation or admission policy to the kernel library?

## First-party source trail

- The MLSys 2025 FlashInfer paper defines the library's irregular-attention workloads, composable attention state, load balancing, inspector-executor structure, evaluation configuration, and measured claims: https://arxiv.org/abs/2501.01005
- The project launch post identifies its early University of Washington, Carnegie Mellon, and OctoAI research context: https://flashinfer.ai/2024/02/02/introduce-flashinfer.html
- The source repository owns actual wrappers, supported operations, backend selection, integrations, and version-specific behavior: https://github.com/flashinfer-ai/flashinfer
- Official KV-layout documentation defines ragged versus paged state, row pointers, page indices, and last-page occupancy: https://docs.flashinfer.ai/tutorials/kv_layout.html
- The recursive-attention tutorial supports split-state composition and attention-state merging: https://docs.flashinfer.ai/tutorials/recursive_attention.html
- Pinned contribution and license records distinguish community maintenance, NVIDIA participation, and Apache-2.0 source terms: https://github.com/flashinfer-ai/flashinfer/blob/d020372b068f335e2fe427372e134977a2235c49/CONTRIBUTING.md and https://github.com/flashinfer-ai/flashinfer/blob/d020372b068f335e2fe427372e134977a2235c49/LICENSE

## Keep the mixed-batch ledger exact

With page size `4`, request query counts `[3, 1, 4]` yield `qo_indptr = [0, 3, 4, 8]`. Page lists `[7, 2]`, `[11]`, and `[3, 14, 6]` yield `kv_indptr = [0, 2, 3, 6]`, with last-page lengths `[2, 2, 1]`. The formula `page_size * (page_count - 1) + last_page_len` produces KV lengths `[6, 2, 9]`.

The attention merge combines each worker's output and log-sum-exp statistic without replaying every key tile. Verify whether a wrapper's stored LSE is base 2 or natural-log before reusing a formula; intermediate `exp2`/`log2` values and a final converted statistic aren't interchangeable.

## Boundaries on performance and support

The paper's A100/H100, CUDA, PyTorch, and FlashInfer version constitute its experimental context. Results don't prove a current model's tail latency, a specific backend's FP4/MLA support, or compatibility with every serving engine. FlashInfer owns kernel planning and execution; the caller owns request admission, paged allocation, cache lifetime, authorization, and the stability of metadata across CUDA-graph replay.

## Manual recheck: September 23, 2026

- Preserved v0.6.18 for reproduction; checked release metadata against https://github.com/flashinfer-ai/flashinfer/releases/tag/v0.6.18 and selected latest v0.7.0 release changes at https://github.com/flashinfer-ai/flashinfer/releases/tag/v0.7.0 (published September 22).
- Read pinned paged-prefill constructor, plan/signature, host/copy, graph-capacity, split-size, run, and cuDNN-call selections in `flashinfer/prefill.py`. The teaching example deliberately selects FA2 and token offsets.
- Compared pinned `flashinfer/cudnn/prefill.py`'s return path with the actual source patches in https://github.com/flashinfer-ai/flashinfer/pull/4663. The frontend graph path's LSE lacked base conversion; the fix also documents element-based cuDNN offsets and handles differing QK/VO dimensions. Backend/version selection belongs in the normalization contract.
- Read the complete pinned `merge_state` kernel implementation in `include/flashinfer/attention/cascade.cuh`. It normalizes scales before vector accumulation. Reproduced the teaching helper's avoidable overflow with two finite `1e308` values of equal mass; aligned the helper with the kernel and retained a targeted assertion. This isn't a proof against every floating-point error.
- Rechecked current README's installation/provider, backend/adoption, logging, and CUDA-policy selections. Runtime CI names CUDA 12.9/13.0; 13.4 is preview with PyTorch nightly. Missing binaries don't imply a supported shape, so corrected that quiz explanation.
- Read layout selections covering NHD/HND dimensions, ragged/paged offsets, tails, and int32 indices; recursive-attention definitions and applications; launch origin; pinned contribution/CI selections and Apache license header. Logging level 10 dumps tensors: https://docs.flashinfer.ai/logging.html (selected configuration and graph-dumping sections).
- Rechecked v1 paper's abstract, authors, evaluation setup, SGLang, Streaming-LLM, and MLC parallel-generation selections at https://arxiv.org/html/2501.01005v1. Added the parallel test's 16 requests/s condition; retained its historical version and workload scope. Current v2 abstract records MLSys 2025 acceptance: https://arxiv.org/abs/2501.01005v2. Not every full upstream file or linked document was read.
- CPU examples and rendered assets are local evidence only. No FlashInfer installation, GPU kernel execution, profiler trace, benchmark reproduction, model-quality run, or deployment was performed.
