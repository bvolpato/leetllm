---
{
  "id": "linear-algebra-machine-learning-deeper",
  "title": "Linear Algebra for ML",
  "slug": "linear-algebra-machine-learning-deeper",
  "section": "Math & Tensor Foundations",
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
  "shortDescription": "A matrix hides strong shared directions and weak contrasts. Use SVD, eigendecomposition, and least squares to measure what rank truncation and conditioning preserve or discard.",
  "keyConceptsTested": [
    "singular value decomposition as directions and strengths",
    "right and left singular vectors in feature and document space",
    "linear combinations, span, basis, and orthogonal projections",
    "matrix rank and best low-rank approximation",
    "principal component analysis on centered data",
    "least-squares fitting through a matrix column space",
    "condition numbers for inverse-like operations",
    "validation of compressed retrieval representations"
  ],
  "prerequisites": [
    "numpy-and-tensor-shapes"
  ]
}
---

Take three technical documents described by two numbers, whether each contains `code` and whether it contains `prose`: `kernel = [1, 0]`, `essay = [0, 1]`, and `note = [1, 1]`. Compress that tiny table to rank 1, keeping 75% of its total energy, and `kernel` collapses onto the exact same coordinates as `essay`. A search index can no longer tell a kernel guide apart from a prose essay.

That $3 \times 2$ table captures the geometric tradeoff behind embedding compression, PCA, LoRA, and least squares. <span data-glossary="svd">Singular value decomposition</span> (SVD) breaks any matrix into perpendicular input directions paired with nonnegative output strengths, exposing which patterns carry energy and which distinctions vanish when you truncate. Building on [vectors, matrices, and tensors](/learn/numpy-and-tensor-shapes), we will work through SVD, Gram eigendecomposition, least squares, and conditioning by hand on these three rows, then scale the same machinery to <span data-glossary="pytorch">PyTorch</span> weight matrices.

## A matrix can hide repeated directions

Arrange our three documents into a $3 \times 2$ <span data-glossary="matrix">matrix</span> $A$ with `code` in column 0 and `prose` in column 1:

$$
A =
\begin{bmatrix}
1 & 0 \\
0 & 1 \\
1 & 1
\end{bmatrix}
$$

Compare the two perpendicular **unit vectors** (length 1 so output size reflects $A$ alone, not probe scaling):

$$
v_{\text{common}} = \frac{1}{\sqrt{2}}
\begin{bmatrix}1 \\ 1\end{bmatrix},
\qquad
v_{\text{contrast}} = \frac{1}{\sqrt{2}}
\begin{bmatrix}1 \\ -1\end{bmatrix}
$$

Multiplying $A$ on the right returns one score per document. Along $v_{\text{common}}$, the scores are $[1/\sqrt{2}, 1/\sqrt{2}, 2/\sqrt{2}]$, whose squared entries sum to $3$ (length $\sqrt{3} \approx 1.7321$). Along $v_{\text{contrast}}$, the scores are $[1/\sqrt{2}, -1/\sqrt{2}, 0]$, with length $1$. Both directions entered with unit length, yet $A$ stretches the shared direction by $\sqrt{3}$ while keeping the contrast direction at `1.0`.

<!-- leetllm: test, output=show -->
```python title="measure-two-document-directions.py"
import numpy as np

A = np.array([
    [1.0, 0.0],  # kernel: code only
    [0.0, 1.0],  # essay: prose only
    [1.0, 1.0],  # note: code and prose
])
common = np.array([1.0, 1.0]) / np.sqrt(2)
contrast = np.array([1.0, -1.0]) / np.sqrt(2)

common_scores = A @ common
contrast_scores = A @ contrast

print("A_shape", A.shape)
print("common_scores", common_scores.round(4).tolist())
print("contrast_scores", contrast_scores.round(4).tolist())
print("strengths", round(float(np.linalg.norm(common_scores)), 4), round(float(np.linalg.norm(contrast_scores)), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A_shape (3, 2)
common_scores [0.7071, 0.7071, 1.4142]
contrast_scores [0.7071, -0.7071, 0.0]
strengths 1.7321 1.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Three document rows plotted in code and prose coordinates beside perpendicular unit arrows for common and contrast directions. Separate bars show the output lengths square root of 3 versus 1." />
  <figcaption>Both feature-space arrows have unit length. After multiplication by A, the common direction produces a three-document score vector of length √3, compared with 1 for contrast.</figcaption>
</figure>

## Coordinates come from an orthonormal basis

Every vector formed by scaling and adding a set of vectors lies in its **span**. Because $v_{\text{common}}$ and $v_{\text{contrast}}$ have unit length and zero dot product ($(1 - 1)/2 = 0$), they are **linearly independent** and form an **orthonormal basis** of $\mathbb{R}^2$.

Changing coordinates into an orthonormal basis requires only dot products. For a document with term counts $x = [3, 1]$, its projections are $c_{\text{common}} = x \cdot v_{\text{common}} = 2\sqrt{2}$ and $c_{\text{contrast}} = x \cdot v_{\text{contrast}} = \sqrt{2}$, rebuilding $x = [2, 2] + [1, -1] = [3, 1]$. When a direction $b$ is *not* unit length, requiring the residual $x - cb$ to sit perpendicular to $b$ divides out $b \cdot b$:[^trefethen1997]

$$
\operatorname{proj}_b(x) = \frac{x \cdot b}{b \cdot b}\,b
$$

With $b = [1, 1]$ and $x = [3, 1]$, dividing by $b \cdot b = 2$ lands on `[2, 2]` with perpendicular residual `[1, -1]`, whereas omitting the denominator overshoots to `[4, 4]`:

<!-- leetllm: test, output=show -->
```python title="projection-needs-the-direction-length.py"
import numpy as np

