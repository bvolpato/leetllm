---
{
  "id": "forecasting-anomaly-detection",
  "title": "Forecasting and Anomaly Detection",
  "slug": "forecasting-anomaly-detection",
  "section": "Production ML Systems",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Medium",
  "order": 5,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": ["Google", "OpenAI", "Datadog", "Netflix"],
  "shortDescription": "Forecast time-ordered demand without leakage, calibrate prediction intervals with pinball loss and conformal methods, and turn forecast errors into high-signal alerts.",
  "keyConceptsTested": ["time series decomposition", "seasonal naive forecast", "rolling origin validation", "MAE", "pinball loss", "prediction interval", "anomaly alert"]
}
---

On Thursday evening, your forecaster predicts 132 outbound batch jobs for Friday. When Friday closes, the counter reads 160. Is that 28-job jump a real capacity surge, a planned model launch, or a broken telemetry pipeline double-counting events?

In [Ranking and Recommendation Systems](/learn/ranking-recommendation-systems), ordering items for a user was the core problem. Here the axis that matters is **time**. Forecasting predicts tomorrow's volume strictly from what is known today; <span data-glossary="anomaly">anomaly</span> detection asks the follow-up question once actuals arrive: is a 28-job miss ordinary noise or something worth investigating?

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="The upper chart compares same-weekday forecasts and observed batch jobs from January 26 through February 1. The lower chart aligns each actual-minus-forecast error to its weekday on a scale from minus five to plus 32 jobs. Six errors sit within the earlier empirical plus-or-minus-three-job half-width; Friday's plus-28 error sits outside." />
  <figcaption>Same-weekday forecasts versus observed daily batch jobs across the holdout week. Six days sit inside the empirical <code>±3</code>-job error band; Friday's <code>+28</code> jump stands cleanly outside it.</figcaption>
</figure>

## Start with an ordered batch-job series

A **time series** is a sequence of measurements ordered by time. Two definitions prevent most forecasting bugs before you write any model:

