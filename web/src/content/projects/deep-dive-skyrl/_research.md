# Research notes: SkyRL's token ledger and asynchronous policy boundary

## System question

How does SkyRL preserve one task's prompt, sampled token IDs, observation masks, reward, and policy version across environment execution, generation, training, and weight synchronization?

## Read the owning sources in this order

1. The public repository establishes current package layout, project lineage, named integrations, contributor acknowledgments, and implementation boundaries: https://github.com/NovaSky-AI/SkyRL
2. The architecture overview documents the replaceable generator, trainer, and inference interfaces: https://docs.skyrl.ai/docs/getting-started/overview
3. Inference architecture explains the HTTP vLLM path, engine placement, router, and weight-sync ownership: https://docs.skyrl.ai/docs/getting-started/inference_architecture
4. The fully asynchronous tutorial defines queueing, rollout freshness, overlap, and configuration assumptions: https://docs.skyrl.ai/docs/tutorials/fully_async
5. The gym-generator tutorial is the direct evidence for token-in/token-out behavior and observation loss masks: https://docs.skyrl.ai/docs/tutorials/skyrl_gym_generator
6. The pinned off-policy documentation explains why policy-version mismatch needs a stated correction or filter: https://github.com/NovaSky-AI/SkyRL/blob/bce9ee9a80fbd262db44c79d5af12291ced5492d/docs/content/docs/algorithms/off_policy_correction.mdx
7. The Tinker architecture page describes an API-compatible surface; it doesn't make SkyRL the hosted Tinker service: https://docs.skyrl.ai/docs/tinker/architecture
8. The pinned repository license establishes source terms independently from downloaded model, dataset, and provider terms: https://github.com/NovaSky-AI/SkyRL/blob/ee7ab9927d5d0a3436dd98fd6b955fc9718d0260/LICENSE

## Trajectory and numerical checks

The SQL-repair example's `query-42_0` must preserve original prompt IDs, generated IDs, reward, trajectory identity, termination, and explicit `loss_masks`. A tool observation has mask `0`; policy-generated actions have mask `1`. Re-tokenizing reconstructed chat text can change the IDs that the inference engine actually sampled.

Recorded scheduling staleness is consumed trainer step minus scheduled generation step. It isn't per-token policy provenance: an in-flight trajectory can cross several weight-sync boundaries, and retained KV state can come from older weights. Synchronous, one-step pipelined, and fully asynchronous schedules expose different freshness and throughput contracts. A queue size or throughput number alone doesn't identify the resulting learning bias.

## Version and attribution caveats

Current `skyrl/` layout, older `skyrl-train` or `skyrl-agent` paths, exact SGLang support, enabled objectives, and backend availability depend on the checked revision. Project acknowledgments identify collaborators or compute supporters; they don't prove ownership of every subsystem. A generator, reward function, remote endpoint, or Tinker-compatible API isn't evidence that the whole distributed run preserves token identity, valid loss masks, reliable weight refresh, or unbiased held-out improvement.

## September 23, 2026 manual check

- Preserved source commit `955c3e23bf8939b28a9d6c424308a762dcb8a2e7`; read its complete generator contract and the scheduling classes, buffer-drain/filter, reward-stamping, async configuration, client pause/version, and dependency selections. Source `Optional` annotations permit nullable values, not omitted TypedDict keys. The reduced teaching row isn't a complete return object.
- Pinned FSDP/Megatron extras require Linux vLLM 0.28.0: https://github.com/NovaSky-AI/SkyRL/blob/955c3e23bf8939b28a9d6c424308a762dcb8a2e7/pyproject.toml. Applying v0.30.0's route migration to mixed-stack compatibility checks is a pedagogical inference, not a tested upgrade: https://github.com/vllm-project/vllm/releases/tag/v0.30.0.
- Read current overview, repository layout/provenance/acknowledgments, development, async capacity/config/resume, inference routing/transfer, Tinker lifecycle/checkpoint, and gym tokenization selections. Inference docs now describe `delta` and `sharded_rdt` alongside NCCL/IPC and the four-stage HTTP update protocol. Corrected the quiz's implication that routed generation continues through that boundary.
- Tinker sampling exports differ from full optimizer/scheduler checkpoints: https://docs.skyrl.ai/docs/tinker/architecture. Added a machine-loss exercise. An ephemeral sampler sync doesn't provide a durable training-resume artifact.
- The async tutorial's final implementation section still describes abort/retry, while the inference guide and pinned client use `PauseMode.KEEP`: https://github.com/NovaSky-AI/SkyRL/blob/955c3e23bf8939b28a9d6c424308a762dcb8a2e7/skyrl/backends/skyrl_train/inference_servers/remote_inference_client.py. Verified the pinned pause method rather than copying the older prose. Its local weight counter still doesn't attest remote weights.
- Read SkyRL-Agent abstract, dispatcher-speedup, and evaluation selections: https://arxiv.org/html/2511.16108v1. Preserved dated 24.4/39.4 Pass@1, 40k/100-step evaluation, and workload-specific 1.55x dispatcher result. Read the pinned off-policy guide's setup/mismatch/replay selections; reused preceding manual RL reviews' DAPO/AReaL mechanisms.
- Read the complete 157-line deterministic contract probe and 52-line receipt. Reran its checksum-pinned source fetch and eight isolated CPU checks; fresh receipt matches the checked-in receipt exactly. Kept this executable validation artifact. It neither authors articles nor runs the distributed trainer. Both marked arithmetic examples also pass locally on Python 3.12.

Only the listed source selections and complete contract/probe artifacts were read. No model, GPU, Ray cluster, SQL environment, live inference, weight transfer, full upstream suite, learning curve, or deployment is claimed.
