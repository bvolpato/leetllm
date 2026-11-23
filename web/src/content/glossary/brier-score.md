---
title: Brier score
importance: 78
---

The Brier score is the mean squared difference between predicted probabilities and binary outcomes. It rewards probabilities that are both discriminative and numerically close to observed labels. Unlike a hard classification error, it evaluates the confidence of every prediction rather than only whether the score crosses a chosen threshold.

## Formula and interpretation

For predicted event probabilities $p_i$ and observed labels $y_i\in\{0,1\}$, $\operatorname{BS}=n^{-1}\sum_i(p_i-y_i)^2$. Lower is better. A perfect forecast scores zero. The metric combines several properties, including calibration and the ability to separate outcomes, so a lower Brier score alone doesn't reveal whether an improvement came from better probability calibration, improved ranking, or a changed event distribution.

This binary convention ranges from zero to one. Multiclass versions sum squared errors across classes and can use different normalizations; even summing both binary-class errors doubles this value. State the convention when comparing reports.


## Example

Two access-review predictions are 0.9 for a request that truly needs review and 0.2 for a request that doesn't. Their squared probability errors are $(0.9-1)^2=0.01$ and $(0.2-0)^2=0.04$, so the Brier score is 0.025. Predictions of 0.6 and 0.4 make the same thresholded decisions at 0.5 but yield a worse score of $(0.16+0.16)/2=0.16$ because their probability estimates are less confident in the observed outcomes.

## Why it matters here

Model-monitoring and classifier lessons distinguish ranking, threshold cost, and probability quality. The Brier score complements reliability diagrams and expected calibration error while preserving a proper scoring objective on a mature, representative held-out cohort.

## Related terms

- [Expected calibration error](glossary://expected-calibration-error)
- [Calibration](glossary://calibration)
- [Mean squared error](glossary://mean-squared-error)
