---
{
  "id": "conformal-prediction-uncertainty-sets",
  "title": "Conformal Prediction and Uncertainty",
  "slug": "conformal-prediction-uncertainty-sets",
  "section": "ML Algorithms & Evaluation",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Medium",
  "order": 7,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": ["OpenAI", "Anthropic", "Google", "Meta"],
  "shortDescription": "A 40 ms prediction can still miss a 50 ms deadline. Held-out errors set a finite-sample interval, and the average can hide the requests that miss.",
  "keyConceptsTested": ["split conformal prediction", "nonconformity scores", "finite-sample quantiles", "marginal coverage", "exchangeability", "calibration splits", "conditional coverage", "distribution shift"],
  "prerequisites": ["statistical-learning-theory-generalization", "statistics-estimation-uncertainty"]
}
---

A latency model predicts that the next request will finish in 40 milliseconds. Should a caller rely on a 50-millisecond deadline? A <span data-glossary="prediction-interval">prediction interval</span> such as `[32, 48]` adds information the point prediction lacks. The realized latency for one request can still fall outside the interval.

[Statistical Learning and Generalization](/learn/statistical-learning-theory-generalization) established why untouched evidence matters. Here the target changes. A confidence interval estimates a population quantity, such as mean latency. A prediction interval covers a new outcome.

Split <span data-glossary="conformal-prediction">conformal prediction</span> uses a held-out <span data-glossary="calibration">calibration</span> split to turn a frozen predictor's errors into prediction sets $C(X)$ without assuming Gaussian noise. Heavy tails alone do not prevent the guarantee. Bursty dependence and changing traffic can, because conformal prediction still needs a sampling assumption.[^angelopoulos2021conformal]

Under an exchangeability condition on the data, split conformal prediction guarantees that future outcomes fall inside the prediction set with at least a chosen probability:

$$
\Pr\!\left(Y_{n+1} \in C(X_{n+1})\right) \geq 1 - \alpha
$$

Here $\alpha\in(0,1)$ is the allowed miscoverage rate, such as $0.20$ for an 80% target. The probability averages over both calibration data and the new outcome, conditional on an independently fitted procedure. The rule is valid for any positive calibration size $n$, but a small sample can force an uninformative set such as the entire outcome space.

In the worked examples below, a latency predictor has already been trained and frozen; our task is to calibrate prediction sets around its point estimates.

## Freeze the model before measuring its errors

Before calculating a radius, decide which rows are allowed to influence it. Three slices play different roles:

| Split | Role | Prohibited shortcut |
|---|---|---|
| Training | Fit the latency model | Report training residuals as independent calibration |
| Calibration | Measure errors from the already-frozen model | Tune the model repeatedly against calibration outcomes |
| Test or deployment | Check interval coverage on new requests | Include those outcomes in the original coverage claim |

Keep calibration examples out of fitting and model selection, including preprocessing and scale estimation. Choose the prediction procedure and score rule independently of that split. Model selection can use separate validation data within the training workflow. Calibration then selects the score threshold; it does not retune the predictor.

For a 40-millisecond prediction, an observed 44 milliseconds gives an error of 4; an observed 53 gives an error of 13. A simple regression <span data-glossary="nonconformity-score">nonconformity score</span> records that miss as the absolute residual $s_i = |y_i - \widehat{y}_i|$. Larger scores mean the point prediction missed by more.

The finite-sample guarantee relies on <span data-glossary="exchangeability">exchangeable</span> calibration and future examples, conditional on the fitted procedure: their joint distribution is unchanged by permuting their positions. Formally, for $n$ calibration points and one future test point:

$$
(Z_1, \dots, Z_n, Z_{n+1}) \overset{d}{=} (Z_{\pi(1)}, \dots, Z_{\pi(n)}, Z_{\pi(n+1)})
$$

for every permutation $\pi \in S_{n+1}$, where $Z_i=(X_i,Y_i)$ and equality in distribution is denoted by $\overset d =$. Independent draws from the same distribution satisfy this condition; exchangeability is more general than independence. A queueing time series, diurnal traffic swings, or altered prompt distribution may not satisfy it. Shuffling an already shifted log does not restore the required joint law.[^barber2022exchangeability]

```checkpoint
A model was repeatedly tuned using the same nine examples later labeled as its calibration split. Why can't their residuals support the ordinary split-conformal guarantee?
---
Those outcomes influenced the model before calibration, so their residuals are no longer held-out measurements of a frozen predictor. Their apparent errors can be optimistically small, and the ordinary exchangeability argument for fresh request outcomes no longer follows.
```

## Let nine errors choose the radius

Our nine held-out requests produce these sorted absolute errors, measured in milliseconds. Which position should set the radius for the next request?

$$
[2, 3, 3, 4, 5, 6, 7, 8, 12]
$$

For 80% target coverage, allow a miscoverage rate of $\alpha = 0.20$. With nine calibration errors plus one future error, there are **ten possible rank positions**. Covering the first eight positions gives `8/10 = 80%`. The correction counts the future request as well as the calibration requests.

In general, with calibration size $n$, select the following residual <span data-glossary="quantile">quantile</span>. Its <span data-glossary="order-statistic">order statistic</span>, the value at a numbered position in the sorted sample, has rank:[^angelopoulos2021conformal]

$$
k = \left\lceil(n+1)(1-\alpha)\right\rceil = \lceil10 \times 0.8\rceil = 8
$$

