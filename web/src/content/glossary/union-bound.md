---
title: Union bound
aliases: ["Boole's inequality"]
importance: 81
---

The union bound states that the probability of at least one event occurring is no greater than the sum of the individual event probabilities. For events $A_1,\ldots,A_m$, $P(\bigcup_i A_i)\le\sum_i P(A_i)$. It does not require the events to be independent. The bound can be loose when events overlap heavily, but it is useful when one guarantee must cover many candidate predictors simultaneously.

## Expand one-model control to a finite class

Combining a two-sided Hoeffding bound with a finite, independently fixed hypothesis class gives $P(\exists h:|\widehat L(h)-L(h)|\ge t)\le2|\mathcal H|e^{-2nt^2}$. Solving for $t$ introduces $\log|\mathcal H|$ into the uncertainty radius. Adaptive generation of the class after inspecting evaluation labels requires stronger analysis or fresh holdout data.

## Example

With 40 bounded independent cases and failure probability 0.05, one prespecified predictor has radius about 0.215. Searching 1,000 prespecified predictors increases the finite-class radius to about 0.364. This conservative adjustment accounts for selection opportunities. Evaluate the chosen prompt on fresh data to estimate its performance.

## Why it matters here

AI teams often compare many prompts or model versions using one benchmark. The union bound explains why a claim chosen from a larger search needs more evidence and why untouched final evaluation is usually clearer than recycling the selection set.

## Related terms

- [Hoeffding's inequality](glossary://hoeffding-inequality)
- [Hypothesis class](glossary://hypothesis-class)
- [Uniform convergence](glossary://uniform-convergence)
- [Sample complexity](glossary://sample-complexity)
