---
title: Falsification test
aliases: ["falsifiable hypothesis test", "falsification experiment"]
importance: 78
kind: term
---
A **falsification test** is experiment designed so leading hypothesis can fail under clear observation. Before running it, state predicted outcome, variables held constant, success criterion, and result that would weaken or reject explanation.

Dashboard patterns found after an incident can generate hypotheses. A useful next experiment changes one suspected mechanism while preserving checkpoint, inputs, placement, precision, and measurement path.

## Designing a decisive test

Write the hypothesis and falsifier before looking at results. Make control and treatment consume the same test case when possible, record every held-constant field, and choose a metric envelope that separates meaningful change from ordinary run noise. A falsifiable test names outcomes that would weaken or reject the hypothesis.

## Example

```text
hypothesis: post-refresh lifecycle change widens parity tails
treatment: enable only that lifecycle change
control: keep prior lifecycle
held fixed: checkpoint, tokens, routes, build, precision, placement
prediction: treatment leaves known-good parity envelope
falsifier: control reproduces same divergence, or treatment stays inside envelope
```

Paired test cases reduce noise because both arms score the same work. Repeat when scheduler or hardware variability can dominate one observation. If two settings changed together, use a factorial split or isolate them in sequential tests; label a bundled result as a multi-factor comparison.

## Why it matters here

Trainer-versus-rollout reports often identify a unique configuration differential and strong correlations. Those facts make a hypothesis actionable; a falsification test adds evidence another engineer can challenge and reproduce.

## Related terms

- [A/B testing](glossary://ab-testing)
- [Correlation](glossary://correlation)
- [test case](glossary://fixture)
- [Run lineage](glossary://run-lineage)
