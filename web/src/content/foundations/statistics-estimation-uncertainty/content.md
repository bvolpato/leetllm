---
{
  "id": "statistics-estimation-uncertainty",
  "title": "Statistics and Uncertainty",
  "slug": "statistics-estimation-uncertainty",
  "section": "Math & Statistics",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Easy",
  "order": 7,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Sixteen confirmed abuse cases in 100 random flags are not yet the queue's rate, and a tighter interval can still describe the wrong pile.",
  "keyConceptsTested": [
    "sample vs population",
    "point estimates",
    "bootstrap",
    "standard error",
    "Wilson score interval",
    "MLE and MAP",
    "sampling bias",
    "calibration evidence"
  ]
}
---

You draw 100 flagged signups at random from an unlabeled stream and find 16 confirmed abuse cases. That single fraction, `16%`, looks concrete, yet if you drew another 100 signups from the exact same stream five minutes later, you could easily see `10` or `22`. Before acting on `16%`, you need to know how far random sampling can move it, and whether your 100 labels even came from the right population.

[Bayesian Inference from Evidence](/learn/bayesian-inference-priors-posteriors) combined ten observations with an explicit prior. Here we measure how a sample-based estimate fluctuates across repeated draws, build confidence intervals that survive boundary cases like `0/10`, expose how selection bias beats sample size, and return to priors through MLE versus MAP. Earlier in [Probability for Machine Learning](/learn/probability-for-machine-learning), counting 95 abusive cases out of 590 fully labeled flags was a population calculation; here the full stream is mostly unlabeled, so `16 / 100` is statistical evidence about an unknown rate.

## Start with the target behind 16%

Before computing intervals, pin down the denominator: "16 of 100 **what**?"

| Term | Meaning here |
|---|---|
| **Population** | All flagged signups entering the review stream this week |
| **Sample** | 100 flagged signups drawn at random and labeled |
| **Estimand ($p$)** | The stream's unknown precision, $P(\text{abusive} \mid \text{flagged})$ |
| **Estimator ($\hat{p}$)** | The rule $k / n$, yielding the realized **estimate** $16 / 100 = 0.16$ |

$$
\hat{p} = \frac{16}{100} = 0.16
$$

The hat on $\hat{p}$ marks an estimate rather than the exact population parameter. For independent Bernoulli labels, $k / n$ is also the **maximum-likelihood estimate (MLE)**: the value of $p$ that maximizes the probability of observing `16` positives and `84` negatives. Notice why we track <span data-glossary="precision-recall">review-queue precision</span> $P(\text{abusive} \mid \text{flagged})$ instead of overall accuracy: if only `1%` of all signups are abusive, a trivial classifier that labels everything clean achieves `99%` accuracy while catching zero abuse.

<!-- leetllm: test, output=show, output_title="Queue point estimate" -->

```python title="estimate-flagged-queue-precision.py"
reviewed_flags = 100
confirmed_abuse = 16

precision_estimate = confirmed_abuse / reviewed_flags
always_clean_accuracy = 0.99

print(f"review queue: {confirmed_abuse}/{reviewed_flags} confirmed abuse")
print(f"estimated P(abuse | flagged): {precision_estimate:.1%}")
print(f"misleading rare-event baseline accuracy: {always_clean_accuracy:.1%}")

assert precision_estimate == 0.16
```

<!-- leetllm: output:start -->
```text title="Queue point estimate" output compact
review queue: 16/100 confirmed abuse
estimated P(abuse | flagged): 16.0%
misleading rare-event baseline accuracy: 99.0%
```
<!-- leetllm: output:end -->

<details>
<summary>Deep dive: missing-label bounds when some sampled items go unresolved</summary>

The denominator `100` assumes every sampled item received a label. If `80` items were resolved (`16` abuse) and `20` remained unresolved, dropping the `20` gives `16/80 = 20%`, while treating them as non-abuse gives `16/100 = 16%`. Letting all `20` unresolved items take either label yields **missing-label bounds** of `[16%, 36%]` for the selected sample. Always report selected, resolved, and unresolved counts together, because hard or high-risk cases often go missing non-randomly.[^statcanWeightingEstimation2009]

</details>

```checkpoint
Why is `16 / 100` a better running metric here than detector accuracy over all signups?
---
You are deciding whether flagged signups deserve review, so the useful quantity is the abusive share inside the flagged queue. With rare abuse, overall accuracy can look high even for a detector that never catches abuse.
```

## Let the next hundred challenge the point estimate

The first report estimates a center. If the queue's true risk were 16 percent, what should the next random 100 labels contain? Sampling variation means batches differ: one might contain 12, another 19, another 17.

The simulation holds the rate fixed at `0.16` and changes only which signups get drawn. Each draw is an independent coin flip with success probability 0.16, called a Bernoulli outcome. The number of successes in 100 such draws has a binomial distribution. Will all eight estimates stay close to `0.16`?

<!-- leetllm: test, output=show, output_title="Repeated reviewed batches" -->

```python title="watch-sample-estimates-move.py"
import numpy as np

rng = np.random.default_rng(17)
labels = rng.random((8, 100)) < 0.16  # eight batches, 100 labels each
confirmed_counts = labels.sum(axis=1)
estimates = confirmed_counts / 100

print("confirmed abuse counts:", confirmed_counts.tolist())
print("precision estimates:    " + ", ".join(f"{value:.2f}" for value in estimates))
print(f"range across batches:    {min(estimates):.2f} to {max(estimates):.2f}")
```

