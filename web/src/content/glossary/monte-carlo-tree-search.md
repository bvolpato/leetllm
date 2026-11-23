---
title: Monte Carlo tree search
aliases: ["MCTS"]
importance: 80
---

Monte Carlo tree search (MCTS) allocates a limited evaluation budget across a tree of possible decisions. Each iteration selects a promising partial path, expands a candidate child, estimates that child's value, and propagates the result back toward the root. Repeated visits let the algorithm concentrate work on useful branches while still exploring alternatives. In language-model reasoning, nodes can represent partial plans, intermediate tool evidence, or incomplete derivations.

## Selection, expansion, evaluation, and backup

A tree policy balances exploitation of high observed value against exploration of under-visited choices. A common UCT score is $Q(s,a)+c\sqrt{\ln N(s)/N(s,a)}$ for already visited actions: $Q$ is mean backed-up return, $N(s)$ is parent visits, and $N(s,a)$ is action visits. Handle unvisited actions separately, commonly by exploring each once. PUCT variants also incorporate a model-provided prior probability. Exact formulas depend on the implementation, reward scale, and legal action set. Classical MCTS estimates leaves through sampled simulated continuations; modern variants may use learned value estimates or verifiers instead. The [original UCT paper](https://aima.eecs.berkeley.edu/~russell/classes/cs294/s11/readings/Kocsis%2BSzepesvari%3A2006.pdf) separates search simulation from execution of the final chosen action.


Search quality depends on the evaluator and the available action set. Repeating a biased learned score thousands of times does not create verified evidence. Tool results must be fresh, actions with side effects require trusted authorization, and rollout budgets must include both model tokens and external calls.

## Example

A planning prototype compares simulated release outcomes for promote, hold, and roll back from the same verified canary state. Search does not actually promote or roll back on every visit. Suppose two branches have $Q=0.8$ after ten visits and $Q=0.6$ after two visits, the parent has twelve visits, and $c=0.5$. Their UCT scores are approximately $1.049$ and $1.157$, so the less-visited branch is explored next despite its lower mean return. A bounded simulator estimates the continuation and backs up its reward. If live metrics are unavailable or the simulator is unvalidated, that score cannot authorize a production action; the controller retains uncertainty and applies its trusted fail-closed policy.

## Why it matters here

The reasoning-agent lesson compares single-path decoding, best-of-N sampling, beam search, and adaptive tree search. MCTS explains when revisiting a promising partial state can be more efficient than fixed-width expansion. It also exposes the operational costs that polished search diagrams often omit: evaluator calls, prefix-cache growth, branch isolation, policy enforcement, and explicit termination.

## Related terms

- [Beam search](glossary://beam-search)
- [Process reward model](glossary://process-reward-model)
- [Test-time compute](glossary://test-time-compute)
- [Reward model](glossary://reward-model)
