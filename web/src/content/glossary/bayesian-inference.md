---
title: Bayesian inference
importance: 94
---
Bayesian inference updates uncertainty about an unknown quantity when new evidence arrives. It combines a prior distribution, which describes uncertainty before observing the current data, with a likelihood, which describes how probable those observations would be under each candidate explanation. Normalizing their product produces a posterior distribution rather than a single forced answer.

## Updating beliefs without pretending certainty

For an unknown success rate $p$ and observations $D$, Bayes' rule says $P(p \mid D) \propto P(D \mid p)P(p)$. The proportionality becomes equality after dividing by the evidence $P(D)$. A narrow posterior means these observations distinguish plausible values reasonably well. A wide posterior means several explanations still fit. Neither outcome proves that the assumed model describes the real deployment population.


## Example

Start with a Beta(2, 2) prior for a coding agent's task success probability. Observe eight passes and two failures on independently sampled tasks. The updated distribution is Beta(10, 4), whose mean is $10/14 \approx 0.714$. The raw observed rate is 0.8; the posterior mean is lower because the prior contributes four pseudo-observations. With eighty passes and twenty failures, the posterior mean becomes $82/104 \approx 0.788$, so the larger sample outweighs the same prior.

## Why it matters here

Model evaluation, online experiments, calibration, reward estimation, and bandit routing all require decisions from limited evidence. Bayesian updating makes assumptions visible, separates uncertainty from point estimates, and prevents a tiny benchmark from becoming an unjustified certainty claim.

## Related terms

- [Confidence interval](glossary://confidence-interval)
- [Variance](glossary://variance)
- [Probability calibration](glossary://probability-calibration)
