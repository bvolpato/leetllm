---
title: Incident command
importance: 72
---
**Incident command** is the single accountable operating role that coordinates owners, facts, hypotheses, actions, communication, and follow-up during an outage or high-severity failure. The person in that role is the **incident commander** (IC). The IC keeps shared state coherent while specialists investigate stack traces, so the response converges and avoids uncoordinated changes.

The pattern comes from the public-safety [Incident Command System (ICS)](https://training.fema.gov/nims/) and was adapted for production systems by [Google SRE](https://sre.google/sre-book/managing-incidents/) (**IMAG**: Incident Management at Google) and other engineering organizations. Google's [incident-response workbook](https://sre.google/workbook/incident-response/) frames the goals as the **3Cs**: **coordinate**, **communicate**, and **control**. [PagerDuty's IC guide](https://response.pagerduty.com/training/incident_commander/) supplies a concrete technical response process.

## Intuition

Under pressure, smart people default to debugging. Without command, that becomes parallel investigation, uncoordinated production changes, and stakeholder chaos. Incident command separates **what must stay true in the room** (impact, theory, owners, deadlines, next update) from **who turns knobs** (ops) and **who talks outward** (comms). The IC holds every role not yet delegated, then peels work off so no one person is both deep in logs and fielding VP questions.

PagerDuty’s one-line purpose for the IC is useful: keep the incident moving toward resolution. That means time-boxed tasks assigned to named people, backup plans ready if the current theory fails, and explicit transfer of command when fatigue or expertise requires it.

## How it works

A minimal, scalable structure (Google IMAG / ICS-derived):

| Role | Focus |
|------|--------|
| **Incident commander (IC)** | High-level state, priorities, delegation, decision authority, living incident document |
| **Operations / Ops lead** | Only group that should modify the system; applies mitigations and diagnostics |
| **Communications lead** | Stakeholder and user updates, status page, intake of external noise |
| **Planning / scribe** (optional) | Timeline, action log, handoffs, bugs, dinner, shift relief |

**Declare early.** One team's triggers in Google's SRE book are customer-visible impact, a second team needed, or an issue unsolved after an hour of focused work. Use these as examples when defining local triggers; during obvious harm, declare immediately. Declaring a short-lived incident is cheaper than discovering at hour four that nobody owns coordination.

**Stabilize before root-causing.** Priority order during active harm: stop the bleeding, restore service (or a safe degraded mode), preserve evidence. Full root cause is a post-mitigation job unless it is already obvious.

**Cadence.** Size up symptoms and scope; pick actions with named owners and time boxes; poll for strong objections then decide; update responders and stakeholders on a clock; verify mitigation against user-visible signals; hand off command with an explicit acknowledgment.


## Example

**Hypothetical LLM chat-serving incident.** At 14:12, p95 [TTFT](glossary://ttft) jumps from ~800 ms to >8 s for the interactive chat route. Error rate is only mildly up; [SLO](glossary://slo) burn is mostly latency. Alerts fire for gateway queue depth and one provider's 429 rate. Classify severity using the organization's impact criteria and these supporting metrics.

1. **IC names impact in one sentence:** "Interactive chat p95 TTFT > 8s, ~40% of chat QPS; tool-calling and batch jobs not yet confirmed."
2. **Ops (one person):** roll back the last model [provider route](glossary://provider-route) / canary weight to the previous known-good alias (single owner, 5-minute check-in). Another ops path inspects KV-cache hit rate, continuous-batching queue, and GPU utilization. Responders act autonomously within their delegated scope and coordinate changes through the Ops lead; changes outside that scope need an explicit decision.
3. **Comms:** draft internal status ("elevated latency on chat answers; investigation open; next update 14:27") so product and support stop DMing ops mid-debug.
4. **Document:** start time, severity, user impact, current theory ("provider throttling after model route expand"), active actions with owners, next update time, stop condition ("p95 TTFT < 1.5s for 15 minutes on chat").
5. **Mitigation lands:** route weight restored; TTFT recovers. IC freezes further route expands, assigns follow-up for provider quotas and canary stop rules, and schedules the postmortem. Root cause (under-provisioned provider quota at the new weight) is confirmed after user impact is gone.

Without command, three engineers might simultaneously roll back the binary, purge the prefix cache, and raise max concurrent sequences, while a fourth deploys a "quick" prompt change. That is freelancing: the failure mode Google’s unmanaged-incident story is built to prevent.

## Shared state the IC keeps

Capture decisions as they happen. The log is the postmortem spine and stops re-litigating "what we tried."

| Field | Why it matters for AI systems |
|-------|--------------------------------|
| User impact + severity | Prioritizes work by [SLO](glossary://slo) impact and error budget |
| Current theory + competing hypotheses | Focuses tests without treating an unverified theory as fact |
| Owner per action + time box | Avoids bystander effect ("can someone…") |
| Next update time | Cadence for stakeholders and status page |
| Decision log | Rollbacks, flags flipped, thresholds, cache purges, traffic splits |
| Stop / success condition | When to stop thrashing and declare mitigated |
| AI context | Model / route id, prompt or policy version, retrieval index, provider status, rollout / [canary](glossary://canary-rollout) share, [kill switch](glossary://kill-switch) state |

Example decision lines:

```text
14:18  IC: rollback chat model alias v3.2 -> v3.1 (owner: Aisha, verify by 14:23)
14:19  IC: no further config changes without IC ack
14:24  Ops: p95 TTFT 1.1s on chat; holding
14:30  IC: freeze canary expand; postmortem owner: Jordan
```

## What fails without it

- **Freelancing changes** make the system diverge from a known baseline while evidence disappears (restarts wipe state, caches are purged, logs rotate).
- **Deepest debugger is also the comms surface**, so latency to mitigate rises while executives ask for ETAs and spreadsheets.
- **No living document**, so handoffs lose the theory, and the next shift restarts from zero.
- **Severity debates mid-call** consume the only time that should go to mitigation; treat as the highest plausible severity and reclassify later.
- **AI-specific gap:** teams chase model quality while the real issue is provider quota, a bad retrieval index pin, or a prompt/policy version that only a route map would show. Command forces the system map into the room: code, model, index, policy, and traffic pointer.

## Practice

Incident skill atrophies. Use the same roles in game days, failure-injection exercises, and even multi-team change windows so the language (size-up, strong objections, time-boxed assign, transfer of command) is muscle memory before SEV-1. Exercise runbooks so responders can rely on the controls they describe.

## Why it matters here

AI incidents span model behavior, retrieval, providers, GPU serving, prompts, and policy. User harm can look like "the model got dumber" when the real path is a canary weight, a stale index, or a provider throttle. Incident command keeps that complexity organized under pressure: one owner of state, mitigation before archaeology, and one coordinated decision record that becomes the postmortem.

## Related terms

- [Kill switch](glossary://kill-switch)
- [SLO](glossary://slo)
- [Canary rollout](glossary://canary-rollout)
- [Rollback](glossary://rollback)
- [Observability](glossary://observability)
