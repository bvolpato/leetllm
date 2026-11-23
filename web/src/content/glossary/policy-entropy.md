---
title: Policy entropy
importance: 74
kind: term
---
**Policy entropy** measures the spread of a policy's action distribution at a given state or token prefix. For normalized discrete probabilities $p_i$, entropy is $H=-\sum_i p_i\log p_i$, with $0\log0=0$. Natural logs give nats; base-2 logs give bits. For $K$ possible discrete actions, $0\le H\le\log K$. It summarizes distributional uncertainty; assess answer correctness and factual recall with task-specific evaluation.

High entropy means probability mass is spread across more choices. Low entropy means policy is concentrated. Neither is inherently good: task, state, vocabulary, sampling filter, and training phase determine useful range.

## RL diagnosis

Abrupt collapse can indicate oversized update, reward exploit, numerical failure, policy mismatch, or nondeterministic execution. Rising entropy with falling reward can indicate policy becoming less decisive. Always segment by prompt family, position, and policy version, then interpret with KL, reward, clipping, and ratio metrics.

## Measurement choices

Full-vocabulary model entropy differs from entropy after temperature, top-p, top-k, or min-p filtering. Log endpoint and distribution explicitly. Average over policy-owned tokens only, then slice reasoning, tool name, arguments, and conclusion. Sequence length weighting changes aggregate: token-weighted mean lets long trajectories dominate, while sequence-weighted mean gives each rollout equal influence.

## Example

For two actions, probabilities $[0.5,0.5]$ have entropy $\ln2\approx0.693$ nats; $[0.9,0.1]$ have about $0.325$ nats. The second policy is more concentrated, which can be useful or harmful depending on the action quality. A sharp entropy drop alongside ratio and replay anomalies is a stability signal; inspect training state and rollout behavior to diagnose it. Frameworks such as [PyTorch's categorical distribution](https://docs.pytorch.org/docs/stable/distributions.html#torch.distributions.categorical.Categorical) expose entropy for the specified distribution.

## Why it matters here

Agent-training lessons need to distinguish exploration from useful concentration. Interpret entropy alongside reward, state coverage, and policy-mismatch evidence when assessing training quality.

## Related terms

- [Policy gradient](glossary://policy-gradient)
- [KL divergence](glossary://kl-divergence)
- [Policy mismatch](glossary://policy-mismatch)
- [GRPO](glossary://grpo)
