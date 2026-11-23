---
title: Inter-annotator agreement
aliases: ["IAA", "inter-rater agreement"]
importance: 83
---
**Inter-annotator agreement (IAA)** measures how consistently multiple reviewers label the same examples under a shared rubric. It measures reproducibility; factual correctness and safety require separate review against the intended policy or evidence.

## Match the statistic to the annotation design

Simple percent agreement counts matching labels but can be misleading when one class dominates. Cohen's kappa adjusts for expected chance agreement between two categorical annotators. Other statistics support more annotators, missing labels, ordered categories, or different disagreement costs.

Report which reviewers labeled which examples, the rubric version, class prevalence, sample count, and the selected statistic. Inspect disagreement clusters by policy category or document type. A single aggregate can hide that reviewers agree on routine outputs but diverge on prompt injection, sensitive data, or ambiguous tool actions.

## Example

Two reviewers assess whether assistant responses disclose secrets. Both reject a literal API key, but one approves a shortened credential while the other rejects it. The disagreement exposes a missing rule about partial secret disclosure rather than proving that either reviewer is careless.

The team clarifies the rubric, independently relabels a reserved sample, adjudicates remaining conflicts, and records the updated rubric and label versions. Gold examples separately test whether both reviewers now match the intended policy.

## Why it matters here

Human-feedback datasets, model-judge calibration, fairness reviews, and agent safety evaluations all depend on labels that can be reproduced. Agreement metrics catch ambiguity before unreliable labels become reward-model training data or release-gate evidence, but they must be paired with ground-truth review and slice-level analysis.

## Related terms

- [Cohen's kappa](glossary://cohens-kappa)
- [Calibration](glossary://calibration)
- [Golden dataset](glossary://golden-dataset)
- [Active learning](glossary://active-learning)
