---
{
  "id": "rag-evaluation-faithfulness-relevance",
  "title": "RAG Evaluation for Reliable Answers",
  "slug": "rag-evaluation-faithfulness-relevance",
  "section": "Applied LLM Engineering",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Medium",
  "order": 14,
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Microsoft",
    "Databricks"
  ],
  "shortDescription": "Test whether a RAG answer is supported, cites the right source, and covers every required point. Catch a convincing answer that still gets the policy wrong.",
  "keyConceptsTested": [
    "Evidence-path evaluation traces",
    "Retrieval and selected-context gates",
    "Claim-level faithfulness",
    "Citation support versus citation presence",
    "First failed check versus causal diagnosis",
    "Regression suites and claim-versus-answer aggregation",
    "Layered RAG release decisions"
  ],
  "coverImage": "illustrations/_generated/rag_eval_matrix_dark.png"
}
---
<!-- leetllm: edition:reference:start -->

Consider an engineering assistant answering operational policy questions. An engineer asks what procedures are required for a payment service deployment during a release freeze. The recorded <span data-glossary="hybrid-search">hybrid search</span> candidates contain the release rule, and the <span data-glossary="reranker">reranker</span> selects it into prompt context. Consider this plausible answer:

> The release-freeze rule applies. You can deploy without a linked <span data-glossary="rollback">rollback</span> plan. [policy-v2]

That answer sounds authoritative because its citation references a retrieved policy chunk, yet it directly contradicts the ground-truth document: both incident commander (IC) approval and a linked rollback plan are strictly required before <span data-glossary="rollout">rollout</span>. In <span data-glossary="rag">retrieval-augmented generation (RAG)</span>, retrieved text provides evidence to a language model. When evaluating such systems, recording an evidence <span data-glossary="tracing">trace</span> showing which chunks were retrieved, selected, and tied to source versions allows verifying whether generated claims stay grounded in facts.

The <span data-glossary="eval-harness">evaluation harness</span> for this workflow reports the earliest failing stage instead of averaging disparate signals into a single blended percentage. Its decisions use validated reference labels rather than uncalibrated neural heuristics, establishing clear operational <span data-glossary="eval-gate">gates</span> when evaluating generation quality.

<figure>
  <img src="illustrations/_generated/rag_eval_matrix_dark.png" alt="A three-point policy rule is compared with complete, partial, and unsafe answers. Green cells show supported claims, the partial answer leaves rollback out, and the unsafe answer covers scope, omits approval, and contradicts rollback. Faithfulness uses supported emitted claims; completeness uses supported required points." />
  <figcaption>The partial answer is fully grounded and covers two of three required points. The unsafe answer covers scope, leaves approval out, and contradicts the rollback condition. The matrix separates claim support from task coverage.</figcaption>
</figure>

The **RAG Triad** groups three fundamental measurements: context relevance, groundedness (faithfulness), and answer relevance.[^trulens2023triad] Mapping those measurements to production risks requires checking access permissions, citations, and completeness alongside the Triad:

1. **Context relevance:** Is retrieved prompt context relevant to the question?
2. **Groundedness / faithfulness:** Are the answer's claims supported by provided evidence? Claim extraction and support assessment can both make mistakes; validate high-scoring outputs against human-labeled examples and representative cases.[^es2023]
3. **Answer relevance:** Does the response address the question? Topic relevance alone doesn't certify every required condition, factual correctness, or task completion.

For this policy explanation, we evaluate access, citation, and required-point checks alongside the Triad:

- **Admissibility and authorization:** Did every chunk in the evidence trace pass access control (such as Fine-Grained Authorization) and freshness checks before reaching the model?
- **Context selection:** Did hybrid search retrieve the gold rule, and did reranking preserve it within the final context window?
- **Claim faithfulness:** Does the selected context logically entail every atomic claim asserted by the model?
- **Citation support:** Does each attached citation link to a selected chunk that actually supports that specific claim?
- **Task completeness:** Did the model cover every required policy point instead of silently dropping mandatory conditions?

A fluent answer can pass one gate and fail another. Faithfulness measures support from the provided evidence. A faithful answer can repeat an incorrect source, and a true fact from pre-training can lack support in the request's context. A rule that requires approval and a rollback plan also leaves deployment subject to the policy's other conditions. This lesson evaluates a policy explanation. Execution still requires its own authorization.

## Replay the freeze-deploy trace

The recorded question for this evaluation replay is:

> What does Section 4.2 require for a payment-service production deploy during a release freeze?

The evaluation begins after hybrid retrieval found the correct rule and reranking selected it. Evaluation consumes that recorded evidence path instead of reconstructing retrieval inside the answer-quality harness. The field names match the previous lesson's release trace: `first_stage_ids`, `reranked_ids`, `selected_context_ids`, and component `versions`. The recorded trace isolates candidate retrieval, reranking, and final context selection before evaluating downstream answer correctness.

<!-- leetllm: test, deps=numpy, output=show, id=rag-eval-lab -->
```python title="evaluation-trace-dataset.py"
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, replace
from types import MappingProxyType


TARGET_ID = "deploy-freeze-approval-rule"


@dataclass(frozen=True)
class EvidenceChunk:
    chunk_id: str
    document_id: str
    parent_id: str
    version: str
    permitted: bool
    current: bool
    text: str


@dataclass(frozen=True)
class GoldCase:
    case_id: str
    question: str
    required_source_ids: frozenset[str]
    required_points: frozenset[str]


@dataclass(frozen=True)
class RagTrace:
    case_id: str
    question: str
    first_stage_ids: tuple[str, ...]
    rerank_input_ids: tuple[str, ...]
    reranked_ids: tuple[str, ...]
    selected_context_ids: tuple[str, ...]
    selected_versions: tuple[str, ...]
    versions: tuple[tuple[str, str], ...]


EVIDENCE = {
    TARGET_ID: EvidenceChunk(
        TARGET_ID,
        "deploy-policy",
        "deploy-policy-v2",
        "deploy-policy/2026-06-01",
        True,
        True,
        (
            "Section 4.2. Payment-service production deploys during a release "
            "freeze require incident commander approval and a linked rollback plan "
            "before rollout."
        ),
    ),
    "payment-service-rollback-runbook": EvidenceChunk(
        "payment-service-rollback-runbook",
        "payment-rollback",
        "payment-rollback-v1",
        "payment-rollback/2026-05-20",
        True,
        True,
        (
            "Payment-service rollback drills must keep the previous artifact "
            "available for 30 minutes. This runbook does not authorize freeze deploys."
        ),
    ),
    "frontend-docs-deploy-rule": EvidenceChunk(
        "frontend-docs-deploy-rule",
        "frontend-docs",
        "frontend-docs-v1",
        "frontend-docs/2026-03-01",
        True,
        True,
        "Frontend documentation deploys may ship during normal business hours without freeze approval.",
    ),
    "restricted-breakglass-note": EvidenceChunk(
        "restricted-breakglass-note",
        "breakglass-terms",
        "breakglass-terms",
        "breakglass/2026-05-01",
        False,
        True,
        "Payment-service deploys may bypass freeze approval during executive escalations.",
    ),
}
# Frozen records plus a read-only mapping protect the evaluation snapshot.
REPLAY_SNAPSHOT = MappingProxyType(dict(EVIDENCE))
GOLD = GoldCase(
    case_id="payment-freeze-deploy-001",
    question=(
        "What does Section 4.2 require for a payment-service production deploy "
        "during a release freeze?"
    ),
    required_source_ids=frozenset({TARGET_ID}),
    required_points=frozenset({"freeze-scope", "approval", "rollback-plan"}),
)
TRACE = RagTrace(
    case_id=GOLD.case_id,
    question=GOLD.question,
    first_stage_ids=(
        "payment-service-rollback-runbook",
        "frontend-docs-deploy-rule",
        TARGET_ID,
    ),
    rerank_input_ids=(
        "payment-service-rollback-runbook",
        "frontend-docs-deploy-rule",
        TARGET_ID,
    ),
    reranked_ids=(TARGET_ID, "payment-service-rollback-runbook", "frontend-docs-deploy-rule"),
    selected_context_ids=(TARGET_ID,),
    selected_versions=("deploy-policy/2026-06-01",),
    versions=(
        ("retriever", "policy-retriever-v2"),
        ("index", "policy-index/2026-06-02"),
        ("sparse", "bm25-tokenizer-v1"),
        ("dense", "fixture-embeddings-v1"),
        ("fusion", "rrf-k60"),
        ("reranker", "fixture-cross-encoder-v1"),
    ),
)

selected_sources = [
    (
        chunk.chunk_id,
        chunk.document_id,
        chunk.parent_id,
        chunk.version,
    )
    for chunk in (EVIDENCE[chunk_id] for chunk_id in TRACE.selected_context_ids)
]
print("Selected context:", TRACE.selected_context_ids)
print("Selected sources:", selected_sources)
print("Pipeline versions:", dict(TRACE.versions))
assert TRACE.selected_context_ids == (TARGET_ID,)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Selected context: ('deploy-freeze-approval-rule',)
Selected sources: [('deploy-freeze-approval-rule', 'deploy-policy', 'deploy-policy-v2', 'deploy-policy/2026-06-01')]
Pipeline versions: {'retriever': 'policy-retriever-v2', 'index': 'policy-index/2026-06-02', 'sparse': 'bm25-tokenizer-v1', 'dense': 'fixture-embeddings-v1', 'fusion': 'rrf-k60', 'reranker': 'fixture-cross-encoder-v1'}
```
<!-- leetllm: output:end -->

The trace identifies the sources and retrieval configuration to inspect. This benchmark environment maintains one immutable revision per chunk. A production replay store must resolve the exact recorded revision rather than substituting current text, saving the assembled prompt, generator version, decoding temperature, and raw output to reproduce generation as faithfully as possible.

## Gate admissibility before scoring quality

Relevance scores cannot make unauthorized evidence acceptable. Here, `first_stage_ids` represents candidates returned across the request's authorization perimeter rather than everything an index scans internally. Restricted, stale, or unknown evidence in that returned path fails security verification, even if subsequent reranking or context truncation drops it before prompt assembly. `permitted` and `current` are trusted test labels representing access control and freshness status.

