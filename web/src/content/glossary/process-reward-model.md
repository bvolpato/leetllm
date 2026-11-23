---
title: Process reward model
aliases: ["PRM", "process reward models"]
importance: 83
---

A process reward model (PRM) scores intermediate reasoning steps, while an outcome evaluator assigns a score to the final answer. Its output can help a search controller reject an invalid derivation, prioritize promising partial work, or identify where a reasoning trace first went wrong. Its learned scores estimate validity for the kinds of steps and tasks on which the model has been validated.

## Step scoring versus outcome scoring

An outcome evaluator can mark `answer = 12` correct while overlooking a contradictory calculation earlier in the trace. A process evaluator examines the transition between partial states and can assign a low score immediately when the contradiction appears. Search then spends less computation extending that branch. If an exact tool can verify the step, the tool provides stronger evidence than an uncalibrated learned score.

Optimization pressure can exploit evaluator mistakes. Increasing the number of sampled branches gives the search more opportunities to find text that looks convincing to the PRM without actually solving the task. Held-out labels, calibration checks, exact verifiers, and disagreement analysis are necessary safeguards.

## Example

A deployment assistant proposes `error rate increased from 1% to 3%, therefore errors fell by two points`. A process evaluator should reject that arithmetic transition before the agent reaches an unsafe promotion recommendation. If a metrics query returns the actual before-and-after values, an exact comparison is even better. Fresh evidence, authorization checks, and an explicit release gate still govern the final decision, regardless of the intermediate score.

## Why it matters here

The reasoning-agent capstone combines branching, verification, adaptive compute, and side-effect controls. PRMs explain one way to rank partial candidates without pretending a reward-model score is ground truth. Distinguishing step supervision from outcome supervision helps diagnose search-quality regressions, reward hacking, and failure modes where longer reasoning merely produces more polished mistakes.

## Related terms

- [Reward model](glossary://reward-model)
- [Monte Carlo tree search](glossary://monte-carlo-tree-search)
- [Test-time compute](glossary://test-time-compute)
- [Calibration](glossary://calibration)
