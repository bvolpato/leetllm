---
title: Support vector machine
importance: 90
---

A support vector machine (SVM) is a family of supervised methods for classification and regression. In binary classification, it balances a wide decision margin against classification violations. For linear binary classification, the boundary is a hyperplane defined by weights and an intercept. Support vectors have nonzero coefficients in the dual solution: in a soft-margin classifier they can lie on the margin, inside it, or even on the wrong side of the boundary. They aren't necessarily just the nearest examples.

## Margin versus probability

With labels $y_i\in\{-1,+1\}$ and score $f(x_i)=w^\top x_i+b$, the signed functional margin is $y_if(x_i)$. A soft-margin SVM balances a small weight norm against violations of a target margin, often through hinge loss. Logistic regression instead minimizes log loss and naturally produces sigmoid-based scores. Treat an SVM decision score as a margin; probability output needs an additional calibration procedure.

A linear implementation can store the learned weights and intercept without retaining the training examples.


## Example

An access-review classifier gives a genuinely positive request score 0.4. Its signed margin is 0.4, so the request falls on the correct side but inside the desired unit margin. Hinge loss is $\max(0,1-0.4)=0.6$. Another positive request scores 1.4 and has zero hinge loss because it already clears the margin. A positive request scored -0.2 is misclassified and incurs loss 1.2.

## Why it matters here

Support vector machines show that a linear decision boundary doesn't imply a single training objective. Their margins, support vectors, kernel extensions, and calibration requirements connect classical classification theory to modern choices about score interpretation, feature scaling, and honest validation.

## Related terms

- [Hinge loss](glossary://hinge-loss)
- [Kernel method](glossary://kernel-method)
- [Logistic regression](glossary://logistic-regression)
