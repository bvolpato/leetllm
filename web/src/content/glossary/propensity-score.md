---
title: Propensity score
importance: 82
---
A propensity score is the probability that a unit receives a particular treatment given observed pre-treatment characteristics. For binary treatment, it is written $e(x)=P(T=1\mid X=x)$. Propensity scores summarize the observed assignment mechanism and can support matching, stratification, or inverse-probability weighting. Causal interpretation additionally needs a well-defined treatment and consistent outcomes, no unmeasured confounding given those characteristics, and positive probability of both treatments in the target population. Verify those assumptions and assess hidden confounding separately from fitting the score.

## Assignment and outcome probabilities

An assignment propensity estimates how likely a case was to receive an agent; an outcome probability estimates how likely the agent was to succeed. Inverse-probability weighting gives a treated outcome weight $1/e(x)$ and an untreated outcome weight $1/(1-e(x))$. Extreme propensities create unstable weights, and a propensity of zero or one means the missing action has no support in that stratum.


## Example

If high-risk tickets receive an agent with probability 0.8, an observed treated high-risk ticket receives inverse weight $1/0.8=1.25$. A high-risk control ticket receives weight $1/0.2=5$. That heavier control weight reflects its rarity. If the actual routing policy always assigns high-risk cases to the agent, the control probability is zero and logged data cannot estimate the untreated high-risk outcome through weighting alone.

## Why it matters here

Agent routing, recommendation exposure, and human-review escalation are rarely assigned uniformly. Propensity checks expose whether observational logs can support a causal comparison or whether a randomized experiment is needed.

## Related terms

- [Causal inference](glossary://causal-inference)
- [Confounder](glossary://confounder)
- [Off-policy evaluation](glossary://off-policy)
