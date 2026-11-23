---
title: DAPO
aliases: ["Decoupled Clip and Dynamic Sampling Policy Optimization"]
importance: 86
---
**DAPO** is GRPO-family online policy optimization recipe for long verifiable reasoning. It combines decoupled clipping, dynamic sampling, token-level loss aggregation, and explicit overlong handling.

Four ideas:

1. Separate lower and upper clip widths so positive-advantage exploration can have different bound.
2. Replace zero-variance groups that contribute no group-relative gradient.
3. Aggregate valid policy tokens carefully across long variable-length responses.
4. Filter or softly penalize overlong/truncated responses instead of treating truncation as ordinary answer.

## When it fits

DAPO is useful when [GRPO](glossary://grpo) spends rollout budget on all-equal groups, response length biases reduction, or exploration collapses.

## Failure modes

Copied clip values aren't universal. Dynamic sampler can erase rare domains. Incorrect truncation labels reward incomplete responses. Local token means across uneven microbatches can silently change objective.

## Example

Eight-rollout group returns identical rewards, so dynamic sampler replaces it. Another long response reaches maximum length and receives explicit overlong treatment instead of normal successful label.

## Why it matters here

DAPO exposes several places where “GRPO implementation detail” changes effective data and gradient. Each mechanism needs separate metrics and ablation.

## Related terms

- [GRPO](glossary://grpo)
- [Dynamic sampling](glossary://dynamic-sampling)
- [Policy ratio](glossary://policy-ratio)
- [On-policy learning](glossary://on-policy)
- [Goodput](glossary://goodput)
