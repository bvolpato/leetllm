---
title: Hypothesis class
importance: 83
---

A hypothesis class is the set of candidate predictors or decision rules considered by a learning procedure. A predictor might be one prompt, a threshold, a linear classifier, or a neural network configuration. The class determines which relationships the learner can represent and how many opportunities it has to fit accidental patterns in a finite sample.

## Search candidates without confusing selection and evaluation


A finite-class union bound can control empirical versus population error for a class fixed independently of the sampled data, with bounded losses and independent, identically distributed examples. Also assess correlated cases and deployment distribution shift. See [Understanding Machine Learning, Chapter 4](https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/).

If researchers generate new prompts after reading validation errors, the eventual list is data-dependent. Analyze that adaptive search with a method that accounts for how validation evidence shaped the class; a larger, independently specified class may cover it. Infinite classes require other capacity measures, such as VC dimension or complexity measures tailored to the predictor family.

## Example

An engineer declares ten routing prompts before viewing 40 reviewed support cases. A finite-class analysis can account for ten prespecified candidates. Another engineer repeatedly studies those labels, invents new prompts to repair each mistake, and ends with ten saved prompts. The two searches contain the same final number of files, but the second candidate set depended on the evaluation evidence.

## Why it matters here

Prompt optimization, hyperparameter tuning, agent-policy selection, and architecture search create selection opportunities that isolated benchmark percentages conceal. Declaring the candidate class and reserving independent final evidence makes release claims substantially easier to defend.

## Related terms

- [VC dimension](glossary://vc-dimension)
- [Uniform convergence](glossary://uniform-convergence)
- [Union bound](glossary://union-bound)
- [Selection bias](glossary://selection-bias)
