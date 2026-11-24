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
  "shortDescription": "Test whether a RAG answer is supported, cites the right source, and covers every required point. Catch convincing answers that still get the rule wrong.",
  "keyConceptsTested": [
    "Evidence-path evaluation traces",
    "Retrieval and selected-context checks",
    "Claim-level faithfulness",
    "Citation support versus citation presence",
    "First failed check versus causal diagnosis",
    "Regression suites and claim-versus-answer aggregation",
    "Layered RAG evaluation decisions"
  ],
  "coverImage": "illustrations/_generated/rag_eval_matrix_dark.png"
}
---
<!-- leetllm: edition:reference:start -->

Everything upstream worked. <span data-glossary="hybrid-search">Hybrid search</span> retrieved the governing deployment rule, the <span data-glossary="reranker">reranker</span> placed it first in the prompt, and access checks passed. Yet when an engineer asks what is required for a payment-service deployment during a release freeze, the assistant replies:

> The release-freeze rule applies. You can deploy without a linked <span data-glossary="rollback">rollback</span> plan. [policy-v2]

The answer reads fluently, stays on topic, and attaches a real source citation, yet it tells the engineer the exact opposite of the rule (which requires both incident commander approval and a linked rollback plan before <span data-glossary="rollout">rollout</span>).

Evaluating <span data-glossary="rag">retrieval-augmented generation (RAG)</span> reliably means decomposing quality along the evidence <span data-glossary="tracing">trace</span> instead of collapsing retrieval, grounding, citations, and completeness into one blended score. Our <span data-glossary="eval-harness">evaluation harness</span> checks each stage in order and reports the earliest failing <span data-glossary="eval-gate">check</span> so engineers immediately know which component to fix.

<figure>
  <img src="illustrations/_generated/rag_eval_matrix_dark.png" alt="A three-point policy rule is compared with complete, partial, and unsafe answers. Green cells show supported claims, the partial answer leaves rollback out, and the unsafe answer covers scope, omits approval, and contradicts rollback. Faithfulness uses supported emitted claims; completeness uses supported required points." />
  <figcaption>The partial answer is fully faithful (2/2 claims supported) yet covers only 2 of 3 required points. The unsafe answer covers scope, omits approval, and contradicts the rollback requirement (1/2 faithful, 1/3 complete).</figcaption>
</figure>

The **RAG Triad** organizes evaluation around context relevance, groundedness (faithfulness), and answer relevance.[^trulens2023triad] In production, expand those three into six ordered checks:

1. **Source eligibility:** Was every chunk returned in the trace permitted for the caller and current on the request date?
2. **Candidate and context recall:** Did retrieval find the required passage, and did reranking and packing keep it in the prompt?
3. **Claim faithfulness:** Does the selected context entail every atomic claim emitted by the model?[^es2023]
4. **Citation support:** Does the specific source attached to each claim actually support that claim?
5. **Task completeness:** Did the answer cover every mandatory point rather than silently omitting one?
6. **Answer relevance:** Does the response directly address the question asked?

> **Key insight:** Faithfulness divides by the claims the answer *made*; completeness divides by the points the task *required*. An answer that omits a mandatory condition can still score 1.0 on faithfulness.

## Replay the freeze-deploy trace

Start from a recorded trace for the question:

> What does Section 4.2 require for a payment-service production deploy during a release freeze?

