---
title: Statistical learning theory
importance: 91
---
Statistical learning theory studies when performance measured on a finite sample can support claims about performance on unseen examples. It connects sample size, hypothesis-class complexity, loss assumptions, and the rule used to select a model. The central challenge is that a model chosen after inspecting data cannot be treated as a completely fixed hypothesis evaluated independently of that data.

## Why searching many models changes the question

For one fixed predictor evaluated on independent, identically distributed examples with bounded losses, concentration inequalities can bound the gap between empirical and expected risk on that same population. Searching many predictors introduces a selection effect: one candidate can look unusually strong by chance. For a fixed finite class $\mathcal H$ chosen independently of the sample, losses in $[0,1]$, and $n$ IID examples, Hoeffding plus a union bound gives a simultaneous absolute-gap bound of $\sqrt{\log(2|\mathcal H|/\delta)/(2n)}$ with probability at least $1-\delta$. Richer classes require more refined capacity measures. These bounds control risk under stated assumptions; a changed deployment distribution requires separate robustness evidence.


## Example

An engineer tests 1,000 prompts on the same 20-example validation set and reports the highest observed score. Even if all prompts have equal true quality, the winner benefits from random favorable examples. A held-out test set, nested validation, or a complexity-aware bound is needed before treating that winner as a reproducible improvement. Doubling the number of prompts changes the model-selection process even when the dataset and observed top score happen to remain unchanged.

If later prompts are authored in response to validation results, the fixed-class assumption above no longer follows merely from counting the 1,000 tested candidates. Reserve fresh evaluation data or use a method that accounts for adaptive selection.

## Why it matters here

Prompt tuning, hyperparameter sweeps, benchmark leaderboards, and architecture ablations all reuse limited evidence. Researchers need a vocabulary for sample complexity, selection bias, and uncertainty before claiming that an improvement generalizes.

## Related terms

- [Overfitting](glossary://overfitting)
- [Train, validation, and test split](glossary://train-validation-test-split)
- [Confidence interval](glossary://confidence-interval)
