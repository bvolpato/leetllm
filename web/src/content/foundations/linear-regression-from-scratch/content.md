---
{
  "id": "linear-regression-from-scratch",
  "title": "Linear Regression from Scratch",
  "slug": "linear-regression-from-scratch",
  "section": "ML Algorithms & Evaluation",
  "category": "Model Architecture",
  "difficulty": "Medium",
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
<!-- leetllm: edition:reference:start -->

Five latency measurements climb smoothly from 118 ms at 100 tokens to 198 ms at 500 tokens. Fit a straight line and you get $R^2 = 0.9965$, which looks like textbook perfection until you zoom in on the residuals and spot a clean arch hiding underneath.

Linear regression is the simplest place to watch the full machinery of machine learning work in plain sight: orthogonal projection, iterative gradient descent, loss-surface geometry, regularization, and held-out evaluation. Building on [linear algebra](/learn/linear-algebra-machine-learning-deeper) and [Training & Backpropagation](/learn/training-backpropagation-gradient-descent), we will derive both the closed-form solution and gradient descent on the same five measurements, watch when a solver breaks, and see why a near-perfect training score can still steer extrapolation off course.

## Predicting latency from retrieved evidence

Our feature `x` is retrieved text length in hundreds of <span data-glossary="token">tokens</span>, and our target `y` is end-to-end latency in milliseconds. Keeping natural units makes every parameter readable: `x = 1` means 100 tokens and `y = 118` means 118 ms.

| Evidence length `x` (hundreds of tokens) | Observed latency `y` (ms) |
|---|---:|
| 1 | 118 |
| 2 | 141 |
| 3 | 162 |
| 4 | 181 |
| 5 | 198 |

Latency rises by roughly 20 ms for every extra 100 tokens. A linear model expresses that rule with two parameters:

- The **intercept**, `b`, sets the prediction at `x = 0`.
- The **slope**, `w` (or `m`), sets the change in predicted latency per additional 100 tokens.

For a general feature vector $x \in \mathbb{R}^D$, the linear regression hypothesis computes a weighted sum plus an offset:

$$
\hat{y} = w^\top x + b
$$

With one feature, $\hat{y} = w x + b$, and the candidate line

$$
\hat{y} = 100 + 20x
$$

starts at 100 ms of baseline overhead, adds 20 ms per 100 tokens, and predicts $100 + 20 \times 6 = 220$ ms at `x = 6` (600 tokens). Choosing `b` and `w` to minimize squared prediction errors gives **ordinary least squares** (OLS) <span data-glossary="linear-regression">linear regression</span>. Both `x = 0` and `x = 6` lie outside our observed 100-to-500-token span, so those predictions are **extrapolations**.

Inspecting the five arrays directly confirms the input and latency spans:

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

At `x = 1`, the candidate line predicts `120` ms while the replay measured `118`. At `x = 3`, it predicts `160` ms while the replay measured `162`. A model's predictions become informative when you name and inspect that signed gap. The **residual** is:

$$
e_i = y_i - \hat{y}_i
$$

On the raw latency scale, small 1-2 ms errors almost disappear against a 100-200 ms span, whereas isolating residuals on their own vertical scale exposes both their signs and curvature.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="The same five latency observations plotted on two scales. The fitted line y-hat = 100 + 20x has training R-squared 0.9965. The enlarged residual plot shows minus 2, plus 1, plus 2, plus 1, minus 2 milliseconds. Both x = 0 and x = 6 lie outside the observed range." />
  <figcaption>The line looks almost exact on the latency scale, yet isolating the residuals reveals a clean arch (-2, +1, +2, +1, -2 ms) that a straight line cannot bend to follow.</figcaption>
</figure>

Evaluating $\hat{y} = 100 + 20x$ row by row makes every signed miss explicit:

| `x` | Actual `y` | Predicted y-hat | Residual y - y-hat | Residual squared |
|---:|---:|---:|---:|---:|
| 1 | 118 | 120 | -2 | 4 |
| 2 | 141 | 140 | 1 | 1 |
| 3 | 162 | 160 | 2 | 4 |
| 4 | 181 | 180 | 1 | 1 |
| 5 | 198 | 200 | -2 | 4 |

Residual signs carry immediate diagnostic information: negative means the model predicted too high, and positive means too low. Here the residuals run $[-2, +1, +2, +1, -2]$, negative at both ends and positive in the middle. That symmetric arch hints at slight concavity in the relationship, which we will test against a quadratic fit later.

To summarize fit quality in one number, average the squared residuals across all $N$ observations:

$$
\text{MSE} = \frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2 = \frac{4 + 1 + 4 + 1 + 4}{5} = 2.8\,\text{ms}^2
$$

This is **<span data-glossary="mean-squared-error">mean squared error</span>** (MSE): squaring prevents opposite signs from canceling and penalizes large misses heavily. Its square root, **<span data-glossary="root-mean-squared-error">root mean squared error</span>** ($\text{RMSE} = \sqrt{2.8} \approx 1.67$ ms), brings error back to milliseconds. Compared with predicting the mean latency $\bar{y} = 160$ ms for every request (MSE `802.8`), our line cuts squared error to `2.8`.

The coefficient of determination, **<span data-glossary="r-squared">R-squared</span>**, expresses that drop as a fraction of variance around the target mean:[^sklearnR2Score2026]

$$
R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2} = 1 - \frac{14}{4014} = 1 - \frac{2.8}{802.8} \approx 0.9965
$$

For nonconstant targets, $R^2 = 0$ matches the mean baseline, $R^2 = 1$ means zero error, and negative values mean worse predictions than predicting the mean.

> **Key insight:** An $R^2$ of `0.9965` tells you the line explains almost all of the variance across these five points, yet it completely hides the `-2, +1, +2, +1, -2` arch. Always inspect residuals, never just summary scores.

```checkpoint
Why square residuals before averaging them instead of taking their raw sum?
---
Taking raw sums lets positive and negative residuals cancel out, making large over-predictions and under-predictions look like zero error. Squaring ensures all errors contribute positively, penalizing large blunders disproportionately.
```

Check your hand calculation against the next cell. Can a residual sum of zero coexist with nonzero MSE? Here it does: the signed misses cancel, but their squares sum to 14.

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

