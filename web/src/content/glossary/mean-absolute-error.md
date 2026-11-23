---
title: Mean absolute error
aliases: ["MAE", "L1 loss"]
importance: 80
---
**Mean absolute error (MAE)** is the average absolute gap between predictions and observed values. For $n$ paired outcomes $(y_i, \hat{y}_i)$:

$$
\mathrm{MAE} = \frac{1}{n}\sum_{i=1}^{n} |y_i - \hat{y}_i| = \frac{1}{n}\sum_{i=1}^{n} |e_i|
$$

where $e_i = y_i - \hat{y}_i$ is the signed [forecast error](glossary://forecast-error) (or residual, if you are scoring in-sample fits). Absolute value drops sign, so a $+10$ miss and a $-10$ miss contribute the same $10$. The result stays in the **same units** as the target: jobs per hour, dollars, tokens, degrees. Best value is $0$.

In training stacks the same quantity is often called **L1 loss** (for example PyTorch `nn.L1Loss` with `reduction='mean'`, or scikit-learn `mean_absolute_error`). As a metric and as a training objective it is the same formula; the difference is only whether you backpropagate through it or only report it.

## Intuition

Squared error (MSE / RMSE) grows with the square of a miss, so a few large outliers dominate the average. MAE grows linearly, so each unit of error costs one unit of score. That is the robustness story people mean when they prefer MAE over RMSE for "typical" error size.

There is a second, sharper fact from decision theory and forecasting practice (Hyndman & Athanasopoulos, *Forecasting: Principles and Practice*):

- A point forecast that **minimizes MAE** targets the **conditional median** of $y$.
- A point forecast that **minimizes RMSE** (or MSE) targets the **conditional mean**.

If the residual distribution is skewed (demand spikes, heavy right tails), mean and median diverge. Optimizing squared loss then reporting only MAE (or the reverse) can make two models look interchangeable when they answer different questions.

MAE is **scale-dependent**. You can compare methods on one series, or on many series that share units. You cannot rank a Celsius temperature model against a megawatt load model by raw MAE. For cross-series ranking, practice often moves to scaled errors such as MASE (mean absolute scaled error), which divides absolute forecast errors by the training MAE of a naive baseline.

## Formula

**Unweighted mean of absolute errors** (evaluation and default regression loss):

$$
\mathrm{MAE}(y, \hat{y}) = \frac{1}{n}\sum_{i=1}^{n} |y_i - \hat{y}_i|
$$

**Weighted MAE** when samples or time steps matter unequally (finite sample weights $w_i \ge 0$ with positive total weight; unweighted MAE requires $n>0$):

$$
\mathrm{MAE}_w = \frac{\sum_{i=1}^{n} w_i |y_i - \hat{y}_i|}{\sum_{i=1}^{n} w_i}
$$

**Relationship to RMSE.** With the same errors $e_i$:

$$
\mathrm{RMSE} = \sqrt{\frac{1}{n}\sum_{i=1}^{n} e_i^2}
$$

Always $\mathrm{RMSE} \ge \mathrm{MAE} \ge 0$. Equality holds when all absolute errors are identical. A large gap $\mathrm{RMSE} \gg \mathrm{MAE}$ is a cheap detector of uneven error magnitudes (outliers or a few bad slices).

**Subgradient note for training.** $|u|$ is not differentiable at $u=0$. Optimizers use a subgradient ($\mathrm{sign}(u)$ for $u \neq 0$, and any value in $[-1,1]$ at $0$). Smooth surrogates such as Huber / Smooth L1 blend squared behavior near zero with linear tails when you want stability plus outlier robustness.

## Worked numbers

Four forecast errors $e = (-1, 3, -2, 1)$:

| $e_i$ | $\lvert e_i\rvert$ | $e_i^2$ |
|------:|--------:|--------:|
| $-1$ | $1$ | $1$ |
| $3$ | $3$ | $9$ |
| $-2$ | $2$ | $4$ |
| $1$ | $1$ | $1$ |

$$
\mathrm{MAE} = \frac{1+3+2+1}{4} = 1.75, \qquad
\mathrm{MSE} = \frac{1+9+4+1}{4} = 3.75, \qquad
\mathrm{RMSE} = \sqrt{3.75} \approx 1.94
$$

Replace the $3$ with a $30$ (one bad week): absolute errors become $1, 30, 2, 1$ and squares $1, 900, 4, 1$.

$$
\mathrm{MAE} = \frac{34}{4} = 8.5, \qquad
\mathrm{RMSE} = \sqrt{\frac{906}{4}} \approx 15.05
$$

MAE is roughly $5\times$ larger; RMSE is roughly $8\times$ larger, showing that MAE is less sensitive to this outlier while still increasing substantially.

scikit-learn's canonical example matches the same definition:

```python
from sklearn.metrics import mean_absolute_error

y_true = [3, -0.5, 2, 7]
y_pred = [2.5, 0.0, 2, 8]
mean_absolute_error(y_true, y_pred)  # 0.5
```

## Example

Staffing forecast for chat volume next Tuesday 10-11am. Four consecutive weeks, forecasts vs actuals (conversations per hour):

| Week | $\hat{y}$ | $y$ | $e = y - \hat{y}$ | $\lvert e\rvert$ |
|------|----------:|----:|------------------:|------:|
| 1 | $120$ | $118$ | $-2$ | $2$ |
| 2 | $130$ | $145$ | $+15$ | $15$ |
| 3 | $125$ | $122$ | $-3$ | $3$ |
| 4 | $140$ | $138$ | $-2$ | $2$ |

$$
\mathrm{MAE} = \frac{2+15+3+2}{4} = 5.5 \text{ conversations/hour}
$$

Ops can read that directly: "off by about $5.5$ chats on average." A capacity buffer of $10$ covers a typical miss on this sample; week 2 still overruns. Pooled MAE hides that overrun. Report MAE by [forecast horizon](glossary://forecast-horizon), weekday, product line, and demand band (an [evaluation slice](glossary://evaluation-slice)), and pair the point score with [prediction intervals](glossary://prediction-interval) so planning can see tail risk alongside average absolute miss.

```python
import numpy as np

y = np.array([118.0, 145.0, 122.0, 138.0])
yhat = np.array([120.0, 130.0, 125.0, 140.0])
mae = float(np.mean(np.abs(y - yhat)))  # 5.5
```

If understaffing costs far more than idle seats, minimizing symmetric MAE can still produce the wrong operating point. Then use pinball / quantile loss for the service-level quantile you staff to, or an explicit cost table, and keep MAE as a readable companion metric.


## Trade-offs

| Property | What it buys you | What breaks |
| --- | --- | --- |
| Linear penalty | Interpretable "average size of miss"; robust to a few huge errors vs squared loss | Still rises when outliers appear; not a hard robust estimator like median absolute deviation alone |
| Same units as $y$ | Stakeholders and SLOs can compare MAE to buffers and capacity | Cannot compare raw MAE across different units or wildly different scales |
| Symmetric in over/under | Simple default when both sides cost the same | Stockouts vs overstock, false alarm vs miss, often need asymmetric loss |
| Median-optimal under pure MAE training | Natural for skewed $y$ if you want a central "typical" level | If the product needs the mean (unbiased totals, inventory buy that matches expected demand), MAE training is the wrong objective |
| Subgradient at zero | Usable as a training loss | Can be less smooth than MSE near zero; Huber is a common middle path |

**Production failure modes** that look like "MAE is fine":

1. **Pooled MAE masks slices.** Overall $5.5$ while peak weeks or cold-start SKUs sit at $40$. Gate on slice MAE alongside the global score.
2. **Train/serve objective mismatch.** Model trained on MSE (or a ranking/proxy loss) while the dashboard only shows MAE. Track both the training loss and the product metric.
3. **In-sample residuals sold as forecast accuracy.** MAE on fitted training residuals understates live multi-step error. Use holdout or [rolling-origin evaluation](glossary://rolling-origin-evaluation).
4. **Symmetric gate, asymmetric cost.** MAE treats $+15$ and $-15$ alike; the business may not.

## Why it matters here

Forecasting and regression lessons need a metric engineers can explain without converting units: "we are off by $X$ on average." MAE is that default scale-dependent score. It also forces a precise product conversation: median vs mean, symmetric vs asymmetric cost, global vs sliced error, and point accuracy vs interval coverage. Use it as a readable accuracy summary next to signed bias, RMSE (or another tail-sensitive score), and the business cost that actually decides capacity and alerts.

## Related terms

- [Forecast error](glossary://forecast-error)
- [Forecast horizon](glossary://forecast-horizon)
- [Prediction interval](glossary://prediction-interval)
- [Rolling-origin evaluation](glossary://rolling-origin-evaluation)
- [Evaluation slice](glossary://evaluation-slice)
