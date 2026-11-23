---
title: Root mean squared error
importance: 84
---

Root mean squared error (RMSE) is the square root of average squared prediction error. It measures the typical magnitude of numeric prediction mistakes in the original target units while preserving squared error's sensitivity to large residuals. Lower RMSE indicates better predictions on that evaluation set; use held-out future examples to assess later traffic performance.

## Formula and interpretation

$\operatorname{RMSE}=\sqrt{n^{-1}\sum_{i=1}^{n}(y_i-\hat y_i)^2}$. If delivery duration is measured in minutes, RMSE is also measured in minutes. RMSE is at least the mean absolute error on the same rows, with equality when every absolute residual has identical magnitude. The difference between the two summaries helps reveal whether a small number of large misses dominates overall quality.

## Example

Forecast errors of 0, 0, and 6 minutes give mean absolute error of 2 minutes. Their MSE is $(0+0+36)/3=12$ squared minutes, so RMSE is $\sqrt{12}\approx3.46$ minutes. The larger RMSE reflects concentration in one severe miss. For a latency service, separately report tail percentiles and operational consequences because both aggregates hide which requests were affected.

## Why it matters here

Forecasting and regression chapters compare models against simple baselines and inspect realistic slices. RMSE makes squared-loss behavior interpretable to engineers while reminding them to preserve units, hold out future examples, and diagnose occasional severe errors.

## Related terms

- [Mean squared error](glossary://mean-squared-error)
- [Mean absolute error](glossary://mean-absolute-error)
- [Prediction interval](glossary://prediction-interval)
