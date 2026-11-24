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
  "shortDescription": "Move the right passage into the prompt. Learn how cross-encoders reorder retrieved candidates, and where recall, permissions, and sequence limits still matter.",
  "keyConceptsTested": [
    "Retrieve-then-rerank two-stage funnel",
    "Bi-encoder vector bottleneck vs cross-encoder joint attention",
    "ColBERT late interaction and MaxSim operator",
    "Classification heads, token-based scores, and listwise rerankers",
    "Pointwise scoring, pairwise training, and listwise input dependence",
    "Silent pair truncation and text checksums",
    "Compute and latency budgeting in the two-stage funnel",
    "Score calibration and selection thresholds",
    "Candidate ordering metrics",
    "Multi-tenant cache keys and security scopes"
  ],
  "coverImage": "illustrations/_generated/reranking_pipeline_dark.png"
}
---
<!-- leetllm: edition:reference:start -->

Hybrid retrieval can find the exact document a question needs and still lose it before generation. Suppose an engineer asks:

> Today is day 10 after deprecation. Can a service account use the legacy <span data-glossary="token">token</span> endpoint with audit logging enabled?

BM25 puts an operational note (`api-token-troubleshooting-v1`) first because it repeats `"legacy token endpoint"`, even though the note explicitly says it grants no temporary access. Dense search puts a password-reset document (`api-password-reset-v1`) second. The actual rule (`api-token-legacy-v2-rule`, Rule AUTH-14) allows legacy endpoint access within 14 days of deprecation when audit logging is enabled, yet hybrid fusion lands it at rank 3.

With a two-passage prompt budget, the troubleshooting note and password-reset doc fill the prompt while Rule AUTH-14 stays outside it. Candidate recall is 1.0, yet the generator never sees the rule. This is an **ordering failure**, not a recall failure.

Adding a <span data-glossary="reranker">reranker</span> between hybrid retrieval and prompt assembly scores each `(query, candidate)` pair jointly so the right rule rises into the prompt budget.

<figure>
  <img src="illustrations/_generated/reranking_pipeline_dark.png" alt="The same four permitted chunks stay in the candidate set. AUTH-14 starts at hybrid rank 3, receives a synthetic hand-written score of +7, and crosses the +5 gate to fill context slot 1. The other scores are audit export +2, password reset 0, and troubleshooting minus 1; slot 2 stays empty. Admin-only and superseded records are excluded before scoring." />
  <figcaption>The four permitted candidates enter pair scoring in hybrid order. `api-token-legacy-v2-rule` moves from rank 3 to rank 1 (+7) and fills slot 1; nothing else clears the +5 threshold, so slot 2 stays empty. Restricted and superseded records are excluded before scoring.</figcaption>
</figure>

## Retrieve broadly, then reorder carefully

A two-stage pipeline separates recall from precision:

| Stage | Core question | Optimized signal | Must preserve |
|---|---|---|---|
| Hybrid retrieval | Is the needed passage in the candidate pool? | Recall over current permitted chunks | Permissions and freshness filters |
| Reranking | Which retrieved passages best answer this query? | Top-of-list precision | Exact candidate membership |
| Generation | What answer follows from the packed context? | Grounded response with citations | Claims entailed by selected context |

A reranker can never rescue a document missing from its input pool, and it must never bypass the <span data-glossary="permission-boundary">permission filter</span> to fetch restricted or superseded chunks.

```checkpoint
Why does the reranker receive the permitted hybrid candidate list instead of every chunk in the corpus?
---
Reranking reorders permitted candidates; it is not an authorization filter. Scoring restricted or stale passages can leak them through scores, traces, caches, or hosted reranker APIs even if they are dropped later.
```

Start with the first-stage hybrid ranking where `api-token-legacy-v2-rule` sits at rank 3:

<!-- leetllm: test, output=show, id=rerank-lab -->
```python title="permitted-hybrid-candidates.py"
from __future__ import annotations

from dataclasses import dataclass
from math import isfinite, log2


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

## Keep permissions enforced before scoring

The corpus still stores a restricted admin rule and an expired revision. Verify that only exact records from the authorized first-stage snapshot can enter the reranker:

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
        candidate.permitted is True
        and candidate.current is True
        and FIRST_STAGE_RECORDS.get((candidate.chunk_id, candidate.version)) == candidate
    )


def rerankable_candidates(store: list[Candidate]) -> list[Candidate]:
    return [candidate for candidate in store if in_snapshot(candidate)]


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

Comparing complete records ensures a scorer cannot mutate text or parent metadata under an existing ID. Remember also that sending passages to a hosted reranker API transmits that text to a third-party processor, so apply the same data-handling review as any external model endpoint.

Without reranking, packing the top 2 hybrid hits misses `api-token-legacy-v2-rule`:

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

## How cross-encoders and LLM rerankers compute scores

Knowing which tensor produces the score and whether a model scores one passage or a whole list determines both latency and cache keys.

### Encoder classification heads

BERT-style cross-encoders concatenate the query and passage as `[CLS] Query [SEP] Chunk [SEP]`, letting bidirectional self-attention compare query and passage tokens directly before pooling.[^nogueira2019][^devlin2019] A linear head maps the final `[CLS]` representation $h_{\mathrm{CLS}}(q, d)$ to a scalar logit:

$$
z = \mathbf{w}^\top h_{\mathrm{CLS}}(q, d) + b
$$

With binary relevance labels $y \in \{0, 1\}$, **pointwise** training minimizes binary cross-entropy:

$$
\ell_{\mathrm{pointwise}}(z, y) = -y \log \sigma(z) - (1 - y) \log \bigl(1 - \sigma(z)\bigr).
$$

**Pairwise** training compares a positive passage $d^+$ against a hard negative $d^-$ with logistic preference loss (RankNet):[^burges2005ranknet]

$$
\ell_{\mathrm{pairwise}}(z^+, z^-) = \log\bigl(1 + e^{-(z^+ - z^-)}\bigr) = \operatorname{softplus}\bigl(-(z^+ - z^-)\bigr).
$$

> **Key insight:** Even when trained with pairwise preference loss, the model still scores each `(query, passage)` pair independently at inference time ($O(k)$ forward passes, not $O(k^2)$). Sigmoid $\sigma(z)$ is strictly increasing so it preserves order, though raw sigmoid values are not calibrated probabilities.[^sentenceTransformers2026CrossEncoderUsage]

### Token-based and listwise scorers

Generative and decoder-based rerankers extract scores in several ways:

- **Binary target-token log-odds:** `monoT5` (encoder-decoder) scores `true` vs. `false`,[^nogueira2020monot5] and `Qwen3-Reranker` (causal decoder) scores `yes` vs. `no` logits at the final prompt token:[^qwen2026Reranker]

```text
Instruction: Decide whether the document satisfies the query conditions.
Query: legacy token endpoint for service account on day 10 with audit logging
Document: Rule AUTH-14. Service accounts may use the legacy token endpoint...
Relevant (Yes/No):
```

$$
s(q, d) = \log \frac{P(\text{"Yes"} \mid q, d)}{P(\text{"No"} \mid q, d)} = z_{\text{Yes}} - z_{\text{No}},
\qquad
p_{\mathrm{binary}}(\text{"Yes"} \mid q, d) = \sigma(z_{\text{Yes}} - z_{\text{No}}).
$$

Note that $p_{\mathrm{binary}}$ renormalizes over only two tokens, which differs from the full-vocabulary probability $P(\text{"Yes"})$.
- **Single-logit or decoder classification heads:** `BGE-reranker-v2-gemma` reads the single `Yes` logit without subtracting `No`, while `RankLLaMA` attaches a scalar classification head directly to the decoder.[^bge2026GemmaScoring][^rankllama2023ModelCard]
- **Whole-list (listwise) rerankers:** Models like `Jina Reranker v3.5` process the query alongside the entire candidate list at once,[^jina2026RerankerV35] meaning each passage's score depends on its neighbors. Hosted APIs such as Cohere Rerank also accept a query and candidate list.[^cohere2026rerank]

| Scoring mechanism | Example | Input dependence | Primary cost drivers |
|---|---|---|---|
| Pooled classification head | BERT-style cross-encoder | One query-passage pair | Checkpoint size, pair length, batch shape |
| Target-token binary score | monoT5; Qwen3-Reranker | One templated pair | Architecture, template tokens, pair length |
| Decoder classification head | RankLLaMA | One query-passage pair | Backbone width, pair length |
| Whole-list interaction | Jina Reranker v3.5 | Query + complete list | Total list length, ordering, attention pattern |

Evaluate pointwise and pairwise losses at $z^+ = 1.2$, $z^- = 0.2$, and see how sharply pairwise loss penalizes an inverted ranking:

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

### Preserve the text that was actually scored

Cross-encoders enforce a maximum pair length (512 tokens for original BERT,[^devlin2019] larger for modern backbones, or API caps such as Cohere's `max_tokens_per_doc` default of 4096[^cohere2026rerank]). Silently truncating an overlong pair lets the reranker score only a prefix while the generator receives a different trailing clause.

| Truncation strategy | When to use | What to log |
|---|---|---|
| Keep full query; truncate chunk tail | Only when the leading prefix captures the decision | `tokenizer`, `max_length`, `truncated`, `kept_span` |
| Sliding windows over chunk | Qualifying clause may sit past window 1 | Window offsets, per-window scores, aggregation rule |
| Reject overlong pairs | High-stakes rules where partial scoring is unacceptable | Pair token count and fallback path |
| Score exact packed text | Context is already sized to budget | Checksum comparing scored vs. packed text |

Watch what happens when tail truncation cuts a passage right before the authorizing clause:

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
packed_tokens = budget.query_tokens + budget.chunk_tokens
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
release_ok = scored_checksum == packed_checksum
assert release_ok is False
print("Scored/packed match check:", release_ok)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Truncated: True
Scored pair tokens including specials: 24 / 24
Authorizing clause in scored text: False
Checksum match (scored == packed): False
Scored/packed match check: False
```
<!-- leetllm: output:end -->

