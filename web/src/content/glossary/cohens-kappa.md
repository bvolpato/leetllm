---
title: Cohen's kappa
aliases: ["Cohen kappa", "kappa agreement"]
importance: 77
---
**Cohen's kappa** measures agreement between two annotators on categorical labels after subtracting the agreement expected from their individual label frequencies. It answers a narrower question than accuracy: whether two people classify the same examples consistently beyond chance under the statistic's assumptions.

## Read the denominator before trusting the score

Let $p_o$ be observed agreement and $p_e$ the agreement expected if the annotators independently produced labels at their observed marginal frequencies. Cohen's kappa is:

$$
\kappa = \frac{p_o - p_e}{1 - p_e}
$$

A score of one means complete agreement. A score near zero means observed agreement is close to the chance expectation. Negative values mean agreement is worse than that expectation. Strong class imbalance can make raw agreement look impressive while kappa remains modest, and a single kappa score doesn't reveal whether both annotators share the same systematic misconception.

When $p_e=1$, the denominator is zero and kappa is undefined: if both reviewers mark every example safe, raw agreement is $100\%$ but there is no label variation for this adjustment. Report the label counts and that undefined result rather than calling it perfect chance-adjusted agreement. For ordered labels, weighted kappa can penalize a two-level disagreement more than a one-level disagreement; ordinary unweighted kappa treats both as disagreement. [scikit-learn kappa documentation](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.cohen_kappa_score.html)


## Example

Two reviewers label 100 model outputs as safe or unsafe. They agree on 90 examples, but each marks 80 outputs safe and 20 unsafe. Expected agreement is $0.8^2 + 0.2^2 = 0.68$, so kappa is $(0.90 - 0.68) / (1 - 0.68) = 0.6875$.

A compatible agreement matrix has $75$ safe/safe, $15$ unsafe/unsafe and $5$ examples in each disagreement cell. These marginals are what determine $p_e$; raw agreement alone cannot determine kappa.

The reviewers agree more than chance, but the team should still inspect disagreements and compare both labelers with adjudicated reference examples. A high score cannot prove that the rubric itself matches policy.

## Why it matters here

Human-feedback pipelines need trustworthy labels before training or evaluation. Cohen's kappa helps identify ambiguous rubrics, inconsistent reviewers, and inflated agreement caused by a dominant class, while adjudication and gold examples address correctness separately.

## Related terms

- [Confusion matrix](glossary://confusion-matrix)
- [Calibration](glossary://calibration)
- [Golden dataset](glossary://golden-dataset)
- [Evaluation slice](glossary://evaluation-slice)
