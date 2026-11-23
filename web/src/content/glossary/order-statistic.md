---
title: Order statistic
importance: 78
---

An order statistic is the observation at a specified position after sample values are sorted. The first order statistic is the smallest value, the last is the largest, and intermediate positions provide empirical quantiles. When an algorithm uses mathematical ranks starting at one, implementation code usually subtracts one to index a zero-based array.

## Sort first, then select the stated rank


Split conformal prediction selects rank $k=\lceil(n+1)(1-\alpha)\rceil$ for target coverage $1-\alpha$ and $n$ calibration observations. The additional one is part of the finite-sample exchangeability argument; replacing it with $n$ and rounding down can weaken the coverage guarantee. If the required rank exceeds $n$, the observed sample cannot supply a finite threshold at that requested coverage level.

## Example

Nine sorted residuals are `[2, 3, 3, 4, 5, 6, 7, 8, 12]`. For an 80% target, the required rank is $\lceil10\times0.8\rceil=8$, and the eighth residual is 8. A 95% target instead requires rank ten, which does not exist among nine observed values. The appropriate response is more calibration data or an explicitly unbounded prediction set.

## Why it matters here

An off-by-one quantile implementation can silently invalidate an otherwise careful uncertainty claim. Naming the order statistic connects the guarantee, the sorted calibration rows, and the exact array element selected in runnable code.

## Related terms

- [Quantile](glossary://quantile)
- [Conformal prediction](glossary://conformal-prediction)
- [Nonconformity score](glossary://nonconformity-score)
- [Exchangeability](glossary://exchangeability)
