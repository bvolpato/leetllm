---
title: Pearson correlation
aliases: ["Pearson correlation coefficient", "Pearson's r"]
importance: 76
kind: term
---
**Pearson correlation** measures linear association between paired numeric variables. Sample coefficient is

$$
r =
\frac{\sum_i (x_i-\bar{x})(y_i-\bar{y})}
{\sqrt{\sum_i (x_i-\bar{x})^2}\sqrt{\sum_i (y_i-\bar{y})^2}},
$$

For at least two paired observations and nonzero spread in both variables, $r\in[-1,1]$. If either variable is constant, the denominator is zero, so $r$ is undefined. Values near $1$ indicate strong positive linear co-movement, near $-1$ strong negative linear co-movement, and near zero little linear association. [SciPy's Pearson documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html) describes these conditions.

A correlation near zero can coexist with nonlinear dependence, and a large magnitude alone establishes no causal effect. Small samples, outliers, duplicated points, restricted ranges, trends over time, and autocorrelation can make the coefficient misleading.

## Example

For a toy set of three aligned updates, entropy values $[3,2,1]$ and logprob-mismatch values $[0.1,0.2,0.3]$ give $r=-1$: the points lie exactly on a descending line. That summarizes co-movement inside the chosen lineage and window. It cannot tell whether entropy change caused mismatch, mismatch changed updates, or a third event moved both. Two nonconstant pairs also always give $|r|=1$, which illustrates why a perfect coefficient from a tiny sample is weak evidence.

## Reporting checklist

- sample size and unit;
- exact run lineage and time window;
- scatter plot and time order;
- handling of duplicates and missing data;
- confidence interval when inference matters, with assumptions or resampling appropriate to time dependence rather than treating correlated updates as independent samples;
- explicit statement that coefficient is descriptive unless design supports causal claim.

## Why it matters here

Training reports often align entropy, support, mismatch, clipping, reward, and step on shared axis. Pearson coefficient compresses pairwise linear trend, but timeline, lineage, and controlled replay still carry causal argument.

## Related terms

- [Correlation](glossary://correlation)
- [Spearman rank correlation](glossary://spearman-rank-correlation)
- [Confidence interval](glossary://confidence-interval)
- [Change-point detection](glossary://change-point-detection)
