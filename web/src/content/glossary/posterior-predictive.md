---
title: Posterior predictive probability
aliases: ["posterior predictive distribution"]
importance: 80
---

The posterior predictive distribution describes a future observation after accounting for uncertainty in model parameters. Instead of plugging one best parameter estimate into the likelihood, it averages the future-outcome probability over parameter values weighted by their posterior plausibility. The result therefore depends on the prior, the observed evidence, the likelihood, and the assumption that the future observation comes from the modeled population.

## Average over uncertain parameters


For one future Bernoulli trial with a beta posterior, averaging the success probability over that posterior gives its mean. A posterior Beta($a,b$) therefore predicts a success probability of $a/(a+b)$. This convenient equality concerns a single future binary outcome. Predicting several future successes requires accounting for their shared uncertain success probability.

In general, $p(\widetilde y\mid D)=\int p(\widetilde y\mid\theta)\,p(\theta\mid D)\,d\theta$. Under conditional independence of the future outcome and observed data given $\theta$, this averages both observation randomness and parameter uncertainty. It cannot repair a misspecified likelihood or an unmodeled change in the task population. [Stan posterior-prediction guide](https://mc-stan.org/docs/stan-users-guide/posterior-prediction.html)

## Example

A coding agent starts with Beta(2, 2), then passes eight of ten comparable evaluation tasks. Its updated distribution is Beta(10, 4). The probability assigned to passing one additional comparable task is $10/14\approx0.714$, not the raw observed fraction of $8/10=0.8$. Neither value promises that the next task will pass.

For two future tasks that are independent given the same unknown success rate, the probability of passing both is $E[\theta^2]=10\times11/(14\times15)\approx0.524$. Squaring the single-task predictive mean gives only $(10/14)^2\approx0.510$: it omits the dependence induced by sharing an uncertain parameter. A count of future passes follows a beta-binomial predictive distribution under these assumptions.

## Why it matters here

Release decisions need predictions for fresh tasks as well as summaries of historical rows. Posterior prediction preserves limited-sample uncertainty while making prior assumptions and deployment-population mismatches available for review.

## Related terms

- [Bayesian inference](glossary://bayesian-inference)
- [Beta distribution](glossary://beta-distribution)
- [Posterior probability](glossary://posterior-probability)
- [Expected value](glossary://expected-value)