Now build a transparent phrase-based pair scorer so we can trace the reranking pipeline end to end before swapping in a trained <span data-glossary="transformer">transformer</span> checkpoint:

<!-- leetllm: test, output=show, continue=rerank-truncation, id=rerank-request -->
```python title="inspect-query-conditions.py"
@dataclass(frozen=True)
class Request:
    endpoint: str
    remedy: str
    days_since_deprecation: int
    audit_enabled: bool


def validate_request(request: Request) -> None:
    if not request.endpoint.strip() or not request.remedy.strip():
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
            result.candidate != candidate
            or not in_snapshot(result.candidate)
            or not isfinite(result.score)
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
The target rule is retrieved at rank 3 but the prompt accepts two chunks. Is this a recall failure or an ordering failure?
---
It is an ordering failure. First-stage retrieval succeeded because the target entered the candidate pool; reranking moves it inside the two-chunk prompt budget.
```

Now select context using the reranked order and a minimum relevance threshold. Because a context budget is a maximum rather than a <span data-glossary="quota">quota</span>, slot 2 stays empty instead of pulling in distractors:

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

> **Common mistake:** High relevance does not mean "yes." Even on day 15 or with audit logging disabled, Rule AUTH-14 remains the highest-scoring passage because it is the exact rule that explains why access is denied.

```checkpoint
A pair scorer assigns a relevant passage logit 0.8 and a less relevant passage logit −0.4. Using the logistic preference loss, what is the loss for this ordering, rounded to three decimals?
---
0.263. The logit margin is $0.8 - (-0.4) = 1.2$, so $\log(1 + e^{-1.2}) \approx 0.263$. Reversing the two scores gives $\log(1 + e^{1.2}) \approx 1.463$.
```

```checkpoint
A scalar head uses weights [2, −0.5] and bias 0.1. Given pair states A = [0.4, 1.2] and B = [0.8, 0.2], which logits and top-ranked item follow?
---
A scores $2(0.4) - 0.5(1.2) + 0.1 = 0.3$ and B scores $2(0.8) - 0.5(0.2) + 0.1 = 1.6$, so B ranks first.
```

```checkpoint
Passage A has Yes logit 3 and No logit 5; B has Yes logit 2 and No logit 0. Which passage ranks first under a single-Yes-logit formula and under a Yes-minus-No formula?
---
Single-Yes compares 3 vs. 2 and chooses A. Yes-minus-No gives $-2$ for A vs. $+2$ for B and chooses B. Always use the checkpoint's documented scoring formula.
```

## Score calibration and selection thresholds

