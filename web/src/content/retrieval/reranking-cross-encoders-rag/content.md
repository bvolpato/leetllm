---
{
  "id": "reranking-cross-encoders-rag",
  "title": "Reranking and Cross-Encoders for RAG",
  "slug": "reranking-cross-encoders-rag",
  "section": "Applied LLM Engineering",
  "category": "RAG & Retrieval",
  "difficulty": "Medium",
  "order": 13,
  "companies": [
    "Google",
    "Cohere",
    "OpenAI",
    "Anthropic",
    "Amazon"
  ],
  "shortDescription": "Move the right policy into the prompt. Learn how cross-encoders reorder retrieved passages, and where recall, permissions, and text limits still matter.",
  "keyConceptsTested": [
    "Retrieve-then-rerank boundary",
    "Bi-encoder vector bottleneck vs cross-encoder joint attention",
    "ColBERT late interaction and MaxSim operator",
    "Classification heads, token-based scores, and listwise rerankers",
    "Pointwise scoring, pairwise training, and listwise input dependence",
    "Silent pair truncation and text checksum invariants",
    "Compute and latency budgeting in the two-stage funnel",
    "Score calibration and safe admission thresholds",
    "Candidate ordering metrics",
    "Multi-tenant cache fingerprinting and security scopes"
  ],
  "coverImage": "illustrations/_generated/reranking_pipeline_dark.png"
}
---
<!-- leetllm: edition:reference:start -->

Hybrid retrieval can find the necessary evidence inside a retrieval-augmented generation (RAG) system and still leave it outside the generator's context. Consider an enterprise policy search query:

> Today is day 10 after deprecation. Can a service account use the legacy <span data-glossary="token">token</span> endpoint with audit logging enabled?

BM25 matches an operational note (`api-token-troubleshooting-v1`) on exact keyword overlap. The note mentions legacy token errors and explicitly warns that it doesn't authorize access. Dense search matches a password-reset document (`api-password-reset-v1`) by semantic proximity. The governing rule is `api-token-legacy-v2-rule` (Rule AUTH-14). It allows service accounts to use the endpoint within 14 days of deprecation if audit logging is active. Hybrid retrieval still places that rule at rank 3.

The generator prompt budget accepts only two passages. The troubleshooting note and the password-reset policy occupy the prompt while Rule AUTH-14 stays outside it. An assistant might then produce an unsupported refusal: "No, legacy token access is strictly forbidden." We haven't run a generator here. That response illustrates the downstream risk.

For this question's one labeled relevant chunk, candidate recall is 1: the rule is in the candidate set. The four candidates have trusted, current permission decisions in the test corpus. This demonstrates an **ordering failure** at cutoff two; measure corpus-wide retrieval and privacy behavior separately.

The previous [hybrid-search pipeline](/learn/hybrid-search-dense-sparse-retrieval), `policy-answerer-v2`, filters for current, permitted chunks, then fuses sparse and dense ranks. `policy-answerer-v3` adds a <span data-glossary="reranker">reranker</span> to score each query-chunk pair before context selection. The executable labs use a hand-written scorer to test ordering and <span data-glossary="tracing">trace</span> contracts. They don't run a learned model or establish its accuracy.

<figure>
  <img src="illustrations/_generated/reranking_pipeline_dark.png" alt="The same four permitted chunks stay in the candidate set. AUTH-14 starts at hybrid rank 3, receives a synthetic hand-written score of +7, and crosses the +5 gate to fill context slot 1. The other scores are audit export +2, password reset 0, and troubleshooting minus 1; slot 2 stays empty. Admin-only and superseded records are excluded before scoring." />
  <figcaption>The lab uses synthetic, hand-written scores to illustrate the pipeline. The same four permitted IDs go in and come out. Pair scoring moves `api-token-legacy-v2-rule` from hybrid rank 3 to rank 1. The two-chunk budget is a maximum, so the unused slot stays empty when nothing else clears the +5 gate. Admin-only and superseded records never enter scoring.</figcaption>
</figure>

## The boundary: retrieve candidates, then improve their order

A two-stage retriever separates two problems. Retrieval decides whether evidence gets a chance to compete; reranking decides which admitted evidence reaches the top. Generation should support its claims with selected evidence. Merely restricting the prompt doesn't prevent a model from inventing claims or using its parametric memory.

| Stage | Question | Optimized signal | Must never change |
|---|---|---|---|
| Hybrid retrieval | Is useful evidence in the candidate set? | Recall over current permitted chunks | Authorization and freshness boundary |
| Reranking | Which retrieved chunks best answer this query? | Precision near the top | Candidate membership |
| Generation | What answer can be supported? | Grounded response with citations | Claims supported by selected evidence |

The target is in the candidate set but below a two-chunk cutoff. Reranking may change its rank and selected context, not its source identity or access permissions.

The reranker can't restore a missing document. It must stay inside the same <span data-glossary="permission-boundary">permission boundary</span>: never search a restricted or superseded document as a shortcut. Permitted hybrid candidates enter scoring; admin-only and superseded records never do. That skip is the boundary, not a later filter.

This pipeline accepts permitted candidates, scores their query-chunk pairs, selects context, and records the decision. A freshness or permission revocation may remove a candidate between stages; it must never add a forbidden one. The fixed-membership examples assume an unchanged authorized snapshot.

```checkpoint
Why does the reranker receive the permitted hybrid candidate list instead of every policy chunk?
---
Reranking is an ordering stage, not an authorization stage. Scoring restricted or stale chunks can leak their content through scores, logs, caches, or final context even if they're filtered later.
```

Start with the first-stage candidate list, before any model score. The initial candidate set shows `api-token-legacy-v2-rule` at rank 3. Its presence confirms recall; its position predicts a miss at a two-chunk cutoff. The candidate remains outside the prompt until a downstream reranking stage reorders it.

<!-- leetllm: test, output=show, id=rerank-lab -->
```python title="permitted-hybrid-candidates.py"
from __future__ import annotations

from dataclasses import dataclass
from math import isfinite, log2


import numpy as np


def finite_number(value: object) -> bool:
    return bool(np.isfinite(value)) if isinstance(value, (int, float, np.number)) else False


def nonnegative_integer(value: int, name: str) -> None:
    if value < 0:
        raise ValueError(f"{name} must be a nonnegative integer")


@dataclass(frozen=True)
class Candidate:
    chunk_id: str
    document_id: str
    parent_id: str
    version: str
    permitted: bool
    current: bool
    first_stage_rank: int
    text: str


QUERY = (
    "legacy token endpoint for service account on day 10 after deprecation "
    "with audit logging enabled"
)
TARGET_ID = "api-token-legacy-v2-rule"
CANDIDATES = [
    Candidate(
        "api-token-troubleshooting-v1",
        "api-token-troubleshooting",
        "api-token-troubleshooting-v1",
        "api-token-troubleshooting/2026-04-20",
        True,
        True,
        1,
        (
            "Legacy token endpoint errors can be inspected during migration. "
            "This note does not authorize temporary access."
        ),
    ),
    Candidate(
        "api-password-reset-v1",
        "api-password-reset",
        "api-password-reset-v1",
        "api-password-reset/2026-01-03",
        True,
        True,
        2,
        "Password reset tokens expire after 30 minutes.",
    ),
    Candidate(
        "api-token-legacy-v2-rule",
        "api-auth",
        "api-auth-v2",
        "api-auth/2026-04-01",
        True,
        True,
        3,
        (
            "Rule AUTH-14. Service accounts may use the legacy token endpoint "
            "within 14 days of deprecation when audit logging is enabled."
        ),
    ),
    Candidate(
        "api-audit-export-v1",
        "api-audit",
        "api-audit-v1",
        "api-audit/2026-03-12",
        True,
        True,
        4,
        "Audit logs can be exported within 14 days.",
    ),
]

first_stage = sorted(CANDIDATES, key=lambda candidate: candidate.first_stage_rank)
first_stage_ids = [candidate.chunk_id for candidate in first_stage]
print("Hybrid order:", first_stage_ids)
assert TARGET_ID in first_stage_ids
assert first_stage_ids.index(TARGET_ID) + 1 == 3
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Hybrid order: ['api-token-troubleshooting-v1', 'api-password-reset-v1', 'api-token-legacy-v2-rule', 'api-audit-export-v1']
```
<!-- leetllm: output:end -->

The candidate record carries `document_id` and `parent_id` from the earlier RAG pipeline. Reranking may move evidence, but citation packing still points to the same source identity. A higher rank doesn't change who may read the chunk. What keeps an admin-only rule out of the scorer?

## Keep the evidence boundary executable

The source store still holds an admin-only rule and an expired revision. Neither should enter reranking, even if the wording looks useful. Here, `permitted` and `current` are evaluated ground-truth decisions, not fields provided by the question or source text.

<!-- leetllm: test, output=show, continue=rerank-lab, id=rerank-boundary -->
```python title="reranker-boundary-regression.py"
SOURCE_STORE = CANDIDATES + [
    Candidate(
        "admin-token-legacy",
        "admin-token-terms",
        "admin-token-terms",
        "admin-token/2026-05-01",
        False,
        True,
        0,
        "Admin service accounts receive immediate legacy token access.",
    ),
    Candidate(
        "api-token-legacy-v1-rule",
        "api-auth",
        "api-auth-v1",
        "api-auth/2025-02-01",
        True,
        False,
        0,
        "Service accounts may use the legacy token endpoint within 30 days.",
    ),
]
FIRST_STAGE_RECORDS = {
    (candidate.chunk_id, candidate.version): candidate
    for candidate in first_stage
}


def in_snapshot(candidate: Candidate) -> bool:
    return (
        isinstance(candidate, Candidate)
        and candidate.permitted is True
        and candidate.current is True
        and FIRST_STAGE_RECORDS.get((candidate.chunk_id, candidate.version)) == candidate
    )


def rerankable_candidates(store: list[Candidate]) -> list[Candidate]:
    return [
        candidate
        for candidate in store
        if in_snapshot(candidate)
    ]


rerankable = rerankable_candidates(SOURCE_STORE)
blocked_ids = sorted(
    candidate.chunk_id
    for candidate in SOURCE_STORE
    if candidate not in rerankable
)
print("Rerankable:", [candidate.chunk_id for candidate in rerankable])
print("Blocked:", blocked_ids)
assert rerankable == CANDIDATES
assert blocked_ids == ["admin-token-legacy", "api-token-legacy-v1-rule"]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Rerankable: ['api-token-troubleshooting-v1', 'api-password-reset-v1', 'api-token-legacy-v2-rule', 'api-audit-export-v1']
Blocked: ['admin-token-legacy', 'api-token-legacy-v1-rule']
```
<!-- leetllm: output:end -->

The snapshot compares complete records, including text and parent identity. Matching an ID and version alone would admit changed content under an obsolete hash. In a service, fetch the recorded revisions and recheck the caller's current permissions before remote scoring and context packing. A changed record needs a fresh retrieval decision. Sending text to a hosted reranker is itself a disclosure: user access doesn't automatically authorize an external processor. Scope caches, logs, and provider use to the same data-handling policy.

Now replay context packing without reranking. The generator receives a troubleshooting note that grants no temporary access and a password-reset policy. The legacy-token rule is retrieved but absent from context.

<!-- leetllm: test, output=show, continue=rerank-boundary, id=rerank-before-context -->
```python title="context-before-reranking.py"
CONTEXT_BUDGET = 2


def pack_context(candidates: list[Candidate], budget: int) -> list[str]:
    nonnegative_integer(budget, "context budget")
    if len({candidate.chunk_id for candidate in candidates}) != len(candidates):
        raise ValueError("duplicate context candidate IDs")
    if any(not in_snapshot(candidate) for candidate in candidates):
        raise ValueError("context candidate outside authorized snapshot")
    return [candidate.chunk_id for candidate in candidates[:budget]]


context_before = pack_context(first_stage, CONTEXT_BUDGET)
print("Context before rerank:", context_before)
print("Target reaches generation:", TARGET_ID in context_before)
assert TARGET_ID not in context_before
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Context before rerank: ['api-token-troubleshooting-v1', 'api-password-reset-v1']
Target reaches generation: False
```
<!-- leetllm: output:end -->

