---
title: DSPy
aliases: ["DSPy prompt optimization"]
importance: 82
---
**DSPy** is a framework for describing language-model behavior as composable programs and improving those programs against an explicit evaluation metric. Instead of treating every prompt as an isolated handwritten string, a developer declares input-output signatures, modules, examples, and an optimization target.

## Programs and optimized artifacts have different jobs

A signature states the information a module receives and the fields it should produce. A module defines how a model carries out that transformation. An optimizer can search over instructions and demonstrations using examples and a metric; some DSPy optimizers also fine-tune model weights. The deployable result depends on which optimizer you ran.

For prompt optimization, the resulting instructions and demonstrations are a deployable artifact. Weight optimization also requires the resulting checkpoint or adapter. Keep training, validation, and final test examples separate; record the artifact version, model configuration, metric, and optimization budget; and promote changes only after held-out evaluation. Deployment should load that exact result rather than silently reoptimize on live traffic.


## Example

A support-answer program receives a question and retrieved policy passages, then emits an answer with citations. Its metric rejects unsupported claims, missing citations, and unauthorized recommendations. The optimizer tries candidate instructions and demonstrations on a development split.

One candidate improves development accuracy but fails a held-out prompt-injection case. The release gate rejects it. Another improves grounded answers without increasing unsafe actions, latency, or cost, so the team saves and deploys that exact artifact.

## Why it matters here

The prompt-optimization lesson treats model behavior as testable software rather than a sequence of manual prompt edits. DSPy makes optimization useful only when the metric represents the product, evaluation examples don't leak, and deployment preserves clear ownership of versioning, policy checks, rollback, and observability.

## Related terms

- [Optimizer](glossary://optimizer)
- [Evaluation gate](glossary://eval-gate)
- [Train, validation, and test split](glossary://train-validation-test-split)
- [Structured output](glossary://structured-output)
