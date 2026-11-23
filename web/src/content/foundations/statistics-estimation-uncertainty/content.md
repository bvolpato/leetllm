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

This week the review queue is larger than the team can label. Reviewers can draw 100 flagged signups at random and confirm 16 abuse cases. The dashboard wants to report `16%`, while the review lead needs to decide how much that number could move before changing capacity. [Bayesian Inference from Evidence](/learn/bayesian-inference-priors-posteriors) combined ten coding-agent outcomes with an explicit prior. Here we'll ask how a sample-based estimate moves across repeated audits, before returning to the role of a prior.

The earlier [probability lesson](/learn/probability-for-machine-learning) counted 95 abusive flags among all 590 flags in a fully labeled signup snapshot. That was a population calculation. This week's queue is much larger and mostly unlabeled: `16 / 100` is evidence about an unknown rate, not an exact count of the whole queue.

## Start with the target behind 16%

Before doing arithmetic, finish this sentence: "16 of 100 **what**?" Both numbers refer to flagged signups, so the sample has a precise target:

| Name | Meaning here |
|---|---|
| Population | every flagged signup entering the manual-review queue this week |
| Sample | 100 flagged signups selected at random and reviewed by humans |
| Success | reviewer confirms the signup is abusive |
| Unknown rate | $P(\text{abusive} \mid \text{flagged})$, also called <span data-glossary="precision-recall">review-queue precision</span> |

The **population** is the full set you want to describe. This week's queue is that population. The **sample** is the 100 signups you managed to label. It's evidence about the queue, not a smaller name for the queue itself. Now name the target quantity: the **estimand** is the queue's unknown abuse rate, $p = P(\text{abusive} \mid \text{flagged})$.

The **estimator** is the rule applied to labels, here $\hat{p} = k/n$. This sample produces one realized **estimate**, $16/100 = 0.16$. A different random sample could produce a different estimate even if the queue's true rate stayed fixed.

$$
\hat{p} = \frac{16}{100} = 0.16
$$

The hat on $\hat{p}$ says "estimate." It doesn't say the full queue is exactly 16 percent abuse. For a Bernoulli rate, $k/n$ is also the **maximum-likelihood** estimate: the value of $p$ that makes these observed labels most likely under the model. The decision concerns the flagged queue rather than all signups. If only 1 percent of all signups are abusive, a useless model that labels every signup clean is 99 percent accurate. For review planning, ask how much of the flagged queue is worth a human review. Run that smallest possible report before adding any uncertainty machinery:

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

That denominator assumes all 100 selected signups received a usable label. Suppose instead that 80 are resolved, including 16 abuse cases, while 20 remain unresolved:

| Calculation | What it describes |
|---|---|
| `16 / 80 = 20%` | abuse among the resolved cases |
| `16 / 100 = 16%` | treats every unresolved case as non-abuse |
| `16 / 100` through `(16 + 20) / 100` | possible abuse fractions in the selected sample: 16% through 36% |

The last range lets every missing label be either negative or positive. These **missing-label bounds** cover the unresolved cases in the selected sample. Estimating uncertainty for the queue also requires accounting for sampling variation. If difficult or high-risk cases are less likely to be resolved, dropping them can bias the result even though the original selection was random. Report selected, resolved, and unresolved counts, then investigate why labels are missing.[^statcanWeightingEstimation2009]

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

The batches don't all return 16 percent. That movement isn't model drift because the simulated rate never changed. It's sampling variation. One measured rate answers a question about one sample. A production claim needs both the center and the amount that center can move.

The simulation knew the true rate because we wrote it into the code. A real audit doesn't. It has to estimate sampling movement from the labels already in hand.

## Replay sampling with the labels in hand

Our real audit has sixteen `1` values and eighty-four `0` values. The true queue risk remains unknown. The **<span data-glossary="bootstrap-resampling">bootstrap</span>** repeatedly samples 100 rows *with replacement* from those observed labels. Each resample gives another value of $k/n$, so its distribution approximates how the estimate might move if we could redraw the audit. It uses the empirical sample distribution as a plug-in estimate of the population without adding new data.[^efron1979][^hastie2009]

For example, one resample might draw a particular abusive signup three times and omit another entirely. It does not need to preserve exactly 16 successes. `rng.choice(..., replace=True)` performs that draw; each of its 5,000 rows is a resampled audit. Taking the 2.5th and 97.5th percentiles gives a **percentile bootstrap interval**.[^scipyBootstrap2026]

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

