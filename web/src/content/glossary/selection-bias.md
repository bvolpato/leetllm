---
title: Selection bias
importance: 89
---

Selection bias occurs when the observations, models, or reported outcomes included in an analysis are chosen through a process that changes what the evidence represents. It can make a benchmark winner look stronger than it is, make a treated population incomparable with a control population, or hide failed experiments that were never reported. Different selection mechanisms require different repairs.

## Identify the mechanism that selected the evidence

Repeatedly choosing the highest-scoring prompt on a shared validation set favors accidental sample fit. Routing only difficult tickets to an assistant makes its raw success rate incomparable with an easier control group. Conditioning on a post-treatment outcome can introduce another distortion even when pre-treatment groups were balanced.

## Example

A team tries 1,000 prompts against the same 40 labeled requests and publishes only the top score. Even if every prompt has similar future performance, one can win because those particular requests happen to favor it. Freezing the winner and evaluating it once on an untouched representative test set separates selection from the evidence used for the final claim.

## Why it matters here

AI product decisions often combine prompt search, human review queues, selective logging, and observational comparisons. Recording how cases and winners entered the analysis prevents a polished headline from silently changing the target population.

## Related terms

- [Hypothesis class](glossary://hypothesis-class)
- [Data leakage](glossary://data-leakage)
- [Confounder](glossary://confounder)
- [Train, validation, and test split](glossary://train-validation-test-split)
