---
title: Bayes' theorem
aliases: ["Bayes rule"]
importance: 97
---
**Bayes' theorem** updates the probability of a hypothesis after observing evidence. It combines the hypothesis's prior probability with how likely that evidence would be if the hypothesis were true. The result is the posterior probability after accounting for every other way the same evidence could arise.

The rule is $P(H \mid E) = P(E \mid H)P(H) / P(E)$. Here `H` is the hypothesis, `E` is the observed evidence, `P(H)` is the prior, `P(E | H)` is the likelihood, and `P(E)` is the total probability of seeing that evidence. The denominator includes both true alerts and false alerts.

## A rare incident changes the answer

Suppose 1% of requests contain a real incident. A detector alerts on 90% of incidents and 5% of clean requests. In 10,000 requests, expect 100 incidents and 9,900 clean cases. The detector raises approximately 90 true alerts and 495 false alerts. An alert therefore corresponds to an incident only `90 / 585`, about 15.4% of the time.

## Example

```python
prior = 0.01
sensitivity = 0.90
false_positive_rate = 0.05

evidence = sensitivity * prior + false_positive_rate * (1 - prior)
posterior = sensitivity * prior / evidence
assert round(posterior, 3) == 0.154
```

High sensitivity doesn't automatically make a positive alert trustworthy when the underlying event is rare.

## Why it matters here

Model safety alerts, moderation flags, incident detection, and confidence estimates all depend on prior prevalence. Bayes' theorem prevents teams from mistaking detector sensitivity for the probability that one particular alert is correct.

## Related terms

- [Conditional probability](glossary://conditional-probability)
- [Precision and recall](glossary://precision-recall)
- [Probability calibration](glossary://probability-calibration)
- [False negative](glossary://false-negative)