The current <span data-glossary="hybrid-search">hybrid search</span> ordering leaves out the right chunk. Reranking is one possible repair; improving first-stage ranking or context selection is another. What additional signal comes from reading the query and chunk together?

## Understand the scoring mechanism before comparing model families

Which tensor becomes the score? Does it depend on one passage or the whole list? Those questions explain both serving behavior and cache validity. A decoder backbone doesn't imply that a reranker generates a ranked list or even uses next-token probabilities.

### BERT-style encoder classification heads

BERT-style cross-encoders concatenate the query and candidate chunk: `[CLS] Query [SEP] Chunk [SEP]`. Bidirectional self-attention lets the two sides interact before pooling.[^nogueira2019][^devlin2019] This is one architecture, not a description of every checkpoint sold under the BGE or Jina name.

Let $h_{\mathrm{CLS}}(q, d) \in \mathbb{R}^d$ be the final hidden state of the `[CLS]` token. A linear projection head maps this pooled vector to a scalar logit:

$$
z = \mathbf{w}^\top h_{\mathrm{CLS}}(q, d) + b
$$

Applying a sigmoid function $\sigma(z) = 1 / (1 + e^{-z})$ bounds the logit into $(0, 1)$. During pointwise training, each query-passage example carries a binary relevance label $y \in \{0, 1\}$ and contributes binary cross-entropy:

$$
\ell_{\mathrm{pointwise}}(z, y) = -y \log \sigma(z) - (1 - y) \log \bigl(1 - \sigma(z)\bigr).
$$

At inference time, there are no gold labels or gradient updates. The model computes $z$ (or $\sigma(z)$) for each candidate and sorts descending. Mathematically, sigmoid is strictly increasing, so it preserves order. Finite-precision saturation can introduce ties near 0 or 1. A sigmoid score isn't automatically a calibrated relevance probability. Sentence Transformers documents checkpoints that return raw logits and an optional sigmoid transformation.[^sentenceTransformers2026CrossEncoderUsage]

Pointwise scoring evaluates each pair in isolation, but training may use a pairwise preference loss. Given a relevant passage $d^+$ with logit $z^+$ and an irrelevant passage $d^-$ with logit $z^-$, the pairwise logistic preference loss penalizes inverted score differences:[^burges2005ranknet]

$$
\ell_{\mathrm{pairwise}}(z^+, z^-) = \log\bigl(1 + e^{-(z^+ - z^-)}\bigr) = \operatorname{softplus}\bigl(-(z^+ - z^-)\bigr).
$$

A model trained with pairwise preference losses still scores individual query-passage pairs independently at serving time. It doesn't need to evaluate all $O(k^2)$ passage pairs during inference.

### Token-based scoring and decoder classification heads

monoT5 is an encoder-decoder model trained to predict `true` or `false`; its published scoring method renormalizes probabilities over those two target tokens.[^nogueira2020monot5] Qwen3-Reranker uses a causal decoder and lowercase `yes`/`no` logits at the final prompt position.[^qwen2026Reranker] A typical yes/no reranker prompt takes the form:

```text
Instruction: Decide whether the document satisfies the query conditions.
Query: legacy token endpoint for service account on day 10 with audit logging
Document: Rule AUTH-14. Service accounts may use the legacy token endpoint...
Relevant (Yes/No):
```

Use the checkpoint's actual template and tokenizer, not this sketch. For two single-token labels at the same prediction position, log-odds equal the difference between their logits:

$$
s(q, d) = \log \frac{P(\text{"Yes"} \mid q, d)}{P(\text{"No"} \mid q, d)} = z_{\text{Yes}} - z_{\text{No}}
$$

Renormalizing over only these two labels gives:

$$
p_{\mathrm{binary}}(\text{"Yes"} \mid q, d) = \frac{e^{z_{\text{Yes}}}}{e^{z_{\text{Yes}}} + e^{z_{\text{No}}}} = \sigma(z_{\text{Yes}} - z_{\text{No}}).
$$

This is **not** the full-vocabulary probability $P(\text{"Yes"})$: other possible tokens were removed from the denominator. Binary-label methods need the relevant forward computation, not a long generated explanation. An encoder-decoder also runs its encoder; don't equate its execution path with a causal decoder.

Other decoder-based scorers have different contracts. BGE-reranker-v2-gemma's example takes the single `Yes` logit, without subtracting `No`. RankLLaMA's published model example loads a sequence-classification model with one scalar output.[^bge2026GemmaScoring][^rankllama2023ModelCard] Neither should be described as the binary formula above.

| Scoring mechanism | Example | Input dependence | Cost drivers to measure |
|---|---|---|---|
| Pooled-state classification head | BERT-style cross-encoder | One query-passage pair | Checkpoint size, pair lengths, batch shapes, precision |
| Target-token binary score | monoT5; Qwen3-Reranker | One templated query-passage pair | Encoder/decoder architecture, template tokens, pair lengths |
| Decoder classification head | RankLLaMA | One query-passage pair | Backbone, adapters, lengths, serving implementation |
| Whole-list interaction | Jina Reranker v3.5 | Query and the complete candidate list | Total list length, attention pattern, ordering and batching |

As of September 21, 2026, Qwen3-Reranker provides 0.6B, 4B, and 8B checkpoints under Apache 2.0. Its card documents 32K context, while the example wrapper chooses `max_length=8192`; a wrapper can impose a smaller effective limit.[^qwen2026Reranker] Jina Reranker v3.5 is a 0.6B listwise model with causal attention and cosine-based scoring, not the BERT-style head above. Its published weights use CC BY-NC 4.0; check deployment licensing before commercial use.[^jina2026RerankerV35]

Hosted Cohere Rerank accepts a query and candidate list and returns ranked items with relevance scores.[^cohere2026rerank] Test whether each score changes with the other candidates. Benchmark the actual checkpoint or service on your evidence and workload; measure latency, VRAM, and instruction following for the deployed family and settings.

Evaluate the margin and cross-entropy objectives at $z^+=1.2$ and $z^-=0.2$:

<!-- leetllm: test, output=show -->
```python title="ranking-losses.py"
from math import exp, log1p


def softplus(x: float) -> float:
    return max(x, 0.0) + log1p(exp(-abs(x)))


positive, negative = 1.2, 0.2
pointwise_mean = (softplus(-positive) + softplus(negative)) / 2
pairwise_loss = softplus(-(positive - negative))
print(f"Pointwise mean loss: {pointwise_mean:.3f}")
print(f"Pairwise preference loss: {pairwise_loss:.3f}")
print(f"Preference loss after reversing scores: {softplus(positive - negative):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Pointwise mean loss: 0.531
Pairwise preference loss: 0.313
Preference loss after reversing scores: 1.313
```
<!-- leetllm: output:end -->

Training data must represent the ranking task. Hard negatives from the same first-stage retriever expose plausible near matches; random unrelated negatives can make the task too easy. Keep query and document leakage out of held-out evaluation, and check negation, dates, and no-answer questions separately from an overall average.

### Preserve the text that was actually scored

Joint interaction also introduces a pair-length ceiling. Original BERT uses a maximum sequence length of 512 tokens, including special tokens.[^devlin2019] Other checkpoints expose different limits, so read the tokenizer and model configuration instead of assuming 512.

If a wrapper silently truncates an overlong pair, the model may score only a prefix while the generator later receives the full chunk. An omitted clause could determine relevance or qualify a rule. Log tokenized pair length, define a truncation policy, and reject unexpected truncation so the score's scope is clear.

| Policy | When to use | What to log |
|---|---|---|
| Preserve full query; truncate document tail | Only when a prefix is an acceptable scoring unit | `tokenizer`, `max_length`, `truncated`, `kept_span` |
| Sliding windows over the chunk | Authorizing clause may sit past the first window | Window offsets, per-window scores, aggregation rule |
| Refuse overlong pairs | Safety-critical policies where a partial score is unacceptable | Pair token count, refuse reason, fallback (human / no-score) |
| Score only the packed context text | Generator context is already budgeted | Checksum of scored text vs packed text |

Truncation isn't only a local-model concern. Check a local wrapper's tokenizer configuration and truncation strategy. Cohere's Rerank API truncates documents to `max_tokens_per_doc`, default 4096.[^cohere2026rerank] Either way, ranked text can disagree with packed text. A sliding-window strategy can retain later clauses, but max-over-window aggregation can favor long documents and omit qualifications from other windows. Record the aggregation policy and keep necessary surrounding context.

The accounting below uses whitespace tokens only. It reserves three BERT boundary tokens (`[CLS]` and two `[SEP]` markers). A real implementation must use the checkpoint's tokenizer and exact special-token count.

<!-- leetllm: test, output=show, continue=rerank-before-context, id=rerank-truncation -->
```python title="pair-budget-truncation.py"
from hashlib import sha256
import json


@dataclass(frozen=True)
class PairBudget:
    max_pair_tokens: int
    query_tokens: list[str]
    chunk_tokens: list[str]
    special_tokens: int = 3


def tokenize(text: str) -> list[str]:
    return text.lower().split()


def truncate_document_tail(budget: PairBudget) -> tuple[list[str], bool]:
    """Keep the full query, then fill the remaining budget from the chunk head."""
    query = budget.query_tokens
    nonnegative_integer(budget.max_pair_tokens, "max pair tokens")
    nonnegative_integer(budget.special_tokens, "special tokens")
    if budget.max_pair_tokens == 0:
        raise ValueError("max pair tokens must be positive")
    remaining = budget.max_pair_tokens - len(query) - budget.special_tokens
    if remaining <= 0:
        raise ValueError("no document room after query and special tokens")
    kept_chunk = budget.chunk_tokens[:remaining]
    truncated = len(kept_chunk) < len(budget.chunk_tokens)
    return query + kept_chunk, truncated


def token_checksum(tokens: list[str]) -> str:
    serialized = json.dumps(tokens, ensure_ascii=False, separators=(",", ":"))
    return sha256(serialized.encode("utf-8")).hexdigest()


query = "May service accounts use the legacy token endpoint on day 10?"
# The authorizing clause is at the end; retaining the head drops it.
chunk = (
    "Background: migration tooling and temporary endpoints are under review. "
    "Operational notes discuss log shipping and dashboard ownership. "
    "Rule AUTH-14. Service accounts may use the legacy token endpoint "
    "within 14 days of deprecation when audit logging is enabled."
)
budget = PairBudget(
    max_pair_tokens=24,
    query_tokens=tokenize(query),
    chunk_tokens=tokenize(chunk),
)
scored_tokens, was_truncated = truncate_document_tail(budget)
packed_tokens = budget.query_tokens + budget.chunk_tokens  # generator sees full text
scored_checksum = token_checksum(scored_tokens)
packed_checksum = token_checksum(packed_tokens)
authorizing_clause = "within 14 days of deprecation when audit logging is enabled"
scored_text = " ".join(scored_tokens)
print("Truncated:", was_truncated)
print("Scored pair tokens including specials:", len(scored_tokens) + budget.special_tokens, "/", budget.max_pair_tokens)
print("Authorizing clause in scored text:", authorizing_clause in scored_text)
print("Checksum match (scored == packed):", scored_checksum == packed_checksum)
assert was_truncated
assert authorizing_clause not in scored_text
assert scored_checksum != packed_checksum
# This evaluation policy refuses any scored/packed mismatch.
release_ok = scored_checksum == packed_checksum
assert release_ok is False
print("Release gate (scored/packed mismatch):", release_ok)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Truncated: True
Scored pair tokens including specials: 24 / 24
Authorizing clause in scored text: False
Checksum match (scored == packed): False
Release gate (scored/packed mismatch): False
```
<!-- leetllm: output:end -->

