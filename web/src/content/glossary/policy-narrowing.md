---
title: Policy narrowing
aliases: ["policy distribution narrowing", "distribution narrowing", "policy sharpening"]
importance: 80
kind: term
---
**Policy narrowing** means action probability mass concentrates on fewer choices over time. In language model it can appear as lower token entropy, smaller processed sampling support, fewer distinct completions, repeated tool paths, or one response template dominating.

## Specialization or collapse?

Policy narrowing can be healthy specialization: training raises the probability of some good decisions while preserving useful alternatives. Collapse occurs when concentration damages exploration, robustness, task-family coverage, or held-out performance. Mark the transition with held-out quality, task-family coverage, and fixed-sampler diversity.

Sampler changes can mimic learned narrowing. Lower temperature or tighter top-p/top-k reduces sampled diversity without changing weights. Separate model-token entropy from processed-sampler entropy, compare fixed-weight generations, and keep sampling-support contract explicit.

## Example

Across one run lineage, token entropy and distinct action paths drift down while eval improves at first. Later support shrinks quickly, one tool sequence repeats across tasks, and held-out quality stalls. Early phase may be useful specialization; later knee deserves containment and checkpoint comparison.

## Why it matters here

Average reward may react late or remain noisy. Entropy, support, completion diversity, clipping, and trainer-versus-rollout mismatch together can warn that policy is becoming brittle before headline eval fails.

## Related terms

- [Policy entropy](glossary://policy-entropy)
- [Sampling support](glossary://sampling-support)
- [Policy clipping](glossary://policy-clipping)
- [Policy mismatch](glossary://policy-mismatch)
