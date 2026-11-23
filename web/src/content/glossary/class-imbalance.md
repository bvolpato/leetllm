---
title: Class imbalance
importance: 84
---
Class imbalance is when some labels appear far more often than others in training or evaluation data. The model and the metrics then spend most of their attention on the majority class, so aggregate scores can look strong while rare, costly, or safety-critical classes fail.

Imbalance is a property of the label distribution, not of the model architecture. A 98/2 split and a 99.9/0.1 split create the same failure pattern at different severity: majority behavior dominates the loss, dominates accuracy, and often dominates a random eval sample that contains too few positives to measure recall.

## Intuition

Accuracy is a frequency-weighted average of correctness. When almost every row is the easy majority label, a constant majority predictor scores near-perfect accuracy and zero minority recall. Unweighted cross-entropy gives frequent classes more terms in the objective, so minority errors can contribute little to the average. Actual gradient contributions also depend on how difficult the individual examples are; class counts alone do not determine them.

The product usually cares about asymmetric costs. Missing fraud, escalation, jailbreak, or tool-abuse cases is expensive; over-flagging is a different cost. Imbalance is dangerous when the rare class is also the high-cost class.

## Formula

**Imbalance ratio** (binary, positive as minority):

$$
\mathrm{IR}=\frac{N_{\mathrm{maj}}}{N_{\mathrm{min}}}
$$

A 50,000 / 1,000 split has $\mathrm{IR}=50$. Multiclass work often reports per-class support $n_c$ and frequency $n_c / N$.

**Balanced class weights** (scikit-learn `class_weight="balanced"`):

$$
w_c=\frac{N}{C\cdot n_c}
$$

where $N$ is the number of samples, $C$ is the number of classes, and $n_c$ is the count of class $c$. Minority classes get larger $w_c$, so each minority example contributes more to the training objective without inventing new rows.

**Weighted cross-entropy** (per example with true class $y$):

$$
\mathcal{L}=-w_y\log p_y
$$

**Focal loss** (Lin et al., RetinaNet) down-weights easy, well-classified examples so easy majority mass does not drown hard minority cases:

$$
\mathrm{FL}(p_t)=-\alpha_t(1-p_t)^\gamma\log(p_t)
$$

Here $p_t$ is the model probability of the true class, $\gamma\ge 0$ is the focusing parameter ($\gamma=0$ recovers cross-entropy with the remaining $\alpha_t$ weight; $\gamma=2$ is a common default in the original work), and $\alpha_t$ is an optional class-balance factor.

## Example

A support-routing classifier sees $N=50{,}000$ tickets. Only $1{,}000$ (2%) need human escalation (`escalate`); $49{,}000$ are `auto`.

| Predictor | Accuracy | Escalate recall | Escalate precision |
|-----------|----------|-----------------|--------------------|
| Always `auto` | $0.98$ | $0$ | undefined (no positives predicted) |
| Always `escalate` | $0.02$ | $1.0$ | $0.02$ |
| Useful model (example) | $0.972$ | $0.80$ | $0.40$ |

The constant-`auto` baseline scores "98% accuracy" while missing every escalation case. With $n_{\mathrm{auto}}=49{,}000$, $n_{\mathrm{escalate}}=1{,}000$, balanced weights are:

$$
w_{\mathrm{auto}}=\frac{50{,}000}{2\cdot 49{,}000}\approx 0.51,\qquad w_{\mathrm{escalate}}=\frac{50{,}000}{2\cdot 1{,}000}=25
$$

Because $w_c \propto 1/n_c$, each escalate example contributes exactly $n_{\mathrm{auto}}/n_{\mathrm{escalate}}=49\times$ more loss weight than an auto example ($25 / 0.51 \approx 49$).

At a decision threshold of $0.5$ on the escalate score, the "useful model" might flag $2{,}000$ tickets: $800$ true escalations (TP), $1{,}200$ false alarms (FP), and $200$ misses (FN). Then:

$$
\mathrm{precision}=\frac{800}{2000}=0.40,\qquad\mathrm{recall}=\frac{800}{1000}=0.80
$$

Accuracy can still look high because true negatives dominate. A [confusion matrix](glossary://confusion-matrix) and per-class support make the trade-off explicit. Lowering the [decision threshold](glossary://decision-threshold) raises escalate recall and usually lowers precision; choose the cutoff from product costs because $0.5$ is only a conventional threshold.

## Metrics that survive imbalance

Use metrics that expose minority-class performance:

- Per-class precision, recall, and F1 with support counts
- Macro-F1 (unweighted mean across classes) when each class should matter equally
- Balanced accuracy (mean recall across classes); the always-`auto` binary baseline scores $0.5$ rather than $0.98$
- Precision-recall curves and average precision for the rare positive class
- Cost-weighted error when false negatives and false positives have known dollar or risk costs

ROC-AUC can still look strong under heavy imbalance because it ranks positives above negatives without reflecting how many false alarms appear at a high-recall threshold. Ship decisions need operating-point precision, recall, and calibration alongside ranking AUC.

For very rare classes, a random holdout may contain too few positives to estimate recall. Use stratified splits, report confidence intervals or bootstrap ranges when support is small, and keep a dedicated challenge set of rare / high-cost cases.

## Sampling and training levers

Match the lever to data size, label quality, and error costs:

| Lever | What it does | Watch for |
|-------|----------------|-----------|
| Class / sample weights | Reweight loss; no new rows | Over-emphasizing noisy minority labels |
| Oversampling minority | Repeat or synthesize rare rows (e.g. SMOTE on tabular features) | Leakage if applied before split; weak on text/embeddings without care |
| Undersampling majority | Drop majority rows | Throws away information; variance if data is small |
| Stratified batching | Keep class mix stable per batch | Still needs the right objective |
| Focal-style losses | Focus on hard examples | Tune $\gamma$ and $\alpha$, and pair the loss with accurate labels |
| Threshold tuning | Fix model, change operating point | Must re-tune after score distribution shifts |
| Collect more minority labels | Improve support and coverage | Often the highest ROI when rare class is product-critical |

Apply resampling only on the training fold, never on validation or test, or you inflate metrics. Class weights and threshold tuning usually come before heavy synthetic oversampling for modern neural classifiers on text.

Reweighting or oversampling changes the score's relationship to production prevalence. Tune thresholds and check calibration on a held-out set representing the deployment distribution. A rare-case challenge set tests difficult behaviors. Estimate production precision using a sample that reflects deployment prevalence.

```python
# sklearn-style balanced weights for the support-routing counts above
# w_c = n_samples / (n_classes * n_c)
n = {"auto": 49000, "escalate": 1000}
N, C = sum(n.values()), len(n)
weights = {c: N / (C * count) for c, count in n.items()}
# {'auto': ~0.51, 'escalate': 25.0}
```

## Production and safety slices

Rare classes are often the ones that matter in production AI: jailbreaks, policy violations, fraud, payment disputes, human escalation, hallucinated citations, and catastrophic tool actions. Majority-class "looks fine" dashboards hide these until volume makes the misses visible.

Treat minority performance as an [evaluation slice](glossary://evaluation-slice) with its own support, gate, and owner. Stratify online metrics the same way as offline ones. When labels for the rare class are also noisier (under-reviewed edge cases), fix labeling before trusting aggressive reweighting.

## Why it matters here

Imbalance makes accuracy and unstratified evals misleading. LeetLLM systems, safety classifiers, routing models, and production LLM filters need per-class support, recall on costly classes, thresholds that reflect real error costs, and challenge sets for rare failure modes. A high headline score with empty minority support provides no evidence about rare-class performance.

## Related terms

- [Precision and recall](glossary://precision-recall)
- [Confusion matrix](glossary://confusion-matrix)
- [Decision threshold](glossary://decision-threshold)
- [False negative](glossary://false-negative)
- [ROC-AUC](glossary://roc-auc)