<!-- leetllm: test, output=show, continue=rag-eval-lab, id=rag-hard-gate -->
```python title="admissible-evidence-path-gate.py"
def admissible_evidence_path(trace: RagTrace, gold: GoldCase) -> bool:
    if trace.case_id != gold.case_id or trace.question != gold.question:
        return False
    if not trace.selected_context_ids:
        return False
    if len(trace.selected_context_ids) != len(trace.selected_versions):
        return False
    required_version_keys = {"retriever", "index", "sparse", "dense", "fusion", "reranker"}
    if any(
        not isinstance(record, tuple)
        or len(record) != 2
        or any(not isinstance(value, str) or not value.strip() for value in record)
        for record in trace.versions
    ):
        return False
    version_map = dict(trace.versions)
    if len(version_map) != len(trace.versions):
        return False
    if not required_version_keys.issubset(version_map):
        return False
    if any(not version_map[key].strip() for key in required_version_keys):
        return False
    stage_ids = (
        trace.first_stage_ids,
        trace.rerank_input_ids,
        trace.reranked_ids,
        trace.selected_context_ids,
    )
    if any(len(ids) != len(set(ids)) for ids in stage_ids):
        return False
    traced_ids = tuple(chunk_id for ids in stage_ids for chunk_id in ids)
    if any(chunk_id not in EVIDENCE for chunk_id in traced_ids):
        return False
    traced = [EVIDENCE[chunk_id] for chunk_id in traced_ids]
    selected = [EVIDENCE[chunk_id] for chunk_id in trace.selected_context_ids]
    rerank_input_came_from_retrieval = set(trace.rerank_input_ids).issubset(
        trace.first_stage_ids
    )
    reranked_same_candidates = set(trace.reranked_ids) == set(trace.rerank_input_ids)
    returned_by_reranker = set(trace.selected_context_ids).issubset(trace.reranked_ids)
    versions_match = all(
        chunk.version == version
        for chunk, version in zip(selected, trace.selected_versions)
    )
    allowed_and_current = all(
        chunk.permitted is True
        and chunk.current is True
        and REPLAY_SNAPSHOT.get(chunk.chunk_id) == chunk
        for chunk in traced
    )
    return (
        rerank_input_came_from_retrieval
        and reranked_same_candidates
        and returned_by_reranker
        and versions_match
        and allowed_and_current
    )


restricted_trace = replace(
    TRACE,
    first_stage_ids=("restricted-breakglass-note",),
    rerank_input_ids=("restricted-breakglass-note",),
    reranked_ids=("restricted-breakglass-note",),
    selected_context_ids=("restricted-breakglass-note",),
    selected_versions=("breakglass/2026-05-01",),
)
blocked_candidate_trace = replace(
    TRACE,
    first_stage_ids=TRACE.first_stage_ids + ("restricted-breakglass-note",),
    rerank_input_ids=TRACE.rerank_input_ids + ("restricted-breakglass-note",),
    reranked_ids=TRACE.reranked_ids + ("restricted-breakglass-note",),
)
unknown_candidate_trace = replace(TRACE, first_stage_ids=TRACE.first_stage_ids + ("missing",))
stale_version_trace = replace(TRACE, selected_versions=("deploy-policy/2025-02-01",))
missing_version_trace = replace(TRACE, versions=TRACE.versions[:-1])
wrong_case_trace = replace(TRACE, case_id="payment-freeze-deploy-002")
duplicate_candidate_trace = replace(
    TRACE,
    first_stage_ids=TRACE.first_stage_ids + (TARGET_ID,),
)
print("Fixture path admissible:", admissible_evidence_path(TRACE, GOLD))
print("Restricted context admissible:", admissible_evidence_path(restricted_trace, GOLD))
print("Blocked candidate admissible:", admissible_evidence_path(blocked_candidate_trace, GOLD))
print("Unknown candidate admissible:", admissible_evidence_path(unknown_candidate_trace, GOLD))
print("Wrong-version path admissible:", admissible_evidence_path(stale_version_trace, GOLD))
print("Incomplete trace admissible:", admissible_evidence_path(missing_version_trace, GOLD))
print("Wrong-case trace admissible:", admissible_evidence_path(wrong_case_trace, GOLD))
print("Duplicate candidate admissible:", admissible_evidence_path(duplicate_candidate_trace, GOLD))
assert admissible_evidence_path(TRACE, GOLD)
assert not admissible_evidence_path(restricted_trace, GOLD)
assert not admissible_evidence_path(blocked_candidate_trace, GOLD)
assert not admissible_evidence_path(unknown_candidate_trace, GOLD)
assert not admissible_evidence_path(stale_version_trace, GOLD)
assert not admissible_evidence_path(missing_version_trace, GOLD)
assert not admissible_evidence_path(wrong_case_trace, GOLD)
assert not admissible_evidence_path(duplicate_candidate_trace, GOLD)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Fixture path admissible: True
Restricted context admissible: False
Blocked candidate admissible: False
Unknown candidate admissible: False
Wrong-version path admissible: False
Incomplete trace admissible: False
Wrong-case trace admissible: False
Duplicate candidate admissible: False
```
<!-- leetllm: output:end -->

The case and question checks bind these labels to this replay; they don't establish that the recorded text is the caller's actual request or authenticate that caller. Complete record comparisons reject edited source text, parents, or metadata under an unchanged ID/version. The component names are teaching version labels, not immutable artifact pins. A service also needs trusted caller/grant records and current access checks.

The path can pass those checks and still be the wrong evidence for the answer. Is the required rule in the candidate list, and did it survive into the prompt?

```checkpoint
A restricted break-glass rule would answer the question perfectly. Why must the evaluation fail before computing relevance?
---
Authorization determines which evidence the caller may access. Once restricted text enters retrieval or reranking, an intermediate score, cache, trace, or response can leak data the caller is not permitted to see. Authorization and freshness operate as non-negotiable gates across the entire evidence path.
```

## Separate candidates from selected context

Admissibility establishes a permitted, current evidence path. Next, evaluate whether retrieval found the required rule and reranking preserved it inside the final prompt. Context relevance asks whether retrieved text pertains to the query, while evidence sufficiency requires checking candidate retrieval and context selection separately:

| Layer | Gate | Meaning on this trace |
|---|---|---|
| Candidate retrieval | `candidate_recall` | Did hybrid search pull the required rule into initial candidates? |
| Selected context | `context_recall` | Did the rule survive reranking and context packing constraints? |
| Selected context | `selected_context_precision` | Did selected context filter out irrelevant distractors? |

Selected-context precision directly measures noise reduction:

$$
\operatorname{Precision}_{\text{selected}} = \frac{|\text{selected chunk IDs} \cap \text{useful chunk IDs}|}{|\text{selected chunk IDs}|}
$$

Distracting chunks increase prompt token cost and risk introducing competing evidence. While position-dependent degradation can impair recall when relevant information is placed in the middle of long contexts,[^longcontext2024] extraneous chunks do not uniformly degrade all models. Measuring candidate recall, context recall, and set precision separately pinpoints whether retrieval under-delivers or context packing introduces unnecessary noise. Ranking metrics like mean reciprocal rank (MRR) and normalized discounted cumulative gain (NDCG) evaluate top-ranked placement,[^manning2008ir] whereas generation evaluation primarily requires verifying prompt inclusion and context cleanliness.

<!-- leetllm: test, output=show, continue=rag-hard-gate, id=rag-context-gates -->
```python title="evidence-path-metrics.py"
def coverage(ids: tuple[str, ...], required_ids: frozenset[str]) -> float:
    if not required_ids:
        raise ValueError("Source recall needs a nonempty reference set")
    if len(ids) != len(set(ids)):
        raise ValueError("Source recall needs unique selected IDs")
    return len(set(ids) & required_ids) / len(required_ids)


def selected_context_precision(ids: tuple[str, ...], useful_ids: frozenset[str]) -> float:
    """ID-set precision, not rank-weighted Ragas ContextPrecision."""
    if len(ids) != len(set(ids)):
        raise ValueError("Selected precision needs unique selected IDs")
    return len(set(ids) & useful_ids) / len(ids) if ids else 0.0


candidate_recall = coverage(TRACE.first_stage_ids, GOLD.required_source_ids)
context_recall = coverage(TRACE.selected_context_ids, GOLD.required_source_ids)
selected_precision = selected_context_precision(
    TRACE.selected_context_ids, GOLD.required_source_ids
)
print(f"Candidate recall: {candidate_recall:.1f}")
print(f"Selected-context recall: {context_recall:.1f}")
print(f"Selected-context precision: {selected_precision:.1f}")
assert (candidate_recall, context_recall, selected_precision) == (1.0, 1.0, 1.0)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Candidate recall: 1.0
Selected-context recall: 1.0
Selected-context precision: 1.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/retrieval_path_metrics_dark.png" alt="The recorded trace finds the freeze approval rule among three candidates, reranks it into a one-chunk context, and scores candidate recall, context recall, and selected-set precision at one. In a labeled counterfactual, keeping two distractors alongside the rule preserves recall at one while lowering set precision to one third." />
  <figcaption>The evaluation trace retrieves and selects the required rule alone. The lower path holds recall steady when two permitted distractors remain, while selected-set precision falls to one third.</figcaption>
</figure>

This result describes the evidence path, which must be inspected independently from generated text. These are set metrics over labeled chunk IDs; an alternative chunk could contain equally good evidence yet score as a miss against an incomplete reference set. Label acceptable alternatives or assess coverage of answer-bearing facts before treating that miss as a retrieval defect. Metric names can also mask different denominators: set precision measures the fraction of relevant chunks among all selected items ($1/3$ regardless of ordering), whereas rank-weighted variants adjust for position.[^ragas2026ContextPrecision]

## Turn an answer into testable claims

Context can be sufficient while the generated answer remains defective. Decompose responses into atomic policy claims paired with source citations, scoring each claim against reference annotations:

| Response | What changed? |
|---|---|
| `unsafe-bypass` | Adds a no-rollback-plan claim that the deploy rule never states |
| `supported-deploy` | States only the deploy scope and conditions present in the policy rule |

FActScore similarly evaluates factual precision at the level of atomic facts rather than treating a whole passage as uniformly correct.[^min2023] Evaluating individual claims exposes where generation departs from evidence:

<!-- leetllm: test, output=show, continue=rag-context-gates, id=rag-answers -->
```python title="answer-claim-cases.py"
@dataclass(frozen=True)
class Claim:
    claim_id: str
    text: str
    citation_id: str | None


