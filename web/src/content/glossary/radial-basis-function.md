---
title: Radial basis function
importance: 84
---

A radial basis function (RBF) depends on distance from a reference point, $\phi(\lVert x-c\rVert)$. The widely used Gaussian or squared-exponential RBF kernel is one such choice: it assigns similarity one to identical inputs and smoothly decreases toward zero as their separation grows. Other radial functions, such as linear or cubic interpolation bases, can follow different distance profiles. The Gaussian kernel's length-scale parameter determines how quickly covariance falls.

## Equivalent parameterizations

The kernel can be written $k(x,x')=\exp(-\lVert x-x'\rVert^2/(2\ell^2))$ or $\exp(-\gamma\lVert x-x'\rVert^2)$, where $\gamma=1/(2\ell^2)$. Larger $\gamma$ means a shorter length scale and more localized influence. Since Euclidean distance depends on feature units, unscaled high-magnitude columns can overwhelm all other features. Very short length scales can memorize individual training points.

## Example

With length scale $\ell=1$, inputs at distances 0, 1, and 3 receive similarities $1$, $\exp(-1/2)\approx0.607$, and $\exp(-9/2)\approx0.011$. The distant support vector's kernel term is small, though its decision contribution also depends on its learned coefficient. In a Gaussian process, this is small prior covariance; prediction depends on the full covariance system. Far from all observations, the predictive distribution can approach its prior.

## Why it matters here

The RBF kernel supplies an inspectable nonlinear alternative to logistic regression and linear margins. The same similarity appears in Gaussian-process uncertainty estimates, making feature scaling, bandwidth choice, held-out validation, and extrapolation behavior central engineering decisions.

## Related terms

- [Kernel method](glossary://kernel-method)
- [Support vector machine](glossary://support-vector-machine)
- [Gaussian process](glossary://gaussian-process)
