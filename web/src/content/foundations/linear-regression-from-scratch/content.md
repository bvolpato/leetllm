---
{
  "id": "linear-regression-from-scratch",
  "title": "Linear Regression from Scratch",
  "slug": "linear-regression-from-scratch",
  "section": "Classical ML & Evaluation",
  "category": "Model Architecture",
  "difficulty": "Easy",
  "order": 1,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Retrieved context grows from 100 to 500 tokens and latency climbs from 118 to 198 ms. A near-perfect line still hides a bend in the residuals.",
  "keyConceptsTested": [
    "hypothesis function and MSE",
    "design matrix",
    "residuals and R-squared",
    "normal equation closed form",
    "computational complexity",
    "gradient descent derivation",
    "convex loss surface and condition number",
    "learning rate stability bound",
    "Ridge and Lasso regularization",
    "Gauss-Markov assumptions",
    "held-out evaluation"
  ]
}
---

Suppose you run an assistant that retrieves documents before it answers, and you need to forecast how slow a request gets as retrieved context grows. You replay five requests through staging and record the timings:

| Evidence length `x` (hundreds of <span data-glossary="token">tokens</span>) | Observed latency `y` (ms) |
|---:|---:|
| 1 | 118 |
| 2 | 141 |
| 3 | 162 |
| 4 | 181 |
| 5 | 198 |

Eyeball those numbers and a rule jumps out: latency starts near 100 ms and climbs by about 20 ms for each extra hundred tokens. Fit $\hat{y} = 100 + 20x$ and you get $R^2 = 0.9965$, which looks like textbook perfection until you zoom in on the residuals and spot a clean arch hiding underneath.

Linear regression is the simplest place to watch the full machinery of machine learning work in plain sight: orthogonal projection, iterative gradient descent, loss-surface geometry, regularization, and held-out evaluation. Building on [linear algebra](/learn/linear-algebra-machine-learning-deeper) and [gradients and backprop](/learn/calculus-gradients-backpropagation-optimization), we will solve these five measurements both in closed form and by gradient descent, see when a solver breaks, and verify why a tiny training error can still steer extrapolation off course.

## A model is a function with knobs

For a general feature vector $x \in \mathbb{R}^D$, the linear regression hypothesis computes a weighted sum plus an offset:

$$
\hat{y} = w^\top x + b
$$

With one feature, that rule has two adjustable **parameters**: the **slope** (or weight) $w$, setting the change in latency per additional 100 tokens, and the **intercept** $b$, setting the prediction at $x = 0$. Keep the two halves separate: **you choose the shape** (a straight line), while **the data chooses the numbers**. A language model follows the exact same split with billions of adjustable numbers instead of two. Filling those blanks from data is **training**; running the frozen function on new requests is **inference**.

Choosing $b$ and $w$ to minimize squared prediction errors gives **ordinary least squares** (OLS) <span data-glossary="linear-regression">linear regression</span>. Our candidate line $\hat{y} = 100 + 20x$ predicts $100 + 20 \times 6 = 220$ ms at `x = 6` (600 tokens). Both `x = 0` and `x = 6` sit outside the observed 100-to-500-token span, so those predictions are **extrapolations**.

<!-- leetllm: test, output=show -->
```python title="inspect-the-request-replay.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])

print("requests", len(x))
print("evidence_range", (int(x.min()), int(x.max())), "hundreds_of_tokens")
print("latency_range", (int(y.min()), int(y.max())), "ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
requests 5
evidence_range (1, 5) hundreds_of_tokens
latency_range (118, 198) ms
```
<!-- leetllm: output:end -->

## Residuals show what the line missed

To improve a model automatically, we compress "how wrong is this?" into one scalar **loss**. Start with each signed miss, the **residual**:

$$
e_i = y_i - \hat{y}_i
$$

On the raw 100-to-200 ms latency scale, 1-to-2 ms misses nearly vanish. Isolating residuals on their own vertical axis exposes both their signs and curvature.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="The same five latency observations plotted on two scales. The fitted line y-hat = 100 + 20x has training R-squared 0.9965. The enlarged residual plot shows minus 2, plus 1, plus 2, plus 1, minus 2 milliseconds. Both x = 0 and x = 6 lie outside the observed range." />
  <figcaption>The line looks almost exact on the latency scale, yet isolating the residuals reveals a clean arch (-2, +1, +2, +1, -2 ms) that a straight line cannot bend to follow.</figcaption>
</figure>

| `x` | Actual `y` | Predicted $\hat{y}$ | Residual $y - \hat{y}$ | Residual squared |
|---:|---:|---:|---:|---:|
| 1 | 118 | 120 | -2 | 4 |
| 2 | 141 | 140 | +1 | 1 |
| 3 | 162 | 160 | +2 | 4 |
| 4 | 181 | 180 | +1 | 1 |
| 5 | 198 | 200 | -2 | 4 |

You cannot sum raw residuals: these five add to zero even though every row misses. Squaring removes cancellation and penalizes large blunders disproportionately. Averaging those squares yields **<span data-glossary="mean-squared-error">mean squared error</span>** (MSE), and its square root (**<span data-glossary="root-mean-squared-error">RMSE</span>** $\approx 1.67$ ms) restores millisecond units:

$$
\text{MSE} = \frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2 = \frac{4 + 1 + 4 + 1 + 4}{5} = 2.8\,\text{ms}^2
$$

