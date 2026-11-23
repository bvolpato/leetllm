---
title: Quantile
aliases: ["tail quantile", "percentile"]
importance: 72
kind: term
---
A **quantile** locates a chosen fraction of a distribution. A common population definition is $q_p=\inf\{x:F(x)\ge p\}$ for $0<p<1$, where $F(x)=P(X\le x)$. Median is a $0.5$ quantile. A percentile expresses the fraction on a scale from zero to one hundred, so p99 is the $0.99$ quantile. With ties or discrete values, exactly $p$ of the observations need not lie strictly below the reported value.

For empirical values sorted as $x_{(1)} \le \cdots \le x_{(n)}$, sample quantile estimates inverse cumulative distribution. Libraries use several interpolation conventions, so exact value can differ on small samples even when requested probability is same.


## Why tails matter

Mean can stay stable while small subset gets much worse. For policy ratios or logprob deltas, report center and both tails: lower quantiles expose tokens trainer scores much less than rollout, while upper quantiles expose opposite direction. Absolute-error quantiles lose sign, so keep signed and absolute views separate.

Quantiles also need sample count and population contract. Per-token p99 weights long trajectories more heavily than per-sequence p99, and pooling engines can hide one bad worker.

## Example

If most ratios cluster near one but small group lies far below one, mean may remain ordinary. Low percentile and low-side clipped fraction reveal mismatch tail.

## Why it matters here

Trainer-versus-rollout failures often begin in small token subset. Quantiles expose that tail before mean shifts enough to trigger broad alert, while signed lower and upper tails show which stack assigns more probability.

## Related terms

- [Variance](glossary://variance)
- [Confidence interval](glossary://confidence-interval)
- [Policy ratio](glossary://policy-ratio)
- [Anomaly](glossary://anomaly)
