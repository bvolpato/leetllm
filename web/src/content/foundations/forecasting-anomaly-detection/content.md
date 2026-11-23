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
  "shortDescription": "Forecast batch-job demand with time-aware evaluation and turn large forecast errors into reviewable operational alerts.",
  "keyConceptsTested": ["time series decomposition", "seasonal naive forecast", "rolling origin validation", "MAE", "pinball loss", "prediction interval", "anomaly alert"]
}
---

On Thursday evening, a cluster's forecast for Friday was 132 outbound batch jobs. Friday's observed count was 160. Is that 28-job gap a capacity problem, a planned launch, or a broken counter?

[Ranking and recommendation](/learn/ranking-recommendation-systems) compared items for a query or user. Here the order that matters is time. A forecast has to name Friday's count from information already in hand. <span data-glossary="anomaly">Anomaly</span> detection asks the later question: once the count is 160, does the 28-job gap deserve a review?

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="The upper chart compares same-weekday forecasts and observed batch jobs from January 26 through February 1. The lower chart aligns each actual-minus-forecast error to its weekday on a scale from minus five to plus 32 jobs. Six errors sit within the earlier empirical plus-or-minus-three-job half-width; Friday's plus-28 error sits outside." />
  <figcaption>The upper chart compares the issued forecast with observed jobs. The lower chart shows actual minus forecast on a visible job scale, aligned by day against the earlier empirical <code>±3</code>-job half-width. Friday is the sole outlier in this seven-day window; later windows are needed to evaluate coverage.</figcaption>
</figure>

## Start with an ordered batch-job series

Before naming a model, fix the clock. A **time series** is a sequence of observations indexed by time. Here, each row is one day's outbound batch-job count for one model-serving cluster, plus a flag for a planned model launch. Friday's 160 versus 132 gap is one row in that ordered sequence.

The **<span data-glossary="forecast-horizon">forecast horizon</span>** is how far ahead you predict. A one-day horizon targets tomorrow; issuing a full seven-day forecast targets horizons one through seven. Those are different evaluation tasks, even if a simple baseline happens to return the same numbers.

This lab issues one forecast each evening for the following day, assuming today's final count is available then. The end of that evening is the **forecast origin**. A Sunday forecast for Monday may use Sunday's count; a forecast issued the previous Thursday may not. In production, delayed telemetry can move the latest usable observation further back.

Use this synthetic four-week series throughout. Its weekday pattern repeats with small changes, and the final Friday contains a planned launch. The launch flag is assumed known before the forecast, although this baseline doesn't use it to adjust the predicted count. Every later cell continues in the same Python session.

<!-- leetllm: test, output=show, deps=numpy, id=forecast-lab -->
```python title="build-batch-job-series.py"
from datetime import date, timedelta
from hashlib import sha256
from json import dumps
from math import ceil, sqrt

import numpy as np


start = date(2026, 1, 5)
weekly_pattern = np.array([100, 112, 115, 118, 132, 82, 76])
weekly_noise = np.array(
    [
        [0, 0, 0, 0, 0, 0, 0],
        [2, -2, 3, -2, 2, 2, 2],
        [4, -2, 4, -2, 0, 1, 2],
        [3, 1, 2, -1, 28, 2, 1],
    ]
)
volume_matrix = weekly_pattern + weekly_noise

rows = []
for day_idx, volume in enumerate(volume_matrix.ravel()):
    rows.append(
        {
            "date": start + timedelta(days=day_idx),
            "weekday": day_idx % 7,
            "volume": int(volume),
            "launch_event": day_idx == 25,
        }
    )

volumes = np.array([row["volume"] for row in rows], dtype=float)
print("rows:", len(rows))
print("first date:", rows[0]["date"])
print("last date:", rows[-1]["date"])
print("launch_event day:", next(row["date"] for row in rows if row["launch_event"]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rows: 28
first date: 2026-01-05
last date: 2026-02-01
launch_event day: 2026-01-30
```
<!-- leetllm: output:end -->

The series contains one row per calendar day. The seven-row lag below only means seven days because there are no missing dates. Real ingestion should validate the calendar, timezone, and missing-day policy; a missing measurement isn't automatically a zero count.

## Decompose metrics into trend, seasonality, and exogenous events

A decomposition is a modeling choice, not a unique identification of physical causes. One useful additive description is:[^hyndman2021fpp3]

$$
y_t = T_t + S_t + X_t + \epsilon_t
$$

Interpret these terms as descriptions of the observed pattern:

- **Trend ($T_t$)**: A changing underlying level. Adoption might increase demand, but four authored weeks cannot demonstrate a long-run trend.
- **Seasonality ($S_t$)**: Repeating calendar effects. Our daily series has a weekly pattern. Daily aggregates don't reveal hourly cycles, and month-end effects need more than a seven-day seasonal lag.
- **External effect ($X_t$)**: A modeled contribution from covariates such as planned launches or holidays. The launch flag isn't itself an additive number of jobs. Its effect would have to be estimated from earlier examples, or provided as an explicit scenario.
- **Remainder ($\epsilon_t$)**: Variation left after those terms, including measurement errors, omitted structure, and shocks. Its observations may be dependent, so assess that structure before treating the remainder as independent noise.

Autoregressive dependence is another way to model predictable history, rather than a separately identified term in this decomposition. A backlog can persist; that doesn't prove all workloads have high lag-1 correlation.

The structural formulation above is additive. It suits seasonal swings that stay roughly constant in absolute magnitude. When those swings scale proportionally with the level (such as weekend traffic dropping by 35% rather than a flat forty jobs), a multiplicative description may suit them better:

$$
y_t = T_t \times S_t \times R_t
$$

Here $R_t$ is a multiplicative remainder and the components must be suitable for that product. Taking logs of positive values converts products into sums and can stabilize proportional variation. Check residuals to assess whether error variance is constant. Zero counts require another choice, such as `log1p`, whose interpretation differs. Back-transforming a predicted log mean also needs a bias adjustment to obtain an original-scale mean; exponentiation alone doesn't provide it.

## Keep future rows out of training

A random split answers a different question from forecasting. Suppose we issue a forecast for January 6. If the training set contains January 31, the model has already seen later demand, seasonal behavior, or a launch event relative to that target. The split can look balanced while the evaluation is still optimistic.

The audit compares the latest training date with the earliest test date. Alternating rows between train and test creates the same time-order problem as shuffling. Predict `future_leak=True` for these interleaved rows and `future_leak=False` for the chronological rows.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=forecast-lab, id=split-audit -->
```python title="audit-time-splits.py"
from sklearn.model_selection import TimeSeriesSplit

interleaved_train = np.arange(0, len(rows), 2)
interleaved_test = np.arange(1, len(rows), 2)
tscv = TimeSeriesSplit(n_splits=3, test_size=7)
*_, (time_train, time_test) = tscv.split(volumes)


def split_summary(name, train_indices, test_indices):
    latest_train = max(rows[int(index)]["date"] for index in train_indices)
    earliest_test = min(rows[int(index)]["date"] for index in test_indices)
    future_leak = latest_train >= earliest_test
    print(
        f"{name}: latest_train={latest_train} "
        f"earliest_test={earliest_test} future_leak={future_leak}"
    )


split_summary("interleaved", interleaved_train, interleaved_test)
split_summary("time-aware", time_train, time_test)
assert max(time_train) < min(time_test)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
interleaved: latest_train=2026-01-31 earliest_test=2026-01-06 future_leak=True
time-aware: latest_train=2026-01-25 earliest_test=2026-01-26 future_leak=False
```
<!-- leetllm: output:end -->

This is a single chronological holdout. Later we'll move the forecast origin and evaluate repeated future targets, which is **time-series cross-validation**.[^hyndman2021fpp3] The date check is necessary, and feature values, transformations, and event flags must also reflect what was known at each origin. A table sorted by date can still contain features computed from future observations.

```checkpoint
Why isn't a random split acceptable just because every row belongs to the same cluster?
---
Cluster identity doesn't remove time order. A shuffled split can train on later demand, launch events, and seasonal behavior before evaluating earlier dates. Production only predicts later periods from earlier information.
```

## Set a same-weekday baseline