x = np.array([3.0, 1.0])
b = np.array([1.0, 1.0])
projection = (x @ b) / (b @ b) * b
residual = x - projection
unscaled_projection = (x @ b) * b

print("projection", projection.tolist())
print("residual", residual.tolist())
print("residual_dot_direction", float(residual @ b))
print("without_denominator", unscaled_projection.tolist())
assert np.allclose(residual @ b, 0)
assert not np.allclose((x - unscaled_projection) @ b, 0)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
projection [2.0, 2.0]
residual [1.0, -1.0]
residual_dot_direction 0.0
without_denominator [4.0, 4.0]
```
<!-- leetllm: output:end -->

## The Gram matrix reveals those directions

In higher dimensions, we cannot spot perpendicular axes by eye. The symmetric **Gram matrix** $G = A^\top A$ stores every pairwise dot product among feature columns:

$$
G = A^\top A = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}
$$

A nonzero vector $v$ satisfying $G v = \lambda v$ is an <span data-glossary="eigenvector">eigenvector</span> of $G$ with <span data-glossary="eigenvalue">eigenvalue</span> $\lambda$. For any real matrix $A$, $A^\top A$ is symmetric positive semidefinite, so every eigenvalue is real and nonnegative. Plugging a unit eigenvector into $v^\top(A^\top A v)$ shows that $\lambda$ equals the squared stretch $\lVert Av \rVert^2$:

$$
\lVert A v \rVert^2 = v^\top A^\top A v = v^\top (\lambda v) = \lambda
$$

Here $G[1, 1]^\top = 3[1, 1]^\top$ and $G[1, -1]^\top = 1[1, -1]^\top$: eigenvalues `3` and `1` are the exact squares of our measured strengths $\sqrt{3}$ and `1`.

<figure>
  <img src="illustrations/_generated/eigenvector_stretch_dark.png" alt="Equal-scale vector plots showing the Gram matrix stretching the common code-plus-prose direction by eigenvalue three while the contrast direction keeps eigenvalue one." />
  <figcaption>Both eigenvectors keep their line under G = AᵀA. The common direction stretches 3× while the contrast direction stays at length 1, matching squared singular values 3 and 1.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="check-the-gram-directions.py"
import numpy as np

A = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
G = A.T @ A
common = np.array([1.0, 1.0]) / np.sqrt(2)
contrast = np.array([1.0, -1.0]) / np.sqrt(2)

print("G", G.tolist())
print("G_common", (G @ common).round(4).tolist())
print("three_common", (3 * common).round(4).tolist())
print("G_contrast_equals_contrast", np.allclose(G @ contrast, contrast))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
G [[2.0, 1.0], [1.0, 2.0]]
G_common [2.1213, 2.1213]
three_common [2.1213, 2.1213]
G_contrast_equals_contrast True
```
<!-- leetllm: output:end -->

```checkpoint
Why do eigenvalues of `A.T @ A` become squared singular values?
---
For a unit direction `v`, `||A @ v||` measures how much `A` stretches that direction. Squaring gives `(A @ v).T @ (A @ v) = v.T @ (A.T @ A) @ v = lambda`, so the singular value is `sqrt(lambda)`.
```

