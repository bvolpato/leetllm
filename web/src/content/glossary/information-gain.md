---
title: Information gain
importance: 77
---

Information gain measures a reduction in uncertainty. For a decision-tree split, it is the parent label entropy minus the sample-size-weighted entropy of its child nodes. A larger gain makes the observed child labels more predictable; held-out evaluation establishes predictive value on new examples.

## Entropy and weighted children

For class probabilities $p_c$, entropy is $H=-\sum_c p_c\log_2p_c$, with zero-probability terms treated as zero. A split has gain $H(parent)-\sum_j(n_j/n)H(child_j)$. With sample weights, use child weight divided by parent weight instead of $n_j/n$. The logarithm base determines units; base two gives bits. Gini impurity produces a related impurity decrease, rather than entropy-based information gain. See [scikit-learn's tree formulation](https://scikit-learn.org/stable/modules/tree.html#mathematical-formulation).


## Example

Eight access requests contain four review-required and four automatic cases, giving parent entropy one bit. A feature threshold produces five requests with one positive and four negatives, plus three requests that are all positive. The pure three-request child has entropy zero. The mixed child has entropy approximately 0.722 bits. Weighted child entropy is $(5/8)(0.722)+(3/8)(0)\approx0.451$, so information gain is approximately 0.549 bits.

A multiway split on eight unique request IDs would produce eight pure singleton children and gain the full one bit. It memorizes the observed IDs; held-out evaluation determines whether those IDs predict future labels. Minimum leaf sizes, depth limits, and pruning constrain this failure; binary trees can likewise isolate cases through enough successive splits.

## Why it matters here

Tree lessons compare possible thresholds rather than accepting a learned branch as a mysterious rule. Information gain clarifies how entropy-based splits differ from Gini-based splits, why child sizes matter, and why a locally informative partition still needs held-out validation.

## Related terms

- [Decision tree](glossary://decision-tree)
- [Gini impurity](glossary://gini-impurity)
- [Cross-entropy](glossary://cross-entropy)
