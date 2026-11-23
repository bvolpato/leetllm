---
title: Model card
importance: 86
---
A **model card** is a short, structured document that accompanies a trained machine learning model and reports how it should be used, how it was evaluated, where it fails, and who is accountable for it. Mitchell, Wu, Zaldivar, Barnes, Vasserman, Hutchinson, Spitzer, Raji, and Gebru introduced the practice in *Model Cards for Model Reporting* (FAT\* 2019; arXiv:1810.03993): released models should ship with transparent performance evidence tied to the contexts actually evaluated.

In modern LLM products the same idea often expands to a **system card**: the base checkpoint plus prompts, tools, retrieval, safety filters, routing, and monitoring. OpenAI's GPT-4 system card explicitly says it takes a *system* level of analysis, including non-model mitigations such as use policies, access controls, and abuse monitoring. Hugging Face Hub model cards are the common open-weight form: a repo `README.md` with YAML metadata (license, datasets, `pipeline_tag`, eval results) plus human-readable sections on uses, limitations, training, and evaluation.

A card is a versioned evidence packet for deciding whether a model or system fits a particular use and its constraints.

## Intuition

Launch review, on-call, legal, and security need the context around a weight file, API endpoint, or GGUF artifact:

| Question | Card answers with |
| --- | --- |
| What is this? | Identity, version, architecture, license, owners |
| Who is it for? | Intended users, primary use cases, out-of-scope uses |
| How good is it? | Metrics, datasets, and **disaggregated** results (slices / factors) |
| Where does it break? | Known limits, biases, safety findings, residual risks |
| How do we run it safely? | Monitoring, rollback, contact, policy and tool constraints |

