---
title: Expected value
aliases: ["expectation"]
importance: 94
---
An **expected value** is the probability-weighted average of a random variable's possible outcomes. It summarizes the long-run mean implied by a probability model. For discrete outcomes, $E[X] = \sum_x x P(X=x)$: multiply each value by its probability, then add the products.

An expectation describes a long-run mean; an individual outcome may differ. A retry process can average 1.5 requests even though each execution uses a whole number of requests. Likewise, an average latency can hide rare but expensive tail events.

For a continuous variable with density $f$, use $E[X]=\int x f(x)\,dx$. A finite expectation requires $E[|X|]<\infty$; some heavy-tailed distributions have an infinite or undefined mean. Interpreting a sample average as converging to that finite mean also requires an appropriate sampling assumption, such as independent, identically distributed observations.

## Counts first, then the formula

Suppose a model request succeeds immediately 80% of the time and needs exactly one retry 20% of the time. Define `X` as the total number of attempts. The two possible values are 1 and 2, so the expected request count is `1 * 0.8 + 2 * 0.2 = 1.2`. Over many similar requests, that predicts about 120 attempts per 100 user requests.

## Example

```python
from math import isclose

attempt_probabilities = {1: 0.8, 2: 0.2}
expected_attempts = sum(count * probability for count, probability in attempt_probabilities.items())
assert isclose(expected_attempts, 1.2)
```

Interpret 1.2 as the average across many similar requests; each request uses an integer number of attempts.

## Why it matters here

Expected values support token-cost forecasts, retry budgets, average model quality, and Monte Carlo estimators. They must be interpreted alongside variability and tail behavior when decisions depend on reliability rather than average cost alone.

## Related terms

- [Random variable](glossary://random-variable)
- [Probability distribution](glossary://probability-distribution)
- [Variance](glossary://variance)
- [Quantile](glossary://quantile)