The ceiling brackets mean round upward. For example, an 85% target would require $\lceil10 \times 0.85\rceil = 9$, not eight. At our 80% target, rank eight selects an 8 ms error. Call this selected radius $q$. A new prediction of 40 milliseconds therefore gets:

$$
[\widehat y - q, \widehat y + q] = [40 - 8, 40 + 8] = [32, 48]
$$

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="A frozen latency predictor supplies nine sorted calibration residuals: 2, 3, 3, 4, 5, 6, 7, 8, and 12 ms. For an 80% target, ceil((9 + 1) times 0.80) selects rank eight, so q is 8 ms. Of ten possible future-score ranks, the first eight meet q under distinct scores, giving at least 80% marginal coverage under exchangeability. A 40 ms prediction becomes [32, 48]; with nine residuals, a 95% target requires rank ten and an infinite threshold." />
  <figcaption>Freeze the predictor, sort its held-out residuals, and pick the corrected order statistic rank ceil((n+1)(1-alpha)). Under exchangeability, this guarantees at least 80% marginal coverage.</figcaption>
</figure>

The next cell constructs the absolute errors from frozen predictions and outcomes. Its helper selects an observed order statistic directly, avoiding interpolation between two residuals. Python index `rank - 1` converts the one-based rank to a zero-based list position.

<!-- leetllm: test, output=show, id=conformal-latency -->
```python title="calibrate-latency-prediction-interval.py"
from math import ceil, inf, isfinite

def conformal_radius(scores, coverage):
    if not 0 < coverage < 1:
        raise ValueError("coverage must be strictly between 0 and 1")
    ordered = sorted(scores)
    if not ordered or any(not isfinite(s) or s < 0 for s in ordered):
        raise ValueError("provide nonempty, finite, nonnegative scores")
    rank = ceil((len(ordered) + 1) * coverage)
    radius = ordered[rank - 1] if rank <= len(ordered) else inf
    return rank, radius

cal_predictions = [30, 35, 40, 45, 50, 55, 60, 65, 70]
cal_observed = [32, 32, 43, 41, 55, 49, 67, 57, 82]
residuals = sorted(abs(actual - guess)
                   for guess, actual in zip(cal_predictions, cal_observed, strict=True))
rank, radius = conformal_radius(residuals, coverage=0.80)
prediction = 40

print("sorted absolute errors:", residuals)
print(f"corrected rank: {rank} of {len(residuals)}")
print(f"calibration radius: {radius} ms")
print(f"prediction interval: [{prediction - radius}, {prediction + radius}] ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sorted absolute errors: [2, 3, 3, 4, 5, 6, 7, 8, 12]
corrected rank: 8 of 9
calibration radius: 8 ms
prediction interval: [32, 48] ms
```
<!-- leetllm: output:end -->

An implementation trap: a library quantile convention is not necessarily an order-statistic index. NumPy's `method="higher"` uses its own position formula. Feeding it level $8/9$ returns the **ninth** residual here, not the eighth. That radius is conservative in this example, but differs from the intended rule. Direct selection makes the rank explicit:[^numpyQuantile2026]

<!-- leetllm: test, output=show, id=conformal-library-quantile, deps=numpy -->
```python title="check-the-library-quantile-convention.py"
import numpy as np

scores_array = np.array([2, 3, 3, 4, 5, 6, 7, 8, 12])
desired_rank = 8
direct = np.partition(scores_array, desired_rank - 1)[desired_rank - 1]
higher = np.quantile(scores_array, desired_rank / len(scores_array), method="higher")
print(f"direct eighth order statistic: {direct}")
print(f"NumPy higher quantile at 8/9: {higher:g}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
direct eighth order statistic: 8
NumPy higher quantile at 8/9: 12
```
<!-- leetllm: output:end -->

The helper returns `inf` when the requested rank exceeds the available scores. That's deliberate, not a numerical failure. At 90% coverage the ninth error gives radius 12; at 95% the required rank is ten. The standard rule then uses $q=+\infty$, giving the entire real line rather than inventing a tenth error.[^angelopoulos2021conformal]

Check the boundary in code. Raising the target can only preserve or widen the interval:

<!-- leetllm: test, output=show, continue=conformal-latency, id=conformal-boundary -->
```python title="handle-an-unavailable-finite-quantile.py"
for coverage in (0.80, 0.90, 0.95):
    rank, q = conformal_radius(residuals, coverage)
    print(f"target={coverage:.0%} rank={rank} radius={q} width={2*q}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
target=80% rank=8 radius=8 width=16
target=90% rank=9 radius=12 width=24
target=95% rank=10 radius=inf width=inf
```
<!-- leetllm: output:end -->

Don't clip rank ten to nine: a largest-of-nine threshold supports a 90% lower bound in the no-ties case. With 19 calibration errors, 95% first becomes possible with a finite observed threshold: $\lceil20 \times 0.95\rceil = 19$. This is the mathematical minimum; a stable calibration sample may need more observations. Known bounds on the outcome could support other finite sets; the unavailable threshold here is specific to this residual-quantile construction.

```checkpoint
Why does the example choose the eighth residual instead of simply multiplying nine by 0.8 and rounding down?
---
The finite-sample conformal rank is ceil((n+1)(1-alpha)). For nine calibration rows and 80% coverage, that is ceil(10 times 0.8), which selects the eighth order statistic.
```

