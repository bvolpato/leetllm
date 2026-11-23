---
title: R-squared
importance: 83
---

R-squared, or the coefficient of determination, compares a regression model's squared prediction error against a constant baseline that predicts the evaluation target's mean. It describes how much of the target's observed variation the model explains relative to that baseline on the evaluated rows. A high training value describes fit on those rows; use held-out evaluation to assess future accuracy and causal methods to assess causal understanding.

## Formula and negative scores

$R^2=1-\sum_i(y_i-\hat y_i)^2/\sum_i(y_i-\bar y)^2$. The numerator is model squared error; the denominator is baseline squared error. A score of one indicates perfect predictions on those rows, zero matches the constant-mean baseline, and a negative score means the model performed worse than that baseline. A constant evaluation target makes the denominator zero and requires an explicit library or reporting policy.

## Example

A latency model has mean squared error 2.8 on five replay requests, while predicting their average latency gives mean squared error 802.8. Because both are evaluated on the same rows, $R^2=1-2.8/802.8\approx0.9965$. That means the line explains approximately 99.65% of variation in that sample. If a later evaluation gives model MSE 900 and baseline MSE 600, $R^2=-0.5$: the model is worse than predicting the evaluation-set average.

## Why it matters here

The regression lesson uses R-squared to connect a fitted model to a concrete baseline rather than treating small loss as self-explanatory. Production reporting still requires held-out data, residual slices, target units, and comparison against a baseline available at prediction time.

## Related terms

- [Linear regression](glossary://linear-regression)
- [Mean squared error](glossary://mean-squared-error)
- [Variance](glossary://variance)
