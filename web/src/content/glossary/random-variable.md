---
title: Random variable
importance: 90
---
A **random variable** assigns a numerical value to the outcome of an uncertain process. It specifies a mapping from possible outcomes to numbers, together with probabilities describing how those outcomes occur. One execution reveals a realized value; the random variable describes the experiment's possible values and their distribution.

A discrete random variable has countable possible values, such as the number of passing evaluation rows or the number of retries before success. A continuous random variable can range over an interval, such as modeled request latency. Each observed value is one draw from the process; future runs vary according to its distribution.

## Define the experiment before sampling

For one model evaluation row, define `X = 1` when the answer passes and `X = 0` when it fails. If the pass probability is 0.8, then `P(X = 1) = 0.8` and `P(X = 0) = 0.2`. The numerical encoding makes averages, totals, and uncertainty calculations possible without changing the underlying pass/fail event.


## Example

```python
outcomes = [True, False, True, True]
observed_values = [int(passed) for passed in outcomes]
assert observed_values == [1, 0, 1, 1]
assert sum(observed_values) / len(observed_values) == 0.75
```

The observed sample mean is 0.75. It estimates the process's pass probability; an interval or additional samples quantify uncertainty about its long-run value.

## Why it matters here

Every pass rate, sampled token, incident count, latency measurement, and Monte Carlo estimate starts by defining what uncertain outcome is being measured. Clear random-variable definitions keep distributions and expectations tied to real experimental units.

## Related terms

- [Variance](glossary://variance)
- [Distribution dispersion](glossary://distribution-dispersion)
- [Confidence interval](glossary://confidence-interval)
- [Pass at k](glossary://pass-at-k)
