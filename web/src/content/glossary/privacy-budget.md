---
title: Privacy budget
aliases: ["privacy epsilon"]
importance: 87
---
A privacy budget describes the cumulative privacy loss permitted for a sequence of differentially private computations. It is commonly reported through $(\varepsilon,\delta)$ for a stated protected unit, sampling scheme, mechanism, and release procedure. Additional private computations whose results affect released outputs can consume more budget, so privacy is not renewed merely because a new notebook, checkpoint, or dashboard is used. Reformatting or otherwise post-processing an already-private output without another private-data access doesn't itself spend more budget.

## Composition makes repeated releases visible

The privacy cost of training depends on sampling rate, noise multiplier, clipping assumptions, iteration count, and the accounting method. A privacy accountant composes those steps into a final bound. Publishing intermediate checkpoints, running separate hyperparameter trials, or releasing additional private metrics can increase the overall exposure and must be included in the release policy. An epsilon value without its delta, protected unit, and accounting assumptions is incomplete.

## Example

An organization approves a user-level budget with $\delta=10^{-6}$ before training. One candidate consumes an accounted $\varepsilon=2.1$. A second independent search over the same private users composes with the first release, so the compliance record must identify all released outputs, the shared population, their composition method, and whether the combined exposure still meets policy. Internal unreleased experiments also need a threat model and access controls.

## Why it matters here

Private fine-tuning and sensitive evaluation are operational processes, not single formulas. Budget tracking prevents an apparently safe training run from becoming unsafe through repeated tuning, checkpoint publication, or unaccounted analytics.

## Related terms

- [Differential privacy](glossary://differential-privacy)
- [Data governance](glossary://data-governance)
- [Validation gate](glossary://validation-gate)