That failure is intentional: this lab refuses any scored/packed token mismatch. The checksum compares **normalized toy token lists**, not exact source bytes; lowercasing and whitespace splitting erase some differences. Real rerankers and generators can use different tokenizers, so record the scored source span and exact text separately from each model's token accounting. A parent expansion or explicit window score can be valid if its scope and aggregation are recorded.

With the text boundary explicit, test ranking independently of a model endpoint. The evaluation below uses transparent phrase rules, not a trained <span data-glossary="transformer">transformer</span>. Its integer scores exercise ordering and packing code. They aren't semantic entailment or authorization decisions.

<!-- leetllm: test, output=show, continue=rerank-truncation, id=rerank-request -->
```python title="inspect-query-conditions.py"
@dataclass(frozen=True)
class Request:
    endpoint: str
    remedy: str
    days_since_deprecation: int
    audit_enabled: bool


def validate_request(request: Request) -> None:
    if any(
        not isinstance(value, str) or not value.strip()
        for value in (request.endpoint, request.remedy)
    ):
        raise ValueError("endpoint and remedy must be nonempty strings")
    nonnegative_integer(request.days_since_deprecation, "days since deprecation")


REQUEST = Request(
    endpoint="legacy token endpoint",
    remedy="temporary access",
    days_since_deprecation=10,
    audit_enabled=True,
)
validate_request(REQUEST)
requirements = [
    REQUEST.endpoint,
    REQUEST.remedy,
    "day 10 is within the 14-day window",
    "audit logging is enabled",
]
print("Query conditions:", requirements)
assert 0 <= REQUEST.days_since_deprecation <= 14
assert REQUEST.audit_enabled
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Query conditions: ['legacy token endpoint', 'temporary access', 'day 10 is within the 14-day window', 'audit logging is enabled']
```
<!-- leetllm: output:end -->

The rule should rank first for this question. The scorer awards phrase-match points and subtracts six for the troubleshooting note's disclaimer. This deliberately narrow heuristic can't distinguish arbitrary paraphrases or resolve conflicting policies. The audit-export chunk gets timing points even though its 14-day window applies to a different action, a useful reminder of the heuristic's limits.

<!-- leetllm: test, output=show, continue=rerank-request, id=rerank-score -->
```python title="pointwise-reranker.py"
@dataclass(frozen=True)
class PairScore:
    candidate: Candidate
    score: float
    reasons: tuple[str, ...]


class ConstraintAwarePairScorer:
    def score(self, request: Request, candidate: Candidate) -> PairScore:
        text = candidate.text.lower()
        score = 0
        reasons: list[str] = []

        if request.endpoint.lower() in text:
            score += 2
            reasons.append("endpoint")
        if request.remedy.lower() in text:
            score += 3
            reasons.append("remedy")
        if "service accounts" in text:
            score += 1
            reasons.append("principal")
        if "within 14 days" in text and 0 <= request.days_since_deprecation <= 14:
            score += 2
            reasons.append("migration-window")
        if "audit logging is enabled" in text and request.audit_enabled:
            score += 2
            reasons.append("audit-condition")
        if "does not authorize temporary access" in text:
            score -= 6
            reasons.append("non-authorizing-note")
        return PairScore(candidate, score, tuple(reasons))


def rerank(
    request: Request,
    candidates: list[Candidate],
    scorer: ConstraintAwarePairScorer,
) -> list[PairScore]:
    validate_request(request)
    if len({candidate.chunk_id for candidate in candidates}) != len(candidates):
        raise ValueError("duplicate candidate IDs")
    if any(not in_snapshot(candidate) for candidate in candidates):
        raise ValueError("candidate outside authorized snapshot")
    scored: list[PairScore] = []
    for candidate in candidates:
        result = scorer.score(request, candidate)
        if (
            not isinstance(result, PairScore)
            or result.candidate != candidate
            or not in_snapshot(result.candidate)
            or not finite_number(result.score)
        ):
            raise ValueError("invalid score or changed candidate in scorer response")
        scored.append(result)
    return sorted(
        scored,
        key=lambda result: (-result.score, result.candidate.first_stage_rank, result.candidate.chunk_id),
    )


reranked = rerank(REQUEST, rerankable, ConstraintAwarePairScorer())
reranked_ids = [result.candidate.chunk_id for result in reranked]
for result in reranked:
    print(result.candidate.chunk_id, result.score, result.reasons)
assert reranked_ids[0] == TARGET_ID
assert rerank(REQUEST, [], ConstraintAwarePairScorer()) == []
```

<!-- leetllm: output:start -->
```text title="Output" output compact
api-token-legacy-v2-rule 7 ('endpoint', 'principal', 'migration-window', 'audit-condition')
api-audit-export-v1 2 ('migration-window',)
api-password-reset-v1 0 ()
api-token-troubleshooting-v1 -1 ('endpoint', 'remedy', 'non-authorizing-note')
```
<!-- leetllm: output:end -->

```checkpoint
The target policy is retrieved at rank 3 but the prompt accepts two chunks. Is this a recall failure or an ordering failure?
---
It's an ordering failure. Recall succeeded because the target is in the candidate set. Reranking must move it into the context budget.
```

Context selection now changes for the right reason. The candidate set stays fixed while the supported rule moves to rank 1. A context budget is a maximum, not a <span data-glossary="quota">quota</span>, so low-scoring near matches are not admitted merely to fill space.

Two chunks is only this lab's simplified budget. Production packing counts generator tokens after reserving instructions and output space, limits redundant passages from one parent document, and preserves clauses needed to interpret a rule. If packing expands a scored passage into a larger parent section, record that expansion explicitly rather than claiming every added sentence received the passage's score.

<!-- leetllm: test, output=show, continue=rerank-score, id=rerank-context -->
```python title="context-after-reranking.py"
MIN_CONTEXT_SCORE = 5
selected_after = [
    result.candidate
    for result in reranked
    if result.score >= MIN_CONTEXT_SCORE
][:CONTEXT_BUDGET]
context_after = pack_context(selected_after, CONTEXT_BUDGET)
print("Context before:", context_before)
print("Context after:", context_after)
assert TARGET_ID in context_after
assert "api-token-troubleshooting-v1" not in context_after
assert set(reranked_ids) == set(first_stage_ids)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Context before: ['api-token-troubleshooting-v1', 'api-password-reset-v1']
Context after: ['api-token-legacy-v2-rule']
```
<!-- leetllm: output:end -->

The threshold of 5 separates this rule from these three distractors. It isn't a permission rule. With audit disabled, the rule still scores 5 and remains relevant because it explains why access isn't allowed. A generator must apply the actual policy conditions, not interpret a high relevance score as an automatic affirmative. Scores that rank a denial highly can be completely correct.

A score of 7 beat these distractors. Would the same cutoff select the right evidence on a query that has no good answer?

```checkpoint
A pair scorer assigns a relevant passage logit 0.8 and a less relevant passage logit −0.4. Using the taught logistic preference loss, what is the loss for this ordering, rounded to three decimals?
---
0.263

The relevant-minus-irrelevant gap is 1.2. The preference loss is log(1 + exp(−1.2)) ≈ 0.263. Reversing the gap gives 1.463; serving can still compute independent pair scores.
```

```checkpoint
A scalar head uses weights [2, −0.5] and bias 0.1. Given pair states are A = [0.4, 1.2] and B = [0.8, 0.2]. Which logits and first-ranked identity follow?
---
A 0.3; B 1.6; B first.

A gives 2×0.4 − 0.5×1.2 + 0.1 = 0.3. B gives 2×0.8 − 0.5×0.2 + 0.1 = 1.6. Descending scalar scores put B first. The pooled states are given, not learned in this question.
```

```checkpoint
Passage A has Yes logit 3 and No logit 5; B has Yes logit 2 and No logit 0. Which passage ranks first under a single-Yes-logit formula and under a Yes-minus-No formula?
---
Single Yes: A; Yes-minus-No: B.

Single Yes compares 3 with 2 and chooses A. Differences are −2 for A and +2 for B, choosing B. Neither formula may be silently substituted for the checkpoint’s actual scoring rule.
```

## Score calibration and safe selection thresholds

Learned scores need calibration before interpreting them as probabilities. Define the event a probability represents, then test calibration on held-out labels; raw sigmoid values alone have no 85% answerability or 2:1 relevance interpretation.

Scores can vary with query type, candidate distribution, and checkpoint. When an unanswerable query's top lexical distractor scores 0.90 while a nuanced answerable query's true evidence scores 0.60, no single global score cutoff separates them cleanly.

An unvalidated static threshold (such as `score >= 0.70`) can produce two failure modes:

1. **Evidence starvation:** Useful evidence below the threshold never reaches generation.
2. **Noise inclusion:** Irrelevant candidates above the threshold consume context.

Compare these selection strategies on labeled development cases, including no-answer cases:

- **Rank-first with context budget:** Take the highest-ranked items that fit. Strictly increasing score transformations preserve mathematical order. This avoids a fixed score scale but still selects distractors when every candidate is irrelevant; it isn't an abstention rule.
- **Score margin falloff gating:** Rather than filtering on an absolute score, filter candidates whose score falls significantly below the top candidate's score:
  $$
  \text{Keep chunk } i \iff s(q, d_i) \ge s(q, d_1) - \Delta_{\text{margin}}
  $$
  A common additive shift leaves this rule unchanged; changing score scale generally doesn't. Nearby scores don't prove that sources agree or that any is relevant. Tune $\Delta_{\text{margin}}$ for the checkpoint and inspect selected evidence.
- **Calibrated selection or abstention:** Platt scaling fits $P(y=1\mid z)=1/(1+e^{Az+B})$; isotonic regression fits a monotone mapping.[^sklearnCalibration2026] Define $y$ carefully: passage relevance isn't the same event as having enough evidence for a complete answer. Fit calibration and choose thresholds on development data independent of scorer training, then evaluate reliability and abstention on an untouched test set. Revalidate when the checkpoint, tokenizer, scoring policy, or workload changes.

None of those rules tells you whether AUTH-14 moved into the two-passage budget. How do you measure that move on this request?

```checkpoint
Twenty untouched cases each receive a claimed relevance probability of 0.75, and 8 are labeled relevant. Which observed frequency and direction of this group’s calibration error are correct?
---
Observed 0.40; the stated probability is 0.35 higher.

The observed frequency is 8/20 = 0.40; 0.75 − 0.40 = 0.35. This finite group shows an overconfident discrepancy but does not certify calibration elsewhere. Keep passage relevance distinct from complete-answer sufficiency, and preserve untouched evaluation data.
```

## Measure candidate recall and top-of-list relevance

With pair scoring in place, ask how to prove it improves the stage that owns the failure. Keep evaluation narrow, and let each metric answer a different question:

1. <span data-glossary="recall-at-k">Recall@candidate_k</span> checks whether first-stage retrieval gave the reranker a chance.
2. <span data-glossary="mrr">Mean reciprocal rank (MRR)</span> averages how early the first relevant chunk appears across a release suite.
3. <span data-glossary="ndcg">Normalized discounted cumulative gain (NDCG)</span> at the context cutoff checks whether relevant chunks fit near the top of the context budget.[^manning2008ir]

For this one request, **reciprocal rank (RR)** is easy to read: rank 3 gives $1/3$; rank 1 gives $1$. MRR is the mean of those per-request values. <span data-glossary="ndcg">NDCG</span> supports graded relevance.