For one feature, $\hat{y} = 100 + 20x$ already names the prediction. Placing an all-ones intercept column beside those context lengths expresses every row at once as a single matrix-vector product. To write that compactly, construct a **design <span data-glossary="matrix">matrix</span>** $X \in \mathbb{R}^{N \times (D+1)}$ where each row represents one observation and each column supplies one model term:

$$
X =
\begin{bmatrix}
1 & 1 \\
1 & 2 \\
1 & 3 \\
1 & 4 \\
1 & 5
\end{bmatrix}
$$

Packing the intercept and slope into $w = [b, m]^\top \in \mathbb{R}^2$ writes the prediction rule across all $N$ requests cleanly as $\hat{y} = X w$, where optimal weights $w = [100, 20]^\top$ give the exact dot products simultaneously across rows and features:

$$
\begin{bmatrix} 1 & 3 \end{bmatrix}
\begin{bmatrix} 100 \\ 20 \end{bmatrix}
= 1 \times 100 + 3 \times 20 = 160
$$

Here the leading `1` multiplies the intercept `100` while `3` multiplies the slope `20`, and matrix multiplication applies that arithmetic across every row. Geometrically, $\hat{y} = X w$ lies inside the linear span of $X$'s columns. At the ordinary least squares minimum, $X w^*$ is therefore the orthogonal projection of $y$ onto $\text{col}(X)$, making the residual vector $e = y - X w^*$ orthogonal to every column of $X$:[^trefethen1997]

$$
X^\top (y - X w^*) = 0
$$

Arbitrary candidate weights fail this orthogonality identity, which we will verify in code right after solving for $w^*$.

```checkpoint
What happens if you remove the all-ones column from the design matrix?
---
The model loses its intercept parameter b and can only predict w * x, forcing the regression line through the origin (0, 0). If the true process has a non-zero baseline, this constraint severely degrades fit quality.
```

Dropping the all-ones column forces the line through the origin and drives MSE well past the mean baseline of `802.8`:

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

Forcing the line through zero inflates MSE to `1820.98`, more than double the mean baseline (`802.8`). Unless physics or domain geometry forces $\hat{y}(0) = 0$, keep the intercept column.

## The Normal Equation: closed-form ordinary least squares

To solve for $w^*$ directly without guessing, write MSE in matrix form and set its gradient to zero:

$$
J(w) = \frac{1}{N} \|X w - y\|_2^2 = \frac{1}{N} \left( w^\top X^\top X w - 2 y^\top X w + y^\top y \right)
$$

$$
\nabla_w J(w) = \frac{2}{N} \left( X^\top X w - X^\top y \right) = 0 \implies X^\top X w = X^\top y
$$

This linear system is the **Normal Equation**. When $X$ has full column rank, the **Gram matrix** $X^\top X \in \mathbb{R}^{(D+1) \times (D+1)}$ is symmetric positive definite and invertible, giving the unique global minimum:[^hastie2009]

$$
w^* = (X^\top X)^{-1} X^\top y, \qquad \begin{bmatrix} 5 & 15 \\ 15 & 55 \end{bmatrix} \begin{bmatrix} b \\ m \end{bmatrix} = \begin{bmatrix} 800 \\ 2600 \end{bmatrix}
$$

Row-reducing gives $10m = 200 \implies m = 20$, and back-substitution gives $5b + 300 = 800 \implies b = 100$. In code, never compute an explicit matrix inverse; use a linear solver or direct QR/SVD least squares (`np.linalg.lstsq`). Below, solving the normal system directly confirms `[100, 20]`, MSE `2.8`, and exact residual orthogonality:

<!-- leetllm: test, output=show -->
```python title="numpy-implementation-with-the-closed-form.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])

X = np.c_[np.ones_like(x), x]

w_closed = np.linalg.solve(X.T @ X, X.T @ y)
pred_closed = X @ w_closed
residuals = y - pred_closed

baseline = np.full_like(y, y.mean())
line_mse = np.mean((pred_closed - y) ** 2)
baseline_mse = np.mean((baseline - y) ** 2)
r2 = 1 - line_mse / baseline_mse

print("closed_form_weights", w_closed.round(2))
print("residuals", residuals.round(2))
print("line_mse", line_mse.round(2))
print("baseline_mse", baseline_mse.round(2))
print("r2", round(r2, 4))
print("residual_orthogonal", bool(np.allclose(X.T @ residuals, 0)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
closed_form_weights [100.  20.]
residuals [-2.  1.  2.  1. -2.]
line_mse 2.8
baseline_mse 802.8
r2 0.9965
residual_orthogonal True
```
<!-- leetllm: output:end -->

The check `X.T @ residuals` confirms geometric projection because the residuals are orthogonal to the column span of $X$. No linear weight adjustment can reduce squared error any further. Inspecting the design directly with `np.linalg.lstsq` then confirms rank `2`, condition number `cond_X` near `8.37`, and `cond_XTX` near `69.99`:

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

The 2-norm condition number of $X$ is $\sigma_{\max} / \sigma_{\min} \approx 7.69 / 0.92 \approx 8.37$, while forming $X^\top X$ squares it to `69.99`. On ill-conditioned features, that squaring can erase digits of precision before the solve even starts.

<details>
<summary>Deep dive: Cholesky complexity, memory scaling, and numerical rank cutoffs</summary>

For dense matrices with $N$ rows and $D$ features (absorbing the intercept into $D$), solving the normal equations via Cholesky factorization ($X^\top X = L L^\top$) carries three costs:

1. **Gram formation** ($X^\top X$): $O(N D^2)$ arithmetic operations.
2. **Cholesky factorization**: $O(D^3)$ operations (followed by $O(D^2)$ triangular solves).
3. **Gram storage**: $O(D^2)$ memory. At $D = 10{,}000$ features in `float64`, the Gram matrix alone holds 100 million entries (~800 MB), pushing large-feature problems toward iterative or sparse solvers.

QR and SVD solvers like `np.linalg.lstsq` operate directly on $X$, avoiding the $\kappa_2(X)^2$ condition-number squaring.[^trefethen1997][^numpyLstsq2026] With `rcond=None`, NumPy treats singular values below machine precision times $\max(N, D+1)$ times $\sigma_{\max}$ as zero. When $X$ is rank deficient (or $N \le D+1$), `lstsq` also returns an empty `residual_sums` array, so compute `y - X @ w` directly whenever you need residuals across all cases.

