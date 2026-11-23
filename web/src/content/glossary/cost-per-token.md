---
title: Cost per token
aliases: ["token cost"]
importance: 78
---
**Cost per token** divides serving or training cost by tokens processed. It can describe provider price, internal marginal cost, or fully loaded unit cost. State which one.

$$
\text{cost per token}=\frac{\text{incremental cost}}{\text{counted tokens}}.
$$

Counted tokens may be input, output, cached input, reasoning, training, or all tokens. These have different prices and hardware work. One blended value can hide expensive output generation, retries, cache misses, idle accelerators, or judge calls.


## Internal cost

Include accelerator/CPU time, fabric, power, storage, retries, failed work, and operations. For agents, cost per successful or accepted trajectory often gives better decision signal because one task includes many model calls and tools.

## Example

Run A has lower token cost but generates long failed trajectories. Run B has higher token cost and doubles accepted outcomes. Cost per token favors A; cost per accepted trajectory may favor B.

## Why it matters here

Token cost helps explain billing and hardware efficiency, but must be paired with goodput and quality. Cheap tokens that don't produce accepted learning data aren't useful savings.

## Related terms

- [Training cost](glossary://training-cost)
- [Metered billing](glossary://metered-billing)
- [Goodput](glossary://goodput)
- [Cache hit rate](glossary://cache-hit-rate)
- [Usage shape](glossary://usage-shape)
