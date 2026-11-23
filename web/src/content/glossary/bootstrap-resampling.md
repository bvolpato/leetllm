---
title: Bootstrap resampling
importance: 80
---
Bootstrap resampling estimates uncertainty by repeatedly sampling a dataset **with replacement** and recomputing a statistic. The observed sample stands in for the population; the cloud of resampled metrics approximates sampling variability when analytic intervals are awkward or the statistic is nonlinear.

Bradley Efron introduced the method in 1979 as a computer-age alternative to the jackknife. In AI evals it is the workhorse for pass rates, win rates, recall@k, support rates, preference lifts, and other finite-set metrics where a closed-form variance is messy or wrong.

## How it works

Given a sample $D = \{x_1,\ldots,x_n\}$ and a statistic $\hat\theta = \theta(D)$:

1. Draw a bootstrap sample $D^{*b}$ of size $n$ by sampling the $x_i$ **with replacement**.
2. Compute $\hat\theta^{*b} = \theta(D^{*b})$.
3. Repeat for $b = 1,\ldots,B$ (often $B = 1{,}000$ to $20{,}000$).
4. Summarize the bootstrap distribution $\{\hat\theta^{*b}\}$ with a standard error, bias estimate, or interval.

The usual **percentile** interval for level $1-\alpha$ is

$$
\big[\, q_{\alpha/2}\{\hat\theta^{*b}\},\; q_{1-\alpha/2}\{\hat\theta^{*b}\} \,\big]
$$

so a 95% interval uses the $2.5$th and $97.5$th percentiles of the $\hat\theta^{*b}$ values. Other constructions (basic/reverse-percentile, studentized, bias-corrected accelerated $BC_a$) exist; percentile intervals are the default in most LLM eval harnesses because they need only the statistic and the resamples.

Percentile coverage can be **poor** for small $n$, extreme rates near $0$ or $1$, or highly discrete metrics (few unique $\hat\theta^{*}$ values). In those regimes prefer $BC_a$ / studentized bootstrap, or a parametric interval (for example Wilson or Clopper–Pearson for a binomial rate) instead of treating the percentile band as automatic $1-\alpha$ coverage.

Increasing $B$ reduces Monte Carlo noise in the interval estimate. The information still comes from the original $n$ observations.

## Example

Suppose $200$ RAG questions yield a support rate of $0.72$ ($144$ supported). Draw $10{,}000$ bootstrap samples of size $200$ with replacement, recompute the rate each time, and take the $2.5$th and $97.5$th percentiles as a rough $95\%$ interval.

```python
import numpy as np

labels = np.array([1] * 144 + [0] * 56)
rng = np.random.default_rng(0)
boot = [
    labels[rng.integers(0, len(labels), size=len(labels))].mean()
    for _ in range(10_000)
]
lo, hi = np.percentile(boot, [2.5, 97.5])
print(round(labels.mean(), 3), round(lo, 3), round(hi, 3))
# typical output: 0.72 0.655 0.78
```

This interval describes uncertainty in one system's rate under the sampling assumptions. It does not verify significance of a change to 0.74 or 0.82. For the same tasks, bootstrap the paired difference; for independent samples, model both sources of uncertainty.

## Paired comparisons

When you compare two systems on the **same** tasks, resample complete task rows so both scores stay together. A **paired bootstrap** of the mean lift $B - A$ answers "how unstable is this head-to-head delta?" far better than two separate rate intervals that discard pairing.

On a $40$-task paired eval with $8$ B-only passes and $5$ A-only passes, the observed lift is $+7.5$ points. Resampling the per-task differences often yields an interval that still covers zero (for example roughly $[-10, +25]$ points). Report the lift and whether zero sits inside the interval; do not declare a winner from the point estimate alone.

## Unit of resampling

Resample the **independent unit**. If many rows share one user, tenant, document, conversation, or repository, resample that higher-level unit and keep all nested rows together (a cluster or block bootstrap). Nested dependence is the usual reason a naive row-level interval looks too tight.

Also match the product claim: for multi-sample metrics such as [pass@k](glossary://pass-at-k), either bootstrap whole problems (keeping all $n$ attempts per problem) or be explicit that you are treating attempts as exchangeable. Mixing those stories invents precision.


## What it cannot fix

Bootstrap intervals describe **sampling variability under the observed design**. They do not repair:

- **Coverage holes.** Four perfect fixtures can bootstrap to $[1.0, 1.0]$ and still miss whole regions of production traffic.
- **Biased labels or judges.** Resampling compromised labels only re-expresses the same bias.
- **Wrong dependence.** Row-level bootstrap on clustered multi-turn data understates variance.
- **Selection and peeking.** Predeclare metrics before viewing leaderboard results, or account for selection when interpreting intervals.

Treat a narrow interval as "this finite set is stable under resampling," not as "the product is ready."

## Why it matters here

Eval sets are finite samples. Bootstrap intervals help separate real movement from leaderboard noise before you change prompts, models, or retrieval. Paired and cluster-aware variants keep model comparisons honest when tasks are shared or rows are nested. Every offline report that claims a lift should be able to show the unit of resampling and a percentile interval for the decision quantity.

## Related terms

- [Confidence interval](glossary://confidence-interval)
- [Variance](glossary://variance)
- [Offline evaluation](glossary://offline-evaluation)
- [Evaluation slice](glossary://evaluation-slice)
- [pass@k](glossary://pass-at-k)