<!-- leetllm: output:start -->
```text title="Repeated reviewed batches" output compact
confirmed abuse counts: [13, 16, 16, 17, 19, 16, 10, 18]
precision estimates:    0.13, 0.16, 0.16, 0.17, 0.19, 0.16, 0.10, 0.18
range across batches:    0.10 to 0.19
```
<!-- leetllm: output:end -->

The eight batches range from `0.10` to `0.19` even though the underlying probability stayed fixed at `0.16`. That spread is pure **sampling variation**, not model drift.

In the simulation we knew `p = 0.16`. On a real dataset we have only the 100 labels in hand and must estimate that spread from them alone.

## Replay sampling with the labels in hand

Our sample contains sixteen `1`s and eighty-four `0`s. The **<span data-glossary="bootstrap-resampling">bootstrap</span>** treats that empirical sample as a proxy for the population and draws 100 labels *with replacement* thousands of times.[^efron1979][^hastie2009] Each resample produces a fresh proportion $k/n$; taking the `2.5th` and `97.5th` percentiles across `5,000` resamples forms a **95% percentile bootstrap interval**.[^scipyBootstrap2026]

<!-- leetllm: test, output=show, output_title="Bootstrap precision interval" -->

```python title="bootstrap-review-queue-precision.py"
import numpy as np

reviewed_labels = np.array([1] * 16 + [0] * 84)
rng = np.random.default_rng(7)

resampled_labels = rng.choice(reviewed_labels, size=(5_000, 100), replace=True)
resampled_estimates = resampled_labels.mean(axis=1)

low, high = np.quantile(resampled_estimates, [0.025, 0.975])

print(f"sample estimate:       {sum(reviewed_labels) / len(reviewed_labels):.3f}")
print(f"bootstrap 95% range:   [{low:.3f}, {high:.3f}]")
print(f"resampled min and max: {min(resampled_estimates):.3f}, {max(resampled_estimates):.3f}")

zero_labels = np.zeros(10, dtype=int)
zero_resamples = rng.choice(zero_labels, size=(100, 10), replace=True).mean(axis=1)
print("bootstrap estimates from 0/10:", np.unique(zero_resamples).tolist())
```

<!-- leetllm: output:start -->
```text title="Bootstrap precision interval" output compact
sample estimate:       0.160
bootstrap 95% range:   [0.090, 0.230]
resampled min and max: 0.050, 0.300
bootstrap estimates from 0/10: [0.0]
```
<!-- leetllm: output:end -->

The bootstrap interval `[0.090, 0.230]` immediately exposes the sampling spread around `0.160`. Notice two failure modes right away:

- **Boundary collapse:** From `0 / 10` positives, every resample consists of ten zeros, collapsing the percentile interval to `[0, 0]`. Extra bootstrap repetitions only smooth Monte Carlo jitter; they never create new labels.
- **Clustered data:** Row-by-row resampling assumes independent rows. If signups arrive in linked campaigns, resampling individual rows treats ten correlated copies as ten independent observations. Always resample at the independent **sampling unit**.[^statcanWeightingEstimation2009]

Test that second rule directly on ten independent signup campaigns of ten signups each, where two campaigns are `100%` abusive and eight are `100%` clean (`20 / 100 = 20%`):

<!-- leetllm: test, output=show, output_title="Resample the independent campaigns" -->

```python title="bootstrap-linked-signup-campaigns.py"
import numpy as np

rng = np.random.default_rng(21)
campaign_labels = np.repeat(np.array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0])[:, None], 10, axis=1)
rows = campaign_labels.ravel()
row_estimates = rng.choice(rows, size=(10_000, 100), replace=True).mean(axis=1)

# Each draw selects ten whole campaigns, retaining their ten labels together.
campaign_indices = rng.integers(0, 10, size=(10_000, 10))
campaign_estimates = campaign_labels[campaign_indices].mean(axis=(1, 2))

print(f"observed abuse: {rows.sum()}/{rows.size} = {rows.mean():.0%}")
for name, estimates in [("individual rows", row_estimates), ("whole campaigns", campaign_estimates)]:
    low, high = np.quantile(estimates, [0.025, 0.975])
    print(f"{name}: [{low:.0%}, {high:.0%}]")

assert np.isclose(rows.mean(), 0.20)
assert campaign_estimates.std() > 3 * row_estimates.std()
```

<!-- leetllm: output:start -->
```text title="Resample the independent campaigns" output compact
observed abuse: 20/100 = 20%
individual rows: [12%, 28%]
whole campaigns: [0%, 50%]
```
<!-- leetllm: output:end -->

`campaign_labels[campaign_indices]` has shape `(10_000, 10, 10)`: resamples, campaigns, and signups. Resampling rows yields a falsely narrow `[12%, 28%]`, pretending there are 100 independent draws; resampling whole campaigns yields `[0%, 50%]`, reflecting that only `10` independent campaigns supplied evidence.[^statcanWeightingEstimation2009]

> **Key insight:** Match the bootstrap resampling unit to the independent unit of data collection. Resampling rows inside correlated clusters artificially shrinks your standard error.

## Put a scale on the movement