On its own, `2.8` needs a baseline. Always predicting the mean latency $\bar{y} = 160$ ms gives MSE `802.8`. The coefficient of determination, **<span data-glossary="r-squared">R-squared</span>**, reports that reduction as a fraction of variance around the mean:[^sklearnR2Score2026]

$$
R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2} = 1 - \frac{14}{4014} = 1 - \frac{2.8}{802.8} \approx 0.9965
$$

For nonconstant targets, $R^2 = 0$ matches the mean baseline, $R^2 = 1$ means zero error, and negative $R^2$ means worse than predicting the mean.

> **Key insight:** An $R^2$ of `0.9965` tells you the line explains almost all of the variance across these five points, yet it completely hides the `-2, +1, +2, +1, -2` arch. Always inspect residuals, never just summary scores.

```checkpoint
Why square residuals before averaging them instead of taking their raw sum?
---
Signed residuals cancel: here they sum to zero even though every prediction misses. Squaring ensures every error counts positively and penalizes large misses more heavily than small ones.
```

<!-- leetllm: test, output=show -->
```python title="score-candidate-line-against-baseline.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])
pred = 100 + 20 * x
residual = y - pred
mse = np.mean(residual ** 2)
baseline_mse = np.mean((y - y.mean()) ** 2)
r2 = 1 - mse / baseline_mse

print("predictions", pred.astype(int))
print("residuals", residual.astype(int))
print("mse", round(float(mse), 1))
print("baseline_mse", round(float(baseline_mse), 1))
print("r2", round(float(r2), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
predictions [120 140 160 180 200]
residuals [-2  1  2  1 -2]
mse 2.8
baseline_mse 802.8
r2 0.9965
```
<!-- leetllm: output:end -->

## Why the math becomes matrix multiplication

Placing an all-ones intercept column beside the feature columns packs every observation into a **design <span data-glossary="matrix">matrix</span>** $X \in \mathbb{R}^{N \times (D+1)}$ and every parameter into $w = [b, w_1, \dots, w_D]^\top$:

$$
X =
\begin{bmatrix}
1 & 1 \\
1 & 2 \\
1 & 3 \\
1 & 4 \\
1 & 5
\end{bmatrix},
\qquad
\hat{y} = X w
$$

Geometrically, $\hat{y} = Xw$ lives in the column space $\text{col}(X)$. At the OLS optimum, $Xw^*$ is the orthogonal projection of $y$ onto $\text{col}(X)$, so the residual vector is perpendicular to every column of $X$:[^trefethen1997]

$$
X^\top (y - X w^*) = 0
$$

Drop the all-ones column and the model is forced through $(0, 0)$, inflating MSE on our five rows from `2.8` to `1820.98`, more than double the mean baseline (`802.8`):

<!-- leetllm: test, output=show -->
```python title="design-matrix-keeps-an-intercept.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])

with_intercept = np.c_[np.ones_like(x), x]
without_intercept = x[:, None]

w_full, *_ = np.linalg.lstsq(with_intercept, y, rcond=None)
w_forced, *_ = np.linalg.lstsq(without_intercept, y, rcond=None)
mse_full = np.mean((with_intercept @ w_full - y) ** 2)
mse_forced = np.mean((without_intercept @ w_forced - y) ** 2)
baseline_mse = np.mean((y - y.mean()) ** 2)

print("with_intercept", w_full.round(2), "mse", round(float(mse_full), 2))
print("forced_through_zero", w_forced.round(2), "mse", round(float(mse_forced), 2))
print("mean_baseline_mse", round(float(baseline_mse), 2))
print("forced_worse_than_mean", mse_forced > baseline_mse)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
with_intercept [100.  20.] mse 2.8
forced_through_zero [47.27] mse 1820.98
mean_baseline_mse 802.8
forced_worse_than_mean True
```
<!-- leetllm: output:end -->

## The Normal Equation: closed-form ordinary least squares

Write MSE in matrix form and set its gradient to zero to obtain the **Normal Equation**:[^hastie2009]

$$
J(w) = \frac{1}{N} \|X w - y\|_2^2, \qquad \nabla_w J(w) = \frac{2}{N}\left(X^\top X w - X^\top y\right) = 0 \implies X^\top X w = X^\top y
$$

When $X$ has full column rank, the **Gram matrix** $X^\top X \in \mathbb{R}^{(D+1)\times(D+1)}$ is symmetric positive definite and invertible:

$$
w^* = (X^\top X)^{-1} X^\top y, \qquad \begin{bmatrix} 5 & 15 \\ 15 & 55 \end{bmatrix} \begin{bmatrix} b \\ m \end{bmatrix} = \begin{bmatrix} 800 \\ 2600 \end{bmatrix}
$$

Row-reducing gives $10m = 200 \implies m = 20$ and $b = 100$. In code, never invert a matrix explicitly: prefer direct QR/SVD least squares (`np.linalg.lstsq`), which operates on $X$ directly without squaring its condition number ($\kappa_2(X) \approx 8.37$ vs $\kappa_2(X^\top X) \approx 69.99$):

