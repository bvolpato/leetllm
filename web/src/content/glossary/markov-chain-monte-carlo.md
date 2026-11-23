---
title: Markov chain Monte Carlo
aliases: ["MCMC"]
importance: 91
---

Markov chain Monte Carlo is a family of algorithms that approximate expectations or distributions by constructing a sequence of dependent samples whose long-run distribution matches a chosen target. In Bayesian inference, the target is often a posterior whose normalizing constant or direct sampling procedure is difficult to calculate. Each new state depends on the current state, so the number of stored draws is not the same as the number of independent observations.

## Approach a difficult target through a dependent chain


Early states can reflect an arbitrary initialization rather than the target distribution, motivating warmup or burn-in checks. Later states may still be strongly correlated. Effective sample size estimates how much independent information those dependent draws contain for a particular quantity. Multiple chains, mixing diagnostics, and convergence checks help identify poor exploration, but no diagnostic automatically proves that every posterior region was discovered.

## Example

A beta-binomial posterior can be updated exactly, so MCMC is unnecessary for that simple case. Suppose instead that several model-quality parameters interact through a likelihood with no convenient conjugate form. A Markov chain can propose new parameter states, retain states using a valid target-preserving rule, and estimate posterior means from the resulting draws. Ten thousand highly correlated states can convey much less information than ten thousand independent samples.

## Why it matters here

Research-grade Bayesian models often exceed closed-form conjugate examples. MCMC connects those models to practical posterior approximation while making initialization, autocorrelation, effective sample size, and convergence uncertainty explicit.

## Related terms

- [Metropolis-Hastings](glossary://metropolis-hastings)
- [Gibbs sampling](glossary://gibbs-sampling)
- [Bayesian inference](glossary://bayesian-inference)
- [Posterior probability](glossary://posterior-probability)