@dataclass(frozen=True)
class Answer:
    answer_id: str
    claims: tuple[Claim, ...]


UNSAFE_BYPASS = Answer(
    "unsafe-bypass",
    (
        Claim(
            "freeze-scope",
            "The request is governed by the release-freeze deploy rule.",
            TARGET_ID,
        ),
        Claim(
            "bypass",
            "The deploy can start without a linked rollback plan.",
            TARGET_ID,
        ),
    ),
)
SUPPORTED_DEPLOY = Answer(
    "supported-deploy",
    (
        Claim(
            "freeze-scope",
            "The request is governed by the release-freeze deploy rule.",
            TARGET_ID,
        ),
        Claim(
            "approval",
            "Incident commander approval is required before rollout.",
            TARGET_ID,
        ),
        Claim(
            "rollback-plan",
            "A linked rollback plan is required before rollout.",
            TARGET_ID,
        ),
    ),
)
PARTIAL_DEPLOY = Answer(
    "partial-deploy",
    (
        Claim(
            "freeze-scope",
            "The request is governed by the release-freeze deploy rule.",
            TARGET_ID,
        ),
        Claim(
            "approval",
            "Incident commander approval is required before rollout.",
            TARGET_ID,
        ),
    ),
)
EMPTY_ANSWER = Answer("empty", ())

print("Unsafe claims:", [claim.claim_id for claim in UNSAFE_BYPASS.claims])
print("Supported claims:", [claim.claim_id for claim in SUPPORTED_DEPLOY.claims])
print("Partial claims:", [claim.claim_id for claim in PARTIAL_DEPLOY.claims])
print("Empty claims:", [claim.claim_id for claim in EMPTY_ANSWER.claims])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Unsafe claims: ['freeze-scope', 'bypass']
Supported claims: ['freeze-scope', 'approval', 'rollback-plan']
Partial claims: ['freeze-scope', 'approval']
Empty claims: []
```
<!-- leetllm: output:end -->

These claims are hand-crafted evaluation cases rather than direct outputs from a model call. In live evaluation pipelines, claim extraction itself must be audited: dropping restrictive qualifiers such as "only" or silently skipping unsupported assertions can artificially inflate evaluation scores.

## Faithfulness checks claims against context

Selected context can still lose to a generator that hallucinated or misapplied conditions. Check each claim against the retrieved policy statements before computing aggregate scores:

| Claim | Evidence relationship | Supported? |
|---|---|---|
| `freeze-scope` | The rule explicitly covers this service and freeze | yes |
| `bypass` | The rule requires the plan; the answer says it can be absent | no |

One of two unsafe claims is supported, yielding a faithfulness of $1/2$. RAGAS formalizes this ratio after an LLM extracts atomic statements and evaluates which ones are logically inferred from context.[^es2023] Verifying whether context $E$ supports claim $c_j$ is formally modeled as a Natural Language Inference (NLI) task. Treating the selected context $E$ as the premise and atomic claim $c_j$ as the hypothesis, the evaluator assigns one of three categorical relations:

1. **Entailment ($E \implies c_j$):** The context logically necessitates the claim, including all scopes and conditions.
2. **Contradiction ($E \implies \neg c_j$):** The context directly conflicts with the claim. Here, the policy requires a linked rollback plan; the answer asserts the plan can be absent.
3. **Neutral / Not Entailed ($E \not\implies c_j \land E \not\implies \neg c_j$):** The context doesn't contain enough evidence to confirm or refute the claim (such as speculating about unmentioned executive waivers).

A learned evaluator estimates these relations; its verdict is an empirical estimate rather than a formal proof. The claim-level faithfulness metric is the fraction of emitted claims assessed as entailed by the selected context:

$$
\operatorname{faithfulness} = \frac{\sum_{j=1}^m \mathbb{I}(\text{entailed}(c_j, E))}{m}
$$

where $m$ is the total count of atomic claims in the response. Token overlap alone cannot distinguish support: "approval is required" and "approval is not required" share most of their tokens while stating opposite rules. Entailment requires agreement with scope and conditions, not lexical similarity alone.

The code uses an explicit reference answer key where each supported text maps to an exact source revision and a required point. An unknown text is treated as unadjudicated rather than automatically false, and the harness routes it to review before certifying output.

<!-- leetllm: test, output=show, continue=rag-answers, id=rag-faithfulness -->
```python title="claim-faithfulness-gate.py"
REVIEWED_SUPPORT = {
    "The request is governed by the release-freeze deploy rule.": (
        TARGET_ID, "deploy-policy/2026-06-01", "freeze-scope"
    ),
    "Incident commander approval is required before rollout.": (
        TARGET_ID, "deploy-policy/2026-06-01", "approval"
    ),
    "A linked rollback plan is required before rollout.": (
        TARGET_ID, "deploy-policy/2026-06-01", "rollback-plan"
    ),
}
REVIEWED_UNSUPPORTED = {"The deploy can start without a linked rollback plan."}


def source_supports(claim: Claim, chunk: EvidenceChunk) -> bool:
    annotation = REVIEWED_SUPPORT.get(claim.text)
    return (
        annotation is not None
        and annotation[:2] == (chunk.chunk_id, chunk.version)
        and REPLAY_SNAPSHOT.get(chunk.chunk_id) == chunk
    )


def claim_supported_by_context(claim: Claim, trace: RagTrace) -> bool:
    return any(
        source_supports(claim, EVIDENCE[chunk_id])
        for chunk_id in trace.selected_context_ids
    )


def faithfulness(answer: Answer, trace: RagTrace) -> float:
    if any(
        claim.text not in REVIEWED_SUPPORT and claim.text not in REVIEWED_UNSUPPORTED
        for claim in answer.claims
    ):
        raise ValueError("Unadjudicated claim: review before scoring")
    supported = sum(
        claim_supported_by_context(claim, trace) for claim in answer.claims
    )
    return supported / len(answer.claims) if answer.claims else 0.0


print(f"unsafe-bypass faithfulness: {faithfulness(UNSAFE_BYPASS, TRACE):.2f}")
print(
    "supported-deploy faithfulness: "
    f"{faithfulness(SUPPORTED_DEPLOY, TRACE):.2f}"
)
print(f"empty faithfulness: {faithfulness(EMPTY_ANSWER, TRACE):.2f}")
assert faithfulness(UNSAFE_BYPASS, TRACE) == 0.5
assert faithfulness(SUPPORTED_DEPLOY, TRACE) == 1.0
assert faithfulness(EMPTY_ANSWER, TRACE) == 0.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unsafe-bypass faithfulness: 0.50
supported-deploy faithfulness: 1.00
empty faithfulness: 0.00
```
<!-- leetllm: output:end -->

The unsafe response is on topic and cites a valid selected rule, yet fails because one claim contradicts that rule. The empty-claims score of `0.0` is a deliberate baseline convention rather than a zero-denominator ratio. Current Ragas similarly defines faithfulness through extracted-claim support, noting that extraction and support models can both err.[^ragas2026Faithfulness] This answer key binds each claim to one source; claims requiring multi-hop evidence require compound annotations.

## Verify that each citation supports its claim

Faithfulness asks whether selected context could support the sentence, whereas citation support asks whether the attached source is the one that actually provides that evidence. RAGAS faithfulness doesn't check citation IDs, so this gate provides essential attribution verification.

A robust citation metric requires two complementary checks:

1. **Coverage:** Does every policy claim cite a source?
2. **Support:** Does the cited selected source establish that claim?

A fabricated rollback exemption can easily achieve perfect citation coverage by attaching a plausible-looking chunk ID, so presence alone is an insufficient guardrail. For `MIS_CITED`, note how faithfulness and citation support diverge when claims are correctly entailed by prompt text but paired with an unrelated document identifier:

<!-- leetllm: test, output=show, continue=rag-faithfulness, id=rag-citations -->
```python title="citation-support-gate.py"
MIS_CITED = Answer(
    "mis-cited",
    tuple(
        replace(claim, citation_id="payment-service-rollback-runbook")
        for claim in SUPPORTED_DEPLOY.claims
    ),
)


def citation_coverage(answer: Answer) -> float:
    cited = sum(
        isinstance(claim.citation_id, str) and bool(claim.citation_id.strip())
        for claim in answer.claims
    )
    return cited / len(answer.claims) if answer.claims else 0.0


def citation_support(answer: Answer, trace: RagTrace) -> float:
    supported = 0
    for claim in answer.claims:
        if claim.citation_id not in trace.selected_context_ids:
            continue
        if source_supports(claim, EVIDENCE[claim.citation_id]):
            supported += 1
    return supported / len(answer.claims) if answer.claims else 0.0


