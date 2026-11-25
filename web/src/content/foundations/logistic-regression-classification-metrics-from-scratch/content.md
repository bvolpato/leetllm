---
{
  "id": "logistic-regression-classification-metrics-from-scratch",
  "title": "Logistic Regression and Metrics",
  "slug": "logistic-regression-classification-metrics-from-scratch",
  "section": "Classical ML & Evaluation",
  "category": "Model Architecture",
  "difficulty": "Easy",
  "order": 2,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Turn two features into a probability, derive the loss and gradient, and train logistic regression in NumPy. Then follow the same predictions through thresholds, precision, recall, ranking, and calibration.",
  "keyConceptsTested": [
    "sigmoid activation",
    "log loss / binary cross-entropy",
    "gradient of logistic loss",
    "decision threshold tuning",
    "confusion matrix (TP/FP/TN/FN)",
    "precision, recall, F1-score",
    "ROC curve and AUC",
    "reliability diagram / calibration plot",
    "Expected Calibration Error (ECE)",
    "NumPy from-scratch implementation",
    "scikit-learn comparison",
    "imbalanced classification pitfalls"
  ]
}
---

An assistant drafts replies from retrieved passages. Most are well grounded, yet 4% slip in an unsupported claim. Predicting "safe" on every reply scores 96% accuracy while catching zero bad claims.

That failure is why classification needs calibrated probabilities, cross-entropy loss, and metrics that separate ranking from thresholding. Unlike [linear regression](/learn/linear-regression-from-scratch), **logistic regression** outputs the probability of the positive class (`y = 1` for an unsupported claim, `y = 0` for a supported reply). We will derive its loss and gradient from scratch in NumPy, verify the fit against scikit-learn, and follow the exact same predictions through thresholds, error costs, ROC-AUC, precision-recall, and calibration.[^hastie2009]

## From two features to one probability

Each response has two features: **ambiguity** $x_1$ (higher when passages conflict) and **retrieval support** $x_2$ (higher when passages directly back the claim). A linear **logit** combines them:

$$
z = w_0 + w_1 x_1 + w_2 x_2.
$$

With $w = [-1, 1.2, -0.6]$ and $x = (3, 2)$, we get $z = 1.4$. The **sigmoid** maps any real logit into $(0, 1)$:

$$
p = \sigma(z) = \frac{1}{1 + e^{-z}}, \qquad \sigma'(z) = p(1 - p).
$$

Here $p = \sigma(1.4) \approx 0.802$. Sigmoid rises steepest at $z = 0$ (max slope `0.25`) and saturates in both tails: moving $z$ from $-1$ to $1$ shifts $p$ by `0.462`, whereas moving $z$ from $4$ to $6$ shifts $p$ by just `0.016`.

<figure>
  <img src="illustrations/_generated/sigmoid_saturation_curve_dark.png" alt="Smooth sigmoid and derivative curves from scores minus six to six, showing maximum slope 0.25 at zero and comparing an equal score move from minus one to one with a move from four to six, where probability changes by 0.462 versus 0.016." />
  <figcaption>The derivative peaks at `0.25` when `z = 0`, so a two-point score move near the center changes probability by `0.462`. The same score move in the positive tail changes it by only `0.016`.</figcaption>
</figure>

## Binary cross-entropy and its clean gradient

Each binary label follows a Bernoulli likelihood $P(Y_i = y_i \mid x_i) = p_i^{y_i}(1 - p_i)^{1 - y_i}$. Maximizing the joint likelihood across $N$ independent examples is equivalent to minimizing the mean negative log-likelihood, **log loss** or **binary cross-entropy (BCE)**:[^bishop2006][^murphy2012]

$$
L(w) = -\frac{1}{N}\sum_{i=1}^N \left[y_i \log p_i + (1 - y_i)\log(1 - p_i)\right].
$$

For $y = 1$, $p = 0.8$ costs `0.223` nats while a confident mistake $p = 0.01$ costs `4.605`. Evaluating directly from the logit via $\ell(z, y) = \operatorname{logaddexp}(0, z) - yz$ avoids overflow even at $z = \pm 1000$.

By the chain rule, the sigmoid slope $p(1 - p)$ cancels cleanly against the log-loss denominator:

$$
\frac{\partial \ell}{\partial w_j}
= \left(\frac{p - y}{p(1 - p)}\right) \cdot p(1 - p) \cdot x_j
= (p - y) x_j.
$$

