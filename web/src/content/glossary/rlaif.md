---
title: RLAIF
aliases: ["Reinforcement Learning from AI Feedback"]
importance: 81
---
**Reinforcement Learning from AI Feedback (RLAIF)** uses AI-generated preferences, critiques, labels, or scores as feedback for policy optimization. Feedback source and optimizer are independent choices: RLAIF can use a reward model plus PPO, GRPO-style scalar rewards, or another RL method.


## Benefits

- Scales labeling beyond human-only throughput.
- Applies a versioned rubric at scale, with task-dependent consistency and cost.
- Generates dense critiques or comparisons.

## Risks

- Judge bias and self-preference.
- Reward hacking and verbosity shortcuts.
- Correlated policy/judge errors.
- Model-version drift.
- Sensitive trajectory exposure to judge service.

Use deterministic verifier where truth is executable. Calibrate AI feedback against blinded human sample, track disagreement and variance, freeze evaluator version, and keep judge isolated from candidate-controlled files.

## Example

AI judge compares two RCA conclusions for correctness and grounding. Preferences train reward model, then policy. Human audit measures judge bias and catches fabricated-evidence shortcut.

## Why it matters here

RLAIF scales feedback collection. The judge then becomes part of the training objective and security boundary, so evaluator drift can change model behavior while optimizer configuration stays fixed.

## Related terms

- [RLHF](glossary://rlhf)
- [RLVR](glossary://rlvr)
- [Reward model](glossary://reward-model)
- [Model judge](glossary://model-judge)
- [Evaluation science](glossary://evaluation-science)
