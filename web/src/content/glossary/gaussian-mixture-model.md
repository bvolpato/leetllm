---
title: Gaussian mixture model
aliases: ["GMM"]
importance: 82
---
A Gaussian mixture model represents a population as a weighted combination of several Gaussian component distributions. Each component has a mixing weight, mean, and covariance. Because component membership is unobserved, one observation can belong partially to multiple components instead of receiving the hard assignment used by ordinary k-means.

## Soft assignments expose overlapping populations

The density is $p(x)=\sum_{k=1}^{K}\pi_k\,\mathcal N(x\mid\mu_k,\Sigma_k)$, where mixing weights are nonnegative and sum to one. A component's responsibility for observation $x_i$ is its weighted density divided by the total mixture density at that point. Responsibilities are conditional assignments under the assumed model; validating real user-group or causal interpretations requires external evidence.


## Example

Suppose most requests finish near 30 milliseconds while a smaller queue-heavy group finishes near 90 milliseconds. A two-component mixture can assign a 45-millisecond request 80% responsibility to the fast component and 20% to the slow component. Fitting a single Gaussian would blend the two peaks, while k-means would force a hard group choice. Multiple starting points and a minimum covariance floor help detect poor local solutions and component collapse.

## Why it matters here

Latent-variable models teach uncertainty, multimodal data, soft clustering, and the expectation-maximization algorithm. These ideas carry into modern generative modeling, representation learning, and careful interpretation of mixed production traffic.

## Related terms

- [Maximum likelihood estimation](glossary://maximum-likelihood)
- [Variance](glossary://variance)
- [Probability calibration](glossary://probability-calibration)