## SVD names the directions and strengths

Every real matrix $A \in \mathbb{R}^{m \times n}$ factors directly into orthonormal output directions $U$, nonnegative strengths $\Sigma$, and orthonormal input directions $V^\top$:[^trefethen1997]

$$
A = U \Sigma V^\top
$$

Reduced SVD (`full_matrices=False`) uses inner width $r = \min(m, n)$ and retains zero singular values when columns are linearly dependent.[^numpySvd2026]

| Factor | Shape on $A$ | Meaning |
|---|---:|---|
| $V^\top$ | `[2, 2]` | Orthonormal feature-space directions (rows are `common` and `contrast`) |
| $\Sigma$ | `[2, 2]` | Nonnegative singular values ordered $\sigma_1 \ge \sigma_2 \ge 0$ |
| $U$ | `[3, 2]` | Orthonormal document-space coordinates ($u_i = Av_i / \sigma_i$ for $\sigma_i > 0$) |

To project new centered or uncentered feature rows $X$ onto the top $k$ feature directions, multiply by the right singular vectors `X @ Vt[:k].T` (never `U`, which indexes documents). Note that valid SVD solvers may negate a matching pair $(u_i, v_i)$ simultaneously or rotate tied singular subspaces, so always test reconstruction and singular spectra rather than fixed vector signs.

<!-- leetllm: test, output=show -->
```python title="factor-and-reconstruct-document-matrix.py"
import numpy as np

A = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
U, S, Vt = np.linalg.svd(A, full_matrices=False)
reconstructed = U @ np.diag(S) @ Vt

print("shapes", U.shape, S.shape, Vt.shape)
print("singular_values", S.round(4).tolist())
print("reconstruction_error", float(np.max(np.abs(A - reconstructed))))
print("reconstructs_A", np.allclose(A, reconstructed))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shapes (3, 2) (2,) (2, 2)
singular_values [1.7321, 1.0]
reconstruction_error 4.440892098500626e-16
reconstructs_A True
```
<!-- leetllm: output:end -->

## Rank and optimal low-rank truncation

The **rank** of a matrix is its count of nonzero singular values, measuring independent directions rather than stored columns. If a pipeline duplicates `code` into `prose` (`B = [[1, 1], [0, 0], [1, 1]]`), the singular values are `[2.0, 0.0]` and exact rank drops to `1`. On empirical matrices, `np.linalg.matrix_rank` counts singular values above a dimension-scaled numerical tolerance.[^numpyMatrixRank2026]

Returning to full-rank $A$, keeping only the top $k$ singular triplets $A_k = U_{:,:k}\Sigma_{:k,:k}V_{:,:k}^\top$ gives the best possible rank-$k$ matrix under Frobenius error $\lVert A - M \rVert_F = \sqrt{\sum_{i,j}(A_{ij} - M_{ij})^2}$ (**Eckart-Young-Mirsky theorem**), with exact error equal to the root sum of squares of discarded singular values $\sqrt{\sum_{i > k} \sigma_i^2}$.[^eckart1936]

<!-- leetllm: test, output=show -->
```python title="truncate-to-one-direction.py"
import numpy as np

A = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
U, S, Vt = np.linalg.svd(A, full_matrices=False)
rank_one = U[:, :1] @ np.diag(S[:1]) @ Vt[:1, :]

error = np.linalg.norm(A - rank_one, ord="fro")

print("rank_one")
print(rank_one.round(3))
print("frobenius_error", round(float(error), 4))
print("discarded_singular_value", round(float(S[1]), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rank_one
[[0.5 0.5]
 [0.5 0.5]
 [1.  1. ]]
frobenius_error 1.0
discarded_singular_value 1.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/singular_value_cutoff_dark.png" alt="Side-by-side matrices of document table A and rank-1 approximation A1. Kernel and essay both map to 0.50, 0.50, and a stacked bar shows 75 percent of squared energy kept and 25 percent discarded." />
  <figcaption>Rank-1 truncation keeps 75 percent of squared Frobenius energy (σ₁² = 3 out of 4), but projecting away the contrast direction collapses kernel and essay onto identical [0.50, 0.50] vectors.</figcaption>
</figure>

Notice the storage payoff too: production <span data-glossary="embedding">embedding</span> compression stores compact projected rows `A @ Vt[:k].T` alongside the thin basis `Vt[:k]`, never the dense reconstructed matrix $A_k$. And to choose a cutoff $k$, sum **squared** singular values:

$$
\text{retained energy at } k = \frac{\sigma_1^2 + \cdots + \sigma_k^2}{\sigma_1^2 + \cdots + \sigma_r^2}
$$

Always pair energy retention with downstream task metrics (such as per-query <span data-glossary="recall-at-k">Recall@k</span>): a 96%-energy projection can still wipe out a low-energy axis that separates critical query classes.

## PCA is SVD after centering each feature

Uncentered SVD measures directions from the origin $(0, 0)$. **<span data-glossary="pca">Principal component analysis</span>** (PCA) subtracts each feature column's mean first ($X_{\text{centered}} = X - \mu$) so SVD recovers the eigenvectors of the sample <span data-glossary="covariance">covariance</span> matrix inside $V^\top$.[^sklearn2026pca]

On our three documents, column means are `[2/3, 2/3]`. Centering shifts `kernel` and `essay` opposite one another across the contrast diagonal, so PCA assigns 75% of centered <span data-glossary="variance">variance</span> to `[1, -1]/sqrt(2)` instead of `[1, 1]/sqrt(2)`:

<!-- leetllm: test, output=show -->
```python title="center-before-finding-principal-directions.py"
import numpy as np

