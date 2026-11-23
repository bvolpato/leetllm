---
title: Null hypothesis
importance: 92
---
A **null hypothesis** is the reference claim a statistical test assumes when computing how surprising the observed data would be. In a model comparison, the null might state that the candidate and baseline have no difference in the outcome being measured. A small p-value can provide evidence against that particular null under the test's assumptions.

The null hypothesis is a reference model for calculating how surprising the observed data would be. A noisy evaluation or a small sample can leave an important effect unresolved. A failure to reject leaves practical equivalence unresolved; support that conclusion with an adequately powered equivalence test and a prespecified margin. Rejecting a no-difference null provides evidence of a measured difference under the test assumptions; assess its size separately for operational value.

## Match the null to the question

For a paired benchmark, evaluate both models on the same tasks and define the null in terms of their paired differences. For a safety release, a more useful null can be that the candidate's failure rate exceeds an acceptable bound. The reference claim, experimental unit, test direction, and decision threshold must be specified before interpreting a p-value.


## Example

Suppose a baseline and candidate answer the same 40 tasks. The candidate uniquely solves eight, while the baseline uniquely solves five. A paired null says neither model has a systematic advantage on the discordant tasks. With only three more candidate wins, sampling noise could still explain the observed edge.

An equivalence claim requires a different design: define a practically acceptable margin and test whether the effect lies inside that margin.

## Why it matters here

Model launches, prompt experiments, and safety gates often compare uncertain measurements. Clear null hypotheses prevent teams from treating an inconclusive test as proof of equality or treating statistical significance as proof of practical importance.

## Related terms

- [P-value](glossary://p-value)
- [Statistical power](glossary://statistical-power)
- [Confidence interval](glossary://confidence-interval)
- [A/B testing](glossary://ab-testing)