print(f"unsafe citation coverage: {citation_coverage(UNSAFE_BYPASS):.2f}")
print(f"unsafe citation support: {citation_support(UNSAFE_BYPASS, TRACE):.2f}")
print(f"mis-cited answer faithfulness: {faithfulness(MIS_CITED, TRACE):.2f}")
print(f"mis-cited citation support: {citation_support(MIS_CITED, TRACE):.2f}")
assert citation_coverage(UNSAFE_BYPASS) == 1.0
assert citation_support(UNSAFE_BYPASS, TRACE) == 0.5
assert faithfulness(MIS_CITED, TRACE) == 1.0
assert citation_support(MIS_CITED, TRACE) == 0.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unsafe citation coverage: 1.00
unsafe citation support: 0.50
mis-cited answer faithfulness: 1.00
mis-cited citation support: 0.00
```
<!-- leetllm: output:end -->

In the mis-cited response, selected context supports every sentence, yielding a faithfulness of 1.0. However, its citations fail because they point at `payment-service-rollback-runbook`, which was not selected in prompt context and does not support those claims. Adding that unrelated runbook to context would leave its citations irrelevant to the caller's question.

```checkpoint
An answer gets faithfulness `1.0` but citation support `0.0`. What happened?
---
The answer matches evidence somewhere in prompt context while its attached citations point somewhere else, or reference documents outside the selected context entirely. Inspect claim-to-citation alignment rather than altering retrieval ranking.
```

A cited sentence can be fully supported and still omit mandatory conditions required by policy.

## Check whether the answer finished the task

A 1.0 faithfulness score can still fail release if a required point never appears as a supported claim. For this benchmark case, the specification requires three answer points: deploy scope, approval, and a linked rollback plan. Treat point coverage as a labeled completeness gate:

<!-- leetllm: test, output=show, continue=rag-citations, id=rag-completeness -->
```python title="answer-point-coverage.py"
def supported_point_coverage(answer: Answer, trace: RagTrace, gold: GoldCase) -> float:
    if not gold.required_points:
        raise ValueError("Point coverage needs nonempty required points")
    supported_points = {
        REVIEWED_SUPPORT[claim.text][2]
        for claim in answer.claims
        if claim_supported_by_context(claim, trace)
    }
    return len(supported_points & gold.required_points) / len(gold.required_points)


unsafe_coverage = supported_point_coverage(UNSAFE_BYPASS, TRACE, GOLD)
supported_coverage = supported_point_coverage(SUPPORTED_DEPLOY, TRACE, GOLD)
partial_coverage = supported_point_coverage(PARTIAL_DEPLOY, TRACE, GOLD)
print(f"unsafe supported point coverage: {unsafe_coverage:.2f}")
print(f"supported answer point coverage: {supported_coverage:.2f}")
print(f"partial supported point coverage: {partial_coverage:.2f}")
assert unsafe_coverage == 1 / 3
assert supported_coverage == 1.0
assert partial_coverage == 2 / 3
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unsafe supported point coverage: 0.33
supported answer point coverage: 1.00
partial supported point coverage: 0.67
```
<!-- leetllm: output:end -->

Point coverage evaluates an orthogonal dimension to topical relevance. A response can sound persuasive while omitting a mandatory rollback condition. In contrast to broad semantic similarity, a labeled completeness gate explicitly verifies whether each required policy element is addressed.[^es2023]

`PARTIAL_DEPLOY` illustrates the distinction: faithfulness is 1.0 while point coverage is only $2/3$ because the rollback plan claim never appears. Conversely, a correctly quoted frontend deployment rule could be fully supported yet irrelevant to the payment service question. The required points represent a task-specific completeness rubric rather than a general semantic detector.

```checkpoint
An answer emits no policy claims. Does its lack of unsupported claims make it releasable?
---
Not on this answerable case. Silence avoids hallucinating policy, but fails to satisfy the user's operational request. Block it as incomplete, distinguishing silent failures from justified abstentions on unanswerable questions.
```

### When declining to answer is correct

Suppose a query asks whether an executive escalation waives the rollback requirement. The retrieved rule contains no such exception. "The available policy lists no waiver; ask the policy owner" is a useful abstention, whereas "No waiver exists anywhere" is an unsupported universal claim.

Label both corpus answerability and selected-evidence sufficiency. If the corpus contains the needed rule but retrieval misses it, abstaining can be the safe generation behavior while retrieval still fails. Report that distinction instead of rewarding every refusal or forcing every question into an answer-required gate:

| Corpus can answer? | Selected evidence sufficient? | Response | Interpretation |
|---|---|---|---|
| yes | yes | Complete, supported answer | Task success |
| no | no | Explain the evidence limit | Justified abstention |
| yes | no | Explain the evidence limit | Safe response, retrieval/selection failure |
| yes | yes | Refuse without a reason | Unnecessary abstention |

Replay that distinction with five reviewed outcomes. `corpus_answerable` is an annotation about the permitted, current corpus for this caller, not everything the organization stores. `context_sufficient` describes the evidence actually included in prompt context. The response labels come from a reviewer; a model cannot certify its own refusal merely by calling it an abstention.

<!-- leetllm: test, output=show, id=rag-abstention -->
```python title="abstention-outcome-replay.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class ReviewedOutcome:
    name: str
    corpus_answerable: bool
    context_sufficient: bool
    response: str


def outcome_labels(case: ReviewedOutcome) -> tuple[bool, bool, bool]:
    if case.context_sufficient and not case.corpus_answerable:
        raise ValueError("Sufficient context contradicts the corpus label")
    if case.response not in {"complete-supported", "bounded-abstention", "unsupported"}:
        raise ValueError("Response needs independent review")
    supported_answer = case.response == "complete-supported" and case.context_sufficient
    safe_response = supported_answer or case.response == "bounded-abstention"
    evidence_path_ok = not case.corpus_answerable or case.context_sufficient
    task_success = supported_answer or (
        not case.corpus_answerable and case.response == "bounded-abstention"
    )
    return safe_response, evidence_path_ok, task_success


cases = (
    ReviewedOutcome("complete answer", True, True, "complete-supported"),
    ReviewedOutcome("waiver not established", False, False, "bounded-abstention"),
    ReviewedOutcome("missed rule, safe refusal", True, False, "bounded-abstention"),
    ReviewedOutcome("rule available, unnecessary refusal", True, True, "bounded-abstention"),
    ReviewedOutcome("no waiver exists anywhere", False, False, "unsupported"),
)
for case in cases:
    safe, evidence_ok, success = outcome_labels(case)
    print(f"{case.name}: safe={safe}, evidence_path_ok={evidence_ok}, task_success={success}")
assert outcome_labels(cases[2]) == (True, False, False)
assert outcome_labels(cases[3]) == (True, True, False)
assert outcome_labels(cases[4]) == (False, True, False)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
complete answer: safe=True, evidence_path_ok=True, task_success=True
waiver not established: safe=True, evidence_path_ok=True, task_success=True
missed rule, safe refusal: safe=True, evidence_path_ok=False, task_success=False
rule available, unnecessary refusal: safe=True, evidence_path_ok=True, task_success=False
no waiver exists anywhere: safe=False, evidence_path_ok=True, task_success=False
```
<!-- leetllm: output:end -->

Here, `safe` means only that the reviewed response avoids unsupported policy claims; it doesn't certify general safety. `evidence_path_ok=True` on an unanswerable case means there was no labeled answer-bearing evidence to miss, not that every retrieval decision was optimal. A bounded refusal and an unsupported universal claim need different labels even when both contain no affirmative waiver.

The primary evaluation harness remains focused on this answerable requirements question. This separate replay demonstrates abstention accounting without treating empty context as an authorization failure or an unearned perfect faithfulness score. Production test suites must validate empty-context traces, access-control boundaries, and response wording independently, reporting ungrounded assertions and premature refusals as separate defect categories.

## Attribute the first failure

When a RAG system fails, isolating the earliest point of breakdown prevents misdirecting engineering effort. Evaluating the pipeline as an undifferentiated black box leaves teams guessing whether to tune retrieval embedding spaces, adjust reranker score thresholds, or rewrite generation prompts. Pipeline order gives an investigation priority, though multiple defects can compound: if retrieval misses a rule and the generator invents an unauthorized bypass, both subsystems require remediation.

The layered evaluation pipeline checks:

1. **Admissibility:** Did unauthorized or stale evidence enter the candidate pool?
2. **Candidate retrieval:** Did hybrid search place the required chunk in initial candidates?
3. **Context selection:** Did reranking keep the chunk in the selected prompt context?
4. **Claim presence:** Are there factual claims to evaluate?
5. **Claim review:** Does the evaluation key recognize their exact phrasing?
6. **Answer faithfulness:** Are emitted claims supported by selected evidence?
7. **Citation support:** Do attached sources support their corresponding claims?
8. **Task completeness:** Are all required policy points covered?

Each failure narrows the investigation to the responsible component: missing candidates point to index coverage or query formulation; dropped context points to reranker pruning and token budgeting; unsupported claims point to hallucination in generation; and citation mismatches point to reference attribution errors.

<figure>
  <img src="illustrations/_generated/trace_diagnosis_loop_dark.png" alt="Three answer claims each have a solid line to the policy rule in the prompt, which supports them, and a dashed line to a rollback runbook that was never selected, which they cite. The checks run in order: the selected context includes the policy rule and passes, faithfulness passes at 3 of 3, citation support fails at 0 of 3 as the first failure, and completeness stays unscored." />
  <figcaption>The replay traces two separate links: the policy rule supports the claims, while each citation names an unselected runbook. Citation support is the first failed gate; completeness remains unscored.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=rag-completeness, id=rag-diagnosis -->
```python title="first-failed-stage.py"
RETRIEVAL_MISS = replace(
    TRACE,
    first_stage_ids=("payment-service-rollback-runbook", "frontend-docs-deploy-rule"),
    rerank_input_ids=("payment-service-rollback-runbook", "frontend-docs-deploy-rule"),
    reranked_ids=("payment-service-rollback-runbook", "frontend-docs-deploy-rule"),
    selected_context_ids=("payment-service-rollback-runbook",),
    selected_versions=("payment-rollback/2026-05-20",),
)
SELECTION_MISS = replace(
    TRACE,
    selected_context_ids=("payment-service-rollback-runbook",),
    selected_versions=("payment-rollback/2026-05-20",),
)


def first_failed_stage(trace: RagTrace, answer: Answer, gold: GoldCase) -> str:
    if not admissible_evidence_path(trace, gold):
        return "admissibility"
    if coverage(trace.first_stage_ids, gold.required_source_ids) < 1.0:
        return "candidate retrieval"
    if coverage(trace.selected_context_ids, gold.required_source_ids) < 1.0:
        return "context selection"
    if not answer.claims:
        return "claim presence"
    if any(
        claim.text not in REVIEWED_SUPPORT and claim.text not in REVIEWED_UNSUPPORTED
        for claim in answer.claims
    ):
        return "claim review"
    if faithfulness(answer, trace) < 1.0:
        return "answer faithfulness"
    if citation_support(answer, trace) < 1.0:
        return "citation support"
    if supported_point_coverage(answer, trace, gold) < 1.0:
        return "answer completeness"
    return "pass"


