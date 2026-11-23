---
title: Eigenvector
importance: 91
---
An **eigenvector** of a square matrix is a nonzero vector that the matrix transforms into a scalar multiple of itself. In the equation $Av = \lambda v$, `v` is the eigenvector and `lambda` is its eigenvalue. For a real eigenvalue the direction may stretch, shrink, reverse, or collapse to zero, but it doesn't rotate into an unrelated direction. Real matrices can also have complex eigenvectors and eigenvalues.

Not every vector has that property, and some matrices lack enough independent eigenvectors to form a basis. Eigenvectors isolate the vectors whose transformation satisfies the scalar-multiple relationship. A zero vector is excluded because every matrix maps zero to zero, which would make the definition uninformative.

## Find the directions in a Gram matrix

For $G = \begin{bmatrix}2&1\\1&2\end{bmatrix}$, the common direction `[1, 1]` becomes `[3, 3]`, so it has eigenvalue 3. The contrast direction `[1, -1]` becomes `[1, -1]`, so it has eigenvalue 1. When `G = A.T @ A` for real `A`, an orthonormal eigenbasis gives the right singular directions of `A`; for complex `A`, use its conjugate transpose.

## Example

```python
import numpy as np

gram = np.array([[2, 1], [1, 2]])
common = np.array([1, 1])
assert np.array_equal(gram @ common, 3 * common)
```

The matrix triples the common direction without changing its alignment. Normalizing the vector changes its length but doesn't change the eigenvector relationship.

## Why it matters here

Feature correlations, principal components, covariance matrices, and optimization curvature all become easier to inspect through stable matrix directions. Eigenvectors explain which combinations of inputs a transformation preserves or amplifies.

## Related terms

- [Matrix](glossary://matrix)
- [Vector](glossary://vector)
- [SVD](glossary://svd)
- [PCA](glossary://pca)
