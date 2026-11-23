---
title: Beta distribution
importance: 83
---

A beta distribution describes uncertainty about an unknown probability between zero and one. Its positive shape parameters, usually written $\alpha$ and $\beta$, control which success probabilities receive more density. The mean is $\alpha/(\alpha+\beta)$, but neither parameter automatically equals a count of actual observed events. Their interpretation depends on the earlier prior from which the distribution was updated.

## How the parameters update


A beta prior with observations conditionally independent Bernoulli trials sharing one success probability produces another beta distribution. Correlated tasks or changing success probabilities require a different likelihood or explicit dependence model. The sum $\alpha+\beta$ controls the prior mean's weight relative to new observations; observed benchmark-task counts remain separate from those modeling assumptions.

## Example

A Beta(2, 2) prior has mean $2/(2+2)=0.5$. Eight passes and two failures produce Beta(10, 4), whose mean is $10/14\approx0.714$. Relative to a uniform Beta(1, 1) baseline, Beta(2, 2) could itself result from one earlier observed pass and one earlier observed failure. Its total parameter weight of four therefore does not prove that four historical tasks were observed.

## Why it matters here

Coding-agent evaluations often begin with few reviewed tasks. Keeping the entire beta distribution exposes prior assumptions, uncertainty, and sensitivity to new evidence instead of treating a noisy pass fraction as a deployment guarantee.

## Related terms

- [Bayesian inference](glossary://bayesian-inference)
- [Conjugate prior](glossary://conjugate-prior)
- [Posterior predictive probability](glossary://posterior-predictive)
- [Credible interval](glossary://credible-interval)
