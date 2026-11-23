# Research notes: NCCL collective ownership, topology, and hangs

## The source-reading question

What must every rank agree on for an all-reduce to complete, how do reduce-scatter and all-gather divide ownership, and which evidence separates application collective-order bugs from fabric failures?

## Authoritative references

- NVIDIA's NCCL user guide defines communicator creation, operation scope, supported transports, and operational behavior: https://docs.nvidia.com/deeplearning/nccl/user-guide/index.html
- Its collective-operations chapter is the direct contract for all-reduce, reduce-scatter, all-gather, broadcast, and related group semantics: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html
- Its streams documentation establishes CUDA-stream ordering and overlap responsibilities: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/streams.html
- NVIDIA's troubleshooting guide and maintained `nccl-tests` project provide the evidence path for topology, environment, and standalone collective failures: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/troubleshooting.html and https://github.com/NVIDIA/nccl-tests
- The pinned public source exposes the implementation and license actually being characterized: https://github.com/NVIDIA/nccl/tree/5067397c2676d5aed50042fc39e5c8ee96eb0027 and https://github.com/NVIDIA/nccl/blob/5067397c2676d5aed50042fc39e5c8ee96eb0027/LICENSE.txt
- Patarasuk and Yuan's bandwidth-optimal all-reduce research gives independent algorithmic context for ring-style communication; it isn't a claim that every NCCL launch uses that exact schedule: https://doi.org/10.1016/j.jpdc.2008.09.002
- NVIDIA's first-party engineering explanation discusses large-scale NCCL algorithm and topology tradeoffs: https://developer.nvidia.com/blog/massively-scale-deep-learning-training-nccl-2-4/

## Four-rank ledger that text and animations must preserve

Inputs `[1,2,3,4]`, `[10,20,30,40]`, `[100,200,300,400]`, and `[1000,2000,3000,4000]` sum elementwise to `[1111,2222,3333,4444]`. Reduce-scatter leaves chunk `r` on rank `r`; all-gather subsequently reconstructs the full vector on every rank. A four-rank ring uses three reduce-scatter rounds and three all-gather rounds under the illustrated schedule.

Follow chunk index `2`: its running value is `3000`, then `3003`, then `3033`, finally `3333` on rank `2`. This is a teaching schedule, not proof that NCCL chooses a physical ring for every tensor and topology.

## Operational and licensing boundaries

All ranks must issue compatible collectives in matching order on the relevant communicator. A longer timeout doesn't fix mismatched operations, counts, dtypes, or group membership. Check local versus cross-node `nccl-tests`, transport selection, interfaces, topology, CUDA streams, and application call ordering separately.

Algorithmic bandwidth, bus bandwidth, logical payload, NIC counters, and observed wall time aren't interchangeable metrics. NVIDIA owns the NCCL project; inspect the pinned license and third-party notices rather than assuming every dependency or hardware interface shares one source-license label.

## Manual review, September 23, 2026

- Read the complete 2.32.3-1 release and publication metadata: https://github.com/NVIDIA/nccl/releases/tag/v2.32.3-1. Kept the older implementation map explicitly pinned; the release adds RAS GPU progress/watchdog DMA, ATTN, multiple MIG instances, and optional OpenSSL-3 socket TLS. Initial Rubin support lacks tuning; no current speedup is inferred.
- Read the matching public config/event comment and launch implementation: https://github.com/NVIDIA/nccl/blob/v2.32.3-1/src/nccl.h.in#L193 and https://github.com/NVIDIA/nccl/blob/v2.32.3-1/src/enqueue/enqueue.cc#L1888. The new launch event doesn't certify completed collective writes; older CUDA records it before launch. Added an explicit checkpoint and narrowed the quiz to gradient consumption, with the extra parameter-read dependency stated separately.
- Read the complete streams chapter, including its mixed-stream group barrier, and confirmed the same text in the release tree: https://github.com/NVIDIA/nccl/blob/v2.32.3-1/docs/userguide/source/usage/streams.rst. Group aggregation can destroy intended independent-stream overlap.
- Read the current complete `nccl-tests` README and performance guide. Confirmed GPU/thread/process rank multiplication, timing/correctness flags, nearest-rank p99, and operation-based bus-bandwidth factors: https://github.com/NVIDIA/nccl-tests/blob/master/README.md and https://github.com/NVIDIA/nccl-tests/blob/master/doc/PERFORMANCE.md.
- Read current collective and in-place contracts, result/reduction/default-blocking type selections, communicator/bootstrap and MIG selections. The guide dates experimental MIG support to 2.31 while the newest release lists the feature; stated both boundaries and the CUDA-driver/NVLink limitations rather than inferring stable framework support.
- Read Patarasuk/Yuan's original abstract, introduction, communication model and lower-bound/ring selections in the paper copy https://gwern.net/doc/ai/scaling/hardware/2009-patarasuk.pdf (publisher DOI didn't open). Added the associativity/commutativity and ignored-cost limits. Read NVIDIA's historical double-tree engineering selections, preserving their 2019 context: https://developer.nvidia.com/blog/?p=13452.
- Read the pinned complete license and contribution guide, and relevant collective wrappers/name mappings. Root Apache terms coexist with retained BSD and borrowed notices. Contribution sign-off is DCO certification, distinct from a cryptographic signature.
- Both CPU schedules were already correct. They establish local integer ownership and completed-log agreement only. No NCCL/CUDA installation, distributed launch, kernel execution, benchmark, RAS session, encrypted transport, or captured graph was exercised.