This lab uses binary relevance, where a relevant chunk has $rel_i = 1$ and an irrelevant chunk has $rel_i = 0$. With binary labels, linear-gain and exponential-gain DCG formulas agree, so the numbers below don't depend on which variant you pick:

$$
\operatorname{DCG}_k = \sum_{i=1}^{k} \frac{2^{rel_i}-1}{\log_2(i+1)}
\qquad
\operatorname{NDCG}_k = \frac{\operatorname{DCG}_k}{\operatorname{IDCG}_k}
$$

Moving the only relevant chunk from rank 3 to rank 1 changes RR from $1/3$ to $1$, and places the chunk inside NDCG@2.

<!-- leetllm: test, output=show, continue=rerank-context, id=rerank-metrics -->
```python title="ordering-gate.py"
RELEVANT_IDS = {TARGET_ID}


def reciprocal_rank(ids: list[str], relevant_ids: set[str]) -> float:
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate ranked IDs")
    for rank, chunk_id in enumerate(ids, start=1):
        if chunk_id in relevant_ids:
            return 1.0 / rank
    return 0.0


def ndcg_at_k(ids: list[str], relevant_ids: set[str], k: int) -> float:
    nonnegative_integer(k, "NDCG cutoff")
    if len(ids) != len(set(ids)):
        raise ValueError("unique ranked IDs required")
    dcg = sum(
        (2 ** int(chunk_id in relevant_ids) - 1) / log2(rank + 1)
        for rank, chunk_id in enumerate(ids[:k], start=1)
    )
    ideal_hits = min(len(relevant_ids), k)
    idcg = sum((2**1 - 1) / log2(rank + 1) for rank in range(1, ideal_hits + 1))
    return dcg / idcg if idcg else 0.0


before_rr = reciprocal_rank(first_stage_ids, RELEVANT_IDS)
after_rr = reciprocal_rank(reranked_ids, RELEVANT_IDS)
before_ndcg = ndcg_at_k(first_stage_ids, RELEVANT_IDS, CONTEXT_BUDGET)
after_ndcg = ndcg_at_k(reranked_ids, RELEVANT_IDS, CONTEXT_BUDGET)
print(f"RR: {before_rr:.2f} -> {after_rr:.2f}")
print(f"NDCG@{CONTEXT_BUDGET}: {before_ndcg:.2f} -> {after_ndcg:.2f}")
assert after_rr > before_rr
assert before_ndcg == 0.0 and after_ndcg == 1.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
RR: 0.33 -> 1.00
NDCG@2: 0.00 -> 1.00
```
<!-- leetllm: output:end -->

These numbers check this hand-labeled evaluation split, not model quality or generated-answer correctness. Deduplicate IDs before scoring: repeating a relevant chunk mustn't earn gain twice. This implementation defines NDCG as zero when there are no relevant labels; report that convention and evaluate no-answer behavior separately. Treat unjudged documents carefully rather than assuming every missing label means irrelevance.

For a held-out query suite, compare per-query scores on identical authorized candidates, then aggregate MRR/NDCG with uncertainty and query-type breakdowns. Also score the final packed context. Filtering, deduplication, and token budgets can remove a highly ranked passage after the reranker. Those ordering gains assume the target was on the list the reranker scored. What happens if that list stops at two?

```checkpoint
At cutoff 2, a ranking has relevance grades [1, 0, 2]. Use gain 2^grade − 1 and the ideal ordering of these same labels. What is NDCG@2, rounded to three decimals?
---
0.275

The actual top-two gain is 1/log2(2) + 0/log2(3) = 1. The ideal top two have grades 2 and 1, giving 3 + 1/log2(3) ≈ 3.631. The ratio is about 0.275. Gain and denominator must use the same labels and cutoff.
```

## Candidate count sets the ceiling and the bill

An ordering metric can't rescue an item that never reaches the reranker. If the reranker receives only the first two candidates, `api-token-legacy-v2-rule` is cut before pair scoring. Use a candidate-recall gate before comparing reranker models.

For relevant-set $R$ and candidate-set $C_k$, candidate recall is $|R\cap C_k|/|R|$. This value bounds the recall of any context selected from $C_k$. With two required passages but only one retrieved, even an oracle reranker can't exceed 50% passage recall. For multi-hop questions, measure whether every required passage is present.

Predict the budget tradeoff: top 2 is too small to score the target; top 3 gives it a chance. The lab keeps every other variable fixed so that ceiling is visible.

<!-- leetllm: test, output=show, continue=rerank-metrics, id=rerank-candidate-budget -->
```python title="candidate-count-gate.py"
def target_present(candidates: list[Candidate]) -> bool:
    return TARGET_ID in [candidate.chunk_id for candidate in candidates]


def recall_at_k(ids: list[str], relevant_ids: set[str], k: int) -> float:
    nonnegative_integer(k, "candidate cutoff")
    if len(ids) != len(set(ids)):
        raise ValueError("unique candidate IDs required")
    return len(set(ids[:k]) & relevant_ids) / len(relevant_ids) if relevant_ids else 0.0


RERANK_CANDIDATE_BUDGET = 3
too_small = first_stage[:2]
release_input = first_stage[:RERANK_CANDIDATE_BUDGET]
limited_ids = [result.candidate.chunk_id for result in rerank(
    REQUEST, too_small, ConstraintAwarePairScorer()
)]
release_reranked = rerank(REQUEST, release_input, ConstraintAwarePairScorer())
release_reranked_ids = [result.candidate.chunk_id for result in release_reranked]
print("top-2 includes target:", target_present(too_small), limited_ids)
print("top-3 includes target:", target_present(release_input), release_reranked_ids)
print(f"Candidate recall@2: {recall_at_k(first_stage_ids, RELEVANT_IDS, 2):.1f}")
print(f"Candidate recall@3: {recall_at_k(first_stage_ids, RELEVANT_IDS, 3):.1f}")
assert not target_present(too_small)
assert release_reranked_ids[0] == TARGET_ID
```

<!-- leetllm: output:start -->
```text title="Output" output compact
top-2 includes target: False ['api-password-reset-v1', 'api-token-troubleshooting-v1']
top-3 includes target: True ['api-token-legacy-v2-rule', 'api-password-reset-v1', 'api-token-troubleshooting-v1']
Candidate recall@2: 0.0
Candidate recall@3: 1.0
```
<!-- leetllm: output:end -->

### Compute and latency budgeting in the two-stage funnel

A cross-encoder with independent pair scoring evaluates each query-candidate pair online. Increasing candidate depth increases total work, but wall-clock latency also depends on batch scheduling and hardware. For dense attention with fixed layer count $L$ and hidden width, the attention component scales as $O(LT^2)$ for pair length $T$. Doubling $T$ multiplies that component by roughly four, not necessarily the complete request latency.

Choose a retrieval shortlist by measuring the recall/latency frontier. There is no universal GPU millisecond range, CPU depth limit, or safe candidate count. Include actual query and passage lengths, queueing, concurrency, precision, model loading, and endpoint overhead in the measurement.

Batching also requires an explicit specification:

- Padding a batch to its longest sequence can waste work. Length bucketing reduces that waste, while waiting to form batches can add latency.
- Triton's default dynamic batching requires compatible input shapes. Ragged batching is optional configuration; the backend must handle concatenated inputs and their boundaries.[^triton2026RaggedBatching] Selecting a runtime doesn't automatically remove padding.
- FlashAttention improves attention memory access; it doesn't remove dense attention's quadratic arithmetic. Whether a particular reranker supports variable-length execution must be checked in its implementation.
- Compare smaller checkpoints, quantization, and different batching strategies on relevance and serving measurements. Recheck ranking quality after each speed optimization.

This benchmark uses a sequential cost model to make the candidate-depth trade-off visible. It isn't a p95 benchmark: production serving batches pairs, and percentiles must be measured end to end. Cohere recommends against sending more than 1,000 documents in one Rerank request; that's a hosted-API cousin of the same $k$ knob.[^cohere2026rerank]

<!-- leetllm: test, output=show, continue=rerank-candidate-budget, id=rerank-latency -->
```python title="latency-budget-gate.py"
SEQUENTIAL_PAIR_COST_MS = 7.5
REQUEST_OVERHEAD_MS = 4.0
LATENCY_BUDGET_MS = 30.0


def estimated_latency_ms(candidate_count: int) -> float:
    nonnegative_integer(candidate_count, "candidate count")
    if not finite_number(candidate_count):
        raise ValueError("candidate count is too large for this float cost model")
    latency = REQUEST_OVERHEAD_MS + SEQUENTIAL_PAIR_COST_MS * candidate_count
    if not finite_number(latency):
        raise ValueError("latency overflow")
    return latency


release_latency = estimated_latency_ms(len(release_input))
too_wide_latency = estimated_latency_ms(len(first_stage))
print(
    f"top-3 latency: {release_latency:.1f} ms, "
    f"pass={release_latency <= LATENCY_BUDGET_MS}"
)
print(
    f"top-4 latency: {too_wide_latency:.1f} ms, "
    f"pass={too_wide_latency <= LATENCY_BUDGET_MS}"
)
assert release_latency <= LATENCY_BUDGET_MS
assert too_wide_latency > LATENCY_BUDGET_MS
```

<!-- leetllm: output:start -->
```text title="Output" output compact
top-3 latency: 26.5 ms, pass=True
top-4 latency: 34.0 ms, pass=False
```
<!-- leetllm: output:end -->

For this benchmark, three candidates recover the rule and fit the synthetic budget. The context cap is two, but only one passage clears the baseline threshold. A real service chooses these limits using held-out relevance labels and measured end-to-end <span data-glossary="p95-latency">p95 latency</span> by candidate count, input length, concurrency, and batch strategy. With dense attention, a pair's attention work grows roughly quadratically in its token length; equal candidate counts can therefore have very different costs. Measure queueing, network, tokenization, model execution, and packing together.

Define failure behavior before serving: on a timeout, either fall back to the original authorized order and mark the trace as degraded, or abstain if policy requires reranking. Never fill the gap with unscored restricted evidence. On equal scores, this lab preserves first-stage rank and then uses chunk ID as a deterministic tie-breaker.

```checkpoint
Can this sequential benchmark prove deployed p95 latency for a batched cross-encoder endpoint?
---
No. It makes the candidate-count tradeoff visible. Measure end-to-end p95 latency with the real model, input lengths, batching strategy, and hardware before setting a production budget.
```

Depth decides how many chunks get a score. It doesn't decide when the query is allowed to meet the chunk. Can that comparison be stored ahead of the request, or does it have to wait until the query and the passage are read together?

```checkpoint
Three dense-attention pairs have sequence lengths 32, 64 and 96. Count the T-squared attention entries only. What are the padded-batch total when all are padded to 96 and the unpadded sum?
---
Padded 27,648; unpadded 14,336.

Padded work is 3×96² = 27,648. The unpadded sum is 32² + 64² + 96² = 1,024 + 4,096 + 9,216 = 14,336. This counts one attention component, not measured wall-clock latency or all model arithmetic.
```

## Choose an interaction design deliberately

Anything computed without the query can be indexed. A score that needs this query and this chunk has to wait for request time. Predict that storage tradeoff before comparing the three designs below.

Three ranking designs make different choices across the interaction spectrum:

| Design | Stored before request | Request-time work | Architectural mechanism |
|---|---|---|---|
| Bi-encoder retrieval | One dense vector $\mathbf{e}_d \in \mathbb{R}^d$ per chunk | Inner product $\langle \mathbf{e}_q, \mathbf{e}_d \rangle$ against query vector | Single vector bottleneck; zero token-level cross interaction |
| BERT-style cross-encoder | No query-specific pair score | Bidirectional attention over $[CLS] \circ q \circ [SEP] \circ d \circ [SEP]$ | Query and document tokens interact before pooling |
| ColBERT late interaction | Token vectors $\mathbf{E}_d \in \mathbb{R}^{N_d \times m}$ per chunk | MaxSim across token matrices | Retains token granularity with pre-indexable document vectors |

