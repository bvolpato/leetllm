---
title: Standard deviation
importance: 92
---
**Standard deviation** measures the typical scale of deviations from a mean. It is the square root of variance, so it uses the same units as the original measurements. If request latency is measured in milliseconds, standard deviation is also measured in milliseconds, while variance uses squared milliseconds.

For a population, $\sigma = \sqrt{E[(X-\mu)^2]}$, where `mu` is the population mean. A sample estimate commonly divides the sum of squared deviations by `n - 1` before taking the square root. Use `n` for the population calculation and `n - 1` for the usual sample-variance estimate.

## Spread and uncertainty of the mean

Suppose three latencies are 80, 100, and 120 milliseconds. Their mean is 100. Deviations are -20, 0, and 20 milliseconds. The population standard deviation is about 16.3 milliseconds; the sample standard deviation is 20 milliseconds. For independent, identically distributed observations with finite variance, an estimated standard error of the sample mean is the sample standard deviation divided by the square root of the sample size. Correlated requests or clustered evaluation rows require a dependence-aware estimate. Under these assumptions, the `n - 1` correction makes sample variance unbiased; its square root generally has a downward bias as an estimate of population standard deviation.


## Example

```python
import statistics

latencies = [80, 100, 120]
assert statistics.stdev(latencies) == 20
assert round(statistics.pstdev(latencies), 1) == 16.3
```

The values differ because one treats the three observations as a sample and the other treats them as the full population.

## Why it matters here

Evaluation scores, training loss, request latency, and experiment effects fluctuate. Standard deviation quantifies observation spread, while confidence intervals and standard errors answer separate questions about uncertainty in an estimated average.

## Related terms

- [Variance](glossary://variance)
- [Distribution dispersion](glossary://distribution-dispersion)
- [Confidence interval](glossary://confidence-interval)
- [Quantile](glossary://quantile)