The central bootstrap range is much wider than a single point. It approximates sampling uncertainty by treating these labels as the population. That approximation can fail: with ten zero labels, every resample also contains ten zeros, so the percentile interval collapses to `[0, 0]`. Resampling can't invent an unobserved abuse case. We'll need a different interval for that boundary case. Extra bootstrap repetitions only reduce Monte Carlo jitter in those percentile cut points. They don't add reviewed signups or repair a biased sample.

Row-by-row resampling also assumes the rows act like independent draws. If the audit selects whole groups of linked signups, keep those groups together when estimating uncertainty; ten related rows aren't necessarily ten independent pieces of evidence. Match the resampling unit to the sampling design.[^statcanWeightingEstimation2009]

Try a separate, deliberately extreme audit: draw ten independent signup campaigns, then label ten signups from each. Two campaigns are entirely abusive and eight entirely clean. The sample fraction is `20 / 100 = 20%`, but outcomes within each campaign are identical. Predict which bootstrap interval will be wider.

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

`campaign_labels[campaign_indices]` has shape `(10_000, 10, 10)`: resampled audits, campaigns, and signups. Averaging the last two axes gives one estimate per audit. The row bootstrap breaks the dependence and creates the illusion of 100 independent observations. Here only ten independently sampled campaigns supply new evidence.

Ten campaigns are still a small sample, so coverage can vary widely around the nominal 95% level. A zero lower endpoint leaves population risk unresolved. This equal-size example illustrates the resampling unit; unequal campaign sizes or more complex selection require an estimator and resampling scheme matched to the intended signup population.[^statcanWeightingEstimation2009] Bootstrap gives us an empirical picture. For a binary rate, we can also estimate its typical movement with a short formula.

## Put a scale on the movement

Bootstrap gave us a distribution of possible estimates. For this binary rate, we can also get a quick scale for that movement from the 16 successes in 100 labels. With `16 / 100`, the estimated variance of one binary label is `0.16 × 0.84 = 0.1344`. Averaging 100 independent labels divides that variance by 100. Take the square root to put it back on the rate's scale:

$$
\widehat{SE} = \sqrt{\frac{0.16 \times 0.84}{100}} \approx 0.0367
$$

That's about **3.7 percentage points** of typical sampling movement, not a 3.7 percent relative error. Under the independent-binomial model, the estimator's <span data-glossary="variance">variance</span> is $p(1-p)/n$. Substituting the observed rate $\hat{p}$ for the unknown $p$ gives the general standard-error estimate:

$$
\widehat{SE} = \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}
$$

Standard error is the estimated <span data-glossary="standard-deviation">standard deviation</span> of the **estimator** across repeated samples. It isn't the spread of individual labels. Notice the $\sqrt{n}$ in the denominator: standard error scales as $1/\sqrt{n}$. Cutting your typical sampling margin in half requires $4\times$ as many labels. Cutting it by a factor of 10 requires reviewing $100\times$ as many signups. This square-root penalty governs labeling budgets across machine learning: statistical certainty gets progressively more expensive as you demand narrower margins. The <span data-glossary="central-limit-theorem">central limit theorem</span> explains why a sample mean can approach a normal shape as enough independent observations accumulate. It doesn't rescue tiny samples, dependent rows, or rates near 0 and 1.

These examples treat the live queue as much larger than the sample. Sampling a substantial fraction of a fixed queue without replacement needs a finite-population correction, because inspecting more of the queue leaves fewer unknown labels. A census of all its labels has no sampling uncertainty about that queue, though future traffic and label errors remain uncertain. A familiar first approximation turns that scale into the **Wald interval**:

$$
\hat{p} \pm 1.96 \widehat{SE} = 0.16 \pm 0.0719 \approx [0.088,\ 0.232]
$$

Evaluating the interval midpoint reveals that the Wald midpoint is the observed rate, `0.16`; the standard error supplies the margin on each side.

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

For a rough 95 percent interval, use $z = 1.96$. The center isn't $\hat{p}$ because the score construction adds a small adjustment toward 0.5. With $n=100$ and $\hat{p}=0.16$, $z^2 \approx 3.84$, so the center is about $(0.16 + 3.84/200) / (1 + 3.84/100) \approx 0.173$. For `0 / 10`, the same adjustment moves the center off zero and keeps the margin positive. The code below uses $z=1.96$ exactly and returns `center - margin` and `center + margin`, clipped to $[0, 1]$. Evaluating boundary conditions demonstrates that Wald collapses at both endpoints, whereas Wilson remains leave room above `0` after zero successes and below `1` after ten successes.

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