Bi-encoders compress a passage into one vector before comparing it with the query.[^reimers2019] Encoding every condition into that representation can be challenging, but this doesn't mean a bi-encoder necessarily loses negation or entity roles. Those behaviors need evaluation on the actual checkpoint.

BERT-style cross-encoders let query and document tokens interact before the pooled score is computed. This interaction can capture fine distinctions. Measure the trained model on ambiguous pairs. Its output is still a compressed scalar.

<span data-glossary="colbert">ColBERT</span> bridges the gap through **late interaction**.[^khattab2020] It keeps document representations indexable offline as individual contextual token vectors, while preserving token-level comparison at query time. For each query token vector, the <span data-glossary="maxsim">MaxSim</span> operator finds its maximum dot product across all document token vectors, then sums those per-token maxima:

$$
S(q, d) = \sum_{i=1}^{N_q} \max_{j=1}^{N_d} \operatorname{sim}\bigl(\mathbf{E}_q[i], \mathbf{E}_d[j]\bigr)
$$

Original ColBERT L2-normalizes token embeddings, making token dot products equal cosine similarities.[^khattab2020] Token dimension $m$ is a configuration choice, not always 128. PLAID is a search engine for ColBERTv2 representations that uses centroid interaction and pruning; its reported speedups depend on the configuration and workload.[^santhanam2022Plaid] Don't infer a universal sub-10-ms result.

<figure>
  <img src="illustrations/_generated/reranker_interaction_spectrum_dark.png" alt="Three architectures score the same query and chunk. A bi-encoder compares separately pooled query and chunk vectors. A BERT-style cross-encoder joins CLS, query, and chunk tokens so both sides interact before one score; its grid is schematic, not measured attention. ColBERT keeps chunk-token vectors and compares a toy 2-by-3 matrix: query row 1 selects 0.900, row 2 selects 0.800, and MaxSim sums them to 1.700." />
  <figcaption>The middle grid shows only where a BERT-style input lets query and chunk tokens interact. Its cells are schematic; they are not attention weights from a model. The ColBERT table repeats the lab's toy dot products: row maxima 0.900 and 0.800 sum to 1.700, with the square-root value rounded to three decimals.</figcaption>
</figure>

Two query vectors find their best matches independently: $q_1$ matches $d_1$ at $0.9$, $q_2$ matches $d_2$ at $0.8$, and the score is their sum. Each 2-D vector has unit $\ell_2$ norm ($0.9^2 + (\sqrt{0.19})^2 = 1$), so dot products equal cosine similarities directly.

<!-- leetllm: test, output=show, continue=rerank-latency, id=rerank-maxsim -->
```python title="colbert-maxsim.py"
from math import hypot, sqrt

query_vecs = [(1.0, 0.0), (0.0, 1.0)]
doc_vecs = [(0.9, sqrt(0.19)), (0.6, 0.8), (-0.8, -0.6)]


def dot(left: tuple[float, float], right: tuple[float, float]) -> float:
    return left[0] * right[0] + left[1] * right[1]


def maxsim(
    query: list[tuple[float, float]],
    document: list[tuple[float, float]],
) -> float:
    if not query or not document:
        raise ValueError("query and document need token vectors")
    for vector in query + document:
        if len(vector) != 2 or not all(finite_number(value) for value in vector):
            raise ValueError("this lab requires finite 2-D token vectors")
        if abs(hypot(*vector) - 1.0) > 1e-9:
            raise ValueError("this lab requires unit-length token vectors")
    return sum(max(dot(query_vec, doc_vec) for doc_vec in document) for query_vec in query)


score = maxsim(query_vecs, doc_vecs)
assert all(abs(dot(v, v) - 1.0) < 1e-9 for v in query_vecs + doc_vecs)
print(f"MaxSim: {score:.1f}")
assert abs(score - 1.7) < 1e-9
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MaxSim: 1.7
```
<!-- leetllm: output:end -->

```checkpoint
Why can a document embedding be indexed before a request, while a cross-encoder relevance score can't?
---
A document embedding is computed without knowing the query. A cross-encoder score depends on a specific query and a specific chunk processed together, so it exists only at request time.
```

## Cache invalidation and multi-tenant security

Cross-encoder scores are expensive to recompute, which makes a cache attractive. Caching a score only by chunk ID, or only by `(query, chunk_id)`, is a severe correctness and security failure.

Three changes make a key that thin wrong:

1. **Document updates:** If a policy document changes but keeps its chunk ID, an un-invalidated cache entry continues serving scores calculated against the obsolete version.
2. **Model upgrades:** A checkpoint or scoring-method change can shift score scales and ordering. Mixing incompatible cached scores can corrupt ranking.
3. **Cross-tenant data leakage:** In multi-tenant environments, Tenant A and Tenant B might issue identical queries. If Tenant A has access to a confidential contract and caches its high relevance score, Tenant B's retrieval pipeline must not see that score, receive that document ID, or learn of its existence through side-channel timing probes.

Fingerprint the **exact scoring input**, immutable model and tokenizer revisions, scoring settings, and trusted tenant/access namespace. Include instructions, templates, truncation or windows, aggregation, adapters, and relevant precision settings. A mutable model name isn't an immutable revision. Avoid normalizing away input distinctions unless the scorer deliberately uses that same normalization.

For an independently scored pair, the input contains one query and passage. For a listwise model such as Jina Reranker v3.5, it contains the complete ordered candidate list: changing a neighbor or its position can change the score.[^jina2026RerankerV35] Pairwise cache entries aren't interchangeable with whole-list results.

Use structured serialization rather than ambiguous string concatenation. This configuration hashes already-rendered model input and explicit configuration. Pinning model, tokenizer, and truncation parameters inside the cache digest invalidates stale entries automatically when any component changes.

<!-- leetllm: test, output=show, continue=rerank-maxsim, id=rerank-cache -->
```python title="score-cache-identity.py"
def score_cache_key(
    model_input: str,
    *,
    model_revision: str,
    tokenizer_revision: str,
    scoring_settings: dict[str, object],
    tenant_id: str,
    security_scope: tuple[str, ...],
    grant_revision: str,
) -> str:
    strings = (model_input, model_revision, tokenizer_revision, tenant_id, grant_revision)
    if any(not isinstance(value, str) or not value for value in strings):
        raise ValueError("cache input and revisions must be nonempty strings")
    if (
        not isinstance(scoring_settings, dict)
        or not all(isinstance(key, str) for key in scoring_settings)
        or not isinstance(security_scope, tuple)
        or not all(isinstance(grant, str) and grant for grant in security_scope)
    ):
        raise ValueError("invalid scoring settings or security scope")
    payload = {
        "schema": 1,
        "input_sha256": sha256(model_input.encode("utf-8")).hexdigest(),
        "model_revision": model_revision,
        "tokenizer_revision": tokenizer_revision,
        "scoring_settings": scoring_settings,
        "tenant_id": tenant_id,
        "security_scope": sorted(set(security_scope)),
        "grant_revision": grant_revision,
    }
    try:
        serialized = json.dumps(
            payload, sort_keys=True, ensure_ascii=False,
            separators=(",", ":"), allow_nan=False,
        )
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError("cache configuration must be finite JSON data") from error
    return sha256(serialized.encode("utf-8")).hexdigest()


cache_config = {
    "model_revision": "model-checkpoint-v1",
    "tokenizer_revision": "tokenizer-checkpoint-v1",
    "scoring_settings": {"template": "eval-v1", "truncation": "refuse"},
    "tenant_id": "policy-lab",
    "security_scope": ("read:api-auth-v2",),
    "grant_revision": "auth-grants-v1",
}
pair_input = json.dumps([QUERY, CANDIDATES[2].text])
pair_key = score_cache_key(pair_input, **cache_config)
changed_text_key = score_cache_key(pair_input + " revised", **cache_config)
other_tenant_key = score_cache_key(
    pair_input, **{**cache_config, "tenant_id": "eval-tenant-beta"}
)
list_input = json.dumps([QUERY, [candidate.text for candidate in CANDIDATES]])
reversed_list_input = json.dumps([QUERY, [candidate.text for candidate in reversed(CANDIDATES)]])
print("Changed text changes key:", pair_key != changed_text_key)
print("Changed tenant changes key:", pair_key != other_tenant_key)
print("Changed list order changes key:", score_cache_key(list_input, **cache_config)
      != score_cache_key(reversed_list_input, **cache_config))
assert pair_key != changed_text_key and pair_key != other_tenant_key
assert score_cache_key(list_input, **cache_config) != score_cache_key(reversed_list_input, **cache_config)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Changed text changes key: True
Changed tenant changes key: True
Changed list order changes key: True
```
<!-- leetllm: output:end -->

The key identifies inputs. Authenticate callers, encrypt sensitive material, and validate source text separately. Derive access fields from trusted authorization, and recheck current access **before exposing cached IDs, scores, or text**, as well as before generation. Test timing side channels alongside cache isolation. Keep source revisions in cached result records for traceability as well.

A correct key still doesn't explain a bad answer. If the selected chunk is right and the reply is wrong, which record do you open?

## Emit the trace that evaluation needs

Open the trace. Without evidence-level records, a bad answer could come from retrieval order, pair scoring, context packing, or source freshness.

Record first-stage IDs, actual reranker input, candidate source identity, policy versions, pair scores, model versions, selected context IDs, and release gates. A document version is part of correctness: a well-ranked stale rule is still unsafe context.

<!-- leetllm: test, output=show, continue=rerank-cache, id=rerank-trace -->
```python title="reranking-release-trace.py"
SCORER_VERSION = "phrase-rule-v1"
selected_context = [
    result.candidate
    for result in release_reranked
    if result.score >= MIN_CONTEXT_SCORE
][:CONTEXT_BUDGET]
release_trace = {
    "query_id": "api-token-legacy-access-001",
    "system_authority": {
        "tenant": "policy-lab",
        "caller": "service-account-reader",
        "grant_revision": "auth-grants-v1",
        "replay_date": "2026-05-27",
    },
    "versions": {
        "retriever": "policy-retriever-v2",
        "index": "policy-index/2026-05-27",
        "sparse": "bm25-tokenizer-v1",
        "dense": "bge-embeddings-v1",
        "fusion": "rrf-k60",
        "reranker": SCORER_VERSION,
    },
    "first_stage_ids": first_stage_ids,
    "rerank_input_ids": [candidate.chunk_id for candidate in release_input],
    "reranked_ids": release_reranked_ids,
    "candidate_records": [
        {
            "chunk_id": result.candidate.chunk_id,
            "document_id": result.candidate.document_id,
            "parent_id": result.candidate.parent_id,
            "version": result.candidate.version,
            "first_stage_rank": result.candidate.first_stage_rank,
            "rerank_score": result.score,
            "reasons": result.reasons,
        }
        for result in release_reranked
    ],
    "selected_context_ids": [candidate.chunk_id for candidate in selected_context],
    "selected_versions": [candidate.version for candidate in selected_context],
    "gates": {
        "permitted_and_current": all(
            in_snapshot(candidate) for candidate in release_input
        ),
        "target_in_context": TARGET_ID in [
            candidate.chunk_id for candidate in selected_context
        ],
        "ordering_lift": ndcg_at_k(release_reranked_ids, RELEVANT_IDS, CONTEXT_BUDGET)
        > ndcg_at_k([candidate.chunk_id for candidate in release_input], RELEVANT_IDS, CONTEXT_BUDGET),
        "latency_budget": release_latency <= LATENCY_BUDGET_MS,
    },
}
stores_raw_policy_text = any(
    candidate.text in str(release_trace)
    for candidate in SOURCE_STORE
)
print("Versions:", release_trace["versions"])
print("Rerank input:", release_trace["rerank_input_ids"])
print("Selected context:", release_trace["selected_context_ids"])
print("Trace stores raw policy text:", stores_raw_policy_text)
print("Gates:", release_trace["gates"])
assert set(release_trace["reranked_ids"]) == set(release_trace["rerank_input_ids"])
assert not stores_raw_policy_text
assert all(release_trace["gates"].values())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Versions: {'retriever': 'policy-retriever-v2', 'index': 'policy-index/2026-05-27', 'sparse': 'bm25-tokenizer-v1', 'dense': 'bge-embeddings-v1', 'fusion': 'rrf-k60', 'reranker': 'phrase-rule-v1'}
Rerank input: ['api-token-troubleshooting-v1', 'api-password-reset-v1', 'api-token-legacy-v2-rule']
Selected context: ['api-token-legacy-v2-rule']
Trace stores raw policy text: False
Gates: {'permitted_and_current': True, 'target_in_context': True, 'ordering_lift': True, 'latency_budget': True}
```
<!-- leetllm: output:end -->

