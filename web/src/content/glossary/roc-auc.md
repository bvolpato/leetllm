---
title: ROC-AUC
aliases: ["AUROC", "AUC-ROC", "area under the ROC curve"]
importance: 82
---
**ROC-AUC** (area under the receiver operating characteristic curve) is a single-number summary of how well a scored binary classifier ranks positives above negatives across *all* [decision thresholds](glossary://decision-threshold). The ROC curve plots true positive rate against false positive rate as you lower the cutoff from "almost never predict positive" to "almost always predict positive." The area under that curve is ROC-AUC.

ROC-AUC answers a pairwise ranking question: pick one random positive and one random negative; how often does the model score the positive higher? Perfect separation gives $1.0$; random scores give about $0.5$. That makes ROC-AUC a **separability** (ranking) metric. Calibration and the user impact of a shipped threshold require separate measures.

## Intuition

A scoring model assigns each example a real-valued score $s(x)$ (probability estimate, logit, or any rank-preserving margin). Every threshold $\tau$ turns those scores into hard labels and fills a [confusion matrix](glossary://confusion-matrix). Two rates define one point in ROC space:

- **True positive rate (TPR)**, also called recall or sensitivity: of the true positives, what fraction do you catch?
- **False positive rate (FPR)**, also called false alarm rate: of the true negatives, what fraction do you wrongly flag?

As $\tau$ moves from high to low, the operating point walks from $(0,0)$ (predict nothing positive) toward $(1,1)$ (predict everything positive). The curve is that path. The area under it is how much of the unit square sits under the path.

Key landmarks (Fawcett's standard geometry):

| Point | Meaning |
|-------|---------|
| $(0,0)$ | Never predict positive: zero FP, zero TP |
| $(1,1)$ | Always predict positive: all TP and all FP |
| $(0,1)$ | Perfect classification: all positives scored above all negatives |
| Diagonal $y=x$ | Random guessing; area $0.5$ |

Northwest is better: higher TPR at the same FPR, or lower FPR at the same TPR. A model below the diagonal ranks *worse* than chance (you can flip scores and land above the diagonal).

ROC-AUC is useful *before* you pick $\tau$ because it ignores any single cutoff. Once you ship a cutoff, users experience [precision and recall](glossary://precision-recall), cost, and calibration at that point, not the area under the whole curve.

## Formula

From the four cells at threshold $\tau$:

$$
\mathrm{TPR}(\tau)
=
\frac{\mathrm{TP}(\tau)}{\mathrm{TP}(\tau)+\mathrm{FN}(\tau)},
\qquad
\mathrm{FPR}(\tau)
=
\frac{\mathrm{FP}(\tau)}{\mathrm{FP}(\tau)+\mathrm{TN}(\tau)}
$$

The ROC curve is the set of points $\bigl(\mathrm{FPR}(\tau),\mathrm{TPR}(\tau)\bigr)$ as $\tau$ varies. With a finite test set the curve is a step function; libraries sort scores descending and update TP/FP in one pass (Fawcett's Algorithm 2; scikit-learn `roc_curve`). ROC-AUC is the area under that curve on the unit square:

$$
\mathrm{AUC}
=
\int_{0}^{1} \mathrm{TPR}(\mathrm{FPR})\,d(\mathrm{FPR})
$$

In practice the integral is a trapezoidal sum over the discrete points. Ties at the same score should be processed as a block so the curve follows the *expected* diagonal across the tie rectangle, not an optimistic or pessimistic staircase (Fawcett).

**Mann–Whitney / Wilcoxon form.** Hanley and McNeil (1982) showed that the area equals the Wilcoxon rank-sum (Mann–Whitney $U$) statistic normalized by the number of positive–negative pairs. With positive scores $\{s_i^+\}_{i=1}^{n_+}$ and negative scores $\{s_j^-\}_{j=1}^{n_-}$:

$$
\mathrm{AUC}
=
\frac{1}{n_+\,n_-}
\sum_{i=1}^{n_+}
\sum_{j=1}^{n_-}
\begin{cases}
1 & \text{if } s_i^+ > s_j^- \\
\tfrac{1}{2} & \text{if } s_i^+ = s_j^- \\
0 & \text{if } s_i^+ < s_j^-
\end{cases}
$$

So:

$$
\mathrm{AUC}
=
P\!\left(s(X^+) > s(X^-)\right)
+
\tfrac{1}{2}\,P\!\left(s(X^+) = s(X^-)\right)
$$

for a random positive $X^+$ and random negative $X^-$. Random ranking yields $0.5$; perfect ranking yields $1.0$. A related summary used in credit scoring is the Gini coefficient $G = 2\cdot\mathrm{AUC} - 1$ (scikit-learn notes; Fawcett).

**Partial AUC.** When only low-FPR regions matter (screening, safety, fraud), integrate only over $\mathrm{FPR}\in[0,\mathrm{max\_fpr}]$. Full AUC can hide a weak left side of the curve. scikit-learn's `roc_auc_score(..., max_fpr=...)` returns McClish's *standardized* partial AUC (rescaled so random stays near $0.5$ and perfect is $1.0$ within that window), not the raw restricted integral.

**Multiclass (brief).** For more than two classes, scikit-learn supports one-vs-rest (`multi_class='ovr'`) and one-vs-one averaging (`'ovo'`, Hand and Till 2001). State which scheme and which `average` you used; they are not interchangeable under imbalance.

## Worked numbers

Three positives and four negatives, scores already sorted high to low:

| Score | True label |
|------:|:-----------|
| $0.95$ | positive |
| $0.90$ | positive |
| $0.85$ | positive |
| $0.70$ | negative |
| $0.60$ | negative |
| $0.40$ | negative |
| $0.20$ | negative |

Every positive outranks every negative: $3\times 4 = 12$ pairs all win, so $\mathrm{AUC}=12/12=1.0$. Lowering $\tau$ climbs the left edge of the plot (TPR rises at FPR $=0$), then walks right along TPR $=1$.

Now move the middle positive down so one inversion appears:

| Score | True label |
|------:|:-----------|
| $0.95$ | positive |
| $0.90$ | positive |
| $0.70$ | negative |
| $0.65$ | positive |
| $0.60$ | negative |
| $0.40$ | negative |
| $0.20$ | negative |

Pair wins:

- $0.95$ beats all $4$ negatives
- $0.90$ beats all $4$ negatives
- $0.65$ beats $0.60$, $0.40$, $0.20$ (loses to $0.70$)

Total wins $=4+4+3=11$ out of $12$, so $\mathrm{AUC}=11/12\approx 0.917$. One misordered pair costs $1/(n_+ n_-)$.

**Imbalance leaves ranking math unchanged while changing product cost.** Suppose $5$ positives and $95$ negatives with scores:

- Positives: $0.95$, $0.90$, $0.85$, $0.80$, $0.75$
- High-scoring negatives (false-alarm candidates): $0.88$, $0.86$, $0.84$, $0.82$, $0.78$, $0.76$, $0.74$, $0.72$, $0.70$, $0.68$
- Remaining $85$ negatives: score $0.10$

Counting pairs yields $463$ wins out of $5\times 95=475$, so $\mathrm{AUC}\approx 0.975$. Ranking looks strong. At $\tau=0.80$ you catch $4$ of $5$ positives (recall $0.80$) with $4$ false positives among the high-scoring negatives:

$$
\mathrm{precision}
=
\frac{4}{4+4}
=
0.50
$$

ROC-AUC summarizes ranking across thresholds. With rare positives, a modest FPR can still produce a large absolute false-positive count and low precision. Davis and Goadrich (2006) therefore argue that precision-recall curves are often more informative under heavy skew, even though ROC and PR dominance are linked.

## Diagram


The area summarizes the whole path. Production still picks one point (or a few bands: auto-block, human review, allow).

## Example

```python
from sklearn.metrics import (
    roc_auc_score,
    roc_curve,
    auc,
    precision_score,
    recall_score,
)

# Labels and scores from the "one inversion" table above
y_true = [1, 1, 0, 1, 0, 0, 0]
y_score = [0.95, 0.90, 0.70, 0.65, 0.60, 0.40, 0.20]

print(roc_auc_score(y_true, y_score))  # ~0.9167

fpr, tpr, thresholds = roc_curve(y_true, y_score)
print(auc(fpr, tpr))  # same trapezoidal area

# Operating point users feel (example threshold)
tau = 0.80
y_hat = [1 if s >= tau else 0 for s in y_score]
print(precision_score(y_true, y_hat), recall_score(y_true, y_hat))
# ROC-AUC does not replace precision / recall at the shipped tau
```

Operational checklist for classifiers that gate product actions (moderation, fraud, routing, safety):

1. Report ROC-AUC on a held-out set that matches production slices, with both classes present.
2. Plot the ROC curve or TPR at fixed low FPR targets alongside the scalar.
3. Pick $\tau$ from cost, capacity, and policy; log it with model and feature versions.
4. At that $\tau$, report precision, recall, FP/FN counts, and calibration, sliced by language, tenant, channel, and traffic age.
5. Prefer average precision / PR curves when positives are rare and false-alarm *count* drives cost.
6. Retune $\tau$ after score shifts (new model, calibration map, prevalence change). ROC-AUC is invariant to strictly increasing score transforms, but the shipped cutoff is not.

## Trade-offs

| Question | What ROC-AUC gives you | What it does not give you |
|----------|------------------------|---------------------------|
| Model ranking quality | Pairwise separation across all thresholds | Best single threshold to ship |
| Class prevalence change | Population ROC/AUC stay the same if class-conditional score distributions stay fixed | Precision at a fixed $\tau$ (prevalence-sensitive) |
| Rare positives | Can still look high if order is good | Absolute false-alarm load and precision at high recall |
| Score meaning | Works on uncalibrated ranks and logits | Whether $0.9$ is a trustworthy probability |
| Comparing models | Good default ranking summary | Guarantee that the higher-AUC model wins at *your* FPR budget (curves can cross) |
| Multiclass | Needs explicit OvR/OvO and averaging | A unique "the" AUC without stating the scheme |

Population ROC curves are invariant to class base rate when the class-conditional score distributions remain fixed, and to strictly increasing score transforms. A prevalence shift accompanied by changes within either class can change AUC; resampling also adds finite-sample variation. Two models with the same AUC can produce different precision at the recall you care about.

## Why it matters here

Safety classifiers, policy gates, fraud models, reward heads that rank preferences, and eval harnesses for binary detectors all emit scores that must be ranked and then cut. ROC-AUC is the standard check that the score order is informative *before* you argue about thresholds. The engineering habit it teaches is strict: a high aggregate ranking number can be real and still insufficient for a shipped classifier. After AUC, you still need an operating point, [precision and recall](glossary://precision-recall) with support, and [probability calibration](glossary://probability-calibration) if absolute scores drive auto-actions.

## Related terms

- [Precision and recall](glossary://precision-recall)
- [Decision threshold](glossary://decision-threshold)
- [Class imbalance](glossary://class-imbalance)
- [Probability calibration](glossary://probability-calibration)
- [Confusion matrix](glossary://confusion-matrix)