On Sunday evening, January 25, the latest count is `78`; last Monday's was `104`. Tomorrow will actually run `103` jobs, but the forecaster doesn't know that yet. Which observed value is the better starting point for Monday?

Put the two one-step copies beside the actual count:

| Method | What it copies | Monday forecast | Actual | Error |
| --- | --- | ---: | ---: | ---: |
| naive | yesterday (Sunday `78`) | 78 | 103 | +25 |
| seasonal naive | last Monday (`104`) | 104 | 103 | -1 |

The mismatch has a name: batch-job volume has **<span data-glossary="seasonality">seasonality</span>** when a pattern repeats at a known calendar frequency. Saturday volume stays lower than weekday volume, so copying yesterday turns a weekend lull into Monday's forecast.

A **<span data-glossary="seasonal-naive-forecast">seasonal naive forecast</span>** reuses the observation from the matching previous season. For daily data with a weekly pattern, Monday copies last Monday, Tuesday copies last Tuesday, and so on.[^hyndman2021fpp3] It gives us a seasonal baseline to compare against. A more complex model has to beat it on later windows before its extra machinery is worth running.

For the two days that matter most, the same-weekday rule gives:

| Target day | Same day last week | Forecast | Actual | <span data-glossary="forecast-error">Forecast error</span> |
| --- | --- | ---: | ---: | ---: |
| Monday, Jan 26 | Monday, Jan 19 | 104 | 103 | -1 |
| Friday, Jan 30 | Friday, Jan 23 | 132 | 160 | +28 |

Read Friday's row as `160 - 132 = 28`. Positive error means observed volume exceeded the forecast; negative error means the forecast was too high.

The table shows two rows. Computing the complete holdout week directly contrasts Monday's `-1` error against Friday's `+28` surprise:

<!-- leetllm: test, output=show, deps=numpy, continue=split-audit, id=seasonal-forecast -->
```python title="forecast-with-weekly-lag.py"
holdout = list(range(21, 28))


def weekly_lag(index, origin=None):
    origin = index - 1 if origin is None else origin
    source = index - 7
    if not 0 <= source <= origin < index:
        raise ValueError("Weekly lag needs an observed matching day before the target")
    return rows[source]["volume"]


forecasts = np.array([weekly_lag(index) for index in holdout])
actuals = volumes[holdout].astype(int)
for index, forecast, actual in zip(holdout, forecasts, actuals):
    error = int(actual - forecast)
    print(
        f"{rows[index]['date']} forecast={int(forecast)} "
        f"actual={int(actual)} error={error:+d}"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2026-01-26 forecast=104 actual=103 error=-1
2026-01-27 forecast=110 actual=113 error=+3
2026-01-28 forecast=119 actual=117 error=-2
2026-01-29 forecast=116 actual=117 error=+1
2026-01-30 forecast=132 actual=160 error=+28
2026-01-31 forecast=83 actual=84 error=+1
2026-02-01 forecast=78 actual=77 error=-1
```
<!-- leetllm: output:end -->

Saturday exposes the same trap in the other direction. A naive one-step forecast would copy Friday's launch (`160`) into Saturday and miss by `-76`. The weekly lag copies last Saturday (`83`) and misses by `+1`, because it preserves the weekend regime.

Freeze issuance at Sunday, January 25, instead of advancing it daily. A seven-row copy can forecast horizons one through seven from already observed sources. Horizon eight would read Monday, January 26, which hasn't happened at this origin:

<!-- leetllm: test, output=show, deps=numpy, continue=seasonal-forecast, id=issuance-guard -->
```python title="reject-a-future-lag-source.py"
frozen_origin = 20
available_slice = volumes[: frozen_origin + 1]
assert len(available_slice) == 21
print("horizon seven forecast:", weekly_lag(frozen_origin + 7, origin=frozen_origin))
try:
    weekly_lag(frozen_origin + 8, origin=frozen_origin)
except ValueError:
    print("horizon eight reads an unobserved source: rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
horizon seven forecast: 78
horizon eight reads an unobserved source: rejected
```
<!-- leetllm: output:end -->

A general multi-step seasonal-naive rule repeats the **last observed season** for longer horizons. Our simple helper deliberately rejects a source beyond its origin instead of silently reading a future row.

```checkpoint
Why is last Monday a better forecast for this Monday than yesterday's Sunday count?
---
Sunday is a weekend lull. Copying 78 into Monday treats that dip as the new baseline and misses by 25 jobs. Last Monday already lived in the weekday regime, so the error is 1 job.
```

## Compare classical SARIMAX, gradient-boosted trees, and foundation models

Our same-weekday baseline misses the known launch. Could another model learn its effect? Compare candidates that use the information available at issuance, rather than choosing complexity from a leaderboard. These families offer different ways to share history and represent covariates.

### Classical SARIMAX

SARIMAX combines regression with seasonal ARIMA structure. In the regression-with-SARIMA-errors formulation used by statsmodels, with fixed coefficients and no intercept shown:[^statsmodels2026sarimax]

$$
y_t = \beta^\top x_t + u_t
$$

$$
\Phi_P(B^s)\phi_p(B)(1-B)^d(1-B^s)^D u_t
= \Theta_Q(B^s)\theta_q(B)\epsilon_t
$$

Here $B$ shifts a series back one observation, $s$ is the seasonal period, and $x_t$ is a covariate vector. Differencing applies to the regression error $u_t$, not simply to $y_t$ while leaving the regressors unchanged on the right. Differencing can remove particular trends or seasonal unit roots; it doesn't cure every form of nonstationarity. The AR and MA polynomials describe dependence on past errors and innovations.

Low-order models can be compact, with model-based prediction intervals under their distributional assumptions. Coefficients describe conditional associations, not necessarily causal launch effects. Future covariates must be given as known values or forecasts; uncertain covariates add uncertainty the usual conditional interval may omit.

A conventional statsmodels SARIMAX fit has one target series. Fitting it independently for 25,000 containers creates 25,000 local models without learned cross-container sharing. That is a trade-off of this setup, not a theorem forbidding shared parameters, pooled statistical models, or multivariate state-space alternatives.

### Gradient-boosted trees with rolling features

LightGBM and XGBoost are options for turning forecasting into supervised tabular regression.[^ke2017lightgbm][^chen2016xgboost] For a one-step target at $t$, issued after $t-1$, inputs might include:

- **Autoregressive lag features**: Exact historical values at $t-1, t-2, t-7, t-14$.
- **Rolling summary statistics**: Mean, standard deviation, minimum, and maximum over windows ending at $t-1$, using only observations available at issuance.
- **Cyclical calendar encodings**: Trigonometric projections of day of week ($\sin(2\pi d / 7), \cos(2\pi d / 7)$) and hour of day.
- **Categorical metadata**: Cluster GPU architecture, tenant tier, and deployment region.

A global model can pool rows across series and use metadata to learn shared relationships. Validate temporal feature joins, per-series weighting, cold-start performance, and runtime to determine whether pooling transfers and scales for the target workload.

Now let $T$ denote the origin. Common ways to predict $T+1,\dots,T+H$ include:

1. **Recursive forecasting**: Train a one-step model. Feed its prediction back into lag features for later steps. Errors can propagate and predicted inputs can differ from the observed inputs used in training.
2. **Direct forecasting**: Fit a separate model for each horizon using origin-available features. This avoids feeding earlier predicted targets into later lags, but doesn't eliminate forecast error. A shared model with horizon as an input, or a multiple-output model, offers other trade-offs.

A holiday calendar may be known at $T$. Actual weather at $T+7$ isn't; a weather forecast issued at $T$ is a different, potentially usable input.

### Time-series Transformers and foundation models

Numerical time series can become Transformer tokens in several ways. One token per timestamp gives dense attention an $O(L^2)$ attention-map cost in sequence length $L$; patching changes the token count. Neither tokenization nor a larger pretrained model guarantees better forecasts.

Distinguish these methods and generations:

