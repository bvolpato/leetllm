---
title: Conjugate prior
importance: 78
---

A conjugate prior is a prior distribution chosen so that combining it with a particular likelihood produces a posterior from the same distribution family. Conjugacy simplifies Bayesian updates because the posterior parameters can be calculated directly instead of requiring numerical integration or sampling. Conjugacy depends on the likelihood family and model as well as the prior distribution.

## Keep the same distribution family


For independent binary observations, a beta prior is conjugate to the Bernoulli or binomial likelihood. A prior Beta($\alpha,\beta$) and evidence containing $s$ successes and $f$ failures produce Beta($\alpha+s,\beta+f$). The compact arithmetic remains valid only when the likelihood and sampling assumptions reasonably describe the evidence.

## Example

Start with Beta(2, 2) for an agent's unknown task-pass probability. Eight observed passes and two observed failures update the parameters to Beta(10, 4). The posterior remains beta, so its mean is available immediately: $10/(10+4)\approx0.714$. The benchmark records eight passes and two failures. Prior parameters encode modeling assumptions separately from those reviewed tasks.

## Why it matters here

Conjugacy makes early evaluation uncertainty visible with a small runnable calculation. It also helps distinguish easy posterior arithmetic from stronger claims about representative sampling, correlated retries, historical-prior provenance, and deployment validity.

## Related terms

- [Beta distribution](glossary://beta-distribution)
- [Likelihood](glossary://likelihood)
- [Prior probability](glossary://prior-probability)
- [Posterior probability](glossary://posterior-probability)