Cross-encoder logits vary by query type and checkpoint, so copying an arbitrary cutoff like `score >= 0.70` either starves nuanced queries of evidence or floods prompts with noise. Three practical selection strategies:

- **Rank-first within token budget:** Keep top-$k$ passages that fit the prompt. Order-invariant under monotone transforms, though it still returns noise when every candidate is irrelevant.
- **Score-margin falloff:** Keep chunk $i$ only when it stays close to the top score:
  $$
  s(q, d_i) \ge s(q, d_1) - \Delta_{\text{margin}}
  $$
  Invariant to additive score shifts, though sensitive to multiplicative rescaling.
- **Calibrated probabilities:** Fit Platt scaling ($P(y=1 \mid z) = 1/(1 + e^{Az + B})$) or isotonic regression on held-out development labels before using scores as abstention probabilities.[^sklearnCalibration2026] Recalibrate whenever you change the checkpoint or corpus.

```checkpoint
Twenty held-out cases each receive a predicted relevance probability of 0.75, and 8 are labeled relevant. What is the observed frequency and calibration gap?
---
Observed frequency is $8/20 = 0.40$, so the predicted probability is overconfident by $0.75 - 0.40 = 0.35$.
```

## Measure candidate recall and top-of-list relevance

Track three complementary metrics so you know immediately whether retrieval or reranking owns a failure:

1. <span data-glossary="recall-at-k">Recall@candidate_k</span>: Did first-stage retrieval give the reranker the needed passage?
2. <span data-glossary="mrr">Mean reciprocal rank (MRR)</span>: How high does the first relevant chunk rank? (Moving from rank 3 to rank 1 raises RR from $1/3$ to $1$.)
3. <span data-glossary="ndcg">Normalized discounted cumulative gain (NDCG)</span>: Do the highest-relevance chunks land inside the prompt cutoff?[^manning2008ir]

$$
\operatorname{DCG}_k = \sum_{i=1}^{k} \frac{2^{rel_i}-1}{\log_2(i+1)}
\qquad
\operatorname{NDCG}_k = \frac{\operatorname{DCG}_k}{\operatorname{IDCG}_k}
$$

<!-- leetllm: test, output=show, continue=rerank-context, id=rerank-metrics -->
```python title="ordering-metrics.py"
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

```checkpoint
At cutoff 2, a ranking has relevance grades [1, 0, 2]. Using gain $2^{\text{grade}} - 1$ and the ideal ordering of these labels, what is NDCG@2 to three decimals?
---
0.275. Actual top-2 DCG is $1/\log_2(2) + 0/\log_2(3) = 1.0$. Ideal top-2 DCG (grades 2 and 1) is $3/\log_2(2) + 1/\log_2(3) \approx 3.631$, giving $1.0 / 3.631 \approx 0.275$.
```

## Candidate count sets the ceiling and the bill

Passing only the top 2 hybrid hits to the reranker drops `api-token-legacy-v2-rule` before pair scoring even runs. Candidate recall $|R \cap C_k| / |R|$ caps the best recall any reranker can ever achieve:

<!-- leetllm: test, output=show, continue=rerank-metrics, id=rerank-candidate-budget -->
```python title="candidate-count-budget.py"
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

