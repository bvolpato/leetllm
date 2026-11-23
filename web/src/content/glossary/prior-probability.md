---
title: Prior probability
aliases: ["Bayesian prior"]
importance: 86
---
A prior probability expresses uncertainty about an event or model parameter before incorporating the specific evidence currently under review. A prior can summarize historical rates, physical constraints, earlier experiments, or deliberately weak assumptions. Its meaning always depends on the population and decision point it represents.

## Base rates change the interpretation of evidence

Suppose 1% of account requests are abusive. That 0.01 base rate is the prior probability of abuse before examining a detector alert. An alert with a 95% true-positive rate and a 5% false-positive rate produces a posterior near 16%, not 95%, because clean requests outnumber abusive requests by 99 to 1. A prior from a different customer population or time period can make the updated answer wrong even when the detector arithmetic is correct.


## Example

A beta prior Beta(2, 2) assigns a mean success rate of $2/(2+2)=0.5$ before a new agent evaluation begins. After eight successes and two failures, conjugate updating produces Beta(10, 4). The prior contributes two success-shaped and two failure-shaped counts, while the ten real observations supply most of the updated evidence. The term *pseudo-counts* describes how prior parameters affect the update; production labels remain separately verified observations.

## Why it matters here

Abuse detection, model routing, experiment analysis, and cold-start ranking all depend on a sensible reference population. Researchers must record where a prior came from and check whether deployment traffic still resembles that population.

## Related terms

- [Bayesian inference](glossary://bayesian-inference)
- [Probability calibration](glossary://probability-calibration)
- [Data drift](glossary://data-drift)
