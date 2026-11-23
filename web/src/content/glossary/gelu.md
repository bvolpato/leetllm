---
title: GELU
aliases: ["Gaussian error linear unit"]
importance: 79
---
The Gaussian error linear unit (GELU) is a smooth activation defined by $\operatorname{GELU}(x)=x\Phi(x)$, where $\Phi$ is the standard normal cumulative distribution function. Instead of discarding every negative value abruptly, it scales each input according to its position under a Gaussian distribution.

## A smooth gate, not a probability output

For large positive inputs, $\Phi(x)$ approaches one and GELU behaves almost like the identity. For moderately negative inputs, it preserves a small negative contribution instead of imposing ReLU's hard zero boundary. For strongly negative inputs, the output approaches zero. Its output isn't restricted to $(0,1)$, so GELU isn't a substitute for sigmoid when a bounded binary score is required.

The exact expression is $x[1+\operatorname{erf}(x/\sqrt{2})]/2$. Some implementations use a fast tanh approximation. The exact and approximate variants are close but aren't bit-identical, which matters when matching framework outputs or reproducing a reference model.

## Example

At $x=-2$, GELU returns approximately $-0.046$, while ReLU returns zero. At $x=1$, GELU returns approximately $0.841$, while ReLU returns one. At $x=2$, GELU returns approximately $1.954$. These values show gradual gating rather than a hard pass-or-block rule.

## Why it matters here

The neural-network lesson compares sigmoid, ReLU, and GELU on identical inputs. Transformer feed-forward blocks often use smooth or gated activations, so recognizing the difference prevents incorrect shape, range, and gradient assumptions.

## Related terms

- [Activation function](glossary://activation-function)
- [ReLU](glossary://relu)
- [Tanh](glossary://tanh)
- [Feed-forward network](glossary://feed-forward-network)