- **PatchTST (ICLR 2023)**: Embeds patches and shares encoder weights across independently processed channels. With patch length $P$, stride $S$, and the paper's end padding, the token count is $N=\lfloor(L-P)/S\rfloor+2$, approximately $L/S$. Dense attention maps cost $O(N^2)$ per channel. Independent channel processing omits explicit cross-channel interaction. Test robustness to noise and negative transfer on the target data.[^nie2023patchtst]
- **Original Chronos (2024)**: Mean-scales historical values and uses **uniformly spaced bins**, not quantile bins, in the reported experiments. Primarily T5-based models learn cross-entropy on quantized sequences and sample future tokens autoregressively. This isn't the architecture of every later Chronos release.[^ansari2024chronos]
- **Chronos-2 (released October 20, 2025)**: Uses continuous patch embeddings, alternating time/group attention, and quantile outputs. It supports multivariate targets and past-only or known-future covariates without task-specific training.[^amazon2025chronos2]
- **TimesFM-3 (announced August 31, 2026)**: Adds native multivariate targets and covariates, alternates temporal and variate attention, and fills masked future patches in one forward pass. Its reported outputs include quantiles from P10 to P90; don't treat P90 as an available P99 estimate.[^google2026timesfm3]

**Zero-shot** forecasting uses given context and supported inputs without task-specific fitting. A new cluster still needs observations, and generated quantiles still need calibration against target traffic. We checked these capabilities on October 30, 2026. Compare later-window accuracy, interval coverage, and serving cost under the same issuance schedule and baselines.

Try the PatchTST arithmetic before choosing a context length:

<!-- leetllm: test, output=show, deps=numpy, continue=issuance-guard, id=patch-count -->
```python title="count-patched-attention-tokens.py"
lookback, patch_length, stride = 336, 16, 8
without_padding = int(np.floor((lookback - patch_length) / stride) + 1)
with_paper_padding = without_padding + 1
print("un-padded patches:", without_padding)
print("paper-padded patches:", with_paper_padding)
print("raw / patched attention-map entries:", float(lookback**2 / with_paper_padding**2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
un-padded patches: 41
paper-padded patches: 42
raw / patched attention-map entries: 64.0
```
<!-- leetllm: output:end -->

The 64× ratio counts entries in one attention map. Projection layers, channel count, memory movement, and hardware determine runtime. It isn't a measured 64× speedup. A smaller map also doesn't say whether Friday's 132 was a useful forecast. The same-weekday baseline already missed that day by 28 jobs. How large is a typical miss once positive and negative errors stop canceling?

## Measure forecast error in batch jobs

The holdout errors are `-1, 3, -2, 1, 28, 1, -1`. Their signed average is `29 / 7 = 4.1`, which measures average underforecasting, not typical error magnitude. Negative and positive errors can cancel, so we also want the average size of each mistake.

<span data-glossary="mean-absolute-error">Mean absolute error (MAE)</span> averages that size without letting positive and negative errors cancel:[^hyndman2021fpp3]

$$
\text{MAE} = \frac{1}{n}\sum_{t=1}^{n}|y_t - \hat{y}_t|
$$

Here $n$ is the number of evaluated days, $y_t$ is observed volume on day $t$, and $\hat{y}_t$ is the forecast for that day. For the holdout week, the absolute weekly-lag errors are `1, 3, 2, 1, 28, 1, 1`. Their sum is `37`, so MAE is `37 / 7 = 5.3` batch jobs.

MAE stays in batch jobs, which operations can read. It treats a 28-job miss and a 28-job surplus as equal, though underforecasting a capacity spike may cost more. When that asymmetry matters, keep MAE and record a separate business-cost measure.

Calculate overall MAE and normal-day MAE separately. The second metric excludes the known launch-event day so one planned spike doesn't hide weekday behavior, yielding overall MAE `5.3`, normal-day MAE `1.5`, and yesterday's-lag MAE `23.6`.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=patch-count, id=holdout-mae -->
```python title="measure-holdout-mae.py"
from sklearn.metrics import mean_absolute_error as sk_mae


def mean_absolute_error(errors):
    return float(sk_mae(np.zeros_like(errors, dtype=float), np.asarray(errors, dtype=float)))


holdout_errors = [
    rows[index]["volume"] - weekly_lag(index)
    for index in holdout
]
normal_mask = np.array([not rows[index]["launch_event"] for index in holdout])
normal_errors = np.asarray(holdout_errors)[normal_mask].tolist()

naive_preds = volumes[np.array(holdout) - 1]
naive_errors = (actuals - naive_preds).astype(int).tolist()

print("holdout errors:", holdout_errors)
print("holdout MAE:", round(mean_absolute_error(holdout_errors), 1))
print("normal-day MAE:", round(mean_absolute_error(normal_errors), 1))
print("naive holdout MAE:", round(mean_absolute_error(naive_errors), 1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
holdout errors: [-1, 3, -2, 1, 28, 1, -1]
holdout MAE: 5.3
normal-day MAE: 1.5
naive holdout MAE: 23.6
```
<!-- leetllm: output:end -->

The weekly lag's MAE is `5.3` jobs versus `23.6` for yesterday's lag. Both are **daily one-step forecasts**: Tuesday's naive forecast may use Monday's newly observed count. A seven-day forecast issued on Sunday would instead repeat Sunday's count for every naive prediction. Don't compare those two issuance schedules as though they were the same task.

Keep the overall metric alongside the non-launch slice. Excluding a difficult day can help diagnose the model, but it doesn't remove the capacity cost of missing that day. Choose slices before examining which exclusions improve the score.

## Backtest more than one future window

A single future week can make a baseline look lucky. **<span data-glossary="rolling-origin-evaluation">Rolling-origin evaluation</span>** moves the forecast origin forward and scores the next target each time. Here we group those daily one-step errors into two reporting windows: January 19 through January 25, then January 26 through February 1. These aren't two fixed-origin seven-step forecasts.

Run both folds. The seasonal baseline can forecast each day because each starts after at least one full week of history, with the earlier fold remaining calmer than the launch-containing fold:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=holdout-mae, id=rolling-origin -->
```python title="run-rolling-origin-backtest.py"
folds = []
for window_start in (14, 21):
    indices = np.arange(window_start, window_start + 7)
    preds = np.array([weekly_lag(int(index), origin=int(index) - 1) for index in indices], dtype=float)
    obs = volumes[indices]
    fold = {
        "start": rows[int(indices[0])]["date"],
        "end": rows[int(indices[-1])]["date"],
        "mae": round(float(sk_mae(obs, preds)), 1),
    }
    folds.append(fold)
    print(f"{fold['start']} to {fold['end']}: MAE={fold['mae']}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2026-01-19 to 2026-01-25: MAE=0.9
2026-01-26 to 2026-02-01: MAE=5.3
```
<!-- leetllm: output:end -->

The two folds disagree for a reason: the later window contains the launch spike. Keep that context instead of collapsing it into one global average. Backtest by model-serving cluster, service tier, weekday, and launch-event status so a cluster that routinely underforecasts peak demand stays visible.

These two weeks demonstrate the backtest, not stable performance across seasons. Keep model or threshold tuning inside earlier validation windows, then evaluate a later untouched period. Our earlier reporting fold will also contribute to interval calibration below, so it isn't an independent test of that fitted interval. For a learned model, refit on an expanding history or recent rolling window at each chosen origin; this copy rule has no coefficients to refit.

Also match the target to the decision. Job count only approximates <span data-glossary="gpu">GPU</span> demand if job sizes are comparable. GPU-hours, queue-delay duration, or failed-job count may be more appropriate for other operational decisions.

## Distinguish forecast errors from residuals

The next question is what each subtraction means. Two related quantities often get called residuals. Hyndman and Athanasopoulos separate them on two axes: which rows they use and how many steps ahead they look.[^hyndman2021fpp3] Use the row source and forecast timing to keep the labels straight:

| Quantity | Which rows | How far ahead | Formula | What it tells you |
| --- | --- | --- | --- | --- |
| residual | training data after fitting | usually one-step fitted values | observed value minus fitted value | whether the model captured known history |
| forecast error | later data, after the forecast was issued | one-step or multi-step | observed value minus forecast | whether the model predicted unseen future data |

Friday's `+28` is a forecast error because Friday's observed volume wasn't available when the forecast was issued. This weekly-lag baseline has no fitted parameters, so a one-step training residual uses the same copy-last-week rule.

The rule stays constant; the evidence changes. Training residuals describe known history, while forecast errors test a later window. An operations team may casually say "residual alert," but the stored artifact should name the measured quantity.