diagnoses = {
    "missing candidate": first_failed_stage(RETRIEVAL_MISS, SUPPORTED_DEPLOY, GOLD),
    "dropped context": first_failed_stage(SELECTION_MISS, SUPPORTED_DEPLOY, GOLD),
    "invented bypass": first_failed_stage(TRACE, UNSAFE_BYPASS, GOLD),
    "wrong citation": first_failed_stage(TRACE, MIS_CITED, GOLD),
    "empty answer": first_failed_stage(TRACE, EMPTY_ANSWER, GOLD),
    "missing rollback point": first_failed_stage(TRACE, PARTIAL_DEPLOY, GOLD),
    "supported answer": first_failed_stage(TRACE, SUPPORTED_DEPLOY, GOLD),
}
for variant, stage in diagnoses.items():
    print(f"{variant}: {stage}")
assert diagnoses["missing candidate"] == "candidate retrieval"
assert diagnoses["dropped context"] == "context selection"
assert diagnoses["invented bypass"] == "answer faithfulness"
assert diagnoses["wrong citation"] == "citation support"
assert diagnoses["empty answer"] == "claim presence"
assert diagnoses["missing rollback point"] == "answer completeness"
assert diagnoses["supported answer"] == "pass"
```

<!-- leetllm: output:start -->
```text title="Output" output compact
missing candidate: candidate retrieval
dropped context: context selection
invented bypass: answer faithfulness
wrong citation: citation support
empty answer: claim presence
missing rollback point: answer completeness
supported answer: pass
```
<!-- leetllm: output:end -->

Empty claims fail `claim presence`. The partial answer emits supported claims but misses the rollback point, so it fails `answer completeness`. An unseen paraphrase returns `claim review`; the fixed key can't decide its meaning. These labels name observed checks, not proven causes.

Try two attempts to fool the evaluator. The first keeps a valid claim ID but negates its text. The second repeats an approval claim under the rollback ID. Neither should gain support or completeness from its identifier.

<!-- leetllm: test, output=show, continue=rag-diagnosis, id=rag-counterexamples -->
```python title="evaluator-counterexamples.py"
negated = replace(
    SUPPORTED_DEPLOY.claims[1], text="Incident commander approval is not required."
)
spoofed_text = Answer("negated", (negated,))
spoofed_point = Answer(
    "renamed-approval",
    PARTIAL_DEPLOY.claims + (replace(SUPPORTED_DEPLOY.claims[1], claim_id="rollback-plan"),),
)
paraphrase = Answer("unreviewed-paraphrase", (
    Claim("approval", "Approval from the incident commander is mandatory.", TARGET_ID),
))
print("Negated known claim:", first_failed_stage(TRACE, spoofed_text, GOLD))
print("Renamed duplicate:", first_failed_stage(TRACE, spoofed_point, GOLD))
print("Valid but unreviewed paraphrase:", first_failed_stage(TRACE, paraphrase, GOLD))
assert first_failed_stage(TRACE, spoofed_text, GOLD) == "claim review"
assert first_failed_stage(TRACE, spoofed_point, GOLD) == "answer completeness"
assert first_failed_stage(TRACE, paraphrase, GOLD) == "claim review"
assert supported_point_coverage(spoofed_point, TRACE, GOLD) == 2 / 3
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Negated known claim: claim review
Renamed duplicate: answer completeness
Valid but unreviewed paraphrase: claim review
```
<!-- leetllm: output:end -->

An unreviewed contradiction and an unreviewed correct paraphrase both require evaluation. The harness routes both to human review so that after domain experts distinguish them, verified annotations update the evaluation suite. Maintaining consistent claim segmentation and deduplication prevents trivial repetition from inflating reported accuracy.

### Challenge source integrity and citations

Verify whether an unchanged source identifier suffices after text modification, and evaluate handling of blank citations:

<!-- leetllm: test, output=show, continue=rag-counterexamples, id=rag-receipt-challenge -->
```python title="source-and-citation-counterexamples.py"
original_chunk = EVIDENCE[TARGET_ID]
EVIDENCE[TARGET_ID] = replace(original_chunk, text="Edited policy under an unchanged version")
try:
    print("Edited source diagnosis:", first_failed_stage(TRACE, SUPPORTED_DEPLOY, GOLD))
    assert first_failed_stage(TRACE, SUPPORTED_DEPLOY, GOLD) == "admissibility"
    assert not source_supports(SUPPORTED_DEPLOY.claims[1], EVIDENCE[TARGET_ID])
finally:
    EVIDENCE[TARGET_ID] = original_chunk

blank_citations = Answer(
    "blank-citations",
    tuple(replace(claim, citation_id=" ") for claim in SUPPORTED_DEPLOY.claims),
)
wrong_question = replace(TRACE, question="Does a different service have a freeze exemption?")
print(f"Blank citation coverage: {citation_coverage(blank_citations):.1f}")
print("Changed question admissible:", admissible_evidence_path(wrong_question, GOLD))
assert citation_coverage(blank_citations) == 0.0
assert first_failed_stage(TRACE, blank_citations, GOLD) == "citation support"
assert not admissible_evidence_path(wrong_question, GOLD)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Edited source diagnosis: admissibility
Blank citation coverage: 0.0
Changed question admissible: False
```
<!-- leetllm: output:end -->

## Make bad behaviors part of release testing

Evaluation should show both that a supported answer is accepted and that known bad answers are blocked. These variants become a tiny <span data-glossary="regression-suite">regression suite</span>:

<!-- leetllm: test, output=show, continue=rag-receipt-challenge, id=rag-red-team -->
```python title="answer-release-regression.py"
@dataclass(frozen=True)
class ReleaseCase:
    name: str
    trace: RagTrace
    answer: Answer
    should_release: bool


def can_release(trace: RagTrace, answer: Answer, gold: GoldCase) -> bool:
    return first_failed_stage(trace, answer, gold) == "pass"


RELEASE_CASES = (
    ReleaseCase("supported answer", TRACE, SUPPORTED_DEPLOY, True),
    ReleaseCase("unsupported bypass", TRACE, UNSAFE_BYPASS, False),
    ReleaseCase("wrong citation", TRACE, MIS_CITED, False),
    ReleaseCase("empty answer", TRACE, EMPTY_ANSWER, False),
    ReleaseCase("dropped source", SELECTION_MISS, SUPPORTED_DEPLOY, False),
    ReleaseCase("missing rollback point", TRACE, PARTIAL_DEPLOY, False),
)
regression_passes = 0
for case in RELEASE_CASES:
    observed = can_release(case.trace, case.answer, GOLD)
    regression_passes += observed == case.should_release
    print(f"{case.name}: release={observed}, expected={case.should_release}")
print(f"Regression checks passed: {regression_passes}/{len(RELEASE_CASES)}")
assert regression_passes == len(RELEASE_CASES)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
supported answer: release=True, expected=True
unsupported bypass: release=False, expected=False
wrong citation: release=False, expected=False
empty answer: release=False, expected=False
dropped source: release=False, expected=False
missing rollback point: release=False, expected=False
Regression checks passed: 6/6
```
<!-- leetllm: output:end -->

Release behavior is now concrete: pass the supported response and reject the five controlled defects.

## Slice results before trusting an average

A larger <span data-glossary="golden-dataset">golden set</span> should include release-freeze deploys, incident hotfixes, schema migrations, and data <span data-glossary="backfill">backfills</span>. Aggregate quality can remain high while a costly policy slice regresses.

<!-- leetllm: test, output=show, continue=rag-red-team, id=rag-slices -->
```python title="slice-level-report.py"
@dataclass(frozen=True)
class LabeledOutcome:
    workflow: str
    released_correctly: bool

    def __post_init__(self) -> None:
        if not isinstance(self.workflow, str) or not self.workflow.strip():
            raise ValueError("workflow must be a nonempty string")
        if type(self.released_correctly) is not bool:
            raise ValueError("outcome must be a Boolean")


OUTCOMES = (
    LabeledOutcome("release-freeze", True),
    LabeledOutcome("release-freeze", False),
    LabeledOutcome("incident-hotfix", True),
    LabeledOutcome("incident-hotfix", True),
    LabeledOutcome("schema-migration", False),
)
by_workflow: dict[str, list[bool]] = defaultdict(list)
for outcome in OUTCOMES:
    by_workflow[outcome.workflow].append(outcome.released_correctly)

overall = sum(outcome.released_correctly for outcome in OUTCOMES) / len(OUTCOMES)
print(f"Overall pass rate: {overall:.0%}")
for workflow, results in sorted(by_workflow.items()):
    print(f"{workflow}: {sum(results)}/{len(results)} ({sum(results) / len(results):.0%})")
assert overall == 0.6
assert sum(by_workflow["schema-migration"]) == 0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Overall pass rate: 60%
incident-hotfix: 2/2 (100%)
release-freeze: 1/2 (50%)
schema-migration: 0/1 (0%)
```
<!-- leetllm: output:end -->

<!-- leetllm: test, output=show, continue=rag-slices, id=rag-release-report -->
```python title="release-report.py"
REQUIRED_FIXTURE_SLICES = frozenset({"release-freeze", "incident-hotfix", "schema-migration"})


def slice_regression_clear(results_by_workflow: dict[str, list[bool]]) -> bool:
    # The local 95/100 rule is exact count arithmetic, not a population bound.
    if not REQUIRED_FIXTURE_SLICES.issubset(results_by_workflow):
        return False
    for workflow in REQUIRED_FIXTURE_SLICES:
        results = results_by_workflow[workflow]
        if (
            not isinstance(results, list)
            or not results
            or any(type(result) is not bool for result in results)
            or sum(results) * 100 < 95 * len(results)
        ):
            return False
    return True