</details>

Appending a duplicate column `double_tokens = 2 * tokens` makes the design rank deficient: `np.linalg.solve` crashes on the singular Gram matrix, while `np.linalg.lstsq` reports rank `2` across `3` columns and selects the minimum-norm weight vector `[100, 4, 8]` (since $4x + 8(2x) = 20x$):

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

The prediction remains identical because $4x + 8(2x) = 20x$. However, the division of weight between the collinear columns isn't unique. Among the infinite set of solutions that achieve minimal MSE, `np.linalg.lstsq` returns the solution with the smallest Euclidean norm $\|w\|_2$.[^numpyLstsq2026] Here that produces $[100, 4, 8]$ with norm `100.4`, compared to `101.98` for $[100, 20, 0]$. SVD picks a stable minimum-norm vector, but it can't separate the physical contributions of duplicate features.

The returned `residual_sums` is empty even though squared errors sum to `14`. NumPy leaves this array empty when the design is rank deficient or has no more rows than columns. Empty means that this diagnostic wasn't returned, not that the fit is exact. Compute `y - X @ w` directly when you need errors for every solver case.[^numpyLstsq2026]

## Gradient descent finds the same line by walking downhill

When the Gram matrix or direct factorization is too expensive, iterative methods avoid constructing it. Millions of rows with a handful of features can still be manageable for a direct solve; many sparse features can favor sparse iterative solvers. Full-batch gradient descent is one option, not an automatic winner at a fixed data size.

The direct solve formed a Gram matrix and factored it, whereas gradient descent avoids constructing that matrix by starting from a parameter guess and stepping against the loss slope scaled by a **<span data-glossary="learning-rate">learning rate</span>** $\alpha$:

$$
w \leftarrow w - \alpha \nabla_w \text{MSE}
$$

Applying the chain rule to Mean Squared Error yields the vector gradient and its scalar intercept and feature components:

$$
\nabla_w \text{MSE} = \frac{2}{N} X^\top (X w - y), \qquad
\frac{\partial \text{MSE}}{\partial b} = \frac{2}{N} \sum_{i=1}^N (\hat{y}_i - y_i), \qquad
\frac{\partial \text{MSE}}{\partial w_j} = \frac{2}{N} \sum_{i=1}^N (\hat{y}_i - y_i) x_{i,j}
$$

The NumPy shapes must preserve those row-by-row errors under `X.shape == (N, D+1)`, `w.shape == (D+1,)`, and `y.shape == (N,)`. Subtracting an `(N, 1)` target from an `(N,)` prediction is valid broadcasting, yet it silently builds an `(N, N)` pairwise matrix comparing every target with every prediction.[^numpyBroadcasting2026] Instead of raising an exception, NumPy completes the calculation and returns a plausible-looking wrong loss:

<!-- leetllm: test, output=show, output_title="Broadcasting changes the loss" -->
```python title="preserve-one-error-per-request.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y_column = np.array([118.0, 141.0, 162.0, 181.0, 198.0])[:, None]
pred = 100 + 20 * x
wrong_error = pred - y_column
y = y_column[:, 0]  # One target per request, matching the 1D prediction vector shape.
error = pred - y
assert error.shape == y.shape == (len(x),)

print("broadcast_error_shape", wrong_error.shape)
print("broadcast_mse", round(float(np.mean(wrong_error ** 2)), 1))
print("paired_error_shape", error.shape)
print("paired_mse", round(float(np.mean(error ** 2)), 1))
```

<!-- leetllm: output:start -->
```text title="Broadcasting changes the loss" output compact
broadcast_error_shape (5, 5)
broadcast_mse 1602.8
paired_error_shape (5,)
paired_mse 2.8
```
<!-- leetllm: output:end -->

There is no shape error: the wrong loss is `1602.8` rather than `2.8`. Consistent column vectors are also valid if weights, predictions, targets, and gradients all use that convention. For multiple targets, preserve the output axis instead of flattening it. Check shapes before allowing an optimizer to minimize the wrong objective.

Starting with initial weights $w_0 = [0, 0]^\top$, every prediction is 0. Because zero sits below every observed latency value, each prediction error $\hat{y}_i - y_i$ is negative:

| Calculation step | Intercept coordinate | Slope coordinate |
|---|---:|---:|
| Predictions $\hat{y}$ | `[0, 0, 0, 0, 0]` | `[0, 0, 0, 0, 0]` |
| Errors $\hat{y} - y$ | `[-118, -141, -162, -181, -198]` | `[-118, -141, -162, -181, -198]` |
| Feature weighting | $\sum 1 \times (\hat{y}_i - y_i) = -800$ | $\sum x_i \times (\hat{y}_i - y_i) = -2600$ |
| Multiply by $2 / N = 2 / 5$ | $\text{grad}_b = -320$ | $\text{grad}_m = -1040$ |

The slope gradient magnitude is over three times larger than the intercept gradient because higher evidence values pull more strongly on the slope derivative, so applying learning rate $\alpha = 0.05$ produces the first update:

$$
w_1 = \begin{bmatrix} 0 \\ 0 \end{bmatrix} - 0.05 \begin{bmatrix} -320 \\ -1040 \end{bmatrix} = \begin{bmatrix} 16 \\ 52 \end{bmatrix}
$$

Even though the slope immediately overshoots its target of 20 by landing at 52, total MSE plunges from `26402.8` to `2194.8` because optimization progress reflects joint loss reduction rather than monotonic movement on every individual coordinate. Each full-batch iteration computes $X w$ and $X^\top (\hat{y} - y)$ in $O(N D)$ time (or $O(K N D)$ across $K$ steps) while holding $O(D)$ weights and $O(N)$ predictions and errors alongside $X$ and $y$, whereas mini-batch updates trade that $O(N)$ temporary memory for different optimization dynamics. Checking the first step in NumPy confirms gradient `[-320, -1040]`, weights `[16, 52]`, and the MSE drop from `26402.8` to `2194.8`:

<!-- leetllm: test, output=show -->
```python title="verify-the-first-gradient-step.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])
X = np.c_[np.ones_like(x), x]
w = np.zeros(2)

error = X @ w - y
grad = (2 / len(X)) * X.T @ error
w_next = w - 0.05 * grad

print("gradient", grad)
print("next_weights", w_next)
print("old_mse", round(float(np.mean(error ** 2)), 1))
print("new_mse", round(float(np.mean((X @ w_next - y) ** 2)), 1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
gradient [ -320. -1040.]
next_weights [16. 52.]
old_mse 26402.8
new_mse 2194.8
```
<!-- leetllm: output:end -->

After one step, the slope sits farther from 20 even though total loss fell sharply. Running 1,000 steps lets both coordinates recover together along the valley floor. Comparing the final iterate with the direct fit shows how closely gradient descent approaches the exact optimum:

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

After 1000 iterations, the iterative weights match the closed-form solution to within $10^{-4}$, confirming that both solvers converge to the identical least-squares minimum.

## Convex loss bowl geometry and step size selection

Why did the first gradient step jump past the optimal slope of 20 to 52, and why did later iterations take dozens of steps to crawl from $[84.05, 24.42]$ to $[100, 20]$? The answer lies in the quadratic geometry of the loss surface.

The second-derivative matrix (Hessian) of the Mean Squared Error loss is constant:

$$
H = \nabla_w^2 \text{MSE} = \frac{2}{N} X^\top X
$$

For full column rank, $X^\top X$ is positive definite and all eigenvalues of $H$ are positive. The loss is strictly convex with one minimum and no nonglobal local minima or saddle points. A rank-deficient design still gives a convex loss, but flat directions allow multiple minimizing weight vectors.

The duplicate-feature design above has one such direction: $v=[0,2,-1]^\top$ satisfies $Xv=0$. Adding $v$ changes coefficients without changing any prediction. Every gradient is a combination of the rows of $X$, so it is orthogonal to $v$: gradient descent can't change the initial component along this flat direction. With a convergent step size and zero initialization, it reaches the minimum-norm solution. A nonzero initial component in the null space survives.[^cornellLinearRegression2026]

<!-- leetllm: test, output=show, output_title="Initialization survives in a flat direction" -->
```python title="duplicate-features-keep-a-null-space-component.py"
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([118.0, 141.0, 162.0, 181.0, 198.0])
X = np.c_[np.ones_like(x), x, 2 * x]
null_direction = np.array([0.0, 2.0, -1.0])
assert np.allclose(X @ null_direction, 0)

def fit_from(start):
    w = start.copy()
    for _ in range(5_000):
        w -= 0.01 * (2 / len(x)) * X.T @ (X @ w - y)
    return w

from_zero = fit_from(np.zeros(3))
from_null = fit_from(null_direction)
print("zero_start_weights", from_zero.round(2).tolist())
print("null_start_weights", from_null.round(2).tolist())
print("same_predictions", bool(np.allclose(X @ from_zero, X @ from_null)))
print("surviving_difference", (from_null - from_zero).round(2).tolist())
```

<!-- leetllm: output:start -->
```text title="Initialization survives in a flat direction" output compact
zero_start_weights [100.0, 4.0, 8.0]
null_start_weights [100.0, 6.0, 7.0]
same_predictions True
surviving_difference [0.0, 2.0, -1.0]
```
<!-- leetllm: output:end -->

Both runs minimize the same training MSE, but their coefficients differ. Solver agreement should compare predictions and loss as well as coefficients; rank deficiency changes what coefficient agreement can mean.

<figure>
  <img src="illustrations/_generated/gradient_descent_update_loop_dark.png" alt="Equal-MSE contours for the five latency rows form a narrow valley around intercept 100 and slope 20. At learning rate 0.05, full-batch descent starts at [0, 0], overshoots to [16, 52], and approaches the OLS minimum [100, 20]. Contours mark MSE levels 50, 150, 300, and 500 milliseconds squared." />
  <figcaption>The loss surface forms an eccentric quadratic bowl. High curvature along the steep axis causes the initial step to overshoot to slope 52, while low curvature along the valley floor requires hundreds of iterations to traverse.</figcaption>
</figure>

The eigenvalues of $H$, $\lambda_{\max}$ and $\lambda_{\min}$, govern the surface curvature along its principal axes:

- The condition number of the Hessian is $\kappa = \frac{\lambda_{\max}}{\lambda_{\min}}$.
- For our replay data, the Hessian matrix is $\begin{bmatrix} 2 & 6 \\ 6 & 22 \end{bmatrix}$, yielding $\lambda_{\max} \approx 23.66$ and $\lambda_{\min} \approx 0.34$.
- The condition number is $\kappa \approx \frac{23.66}{0.34} \approx 70$.

A condition number near 70 means a curvature ratio near 70; contour semiaxes have ratio $\sqrt{70} \approx 8.37$ in these parameter coordinates. With our step size, the steep direction oscillates while the flat direction decays slowly. A sufficiently smaller step would avoid that oscillation, but still make slow progress. Conditioning and the learning rate jointly determine the path.

This geometry determines the mathematical bound for learning rate stability. For gradient descent on a quadratic surface to converge without diverging, the step size must satisfy:

$$
0 < \alpha < \frac{2}{\lambda_{\max}}
$$

For our table, $2/\lambda_{\max} \approx 0.0845$, so $\alpha = 0.05$ converges in exact arithmetic. In each eigenvector direction, parameter error is multiplied by $1-\alpha\lambda_i$ per step. At $\alpha=0.2$, the steep direction's multiplier has magnitude greater than 1, producing exponential growth when that direction has nonzero initial error.

The fixed step $\alpha^* = 2/(\lambda_{\max}+\lambda_{\min})$ minimizes the worst-case parameter-error contraction factor, $(\kappa-1)/(\kappa+1)$, for this positive-definite quadratic. The corresponding worst-case loss-gap factor is its square. Neural networks need learning-rate choices tested against their own optimization dynamics.

Centering and scaling our **single** nonconstant feature to unit population variance makes it orthogonal to the intercept column and gives $H=2I$, so $\kappa=1$. With several features, however, standardization preserves pairwise correlations, so two duplicate standardized columns remain exact duplicates.[^sklearnStandardScaler2026] Evaluating both designs in code confirms that the single-feature Hessian becomes isotropic while the duplicate-feature design stays rank deficient:

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

