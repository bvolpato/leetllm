---
title: Bellman equation
importance: 88
---

A Bellman equation expresses the value of a sequential decision as immediate reward plus discounted expected future value. It turns a long-horizon return into a recursive relationship over adjacent states. Bellman expectation equations evaluate a fixed policy, while Bellman optimality equations choose the best available action at each state.

## Expectation before optimization

For an optimal state value, $V^*(s)=\max_a\sum_{s'}P(s'\mid s,a)[R(s,a,s')+\gamma V^*(s')]$. Each action's possible outcomes must first be averaged using their transition probabilities. Only after computing that expectation can the agent compare actions. Replacing uncertain outcomes with their most favorable successor silently assumes away the failure probability.

## Example

Requesting evidence costs four points. With 90% discounting, certain evidence yielding a future value of 70 gives $-4+0.9(70)=59$. Direct human review costs eighteen points and leads to future value 80, giving $-18+0.9(80)=54$. Evidence wins under certainty. If evidence instead arrives only half the time and abandonment yields zero, the evidence action becomes $-4+0.9(0.5)(70)=27.5$, so human review wins.

## Why it matters here

Bellman backups explain value iteration, temporal-difference updates, and the effect of failure branches in agent workflows. They also prevent optimistic policy evaluations from confusing the best possible trajectory with the expected return across realistic outcomes.

## Related terms

- [Markov decision process](glossary://markov-decision-process)
- [Q-learning](glossary://q-learning)
- [Reward function](glossary://reward-function)
