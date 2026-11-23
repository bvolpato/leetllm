---
{
  "id": "linear-algebra-machine-learning-deeper",
  "title": "Linear Algebra for ML",
  "slug": "linear-algebra-machine-learning-deeper",
  "section": "Math & Statistics",
  "category": "Model Architecture",
  "difficulty": "Easy",
  "order": 3,
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
    "vectors-matrices-tensors"
  ]
}
---
<!-- leetllm: edition:reference:start -->

Modern embedding tables and attention layers store millions of numbers inside dense matrices, yet most rows concentrate their energy along a small family of shared directions. Compressing those representations saves memory and cuts matrix-multiply cost, provided you understand which directions carry the signal and what structure disappears when you truncate a weaker direction. Take three short technical documents represented by two binary indicators recording whether each document contains `code` and whether it contains `prose`. Row `kernel` marks code only, row `essay` marks prose only, and row `note` mixes both. Intuitively, the shared code-plus-prose axis collects signal from every row, while the contrast axis between code-only and prose-only separates `kernel` from `essay`. Discard that weaker contrast axis at rank one and `kernel` collapses onto the exact same coordinates as `essay`, leaving a downstream search index unable to tell them apart.

<span data-glossary="svd">Singular value decomposition</span> (SVD) turns that geometric intuition into exact accounting. It decomposes any matrix into perpendicular input directions paired with non-negative output strengths, while showing how every row participates in each direction. On an uncentered table, those strengths measure alignment and magnitude relative to zero rather than variation around the average row. Three rows and two features are enough to work every step of SVD, Gram eigendecomposition, least squares, and conditioning by hand before scaling the same tools up to structured <span data-glossary="pytorch">PyTorch</span> weight matrices. Building on the [vectors, matrices, and tensors lesson](/learn/vectors-matrices-tensors), we now turn dot products and matrix multiplication into factorizations and numerical diagnostics.

## A matrix can hide repeated directions

Arrange our three document rows into a $3 \times 2$ <span data-glossary="matrix">matrix</span> $A$, where column 0 tracks `code` and column 1 tracks `prose`. Even this tiny matrix exposes an essential geometric distinction between directions that align with all rows together and directions that separate rows from one another:

$$
A =
\begin{bmatrix}
1 & 0 \\
0 & 1 \\
1 & 1
\end{bmatrix}
$$

Compare the diagonal patterns `[1, 1]` and `[1, -1]`. Row `note = [1, 1]` reinforces `[1, 1]` with dot product `1 + 1 = 2` and cancels completely along `[1, -1]` because `1 - 1 = 0`. Both vectors have Euclidean length $\sqrt{1^2 + 1^2} = \sqrt{2}$, so dividing by $\sqrt{2}$ normalizes them into **unit vectors** of length 1. Working with unit directions guarantees that any difference in output norm reflects the geometry of $A$ rather than arbitrary scaling of our probe vectors:

$$
v_{\text{common}} = \frac{1}{\sqrt{2}}
\begin{bmatrix}1 \\ 1\end{bmatrix},
\qquad
v_{\text{contrast}} = \frac{1}{\sqrt{2}}
\begin{bmatrix}1 \\ -1\end{bmatrix}
$$

Multiplying $A$ on the right by a unit direction returns one scalar score per document. For $v_{\text{common}}$, those scores are $[1/\sqrt{2}, 1/\sqrt{2}, 2/\sqrt{2}]$, whose squared entries sum to $1/2 + 1/2 + 2 = 3$. For $v_{\text{contrast}}$, the scores are $[1/\sqrt{2}, -1/\sqrt{2}, 0]$, whose squared entries sum to $1$. Taking square roots gives total output strengths $\sqrt{3}$ for the common pattern and $1$ for the contrast pattern. Running those two matrix-vector products in NumPy confirms both score vectors and magnitudes:

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

Notice what those numbers mean geometrically. Both feature-space directions enter the transformation with identical unit length `1.0`, yet multiplying by $A$ stretches $v_{\text{common}}$ to length $\sqrt{3} \approx 1.7321$ while preserving $v_{\text{contrast}}$ at length `1.0`. Nothing has been compressed or approximated yet; we have simply identified which mixture of features the document rows reinforce most strongly.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Three document rows plotted in code and prose coordinates beside perpendicular unit arrows for common and contrast directions. Separate bars show the output lengths square root of 3 versus 1." />
  <figcaption>Both feature-space arrows have unit length. After multiplication by A, the common direction produces a three-document score vector of length √3, compared with 1 for contrast.</figcaption>
</figure>

## Coordinates come from an orthonormal basis

The common and contrast vectors are **linear combinations** of the original `code` and `prose` axes, formed by scaling each axis and adding the results. Every vector reachable through linear combinations of a set of vectors forms its **span**. Two properties make $\{v_{\text{common}}, v_{\text{contrast}}\}$ unusually convenient as a coordinate frame. First, they are **orthogonal** because their dot product $(1 - 1)/2 = 0$ places them at an exact right angle. Second, neither can be written as a multiple of the other, making them **linearly independent** and giving them full coverage of the plane as an **orthonormal basis**.

Take a longer technical post with raw term counts $x = [3, 1]$ for `code` and `prose`. In the orthonormal basis, changing coordinates requires nothing more than taking dot products: $c_{\text{common}} = x \cdot v_{\text{common}} = (3 + 1)/\sqrt{2} = 2\sqrt{2}$ and $c_{\text{contrast}} = x \cdot v_{\text{contrast}} = (3 - 1)/\sqrt{2} = \sqrt{2}$. Each coefficient measures an **orthogonal projection** along one axis, and scaling each unit vector by its coefficient reconstructs $x = (x \cdot v_{\text{common}})v_{\text{common}} + (x \cdot v_{\text{contrast}})v_{\text{contrast}}$ cleanly without solving any system of equations:

$$
c_{\text{common}} = x \cdot v_{\text{common}} = 2\sqrt{2},
\qquad
c_{\text{contrast}} = x \cdot v_{\text{contrast}} = \sqrt{2}
$$