For a binary proportion, we can also calculate the sampling scale analytically. With `16 / 100`, the estimated variance of a single Bernoulli label is $0.16 \times 0.84 = 0.1344$. Averaging 100 independent labels divides variance by `100`, and taking the square root returns to percentage-point units:

$$
\widehat{SE} = \sqrt{\frac{0.16 \times 0.84}{100}} \approx 0.0367
$$

In general, substituting $\hat{p}$ into the binomial variance $p(1-p)/n$ gives the **standard error** of a sample proportion:

$$
\widehat{SE} = \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}
$$

Standard error is the standard deviation of the *estimator* across repeated samples, not the spread of individual labels. Because $n$ sits inside a square root, halving the uncertainty margin takes $4\times$ as many labels, and cutting it by $10\times$ takes $100\times$ as many. By the <span data-glossary="central-limit-theorem">central limit theorem</span>, the distribution of $\hat{p}$ approaches normal for large independent samples away from `0` and `1`, giving the quick **Wald interval**:

$$
\hat{p} \pm 1.96 \widehat{SE} = 0.16 \pm 0.0719 \approx [0.088,\ 0.232]
$$

(When sampling a large fraction of a fixed finite queue without replacement, apply a finite-population correction $\sqrt{(N - n)/(N - 1)}$ to shrink the standard error accordingly.)

<!-- leetllm: test, output=show, output_title="Quick interval calculation" -->

```python title="standard-error-first-pass.py"
from math import sqrt

successes = 16
n = 100
p_hat = successes / n
se = sqrt(p_hat * (1 - p_hat) / n)
low = p_hat - 1.96 * se
high = p_hat + 1.96 * se

print(f"estimate:       {p_hat:.3f}")
print(f"standard error: {se:.4f}")
print(f"quick interval: [{low:.3f}, {high:.3f}]")
```

<!-- leetllm: output:start -->
```text title="Quick interval calculation" output compact
estimate:       0.160
standard error: 0.0367
quick interval: [0.088, 0.232]
```
<!-- leetllm: output:end -->

The output makes the scale visible: `0.16` plus or minus about `0.072`. A larger `n` shrinks standard error because the same kind of estimator moves less across repeated samples. Keep this calculation as a useful first pass, not as the default report. Its symmetric endpoints can become impossible or collapse at the edges.

## Wald collapses at 0/10; Wilson doesn't

The Wald interval breaks when the rate is near `0` or `1`. If reviewers inspect ten flagged signups and find zero abuse, $\hat{p}=0$, the standard error is zero, and the interval becomes `[0, 0]`. That result looks decisive. Should ten clean labels count as proof that abuse risk is exactly zero? They shouldn't.

A **Wilson score <span data-glossary="confidence-interval">confidence interval</span>** handles that case better. Instead of treating the observed zero as certainty, it asks which candidate population rates remain compatible with the count. Its two-sided 95% interval for `0 / 10` reaches from `0` to about `0.278`. Wilson's construction inverts a score test for a binomial proportion: the test uses each candidate rate to calculate its standard error, not the observed $\hat{p}$.[^nistBinomialIntervals2026] For `16 / 100`, the interval's adjusted center is about `0.173` and its margin is about `0.072`, giving `[0.101, 0.244]`. The general calculation is:

$$
\text{center} =
\frac{\hat{p} + z^2/(2n)}{1 + z^2/n}
$$

$$
\text{margin} =
\frac{z}{1 + z^2/n}
\times
\sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}
$$

For a 95% interval, set $z = 1.96$ ($z^2 \approx 3.84$). Notice how Wilson shifts the center slightly toward `0.5`: for `16 / 100`, the center moves to `0.173`, and for `0 / 10`, the $z^2/(2n)$ term lifts the center off zero and keeps the upper bound positive. Compare Wald and Wilson across interior and boundary counts:

<!-- leetllm: test, output=show, output_title="Wald failure and score interval" -->

```python title="wilson-score-interval.py"
from math import sqrt

def wald_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n <= 0 or not 0 <= successes <= n:
        raise ValueError("require 0 <= successes <= n and n > 0")
    p_hat = successes / n
    se = sqrt(p_hat * (1 - p_hat) / n)
    return p_hat - z * se, p_hat + z * se

def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n <= 0 or not 0 <= successes <= n:
        raise ValueError("require 0 <= successes <= n and n > 0")
    p_hat = successes / n
    denominator = 1 + z * z / n
    center = (p_hat + z * z / (2 * n)) / denominator
    margin = z / denominator * sqrt(
        p_hat * (1 - p_hat) / n + z * z / (4 * n * n)
    )
    return max(0.0, center - margin), min(1.0, center + margin)

for successes, n in [(16, 100), (0, 10), (10, 10)]:
    wald = wald_interval(successes, n)
    wilson = wilson_interval(successes, n)
    print(
        f"{successes:>2}/{n:<3} wald=[{wald[0]:.3f}, {wald[1]:.3f}] "
        f"wilson=[{wilson[0]:.3f}, {wilson[1]:.3f}]"
    )
```

