---
title: ReLU
aliases: ["rectified linear unit"]
importance: 89
---
A rectified linear unit (ReLU) is the activation $f(x)=\max(0,x)$. Positive inputs pass through unchanged, while negative inputs become zero. This simple piecewise-linear bend gives a network expressive power that a stack of affine layers alone cannot supply.

## The zero-gradient boundary

For $x>0$, ReLU's derivative is $1$; for $x<0$, it is $0$. The mathematical derivative isn't defined exactly at zero, so frameworks select a convention, commonly zero. During [backpropagation](glossary://backpropagation), positive pre-activations pass their upstream gradient along and negative pre-activations block it.

A unit that stays negative for the entire training distribution receives no gradient through its ReLU output. Excessively negative bias, poorly scaled features, or an aggressive parameter update can create this "dead ReLU" failure. Inspect the fraction of positive pre-activations before blaming the optimizer.

## Example

For $z=[-2,-0.5,0,1,3]$, ReLU produces $[0,0,0,1,3]$. If the upstream gradient is $[4,4,4,4,4]$ and the framework uses zero derivative at the origin, the gradient passed to the input is $[0,0,0,4,4]$.

## Why it matters here

The preparation lessons use ReLU to expose affine-layer collapse, convolutional feature detection, and local backward rules. Later transformer lessons contrast its hard cutoff with smoother or gated feed-forward variants. A zero output can be expected behavior; a permanently inactive unit is the debugging signal.

## Related terms

- [Activation function](glossary://activation-function)
- [GELU](glossary://gelu)
- [Gradient](glossary://gradient)
- [Feed-forward network](glossary://feed-forward-network)
