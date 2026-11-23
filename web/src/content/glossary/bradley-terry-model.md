---
title: Bradley-Terry model
aliases: ["Bradley-Terry preference model"]
importance: 82
---
The **Bradley-Terry model** converts two scalar item scores into the probability that one item wins a pairwise comparison. In language-model reward training, a learned reward function scores two answers to the same prompt, and the score difference predicts which answer a reviewer prefers.

## Preference probability and identifiability

For prompt $x$, preferred candidate $y_w$, rejected candidate $y_l$, and reward model $r$, the predicted preference probability is

$$
P(y_w\succ y_l\mid x)=\sigma\left(r(x,y_w)-r(x,y_l)\right).
$$

Training minimizes $-\log\sigma(r_w-r_l)$ across labeled pairs. Only the difference is identifiable: adding the same constant to both scores doesn't change the predicted probability. A reward value of $1.8$ isn't an absolute measure of safety or truth; it matters relative to another answer under the same prompt and scoring contract.

## Example

An access-policy judge gives the ticket-and-cite response a score of $1.8$ and the unauthorized grant response a score of $0.7$. The margin is $1.1$, so the predicted preference is $\sigma(1.1)\approx0.750$. Adding $5$ to both scores produces $6.8$ and $5.7$, but the margin and preference probability stay unchanged.

A reversed pair with margin $-0.2$ has predicted preferred-answer probability approximately $0.450$. That row contributes a larger loss and pushes training to reverse the incorrect ordering. No amount of margin arithmetic proves the underlying reviewer preference is correct or consistent.

## Why it matters here

Bradley-Terry turns preference annotations into the reward-model objective used in alignment workflows. Understanding margins prevents teams from treating uncalibrated reward scores as probabilities or comparing absolute scores across incompatible models.

## Related terms

- [Reward model](glossary://reward-model)
- [Calibration](glossary://calibration)
- [RLHF](glossary://rlhf)
- [DPO](glossary://dpo)