Mitchell et al. stress **disaggregated evaluation**: overall accuracy can look fine while performance collapses on a cultural, demographic, language, or technical subgroup that matters for the deployment. That is the same production failure that [evaluation slices](glossary://evaluation-slice) are meant to expose. The card preserves slice results and records which contexts those findings rule out.

For deployed LLM apps, treat the card as the contract between research artifacts and operations. If on-call cannot find the model version, prompt version, tool allowlist, eval floors, known failure modes, and rollback owner in one place, the "card" is decorative.

## Canonical sections

Mitchell et al. proposed nine reporting blocks. Industry templates (Hugging Face Annotated Model Card, Google model cards, internal system cards) rename fields but map to the same questions:

| Section (Mitchell et al.) | What to put there |
| --- | --- |
| **Model details** | Name, version, type, training algorithm summary, paper/repo links, license, contact |
| **Intended use** | Primary uses, primary users, out-of-scope and prohibited uses |
| **Factors** | Conditions that may change performance: language, domain, device, demographic groups, length, modality, tool availability |
| **Metrics** | Measures tied to product impact; thresholds and variation approach |
| **Evaluation data** | Datasets, selection rationale, preprocessing, known gaps |
| **Training data** | Data summary or pointer to a datasheet; privacy and consent notes when relevant |
| **Quantitative analyses** | Overall **and** factor/slice breakdowns; unit, support size, decision thresholds |
| **Ethical considerations** | Foreseeable harms, sensitive uses, dual-use notes |
| **Caveats and recommendations** | Residual risks, out-of-scope uses, mitigations |

Hugging Face's public template emphasizes **Model Details**, **Uses** (direct / downstream / out-of-scope), **Bias, Risks, and Limitations**, **Training**, **Evaluation**, optional environmental impact, and **How to Get Started**. Structured YAML (`license`, `datasets`, `base_model`, `model-index` results) is for discovery and machines; the prose is for humans making deploy decisions.

**System cards** keep those model facts and add deployment-layer fields: tool grants, retrieval index version, safety classifiers, routing policy, rate limits, [SLO](glossary://slo)s, red-team summary, and abuse monitoring. For product work, document the complete deployed system alongside its foundation-model facts.

## Example

A team ships an internal **incident assistant** that answers runbook questions and can query read-only service metrics. The system card pins the deployed configuration alongside the base-model README:

| Field | Value |
| --- | --- |
| System id | `incident-assistant` |
| Model | `ops-llm-v4` checkpoint `sha256:9c1a…` |
| Prompt / graph | template `pt_17`, tool schema `tools@2026-04-02` |
| Tools | runbook search, read-only metric query (**no** deploy or mutation tools) |
| Intended use | On-call engineers; answers require citations to pinned runbooks |
| Out of scope | Autonomous mitigation, incident declaration, production writes |
| Eval suite | [Golden dataset](glossary://golden-dataset) `incident-gold@v6`, $N = 400$ |
| Gate floors | Citation accuracy $\ge 0.94$; unsafe-write refusal $= 1.0$; p95 latency $\le 2.5\,\mathrm{s}$ |
| Known limits | Weak on stale runbooks; Spanish runbook retrieval trails English on the gold slice |
| Monitoring | Weekly shadow eval; p95 [SLO](glossary://slo); weekly [red team](glossary://red-team) sample |
| Rollback | Owner `ml-platform-oncall`; previous good: `incident-assistant@stable` |

Illustrative rounded offline numbers on selected slices of the 400-row gate suite (support size in parentheses; these four slices account for 330 rows):

| Slice | Metric | Score | Floor |
| --- | --- | --- | --- |
| `runbook_citation_en` ($n=180$) | correct cited procedure | $0.96$ | $0.94$ |
| `runbook_citation_es` ($n=60$) | correct cited procedure | $0.88$ | $0.90$ (gate) |
| `stale_runbook` ($n=40$) | abstain or cite replacement | $0.72$ | debug only |
| `write_request` ($n=50$) | correct refusal | $1.00$ | $1.00$ |

English citation accuracy clears its illustrative floor. The Spanish slice misses its floor, so the card plus the [eval gate](glossary://eval-gate) block a broad rollout until that slice is fixed or the product scope is narrowed. All 50 observed write requests were refused. Test broader, representative traffic before estimating future refusal rates. When the assistant cites a retired runbook, on-call opens this card first for version pins, known limits, owners, and rollback, then joins traces through the [audit trail](glossary://audit-trail).

A minimal machine-readable stub that can sit next to the Markdown card (Hub YAML is analogous for open models):

```yaml
# incident-assistant.system-card.yaml (illustrative)
id: incident-assistant
version: "v6"
model_id: ops-llm-v4
checkpoint: "sha256:9c1a…"
prompt_template: pt_17
tools:
  allow: [runbook_search, metric_query_readonly]
  deny: [deploy, mutate_incident, send_message]
intended_users: [on_call_engineers]
out_of_scope: [autonomous_mitigation, production_writes, incident_declaration]
eval:
  suite: incident-gold@v6
  gates:
    citation_accuracy: 0.94
    runbook_citation_es: 0.90
    unsafe_write_refusal: 1.0
    p95_latency_s: 2.5
owners:
  product: ai-platform
  oncall: ml-platform-oncall
rollback_to: "incident-assistant@stable"
```

## What to include for LLM systems

At minimum, write the card so a stranger on call can reconstruct scope:

1. **Identity.** Model or system name, version, checkpoint hash or provider model id, prompt/graph version, tool schema version, retrieval index version when relevant.
2. **Intended use and non-use.** Users, surfaces, jurisdictions if needed, and explicit out-of-scope cases written as seriously as feature claims.
3. **Data and training summary.** Enough to judge domain fit and contamination risk; link a datasheet or dataset card when training data is large.
4. **Evaluation evidence.** Suite id, metrics, support sizes, [evaluation slice](glossary://evaluation-slice) breakdowns, thresholds used for release, link to artifacts.
5. **Safety and limitations.** Residual risks, red-team themes, known failure modes (hallucinated prices, injection via tools, weak languages), mitigations already in place.
6. **Operations.** Monitoring signals, [SLO](glossary://slo)s, owners, contact, rollback path, related policy versions.

Write limitations with the same seriousness as capability claims. Include failure modes alongside benchmark wins so responders and auditors can trace the evidence and scope.

## What fails in production

Empty or stale cards create predictable failure modes:

- **Average-only numbers.** One headline accuracy hides a language, tenant, or long-context collapse that Mitchell-style factor reporting would have forced into the open.
- **Model-only cards for system products.** Describe prompts, tools, and retrieval alongside the base model so the card covers the deployed behavior.
- **Missing versions.** Pin the checkpoint, prompt, tool schema, and index so score movement and incidents can be attributed.
- **No owner or rollback.** Name an accountable person and a previous-good version so reviewers can decide and on-call can recover.
- **Marketing tone.** Support claims such as "state of the art" or "safe for all uses" with suite ids, support sizes, and out-of-scope uses before making a go/no-go decision.

A practical review question: would this card help during an incident or audit? Include versioning, evaluation evidence, known failure modes, and ownership so responders can act on it.

## Why it matters here

Model cards (and system cards) turn model behavior, evaluation evidence, limitations, and accountability into a single artifact that gates deployment decisions. For AI/ML and LLM engineers they connect research releases, Hub READMEs, offline gates, red-team findings, and on-call reality. Measure the product path before release, and keep an artifact pin so production behavior can be traced to the version you shipped.

## Related terms

- [Evaluation slice](glossary://evaluation-slice)
- [Golden dataset](glossary://golden-dataset)
- [Eval gate](glossary://eval-gate)
- [Red team](glossary://red-team)
- [Audit trail](glossary://audit-trail)
