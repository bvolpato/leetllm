---
title: Variance
importance: 88
---
**Variance** measures how far values spread around their mean. For a random variable $X$ with mean $\mu = \mathbb{E}[X]$, it is the expected squared deviation from that mean. Averages alone hide this: two systems can share the same mean score while one is stable and the other swings enough to flip a ship decision week to week.

In AI work the word shows up in three related places: the spread of raw metric values, the sampling uncertainty of an aggregate (how much a mean would move if you redrew the sample), and the bias-variance story of model sensitivity to which training set you drew. Same mathematics; different objects you are measuring.

## Intuition

Variance averages squared distance from the mean. Large deviations dominate because they are squared. Units of variance are the square of the original units (score², milliseconds²), so day-to-day reporting often uses the **standard deviation** $\sigma = \sqrt{\mathrm{Var}(X)}$ when you want a scale that matches the metric.

Three spreads to keep separate:

| Object | What moves | Typical question |
| --- | --- | --- |
| Outcome variance | Per-row scores or latencies | How noisy is this metric on the population? |
| Estimator variance | Sample means, deltas, pass rates | How stable is this number if we redraw $n$ units? |
| Model variance (bias-variance) | Predictions as training data changes | Does this fit change a lot across datasets of size $n$? |

A binary pass rate of $0.5$ has outcome variance $0.25$ by construction. High **estimator** variance obscures whether an observed lift reflects a true change or sampling noise.

## Formula

**Population (true) variance.** With $\mu = \mathbb{E}[X]$,

$$
\mathrm{Var}(X) = \mathbb{E}\big[(X - \mu)^2\big] = \mathbb{E}[X^2] - \mu^2.
$$

(The second form is algebraically identical; prefer the first or a stable two-pass algorithm in floating-point code when $\mathbb{E}[X^2]$ and $\mu^2$ are close.)

