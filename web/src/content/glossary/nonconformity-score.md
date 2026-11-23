---
title: Nonconformity score
importance: 79
---
A nonconformity score measures how unusual an observed outcome looks relative to a model's prediction. Conformal prediction computes these scores on held-out calibration examples, then chooses a threshold that determines which outcomes belong in a prediction interval or label set. Larger scores usually mean the observed outcome fits the prediction less well.

## The score determines the shape of uncertainty

For regression, a common score is $s(x,y)=|y-\widehat y(x)|$. For classification, a simple score is $1-\widehat p_y(x)$, where $\widehat p_y(x)$ is the model's probability assigned to the observed class. These choices create different uncertainty objects. A poorly chosen score can produce technically valid but very wide or practically unhelpful sets, while a model trained on calibration data can invalidate the held-out rank argument.

For ordinary split conformal prediction with $n$ calibration scores and target coverage $1-\alpha$, use the order statistic at rank $\lceil(n+1)(1-\alpha)\rceil$, treating a rank beyond $n$ as an infinite threshold. Include candidate outcomes whose scores do not exceed it. The usual guarantee describes marginal coverage across exchangeable calibration and future examples; individual inputs and subgroups need separate assumptions and analysis.

## Example

A latency model predicts `[38, 41, 33]` milliseconds for three calibration requests whose actual values are `[40, 47, 30]`. The absolute-residual nonconformity scores are `[2, 6, 3]`. Sorting gives `[2, 3, 6]`. If the chosen conformal rank selects 6, a new prediction of 50 milliseconds produces the interval `[44, 56]`. If latency variability grows with prompt length, normalized residual scores may yield more useful adaptive intervals than one constant radius.

## Why it matters here

Researchers need to choose uncertainty scores that match deployment decisions, inspect subgroup failures, and preserve calibration-set isolation. Valid-looking formulas cannot rescue a score that hides the relevant error mode.

## Related terms

- [Conformal prediction](glossary://conformal-prediction)
- [Prediction interval](glossary://prediction-interval)
- [Probability calibration](glossary://probability-calibration)