<figure>
  <img src="illustrations/_generated/issuance_timeline_dark.png" alt="A January timeline marks the Jan12–25 calibration window with 14 earlier errors and a p95 half-width of 3 jobs. A Jan23 Friday count of 132 anchors the Jan29 forecast for Jan30. The Jan30 observed count is 160, an error of plus 28 jobs beyond the review threshold." />
  <figcaption>Fourteen Jan12–25 errors set a p95 half-width of 3 jobs. A Jan29 forecast of 132 for Jan30 meets an observed 160, producing a +28-job error that crosses the ±3 threshold.</figcaption>
</figure>

The earlier errors set the three-job cutoff. A crossing marks an unusual error. Check launch status, telemetry quality, duplicate events, and demand to investigate the cause.

## Quantify uncertainty with pinball loss and conformal intervals

A point forecast doesn't specify its exceedance probability. The mean and median don't automatically coincide, and neither job counts nor a demand quantile directly determines server capacity when job sizes vary.

- **P10**: A low demand quantile. Provisioning to it can underprovide for most outcomes; it doesn't ensure safe teardown.
- **P50**: A median. It isn't generally the expected demand needed for mean-based cost accounting.
- **P90 or P99**: Higher demand quantiles that can inform headroom decisions. They don't guarantee an SLA, and some models don't produce P99.

Lead time, queue tolerance, resource-per-job variation, and the cost of spare capacity also matter. An unexpected change can invalidate even a previously calibrated quantile.

### Quantile regression with pinball loss

To predict a specific quantile $q \in (0, 1)$ without assuming a normal distribution, models optimize the asymmetric **pinball loss** (also called check loss):

$$
\mathcal{L}_q(y, \hat{y}_q) = \max\left(q(y - \hat{y}_q),\, (1 - q)(\hat{y}_q - y)\right)
$$

Examining the two piecewise linear slopes reveals how it works:

- When actual demand exceeds the forecast ($y > \hat{y}_q$, underforecasting), the error is positive, incurring penalty $q \cdot (y - \hat{y}_q)$.
- When actual demand falls below the forecast ($y < \hat{y}_q$, overforecasting), the error is negative, incurring penalty $(1 - q) \cdot (\hat{y}_q - y)$.

For $q=0.90$, underpredicting by ten jobs incurs loss 9.0; overpredicting by ten incurs 1.0. Minimizing **expected conditional** pinball loss targets a conditional quantile. A finite, restricted, imperfectly optimized model won't always reach it. For counts and other distributions with atoms, ties mean a quantile won't always leave exactly 10% of outcomes strictly above it.[^angelopoulos2021conformal]

Consider ten equally likely demand outcomes: nine at ten jobs, one at 100. Their mean is 19, but only one outcome exceeds 19. At q=0.9, every prediction between ten and 100 minimizes this discrete example's expected loss. Check both claims:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=rolling-origin, id=pinball-score -->
```python title="compare-mean-and-quantile-targets.py"
from sklearn.metrics import mean_pinball_loss

demand = np.array([10] * 9 + [100], dtype=float)


def pinball(actual, predicted, quantile):
    error = actual - predicted
    return max(quantile * error, (quantile - 1) * error)


mean_demand = float(np.mean(demand))
print("mean demand:", mean_demand)
print("fraction above mean:", float(np.mean(demand > mean_demand)))
print("ten-job underforecast loss:", pinball(20, 10, 0.9))
print("ten-job overforecast loss:", round(pinball(10, 20, 0.9), 1))
for prediction in (10, 19, 100):
    pred_vec = np.full_like(demand, float(prediction))
    expected_loss = float(mean_pinball_loss(demand, pred_vec, alpha=0.9))
    print(f"prediction {prediction}: expected P90 loss={expected_loss:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mean demand: 19.0
fraction above mean: 0.1
ten-job underforecast loss: 9.0
ten-job overforecast loss: 1.0
prediction 10: expected P90 loss=8.1
prediction 19: expected P90 loss=8.1
prediction 100: expected P90 loss=8.1
```
<!-- leetllm: output:end -->

The canonical inverse-CDF P90 chooses ten, the first value with cumulative probability at least 0.9. This example's pinball-loss optimum isn't unique.

### Conformalized prediction intervals

Split conformal prediction can wrap a fitted predictor with a finite-sample **marginal** coverage guarantee under exchangeability. It doesn't promise coverage for each weekday, cluster, or realized calibration set.[^angelopoulos2021conformal][^lei2018conformalRegression]

On a held-out calibration set $\mathcal{D}_{\text{cal}} = \{(x_i, y_i)\}_{i=1}^n$, compute absolute residual nonconformity scores $s_i = |y_i - \hat{y}_i|$. For target coverage $1 - \alpha$ (such as 95%, where $\alpha = 0.05$), set the interval half-width $\hat{q}$ to the finite-sample adjusted empirical quantile:

$$
k=\lceil(n+1)(1-\alpha)\rceil,
\qquad
\hat q=
\begin{cases}
s_{(k)}, & k\le n,\\
\infty, & k=n+1.
\end{cases}
$$

Here $s_{(k)}$ is the kth smallest score, with no interpolation. The infinity convention handles a requested rank beyond the finite scores. For a predictor fixed independently of calibration data, exchangeable calibration/test scores give $P(Y_{\text{new}}\in[\hat y-\hat q,\hat y+\hat q])\ge1-\alpha$, averaging over calibration and the new outcome. Forecasting with dependent rolling history doesn't automatically satisfy those conditions.

### The non-exchangeability trap in time series

Ordered traffic with autocorrelation, seasonal changes, or drift won't automatically have exchangeable scores. An upward shift can make an old band too narrow, but neither the direction nor the size of coverage loss is automatic.[^barber2022exchangeability]

Two approaches worth evaluating are:

1. **Rolling calibration**: Recent scores can track a changing regime, at the cost of fewer observations and noisier quantiles. Choose the window using earlier backtests; rolling fourteen or thirty days doesn't restore exchangeability or a universal 95% guarantee.
2. **Adaptive conformal inference (ACI)**: Update a working miscoverage level using $\alpha_{t+1}=\alpha_t+\gamma(\alpha-\mathbf1\{Y_t\notin I_t\})$. A miss lowers the level, usually widening a monotone interval rule. Its original long-run coverage-frequency result uses specified extreme-set conventions and permits unbounded intervals. It isn't a per-step conditional coverage or useful-width guarantee, and clipping the working level changes the stated algorithm.[^gibbs2021aci]

Online updates must wait for the outcome to arrive. For delayed daily counts, using tomorrow's realized error to adjust today's interval is leakage. A band frozen from earlier days avoids that leak. It still has to say how wide "normal" is for a one-day miss.

## Calibrate an error band from earlier days

A point forecast such as `132 batch jobs` leaves an operator with a practical question: how much variation counts as normal? A **<span data-glossary="prediction-interval">prediction interval</span>** answers by pairing the forecast with lower and upper bounds intended to cover a stated proportion of future outcomes. Hyndman and Athanasopoulos treat the interval as part of the forecast, not a chart decoration, and they evaluate it on later data.[^hyndman2021fpp3]

If one-step forecast errors are approximately zero-mean Gaussian with a stable scale, a common approximate 95% interval is $\hat{y}_{t} \pm 1.96\,\hat{\sigma}$. The scale must describe forecast errors at the chosen horizon, not the raw variability of daily volume. A biased forecast or a changing error distribution undermines that interpretation.[^hyndman2021fpp3]

We'll use a simpler empirical rule: sort earlier absolute one-day errors and take their nearest-rank 95th percentile as the half-width. This doesn't assume Gaussian errors, but transferring the band to future days still assumes their errors behave sufficiently like the calibration period. It isn't a bootstrap and doesn't account automatically for time dependence.

Calibrate on January 12 through January 25, before the January 26 holdout starts. Then measure coverage again on the later holdout week. Coverage is the share of days whose absolute error stays inside the band.

There are fourteen calibration errors. The nearest-rank index is `ceil(0.95 × 14) = 14`, so this example selects their largest absolute error, `3`. The resulting interval extends three jobs on either side of the forecast, for a total width of six jobs. Always report width alongside coverage; a band that covers everything by becoming enormous isn't useful.

