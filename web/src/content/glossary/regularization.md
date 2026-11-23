---
title: Regularization
importance: 86
---

Regularization limits the complexity or effective flexibility of a fitted model to improve behavior beyond its training examples. Common approaches include adding a coefficient penalty to the optimization objective, constraining tree depth, stopping training early, or using dropout. Each method changes the training recipe; apparent parity between two implementations requires matching their regularization choices.

## Penalties are part of the objective

An L2-regularized linear or logistic model minimizes data loss plus $\lambda\lVert w\rVert_2^2$, with implementation-specific conventions for scaling and whether the intercept is penalized. Increasing the penalty generally shrinks coefficient magnitudes. L1 penalties can drive some coefficients exactly to zero. Regularization may reduce variance and improve held-out results, but it can also underfit when important signal is suppressed.


## Example

A from-scratch logistic classifier minimizes unpenalized log loss, while a library model uses its default L2 penalty. Both models can achieve the same thresholded F1 on a tiny validation slice while learning visibly different coefficients. Before diagnosing a gradient bug, align the intercept, input scaling, stopping tolerance, and penalty strength. In scikit-learn's logistic regression, `C` is inverse regularization strength: a larger `C` means a weaker penalty.

## Why it matters here

Regression, classification, tree ensembles, neural networks, and fine-tuning all compare training recipes against held-out evidence. Regularization explains how a lower training loss can accompany worse held-out results, why library defaults affect reproducibility, and why hyperparameter selection belongs inside honest validation boundaries.

## Related terms

- [Logistic regression](glossary://logistic-regression)
- [Cross-validation](glossary://cross-validation)
- [Weight decay](glossary://weight-decay)
