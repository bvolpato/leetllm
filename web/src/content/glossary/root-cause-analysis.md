---
title: Root cause analysis
aliases: ["RCA"]
importance: 67
---
**Root cause analysis (RCA)** is a structured investigation that traces an observed failure through its immediate mechanism to an actionable underlying cause. A latency alert is a symptom. Database connection timeouts may be a proximate cause. Network throttling or a failed dependency can be the root cause.

Good RCA combines causal depth with evidence. It checks telemetry, tests alternative hypotheses, separates correlation from mechanism, and records which component failed and how that failure propagated.

## Causal chain

An investigation can represent its reasoning as symptom → immediate cause → deeper causes → terminal cause. Identify the mechanism behind a report such as "service is slow," and support each additional causal hop with evidence.


## Example

An agent sees checkout latency, finds connection timeout logs, verifies database CPU is normal, and observes a sharp network-connect delay. Treat network throttling as the current hypothesis. DNS, connection-pool saturation, server accept queues, or other path failures may produce similar symptoms. Inspect the relevant limits and traces, and test recovery after a controlled repair before treating the chain as established.

## Why it matters here

RCA quality can be a component of an agent-training reward. Ground each claimed hop in fetched evidence, distinguish confirmed causes from hypotheses, and represent multiple interacting contributing conditions when the evidence supports them.

## Related terms

- [Observability](glossary://observability)
- [Tracing](glossary://tracing)
- [Model judge](glossary://model-judge)
- [Trajectory evaluation](glossary://trajectory-evaluation)
- [Tool calling](glossary://tool-calling)
