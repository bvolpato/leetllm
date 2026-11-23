---
title: Conditional probability
importance: 96
---
**Conditional probability** measures how likely an event is after restricting attention to cases where another event occurred. If `A` means an answer is wrong and `B` means a verifier raised an alert, `P(A | B)` asks what fraction of alerted answers are actually wrong. Its denominator is alerted answers, not every answer in the evaluation.

For `P(B) > 0`, the rule is $P(A \mid B) = P(A \cap B) / P(B)$. The numerator counts cases where both events happened. The denominator counts all cases satisfying the condition. Reversing the condition generally changes the answer: `P(alert | wrong)` and `P(wrong | alert)` answer different operational questions.

## Check the denominator first

Suppose 100 answers contain 10 real errors. A verifier alerts on eight errors and nine correct answers. There are 17 alerts altogether, so `P(wrong | alert) = 8 / 17`, while `P(alert | wrong) = 8 / 10`. The first describes alert trustworthiness; the second describes how many real errors the detector catches.

```mermaid
block-beta
 columns 3
 H["Among 17 alerted answers"]:3
 W1["×"] W2["×"] W3["×"]
 W4["×"] W5["×"] W6["×"]
 W7["×"] W8["×"] C1["✓"]
 C2["✓"] C3["✓"] C4["✓"]
 C5["✓"] C6["✓"] C7["✓"]
 C8["✓"] C9["✓"] space
 L["× wrong: 8 · ✓ correct: 9"]:3
 R["P(wrong | alert) = 8 / 17"]:3
 style H fill:transparent,stroke:transparent
 style L fill:transparent,stroke:transparent
 style R fill:transparent,stroke:transparent
```

## Example

```python
alerted_errors = 8
false_alerts = 9
errors = 10

assert alerted_errors / (alerted_errors + false_alerts) == 8 / 17
assert alerted_errors / errors == 0.8
```

These values differ because their reference groups differ. The same raw events can support both calculations without contradiction.

## Why it matters here

Safety classifiers, retrieval filters, incident detectors, and model evaluations all change meaning when the denominator changes. Correctly identifying the conditioned population prevents base-rate mistakes and prepares readers for Bayes' theorem.

## Related terms

- [Precision and recall](glossary://precision-recall)
- [False negative](glossary://false-negative)
- [Decision threshold](glossary://decision-threshold)
- [Calibration](glossary://calibration)
