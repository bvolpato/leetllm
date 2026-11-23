---
title: NVLink-C2C
importance: 65
kind: term
---
**NVLink-C2C** is NVIDIA's coherent chip-to-chip interconnect. It connects Grace CPUs to Hopper GPUs in GH200 and to Blackwell GPUs in GB200; it also supports CPU-to-CPU designs. In these superchips, the CPU-GPU path is distinct from the GPU-to-GPU NVLink fabric.

Optimizer offload can use Grace memory through this path, but host-resident state still adds transfer and scheduling costs. GPU-to-CPU bandwidth number is not interchangeable with GPU-to-GPU collective bandwidth.

## Operational model

Grace and Blackwell share coherent addressability, reducing explicit staging complexity compared with conventional discrete CPU/GPU path. Coherence does not make access local: placement, page behavior, transfer direction, CPU optimizer work, and overlap still determine wall time. Measure bytes and effective bandwidth per optimizer bucket, plus GPU idle time waiting for host state.

## Example

An optimizer implementation that updates host-resident moments on the GPU can stream buckets from Grace memory over NVLink-C2C, overlap transfers with other work, then write updated state back. A CPU optimizer instead updates moments on Grace and transfers the required gradients and parameters. The chosen implementation determines which bytes cross the link.

## Why it matters here

Offloading most optimizer state turns the CPU-GPU path into a material step component. Peak link bandwidth sets the transfer ceiling; measure traffic volume, overlap, and step-time impact on the target run.

## Related terms

- [GB200](glossary://gb200)
- [NVLink](glossary://nvlink)
- [Optimizer offload](glossary://optimizer-offload)
- [HBM](glossary://hbm)
