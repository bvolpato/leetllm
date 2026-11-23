---
title: Entropy
aliases: ["Shannon entropy"]
importance: 90
---
Shannon entropy measures the average uncertainty in a discrete random outcome. For a probability distribution $P$, it is $H(P)=-\sum_x P(x)\log P(x)$. Base-two logarithms report bits; natural logarithms report nats. An impossible outcome contributes zero by the convention $0\log0=0$.

## Separate uncertainty from prediction error

Entropy describes the uncertainty inside the reference distribution itself. [Cross-entropy](glossary://cross-entropy) measures the average coding or prediction cost when outcomes follow $P$ but are scored under another distribution $Q$. Their relationship is exact:

$$
H(P,Q)=H(P)+D_{KL}(P\Vert Q)
$$

The first term is irreducible uncertainty under $P$. The second is the additional penalty from using the wrong predictive distribution. A one-hot training label has zero target entropy, so its cross-entropy is simply the negative log probability assigned to the correct class. A diffuse target, such as a label-smoothed distribution, has nonzero entropy even when predicted perfectly.


## Example

For class probabilities $[0.5,0.25,0.25]$, entropy is $0.5(1)+0.25(2)+0.25(2)=1.5$ bits. A fair four-class distribution has two bits. A certain class distribution $[1,0,0]$ has zero bits. Higher entropy means less concentrated probability, not automatically better model calibration or safer decisions.

## Why it matters here

The softmax lesson distinguishes target uncertainty from the loss caused by a mistaken prediction. Later decoding and evaluation lessons use entropy to reason about distribution sharpness, while reinforcement-learning objectives may explicitly reward policy entropy.

## Related terms

- [Cross-entropy](glossary://cross-entropy)
- [KL divergence](glossary://kl-divergence)
- [Softmax](glossary://softmax)
- [Mutual information](glossary://mutual-information)