## Why the extra rank gives coverage

Temporarily imagine ten **distinct** scores, one from the future request and nine from calibration. Exchangeability makes the future request equally likely to occupy any of the ten sorted positions. Its score is no larger than the eighth calibration score exactly when it lands in positions one through eight.

You can inspect every possible test position without a random simulation. The following scores are a separate rank-only example, not additional latency measurements. Each pass holds out one score and calibrates on the remaining nine:

<!-- leetllm: test, output=show, continue=conformal-boundary, id=conformal-ranks -->
```python title="enumerate-the-ten-possible-test-ranks.py"
scores = list(range(1, 11))
covered_positions = []

for index, test_score in enumerate(scores):
    calibration = scores[:index] + scores[index + 1:]
    _, q = conformal_radius(calibration, coverage=0.80)
    if test_score <= q:
        covered_positions.append(index + 1)

print("covered test ranks:", covered_positions)
print(f"covered positions: {len(covered_positions)}/{len(scores)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
covered test ranks: [1, 2, 3, 4, 5, 6, 7, 8]
covered positions: 8/10
```
<!-- leetllm: output:end -->

These calibration residuals include tied errors at 3 ms. Ties don't invalidate the lower coverage bound when the set includes the boundary (`score <= q`); they can make coverage conservative. Don't discard tied rows or promise exact 80% coverage. When scores are almost surely distinct (continuous nonconformity scores), conformal prediction also provides a tight upper bound on coverage:

$$
1 - \alpha \leq \Pr\!\left(Y_{\mathrm{new}} \in C(X_{\mathrm{new}})\right) \leq 1 - \alpha + \frac{1}{n+1}
$$

For the unmodified rank rule with almost surely distinct scores, coverage is exactly $k/(n+1)$: here $8/10=80\%$. The displayed 80–90% bound is a looser general expression. With ties, only the lower bound is assured; for example, all scores equal to zero can give 100% coverage. Neither statement conditions on the particular realized calibration sample. Predictor quality affects interval usefulness, even when the rank guarantee remains valid.[^lei2018conformalRegression]

The bound is about many draws of the calibration sample and a new outcome. If we freeze this 8 ms radius, which of the next few requests does it actually cover?

## Watch coverage appear in new requests

The interval `[32, 48]` covers an actual 44-millisecond outcome and misses 53 milliseconds. This request shows the rule's output; estimate coverage across new comparable examples.

Keep the 80% radius of 8 ms fixed and inspect four newly observed requests. Each request gets an interval centered on its own point prediction, so compare each realized latency against its endpoints below.

<figure>
  <img src="illustrations/_generated/future_coverage_dark.png" alt="Four held-out latency examples compare intervals centered on predictions. With the calibrated fixed radius of 8 ms, A, B, and C are covered and D at 55 ms misses the upper bound 52 ms, for 3 of 4. A separately calibrated normalized rule uses q=2 and fixed scales 3, 3.5, 2, and 6 ms; its intervals are [34,46], [35,49], [34,42], and [32,56], covering all four requests. A four-row evaluation illustrates interval geometry; comparing population coverage requires a larger held-out sample." />
  <figcaption>Each dot is a new observed latency; each segment is its prediction set. These four requests illustrate how fixed and normalized intervals behave on individual examples.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=conformal-ranks, id=conformal-held-out -->
```python title="measure-held-out-interval-coverage.py"
predictions = [40, 42, 38, 44]
observed = [44, 48, 35, 55]

covered = [abs(actual - guess) <= radius
           for guess, actual in zip(predictions, observed, strict=True)]
for guess, actual, is_covered in zip(predictions, observed, covered):
    print(f"predicted={guess} actual={actual} covered={is_covered}")

print(f"observed coverage: {sum(covered)}/{len(covered)}")
print(f"interval width: {2 * radius} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
predicted=40 actual=44 covered=True
predicted=42 actual=48 covered=True
predicted=38 actual=35 covered=True
predicted=44 actual=55 covered=False
observed coverage: 3/4
interval width: 16 ms
```
<!-- leetllm: output:end -->

A four-row observed coverage of 75% doesn't contradict an 80% <span data-glossary="marginal-coverage">marginal coverage</span> guarantee. Four requests are a noisy sample, so the observed fraction can move around the target.

Two sources of variation exist: this calibration sample selected one particular radius, and the four test outcomes are another small sample. Standard split conformal gives marginal coverage across calibration samples and future examples. For one realized calibration set, coverage can vary even across a very large test set.[^angelopoulos2021conformal]

Absolute residuals fit a miss measured in milliseconds. A classifier doesn't have that kind of residual. The same rank rule can still build a set if the score says how strange a candidate label is.

## Classification nonconformity scores and adaptive prediction sets

Under the same exchangeability condition, conformal classification returns a set of candidate labels $C(X) \subseteq \mathcal{Y}$ with marginal coverage of at least $1 - \alpha$. The new choice is the score. One score can return an empty set. Another can return every label. Coverage can still hold in both cases.

Different nonconformity scores produce different set behaviors:

1. **Naive softmax score:** Let $\widehat{f}(x)_y$ denote the model's estimated probability for class $y$. The score is $s(x, y) = 1 - \widehat{f}(x)_y$. After computing threshold $\widehat{q}$ on calibration data, the prediction set includes all classes whose predicted probability is at least $1 - \widehat{q}$:

$$
C(X) = \left\{y \in \mathcal{Y} : \widehat{f}(X)_y \geq 1 - \widehat{q}\right\}
$$

When a query is ambiguous and the model distributes probability thinly across many classes (for example, four classes near 0.25), no single class may exceed $1 - \widehat{q}$. That produces an empty prediction set $C(X) = \emptyset$.

2. **Cumulative scores used in Adaptive Prediction Sets (APS):** Let $c_1(x),\ldots,c_K(x)$ be **class labels** sorted by descending model output, with a fixed tie rule, and let $p_{c_j}(x)$ be their probabilities. If $y=c_r(x)$, the deterministic cumulative score is:[^romano2020AdaptiveCoverage]

$$
s(x,y)=\sum_{j=1}^{r}p_{c_j}(x),\qquad y=c_r(x).
$$

Calibrate this score using its own held-out true labels. Direct inversion gives $C_{\mathrm{base}}(x)=\{y:s(x,y)\le\widehat q\}$. This can be empty when even the top class probability exceeds $\widehat q$.

A simple **conservative** variant includes labels through the first cumulative sum strictly greater than $\widehat q$, or all labels if no crossing exists:

$$
C_{\mathrm{cons}}(x)=\{c_1(x),\ldots,c_m(x)\},\qquad
m=\min\left(\left\{j:\sum_{i=1}^j p_{c_i}(x)>\widehat q\right\}\cup\{K\}\right).
$$

This is a nonempty superset of the directly inverted set, so it preserves the lower coverage guarantee while potentially increasing size. A randomized APS construction can remove the crossing class, sometimes producing an empty set; its calibration must match that randomized score.[^romano2020AdaptiveCoverage] Model outputs need not be well-calibrated probabilities for conformal validity, and a small set size alone never certifies that the included label is correct.

Evaluate two new inputs after calibrating on nine held-out examples whose true label is class 0, using a frozen classifier whose predicted scores are shown below:

<!-- leetllm: test, output=show, continue=conformal-held-out, id=conformal-classification -->
```python title="keep-class-labels-separate-from-probabilities.py"
def cumulative_scores(probabilities):
    order = sorted(range(len(probabilities)), key=lambda c: (-probabilities[c], c))
    mass = 0.
    scores = {}
    for label in order:
        mass += probabilities[label]
        scores[label] = mass
    return order, scores

cal_top = [.55, .60, .65, .70, .75, .80, .85, .90, .95]
cal_probabilities = [[p, (1-p)/3, (1-p)/3, (1-p)/3] for p in cal_top]
_, q_soft = conformal_radius([1-row[0] for row in cal_probabilities], .80)
_, q_aps = conformal_radius([cumulative_scores(row)[1][0]
                            for row in cal_probabilities], .80)
print(f"softmax threshold score: {q_soft:.2f}")
print(f"cumulative threshold score: {q_aps:.2f}")

for name, probabilities in [("confident", [.98, .01, .005, .005]),
                            ("ambiguous", [.25, .25, .25, .25])]:
    order, scores = cumulative_scores(probabilities)
    naive = [c for c in order if 1-probabilities[c] <= q_soft]
    base = [c for c in order if scores[c] <= q_aps]
    conservative = []
    for label in order:
        conservative.append(label)
        if scores[label] > q_aps:
            break
    assert set(base) <= set(conservative)
    print(f"{name}: naive={naive} cumulative={base} conservative={conservative}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
softmax threshold score: 0.40
cumulative threshold score: 0.90
confident: naive=[0] cumulative=[] conservative=[0]
ambiguous: naive=[] cumulative=[0, 1, 2] conservative=[0, 1, 2, 3]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/classification_confident_query_dark.png" alt="For probabilities [0.98, 0.01, 0.005, 0.005], a softmax threshold p≥0.60 keeps class 0. The APS cumulative scores start at 0.98, above q=0.90, so direct APS returns an empty set. The conservative crossing rule includes class 0." />
  <figcaption>The confident class clears the softmax threshold. APS starts above its cutoff, so the conservative rule keeps the first crossing class.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/classification_set_shapes_dark.png" alt="For four equal probabilities of 0.25, a softmax threshold p≥0.60 keeps no class. Cumulative APS scores reach 0.75 after class 2 and cross q=0.90 at class 3, so direct APS keeps classes 0–2 and the conservative crossing rule keeps all four." />
  <figcaption>Flat probabilities create three different set sizes at the same calibrated target: empty, three classes, and all four.</figcaption>
</figure>

The same marginal target can still produce an empty set, a singleton, or the full label list. That is a disagreement about set shape. A similar split shows up when you separate the latency requests by type: the average can look safe while one group's coverage remains low.

```checkpoint
Does every APS implementation guarantee nonempty prediction sets?
---
No. Direct inversion of cumulative-through-label scores can be empty, and randomized APS can remove the crossing label. The conservative superset shown here is nonempty by construction. Its larger sets retain the lower marginal coverage guarantee, not exact coverage or certainty about their labels.
```

## Find the traffic the average hides

The four-row result measures overall empirical coverage. Breaking that count down by request type asks a different question: who receives the misses?

Standard split conformal gives marginal coverage across the exchangeable population. Subgroup or individual-feature coverage can differ. Consider an evaluation slice with 750 short and 250 long requests. Short requests have 96% coverage; long requests have only 54%. The weighted average still exceeds 80%:

$$
\frac{750(0.96) + 250(0.54)}{1000} = 0.855
$$

These counts expose what an aggregate metric can hide. If the incoming traffic mix shifted to half short and half long while those subgroup rates stayed the same, overall coverage would fall to `0.5 * 0.96 + 0.5 * 0.54 = 75%`. The old population guarantee would not transfer automatically to that shifted mix.[^barber2022exchangeability]

<figure>
  <img src="illustrations/_generated/conditional_coverage_dark.png" alt="An evaluation slice has 750 short requests at 96% coverage, or 720 covered and 30 missed, and 250 long requests at 54%, or 135 covered and 115 missed. The observed 75/25 mix gives 85.5% aggregate coverage, above an 80% target despite weak long-request coverage. Keeping both group rates fixed but changing the mix to 50/50 gives 75% overall coverage." />
  <figcaption>The aggregate clears 80% because short requests dominate the observed mix. The same subgroup rates miss that target when request types arrive in equal proportions.</figcaption>
</figure>

```checkpoint
An 80% conformal target passes across all traffic, but long requests are covered only 54% of the time. Does the population-wide guarantee refute the long-request measurement?
---
No. Standard split conformal guarantees marginal coverage across the exchangeable population, not equal conditional coverage for every prompt-length subgroup. A common well-covered group can keep the aggregate above target while a smaller long-request group remains unsafe.
```

Different failures call for different repairs:

| Failure | Symptom | Appropriate response |
|---|---|---|
| Model trained on calibration rows | Residuals look too small | Refit with a genuinely separate calibration split |
| Prompt lengths shift after launch | Recent interval misses cluster on long prompts | Investigate the shift; fresh calibration helps only if its assumptions fit subsequent traffic |
| Tenant-specific error differs | Overall coverage passes while one tenant fails | Measure subgroup coverage; consider separately calibrated, predefined groups |
| Noise grows with request size | Constant intervals are too narrow for large requests | Use normalized nonconformity scores or group-aware methods |
| Calibration sample is tiny | Desired rank exceeds available observations | Gather more data or acknowledge an unbounded set |

Adaptive scaling is another option. A second frozen model can predict a positive scale $a(x)$ in milliseconds. The scale can reflect input-specific error size without matching the true conditional standard deviation. Calibrate the dimensionless scores $|y-\widehat f(x)|/a(x)$, then use $\widehat f(x)\pm q\,a(x)$. Both models and the score rule must be fixed independently of calibration. The method adapts interval width; its coverage guarantee remains marginal.[^lei2018conformalRegression]

For the right side of the figure, take the precomputed outputs `cal_scales` and `test_scales` from an independently frozen scale predictor. Because the calibration split can be scored under any fixed nonconformity rule chosen ahead of time, normalizing each residual by its input scale adapts interval width to request difficulty without tuning on calibration outcomes:

<!-- leetllm: test, output=show, continue=conformal-classification, id=conformal-normalized -->
```python title="calibrate-the-normalized-rule-separately.py"
cal_scales = [2, 2, 2, 2, 3, 3, 4, 4, 4]
normalized = [abs(actual - guess) / scale
              for guess, actual, scale in
              zip(cal_predictions, cal_observed, cal_scales, strict=True)]
