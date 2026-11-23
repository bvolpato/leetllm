---
title: Adam optimizer
aliases: ["Adaptive Moment Estimation"]
importance: 95
---
The **Adam optimizer** updates model parameters using two moving averages for each parameter: a signed gradient average and an uncentered squared-gradient average. The first tracks recent direction; the second tracks gradient magnitude. Dividing the first estimate by the square root of the second gives each coordinate an adaptive update scale.

With gradient `g`, Adam updates `m = beta1 * m + (1 - beta1) * g` and `v = beta2 * v + (1 - beta2) * g**2`. Because both buffers start at zero, early steps divide by `1 - beta1**t` and `1 - beta2**t` for bias correction. A small `eps` protects the final denominator.

## The second moment isn't variance

`v` averages squared gradients without subtracting their mean, so it isn't statistical variance. On the first nonzero step, gradients `[100, 1]` can produce nearly equal updates after bias correction: each coordinate is divided by approximately its own absolute magnitude. Later, alternating signs reduce the signed numerator while consistently aligned gradients retain a stronger direction.


## Example

```python
import numpy as np

gradient = np.array([100.0, 1.0])
learning_rate = 0.01
first_step = learning_rate * gradient / (np.abs(gradient) + 1e-8)
assert np.allclose(first_step, [0.01, 0.01])
```

The equal first-step magnitudes don't prove equal feature importance; they reflect Adam's coordinate normalization.

## Why it matters here

Neural-network training often uses Adam or AdamW because gradient scales vary across parameters. The two stored buffers also cost memory, and AdamW's decoupled weight decay isn't equivalent to feeding an L2 penalty into Adam.

## Related terms

- [Optimizer](glossary://optimizer)
- [AdamW](glossary://adamw)
- [Optimizer state](glossary://optimizer-state)
- [Learning rate](glossary://learning-rate)
