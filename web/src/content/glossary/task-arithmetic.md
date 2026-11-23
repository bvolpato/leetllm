---
title: Task arithmetic
aliases: ["task vector arithmetic"]
importance: 76
---
**Task arithmetic** represents a fine-tune as the difference between its trained checkpoint and a shared base checkpoint. The resulting **task vector** can be added, subtracted, or combined with other task vectors to propose a model using existing fine-tunes.

## The shared-base equation

For base weights $\theta_0$ and fine-tuned weights $\theta_i$, define $\tau_i=\theta_i-\theta_0$. A candidate combining two skills is $\theta_{\mathrm{merge}}=\theta_0+\lambda_1\tau_1+\lambda_2\tau_2$, where the coefficients control each update's contribution.

The subtraction must use the same base revision for every task. Equal tensor shapes don't prove base compatibility. Combining deltas computed against different starting checkpoints silently imports unrelated base differences into the result.

## Example

Suppose one scalar base weight is $2.0$, a code fine-tune changes it to $2.5$, and a math fine-tune changes it to $1.8$. Their task updates are $+0.5$ and $-0.2$. Equal-strength task arithmetic proposes $2.0+0.5-0.2=2.3$.

That arithmetic is exact for the parameter, while predicted behavior can be nonlinear. Opposite updates can cancel a shared feature, and even same-sign updates can overshoot. Check coding, mathematics, general behavior, and safety slices separately before accepting the merged checkpoint.

## Why it matters here

Task arithmetic supplies the conceptual foundation for modern checkpoint-merging methods and makes shared lineage, coefficient sweeps, and interference visible.

## Related terms

- [Model checkpoint](glossary://model-checkpoint)
- [Vector](glossary://vector)
- [Gradient](glossary://gradient)
- [Evaluation gate](glossary://eval-gate)
