---
title: Sigmoid
aliases: ["logistic sigmoid", "logistic function"]
importance: 87
---
The logistic sigmoid maps a real-valued input into the open interval between zero and one: $\sigma(z)=1/(1+e^{-z})$. It is commonly used to convert one binary-classification logit into a score or to create gates that interpolate between retaining and replacing information.

## A bounded score needs calibration evidence

An output of $0.93$ lies between zero and one. Interpret it as a 93 percent outcome probability only when the training objective, representative data, and empirical [calibration](glossary://calibration) checks support that meaning. Fixed demonstration weights illustrate a bounded score; validated risk evidence requires those checks.

The derivative is $\sigma(z)(1-\sigma(z))$. It peaks at $z=0$ and approaches zero for strongly positive or negative inputs. This saturation can weaken gradients in hidden layers. For very negative logits, the naive expression evaluates $e^{-z}$ and can overflow; the equivalent branch $e^z/(1+e^z)$ avoids that large exponent.

## Example

A logit of $2.6$ gives $\sigma(2.6)\approx0.931$. A logit of $-2.6$ gives approximately $0.069$, and a zero logit gives exactly $0.5$. In an LSTM forget gate, a value near one retains most prior cell state; a value near zero discards it.

## Why it matters here

Neural-network lessons use sigmoid for binary scores, recurrent-network lessons use it for gates, and classifier capstones must avoid calling an unvalidated score a calibrated probability.

## Related terms

- [Logits](glossary://logits)
- [Calibration](glossary://calibration)
- [Activation function](glossary://activation-function)
- [LSTM](glossary://lstm)