# Display tiny roundoff as zero; retain the original Hessian for computations.
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

Violating the stability bound with $\alpha = 0.2$ produces an exploding loss sequence where every update overshoots farther away from the minimum:

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

The five recorded losses grow from $2.6 \times 10^4$ to $9.4 \times 10^8$ in four updates.

> **Common mistake:** Standardizing features fixes conditioning for a single feature (turning $\kappa \approx 70$ into $\kappa = 1$), yet it does **not** remove correlation between features. Two duplicate columns remain exact duplicates after `StandardScaler`.

## Stabilizing ill-conditioned fits with Ridge and Lasso

Strongly correlated features make OLS coefficients swing wildly under tiny data perturbations, and having more parameters than rows leaves OLS weights non-unique. **<span data-glossary="regularization">Regularization</span>** adds a penalty on feature weights to stabilize the fit, trading a small bias for lower variance.[^hastie2009]

**Ridge Regression (L2 regularization)** adds the sum of squared feature weights to the loss:

$$
J_{\text{ridge}}(w) = \frac{1}{N} \|X w - y\|_2^2 + \lambda \|w_{1:D}\|_2^2
$$

Notice that the penalty excludes the intercept $w_0 = b$. Setting $R = \operatorname{diag}(0, 1, \ldots, 1)$ and solving $\nabla_w J_{\text{ridge}}(w) = 0$ gives:

$$
w^*_{\text{ridge}} = \left( X^\top X + \lambda N R \right)^{-1} X^\top y
$$

For $\lambda > 0$, the matrix $X^\top X + \lambda N R$ is strictly positive definite even when feature columns are collinear (so a linear solve always succeeds). Using $I$ instead of $R$ penalizes the intercept too, pulling predictions toward zero and breaking the match between mean prediction and target mean:

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

**Lasso Regression (L1 regularization)** penalizes the sum of absolute feature weights:

$$
J_{\text{lasso}}(w) = \frac{1}{N} \|X w - y\|_2^2 + \lambda \|w_{1:D}\|_1 = \frac{1}{N} \|X w - y\|_2^2 + \lambda \sum_{j=1}^D |w_j|
$$

Lasso also leaves the intercept unpenalized here. Its absolute-value corner requires different optimization machinery, such as coordinate descent or a proximal method. The soft-thresholding operator is:

$$
S_t(z) = \text{sign}(z) \max(|z| - t, 0)
$$

The threshold depends on the loss convention and feature norm. For our MSE-plus-penalty objective, a coordinate update for a nonzero feature column is

$$
w_j \leftarrow \frac{S_{\lambda/2}(X_j^\top r_j/N)}{X_j^\top X_j/N},\qquad r_j=y-\sum_{k\ne j}X_k w_k.
$$

The factor $\lambda/2$ comes from differentiating MSE; using half-MSE would change it. The intercept uses an unpenalized update. In two penalized dimensions, the L1 constraint is a diamond whose corners have zero coordinates. This geometry favors **sparse** solutions, but contact can occur along an edge too. Lasso doesn't identify which features are truly uninformative: correlated inputs can be interchangeable, selected features may be spurious, and weak useful features may be omitted.

Fit scaling statistics strictly on training data and reuse them unchanged on validation and test splits. Because both Ridge and Lasso depend on feature units, unscaled inputs weight small-unit columns differently from large-unit columns. Choose the regularization strength $\lambda$ using a validation split that mirrors the traffic distribution you want to predict.

Library parameters need the same care. scikit-learn's `Ridge` uses summed squared error, so our objective maps to `alpha = lambda * N`. Its `Lasso` uses half-MSE, so our Lasso objective maps to `alpha = lambda / 2`. Identically named strength parameters aren't necessarily on the same scale.[^sklearnLinearModels2026]

| Property | Ordinary least squares | Ridge (L2 penalty) | Lasso (L1 penalty) |
|---|---|---|---|
| Objective penalty | None | $\lambda \|w_{1:D}\|_2^2$ | $\lambda \|w_{1:D}\|_1$ |
| Direct expression | Inverse expression for full column rank; minimum-norm `lstsq` otherwise | $(X^\top X + \lambda N R)^{-1}X^\top y$ | No general single matrix-inverse expression |
| Unique weights | Full column rank gives uniqueness | Yes under the intercept/penalty conditions above | Not guaranteed for redundant features |
| Coefficient behavior | Unpenalized | Overall shrinkage of feature weights | Can produce exact zeros |
| Typical reason to try it | Continuous-target baseline | Stabilize correlated features | A sparse predictor |

## Gauss-Markov foundations and residual diagnostic checks

Under clean classical error assumptions, the **Gauss-Markov theorem** shows that OLS is **BLUE**, the Best Linear Unbiased Estimator: among all unbiased estimators that are linear functions of the observed targets $y$, OLS achieves the smallest coefficient covariance.[^freedman2004GaussMarkov]

<details>
<summary>Deep dive: the five Gauss-Markov conditions and classical inference</summary>

Conditional on a full-column-rank design matrix $X$, OLS is BLUE when:

1. **Linearity in parameters**: $y = Xw + \epsilon$. Nonlinear feature columns such as $x^2$ or $\log x$ are allowed; the weights $w$ still enter linearly.
2. **Zero conditional error mean**: $\mathbb{E}[\epsilon \mid X] = 0$. Measurement error in features or omitted variables correlated with $X$ break this condition.
3. **Full column rank**: $\operatorname{rank}(X) = D + 1 \le N$, making every coefficient identifiable.
4. **Constant conditional error variance (homoscedasticity)**: $\operatorname{Var}(\epsilon_i \mid X) = \sigma^2 < \infty$.
5. **Uncorrelated conditional errors**: $\operatorname{Cov}(\epsilon_i, \epsilon_j \mid X) = 0$ for $i \ne j$ (sequential traffic with shared load or cache state often breaks this).

Together, conditions 4 and 5 read $\operatorname{Cov}(\epsilon \mid X) = \sigma^2 I$. Notice that normality of $\epsilon$ is **not** required for BLUE; Gaussian errors are only needed for exact small-sample $t$ and $F$ intervals. Also keep fitted residuals $e = y - X\hat{w}$ distinct from true population errors $\epsilon$: because $X^\top e = 0$, fitted residuals are constrained and correlated even when true errors are independent.

