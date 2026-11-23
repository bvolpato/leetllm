---
title: Random forest
importance: 88
---

A random forest is an ensemble of decision trees trained with deliberate randomness and combined by averaging predictions. Classical forests build trees from bootstrap samples of the training rows and consider random feature subsets at splits. The goal is to reduce instability from any individual tree while retaining the ability to model nonlinear relationships and feature interactions.

## Averaging and out-of-bag rows

For classification, a forest commonly averages each tree's estimated class probabilities; for regression, it averages numeric predictions. Bootstrap sampling draws training rows with replacement, so each tree typically omits some examples. Those out-of-bag rows can provide an internal performance estimate, but small datasets produce noisy estimates and time-dependent data still needs chronology-respecting evaluation. Correlated trees do less to reduce variance than meaningfully different trees.

## Example

Three trees score the same access request as 0.00, 1.00, and 0.00. Their average review score is $(0+1+0)/3\approx0.33$. Two trees omitted that request from their bootstrap samples; the remaining tree learned a different local partition. The result is an ensemble probability estimate. Assess calibration separately, and remember that majority vote is one possible aggregation rule.

## Why it matters here

Forests provide strong tabular baselines and clarify the difference between independent averaging and sequential boosting. Production comparisons need frozen feature contracts, held-out slices, reviewer-cost thresholds, and monitoring. Use internal training scores to diagnose fit and held-out results to compare candidate systems.

## Related terms

- [Decision tree](glossary://decision-tree)
- [Gradient boosting](glossary://gradient-boosting)
- [Calibration](glossary://calibration)
