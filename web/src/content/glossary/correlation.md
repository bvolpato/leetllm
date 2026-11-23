---
title: Correlation
aliases: ["correlation coefficient"]
importance: 78
kind: term
---
**Correlation** measures how two variables co-vary under chosen summary. It describes association, not causal direction. Pearson correlation captures linear co-movement. Spearman correlation applies Pearson calculation to ranks and captures monotonic ordering.

High correlation can arise because $X$ causes $Y$, $Y$ causes $X$, shared variable causes both, selection changes sample, or both drift with time. Global training step is common hidden clock: two unrelated metrics can correlate strongly because each trends through run.

## Reading contract

State coefficient type, sample unit, window, missing-value handling, weighting, and uncertainty. Plot paired observations before trusting scalar. Outliers, duplicated resume points, autocorrelation, and mixed run lineages can dominate result.

## Example

Policy entropy and mismatch move in opposite directions across one clean run lineage. Negative correlation summarizes that pattern. It does not prove whether mismatch narrowed policy, narrowing widened mismatch, or both followed training step.

## Why it matters here

Entropy, support, mismatch, clipping, and reward may co-drift. Correlation helps rank clues, but assigning a mechanism requires a causal argument. Controlled experiments strengthen that argument; observational identification also requires explicit assumptions about confounding, selection, and timing.

## Related terms

- [Pearson correlation](glossary://pearson-correlation)
- [Spearman rank correlation](glossary://spearman-rank-correlation)
- [Falsification test](glossary://falsification-test)
- [Run lineage](glossary://run-lineage)