Because a cross-encoder scores every pair online, attention scales as $O(L T^2)$ in pair token length $T$ and linearly in candidate count $k$. Padding short pairs to match the longest sequence in a batch wastes compute unless you bucket by length or enable ragged batching (such as Triton's optional ragged batching configuration[^triton2026RaggedBatching]). Hosted APIs also cap batch sizes (Cohere recommends keeping Rerank requests under 1,000 documents[^cohere2026rerank]).

Model the trade-off between candidate depth and a 30 ms reranker latency budget:

<!-- leetllm: test, output=show, continue=rerank-candidate-budget, id=rerank-latency -->
```python title="latency-budget-check.py"
SEQUENTIAL_PAIR_COST_MS = 7.5
REQUEST_OVERHEAD_MS = 4.0
LATENCY_BUDGET_MS = 30.0


def estimated_latency_ms(candidate_count: int) -> float:
    nonnegative_integer(candidate_count, "candidate count")
    latency = REQUEST_OVERHEAD_MS + SEQUENTIAL_PAIR_COST_MS * candidate_count
    if not isfinite(latency):
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

Measure end-to-end <span data-glossary="p95-latency">p95 latency</span> on your target hardware and batching configuration, and decide timeout fallback behavior up front (either fall back to the authorized first-stage order with a degraded trace flag, or abstain).

```checkpoint
Can this sequential cost formula predict deployed p95 latency for a batched GPU cross-encoder?
---
No. It illustrates the candidate-count trade-off. Deployed p95 depends on batching, sequence-length distribution, queueing, and hardware, so measure end-to-end latency under realistic load.
```

```checkpoint
Three dense-attention pairs have lengths 32, 64, and 96. Counting $T^2$ attention entries only, what is the padded-batch total (all padded to 96) versus the unpadded sum?
---
Padded: $3 \times 96^2 = 27{,}648$. Unpadded: $32^2 + 64^2 + 96^2 = 1{,}024 + 4{,}096 + 9{,}216 = 14{,}336$.
```

## Choose an interaction design deliberately

Anything independent of the query can be precomputed and indexed; anything requiring query-passage token interaction waits until request time:

| Design | Stored offline | Request-time work | Core mechanism |
|---|---|---|---|
| Bi-encoder retrieval | One vector $\mathbf{e}_d \in \mathbb{R}^d$ per chunk | Dot product $\langle \mathbf{e}_q, \mathbf{e}_d \rangle$ | Single-vector compression; fast ANN search |
| BERT-style cross-encoder | No pair scores | Bidirectional attention over `[CLS] q [SEP] d [SEP]` | Full token-level interaction before pooling |
| ColBERT late interaction | Token matrix $\mathbf{E}_d \in \mathbb{R}^{N_d \times m}$ per chunk | MaxSim across token matrices | Pre-indexable document vectors with token-level matching |

Bi-encoders compress each passage into one vector ahead of time.[^reimers2019] <span data-glossary="colbert">ColBERT</span> bridges bi-encoders and cross-encoders via **late interaction**:[^khattab2020] document token embeddings are precomputed offline (L2-normalized), and at query time the <span data-glossary="maxsim">MaxSim</span> operator finds each query token's best matching document token and sums those maxima:

$$
S(q, d) = \sum_{i=1}^{N_q} \max_{j=1}^{N_d} \operatorname{sim}\bigl(\mathbf{E}_q[i], \mathbf{E}_d[j]\bigr)
$$

Engines like PLAID prune candidate lists using centroid interaction to accelerate ColBERTv2 search.[^santhanam2022Plaid]

<figure>
  <img src="illustrations/_generated/reranker_interaction_spectrum_dark.png" alt="Three architectures score the same query and chunk. A bi-encoder compares separately pooled query and chunk vectors. A BERT-style cross-encoder joins CLS, query, and chunk tokens so both sides interact before one score; its grid is schematic, not measured attention. ColBERT keeps chunk-token vectors and compares a toy 2-by-3 matrix: query row 1 selects 0.900, row 2 selects 0.800, and MaxSim sums them to 1.700." />
  <figcaption>From left to right: bi-encoder vector dot product, cross-encoder joint self-attention across concatenated tokens, and ColBERT MaxSim summing per-query-token maxima (0.900 + 0.800 = 1.700).</figcaption>
</figure>

Compute MaxSim on two unit-norm query tokens against three unit-norm document tokens:

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
        if len(vector) != 2 or not all(isfinite(value) for value in vector):
            raise ValueError("require finite 2-D token vectors")
        if abs(hypot(*vector) - 1.0) > 1e-9:
            raise ValueError("require unit-length token vectors")
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
A document embedding depends only on the document text. A cross-encoder score attends across a specific query and passage together, so it can only be computed once the query arrives.
```

## Cache keys and multi-tenant isolation

Caching cross-encoder scores by `(query, chunk_id)` alone breaks on document edits, model upgrades, and multi-tenant isolation (leaking scores or timing side channels across tenants). For listwise models like Jina Reranker v3.5, changing any neighbor or its position changes the score.[^jina2026RerankerV35]

Hash the **exact scoring input** (single pair for pointwise, full ordered list for listwise) alongside immutable model/tokenizer revisions, scoring settings, tenant ID, security scope, and grant revision:

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
    if not all((model_input, model_revision, tokenizer_revision, tenant_id, grant_revision)):
        raise ValueError("cache input and revisions must be nonempty strings")
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
    serialized = json.dumps(
        payload, sort_keys=True, ensure_ascii=False,
        separators=(",", ":"), allow_nan=False,
    )
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

Always recheck current permissions before reusing a cached score or passage.

## Emit the trace that evaluation needs

Record first-stage IDs, exact reranker inputs, source versions, scores, selected context IDs, and model revisions so downstream evaluation can separate retrieval, ordering, and generation errors:

<!-- leetllm: test, output=show, continue=rerank-cache, id=rerank-trace -->
```python title="reranking-trace.py"
SCORER_VERSION = "phrase-rule-v1"
selected_context = [
    result.candidate
    for result in release_reranked
    if result.score >= MIN_CONTEXT_SCORE
][:CONTEXT_BUDGET]
release_trace = {
    "query_id": "api-token-legacy-access-001",
    "caller_scope": {
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
    "checks": {
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
print("Checks:", release_trace["checks"])
assert set(release_trace["reranked_ids"]) == set(release_trace["rerank_input_ids"])
assert not stores_raw_policy_text
assert all(release_trace["checks"].values())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Versions: {'retriever': 'policy-retriever-v2', 'index': 'policy-index/2026-05-27', 'sparse': 'bm25-tokenizer-v1', 'dense': 'bge-embeddings-v1', 'fusion': 'rrf-k60', 'reranker': 'phrase-rule-v1'}
Rerank input: ['api-token-troubleshooting-v1', 'api-password-reset-v1', 'api-token-legacy-v2-rule']
Selected context: ['api-token-legacy-v2-rule']
Trace stores raw policy text: False
Checks: {'permitted_and_current': True, 'target_in_context': True, 'ordering_lift': True, 'latency_budget': True}
```
<!-- leetllm: output:end -->

### Test scorer safety and boundary cases

Verify that mutated records, scorers trying to swap in a different candidate, or `NaN` scores are rejected, and observe how Rule AUTH-14 stays highly relevant even when the final verdict flips to denied (day 15 or audit disabled):

<!-- leetllm: test, output=show, continue=rerank-trace, id=rerank-invariants -->
```python title="challenge-reranker-checks.py"
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
    print(f"day={days}, audit={audit}: score={target_score}, rule_allows={permitted_by_rule}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Changed record, rebound result, non-finite score/budget: rejected
day=0, audit=True: score=7, rule_allows=True
day=14, audit=True: score=7, rule_allows=True
day=15, audit=True: score=5, rule_allows=False
day=10, audit=False: score=5, rule_allows=False
```
<!-- leetllm: output:end -->

```checkpoint
A trace shows that all required current permitted clauses reached the generator unchanged. The clauses jointly deny the requested action, yet the answer grants it and cites those clauses. Which stage failed first?
---
Downstream generation or grounding. Retrieval and reranking succeeded by delivering the governing rule; the model misinterpreted the rule's conditions.
```

```checkpoint
Two required permitted passages K and M score 4.1 and 3.3; distractor Z scores 2.7. Selection requires score at least 3, capacity is two passages, and available context is 38 tokens. K has 21 tokens, M 17, and Z 9. Which passages are packed?
---
K and M (21 + 17 = 38 tokens). Both clear the threshold of 3 and fit within the 38-token budget and 2-passage limit; Z falls below threshold.
```

## Pre-launch checklist for reranking

| Check | Evidence to log | Action on failure |
|---|---|---|
| Candidate recall | Target chunk ID in first-stage top $k$ | Improve retrieval or raise candidate depth |
| Authorization and freshness | <span data-glossary="acl">ACL</span> decision, chunk version, effective date | Reject request; never score blocked chunks |
| Truncation safety | Pair token length, `truncated` flag, scored vs. packed checksum | Re-chunk, window, or reject silent prefix scoring |
| Ordering lift | Before/after MRR or NDCG on held-out queries | Tune, replace, or remove reranker |
| Serving budget | Candidate count, pair length, model version, p95 latency | Batch, cap depth, or switch to a smaller model |
| Downstream grounding | Selected chunk IDs and generated citations | Evaluate in the next chapter |

```mastery-quiz
[
  {
    "question": "At one prediction position, a three-token vocabulary has yes logit 1, no logit −1, and other logit 3. Which pair gives the binary-renormalized yes score and full-vocabulary yes probability?",
    "options": [
      "Binary ≈ 0.881; full vocabulary ≈ 0.117.",
      "Binary ≈ 0.731; full vocabulary ≈ 0.245.",
      "Binary ≈ 0.117; full vocabulary ≈ 0.881.",
      "Binary ≈ 0.500; full vocabulary ≈ 0.117."
    ],
    "answer": "Binary ≈ 0.881; full vocabulary ≈ 0.117.",
    "explanation": "The binary logit difference is 1 − (−1) = 2, giving sigmoid(2) ≈ 0.881. Full-vocabulary softmax gives exp(1) / (exp(1) + exp(−1) + exp(3)) ≈ 0.117."
  },
  {
    "question": "A listwise scorer reads the complete ordered list [P, Q, R]. Q is replaced by a new revision while P stays byte-identical. All access checks still pass. Which reuse plan matches that input dependency?",
    "options": [
      "Reuse P and R scores; recompute Q and merge the three independent scores.",
      "Reuse every score; update only Q's citation revision in the packed context.",
      "Recompute Q and R; keep P because earlier position protects its prior score.",
      "Recompute the changed full-list input; bind its exact ordered revisions and settings."
    ],
    "answer": "Recompute the changed full-list input; bind its exact ordered revisions and settings.",
    "explanation": "A listwise scorer lets every passage attend to its neighbors, so changing Q can shift P and R's scores too. Recompute the full list and key the cache by the complete ordered input."
  },
  {
    "question": "A scorer response preserves the candidate chunk ID, text, and version, yet substitutes a different parent identity. Its score is finite and caller access still passes. What is the right next step?",
    "options": [
      "Accept unchanged text; replace the citation parent in the selected-context manifest.",
      "Reject the rebound response; revalidate its source-parent binding before context inclusion.",
      "Keep the ranking score; resolve the parent mismatch after generation returns its citations.",
      "Accept matching ID and version; treat the parent field as display-only metadata."
    ],
    "answer": "Reject the rebound response; revalidate its source-parent binding before context inclusion.",
    "explanation": "The scorer must return the exact candidate record it received. A mutated parent breaks citation traceability and must be rejected before context assembly."
  },
  {
    "question": "A question needs three passages at first-stage ranks 2, 6, and 9. The reranker can reorder the first seven candidates. The prompt has three slots, each large enough for any one passage. What is the maximum fraction of required passages that could reach the prompt now, and what adjustment lets all three reach it?",
    "options": [
      "1/3 now. Send the first nine candidates to the reranker.",
      "3/3 now. Keep the current depth and prompt capacity.",
      "2/3 now. Send the first nine candidates to the reranker.",
      "2/3 now. Increase the prompt capacity to four slots."
    ],
    "answer": "2/3 now. Send the first nine candidates to the reranker.",
    "explanation": "At depth 7, the reranker sees ranks 2 and 6 (max 2/3 recall) and never sees rank 9. Sending the top 9 candidates lets all three compete for the existing three prompt slots."
  },
  {
    "question": "A whitespace-token wrapper keeps an 8-token query and reserves 3 special tokens inside a 30-token pair limit. The source document has 25 tokens and its tail may be cut. How many document tokens fit, and how many are omitted?",
    "options": [
      "19 fit; 6 omitted.",
      "22 fit; 3 omitted.",
      "19 fit; 9 omitted.",
      "30 fit; 0 omitted."
    ],
    "answer": "19 fit; 6 omitted.",
    "explanation": "Remaining document capacity is 30 − 8 − 3 = 19 tokens, omitting 25 − 19 = 6 trailing tokens."
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
    "explanation": "RR moves from 1/5 = 0.200 to 1/2 = 0.500. For NDCG@3, rank 5 scores 0, and rank 2 scores 1 / log2(3) ≈ 0.631."
  },
  {
    "question": "Scores for A, B, and C are [5, 4.4, 2]. An additive margin of 0.7 keeps scores at least top minus margin, inclusively. Which retained sets result originally, after adding 6 to all scores, and after multiplying all original scores by 3 without changing the margin?",
    "options": [
      "Original A,B; shifted A; scaled A,B.",
      "Original A; shifted A; scaled A,B.",
      "Original A,B; shifted A,B; scaled A,B.",
      "Original A,B; shifted A,B; scaled A."
    ],
    "answer": "Original A,B; shifted A,B; scaled A.",
    "explanation": "Original cutoff is 4.3 (keeps A, B). Shifted scores [11, 10.4, 8] have cutoff 10.3 (keeps A, B). Scaled scores [15, 13.2, 6] have cutoff 14.3, dropping B."
  },
  {
    "question": "A sequential scorer costs 6 ms overhead plus 5 ms per candidate. Its limit is 39 ms, and the required passage is at rank 7. Which maximum depth and coverage conclusion follow?",
    "options": [
      "Maximum depth 6; the required passage is absent.",
      "Maximum depth 7; the required passage is present.",
      "Maximum depth 8; the required passage is present.",
      "Maximum depth 6; the required passage is present."
    ],
    "answer": "Maximum depth 6; the required passage is absent.",
    "explanation": "floor((39 − 6) / 5) = 6 candidates (36 ms). Depth 7 costs 41 ms and exceeds the budget, so the rank-7 passage never reaches the reranker."
  },
  {
    "question": "A query has token vectors (1, 0) and (0, 1). A document has token vectors (0.80, −0.60) and (0.96, 0.28). What is the document's MaxSim score using dot products?",
    "options": [
      "0.96",
      "1.24",
      "1.76",
      "1.08"
    ],
    "answer": "1.24",
    "explanation": "Query token (1, 0) gets max(0.80, 0.96) = 0.96; query token (0, 1) gets max(−0.60, 0.28) = 0.28. Summing gives 0.96 + 0.28 = 1.24."
  },
  {
    "question": "A pair-score cache stores a score for tenant Oak at grant revision 7. The request logged its latency in milliseconds. Three new requests match the stored scoring input, model and tokenizer revisions, settings, and access scope. Each record lists (tenant, grant revision, latency log unit, fresh access decision): A = (Elm, 7, ms, allow), B = (Oak, 8, ms, allow), C = (Oak, 7, µs, allow). Which requests can reuse the stored score?",
    "options": [
      "All three requests.",
      "B and C only.",
      "C only.",
      "None of the requests."
    ],
    "answer": "C only.",
    "explanation": "Elm is a different tenant and revision 8 is a different grant state. Latency logging units are not part of the scoring input, so only C matches the cache key."
  }
]
```

> **Next:** Continue to [RAG Evaluation for Reliable Answers](/learn/rag-evaluation-faithfulness-relevance). With a reranked shortlist and versioned evidence trace in place, next evaluate whether generated claims are faithful, properly cited, and complete.
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

For this question, the useful interactions are about who, what, when, and under what condition. "Service account" has to be the actor allowed to use the endpoint. The fourteen days have to count from deprecation, and have nothing to do with how long audit exports are kept. Audit logging has to remain a condition of access. Separate vectors give a model little opportunity to check any of these relationships, and joint processing at least makes it possible.

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

Add the next listing to the end of the previous one, since it reuses `candidates`. Watch how the rule's score behaves when the caller asks about day fifteen with logging disabled, a request the rule forbids:

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

So relevance leaves the final decision open. The selected rule permits the day-ten request. At day fifteen, or with logging disabled, the same rule is still the highest-scoring passage among these four candidates, but it now supports a no. A relevant passage can explain why something is forbidden just as well as why it is allowed, so a reranker's job ends at finding it.

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

Then try to fool it. Ask the day-fifteen version of the question. Change "audit logging is active" to "audit logging is disabled." Replace "service account" with an actor the rule never mentions. The governing passage can stay on top through all three, which is correct behavior for the reranker, but it leaves the generated answer to get the conclusion right.

Here is a useful exercise. Explain why these two repairs differ: moving `AUTH-14` from third to first among the same four candidates, and enlarging a two-candidate input pool so that `AUTH-14` reaches the reranker at all. The first repairs order, and the second repairs candidate recall at the scorer's input. They should leave different marks on your traces and your metrics.

Reranking has now delivered a current, permitted, complete source to the model. The model can still drop a condition, cite the wrong document, or state the opposite of the rule. The last stretch of the trip, from the passage to the words in the answer, is what [RAG evaluation](/learn/rag-evaluation-faithfulness-relevance) measures next.

<!-- leetllm: edition:reader:end -->
