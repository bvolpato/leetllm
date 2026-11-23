---
title: RL rollout
aliases: ["RL trajectory", "policy rollout"]
importance: 82
kind: term
---
**RL rollout** is sampled interaction between policy and environment. It records states, model actions, environment observations, rewards, termination, and metadata needed by trainer.

For language-model agents, actions are generated tokens and tool calls. Tool outputs are observations, not policy actions. Loss mask should optimize only action tokens owned by policy.

## Example

One SRE rollout starts with incident prompt, samples hypothesis, calls telemetry tool, receives result, calls more tools, and submits conclusion. Group-relative training can sample several rollouts from same task, reward each complete trajectory, and compare them within group.

Do not confuse RL rollout with software deployment rollout, which means gradually releasing new version to users or instances.

## Record contract

Replayable language-agent rollout needs task identity, messages, exact token IDs, prompt/action boundary, sampling parameters, behavior-policy version, action log probabilities, stop reason, rewards, and environment results. Sparse MoE systems may also need selected expert IDs and attention indexes. Mark tool observations nontrainable. Missing or shifted token metadata can turn correct reward into invalid gradient.

## Why it matters here

Policy-gradient learners need action tokens, observations, rewards, masks, and behavior-policy identity consistent with their estimator. Requirements vary by replay implementation; include expert routes or sparse-attention indexes when the chosen replay uses them. Missing or mismatched metadata can invalidate the policy ratio.

## Related terms

- [Trajectory evaluation](glossary://trajectory-evaluation)
- [Policy gradient](glossary://policy-gradient)
- [Reward function](glossary://reward-function)
- [GRPO](glossary://grpo)
- [Policy mismatch](glossary://policy-mismatch)
