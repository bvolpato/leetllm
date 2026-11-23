---
title: Concentration inequality
importance: 80
---
A concentration inequality bounds the probability that a random quantity differs from its expected value by more than a specified amount. In learning theory, it connects finite sample size to uncertainty about an average loss, success rate, or benchmark score. Such bounds require explicit assumptions; dependence, unbounded losses, or unrepresentative sampling can invalidate the particular inequality being used.

## Hoeffding's bounded-observation guarantee

For $n$ independent observations in $[0,1]$, let $\mu=E[\bar X]=\frac1n\sum_iE[X_i]$. Hoeffding's inequality states $P(|\bar X-\mu|\ge t)\le 2\exp(-2nt^2)$. Identically distributed observations share one mean, but identical distributions are not required for this bound. Solving for $t$ at failure probability $\delta$ gives $t=\sqrt{\log(2/\delta)/(2n)}$. This is a conservative distribution-free bound for a fixed quantity. Selecting the best result after many searches requires accounting for that search rather than applying the fixed-model formula unchanged.

For $K$ pre-specified models evaluated on the same independent task sample, a union bound gives simultaneous radius $\sqrt{\log(2K/\delta)/(2n)}$ without requiring independence among model scores. Adaptive tuning requires the candidate set to be specified independently of the test outcomes; the fixed-set correction does not cover unrestricted search.

## Example

With 200 independent binary evaluation outcomes and failure probability 0.05, the Hoeffding radius is approximately $\sqrt{\log(40)/400}=0.096$. An observed pass rate of 0.78 therefore has a conservative bounded-loss interval near 0.684 to 0.876 before clipping to valid probability limits. The same formula applied to 20 correlated retries of one task would be unjustified, because retries are not 20 independent task draws.

## Why it matters here

Agent evals, prompt sweeps, model comparisons, and online experiments all tempt engineers to overread small samples. Concentration bounds make the sample size, acceptable failure probability, and independence assumptions explicit.

## Related terms

- [Statistical learning theory](glossary://statistical-learning-theory)
- [Confidence interval](glossary://confidence-interval)
- [Variance](glossary://variance)