The trace records `first_stage_ids`, `rerank_input_ids`, `reranked_ids`, `selected_context_ids`, `selected_versions`, and component `versions` so evaluation inspects the exact evidence the model received:

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
        "Payment-service deploys may bypass freeze approval during executive overrides.",
    ),
}
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
        ("dense", "static-embeddings-v1"),
        ("fusion", "rrf-k60"),
        ("reranker", "rule-cross-encoder-v1"),
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
Pipeline versions: {'retriever': 'policy-retriever-v2', 'index': 'policy-index/2026-06-02', 'sparse': 'bm25-tokenizer-v1', 'dense': 'static-embeddings-v1', 'fusion': 'rrf-k60', 'reranker': 'rule-cross-encoder-v1'}
```
<!-- leetllm: output:end -->

## Check source eligibility before scoring quality

No faithfulness score can justify using unauthorized or stale text. Every chunk returned across retrieval, reranking, and packing must be permitted, current, unique per stage, and version-matched against the recorded snapshot:

<!-- leetllm: test, output=show, continue=rag-eval-lab, id=rag-hard-gate -->
```python title="eligible-evidence-path-check.py"
def eligible_evidence_path(trace: RagTrace, gold: GoldCase) -> bool:
    if trace.case_id != gold.case_id or trace.question != gold.question:
        return False
    if not trace.selected_context_ids:
        return False
    if len(trace.selected_context_ids) != len(trace.selected_versions):
        return False
    required_version_keys = {"retriever", "index", "sparse", "dense", "fusion", "reranker"}
    version_map = dict(trace.versions)
    if len(version_map) != len(trace.versions):
        return False
    if not required_version_keys.issubset(version_map):
        return False
    if any(not str(version_map[key]).strip() for key in required_version_keys):
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
print("Trace path eligible:", eligible_evidence_path(TRACE, GOLD))
print("Restricted context eligible:", eligible_evidence_path(restricted_trace, GOLD))
print("Blocked candidate eligible:", eligible_evidence_path(blocked_candidate_trace, GOLD))
print("Unknown candidate eligible:", eligible_evidence_path(unknown_candidate_trace, GOLD))
print("Wrong-version path eligible:", eligible_evidence_path(stale_version_trace, GOLD))
print("Incomplete trace eligible:", eligible_evidence_path(missing_version_trace, GOLD))
print("Wrong-case trace eligible:", eligible_evidence_path(wrong_case_trace, GOLD))
print("Duplicate candidate eligible:", eligible_evidence_path(duplicate_candidate_trace, GOLD))
assert eligible_evidence_path(TRACE, GOLD)
assert not eligible_evidence_path(restricted_trace, GOLD)
assert not eligible_evidence_path(blocked_candidate_trace, GOLD)
assert not eligible_evidence_path(unknown_candidate_trace, GOLD)
assert not eligible_evidence_path(stale_version_trace, GOLD)
assert not eligible_evidence_path(missing_version_trace, GOLD)
assert not eligible_evidence_path(wrong_case_trace, GOLD)
assert not eligible_evidence_path(duplicate_candidate_trace, GOLD)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Trace path eligible: True
Restricted context eligible: False
Blocked candidate eligible: False
Unknown candidate eligible: False
Wrong-version path eligible: False
Incomplete trace eligible: False
Wrong-case trace eligible: False
Duplicate candidate eligible: False
```
<!-- leetllm: output:end -->

```checkpoint
A restricted break-glass note would answer the question completely. Why must evaluation fail before computing relevance?
---
Authorization decides which sources the caller may read. Letting restricted text enter returned candidates exposes it through scores, caches, traces, or reranker APIs even if it is later dropped from the prompt.
```

## Separate candidates from selected context

Once eligibility passes, check whether retrieval found the needed rule and whether reranking kept it in the prompt without dragging along noise:

| Layer | Metric | Question answered |
|---|---|---|
| Candidate retrieval | `candidate_recall` | Did first-stage search return the required chunk? |
| Selected context | `context_recall` | Did the chunk survive reranking and packing into the prompt? |
| Selected context | `selected_context_precision` | What fraction of packed chunks were useful rather than distractors? |

$$
\operatorname{Precision}_{\text{selected}} = \frac{|\text{selected chunk IDs} \cap \text{useful chunk IDs}|}{|\text{selected chunk IDs}|}
$$

Extra distractors add token cost and can degrade long-context attention.[^longcontext2024] While MRR and NDCG measure ranked placement,[^manning2008ir] generation depends on which chunks actually entered the prompt (note that set precision differs from rank-weighted variants like Ragas `ContextPrecision`[^ragas2026ContextPrecision]).

<!-- leetllm: test, output=show, continue=rag-hard-gate, id=rag-context-gates -->
```python title="evidence-path-metrics.py"
def coverage(ids: tuple[str, ...], required_ids: frozenset[str]) -> float:
    if not required_ids:
        raise ValueError("Source recall needs a nonempty reference set")
    if len(ids) != len(set(ids)):
        raise ValueError("Source recall needs unique selected IDs")
    return len(set(ids) & required_ids) / len(required_ids)


def selected_context_precision(ids: tuple[str, ...], useful_ids: frozenset[str]) -> float:
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
  <figcaption>The clean trace packs only the required rule (recall 1.0, set precision 1.0). Leaving two distractors in the prompt keeps recall at 1.0 while dropping set precision to 1/3.</figcaption>