<!-- leetllm: test, output=show, deps=numpy, continue=pinball-score, id=error-band -->
```python title="calibrate-empirical-error-band.py"
calibration = list(range(7, 21))
calibration_errors = [
    rows[index]["volume"] - weekly_lag(index)
    for index in calibration
]
cal_arr = np.asarray(calibration_errors, dtype=float)
target_coverage = 0.95
interval_policy = "empirical-absolute-error-p95-v1"


def nearest_rank_quantile(values, probability):
    arr = np.asarray(values, dtype=float)
    if arr.size == 0 or not 0 < probability <= 1:
        raise ValueError("Need nonempty values and probability in (0, 1]")
    ordered = np.sort(arr)
    rank = ceil(probability * len(ordered)) - 1
    return int(ordered[rank]) if float(ordered[rank]).is_integer() else float(ordered[rank])


error_band = nearest_rank_quantile(np.abs(cal_arr), probability=target_coverage)
calibration_coverage = float(np.mean(np.abs(cal_arr) <= error_band))
holdout_coverage = float(np.mean(np.abs(holdout_errors) <= error_band))

error_bias = float(np.mean(cal_arr))
error_rms = float(np.sqrt(np.mean(cal_arr**2)))
normal_half_width = round(1.96 * error_rms, 1)

assert max(calibration) < min(holdout)
print("calibration errors:", calibration_errors)
print("empirical p95 absolute-error half-width:", error_band)
print("mean calibration error:", round(error_bias, 2))
print("root mean squared calibration error:", round(error_rms, 2))
print("zero-mean normal approximation half-width:", normal_half_width)
print("in-sample calibration coverage:", round(calibration_coverage, 3))
print("later holdout coverage:", round(holdout_coverage, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
calibration errors: [2, -2, 3, -2, 2, 2, 2, 2, 0, 1, 0, -2, -1, 0]
empirical p95 absolute-error half-width: 3
mean calibration error: 0.5
root mean squared calibration error: 1.75
zero-mean normal approximation half-width: 3.4
in-sample calibration coverage: 1.0
later holdout coverage: 0.857
```
<!-- leetllm: output:end -->

The empirical band is `+/-3` jobs. The zero-mean normal approximation gives about `+/-3.4`, so both flag Friday's `+28`, though neither determines its cause. The RMS calculation estimates spread around zero; it isn't the sample standard deviation around the observed mean. The positive mean error of `0.5` jobs is a reason to investigate forecast bias rather than silently assume it away.

Neither width is a production 95% guarantee from fourteen <span data-glossary="calibration">calibration</span> errors. Calibration coverage is `1.000` here because the selected order statistic is the maximum. Later holdout coverage is `6 / 7 = 0.857` because Friday falls outside. A single week neither validates a 95% claim nor precisely estimates the policy's long-run coverage.

Compare the ranks directly. With fourteen scores and 95% target coverage, standard split conformal requests `ceil(15 × 0.95) = 15`, not fourteen. It returns an infinite half-width. Under exchangeable scores with no ties, using the maximum of fourteen gives marginal coverage only `14/15 ≈ 93.3%`; ties can raise coverage. Neither result transfers automatically to our time-dependent series.

<!-- leetllm: test, output=show, deps=numpy, continue=error-band, id=conformal-rank -->
```python title="check-the-finite-conformal-rank.py"
absolute_scores = np.sort(np.abs(cal_arr))
conformal_rank = ceil((len(absolute_scores) + 1) * target_coverage)
conformal_half_width = (
    float(absolute_scores[conformal_rank - 1])
    if conformal_rank <= len(absolute_scores)
    else float("inf")
)
print("empirical rank:", ceil(len(absolute_scores) * target_coverage))
print("split-conformal rank:", conformal_rank)
print("split-conformal half-width:", conformal_half_width)
print("tie-free maximum coverage:", round(len(absolute_scores) / (len(absolute_scores) + 1), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
empirical rank: 14
split-conformal rank: 15
split-conformal half-width: inf
tie-free maximum coverage: 0.933
```
<!-- leetllm: output:end -->

[Conformal Prediction and Uncertainty](/learn/conformal-prediction-uncertainty-sets) develops the guarantee and its assumptions further. Measure later coverage and width across windows, horizons, clusters, and <span data-glossary="evaluation-slice">important demand slices</span> before deciding whether an error band is useful.

Even a correctly calibrated 95% interval permits about five misses per hundred predictions on average. Across 1,000 series evaluated daily, that can mean about 50 threshold crossings per day, without implying 50 incidents. Independence isn't needed for that expected count, although dependence affects whether the crossings arrive together.

```checkpoint
Why doesn't the tiny `+/-3` band prove that future batch-job counts will land inside it 95% of the time?
---
It comes from only fourteen earlier errors. In-sample calibration coverage tells you how the band was chosen; later holdout coverage checks whether it transferred to unseen days. One holdout week still isn't enough. A production interval needs enough history plus out-of-sample coverage checks across rolling windows, forecast horizons, and important slices.
```

## Turn an unusual error into a review artifact

The band answers whether Friday is unusual. An **anomaly** is an observation unusual enough to inspect; diagnose the cause before attributing it to a cluster, pipeline, or model failure. Friday's jump could come from a planned model launch, duplicated event ingestion, a large <span data-glossary="backfill">backfill</span>, or genuine demand growth.

Apply the empirical band to the held-out week. Only Friday's `160` sits outside `[129, 135]`, producing one review alert with `launch_event=True` and enough stored context to reproduce the comparison:

<!-- leetllm: test, output=show, deps=numpy, continue=conformal-rank, id=alert-record -->
```python title="create-capacity-alert.py"
forecast_version = "weekly-lag-v1"
policy_cutoff = str(rows[20]["date"])
owner = "capacity-ops"

flagged_positions = np.where(np.abs(holdout_errors) > error_band)[0]
alerts = []
for pos in flagged_positions:
    index = holdout[int(pos)]
    forecast = int(forecasts[int(pos)])
    actual = int(actuals[int(pos)])
    forecast_error = actual - forecast
    alerts.append(
        {
            "series": "fc-a.batch_jobs",
            "forecast_version": forecast_version,
            "policy_cutoff": policy_cutoff,
            "forecast_origin": str(rows[index - 1]["date"]),
            "horizon_days": 1,
            "source_date": str(rows[index - 7]["date"]),
            "interval_policy": interval_policy,
            "date": str(rows[index]["date"]),
            "forecast": forecast,
            "actual": actual,
            "forecast_error": forecast_error,
            "lower": forecast - error_band,
            "upper": forecast + error_band,
            "launch_event": rows[index]["launch_event"],
            "action": "review",
            "owner": owner,
            "resolution": "pending",
        }
    )

for alert in alerts:
    print(f"{alert['date']}: origin={alert['forecast_origin']}, source={alert['source_date']}")
    print(f"forecast={alert['forecast']}, actual={alert['actual']}, "
          f"error={alert['forecast_error']:+d}, band=[{alert['lower']}, {alert['upper']}]")
    print(f"launch_event={alert['launch_event']}, owner={alert['owner']}, "
          f"resolution={alert['resolution']}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2026-01-30: origin=2026-01-29, source=2026-01-23
forecast=132, actual=160, error=+28, band=[129, 135]
launch_event=True, owner=capacity-ops, resolution=pending
```
<!-- leetllm: output:end -->

The baseline caught Friday because `160` falls outside `[129, 135]`. A launch-event flag doesn't erase the event; it changes the first investigation step. The comparison says “unusual,” while that flag suggests where to look first.

Route alerts with context. A planned model launch still deserves capacity review. An unexpected deviation deserves investigation too, but surprise alone doesn't make it urgent. Page when there is actionable, time-sensitive impact, such as an exhausted capacity margin or a breached service objective.[^sreMonitoringDistributedSystems]

<!-- leetllm: test, output=show, deps=numpy, continue=alert-record, id=alert-routing -->
```python title="route-alert-with-context.py"
def route_alert(alert, urgent_impact=False):
    if urgent_impact:
        return "page actionable capacity impact"
    if alert["launch_event"]:
        return "review planned model launch capacity"
    return "review unexpected batch-job deviation"


for alert in alerts:
    print(alert["date"], "->", route_alert(alert))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2026-01-30 -> review planned model launch capacity
```
<!-- leetllm: output:end -->

