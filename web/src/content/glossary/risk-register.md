---
title: Risk register
importance: 74
---
A **risk register** is a living, owned inventory of identified risks for a system or product: what can go wrong, how severe and likely it is, who owns it, which controls reduce it, what residual risk remains after those controls, and when it is reviewed next. Maintain it as the working ledger that turns AI risks into prioritized engineering and release decisions.

In classical project and enterprise risk practice (PMI risk management, ISO 31000-style risk treatment), the register is the durable output of *identify*, *analyze*, *evaluate*, and *treat*. In AI systems the same artifact holds, but the risk list must cover model and data behavior that generic IT registers miss: [prompt injection](glossary://prompt-injection), tool abuse, eval contamination, silent quality regressions after prompt changes, provider policy shifts, and cross-tenant leakage through retrieval or agents.

## Intuition

Think of three nested questions for every serious AI surface:

1. **What fails?** Name a concrete event, such as "agent deploys another tenant's artifact."
2. **How bad, and how often, before and after controls?** Inherent risk is the exposure with no (or only assumed) controls. Residual risk is what remains after named mitigations are in place and evidenced.
3. **Who owns the next decision?** Assign an owner and review trigger so the row guides an accountable risk decision.

NIST's AI Risk Management Framework (AI RMF 1.0) organizes this work as four continuous functions: **Govern**, **Map**, **Measure**, and **Manage**. The register is where Map and Measure land as rows, and where Manage becomes assigned treatment, monitoring, and resource allocation. Govern sets who may accept residual risk and how reviews escalate.

## How it works

### Row fields that reviewers can use

A useful row is specific enough that a release reviewer or incident commander can act without re-interviewing the author.

| Field | Purpose |
| --- | --- |
| Risk ID | Stable handle for tickets, evals, and audit (`RR-014`) |
| Risk statement | Cause → event → effect in plain language |
| Category | Security, safety, privacy, reliability, fairness, supply chain, cost, compliance |
| Trigger | Conditions that make the risk active (new tool, new data source, prompt change) |
| Inherent likelihood / impact | Before or without credit for the control plan |
| Controls / mitigations | Named technical and process controls (not "be careful") |
| Evidence | Links to red-team cases, eval gates, traces, policy versions, tickets |
| Residual likelihood / impact | After controls, with honesty about what still fails |
| Owner | Named role or person who can change the system |
| Status | Open, mitigated, accepted, transferred, monitoring |
| Next review / triggers | Date and event-based refresh (incident, launch, vendor change) |

Response strategies for threats follow the usual set: **avoid** (do not ship the capability), **mitigate** (lower likelihood or impact), **transfer** (insurance, vendor contract, shared duty), or **accept** (document residual risk and who accepted it). Secondary risks introduced by the response (for example, a safety filter that blocks legitimate support answers) get their own rows or notes.

### Score risks with a qualitative matrix

Teams usually score likelihood $L$ and impact $I$ on a shared ordinal scale (often $1$–$5$). A simple prioritization score is the product used in many qualitative matrices:

$$
S = L \times I
$$

After controls, re-score residual likelihood $L'$ and residual impact $I'$:

$$
S_{\text{residual}} = L' \times I'
$$

Impact often stays high when the failure mode is catastrophic (unauthorized production promote, cross-tenant export) even if likelihood drops. That split is intentional: filters and gates reduce *how often* the bad event happens; they do not make an unauthorized promotion harmless. Do not invent floating-point "risk dollars" unless you have real loss data. The matrix exists so two engineers and a reviewer get the same priority order from the same row.

Map scores to action bands your org actually funds (example only; calibrate to your risk appetite):

Ordinal products are not expected loss: equal products can hide very different likelihoods and consequences, and catastrophic impacts may need separate escalation rules.

| Band | Typical $S$ on a $1$–$5$ scale | Expectation |
| --- | --- | --- |
| Low | $1$–$4$ | Monitor; cheap controls optional |
| Medium | $5$–$9$ | Owner + mitigation plan + review date |
| High | $10$–$16$ | Block or tightly gate release until residual drops |
| Critical | $20$–$25$ | Avoid or heavy mitigations + executive acceptance of residual |

### Lifecycle loop

1. **Map** the system: actors, data flows, tools, tenants, model providers, eval surfaces, and irreversible side effects.
2. **Identify** risks from threat models, [red team](glossary://red-team) findings, incidents, OWASP-style LLM catalogs (prompt injection, sensitive disclosure, supply chain, excessive agency, and so on), and reliability failure modes.
3. **Measure** likelihood and impact; attach evidence (harness results, traces, incident rates).
4. **Treat** with controls: [policy gates](glossary://policy-gate), [guardrails](glossary://guardrail), [action allowlists](glossary://action-allowlist), sandboxes, [eval gates](glossary://eval-gate), [kill switches](glossary://kill-switch), least privilege, multi-provider failover.
5. **Record residual risk** and acceptance if any; schedule review.
6. **Refresh** after incidents, red teams, major launches, model or prompt version changes, and vendor policy changes.

A static register written once for an audit is theater. A living register is updated when the system changes.

## Example

Repository agent with RAG over issues and tools `search_repo`, `draft_patch`, and `deploy_canary`. One register slice:

| Field | Row |
| --- | --- |
| Risk ID | `RR-PI-deploy-01` |
| Statement | Untrusted retrieved issue text injects instructions so the agent proposes `deploy_canary` for another tenant's release |
| Category | Security / privacy |
| Trigger | New issue corpus, weaker ACL filter, or broader deployment tool scope |
| Inherent $L$, $I$ | $4$, $5$ → $S = 20$ (critical) |
| Controls | Tenant ACL on retrieval; treat retrieved text as untrusted; [policy gate](glossary://policy-gate) on project, artifact SHA, and canary weight; action allowlist; human approval; red-team suite for injection via issues |
| Evidence | Attack-trace report v12, policy version `deploy-v3`, eval gate `safety-injection` green on suite commit `a3f9…` |
| Residual $L'$, $I'$ | $2$, $5$ → $S' = 10$ (high): impact still catastrophic if a case slips through |
| Owner | Model platform release owner |
| Status | Mitigated, monitoring |
| Next review | After next tool-scope change, or quarterly |

Scoring the same row in code keeps prioritization reproducible in reviews and release gates:

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class RiskRow:
    risk_id: str
    owner: str
    likelihood: int
    impact: int
    residual_likelihood: int
    residual_impact: int
    evidence: tuple[str, ...]

    def inherent_score(self) -> int:
        return self.likelihood * self.impact

    def residual_score(self) -> int:
        return self.residual_likelihood * self.residual_impact


row = RiskRow(
    risk_id="RR-PI-deploy-01",
    owner="model-platform-release-owner",
    likelihood=4,
    impact=5,
    residual_likelihood=2,
    residual_impact=5,
    evidence=("attack-trace-v12", "deploy-v3-policy", "safety-injection-a3f9"),
)

assert row.inherent_score() == 20
assert row.residual_score() == 10
assert row.owner and row.evidence
```

Other rows on the same product might include: model-provider outage (reliability, multi-provider failover), reward-hacking of an LLM-as-judge eval (quality/governance, golden suite + human sample), quota exhaustion at peak (cost/reliability, load shedding + fair-use limits), and silent citation regression after a prompt tweak (quality, eval gate on groundedness). Generic "cloud outage" lists without AI-specific rows leave the real production failures unowned.

## What fails in production

- **Ceremonial rows:** no owner, empty evidence, no review date. They cannot block a release or drive a fix.
- **Theme soup:** "hallucination" without a user harm path, trigger, or control. Reviewers cannot prioritize themes.
- **Controls without mediation:** a documented filter that does not sit on every path that can cause the side effect (retries, webhooks, admin tools).
- **Residual impact marked "low" because a filter exists.** If the event is still catastrophic when it happens, residual impact stays high; only residual likelihood should drop.
- **Stale after ship:** prompt, tool, or corpus changes land without reopening related rows, so the register diverges from the running system.

## Why it matters here

AI/ML/LLM products fail in ways unit tests and uptime SLOs do not capture. A risk register is how platform, security, and product teams share one prioritized list of those failure modes, attach owners and evidence, and decide what must be mitigated before traffic, what can be accepted with monitoring, and what must trigger a kill switch or rollback when evidence flips. Without it, safety and reliability stay as hallway anxiety; with it, they become scheduled, gated engineering work.

## Related terms

- [Red team](glossary://red-team)
- [Policy gate](glossary://policy-gate)
- [Eval gate](glossary://eval-gate)
- [Audit trail](glossary://audit-trail)
- [Incident command](glossary://incident-command)
