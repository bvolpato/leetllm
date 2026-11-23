---
title: Advantage
aliases: ["advantage function"]
importance: 88
---
An **advantage** estimates how much better or worse an action or trajectory was than a baseline for the same decision context. Positive advantage raises probability of selected policy actions; negative advantage lowers it, subject to clipping and other loss controls.

In a Markov decision process, $A^\pi(s,a)=Q^\pi(s,a)-V^\pi(s)$ compares expected return after action $a$ with the policy's average return at state $s$. It isn't raw immediate reward. An appropriate action-independent baseline can reduce policy-gradient variance without changing its expectation. PPO often estimates advantage using a learned value function; GRPO instead uses reward statistics from samples for the same prompt.

## Group-relative form

For rewards $r_1,\ldots,r_G$ in one group, a common GRPO estimate is:

$$
A_i = \frac{r_i-\bar r}{s_r+\epsilon}
$$

Here $\bar r$ is group mean, $s_r$ is group standard deviation, and $\epsilon$ prevents division by zero.

## Example

If eight RCA trajectories receive different scores, the strongest ones may get positive advantages while weaker investigations get negative values. If all rewards are equal, every normalized advantage is near zero.

## Why it matters here

The learner copies one outcome-level group advantage across many model-generated tokens. That makes reward ranking powerful but credit assignment coarse across a long multi-turn investigation.

## Related terms

- [GRPO](glossary://grpo)
- [Policy gradient](glossary://policy-gradient)
- [Reward function](glossary://reward-function)
- [Policy ratio](glossary://policy-ratio)
- [Variance](glossary://variance)
