---
title: Marginal coverage
importance: 86
---

Marginal coverage is the probability that a prediction set contains the true outcome when averaging over the relevant population and the randomness in the procedure's calibration data. A conformal method targeting $1-\alpha$ coverage controls this population-wide probability under its assumptions. The guarantee is marginal: subgroup, individual-feature, fixed-calibration-set, and short-window coverage require separate analysis.

## Average coverage over the whole target population

The guarantee depends on calibration and future examples having the required exchangeability relationship. Traffic drift, time dependence, selective filtering, or reusing calibration labels to tune the model can invalidate the ordinary argument. Even when the global guarantee is valid, rare groups can receive much worse coverage than common groups.

## Example

A latency model issues intervals targeting 80% coverage. Four fresh requests produce three covered outcomes and one miss, or 75% observed coverage; that outcome is consistent with the target because realized proportions fluctuate. Conversely, 96% coverage for short prompts and 54% for long prompts can produce an acceptable aggregate when short prompts dominate, while long-request users remain poorly protected.

## Why it matters here

Operational alerts and release dashboards often show one average coverage value. Report subgroup performance beside the marginal value to show coverage for each tenant, prompt length, or deployment slice.

## Related terms

- [Conditional coverage](glossary://conditional-coverage)
- [Conformal prediction](glossary://conformal-prediction)
- [Exchangeability](glossary://exchangeability)
- [Prediction interval](glossary://prediction-interval)
