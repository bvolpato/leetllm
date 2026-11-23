---
title: Probability distribution
aliases: ["probability distributions"]
importance: 95
---
A **probability distribution** specifies how probability is allocated across the possible values of a random variable. For discrete values, each outcome receives a probability and those probabilities sum to one. When a continuous variable has a probability density, probabilities over intervals correspond to areas under the density curve rather than its height at one exact point. A cumulative distribution function, $F(x)=P(X\le x)$, also describes distributions that mix discrete and continuous components or don't have a density.

A distribution describes more than a typical value. Its spread, asymmetry, tails, and dependence structure influence how often unusual events occur. Two systems can share the same average request latency while having very different probabilities of a costly slow request.

## Match the family to the experiment

A Bernoulli distribution describes one pass/fail trial. A binomial distribution counts successes across a fixed number of independent Bernoulli trials with the same success probability. A categorical distribution chooses one item from several named outcomes, such as the next token. A normal distribution can approximate some aggregated measurements, but a nonnegative, right-skewed latency often requires a different model.

## Example

```python
from math import isclose

token_probabilities = {"approve": 0.7, "review": 0.2, "reject": 0.1}
assert isclose(sum(token_probabilities.values()), 1.0)
assert isclose(token_probabilities["review"] + token_probabilities["reject"], 0.3)
```

The probability of anything other than `approve` is 0.3 because the two alternative outcomes are mutually exclusive and exhaust the remaining cases.

## Why it matters here

Language models produce categorical token distributions, evaluation runs generate binary outcomes, and system measurements expose long latency tails. Choosing the right distribution makes simulations, uncertainty estimates, and operational decisions reflect the process being measured.

## Related terms

- [Random variable](glossary://random-variable)
- [Variance](glossary://variance)
- [Quantile](glossary://quantile)
- [Sampling support](glossary://sampling-support)
