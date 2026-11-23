---
title: Effective sample size
aliases: ["ESS"]
importance: 87
---

Effective sample size estimates how many independent observations would provide roughly the same precision as a possibly dependent or unevenly weighted collection of samples. In Markov chain Monte Carlo, consecutive states can resemble one another because each transition starts from the previous state. A chain containing many stored states can therefore provide substantially less information about a posterior expectation than the same number of independent draws.

## Compare stored draws with independent information


Effective sample size is tied to a particular estimated quantity. A chain can mix well for a posterior mean while exploring a tail probability or component assignment poorly. Warmup behavior, multiple-chain disagreement, and missing posterior regions can invalidate a reassuring-looking estimate. High effective sample size does not compensate for a biased target distribution or a broken transition rule.

Dependence does not always reduce effective sample size: negatively correlated draws can estimate a mean more precisely than the same number of independent draws, giving an ESS above the stored draw count. This MCMC estimate differs from a weight-only ESS used for importance sampling; report which definition and quantity you used. See the [Stan posterior analysis reference](https://mc-stan.org/docs/reference-manual/analysis.html#effective-sample-size).

## Example

Suppose 10,000 retained posterior states stay close to their predecessors for long stretches. An effective sample-size calculation might indicate that the posterior mean has precision comparable to only 500 independent draws. Reporting 10,000 samples without mentioning dependence exaggerates the evidence. Improving proposal design, running additional chains, or sampling longer can help, but the final diagnostic must be recomputed for the quantity being reported.

## Why it matters here

Bayesian research workflows often use posterior simulation to estimate model quality, parameter uncertainty, or treatment effects. Effective sample size prevents stored-chain length from being confused with independent evidence and connects MCMC diagnostics to the uncertainty of the final reported estimate.

## Related terms

- [Autocorrelation](glossary://autocorrelation)
- [Markov chain Monte Carlo](glossary://markov-chain-monte-carlo)
- [Metropolis-Hastings](glossary://metropolis-hastings)
- [Variance](glossary://variance)
