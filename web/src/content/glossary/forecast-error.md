---
title: Forecast error
importance: 80
---
**Forecast error** is the later observed value minus the forecast that was issued *before* that outcome was known. In forecasting literature, "error" is the signed gap between what happened and a point forecast made with only information available at the forecast origin. That gap can include irreducible noise *and* model misspecification. Signed error keeps direction (under- vs over-forecast). Absolute error summarizes magnitude; interval coverage asks whether outcomes fell inside a declared band.

## Formula

For an observation $y_{t+h}$ and a forecast $\hat{y}_{t+h|t}$ made at time $t$ for horizon $h$:

$$
e_{t+h} = y_{t+h} - \hat{y}_{t+h|t}
$$

Positive $e$ means reality came in above the prediction (underforecast). Negative $e$ means the forecast overshot. The same convention appears throughout Hyndman & Athanasopoulos (*Forecasting: Principles and Practice*): accuracy summaries are built from these signed differences, then aggregated (MAE, RMSE, MAPE, MASE, and so on).

## Forecast error vs residual

Two related quantities get casually called "residuals," but they answer different questions:

| Quantity | Data | Horizon | Question |
| --- | --- | --- | --- |
| **Residual** | Training / in-sample | Usually one-step fitted values | Does the model fit history it already saw? |
| **Forecast error** | Test / holdout / live future | One-step or multi-step | Did the model predict data unavailable at forecast time? |

Hyndman & Athanasopoulos mark two practical differences: residuals are computed on the training set; forecast errors are computed on data held out of fitting. Residuals are typically one-step; forecast errors may be multi-step ($h > 1$). A model can fit training residuals tightly and still produce large out-of-sample forecast errors. Store the production quantity under its real name (`forecast_error`), even if ops chat says "residual alert."

## Example

A weekly-lag baseline predicts Friday batch-job volume as last Friday's count: $\hat{y} = 132$. Friday's observed count is $y = 160$. The forecast error is

$$
e = 160 - 132 = +28
$$

If Friday's volume was unknown when the forecast was issued, the $+28$ difference is forecast error. If you re-fit a model after seeing Friday and compare its fitted value with $160$, the difference is a residual.

Same series, different forecast: if the model had predicted $180$, the error would be $160 - 180 = -20$ (overforecast by 20 jobs). Sign flips change capacity decisions: underforecast risks queue backlog; overforecast wastes reserved capacity.

```python
actual, forecast = 160, 132
forecast_error = actual - forecast  # +28
abs_error = abs(forecast_error)     # 28
# Flag unusual misses against a pre-declared band, not against training residuals alone
band = 25  # e.g. empirical p95 of earlier |one-day errors|
needs_review = abs_error > band  # True: 28 exceeds the historical band
```

## How to read a stream of errors

One $e$ is an event. A sequence of errors is evidence:

- **Bias:** mean signed error near zero means roughly unbiased; a steady positive mean means systematic underprediction.
- **Scale:** MAE or RMSE summarizes magnitude (see [mean absolute error](glossary://mean-absolute-error)); RMSE weights large misses more.
- **Horizon:** error usually grows with $h$. Report one-day and seven-day errors separately, not one pooled number.
- **Slice:** weekday, launch weeks, region, and product tier often dominate average accuracy.
- **Cost asymmetry:** if stockouts cost more than overstock, a $+28$ and a $-28$ are not interchangeable even when $|e|$ matches.

Use forecast errors for backtests, model selection, and live monitoring. Use them as inputs to [prediction intervals](glossary://prediction-interval) and anomaly bands (for example empirical quantiles of past absolute forecast errors), not as a root-cause label.


## Why it matters here

Forecasting lessons in this curriculum turn point predictions into reviewable ops artifacts: versioned forecasts, signed errors, interval coverage, and alerts when misses exceed a calibrated band. Forecasting is a time-indexed product problem. Evaluate forecasts against outcomes that were still in the future at prediction time; training loss and in-sample residuals measure different quantities. [Rolling-origin evaluation](glossary://rolling-origin-evaluation) repeats that check across cutoffs so one lucky week cannot greenlight a weak model.

## Related terms

- [Forecast horizon](glossary://forecast-horizon)
- [Mean absolute error](glossary://mean-absolute-error)
- [Prediction interval](glossary://prediction-interval)
- [Rolling-origin evaluation](glossary://rolling-origin-evaluation)
- [Seasonal naive forecast](glossary://seasonal-naive-forecast)
