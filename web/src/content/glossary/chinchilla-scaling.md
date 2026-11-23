---
title: Chinchilla scaling
importance: 83
---
**Chinchilla scaling** is a compute-optimal training guideline from Hoffmann and colleagues: under their dense-transformer training assumptions, model size and training-token count should grow approximately together as training compute increases. A widely used summary is roughly twenty training tokens per model parameter. Use it as a planning approximation and choose a suitable ratio for the model architecture and training setup.

## Compute-optimal allocation

Write $N$ for dense parameter count, $D$ for training tokens, and approximate training compute as $C\approx6ND$. Combining that estimate with $D\approx20N$ gives $C\approx120N^2$. A planner can therefore estimate $N\approx\sqrt{C/120}$ and $D\approx20N$ before correcting for the actual architecture and hardware accounting.

For $N=70$ billion parameters, the guideline gives approximately $1.4$ trillion tokens. Doubling parameters to $140$ billion while preserving the same ratio requires approximately $2.8$ trillion tokens and roughly four times the training compute.


## Example

A team considering a seven-billion-parameter dense model begins with a $140$-billion-token training estimate. If its licensed corpus contains only $35$ billion distinct useful tokens, it must explicitly evaluate repetition, acquire more suitable data, reduce model size, or accept that the run doesn't match the study's assumptions.

Heavy inference demand can favor training a smaller model on more than twenty tokens per parameter. Mixture-of-experts models, changed tokenizers, different data quality, and alternative objectives also invalidate a blind application of the dense-model ratio.

## Why it matters here

Chinchilla scaling turns an abstract training budget into a concrete parameter count and corpus requirement. It connects the scaling-laws lesson to data pipelines while preventing readers from confusing training-compute optimality with lifetime serving optimality.

## Related terms

- [Pretraining](glossary://pretraining)
- [Token budget](glossary://token-budget)
- [Training cost](glossary://training-cost)
- [Cross-entropy](glossary://cross-entropy)