The trace records the actual three-candidate input and compares ordering on that subset. Its authorization labels describe a trusted teaching snapshot, not implemented authentication. Gold-target and ordering gates belong to offline evaluation, where labels exist. Live traces record IDs, versions, latency, and selection, but normally don't know the correct answer.

The substring check only detects complete candidate text. It misses fragments or encoded content and isn't a privacy audit. IDs, scores, and traces still require access controls.

### Test ranking and context invariants

What if a scorer returns a different candidate with a very high score? Or someone edits text while preserving the ID and version? These tests exercise the actual boundary under score manipulation and text substitution. The final case also shows why a relevant rule can support a denial.

<!-- leetllm: test, output=show, continue=rerank-trace, id=rerank-invariants -->
```python title="challenge-reranker-invariants.py"
from dataclasses import replace


def rejected(action) -> bool:
    try:
        action()
    except ValueError:
        return True
    return False


class RebindingScorer(ConstraintAwarePairScorer):
    def score(self, request: Request, candidate: Candidate) -> PairScore:
        return PairScore(SOURCE_STORE[-2], 999.0, ("wrong-candidate",))


class NonFiniteScoreScorer(ConstraintAwarePairScorer):
    def score(self, request: Request, candidate: Candidate) -> PairScore:
        return PairScore(candidate, float("nan"), ())


changed_record = replace(CANDIDATES[2], text="Changed rule under unchanged ID/version")
assert rejected(lambda: rerank(REQUEST, [changed_record], ConstraintAwarePairScorer()))
assert rejected(lambda: rerank(REQUEST, CANDIDATES, RebindingScorer()))
assert rejected(lambda: rerank(REQUEST, CANDIDATES, NonFiniteScoreScorer()))
assert rejected(lambda: pack_context(CANDIDATES, -1))
print("Changed record, rebound result, non-finite score/budget: rejected")

for days, audit in [(0, True), (14, True), (15, True), (10, False)]:
    request = replace(REQUEST, days_since_deprecation=days, audit_enabled=audit)
    target_score = next(
        result.score for result in rerank(request, CANDIDATES, ConstraintAwarePairScorer())
        if result.candidate.chunk_id == TARGET_ID
    )
    permitted_by_rule = 0 <= days <= 14 and audit
    print(f"day={days}, audit={audit}: score={target_score}, policy_allows={permitted_by_rule}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Changed record, rebound result, non-finite score/budget: rejected
day=0, audit=True: score=7, policy_allows=True
day=14, audit=True: score=7, policy_allows=True
day=15, audit=True: score=5, policy_allows=False
day=10, audit=False: score=5, policy_allows=False
```
<!-- leetllm: output:end -->

The rule treats days 0 through 14 as inclusive and assumes the caller is a service account. At day 15 or with auditing disabled, the chunk remains relevant and clears the +5 selection gate, while access is denied. The score selects evidence; interpreting that evidence is a separate operation.

```checkpoint
A trace proves that both required current permitted clauses reached the generator unchanged. The clauses jointly deny the requested action, but the answer grants it and cites those clauses. Which is the first demonstrated failure in this trace?
---
Downstream interpretation or grounding; assess the answer against the selected conditions.

The trace establishes required context presence and current authorization. The observed wrong conclusion appears when the generator interprets that context. A relevance score can correctly rank a denial. Further tests may find additional defects, but the evaluated evidence already demonstrates this downstream failure.
```

```checkpoint
Two required permitted passages K and M score 4.1 and 3.3; distractor Z scores 2.7. Admission requires score at least 3, capacity is two passages, and available context is 38 tokens. K has 21 tokens, M 17 and Z 9. Which descending-order packing result follows?
---
K,M; 38 tokens; both required passages fit.

K and M clear the threshold and descend in that order. Their total is 21 + 17 = 38, exactly the available budget; capacity two also passes. Z is below the selection threshold. Complete context still leaves policy interpretation and answer verification to generation.
```

## Release checks for `policy-answerer-v3`

Use the gates as a diagnosis path. A missing target is a recall failure; a target below the context cutoff is an ordering failure; a score-text mismatch is a truncation failure; correct context with an unsupported answer belongs to the next generation and evaluation stage.

Before this reranker serves another legacy-token question:

| Gate | Evidence to log | Failure response |
|---|---|---|
| Candidate recall | Gold chunk ID in first-stage top `k` | Fix retrieval or raise measured candidate budget |
| Authorization and freshness | <span data-glossary="acl">ACL</span> decision, chunk version, effective date | Reject request context; never score blocked evidence |
| Truncation-aware scoring | Pair token length, `truncated` flag, scored vs packed checksum or kept span | Refuse pair, re-chunk, or record explicit window; never rank a silent prefix |
| Ordering lift | Before/after MRR or NDCG on held-out traces | Retrain, replace, or remove reranker |
| Serving budget | Candidate count, token length, model version, p95 latency | Batch, cap input, or choose a tested alternative |
| Downstream grounding | Selected chunk IDs and generated citations | Evaluate in the next pipeline stage |

Caching only by chunk ID is unsafe. Include the exact scoring input's <span data-glossary="checksum">checksum</span>, immutable model/tokenizer revisions, scoring settings, and trusted access scope. For listwise scoring, input identity covers the full ordered list. Recheck access before disclosing a cache hit. Replay labeled cases after source changes. A high score for obsolete policy is still obsolete evidence.

A missing target is a recall miss, and a target below the cutoff is an ordering miss. The scored span has to match the packed text, and a cache key has to include tenant, revision, and list membership. A score of +7 can rank Rule AUTH-14 at top and still leave access denied on day 15. The generated sentence has to follow the selected rule, which the score does not check.


```mastery-quiz
[
  {
    "question": "At one prediction position, a toy three-token vocabulary has yes logit 1, no logit −1 and other logit 3. Which pair gives the binary-renormalized yes score and full-vocabulary yes probability?",
    "options": [
      "Binary ≈ 0.881; full vocabulary ≈ 0.117.",
      "Binary ≈ 0.731; full vocabulary ≈ 0.245.",
      "Binary ≈ 0.117; full vocabulary ≈ 0.881.",
      "Binary ≈ 0.500; full vocabulary ≈ 0.117."
    ],
    "answer": "Binary ≈ 0.881; full vocabulary ≈ 0.117.",
    "explanation": "The binary logit difference is 1 − (−1) = 2, so sigmoid(2) ≈ 0.881. The full probability is exp(1)/(exp(1)+exp(−1)+exp(3)) ≈ 0.117. Removing other changes the denominator and event."
  },
  {
    "question": "A listwise scorer reads the complete ordered list [P, Q, R]. Q is replaced by a new revision while P stays byte-identical. All access checks still pass. Which reuse plan matches that input dependency?",
    "options": [
      "Reuse P and R scores; recompute Q and merge the three independent scores.",
      "Reuse every score; update only Q’s citation revision in the packed context.",
      "Recompute Q and R; keep P because earlier position protects its prior score.",
      "Recompute the changed full-list input; bind its exact ordered revisions and settings."
    ],
    "answer": "Recompute the changed full-list input; bind its exact ordered revisions and settings.",
    "explanation": "A listwise result is bound to the complete ordered scoring input. The model architecture permits neighboring text to affect scores, so an unchanged passage is not sufficient evidence that its listwise score is reusable. A verified narrower dependency would require a separate explicit specification."
  },
  {
    "question": "A scorer response preserves the candidate chunk ID, text and version but substitutes a different parent identity. Its score is finite and current caller access still passes. Under the complete-record specification, what is the correct next step?",
    "options": [
      "Accept unchanged text; replace the citation parent in the selected-context manifest.",
      "Reject the rebound response; revalidate its source-parent binding before context inclusion.",
      "Keep the ranking score; resolve the parent mismatch after generation returns its citations.",
      "Accept matching ID and version; treat the parent field as display-only metadata."
    ],
    "answer": "Reject the rebound response; revalidate its source-parent binding before context inclusion.",
    "explanation": "The scorer must return the same complete candidate it received. A changed parent identity breaks that binding even when text, version and permission match. Reject the response before context publication; a changed source relationship needs a fresh trusted decision rather than a silent citation repair."
  },
  {
    "question": "A question needs three passages at first-stage ranks 2, 6 and 9. The reranker can reorder the first seven candidates. The prompt has three slots, each large enough for any one passage. What is the maximum fraction of required passages that could reach the prompt now? Which adjustment, if any, would let all three reach it?",
    "options": [
      "1/3 now. Send the first nine candidates to the reranker.",
      "3/3 now. Keep the current depth and prompt capacity.",
      "2/3 now. Send the first nine candidates to the reranker.",
      "2/3 now. Increase the prompt capacity to four slots."
    ],
    "answer": "2/3 now. Send the first nine candidates to the reranker.",
    "explanation": "The reranker can put both rank 2 and rank 6 in the prompt, giving a maximum recall of 2/3. Counting only the first three search results gives 1/3 and misses the chance to move rank 6 up. Counting the three slots gives 3/3 and overlooks the missing passage at rank 9. A fourth slot would still leave that passage out of scoring. At depth nine, all three can compete for the three existing slots."
  },
  {
    "question": "A declared whitespace-token wrapper keeps an 8-token query and reserves 3 special tokens inside a 30-token pair limit. The source document has 25 tokens and its tail may be cut. How many document tokens fit, and how many are omitted?",
    "options": [
      "19 fit; 6 omitted.",
      "22 fit; 3 omitted.",
      "19 fit; 9 omitted.",
      "30 fit; 0 omitted."
    ],
    "answer": "19 fit; 6 omitted.",
    "explanation": "Document capacity is 30 − 8 − 3 = 19, so 25 − 19 = 6 source tokens are omitted. The metadata must identify the kept span and policy rather than treating a scored prefix as the full source. A real checkpoint requires its actual tokenizer."
  },
  {
    "question": "The only relevant passage moves from rank 5 to rank 2. What are the before-and-after values for full-list reciprocal rank (RR) and binary NDCG@3, rounded to three decimals?",
    "options": [
      "RR 0.200 → 0.500, NDCG@3 0.000 → 1.000.",
      "RR 0.200 → 0.500, NDCG@3 0.000 → 0.631.",
      "RR 0.000 → 0.500, NDCG@3 0.000 → 1.000.",
      "RR 0.000 → 0.500, NDCG@3 0.000 → 0.631."
    ],
    "answer": "RR 0.200 → 0.500, NDCG@3 0.000 → 0.631.",
    "explanation": "Full-list RR rises from 1/5 to 1/2. For NDCG@3, rank 5 contributes zero. At rank 2 the gain is 1/log2(3), about 0.631, and the ideal gain at rank 1 is 1. A starting RR of zero applies the cutoff to RR. A final NDCG of one treats any hit in the top three as ideal. Pairing those values makes both mistakes."
  },
  {
    "question": "Scores for A, B and C are [5, 4.4, 2]. An additive margin of 0.7 keeps scores at least top minus margin, inclusively. Which retained sets result originally, after adding 6 to all scores, and after multiplying all original scores by 3 without changing the margin?",
    "options": [
      "Original A,B; shifted A; scaled A,B.",
      "Original A; shifted A; scaled A,B.",
      "Original A,B; shifted A,B; scaled A,B.",
      "Original A,B; shifted A,B; scaled A."
    ],
    "answer": "Original A,B; shifted A,B; scaled A.",
    "explanation": "The original cutoff is 4.3, retaining A and B. The shifted cutoff is 10.3, again retaining A and B. The scaled cutoff is 14.3, so B at 13.2 falls out. Additive shifts preserve differences; changing scale does not preserve a fixed additive margin."
  },
  {
    "question": "A synthetic sequential scorer costs 6 ms overhead plus 5 ms per candidate. Its limit is 39 ms, and the required passage is rank 7. Which maximum depth and coverage conclusion follow?",
    "options": [
      "Maximum depth 6; the required passage is absent.",
      "Maximum depth 7; the required passage is present.",
      "Maximum depth 8; the required passage is present.",
      "Maximum depth 6; the required passage is present."
    ],
    "answer": "Maximum depth 6; the required passage is absent.",
    "explanation": "At most floor((39 − 6)/5) = 6 candidates fit, costing 36 ms. Depth 7 would cost 41 ms, exceeding the configured limit. The target is absent at depth 6, so this worksheet needs a changed retrieval or serving plan rather than a claim that reranking recovered it."
  },
  {
    "question": "A query has token vectors (1, 0) and (0, 1). A document has token vectors (0.80, −0.60) and (0.96, 0.28). What is the document’s MaxSim score using dot products?",
    "options": [
      "0.96",
      "1.24",
      "1.76",
      "1.08"
    ],
    "answer": "1.24",
    "explanation": "The first query token compares 0.80 with 0.96. The second compares −0.60 with 0.28. Both choose the second document token, so the score is 0.96 + 0.28 = 1.24. Taking the largest match overall gives 0.96 and skips the second query token. Taking the best match for each document token gives 0.80 + 0.96 = 1.76. Forcing the query tokens to use different document tokens gives at best 0.80 + 0.28 = 1.08."
  },
  {
    "question": "A pair-score cache stores a score for tenant Oak at grant revision 7. The request logged its latency in milliseconds. Three new requests match the stored scoring input, model and tokenizer revisions, settings and access scope. Each record lists the trusted tenant, grant revision, latency log unit and fresh access decision. A = (Elm, 7, ms, allow). B = (Oak, 8, ms, allow). C = (Oak, 7, µs, allow). Which requests can reuse the stored score?",
    "options": [
      "All three requests.",
      "B and C only.",
      "C only.",
      "None of the requests."
    ],
    "answer": "C only.",
    "explanation": "All three requests pass the current access check. Reuse also requires a matching key. Elm is a different tenant, and revision 8 identifies a different grant record. Letting all three requests reuse the score would ignore both differences. Allowing B and C would overlook the grant revision. Refusing all three would treat the latency log unit as a scoring input. C can report time in microseconds and reuse the same pair score."
  }
]
```

