# Research notes: DeepEP V2 routing, NCCL Gin, and bandwidth denominators

## Ask what crosses the expert-parallel boundary

Which token rows, expert IDs, gate weights, source coordinates, events, and reverse-route handles must survive a sparse-MoE dispatch/combine, and how does current DeepEP V2 differ from archived NVSHMEM-based V1?

## Pinned project sources

- The pinned V2 source and README define `ElasticBuffer`, `EPHandle`, `EventOverlap`, NCCL Gin, supported direct/hybrid domains, analytical SM/QP sizing, prerequisites, benchmarks, and experimental-feature labels: https://github.com/deepseek-ai/DeepEP/tree/dd758caf451848bd150e1046af3d0a73e5fff38d
- The same revision's archived legacy documentation defines V1 `Buffer`, NVSHMEM, and historical low-latency/high-throughput paths: https://github.com/deepseek-ai/DeepEP/blob/dd758caf451848bd150e1046af3d0a73e5fff38d/docs/legacy.md
- Project NVSHMEM documentation explains the dependency and migration boundary rather than proving V2's active primary backend is NVSHMEM: https://github.com/deepseek-ai/DeepEP/blob/dd758caf451848bd150e1046af3d0a73e5fff38d/docs/nvshmem.md
- The DeepSeek-V3 technical report motivates the sparse routed-expert workload: https://arxiv.org/abs/2412.19437
- The pinned project license governs the communication-library source independently from model, CUDA, NCCL, and cluster access terms: https://github.com/deepseek-ai/DeepEP/blob/dd758caf451848bd150e1046af3d0a73e5fff38d/LICENSE

## Verify source-to-expert coordinates before throughput

The lesson's four tokens `a,b,c,d` each select two experts. Token `b` sends its first copy to expert `2` on rank `1` with gate weight `0.40`; combine must return that expert's weighted output to the original `b` row. Alignment padding isn't a real token. Cached handles remain valid only for compatible route shape, expert placement, and metadata lifetime.

`ElasticBuffer` does not automatically provide unlimited dynamic capacity: the pinned README says fully elastic GPU/CPU backing remains ongoing work. The published `EP2048` statement describes supported domain scale, not measured bandwidth saturation at that scale. PP, CP, and Engram paths are explicitly experimental.

## Read the benchmark exactly as published

The pinned README's table uses `8K` tokens, hidden size `7168`, top-`8` expert routing, FP8 dispatch, and BF16 combine. Its examples include `90/81 GB/s` dispatch/combine for SM90 `EP 8x2`, `61/61 GB/s` for SM90 `EP 8x4`, and `726/740 GB/s` for SM100 intra-node `EP8` using `64` SMs. These are project-reported **logical** bandwidths; local traffic is included and a NIC counter need not equal the stated denominator.

The repository reports up to `1.3x` peak speed versus V1, up to `4x` fewer SMs, and `24` down to `4-6` SMs for one V3-like configuration. Preserve the stated architecture, topology, routing distribution, dtype, link type, token count, and whether the claim refers to peak, minimum-SM, or logical throughput.

## Version-specific bring-up limits

At the inspected snapshot, README prerequisites include SM90-compatible hardware, CUDA `12.3+` for SM90, PyTorch `2.10+`, and NCCL `2.30.4+`, plus NVLink/RDMA for their respective paths. These are not stable promises for every revision. JIT compilation, Gin availability, physical rank placement, buffer sizing, stream dependencies, and handle reuse must be validated before reporting a working V2 deployment.
