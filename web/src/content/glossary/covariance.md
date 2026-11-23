---
title: Covariance
importance: 86
---
**Covariance** measures whether two variables tend to move above or below their respective means together. Positive covariance means paired deviations tend to have the same sign; negative covariance means they tend to have opposite signs. Zero covariance rules out linear co-movement in this moment; nonlinear dependence can remain. A numerically small covariance can still correspond to strong correlation when the variables have small scales.

The population expression is $\operatorname{Cov}(X,Y)=E[(X-E[X])(Y-E[Y])]$. Subtract each variable's own mean first, multiply the paired deviations, and average those products. Covariance retains the combined units of both measurements, so its magnitude depends on the original measurement scales.

## Pairing is part of the experiment

Suppose the same three tasks have baseline scores `[1, 2, 3]` and candidate scores `[2, 4, 6]`. Both increase together, so their covariance is positive. Shuffling one model's task order breaks the pairing and changes the calculation even though both sets of individual scores remain identical.

## Example

```python
import numpy as np

baseline = np.array([1.0, 2.0, 3.0])
candidate = np.array([2.0, 4.0, 6.0])
assert np.cov(baseline, candidate, ddof=1)[0, 1] == 2.0
```

Correlation divides covariance by the variables' standard deviations, producing a unitless linear-association measure. That normalization changes scale, not the need to keep the original observations correctly paired.

## Why it matters here

Paired model comparisons, correlated features, covariance matrices, principal component analysis, and variance-reduction methods all depend on tracking which measurements belong together. Ignoring pairing can inflate uncertainty or create a misleading relationship.

## Related terms

- [Correlation](glossary://correlation)
- [Pearson correlation](glossary://pearson-correlation)
- [Variance](glossary://variance)
- [PCA](glossary://pca)