release_report = {
    "service_version": "policy-answerer-v4-eval",
    "source_trace": TRACE.case_id,
    "required_policy_version": EVIDENCE[TARGET_ID].version,
    "checks": {
        "admissible_evidence_path": admissible_evidence_path(TRACE, GOLD),
        "supported_answer_released": can_release(TRACE, SUPPORTED_DEPLOY, GOLD),
        "known_bad_answers_blocked": all(
            not can_release(case.trace, case.answer, GOLD)
            for case in RELEASE_CASES
            if not case.should_release
        ),
        "slice_regression_clear": slice_regression_clear(by_workflow),
    },
}
print("Release checks:", release_report["checks"])
print("Release allowed:", all(release_report["checks"].values()))
assert not all(release_report["checks"].values())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Release checks: {'admissible_evidence_path': True, 'supported_answer_released': True, 'known_bad_answers_blocked': True, 'slice_regression_clear': False}
Release allowed: False
```
<!-- leetllm: output:end -->

The supported trace passes, but this synthetic five-case report blocks release. Two required slices miss the local 95% threshold. Missing or empty required slices also fail; an empty report mustn't pass through `all([])`. The two incident-hotfix successes don't establish a 95% population success rate. This lab only requires a nonempty slice to demonstrate logic. A real study must predefine thresholds, required slices, adequate sample sizes, and uncertainty rules.

Choose the aggregation unit with equal care. For the formulas below, $N$ counts answers with $m_i>0$ atomic claims; report empty-claims cases and abstentions separately rather than silently assigning an undefined ratio. Two averages answer different questions:

1. **Pooled-claim faithfulness (micro-average):** All claims from all answers are dumped into a single pool:
   $$
   \operatorname{Faithfulness}_{\text{pooled}} = \frac{\sum_{i=1}^N \sum_{j=1}^{m_i} \mathbb{I}(\text{entailed}(c_{i,j}, E_i))}{\sum_{i=1}^N m_i}
   $$
2. **Mean per-answer faithfulness (macro-average):** Each answer's faithfulness ratio is computed individually, and those ratios are averaged across queries:
   $$
   \operatorname{Faithfulness}_{\text{macro}} = \frac{1}{N} \sum_{i=1}^N \left( \frac{\sum_{j=1}^{m_i} \mathbb{I}(\text{entailed}(c_{i,j}, E_i))}{m_i} \right)
   $$

Pooling weights answers by claim count; a per-answer mean weights answers equally. Neither is inherently the correct estimand for every study. Label the unit and show both when the distinction affects interpretation.

Compare two evaluation cases:

- Query 1: The model generates a wordy, 9-claim explanation of a basic policy rule. Every single claim is entailed by the context (9/9 supported, 100% faithfulness).
- Query 2: The model generates a concise, 1-claim response on a critical freeze rule, but hallucinates an unauthorized bypass (0/1 supported, 0% faithfulness).

Under pooled-claim aggregation:
$$
\operatorname{Faithfulness}_{\text{pooled}} = \frac{9 + 0}{9 + 1} = \frac{9}{10} = 90\%
$$
Under mean per-answer aggregation:
$$
\operatorname{Faithfulness}_{\text{macro}} = \frac{1.0 + 0.0}{2} = 50\%
$$
The fraction of nonempty answers whose claims are all supported is:
$$
\operatorname{ClaimSupportPass} = \frac{1 + 0}{2} = 50\%
$$

The first answer contributes nine times the weight under pooling. These two cases don't establish a population failure rate. Complete claim support also doesn't detect omissions: `PARTIAL_DEPLOY` has no unsupported claims but misses rollback. Avoid labeling this pass fraction "safety" or treating it as complete task success.

<!-- leetllm: test, output=show, continue=rag-release-report, id=rag-aggregation -->
```python title="claim-versus-answer-aggregation.py"
import numpy as np

counts = np.array([[9.0, 9.0], [0.0, 1.0]])  # [supported, emitted] per answer
pooled = float(counts[:, 0].sum() / counts[:, 1].sum())
per_answer = float((counts[:, 0] / counts[:, 1]).mean())
claim_support_pass = float((counts[:, 0] == counts[:, 1]).mean())
print(f"Pooled claim support: {pooled:.0%}")
print(f"Mean per-answer support: {per_answer:.0%}")
print(f"All-claims-supported fraction: {claim_support_pass:.0%}")
print(f"Partial answer: all claims supported={faithfulness(PARTIAL_DEPLOY, TRACE) == 1.0}, "
      f"task complete={supported_point_coverage(PARTIAL_DEPLOY, TRACE, GOLD) == 1.0}")
