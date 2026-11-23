---
title: Prediction interval
importance: 80
---
A **prediction interval** is a range $[L, U]$ built from observed data so that a *new* observation falls inside that range with a stated long-run frequency (coverage), under the procedure's assumptions. It answers "where might the next value land?" rather than "how well have we pinned down a parameter?"

Formally, for a future response $Y_{\text{new}}$ (or forecast target $y_{t+h}$) and a level $1-\alpha$ procedure that returns $(L, U)$ from past data,

$$
P\big(L \le Y_{\text{new}} \le U\big) \approx 1 - \alpha
$$

when the method is applied repeatedly under its model (or, for conformal methods, under exchangeability). An $80\%$ interval should cover about eight of ten comparable future points if coverage is honest. This claim concerns *individual outcomes* and complements uncertainty about the mean of many outcomes.

## Intuition

A point forecast of $132$ hides whether $128$ and $140$ are both routine. An $80\%$ prediction interval of roughly $[117, 147]$ claims that comparable future counts should fall inside that band about $80\%$ of the time when the interval is well calibrated. Noisy series need wider bands; sharp, well-modeled series can afford narrower ones.

The classic contrast is with a [confidence interval](glossary://confidence-interval). Under a correctly specified, identifiable model, a confidence interval for a mean (or for $E[Y \mid x]$) shrinks as sample size grows. A prediction interval must still leave room for nonzero residual noise around that mean, so it does **not** collapse to a single value as $n \to \infty$. The qualification matters: a deterministic outcome has no irreducible noise. Using a mean confidence band as a prediction band otherwise understates variation in a single future observation.

Dice example: after many rolls the confidence interval for the expected face value sits near $3.5$ and tightens. The prediction interval for the *next* roll still spans roughly $\{1,\ldots,6\}$.

## Formula

**One independent future draw from the same normal population** with sample mean $\bar{x}$ and unbiased sample variance $s^2$ ($n\ge2$ i.i.d. observations, both mean and variance unknown), as in the [NIST prediction-limits formula](https://www.itl.nist.gov/div898/software/dataplot/refman1/auxillar/predlimi.htm):

$$
\bar{x} \pm t_{1-\alpha/2,\, n-1}\,\sqrt{s^2 + \frac{s^2}{n}}
= \bar{x} \pm t_{1-\alpha/2,\, n-1}\, s\sqrt{1 + \frac{1}{n}}.
$$

The $1$ under the square root is residual noise for the new point; the $1/n$ term is uncertainty in $\bar{x}$. Coverage uses a Student-$t$ critical value, not a fixed $z$, because $\sigma$ is estimated.

**Simple linear regression.** For $y_i = b_0 + b_1 x_i + \varepsilon_i$ with i.i.d. $\varepsilon_i \sim N(0,\sigma^2)$, residual standard error $s$, $n>2$, nonconstant training predictors, and a new predictor $x_0$ with an independent error,

$$
\hat{y}_0 \pm t_{1-\alpha/2,\, n-2}\, s
\sqrt{1 + \frac{1}{n} + \frac{(x_0 - \bar{x})^2}{\sum_i (x_i - \bar{x})^2}}.
$$

Again the leading $1$ is irreducible outcome variance. Dropping it yields a confidence interval for the *mean response* $E[Y \mid x_0]$, which is narrower and the wrong tool for "what value will we see?"

**Forecasting (Gaussian residual scale).** After a point forecast $\hat{y}_{t+h|t}$ with estimated $h$-step error scale $\hat{\sigma}_h$,

$$
\hat{y}_{t+h|t} \pm z_{1-\alpha/2}\,\hat{\sigma}_h.
$$

Common normal multipliers (two-sided): $50\% \to 0.67$, $80\% \to 1.28$, $95\% \to 1.96$ (Hyndman & Athanasopoulos). One-step $\hat{\sigma}_1$ is often close to residual standard deviation; multi-step $\hat{\sigma}_h$ usually grows with the [forecast horizon](glossary://forecast-horizon).

**Operational alternatives** when Gaussian residuals are a bad fit:

| Method | Idea |
| --- | --- |
| Empirical residual quantiles | Take quantiles of past [forecast errors](glossary://forecast-error) (or holdout residuals) and add them to $\hat{y}$ |
| Quantile models | Train separate lower/upper quantile predictors (for example pinball loss at $\alpha/2$ and $1-\alpha/2$) |
| Residual bootstrap | Resample residuals, rebuild paths or points, take percentiles of simulated futures |
| Split conformal | Score nonconformity (often $s_i = \|y_i - \hat{f}(x_i)\|$) on a calibration set; set half-width to the order statistic that targets coverage $1-\alpha$ under exchangeability |

Split conformal (sketch): with calibration scores $s_1,\ldots,s_n$ and target miscoverage $\alpha$, take

$$
\hat{q} = \text{$q$-th order statistic of }\{s_i\},\quad
q = \left\lceil (n+1)(1-\alpha)\right\rceil,
$$

then $\mathcal{C}(x) = [\hat{f}(x)-\hat{q},\, \hat{f}(x)+\hat{q}]$ (absolute residual score). Fit $\hat f$ on a separate training set and leave the calibration/test scores exchangeable; reusing calibration labels to tune the predictor can break the guarantee. With that split, marginal coverage is at least $1-\alpha$ without Gaussian errors. This averages over calibration/test draws, not necessarily over each fixed input $x$, customer, or time slice. Absolute-residual scores give **constant-width** bands. If $q=n+1$, use infinite width rather than silently clipping the rank to $n$. See [Angelopoulos and Bates](https://arxiv.org/abs/2107.07511).

Plain split conformal needs **exchangeability** of calibration and test points. Sequential forecast residuals (staffing, time series) often violate that. Temporal conformal or a bootstrap designed for the dependence structure may help, but neither automatically restores coverage. Independently resampling autocorrelated residuals also discards that dependence; check the chosen method's assumptions and coverage by horizon.

## Worked numbers

Staffing residual scale: past one-step forecast errors for Tuesday 10-11am chat volume have sample size $n = 40$, mean near zero, $s = 12$. Point forecast next Tuesday: $\hat{y} = 132$.

Approximate $80\%$ Gaussian band ($z_{0.9} \approx 1.28$), ignoring parameter uncertainty for a rough ops check:

$$
132 \pm 1.28 \times 12 \approx [117,\, 147].
$$

For a separate illustrative i.i.d. normal model in which $132$ is the sample mean of those $40$ comparable observations, the exact normal-population procedure uses $t_{0.9,\,39} \approx 1.30$ and $s\sqrt{1+1/n}$:

$$
132 \pm 1.30 \times 12 \times \sqrt{1 + 1/40} \approx 132 \pm 15.8 \approx [116,\, 148].
$$

The $1/n$ term belongs to estimating that sample mean; it is not a universal correction for any forecast model with $40$ residuals. A mean-only confidence band's *standard error* would be $s/\sqrt n\approx1.9$, before multiplying by its critical value, and is too tight for predicting a new outcome.

```python
import math

yhat, s, n = 132.0, 12.0, 40
z_80 = 1.28  # approximate critical value for the sample-mean example
half = z_80 * s * math.sqrt(1 + 1 / n)
print(yhat - half, yhat + half)  # ~116.4, 147.6
```

## Example

Staffing for chat volume: forecast $132$ conversations next Tuesday 10-11am with an $80\%$ prediction interval $[117, 147]$. Planning only for $132$ under-staffs when the upper tail hits. Backtest over $100$ similar hours: about $80$ of the observed counts should land inside their *pre-declared* intervals if coverage is honest.

What fails in production:

- **Nominal $95\%$, realized $75\%$.** Residual scale was fit in-sample, model form was treated as known, or multi-step error growth was ignored. Nominal intervals that skip model-selection and parameter uncertainty are systematically too narrow (a known forecasting failure mode).
- **Coverage collapses on slices.** Weekends, holidays, product launches, and region cutovers often undercover while the global average still looks fine. Report coverage and width by slice as well as pooled.
- **Width without use.** Full coverage with absurdly wide intervals is operationally useless (always staff for infinity). Choose the level using under-capacity and over-capacity costs. For staffing against a high-demand tail, a one-sided upper prediction bound may match the decision better than a two-sided $80\%$ band; the latter still permits about $10\%$ above its upper endpoint under a correctly calibrated equal-tail model.
- **Horizon mismatch.** An interval tuned for $h=1$ is not valid for $h=7$. Score and monitor by horizon.

```python
# Empirical coverage on a holdout of (lower, upper, y_true)
def coverage(rows: list[tuple[float, float, float]]) -> float:
    if not rows:
        raise ValueError("coverage needs at least one observed outcome")
    return sum(lo <= y <= hi for lo, hi, y in rows) / len(rows)

holdout = [(117, 147, 140), (117, 147, 155), (100, 130, 122)]
print(coverage(holdout))  # 2/3 on this toy set
```

## How it works

1. **Declare the target.** One future observation at a given $x$, or $y_{t+h}$ at a fixed origin and horizon. Do not mix horizons in one coverage number.
2. **Fit a point predictor** on data available at the origin only (no leakage from the future you claim to predict).
3. **Estimate predictive spread.** Residual sd, multi-step error formula, quantile heads, bootstrap paths, or conformal scores on a held-out calibration set.
4. **Emit $(L, U)$ at a fixed nominal level** before seeing $y$. Log the interval with the forecast version and features.
5. **Backtest with honest cutoffs** ([rolling-origin evaluation](glossary://rolling-origin-evaluation)). Measure coverage and median width by horizon and slice. Prefer methods that hit coverage with useful width over pretty Gaussian formulas that undercover live.

## Why it matters here

LLM and ML products constantly forecast quantities people staff and alert on: request volume, token usage, queue depth, latency tails, moderation volume, retrieval hit rates, and cost. Point forecasts hide uncertainty. Prediction intervals show how wide future variation can be, which capacity planning, autoscaling buffers, and anomaly logic need. If live outcomes routinely leave the band, evaluate the uncertainty layer alongside the point model. Pair intervals with forecast-error monitoring and recalibrate after [data drift](glossary://data-drift); coverage is a contract you re-verify over time.

## Related terms

- [Confidence interval](glossary://confidence-interval)
- [Forecast error](glossary://forecast-error)
- [Forecast horizon](glossary://forecast-horizon)
- [Rolling-origin evaluation](glossary://rolling-origin-evaluation)
- [Bootstrap resampling](glossary://bootstrap-resampling)
