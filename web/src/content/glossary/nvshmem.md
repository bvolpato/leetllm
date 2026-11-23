---
title: NVSHMEM
aliases: ["NVIDIA SHMEM", "NVIDIA OpenSHMEM library"]
importance: 76
---

NVSHMEM is NVIDIA's implementation of the OpenSHMEM programming interface and its partitioned global address space for GPU programs. Participating processes create symmetric allocations that exist at corresponding locations in every processing element's memory. Device code can then issue one-sided puts, gets, and synchronization operations against a remote processing element without requiring a matching application-level receive for every transfer. Symmetric addressing simplifies access; it does not make physically separate GPU memories identical or coherent.

## Symmetric heaps and ordering

Every participating rank joins a common communication world and allocates from a symmetric heap. A kernel names the target processing element and the corresponding symmetric address. Transport may use local GPU connectivity or a network-backed remote path, depending on hardware, configuration, and the operation. A barrier, signal, quiet operation, or stream dependency establishes completion where the algorithm needs it.

Ordering and completion are different specifications: `nvshmem_fence` orders applicable remote updates, while `nvshmem_quiet` waits for completion of applicable outstanding operations. A separate signal or CUDA stream dependency does not automatically complete arbitrary remote writes; use the documented put-with-signal or ordering/completion sequence and matching destination wait. Host-side ordering calls do not automatically order device-issued operations, or vice versa.


A remote write can be correctly addressed and still be observed too early if its completion schema is ignored. Likewise, assigning every processing element to one network interface can produce a severe bandwidth collapse even when the collective benchmark on the same cluster looks healthy.

## Example

DeepEP V1 uses NVSHMEM-based internode communication for expert dispatch and combine. A source GPU writes remote expert rows into a symmetric receive buffer, then signals the destination before its expert computation consumes those rows. DeepEP V2 moves its primary expert-parallel path to NCCL's GPU-initiated networking interface. Check the installed version's buffer API, synchronization schema, and deployment requirements when configuring the communication path.

## Why it matters here

Project deep dives distinguish historical infrastructure from current implementations. NVSHMEM explains archived DeepEP transport, one-sided device communication, symmetric-buffer lifetime, and failures caused by network-interface mapping. It also prevents the incorrect inference that every modern expert-parallel system must use the same backend simply because it performs an all-to-all exchange.

## Related terms

- [RDMA](glossary://rdma)
- [NCCL](glossary://nccl)
- [NVLink](glossary://nvlink)
- [Expert parallelism](glossary://expert-parallelism)
