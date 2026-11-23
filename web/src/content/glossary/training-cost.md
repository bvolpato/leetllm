---
title: Training cost
aliases: ["post-training cost"]
importance: 80
---
**Training cost** is full incremental cost of producing and validating model update. It includes accelerators, CPUs, fabric, storage, data, annotation, reward/judge APIs, failed work, engineering, evaluation, and operations.

$$
\text{GPU-hours}=\sum_j \text{GPU count}_j\times\text{wall hours}_j.
$$

Allocated GPU-hours measure reserved capacity; useful GPU-hours measure work that produces accepted training data. Tool waits, reward queues, checkpoint pauses, compilation, communication, retries, and failed jobs consume allocation while producing no accepted data.

## Cost ledger

Separate fixed setup, per-step training, per-trajectory generation, reward/evaluation calls, checkpoint storage, and failure/recovery cost. Price every component with timestamped rate and measured quantity. GPU utilization alone can't reconcile invoice because idle reserved capacity, CPU-heavy tools, remote judges, storage retention, and data egress sit outside kernel profile.

Budget forecast should include expected retries and confidence range, then reconcile forecast against metered bill. Attribute shared fleet cost consistently across experiments. Preserve both gross cost and useful-work denominator, and include accepted trajectory volume when judging whether a faster step improved efficiency.

Useful unit metrics include:

- tokens per GPU-hour;
- accepted trajectories per GPU-hour;
- cost per accepted trajectory;
- cost per held-out evaluation point;
- checkpoint storage and network bytes;
- reward API cost per update;
- failed/retried work percentage.

## Example

Two runs use same GPU-hours. Run A accepts twice as many useful trajectories and produces statistically supported held-out gain. Its accepted trajectories per GPU-hour are better even if instantaneous GPU utilization is lower during tool waits. Run A also has lower total cost per trajectory when its CPU, tool, judge, and other ledger costs preserve that gain.

## Why it matters here

Post-training cost spans generation, tools, rewards, learner, checkpoints, and evaluation. Optimize kernels against accepted trajectories and verified gain so lower compute cost translates into better training economics.

## Related terms

- [Goodput](glossary://goodput)
- [Metered billing](glossary://metered-billing)
- [Usage shape](glossary://usage-shape)
- [Cost per token](glossary://cost-per-token)
- [Evaluation science](glossary://evaluation-science)