Even a confidently wrong positive at $z = -8$ ($p \approx 0.000335$) still gets logit gradient $p - 1 \approx -0.9997$. Squared error $(p - y)^2$ keeps the extra $p(1 - p)$ factor (gradient `-0.00067` at $z = -8$) and makes the loss nonconvex. By contrast, BCE has Hessian $\nabla^2 L = \frac{1}{N} X^\top \operatorname{diag}(p_i(1 - p_i)) X \succeq 0$, so the objective is convex in $w$. (On perfectly separable data, add an L2 penalty $\frac{\lambda}{2}\|\beta\|_2^2$ on feature weights $\beta = [w_1, w_2]^\top$ so weights stay finite.)

## Train logistic regression from scratch in NumPy

Here are eight labeled responses where neither feature separates the classes alone:

| Response | Ambiguity $x_1$ | Support $x_2$ | Label $y$ |
|---|---:|---:|---:|
| R1 / R2 | 1.0 / 1.5 | 1 / 2 | 0 / 0 |
| R3 / R4 | 2.0 / 3.5 | 3 / 6 | 1 / 1 |
| R5 / R6 | 4.0 / 4.5 | 7 / 5 | 1 / 1 |
| R7 / R8 | 2.8 / 3.2 | 4 / 8 | 0 / 0 |

Prepend a column of ones so $X \in \mathbb{R}^{8 \times 3}$ includes the intercept. Averaging $(p_i - y_i) x_i$ gives the batch update $\nabla_w L = \frac{1}{N} X^\top (p - y)$ and $w \leftarrow w - \eta \nabla_w L$. Starting at $w = 0$ ($p = 0.5$ everywhere), `R4` contributes $[-0.5, -1.75, -3.0]$, the batch mean gradient is $[0, -0.34375, -0.375]$, and one step at $\eta = 0.2$ lands at $[0, 0.06875, 0.075]$.

<figure>
  <img src="illustrations/_generated/gradient_update_signal_dark.png" alt="Logistic-regression gradient heatmap for eight candidate responses at zero weights, showing each row contribution to intercept, ambiguity, and retrieval-support gradients, their average gradient, and the first update to weights 0, 0.069, and 0.075." />
  <figcaption>At zero weights, every response starts at `p = 0.5`. Multiplying each signed error by its feature <span data-glossary="vector">vector</span> creates the row heatmap; column averages give `g = [0, -0.344, -0.375]`, so the first `lr = 0.2` update becomes `w = [0, 0.069, 0.075]`.</figcaption>
</figure>

Check the analytic gradient with central finite differences, train in NumPy, and verify parity against scikit-learn's unregularized `LogisticRegression(C=np.inf, fit_intercept=False)`:[^numpy2020][^sklearn2011][^sklearnLogisticRegression2026]

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="logistic-regression-numpy-and-sklearn.py"
import numpy as np
from sklearn.linear_model import LogisticRegression

def sigmoid(z: np.ndarray) -> np.ndarray:
    return np.exp(-np.logaddexp(0.0, -z))

def bce_logits(y_true: np.ndarray, z: np.ndarray) -> float:
    return float(np.mean(np.logaddexp(0.0, z) - y_true * z))

# 1. Finite-difference gradient check on R4 at w = 0 + extreme logit stability
x4, y4, w0, eps = np.array([1.0, 3.5, 6.0]), 1.0, np.zeros(3), 1e-6
analytic = (float(sigmoid(x4 @ w0)) - y4) * x4
numeric = np.array([
    (bce_logits(np.array([y4]), np.array([x4 @ (w0 + eps * e)]))
     - bce_logits(np.array([y4]), np.array([x4 @ (w0 - eps * e)]))) / (2 * eps)
    for e in np.eye(3)
])
print("gradient match:", np.allclose(analytic, numeric, atol=1e-6), analytic.round(3))
print("extreme logits finite:", np.isfinite(bce_logits(np.array([0.0, 1.0]), np.array([1000.0, -1000.0]))))

# 2. Batch gradient descent on the 8 training responses
X_raw = np.array([
    [1.0, 1.0], [1.5, 2.0], [2.0, 3.0], [3.5, 6.0],
    [4.0, 7.0], [4.5, 5.0], [2.8, 4.0], [3.2, 8.0],
])
y = np.array([0, 0, 1, 1, 1, 1, 0, 0])
X = np.c_[np.ones(len(X_raw)), X_raw]