A 95% confidence level describes repeated use of the procedure: draw a sample, calculate an interval, and check whether it contains the true rate. Wilson targets 95% coverage under the binomial model and typically improves on Wald, but its coverage isn't exactly 95% for every sample size and rate.[^nistConfidenceIntervals2026][^nistBinomialIntervals2026] Coverage describes the procedure across replications. After seeing one realized interval, don't read it as "probability 0.95 that the true rate sits inside these two numbers." It isn't a posterior probability on these fixed endpoints.

The interval concerns the population rate, not the outcome of one signup or the fraction in the next 100 labels. That next batch has its own sampling variation even if the population rate were known exactly. Forecasting its count requires a prediction calculation, which we'll develop through binomial simulation in the next lesson.

For the review decision, if a threshold lies inside this two-sided 95% interval, the interval does not prove that the rate is above or below it. Inclusion isn't proof of equality. Keep the sample size and confidence level fixed in advance; repeatedly checking until an interval clears a threshold requires a different analysis. For this binary report, use the Wilson interval. The immediate question is now practical: how much does a larger, still-representative sample narrow it?

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

In a real audit, the slice rates are estimates too. Confirm that the shares describe the target queue and that labels were selected randomly within each slice. If you deliberately review equal numbers from unequal-sized slices, don't pool their raw counts as though the result were a simple random sample of the queue. Weight the rates by population shares, and calculate uncertainty using the sampling design rather than applying the unweighted Wilson formula to the pooled counts.[^statcanWeightingEstimation2009] This trade-off has a clean mathematical foundation: the **bias-variance decomposition** of Mean Squared Error ($\text{MSE}$). For any estimator $\hat{p}$ targeting the unknown queue rate $p$:

$$
\text{MSE}(\hat{p}) = \mathbb{E}[(\hat{p} - p)^2] = \text{Bias}(\hat{p})^2 + \text{Var}(\hat{p})
$$

where $\text{Bias}(\hat{p}) = \mathbb{E}[\hat{p}] - p$. Under the independent-binomial model for a representative sample, the estimator is unbiased: $\text{Bias}(\hat{p}) = 0$. Mean squared error equals sampling variance, $\text{Var}(\hat{p}) = p(1-p)/n$. Gathering more independent labels drives variance down as $1/n$ (and standard error down as $1/\sqrt{n}$). A random sample without replacement is also unbiased for a fixed queue's rate, but uses the finite-population correction discussed above. Neither calculation removes labeling errors or uncertainty about future traffic.

When you sample only routine domestic flags, your estimator converges to $\mathbb{E}[\hat{p}] = 0.120$ instead of the true queue rate $p = 0.176$. That leaves an irreducible bias of $\text{Bias} = 0.120 - 0.176 = -0.056$. Even if you label 10,000 domestic signups so variance collapses near zero:

$$
\text{MSE}(\hat{p}) \to (-0.056)^2 + 0 \approx 0.00314
$$

The squared bias term creates an error floor while the sampling plan stays domestic-only. To reduce it, spend part of the labeling budget on the omitted slices and weight their rates by the queue mix.

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

The Bayesian lesson asked whether forecasts line up with outcomes on new tasks. That's <span data-glossary="calibration">calibration</span>: among many comparable cases assigned a probability near 20 percent, do about 20 percent have positive outcomes? Use a separate audit of 100 randomly selected signups all assigned risk `0.20` before reviewers see their outcomes. Suppose 16 are abusive. These are new labels, chosen from one score bucket; the same `16 / 100` arithmetic applies. The observed gap is four percentage points. Does this bucket have enough evidence to rule out 20 percent?

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

The interval includes 20 percent, so this preselected bucket hasn't established a calibration failure by the two-sided 95% comparison. It hasn't established exact calibration either. A wide interval can hide an operationally important gap.

Real buckets contain nearby, not identical, predictions. Compare their average prediction with their observed rate and preserve the number of labels in each bucket. Use held-out outcomes, choose bins before inspecting them, and don't treat one compatible bucket as evidence that the whole model is calibrated. Searching many buckets for a mismatch also needs a multiple-comparison plan.[^nistBonferroni2026] Deep networks can be miscalibrated even when accuracy looks strong, so calibration has to be measured rather than assumed.[^guo2017] Accuracy and calibration answer different questions, and neither replaces representative labels. A rate, an interval, a sampling plan, and a calibration comparison are now separate claims. Printing only 16 percent would hide which claim a reader is looking at.