</details>

Because linearity in parameters allows nonlinear columns, adding $x^2$ to our table stays linear regression. It fits weights `[93, 26, -1]` with zero training error and bends the `x = 6` extrapolation down from `220` ms to `213` ms:

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

Both `220.0` ms and `213.0` ms extrapolate past our observed range, and hitting zero error on five points only shows that a parabola can bend through them. Fresh measurements at 600 tokens settle which curve generalizes better.

## Evaluation starts on unseen requests

Training scores only measure fit on rows the solver already saw. To estimate performance on fresh traffic, build a <span data-glossary="train-validation-test-split">train, validation, and test split</span> that mirrors how the model will be used: random splits for independent requests, time splits for future traffic, and grouped splits when repeated users or sessions share structure. Hold out the test partition before exploratory analysis.

To see split mechanics on our five rows, fit on the first four lengths ($x \in \{1, 2, 3, 4\}$) and evaluate on the held-out fifth request ($x = 5$). Because the first four increments are slightly steeper, the fit shifts to $\hat{y} = 98 + 21x$ and predicts `203` ms for `x = 5`:

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

The baseline predicts the **training** mean ($150.5$ ms) without inspecting the test observation. One scored point cannot measure typical future variance or yield a meaningful test $R^2$. Even so, the comparison demonstrates split separation cleanly because parameters come strictly from training rows while held-out data grades predictive accuracy.

## Match a trusted implementation

With the NumPy fit in hand, the remaining verification is checking whether a maintained library solver produces the exact same intercept, slope, and errors on these five observations. scikit-learn's `LinearRegression` solves ordinary least squares and fits an intercept by default on a 2D feature matrix of shape `(5, 1)` and target vector `(5,)`.[^sklearnLinearRegression2026] Running it on our rows reproduces intercept `100.0`, slope `20.0`, MSE `2.8`, and $R^2 \approx 0.9965$:

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

Exact agreement confirms our hand derivation and NumPy solve against a standard library solver. Under the hood, `LinearRegression` centers features and calls a direct least-squares factorization rather than forming $X^\top X$, and uses its `tol` parameter as the singular-value rank cutoff, so near-collinear matrices can occasionally report slightly different numerical ranks than `np.linalg.lstsq(rcond=None)`.

## Operating limits and extrapolation guardrails

A point prediction of `220 ms` at `x = 6` hides uncertainty. A **<span data-glossary="confidence-interval">confidence interval</span>** brackets uncertainty in the conditional mean latency at `x`, whereas a **<span data-glossary="prediction-interval">prediction interval</span>** is wider because it also adds the scatter of an individual future observation.

For deployment, store the training domain alongside the weights:

1. Save feature units, observed training ranges ($1 \le x \le 5$), condition numbers, and held-out error distributions with the model artifact.
2. Route extreme out-of-range inputs (such as `x = 50` after training on `1` through `5`) to an explicit fallback rather than trusting linear extrapolation, because long contexts trigger nonlinear regime changes like memory paging or context truncation.

## Common failure patterns

Each symptom below suggests diagnostic evidence to inspect before running a targeted follow-up experiment:

| Symptom | Evidence to inspect | Next experiment |
|---|---|---|
| Residuals show a low-high-low arc | More observations at comparable lengths; load/cache and omitted-feature patterns | Compare a curved or richer-feature fit on fresh data |
| Gradient-descent loss grows | Actual gradient formula, finite input values, Hessian eigenvalues, and learning rate | On this quadratic, try a rate inside the bound; scale features using training statistics |
| A Gram solve fails or coefficients vary sharply | Numerical rank, singular values, duplicate columns, units, and perturbation sensitivity | Try direct `lstsq`; compare feature removal and feature-only Ridge on held-out predictions |
| High training $R^2$, large test error | Split integrity, feature availability at prediction time, and differences in traffic | Check for leakage and evaluate with a split matching the observed shift |
| One row changes the fit substantially | Both unusual feature values (leverage) and its residual; possible measurement faults | Compare fits with/without the row and a suitable robust loss; don't remove valid traffic merely for being extreme |

## Try it yourself

The five latencies exhibit a stable update, a diverging update, and a curvature pattern that $R^2$ conceals. Modify the script to inspect weights, losses, and residuals for each perturbation below:

| Experiment | Target observation |
|---|---|
| Evaluate fitted latency at `x = 6` | $220\text{ ms} = 100 + 20 \times 6$. This extrapolates beyond the training inputs and requires validation on fresh traffic before operational use. |
| Modify the final target from `198` to `240` and refit | Weights shift to $[83.2, 28.4]$, and the $x = 6$ prediction jumps to $253.6$ ms. One extreme observation alters slope across the entire input domain. |
| Set `lr = 0.2` in the gradient loop | Loss explodes rapidly because $\alpha > 2/\lambda_{\max}$, confirming step-size instability. |
| Drop the intercept column and fit using `x` alone | Forcing the line through zero inflates MSE from $2.8$ to $1820.98$, performing worse than the simple target mean baseline. |
| Add collinear column `2 * x` and call `np.linalg.solve` | The system raises a singular matrix error, while `lstsq` returns the minimum-norm solution vector $[100, 4, 8]$. |
| Standardize this single feature, then repeat with `[x, 2*x]` | The one-feature Hessian has $\kappa=1$; the duplicate-feature design remains rank deficient. Standardization doesn't remove correlations. |

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

> **Next:** Continue to [Logistic Regression and Metrics](/learn/logistic-regression-classification-metrics-from-scratch). Linear regression fits continuous numbers like latency. Classification takes those linear scores, maps them through a logistic sigmoid into probabilities, and optimizes cross-entropy loss to decide whether a request succeeds or fails.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Suppose you run an assistant that retrieves documents before it answers. Your capacity plan needs a number: how slow does a request get when it pulls in more text? You replay five requests through your staging system and write down what you see.

| Retrieved context `x` (hundreds of tokens) | Latency `y` (ms) |
|---:|---:|
| 1 | 118 |
| 2 | 141 |
| 3 | 162 |
| 4 | 181 |
| 5 | 198 |