**Sample variance.** Given $n\ge2$ iid observations $x_1,\ldots,x_n$ with finite variance and sample mean $\bar{x}$, the usual unbiased estimator of population variance (Bessel's correction) is

$$
s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2.
$$

Dividing by $n$ instead of $n-1$ underestimates population variance when the mean is estimated from the same sample. The difference shrinks as $n$ grows; use Bessel's correction for small evaluation sets.

**Variance of a sample mean.** For i.i.d. observations with finite variance $\sigma^2$,

$$
\mathrm{Var}(\bar{X}) = \frac{\sigma^2}{n}, \qquad \mathrm{SE}(\bar{X}) = \frac{\sigma}{\sqrt{n}}.
$$

Estimator noise shrinks like $1/\sqrt{n}$. Doubling $n$ halves $\mathrm{Var}(\bar{X})$ and reduces SE by a factor of $1/\sqrt{2} \approx 0.71$.

For a binary pass rate $\hat{p}$ with $n$ independent trials, $\mathrm{Var}(\hat{p}) = p(1-p)/n$, estimated by $\hat{p}(1-\hat{p})/n$. That is the usual input to [confidence intervals](glossary://confidence-interval) and [power](glossary://statistical-power) planning.

**Bias-variance decomposition (squared error).** For $y = f(x) + \varepsilon$ with $\mathbb{E}[\varepsilon\mid x]=0$ and $\mathrm{Var}(\varepsilon\mid x)=\sigma^2$, fresh test noise independent of training data $D$, and a learner $\hat{f}(\cdot;D)$, the expected prediction error at a fixed $x$ decomposes as

$$
\mathbb{E}_{D,\varepsilon}\big[(y - \hat{f}(x;D))^2\big]
=
\big(\mathrm{Bias}_D[\hat{f}(x;D)]\big)^2
+ \mathrm{Var}_D[\hat{f}(x;D)]
+ \sigma^2,
$$

where $\mathrm{Bias}_D[\hat{f}(x;D)] = \mathbb{E}_D[\hat{f}(x;D)] - f(x)$ and $\mathrm{Var}_D[\hat{f}(x;D)] = \mathbb{E}_D\big[(\hat{f}(x;D) - \mathbb{E}_D[\hat{f}(x;D)])^2\big]$. High model variance is the statistical face of classical [overfitting](glossary://overfitting): the fit moves a lot when $D$ changes. Geman, Bienenstock, and Doursat (1992) made this the standard neural-net framing; the same split still explains train-validation gaps in fine-tunes and reward models.

## Example

Two offline evals both report mean score $0.82$ on $n = 8$ tasks (scores in $[0,1]$).

**Stable set A:** $\{0.80, 0.81, 0.82, 0.82, 0.83, 0.82, 0.81, 0.85\}$

**Noisy set B:** $\{0.56, 0.99, 0.60, 0.98, 0.83, 0.97, 0.66, 0.97\}$

Both have $\bar{x} = 0.82$ (sum $6.56$). Sample variances (divide by $n-1$):

$$
s_A^2 \approx 0.00023, \qquad s_B^2 \approx 0.0345.
$$

Standard errors of the mean:

$$
\mathrm{SE}_A = s_A/\sqrt{8} \approx 0.0053, \qquad
\mathrm{SE}_B = s_B/\sqrt{8} \approx 0.066.
$$

A three-point shift is many single-mean SEs on A and less than one on B. Use the uncertainty of the *difference*, including paired-score covariance, to establish model improvement. Both means equal 0.82, while set B has much wider uncertainty.

```python
import statistics

a = [0.80, 0.81, 0.82, 0.82, 0.83, 0.82, 0.81, 0.85]
b = [0.56, 0.99, 0.60, 0.98, 0.83, 0.97, 0.66, 0.97]
for name, xs in [("A", a), ("B", b)]:
    s2 = statistics.variance(xs)  # sample variance, / (n-1)
    se = s2**0.5 / len(xs) ** 0.5
    print(name, round(statistics.mean(xs), 3), round(s2, 5), round(se, 4))
# A 0.82 0.00023 0.0053
# B 0.82 0.03446 0.0656
```

For a binary metric, the same idea is sharper. Pass rate $\hat{p}=0.82$ on $n=50$ independent tasks has estimated SE $\sqrt{0.82\times0.18/50} \approx 0.054$. On $n=2000$, SE drops to about $0.0086$. Small golden sets invent "wins" that vanish when $n$ grows.


## How it shows up in production

**Evals and leaderboards.** Report mean **and** spread (or a CI / bootstrap interval). A model can raise average score while widening the tail on safety, rare locales, or long-context rows. Slice before trusting one aggregate.

**A/B tests and ship gates.** Power and [minimum detectable effect](glossary://minimum-detectable-effect) scale with outcome variance. Noisy human ratings, long-tail prompts, and multi-turn sessions inflate $\sigma^2$ and force huge $n$ unless you reduce variance ([CUPED](glossary://cuped), better primary metrics, pairing).

**Wrong independence.** If many rows share a user, tenant, conversation, or repository, row-level variance understates true estimator variance. Resample or analyze at the independent unit ([bootstrap](glossary://bootstrap-resampling) on clusters).

**Sampling and decode noise.** Temperature, top-$p$, and judge models add run-to-run variance on top of task variance. Fix seeds or average multiple samples when estimating model quality across stochastic draws.

**Training.** High model variance (sensitivity to which fine-tune rows you drew) shows up as large train-holdout gaps and unstable adapter quality across data shuffles. Regularization, more diverse data, and early stopping trade variance against bias.

## Why it matters here

Variance quantifies how much a metric may shift across samples. Estimate it on the decision-relevant unit before making a release decision. Gather data or revise the metric when uncertainty remains high.

## Related terms

- [Confidence interval](glossary://confidence-interval)
- [Statistical power](glossary://statistical-power)
- [Bootstrap resampling](glossary://bootstrap-resampling)
- [CUPED](glossary://cuped)
- [Overfitting](glossary://overfitting)
