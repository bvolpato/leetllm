---
title: Membership inference
aliases: ["membership inference attack"]
importance: 86
---
Membership inference attempts to determine whether a specific record, user, or document was included in a model's training data. An attacker might inspect output confidence, per-example loss, generated text, or differences between a target model and reference models. Attack success indicates a disclosure channel; attack testing provides evidence for tested attacks, while formal privacy claims require a method such as differential privacy.

## Measure attack power against a matched population

An audit needs known members and nonmembers sampled from comparable populations. If members come from one distribution and nonmembers from another, a classifier can distinguish the populations without learning actual membership. Report true-positive rate at a declared false-positive rate and include balanced-set accuracy with deployment prevalence and error costs stated.

## Example

Suppose a model assigns unusually low loss to a private training sentence and higher loss to comparable held-out sentences. An attacker chooses a threshold and labels the low-loss sentence a likely member. If 30 of 100 true members cross that threshold while only one of 100 matched nonmembers does, the audit observes 30% true-positive rate at 1% false-positive rate. This measures one attack under one sampling design; stronger attacks or different protected units can yield different results.

## Why it matters here

Fine-tuned assistants and human-feedback models can memorize sensitive examples. Pair membership-attack testing with differential-privacy accounting to connect abstract privacy claims to measured model behavior.

## Related terms

- [Differential privacy](glossary://differential-privacy)
- [Overfitting](glossary://overfitting)
- [Precision and recall](glossary://precision-recall)
