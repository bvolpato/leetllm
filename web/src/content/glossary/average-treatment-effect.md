---
title: Average treatment effect
aliases: ["ATE"]
importance: 85
---
The average treatment effect is the expected difference between the outcome a population would experience if everyone received an intervention and the outcome the same population would experience if nobody received it. In potential-outcome notation, $\mathrm{ATE}=E[Y(1)-Y(0)]$. Its definition requires a target population, a specific intervention, an outcome, and a time horizon.

## Standardize to one target population

Randomized treatment supports estimation from arm means when treatment is well defined, observed outcomes match the assigned intervention, interference is appropriately handled, and missing outcomes don't bias the comparison. Observational adjustment additionally needs conditional exchangeability (no remaining confounding given $Z$) and positivity (both actions possible in relevant strata). The formula $\sum_z(E[Y\mid T=1,Z=z]-E[Y\mid T=0,Z=z])P(Z=z)$ standardizes to one target distribution. For continuous covariates use an integral; for a different target population, justify the transport assumptions and target weights.


## Example

Low-risk and high-risk tickets each improve by five percentage points when an assistant is enabled. If the target population is 70% low risk and 30% high risk, the standardized ATE is $0.7\times0.05+0.3\times0.05=0.05$. The naive overall treated-minus-control rate can be negative if hard cases receive the assistant disproportionately. The estimand stays the same; the naive estimator failed to compare equivalent populations.

## Why it matters here

For AI deployment decisions, estimate intervention effects for the intended traffic mix under justified adjustment assumptions. Explicit population weights account for self-selected exposure and make segment-specific harms visible.

## Related terms

- [Causal inference](glossary://causal-inference)
- [Confounder](glossary://confounder)
- [A/B testing](glossary://ab-testing)