X = np.array([
    [1.0, 0.0],
    [0.0, 1.0],
    [1.0, 1.0],
])
centered = X - X.mean(axis=0)
_, S, Vt = np.linalg.svd(centered, full_matrices=False)
pc1 = Vt[0]
if pc1[0] < 0:
    pc1 = -pc1

retained = S[0] ** 2 / np.sum(S ** 2)

print("column_means", X.mean(axis=0).round(3).tolist())
print("centered_means_are_zero", np.allclose(centered.mean(axis=0), 0))
print("pc1", pc1.round(4).tolist())
print("pc1_variance_fraction", round(float(retained), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
column_means [0.667, 0.667]
centered_means_are_zero True
pc1 [0.7071, -0.7071]
pc1_variance_fraction 0.75
```
<!-- leetllm: output:end -->

Freeze training means and principal directions before applying them to validation or test splits, and never materialize $X - \mu$ on a sparse term-document matrix: subtracting nonzero column means fills every implicit zero, turning a 1%-dense matrix into a 100%-dense allocation (`TruncatedSVD` works directly on sparse matrices, or iterative solvers compute $(X - \mathbf{1}\mu^\top)v = Xv - \mathbf{1}(\mu^\top v)$ without expanding $X - \mu$).[^sklearnTruncatedSvd2026]

## Least squares projects a target onto a feature span

Given targets $y = [1, 2, 2]^\top$ outside $\text{col}(A)$, least squares minimizes $\lVert Aw - y \rVert_2^2$ by projecting $y$ orthogonally onto $\text{col}(A)$.[^trefethen1997] Enforcing $A^\top(y - Aw) = 0$ yields the normal equations $A^\top A w = A^\top y$, solving to $w = [2/3, 5/3]^\top$, predictions `[2/3, 5/3, 7/3]`, and perpendicular residual `[1/3, 1/3, -1/3]`. Calling `np.linalg.lstsq` solves this via SVD without squaring $A$:[^numpyLstsq2026]

<!-- leetllm: test, output=show -->
```python title="fit-target-by-least-squares.py"
import numpy as np

A = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
y = np.array([1.0, 2.0, 2.0])

weights, _, rank, singular_values = np.linalg.lstsq(A, y, rcond=None)
prediction = A @ weights
residual = y - prediction

print("weights", weights.round(4).tolist())
print("prediction", prediction.round(4).tolist())
print("residual", residual.round(4).tolist())
print("squared_error", round(float(np.sum(residual ** 2)), 4))
print("residual_orthogonal", bool(np.allclose(A.T @ residual, 0)))
print("rank", int(rank), "singular_values", singular_values.round(4).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
weights [0.6667, 1.6667]
prediction [0.6667, 1.6667, 2.3333]
residual [0.3333, 0.3333, -0.3333]
squared_error 0.3333
residual_orthogonal True
rank 2 singular_values [1.7321, 1.0]
```
<!-- leetllm: output:end -->

When columns are duplicated (`B = [[1, 1], [0, 0], [1, 1]]`), `[1, -1]` sits in the **nullspace** ($B[1, -1]^\top = 0$). Adding any multiple of `[1, -1]` leaves predictions identical, and `lstsq` breaks the tie by picking the minimum-norm vector `[0.75, 0.75]`.

## Condition numbers and why forming AᵀA is hazardous

When a matrix compresses one direction far more than another, inverting it divides by $\sigma_{\min}$ and amplifies noise along that weak axis. The 2-norm **condition number** measures that stretch ratio:[^numpyCond2026]

$$
\kappa_2(A) = \frac{\sigma_{\max}}{\sigma_{\min}}
$$

Forward products and cosine retrieval do not invert weak directions, whereas linear solves and whitening transforms divide by singular values: with singular values `[1.0, 0.0001]` ($\kappa_2 = 10{,}000$), a `0.0001` output perturbation doubles the solved second coordinate. Worse, explicitly forming the Gram matrix $A^\top A$ **squares** every singular value and squares the condition number:

$$
\kappa_2(A^\top A) = \kappa_2(A)^2
$$

In IEEE 754 `float64`, a full-rank matrix with middle row `[0, 1e-8]` has `1 + 1e-16 + 1 == 2.0`, turning `B.T @ B` into an exactly singular matrix that crashes `np.linalg.solve`, while direct SVD via `np.linalg.lstsq` recovers `[1.0, 1.0]` cleanly:[^trefethen1997]

<!-- leetllm: test, output=show -->
```python title="forming-the-gram-matrix-squares-conditioning.py"
import numpy as np

A = np.diag([1.0, 0.0001])
G = A.T @ A
print("cond_A", float(np.linalg.cond(A)))
print("cond_AtA", float(np.linalg.cond(G)))
print("ratio", float(np.linalg.cond(G) / np.linalg.cond(A)))

B = np.array([[1.0, 1.0], [0.0, 1e-8], [1.0, 1.0]], dtype=np.float64)
y = B @ np.array([1.0, 1.0])
gram = B.T @ B
direct_weights, _, direct_rank, _ = np.linalg.lstsq(B, y, rcond=None)

print("direct_rank", int(direct_rank))
print("direct_weights", direct_weights.round(4).tolist())
print("rounded_gram", gram.tolist())
try:
    np.linalg.solve(gram, B.T @ y)
except np.linalg.LinAlgError as error:
    print("gram_solve", type(error).__name__ + ": " + str(error))
else:
    raise AssertionError("The rounded Gram matrix should be singular")
assert direct_rank == 2
assert np.allclose(direct_weights, [1.0, 1.0], atol=1e-7, rtol=0)
assert np.array_equal(gram, np.full((2, 2), 2.0))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cond_A 10000.0
cond_AtA 100000000.0
ratio 10000.0
direct_rank 2
direct_weights [1.0, 1.0]
rounded_gram [[2.0, 2.0], [2.0, 2.0]]
gram_solve LinAlgError: Singular matrix
```
<!-- leetllm: output:end -->

```checkpoint
Why is `np.linalg.svd(A)` a better computational default than finding eigenvectors of `A.T @ A` directly?
---
Forming `A.T @ A` squares the condition number, driving tiny singular values into floating-point roundoff before solving even starts. Direct QR and SVD operate on `A` itself and preserve roughly twice as many digits on weak directions.
```

## Compressing weights with PyTorch SVD, LoRA, and retrieval checks

In deep learning, learned weight updates often concentrate inside a low-rank subspace. **Low-Rank Adaptation (<span data-glossary="lora">LoRA</span>)** freezes a pretrained layer $W_0 \in \mathbb{R}^{d_{\text{out}} \times d_{\text{in}}}$ and parameterizes updates as two thin factors $\Delta W = B A$ ($B \in \mathbb{R}^{d_{\text{out}} \times r}$, $A \in \mathbb{R}^{r \times d_{\text{in}}}$).[^hu2021] Running `torch.linalg.svd` on a structured $24 \times 24$ weight-update tensor confirms both Eckart-Young's exact tail error $\sqrt{\sum_{i>r} \sigma_i^2}$ and a $128\times$ parameter drop at full $4096 \times 4096$ transformer scale:[^pytorch2019][^eckart1936]

<!-- leetllm: test, output=show, deps=torch,numpy -->
```python title="pytorch-svd-eckart-young-and-lora.py"
import torch

torch.manual_seed(7)
grid = torch.linspace(-1.0, 1.0, 24)
dominant = torch.outer(torch.cos(3.0 * grid), torch.sin(2.0 * grid))
secondary = 0.55 * torch.outer(torch.sin(4.0 * grid), torch.cos(grid))
tertiary = 0.25 * torch.outer(grid, grid ** 2)
delta_W = dominant + secondary + tertiary + 0.02 * torch.randn(24, 24)

U, S, Vt = torch.linalg.svd(delta_W, full_matrices=False)
rank = 3
B = U[:, :rank] * S[:rank]
A_lora = Vt[:rank, :]
delta_W_hat = B @ A_lora

measured_err = torch.linalg.matrix_norm(delta_W - delta_W_hat, ord="fro")
tail_err = torch.sqrt(torch.sum(S[rank:] ** 2))
energy_kept = torch.sum(S[:rank] ** 2) / torch.sum(S ** 2)

dense_params = delta_W.numel()
lora_params = B.numel() + A_lora.numel()
print("top_5_singular_values", [round(float(x), 4) for x in S[:5]])
print("energy_kept", round(float(energy_kept), 5))
print("frobenius_err", round(float(measured_err), 6), "tail_formula", round(float(tail_err), 6))
print("params_24x24_vs_rank3", dense_params, "vs", lora_params, f"({dense_params / lora_params:.1f}x fewer)")
print("params_4096x4096_vs_rank16", 4096 * 4096, "vs", 16 * (4096 + 4096), f"({(4096 * 4096) / (16 * 8192):.0f}x fewer)")
assert torch.allclose(measured_err, tail_err, atol=1e-5)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
top_5_singular_values [13.1425, 7.7414, 1.3237, 0.1687, 0.1505]
energy_kept 0.9993
frobenius_err 0.406111 tail_formula 0.406111
params_24x24_vs_rank3 576 vs 144 (4.0x fewer)
params_4096x4096_vs_rank16 16777216 vs 131072 (128x fewer)
```
<!-- leetllm: output:end -->

Similarly, projecting document embeddings onto `Vt[:2].T` and checking <span data-glossary="cosine-similarity">cosine similarity</span> (which divides each <span data-glossary="dot-product">dot product</span> by both vector norms, guarding against zero vectors) verifies whether compression preserves retrieval ordering before measuring Recall@k at scale:

<!-- leetllm: test, output=show -->
```python title="compress-retrieval-and-validate-ranking.py"
import numpy as np

docs = np.array([
    [3.0, 0.0, 1.0],  # kernel guide
    [0.0, 3.0, 1.0],  # design essay
    [2.0, 1.0, 0.5],  # API walkthrough
    [1.0, 2.0, 1.5],  # numerical tutorial
])
query = np.array([2.5, 0.5, 1.0])


def cosine_scores(matrix: np.ndarray, vector: np.ndarray) -> np.ndarray:
    row_norms = np.linalg.norm(matrix, axis=1)
    vector_norm = np.linalg.norm(vector)
    if np.any(row_norms == 0) or vector_norm == 0:
        raise ValueError("cosine similarity requires non-zero vectors")
    return (matrix @ vector) / (row_norms * vector_norm)


_, singular_values, Vt = np.linalg.svd(docs, full_matrices=False)
basis = Vt[:2].T
retained_energy = np.sum(singular_values[:2] ** 2) / np.sum(singular_values ** 2)

original_scores = cosine_scores(docs, query)
compressed_scores = cosine_scores(docs @ basis, query @ basis)
original_order = np.argsort(original_scores)[::-1]
compressed_order = np.argsort(compressed_scores)[::-1]

print("singular_values", singular_values.round(4).tolist())
print("retained_energy", round(float(retained_energy), 4))
print("original_order", original_order.tolist())
print("compressed_order", compressed_order.tolist())
print("top_doc_preserved", bool(original_order[0] == compressed_order[0]))
print("max_score_change", round(float(np.max(np.abs(original_scores - compressed_scores))), 4))

try:
    cosine_scores(docs, np.zeros(3))
except ValueError as error:
    print("zero_vector_guard", str(error))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
singular_values [4.7011, 3.1677, 0.6044]
retained_energy 0.9888
original_order [0, 2, 3, 1]
compressed_order [0, 2, 3, 1]
top_doc_preserved True
max_score_change 0.0221
zero_vector_guard cosine similarity requires non-zero vectors
```
<!-- leetllm: output:end -->

| ML system component | Linear algebra mechanism | What still needs measurement |
|---|---|---|
| Latent semantic analysis | Truncated SVD maps sparse counts into compact directions[^deerwester1990] | Ranking metrics on held-out queries |
| Embedding compression | Centered PCA or learned projection drops low-variance axes | Recall@k, memory, and latency |
| Linear fitting | Least squares projects targets onto feature column space | Held-out error and conditioning |
| Low-rank adaptation (<span data-glossary="lora">LoRA</span>) | Adapter weights factorize updates into $BA$ of rank $r$[^hu2021] | Fine-tuned benchmark accuracy |
| Optimization geometry | Disparate singular values carve narrow loss valleys | Step-size stability and training loss |

```mastery-quiz
[
  {
    "question": "For a real 3 × 3 matrix A, the eigenvalues of AᵀA are 25, 4, and 0. Which singular values does the reduced SVD return, and what is the exact rank of A?",
    "options": [
      "[5, 2, 0] with rank 2",
      "[25, 4, 0] with rank 2",
      "[5, 2, 0] with rank 3",
      "[25, 4, 0] with rank 3"
    ],
    "answer": "[5, 2, 0] with rank 2",
    "explanation": "The reduced SVD of a 3 × 3 matrix returns three singular values equal to the square roots of the Gram eigenvalues: 5, 2, and 0. Exactly two singular values are strictly positive, so A has exact rank 2."
  },
  {
    "question": "A centered document-feature matrix `Xc` has shape `[5000, 384]`, and `np.linalg.svd(Xc, full_matrices=False)` returns `U, S, Vt` with `Xc = U @ diag(S) @ Vt`. To build a reusable 64-dimensional projection for new centered document rows, which matrix and expression are correct?",
    "options": [
      "Use `Xc @ U[:, :64]`, because columns of `U` store the 64 directions in feature space.",
      "Use `Xc @ Vt[:64].T`, because rows of `Vt` provide 64 orthonormal directions in feature space.",
      "Use `S[:64]` directly as a diagonal projection matrix and discard `U` and `Vt`.",
      "Either `U[:, :64]` or `Vt[:64].T` works identically after column-centering."
    ],
    "answer": "Use `Xc @ Vt[:64].T`, because rows of `Vt` provide 64 orthonormal directions in feature space.",
    "explanation": "In `Xc = U @ diag(S) @ Vt`, `U` indexes rows (5,000 documents) while `Vt` indexes features (384 dimensions). Multiplying centered document rows by `Vt[:64].T` projects every 384-dimensional vector onto the top 64 right-singular directions."
  },
  {
    "question": "A 4 × 3 matrix has singular values [5, 0, 0]. Which interpretation follows?",
    "options": [
      "Rank 3, because the three stored feature columns set the number of independent directions.",
      "Rank 2, because zero singular values are dropped only after centering.",
      "Rank 1, because only one independent direction survives across the three columns.",
      "Rank 4, because four rows can span up to four orthogonal directions."
    ],
    "answer": "Rank 1, because only one independent direction survives across the three columns.",
    "explanation": "Matrix rank equals the number of nonzero singular values. Row and column counts bound the rank from above (at most min(4, 3) = 3), while the singular spectrum shows that two columns lie in the span of the first."
  },
  {
    "question": "A matrix has singular values [5, 3, 1]. What is the minimum Frobenius error of a rank-1 approximation?",
    "options": [
      "sqrt(26), combining the kept direction and the weakest discarded strength.",
      "sqrt(10), from the square root of the sum of squares of the two discarded singular values.",
      "4, from adding 3 and 1 without squaring.",
      "5, equal to the top retained singular value."
    ],
    "answer": "sqrt(10), from the square root of the sum of squares of the two discarded singular values.",
    "explanation": "By the Eckart-Young theorem, the optimal rank-1 Frobenius error equals sqrt(σ₂² + σ₃²) = sqrt(3² + 1²) = sqrt(10)."
  },
  {
    "question": "For A = [[1, 0], [0, 1], [1, 1]] and target y = [2, 1, 2], which least-squares solution satisfies the orthogonal projection condition?",
    "options": [
      "Weights [5/3, 2/3]; residual [1/3, 1/3, -1/3] is perpendicular to both columns of A.",
      "Weights [2, 1]; residual [0, 0, -1] is perpendicular to both feature columns.",
      "Weights [4, 3]; residual [-2, -2, -5] comes directly from Aᵀy.",
      "Weights [2/3, 1/3]; residual [4/3, 2/3, 1] scales the target by row count."
    ],
    "answer": "Weights [5/3, 2/3]; residual [1/3, 1/3, -1/3] is perpendicular to both columns of A.",
    "explanation": "Aᵀy = [4, 3], and solving AᵀA w = [[2, 1], [1, 2]]w = [4, 3] gives w = [5/3, 2/3]. The prediction is [5/3, 2/3, 7/3] and residual [1/3, 1/3, -1/3], whose dot product with each column of A equals zero."
  },
  {
    "question": "An embedding table has a large constant offset shared across every row, and you want PCA directions describing how documents differ from one another rather than the shared baseline. Which pipeline is correct?",
    "options": [
      "Run SVD on the uncentered matrix so the first direction captures the common offset as variance.",
      "Subtract each feature column's mean first, run SVD, and take right-singular rows of Vt as principal directions.",
      "Subtract each document row's mean so every row averages to zero, then take feature directions from U.",
      "Divide each feature by its maximum entry without centering, since variance is shift-invariant without subtraction."
    ],
    "answer": "Subtract each feature column's mean first, run SVD, and take right-singular rows of Vt as principal directions.",
    "explanation": "PCA finds directions of maximum variance around the feature mean, so you center columns first and read principal feature directions from the right singular vectors in V."
  },
  {
    "question": "For singular values [8, 4, 2], what smallest rank k retains at least 90% of squared-singular-value energy?",
    "options": [
      "k = 1, retaining 64/84 of squared energy.",
      "k = 2, retaining 80/84 of squared energy.",
      "k = 3, because clearing 90% requires the full spectrum.",
      "k = 2, using the raw sum (8 + 4) / (8 + 4 + 2) = 12/14."
    ],
    "answer": "k = 2, retaining 80/84 of squared energy.",
    "explanation": "Total squared energy is 8² + 4² + 2² = 64 + 16 + 4 = 84. One component keeps 64/84 ≈ 0.762, whereas two components keep 80/84 ≈ 0.952, clearing 90%. Energy uses squared singular values, not raw ones."
  },
  {
    "question": "Two held-out queries have 4 and 6 relevant documents, respectively, and each compressed retriever returns 10 candidates per query. Projection A keeps 96% of matrix energy and recovers 0 relevant hits for query 1 and 6 for query 2. Projection B keeps 68% of matrix energy and recovers 4 and 3 hits. Which projection achieves a mean Recall@10 of at least 70%, giving each query equal weight?",
    "options": [
      "A only (A 96%, B 68%).",
      "B only (A 50%, B 75%).",
      "B only (A 60%, B 70%).",
      "Neither (A 30%, B 35%)."
    ],
    "answer": "B only (A 50%, B 75%).",
    "explanation": "Mean Recall@10 averages per-query recall: for A, (0/4 + 6/6)/2 = 50%; for B, (4/4 + 3/6)/2 = 75%, clearing 70%. Pooling hits divides total hits by 10 (60% and 70%), while dividing by 20 returned slots computes precision (30% and 35%). Matrix energy tracks reconstruction fidelity, whereas retrieval quality depends on query relevance."
  },
  {
    "question": "A whitening transform divides projected coordinates by singular values [12, 3, 0.0003]. What condition number and numerical hazard apply?",
    "options": [
      "Condition number 40,000; dividing by 0.0003 amplifies small perturbations along the weakest direction.",
      "Condition number 4; the smallest singular value only shrinks storage without affecting inversion.",
      "Condition number 0.000025; division damps perturbations along weak directions.",
      "Condition number 40,000; merely storing the unscaled projection vectors already applies that amplification."
    ],
    "answer": "Condition number 40,000; dividing by 0.0003 amplifies small perturbations along the weakest direction.",
    "explanation": "The 2-norm condition number is σ_max / σ_min = 12 / 0.0003 = 40,000. Any inverse-like step or whitening division scales residuals along the weakest axis by 1 / 0.0003, amplifying noise, whereas forward storage or dot products do not divide by singular values."
  },
  {
    "question": "A full-column-rank matrix A has 2-norm condition number 3,000. If an implementation forms AᵀA explicitly for a normal-equations solve, what is κ₂(AᵀA) and how does numerical sensitivity change?",
    "options": [
      "About 55, lowering sensitivity to roundoff.",
      "9,000,000, raising sensitivity to roundoff.",
      "3,000, keeping sensitivity unchanged.",
      "6,000, doubling sensitivity to roundoff."
    ],
    "answer": "9,000,000, raising sensitivity to roundoff.",
    "explanation": "Every singular value of A gets squared in AᵀA, so κ₂(AᵀA) = κ₂(A)² = 3,000² = 9,000,000. Forming the Gram matrix can square roundoff sensitivity until weak directions disappear, which direct QR or SVD solves avoid."
  }
]
```

> **Next:** Continue to [Gradients and Backprop](/learn/calculus-gradients-backpropagation-optimization).
