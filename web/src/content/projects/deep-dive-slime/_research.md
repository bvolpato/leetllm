# Research notes: slime's Sample contract and versioned weight handoff

## Start with rollout 7 rather than a launch script

How does a coding-agent trajectory move from SGLang through the grouped Sample handoff into Ray-placed Megatron training without supervising tool observations, duplicating credit, or refreshing weights underneath an active generation? The optional external HTTP rollout buffer is a separate service, not a necessary Ray-placed component.

## First-party project and research provenance

- The slime repository is authoritative for placement, `Sample`, rollout managers, synchronous/async entrypoints, transport modes, and actual source-level behavior: https://github.com/THUDM/slime
- The project launch post explains its Megatron plus SGLang integration, agent-oriented extensibility, and design motivation: https://www.lmsys.org/blog/2025-07-09-slime/
- Project documentation and the agent/customization guides define current rollout hooks, token trajectories, reward functions, and extension boundaries: https://thudm.github.io/slime/ ; https://thudm.github.io/slime/get_started/agent.html ; https://thudm.github.io/slime/get_started/customization.html
- Fault-tolerance documentation bounds what the framework can actually recover: https://thudm.github.io/slime/advanced/fault-tolerance.html
- Z.AI's first-party GLM-5.2 post describes its published use of slime/SGLang and preference-distillation context without proving another deployment uses the same objective: https://huggingface.co/blog/zai-org/glm-52-blog
- The pinned license and contribution records identify the source terms and public development process: https://github.com/THUDM/slime/blob/aaf5c2092b01219fa0d5c2d323741d409086ca32/LICENSE and https://github.com/THUDM/slime/blob/aaf5c2092b01219fa0d5c2d323741d409086ca32/CONTRIBUTING.md

## The non-negotiable trajectory ledger

Rollout `7` has prompt IDs `[101,102]`, six response IDs `[11,12,50,51,13,14]`, and response-only loss mask `[1,1,0,0,1,1]`. IDs `50` and `51` are tool observations and must not receive policy-gradient credit. Reward `1.0`, response length, stop/status, rollout ID, and sampled log probabilities must remain attached to the same sequence.

When one long trajectory splits into multiple samples, its segments must retain their shared rollout identity so gradient weighting doesn't quietly multiply. Text decoded for a human isn't a substitute for the original token IDs.

## Distinguish overlap mode from transport mode

Synchronous training completes generation before the corresponding train/sync boundary. The async path overlaps a later rollout with current training and must drain or coordinate generation before a conflicting weight update. The fully async path keeps an in-flight worker/queue alive across rollout calls, so staleness, queue growth, requeue behavior, and abort handling become explicit operational evidence.

Full NCCL, full disk, and delta disk are separate weight carriers. A full directory needs cross-host visibility; an XOR delta requires the declared base and exactly-once application. In the article's byte example, applying the same XOR patch twice restores the old state. Checksums, policy version, pause/flush, transfer completion, reload, and resume are required lifecycle checks, not proof of an atomic crash-safe transaction. Disk preparation precedes the live-engine pause in the pinned non-colocated paths.

## Limits that cannot be inferred

SGLang owns serving internals, Megatron owns training math and process groups, and Ray owns placement/actor lifecycle. slime integration doesn't establish checkpoint license rights, arbitrary environment safety, exact on-policy learning, or compatibility across unpinned upstream revisions. A model report's objective doesn't determine another deployment's loss configuration.

## Manual primary-source refresh, September 23, 2026

Implementation claims use `681b3adca54105d5ecd3fb822fa0dc58a427e0f9`. Its fully-async worker uses an unbounded completion queue and stops launching new groups when queued groups reach worker concurrency. Already-running tasks may finish beyond that threshold; this is launch backpressure, not a fixed queue capacity. Preserve generation-time `weight_versions` in agent Samples alongside tokens and log probabilities. Delta publication is in the trainer-side writer, while application follows engine `pull_weights` through its management endpoint and helpers. The existing loss-reduction warning remains valid: shared step-level rollout denominators and reward-to-advantage processing must be checked before dividing sibling rewards by the segment count.
