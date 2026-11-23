---
title: Gaussian mechanism
importance: 85
---

The Gaussian mechanism makes a numeric computation $(\varepsilon,\delta)$-differentially private by adding random Gaussian noise scaled to its global **L2 sensitivity** and the requested privacy parameters, with $\delta>0$ for a nonconstant query. Sensitivity is the largest change between neighboring datasets under the declared adjacency rule, such as adding/removing one protected unit or replacing one unit. Those rules can give different bounds. A valid privacy guarantee requires a justified sensitivity bound and unpredictable randomness.

For $f(D)\in\mathbb R^d$, release $f(D)+Z$ with $Z\sim\mathcal N(0,\sigma^2 I_d)$. A classical sufficient calibration is $\sigma>\Delta_2 f\sqrt{2\ln(1.25/\delta)}/\varepsilon$ for $0<\varepsilon<1$ and $0<\delta<1$ ([Dwork and Roth, Appendix A](https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf)). Under those conditions, this bound is sufficient; the [analytic Gaussian mechanism](https://arxiv.org/abs/1805.06530) gives a tighter privacy-loss-based calibration. Sampling and repeated releases need their own valid accounting.

## Bound influence before adding calibrated randomness

In DP-SGD, clipping each protected contribution bounds the sensitivity of the aggregated gradient. Gaussian noise is then added with a scale tied to that bound, after which an accountant combines the effects of sampling and repeated training steps. The protected contribution must match the claimed privacy unit: per-example clipping ordinarily supports row-level analysis, while user-level protection needs bounded user contributions or valid group-aware accounting.

## Example

Two scalar example gradients, 0.5 and 5.0, are clipped at 1.0, giving 0.5 and 1.0. Their clipped mean before noise is 0.75. This deterministic calculation demonstrates sensitivity control. A private release also needs correctly calibrated unpredictable Gaussian noise and applicable accounting.

## Why it matters here

Privacy-preserving model training combines contribution bounds, randomness, and accounting in a Gaussian-mechanism analysis tied to the declared protected population. Redaction and gradient clipping address individual parts of that analysis.

## Related terms

- [Differential privacy](glossary://differential-privacy)
- [Gradient clipping](glossary://gradient-clipping)
- [Privacy accountant](glossary://privacy-accountant)
- [Protected unit](glossary://protected-unit)
