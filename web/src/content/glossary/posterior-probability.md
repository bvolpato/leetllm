---
title: Posterior probability
aliases: ["Bayesian posterior"]
importance: 89
---
A posterior probability describes uncertainty after a stated prior has been updated with observed evidence under a specified likelihood model. Bayes' rule multiplies the prior by the likelihood and divides by the probability of the evidence. The resulting posterior is conditional on the assumptions, population, observations, and data-generation model used in that calculation.

## What the posterior does and does not say

For a continuous parameter $\theta$ and observed data $D$, the posterior **density** is $p(\theta\mid D)=p(D\mid\theta)p(\theta)/p(D)$, where $p(D)=\int p(D\mid\theta)p(\theta)\,d\theta$ must be finite and positive. Integrating the density over a region gives its posterior probability; its value at one point is not that point's probability. For discrete hypotheses, replace the integral with a sum. A posterior can summarize its mean, quantiles, or the probability that a success rate exceeds a release threshold. These summaries are model-conditional. They do not prove that mislabeled data is correct, make correlated observations independent, or protect against deployment distribution shift. [Bob Carpenter's Bayesian-statistics notes](https://bob-carpenter.github.io/stan-getting-started/stan-getting-started.html)

## Example

An evaluation starts with Beta(2, 2), then records eight passes and two failures, modeled as independent Bernoulli outcomes conditional on one common success rate. Beta-binomial conjugacy produces a Beta(10, 4) posterior, with mean $10/(10+4)\approx0.714$. Another evaluator begins with Beta(20, 20) and observes exactly the same outcomes. Their posterior is Beta(28, 22), with mean 0.56. The evidence did not change; the stronger prior did. Comparing both results is useful sensitivity analysis, especially when the sample is too small for the observations to dominate.

## Why it matters here

Researchers make deployment and experimentation decisions under incomplete information. Reporting the posterior together with its prior, observation count, and assumptions is more honest than treating one benchmark average as unquestionable truth.

## Related terms

- [Bayesian inference](glossary://bayesian-inference)
- [Prior probability](glossary://prior-probability)
- [Likelihood](glossary://likelihood)
