---
title: Reward function
importance: 90
---
A **reward function** maps an action and its environment context, or a completed trajectory, to a scalar training signal. It can combine deterministic checks, environment outcomes, model judges, formatting rules, and penalties. A safety penalty adjusts the optimizer's preference; enforce permissions at the action boundary.

Reward is a specification. Whatever it measures becomes the behavior GRPO can optimize, including accidental shortcuts. A high-quality reward should rank trajectories in the same order as the real product objective and remain hard to game.

## Composite rewards

A composite reward uses weighted components:

$$
R = \sum_j w_j r_j - \sum_k \lambda_k p_k
$$

Weights control relative influence, while component scales determine whether those weights mean what operators expect. Logging each component is mandatory for diagnosing reward hacking.


## Example

In a hypothetical setup, normalized RCA quality, grounding, and exhaustiveness receive weights 0.70, 0.15, and 0.15, then tool-error and failed-submission penalties are subtracted. Two correct diagnoses can still rank differently based on evidence and investigation breadth. These coefficients illustrate one setup; they do not describe a running trainer.

## Why it matters here

Trainer throughput is wasted if rewards are slow, noisy, or misaligned with evaluation. Component distributions and reward-eval correlation matter as much as mean reward.

## Related terms

- [Model judge](glossary://model-judge)
- [Reward model](glossary://reward-model)
- [GRPO](glossary://grpo)
- [Trajectory evaluation](glossary://trajectory-evaluation)
- [Root cause analysis](glossary://root-cause-analysis)
