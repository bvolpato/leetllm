---
title: Policy clipping
aliases: ["clipped-token fraction", "policy-ratio clipping", "clip fraction", "clip ratio"]
importance: 84
kind: term
---
**Policy clipping** limits influence of sampled actions whose current-to-rollout probability ratio moves outside configured region. PPO clamps ratio inside a clipped surrogate. Other objectives may mask tokens, use asymmetric bounds, or select a different branch based on advantage sign, so inspect the objective to understand what “clipping enabled” means.

For policy ratio $\rho_t$ and lower and upper bounds $\ell,u$, hard-mask variant might use

$$
m_t^{\text{clip}} = \mathbf{1}[\ell < \rho_t < u].
$$

PPO-Clip instead maximizes the surrogate contribution

$$
L_t=\min\bigl(\rho_t A_t,\;\operatorname{clip}(\rho_t,1-\epsilon,1+\epsilon)A_t\bigr),
$$

with the rollout advantage $A_t$ held fixed. For $A_t>0$, the contribution saturates above $1+\epsilon$; for $A_t<0$, it saturates below $1-\epsilon$. Ratios outside the opposite boundary still receive a corrective gradient. A gradient update can still move the policy outside the clipping interval. See the [PPO paper](https://arxiv.org/abs/1707.06347) and [surrogate explanation](https://spinningup.openai.com/en/latest/algorithms/ppo.html).

## Metrics

Report low-side and high-side fractions separately, split by advantage sign and token role. A scalar “clip ratio” often means fraction of eligible tokens where clip or mask activates, not policy ratio itself. Also log effective gradient-token fraction, since modest global clip rate can remove rare but important tool or conclusion tokens.

Policy clipping differs from [gradient clipping](glossary://gradient-clipping). Policy clipping changes objective contribution before backward. Gradient clipping rescales parameter gradients after backward.

## Example

For bounds $[0.8,1.2]$ and ratio $0.6$, a hard mask drops the token regardless of advantage. PPO-Clip with $A_t=+1$ selects $\min(0.6,0.8)=0.6$ and still encourages increasing probability; with $A_t=-1$, it selects $\min(-0.6,-0.8)=-0.8$ and saturates. The same out-of-range ratio therefore has different gradient behavior depending on objective and advantage sign.

## Why it matters here

Widening trainer-versus-rollout tails can increase clipping even while mean policy ratio stays near one. Clipping may protect update, but it can also discard growing share of learning signal and hide parity fault.

## Related terms

- [PPO](glossary://ppo)
- [Policy ratio](glossary://policy-ratio)
- [Policy mismatch](glossary://policy-mismatch)
- [Gradient clipping](glossary://gradient-clipping)