The policy cutoff is January 25, when the empirical band was fixed. Friday's forecast origin is January 29, and its source observation is January 23. Recording all three distinguishes policy fitting from daily forecast issuance. Neither the historical source date nor the target date substitutes for the origin.

This in-memory alert illustrates what a later investigation would need. It doesn't issue forecasts on a live clock or persist the observations. A real record also needs issuance timestamps, input versions, telemetry availability, and revisions; a calendar date alone doesn't audit those live inputs.

## Mitigate alert fatigue with cooldown and multivariate detectors

Detecting threshold crossings is only the first step in monitoring systems. Naive implementations quickly break down under operational scale. Two challenges require structural safeguards: alert fatigue and multi-metric correlation failures.

### Alert storms, flapping, and throttling

Four hours of one-minute evaluations gives 240 evaluations. It gives 240 notifications only if every breached evaluation sends one. Separate evaluation, alert state, incident grouping, and notification delivery.

Stateful controls offer distinct trade-offs:

1. **Persistence**: Require repeated breaches before entering alert state. Three samples at five-minute spacing define this configurable policy; actual detection delay depends on when the first breach occurs relative to the sampling schedule. Persistence trades fewer transient notifications for delay and can miss brief real failures.
2. **Cooldown or deduplication**: Update one active alert without sending every evaluation as a new page. An authored sixty-minute cooldown may suit one failure mode; independently urgent symptoms or escalation must still reach the owner.
3. **Resolution persistence or threshold hysteresis**: Require repeated clean samples to clear alert state, or use distinct enter/exit thresholds. These are related controls, not identical mechanisms. Clearing a metric alert won't automatically close an outage or prove user recovery.

Missing telemetry isn't a clean observation. Define that state explicitly, and retain direct capacity/SLO alerts even when a forecast considers chronic overload normal.[^sreMonitoringDistributedSystems]

Build a small state machine to see those distinctions. This separate stream has one forecast error every five minutes and uses the existing three-job half-width. Two consecutive breaches enter alert state; two consecutive clean observations clear it, resetting both counters whenever an observation is missing:

<!-- leetllm: test, output=show, deps=numpy, continue=alert-routing, id=alert-state -->
```python title="track-persistent-error-alerts.py"
def update_error_alert(state, error, half_width):
    if error is None:
        state["breaches"] = state["clean"] = 0
        return None

    if abs(error) > half_width:
        state["breaches"] += 1
        state["clean"] = 0
    else:
        state["clean"] += 1
        state["breaches"] = 0

    if not state["active"] and state["breaches"] >= 2:
        state["active"] = True
        return "review"
    if state["active"] and state["clean"] >= 2:
        state["active"] = False
        return "clear"
    return None


alert_state = {"active": False, "breaches": 0, "clean": 0}
sample_errors = [4, 5, None, 4, 2, 4, 0, -1]
minutes = np.arange(0, 5 * len(sample_errors), 5)
for minute, error in zip(minutes, sample_errors):
    transition = update_error_alert(alert_state, error, half_width=error_band)
    print(f"minute={int(minute):02d} error={error} active={alert_state['active']} transition={transition}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
minute=00 error=4 active=False transition=None
minute=05 error=5 active=True transition=review
minute=10 error=None active=True transition=None
minute=15 error=4 active=True transition=None
minute=20 error=2 active=True transition=None
minute=25 error=4 active=True transition=None
minute=30 error=0 active=True transition=None
minute=35 error=-1 active=False transition=clear
```
<!-- leetllm: output:end -->

The missing value interrupts both runs and retains the active state. It neither resolves the alert nor counts as another breach. The later breach resets the clean run, so resolution waits until minute 35. Repeated breaches update the same active alert; only an entry transition requests a review. Two samples five minutes apart detect this stream breach five minutes after its first breach, not ten.

The function mutates the state dictionary passed in. Keep separate state for each series, and preserve it across evaluations. The detector consumes ordered, regularly spaced observations with a fixed nonnegative half-width; production alerting layers timed cooldowns, durable state, delivery retries, and telemetry-health heartbeats around it. Decide how clock gaps and late observations affect the run before applying this policy to a live stream. Urgent direct symptoms still need their own route.

### Multivariate anomaly detection

A joint detector can find unusual combinations that separate bands miss. It doesn't replace urgent single-metric symptoms.

For an authored, standardized two-metric example, suppose healthy observations lie near $x_2=x_1$. The pair $(1,-1)$ is inside each metric's $[-1,1]$ range but off that relationship. Fitting a rank-one `PCA` subspace on healthy diagonal pairs and comparing reconstruction errors gives the concrete score directly:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=alert-state, id=joint-detector -->
```python title="probe-a-correlation-detector.py"
from sklearn.decomposition import PCA

healthy_pairs = np.column_stack([np.linspace(-2.0, 2.0, 9), np.linspace(-2.0, 2.0, 9)])
pca_detector = PCA(n_components=1).fit(healthy_pairs)


def diagonal_reconstruction_error(point):
    vec = np.asarray(point, dtype=float).reshape(1, -1)
    reconstructed = pca_detector.inverse_transform(pca_detector.transform(vec))
    return float(np.sum((vec - reconstructed) ** 2))


for point in ((1, -1), (5, 5)):
    inside_marginal_ranges = all(-1 <= value <= 1 for value in point)
    score = diagonal_reconstruction_error(point)
    print(f"{point}: inside marginal ranges={inside_marginal_ranges}, reconstruction error={score:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
(1, -1): inside marginal ranges=True, reconstruction error=2.0
(5, 5): inside marginal ranges=False, reconstruction error=0.0
```
<!-- leetllm: output:end -->

The unusual combination has error 2.0. But $(5,5)$, far outside the healthy range, reconstructs perfectly. An anomaly **along** a retained subspace can have zero reconstruction error. The diagonal is a specified reference, and the code computes its projection directly.

<figure>
  <img src="illustrations/_generated/multivariate_relationship_dark.png" alt="An equal-scale plot shows healthy metric pairs along x2 equals x1 and shades the square where both standardized values fall from minus one to one. Point A at (1, minus 1) passes both individual range checks but projects to (0, 0), with squared reconstruction error 2. Point B at (5, 5) lies outside both ranges on the relationship, with error 0." />
  <figcaption>Each shaded range check examines one metric at a time. The projection measures distance from the joint relationship: A passes both individual checks yet sits off the diagonal, while B is extreme on both axes and lies on it.</figcaption>
</figure>

Candidate methods include:

- **Isolation Forest**: Random feature/split choices produce trees whose adjusted path lengths supply an anomaly score. Easier-to-isolate points tend to score as unusual under this construction. Rare observations aren't necessarily incidents, and not every joint anomaly is easy to isolate.[^sklearn2026isolationforest]
- **PCA or autoencoder reconstruction**: Compare an input with its reconstruction. PCA supplies a linear subspace; a constrained autoencoder can learn nonlinear structure. Scaling, contaminated training periods, model capacity, and threshold choice matter. Neither method guarantees that every unfamiliar failure has high reconstruction error.

Fit preprocessing and detectors on earlier appropriate data and evaluate later operational labels. A score is evidence for triage, not a diagnosis of deadlock or failure.

## Evaluate alert usefulness separately

MAE measures point-forecast error, while alert usefulness depends on the threshold and operational outcomes. A threshold can send too many reviews or miss disruptions. To measure alert <span data-glossary="precision-recall">precision and recall</span>, label both alerted and non-alerted periods. Reviewing all alerts or a representative alert sample can estimate precision; selectively reviewing the worst alerts can bias it. Alert-only reviews can't reveal missed events or support overall recall.

| Metric | Question |
| --- | --- |
| alert precision | Of the alerts sent to review, how many were actionable? |
| alert recall | Of the actionable disruptions, how many did the policy surface? |

