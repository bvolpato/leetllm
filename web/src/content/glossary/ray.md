---
title: Ray
importance: 75
kind: code
---
**Ray** is an open-source distributed-computing framework built around stateless tasks, stateful actors, remote objects, and a cluster scheduler. Python functions and classes can request CPU, GPU, or custom resources and execute across worker processes.

For large AI workloads, Ray commonly handles process lifecycle and placement, while NCCL moves GPU tensors inside training or inference groups. Ray decides where those long-lived workers run and how application components call them.

## Actors and placement groups

A Ray actor is a stateful worker whose methods run in the same process. Placement groups reserve bundles of resources atomically, enabling gang scheduling and PACK or SPREAD placement strategies. That makes them useful for model replicas that need several GPUs at once.


## Example

Seven rollout engines can each reserve eight GPU bundles while CPU actors run environment simulations and judge calls. Label selectors steer those bundles toward named rack groups.

## Why it matters here

Ray placement determines whether Megatron and vLLM ranks receive intended hardware. Poor placement can split fast communication groups across topology boundaries even when framework-level TP or EP settings look correct.

## Related terms

- [KubeRay](glossary://kuberay)
- [SkyRL](glossary://skyrl)
- [GPU partitioning](glossary://gpu-partitioning)
- [NCCL](glossary://nccl)
- [Kubernetes](glossary://kubernetes)
- [Control plane](glossary://control-plane)