A token is a piece of text, usually a bit shorter than a word. Part 1 explains exactly how text gets cut into them. For now it is just the unit you pay in.

Look at those rows for a moment and you will probably form a rule without trying. Latency starts somewhere near 100 ms and climbs by about 20 ms for each extra hundred tokens. So a request with 600 tokens of context should take about $100 + 20 \times 6 = 220$ ms.

## A model is a function with knobs

Congratulations on building your first model: it is worth slowing down to examine what just happened, because every model in this book follows the exact same pattern at much larger scale. Your rule has a fixed shape and two adjustable numbers:

$$
\hat{y} = wx + b
$$

Here $x$ is the input, and $\hat{y}$, read "y hat," is the prediction, where the hat distinguishes a guess from a measurement. The two knobs have names: the **slope** $w$ says how much the prediction moves per unit of input, and the **intercept** $b$ is the prediction when the input is zero. Machine learning calls both of them **parameters**, and usually calls a slope a **weight**.

Keep the two halves of that equation separate in your mind because the entire field depends on the split:

- **You choose the shape.** A straight line, in this case. People also call this the model's architecture.
- **The data chooses the numbers.** You never decided that the slope should be 20. The measurements did.

A language model is built the same way: its authors write out a long calculation and leave the numbers blank, except with billions of blanks instead of two. Filling them in is called **training**, while running the finished function on new input with the numbers frozen is called **inference**; calling a model API pays for inference, whereas spending months on a GPU cluster is training. Even in code, the model function itself is tiny:

<!-- leetllm: test, output=show, id=reader-regression-predict -->
```python title="a-model-is-a-function.py"
def predict(x, w, b):
    return w * x + b

w, b = 20.0, 100.0
for tokens_in_hundreds in [1, 3, 6]:
    print(tokens_in_hundreds, "->", predict(tokens_in_hundreds, w, b), "ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1 -> 120.0 ms
3 -> 160.0 ms
6 -> 220.0 ms
```
<!-- leetllm: output:end -->

## Score a guess with a single number

To improve a model automatically without eyeballing numbers, a program must tell whether one set of knobs beats another, so we compress "how wrong is this?" into a single number called the **loss**. Start with each individual miss, the **residual** between what happened and what you predicted:

| `x` | Actual `y` | Predicted $\hat{y}$ | Residual $y - \hat{y}$ | Squared |
|---:|---:|---:|---:|---:|
| 1 | 118 | 120 | -2 | 4 |
| 2 | 141 | 140 | +1 | 1 |
| 3 | 162 | 160 | +2 | 4 |
| 4 | 181 | 180 | +1 | 1 |
| 5 | 198 | 200 | -2 | 4 |

You cannot simply add the residuals because these five sum to zero, calling an imperfect line perfect as overestimates cancel underestimates. Squaring removes the signs while punishing one big miss more than several small ones, and averaging those squares gives the **mean squared error**:

$$
\text{MSE} = \frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i)^2 = \frac{4 + 1 + 4 + 1 + 4}{5} = 2.8
$$

On its own, `2.8` tells you nothing until you compare against the simplest fallback. Predicting the average latency of `160` ms for every request regardless of input gives an MSE of `802.8`, so the line improves substantially on that baseline and actually learned structure from the feature. Making that baseline comparison a reflex pays off because impressive-looking metrics sometimes barely beat a constant average once checked.

<figure>
  <img src="illustrations/_generated/fit_residuals_dark.png" alt="Five measured requests plotted as latency in milliseconds against retrieved context in hundreds of tokens, with the line 100 plus 20 x through them. Vertical gaps mark each residual. A dashed extension predicts 220 milliseconds at 600 tokens. The plot below enlarges the residuals: minus 2, plus 1, plus 2, plus 1, minus 2, an arch that a straight line cannot follow." />
  <figcaption>The line sits close to all five measurements, so its loss is small. Plotting the residuals alone shows what the first view hides: they form an arch, which is a sign that the true relationship curves slightly.</figcaption>
</figure>

Now look at the right side of that figure, because it holds a habit worth stealing. The residuals are not random. They run negative, positive, positive, positive, negative. A summary number like 2.8 hides that arch, and the arch is telling you that latency is not quite a straight line in this data. Our guess of 220 ms at 600 tokens is therefore probably too high. A quadratic fits these five rows exactly and predicts 213 ms. Averages hide patterns, and looking at individual errors finds them. You will do the same thing again in Part 1, when you break a language model's score down by kind of input and read what failed.

```checkpoint
Why do we square residuals before averaging them?
---
Signed residuals cancel: here they sum to exactly zero even though every prediction misses. Squaring makes every miss count, and it weighs one large miss more heavily than several small ones.
```

## Training is walking downhill

You found the slope and intercept by inspecting five rows, yet eyeballing stops working at three inputs and stops being imaginable at a billion. Picture the loss as a landscape where every combination of $b$ and $w$ is a location and the height at that location is the MSE you would get there. Although a full pass over the data only evaluates one height at a time, you can always probe the ground right under your feet:

1. Nudge one knob by a tiny amount and recompute the loss.
2. If the loss went up, that knob should move the other way, and how fast the loss changed tells you how hard to push.
3. Do that for every knob, then take a small step downhill.
4. Repeat.

That procedure is **gradient descent**, where the **gradient** is the list of those slopes (one per knob) and the **learning rate** sets the size of each step. Below, the loop converges on our five requests starting from zero for both knobs:

<!-- leetllm: test, output=show, id=reader-regression-nudge -->
```python title="train-by-nudging.py"
X = [1, 2, 3, 4, 5]
Y = [118, 141, 162, 181, 198]

def loss(b, w):
    return sum((w * x + b - y) ** 2 for x, y in zip(X, Y)) / len(X)

b, w = 0.0, 0.0
learning_rate = 0.05
nudge = 1e-4

for step in range(2001):
    if step in (0, 1, 2, 10, 100, 500, 2000):
        print(f"step {step:4d}  b={b:7.2f}  w={w:6.2f}  loss={loss(b, w):9.2f}")
    slope_b = (loss(b + nudge, w) - loss(b, w)) / nudge
    slope_w = (loss(b, w + nudge) - loss(b, w)) / nudge
    b -= learning_rate * slope_b
    w -= learning_rate * slope_w
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step    0  b=   0.00  w=  0.00  loss= 26402.80
step    1  b=  16.00  w= 52.00  loss=  2194.79
step    2  b=  14.80  w= 42.00  loss=  1339.44
step   10  b=  26.02  w= 40.49  loss=   998.93
step  100  b=  84.05  w= 24.42  loss=    49.09
step  500  b=  99.98  w= 20.00  loss=     2.80
step 2000  b= 100.00  w= 20.00  loss=     2.80
```
<!-- leetllm: output:end -->