The following five periods use hand-assigned labels on a separate labeled sequence. They aren't actual independent reviews or labels inferred from the forecast week. Because the policy flags two actionable periods and one non-actionable period while missing one actionable period, both precision and recall evaluate to `2 / 3 = 0.667`:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=joint-detector, id=alert-policy -->
```python title="evaluate-alert-policy.py"
from sklearn.metrics import precision_score, recall_score

resolved_events = [
    {"alert": True, "actionable": True},
    {"alert": True, "actionable": False},
    {"alert": False, "actionable": True},
    {"alert": False, "actionable": False},
    {"alert": True, "actionable": True},
]

y_true = np.array([event["actionable"] for event in resolved_events], dtype=int)
y_pred = np.array([event["alert"] for event in resolved_events], dtype=int)

alert_precision = round(float(precision_score(y_true, y_pred, zero_division=0)), 3)
alert_recall = round(float(recall_score(y_true, y_pred, zero_division=0)), 3)
print("alert precision:", alert_precision)
print("alert recall:", alert_recall)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
alert precision: 0.667
alert recall: 0.667
```
<!-- leetllm: output:end -->

The output is `0.667` for both metrics. Precision and recall describe different failures, so tune the policy against operational cost as well. For disruptions lasting several time buckets, define how consecutive alerts map to one event and record detection delay. Twenty alerts about one outage aren't twenty independent successful detections.

If a denominator is zero, report `None`: no evidence isn't the same as measured failure. Page only when urgency warrants interruption; otherwise queue a review with the same evidence.

## Reproduce a data-quality anomaly

Not every spike represents demand. Before changing a forecast, ask whether the input count is trustworthy. A duplicated telemetry event can inflate a count before forecasting code sees it.

Reproducing that failure with three raw telemetry rows, two belonging to the same batch job event, drops the count from three raw rows to two unique events:

<!-- leetllm: test, output=show, deps=numpy, continue=alert-policy, id=duplicate-events -->
```python title="detect-duplicate-telemetry-events.py"
raw_job_events = [
    {"event_id": "job-001", "job_id": "batch-100", "type": "started"},
    {"event_id": "job-001", "job_id": "batch-100", "type": "started"},
    {"event_id": "job-002", "job_id": "batch-101", "type": "started"},
]
event_ids = np.array([event["event_id"] for event in raw_job_events])
_, first_positions = np.unique(event_ids, return_index=True)
unique_events = {raw_job_events[int(idx)]["event_id"]: raw_job_events[int(idx)] for idx in sorted(first_positions)}
deduplication_policy = "telemetry-event-id-v1"
duplicate_rows = len(raw_job_events) - len(unique_events)

print("naive started-job count:", len(raw_job_events))
print("deduplicated started-job count:", len(unique_events))
print("duplicate rows:", duplicate_rows)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
naive started-job count: 3
deduplicated started-job count: 2
duplicate rows: 1
```
<!-- leetllm: output:end -->

The count drops from `3` to `2`, so the apparent spike could be a telemetry problem rather than demand. Inspect input quality before retraining; duplicated counts can bias the fitted baseline.

This dictionary retains one payload per ID. Because repeated payloads match here, deduplicating by ID is harmless in this example. Real production ingestion needs an explicit conflict check and quarantine policy rather than silently overwriting mismatched payloads.

```checkpoint
Why shouldn't the alert policy declare an outage as soon as a count crosses the error band?
---
The comparison shows that the observation crosses this baseline's review threshold. It doesn't identify the cause or provide statistical significance. Planned launches, duplicated ingestion, and genuine demand shifts require different responses.
```

## Package the evidence for shadow review

A candidate needs more than a good MAE before it enters a capacity workflow. The checks below catch time-order and recordkeeping mistakes. This exercise sets a three-job non-launch MAE limit as its review criterion. Production limits should reflect the service's operating requirements.

These checks cannot confirm production readiness or adequate coverage. They can block avoidable mistakes, such as fitting an interval on its holdout or emitting an alert without an owner. An actual shadow trial also needs an agreed duration, evaluation slices, alert-volume budget, and a decision owner.

Run the verification checks. They inspect selected index, field-presence, and arithmetic conditions, not input correctness or actual operational ownership. Empty alert lists also pass `all(...)`, so keep alert count alongside that check. A shadow trial still needs the protocol and live data safeguards described above.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=duplicate-events, id=forecast-gates -->
```python title="check-forecast-release-gates.py"
gates = {
    "time_order": bool(max(time_train) < min(time_test)),
    "calibration_before_holdout": bool(max(calibration) < min(holdout)),
    "normal_day_mae": bool(mean_absolute_error(normal_errors) <= 3.0),
    "calibration_coverage_recorded": bool(0.0 <= calibration_coverage <= 1.0),
    "holdout_coverage_recorded": bool(0.0 <= holdout_coverage <= 1.0),
    "interval_policy_versioned": bool(interval_policy),
    "deduplication_policy_versioned": bool(deduplication_policy),
    "alerts_have_context": all(
        {
            "series", "forecast_version", "policy_cutoff", "forecast_origin",
            "horizon_days", "source_date", "interval_policy",
            "date", "forecast", "actual", "forecast_error", "lower", "upper",
            "launch_event", "action", "owner", "resolution",
        } <= alert.keys()
        for alert in alerts
    ),
    "owner_assigned": bool(owner),
}

for name, passed in gates.items():
    print(f"{name}: {passed}")
print("release checks:", all(gates.values()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
time_order: True
calibration_before_holdout: True
normal_day_mae: True
calibration_coverage_recorded: True
holdout_coverage_recorded: True
interval_policy_versioned: True
deduplication_policy_versioned: True
alerts_have_context: True
owner_assigned: True
release checks: True
```
<!-- leetllm: output:end -->

All checks pass on this example run. Assemble a record of the baseline, interval, input policy, and both overall and sliced performance. This cell only builds a Python dictionary and prints a summary; it doesn't publish a model, persist an artifact, or start a monitoring job.

<!-- leetllm: test, output=show, deps=numpy, continue=forecast-gates -->
```python title="assemble-forecast-candidate-record.py"
record = {
    "evidence_type": "synthetic_series",
    "operational_status": "not_evaluated",
    "series": "fc-a.batch_jobs",
    "forecast": forecast_version,
    "policy_cutoff": policy_cutoff,
    "forecast_schedule": "daily one-step, after previous day's count is finalized",
    "interval_policy": {
        "version": interval_policy,
        "target_coverage": target_coverage,
        "absolute_error_band": error_band,
        "calibration_window": [str(rows[7]["date"]), str(rows[20]["date"])],
        "calibration_coverage": round(calibration_coverage, 3),
        "holdout_window": [str(rows[21]["date"]), str(rows[27]["date"])],
        "holdout_coverage": round(holdout_coverage, 3),
    },
    "input_policy": {
        "deduplication": deduplication_policy,
    },
    "evaluation": {
        "overall_mae": round(mean_absolute_error(holdout_errors), 1),
        "normal_day_mae": round(mean_absolute_error(normal_errors), 1),
        "naive_one_step_mae": round(mean_absolute_error(naive_errors), 1),
        "alert_count": len(alerts),
    },
    "alerts": alerts,
    "release_checks": gates,
    "owner": owner,
    "status": "checks_passed" if all(gates.values()) else "checks_failed",
}
payload = dumps(record, sort_keys=True, separators=(",", ":"))

print("status:", record["status"])
print("evaluation:", record["evaluation"])
print("holdout coverage:", record["interval_policy"]["holdout_coverage"])
print("record sha256:", sha256(payload.encode()).hexdigest()[:12])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
status: checks_passed
evaluation: {'overall_mae': 5.3, 'normal_day_mae': 1.5, 'naive_one_step_mae': 23.6, 'alert_count': 1}
holdout coverage: 0.857
record sha256: 86802dec8f69
```
<!-- leetllm: output:end -->

The record keeps calibration evidence separate from holdout evidence. The displayed hash is only a short fingerprint of the serialized record; reproducibility also needs the actual input snapshot and implementation. None of these checks authorize a production <span data-glossary="rollout">rollout</span>.

Try a two-job half-width without changing the forecasts. Tuesday's `+3` now joins Friday's `+28` outside the band, so observed coverage drops to `5/7` and review volume doubles from one to two. Decide which additional evidence would tell you whether that extra review is worth its cost. Don't select the new threshold on this holdout and then reuse the same week as an unbiased evaluation.

## When the policy breaks

