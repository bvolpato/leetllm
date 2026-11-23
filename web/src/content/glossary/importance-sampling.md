---
title: Importance sampling
importance: 82
---
**Importance sampling** reweights samples drawn from one probability distribution so they estimate an expectation under another. In policy optimization, data comes from rollout policy $\pi_{\mathrm{old}}$ while the learner evaluates current policy $\pi_\theta$.

The token-level weight is the policy ratio:

$$
w_t = \frac{\pi_\theta(a_t\mid s_t)}{\pi_{\mathrm{old}}(a_t\mid s_t)}
$$

At a fixed state $s_t$, multiplying an action-dependent quantity by $w_t$ corrects the conditional action distribution when the old policy has support wherever the target integrand is nonzero. The weight leaves the distribution of visited states or prefixes unchanged. A full trajectory expectation generally needs a product of action ratios (with matching initial-state and environment distributions), which can have much higher variance. See [Owen's importance-sampling chapter](https://artowen.su.domains/mc/Ch-var-is.pdf).

## Truncation and masking

Practical RL systems may clip ratios, cap sequence products, or mask outliers. These modifications generally introduce bias, so measure their effect on update quality and stability. [PPO](https://arxiv.org/abs/1707.06347) clips a surrogate objective using the advantage sign; it does not replace every ratio with a capped weight. If rollout policy assigns zero probability where target policy needs support, simple importance sampling can't recover missing behavior.

## Example

A token ratio of 1.2 increases its unmodified weighted contribution by 20 percent. A ratio of 50 can dominate a minibatch. For a fixed-state toy example, let the old action probabilities be $(0.9, 0.1)$ and the target probabilities $(0.5, 0.5)$. The weights are $(5/9, 5)$: a reward of 1 only for the second action has target expectation $0.1\times5=0.5$. Capping the second weight at 2 changes that expectation to 0.2, illustrating the bias introduced by a cap.

## Why it matters here

In asynchronous RL, record the actual rollout sampling probabilities, including any temperature or truncation, before computing learner-to-rollout ratios. Policy-ratio distributions help diagnose staleness, but deciding to enable, clip, or disable correction still requires evaluating the resulting learning objective and training behavior.

## Related terms

- [Policy ratio](glossary://policy-ratio)
- [PPO](glossary://ppo)
- [Asynchronous reinforcement learning](glossary://asynchronous-rl)
- [Rollout staleness](glossary://rollout-staleness)
- [Variance](glossary://variance)
