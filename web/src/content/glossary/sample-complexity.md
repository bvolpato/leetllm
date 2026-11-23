---
title: Sample complexity
importance: 85
---

Sample complexity is the number of observations required to support a specified learning or evaluation guarantee under explicit assumptions. Its value depends on the desired error tolerance, allowed failure probability, hypothesis-class complexity, loss range, and whether observations are actually independent draws from the target population. Assess a row count against those assumptions and the target guarantee to determine whether it supplies sufficient evidence.

## Turn a target guarantee into an evidence requirement

For a prespecified finite hypothesis class and independent identically distributed examples with losses in $[0,1]$, Hoeffding's inequality plus a union bound gives the sufficient condition $n\ge\log(2|\mathcal H|/\delta)/(2t^2)$. Here $t>0$ is the permitted empirical-to-population risk deviation and $0<\delta<1$ the simultaneous failure probability. For losses in $[a,b]$, multiply the numerator by $(b-a)^2$. Unbounded losses need other assumptions. Smaller tolerated errors increase the required sample quadratically in this bound.

## Example

Consider 1,000 prespecified prompt candidates, allowed failure probability 0.05, and target error radius 0.05. The finite-class calculation requires $\lceil\log(40000)/(2\cdot0.05^2)\rceil=2120$ independent cases. Under these assumptions, 2,120 cases satisfy the conservative bound. A different candidate set or evaluation protocol can require a different sample size; freezing the winner before an independent test may require fewer cases.

## Why it matters here

Benchmark-driven model search becomes unreliable when the same small set supports candidate selection and final release claims. Sample-complexity calculations expose that mismatch and help decide whether to narrow the search, gather more labeled cases, or reserve an untouched test set.

## Related terms

- [Hoeffding's inequality](glossary://hoeffding-inequality)
- [Union bound](glossary://union-bound)
- [Hypothesis class](glossary://hypothesis-class)
- [PAC learning](glossary://pac-learning)