- **Forecast origin:** The exact cutoff when a forecast is issued (here, each evening after today's final count lands).
- **<span data-glossary="forecast-horizon">Forecast horizon</span>:** How many steps ahead you predict (1 day ahead vs 7 days ahead are distinct tasks).

Let's construct a four-week daily batch-job series (28 consecutive days starting January 5) with a clear weekday pattern and a planned launch spike on the final Friday (January 30). Notice there are no missing dates, so shifting back 7 rows genuinely means shifting back 7 days:

<!-- leetllm: test, output=show, deps=numpy, id=forecast-lab -->
```python title="build-batch-job-series.py"
from datetime import date, timedelta
from math import ceil
import numpy as np

start = date(2025, 1, 5)
weekly_pattern = np.array([100, 112, 115, 118, 132, 82, 76])
weekly_noise = np.array([
    [0,  0, 0,  0,  0, 0, 0],
    [2, -2, 3, -2,  2, 2, 2],
    [4, -2, 4, -2,  0, 1, 2],
    [3,  1, 2, -1, 28, 2, 1],
])
volumes = (weekly_pattern + weekly_noise).ravel().astype(float)
dates = [start + timedelta(days=i) for i in range(len(volumes))]
launch_flags = np.array([i == 25 for i in range(len(volumes))])

print(f"days={len(volumes)} | range={dates[0]} to {dates[-1]} | launch_day={dates[25]} (volume={int(volumes[25])})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
days=28 | range=2025-01-05 to 2025-02-01 | launch_day=2025-01-30 (volume=160)
```
<!-- leetllm: output:end -->

## Decompose metrics into trend, seasonality, and exogenous events

Before choosing a model family, decompose what drives variation in $y_t$. An **additive decomposition** expresses a series as four pieces:[^hyndman2021fpp3]

$$
y_t = T_t + S_t + X_t + \epsilon_t
$$

- **Trend ($T_t$):** Slow multi-week or multi-month drift in baseline demand.
- **Seasonality ($S_t$):** Repeating calendar patterns (weekday vs weekend, hour of day, month-end).
- **Exogenous covariates ($X_t$):** Known external drivers such as planned launches, holidays, or marketing campaigns.
- **Remainder ($\epsilon_t$):** Unexplained variation, shocks, and noise.

Use an additive model when seasonal swings stay roughly constant in raw units (for instance, weekends always drop by ~40 jobs). When seasonal swings scale proportionally with overall volume (weekends always drop by 35%), switch to a **multiplicative decomposition**:

$$
y_t = T_t \times S_t \times R_t
$$

Taking $\log(y_t)$ on strictly positive series converts products back into sums and stabilizes proportional variance. (When exponentiating log-scale predictions back to original units, apply a bias correction if you need the mean rather than the median.)

## Keep future rows out of training

Random train/test splits break forecasting completely. If a training fold contains January 31 while evaluating January 6, the model already sees future demand levels and seasonal shocks. Always split chronologically using an expanding or sliding window such as scikit-learn's `TimeSeriesSplit`:[^hyndman2021fpp3]

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=forecast-lab, id=split-audit -->
```python title="audit-time-splits.py"
from sklearn.model_selection import TimeSeriesSplit

interleaved_train, interleaved_test = np.arange(0, len(volumes), 2), np.arange(1, len(volumes), 2)
*_, (time_train, time_test) = TimeSeriesSplit(n_splits=3, test_size=7).split(volumes)

for name, tr, te in (("interleaved", interleaved_train, interleaved_test), ("time-aware", time_train, time_test)):
    print(f"{name:11s}: latest_train={dates[int(tr.max())]} | earliest_test={dates[int(te.min())]} | leak={bool(tr.max() >= te.min())}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
interleaved: latest_train=2025-01-31 | earliest_test=2025-01-06 | leak=True
time-aware : latest_train=2025-01-25 | earliest_test=2025-01-26 | leak=False
```
<!-- leetllm: output:end -->

```checkpoint
Why is a random train/test split invalid even when every row comes from the same cluster?
---
Shuffling ignores time order, letting the model learn from future demand shifts and events before predicting earlier dates. Forecasting must always train strictly on past origins and evaluate on later horizons.
```

## Set a same-weekday baseline

On Sunday evening (day 20), today's volume was `78` jobs, while last Monday ran `104` jobs. Tomorrow (Monday) will run `103` jobs. Copying yesterday's count (**naive lag-1**) predicts `78` and misses by `+25` because of the weekend dip. Copying last Monday (**<span data-glossary="seasonal-naive-forecast">seasonal naive</span> lag-7**) respects weekly <span data-glossary="seasonality">seasonality</span> and misses by just `-1`.[^hyndman2021fpp3]

Every fancy forecasting model must beat seasonal naive on out-of-sample windows before earning its complexity. Let's compute the 1-day-ahead seasonal naive forecast across the final holdout week (days 21 to 27) and also verify our forecast-origin guard when issuing a multi-step forecast from a frozen Sunday origin:

<!-- leetllm: test, output=show, deps=numpy, continue=split-audit, id=seasonal-forecast -->
```python title="forecast-with-weekly-lag.py"
holdout = np.arange(21, 28)

def weekly_lag(target_idx, origin_idx=None):
    origin_idx = target_idx - 1 if origin_idx is None else origin_idx
    src = target_idx - 7
    if not (0 <= src <= origin_idx < target_idx):
        raise ValueError("Source observation is not yet available at forecast origin")
    return float(volumes[src])

forecasts = np.array([weekly_lag(int(i)) for i in holdout])
actuals = volumes[holdout]
holdout_errors = actuals - forecasts

for i, f, a, e in zip(holdout, forecasts, actuals, holdout_errors):
    print(f"day {i:2d} ({dates[int(i)]}): forecast={int(f):3d} actual={int(a):3d} error={int(e):+3d}")

# Multi-step check from frozen Sunday origin (day 20): horizon 7 is valid; horizon 8 leaks day 21!
print("frozen origin day 20 -> horizon 7 forecast:", int(weekly_lag(27, origin_idx=20)))
try:
    weekly_lag(28, origin_idx=20)
except ValueError as err:
    print("frozen origin day 20 -> horizon 8 blocked:", err)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
day 21 (2025-01-26): forecast=104 actual=103 error= -1
day 22 (2025-01-27): forecast=110 actual=113 error= +3
day 23 (2025-01-28): forecast=119 actual=117 error= -2
day 24 (2025-01-29): forecast=116 actual=117 error= +1
day 25 (2025-01-30): forecast=132 actual=160 error=+28
day 26 (2025-01-31): forecast= 83 actual= 84 error= +1
day 27 (2025-02-01): forecast= 78 actual= 77 error= -1
frozen origin day 20 -> horizon 7 forecast: 78
frozen origin day 20 -> horizon 8 blocked: Source observation is not yet available at forecast origin
```
<!-- leetllm: output:end -->

Notice how cleanly the seasonal lag handles Saturday too: a naive lag-1 baseline would copy Friday's `160` launch spike into Saturday and miss by `-76`, whereas seasonal naive copies last Saturday (`83`) and misses by `+1`.

```checkpoint
Why does seasonal naive beat lag-1 naive on Monday morning?
---
Lag-1 copies Sunday's weekend lull (78) into Monday, missing by +25 jobs. Seasonal naive copies last Monday's weekday volume (104), missing by just -1 job.
```

## Compare classical SARIMAX, gradient-boosted trees, and foundation models

When you need covariates (like known launch calendars), cross-series pooling, or nonlinear interactions, three model families dominate modern forecasting:

### 1. Classical SARIMAX

**SARIMAX** couples linear regression on exogenous features $x_t$ with seasonal autoregressive and moving-average error dynamics:[^statsmodels2026sarimax]

$$
y_t = \beta^\top x_t + u_t, \qquad \Phi_P(B^s)\phi_p(B)(1 - B)^d(1 - B^s)^D u_t = \Theta_Q(B^s)\theta_q(B)\epsilon_t
$$

where $B$ is the backshift operator ($B u_t = u_{t-1}$) and $s$ is the seasonal period. SARIMAX shines on single, clean series with strong linear calendar structure and compact parameter counts, though fitting independent models per series scales poorly across tens of thousands of entities without pooling.

### 2. Gradient-boosted trees with lag features

LightGBM and XGBoost turn forecasting into tabular regression using origin-safe features: autoregressive lags ($t-1, t-7, t-14$), rolling window statistics ending at $t-1$, cyclical calendar encodings ($\sin/\cos$ of weekday and hour), and entity metadata.[^ke2017lightgbm][^chen2016xgboost] One **global tree model** can pool patterns across thousands of series at once. For multi-step horizons $T + 1, \dots, T + H$, choose between **recursive** forecasting (feeding predictions back as lags, which can compound errors) and **direct** forecasting (training per-horizon or multi-output models directly from origin features).

### 3. Time-series Transformers and foundation models

Feeding one timestamp per Transformer token creates an $O(L^2)$ attention cost in lookback length $L$. Modern architectures cut that cost via **patching** and support zero-shot or multivariate forecasting:

- **PatchTST:** Groups consecutive timesteps into patches of length $P$ with stride $S$ (producing $N = \lfloor (L - P)/S \rfloor + 2$ padded tokens per channel), shrinking attention-map entries quadratically while sharing weights across channels.[^nie2023patchtst]
- **Chronos & Chronos-2:** Early Chronos models mean-scaled series into uniform bins and modeled them with T5 token cross-entropy;[^ansari2024chronos] Chronos-2 moves to continuous patch embeddings with alternating time/group attention and multivariate covariate support.[^amazon2025chronos2]
- **TimesFM:** Pretrained foundation models such as TimesFM-3 use patched temporal and variate attention to forecast quantiles (such as P10-P90) directly from context and known covariates in zero-shot mode.[^google2026timesfm3]

Verify the PatchTST token reduction directly on a 336-step lookback (two weeks of hourly data):

<!-- leetllm: test, output=show, deps=numpy, continue=seasonal-forecast, id=patch-count -->
```python title="count-patched-attention-tokens.py"
L, P, S = 336, 16, 8
n_patches = int(np.floor((L - P) / S) + 2)  # +1 base + 1 end-padding patch
print(f"tokens: {L} -> {n_patches} | attention-map entry reduction: {L**2 / n_patches**2:.1f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tokens: 336 -> 42 | attention-map entry reduction: 64.0x
```
<!-- leetllm: output:end -->

Patching shrinks the attention matrix by $64\times$ in entry count, making long lookbacks tractable. Still, always benchmark pretrained foundation models against seasonal naive and global GBDTs on your own rolling backtests and check interval calibration.

## Measure forecast error in batch jobs

Averaging signed <span data-glossary="forecast-error">forecast errors</span> (`[-1, +3, -2, +1, +28, +1, -1]`) measures **bias** (`+4.1` jobs), because positive and negative mistakes cancel. To measure typical error magnitude in the original business units, use **<span data-glossary="mean-absolute-error">Mean Absolute Error (MAE)</span>**:[^hyndman2021fpp3]

$$
\text{MAE} = \frac{1}{n}\sum_{t=1}^{n} |y_t - \hat{y}_t|
$$

Always report overall MAE alongside a predeclared normal-day slice (excluding planned launch events) so one known spike never hides weekday precision:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=patch-count, id=holdout-mae -->
```python title="measure-holdout-mae.py"
from sklearn.metrics import mean_absolute_error

normal_mask = ~launch_flags[holdout]
naive_preds = volumes[holdout - 1]

print(f"seasonal naive overall MAE:    {mean_absolute_error(actuals, forecasts):.1f} jobs")
print(f"seasonal naive normal-day MAE: {mean_absolute_error(actuals[normal_mask], forecasts[normal_mask]):.1f} jobs")
print(f"lag-1 naive overall MAE:       {mean_absolute_error(actuals, naive_preds):.1f} jobs")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
seasonal naive overall MAE:    5.3 jobs
seasonal naive normal-day MAE: 1.5 jobs
lag-1 naive overall MAE:       23.6 jobs
```
<!-- leetllm: output:end -->

Seasonal naive cuts MAE from `23.6` jobs down to `5.3` overall and just `1.5` on normal weekdays.

## Backtest more than one future window

One lucky holdout week proves little. **<span data-glossary="rolling-origin-evaluation">Rolling-origin evaluation</span>** slides the forecast origin forward across multiple non-overlapping windows so you see how error behaves in calm weeks versus shock weeks:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=holdout-mae, id=rolling-origin -->
```python title="run-rolling-origin-backtest.py"
for start_idx in (14, 21):
    idx = np.arange(start_idx, start_idx + 7)
    preds = np.array([weekly_lag(int(i), origin_idx=int(i) - 1) for i in idx])
    mae = mean_absolute_error(volumes[idx], preds)
    print(f"window {dates[start_idx]} to {dates[start_idx+6]}: MAE={mae:.1f} jobs")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
window 2025-01-19 to 2025-01-25: MAE=0.9 jobs
window 2025-01-26 to 2025-02-01: MAE=5.3 jobs
```
<!-- leetllm: output:end -->

Keep fold-by-fold metrics visible instead of hiding regime shifts inside a single average, and match your target unit to the real capacity bottleneck (raw job count only tracks <span data-glossary="gpu">GPU</span> demand when job sizes are comparable; otherwise forecast GPU-hours directly).

## Distinguish forecast errors from residuals

Keep two easily confused quantities separate:[^hyndman2021fpp3]

| Quantity | Computed on | What it measures |
| --- | --- | --- |
| **Residual** | Training rows after fitting | In-sample fit on known history |
| **Forecast error** | Unseen future rows after origin | Genuine out-of-sample predictive accuracy |

<figure>
  <img src="illustrations/_generated/issuance_timeline_dark.png" alt="A January timeline marks the Jan12–25 calibration window with 14 earlier errors and a p95 half-width of 3 jobs. A Jan23 Friday count of 132 anchors the Jan29 forecast for Jan30. The Jan30 observed count is 160, an error of plus 28 jobs beyond the review threshold." />
  <figcaption>Fourteen earlier one-day forecast errors (Jan 12-25) calibrate a <code>±3</code>-job review band. On Jan 30, observed volume (160) minus forecast (132) yields a <code>+28</code> forecast error well outside the band.</figcaption>
</figure>

Always calibrate anomaly thresholds on **out-of-sample forecast errors**, never in-sample training residuals, which underestimate true future uncertainty.

## Quantify uncertainty with pinball loss and conformal intervals

A single point forecast (`132` jobs) leaves capacity planners blind to tail risk. Predicting quantiles (P10, P50, P90) or **<span data-glossary="prediction-interval">prediction intervals</span>** communicates uncertainty directly.

### Quantile regression with pinball loss

To train a model for quantile $q \in (0, 1)$ without Gaussian assumptions, minimize the asymmetric **pinball loss**:

$$
\mathcal{L}_q(y, \hat{y}_q) = \max\left(q(y - \hat{y}_q),\; (1 - q)(\hat{y}_q - y)\right)
$$

At $q = 0.90$, underforecasting by 10 jobs costs `0.9 * 10 = 9.0`, whereas overforecasting by 10 jobs costs only `0.1 * 10 = 1.0`. Watch how mean demand (`19`) differs from P90 on a skewed distribution (nine days at `10`, one spike at `100`):

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=rolling-origin, id=pinball-score -->
```python title="compare-mean-and-quantile-targets.py"
from sklearn.metrics import mean_pinball_loss

demand = np.array([10.0] * 9 + [100.0])
print(f"mean={demand.mean():.1f} | fraction > mean={(demand > demand.mean()).mean():.1f}")
print(f"P90 loss: under by 10 -> {mean_pinball_loss([20], [10], alpha=0.9):.1f} | over by 10 -> {mean_pinball_loss([10], [20], alpha=0.9):.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mean=19.0 | fraction > mean=0.1
P90 loss: under by 10 -> 9.0 | over by 10 -> 1.0
```
<!-- leetllm: output:end -->

### Split conformal intervals and time-series non-exchangeability

Given $n$ held-out <span data-glossary="calibration">calibration</span> absolute errors $s_i = |y_i - \hat{y}_i|$, **split conformal prediction** sets the interval half-width $\hat{q}$ for target coverage $1 - \alpha$ to the finite-sample order statistic:[^angelopoulos2021conformal][^lei2018conformalRegression]

$$
k = \lceil (n + 1)(1 - \alpha) \rceil, \qquad \hat{q} = \begin{cases} s_{(k)} & k \le n \\ \infty & k = n + 1 \end{cases}
$$

Under exchangeable data, $P(Y_{\text{new}} \in [\hat{y} - \hat{q}, \hat{y} + \hat{q}]) \ge 1 - \alpha$ holds in finite samples without any distributional assumptions. Time series break exchangeability through autocorrelation and drift,[^barber2022exchangeability] so production forecasters adapt conformal bands using either **rolling calibration windows** or **Adaptive Conformal Inference (ACI)**, which adjusts the working miscoverage level $\alpha_t$ after each realized outcome:[^gibbs2021aci]

$$
\alpha_{t+1} = \alpha_t + \gamma\left(\alpha - \mathbf{1}\{Y_t \notin I_t\}\right)
$$

Whenever an observation misses the band, $\alpha_t$ drops (widening future intervals); when outcomes stay inside, $\alpha_t$ edges back up (tightening intervals). See [Conformal Prediction and Uncertainty](/learn/conformal-prediction-uncertainty-sets) for the full derivation.

## Calibrate an error band from earlier days

Let's calibrate an empirical 95% absolute-error band on the 14 earlier days (Jan 12-25, indices `7..20`), compare it with split-conformal rank and a Gaussian approximation, and measure holdout coverage on Jan 26-Feb 1:

<!-- leetllm: test, output=show, deps=numpy, continue=pinball-score, id=error-band -->
```python title="calibrate-empirical-error-band.py"
cal_idx = np.arange(7, 21)
cal_errors = np.array([volumes[i] - weekly_lag(int(i)) for i in cal_idx])
abs_cal = np.sort(np.abs(cal_errors))

target_cov = 0.95
emp_rank = ceil(target_cov * len(abs_cal))
error_band = int(abs_cal[emp_rank - 1])
conf_rank = ceil(target_cov * (len(abs_cal) + 1))
conf_band = float(abs_cal[conf_rank - 1]) if conf_rank <= len(abs_cal) else float("inf")
rms_half_width = 1.96 * float(np.sqrt(np.mean(cal_errors**2)))

cal_cov = float(np.mean(np.abs(cal_errors) <= error_band))
holdout_cov = float(np.mean(np.abs(holdout_errors) <= error_band))

print(f"empirical p95 band (rank {emp_rank}/14): ±{error_band} jobs | RMS 95% approx: ±{rms_half_width:.1f} jobs")
print(f"split-conformal rank {conf_rank}/14 -> band={conf_band} (max-of-14 coverage <= {14/15:.3f})")
print(f"calibration coverage={cal_cov:.3f} | holdout coverage={holdout_cov:.3f} (6/7 days)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
empirical p95 band (rank 14/14): ±3 jobs | RMS 95% approx: ±3.4 jobs
split-conformal rank 15/14 -> band=inf (max-of-14 coverage <= 0.933)
calibration coverage=1.000 | holdout coverage=0.857 (6/7 days)
```
<!-- leetllm: output:end -->

Notice a crucial math check: with only `14` calibration days, exact 95% split conformal asks for rank $\lceil 15 \times 0.95 \rceil = 15$, which exceeds `14` and returns $\infty$ (you need at least `19` calibration points for a finite 95% conformal band). Even the empirical `±3` band is narrow enough to flag Friday cleanly, yet monitoring 1,000 series daily with a 95% band still produces ~50 normal threshold crossings per day!

```checkpoint
Why does 95% split conformal return an infinite half-width when calibrated on only 14 earlier days?
---
The finite-sample rank is ceil((14 + 1) * 0.95) = 15, which exceeds the 14 available calibration scores. You need at least 19 calibration points so ceil((19 + 1) * 0.95) = 19 lands inside the sample.
```

## Turn an unusual error into a review artifact

When an observation exits the calibrated band, treat it as a **review signal**, not an automatic outage. Friday's `160` jumps outside `[129, 135]`, and because it carries `launch_event = True`, we route it directly to planned-launch capacity review rather than paging on-call for an unknown outage:[^sreMonitoringDistributedSystems]

<!-- leetllm: test, output=show, deps=numpy, continue=error-band, id=alert-record -->
```python title="create-and-route-alert.py"
alerts = []
for pos in np.flatnonzero(np.abs(holdout_errors) > error_band):
    day = int(holdout[pos])
    f, a = int(forecasts[pos]), int(actuals[pos])
    alerts.append({
        "date": str(dates[day]),
        "origin": str(dates[day - 1]),
        "forecast": f, "actual": a, "error": a - f,
        "band": [f - error_band, f + error_band],
        "launch_event": bool(launch_flags[day]),
    })

def route(alert, urgent_impact=False):
    if urgent_impact:
        return "page on-call (actionable capacity impact)"
    return "review planned launch capacity" if alert["launch_event"] else "review unexpected deviation"

for al in alerts:
    print(f"{al['date']} (origin {al['origin']}): actual={al['actual']} vs {al['forecast']} ({al['error']:+d}, band {al['band']}) -> {route(al)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2025-01-30 (origin 2025-01-29): actual=160 vs 132 (+28, band [129, 135]) -> review planned launch capacity
```
<!-- leetllm: output:end -->

> **Key insight:** Page humans only on urgent, actionable user or capacity impact. Route forecast deviations with full context (origin, expected band, and known calendar events) so triage starts with facts rather than guesswork.

## Mitigate alert fatigue with cooldown and multivariate detectors

Single-point threshold alerts break down in two predictable ways at scale: noisy flapping storms and silent multivariate failures.

### Persistence and hysteresis stop alert flapping

Evaluating a noisy stream every minute for 4 hours would fire 240 separate alerts if every breach sent a page. Separate **evaluation** from **alert state** using persistence (require $k$ consecutive breaches to fire), deduplication/cooldown (keep one active incident open), and clean-run resolution (require $m$ consecutive healthy readings to clear, never treating missing telemetry as healthy):[^sreMonitoringDistributedSystems]

<!-- leetllm: test, output=show, deps=numpy, continue=alert-record, id=alert-state -->
```python title="track-persistent-error-alerts.py"
def step_alert(state, err, half_width):
    if err is None:
        state["breaches"] = state["clean"] = 0
        return None
    if abs(err) > half_width:
        state["breaches"], state["clean"] = state["breaches"] + 1, 0
    else:
        state["clean"], state["breaches"] = state["clean"] + 1, 0
    if not state["active"] and state["breaches"] >= 2:
        state["active"] = True
        return "OPEN"
    if state["active"] and state["clean"] >= 2:
        state["active"] = False
        return "CLEAR"
    return None

state = {"active": False, "breaches": 0, "clean": 0}
for minute, err in enumerate([4, 5, None, 4, 2, 4, 0, -1]):
    event = step_alert(state, err, half_width=error_band)
    if event or err is None:
        print(f"t={minute*5:02d}m err={str(err):4s} -> active={state['active']!s:5s} transition={event}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
t=05m err=5    -> active=True  transition=OPEN
t=10m err=None -> active=True  transition=None
t=35m err=-1   -> active=False transition=CLEAR
```
<!-- leetllm: output:end -->

Two consecutive breaches open one alert at `t = 5m`. Missing telemetry at `t = 10m` resets streak counters without clearing the active alert, and the alert clears only after two consecutive in-band observations at `t = 35m`.

### Multivariate anomaly detection

Single-metric bands miss broken *relationships* between correlated metrics. Suppose two standardized metrics normally move together along $x_2 = x_1$. Point `(1, -1)` sits comfortably inside both marginal `[-1, 1]` bounds, yet violates the joint correlation. Conversely, `(5, 5)` violates both marginals while lying right on the PCA subspace (reconstruction error `0.0`):

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=alert-state, id=joint-detector -->
```python title="probe-a-correlation-detector.py"
from sklearn.decomposition import PCA

healthy = np.column_stack([np.linspace(-2.0, 2.0, 9), np.linspace(-2.0, 2.0, 9)])
pca = PCA(n_components=1).fit(healthy)

for pt in ((1.0, -1.0), (5.0, 5.0)):
    v = np.array([pt])
    err = float(np.sum((v - pca.inverse_transform(pca.transform(v))) ** 2))
    in_marginals = all(-1.0 <= x <= 1.0 for x in pt)
    print(f"point {pt}: inside [-1, 1] marginals={in_marginals!s:5s} | PCA recon error={err:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
point (1.0, -1.0): inside [-1, 1] marginals=True  | PCA recon error=2.0
point (5.0, 5.0): inside [-1, 1] marginals=False | PCA recon error=0.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/multivariate_relationship_dark.png" alt="An equal-scale plot shows healthy metric pairs along x2 equals x1 and shades the square where both standardized values fall from minus one to one. Point A at (1, minus 1) passes both individual range checks but projects to (0, 0), with squared reconstruction error 2. Point B at (5, 5) lies outside both ranges on the relationship, with error 0." />
  <figcaption>Marginal checks catch extreme magnitude along the diagonal (Point B), while subspace reconstruction catches broken correlation inside marginal bounds (Point A). Combine joint detectors (PCA, autoencoders, or Isolation Forest) with direct marginal bounds.</figcaption>
</figure>

Pair multivariate methods like **PCA/autoencoder reconstruction** or **Isolation Forest** (which isolates unusual points using random split path lengths) with direct univariate bounds so neither failure mode slips through.[^sklearn2026isolationforest]

## Evaluate alert usefulness separately

Forecast accuracy (MAE) and alert quality measure two different things. Evaluate alerts using **<span data-glossary="precision-recall">alert precision and recall</span>** on labeled periods that include both alerted and quiet intervals (labeling only alerts cannot measure missed incidents!):

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=joint-detector, id=alert-policy -->
```python title="evaluate-alert-policy.py"
from sklearn.metrics import precision_score, recall_score

actionable = np.array([1, 0, 1, 0, 1])
alerted    = np.array([1, 1, 0, 0, 1])
print(f"alert precision={precision_score(actionable, alerted):.3f} | alert recall={recall_score(actionable, alerted):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
alert precision=0.667 | alert recall=0.667
```
<!-- leetllm: output:end -->

For multi-hour disruptions, evaluate event-level detection and **detection delay** rather than counting 20 consecutive alert ticks during one outage as 20 independent wins.

## Reproduce a data-quality anomaly

Before assuming a spike represents real demand (or retraining a model on it), check whether ingestion duplicated events. At-least-once streaming pipelines frequently emit duplicate `event_id` records during network retries, inflating raw counts and poisoning future seasonal baselines:

<!-- leetllm: test, output=show, deps=numpy, continue=alert-policy, id=duplicate-events -->
```python title="detect-duplicate-telemetry-events.py"
raw_events = [
    {"event_id": "job-001", "job_id": "batch-100"},
    {"event_id": "job-001", "job_id": "batch-100"},
    {"event_id": "job-002", "job_id": "batch-101"},
]
unique_ids = {e["event_id"] for e in raw_events}
print(f"raw count={len(raw_events)} | deduplicated={len(unique_ids)} | duplicates={len(raw_events) - len(unique_ids)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw count=3 | deduplicated=2 | duplicates=1
```
<!-- leetllm: output:end -->

Deduplicate on stable event IDs upstream (quarantining conflicting payloads with the same ID) before computing forecast series or <span data-glossary="backfill">backfills</span>.

```checkpoint
Why shouldn't an anomaly detector automatically declare a capacity outage when actual volume exits the ±3 error band?
---
Crossing the band only shows that the observation is unusual relative to the seasonal baseline. Planned launches, duplicate telemetry ingestion, and genuine demand surges all cross the band yet require completely different actions.
```

## Package the evidence for shadow review

Before running a forecaster and alert detector in shadow mode against live traffic, bundle the split boundaries, normal-day and overall MAE, calibration-vs-holdout coverage, and deduplication checks together so no leakage or uncalibrated threshold slips into production:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=duplicate-events -->
```python title="verify-shadow-candidate.py"
checks = {
    "chronological_split":        bool(time_train.max() < time_test.min()),
    "calibration_before_holdout": bool(cal_idx.max() < holdout.min()),
    "beats_lag1_baseline":        bool(mean_absolute_error(actuals, forecasts) < mean_absolute_error(actuals, naive_preds)),
    "normal_day_mae_under_3":     bool(mean_absolute_error(actuals[normal_mask], forecasts[normal_mask]) <= 3.0),
    "alerts_carry_context":       all({"origin", "forecast", "actual", "band", "launch_event"} <= a.keys() for a in alerts),
}
for k, v in checks.items():
    print(f"{k:28s}: {v}")
print(f"summary -> overall_mae={mean_absolute_error(actuals, forecasts):.1f}, holdout_cov={holdout_cov:.3f}, ready_for_shadow={all(checks.values())}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
chronological_split         : True
calibration_before_holdout  : True
beats_lag1_baseline         : True
normal_day_mae_under_3      : True
alerts_carry_context        : True
summary -> overall_mae=5.3, holdout_cov=0.857, ready_for_shadow=True
```
<!-- leetllm: output:end -->

Notice what happens if you shrink the half-width from `±3` to `±2`: Tuesday's `+3` error joins Friday's `+28` outside the band, cutting holdout coverage from `6/7` to `5/7` and doubling review volume. Always tune thresholds on earlier validation windows and measure coverage and alert precision on fresh <span data-glossary="evaluation-slice">evaluation slices</span> before a live <span data-glossary="rollout">rollout</span>.

## When the policy breaks

| Symptom | Likely root cause | Concrete fix |
| --- | --- | --- |
| Alerts fire every Monday morning | Lag-1 naive copies Sunday's weekend lull | Switch to seasonal lag-7 or calendar features |
| Strong calm-week MAE, huge launch misses | Missing exogenous event calendar | Pass known launch/holiday covariates and slice launch days |
| Intervals repeatedly miss peaks | Forecast bias or nonstationary error scale | Track rolling coverage/width; try quantile regression or ACI |
| Flapping alerts flood on-call | Single-sample triggering with no state | Add consecutive-breach persistence, hysteresis, and deduplication |
| Phantom demand spikes pollute forecasts | At-least-once ingestion duplicates | Deduplicate on unique `event_id` upstream before aggregation |
| Joint brownout triggers zero alerts | Marginal ranges look fine while correlation broke | Pair PCA / Isolation Forest detectors with direct marginal bounds |

```mastery-quiz
[
  {
    "question": "A daily time series ends at Sunday evening (index 41). A fixed-origin weekly-lag helper forecasts target t by reading t - 7. Which targets are valid at origin 41: index 48 and index 49?",
    "options": [
      "Both 48 and 49 are valid.",
      "Neither 48 nor 49 is valid.",
      "48 is valid (reads 41); 49 is invalid (reads unobserved 42).",
      "48 is invalid; 49 is valid."
    ],
    "answer": "48 is valid (reads 41); 49 is invalid (reads unobserved 42).",
    "explanation": "Target 48 reads index 41, which is observed at the origin. Target 49 would read index 42, which lies in the future relative to origin 41."
  },
  {
    "question": "Four forecast errors (actual minus forecast) are [-2, +4, -6, 0] jobs. What are the signed mean bias and MAE?",
    "options": [
      "Bias -1; MAE 1.",
      "Bias +1; MAE 3.",
      "Bias -4; MAE 12.",
      "Bias -1; MAE 3."
    ],
    "answer": "Bias -1; MAE 3.",
    "explanation": "The signed sum is -4, so mean bias is -4 / 4 = -1. Absolute errors [2, 4, 6, 0] sum to 12, giving MAE = 12 / 4 = 3."
  },
  {
    "question": "At quantile q = 0.80, forecast 80 meets actual 92 (underforecast) or actual 68 (overforecast). What pinball losses result for those two cases?",
    "options": [
      "2.4 and 9.6.",
      "9.6 and 2.4.",
      "9.6 and 9.6.",
      "12.0 and 12.0."
    ],
    "answer": "9.6 and 2.4.",
    "explanation": "Underforecasting by 12 incurs q * 12 = 0.8 * 12 = 9.6. Overforecasting by 12 incurs (1 - q) * 12 = 0.2 * 12 = 2.4."
  },
  {
    "question": "For 95% split-conformal prediction, compare calibration sizes n = 18 and n = 19. Which requested ranks and finite-width outcomes follow?",
    "options": [
      "n = 18: rank 18 (finite); n = 19: rank 19 (finite).",
      "n = 18: rank 19 (infinite); n = 19: rank 20 (infinite).",
      "n = 18: rank 19 (infinite); n = 19: rank 19 (finite).",
      "n = 18: rank 18 (finite); n = 19: rank 18 (finite)."
    ],
    "answer": "n = 18: rank 19 (infinite); n = 19: rank 19 (finite).",
    "explanation": "For n = 18, ceil(19 * 0.95) = 19 > 18, producing an infinite half-width. For n = 19, ceil(20 * 0.95) = 19 <= 19, selecting the maximum calibration score."
  },
  {
    "question": "Adaptive Conformal Inference (ACI) has current working alpha = 0.12, target alpha = 0.10, and step size gamma = 0.04. After one missed observation followed by one covered observation, what are the next two working alpha levels?",
    "options": [
      "0.116 then 0.080.",
      "0.156 then 0.152.",
      "0.084 then 0.080.",
      "0.084 then 0.088."
    ],
    "answer": "0.084 then 0.088.",
    "explanation": "After a miss (indicator = 1): 0.12 + 0.04 * (0.10 - 1) = 0.084. After a covered point (indicator = 0): 0.084 + 0.04 * (0.10 - 0) = 0.088."
  },
  {
    "question": "A rank-1 PCA detector projects points onto the diagonal x2 = x1 by replacing both coordinates with their mean, then sums squared reconstruction differences. What scores do (2, -2) and (4, 4) receive?",
    "options": [
      "8 and 0.",
      "4 and 0.",
      "8 and 32.",
      "0 and 0."
    ],
    "answer": "8 and 0.",
    "explanation": "Point (2, -2) projects to (0, 0), giving squared error 2^2 + (-2)^2 = 8. Point (4, 4) lies on the diagonal and reconstructs with 0 error despite its large magnitude."
  },
  {
    "question": "A fully labeled evaluation set has 3 actionable alerted periods, 2 non-actionable alerted periods, and 1 missed actionable period. What are alert precision and alert recall?",
    "options": [
      "Precision 0.75; recall 0.60.",
      "Precision 0.60; recall 0.50.",
      "Precision 0.60; recall 0.75.",
      "Precision 0.50; recall 0.60."
    ],
    "answer": "Precision 0.60; recall 0.75.",
    "explanation": "Precision = TP / (TP + FP) = 3 / (3 + 2) = 0.60. Recall = TP / (TP + FN) = 3 / (3 + 1) = 0.75."
  }
]
```

> **Next:** Continue to [Monitoring Predictive Models](/learn/monitoring-predictive-models). A versioned forecast candidate turns unusual future errors into review artifacts. Monitoring puts that candidate on a live clock: <span data-glossary="feature-freshness">feature freshness</span>, delayed labels, and whether a newer model should replace or <span data-glossary="rollback">roll back</span> the current release.
