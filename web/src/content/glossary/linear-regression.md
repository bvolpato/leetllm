---
title: Linear regression
importance: 95
---

Linear regression predicts a numeric outcome by adding an intercept to a weighted combination of input features. The model is linear in its learned coefficients, even when its inputs contain engineered transformations such as squared distance or an interaction between two measurements. Ordinary least squares chooses coefficients that minimize the sum of squared training residuals.

## Coefficients and residuals

For one feature, $\hat y=b+wx$. Here $x$ is the input, $w$ is its slope, $b$ is its intercept, and $\hat y$ is the predicted value. A residual is $y-\hat y$. Least squares can find the coefficients directly or through gradient descent. A near-zero training residual does not prove accuracy on unseen rows, especially with too many correlated features or a rank-deficient design matrix.


## Example

Suppose retrieved passages contain 100, 200, and 300 tokens, and observed latencies are 120, 140, and 160 milliseconds. Expressing length in hundreds of tokens gives $\hat y=100+20x$. A 400-token request receives a 180-millisecond prediction. The intercept represents fixed overhead; the slope adds 20 milliseconds per additional hundred tokens.

## Why it matters here

Linear regression teaches the complete predictive-model lifecycle on inspectable numbers: feature construction, loss, optimization, residual diagnosis, a baseline, and held-out evaluation. The same machinery reappears in logistic classifiers, neural-network training, forecasting, and production latency estimation.

## Related terms

- [Mean squared error](glossary://mean-squared-error)
- [Gradient](glossary://gradient)
- [Train, validation, and test split](glossary://train-validation-test-split)