> **Next:** Continue to [RAG Evaluation for Reliable Answers](/learn/rag-evaluation-faithfulness-relevance). Take a permission-safe candidate list, reorder it, and keep a versioned evidence trace. That trace is the input to faithfulness, citation, and failure-attribution gates, so a well-ranked chunk still has to support the generated answer.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Your hybrid search found the right rule, and ranked it third. The generator's prompt has room for two passages. So the model reads a troubleshooting note and a password-reset policy, the rule that answers the question stays on the shelf, and a user gets told something the policy does not say.

Your candidate recall will not catch this. The rule was in the candidate list, so that number is a perfect 1.0. The failure happened one step later, at the point where a long list gets cut down to what fits in the prompt. The target is already retrieved; moving it inside the two-slot cutoff requires an ordering or packing change.

Reranking solves it with a second, slower scorer that reads the question and each candidate passage together. To see it work, trace a concrete case: an inquiry asks whether a service account may use a legacy token endpoint ten days after deprecation when audit logging is active. The governing policy rule is `AUTH-14`, which allows access within fourteen days of deprecation provided audit logging is active. These records follow standard permission and tracing rules.

Hybrid search has put two distractors above the rule:

| Rank | Candidate | Why it distracts |
|---|---|---|
| 1 | `api-token-troubleshooting-v1` | Mentions legacy token errors, and grants no access |
| 2 | `api-password-reset-v1` | Discusses a different kind of token and its expiry |
| 3 | `api-token-legacy-v2-rule` | Contains the `AUTH-14` rule |
| 4 | `api-audit-export-v1` | Mentions audit records and a fourteen-day period |

Look at why these distractors are good ones. The troubleshooting note shares the query's vocabulary. The audit export note even contains "audit" and "14 days." A retriever that scores the query and the passage separately has trouble seeing that "fourteen days" here refers to file retention and has nothing to do with deprecation.

## Two stages, one rule about what each may do

Why not use the slow, careful scorer for everything? Because of the arithmetic. Lexical indexes and precomputed vectors can search millions of passages because the passage side of the work happened ahead of time. A cross-encoder has to run a neural network on each question and passage pair at request time, so you can only afford it on a short list. That gives you two stages with different jobs: a broad first stage aiming for recall, then a narrow second stage aiming for precision near the top.

The division comes with a firm rule. All four candidates above passed the permission check before scoring started, and administrative or superseded records were removed earlier. A reranker changes the order of what it was given, but it never gets to add to that set. Sending text to a hosted reranker is also itself a disclosure, since a user's right to read a passage does not automatically permit you to send it to an outside service. Give your reranker the same data-handling review as anything else that receives private text.

Two ceilings follow from this. If the rule is absent from the candidates, no reranker can produce it. And if the rule is at rank three and you only send two candidates for reranking, you get the same result. So you now have the four sizes the last chapter warned about: how deep each lane searches, how many fused candidates you keep, how many of those the reranker reads, and how many passages reach the model. Keep them distinct in your configuration and traces, because a failure at each one calls for a different fix.

## Reading the question and passage together

A bi-encoder, the kind of model behind the dense lane, turns the question and the passage into vectors separately and then compares them. This is why passage vectors can be computed in advance. It also means the passage's vector was formed before the question existed, so it cannot focus on what this question cares about.

A cross-encoder processes the two together. BERT, a widely used transformer encoder, expects its input in this shape. `[CLS]` is a special token at the start, and its final vector stands for the whole input. `[SEP]` marks the end of each text.

```text
[CLS] question tokens [SEP] candidate passage tokens [SEP]
```

Because attention runs across the whole input, tokens in the passage can respond directly to tokens in the question. A scoring head then turns the final representation into one relevance number, called a logit. Nogueira and Cho showed that this approach works well for passage reranking.[^nogueira2019]

For Luna's question, the useful interactions are about who, what, when, and under what condition. "Service account" has to be the actor allowed to use the endpoint. The fourteen days have to count from deprecation, and have nothing to do with how long audit exports are kept. Audit logging has to remain a condition of access. Separate vectors give a model little opportunity to check any of these relationships, and joint processing at least makes it possible.

"Possible" is doing a lot of work in that sentence. The architecture can represent the distinction, but that does not mean a given checkpoint learned it, since a model can pick up shortcuts from its training data. Test yours on swapped actors, changed dates, missing conditions, negation, and look-alike terminology.

For a simple scalar head,

$$
z(q,d)=w^\top h_{\mathrm{CLS}}(q,d)+b.
$$

Sorting by $z$ gives you an order. Be careful about reading more into the number than that. Applying a sigmoid gives you a value between 0 and 1 without changing the ranking.[^sentenceTransformers2026CrossEncoderUsage] It looks like a probability, but nothing has fit it to behave like one. A threshold copied from another model or corpus can make very different decisions on yours. If you want real probabilities, fit a calibration method on held-out labels. Platt scaling fits a logistic curve from score to probability, and isotonic regression fits a staircase that can only go up.[^sklearnCalibration2026] Be precise about the event you are predicting. A passage being relevant is a different event from having enough to answer completely.

Not every reranker works this way, so read the scoring method for the model you deploy. Some use a pooled classification head as above. Others, such as the T5 reranker of Nogueira and colleagues, later known as monoT5, score by the probability of a target token, like `true` against `false`.[^nogueira2020monot5] Others look at the whole candidate list at once, which means a passage's score can change depending on its neighbors, and that matters when you cache results.

## Watching the order change

We can see the whole selection process without downloading a model, by using a hand-written scorer. It gives seven points to the governing rule, two to the audit export note, zero to the password reset, and minus one to the troubleshooting note.

A passage needs five points to enter the context. The context budget of two is a maximum, so the second slot can stay empty. Filling it with an unrelated document would spend tokens to give the model something to be misled by.

<figure>
<img src="illustrations/_generated/reranking_pipeline_dark.png" alt="Four permitted candidates keep their identities in hybrid order. Hand-written pair scores on one axis give troubleshooting minus 1, password reset 0, the AUTH-14 rule plus 7, and audit export plus 2. Only AUTH-14 clears the plus 5 threshold, so it moves from rank three to the first context slot, and the second slot stays empty. An admin-only record and a superseded version were removed before scoring." />
<figcaption>The same four candidates, with their identities intact, get scored as pairs with the question. <code>AUTH-14</code> moves from rank three to the first context slot. Nothing else clears the threshold, so the second slot stays empty.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-rerank-auth14 -->
```python title="reader-rerank-auth14.py"
from dataclasses import dataclass

@dataclass(frozen=True)
class Candidate:
    chunk: str
    parent: str
    revision: str
    text: str

candidates = [
    Candidate(
        "api-token-troubleshooting-v1", "api-troubleshooting-v1",
        "trouble/1",
        "Legacy token errors: this note does not authorize access.",
    ),
    Candidate(
        "api-password-reset-v1", "api-password-v1", "password/1",
        "Password-reset tokens expire after 30 minutes.",
    ),
    Candidate(
        "api-token-legacy-v2-rule", "api-access-v2", "api-access/2",
        "Rule AUTH-14. Service accounts may use the legacy token "
        "endpoint within 14 days of deprecation if audit logging "
        "is active.",
    ),
    Candidate(
        "api-audit-export-v1", "api-audit-v1", "audit/1",
        "Audit export files are retained for 14 days.",
    ),
]

def score(candidate):
    text = candidate.text.lower()
    return (5 * ("rule auth-14" in text)
            + 2 * ("audit logging" in text)
            + 2 * ("audit export" in text)
            - 1 * ("does not authorize" in text))

def select(pool):
    ranked = sorted(pool, key=lambda item: (-score(item), item.chunk))
    return [item for item in ranked if score(item) >= 5][:2]

selected = select(candidates)
assert [c.chunk for c in selected] == ["api-token-legacy-v2-rule"]
assert selected[0].parent == "api-access-v2"
assert select(candidates[:2]) == []
for item in sorted(candidates, key=lambda c: (-score(c), c.chunk)):
    print(item.chunk, score(item))
print("selected:", [item.chunk for item in selected])
print("first two candidates only:", len(select(candidates[:2])))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
api-token-legacy-v2-rule 7
api-audit-export-v1 2
api-password-reset-v1 0
api-token-troubleshooting-v1 -1
selected: ['api-token-legacy-v2-rule']
first two candidates only: 0
```
<!-- leetllm: output:end -->

The last line of the output demonstrates the depth ceiling. Give the same scorer only the first two candidates, and it selects nothing, since it has never seen the rule. In a real pipeline, an empty selection should lead to a defined fallback or an abstention. It must never lead to a retry that skips the permission filter in the hope of finding something.

