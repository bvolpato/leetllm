---
title: Tanh
aliases: ["hyperbolic tangent"]
importance: 77
---
The hyperbolic tangent activation maps a real number into the open interval $(-1,1)$: $\tanh(z)=(e^z-e^{-z})/(e^z+e^{-z})$. Unlike a sigmoid, its output is centered around zero, so it can represent both positive and negative candidate state.

## Repeated saturation weakens memory

Its derivative is $1-\tanh^2(z)$. Around zero, the derivative is near one. For strongly positive or negative inputs, the output approaches its bounds and the derivative approaches zero. A recurrent neural network repeatedly multiplies state-update Jacobians while propagating an error backward through time; these include recurrent weights as well as activation derivatives. Repeated contraction can shrink gradients exponentially across many steps, while sufficiently expanding weight factors can instead produce exploding gradients.

Tanh lets recurrent networks store history, while saturation can weaken gradients across long sequences. LSTM and GRU architectures add gates and more direct state-update paths to help control what is retained.

## Example

For inputs $[-2,-0.5,0,0.5,2]$, tanh gives approximately $[-0.964,-0.462,0,0.462,0.964]$. At $z=2$, its derivative is about $0.071$. In a scalar illustration with unit recurrent weights, repeating a derivative of $0.9$ across 40 recurrent steps yields $0.9^{40}\approx0.015$. This illustrates how distant events may receive little learning signal; it does not calculate a full network's gradient without its weight factors.

## Why it matters here

The sequence-modeling lesson uses tanh in simple recurrent state updates and LSTM candidate memory. Reading its output range and derivative explains why gates exist and why gradient clipping addresses a different problem.

## Related terms

- [Activation function](glossary://activation-function)
- [Recurrent neural network](glossary://recurrent-neural-network)
- [LSTM](glossary://lstm)
- [Gradient clipping](glossary://gradient-clipping)