<!-- leetllm: output:start -->
```text title="Wald failure and score interval" output compact
16/100 wald=[0.088, 0.232] wilson=[0.101, 0.244]
 0/10  wald=[0.000, 0.000] wilson=[0.000, 0.278]
10/10  wald=[1.000, 1.000] wilson=[0.722, 1.000]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Unified comparison of Wald and Wilson 95% confidence intervals across three sample regimes: 16 of 100, 0 of 10, and 10 of 10 events. At both boundary cases (0/10 and 10/10), the Wald interval collapses to a degenerate single point, whereas the Wilson score interval maintains nonzero width." />
  <figcaption>Wald and Wilson 95% confidence intervals across three sample regimes. At boundary counts (0/10 and 10/10), Wald collapses to zero width, falsely claiming absolute certainty. Wilson score intervals maintain finite uncertainty bounds.</figcaption>
</figure>

> **Common mistake:** A 95% confidence interval means the *procedure* covers the true population rate $p$ in roughly 95% of repeated samples.[^nistConfidenceIntervals2026][^nistBinomialIntervals2026] Do not read one realized interval `[0.101, 0.244]` as a 95% posterior probability on $p$, nor as a prediction interval for the next 100 signups (a future sample adds its own binomial scatter).

Fix sample size $n$ and confidence level in advance rather than peeking until an interval clears a threshold. When a target threshold sits inside the interval, the sample is too small to resolve which side the true rate lies on. Next, watch how growing $n$ tightens a Wilson interval.

```checkpoint
Why should a report avoid the quick Wald interval for `0 / 10` reviewed abuse cases?
---
It returns `[0, 0]`, which treats ten observed non-abuse cases as proof that abuse risk is exactly zero. A score interval preserves uncertainty and correctly leaves a nonzero upper bound.
```

## More reviews only help if they match the queue

The Wilson interval tells us how much random movement remains. Suppose later labeling keeps the same center: 16 percent of reviewed flagged signups are abuse. If the added labels are still representative, increasing the sample size should narrow the interval. As sample size grows, the central estimate remains `0.16` while the interval should contract as `n` grows.

<!-- leetllm: test, output=show, output_title="Sample size tightens interval" -->

```python title="sample-size-tightens-precision.py"
from math import sqrt

def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n <= 0 or not 0 <= successes <= n:
        raise ValueError("require 0 <= successes <= n and n > 0")
    p_hat = successes / n
    denominator = 1 + z * z / n
    center = (p_hat + z * z / (2 * n)) / denominator
    margin = z / denominator * sqrt(
        p_hat * (1 - p_hat) / n + z * z / (4 * n * n)
    )
    return max(0.0, center - margin), min(1.0, center + margin)

for successes, n in [(16, 100), (160, 1_000), (1_600, 10_000)]:
    low, high = wilson_interval(successes, n)
    print(f"{successes:>4}/{n:<6} estimate={successes / n:.3f} interval=[{low:.3f}, {high:.3f}]")
```

<!-- leetllm: output:start -->
```text title="Sample size tightens interval" output compact
  16/100    estimate=0.160 interval=[0.101, 0.244]
 160/1000   estimate=0.160 interval=[0.139, 0.184]
1600/10000  estimate=0.160 interval=[0.153, 0.167]
```
<!-- leetllm: output:end -->

`16 / 100` is an early read. `1,600 / 10,000` is much tighter evidence about the population, assuming both samples represent the queue you intend to serve. More labels reduced random movement without changing the center.

Here, **bias** means the estimator's average over repeated samples minus the target rate. For simple random sampling, $E[\hat{p}] = p$, so the sample fraction is unbiased. One particular sample can still miss $p$. Its variance shrinks as $n$ grows, which is why these intervals tighten. This is greater statistical precision, distinct from the classifier metric also called precision. But `n` only buys precision when the labels target the same population. A large sample from one slice can be confidently wrong about the queue.

## A domestic-only sample is precise about the wrong pile

Suppose the next labeling budget goes to 2,000 routine domestic flags. Those labels describe that slice well, but they don't establish the rate in parts of the queue they never cover. **Selection bias** appears when the selection process systematically shifts the estimate away from its target. To see how unmeasured strata shift the overall rate, compare a three-stratum signup queue whose true slice rates are known. The slices must not overlap: classify high-value signups first, then divide the remainder into domestic and international signups.

| Flagged-signup slice | Share of queue | Confirmed-abuse rate |
|---|---:|---:|
| routine domestic signups | 70 percent | 12 percent |
| international signups | 20 percent | 25 percent |
| high-value signups | 10 percent | 42 percent |

A review project that samples only routine domestic flags can return a very tight estimate near 12 percent while missing higher-risk parts of the queue. That 12 percent is an estimate for the domestic slice. Picture 1,000 flags with this mix: 700 domestic flags contribute 84 abuse cases, 200 international flags contribute 50, and 100 high-value flags contribute 42. The total is `176 / 1,000 = 17.6%`. Equivalently, weight each rate by its share: `0.70 × 0.12 + 0.20 × 0.25 + 0.10 × 0.42 = 0.176`. Domestic-only sampling has bias `12% - 17.6% = -5.6` percentage points for this queue target. More domestic labels don't remove it. To estimate overall queue precision, sample each important slice or sample randomly from the actual queue, then account for the slice mix.

<!-- leetllm: test, output=show, output_title="Slice weighting exposes bias" -->

```python title="representative-slices-matter.py"
slices = [
    ("routine domestic", 0.70, 0.12),
    ("international", 0.20, 0.25),
    ("high value", 0.10, 0.42),
]