Now run the same step with a real model. `cross-encoder/ms-marco-MiniLM-L6-v2` is a small cross-encoder, and it scores each pair with one forward pass. We run it through the Sentence Transformers library, which brings PyTorch with it when you install it. The first run then downloads about 90 MB of weights, and after that it runs offline on a CPU.

```text title="Install first"
pip install sentence-transformers==6.2.0
```

Add the next listing to the end of the previous one, since it reuses `candidates`. Before you read the output, predict how far the rule's score falls when Luna asks about day fifteen with logging disabled, a request the rule forbids.

<!-- leetllm: test, output=show, id=reader-rerank-real, continue=reader-rerank-auth14, deps=sentence-transformers==6.2.0 -->
```python title="reader-rerank-real-model.py"
# The first run downloads about 90 MB of model weights.
import textwrap
from sentence_transformers import CrossEncoder

model = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L6-v2", device="cpu"
)

def rerank(question):
    pairs = [(question, c.text) for c in candidates]
    scores = model.predict(pairs)
    print(textwrap.fill(question, 68))
    ranked = sorted(zip(scores, candidates), key=lambda p: -p[0])
    for value, c in ranked:
        print(f"  {value:6.2f}  {c.chunk}")

ASK = ("May a service account use the legacy token endpoint {} days "
       "after it was deprecated, with audit logging {}?")
rerank(ASK.format("ten", "active"))
rerank(ASK.format("fifteen", "disabled"))

filler = "Service accounts may use the legacy token endpoint. " * 80
catch = filler + "This requires that audit logging is active."
question = ASK.format("ten", "active")
scores = model.predict([(question, filler), (question, catch)])
print(f"past the input limit: {scores[0]:.2f} and {scores[1]:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
May a service account use the legacy token endpoint ten days after
it was deprecated, with audit logging active?
    9.13  api-token-legacy-v2-rule
   -5.52  api-token-troubleshooting-v1
   -6.08  api-audit-export-v1
   -7.80  api-password-reset-v1
May a service account use the legacy token endpoint fifteen days
after it was deprecated, with audit logging disabled?
    8.56  api-token-legacy-v2-rule
   -4.98  api-token-troubleshooting-v1
   -6.33  api-audit-export-v1
   -7.45  api-password-reset-v1
past the input limit: 3.06 and 3.06
```
<!-- leetllm: output:end -->

Its scores are raw logits on a scale of their own, so our threshold of five means nothing here, and you would have to pick a new one on your own data. The order is what counts. The rule wins by a wide margin, and everything else lands far below it, which is the move our hand-written scorer imitated. Now look at the second block. Ask about day fifteen with logging disabled, and the rule barely moves, because the passage is still the highest-scoring item in this pool. The right answer flipped, but relevance did not.

So relevance leaves the final decision open. The selected rule permits Luna's day-ten request. At day fifteen, or with logging disabled, the same rule is still the highest-scoring passage among these four candidates, but it now supports a no. A relevant passage can explain why something is forbidden just as well as why it is allowed, so a reranker's job ends at finding it.

## Check the text that was actually scored

Here is a failure that is easy to create and hard to notice. A reranker may see less text than the generator. Tokenizer limits, the question's length, special tokens, wrapper defaults, and truncation settings all decide what gets into the pair. If the deciding condition falls beyond that limit, the score describes a passage that does not exist in full.

Take our rule. It begins by granting permission, and it ends with the condition that limits it. Truncate the end, and you have a confident permission with the catch removed. The last line of the real run shows this happening: that model reads 512 tokens at most, so a condition placed past the limit leaves the score exactly where it was. The word limit below is much smaller than that, so that you can see what disappears.

<!-- leetllm: test, output=show -->
```python title="reader-rerank-truncation.py"
import textwrap

rule = (
    "Rule AUTH-14. Service accounts may use the legacy token "
    "endpoint within 14 days of deprecation if audit logging "
    "is active."
)
prefix = " ".join(rule.split()[:16])
assert "audit logging" not in prefix
assert "audit logging" in rule
print(textwrap.fill(f"prefix: {prefix}", 68))
print("condition in scored prefix:", "audit logging" in prefix)
print("condition in full source:", "audit logging" in rule)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prefix: Rule AUTH-14. Service accounts may use the legacy token
endpoint within 14 days of deprecation if
condition in scored prefix: False
condition in full source: True
```
<!-- leetllm: output:end -->

The reverse mistake is just as bad: you score the full passage and then pack only its beginning, so the generator sees less than the scorer did. Either way, "this passage supports the answer" has stopped being true. Record what earned the score: the source revision, a digest of the normalized text, the tokenizer and truncation settings, and the span that was kept. Packing can still add the parent section for clarity, as long as the trace shows which text was scored and which was added around it.

Splitting long documents into scoring windows helps, but it creates a new decision about how to combine window scores. Taking the maximum rewards a document for one strong sentence and can lose a qualification sitting in another window. So keep the selected window's surrounding conditions available, and test the strategy on complete rules.

## Measuring the move

For a single request with one relevant passage, reciprocal rank is $1/r$, where $r$ is that passage's rank. Moving `AUTH-14` from rank three to rank one takes it from $1/3$ to $1$. Mean reciprocal rank averages this over a dataset, and you should state any rank cutoff and how you count a missing target.

The most intuitive measure here is whether the passage lands inside your real context budget. At a cutoff of two, the original order has no governing passage in context, and the new order has one. **Hit@2** goes from zero to one, while recall across all four candidates stays the same. With one relevant passage, Hit@2 is the same number as context recall at a budget of two, the context recall from [Production RAG](/learn/design-production-rag-pipeline). That pairing tells you what happened: you repaired the order, and found nothing new.

```checkpoint
Across a test set, Hit@2 rises from 0.40 to 0.70 after you add a reranker, and candidate recall stays at 0.85. What did the reranker repair, and what is the most this reranker could ever deliver at that cutoff?
---
It repaired order, since it found nothing new. Its ceiling is 0.85: on the other 15% of requests the target never reached the candidates, so no reordering can bring it into the prompt. To go past 0.85, you have to fix retrieval.
```

When passages have graded relevance, normalized discounted cumulative gain describes an ordering more fully. With the conventional gain $2^{y_i}-1$ for relevance grade $y_i$:

$$
\operatorname{DCG}@k=\sum_{i=1}^{k}\frac{2^{y_i}-1}{\log_2(i+1)},
\qquad
\operatorname{NDCG}@k=\frac{\operatorname{DCG}@k}{\operatorname{IDCG}@k}.
$$

The denominator is the best possible ordering under the same labels and cutoff.[^manning2008ir] Decide how to handle requests with no positive labels, or two reports will disagree because they counted different requests, with neither reranker to blame. In our single-rule case, NDCG@2 goes from zero to one.

Include requests where retrieval missed the target entirely. If you only evaluate cases where the answer reached the candidate list, your reranker can look wonderful while the whole service does poorly. Report the reranking quality together with how often that condition held.

## Where to spend the computation

Every extra candidate is another forward pass, and longer pairs cost more time and memory. Sentence Transformers publishes about 1,800 pairs per second for the model we just ran,[^sbertCrossEncoders2026] and its model card says that was measured on a V100 GPU.[^msMarcoModelCard2026] On one busy laptop CPU, we measured between about 90 and 400, depending on what else the machine was doing. So a pool of 100 candidates costs about 55 milliseconds at the published rate, and from about a quarter of a second to over a second on that laptop, before the rest of the pipeline has done anything. Start with the smallest input pool that keeps acceptable recall on your queries. Then increase it, and watch whether context recall improves enough to justify the cost. Look at query families separately: exact identifiers, long conditions, paraphrases, and questions where the right answer is no. A larger pool can help one family and do nothing for another.

Batching brings its own tradeoff. Padding many short pairs to match one long pair wastes work, and grouping pairs by length helps throughput at the price of queue delay. So measure both throughput and request tails, since a bigger batch does not improve every latency number.

```checkpoint
Your reranker scores about 300 pairs per second on your hardware. A request has a 400 ms deadline, and it has already spent 150 ms by the time reranking starts. What is the largest candidate pool you can afford?
---
The 250 ms left buys about $0.25\times300=75$ pairs, and that leaves nothing for generation or for one slow batch. So plan on far fewer, measure your tail latency at that size, and decide what happens when the reranker misses its deadline.
```

Decide what happens when the reranker times out. You might use the fused order as it stands, shrink the pool, or abstain, and each choice changes what reaches the generator. Record which path ran, and evaluate each separately. A silent fallback makes it impossible to tell normal performance from degraded performance, which means a reranker outage will show up as a slow, mysterious quality dip.

Cached scores need the whole scoring input in the key: the query, the exact passage bytes, the checkpoint, the preprocessing, and the access scope. For a model that looks at the whole list, the complete ordered list belongs in the key too. And recheck permissions when you reuse a cached result, because the caller may have lost access since the score was cached.

## Other places to spend the interaction

Everything computed without the query can be indexed. Any score that needs this query and this passage has to wait for request time. That single tradeoff separates the designs you will meet.

| Design | Stored ahead of time | Work at request time |
|---|---|---|
| Bi-encoder | One vector per passage | Compare two vectors |
| Late interaction | One vector per passage token | Match query tokens against those vectors |
| Cross-encoder | Nothing specific to the pair | One forward pass per pair |
| Generative listwise reranker | Nothing specific to the pair | One generation over the list |

ColBERT is the well-known example of late interaction.[^khattab2020] It keeps a matrix of token vectors for each passage. At query time, every query token finds its best match among the passage's tokens, and the matches add up:

$$
S(q,d)=\sum_{i=1}^{N_q}\max_{j=1}^{N_d}\operatorname{sim}(E_q[i],E_d[j]).
$$

If two query tokens find best matches of 0.9 and 0.8, the score is 1.7. You get matching at the level of tokens with no forward pass per pair, and you pay in storage. ColBERTv2's compression cut that footprint by 6 to 10 times.[^santhanam2022ColBertV2] Each query token also picks its match independently of the others, so run your swapped-actor tests here too.

At the other extreme, you can give a chat model the question and the list of passages, and ask it to return them in order. Sun and colleagues reported that properly instructed LLMs did this competitively with supervised methods on popular benchmarks.[^sun2023rankgpt] This mode can run without task-specific relevance labels. It costs a generation on every request, and it gives you text where you wanted a sorted list, so treat the result as untrusted input. Check that each returned ID was in the list you sent, and decide what happens to missing and duplicated IDs. Remember too that the passages are now in front of a model that reads instructions, and a document can contain text written to influence its own ranking.

## Ordering and support are separate questions

A good reranker test starts with a frozen candidate set and changes only the scorer. Check that the governing passage moves within the real cutoff, that no forbidden record appears, that scored and packed spans stay traceable, and that the request meets its deadline.

Then try to fool it. Ask the day-fifteen version of Luna's question. Change "audit logging is active" to "audit logging is disabled." Replace "service account" with an actor the rule never mentions. The governing passage can stay on top through all three, which is correct behavior for the reranker, but it leaves the generated answer to get the conclusion right.

Here is a useful exercise. Explain why these two repairs differ: moving `AUTH-14` from third to first among the same four candidates, and enlarging a two-candidate input pool so that `AUTH-14` reaches the reranker at all. The first repairs order, and the second repairs candidate recall at the scorer's input. They should leave different marks on your traces and your metrics.

Reranking has now delivered a current, permitted, complete source to the model. The model can still drop a condition, cite the wrong document, or state the opposite of the rule. The last stretch of the trip, from the passage to the words in the answer, is what [RAG evaluation](/learn/rag-evaluation-faithfulness-relevance) measures next.

<!-- leetllm: edition:reader:end -->
