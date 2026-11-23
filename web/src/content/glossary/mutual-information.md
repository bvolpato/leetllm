---
title: Mutual information
importance: 83
---
Mutual information measures how much knowing one random variable reduces uncertainty about another. For discrete variables $X$ and $Y$, $I(X;Y)=H(X)-H(X\mid Y)=D_{KL}(P(X,Y)\Vert P(X)P(Y))$. Base-two logarithms express the result in bits.

## Dependence and causal direction

The joint-distribution form compares observed dependence with the distribution that would exist if the variables were independent. Independent variables have zero mutual information. Perfectly informative relationships can have positive mutual information even when their linear correlation is zero, so mutual information detects broader dependence than a straight-line correlation measure.

Mutual information measures dependence without identifying causal direction. A package's damage label and camera location may share information because a third factor influences both. An estimator can also overstate dependence when the sample is small or the data-processing choices leak labels. For continuous variables, densities and differential entropy require additional care; use a suitable estimator rather than copying the discrete sum.

## Example

Let $X$ be a fair binary label. Its entropy is one bit. If $Y=X$, observing $Y$ determines $X$ completely, so $H(X\mid Y)=0$ and $I(X;Y)=1$ bit. If $Y$ is an independent fair coin, the remaining uncertainty stays one bit and mutual information is zero. Swapping $X$ and $Y$ leaves the value unchanged.

## Why it matters here

An autoencoder's latent code is useful only when it preserves information about its input. Posterior collapse is a warning that latent variables may carry little input-specific information even when a powerful decoder still reconstructs adequately.

## Related terms

- [Entropy](glossary://entropy)
- [KL divergence](glossary://kl-divergence)
- [Autoencoder](glossary://autoencoder)
- [Correlation](glossary://correlation)