overall_precision = sum(share * rate for _, share, rate in slices)
domestic_only_precision = slices[0][2]

print(f"domestic-only estimate: {domestic_only_precision:.1%}")
print(f"queue-weighted estimate: {overall_precision:.1%}")
print(f"bias from wrong slice:   {domestic_only_precision - overall_precision:+.1%}")

assert round(overall_precision, 3) == 0.176
```

<!-- leetllm: output:start -->
```text title="Slice weighting exposes bias" output compact
domestic-only estimate: 12.0%
queue-weighted estimate: 17.6%
bias from wrong slice:   -5.6%
```
<!-- leetllm: output:end -->

In practice, slice rates are estimates too. If you sample equal counts from unequal-sized strata, weight each stratum's rate by its true population share and compute stratified variance rather than applying unweighted Wilson to pooled counts.[^statcanWeightingEstimation2009]

The **bias-variance decomposition** of Mean Squared Error (MSE) makes the trade-off exact:

$$
\text{MSE}(\hat{p}) = \mathbb{E}[(\hat{p} - p)^2] = \text{Bias}(\hat{p})^2 + \text{Var}(\hat{p})
$$

where $\text{Bias}(\hat{p}) = \mathbb{E}[\hat{p}] - p$. Under simple random sampling from the full queue, $\text{Bias}(\hat{p}) = 0$ and $\text{MSE} = p(1 - p)/n$, which vanishes as $n \to \infty$. Under domestic-only sampling, $\mathbb{E}[\hat{p}] = 0.120$ while $p = 0.176$, locking in an irreducible bias of `-0.056`. Even with `10,000` domestic labels driving variance to zero:

$$
\text{MSE}(\hat{p}) \to (-0.056)^2 + 0 \approx 0.00314
$$

> **Key insight:** Sample size shrinks variance at rate $1/n$, never selection bias. Fixing an unrepresentative sample requires covering the missing strata and weighting them by queue share.

<figure>
  <img src="illustrations/_generated/sample_size_vs_bias_dark.png" alt="Left chart shows 95% Wilson intervals around a 16% observed rate narrowing as sample size grows from 100 to 10,000 (widths: 14.3 pp, 4.5 pp, 1.4 pp). Right chart illustrates sampling bias: evaluating only the domestic cohort (12% rate) underestimates the overall flagged-queue abuse rate (17.6% across domestic, international, and high-value tiers) by 5.6 percentage points." />
  <figcaption>Sample size precision versus sampling bias. Increasing sample size contracts interval width (from 14.3 pp down to 1.4 pp), but cannot correct systematic sampling bias when evaluating unrepresentative cohorts.</figcaption>
</figure>

Random uncertainty, sampling design, and label quality need different fixes. Use the symptom to choose the repair:

| Failure | Symptom | Correct response |
|---|---|---|
| Too few representative reviews | interval is wide | label more randomly selected queue items |
| Wrong slices reviewed | interval may be narrow but misses deployment risk | repair sampling plan and report slice coverage |
| Labels change after model output is seen | metric drifts toward model guesses | lock rubric and review ambiguous labels independently |

```checkpoint
A domestic-only sample of 2,000 flags yields a tight interval around 12%. The queue mix is 70/20/10 at 12%, 25%, and 42%. Can you treat 12% as queue precision?
---
No. The queue-weighted rate is 17.6%. Extra domestic labels shrink variance around the wrong center.
```

## A prior pulls the center for a different reason

With one abuse case in five reviews, MLE gives `1 / 5 = 0.20`. With 160 in 1,000, it gives `0.16`. It uses only the observed labels. More generally, `k` positive and `n - k` negative labels contribute likelihood proportional to $p^k(1-p)^{n-k}$. This expression is maximized at $k/n$, the same sample fraction we've used throughout.

Maximum a posteriori estimation (MAP) picks the posterior's highest-density point, or **mode**. With the $\text{Beta}(2,2)$ prior from the Bayesian lesson, one abuse case in five reviews gives a $\text{Beta}(3,6)$ posterior. Its mode is `(3 - 1) / (3 + 6 - 2) = 2/7`, about `0.286`. That differs from its mean, `3/9`, about `0.333`.[^bartlett2014betabinomial] For `k` successes in `n` labels, this prior gives posterior $\text{Beta}(k+2,n-k+2)$. Substituting those parameters into the mode formula gives:

$$
\hat{p}_{\text{MAP}} = \frac{k + 1}{n + 2}
$$

The mode formula acts as if one success and one failure were added to the observed counts. The posterior-mean formula instead uses `(k + 2) / (n + 4)`. Neither rule adds actual reviews. This symmetric prior illustrates shrinkage. For a low-abuse queue, choose a prior from relevant knowledge and report its influence. Run the same three counts through both rules. The labels stay fixed; only the source of the center changes.

<!-- leetllm: test, output=show, output_title="MLE and explicit prior" -->

```python title="mle-and-map-for-queue-risk.py"
def validate_counts(successes: int, n: int) -> None:
    if n <= 0 or not 0 <= successes <= n:
        raise ValueError("require 0 <= successes <= n and n > 0")

def mle_rate(successes: int, n: int) -> float:
    validate_counts(successes, n)
    return successes / n

def map_rate_beta_2_2(successes: int, n: int) -> float:
    validate_counts(successes, n)
    return (successes + 1) / (n + 2)