```checkpoint
A risk bucket predicts 20 percent, while 16 of 100 reviewed cases are positive and the observed Wilson interval is 10.1 to 24.4 percent. Can this sample establish miscalibration?
---
No. The interval still includes 20 percent, so the four-point observed gap is compatible with finite-sample variation. Gather more representative labels before declaring a calibration failure.
```

## Print the counts, the interval, and the sampling plan

A report should let someone reconstruct the estimate before they act. This function prints the numerator, denominator, estimate, interval width, and sampling method. It doesn't decide whether to launch. That decision still needs costs, thresholds, and slice coverage.

There's no universal label count that makes an audit adequate. A 14-percentage-point interval may be enough for rough staffing and too wide for a close policy decision. Show the width and let the decision's tolerance determine whether more labels are needed. A slice name alone also isn't a sampling plan: say how its reviewed cases were selected.

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

The international line is a separate sample of 100 international flags, not a subset of the mixed 16/100 draw. Neither line should claim to measure next month's traffic without evidence that the population is comparable. Also record which important slices still lack labels. A number without its collection process invites overconfidence.

## Tighter intervals don't fix the wrong labels

An interval around queue precision measures **estimation uncertainty**: how much a finite reviewed sample can move. It doesn't identify every reason a detector can fail. Ask what happens when the interval is narrow but reviewers saw model predictions before resolving ambiguous cases. The arithmetic can be precise while the labels no longer represent an independent review process.

| Problem | What it looks like | Does a tighter interval fix it? |
|---|---|---|
| finite representative sample | measured precision moves across random label batches | yes, more representative labels narrow it |
| sampling bias | only one routine slice was reviewed | no, change the sample design |
| ambiguous labels | reviewers disagree on whether a signup is abuse | no, improve rubric and measure agreement |
| unfamiliar deployment traffic | new payment path or geography appears | no, add coverage and retrain or route safely |
| miscalibrated score | predicted-risk buckets disagree with observed rates | no, measure and calibrate on held-out labels |

Some literature groups irreducible input or label ambiguity under **aleatoric uncertainty**, and lack of knowledge about unfamiliar cases under **epistemic uncertainty**. Those names can be useful, but the repair matters more: don't use an interval for sampling noise as if it solved biased sampling, unclear labels, or unfamiliar traffic.

## Practice with 24/120 high-value flags

Transfer the audit to one new slice. You review `24 / 120` flagged high-value signups and confirm abuse. Before calculating, predict whether 120 labels can settle a 25 percent policy threshold.

1. Compute the point estimate and run the `wilson_interval` function for `24, 120`.
2. Decide whether this sample alone proves the high-value slice meets a 25 percent minimum precision requirement.
3. Your routine-domestic slice has `120 / 1000` abuse. Explain why you can't replace one slice with the other.
4. A predicted-risk bucket averages 25 percent risk and contains `24 / 120` abuse. Decide whether this is enough to declare it miscalibrated.

Solution checks:

| Item | Check |
|---|---|
| Point estimate | `24 / 120 = 0.20` |
| Wilson interval | approximately `[0.138, 0.280]` |
| 25 percent requirement | the interval crosses 25 percent, so this sample does not prove that precision is below or above the requirement |
| Slice swap | high-value and routine-domestic flags represent different populations; combine them only with a valid sampling/weighting plan |
| Calibration call | no; 25 percent remains plausible within this finite bucket's interval |

