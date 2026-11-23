---
title: Recursive language model
aliases: ["RLM", "recursive language models"]
importance: 82
---

A **recursive language model (RLM)** externalizes a long input as data in an execution environment and processes selected pieces through bounded model calls. Zhang, Kraska, and Khattab define the inference pattern in [Recursive Language Models](https://arxiv.org/abs/2512.24601). A root model writes programmatic steps that inspect, partition, or transform the data and can invoke additional model calls on selected pieces. Final reasoning combines those bounded observations into an answer.

## Bound each model call

The key distinction is externalized context. Each child call has its normal context window, while the runtime tracks recursion depth, token consumption, time, cost, data access, and which intermediate result supports the conclusion.

## Example

An engineer asks which release introduced an authorization regression across thousands of incident records. The root program groups records by deployment, calls a child model on each relevant group, and aggregates only results carrying source identifiers. A child that finds no supporting evidence returns an explicit empty result rather than guessing.

Permission checks apply before partitioning and before every child sees document text. Child outputs remain untrusted: validate their shape, preserve lineage, and reject attempts to request broader tools or cross-tenant context. Termination caps prevent recursive fan-out from becoming an accidental denial-of-service or unlimited provider bill.

## Why it matters here

The advanced-agent curriculum uses RLMs to distinguish context management from larger raw windows, ordinary retrieval, and multi-agent delegation. Their operational value depends on observable decomposition, caller-scoped evidence, bounded recursion, and a final answer that can be traced back to authorized source data.

## Related terms

- [Context window](glossary://context-window)
- [Agent scaffold](glossary://agent-scaffold)
- [Token budget](glossary://token-budget)
- [lineage](glossary://provenance)
