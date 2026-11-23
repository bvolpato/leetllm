---
title: Likelihood
importance: 90
---
Likelihood is the probability or probability density of the observed data viewed as a function of candidate model parameters. Once observations are fixed, the likelihood compares how well different parameter values explain those observations. It is not generally a normalized probability distribution over parameters and must not be interpreted as one without a prior and normalization.

## Same formula, different quantity held fixed

For eight successful agent runs and two failures, a Bernoulli model assigns likelihood proportional to $p^8(1-p)^2$ to each proposed success probability $p$. The expression peaks at $p=0.8$. That maximizer is the maximum-likelihood estimate, but it says nothing by itself about uncertainty, prior beliefs, dependence between runs, or whether the task sample represents future traffic.

## Example

Compare two candidate rates using the same eight successes and two failures. At $p=0.8$, the likelihood is proportional to $0.8^8\cdot0.2^2$. At $p=0.5$, it is proportional to $0.5^{10}$. The ratio is approximately $6.87$, so the observed outcomes are about 6.87 times as compatible with the first parameter value under this model. This likelihood ratio compares compatibility of the observed outcomes; posterior probabilities additionally depend on prior assumptions.

## Why it matters here

Cross-entropy training, language-model log probabilities, latent-variable fitting, and Bayesian updates all depend on likelihood. Knowing which variable is fixed prevents confusion between model fit, posterior uncertainty, and predictive performance.

## Related terms

- [Bayesian inference](glossary://bayesian-inference)
- [Cross-entropy](glossary://cross-entropy)
- [Log probability](glossary://logprob)
