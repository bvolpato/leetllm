---
title: Service-level agreement
aliases: ["SLA", "service level agreement"]
importance: 74
---
A **service-level agreement (SLA)** is a contractual or customer-facing commitment describing the level of service a provider promises to deliver. It usually specifies a measurable obligation, a measurement period, exclusions, and a remedy if the provider misses the commitment. An internal service-level objective can be stricter than the SLA because operators need room to detect and correct a regression before a customer-facing promise is violated.

## Contract, objective, and observation are separate

A service-level indicator is the measured quantity, such as the percentage of successful requests or the 95th-percentile time to first token. A service-level objective is the internal target for that indicator. The SLA is the agreement that describes which commitments apply to a customer and what remedy follows a missed commitment.

An incident-response assistant might promise monthly availability while separately tracking grounded-answer quality, answer latency, and safe refusal behavior. Those dashboard signals remain operational measures unless the agreement names them as commitments.


## Example

A hosted model provider promises 99.9% successful monthly requests under an enterprise SLA. Its serving team sets a tighter internal objective of 99.95%, monitors error rate across regions, and pages an operator before the customer commitment is exhausted. A separate product objective requires p95 time to first token under two seconds, but that latency target isn't part of the contract unless the agreement explicitly says so. When one region fails, the team can reroute traffic or roll back a release while tracking the affected customer's actual contractual measurement window.

## Why it matters here

MLOps, fleet serving, and support-assistant lessons discuss SLA estimates alongside latency objectives and rollback gates. Keeping the contractual promise distinct from internal SLOs prevents a model or dashboard from presenting an operational target as a legally binding customer guarantee.

## Related terms

- [Service-level objective](glossary://slo)
- [P95 latency](glossary://p95-latency)
- [Rollback](glossary://rollback)
- [Observability](glossary://observability)