_, q_normalized = conformal_radius(normalized, .80)
print(f"normalized threshold: {q_normalized:.1f}")

test_scales = [3, 3.5, 2, 6]
for guess, actual, scale in zip(predictions, observed, test_scales, strict=True):
    adaptive_radius = q_normalized * scale
    lower, upper = guess - adaptive_radius, guess + adaptive_radius
    covered = abs(actual - guess) <= adaptive_radius
    print(f"prediction={guess} scale={scale:g} interval=[{lower:g}, {upper:g}] covered={covered}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
normalized threshold: 2.0
prediction=40 scale=3 interval=[34, 46] covered=True
prediction=42 scale=3.5 interval=[35, 49] covered=True
prediction=38 scale=2 interval=[34, 42] covered=True
prediction=44 scale=6 interval=[32, 56] covered=True
```
<!-- leetllm: output:end -->

These four rows favor the adaptive rule. Compare population performance on a separate evaluation sample. A miss can have several explanations, so assess heteroscedasticity across repeated observations.

A wider interval can still be the wrong tool when the decision is whether to send an automated answer. The costly event is then a wrong answer that went out, not a latency that fell outside the interval.

## Define the loss before using conformal triage

That decision needs a loss, not only a coverage target. **Conformal risk control (CRC)** extends the finite-sample correction to certain expected losses. Its basic theorem needs exchangeable loss curves $L_i(\lambda)$ that are bounded, non-increasing in a conservativeness parameter $\lambda$, and right-continuous, with a maximally conservative setting whose loss is at most the target. For losses in $[0,1]$, define $\widehat R_n(\lambda)=n^{-1}\sum_iL_i(\lambda)$. The correction is:[^angelopoulos2022ConformalRiskControl]

$$
\widehat\lambda=\inf\left\{\lambda:
\frac{n}{n+1}\widehat R_n(\lambda)+\frac{1}{n+1}\le\alpha\right\}.
$$

If no setting meets that inequality, use the specified maximally conservative fallback. Under the theorem's assumptions, $\mathbb E[L_{\mathrm{new}}(\widehat\lambda)]\le\alpha$. This averages over calibration and the new example; it is not a high-probability certificate conditional on the realized calibration set. Arbitrary non-monotone bounded losses do not receive this guarantee from the same rule.

For a language-model router, distinguish two targets:

| Target | Loss or rate | What it measures |
|---|---|---|
| Incorrect automated answers per incoming request | $\Pr(\mathrm{accepted}\ \text{and}\ \mathrm{wrong})$ | Joint error across all requests |
| Incorrect answers among automated answers | $\Pr(\mathrm{wrong}\mid\mathrm{accepted})$ | Selective error among accepted requests |

Making acceptance stricter can produce a monotone per-request indicator for the **joint** error, assuming the answer and verifier scores are otherwise fixed. The selective rate divides by acceptance probability, which also changes; it need not be monotone and needs an analysis aimed at that conditional target. A verifier's entropy or critic score alone is not a truth label. Reliable calibration labels and a stable generation/verifier procedure are still needed.

Make the correction concrete with a separate nine-row calibration split. Accept an answer only when its frozen verifier score is **strictly greater** than $\lambda$; its loss is 1 if accepted and wrong, otherwise 0. This loss decreases as $\lambda$ increases and drops at the score itself, matching right-continuity. Because CRC only assumes monotone bounded losses, these uncalibrated verifier scores work without probability calibration. For target joint risk $\alpha=0.25$, CRC requires $(\text{accepted mistakes}+1)/10\le0.25$, so at most one calibration mistake may remain.

<!-- leetllm: test, output=show -->
```python title="calibrate-a-monotone-joint-error-rule.py"
rows = [(.1, True), (.6, True), (.9, True),
        (.2, False), (.3, False), (.4, False),
        (.5, False), (.7, False), (.8, False)]  # (score, wrong)
n, alpha = len(rows), .25
candidates = sorted({0., 1., *(score for score, _ in rows)})

def mistakes(threshold):
    return sum(score > threshold and wrong for score, wrong in rows)

uncorrected = next(t for t in candidates if mistakes(t) / n <= alpha)
corrected = next((t for t in candidates
                  if (mistakes(t) + 1) / (n + 1) <= alpha), 1.)
accepted = sum(score > corrected for score, _ in rows)
errors = mistakes(corrected)
assert uncorrected == .1 and corrected == .6
assert errors == 1 and accepted == 3
print(f"uncorrected threshold: {uncorrected:.1f}")
print(f"CRC threshold: {corrected:.1f}; corrected criterion: {(errors+1)/(n+1):.0%}")
print(f"calibration joint error: {errors}/{n} = {errors/n:.1%}")
selective = f"{errors/accepted:.1%}" if accepted else "undefined (none accepted)"
print(f"calibration error among accepted: {errors}/{accepted} = {selective}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
uncorrected threshold: 0.1
CRC threshold: 0.6; corrected criterion: 20%
calibration joint error: 1/9 = 11.1%
calibration error among accepted: 1/3 = 33.3%
```
<!-- leetllm: output:end -->

With $\lambda=0.1$, two accepted mistakes give empirical joint error $2/9\approx22.2\%$, but the corrected criterion is $3/10=30\%$ and fails the 25% target. The corrected threshold 0.6 leaves one mistake among three accepted answers: joint error is 11.1%, while selective error is 33.3%. These are calibration counts, not future error measurements. The theorem controls expected future **joint** loss under its assumptions, even though the observed selective rate can exceed the target. Threshold 1 accepts none and supplies the zero-loss fallback if no candidate passes the correction.

Singleton prediction sets illustrate the same distinction. Suppose 100 test prompts in a math-versus-code router yield 90 two-label sets that contain the true class and 10 singleton sets that confidently select the wrong label:

<!-- leetllm: test, output=show -->
```python title="marginal-coverage-does-not-certify-accepted-answers.py"
prediction_sets = [{"code", "math"} for _ in range(90)]
prediction_sets += [{"code"} for _ in range(10)]
true_labels = ["math"] * 100

covered = [truth in labels
           for truth, labels in zip(true_labels, prediction_sets, strict=True)]
accepted = [len(labels) == 1 for labels in prediction_sets]
wrong_accepted = [auto and not hit for auto, hit in zip(accepted, covered, strict=True)]

print(f"marginal coverage: {sum(covered)/100:.0%}")
print(f"acceptance rate: {sum(accepted)/100:.0%}")
print(f"joint error per request: {sum(wrong_accepted)/100:.0%}")
print(f"error among accepted: {sum(wrong_accepted)/sum(accepted):.0%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
marginal coverage: 90%
acceptance rate: 10%
joint error per request: 10%
error among accepted: 100%
```
<!-- leetllm: output:end -->

Even when overall marginal coverage hits 90%, every accepted singleton is wrong (`10/10 = 100%`). Prediction set size $|C(X)|$ is still useful for routing ambiguous queries to a larger verifier or human review, because multi-label sets flag uncertainty, while guaranteeing error on the accepted subset `|C(X)| = 1` requires calibrating a selective risk threshold specifically for that target.

```checkpoint
An 80% marginally valid classifier produces a singleton set on a new input. Does that guarantee the singleton's selective accuracy is at least 80%?
---
No. Marginal coverage averages across all inputs, both singletons and larger sets. Conditioning on `|C(X)| = 1` picks out a specific subset whose conditional error can be much higher unless the calibration procedure explicitly controls selective or conditional risk.
```

## Put the interval width next to the percentage

A coverage number without interval width is incomplete. An interval spanning the entire outcome space never misses, but it can't guide a 50-millisecond deadline.

Return to the deadline question. `[32, 48]` sits below 50 ms, but the 80% marginal guarantee doesn't mean this request has an 80% conditional chance of meeting its deadline. Selecting only requests with upper endpoints below 50 also creates a subgroup; ordinary marginal validity alone doesn't certify that selected group's failure rate.

For monitoring, retain the model and calibration versions, each interval, actual outcome, request group, and width. Inspect counts as well as percentages. A scorecard with two long requests cannot yield a reliable subgroup rate, and no finite log proves that future traffic will stay exchangeable.

> **Key insight:** Conformal prediction guarantees **marginal** coverage across the exchangeable population, never equal coverage inside every subgroup or every accepted subset. Always pair aggregate coverage with interval width, subgroup slices, and selective risk when routing decisions depend on set size.

Test your intuition with four quick perturbations to the cells above:

| Experiment | Expected result and interpretation |
|---|---|
| Change the eighth sorted calibration error from 8 to 9 | Rank stays eight; radius becomes 9 and the 40 ms interval becomes `[31, 49]`. Rank and value are different quantities. |
| Change the fourth test outcome from 55 to 52 | All four outcomes are covered because endpoints are included. Four covered rows leave future coverage uncertain. |
| Clip the 95% rank to nine | The code would return radius 12, hiding that the ordinary finite-sample rule required infinity. A finite output isn't evidence of a valid 95% guarantee. |
| Compare the short/long report under a 75/25 versus 50/50 mix | Aggregate coverage changes from 85.5% to 75% even with identical subgroup rates. |

```mastery-quiz
[
  {
    "question": "A team chooses its model after inspecting errors on set A. Set B remains untouched, and B and future requests are exchangeable conditional on the final frozen procedure. Which calibration plan preserves the ordinary split-conformal argument?",
    "options": [
      "Freeze after using A; calibrate on A because its errors are known.",
      "Freeze after using A; calibrate the fixed rule on untouched B.",
      "Select the model using B; calibrate on B after that selection.",
      "Freeze after using A; calibrate on B’s easiest observed outcomes."
    ],
    "answer": "Freeze after using A; calibrate the fixed rule on untouched B.",
    "explanation": "Set A participated in selection and is not an independent held-out calibration set. The stated exchangeability assumption applies to untouched B and the new example after freezing the procedure. Reusing selection outcomes or choosing easy calibration rows breaks that exchangeability guarantee."
  },
  {
    "question": "Fourteen calibration residuals are the integers 1 through 14 ms. Desired marginal coverage is 90%, and a new point prediction is 60 ms. What rank, radius and interval follow?",
    "options": [
      "Rank 13; radius 13; [47,73] ms.",
      "Rank 15; infinite radius; the real line.",
      "Rank 14; radius 7; [53,67] ms.",
      "Rank 14; radius 14; [46,74] ms."
    ],
    "answer": "Rank 14; radius 14; [46,74] ms.",
    "explanation": "The corrected rank is ceil((14+1)×.90)=ceil(13.5)=14. The fourteenth observed residual is 14, so subtract and add it around 60. Flooring, halving the score or selecting an unavailable rank changes the rule."
  },
  {
    "question": "Two evaluations use the same frozen predictor, score rule and coverage target. All requests are independent draws from one population. Evaluation A sets its radius once using 50 calibration requests. Evaluation B sets a new radius using 50 fresh calibration requests for each test request. As the evaluations collect more test requests, whose observed coverage converges in general to the probability in the ordinary split-conformal guarantee?",
    "options": [
      "Evaluation A only.",
      "Both evaluations.",
      "Evaluation B only.",
      "Neither evaluation."
    ],
    "answer": "Evaluation B only.",
    "explanation": "The guarantee averages over both the calibration sample and the next request. Evaluation B samples both on every trial. Evaluation A learns the coverage of the particular radius it selected. More test requests make that estimate more precise. The predictor can stay frozen in both evaluations because the guarantee applies after fitting."
  },
  {
    "question": "An evaluation slice has short-request coverage 95% and long-request coverage 65%. The short/long mix changes from 80/20 to 20/80, with both subgroup rates fixed. What are the old and new aggregate coverage rates?",
    "options": [
      "Old 80%; new 80%.",
      "Old 71%; new 89%.",
      "Old 89%; new 71%.",
      "Old 95%; new 65%."
    ],
    "answer": "Old 89%; new 71%.",
    "explanation": "The old weighted rate is .8×.95+.2×.65=.89. The new one is .2×.95+.8×.65=.71. Averaging the two rates without mixture weights, reversing the weights or reporting only a subgroup loses the population denominator."
  },
  {
    "question": "Fourteen calibration scores and one future score are exchangeable, and all 15 are distinct with probability one. For a 95% target, which rank and radius does the ordinary split-conformal residual rule require? What marginal coverage would using the largest calibration score as the radius give?",
    "options": [
      "Rank 14, radius equal to the calibration maximum, 14/15 coverage with the maximum.",
      "Rank 15, infinite radius, 14/15 coverage with the maximum.",
      "Rank 15, radius equal to the calibration maximum, 14/15 coverage with the maximum.",
      "Rank 15, infinite radius, 100% coverage with the maximum."
    ],
    "answer": "Rank 15, infinite radius, 14/15 coverage with the maximum.",
    "explanation": "Counting the future score gives 15 positions. Rounding 15 × 0.95 = 14.25 up gives rank 15. The calibration sample ends at rank 14, so the ordinary rule uses an infinite radius. Clipping to the largest observed score covers all 14 calibration scores but misses when the future score is the largest of the 15. Each distinct future rank is equally likely. Across draws, the clipped radius covers 14/15, about 93.3%."
  },
  {
    "question": "A separately calibrated normalized rule has q=1.5. Its frozen scale predictor gives 2 ms for a 20 ms point and 8 ms for a 50 ms point. Which two intervals and guarantee scope follow?",
    "options": [
      "[18,22] and [42,58] ms; marginal coverage under the assumptions.",
      "[17,23] and [38,62] ms; equal conditional coverage for both inputs.",
      "[18.5,21.5] and [48.5,51.5] ms; equal conditional coverage for both inputs.",
      "[17,23] and [38,62] ms; marginal coverage under the assumptions."
    ],
    "answer": "[17,23] and [38,62] ms; marginal coverage under the assumptions.",
    "explanation": "Multiply the dimensionless threshold by each positive scale: radii are 3 and 12 ms. Input-adaptive widths vary with request difficulty, yet they still guarantee only marginal coverage unless calibrated conditionally. Using the scale alone or ignoring it changes the construction."
  },
  {
    "question": "For a new classifier row [0.8,0.1,0.1], separately calibrated score thresholds are q_soft=0.4 and q_cumulative=0.75. What are the class-ID sets from the individual softmax rule, direct cumulative inversion and conservative crossing rule?",
    "options": [
      "Softmax [0]; direct []; conservative [0].",
      "Softmax [0]; direct [0]; conservative [0,1].",
      "Softmax [0]; direct [1,2]; conservative [0,1,2].",
      "Softmax []; direct []; conservative [0]."
    ],
    "answer": "Softmax [0]; direct []; conservative [0].",
    "explanation": "The individual score keeps probabilities at least .6, so it keeps class 0. Cumulative scores start at .8, already above .75, so direct inversion is empty. The first crossing label is class 0, which the conservative variant retains. Candidate identities, not probability values, populate the sets."
  },
  {
    "question": "A router uses conformal risk control for wrong answers sent per incoming request. The assumptions for the correction hold. Of 19 calibration requests, it accepts 8 answers at threshold 0.25, including 3 wrong answers. At threshold 0.75 it accepts 4, including 2 wrong answers. For a joint risk target of 16%, which listed threshold first passes the corrected criterion, and what is its observed selective error?",
    "options": [
      "Threshold 0.75; selective error 2/4.",
      "Threshold 0.25; selective error 3/19.",
      "Threshold 0.25; selective error 3/8.",
      "Threshold 0.75; selective error 2/19."
    ],
    "answer": "Threshold 0.75; selective error 2/4.",
    "explanation": "At threshold 0.25, the raw fraction 3/19 is below 16%, but the corrected value (3 + 1)/20 is 20%, so that threshold fails. At 0.75, the corrected value (2 + 1)/20 is 15%, which passes. Two of the four accepted answers were wrong, giving a selective error of 2/4. Dividing by 19 gives joint error across all arrivals at either threshold."
  },
  {
    "question": "A router accepts 250 of 1,000 requests, and 25 accepted answers are wrong. What joint wrong-and-accepted rate and error among accepted answers follow?",
    "options": [
      "Joint 10%; selected error 2.5%.",
      "Joint 2.5%; selected error 2.5%.",
      "Joint 25%; selected error 10%.",
      "Joint 2.5%; selected error 10%."
    ],
    "answer": "Joint 2.5%; selected error 10%.",
    "explanation": "Both error rates count the same 25 wrong answers. Joint error uses all 1,000 arrivals, so it is 25/1,000 = 2.5%. Error among accepted answers uses the 250 accepted requests, so it is 25/250 = 10%. The 25% acceptance rate also uses all 1,000 arrivals, but its numerator counts all 250 accepted requests."
  },
  {
    "question": "Of 24 sorted calibration errors, the first 22 are at most 5 ms, the 23rd is 6 ms and the last is 10 ms. The target coverage is 92% and the point prediction is 48 ms. Change only the 23rd error to 7 ms. The request finishes in 55 ms and its deadline is 53 ms. Which rank, interval, coverage result and deadline result go in the request log?",
    "options": [
      "Rank 24, [38, 58] ms, covered, deadline missed.",
      "Rank 23, [42, 54] ms, outside, deadline missed.",
      "Rank 23, [41, 55] ms, covered, deadline missed.",
      "Rank 23, [41, 55] ms, covered, deadline met."
    ],
    "answer": "Rank 23, [41, 55] ms, covered, deadline missed.",
    "explanation": "There are 25 possible ranks including the future score. Since 25 × 0.92 = 23, the rule still takes the 23rd error. Taking the next error would give a 10 ms radius. Keeping the old 6 ms radius would leave 55 ms outside. The updated radius is 7 ms, so the interval runs from 41 to 55 ms and includes the arrival at its upper endpoint. The request still missed its 53 ms deadline by 2 ms."
  }
]
```

> **Next:** Continue to [Clustering and PCA](/learn/clustering-pca-representation-learning). Here, observed outcomes let you calibrate prediction errors. Next, set the outcomes aside and look for structure in the input features themselves.
