---
title: Conditional coverage
importance: 85
---

Conditional coverage measures whether prediction sets contain true outcomes after conditioning on a subgroup, feature value, or other declared slice. Requiring 90% coverage for every tenant or prompt-length group is stronger than requiring 90% coverage averaged over all requests. Exact distribution-free conditional coverage at every possible feature value is generally unavailable without stronger assumptions or uninformative sets.

Distinguish pointwise conditional coverage, $P(Y\in C(X)\mid X=x)\ge1-\alpha$ for almost every $x$, from group coverage, $P(Y\in C(X)\mid G(X)=g)\ge1-\alpha$ for a pre-declared group function $G$. Good coverage on a few broad groups does not guarantee coverage at every feature value inside them. Group-specific conformal calibration can target group coverage when calibration and future examples are exchangeable within each group and the method handles its finite sample count.

## Inspect the aggregate and its slices separately

Group-specific evaluation requires enough representative outcomes in each slice. Small subgroups produce noisy measured rates, so observed coverage should be reported with sample counts and appropriate uncertainty. Recalibration, group-aware scores, or models that adapt interval width to input-dependent error may improve conditional behavior, but the chosen method's actual guarantee still needs explicit review.

## Example

In a hypothetical $1{,}000$-request audit, intervals contain measured latency for $768$ of $800$ short prompts ($96\%$), but only $108$ of $200$ long prompts ($54\%$). Aggregate coverage is $(768+108)/1000=87.6\%$, above an $80\%$ target, while observed long-prompt coverage is $54\%$. Report subgroup counts and uncertainty intervals to expose and quantify the mismatch.

## Why it matters here

AI serving workloads differ across customer groups, request sizes, languages, and operational conditions. One attractive average can hide a concentrated failure pattern. Conditional-coverage checks connect uncertainty evaluation to the slices where product and reliability decisions are actually made.

## Related terms

- [Marginal coverage](glossary://marginal-coverage)
- [Conformal prediction](glossary://conformal-prediction)
- [Evaluation slice](glossary://evaluation-slice)
- [Nonconformity score](glossary://nonconformity-score)
