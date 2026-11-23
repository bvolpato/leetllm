---
title: Chain of thought
aliases: ["CoT", "chain-of-thought reasoning"]
importance: 90
---
**Chain of thought (CoT)** is a sequence of intermediate reasoning steps that connects a problem statement to a proposed answer. A system can make such steps visible in its output, maintain them inside an application-controlled scratchpad, or rely on a model's internal reasoning without exposing its private computation.

## Verify visible explanations against the task

For some models and tasks, asking for intermediate steps improves arithmetic, symbolic reasoning, or multi-step decisions by allocating additional inference-time work. Check each explanation against the task: fluent text can contain an invented premise, omit an authorization check, or rationalize an answer reached for another reason.

Modern reasoning-model guidance can also differ from older prompting recipes. A model trained to reason internally may perform better with a direct objective, explicit constraints, and a requested answer format than with a demand to print every private reasoning step. Measure the actual task instead of assuming that longer visible explanations imply stronger reasoning.


## Example

A policy assistant receives an 18-day-old access-key request. Its auditable answer cites the 14-day rotation rule, identifies the required ticket, and recommends denying continued use until rotation succeeds. The trusted application separately checks the policy source, ticket state, and caller permissions.

If a reasoning model can produce that citation-backed result without revealing hidden thought text, request the concise evidence and decision. Don't treat an unverified narrative or disclosed internal reasoning as an authorization boundary.

## Why it matters here

Applied prompting lessons compare one reasoning path, multiple sampled answers, and bounded search. Chain of thought establishes the smallest unit of extra test-time work while keeping correctness, privacy, cost, and runtime authorization separate from the model's explanation.

## Related terms

- [Test-time compute](glossary://test-time-compute)
- [Structured output](glossary://structured-output)
- [Tool calling](glossary://tool-calling)
- [Evaluation gate](glossary://eval-gate)