<!-- leetllm: test, output=show -->
```python title="least-squares-with-rank-check.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])
X = np.c_[np.ones_like(x), x]

w, residual_sum, rank, singular_values = np.linalg.lstsq(X, y, rcond=None)
pred = X @ w

print("weights", w.round(2))
print("rank", rank, "columns", X.shape[1])
print("mse", round(float(np.mean((pred - y) ** 2)), 2))
print("singular_values", singular_values.round(2))
print("cond_X", round(float(np.linalg.cond(X)), 2))
print("cond_XTX", round(float(np.linalg.cond(X.T @ X)), 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
weights [100.  20.]
rank 2 columns 2
mse 2.8
singular_values [7.69 0.92]
cond_X 8.37
cond_XTX 69.99
```
<!-- leetllm: output:end -->

<details>
<summary>Deep dive: Cholesky complexity, memory scaling, and numerical rank cutoffs</summary>

For dense matrices with $N$ rows and $D$ features (absorbing the intercept into $D$), solving the normal equations via Cholesky factorization ($X^\top X = L L^\top$) carries three costs:

1. **Gram formation** ($X^\top X$): $O(N D^2)$ arithmetic operations.
2. **Cholesky factorization**: $O(D^3)$ operations (followed by $O(D^2)$ triangular solves).
3. **Gram storage**: $O(D^2)$ memory. At $D = 10{,}000$ features in `float64`, the Gram matrix alone holds 100 million entries (~800 MB), pushing wide-feature problems toward iterative or sparse solvers.

QR and SVD solvers like `np.linalg.lstsq` operate directly on $X$, avoiding the $\kappa_2(X)^2$ condition-number squaring.[^trefethen1997][^numpyLstsq2026] With `rcond=None`, NumPy treats singular values below machine precision times $\max(N, D+1)$ times $\sigma_{\max}$ as zero. When $X$ is rank deficient (or $N \le D+1$), `lstsq` also returns an empty `residual_sums` array, so compute `y - X @ w` directly whenever you need errors across all cases.

</details>

Appending a redundant column `2 * x` makes $X$ rank deficient: `np.linalg.solve` fails on the singular Gram matrix, while `np.linalg.lstsq` reports rank `2` across `3` columns and selects the **minimum-norm** weight vector `[100, 4, 8]` (since $4x + 8(2x) = 20x$, and $\|[100, 4, 8]\|_2 = 100.4 < \|[100, 20, 0]\|_2 = 101.98$):[^numpyLstsq2026]

<!-- leetllm: test, output=show -->
```python title="redundant-features-break-normal-equation.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])
X_bad = np.c_[np.ones_like(x), x, 2 * x]

try:
    np.linalg.solve(X_bad.T @ X_bad, X_bad.T @ y)
except np.linalg.LinAlgError:
    print("normal_equation", "singular")
else:
    print("normal_equation", "returned weights; rank still needs checking")

w, residual_sums, rank, _ = np.linalg.lstsq(X_bad, y, rcond=None)
print("lstsq_rank", rank, "columns", X_bad.shape[1])
print("lstsq_weights", w.round(2))
print("weight_norm", round(float(np.linalg.norm(w)), 2))
print("alt_norm_100_20_0", round(float(np.linalg.norm([100.0, 20.0, 0.0])), 2))
print("returned_residual_sums", residual_sums.tolist())
print("recomputed_sse", round(float(np.sum((X_bad @ w - y) ** 2)), 2))
print("mse", round(float(np.mean((X_bad @ w - y) ** 2)), 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
normal_equation singular
lstsq_rank 2 columns 3
lstsq_weights [100.   4.   8.]
weight_norm 100.4
alt_norm_100_20_0 101.98
returned_residual_sums []
recomputed_sse 14.0
mse 2.8
```
<!-- leetllm: output:end -->

SVD picks a stable minimum-norm vector, yet collinear columns remain physically unidentifiable because any multiple of the nullspace vector $v = [0, 2, -1]^\top$ leaves every prediction unchanged.

## Gradient descent finds the same line by walking downhill

Almost no deep-learning objective has a closed-form solve, and wide sparse problems outgrow dense factorizations. **Gradient descent** treats the loss as a landscape over parameter space, computes the downhill slope, and steps opposite it scaled by a **<span data-glossary="learning-rate">learning rate</span>** $\alpha$:

$$
w \leftarrow w - \alpha \nabla_w \text{MSE}, \qquad \nabla_w \text{MSE} = \frac{2}{N} X^\top (X w - y)
$$

Check array shapes before running an optimizer: subtracting an `(N, 1)` target from an `(N,)` prediction is valid NumPy broadcasting, yet it silently constructs an `(N, N)` pairwise error matrix and turns MSE `2.8` into `1602.8` without raising an error.[^numpyBroadcasting2026] Keep `X` at `(N, D+1)`, `w` at `(D+1,)`, and `y` at `(N,)` (or consistently 2D column vectors everywhere).

Starting from $w_0 = [0, 0]^\top$, every prediction is `0`, giving error vector `[-118, -141, -162, -181, -198]` and gradient:

$$
\nabla_w \text{MSE}(w_0) = \frac{2}{5} \begin{bmatrix} -800 \\ -2600 \end{bmatrix} = \begin{bmatrix} -320 \\ -1040 \end{bmatrix}
$$

At $\alpha = 0.05$, the first step lands at $w_1 = [16, 52]^\top$. Even though the slope overshoots `20` all the way to `52`, total MSE plunges from `26,402.8` to `2,194.8`. Running 1,000 steps converges to `[100, 20]`, matching `lstsq` within $10^{-4}$:

<!-- leetllm: test, output=show -->
```python title="gradient-descent-line-fit.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])
X = np.c_[np.ones_like(x), x]

w = np.zeros(2)
lr = 0.05

for step in range(1000):
    pred = X @ w
    error = pred - y
    grad = (2 / len(X)) * (X.T @ error)
    w -= lr * grad

    if step in {0, 99, 999}:
        loss = np.mean((X @ w - y) ** 2)
        print(f"after_step={step + 1} loss={loss:.2f} w={w.round(2)}")

w_direct, *_ = np.linalg.lstsq(X, y, rcond=None)
print("matches_direct", bool(np.allclose(w, w_direct, atol=1e-4, rtol=0)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
after_step=1 loss=2194.80 w=[16. 52.]
after_step=100 loss=49.09 w=[84.05 24.42]
after_step=1000 loss=2.80 w=[100.  20.]
matches_direct True
```
<!-- leetllm: output:end -->

Notice also what happens on the rank-deficient design `[1, x, 2*x]`: every gradient is a linear combination of rows of $X$, so it stays perpendicular to the nullspace direction $v = [0, 2, -1]^\top$. Starting at zero reaches the minimum-norm solution `[100, 4, 8]`, whereas any nonzero initial component along $v$ survives forever.[^cornellLinearRegression2026]

## Convex loss bowl geometry and step size selection

Why did MSE collapse from `26,402.8` to `2,194.8` in one step yet take hundreds more to crawl from `[84.05, 24.42]` to `[100, 20]`? Raising the intercept while lowering the slope nearly cancels across $x \in \{1..5\}$, carving a long diagonal valley in parameter space.

<figure>
  <img src="illustrations/_generated/loss_valley_dark.png" alt="Above: contour lines of mean squared error over intercept and slope form a long diagonal valley. A gradient descent path starts at intercept 0 and slope 0, jumps across the valley in a few steps, then crawls along it toward the minimum at intercept 100 and slope 20. Below: the loss of the same run against step number on a log scale. It falls by a large factor in the first few steps and then declines slowly, reaching 2.8 by about 500 steps." />
  <figcaption>Equal-MSE contours form a narrow diagonal valley around `[100, 20]`. Gradient descent plunges across the steep walls in a few steps, then crawls slowly along the shallow valley floor.</figcaption>
</figure>

The second-derivative matrix (Hessian) of MSE is constant:

$$
H = \nabla_w^2 \text{MSE} = \frac{2}{N} X^\top X = \begin{bmatrix} 2 & 6 \\ 6 & 22 \end{bmatrix}
$$

For full column rank, $H$ is positive definite (strictly convex, one global minimum, no saddle points). Its eigenvalues are $\lambda_{\max} \approx 23.66$ and $\lambda_{\min} \approx 0.34$, giving **condition number** $\kappa = \lambda_{\max} / \lambda_{\min} \approx 70$. Because curvature scales squared distance along equal-loss contours, the contour semiaxis ratio is $\sqrt{\kappa} \approx 8.37$.

In each eigenvector direction $i$, every gradient-descent step multiplies parameter error by $1 - \alpha \lambda_i$. Convergence from any starting vector requires every multiplier to stay strictly inside $(-1, 1)$:

$$
0 < \alpha < \frac{2}{\lambda_{\max}}
$$

Here $2 / \lambda_{\max} \approx 0.0845$, so $\alpha = 0.05$ converges cleanly while $\alpha = 0.2$ sends the steep-direction multiplier past $-1$ and explodes loss from $2.6 \times 10^4$ to $9.4 \times 10^8$ in four steps:

<!-- leetllm: test, output=show -->
```python title="detect-an-unstable-learning-rate.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])
X = np.c_[np.ones_like(x), x]
w = np.zeros(2)
losses = []

for _ in range(5):
    error = X @ w - y
    losses.append(float(np.mean(error ** 2)))
    grad = (2 / len(X)) * X.T @ error
    w -= 0.2 * grad

print("losses", [round(loss, 1) for loss in losses])
print("loss_increased", losses[-1] > losses[0])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
losses [26402.8, 349474.8, 4852473.8, 67584328.5, 941482657.6]
loss_increased True
```
<!-- leetllm: output:end -->

Centering and scaling our **single** feature to unit population variance makes it orthogonal to the intercept column and turns $H$ into $2I$ ($\kappa = 1$). With multiple features, however, `StandardScaler` preserves pairwise correlations, so two duplicate columns stay exact duplicates after scaling.[^sklearnStandardScaler2026]

<!-- leetllm: test, output=show -->
```python title="standardization-is-not-decorrelation.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
z = (x - x.mean()) / x.std(ddof=0)
X_one = np.c_[np.ones_like(z), z]
H_one = (2 / len(x)) * X_one.T @ X_one

features = np.c_[x, 2 * x]
scaled = (features - features.mean(axis=0)) / features.std(axis=0, ddof=0)
X_duplicate = np.c_[np.ones_like(x), scaled]

H_display = np.where(np.abs(H_one) < 1e-12, 0.0, H_one)
print("single_feature_H", H_display.round(2).tolist())
print("single_feature_condition", round(float(np.linalg.cond(H_one)), 2))
print("scaled_duplicates_equal", bool(np.allclose(scaled[:, 0], scaled[:, 1])))
print("duplicate_design_rank", np.linalg.matrix_rank(X_duplicate), "columns", X_duplicate.shape[1])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
single_feature_H [[2.0, 0.0], [0.0, 2.0]]
single_feature_condition 1.0
scaled_duplicates_equal True
duplicate_design_rank 2 columns 3
```
<!-- leetllm: output:end -->