w = np.zeros(X.shape[1])
for epoch in range(3000):
    w -= 0.2 * (X.T @ (sigmoid(X @ w) - y)) / len(X)
    if epoch in (0, 200, 2999):
        print(f"epoch={epoch + 1:4d}  loss={bce_logits(y, X @ w):.4f}  w={np.round(w, 3)}")

# 3. Verify against scikit-learn L-BFGS on the identical unregularized objective
clf = LogisticRegression(C=np.inf, solver="lbfgs", max_iter=5000, fit_intercept=False).fit(X, y)
print("sklearn weights:", np.round(clf.coef_[0], 3))
print("train probs:    ", np.round(sigmoid(X @ w), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
gradient match: True [-0.5  -1.75 -3.  ]
extreme logits finite: True
epoch=   1  loss=0.6830  w=[0.    0.069 0.075]
epoch= 201  loss=0.4648  w=[-2.205  1.615 -0.462]
epoch=3000  loss=0.4072  w=[-4.894  3.399 -0.959]
sklearn weights: [-4.914  3.414 -0.964]
train probs:     [0.079 0.153 0.274 0.777 0.88  0.996 0.687 0.156]
```
<!-- leetllm: output:end -->

Loss falls from `0.6931` to `0.4072`, and our weights `[-4.894, 3.399, -0.959]` closely match scikit-learn's `[-4.914, 3.414, -0.964]`. Because $\log\frac{p}{1 - p} = \beta^\top x + b$, each unit increase in $x_j$ multiplies the **odds** $p/(1 - p)$ by $e^{w_j}$, and any probability threshold $t$ defines a straight boundary $\beta^\top x + b = \log\frac{t}{1 - t}$. Sliding $t$ moves that line parallel to itself without refitting $w$. For $K > 2$ mutually exclusive classes, extend sigmoid to [Softmax and Cross-Entropy](/learn/softmax-cross-entropy-optimization).

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Fitted logistic-regression boundaries over ambiguity and retrieval support, with eight labeled training responses and straight decision contours at thresholds 0.20, 0.50, and 0.80. R3 sits on the direct side of the 0.50 contour even though it needed verification; R7 sits on the verification side even though direct delivery was grounded." />
  <figcaption>Changing the threshold moves the straight decision line without refitting the weights. At `t = 0.50`, `R3` is a missed verification (`p = 0.274`) and `R7` is an unnecessary check (`p = 0.687`).</figcaption>
</figure>

## Confusion matrix, precision, recall, and error costs

Freeze $w = [-4.894, 3.399, -0.959]$ and score eight held-out **validation** responses (`V1..V8`):

| Response | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Actual $y$ | 0 | 0 | 1 | 0 | 1 | 0 | 1 | 1 |
| Predicted $p$ | 0.061 | 0.169 | 0.595 | 0.624 | 0.971 | 0.325 | 0.990 | 0.244 |

At $t = 0.20$, six replies are flagged: all four positives (`TP = 4, FN = 0`) plus `V4` and `V6` (`FP = 2, TN = 2`).

<figure>
  <img src="illustrations/_generated/confusion_matrix_quadrants_dark.png" alt="Eight validation scores in two actual-class lanes, divided by a vertical threshold at 0.20. V1 and V2 are true negatives left of the cut. Right of it are four true positives and two false positives, V6 and V4. There are no false negatives. The validation table gives each point its exact score." />
  <figcaption>Position is the score; the vertical cut is the cutoff rule. At `t = 0.20`, every response needing verification is to the right of the cut. The two extra checks are `V6` and `V4`.</figcaption>
</figure>

Three core metrics summarize those counts:

$$
\text{Precision} = \frac{TP}{TP + FP}, \qquad
\text{Recall} = \frac{TP}{TP + FN}, \qquad
F_1 = \frac{2PR}{P + R} = \frac{2TP}{2TP + FP + FN}.
$$

**Precision** (`4/6 = 0.667`) inspects the flagged pile; **recall** (`4/4 = 1.000`) inspects all actual positives; **F1** (`0.800`) is their harmonic mean, punishing collapse in either term (precision `1.0` with recall `0.01` gives F1 `0.0198`). Accuracy hides rare-event failures because it credits true negatives.

When a missed unsupported claim costs \$120 and an unnecessary verification costs \$18 ($\text{cost} = 120\,FN + 18\,FP$), compare thresholds directly on validation:[^sklearnThresholdTuning2026]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="choose-threshold-on-validation.py"
import numpy as np

p_val = np.array([0.061, 0.169, 0.595, 0.624, 0.971, 0.325, 0.990, 0.244])
y_val = np.array([0, 0, 1, 0, 1, 0, 1, 1])

for t in (0.20, 0.50, 0.80):
    pred = (p_val >= t).astype(int)
    tp = int(((pred == 1) & (y_val == 1)).sum())
    fp = int(((pred == 1) & (y_val == 0)).sum())
    fn = int(((pred == 0) & (y_val == 1)).sum())
    prec = tp / (tp + fp) if tp + fp else 0.0
    rec = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
    print(f"t={t:.2f} precision={prec:.3f} recall={rec:.3f} f1={f1:.3f} cost=${120 * fn + 18 * fp}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
t=0.20 precision=0.667 recall=1.000 f1=0.800 cost=$36
t=0.50 precision=0.750 recall=0.750 f1=0.750 cost=$138
t=0.80 precision=1.000 recall=0.500 f1=0.667 cost=$240
```
<!-- leetllm: output:end -->

Threshold `0.20` wins at \$36 (saving \$102 over `0.50`) because an \$18 extra check on `V6` beats a \$120 miss on `V8`. Always tune thresholds on validation and evaluate once on an untouched test split.

<figure>
  <img src="illustrations/_generated/threshold_calibration_audit_dark.png" alt="Three threshold cuts show validation error cost split into unnecessary-verification cost and missed-verification cost. At thresholds 0.20, 0.50, and 0.80, totals are 36, 138, and 240 dollars; the lowest tested total comes from two false positives and no false negatives." />
  <figcaption>Threshold `0.20` wins this validation comparison because two \$18 verification checks cost less than one \$120 missed error. The cost model makes preventing a miss worth an additional check.</figcaption>
</figure>

## Ranking across thresholds: ROC-AUC and precision-recall

Sweeping $t$ from high to low evaluates the entire ranking. The **ROC curve** plots $\mathrm{TPR} = TP / (TP + FN)$ against $\mathrm{FPR} = FP / (FP + TN)$. **ROC-AUC** equals the fraction of positive-negative pairs where the positive scores higher (ties count `0.5`): here positives win 13 of 16 pairs, giving `13/16 = 0.8125`.

<figure>
  <img src="illustrations/_generated/roc_threshold_sweep_dark.png" alt="Validation ROC staircase with threshold checkpoints 0.80, 0.50, and 0.20 alongside a four-by-four positive-versus-negative score matrix with 13 ranking wins out of 16 pairs, producing AUC 0.8125." />
  <figcaption>The staircase sweeps every validation score. The matrix gives the equivalent ranking view: positive responses outrank negatives in `13` of `16` pairs, so AUC is `13 / 16 = 0.8125`.</figcaption>
</figure>

The **precision-recall curve** tracks precision versus recall across the same sweep. Negative `V4` (`0.624`) enters ahead of positive `V3` (`0.595`), dipping precision to `0.667` before recovering to `0.750`. **Average precision (AP)** weights precision by recall steps, $\mathrm{AP} = \sum_k (R_k - R_{k-1}) P_k = \frac{1 + 1 + 3/4 + 4/6}{4} \approx 0.854$.[^sklearnAveragePrecision2026]

<figure>
  <img src="illustrations/_generated/precision_recall_focus_dark.png" alt="Validation precision-recall threshold points, including the dip to precision 0.667 when false positive V4 enters before true positive V3, and final precision 0.5 when all eight rows enter. Beside them are verification queues at thresholds 0.80, 0.50, and 0.20." />
  <figcaption>Precision isn't monotonic as you lower the threshold. `V4` (score `0.624`, actual 0) enters before `V3` (score `0.595`, actual 1), so precision drops to `0.667` and then recovers to `0.75` at `t = 0.50`. The `(0, 1)` endpoint represents an empty selected set.</figcaption>
</figure>

Because each ROC axis normalizes within its own class while precision mixes both classes in the flagged set, rare positives change precision dramatically even when ROC stays frozen:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="ranking-and-prevalence.py"
import numpy as np

p = np.array([0.061, 0.169, 0.595, 0.624, 0.971, 0.325, 0.990, 0.244])
y = np.array([0, 0, 1, 0, 1, 0, 1, 1])

def eval_slice(labels, scores):
    pos, neg = scores[labels == 1], scores[labels == 0]
    auc = float(np.mean((pos[:, None] > neg[None, :]) + 0.5 * (pos[:, None] == neg[None, :])))
    ys = labels[np.argsort(-scores)]
    ap = float((np.cumsum(ys) / np.arange(1, len(ys) + 1))[ys == 1].mean())
    return auc, ap, float(np.mean(labels[scores >= 0.20]))

for name, labels, scores in (
    ("original", y, p),
    ("25x same negative mix", np.r_[np.ones(4, int), np.zeros(100, int)], np.r_[p[y == 1], np.repeat(p[y == 0], 25)]),
    ("100 easy zero negatives", np.r_[y, np.zeros(100, int)], np.r_[p, np.zeros(100)]),
):
    auc, ap, prec = eval_slice(labels, scores)
    print(f"{name:24s} AUC={auc:.4f}  AP={ap:.4f}  prec@0.20={prec:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original                 AUC=0.8125  AP=0.8542  prec@0.20=0.6667
25x same negative mix    AUC=0.8125  AP=0.5453  prec@0.20=0.0741
100 easy zero negatives  AUC=0.9928  AP=0.8542  prec@0.20=0.6667
```
<!-- leetllm: output:end -->

Repeating the negative mix leaves AUC fixed at `0.8125` while precision at `0.20` collapses to `0.0741`; appending 100 trivial negatives inflates AUC to `0.9928` without improving the selected queue.

## Calibration: do probabilities match frequencies?

Doubling every logit leaves ROC-AUC and AP untouched while distorting probability values. **Calibration** checks whether predictions near `0.8` actually come up positive 80% of the time using a **reliability diagram**, **Expected Calibration Error (ECE)**, and the **Brier score**:[^sklearnCalibration2026]

$$
\mathrm{ECE} = \sum_b \frac{|B_b|}{n} \left|\operatorname{mean}_{i \in B_b} p_i - \operatorname{mean}_{i \in B_b} y_i\right|,
\qquad
\mathrm{Brier} = \frac{1}{n}\sum_{i=1}^n (p_i - y_i)^2.
$$

<!-- leetllm: test, deps=numpy, output=show -->
```python title="calibration-on-validation-labels.py"
import numpy as np

p_val = np.array([0.061, 0.169, 0.595, 0.624, 0.971, 0.325, 0.990, 0.244])
y_val = np.array([0, 0, 1, 0, 1, 0, 1, 1])
edges, ece = np.linspace(0.0, 1.0, 5), 0.0
for lo, hi in zip(edges[:-1], edges[1:]):
    m = (p_val >= lo) & ((p_val < hi) if hi < 1.0 else (p_val <= hi))
    if m.any():
        ece += m.mean() * abs(p_val[m].mean() - y_val[m].mean())
        print(f"[{lo:.2f}, {hi:.2f}{']' if hi == 1 else ')'} n={m.sum()} avg_p={p_val[m].mean():.3f} frac_pos={y_val[m].mean():.3f}")
print("validation ECE:  ", round(float(ece), 3))
print("validation Brier:", round(float(np.mean((p_val - y_val) ** 2)), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[0.00, 0.25) n=3 avg_p=0.158 frac_pos=0.333
[0.25, 0.50) n=1 avg_p=0.325 frac_pos=0.000
[0.50, 0.75) n=2 avg_p=0.609 frac_pos=0.500
[0.75, 1.00] n=2 avg_p=0.980 frac_pos=1.000
validation ECE:   0.139
validation Brier: 0.158
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/reliability_diagram_dark.png" alt="Four calibration-bin points compare mean predicted verification score with observed verification frequency against the perfect-calibration diagonal. Their bin sizes weight absolute gaps of 0.175, 0.325, 0.110, and 0.020 into ECE contributions 0.066, 0.041, 0.027, and 0.005, totaling 0.139." />
  <figcaption>Each bin contributes its score-frequency gap weighted by its share of the eight validation responses: `0.066 + 0.041 + 0.027 + 0.005 ≈ 0.139`. The bin counts show how many responses support each observed frequency.</figcaption>
</figure>

When scores drift off the diagonal, fit a post-hoc calibrator on held-out validation data: **temperature scaling** ($\sigma(z/T)$, ranking-preserving for $T > 0$), **Platt scaling**, or **isotonic regression**.[^guo2017][^sklearnCalibration2026] Calibrated probabilities also give a direct expected-cost cutoff: checking beats skipping whenever $18(1 - p) \le 120p$, or $p \ge 18 / (120 + 18) \approx 0.130$ (at $p = 0.20$, skipping costs \$24 versus \$14.40 to check).

## Quick debugging checklist

- **NumPy vs. scikit-learn mismatch:** Match intercept handling, `C` regularization, and stopping criteria before comparing logits.
- **Loss diverges:** Standardize features and reduce learning rate so updates do not overshoot the valley.
- **Wrong gradients:** Confirm `(N,)` logits never broadcast against `(N, 1)` labels into an `(N, N)` matrix.
- **High AUC, expensive decisions:** Inspect calibration before applying a cost-based probability cutoff.

```mastery-quiz
[
  {
    "question": "A logistic model has intercept −1.1 and coefficients [3, −4]. For input [2, 1], what probability does it predict, and does it cross a threshold of 0.8?",
    "options": [
      "p ≈ 0.711; it stays below the threshold.",
      "p = 0.9; it crosses the threshold.",
      "p ≈ 0.881; it crosses the threshold.",
      "p ≈ 0.289; it stays below the threshold."
    ],
    "answer": "p ≈ 0.711; it stays below the threshold.",
    "explanation": "The logit is −1.1 + 3×2 − 4×1 = 0.9, giving sigmoid(0.9) ≈ 0.711, below 0.8."
  },
  {
    "question": "A positive example receives logit −8. Why does binary cross-entropy still produce a strong correction?",
    "options": [
      "Its logit derivative is p−1, close to −1.",
      "Its logit derivative is the sigmoid slope, close to zero.",
      "Its logit derivative is p, close to zero.",
      "Its logit derivative is 1−p, so gradient descent lowers the logit."
    ],
    "answer": "Its logit derivative is p−1, close to −1.",
    "explanation": "The sigmoid slope p(1−p) cancels with the cross-entropy denominator, leaving p−y ≈ −0.9997."
  },
  {
    "question": "Two thresholds produce these validation counts: H has TP=4, FP=1, FN=2; L has TP=6, FP=3, FN=0. An unnecessary check costs \\$20 and a missed claim costs \\$80. Which threshold has lower error cost?",
    "options": [
      "H, with cost \\$180.",
      "L, with cost \\$60.",
      "H, with cost \\$100.",
      "L, with cost \\$180."
    ],
    "answer": "L, with cost \\$60.",
    "explanation": "H costs 1×\\$20 + 2×\\$80 = \\$180; L costs 3×\\$20 + 0×\\$80 = \\$60."
  },
  {
    "question": "A classifier has recall 0.8 and false-positive rate 0.02 on 100 positives and 19,900 negatives. What are its precision and ROC point (FPR, TPR)?",
    "options": [
      "Precision 80.00%; ROC (0.02, 0.8).",
      "Precision 16.74%; ROC (0.8, 0.02).",
      "Precision 16.74%; ROC (0.02, 0.8).",
      "Precision 99.50%; ROC (0.02, 0.8)."
    ],
    "answer": "Precision 16.74%; ROC (0.02, 0.8).",
    "explanation": "80 true positives and 398 false positives give precision 80/478 ≈ 16.74%, while the ROC point is (0.02, 0.8)."
  },
  {
    "question": "Predictions [0.1, 0.3, 0.6, 0.8] have labels [0, 1, 0, 1]. Using bins [0, 0.5) and [0.5, 1], what are ECE and mean Brier score?",
    "options": [
      "ECE 0.25; Brier 0.225.",
      "ECE 0.05; Brier 0.225.",
      "ECE 0.25; Brier 0.90.",
      "ECE 0.50; Brier 0.25."
    ],
    "answer": "ECE 0.25; Brier 0.225.",
    "explanation": "Bin means 0.2 and 0.7 versus observed rate 0.5 give ECE = 0.5×0.3 + 0.5×0.2 = 0.25; squared errors average 0.90/4 = 0.225."
  }
]
```

> **Next:** Continue to [Decision Trees, Forests, and Boosting](/learn/decision-trees-random-forests-gradient-boosting).
