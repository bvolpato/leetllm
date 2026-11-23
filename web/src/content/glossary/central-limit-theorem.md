---
title: Central limit theorem
aliases: ["CLT"]
importance: 88
---
The **central limit theorem** states that, under suitable conditions, the distribution of a standardized sample mean approaches a normal distribution as the number of independent observations increases. It describes repeated-sample means; individual observations can follow other distributions.

In the common independent, identically distributed setting with finite variance, a sample mean has standard deviation `sigma / sqrt(n)`, where `sigma` is the population standard deviation and `n` is the sample size. Larger samples make the mean more stable, but doubling the sample size doesn't halve that uncertainty; reducing it by half requires approximately four times as many independent observations.

## Count independent units

Suppose one evaluation task produces ten model attempts. Those ten attempts may share the same prompt, label, and hidden difficulty. Treating them as ten independent tasks can make a confidence interval too narrow. Grouping by task preserves the actual experimental unit before relying on a normal approximation.

## Example

```python
import math

population_spread = 20.0
assert population_spread / math.sqrt(25) == 4.0
assert population_spread / math.sqrt(100) == 2.0
```

Increasing the sample from 25 to 100 independent observations halves the standard deviation of the sample mean. It doesn't change the original observations' 20-unit spread.

## Why it matters here

Confidence intervals, approximate hypothesis tests, and evaluation sample-size estimates often rely on stable averages. Heavy tails, tiny samples, dependent rows, or mismatched experimental units can invalidate the approximation, so assumptions must accompany the calculation.

## Related terms

- [Standard deviation](glossary://standard-deviation)
- [Variance](glossary://variance)
- [Confidence interval](glossary://confidence-interval)
- [Bootstrap resampling](glossary://bootstrap-resampling)
