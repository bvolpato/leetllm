---
title: Hoeffding's inequality
aliases: ["Hoeffding inequality", "Hoeffding bound"]
importance: 84
---

Hoeffding's inequality bounds the probability that an average of independent bounded random variables differs from its expected value. For independent losses in $[0,1]$, a fixed predictor, $n\ge1$ examples, and $t>0$, $P(|\widehat L-L|\ge t)\le2\exp(-2nt^2)$, where $L=\mathbb E[\widehat L]$. With identically sampled examples, this is the predictor's population risk; independence alone allows different expected losses across observations. The factor of two comes from bounding both upward and downward deviations. A one-sided bound drops that factor.

## Translate a confidence requirement into a radius

Setting the two-sided failure probability to $\delta\in(0,1)$ gives radius $\sqrt{\log(2/\delta)/(2n)}$. The statement requires independent bounded observations and a predictor fixed independently of the data used for the bound. Selecting the best prompt after inspecting those same labels violates the simple fixed-predictor argument.

## Example

A frozen request router fails four of 40 independently sampled cases. Its observed risk is 0.10. With $\delta=0.05$, the two-sided Hoeffding radius is approximately 0.215, giving a conservative upper risk of 0.315 under the stated assumptions. The true risk can be lower.

## Why it matters here

Small agent benchmarks can produce persuasive but unstable scores. Hoeffding's inequality makes sample-size limits concrete while exposing the independence, bounded-loss, and fixed-model assumptions that repeated prompt search or correlated retries can break.

## Related terms

- [Concentration inequality](glossary://concentration-inequality)
- [Empirical risk](glossary://empirical-risk)
- [Population risk](glossary://population-risk)
- [Union bound](glossary://union-bound)