for successes, n in [(16, 100), (1, 5), (160, 1_000)]:
    mle = mle_rate(successes, n)
    map_estimate = map_rate_beta_2_2(successes, n)
    posterior_mean = (successes + 2) / (n + 4)
    print(
        f"{successes}/{n:<4} MLE={mle:.3f} "
        f"MAP={map_estimate:.3f} posterior_mean={posterior_mean:.3f}"
    )
```

<!-- leetllm: output:start -->
```text title="MLE and explicit prior" output compact
16/100  MLE=0.160 MAP=0.167 posterior_mean=0.173
1/5    MLE=0.200 MAP=0.286 posterior_mean=0.333
160/1000 MLE=0.160 MAP=0.161 posterior_mean=0.161
```
<!-- leetllm: output:end -->

The output makes the scale of the prior's influence visible: `1 / 5` moves from `0.200` to `0.286`, while `160 / 1,000` moves from `0.160` to about `0.161`. Wilson's center also blends $\hat{p}$ toward 0.5, but that's a confidence-interval construction, not a posterior mode. Don't hide weak evidence behind a convenient prior. State the prior and show how much it changes the result.[^murphy2012][^bishop2006] So far the target has been a rate inside the flagged queue. A score adds another question: when it says 20 percent, do outcomes in that score bucket really average 20 percent?

## A four-point calibration gap can still be noise

A risk classifier is **<span data-glossary="calibration">calibrated</span>** when cases assigned a predicted probability of `0.20` actually turn out positive roughly `20%` of the time. Suppose we draw `100` fresh signups from the `0.20` predicted-risk bucket and observe `16` abuse cases. That `4`-percentage-point gap looks suspicious at first glance, yet the Wilson interval tests whether `0.20` is still compatible with sampling variation:

<!-- leetllm: test, output=show, output_title="Calibration needs labels" -->

```python title="finite-calibration-bucket.py"
from math import sqrt

def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n <= 0 or not 0 <= successes <= n:
        raise ValueError("require 0 <= successes <= n and n > 0")
    p_hat = successes / n
    denominator = 1 + z * z / n
    center = (p_hat + z * z / (2 * n)) / denominator
    margin = z / denominator * sqrt(
        p_hat * (1 - p_hat) / n + z * z / (4 * n * n)
    )
    return max(0.0, center - margin), min(1.0, center + margin)

predicted_risk = 0.20
observed_abuse = 16
n = 100
low, high = wilson_interval(observed_abuse, n)

print(f"predicted bucket risk: {predicted_risk:.1%}")
print(f"observed abuse rate:   {observed_abuse / n:.1%}")
print(f"observed interval:     [{low:.1%}, {high:.1%}]")
print(f"20% is plausible here: {low <= predicted_risk <= high}")
```

<!-- leetllm: output:start -->
```text title="Calibration needs labels" output compact
predicted bucket risk: 20.0%
observed abuse rate:   16.0%
observed interval:     [10.1%, 24.4%]
20% is plausible here: True
```
<!-- leetllm: output:end -->

The interval `[10.1%, 24.4%]` covers `20%`, so `100` labels are not enough to declare this bucket miscalibrated (nor tight enough to certify exact calibration). On real models, compare each pre-declared score bin's average prediction against its empirical rate on held-out data, keep per-bin counts visible, and adjust for multiple comparisons when scanning many bins.[^nistBonferroni2026] Modern neural networks are frequently miscalibrated despite high accuracy, making explicit calibration checks essential.[^guo2017]

```checkpoint
A risk bucket predicts 20 percent, while 16 of 100 reviewed cases are positive and the observed Wilson interval is 10.1 to 24.4 percent. Can this sample establish miscalibration?
---
No. The interval still includes 20 percent, so the four-point observed gap is compatible with finite-sample variation. Gather more representative labels before declaring a calibration failure.
```

## Print the counts, the interval, and the sampling plan

A clean metric report lets any reader reconstruct the estimate and judge its precision at a glance: numerator, denominator, point estimate, Wilson interval width, and sampling design. Whether a `14.3`-percentage-point width is acceptable depends on how close the estimate sits to your decision threshold.

<!-- leetllm: test, output=show, output_title="Review queue report" -->

```python title="build-review-queue-report.py"
from math import sqrt

def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n <= 0 or not 0 <= successes <= n:
        raise ValueError("require 0 <= successes <= n and n > 0")
    p_hat = successes / n
    denominator = 1 + z * z / n
    center = (p_hat + z * z / (2 * n)) / denominator
    margin = z / denominator * sqrt(
        p_hat * (1 - p_hat) / n + z * z / (4 * n * n)
    )
    return max(0.0, center - margin), min(1.0, center + margin)

def report_precision(successes: int, n: int, slice_name: str, sampling_plan: str) -> str:
    low, high = wilson_interval(successes, n)
    return (
        f"{slice_name}: {successes}/{n} = {successes / n:.1%}; "
        f"95% Wilson interval [{low:.1%}, {high:.1%}]\n"
        f"  width={(high - low) * 100:.1f} percentage points; sample={sampling_plan}"
    )

print(report_precision(16, 100, "weekly queue", "simple random flags from this week"))
print(report_precision(25, 100, "international slice", "simple random flags within this slice"))

try:
    report_precision(2, 0, "empty slice", "no reviews")
except ValueError as error:
    print(error)
