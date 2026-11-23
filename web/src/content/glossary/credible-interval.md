---
title: Credible interval
importance: 82
---
A credible interval is a range containing a chosen share of a Bayesian posterior distribution for an unknown parameter. A 90% credible interval means that, under the specified prior, likelihood, and observed data, the posterior assigns 90% probability to parameter values inside that interval. Its interpretation differs from a frequentist confidence interval's repeated-sampling coverage statement.

## Posterior probability versus procedure coverage

If $p$ denotes an agent's unknown success rate, a central 90% credible interval runs from the posterior's fifth percentile to its ninety-fifth percentile. The interval can be narrow because the evidence is strong or because a very concentrated prior was imposed. Inspecting its endpoints without the prior and sample size can therefore produce a misleading impression of certainty.

## Example

Take a uniform Beta(1, 1) prior and observe no passes in two agent trials. The posterior is Beta(1, 3), with mean 0.25. The observed sample rate is zero, but the posterior still assigns probability to nonzero success rates because two failures cannot prove that every future task will fail. After zero passes in 200 independent representative trials, the posterior becomes Beta(1, 201) and concentrates much closer to zero. The interpretation depends on independence and representativeness in both cases.

## Why it matters here

Agent benchmarks, low-volume release decisions, and experiment arms often have too little evidence for a point estimate to be useful. Credible intervals communicate parameter uncertainty while forcing the researcher to reveal modeling assumptions.

## Related terms

- [Bayesian inference](glossary://bayesian-inference)
- [Confidence interval](glossary://confidence-interval)
- [Variance](glossary://variance)
