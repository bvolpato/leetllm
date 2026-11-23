---
title: Eigenvalue
importance: 90
---
An **eigenvalue** is the scalar factor associated with an eigenvector of a square matrix. If $Av = \lambda v$ for a nonzero vector `v`, then `lambda` tells how strongly the matrix scales that particular direction. A negative real eigenvalue reverses the direction; zero collapses it to zero. A real matrix can also have complex eigenvalues, so it need not have an eigenvector in every real direction or a full real eigenvector basis.

Eigenvalues describe the matrix's behavior on its special invariant directions, not automatically the importance of a feature or the performance of a model. Their interpretation depends on the matrix being analyzed. For a covariance matrix they quantify variation along principal directions; for a quadratic loss's curvature matrix they describe directional curvature.

## Squared stretch versus singular value

For a real rectangular data matrix `A`, the Gram matrix `A.T @ A` is square. Its nonnegative eigenvalues are the squared singular values of `A`, with extra zeros if `A` has more columns than rows. For complex data use the conjugate transpose, `A.conj().T @ A`. If a Gram eigenvalue is 3, the corresponding singular value is `sqrt(3)`, not 3. Confusing those quantities gives incorrect reconstruction-energy and conditioning calculations.

## Example

```python
import numpy as np

gram = np.array([[2.0, 1.0], [1.0, 2.0]])
values = np.linalg.eigvalsh(gram)
assert np.allclose(values, [1.0, 3.0])
assert np.allclose(np.sqrt(values), [1.0, np.sqrt(3)])
```

The two Gram eigenvalues correspond to contrast and common directions. Taking square roots recovers the associated data-matrix singular-value magnitudes.

## Why it matters here

Principal component analysis, conditioning, least squares, and optimizer behavior depend on how strongly matrices act along different directions. Tracking whether a reported value is a scale, squared scale, or curvature prevents mathematical and implementation mistakes.

## Related terms

- [Eigenvector](glossary://eigenvector)
- [SVD](glossary://svd)
- [PCA](glossary://pca)
- [Matrix](glossary://matrix)
