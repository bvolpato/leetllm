---
title: Probability calibration
importance: 82
---
**Probability calibration** is the match between a model's predicted probability of an event and the long-run frequency of that event on held-out data drawn from the same distribution. For a binary score $\hat{p}(x) \in [0,1]$ meant to be $P(Y=1 \mid x)$, perfect calibration means:

$$
\mathbb{P}\big(Y = 1 \mid \hat{p}(X) = p\big) = p
\quad \text{for supported score values }p\text{ (almost surely).}
$$

If the model says $0.80$ for many cases, about $80\%$ of those cases should actually be positive. One sample can be right or wrong at any score; the property lives in aggregates of similar scores. Softmax and sigmoid constrain outputs to $[0,1]$, while calibration measures how those scores match observed frequencies.

This is the classical *class-probability* notion used in binary risk scores, cost-sensitive thresholds, and late fusion of specialist heads. Closely related **confidence calibration** (common for multiclass nets) asks that among examples whose top-class probability is $c$, the top class is correct with frequency $c$. See [calibration](glossary://calibration) for that framing, reliability diagrams, and product gates. This entry focuses on making absolute probabilities trustworthy so "0.8" is a frequency claim that also supports ranking.

## Intuition

Ranking quality and probability calibration answer different questions:

| Property | Question answered | Enough for |
| --- | --- | --- |
| Ranking (e.g. ROC-AUC) | Do positives score higher than negatives? | Ordering candidates |
| Probability calibration | Does score $p$ mean frequency $p$? | Risk budgets, cost-based thresholds, fusion |

A model can separate classes well and still be miscalibrated. Modern nets often minimize [cross-entropy](glossary://cross-entropy) past the point of best 0/1 accuracy: after labels on the train set are mostly correct, further NLL reduction pushes mass toward $0$ or $1$ (Guo et al., ICML 2017). [Class imbalance](glossary://class-imbalance), distribution shift, [label noise](glossary://label-noise), and sampling temperature all pull reported probabilities away from true frequencies.

A score $\hat{p}=0.7$ is calibrated only if roughly $70\%$ of production-like examples assigned scores near $0.7$ are positive. Product policy that auto-blocks at "0.9 confidence" is defensible only if the corresponding score bucket is near $90\%$ positive on a representative holdout.

## Formula

### Reliability diagram (binary)

Bucket predictions by score into $M$ bins $B_1,\ldots,B_M$ (often equal-width on $[0,1]$). For each bin:

$$
\mathrm{conf}(B_m) = \frac{1}{|B_m|}\sum_{i \in B_m} \hat{p}_i,
\qquad
\mathrm{acc}(B_m) = \frac{1}{|B_m|}\sum_{i \in B_m} y_i
$$

(here $\mathrm{acc}$ is the observed positive rate, not multiclass top-1 accuracy). Plot $\mathrm{conf}$ on the $x$-axis and $\mathrm{acc}$ on the $y$-axis. Perfect calibration sits on the diagonal. Points below the diagonal are **overconfident** (score higher than frequency); points above are **underconfident**.

### Expected calibration error (ECE)

$$
\mathrm{ECE} = \sum_{m=1}^{M} \frac{|B_m|}{n}\,\lvert \mathrm{acc}(B_m) - \mathrm{conf}(B_m)\rvert
$$

Lower is better under a fixed binning. Maximum calibration error (MCE) is $\max_m \lvert \mathrm{acc}(B_m) - \mathrm{conf}(B_m)\rvert$ instead of the weighted average. Equal-width bins are unstable when mass piles near $0$ or $1$; prefer **equal-mass** (quantile) bins in that regime, or report both. ECE is also sensitive to bin count and can look fine globally while one slice (language, tenant, rare class) is badly off. Always plot the diagram and score by slice.

### Brier score (proper scoring rule)

For binary outcomes $y_i \in \{0,1\}$:

$$
\mathrm{BS} = \frac{1}{n}\sum_{i=1}^{n}(\hat{p}_i - y_i)^2
$$

Brier score and log loss reward both **calibration** and **discrimination** (Murphy decomposition). A lower Brier score can reflect stronger discrimination even when calibration worsens. Use ECE / reliability diagrams to isolate calibration, and Brier or log loss when you care about overall probabilistic quality.

### Post-hoc maps (fit on holdout, not train)

If ranking is already useful but absolute levels are wrong, fit a map on labeled data **disjoint** from base-model training:

**Platt scaling** (logistic / sigmoid map of raw score $f$):

$$
\hat{p} = \sigma(A f + B) = \frac{1}{1 + \exp(-(A f + B))}
$$

Fit $A,B$ by maximum likelihood on the calibration set (Platt, 1999; available in sklearn `CalibratedClassifierCV` with `method="sigmoid"`). Some references use $1/(1+\exp(Af+B))$ instead; that is the same family with both fitted parameter signs reversed.

**Temperature scaling** (Guo et al.): for logits $z$ (binary or multiclass vector), replace softmax inputs with $z/T$ for a single $T > 0$ learned by minimizing NLL on holdout:

$$
\hat{p} = \mathrm{softmax}(z / T)
$$

Argmax (and thus accuracy) is unchanged; only confidence softens ($T > 1$) or sharpens ($T < 1$). One parameter, strong default for modern nets when data is limited.

**Isotonic regression**: fit a monotone nondecreasing step map from score to frequency by minimizing squared error subject to order constraints. Flexible, needs more samples (often $\gtrsim 10^3$), can overfit small calibration sets and introduce score ties.

Never fit the map on the same rows used to train the base model. Recalibration cannot invent separation the base score lacks; it only remaps levels.

## Worked numbers

Ten holdout scores in one high-confidence bucket (bin $[0.80, 0.90]$):

| $\hat{p}_i$ | $y_i$ |
| ---: | ---: |
| 0.82, 0.84, 0.85, 0.86, 0.87 | 1, 0, 1, 0, 1 |
| 0.88, 0.88, 0.89, 0.89, 0.90 | 0, 1, 0, 0, 1 |

- Mean confidence: $\mathrm{conf} = 0.868$
- Observed positive rate: $\mathrm{acc} = 5/10 = 0.50$
- Gap: $|0.50 - 0.868| = 0.368$

If this bin holds $30\%$ of traffic, it alone contributes $0.30 \times 0.368 \approx 0.11$ to ECE. Auto-action at $\tau = 0.85$ selects eight of these ten rows; four selected rows are negatives. Precision at a threshold must be computed from the selected rows, rather than inferred from a bin that straddles the threshold.

Tiny Brier check on the same ten rows:

$$
\mathrm{BS} = \frac{1}{10}\sum_i (\hat{p}_i - y_i)^2 = 0.39
$$

A map that pulled these scores toward $0.5$ would reduce the measured gap and Brier score on these ten rows. Assess generalization by fitting the map on a calibration split and evaluating it on separate labeled data. A strictly increasing map preserves rank order.

## Example

A content-moderation head emits $p = P(\text{policy violation})$ for comments. Product policy:

- $p \ge 0.90$: auto-remove
- $0.60 \le p < 0.90$: human review queue
- $p < 0.60$: allow

On a production-like holdout of $10{,}000$ comments, the bucket $p \in [0.80, 0.90]$ contains $1{,}200$ items of which only $52\%$ are true violations. This shows miscalibration in that bucket. If the team proposes lowering auto-remove from $0.90$ to $0.85$, it must separately measure precision for rows with $p \ge 0.85$: the aggregate $52\%$ rate doesn't reveal how labels are distributed above that cutoff.

Fix path:

1. Freeze scores and labels on a calibration split (not train).
2. Plot the reliability diagram by language and content type.
3. Fit temperature scaling (or Platt) on the calibration split; re-check ECE and precision at the policy thresholds on a separate evaluation split.
4. Re-tune $\tau$ under explicit false-positive / false-negative costs (see [decision threshold](glossary://decision-threshold)).
5. Re-run after model, prompt, or traffic mix changes; stale maps silently reintroduce overconfidence.

```python
import numpy as np

def ece_binary(p: np.ndarray, y: np.ndarray, n_bins: int = 10) -> float:
    """Expected calibration error for binary probabilities p and labels y in {0,1}."""
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece, n = 0.0, len(p)
    for lo, hi in zip(bins[:-1], bins[1:]):
        # last bin includes 1.0
        mask = (p >= lo) & (p < hi if hi < 1.0 else p <= hi)
        if not np.any(mask):
            continue
        conf = float(p[mask].mean())
        acc = float(y[mask].mean())
        ece += (mask.sum() / n) * abs(acc - conf)
    return ece

# Temperature scaling for binary logit z: p = sigmoid(z / T)
def apply_temperature(z: np.ndarray, T: float) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-z / T))
```

## How it works

1. **Define the event.** Binary violation, tool-call success, answer correctness on a forced choice, or class membership. Calibration is always relative to a labeled event.
2. **Collect a holdout** that matches production traffic (mix, language, length, time). Keep base model, prompt, and decoding fixed while you measure.
3. **Choose the raw score.** Classifier: sigmoid / positive-class softmax. LLM: max token probability on a constrained choice, mean or min [logprob](glossary://logprob) over a short answer span, self-consistency vote share, or a dedicated confidence head. Verbalized "I am 90% sure" is often poorly calibrated versus logit-based scores; measure both if either enters policy.
4. **Bucket, plot, slice.** Equal-width bins for ECE; equal-mass bins when mass piles near $0$ or $1$. Slice by segment before trusting a global number.
5. **Map or retune.** If order is good but levels are wrong, post-hoc map then re-check thresholds. When order is weak, improve the base model or features before calibrating its scores.
6. **Gate and refresh.** Treat ECE / Brier / diagram as part of the offline eval gate. Recalibrate after model swap, fine-tune, temperature change, major prompt edit, or concept drift.


## Trade-offs

| Method | Strength | Cost / risk |
| --- | --- | --- |
| Temperature scaling | One parameter; preserves accuracy; good default | Cannot fix non-monotonic distortions |
| Platt (sigmoid) | Stable on small data; smooth map | Assumes sigmoid-shaped miscalibration |
| Isotonic | Flexible monotone map | Needs more data; ties; can overfit |
| No post-hoc map | Simpler serving | Absolute scores may lie even when ranks are fine |

Calibration maps stale under shift. A map fit on last month's traffic can under- or over-correct after a launch, a new language mix, or a judge prompt rewrite. Prefer re-fitting on fresh holdout over shipping frozen $T$ forever.

## Why it matters here

LLM and ML products turn scores into actions: auto-moderate, escalate, abstain, call a tool, or promote a candidate. Cost-based [decision thresholds](glossary://decision-threshold) of the form $\tau^{*} = c_{\mathrm{FP}}/(c_{\mathrm{FP}}+c_{\mathrm{FN}})$ only mean a risk budget when $\hat{p}$ is calibrated. Uncalibrated safety heads either block too much or miss harm. Uncalibrated model judges over-promote weak candidates. Uncalibrated agent confidence triggers side effects that should have waited for a human. Ranking metrics stay useful for ordering; probability calibration is what makes the number usable as an operational probability.

## Related terms

- [Calibration](glossary://calibration)
- [Decision threshold](glossary://decision-threshold)
- [ROC-AUC](glossary://roc-auc)
- [Softmax](glossary://softmax)
- [Abstention](glossary://abstention)
