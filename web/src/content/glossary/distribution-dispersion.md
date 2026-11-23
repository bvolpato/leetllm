---
title: Distribution dispersion
aliases: ["trainer-rollout dispersion", "mismatch dispersion", "distribution spread", "logprob dispersion", "ratio dispersion"]
importance: 74
kind: term
---
**Distribution dispersion** describes how spread out observations are around center. Variance and standard deviation summarize average squared spread. Interquartile range, median absolute deviation, and tail quantiles give robust or tail-sensitive views.

No single dispersion metric is always enough. Standard deviation can be dominated by rare extremes. Interquartile range can ignore important far tails. Absolute differences remove direction. For trainer-versus-rollout analysis, keep signed log-ratio quantiles beside absolute error and clipped fractions.

## Choosing a spread measure

Use standard deviation when whole distribution and squared deviations matter. Use interquartile range or median absolute deviation when robust center behavior matters. Use signed tail quantiles and threshold exceedance rates when rare extremes can disable learning. Always name population and reduction unit: token-weighted spread can look different from sequence-weighted or engine-weighted spread.

## Example

Two runs have same mean policy ratio near one. First has tight ratios around center. Second combines low and high tails that cancel in mean. Ratio standard deviation, signed quantiles, and clip fractions separate them even though averages match.

## Why it matters here

Policy mismatch often grows first in minority of tokens. Dispersion and tails detect widening disagreement before global mean moves, then token-role, position, engine, and replay slices locate source.

## Related terms

- [Variance](glossary://variance)
- [Quantile](glossary://quantile)
- [Policy ratio](glossary://policy-ratio)
- [Policy mismatch](glossary://policy-mismatch)