```

<!-- leetllm: output:start -->
```text title="Review queue report" output compact
weekly queue: 16/100 = 16.0%; 95% Wilson interval [10.1%, 24.4%]
  width=14.3 percentage points; sample=simple random flags from this week
international slice: 25/100 = 25.0%; 95% Wilson interval [17.5%, 34.3%]
  width=16.8 percentage points; sample=simple random flags within this slice
require 0 <= successes <= n and n > 0
```
<!-- leetllm: output:end -->

Here the international line comes from its own 100-item random sample, separate from the mixed weekly sample, and every summary carries the collection method alongside the interval.

## Tighter intervals don't fix the wrong labels

A confidence interval quantifies **estimation uncertainty**: how much a finite sample fluctuates around the population rate. If annotators saw the model's score before labeling ambiguous cases, the interval can be razor-thin while measuring a contaminated ground truth.

| Failure mode | Symptom | Does more data fix it? |
|---|---|---|
| Finite representative sample | Estimates wobble across random batches | Yes, more representative labels narrow the interval |
| Selection bias | Only one easy slice was labeled | No, fix the sampling design and stratum weights |
| Ambiguous or leaked labels | Annotators disagree or anchor on model scores | No, lock the rubric and blind ambiguous reviews |
| Distribution shift | New geographies or payment flows appear | No, sample the new regime and retrain |
| Miscalibrated probabilities | Predicted risk diverges from observed bin rates | No, recalibrate on held-out labels |

In ML uncertainty literature, irreducible label or input ambiguity is called **aleatoric uncertainty**, while lack of data in unfamiliar regions is **epistemic uncertainty**. Either way, match the fix to the source of error.

## Practice with 24/120 high-value flags

Apply the full workflow to a new slice: `24` confirmed abuse cases out of `120` randomly sampled high-value flags.

1. Compute the point estimate and 95% Wilson interval for `24 / 120`.
2. Decide whether this sample resolves a `25%` minimum precision threshold.
3. Explain why a `120 / 1,000` domestic sample cannot substitute for this slice.
4. If a predicted-risk bucket averages `25%` risk and observes `24 / 120` abuse, decide whether it is provably miscalibrated.

| Item | Result |
|---|---|
| Point estimate | `24 / 120 = 0.20` (`20.0%`) |
| 95% Wilson interval | `[0.138, 0.280]` (`13.8%` to `28.0%`) |
| `25%` threshold | Unresolved: the interval spans both sides of `25%` |
| Slice swap | High-value and domestic flags are distinct strata; combine only via population-share weighting |
| Calibration call | Compatible with `25%` within sampling variation; more labels are needed to tell |

Counts plus a Wilson interval bound sampling uncertainty; the sampling design and label hygiene determine which population that interval actually describes.

```mastery-quiz
[
  {
    "question": "Reviewers randomly sample 150 flagged signups and confirm 30 abuse cases. Which target does 30/150 estimate?",
    "options": [
      "Abuse among flagged signups: review-queue precision, estimated at 20% for this population.",
      "Flags among abusive signups: recall, estimated at 20% for the full stream of abusive cases.",
      "Flags among clean signups: false-positive rate, estimated at 20% for the clean population.",
      "Abuse among all signups: prevalence, estimated at 20% for flagged and unflagged cases."
    ],
    "answer": "Abuse among flagged signups: review-queue precision, estimated at 20% for this population.",
    "explanation": "The denominator contains flagged signups, so 30/150 estimates P(abuse | flagged), the precision of the flagged queue."
  },
  {
    "question": "Representative samples have 30/150 and 120/600 positives. Each team bootstraps at its own sample size. What scale comparison follows under independent rows?",
    "options": [
      "The 600-row sample has about half the standard error; bootstrap repetitions reuse its existing labels.",
      "The 150-row sample has about half the standard error; each positive contributes a larger sample fraction.",
      "Both samples have the same standard error; matching observed fractions determines the bootstrap width.",
      "Both samples gain new evidence per resample; more repetitions replace the need for additional labels."
    ],
    "answer": "The 600-row sample has about half the standard error; bootstrap repetitions reuse its existing labels.",
    "explanation": "The observed rate is 0.2 in each sample. Standard error scales as 1/sqrt(n), so quadrupling 150 to 600 halves it under the independent model. More resamples reduce simulation jitter, not finite-label uncertainty."
  },
  {
    "question": "A random sample has 0 positives among 20 independent labels. Wald and a percentile bootstrap both collapse to zero. Which interpretation is justified?",
    "options": [
      "Zero outcomes still leave population uncertainty; the 95% Wilson upper bound is about 16.1%.",
      "Zero outcomes establish a zero population rate; both matching methods remove the need for an interval.",
      "The bootstrap creates missing positive cases; its upper bound recovers the unknown population risk.",
      "The likelihood has no maximum at zero; discard this sample until a positive case becomes available."
    ],
    "answer": "Zero outcomes still leave population uncertainty; the 95% Wilson upper bound is about 16.1%.",
    "explanation": "At zero the plug-in Wald scale vanishes, and all bootstrap resamples of observed zeros are zeros. Wilson instead gives an upper endpoint 1.96²/(20+1.96²)≈0.1611, preserving nonzero uncertainty."
  },
  {
    "question": "A queue has disjoint shares 50%, 30%, 20% with known positive rates 10%, 20%, 40%. A sample covers only the first slice. What is the full-queue rate?",
    "options": [
      "19%, using the slice-weighted sum; the first slice’s 10% targets a different population.",
      "23.3%, using the unweighted mean; each slice contributes one rate to the overall queue.",
      "10%, using the largest slice’s rate; its majority share determines the overall fraction.",
      "40%, using the highest-risk slice’s rate; the maximum defines the queue-wide fraction."
    ],
    "answer": "19%, using the slice-weighted sum; the first slice’s 10% targets a different population.",
    "explanation": "The weighted rate is 0.5 × 0.1 + 0.3 × 0.2 + 0.2 × 0.4 = 0.19. Sampling only the first slice misses the other strata, and adding more rows from that slice cannot remove selection bias."
  },
  {
    "question": "A new slice sample observes 18/90 positives, with 95% Wilson interval about [13.0%, 29.4%]. A minimum-quality target requires 25%. Which evidence report follows?",
    "options": [
      "Report counts, interval and selection; this interval crosses 25%, leaving the threshold unresolved.",
      "Approve the slice from 29.4%; an upper endpoint above the threshold establishes the minimum rate.",
      "Reject the slice from 20%; the point estimate below the threshold makes sampling uncertainty irrelevant.",
      "Pool it with a larger low-risk slice; a larger denominator establishes this slice’s threshold status."
    ],
    "answer": "Report counts, interval and selection; this interval crosses 25%, leaving the threshold unresolved.",
    "explanation": "The interval covers values on both sides of 25%. Neither the upper endpoint nor the point estimate alone settles whether the true rate exceeds 25%."
  },
  {
    "question": "A preselected bucket forecasts 25% risk. A held-out sample finds 12/60 positives with Wilson interval about [11.8%, 31.8%]. What follows from this bucket?",
    "options": [
      "The forecast remains compatible with these labels; one bucket leaves whole-model calibration unverified.",
      "The model is exactly calibrated across buckets; including 25% establishes the entire calibration curve.",
      "The bucket is miscalibrated from its 20% estimate; a five-point difference establishes a population gap.",
      "The labels are unnecessary for calibration; the configured forecast is the bucket’s measured outcome rate."
    ],
    "answer": "The forecast remains compatible with these labels; one bucket leaves whole-model calibration unverified.",
    "explanation": "The Wilson interval includes 25%, so this bucket is compatible with 25% risk, while other bins still need their own held-out evaluation."
  },
  {
    "question": "Use a Beta(2,2) prior. Compare 2/8 positives with 50/200 positives. Which posterior-mode and MLE calculation is correct?",
    "options": [
      "Both MLEs are 0.25; MAP is 3/10=0.30 and 51/202≈0.2525, so the prior shifts the smaller sample more.",
      "Both MLEs are 0.25; MAP is 4/12≈0.333 and 52/204≈0.2549, because the posterior mean is the mode.",
      "Both MLEs are 0.25; MAP remains 0.25 in each case, because a symmetric prior leaves observed rates fixed.",
      "Both MLEs are undefined; the prior supplies the likelihood estimate before a large-sample cutoff is met."
    ],
    "answer": "Both MLEs are 0.25; MAP is 3/10=0.30 and 51/202≈0.2525, so the prior shifts the smaller sample more.",
    "explanation": "For this prior the posterior mode is (k+1)/(n+2), giving 3/10 and 51/202. The posterior mean uses (k+2)/(n+4), which is a different summary."
  },
  {
    "question": "An analyst reuses one 95% Wilson interval to claim a 95% chance that the next 50 labels have a fraction inside those fixed endpoints. Which correction follows?",
    "options": [
      "The interval concerns the population rate; the next sample fraction needs a separate prediction calculation.",
      "The claim follows from confidence coverage; the next sample and the population share identical uncertainty.",
      "The claim follows after one more bootstrap; resampling turns the parameter interval into future observations.",
      "The interval bounds individual binary labels; its endpoints describe the outcome range of each future signup."
    ],
    "answer": "The interval concerns the population rate; the next sample fraction needs a separate prediction calculation.",
    "explanation": "A confidence interval describes repeated-use coverage of a fixed population parameter under a sampling model. A future sample has additional binomial variation; predicting its fraction is a separate calculation."
  },
  {
    "question": "A narrow interval uses labels revised after reviewers saw model scores. Which intervention addresses the compromised evidence?",
    "options": [
      "Freeze the rubric, blind ambiguous-case review to scores, and assess independent reviewer agreement.",
      "Increase the reviewed count with the same score-visible process, and rely on the narrower margin.",
      "Switch from Wilson to Wald while retaining the revised labels, and treat formula choice as a repair.",
      "Increase bootstrap repetitions while retaining the revised labels, and treat repetition as new evidence."
    ],
    "answer": "Freeze the rubric, blind ambiguous-case review to scores, and assess independent reviewer agreement.",
    "explanation": "Sampling formulas condition on the supplied labels. Fixing score-contaminated labels requires blinding review and measuring inter-annotator agreement."
  }
]
```

> **Next:** Continue to [Distributions and Sampling](/learn/distributions-sampling-simulation). You can now turn a finite review sample into a rate, an interval, and a sampling-bias check. Next you'll model different kinds of random outcomes and test the distributions a simulator would use to produce those samples.