| Symptom | Possible explanation | Next investigation or change |
| --- | --- | --- |
| Earlier scores are good but launch-day errors are large | Missing event effects, a new launch regime, or optimistic evaluation | Audit origin-available inputs and launch slices; test a known-event covariate on later launches |
| Alerts fire every Monday | Sunday lull copied as Monday forecast | Switch from naive lag-1 to same-weekday seasonal lag-7 baseline |
| Narrow intervals repeatedly miss peaks | Bias, changing errors, or a weak interval model | Check later coverage and width; compare recent calibration or quantile models under their assumptions |
| Routine deployment triggers an on-call page | Missing context or genuinely urgent impact | Include launch context; retain pages for actionable, time-sensitive symptoms |
| Model learns a phantom demand spike | Duplicated at-least-once ingestion logs | Deduplicate on unique event IDs upstream before training feature tables |
| Flapping alerts repeatedly notify engineers | Jitter, duplicate delivery, or unstable state transitions | Inspect alert state, grouping, persistence, and notification deduplication |
| A brownout produces no alert | Missing symptoms, normal-looking marginals, detector blind spots, or delivery failure | Inspect data and delivery; test joint detectors alongside direct symptom alerts |
| Operations team ignores alert stream | Low precision or missing owner and triage context | Attach trace records, historical baselines, and ownership to alerts |

```mastery-quiz
[
  {
    "question": "A complete daily series ends at Sunday evening, index 41. A fixed-origin helper forecasts target index t by reading t−7. Which source and acceptance result follow for target indices 48 and 49?",
    "options": [
      "Index 41 accepted; index 42 accepted.",
      "Index 41 rejected; index 42 rejected.",
      "Index 41 accepted; index 42 rejected.",
      "Index 40 accepted; index 41 accepted."
    ],
    "answer": "Index 41 accepted; index 42 rejected.",
    "explanation": "Target 48 reads 41, which is observed. Target 49 reads 42, beyond the fixed origin 41, so this simple helper rejects it. A general seasonal-naive forecast could instead repeat the last observed season; it must not read the future observation at 42."
  },
  {
    "question": "A new Friday has level 120, seasonal offset 27, external scenario contribution 15 and observation 170. What additive prediction before the remainder and remainder follow?",
    "options": [
      "Prediction 162; remainder 8.",
      "Prediction 147; remainder 23.",
      "Prediction 170; remainder 0.",
      "Prediction 162; remainder −8."
    ],
    "answer": "Prediction 162; remainder 8.",
    "explanation": "The given terms add to 120+27+15=162. Actual minus that sum is 170−162=8. Omitting the external contribution, assigning the remainder before computing it, or reversing subtraction gives the other results. The 15-job effect is a scenario input, not an estimated causal effect."
  },
  {
    "question": "Four new forecast errors, defined as actual minus forecast, are [−2,4,−6,0] jobs. Which signed mean and MAE follow?",
    "options": [
      "Signed mean −1; MAE 1.",
      "Signed mean 1; MAE 3.",
      "Signed mean −4; MAE 12.",
      "Signed mean −1; MAE 3."
    ],
    "answer": "Signed mean −1; MAE 3.",
    "explanation": "The signed sum is −4, giving mean −1 over 4 forecasts. Absolute errors sum to 12, giving MAE 3. Absolute value after averaging allows cancellation, while omitting the denominator reports totals rather than means."
  },
  {
    "question": "At quantile q=0.8, forecast 80 is compared separately with actual 92 and actual 68. Which pinball losses follow in that order?",
    "options": [
      "2.4 and 9.6.",
      "9.6 and 2.4.",
      "9.6 and 9.6.",
      "12.0 and 12.0."
    ],
    "answer": "9.6 and 2.4.",
    "explanation": "Underprediction costs 0.8×12=9.6. Overprediction costs (1−0.8)×12=2.4. These are two alternative outcomes for one forecast, not additive costs for a single observed case."
  },
  {
    "question": "A fixed predictor has 18 held-out absolute scores. Target split-conformal coverage is 95%. A separate candidate has 19 scores. Which requested ranks and finite-width status follow for 18 then 19?",
    "options": [
      "Rank 18 finite; rank 19 finite.",
      "Rank 19 infinite; rank 20 infinite.",
      "Rank 19 infinite; rank 19 finite.",
      "Rank 18 finite; rank 18 finite."
    ],
    "answer": "Rank 19 infinite; rank 19 finite.",
    "explanation": "Ceiling((18+1)×0.95)=19 lies beyond 18 scores, so the construction uses infinity. Ceiling((19+1)×0.95)=19 is available among 19 scores. Exchangeability and predictor independence remain necessary for the usual marginal guarantee."
  },
  {
    "question": "An inspected PatchTST path uses lookback 256, patch length 16, stride 8 and one extra end-padded patch. How many tokens result, and what is the ratio of raw to patched attention-map entries for one channel?",
    "options": [
      "32 tokens; ratio 64.",
      "31 tokens; ratio 64.",
      "32 tokens; ratio 8.",
      "33 tokens; ratio 256/33."
    ],
    "answer": "32 tokens; ratio 64.",
    "explanation": "Floor((256−16)/8)+1 gives 31 unpadded patches; the extra patch gives 32. The map-entry ratio is 256²/32²=64. This counts one dense map and does not measure runtime speedup."
  },
  {
    "question": "ACI uses current working alpha 0.12, target alpha 0.10 and gamma 0.04. After an observed miss, then an observed covered outcome, what are the two successive working levels?",
    "options": [
      "0.116 then 0.080.",
      "0.156 then 0.152.",
      "0.084 then 0.080.",
      "0.084 then 0.088."
    ],
    "answer": "0.084 then 0.088.",
    "explanation": "The miss gives 0.12+0.04×(0.10−1)=0.084. The next covered outcome gives 0.084+0.04×(0.10−0)=0.088. Each update waits for its outcome. These working levels do not guarantee useful width or per-step conditional coverage."
  },
  {
    "question": "Start an inactive alert with zero counters. At minutes 0,5,10,15,20,25, errors are [6,7,None,0,1,8]. The half-width is 3, entry needs 2 consecutive breaches, clearing needs 2 consecutive clean values, and None resets both runs without clearing active state. Which transitions and final state follow?",
    "options": [
      "Review 5; clear 15; final inactive.",
      "Review 5; clear 20; final inactive.",
      "Review 5; clear 20; final active.",
      "Review 5; clear 10; final active."
    ],
    "answer": "Review 5; clear 20; final inactive.",
    "explanation": "Errors 6 and 7 enter at minute 5. Missing at 10 retains active but resets runs. Clean 0 and 1 clear at 20. The single breach 8 at 25 starts one breach run while inactive, so it does not reenter."
  },
  {
    "question": "A joint detector projects onto x2=x1 by replacing both coordinates with their mean, then sums squared reconstruction differences. What scores follow for new points (2,−2) and (4,4)?",
    "options": [
      "8 and 0.",
      "4 and 0.",
      "8 and 32.",
      "0 and 0."
    ],
    "answer": "8 and 0.",
    "explanation": "Point (2,−2) reconstructs to(0,0), giving 2²+(−2)²=8. Point (4,4) reconstructs exactly and scores 0 despite its large coordinates. Reconstruction can miss changes along a retained subspace."
  },
  {
    "question": "A fresh fully labeled set has 3 actionable alerted periods,2 non-actionable alerted periods and 1 missed actionable period. Which alert precision and recall follow?",
    "options": [
      "Precision 0.75; recall 0.60.",
      "Precision 0.60; recall 0.50.",
      "Precision 0.60; recall 0.75.",
      "Precision 0.50; recall 0.60."
    ],
    "answer": "Precision 0.60; recall 0.75.",
    "explanation": "Precision is TP/(TP+FP)=3/(3+2)=0.60. Recall is TP/(TP+FN)=3/(3+1)=0.75. The denominators answer different questions; alert-only labels cannot determine the missed-actionable count."
  }
]
```

> **Next:** Continue to [Monitoring Predictive Models](/learn/monitoring-predictive-models). A versioned forecast candidate turns unusual future errors into review artifacts. Monitoring puts that candidate on a live clock: <span data-glossary="feature-freshness">feature freshness</span>, delayed labels, and whether a newer model should replace or <span data-glossary="rollback">roll back</span> the current release.