assert (pooled, per_answer, claim_support_pass) == (0.9, 0.5, 0.5)
assert not can_release(TRACE, PARTIAL_DEPLOY, GOLD)
assert not slice_regression_clear({})
assert not slice_regression_clear({workflow: [] for workflow in REQUIRED_FIXTURE_SLICES})
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Pooled claim support: 90%
Mean per-answer support: 50%
All-claims-supported fraction: 50%
Partial answer: all claims supported=True, task complete=False
```
<!-- leetllm: output:end -->

Choose claim-support, completeness, and critical-slice rules for the actual product before comparing systems. Evaluate the same questions and retain paired results. Claims within an answer and paraphrases of the same case aren't independent test questions. Estimate uncertainty at the question or case-family level, keep calibration separate from held-out evaluation, and show slice counts. A high average over near-duplicates isn't broad coverage.

## Where automated judges enter

The harness's answer key makes the arithmetic testable. It doesn't solve semantic support checking. Once questions or answers change, humans or a <span data-glossary="calibration">calibrated</span> judge must decide whether each claim is entailed, contradicted, or not established by the selected evidence.

The original RAGAS paper estimates faithfulness from claim support, answer relevance from <span data-glossary="embedding">embedding</span> similarity to questions generated from the answer, and context relevance from extracted relevant sentences. "Reference-free" means the metric needs no gold answer. It still judges claims against retrieved evidence.[^es2023] ARES trains judges on synthetic examples and uses human labels with prediction-powered inference to estimate aggregate evaluation scores with <span data-glossary="confidence-interval">confidence intervals</span>. Those intervals quantify aggregate system-level estimates. Evaluate each answer against its evidence and labels.[^saadfalcon2023ares]

Distinguish what semantic scoring addresses from decisions requiring deterministic enforcement: an automated judge can evaluate fluent paraphrases, but cannot authorize a restricted chunk or reconstruct missing citation lineage. Those approaches don't remove the need for this trace design. An automated judge still needs:

| Input | Why the judge needs it |
|---|---|
| Question and expected workflow | Decide whether the answer addressed the request |
| Selected context and version | Decide whether claims are grounded in allowed evidence |
| Atomic claims and citations | Explain which claim failed and which source was cited |
| Human-reviewed calibration set | Detect judge mistakes and drift |

For a support judge, include supported claims, contradictions, missing evidence, valid paraphrases, wrong citations, and appropriate abstentions. A set containing only good answers can't measure false acceptance. Give reviewers the same question and versioned evidence as the judge; resolve ambiguous labels and measure both false accepts and false rejects on held-out cases. Record the judge model, prompt, rubric, and parsing failures. Retrieved text is evidence to assess, not instructions the judge should obey.

For a separate clarity comparison, use two already-supported answers and randomize their presentation order. Don't substitute a preference for fluent writing for evidence entailment. Authorization and trace integrity stay independent of any later semantic judge.

## Release gates for `policy-answerer-v4`

Before serving operational traffic, verify the complete gate sequence:

| Gate | Minimum evidence | First fix when it fails |
|---|---|---|
| Authorization | Retrieved, reranked, and selected chunk IDs; versions; <span data-glossary="acl">ACL</span>/freshness decision | Evidence filtering |
| Candidate recall | Required chunk in retrieved candidates | <span data-glossary="chunking">Chunking</span>, query, or retrieval lane |
| Context selection | Sufficient selected evidence; measure distracting context separately | Reranker or context packing |
| Faithfulness | Supported claim ledger | Prompt, abstention, or generation policy |
| Citation support | Claim-to-source validation | Citation attachment or validator |
| Completeness | Required points covered, or justified abstention on an unanswerable case | Answer policy and coverage rubric |
| Slice health | Workflow-level regression report | Block release and debug affected slice |

Don't compress these gates into one quality percentage. A dashboard should tell an engineer what to repair first. Use the first failed check to choose the next inspection. A supported omission is a different defect from a direct contradiction, and an average can easily obscure a broken policy slice.

```mastery-quiz
[
  {
    "question": "A refund-policy evaluation trace returns a restricted customer credit note among first-stage candidates, then drops it during reranking before selecting the correct public policy. How should the security evaluation gate classify this trace?",
    "options": [
      "Fail authorization; the restricted returned candidate already crossed the retrieval perimeter.",
      "Pass authorization; grade the public policy that survived the final context-selection step.",
      "Fail candidate recall; restricted candidates remove credit for the retrieved public policy.",
      "Pass authorization; count the dropped note as noise in selected-context precision."
    ],
    "answer": "Fail authorization; the restricted returned candidate already crossed the retrieval perimeter.",
    "explanation": "Authorization covers returned candidates as well as selected context. Dropping forbidden evidence later does not undo earlier exposure through scores, traces, or caches. Recall and selected-set precision measure different subsets."
  },
  {
    "question": "The current policy revision, r8, reverses a rule. An archived trace shows that the model received r7 when it answered. Which revision should you use to check historical faithfulness, and which should you use to check whether the answer is correct today?",
    "options": [
      "r8 for faithfulness, r7 for correctness.",
      "r7 for faithfulness, r8 for correctness.",
      "r7 for faithfulness, r7 for correctness.",
      "r8 for faithfulness, r8 for correctness."
    ],
    "answer": "r7 for faithfulness, r8 for correctness.",
    "explanation": "The archived prompt contained r7, so r7 tells you whether the evidence supported the answer when the model gave it. Using r8 for that check would judge the answer against a rule the model never saw. Today r8 is in force, so using r7 for present correctness would apply the superseded rule. Swapping the revisions makes both mistakes."
  },
  {
    "question": "Required useful source IDs are A and B. Candidates are A, B, C and D; selected context is A, C and D. All four IDs are permitted and current. What are candidate recall, context recall and selected-set precision?",
    "options": [
      "1, 1/2, 1/3.",
      "2/3, 1/3, 1/2.",
      "1, 1/3, 1/2.",
      "1/2, 1/2, 1."
    ],
    "answer": "1, 1/2, 1/3.",
    "explanation": "Candidates recover both required IDs, giving 2/2. Selection retains A only, giving 1/2 recall and one useful ID among three selected IDs, or 1/3 precision."
  },
  {
    "question": "An answer emits five adjudicated claims. Four are supported, but those four cover only three distinct points among five required points. Citations are valid. What are faithfulness, potential completeness and the first failed answer check?",
    "options": [
      "4/5, 4/5, completeness; supported claims each fill one of the five required-point slots.",
      "3/5, 4/5, faithfulness; the five required-point slots determine the support numerator.",
      "4/5, 3/5, faithfulness; the ordered short circuit leaves later completeness unscored.",
      "1, 3/5, completeness; the supported majority passes before checking required points."
    ],
    "answer": "4/5, 3/5, faithfulness; the ordered short circuit leaves later completeness unscored.",
    "explanation": "Faithfulness uses four supported claims out of five emitted. Completeness would use three distinct covered required points out of five, with duplicates adding no point. The ordered harness stops at faithfulness and leaves later metrics unscored."
  },
  {
    "question": "Four claims are supported by selected evidence. Three cite the correct supporting source, and the fourth has a blank citation. What are faithfulness, citation coverage and citation support before repairing that attachment?",
    "options": [
      "Faithfulness 3/4; coverage 1; support 3/4.",
      "Faithfulness 1; coverage 3/4; support 3/4.",
      "Faithfulness 1; coverage 1; support 3/4.",
      "Faithfulness 1; coverage 3/4; support 1."
    ],
    "answer": "Faithfulness 1; coverage 3/4; support 3/4.",
    "explanation": "The selected evidence supports all four claims, so faithfulness is 4/4. Three claims have citations, and each citation supports its claim. Coverage and citation support are therefore both 3/4. A faithfulness score of 3/4 treats the missing citation as missing evidence. Full coverage counts the blank as a citation. Full citation support counts only the three attached citations and drops the fourth claim from the denominator."
  },
  {
    "question": "A new answer says that sign-off from the incident commander is mandatory. Its wording is absent from the reviewed exact key, but it carries a familiar approval claim ID. What should the exact-key harness do?",
    "options": [
      "Accept support from the approval ID and use the same ID to fill the required-point slot.",
      "Mark contradiction from the unknown wording and count a confirmed faithfulness failure.",
      "Copy the answer’s implied support label into the key and finish release scoring.",
      "Route the text to independent claim review before assigning semantic support or point credit."
    ],
    "answer": "Route the text to independent claim review before assigning semantic support or point credit.",
    "explanation": "The exact key does not understand unseen wording. Both valid paraphrases and new contradictions need adjudication. A generated identifier cannot supply an independent support annotation."
  },
  {
    "question": "A caller cannot access a policy that would answer a waiver question. The permitted current corpus has no answer, and selected context is insufficient. A reviewed response explains that limit and refers the caller to the policy owner. How does the declared abstention rubric classify it?",
    "options": [
      "Safe response and task success; answerability uses this caller’s permitted corpus, which has no established waiver.",
      "Safe response but retrieval failure; organizational policies outside this caller’s scope belong in its answerability label.",
      "Unnecessary abstention and task failure; the inaccessible policy counts as sufficient selected evidence for this caller.",
      "Unsupported answering and task failure; referring to the policy owner asserts that an effective waiver exists."
    ],
    "answer": "Safe response and task success; answerability uses this caller’s permitted corpus, which has no established waiver.",
    "explanation": "Answerability is relative to the permitted current corpus. A bounded statement about insufficient available evidence is distinct from an unsupported universal. Task success follows this declared abstention rubric, not general safety certification."
  },
  {
    "question": "Two nonempty answers have supported/emitted claim counts of 6/8 and 1/2. What are pooled-claim faithfulness and mean per-answer faithfulness?",
    "options": [
      "62.5% pooled; 70% per answer.",
      "70% pooled; 75% per answer.",
      "70% pooled; 62.5% per answer.",
      "75% pooled; 50% per answer."
    ],
    "answer": "70% pooled; 62.5% per answer.",
    "explanation": "Pooling gives seven supported claims out of ten. Equal-answer weighting gives (0.75+0.50)/2=0.625. The same outputs receive different weights under the two declared aggregation units."
  },
  {
    "question": "The release gate for a returns assistant checks refunds, exchanges and store credit. Each workflow needs at least one case, and the assistant must answer at least 90% of its cases correctly. The full regression suite has 3 errors in 30 refund cases, 2 in 25 exchange cases and none in 15 cancellation cases. The team chose these cases by hand. What should it report about release and production accuracy?",
    "options": [
      "Pass on the pooled result. The refund and exchange rates describe only the tested cases.",
      "Pass on the pooled result. The refund and exchange rates establish at least 90% accuracy in production.",
      "Hold for store-credit cases. The refund and exchange rates establish at least 90% accuracy in production.",
      "Hold for store-credit cases. The refund and exchange rates describe only the tested cases."
    ],
    "answer": "Hold for store-credit cases. The refund and exchange rates describe only the tested cases.",
    "explanation": "Refunds meet the cutoff at 27/30 (90%), and exchanges clear it at 23/25 (92%). The 15 correct cancellation cases bring the pooled result to 65/70, but they provide no evidence for store credit. The release gate needs cases for that workflow too. Estimating production accuracy requires a representative sample of real requests and a measure of sampling uncertainty."
  },
  {
    "question": "A support judge is tuned on 80 supported answers and no unsupported answers. The team now wants to estimate false acceptance on a frozen test. Which repair supplies the missing evidence while preserving the evaluation boundaries?",
    "options": [
      "Add unsupported and ambiguous cases to a frozen human-labeled test; retain versioned evidence and access checks, and count format failures separately.",
      "Reuse the 80 supported tuning cases as the final test; retain versioned evidence and access checks, and interpret high acceptance as low false acceptance.",
      "Add unsupported cases to training and evaluate that same set; retain versioned evidence but let learned semantic support replace the application’s access checks.",
      "Keep supported-only examples and ask the judge to label fresh test cases; check the JSON format and treat valid structure as evidence of semantic correctness."
    ],
    "answer": "Add unsupported and ambiguous cases to a frozen human-labeled test; retain versioned evidence and access checks, and count format failures separately.",
    "explanation": "Supported-only examples cannot measure acceptance of unsupported claims. Independent held-out labels must include the failure class being measured. Parsing success, semantic correctness and evidence authorization remain separate checks."
  }
]
```

> **Next:** Continue to [LLM-as-a-Judge Evaluation](/learn/llm-as-judge-automated-evaluation). The fixed answer key cannot score a paraphrase it has never seen. Rubric-driven judgments can, once you measure judge errors and keep evidence access and trace integrity as separate checks.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Everything upstream worked. Retrieval found the rule, the reranker placed it first, and access permissions passed. When an engineer asks what procedures govern a payment service deployment during a release freeze, the model answers:

> The release-freeze rule applies. You can deploy without a linked rollback plan. [policy-v2]

The operational policy strictly requires a linked rollback plan. This answer tells an engineer, during a freeze on a payment system, that they can skip critical safety controls, citing the very rule that mandates them. It reads well, addresses the right topic, and cites a real identifier. If evaluation consists of cursory spot-checks or surface relevance scores, this catastrophic answer passes unnoticed. Detecting such failures requires decomposing quality into independent, testable criteria.

## Separate questions, separate failures

The RAG Triad separates context relevance, groundedness (faithfulness), and answer relevance.[^trulens2023triad] Expanding these into operational engineering gates yields a structured evaluation sequence:

| Stage | Question |
|---|---|
| Source eligibility | Was every source in the prompt permitted and current? |
| Candidate recall | Did retrieval find an acceptable passage? |
| Context recall | Did the selected prompt keep that passage? |
| Faithfulness | Does the passage entail each claim the answer makes? |
| Citation support | Does the attached source support that particular claim? |
| Completeness | Did the answer include the required points? |

A passage entails a claim when, if the passage is true, the claim must be true too. What earlier chapters termed coverage is context recall here, and candidate recall is the retrieval step before it. Source eligibility outranks downstream scores: if a request used documents the caller is not authorized to see, the trace fails immediately regardless of answer accuracy. Furthermore, citation presence merely confirms an identifier exists; verifying attribution requires confirming entailment between the specific claim and cited passage.

## Do it by hand first

Before constructing an evaluation harness, work through the arithmetic with three candidate answers evaluated against three required conditions: freeze scope, incident commander approval, and a linked rollback plan:

| Answer | Claims it makes | Required points correctly covered |
|---|---|---|
| Complete | Scope, approval, rollback requirement | Three of three |
| Partial | Scope and approval | Two of three |
| Unsafe | Scope and permission to omit rollback | One of three |

The partial answer makes two claims, both supported by evidence, giving a faithfulness score of $2/2=1.0$. However, its completeness is only $2/3$, leaving an operator unaware of rollback prerequisites. Faithfulness measures only what the model asserted, remaining blind to omissions. In contrast, the unsafe answer makes two claims (one supported, one contradicted) for a faithfulness of $1/2$ and completeness of $1/3$.

<figure>
<img src="illustrations/_generated/rag_eval_matrix_dark.png" alt="A matrix scores complete, partial, and unsafe answers against the release freeze scope, approval, and the rollback plan. The complete answer supports all three, for faithfulness 3 of 3 and completeness 3 of 3. The partial answer supports two and omits rollback, for 2 of 2 and 2 of 3. The unsafe answer supports scope, omits approval, and reverses rollback, for 1 of 2 and 1 of 3." />
<figcaption>Faithfulness divides by the claims an answer made. Completeness divides by the points it had to make. That difference in denominators is what exposes the partial answer, which scores 2/2 and 2/3 on the same text.</figcaption>
</figure>

These calculations depend on splitting answers into atomic claims. Methods such as FActScore demonstrate that evaluating claims individually avoids coarse passage-level scoring errors.[^min2023] Preserving qualifiers and conditional logic during extraction ensures atomic statements accurately reflect the original response.

## Replay against what the model actually saw

An evaluation harness must evaluate against the exact context revision the model received during generation. Comparing against current documentation answers whether the output is true today, while comparing against recorded prompt context answers whether the model remained faithful to what it was given. Both questions are valid, but they diagnose different problems. The harness resolves sources, revisions, and required points independently rather than trusting model self-reports.

Record candidate and selected IDs separately. If a rule appears among initial candidates but is omitted from prompt context, the primary failure occurs at context selection rather than candidate retrieval. Separating these stages prevents model fine-tuning from taking credit for what was fundamentally a ranking or truncation defect.

Context precision provides a straightforward set metric: acceptable passage IDs in context divided by all selected IDs ($1/3$ when one useful rule is accompanied by two distractors).

## A small evaluator

The following evaluator uses an exact answer key to verify faithfulness, citation attribution, and completeness in sequence. It halts at the earliest failing stage to pinpoint defects deterministically:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="reader-rag-claims.py"
from dataclasses import dataclass
import numpy as np

SOURCE = "payment-service-freeze-v2-rule"
POINTS = {
    "scope": "The release-freeze rule applies.",
    "approval": ("Incident-commander approval is required "
                 "before deployment."),
    "rollback": ("A linked rollback plan is required "
                 "before deployment."),
}
REQUIRED = set(POINTS.values())
CONTRADICTION = "You can deploy without a linked rollback plan."

@dataclass(frozen=True)
class Claim:
    text: str
    citation: str

def evaluate(claims):
    if not claims:
        return "no claims: evaluate the abstention state separately"
    known = REQUIRED | {CONTRADICTION}
    if any(claim.text not in known for claim in claims):
        return "review: wording outside the exact answer key"
    support_mask = np.array([c.text in REQUIRED for c in claims], dtype=bool)
    cite_mask = np.array([c.citation == SOURCE for c in claims], dtype=bool)
    faithfulness = float(support_mask.mean())
    if faithfulness < 1.0:
        return f"faithfulness {faithfulness:.2f}: stop"
    cited = float((support_mask & cite_mask).sum() / len(claims))
    report = f"faithfulness 1.00, citations {cited:.2f}"
    if cited < 1.0:
        return report + ": stop"
    covered = {c.text for c in claims if c.text in REQUIRED}
    completeness = len(covered) / len(POINTS)
    decision = "pass" if completeness == 1.0 else "stop"
    return f"{report}, completeness {completeness:.2f}: {decision}"

RUNBOOK = "payment-service-rollback-runbook"
PARAPHRASE = "Deployments need the incident commander's permission."
complete = [Claim(text, SOURCE) for text in POINTS.values()]
partial = complete[:2]
unsafe = [complete[0], Claim(CONTRADICTION, SOURCE)]
miscited = [Claim(text, RUNBOOK) for text in POINTS.values()]
unknown = [Claim(PARAPHRASE, SOURCE)]
assert evaluate(complete).endswith("pass")
assert "faithfulness 0.50" in evaluate(unsafe)
assert "citations 0.00" in evaluate(miscited)
assert evaluate(unknown).startswith("review:")
answers = {
    "complete": complete, "partial": partial, "unsafe": unsafe,
    "miscited": miscited, "paraphrase": unknown,
}
for name, claims in answers.items():
    print(name + ":", evaluate(claims))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
complete: faithfulness 1.00, citations 1.00, completeness 1.00: pass
partial: faithfulness 1.00, citations 1.00, completeness 0.67: stop
unsafe: faithfulness 0.50: stop
miscited: faithfulness 1.00, citations 0.00: stop
paraphrase: review: wording outside the exact answer key
```
<!-- leetllm: output:end -->