</figure>

## Turn an answer into testable claims

Grading a paragraph as a whole hides partial errors. Following FActScore, decompose each answer into atomic claims paired with citations so each assertion can be checked individually:[^min2023]

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

## Faithfulness checks claims against context

Checking whether selected context $E$ supports atomic claim $c_j$ is a Natural Language Inference (NLI) judgment with three outcomes:

1. **Entailment ($E \implies c_j$):** Context supports the claim along with its conditions.
2. **Contradiction ($E \implies \neg c_j$):** Context directly conflicts with the claim (e.g., claiming no rollback plan is needed).
3. **Not entailed / Neutral:** Context lacks evidence either way (e.g., inventing an executive waiver).

Claim-level faithfulness is the fraction of emitted claims entailed by the selected context:[^es2023][^ragas2026Faithfulness]

$$
\operatorname{faithfulness} = \frac{\sum_{j=1}^m \mathbb{I}(\text{entailed}(c_j, E))}{m}
$$

Lexical overlap fails completely here: *"approval is required"* and *"approval is not required"* share almost every token while stating opposites. Below, our exact-key evaluator marks unknown phrasings for review instead of guessing:

<!-- leetllm: test, output=show, continue=rag-answers, id=rag-faithfulness -->
```python title="claim-faithfulness-check.py"
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

## Verify that each citation supports its claim

Faithfulness checks whether *something* in the prompt supports a claim; **citation support** checks whether the *attached citation* is both present in the prompt and actually supports that claim. Watch how `MIS_CITED` scores 1.0 on faithfulness while dropping to 0.0 on citation support:

<!-- leetllm: test, output=show, continue=rag-faithfulness, id=rag-citations -->
```python title="citation-support-check.py"
MIS_CITED = Answer(
    "mis-cited",
    tuple(
        replace(claim, citation_id="payment-service-rollback-runbook")
        for claim in SUPPORTED_DEPLOY.claims
    ),
)


