---
title: Privacy accountant
aliases: ["privacy accounting"]
importance: 90
---

A privacy accountant computes an overall differential-privacy guarantee from the mechanism, protected-unit definition, sampling scheme, noise multiplier, clipping bound, number of accounted steps, and release policy. A common interface computes epsilon for a caller-chosen target delta; the reported guarantee includes both. The guarantee applies only when the implementation actually matches the accountant's assumptions; an attractive number cannot repair a mismatched sampling unit or omitted data-dependent release.

## Compose the actual protected-data accesses


Simple sequential composition adds the privacy costs of separately accounted releases, including their $\delta$ values. Specialized approaches such as moments or Rényi accounting can provide tighter valid bounds for subsampled Gaussian mechanisms. Which accounting method applies depends on the actual training and release procedure, not on which method reports the smallest number. Multiple artifacts derived solely by post-processing an already-accounted private output don't automatically incur separate costs; releasing additional data-dependent intermediate states requires the accountant to cover that joint release.

## Example

Suppose two separately released analyses spend epsilon 1.2 and 1.1 under a simplified additive policy with limit 3.0. A proposed third release costing 0.9 would bring the total to 3.2, so that policy rejects it. A real DP-SGD run also records its sampling rate, noise multiplier, training steps, target delta, protected unit, and whether every disclosed checkpoint was covered.

## Why it matters here

Fine-tuning systems can train multiple versions, publish intermediate artifacts, and repeat hyperparameter searches against the same sensitive population. A privacy accountant turns those operational choices into an auditable guarantee instead of treating epsilon as detached release metadata.

## Related terms

- [Privacy budget](glossary://privacy-budget)
- [Protected unit](glossary://protected-unit)
- [DP-SGD](glossary://dp-sgd)
- [Gaussian mechanism](glossary://gaussian-mechanism)
