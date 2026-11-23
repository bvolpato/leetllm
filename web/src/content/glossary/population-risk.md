---
title: Population risk
aliases: ["expected risk", "true risk"]
importance: 87
---

Population risk is a predictor's expected loss over the data distribution a claim is meant to describe. For a predictor $h$ and loss function $\ell$, it is $L(h)=E[\ell(h(X),Y)]$, where $(X,Y)$ is a fresh draw from the declared target population. Unlike empirical risk, population risk usually cannot be observed exactly because only a finite sample of outcomes is available.

## Define the population before estimating its risk


The population must be defined before interpreting the expectation. A model can have one risk for short English prompts and another for multilingual production requests, so estimate risk for the target population. Independent sampling, stable labeling, and freezing the evaluated predictor help connect observed evidence to the stated population.

## Example

Suppose a support router fails four of 40 independently sampled production-like cases. Its empirical risk is 0.10, but its population risk remains unknown. A concentration bound can qualify how far the observed fraction may lie from the expected production loss under explicit assumptions. If the 40 cases were handpicked easy tickets or repeated versions of one task, that argument no longer supports the original deployment claim.

## Why it matters here

LLM and agent teams make release decisions about future traffic as well as stored benchmark rows. Explicit population risk separates that operational question from the observed score and highlights sampling bias, distribution changes, and holdout contamination.

## Related terms

- [Empirical risk](glossary://empirical-risk)
- [Generalization gap](glossary://generalization-gap)
- [Expected value](glossary://expected-value)
- [Concentration inequality](glossary://concentration-inequality)