def citation_coverage(answer: Answer) -> float:
    cited = sum(
        bool(claim.citation_id and claim.citation_id.strip())
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

```checkpoint
An answer gets faithfulness `1.0` but citation support `0.0`. What happened?
---
The prompt contains evidence supporting every claim, yet the attached citations point to a different or unselected document. Fix citation attribution rather than changing retrieval.
```

## Check whether the answer finished the task

An answer with 1.0 faithfulness can still omit a mandatory condition. Measuring **supported point coverage** against the three required points (`freeze-scope`, `approval`, `rollback-plan`) catches `PARTIAL_DEPLOY` at `0.67`:

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

```checkpoint
An answer emits no claims at all. Does having zero unsupported claims make it acceptable?
---
Not on an answerable question. Silence avoids hallucination while failing to answer the user; track empty responses and abstentions separately from faithfulness.
```

### When declining to answer is correct

To grade abstentions properly, separate **corpus answerability** (does the caller's permitted corpus contain an answer?) from **selected-context sufficiency** (did retrieval deliver it?):

| Corpus can answer? | Selected context sufficient? | Response | Diagnosis |
|---|---|---|---|
| yes | yes | Complete, supported answer | Task success |
| no | no | Explains missing evidence | Justified abstention |
| yes | no | Explains missing evidence | Safe response, retrieval/selection failure |
| yes | yes | Refuses anyway | Unnecessary abstention |

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
    if case.response not in {"complete-supported", "explicit-abstention", "unsupported"}:
        raise ValueError("Response needs independent review")
    supported_answer = case.response == "complete-supported" and case.context_sufficient
    safe_response = supported_answer or case.response == "explicit-abstention"
    evidence_path_ok = not case.corpus_answerable or case.context_sufficient
    task_success = supported_answer or (
        not case.corpus_answerable and case.response == "explicit-abstention"
    )
    return safe_response, evidence_path_ok, task_success


cases = (
    ReviewedOutcome("complete answer", True, True, "complete-supported"),
    ReviewedOutcome("waiver not found", False, False, "explicit-abstention"),
    ReviewedOutcome("missed rule, safe refusal", True, False, "explicit-abstention"),
    ReviewedOutcome("rule available, unnecessary refusal", True, True, "explicit-abstention"),
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
waiver not found: safe=True, evidence_path_ok=True, task_success=True
missed rule, safe refusal: safe=True, evidence_path_ok=False, task_success=False
rule available, unnecessary refusal: safe=True, evidence_path_ok=True, task_success=False
no waiver exists anywhere: safe=False, evidence_path_ok=True, task_success=False
```
<!-- leetllm: output:end -->

Notice the last case: saying *"No waiver exists anywhere"* is an unsupported universal claim, whereas *"The retrieved rules list no waiver"* is a valid abstention.

## Attribute the first failure

Running all eight checks in pipeline order tells you which stage broke first so you fix retrieval when retrieval failed and prompts when generation failed:

<figure>
  <img src="illustrations/_generated/trace_diagnosis_loop_dark.png" alt="Three answer claims each have a solid line to the policy rule in the prompt, which supports them, and a dashed line to a rollback runbook that was never selected, which they cite. The checks run in order: the selected context includes the policy rule and passes, faithfulness passes at 3 of 3, citation support fails at 0 of 3 as the first failure, and completeness stays unscored." />
  <figcaption>The selected rule supports all three claims, while every citation names an unselected runbook. Citation support fails first, leaving completeness unscored until attribution is fixed.</figcaption>
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
    if not eligible_evidence_path(trace, gold):
        return "source eligibility"
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

Verify that the evaluator cannot be fooled by negated wording, duplicate claims wearing a different ID, or unseen paraphrases:

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

Also check that mutating source text under an unchanged version ID or attaching whitespace-only citations gets caught immediately:

<!-- leetllm: test, output=show, continue=rag-counterexamples, id=rag-receipt-challenge -->
```python title="source-and-citation-counterexamples.py"
original_chunk = EVIDENCE[TARGET_ID]
EVIDENCE[TARGET_ID] = replace(original_chunk, text="Edited policy under an unchanged version")
try:
    print("Edited source diagnosis:", first_failed_stage(TRACE, SUPPORTED_DEPLOY, GOLD))
    assert first_failed_stage(TRACE, SUPPORTED_DEPLOY, GOLD) == "source eligibility"
    assert not source_supports(SUPPORTED_DEPLOY.claims[1], EVIDENCE[TARGET_ID])
finally:
    EVIDENCE[TARGET_ID] = original_chunk

blank_citations = Answer(
    "blank-citations",
    tuple(replace(claim, citation_id=" ") for claim in SUPPORTED_DEPLOY.claims),
)
wrong_question = replace(TRACE, question="Does a different service have a freeze exemption?")
print(f"Blank citation coverage: {citation_coverage(blank_citations):.1f}")
print("Changed question eligible:", eligible_evidence_path(wrong_question, GOLD))
assert citation_coverage(blank_citations) == 0.0
assert first_failed_stage(TRACE, blank_citations, GOLD) == "citation support"
assert not eligible_evidence_path(wrong_question, GOLD)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Edited source diagnosis: source eligibility
Blank citation coverage: 0.0
Changed question eligible: False
```
<!-- leetllm: output:end -->

## Make bad behaviors part of regression testing

A <span data-glossary="regression-suite">regression suite</span> checks both that good answers pass and that every known failure mode is rejected:

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

## Slice results before trusting an average

A <span data-glossary="golden-dataset">golden dataset</span> spans distinct workflows (release freezes, incident hotfixes, schema migrations, data <span data-glossary="backfill">backfills</span>). An overall pass rate hides a completely broken slice:

<!-- leetllm: test, output=show, continue=rag-red-team, id=rag-slices -->
```python title="slice-level-report.py"
@dataclass(frozen=True)
class LabeledOutcome:
    workflow: str
    released_correctly: bool


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
REQUIRED_SLICES = frozenset({"release-freeze", "incident-hotfix", "schema-migration"})


def slice_regression_clear(results_by_workflow: dict[str, list[bool]]) -> bool:
    if not REQUIRED_SLICES.issubset(results_by_workflow):
        return False
    for workflow in REQUIRED_SLICES:
        results = results_by_workflow[workflow]
        if not results or sum(results) * 100 < 95 * len(results):
            return False
    return True


release_report = {
    "service_version": "policy-answerer-v4-eval",
    "source_trace": TRACE.case_id,
    "required_policy_version": EVIDENCE[TARGET_ID].version,
    "checks": {
        "eligible_evidence_path": eligible_evidence_path(TRACE, GOLD),
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
Release checks: {'eligible_evidence_path': True, 'supported_answer_released': True, 'known_bad_answers_blocked': True, 'slice_regression_clear': False}
Release allowed: False
```
<!-- leetllm: output:end -->

Watch your aggregation unit as closely as your slices. Given $N$ nonempty answers where answer $i$ has $m_i$ atomic claims:

1. **Pooled-claim faithfulness (micro-average):**
   $$
   \operatorname{Faithfulness}_{\text{pooled}} = \frac{\sum_{i=1}^N \sum_{j=1}^{m_i} \mathbb{I}(\text{entailed}(c_{i,j}, E_i))}{\sum_{i=1}^N m_i}
   $$
2. **Mean per-answer faithfulness (macro-average):**
   $$
   \operatorname{Faithfulness}_{\text{macro}} = \frac{1}{N} \sum_{i=1}^N \left( \frac{\sum_{j=1}^{m_i} \mathbb{I}(\text{entailed}(c_{i,j}, E_i))}{m_i} \right)
   $$

Suppose Query 1 emits 9 supported claims (`9/9`) while Query 2 emits 1 hallucinated bypass (`0/1`). Pooled faithfulness reports $9/10 = 90\%$, while mean per-answer faithfulness reports $(1.0 + 0.0)/2 = 50\%$. Always state the aggregation unit and report both when answer lengths vary:

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
assert not slice_regression_clear({workflow: [] for workflow in REQUIRED_SLICES})
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Pooled claim support: 90%
Mean per-answer support: 50%
All-claims-supported fraction: 50%
Partial answer: all claims supported=True, task complete=False
```
<!-- leetllm: output:end -->

## Where automated judges enter

An exact answer key cannot judge novel paraphrases. Automated frameworks like RAGAS use LLM judges to extract claims and check entailment against retrieved context without requiring a reference answer,[^es2023] while ARES pairs trained judges with prediction-powered inference over a small human-labeled calibration set to produce <span data-glossary="confidence-interval">confidence intervals</span>.[^saadfalcon2023ares]

An automated judge handles semantic equivalence, while deterministic code still owns authorization, version checking, and citation ID validation. Always <span data-glossary="calibration">calibrate</span> a judge on a human-labeled set containing *both* supported answers and realistic failures (contradictions, wrong citations, omissions, and valid paraphrases), and track false accepts alongside false rejects.

| Input to judge | Why it is needed |
|---|---|
| Question and expected workflow | Judges whether the answer addressed the request |
| Selected context and version | Grounds entailment in the exact text the model saw |
| Atomic claims and citations | Pinpoints which claim or source failed |
| Human-labeled calibration set | Measures judge drift, false accepts, and false rejects |

## Pre-launch evaluation checklist

| Check | Evidence recorded | First place to fix |
|---|---|---|
| Source eligibility | Retrieved, reranked, and selected chunk IDs; versions; <span data-glossary="acl">ACL</span>/freshness status | Evidence filtering |
| Candidate recall | Required chunk present in first-stage hits | <span data-glossary="chunking">Chunking</span>, query, or retrieval lane |
| Context selection | Required chunk survives packing; distractor precision tracked | Reranker or context budget |
| Faithfulness | Per-claim entailment results | Prompt, abstention, or model |
| Citation support | Claim-to-source verification | Citation formatting or verifier |
| Completeness | Required points covered, or justified abstention | Prompt rubric and abstention rules |
| Slice health | Per-workflow pass rates | Debug the failing slice |

```mastery-quiz
[
  {
    "question": "A refund-policy evaluation trace returns a restricted customer credit note among first-stage candidates, then drops it during reranking before selecting the correct public rule. How should the security check classify this trace?",
    "options": [
      "Fail authorization; the restricted returned candidate already crossed the retrieval perimeter.",
      "Pass authorization; grade the public rule that survived the final context-selection step.",
      "Fail candidate recall; restricted candidates remove credit for the retrieved public rule.",
      "Pass authorization; count the dropped note as noise in selected-context precision."
    ],
    "answer": "Fail authorization; the restricted returned candidate already crossed the retrieval perimeter.",
    "explanation": "Authorization applies to returned candidates as well as selected context. Dropping restricted text later cannot undo exposure through scores, traces, or caches."
  },
  {
    "question": "The current document revision, r8, reverses a rule. An archived trace shows that the model received r7 when it answered. Which revision should you use to check historical faithfulness, and which should you use to check whether the answer is correct today?",
    "options": [
      "r8 for faithfulness, r7 for correctness.",
      "r7 for faithfulness, r8 for correctness.",
      "r7 for faithfulness, r7 for correctness.",
      "r8 for faithfulness, r8 for correctness."
    ],
    "answer": "r7 for faithfulness, r8 for correctness.",
    "explanation": "Faithfulness checks whether the answer followed what the model was shown (r7). Current correctness checks whether the answer matches today's active rule (r8)."
  },
  {
    "question": "Required useful source IDs are A and B. Candidates are A, B, C, and D; selected context is A, C, and D. All four IDs are permitted and current. What are candidate recall, context recall, and selected-set precision?",
    "options": [
      "1, 1/2, 1/3.",
      "2/3, 1/3, 1/2.",
      "1, 1/3, 1/2.",
      "1/2, 1/2, 1."
    ],
    "answer": "1, 1/2, 1/3.",
    "explanation": "Candidates contain both A and B (2/2 = 1). Selected context keeps only A (1/2 recall) among three chunks (1/3 set precision)."
  },
  {
    "question": "An answer emits five adjudicated claims. Four are supported, covering three distinct points among five required points. Citations are valid. What are faithfulness, completeness, and the first failed check?",
    "options": [
      "4/5, 4/5, completeness; supported claims each fill one of the five required-point slots.",
      "3/5, 4/5, faithfulness; the five required-point slots determine the support numerator.",
      "4/5, 3/5, faithfulness; the ordered short circuit leaves later completeness unscored.",
      "1, 3/5, completeness; the supported majority passes before checking required points."
    ],
    "answer": "4/5, 3/5, faithfulness; the ordered short circuit leaves later completeness unscored.",
    "explanation": "Faithfulness is 4/5 supported claims; completeness is 3/5 distinct required points. Running checks in order stops at faithfulness first."
  },
  {
    "question": "Four claims are supported by selected evidence. Three cite the correct supporting source, and the fourth has a blank citation. What are faithfulness, citation coverage, and citation support?",
    "options": [
      "Faithfulness 3/4; coverage 1; support 3/4.",
      "Faithfulness 1; coverage 3/4; support 3/4.",
      "Faithfulness 1; coverage 1; support 3/4.",
      "Faithfulness 1; coverage 3/4; support 1."
    ],
    "answer": "Faithfulness 1; coverage 3/4; support 3/4.",
    "explanation": "All four claims follow from the prompt (faithfulness 4/4). Three of four have valid non-blank supporting citations, giving 3/4 coverage and 3/4 citation support."
  },
  {
    "question": "A new answer says that sign-off from the incident commander is mandatory. Its wording is absent from the reviewed exact key, though it carries an approval claim ID. What should the exact-key harness do?",
    "options": [
      "Accept support from the approval ID and use the same ID to fill the required-point slot.",
      "Mark contradiction from the unknown wording and count a confirmed faithfulness failure.",
      "Copy the answer's implied support label into the key and finish scoring.",
      "Route the text to independent claim review before assigning semantic support or point credit."
    ],
    "answer": "Route the text to independent claim review before assigning semantic support or point credit.",
    "explanation": "An exact key cannot judge unseen phrasing. Route both plausible paraphrases and potential contradictions to review rather than trusting a generated ID."
  },
  {
    "question": "A caller cannot access a document that would answer a waiver question. The permitted current corpus has no answer, and selected context is insufficient. A response explains that limit and refers the caller to the document owner. How does the abstention rubric classify it?",
    "options": [
      "Safe response and task success; answerability uses this caller's permitted corpus, which contains no waiver.",
      "Safe response but retrieval failure; inaccessible documents belong in the caller's answerability label.",
      "Unnecessary abstention and task failure; the inaccessible document counts as sufficient context.",
      "Unsupported answering and task failure; referring to the owner asserts a waiver exists."
    ],
    "answer": "Safe response and task success; answerability uses this caller's permitted corpus, which contains no waiver.",
    "explanation": "Answerability is defined over the caller's permitted current corpus. Stating the evidence limit without making an unsupported universal claim is both safe and successful."
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
    "explanation": "Pooled: (6 + 1) / (8 + 2) = 7/10 = 70%. Per-answer mean: (0.75 + 0.50) / 2 = 62.5%."
  },
  {
    "question": "A regression check for a returns assistant requires coverage across refunds, exchanges, and store credit, with at least 90% accuracy per workflow. The hand-picked suite has 3 errors in 30 refund cases, 2 in 25 exchange cases, and none in 15 cancellation cases. What should the team report?",
    "options": [
      "Pass on the pooled result. The refund and exchange rates describe only the tested cases.",
      "Pass on the pooled result. The refund and exchange rates prove at least 90% accuracy in production.",
      "Hold for store-credit cases. The refund and exchange rates prove at least 90% accuracy in production.",
      "Hold for store-credit cases. The refund and exchange rates describe only the tested cases."
    ],
    "answer": "Hold for store-credit cases. The refund and exchange rates describe only the tested cases.",
    "explanation": "Refunds (90%) and exchanges (92%) clear 90%, yet store credit has zero test cases, so hold release. Hand-picked regression rates also differ from random production accuracy estimates."
  },
  {
    "question": "A support judge is tuned on 80 supported answers and no unsupported answers. The team wants to estimate false acceptance on a held-out test. Which change fixes the evaluation?",
    "options": [
      "Add unsupported and ambiguous cases to a held-out human-labeled test; keep versioned evidence and access checks separate, and track format failures separately.",
      "Reuse the 80 supported tuning cases as the final test; interpret high acceptance as low false acceptance.",
      "Add unsupported cases to training and evaluate on that same set; let semantic support replace access checks.",
      "Keep supported-only examples and treat valid JSON formatting as semantic correctness."
    ],
    "answer": "Add unsupported and ambiguous cases to a held-out human-labeled test; keep versioned evidence and access checks separate, and track format failures separately.",
    "explanation": "Measuring false acceptance requires held-out unsupported and ambiguous examples. Keep access checks, formatting checks, and semantic scoring distinct."
  }
]
```

> **Next:** Continue to [LLM-as-a-Judge Evaluation](/learn/llm-as-judge-automated-evaluation). An exact answer key cannot score paraphrases it has never seen; rubric-driven LLM judges bridge that gap once calibrated against human labels.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Everything upstream worked. Retrieval found the rule, the reranker placed it first, and access permissions passed. When an engineer asks what procedures govern a payment service deployment during a release freeze, the model answers:

> The release-freeze rule applies. You can deploy without a linked rollback plan. [policy-v2]

The operational rule strictly requires a linked rollback plan. This answer tells an engineer, during a freeze on a payment system, that they can skip critical safety controls, citing the very rule that mandates them. It reads well, addresses the right topic, and cites a real identifier. If evaluation consists of cursory spot-checks or surface relevance scores, this catastrophic answer passes unnoticed. Detecting such failures requires decomposing quality into independent, testable criteria.

## Separate questions, separate failures

The RAG Triad separates context relevance, groundedness (faithfulness), and answer relevance.[^trulens2023triad] Expanding these into an ordered evaluation sequence makes every failure easy to isolate:

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

Set release thresholds from consequences. A fixed regression suite is good at blocking a known regression. To estimate how often production fails, you need a random sample of real traffic and an error bar. Report severe failures, such as unauthorized sources or dangerous advice, on their own, because an average will hide exactly those. Then keep watching whether real traffic still resembles what you evaluated, and version your reports, since a score means little once the corpus, the model, or the prompt has moved on.

## Where the answer key runs out

Add a fourth required point to the policy, and the complete answer's completeness drops to three quarters while its faithfulness holds. Change one citation and leave the text alone, and only citation support moves. These independent responses are the whole argument for keeping the measurements separate: a single blended score would have moved in both cases, and left you guessing which fix to make.

That paraphrase in the evaluator's last line is still waiting for a verdict. The evidence is there. What remains is interpreting language, which an exact key cannot do, and which a careful reviewer does without effort. Before you automate that judgment, write down the rubric such a reviewer would use, and collect examples they have settled, including plausible unsupported paraphrases and incomplete answers.

The next chapter, [LLM as a Judge](/learn/llm-as-judge-automated-evaluation), hands that job to a model. A judge can read paraphrases that no answer key anticipated, but it comes with failure modes of its own, so we treat it like any other measuring instrument, one that has to earn your trust.

<!-- leetllm: edition:reader:end -->
