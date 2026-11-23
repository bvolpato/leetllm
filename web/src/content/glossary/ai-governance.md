---
title: AI governance
importance: 84
---
**AI governance** assigns ownership, evidence, approvals, controls, monitoring, incident response, and retirement rules across AI-system lifecycle.

It turns “model seems ready” into accountable decision:

- Intended and prohibited use
- Risk classification
- Data, model, and tool ownership
- Evaluation and safety evidence
- Approval and rollback source of truth
- Monitoring and incident process
- Versioning, deprecation, and retirement

Governance isn't one committee or document. Executable [policy gates](glossary://policy-gate), access controls, artifact manifests, audit records, promotion checks, and kill switches enforce it.

## Governance loop

Governance starts before training by naming owner, intended users, prohibited uses, data source of truth, and measurable risk tolerance. Promotion then requires versioned evidence rather than informal confidence. Operation adds access logs, drift and incident signals, periodic review, and rollback source of truth. Retirement removes endpoints, credentials, copies, and dependent workflows according to recorded policy.

Each decision needs subject, approver, evidence version, outcome, timestamp, and expiry. Expiry matters because model, data, tools, evaluators, laws, and threat environment change. Previous approval shouldn't silently authorize materially different checkpoint or tool surface.

## Example

Post-training candidate can deploy only after data license review, hidden-eval gain, safety/retention gates, checkpoint restore, tool permission review, and named approver. Any failed critical gate blocks promotion even when reward rises.

## Why it matters here

Training system spans models, tools, data, judges, infrastructure, and people. Governance keeps each perimeter owned, reviewable, reversible, and auditable.

## Related terms

- [Data governance](glossary://data-governance)
- [Model card](glossary://model-card)
- [Risk register](glossary://risk-register)
- [Audit trail](glossary://audit-trail)
- [Human in the loop](glossary://human-in-the-loop)
