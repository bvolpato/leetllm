---
title: Inverse propensity scoring
importance: 81
---

Inverse propensity scoring (IPS) adjusts an observed outcome by the probability that the logging policy exposed the associated item or action. It is commonly used to study ranking or recommendation changes from historical interaction logs when higher-ranked items were more likely to be seen and clicked. Reweighting can reduce exposure bias under explicit assumptions; it cannot recover evidence for actions that had zero probability of being shown.

## Support and unstable weights

For contexts $x_i$, logged actions $a_i$, rewards $r_i$, and logging propensities $p_i$, a policy-value estimator is $\hat V=(1/n)\sum_i [\pi(a_i\mid x_i)/p_i]r_i$, where $\pi$ is the policy being evaluated. For a deterministic target policy, its numerator is one for matching actions and zero otherwise. Weighting by $1/p_i$ alone omits that target-policy condition.

Correct application requires accurate propensities, support wherever the target policy assigns probability, and rewards whose meaning remains consistent between logging and evaluation. Logged contexts must capture the relevant selection process. IPS itself doesn't require a fitted reward model; doubly robust estimation adds one. Very small propensities produce high-variance weights. Clipping or self-normalization can improve stability while introducing a bias tradeoff.


## Example

A relevant document appears in the top search slot with probability 0.8, while another document is explored with probability 0.1. A click on the explored document receives weight $1/0.1=10$; a click on the common document receives weight $1/0.8=1.25$. Those weights correct unequal exposure only if the probabilities are accurate. A document never shown has propensity zero and supplies no direct historical evidence for its potential click behavior.

## Why it matters here

Ranking systems create feedback loops because yesterday's ordering influences today's clicks. IPS clarifies why observational clicks are not unbiased relevance labels and why trustworthy offline policy evaluation needs logged propensities, controlled exploration, variance monitoring, and safe online confirmation.

## Related terms

- [Position bias](glossary://position-bias)
- [Candidate generation](glossary://candidate-generation)
- [A/B testing](glossary://ab-testing)
