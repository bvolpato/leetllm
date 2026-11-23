---
title: Logistic regression
importance: 94
---

Logistic regression is a supervised binary classifier that turns a linear combination of features into a score between zero and one. The model applies a sigmoid to a linear score and learns coefficients by minimizing binary cross-entropy, often with a regularization penalty.

## Score, probability, and decision

With features $x$, weights $w$, and intercept $b$, the model computes $z=w^\top x+b$ and $p=1/(1+e^{-z})$. The log-odds are linear: $\log(p/(1-p))=z$. Choose the action threshold from error costs, reviewer capacity, and class prevalence. Check calibration on representative production data before treating the sigmoid score as a calibrated probability.

## Example

An access-request model outputs $z=2$. Its sigmoid score is approximately 0.881. At a threshold of 0.5, the system requests human review. However, displaying an 88.1% risk requires evidence that similar scores match observed frequencies on held-out traffic. If missed reviews cost much more than unnecessary reviews, a lower threshold may produce lower total cost.

## Why it matters here

Safety gates, escalation policies, fraud filters, and model-routing decisions all separate score generation from policy selection. Logistic regression makes that boundary explicit before later lessons introduce boosted trees, neural classifiers, ranking metrics, and calibration audits.

## Related terms

- [Cross-entropy](glossary://cross-entropy)
- [Decision threshold](glossary://decision-threshold)
- [Calibration](glossary://calibration)
