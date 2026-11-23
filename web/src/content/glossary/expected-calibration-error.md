---
title: Expected calibration error
importance: 86
---

Expected calibration error (ECE) summarizes how far model confidence differs from observed accuracy or event frequency across confidence buckets. Predictions are grouped by their scores, each group's confidence is compared with its empirical outcome rate, and the absolute gaps are averaged in proportion to group size. A low ECE shows aggregate agreement under the chosen bins; inspect slices and confidence intervals before relying on individual scores.

## Formula and bin sensitivity

For bins $B_m$ containing a total of $n$ predictions, $\operatorname{ECE}=\sum_m(|B_m|/n)|\operatorname{acc}(B_m)-\operatorname{conf}(B_m)|$. In binary risk calibration, use the positive event rate and mean predicted positive probability; for multiclass top-label calibration, use prediction accuracy and mean top-class confidence. Different bin counts or boundaries can change the result, and small bins have substantial sampling uncertainty.

## Example

Suppose 40 requests have mean predicted review probability 0.8 and an observed review rate of 0.7, while 60 requests have mean probability 0.2 and observed rate 0.25. The first bin contributes $(40/100)|0.8-0.7|=0.04$. The second contributes $(60/100)|0.2-0.25|=0.03$. ECE is 0.07. A reliability plot and confidence intervals reveal information that the single aggregate hides.

## Why it matters here

Access-review routing, safety thresholds, and human escalation rely on meaningful score magnitudes as well as good ranking. ECE shows whether a strong ROC-AUC is accompanied by reliable probability estimates, especially after model upgrades, traffic shifts, or post-hoc calibration.

## Related terms

- [Calibration](glossary://calibration)
- [ROC-AUC](glossary://roc-auc)
- [Decision threshold](glossary://decision-threshold)