| Component | Coefficient × unit direction | Contribution |
|---|---:|---:|
| common | $2\sqrt{2} \cdot v_{\text{common}}$ | `[2, 2]` |
| contrast | $\sqrt{2} \cdot v_{\text{contrast}}$ | `[1, -1]` |
| sum |  | `[3, 1]` |

Whereas `A @ v` above scored all rows along one direction, this coordinate sum rebuilds a single document from its orthogonal basis pieces. Low-rank truncation works by retaining the leading terms in this sum and zeroing out the tail. When a chosen direction $b$ is not normalized, however, taking only $(x \cdot b)\, b$ scales the answer twice by the length of $b$. Requiring the residual $x - c b$ to sit perpendicular to $b$ gives $(x - cb) \cdot b = 0$, which divides out $b \cdot b$:[^trefethen1997]

$$
\operatorname{proj}_b(x) = \frac{x \cdot b}{b \cdot b}\,b
$$

With $b = [1, 1]$ and $x = [3, 1]$, computing $(x \cdot b)/(b \cdot b) = 4/2 = 2$ recovers the exact nearest point `[2, 2]`, while omitting the denominator overshoots to `[4, 4]`. When $b$ already has unit length, $b \cdot b = 1$ and the denominator vanishes automatically. Checking orthogonality `residual @ b == 0` verifies that sliding further along `[1, 1]` cannot reduce the approximation error `[1, -1]`:

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

We chose $v_{\text{common}}$ and $v_{\text{contrast}}$ by inspection because $A$ had only two columns. For higher-dimensional matrices, we let $A$ reveal its own perpendicular feature axes through its Gram matrix and singular value decomposition.

## The Gram matrix reveals those directions

Multiplying $A$ on the left by its transpose builds the **Gram matrix** $G = A^T A$, whose entries record every pairwise dot product among feature columns. Entry $(0, 0)$ is the `code` column dotted with itself ($1^2 + 0^2 + 1^2 = 2$), while off-diagonal entries record overlap between `code` and `prose` ($1\cdot 0 + 0\cdot 1 + 1\cdot 1 = 1$). Because both rows and columns index features, $G$ is symmetric with shape `[2, 2]`:

$$
G = A^T A =
\begin{bmatrix}
2 & 1 \\
1 & 2
\end{bmatrix}
$$

A nonzero vector $v$ satisfying $G v = \lambda v$ is an <span data-glossary="eigenvector">eigenvector</span> of $G$, meaning $G$ stretches or shrinks $v$ along the exact same line through the origin by its <span data-glossary="eigenvalue">eigenvalue</span> $\lambda$. For any real matrix $A$, the Gram matrix $A^T A$ is positive semidefinite, so every eigenvalue is real and nonnegative. More importantly, plugging a unit eigenvector $v$ into $v^T (A^T A v)$ shows why its eigenvalue $\lambda$ equals the squared stretch $\lVert A v \rVert^2$ that $A$ applies in direction $v$:

$$
\lVert A v \rVert^2 = v^T A^T A v = v^T (\lambda v) = \lambda
$$

On our document matrix, multiplying $G$ by `[1, 1]` returns `3 * [1, 1]` and multiplying by `[1, -1]` returns `1 * [1, -1]`. Those eigenvalues `3` and `1` are precisely the squares of our measured strengths $\sqrt{3}$ and `1`, confirming that $v_{\text{common}}$ and $v_{\text{contrast}}$ are indeed the orthogonal eigenvectors of $G$:

$$
G
\begin{bmatrix}1 \\ 1\end{bmatrix}
=
3
\begin{bmatrix}1 \\ 1\end{bmatrix},
\qquad
G
\begin{bmatrix}1 \\ -1\end{bmatrix}
=
1
\begin{bmatrix}1 \\ -1\end{bmatrix}
$$

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
For a unit direction `v`, `||A @ v||` measures how much `A` stretches that direction. Squaring that length gives `(A @ v).T @ (A @ v) = v.T @ (A.T @ A) @ v`. When `v` is an eigenvector with eigenvalue `lambda`, that squared length equals `lambda`, so the singular value is `sqrt(lambda)`.
```

## SVD names the directions and strengths

Every real matrix $A \in \mathbb{R}^{m \times n}$ admits a singular value decomposition factoring it directly into orthonormal input directions, non-negative scale factors, and orthonormal output directions:[^trefethen1997]

$$
A = U \Sigma V^T
$$

Our $3 \times 2$ document table has reduced SVD width $\min(3, 2) = 2$, returning orthonormal columns in $U$ and orthonormal rows in $V^T$. Reduced SVD preserves zero singular values whenever columns are linearly dependent; it transforms the coordinate system cleanly without dropping any structure yet.[^numpySvd2026]

| Factor | Shape | Meaning here |
|---|---:|---|
| $V$ | `[2, 2]` | Orthonormal directions in feature space (`common` and `contrast`) |
| $\Sigma$ | `[2, 2]` | Non-negative strengths ordered largest first ($\sigma_1 \ge \sigma_2 \ge 0$) |
| $U$ | `[3, 2]` | Orthonormal coordinates showing how each document participates in each direction |

From our Gram matrix eigenvalues, the singular values are $\sigma_1 = \sqrt{3}$ and $\sigma_2 = 1$, paired with right singular vectors $v_1 = v_{\text{common}}$ and $v_2 = v_{\text{contrast}}$. Each positive singular value determines the matching left singular vector via $u_i = A v_i / \sigma_i$, producing $u_1 = [1, 1, 2]^T / \sqrt{6}$ and $u_2 = [1, -1, 0]^T / \sqrt{2}$. Columns of `U` stay unit length while `U * S` holds the scaled document scores, and multiplying $U \operatorname{diag}(S) V^T$ reconstructs $A$ down to floating-point roundoff:

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

Keep one sign convention in mind when inspecting solver output. Valid SVD routines can negate a matching pair $u_i$ and $v_i$ simultaneously without changing $u_i \sigma_i v_i^T$, and repeated singular values permit any orthogonal rotation within their tied subspace. Always test reconstruction fidelity and singular value spectra rather than expecting fixed signs on individual vectors.

## Rank counts independent patterns

The **rank** of a matrix is the number of nonzero singular values, counting how many genuinely independent directions the matrix spans regardless of how many columns occupy storage. Suppose a faulty ingestion pipeline duplicates the `code` feature into the `prose` column instead of extracting separate signals:

$$
B =
\begin{bmatrix}
1 & 1 \\
0 & 0 \\
1 & 1
\end{bmatrix}
$$

Even though $B$ has two columns, the second column carries zero new information beyond the first, leaving only one nonzero singular value (`2.0`) and exact rank `1`. Inspecting the singular spectrum exposes redundant features immediately before they inflate model parameters or create singular normal equations:

<!-- leetllm: test, output=show -->
```python title="rank-detects-a-duplicate-feature.py"
import numpy as np