The complete answer passes. The partial answer gets all the way to completeness, then stops. The unsafe answer stops at faithfulness. The miscited answer has correct text attached to the wrong source, and it fails there, leaving its completeness unscored.

The last line matters as much as the others. "Deployments need the incident commander's permission" may well express the approval point correctly, and the evaluator says plainly that it does not know. Treating every unknown phrase as false would blame the answer for the limits of your evaluator, and accepting them all would create the opposite error. Keep "review" as a real outcome, and report how often it fires.

Real answers can also need a combination of sources, conditional reasoning, units, dates, or calculations, and those need richer annotations than this.

```checkpoint
An answer makes four claims. Three are supported and one is contradicted, and those three cover three of the policy's five required points. What are its faithfulness and completeness, and where does our evaluator stop?
---
Faithfulness is $3/4$ and completeness is $3/5$, since one divides by the claims made and the other by the points required. The evaluator stops at faithfulness, so it reports 0.75 and leaves completeness unscored.
```

## A citation is a claim about a claim

Suppose the complete answer cites a separate rollback runbook for every sentence. That runbook exists, it is in the corpus, and it contains useful operational steps. It still may not say anything about the release-freeze approval rule. So a citation needs two checks. First, resolve it through the trusted record of what the model was actually given. Then check whether that source, at the recorded revision, supports the attached claim. In a sentence with two independent claims, one valid citation can support one claim and leave the other hanging.

<figure>
<img src="illustrations/_generated/trace_diagnosis_loop_dark.png" alt="Three answer claims each have a solid line to the policy rule in the prompt, which supports them, and a dashed line to a rollback runbook that was never selected, which they cite. The checks run in order: the selected context includes the policy rule and passes, faithfulness passes at 3 of 3, citation support fails at 0 of 3 as the first failure, and completeness stays unscored." />
<figcaption>The selected rule supports all three claims, and every citation points to a different document that was never in the prompt. Faithfulness passes, citation support fails at 0 of 3, and the later check stays unscored until this one is fixed.</figcaption>
</figure>

ID checks can be deterministic. Semantic support generally needs human labels, a validated model, or a narrow domain-specific procedure. Report them separately, so a good average cannot hide a failed ID check.

## Grading an abstention

An empty answer has no claims, which makes faithfulness undefined. Some tools assign a conventional score to this case. If yours does, document it, and make sure an abstention never turns into a silent perfect score.

To grade an abstention, separate two questions: could the permitted corpus answer this, and did the selected context contain enough to answer? The answers lead to very different situations, and those look nearly identical to the user. If the corpus has the rule and retrieval missed it, abstaining was reasonable given the context, but you still have a retrieval bug to fix. If the corpus truly lacks the policy, abstaining may be correct, and you have a gap in the corpus to look at. If complete evidence reached the model and it abstained anyway, the abstention was unnecessary. A qualified partial answer may also be acceptable, one that states the supported scope and says the approval conditions are unavailable, as long as your product allows it and you do not score it as having finished the task.

## Follow the first failure

Run your checks in order, from eligibility through candidate recall and context recall to faithfulness, citations, and completeness. Store the result of each one, and mark later checks unscored when a failed prerequisite makes them meaningless.

The first failure tells you where to start looking, but it is not a verdict about the cause. A stale source can produce both wrong retrieval labels and bad advice. A packaging bug can hide a condition from both the generator and the evaluator. Replaying the recorded source and changing one stage at a time will tell you more.

While you build the harness, test it with deliberate damage. Remove the target from the candidates. Keep it in the candidates and remove it from the context. Reverse one condition in the answer. Attach an unselected source. Omit a required point. Each of these should produce a different first failure. If two of them look the same, your harness cannot tell apart repairs your team might make.

```checkpoint
A trace shows the rule among the candidates and missing from the context, and the model abstained. Was the abstention wrong, and where is the bug?
---
Abstaining was reasonable, since the model never saw the rule. Candidate recall passed and context recall failed, so the bug is in ranking or packing. Do not charge it to the generator, and do not expect a better prompt to fix it.
```

## Be careful with averages

A single faithfulness number hides choices. Suppose one response has nine supported claims and another has one unsupported claim. Pool the claims and you get $9/10=90\%$. Average the two answers and you get $(1+0)/2=50\%$. Both are correct, but they tell very different stories. Pooling lets one long answer dominate, while averaging treats each answer equally. So report the unit, the numerator, the denominator, and how you treated abstentions and review cases. If you left unknown paraphrases out of a score, say how much of the data the score covers.

Slice your results by what can fail: exact policy codes, paraphrases, revoked sources, missing conditions, look-alike documents, and unanswerable requests. Keep the evaluation set separate from the examples you tune on. Ten paraphrases of one rule are mostly one test, since they share a failure family, so prefer the same number of independent policies and tasks.

Set release thresholds from consequences. A small frozen suite is good at blocking a known regression. To estimate how often production fails, you need a random sample of real traffic and an error bar. Report severe failures, such as unauthorized sources or dangerous advice, on their own, because an average will hide exactly those. Then keep watching whether real traffic still resembles what you evaluated, and version your reports, since a score means little once the corpus, the model, or the prompt has moved on.

## Where the answer key runs out

Add a fourth required point to the policy, and the complete answer's completeness drops to three quarters while its faithfulness holds. Change one citation and leave the text alone, and only citation support moves. These independent responses are the whole argument for keeping the measurements separate: a single blended score would have moved in both cases, and left you guessing which fix to make.

That paraphrase in the evaluator's last line is still waiting for a verdict. The evidence is there. What remains is interpreting language, which an exact key cannot do, and which a careful reviewer does without effort. Before you automate that judgment, write down the rubric such a reviewer would use, and collect examples they have settled, including plausible unsupported paraphrases and incomplete answers.

The next chapter, [LLM as a Judge](/learn/llm-as-judge-automated-evaluation), hands that job to a model. A judge can read paraphrases that no answer key anticipated, but it comes with failure modes of its own, so we treat it like any other measuring instrument, one that has to earn your trust.

<!-- leetllm: edition:reader:end -->