The original `16 / 100` wasn't wrong; it was incomplete. Counts plus an interval describe sampling uncertainty. The sampling method and label process determine which population that description deserves to represent.

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
    "explanation": "The denominator contains flagged signups. This sample estimates P (abuse|flagged), not a probability with a different denominator. A point estimate does not identify the exact queue rate."
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
    "explanation": "The observed rate is 0.2 in each sample. Standard error scales as 1/sqrt (n), so quadrupling 150 to 600 halves it under the independent model. More resamples reduce simulation jitter, not finite-label uncertainty."
  },
  {
    "question": "An audit has 0 positives among 20 independent labels. Wald and a percentile bootstrap both collapse to zero. Which interpretation is justified?",
    "options": [
      "Zero outcomes still leave population uncertainty; the 95% Wilson upper bound is about 16.1%.",
      "Zero outcomes establish a zero population rate; both matching methods remove the need for an interval.",
      "The bootstrap creates missing positive cases; its upper bound recovers the unknown population risk.",
      "The likelihood has no maximum at zero; discard this audit until a positive case becomes available."
    ],
    "answer": "Zero outcomes still leave population uncertainty; the 95% Wilson upper bound is about 16.1%.",
    "explanation": "At zero the plug-in Wald scale vanishes, and all bootstrap resamples of observed zeros are zeros. Wilson instead gives an upper endpoint 1.96²/(20+1.96²)≈0.1611. Neither collapsed calculation proves zero population risk."
  },
  {
    "question": "A toy queue has disjoint shares 50%,30%,20% with known positive rates 10%,20%,40%. A sample covers only the first slice. What is the full-queue rate?",
    "options": [
      "19%, using the slice-weighted sum; the first slice’s 10% targets a different population.",
      "23.3%, using the unweighted mean; each slice contributes one rate to the overall queue.",
      "10%, using the largest slice’s rate; its majority share determines the overall fraction.",
      "40%, using the highest-risk slice’s rate; the maximum defines the queue-wide fraction."
    ],
    "answer": "19%, using the slice-weighted sum; the first slice’s 10% targets a different population.",
    "explanation": "The weighted rate is 0.5 × 0.1+0.3 × 0.2+0.2 × 0.4=0.19. Sampling only the first slice does not prove either omitted rate, and more labels from that slice do not repair selection bias."
  },
  {
    "question": "A new slice audit observes 18/90 positives, with 95% Wilson interval about [13.0%,29.4%]. A minimum-quality rule requires 25%. Which evidence report follows?",
    "options": [
      "Report counts, interval and selection; this interval crosses 25%, leaving the threshold unresolved.",
      "Approve the slice from 29.4%; an upper endpoint above the threshold establishes the minimum rate.",
      "Reject the slice from 20%; the point estimate below the threshold makes sampling uncertainty irrelevant.",
      "Pool it with a larger low-risk slice; a larger denominator establishes this slice’s threshold status."
    ],
    "answer": "Report counts, interval and selection; this interval crosses 25%, leaving the threshold unresolved.",
    "explanation": "The interval covers values on both sides of 25%. An upper endpoint is not a demonstrated lower bound, and the point estimate alone does not settle the threshold. Preserve the sampled population and design."
  },
  {
    "question": "A preselected bucket forecasts 25% risk. A held-out audit finds 12/60 positives with Wilson interval about [11.8%,31.8%]. What follows from this bucket?",
    "options": [
      "The forecast remains compatible with these labels; one bucket does not prove whole-model calibration.",
      "The model is exactly calibrated across buckets; including 25% establishes the entire calibration curve.",
      "The bucket is miscalibrated from its 20% estimate; a five-point difference establishes a population gap.",
      "The labels are unnecessary for calibration; the configured forecast is the bucket’s measured outcome rate."
    ],
    "answer": "The forecast remains compatible with these labels; one bucket does not prove whole-model calibration.",
    "explanation": "The finite bucket interval includes 25%, so this comparison does not prove a calibration failure or exact calibration. Other bins and multiple comparisons need their own predeclared evaluation."
  },
  {
    "question": "Use a Beta (2,2) prior. Compare 2/8 positives with 50/200 positives. Which posterior-mode and MLE calculation is correct?",
    "options": [
      "Both MLEs are 0.25; MAP is 3/10=0.30 and 51/202≈0.2525, so the prior shifts the smaller sample more.",
      "Both MLEs are 0.25; MAP is 4/12≈0.333 and 52/204≈0.2549, because the posterior mean is the mode.",
      "Both MLEs are 0.25; MAP remains 0.25 in each case, because a symmetric prior leaves observed rates fixed.",
      "Both MLEs are undefined; the prior supplies the likelihood estimate before a large-sample cutoff is met."
    ],
    "answer": "Both MLEs are 0.25; MAP is 3/10=0.30 and 51/202≈0.2525, so the prior shifts the smaller sample more.",
    "explanation": "For this prior the posterior mode is (k+1)/(n+2), giving 3/10 and 51/202. The posterior mean uses (k+2)/(n+4), which is a different summary. Prior terms are not newly reviewed cases."
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
    "explanation": "A confidence interval describes repeated-use coverage of a fixed population parameter under a sampling model. A future sample has additional variation; predicting its fraction is a separate calculation."
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
    "explanation": "Sampling calculations condition on the supplied labels. Fix model-influenced labeling and assess agreement; neither a different formula nor more resampling removes that influence."
  }
]
```

> **Next:** Continue to [Distributions and Sampling](/learn/distributions-sampling-simulation). You can now turn a finite review sample into a rate, an interval, and a sampling-bias check. Next you'll model different kinds of random outcomes and test the distributions a simulator would use to produce those samples.