B = np.array([
    [1.0, 1.0],
    [0.0, 0.0],
    [1.0, 1.0],
])
singular_values = np.linalg.svd(B, compute_uv=False)

print("shape", B.shape)
print("singular_values", singular_values.round(6).tolist())
print("rank", int(np.linalg.matrix_rank(B)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shape (3, 2)
singular_values [2.0, 0.0]
rank 1
```
<!-- leetllm: output:end -->

Rank equals both the dimension of the column space and the dimension of the row space. Because floating-point rounding rarely yields an exact `0.0` on larger empirical tables, `np.linalg.matrix_rank` counts singular values above a dimension-scaled numerical tolerance; when measurements include sensor or tokenization noise, choosing an explicit noise floor matters just as much as numerical epsilon.[^numpyMatrixRank2026]

## Truncation trades detail for a smaller matrix

Returning to full-rank $A$, discarding the weaker contrast singular direction leaves the rank-1 matrix $A_1 = u_1 \sigma_1 v_1^T$. By the Eckart-Young-Mirsky theorem, keeping the leading $k$ singular triplets $A_k = U_{:,:k} \Sigma_{:k,:k} V_{:,:k}^T$ minimizes the Frobenius reconstruction error $\lVert A - M \rVert_F = \sqrt{\sum_{i,j} (A_{ij} - M_{ij})^2}$ over every matrix $M$ of rank at most $k$.[^eckart1936] That optimality theorem guarantees minimum entry-wise energy loss on $A$, though downstream classification or retrieval accuracy still hinges on whether the dropped directions carried task-critical distinctions:

$$
A_1 = u_1 \sigma_1 v_1^T
$$

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

Look closely at both the error accounting and the geometry of $A_1$. Four entries differ from $A$ by $\pm 0.5$, yielding Frobenius error $\sqrt{4 \cdot 0.5^2} = 1.0 = \sigma_2$, exactly the discarded singular value. Geometrically, both `kernel` (`[1, 0]`) and `essay` (`[0, 1]`) collapse onto identical coordinates `[0.50, 0.50]` because their only distinction lay along the discarded contrast axis. Notice also how storage savings actually happen: in production, you never store the reconstructed dense $3 \times 2$ table $A_1$, because storing compressed 1D coordinates `A @ Vt[:1].T` alongside the shared basis row `Vt[:1]` is what shrinks <span data-glossary="embedding">embedding</span> memory.

<figure>
  <img src="illustrations/_generated/singular_value_cutoff_dark.png" alt="Side-by-side matrices of document table A and rank-1 approximation A1. Kernel and essay both map to 0.50, 0.50, and a stacked bar shows 75 percent of squared energy kept and 25 percent discarded." />
  <figcaption>Rank-1 truncation keeps 75 percent of squared Frobenius energy (σ₁² = 3 out of 4), but projecting away the contrast direction collapses kernel and essay onto identical [0.50, 0.50] vectors.</figcaption>
</figure>

## PCA is SVD after centering each feature

Uncentered SVD measures directions relative to the origin $(0, 0)$. **<span data-glossary="pca">Principal component analysis</span>** (PCA) shifts the reference point to the dataset mean and asks along which axes rows spread farthest from the average document. Subtracting each feature column's mean produces the centered matrix $X_{\text{centered}} = X - \mu$, whose columns all average to zero:

$$
X_{\text{centered}} = X - \mu
$$

For our three documents, both columns average to $2/3$, shifting `kernel` to `[1/3, -2/3]`, `essay` to `[-2/3, 1/3]`, and `note` to `[1/3, 1/3]`. Running SVD on $X_{\text{centered}}$ finds the eigenvectors of the sample <span data-glossary="covariance">covariance</span> matrix $X_{\text{centered}}^T X_{\text{centered}} / (n - 1)$ inside $V^T$. Because `kernel` and `essay` sit farthest apart across the contrast diagonal once centered around `[2/3, 2/3]`, PCA assigns $75\%$ of centered <span data-glossary="variance">variance</span> to `[1, -1]/sqrt(2)` instead of `[1, 1]/sqrt(2)`.[^sklearn2026pca]

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

Keep two engineering habits straight whenever applying PCA to model features. Because PCA responds to raw coordinate magnitude, features measured on mismatched units (such as character length versus log-perplexity) should be standardized deliberately before fitting. Always freeze the training column means and principal components from the training split and apply them unchanged to validation and test inputs rather than refitting on evaluation batches.

## Avoid materializing a centered sparse matrix

Materializing $X - \mu$ on a sparse term-document matrix fills every implicit zero entry with $-\mu_j$, turning sparse storage into a dense allocation. A $100{,}000 \times 10{,}000$ sparse vocabulary matrix at $1\%$ density contains roughly $10$ million nonzero entries, whereas converting it to dense `float32` allocates $4\text{ GB}$ (`8 GB` in `float64`) before factoring a single vector. When uncentered latent semantic directions suffice, `TruncatedSVD` works directly on sparse counts or TF-IDF weights without subtracting the mean.[^sklearnTruncatedSvd2026] When centered variance is required, sparse solvers compute $(X - \mathbf{1}\mu^T)v = Xv - \mathbf{1}(\mu^T v)$ on the fly without expanding $X - \mu$ in RAM, as demonstrated by comparing explicit nonzero entries before and after centering even a small sparse table:[^sklearn2026pca]

<!-- leetllm: test, output=show -->
```python title="centering-fills-in-the-zeros.py"
import numpy as np

rng = np.random.default_rng(42)
shape = (1000, 100)  # 100,000 possible entries
X = (rng.random(shape) < 0.01).astype(float)
centered = X - X.mean(axis=0)

print("explicit_values_before", int(np.count_nonzero(X)))
print("explicit_values_after", int(np.count_nonzero(centered)))
print("column_means_all_nonzero", bool(np.all(X.mean(axis=0) != 0)))

assert np.count_nonzero(X) < 1500
assert np.count_nonzero(centered) == 100000
```

<!-- leetllm: output:start -->
```text title="Output" output compact
explicit_values_before 1047
explicit_values_after 100000
column_means_all_nonzero True
```
<!-- leetllm: output:end -->

## Least squares projects a target onto a feature span

Orthogonal projection also underpins linear regression. Suppose our three documents carry continuous quality scores $y = [1, 2, 2]^T$. Matching the first two rows forces weights $w_1 = 1, w_2 = 2$, which predicts `3` rather than `2` on `note = [1, 1]`. Because $y$ lies outside the column span of $A$, least squares selects weights $w$ minimizing the squared residual distance $\lVert A w - y \rVert_2^2$:[^trefethen1997]

$$
\underset{w}{\operatorname{argmin}}\;\lVert Aw - y \rVert_2^2
$$

Geometrically, $A w$ is the closest point to $y$ inside the span of $A$'s columns, which requires the residual $y - A w$ to be perpendicular to every column of $A$. Enforcing $A^T (y - A w) = 0$ yields the normal equations $A^T A w = A^T y$, solving cleanly to $w = [2/3, 5/3]^T$, prediction $A w = [2/3, 5/3, 7/3]^T$, and orthogonal residual $y - A w = [1/3, 1/3, -1/3]^T$:

$$
\begin{bmatrix}2 & 1 \\ 1 & 2\end{bmatrix} w =
\begin{bmatrix}3 \\ 4\end{bmatrix}
\implies
w = \begin{bmatrix}2/3 \\ 5/3\end{bmatrix}
$$

Calling `np.linalg.lstsq` computes this SVD-backed fit without explicitly squaring the feature matrix into $A^T A$:[^numpyLstsq2026]

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

Replacing $A$ with the rank-1 matrix $B$ reveals what happens when features are linearly dependent. Any vector proportional to `[1, -1]` sits inside $B$'s **nullspace** because $B [1, -1]^T = [0, 0, 0]^T$, so adding any multiple of `[1, -1]` to $w$ produces the exact same prediction `[1.5, 0, 1.5]`. While the projected prediction remains unique, infinitely many weight vectors achieve it, and `lstsq` breaks the tie by picking the **minimum-norm** vector `[0.75, 0.75]`. Whenever columns are collinear, their sum is identifiable while individual coefficients are not.[^numpyLstsq2026]

<!-- leetllm: test, output=show -->
```python title="duplicate-features-hide-different-weights.py"
import numpy as np

B = np.array([[1.0, 1.0], [0.0, 0.0], [1.0, 1.0]])
y = np.array([1.0, 2.0, 2.0])
weights, _, rank, _ = np.linalg.lstsq(B, y, rcond=None)
alternative = weights + 2.0 * np.array([1.0, -1.0])

print("rank", int(rank))
print("minimum_norm_weights", weights.round(4).tolist())
print("alternative_weights", alternative.round(4).tolist())
print("prediction", (B @ weights).round(4).tolist())
print("same_predictions", bool(np.allclose(B @ weights, B @ alternative)))
print("minimum_norm_is_smaller", bool(np.linalg.norm(weights) < np.linalg.norm(alternative)))
assert np.allclose(B @ np.array([1.0, -1.0]), 0)
assert np.allclose(B @ weights, B @ alternative)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rank 1
minimum_norm_weights [0.75, 0.75]
alternative_weights [2.75, -1.25]
prediction [1.5, 0.0, 1.5]
same_predictions True
minimum_norm_is_smaller True
```
<!-- leetllm: output:end -->

## Condition number warns about solving through weak directions

When a matrix stretches one direction far more strongly than another, inverting that map divides along the compressed axis and magnifies output perturbations. Consider $\operatorname{diag}(1, 0.0001)$ acting on `[1, 1]` to produce `[1, 0.0001]`. Reversing the map divides the second component by `0.0001`, turning a `0.0001` measurement error in the second coordinate into a full `1.0` shift in the solved input. The 2-norm **condition number** measures this worst-case stretch imbalance as the ratio between largest and smallest singular values (taking $\infty$ when $\sigma_{\min} = 0$):[^numpyCond2026]

$$
\kappa_2(A) = \frac{\sigma_{\max}}{\sigma_{\min}}
$$

A condition number near `1` means every direction has comparable scale, not that the matrix resembles the identity. Large condition numbers signal sensitivity in linear solves, matrix inversion, and whitening transforms that divide projected coordinates by singular values, whereas forward matrix products and cosine retrieval stay numerically stable because they never invert weak directions.

<!-- leetllm: test, output=show -->
```python title="tiny-noise-becomes-large-after-a-solve.py"
import numpy as np

A = np.diag([1.0, 0.0001])
x_true = np.array([1.0, 1.0])
y = A @ x_true
y_with_noise = y + np.array([0.0, 0.0001])

x_clean = np.linalg.solve(A, y)
x_noisy = np.linalg.solve(A, y_with_noise)

print("condition_number", float(np.linalg.cond(A)))
print("clean_solution", x_clean.tolist())
print("noisy_solution", x_noisy.tolist())
print("small_output_noise_doubled_second_coordinate", bool(x_noisy[1] == 2.0))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
condition_number 10000.0
clean_solution [1.0, 1.0]
noisy_solution [1.0, 2.0]
small_output_noise_doubled_second_coordinate True
```
<!-- leetllm: output:end -->

```checkpoint
A matrix has singular values `1` and `0.0001`. Why can a solve be sensitive even when the output perturbation is small?
---
Its condition number is `10,000`. Reversing the weak direction divides by `0.0001`, multiplying any perturbation along that direction by ten thousand.
```

## Forming AᵀA can square the condition number

Although $G = A^T A$ made hand eigenvectors simple, explicitly forming $A^T A$ in floating-point code squares every singular value and squares the condition number:

$$
\kappa_2(A^T A) = \kappa_2(A)^2
$$

A matrix with $\kappa_2(A) = 10{,}000$ produces $\kappa_2(A^T A) = 10^8$, erasing weak directions into floating-point roundoff before solving even starts. Changing the middle row of $B$ from `[0, 0]` to `[0, 1e-8]` gives $B$ full rank 2, yet in IEEE 754 `float64` (epsilon $\approx 2.2 \times 10^{-16}$), `1^2 + (1e-8)^2 + 1^2` rounds to `2.0`. Thus forming `B.T @ B` collapses into an exactly singular `[[2, 2], [2, 2]]` matrix that crashes `np.linalg.solve`, while direct QR/SVD via `np.linalg.lstsq` recovers `[1.0, 1.0]` cleanly.[^trefethen1997]

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
Forming `A.T @ A` squares the condition number, squaring tiny singular values into machine roundoff before the solver starts. Direct QR and SVD routines operate on `A` itself and preserve roughly twice as many digits of precision on weak directions.
```

## Choosing a cutoff uses squared singular values

Cumulative squared singular values measure how much total Frobenius energy (or centered variance) the leading $k$ components retain across the spectrum:

$$
\text{retained ratio at } k =
\frac{\sigma_1^2 + \cdots + \sigma_k^2}
{\sigma_1^2 + \cdots + \sigma_r^2}
$$

Given singular values `[12.4, 8.7, 3.1, 0.9, 0.3]`, summing their squares shows that just two directions (`12.4² + 8.7²`) retain `95.62%` of total matrix energy while dropping the three weakest directions. Always treat energy retention as a geometric reconstruction metric and pair any spectral cutoff with held-out task evaluation on retrieval or downstream accuracy:

<!-- leetllm: test, output=show -->
```python title="choose-smallest-cutoff-that-retains-energy.py"
import numpy as np

singular_values = np.array([12.4, 8.7, 3.1, 0.9, 0.3])
fractions = np.cumsum(singular_values ** 2) / np.sum(singular_values ** 2)
target = 0.95
k = int(np.searchsorted(fractions, target) + 1)

print("retained_by_component", fractions.round(4).tolist())
print("smallest_k_for_95_percent", k)
print("retained_at_k", round(float(fractions[k - 1]), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
retained_by_component [0.6408, 0.9562, 0.9962, 0.9996, 1.0]
smallest_k_for_95_percent 2
retained_at_k 0.9562
```
<!-- leetllm: output:end -->

## Compressing structured matrices with PyTorch SVD and LoRA

In deep learning workloads, PyTorch exposes `torch.linalg.svd` directly on multi-dimensional tensors.[^pytorch2019] Many learned weight updates and smooth spatial filters concentrate nearly all of their energy inside a low-rank subspace, which is why **Low-Rank Adaptation (<span data-glossary="lora">LoRA</span>)** freezes a pretrained weight matrix $W_0 \in \mathbb{R}^{d_{\text{out}} \times d_{\text{in}}}$ and parameterizes fine-tuning updates as a product of two thin matrices $\Delta W = B A$ with $B \in \mathbb{R}^{d_{\text{out}} \times r}$ and $A \in \mathbb{R}^{r \times d_{\text{in}}}$.[^hu2021] Constructing a structured $24 \times 24$ weight-update tensor from three smooth modes plus small noise demonstrates both the Eckart-Young tail guarantee $\lVert \Delta W - B A \rVert_F = \sqrt{\sum_{i > r} \sigma_i^2}$ and exact parameter compression in PyTorch.[^eckart1936]

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

Scaling from a $24 \times 24$ matrix up to a full $4096 \times 4096$ transformer layer at rank $16$ reduces adapter parameters from $16{,}777{,}216$ to $131{,}072$, a $128\times$ reduction while leaving base weights untouched. During actual fine-tuning, LoRA updates $B$ and $A$ directly via backpropagation rather than decomposing dense steps with SVD, yet SVD provides the mathematical lens explaining why thin matrix factors approximate rich updates without full-rank storage.

## Compress a retrieval matrix and check the ranking

Suppose four technical articles are indexed over three feature weights (`code`, `prose`, `math`), and a query seeks mainly `code` and `math` with mild `prose`. Projecting both articles and query onto the top two right-singular directions compresses embeddings from three dimensions down to two, allowing us to evaluate ranking stability with <span data-glossary="cosine-similarity">cosine similarity</span>. Cosine similarity divides each <span data-glossary="dot-product">dot product</span> by both vector norms so it compares direction rather than document length, and an explicit norm check rejects zero-length inputs cleanly instead of returning `NaN`.

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

Dropping the third singular direction retains `98.88%` of matrix energy and preserves the full document ranking `[0, 2, 3, 1]` with `max_score_change = 0.0221`. While a four-row example verifies the code path, validating real embedding compression always requires measuring <span data-glossary="recall-at-k">Recall@k</span> across representative held-out queries.

## Where these matrix tools return

The table below maps each matrix decomposition and conditioning concept to the downstream ML systems where it reappears alongside the empirical checks that must still accompany it:

| ML system component | Linear algebra mechanism | What still needs measurement |
|---|---|---|
| Latent semantic analysis for retrieval | Truncated SVD maps sparse term-document counts into compact directions[^deerwester1990] | Ranking metrics on held-out queries |
| Embedding compression | Centered PCA or learned projection drops low-variance directions | Recall, memory footprint, and latency |
| Linear fitting | Least squares projects targets onto feature column space | Out-of-sample error and conditioning |
| Low-rank adaptation (<span data-glossary="lora">LoRA</span>) | Adapter weights factorize updates into $B A$ with rank $r$[^hu2021] | Fine-tuned accuracy on downstream benchmarks |
| Optimization geometry | Disparate singular values create narrow, curved loss valleys | Learning-rate stability and training loss |

## Practice with measured answers

Work through these four extensions from the matrices above, checking each hand derivation against NumPy before expanding the reference answers below:

1. For the symmetric matrix $C = \begin{bmatrix}3 & 1 \\ 1 & 3\end{bmatrix}$, compute $C^T C$, its two eigenvalues, its singular values, and its 2-norm condition number.
2. In the retrieval ranking script above, compress onto only one singular direction instead of two. Why do all scores collapse to `+1`?
3. Add a constant offset `[100, 100]` to every row of the three-document matrix `A` before running PCA versus uncentered SVD. Which method keeps `[1, -1]/sqrt(2)` as its top direction?
4. Compute the least-squares weights, prediction, and residual for $A = \begin{bmatrix}1 & 0 \\ 0 & 1 \\ 1 & 1\end{bmatrix}$ and $y = [1, 2, 2]^T$ directly from the normal equations $A^T A w = A^T y$.

1. $C^T C = \begin{bmatrix}10 & 6 \\ 6 & 10\end{bmatrix}$, with eigenvalues `16` and `4`, singular values `4` and `2`, and $\kappa_2(C) = 2$.
2. When nonzero projections onto a single axis share the same positive sign, cosine similarity divides each scalar by its own absolute value and returns `+1.0` for all four documents, breaking tie-ordering down to floating-point roundoff (maximum score shift roughly `0.7113`).
3. Uncentered SVD aligns with the `[100, 100]` offset along `[1, 1]/sqrt(2)`. Mean-centering subtracts `[100, 100]` cleanly and recovers the contrast direction `[1, -1]/sqrt(2)` up to sign.
4. Normal equations give weights `[2/3, 5/3]`, fitted predictions `[2/3, 5/3, 7/3]`, and orthogonal residual `[1/3, 1/3, -1/3]`.

The geometry of our 3×2 document table ties the entire chapter together: dropping the weaker contrast axis minimizes Frobenius reconstruction error globally, yet it collapses `kernel` and `essay` onto the exact same coordinates. Always trace every singular value threshold back to the distinction your model must preserve.

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
    "explanation": "Mean Recall@10 averages per-query recall: for A, (0/4 + 6/6)/2 = 50%; for B, (4/4 + 3/6)/2 = 75%, clearing 70%. Pooling hits divides total hits by 10 (60% and 70%), while dividing by 20 returned slots computes precision (30% and 35%). Matrix energy alone does not measure query relevance."
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

> **Next:** Continue to [Adam, Momentum, Schedulers](/learn/optimization-algorithms-adam-schedulers). There, you'll use this direction-dependent geometry to understand why one step size can work along a shallow direction but fail along a steep one during gradient descent.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Your latency model from the last chapter had one input. Give it three: how much context a request retrieves, how deep the queue is when it arrives, and how long an answer it asks for. Count context and output in hundreds of tokens and the queue in requests, and one request might look like this:

```text title="One request"
context = 3, queue = 2, output = 1
```

Suppose training gave you a weight for each: 20 ms per hundred context tokens, 15 ms per queued request, and 30 ms per hundred output tokens. Then the model's prediction, before its intercept, is

$$
3 \times 20 + 2 \times 15 + 1 \times 30 = 120 \text{ ms}
$$

Multiply matching numbers, then add. Remember that operation, because the rest of this chapter is about it. A language model spends nearly all of its life doing exactly that, and the notation below exists so that we can write down billions of these sums in one line.

## A vector is an ordered list of numbers

A **vector** is a list of numbers in an agreed order. The request above is the vector $[3, 2, 1]$, and the weights are the vector $[20, 15, 30]$. The order is the only thing giving those numbers meaning. If one service sends queue depth first and another sends context first, the sum still computes and the answer is simply wrong. No error, just a bad prediction. Keep a mental note of that failure, because it comes back in a larger form when Part 1 reaches tokenizers.

Each position in the list is a **feature**, and the number of features is the vector's **dimension**. This book calls the width of a model's vectors $d$. A real model might use a $d$ of a few thousand.

The sum you just computed has a name, the **dot product**:

$$
\mathbf{a} \cdot \mathbf{b} = \sum_i a_i b_i
$$

So the multi-input model from the end of the last chapter is one dot product plus an intercept, $\hat{y} = \mathbf{w} \cdot \mathbf{x} + b$. In Python, with no libraries:

<!-- leetllm: test, output=show, id=reader-linalg-dot -->
```python title="a-prediction-is-a-dot-product.py"
def dot(a, b):
    assert len(a) == len(b), "vectors must have the same length"
    return sum(x * y for x, y in zip(a, b))

request = [3, 2, 1]     # context, queue, output
weights = [20, 15, 30]  # learned by training

print("prediction:", dot(weights, request) + 100, "ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prediction: 220 ms
```
<!-- leetllm: output:end -->

That `assert` is doing real work, and professional code has an equivalent everywhere. A length check catches the cheapest kind of mistake. Hold on to that instinct.

## The dot product also measures agreement

Here is the fact that makes the dot product so central. It is more than a weighted sum: it also tells you how much two vectors point the same way.

Draw a vector as an arrow from the origin. If two arrows point in similar directions, their large entries line up, the products are big, and the sum is large. If they point in unrelated directions, the large entries of one meet the small entries of the other, and the sum stays small. Geometry makes this exact:

$$
\mathbf{a} \cdot \mathbf{b} = \lVert \mathbf{a} \rVert \, \lVert \mathbf{b} \rVert \cos\theta
$$

The bars mean length, and $\theta$ is the angle between the arrows. Divide out the two lengths, and what remains is the **cosine similarity**, a score that reaches 1 when two vectors point the same way, 0 when they are perpendicular, and -1 when they point in opposite directions.

Why would you want to compare arrows? Because models learn to represent things as vectors, and things that behave alike tend to end up pointing alike. Here are three made-up token vectors, small enough to draw:

<!-- leetllm: test, output=show, id=reader-linalg-cosine -->
```python title="compare-three-tokens.py"
import math

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def cosine(a, b):
    return dot(a, b) / math.sqrt(dot(a, a) * dot(b, b))

rain = [0.9, 0.1]
storm = [0.8, 0.3]
invoice = [0.1, 0.9]

for name, other in [("storm", storm), ("invoice", invoice)]:
    scores = f"dot={dot(rain, other):.2f}  cosine={cosine(rain, other):.2f}"
    print(f"rain, {name:8s} {scores}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rain, storm    dot=0.75  cosine=0.97
rain, invoice  dot=0.18  cosine=0.22
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/dot_geometry_dark.png" alt="Three vectors share equal feature axes from zero to one. Rain at 0.9, 0.1 and storm at 0.8, 0.3 make a small angle with cosine 0.97. Invoice at 0.1, 0.9 makes a wider angle with rain and cosine 0.22. The table compares exact dot products and cosine values for the same pairs." />
  <figcaption>Rain and storm point almost the same way, so their cosine is close to 1. Rain and invoice are far apart. These two features are made up so the arrows fit on a page. A real model uses thousands of them, which it learns during training.</figcaption>
</figure>

You will use this idea twice in a big way. In Part 2, a retrieval system finds relevant documents by comparing their vectors with the vector of a question. And in Part 1, attention decides which earlier words a position should read by taking dot products between them. When someone tells you a model "pays attention," the machinery underneath is the arithmetic in that script.

Cosine and the dot product can disagree, because the dot product also rewards length. A long vector can outscore a closer one that happens to be short. Which you should want depends on the system. Retrieval chapters return to this choice, and it is worth checking what your vector database actually computes before you trust its ranking.

```checkpoint
Two vectors have a cosine similarity of 1, but one is ten times longer than the other. What is the same about them, and what would still differ?
---
They point in exactly the same direction, so cosine treats them as identical. Their dot products with a third vector would differ by a factor of ten, because the dot product includes length.
```

## A matrix is a stack of rows

A model almost never handles one vector at a time. Give it a sentence and each token gets its own vector, so a sentence becomes a table of numbers. That table is a **matrix**.

In this book each **row** is one token position and each **column** is one feature. A sequence of $T$ tokens with $d$ features per token has shape $T \times d$. The next step up is natural: serve several requests together and you stack several such tables into a block with shape $B \times T \times d$, where $B$ is the **batch** size. A block with any number of axes is called a **tensor**. That sounds grander than it is. A vector is a tensor with one axis and a matrix is a tensor with two.

<figure>
  <img src="illustrations/_generated/tensor_axes_dark.png" alt="One sequence is a three-token, four-feature matrix. Below it, two such matrices form a batch with shape two by three by four. Matching feature columns persist across token rows and request layers. Adding a token adds a row, widening the model adds a column to every row, and adding a request adds a layer." />
  <figcaption>Each axis has one job. Longer prompts add rows, a wider model adds columns, and serving more requests at once adds layers. A surprising share of machine-learning debugging comes down to finding which axis went wrong.</figcaption>
</figure>

If you take one habit from this chapter, take this: **name every axis**. A `[4, 8, 16]` tensor means nothing. "Four sequences, eight token positions, sixteen features" means something, and it tells you what each axis would do if the workload grew. When a profiler trace shows memory doubled, you can answer: did the batch double, or the prompts? Those are different problems with different fixes.

## Matrix multiplication is many dot products at once

You now have a table of token vectors, and you want to compute new features from them. Each new feature is a weighted sum of the old ones, which makes it a dot product, so you need one column of weights per new feature. Stack those columns into a matrix $W$. Multiplying gives you all the answers at once:

$$
Y = XW
$$

The cell in row $i$, column $k$ of $Y$ is the dot product of row $i$ of $X$ with column $k$ of $W$. That single sentence is the entire definition.

<figure>
  <img src="illustrations/_generated/matmul_cells_dark.png" alt="Matrix X has shape 3 by 2 and W has shape 2 by 4. Their product Y has shape 3 by 4. Highlighted row 3 of X contains 3 and 1; highlighted column 4 of W contains 1 and 2. Their dot product 3 times 1 plus 1 times 2 equals 5, filling the highlighted row 3, column 4 result cell." />
  <figcaption>Each output cell is one row of X dotted with one column of W. The inner sizes, 2 and 2, must agree. The outer sizes, 3 and 4, give the shape of the result.</figcaption>
</figure>

A row of $X$ must have as many numbers as a column of $W$, or the dot product fails. So $(3 \times 2)(2 \times 4)$ works and gives $3 \times 4$, and $(3 \times 2)(3 \times 4)$ is an error. Read it as a machine that converts features: this $W$ turns each token's two features into four and leaves the token count alone. A trainable $W$ is a **linear layer**, the basic part of neural networks. In plain Python, the product is three nested loops:

<!-- leetllm: test, output=show, id=reader-linalg-matmul -->
```python title="matrix-multiply-by-hand.py"
def matmul(X, W):
    rows, inner, columns = len(X), len(W), len(W[0])
    assert all(len(row) == inner for row in X), "inner sizes must match"
    return [[sum(X[i][d] * W[d][k] for d in range(inner))
             for k in range(columns)]
            for i in range(rows)]

X = [[1, 2], [0, 1], [3, 1]]
W = [[2, 0, 1, 1], [1, 3, 0, 2]]

for row in matmul(X, W):
    print(row)

T, d, k = 1000, 4096, 4096
print(f"multiplications for {T} tokens at width {d}: {T * d * k:,}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[4, 6, 1, 5]
[1, 3, 0, 2]
[7, 3, 3, 5]
multiplications for 1000 tokens at width 4096: 16,777,216,000
```
<!-- leetllm: output:end -->

Stop on that last line before moving on. One linear layer, applied to one thousand tokens at a realistic width, is nearly 17 billion multiplications. A model has many such layers. Reading the prompt runs them over every token. After that, each new token runs them over just its own position, a saving Part 5 explains, and that is still millions of multiplications per layer for every token you stream back. Three things follow, and they shape the rest of this book. This arithmetic is why the hardware matters, which Chapter 6 takes up. It is also regular and repetitive, every multiplication independent of the next, which makes it ideal for hardware that does thousands of things at once. And it is why cost depends so strongly on tokens and width, the two numbers you will keep multiplying in Part 5.

You will never write this loop in production. Libraries such as NumPy and PyTorch do the same arithmetic in compiled code, spelled `X @ W`. But now you know what that one character costs.

## An embedding table is a matrix you index

Models read numbers, and text is not numbers. In Part 1 you will see how a tokenizer turns text into integer IDs, each just a row number. The model then needs a vector for each ID. So it stores a matrix with one row per possible token, $V$ rows for a vocabulary of $V$ tokens and $d$ columns, and looks up rows.

That matrix is an **embedding table**. It holds nothing but numbers learned in training, and there is no dictionary of meanings hiding inside it. A row of the table is simply the set of numbers that training found useful for that token. The rain and storm arrows above are pretending to be two rows of one.

<!-- leetllm: test, output=show, id=reader-linalg-embedding -->
```python title="look-up-token-vectors.py"
embedding = [
    [0.1, 0.3, 0.5],   # ID 0
    [0.2, -0.4, 0.9],  # ID 1
    [0.8, 0.1, -0.2],  # ID 2
    [-0.5, 0.3, 0.4],  # ID 3
]

token_ids = [2, 0, 3]
X = [embedding[i] for i in token_ids]
print("shape:", (len(X), len(X[0])))
for token_id, row in zip(token_ids, X):
    print(token_id, row)

V, d, bytes_per_number = 32_000, 4096, 2
print(f"table size: {V * d * bytes_per_number / 2**20:.0f} MiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shape: (3, 3)
2 [0.8, 0.1, -0.2]
0 [0.1, 0.3, 0.5]
3 [-0.5, 0.3, 0.4]
table size: 250 MiB
```
<!-- leetllm: output:end -->

Three IDs became a $3 \times 3$ matrix, exactly the $T \times d$ shape a model wants. The last line shows why vocabulary size is a real engineering decision and not just a detail: at 2 bytes per number, a table of 32,000 tokens at width 4,096 needs 250 MiB before the model has done anything.

The IDs are row numbers and carry no meaning of their own. ID 3 is not "bigger" than ID 2, and an ID means nothing without the exact table it indexes. Swap in a different table, and every token silently reads someone else's vector. That is what makes tokenizer mismatches so nasty, and Part 1 opens with precisely that problem.

## Comparing everything with everything

One more operation, and you will have all the linear algebra the Transformer needs.

The **transpose**, written $X^T$, flips a matrix over its diagonal, so rows become columns. (That raised $T$ only names the operation. It is not the token count, and it is not a power.) By itself that sounds like bookkeeping, but see what it allows. $X$ is $T \times d$, so $X^T$ is $d \times T$, and the inner sizes match:

$$
S = XX^T
$$

The result $S$ has shape $T \times T$. By the rule you just learned, its cell in row $i$ and column $j$ is the dot product of token $i$'s row with token $j$'s row. So **one multiplication compares every token with every other token**.

<!-- leetllm: test, output=show, id=reader-linalg-grid -->
```python title="compare-every-token.py"
def matmul(X, W):
    return [[sum(X[i][d] * W[d][k] for d in range(len(W)))
             for k in range(len(W[0]))] for i in range(len(X))]

def transpose(X):
    return [list(column) for column in zip(*X)]

tokens = ["rain", "storm", "invoice"]
X = [[0.9, 0.1], [0.8, 0.3], [0.1, 0.9]]

S = matmul(X, transpose(X))
print(f"{'':>8}" + "".join(f"{name:>9}" for name in tokens))
for name, row in zip(tokens, S):
    print(f"{name:>8}" + "".join(f"{value:9.2f}" for value in row))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
             rain    storm  invoice
    rain     0.82     0.75     0.18
   storm     0.75     0.73     0.35
 invoice     0.18     0.35     0.82
```
<!-- leetllm: output:end -->

Read the grid like a lookup table. Rain against storm scores 0.75, and rain against invoice scores 0.18. This $T \times T$ grid is the heart of attention. When Part 1 reaches the Transformer, you will see $QK^T$ and recognize it: the same grid, built from slightly different vectors. It also explains a cost you feel directly when serving long contexts. Double the prompt and this grid gets four times as many cells, while the linear layers only do twice the work. At 1,000 tokens and width 4,096 the grid is still the smaller bill, about 4 billion multiplications against nearly 17 billion for one linear layer. Its share grows with length, though, which is why very long contexts get expensive faster than you would guess.

## When the shapes fit and the answer is still wrong

A shape error is a good error, because it stops the program. The dangerous bugs are the ones where the shapes happen to fit.

Suppose you mean to average over token positions and you average over features instead. On a $3 \times 3$ matrix, either axis gives you three numbers, the code runs, and you have computed nonsense. A similar trap is **broadcasting**. Libraries stretch mismatched shapes to fit, so a column vector and a row vector can combine into a full matrix when you meant to add them element by element.

Here is the defense that catches most of this, and I would use it in any code you care about:

- Name each axis in a comment, or in the variable name.
- Test with sizes that are all different, like $B=2$, $T=3$, $d=4$. With distinct sizes, a swapped axis usually crashes. With equal sizes, it quietly succeeds.
- Assert the shape you expect at each point where one component hands off to the next.

```checkpoint
A batch has shape `[8, 512, 1024]`. What does each number mean under this book's convention, and what happens to the shape if you double the prompt length?
---
Eight sequences, 512 token positions, and 1,024 features per position, so the shape is $B \times T \times d$. Doubling the prompt length changes only the middle axis, giving `[8, 1024, 1024]`. Note how two axes now have the same size, which is exactly when a swapped axis can go unnoticed.
```

## What you can do now

You can read the two lines of notation that do most of a language model's arithmetic: $Y = XW$, which computes new features, and $XX^T$, which compares positions. You can predict a result's shape before you run the code, and you can estimate what the operation will cost.

But these operations only ever produce more numbers. A language model has to commit to something: what is the next word? It does not actually know, and it does not pretend to. It gives you a probability for each option. The next chapter shows how raw scores become those probabilities, and how they become the signal that trains the model.

<!-- leetllm: edition:reader:end -->