## Stabilizing ill-conditioned fits with Ridge and Lasso

Correlated features make OLS coefficients swing wildly under small perturbations, and $D > N$ leaves OLS weights non-unique. **<span data-glossary="regularization">Regularization</span>** penalizes feature weight size, trading slight bias for lower variance and often lower expected squared prediction error on fresh inputs.[^hastie2009]

**Ridge Regression (L2)** adds a squared penalty on feature weights only, excluding the intercept $w_0 = b$ via $R = \operatorname{diag}(0, 1, \dots, 1)$:

$$
J_{\text{ridge}}(w) = \frac{1}{N}\|Xw - y\|_2^2 + \lambda\|w_{1:D}\|_2^2, \qquad w^*_{\text{ridge}} = \left(X^\top X + \lambda N R\right)^{-1} X^\top y
$$

For $\lambda > 0$, $X^\top X + \lambda N R$ is positive definite even with collinear features. Using $I$ instead of $R$ shifts every Gram eigenvalue by $\lambda N$ (making $X^\top X + \lambda N I$ positive definite directly), yet penalizing the intercept pulls mean predictions away from $\bar{y}$:

<!-- leetllm: test, output=show -->
```python title="ridge-penalty-must-preserve-the-intercept.py"
import numpy as np
from sklearn.linear_model import Ridge

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])
X = np.c_[np.ones_like(x), x]
lam = 1.0
R = np.diag([0.0, 1.0])
w_feature = np.linalg.solve(X.T @ X + lam * len(x) * R, X.T @ y)
w_all = np.linalg.solve(X.T @ X + lam * len(x) * np.eye(2), X.T @ y)

# sklearn Ridge uses summed squared error + alpha * squared feature norm.
model = Ridge(alpha=lam * len(x)).fit(x[:, None], y)
w_library = np.r_[model.intercept_, model.coef_]
assert np.allclose(w_feature, w_library)

print("feature_only_weights", w_feature.round(2).tolist())
print("all_coordinates_weights", w_all.round(2).tolist())
print("feature_only_matches_sklearn", bool(np.allclose(w_feature, w_library)))
print("feature_only_mean_matches_target", bool(np.isclose((X @ w_feature).mean(), y.mean())))
print("all_coordinates_mean_matches_target", bool(np.isclose((X @ w_all).mean(), y.mean())))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
feature_only_weights [120.0, 13.33]
all_coordinates_weights [24.0, 37.33]
feature_only_matches_sklearn True
feature_only_mean_matches_target True
all_coordinates_mean_matches_target False
```
<!-- leetllm: output:end -->

**Lasso Regression (L1)** penalizes absolute feature weights, leaving the intercept unpenalized:

$$
J_{\text{lasso}}(w) = \frac{1}{N}\|Xw - y\|_2^2 + \lambda \sum_{j=1}^D |w_j|
$$

Because $|w_j|$ has a sharp corner at $w_j = 0$, its subgradient at zero is the interval $[-\lambda, +\lambda]$. A coordinate satisfies optimality at $w_j = 0$ whenever a subgradient in $[-\lambda, +\lambda]$ cancels the smooth MSE derivative there. Coordinate descent updates each feature via soft-thresholding $S_t(z) = \operatorname{sign}(z)\max(|z| - t, 0)$:

$$
w_j \leftarrow \frac{S_{\lambda/2}(X_j^\top r_j / N)}{X_j^\top X_j / N}, \qquad r_j = y - \sum_{k \ne j} X_k w_k
$$

That corner geometry can drive coefficients to exact zero, producing sparse models. Always fit feature scaling strictly on training data before applying Ridge or Lasso, and verify library loss conventions: scikit-learn's `Ridge` uses summed squared error (`alpha = lambda * N`), while its `Lasso` uses half-MSE (`alpha = lambda / 2`).[^sklearnLinearModels2026]

| Property | Ordinary least squares | Ridge (L2) | Lasso (L1) |
|---|---|---|---|
| Penalty | None | $\lambda \|w_{1:D}\|_2^2$ | $\lambda \|w_{1:D}\|_1$ |
| Closed form | Full column rank; min-norm `lstsq` otherwise | $(X^\top X + \lambda N R)^{-1} X^\top y$ | Iterative (coordinate descent / proximal) |
| Weight behavior | Unpenalized | Smooth shrinkage toward zero | Can produce exact zeros |
| Best first use | Continuous-target baseline | Correlated features | Sparse feature selection |

## Gauss-Markov foundations and nonlinear columns

Under classical assumptions, the **Gauss-Markov theorem** shows that OLS is **BLUE** (Best Linear Unbiased Estimator): among all unbiased estimators linear in $y$, OLS achieves minimum coefficient covariance.[^freedman2004GaussMarkov]

<details>
<summary>Deep dive: the five Gauss-Markov conditions and classical inference</summary>

Conditional on a full-column-rank design matrix $X$, OLS is BLUE when:

1. **Linearity in parameters**: $y = Xw + \epsilon$. Nonlinear feature columns such as $x^2$ or $\log x$ stay linear in $w$.
2. **Zero conditional error mean**: $\mathbb{E}[\epsilon \mid X] = 0$.
3. **Full column rank**: $\operatorname{rank}(X) = D + 1 \le N$.
4. **Constant conditional error variance (homoscedasticity)**: $\operatorname{Var}(\epsilon_i \mid X) = \sigma^2 < \infty$.
5. **Uncorrelated conditional errors**: $\operatorname{Cov}(\epsilon_i, \epsilon_j \mid X) = 0$ for $i \ne j$.

Normality of $\epsilon$ is **not** required for BLUE; Gaussian errors are only needed for exact classical small-sample $t$ and $F$ intervals. Notice also that Gauss-Markov compares *unbiased* linear estimators on coefficient variance: a biased Ridge estimator can still achieve lower expected squared prediction error on fresh requests by reducing variance more than its bias costs.

</details>

Because linearity applies to the *parameters*, appending $x^2$ stays linear regression. On our five latency rows, the quadratic fit `[93, 26, -1]` eliminates the residual arch completely and bends the `x = 6` forecast down from `220` ms to `213` ms:

<!-- leetllm: test, output=show -->
```python title="a-curved-predictor-can-be-linear-in-parameters.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])
X_line = np.c_[np.ones_like(x), x]
X_curve = np.c_[np.ones_like(x), x, x ** 2]
w_line, *_ = np.linalg.lstsq(X_line, y, rcond=None)
w_curve, *_ = np.linalg.lstsq(X_curve, y, rcond=None)

print("quadratic_weights", w_curve.round(2).tolist())
print("quadratic_training_fit_exact", bool(np.allclose(X_curve @ w_curve, y)))
print("line_x6_ms", round(float(np.array([1.0, 6.0]) @ w_line), 1))
print("quadratic_x6_ms", round(float(np.array([1.0, 6.0, 36.0]) @ w_curve), 1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
quadratic_weights [93.0, 26.0, -1.0]
quadratic_training_fit_exact True
line_x6_ms 220.0
quadratic_x6_ms 213.0
```
<!-- leetllm: output:end -->

Both `220` ms and `213` ms extrapolate past our data. Only fresh measurements settle which shape generalizes better.

## Evaluation starts on unseen requests

Training scores measure fit on rows the solver already saw. To grade generalization honestly, build a <span data-glossary="train-validation-test-split">train, validation, and test split</span> matching deployment (time splits for future traffic, grouped splits for repeated users) and keep test rows untouched until the end.

Fitting our line strictly on the first four rows ($x \in \{1, 2, 3, 4\}$) shifts weights to $\hat{y} = 98 + 21x$. On the held-out fifth request ($x = 5$, actual `198` ms), the line predicts `203` ms (a 5 ms miss), while the training-mean baseline (`150.5` ms) misses by `47.5` ms:

<figure>
  <img src="illustrations/_generated/heldout_check_dark.png" alt="A line fit to the first four requests, 98 plus 21 x, extends to the held-out fifth request at x equals 5. It predicts 203 milliseconds against an actual 198, a miss of 5 milliseconds. A flat baseline at the training mean of 150.5 milliseconds misses the same request by 47.5 milliseconds." />
  <figcaption>Both the line and the baseline learn strictly from the four training rows. On the held-out fifth request, the line misses by 5 ms versus 47.5 ms for the training mean.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="evaluate-a-held-out-request.py"
import numpy as np

x_train = np.array([1.0, 2.0, 3.0, 4.0])
y_train = np.array([118.0, 141.0, 162.0, 181.0])
x_test = np.array([5.0])
y_test = np.array([198.0])

X_train = np.c_[np.ones_like(x_train), x_train]
X_test = np.c_[np.ones_like(x_test), x_test]
w, *_ = np.linalg.lstsq(X_train, y_train, rcond=None)
prediction = X_test @ w
baseline = np.full_like(y_test, y_train.mean())

print("train_weights", w.round(2))
print("test_prediction_ms", prediction.round(2))
print("test_error_ms", (y_test - prediction).round(2))
print("line_squared_error", round(float(np.mean((prediction - y_test) ** 2)), 2))
print("baseline_squared_error", round(float(np.mean((baseline - y_test) ** 2)), 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
train_weights [98. 21.]
test_prediction_ms [203.]
test_error_ms [-5.]
line_squared_error 25.0
baseline_squared_error 2256.25
```
<!-- leetllm: output:end -->

Checking our full-data NumPy solution against scikit-learn's `LinearRegression` confirms exact agreement (`100.0`, `20.0`, MSE `2.8`, $R^2 = 0.9965$).[^sklearnLinearRegression2026]

<!-- leetllm: test, output=show -->
```python title="compare-with-scikit-learn.py"
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0]).reshape(-1, 1)
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])

model = LinearRegression().fit(x, y)
pred = model.predict(x)

