---
title: Singular value
aliases: ["singular values"]
importance: 92
---
A **singular value** measures how strongly a matrix stretches a corresponding unit right singular vector. For a real matrix, singular value decomposition writes $A = U\Sigma V^T$, where the diagonal entries of `Sigma` are nonnegative singular values ordered from largest to smallest. The associated right singular vectors identify feature-space directions; left singular vectors describe their resulting output-space directions. An arbitrary unit vector generally has a mixture of these stretches, not a single singular value.

Singular values exist for rectangular matrices as well as square matrices. Their nonzero squares are the nonzero eigenvalues of the Gram matrix `A.T @ A`; a wide matrix's Gram matrix also has additional zero eigenvalues. A zero singular value identifies a collapsed direction and reduces exact matrix rank. A very small nonzero singular value can make inverse-like calculations sensitive to noise. For complex matrices, use conjugate transpose in both formulas.

## Compression retains energy; downstream relevance needs evaluation

For singular values `sqrt(3)` and `1`, retaining only the strongest direction keeps `3 / (3 + 1) = 75%` of squared matrix energy. The discarded direction still contains 25%. If that weaker direction distinguishes two important incident classes, a reconstruction-friendly compression can still damage retrieval or classification.

## Example

```python
import numpy as np

A = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
values = np.linalg.svd(A, compute_uv=False)
assert np.allclose(values, [np.sqrt(3), 1.0])
```

Both values are nonzero, so this matrix has rank two. A rank-one approximation discards the second direction and has Frobenius reconstruction error one.

## Why it matters here

Low-rank approximation, PCA, feature compression, conditioning, and model adaptation all use singular-value structure. The correct decision combines retained energy with downstream accuracy, retrieval recall, and sensitivity to weak directions.

## Related terms

- [SVD](glossary://svd)
- [Eigenvalue](glossary://eigenvalue)
- [PCA](glossary://pca)
- [LoRA](glossary://lora)