With no statistics and no closed-form algebra, a dozen lines of Python recovered the same intercept and slope using only repeated small corrections. Almost no deep-learning objective has an exact formula, which is why gradient descent trains nearly every model in this book. Notice, however, that loss collapsed from roughly 26,000 to about 1,000 in the first ten steps before needing hundreds more to squeeze out the rest, a slowdown visible in the contour landscape below:

<figure>
  <img src="illustrations/_generated/loss_valley_dark.png" alt="Above: contour lines of mean squared error over intercept and slope form a long diagonal valley. A gradient descent path starts at intercept 0 and slope 0, jumps across the valley in a few steps, then crawls along it toward the minimum at intercept 100 and slope 20. Below: the loss of the same run against step number on a log scale. It falls by a large factor in the first few steps and then declines slowly, reaching 2.8 by about 500 steps." />
  <figcaption>Each contour line joins knob settings with equal loss. The path drops steeply into a narrow valley in a few steps, then creeps along the valley floor. The log-scale plot below shows the same run as loss over time.</figcaption>
</figure>

The landscape forms a long, narrow valley because raising the intercept and lowering the slope nearly cancel each other out, leaving gradient descent little slope to follow once it drops straight onto the valley floor. That geometry is common enough that a whole family of optimizers, including Adam in Chapter 5, exists to handle it. Moreover, finite-difference nudging costs a full pass over the data for every knob on every step, so scaling from two knobs to a billion would take a billion passes per update; Chapter 4 shows how backpropagation recovers every gradient simultaneously for roughly the cost of one forward-and-backward pass.

## A low training loss proves less than you think

Your model scores well on the five requests it learned from, yet what really matters is tomorrow's unseen request. To grade generalization honestly, hide part of the data before fitting and evaluate only at the end; holding out the fifth request and fitting on the first four yields $\hat{y} = 98 + 21x$:

<!-- leetllm: test, output=show, id=reader-regression-holdout -->
```python title="grade-on-a-held-out-request.py"
train = [(1, 118), (2, 141), (3, 162), (4, 181)]
held_out_x, held_out_y = 5, 198

n = len(train)
mean_x = sum(x for x, _ in train) / n
mean_y = sum(y for _, y in train) / n
top = sum((x - mean_x) * (y - mean_y) for x, y in train)
w = top / sum((x - mean_x) ** 2 for x, _ in train)
b = mean_y - w * mean_x

prediction = w * held_out_x + b
print(f"fit: y = {b:.0f} + {w:.0f}x")
miss = abs(prediction - held_out_y)
print(f"line predicts {prediction:.0f} ms, missing by {miss:.1f} ms")
miss = abs(mean_y - held_out_y)
print(f"training mean predicts {mean_y} ms, missing by {miss:.1f} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fit: y = 98 + 21x
line predicts 203 ms, missing by 5.0 ms
training mean predicts 150.5 ms, missing by 47.5 ms
```
<!-- leetllm: output:end -->

That script applies the exact slope-and-intercept formula directly, setting the slope to the covariance of $x$ and $y$ divided by the variance of $x$ and anchoring the line through both sample means. On the hidden request, the line misses by `5` ms while the training mean baseline misses by `47.5` ms, showing the structure of an honest split where parameters come strictly from training data and evaluation stays isolated.

<figure>
  <img src="illustrations/_generated/heldout_check_dark.png" alt="A line fit to the first four requests, 98 plus 21 x, extends to the held-out fifth request at x equals 5. It predicts 203 milliseconds against an actual 198, a miss of 5 milliseconds. A flat baseline at the training mean of 150.5 milliseconds misses the same request by 47.5 milliseconds." />
  <figcaption>The line and the baseline learn only from the four training requests. The shaded region stays hidden until grading, where the line misses by 5 ms and the baseline misses by 47.5 ms.</figcaption>
</figure>

Three recurring mistakes break held-out evaluation in models of every size:

- **Leakage.** Information from the test data sneaks into training, and your score goes up for no real reason. If the same document appears in both sets, the model has seen the answer. Part 1 returns to this when you measure language models.
- **Extrapolation.** Every number in our table has between 100 and 500 tokens of context. The line will cheerfully predict latency at 50,000 tokens, and nothing in our data says that prediction means anything. At that length a real server is a different machine: the request may wait behind others, fall out of a cache, or run into the model's context limit. Nothing in our five rows can warn you about any of that. Models do not know where their data ends.
- **Confusing correlation with cause.** The line says more context comes with more latency. If these rows had come from production logs, the line could not tell you that trimming context will fix your latency, because longer contexts may also arrive during busy periods. To find out, change one thing and measure, which is exactly what a replay in staging lets you do.

```checkpoint
A teammate reports that their model has almost zero loss on its training data. What is the first question you ask?
---
Ask how it scores on data it did not train on, and how that compares with a simple baseline. A model can reach a very low training loss by memorizing its examples, so training loss alone says little about tomorrow's requests.
```

## From one input to many

Real latency depends on queue depth, output length, model version, and time of day alongside context length, which leads directly to one weight per input summed together:

$$
\hat{y} = w_1 x_1 + w_2 x_2 + \dots + w_d x_d + b
$$

You could evaluate that sum in a Python loop for a handful of inputs, yet a language model performs weighted sums billions of times per request and requires compact matrix notation that maps directly onto vector and tensor hardware, which is the subject of the next chapter. Across all of these chapters, the four foundations stay the same: define a model shape with adjustable parameters, measure error with a loss function, walk downhill with repeated corrections, and evaluate honestly on held-out data.

<!-- leetllm: edition:reader:end -->
