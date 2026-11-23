---
title: SVD
aliases: ["singular value decomposition"]
importance: 78
---
**Singular value decomposition (SVD)** factors any real [matrix](glossary://matrix) $A \in \mathbb{R}^{m \times n}$ into two orthogonal maps and a non-negative diagonal of scales:

$$
A = U \Sigma V^{\top}
$$

Columns of $U$ (left singular vectors) and $V$ (right singular vectors) are orthonormal. The diagonal of $\Sigma$ holds $p = \min(m,n)$ **singular values** $\sigma_1 \ge \cdots \ge \sigma_p \ge 0$. Exactly $r = \operatorname{rank}(A)$ are positive in exact arithmetic. Complex matrices use the conjugate transpose $A = U \Sigma V^{H}$. Every matrix has an SVD; it does not require $A$ to be square or symmetric.

For AI/ML engineers the practical payoffs are: (1) **optimal low-rank approximation** (Eckart–Young–Mirsky), (2) the computational route to [PCA](glossary://pca), (3) classical latent semantic analysis on term–document tables, (4) spectrum and conditioning diagnostics on weight or embedding matrices, and (5) stable pseudoinverses for least-squares style solves.

## Intuition

Treat $A$ as a linear map $x \mapsto Ax$. SVD says that map is three simple steps:

1. **Rotate (or reflect)** the input with $V^{\top}$ into an aligned coordinate system.
2. **Stretch or shrink** each axis by $\sigma_i$ (and drop axes with $\sigma_i = 0$).
3. **Rotate** into the output space with $U$.

Large $\sigma_i$ are directions where $A$ amplifies strongly. Tiny $\sigma_i$ are near-null directions: $A$ almost kills them, and inverting or dividing by them is unstable. Truncating small $\sigma_i$ is therefore both a compressor (keep the energetic part of the map) and a regularizer (throw away fragile directions).

The outer-product form makes that concrete:

$$
A = \sum_{i=1}^{r} \sigma_i\, u_i v_i^{\top}
$$

Each term is rank-1: a single "pattern" $u_i$ paired with a "loading" $v_i$, weighted by $\sigma_i$. Truncation keeps the first $k$ terms and discards the rest.

## Formula

**Full / compact forms.** Let $A \in \mathbb{R}^{m \times n}$. Write $p = \min(m,n)$.

| Form | Shapes | Notes |
| --- | --- | --- |
| Full | $U \in \mathbb{R}^{m \times m}$, $\Sigma \in \mathbb{R}^{m \times n}$, $V \in \mathbb{R}^{n \times n}$ | $\Sigma$ rectangular diagonal |
| Economy / thin | $U \in \mathbb{R}^{m \times p}$, $\Sigma = \operatorname{diag}(\sigma_1,\ldots,\sigma_p)$, $V \in \mathbb{R}^{n \times p}$ | What `full_matrices=False` returns |
| Rank-$r$ compact | Only columns with $\sigma_i > 0$ | Minimal exact factorization |

In code libraries the middle factor is often a **1D vector** `s` of length $p$, not a full diagonal matrix. NumPy's `numpy.linalg.svd` returns `(U, s, Vh)` where `Vh` is $V^{H}$ (so reconstruction is `(U * s) @ Vh` in the economy case), not $V$ itself.

**Link to eigenproblems.** Nonzero singular values satisfy

$$
A^{\top} A\, v_i = \sigma_i^2\, v_i, \qquad
A A^{\top}\, u_i = \sigma_i^2\, u_i
$$

with $u_i = A v_i / \sigma_i$ when $\sigma_i > 0$. You rarely form $A^{\top}A$ for large dense $A$ (it squares the condition number); production solvers use bidiagonalization / LAPACK `gesdd` / `gesvd` or randomized methods for top-$k$ only.

**Matrix norms from the spectrum.**

$$
\|A\|_2 = \sigma_1, \qquad
\|A\|_F = \sqrt{\sum_i \sigma_i^2}
$$

**2-norm condition number** (square nonsingular case, and the natural generalization otherwise):

$$
\kappa_2(A) = \frac{\sigma_{\max}}{\sigma_{\min}}
$$

A large $\kappa_2$ means some directions are stretched vastly more than others; inverse and least-squares problems amplify noise along the weak axes. Here $\sigma_{\min}$ is the smallest of all $p$ singular values, including zeros: rank deficiency makes this condition number infinite (the all-zero matrix is a degenerate case). A ratio using only positive singular values describes conditioning on the retained subspace instead.

**Eckart–Young–Mirsky (best rank-$k$ approximation).** Let

$$
A_k = \sum_{i=1}^{k} \sigma_i\, u_i v_i^{\top}
$$

Among **all** matrices $B$ with $\operatorname{rank}(B) \le k$,

$$
\|A - A_k\|_2 = \sigma_{k+1}, \qquad
\|A - A_k\|_F = \sqrt{\sum_{i=k+1}^{r} \sigma_i^2}
$$

and no other rank-$\le k$ matrix beats $A_k$ in either the spectral or Frobenius norm. That is the theorem that licenses "keep top singular values" as more than a heuristic (Eckart and Young, 1936; Mirsky later for unitarily invariant norms).

**Moore–Penrose pseudoinverse.** Invert the nonzero scales and reverse the orthogonal maps:

$$
A^{+} = V \Sigma^{+} U^{\top}, \qquad
\Sigma^{+} = \operatorname{diag}(\sigma_1^{-1},\ldots,\sigma_r^{-1}, 0, \ldots)
$$

For the full factorization, $\Sigma^{+}$ has shape $n \times m$: transpose the rectangular diagonal and invert its positive entries. Libraries threshold tiny $\sigma_i$ (an `rcond` cutoff) so you do not invert numerically unreliable directions.

**PCA connection.** If $X$ is a centered data matrix, right singular vectors of $X$ are principal directions and $\lambda_j \propto \sigma_j^2$. See [PCA](glossary://pca) for centering, explained variance, and the fit/transform checklist.

## Worked numbers

Take

$$
A =
\begin{bmatrix}
2 & 1 \\
1 & 2
\end{bmatrix}
$$

Then $A^{\top}A = \begin{bmatrix}5 & 4 \\ 4 & 5\end{bmatrix}$ has eigenvalues $9$ and $1$, so

$$
\sigma_1 = 3, \qquad \sigma_2 = 1
$$

with orthonormal singular vectors along $[1,1]^{\top}/\sqrt{2}$ and $[1,-1]^{\top}/\sqrt{2}$. The rank-1 truncation is

$$
A_1 = 3 \cdot
\frac{1}{\sqrt{2}}\begin{bmatrix}1\\1\end{bmatrix}
\frac{1}{\sqrt{2}}\begin{bmatrix}1 & 1\end{bmatrix}
=
\frac{3}{2}
\begin{bmatrix}
1 & 1 \\
1 & 1
\end{bmatrix}
=
\begin{bmatrix}
1.5 & 1.5 \\
1.5 & 1.5
\end{bmatrix}
$$

Frobenius error $\|A - A_1\|_F = \sigma_2 = 1$, matching Eckart–Young. The condition number is $\kappa_2(A) = 3/1 = 3$: mild. Contrast a diagonal map with $\sigma = (1, 10^{-3})$: same rank structure, but $\kappa_2 = 10^{3}$ and any inverse-style use of the second direction is fragile.

**Energy retained.** The fraction of squared Frobenius mass kept by the top $k$ values is

$$
\frac{\sum_{i=1}^{k} \sigma_i^2}{\sum_{i=1}^{r} \sigma_i^2}
$$

It is the right bookkeeping for reconstruction error. It is **not** automatically the right bookkeeping for retrieval recall, classification accuracy, or "is this weight update low-rank enough for LoRA."

## Truncation

Truncation zeros the tail of $\Sigma$ before the final $U$ multiply (or, equivalently, drops the corresponding columns of $U$ and $V$).

## How it works

1. **Form or stream $A$.** Term–document counts, centered embedding rows, a weight slice $W$, a residual $\Delta W$, or a design matrix for least squares.
2. **Choose the solver.** Exact dense SVD for moderate size (`numpy.linalg.svd`, SciPy/LAPACK). Randomized or iterative partial SVD when you only need the top $k$ of a large matrix (common for LSA-scale and PCA-scale jobs).
3. **Economy vs full.** Prefer `full_matrices=False` unless you need a complete orthonormal basis for the left or right null space. Full factors waste memory when $m \gg n$ or $n \gg m$.
4. **Inspect the spectrum.** Plot $\sigma_i$ or $\sigma_i^2$. A sharp drop suggests a natural rank; a slow tail means aggressive $k$ destroys structure. For PCA, convert to explained-variance ratios after centering.
5. **Truncate or threshold.** Build $A_k$, project with $V_k$, form $A^{+}$ with an `rcond` floor, or report $\kappa_2 \approx \sigma_1/\sigma_{\min}$.
6. **Watch sign and basis ambiguity.** Each pair $(u_i, v_i)$ can flip sign together; near-equal singular values can mix in a subspace. Never assume vector $i$ from run A equals vector $i$ from run B without alignment.

```python
import numpy as np

A = np.array([[2.0, 1.0], [1.0, 2.0]])
U, s, Vh = np.linalg.svd(A, full_matrices=False)
# Reconstruct: A ≈ (U * s) @ Vh
A_hat = (U * s) @ Vh
assert np.allclose(A, A_hat)

k = 1
A_k = (U[:, :k] * s[:k]) @ Vh[:k, :]
# Frobenius error equals sqrt(sum(s[k:]**2)) = s[1] here
err = np.linalg.norm(A - A_k, "fro")
```

## Example

**Latent semantic analysis (LSA) sketch.** Deerwester et al. (1990) factor a term–document (or document–term) matrix with SVD so queries and documents live in a lower-dimensional "concept" space instead of raw term counts. Same pattern appears in the curriculum as PPMI + SVD for static word vectors.

Suppose four short docs and four terms (`gpu`, `cache`, `batch`, `latency`) with document–term counts

$$
X =
\begin{bmatrix}
0 & 2 & 1 & 2 \\
0 & 1 & 2 & 1 \\
3 & 0 & 0 & 1 \\
2 & 0 & 1 & 0
\end{bmatrix}
\begin{matrix}
\text{d1 serving}\\
\text{d2 serving}\\
\text{d3 train}\\
\text{d4 train}
\end{matrix}
$$

Economy SVD of $X$ yields singular values approximately

$$
\sigma \approx (4.10,\ 3.30,\ 1.49,\ 0.30)
$$

Top-2 energy is about $92\%$ of $\|X\|_F^2$. Coordinates $U_2 \Sigma_2$ place the two serving docs near each other and the two training docs near each other on the second axis, even though they do not share identical term bags. A new query row is folded in by projecting with the stored $V_2$ (and any IDF/PPMI transform you fit on the corpus). Compare in the reduced space with cosine.

**What fails in production on this path**

- Fitting SVD on **queries and documents with different bases** (or refitting per request): scores are not in one space.
- Skipping the same preprocessing (TF-IDF / PPMI, stopword policy) at query time.
- Choosing $k$ only from energy retained, never measuring Recall@k / nDCG on labeled pairs.
- Materializing a huge dense $X$ when a sparse truncated SVD / randomized SVD would suffice.
- Treating static LSA vectors as a drop-in for modern dual-encoder [embeddings](glossary://embedding): LSA is linear co-occurrence compression, not a trained semantic model.

**Other places you will hit the same object**

| Use | What you SVD | Why |
| --- | --- | --- |
| PCA on embeddings | Centered $n \times d$ matrix | Principal axes = right singular vectors |
| Weight inspection | Layer matrix $W$ | Spectrum / effective rank / anisotropy probes |
| Low-rank adapters | Conceptual rank of $\Delta W$ | LoRA *parameterizes* low rank; SVD *measures* it |
| Compression / denoise | Any numeric table | Optimal rank-$k$ rebuild in $\|\!\cdot\!\|_F$ and $\|\!\cdot\!\|_2$ |
| Stable least squares | Design matrix | Pseudoinverse via thresholded $\sigma_i$ |

## Trade-offs

| Strength | Limit |
| --- | --- |
| Exists for every matrix | Dense full SVD is $O(\min(mn^2, m^2n))$ class work |
| Optimal rank-$k$ rebuild (Eckart–Young–Mirsky) | Optimal rebuild $\neq$ optimal task metric |
| Gives norms, rank, $\kappa_2$, $A^{+}$ in one factorization | Sign/subspace ambiguity across runs |
| Exact link to PCA on centered data | Uncentered data mixes mean offset into top components |
| Clear spectrum diagnostic | Slow spectral tail: small $k$ hurts; sharp drop can still hide rare but useful directions |

**What fails in production**

- **Calling full SVD on a matrix that only needs top-$k$.** Memory and latency blow up; use partial / randomized SVD.
- **Inverting or dividing by tiny $\sigma_i$** without an `rcond` floor (noisy pseudoinverse, exploding least-squares coefficients).
- **Using reconstruction energy as a ship gate** for retrieval or ranking quality.
- **Forgetting centering** when the goal is PCA-style variance axes.
- **Comparing singular vectors across checkpoints by index** without fixing sign or subspace alignment.
- **Confusing LoRA with "run SVD on $W$."** LoRA trains factors $BA$; SVD can analyze whether an update *looked* low-rank after the fact, but training does not require decomposing $W_0$.

## Why it matters here

SVD is the linear-algebra engine behind "keep the important directions, drop the noise." Curriculum topics on dimensionality reduction, classical IR, embedding geometry, and low-rank structure all assume you can read a spectrum, form $A_k$, and choose the objective that matches the task. Frobenius optimality targets reconstruction; task loss, recall, and safety need task-specific evaluation. Once $A = U\Sigma V^{\top}$ is automatic, PCA, LSA, condition numbers, and pseudoinverses are the same factorization with different post-processing.

## Related terms

- [PCA](glossary://pca)
- [Matrix](glossary://matrix)
- [Embedding](glossary://embedding)
- [LoRA](glossary://lora)
- [Product quantization](glossary://product-quantization)