print("intercept", round(float(model.intercept_), 2))
print("slope", np.round(model.coef_, 2))
print("mse", round(float(mean_squared_error(y, pred)), 2))
print("r2", round(float(r2_score(y, pred)), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
intercept 100.0
slope [20.]
mse 2.8
r2 0.9965
```
<!-- leetllm: output:end -->

## Operating limits and common failures

A point forecast of `220 ms` hides uncertainty: a **<span data-glossary="confidence-interval">confidence interval</span>** brackets the conditional mean latency at $x$, whereas a **<span data-glossary="prediction-interval">prediction interval</span>** is wider because it adds the scatter of an individual future observation. In production, store observed training ranges ($1 \le x \le 5$), feature units, condition numbers, and held-out error distributions beside the weights, and route extreme out-of-range inputs (such as `x = 80` after training on `2` to `10`) to an explicit fallback or fresh validation because long contexts hit memory paging and queue regimes the training data never saw.

| Symptom | Likely cause | Next check |
|---|---|---|
| Residuals form an arch | Nonlinearity or omitted feature | Compare a curved or richer fit on fresh requests |
| Gradient-descent loss explodes | $\alpha \ge 2 / \lambda_{\max}$ or broadcasting bug | Verify shapes, Hessian $\lambda_{\max}$, and feature scaling |
| Gram solve fails or weights swing | Rank deficiency or collinearity | Use direct `lstsq`; test feature-only Ridge on validation |
| High training $R^2$, high test error | Leakage, overfitting, or traffic shift | Audit split separation and compare with a baseline |
| Extreme input (`x = 80`) breaks forecast | Far outside training support | Enforce domain bounds and fallback rules |

```checkpoint
A teammate reports almost zero loss on training data. What is the first question you ask?
---
Ask how it scores on held-out data it did not train on, and how that compares against a simple baseline. A model can memorize training rows while failing on fresh traffic.
```

```mastery-quiz
[
  {
    "question": "A dense full-rank regression keeps its row count fixed and doubles the feature count from 1000 to 2000. Ignoring the intercept, how do Gram storage, Gram formation work and Cholesky factorization work scale?",
    "options": [
      "Storage 2×, formation 2×, factorization 4×, from D, ND and D² respectively.",
      "Storage 4×, formation 4×, factorization 8×, from D², ND² and D³ respectively.",
      "Storage 4×, formation 8×, factorization 4×, from D², ND³ and D² respectively.",
      "Storage 8×, formation 4×, factorization 2×, from D³, ND² and D respectively."
    ],
    "answer": "Storage 4×, formation 4×, factorization 8×, from D², ND² and D³ respectively.",
    "explanation": "With N fixed, doubling D multiplies D² storage and ND² formation work by 4, and D³ factorization work by 8. These are asymptotic dense-system costs, not measured runtime ratios."
  },
  {
    "question": "A fitted line has high training R-squared. At five increasing, equally spaced input lengths, its residuals (observed minus predicted) are [+4, -2, -4, -2, +4] ms. You will compare the line with a revised model on fresh requests. Which change to the predictions most directly addresses the pattern?",
    "options": [
      "Lower predictions at both ends and raise them in the middle.",
      "Raise predictions at short lengths and lower them at long lengths.",
      "Lower predictions at short lengths and raise them at long lengths.",
      "Raise predictions at both ends and lower them in the middle."
    ],
    "answer": "Raise predictions at both ends and lower them in the middle.",
    "explanation": "Both endpoints ran 4 ms slower than predicted. The three interior requests ran 2 to 4 ms faster. A U-shaped correction can raise both ends and lower the middle. The opposite bend worsens both kinds of miss. Tilting the line in either direction moves one endpoint the wrong way. Fresh requests can show whether the bend improves predictions."
  },
  {
    "question": "If Ridge penalizes every parameter, including the intercept, why is X^T X + lambda * N * I invertible for lambda > 0?",
    "options": [
      "Ridge regularization algorithmically detects and prunes collinear feature columns prior to computing Gram products.",
      "The quadratic L 2 penalty drives non-zero regression coefficients to exact zeros, eliminating rank deficiency.",
      "A positive all-coordinate L 2 penalty shifts every Gram eigenvalue above zero, making the system positive definite.",
      "The regularized identity term replaces the data Gram matrix entirely, making inversion numerically independent of X."
    ],
    "answer": "A positive all-coordinate L 2 penalty shifts every Gram eigenvalue above zero, making the system positive definite.",
    "explanation": "The all-coordinate penalty shifts every eigenvalue by lambda * N. This is a different objective from our feature-only Ridge, which uses R = diag(0, 1, ...) and leaves the intercept free. That system's positive definiteness follows from its quadratic form, not a uniform eigenvalue shift."
  },
  {
    "question": "A Lasso objective is MSE plus 2*abs(w). At w=0 the smooth MSE derivative is 1.5. Which conclusion follows from the one-coordinate optimality condition?",
    "options": [
      "Zero satisfies it: a penalty subgradient of -1.5 balances the smooth derivative within [-2,2].",
      "Zero fails it: the penalty derivative at zero is defined as 0, leaving the smooth gradient 1.5.",
      "Zero fails it: absolute-value penalties require the coefficient to take the smooth gradient 1.5.",
      "Zero satisfies it: the smooth derivative is rounded to 0 whenever its magnitude is below 2."
    ],
    "answer": "Zero satisfies it: a penalty subgradient of -1.5 balances the smooth derivative within [-2,2].",
    "explanation": "At zero, the penalty subgradient is the interval [-2,2]. Choosing -1.5 cancels the smooth derivative 1.5, satisfying this coordinate’s condition. This is a subgradient balance, not rounding or a zero derivative."
  },
  {
    "question": "A positive-definite quadratic has Hessian eigenvalues 2 and 10. Which proposed fixed learning rate converges from every initial vector in exact arithmetic?",
    "options": [
      "Rate 0.25: its eigen-direction multipliers are 0.5 and -1.5, so alternating signs confirm convergence.",
      "Rate 0.15: its eigen-direction multipliers are 0.7 and -0.5, both with magnitude below 1.",
      "Both rates: positive-definite curvature makes a negative update multiplier contract automatically.",
      "Neither rate: any negative eigen-direction multiplier makes the corresponding loss diverge."
    ],
    "answer": "Rate 0.15: its eigen-direction multipliers are 0.7 and -0.5, both with magnitude below 1.",
    "explanation": "Gradient-descent error multipliers are 1-alpha*lambda. At 0.15 their magnitudes are .7 and .5; at 0.25 the steep-direction multiplier is -1.5, unstable for an initial error in that direction. This is the concrete form of 0<alpha<2/lambda_max."
  },
  {
    "question": "A positive-definite quadratic has Hessian eigenvalues 1 and 9. What is the ratio of larger to smaller curvature? On a contour above the minimum, what is the ratio of the longer to the shorter semiaxis?",
    "options": [
      "Curvature 9, semiaxes 9.",
      "Curvature 3, semiaxes 9.",
      "Curvature 9, semiaxes 3.",
      "Curvature 1/9, semiaxes 1/3."
    ],
    "answer": "Curvature 9, semiaxes 3.",
    "explanation": "The curvature ratio is 9/1 = 9. For the same rise in loss, curvature times squared distance is constant. The shallow direction therefore extends three times as far as the steep direction. Using 9 for both ratios skips the square root. The pair (3, 9) swaps the two results. The pair (1/9, 1/3) reverses both comparisons."
  },
  {
    "question": "Assume the Gauss-Markov conditions hold. Over repeated samples at a fixed design, an unbiased estimator linear in the observed targets ties OLS on slope variance and has larger intercept variance. A biased Ridge fit has lower expected squared prediction error than OLS on fresh requests at the same inputs. Which findings can hold?",
    "options": [
      "Only the coefficient variance finding.",
      "Only the prediction error finding.",
      "Neither finding.",
      "Both findings."
    ],
    "answer": "Both findings.",
    "explanation": "OLS has minimum coefficient covariance among linear unbiased estimators. A fit can use the same slope estimate and a less precise unbiased intercept, so the slope variances can tie. Ridge can reduce prediction variance enough to offset the error its bias adds. Rejecting the tie assumes a strict variance improvement. Rejecting the Ridge result extends the theorem to prediction error for biased fits."
  },
  {
    "question": "Conditional on its full-rank design, a linear model has zero-mean independent equal-variance non-Gaussian errors. An analyst claims BLUE and a classical exact small-sample Gaussian t interval. Which review response follows?",
    "options": [
      "BLUE follows under the stated conditional model; that exact t claim needs additional Gaussian assumptions.",
      "Both claims follow under the stated model; equal variances imply a Gaussian distribution for the errors.",
      "Neither claim follows under the stated model; non-Gaussian errors necessarily make coefficients biased.",
      "The exact t claim follows under the stated model; unbiasedness matters for BLUE but not interval calibration."
    ],
    "answer": "BLUE follows under the stated conditional model; that exact t claim needs additional Gaussian assumptions.",
    "explanation": "Gauss-Markov uses zero conditional mean and covariance sigma²I with full rank, not Gaussian errors. Familiar exact small-sample t/F inference uses the additional classical Gaussian model. Other interval methods require their own assumptions."
  },
  {
    "question": "A new design contains an intercept plus features z and 3*z. Minimum-norm least squares returns [50,2,6]. What does that show?",
    "options": [
      "Duplicate features identify separate physical effects; the two fitted slopes isolate independent causes.",
      "A positive Ridge penalty selected these weights; minimum-norm least squares is a regularized objective.",
      "The slopes combine as 2*z+6*(3*z)=20*z; multiple slope pairs give the same fitted predictions.",
      "The slopes (5, 5) give the same predictions as (2, 6), so the two pairs have the same Euclidean norm."
    ],
    "answer": "The slopes combine as 2*z+6*(3*z)=20*z; multiple slope pairs give the same fitted predictions.",
    "explanation": "Both pairs give an effective slope of 20 because 2 + 3 × 6 and 5 + 3 × 5 both equal 20. Their squared slope norms differ. For (2, 6) the sum of squares is 40. For (5, 5) it is 50. The common intercept adds the same squared term to both norms. Minimum-norm least squares chooses the shortest coefficient vector among fits with the same minimum loss. A positive Ridge penalty changes the loss itself. Since the two features vary together, the fit cannot separate their physical effects."
  },
  {
    "question": "A latency model is trained on x from 2 to 10, where x counts hundreds of tokens. A request arrives at x=80. Which operational interpretation follows?",
    "options": [
      "The formula becomes mathematically undefined; linear functions cannot accept values outside the observed domain.",
      "The weights start a new gradient update; extrapolation triggers unstable training during ordinary inference.",
      "The training R-squared becomes 0; an input outside observed support changes the stored aggregate score.",
      "The request extrapolates to 8000 tokens; unmeasured resource regimes require an explicit fallback or validation."
    ],
    "answer": "The request extrapolates to 8000 tokens; unmeasured resource regimes require an explicit fallback or validation.",
    "explanation": "The formula remains defined, but this request is far outside training support. Load, memory paging and context limits can change the relationship. Preserve units and use the declared training domain limit instead of treating the line as a physical guarantee."
  }
]
```

> **Next:** Continue to [Logistic Regression and Metrics](/learn/logistic-regression-classification-metrics-from-scratch).
