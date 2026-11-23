---
title: Rollout Routing Replay
aliases: ["R3", "router replay", "routing replay", "rollout router replay"]
importance: 81
---
**Rollout Routing Replay (R3)** records expert IDs selected during MoE rollout generation and reuses those assignments when learner recomputes same trajectory. It prevents small numerical differences from sending a token through different experts in serving and training.

Top-k routing is discontinuous. Two nearly tied router scores can swap order under FP8 versus BF16 or under different kernels. That tiny score change selects a different expert network, producing a much larger activation and log-probability difference than ordinary rounding noise.

R3 replays discrete selection, not stale router probabilities. Learner uses recorded top-k expert set for dispatch, then recomputes current router scores and combine weights for those experts. Router parameters can still learn because their live scores remain in computation graph.

## Replay contract

Generation must return expert assignments aligned with model-token positions, MoE layers, and top-k slots. Training must replay them in both log-probability recomputation and optimizer forward. Missing, shifted, or truncated routing metadata can silently corrupt [policy-ratio](glossary://policy-ratio) calculations.

Prompt and tool-result tokens can have zero policy loss while still affecting later policy tokens. Their routing path therefore remains part of causal forward pass. Packing, padding, context-parallel splits, truncation, and sequence reordering must transform routing metadata exactly as they transform token tensor.


## Example

If rollout chooses experts `[7, 18, 42, 71, 103, 141, 211, 246]` for one token, replay carries that exact list into Megatron even if fresh BF16 router scores would swap experts 42 and 91.

No-update validation should show complete replay coverage, exact post-replay expert-ID agreement, zero invalid IDs, correct pack/unpack round trip, finite router gradients, and a small bounded rollout-versus-learner log-probability delta.

## Why it matters here

GLM-5.3 executes eight routed experts per token in each sparse layer. Router replay addresses one source of rollout-to-learner mismatch when comparing FP8 inference and BF16 training. Differences can remain in attention selections, combine weights, or expert-kernel numerics. Use replay as one parity check, then validate the complete candidate stack separately.

R3 doesn't fix stale policy weights, tokenizer or loss-mask drift, sparse-attention top-k differences, or numerical differences inside selected experts. It isolates routing selection so those remaining mismatches can be measured.

Primary references: [R3 paper](https://arxiv.org/abs/2510.11370), [NVIDIA NeMo AutoModel R3 documentation](https://docs.nvidia.com/nemo/automodel/nemo-automodel/nemo_automodel/components/moe/router_replay), and [SkyRL releases](https://github.com/NovaSky-AI/SkyRL/releases).

## Related terms

- [Mixture of experts](glossary://mixture-of-experts)
- [MoE router](glossary://moe-router)
- [Expert parallelism](glossary://expert-parallelism)
- [FP8](glossary://fp8)
- [Policy ratio](glossary://policy-ratio)
- [Training-serving skew](glossary://training-serving-skew)
