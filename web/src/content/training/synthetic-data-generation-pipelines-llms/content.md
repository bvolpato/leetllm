---
{
  "id": "synthetic-data-generation-pipelines-llms",
  "title": "Synthetic Data Pipelines",
  "slug": "synthetic-data-generation-pipelines-llms",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/admission_trace_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Meta",
    "Microsoft",
    "Scale AI"
  ],
  "shortDescription": "A judge score of 9/10 and a passing generated test can still admit a duplicate or a flawed answer. Filter synthetic candidates before adding them to training datasets.",
  "keyConceptsTested": [
    "Conditional data-stock forecasts and targeted capability supplementation",
    "Recursive model collapse, accumulation, and real-data coverage",
    "Self-Instruct bootstrapping from small human seed sets",
    "Evol-Instruct: in-depth vs in-breadth instruction rewriting",
    "Grounded execution verification with compilers, unit tests, and symbolic solvers",
    "Multi-tier candidate filtering and shift-left economics",
    "Benchmark decontamination via n-gram overlap and exact matching",
    "LLM-as-a-judge calibration alongside deterministic and human checks",
    "Position bias mitigation via order-reversal verification",
    "Semantic diversity filtering with embedding cosine similarity",
    "Red-teaming data synthesis for adversarial robustness",
    "Preference pair synthesis (chosen vs rejected) for DPO and RLHF",
    "Data flywheel: iterative generator and verifier loops",
    "Shard byte identity, trusted manifests, and SHA-256 limits"
  ],
  "section": "Training, Fine-Tuning & Alignment",
  "order": 10,
  "prerequisites": [
    "instruction-tuning-chat-templates",
    "dataset-pipelines-data-quality",
    "llm-as-judge-automated-evaluation",
    "continued-pretraining-domain-adaptation"
  ],
  "relatedQuestions": [
    "supervised-fine-tuning-pipeline",
    "reward-modeling-from-preference-data",
    "rlhf-dpo-aligning-language-models"
  ]
}
---

A synthetic training example scores 9/10 from an LLM judge and passes its own unit test. Should it enter your fine-tuning dataset? Not yet: it might be a near-duplicate of fifty existing rows, copy a verbatim sentence from your held-out evaluation benchmark, or pass a self-written test that asserts the exact bug the generator introduced.

Synthetic data shines when real post-training data is scarce: multi-constraint tool calling, tricky API pagination edge cases, or multi-step code debugging. The catch is that generating fluent text is effortless while verifying correctness, novelty, and benchmark cleanliness is where pipelines actually earn their keep. When a generator writes both a function and the only test checking it, a passing run merely confirms self-consistency. Keep trusted verifiers isolated from generation prompts, and run a disciplined multi-stage filter before any synthetic row reaches training.

## Why generate data if real text already exists?

Epoch's stock analysis projected that frontier training runs could approach the available stock of public human text between **2026 and 2032** under continued scaling trends, while its follow-up assessment highlighted synthetic data and multi-modal sources as practical ways past a raw text bottleneck.[^villalobos2024] Even without hitting a global data wall, most post-training projects lack reviewed demonstrations for their hardest slices:

- Multi-constraint instruction following
- Edge-case unit tests and code-repair trajectories
- Strict tool-calling sequences against documented schemas
- Adversarial refusal and boundary-handling examples

The risk of unconstrained synthetic loops is **model collapse**. Shumailov et al. showed that repeatedly replacing real training data with finite samples from previous generations drops rare tail events first and gradually degenerates the distribution.[^shumailov2024] Retaining real data changes the regime: Gerstgrasser et al. proved in idealized regression settings and showed across language-model experiments that **accumulating** synthetic rounds alongside original real data keeps error bounded rather than collapsing.[^gerstgrasser2024]

```text title="autophagous-collapse.txt"
Recursive Replacement (Model Collapse):
  Base Model M0 ──> Synthetic D1 ──> Train M1 ──> Synthetic D2 ──> Train M2
                         │                                │
                         ▼                                ▼
                (Rare tails drop out)          (Errors compound)

Accumulation + Verification Loop:
  Reviewed Real Data ──┐
                       ├──> Quality Filters ──> Accepted Shard ──> Train M_next
  Synthetic D_gen    ──┘    (Execution + diversity + judge)
```

## Seed curation: anchor the distribution in human intent

A reviewed seed pool anchors task scope, formatting, and difficulty. Inspect seeds carefully before scaling generation, because subtle errors in five seeds will replicate across fifty thousand synthetic children.

| Seed ID | Domain | Base Instruction | Target Output Format |
|---|---|---|---|
| `seed-004` | Algorithmic Reasoning | Solve a modular arithmetic problem step by step. | Derivation steps plus boxed integer result. |
| `seed-011` | API Integration | Implement a paginated API client using only provided docs. | `page_size <= 100`, cursor loop, exponential backoff on HTTP 429. |

Stamp every generated row with its lineage (`seed_id`, `tactic`, `data_slice`, `generator`) at creation time so bad generation batches can be traced and removed cleanly:

<!-- leetllm: test, id=schema, output=show, output_title="Candidate row schema" -->
```python title="validate_candidate_schema.py"
from dataclasses import dataclass, asdict
import json

VALID_SEEDS = {"seed-004", "seed-011"}
VALID_TACTICS = {"self_instruct", "add_constraint", "edge_case", "multi_step", "red_team"}


@dataclass(frozen=True)
class Candidate:
    row_id: str
    seed_id: str
    tactic: str
    data_slice: str
    instruction: str
    response: str
    generator: str


def validate(row: Candidate) -> None:
    if any(not str(v).strip() for v in asdict(row).values()):
        raise ValueError("empty candidate field")
    if row.seed_id not in VALID_SEEDS or row.tactic not in VALID_TACTICS:
        raise ValueError("unknown seed or tactic")
    if row.data_slice not in {"standard", "red_team"}:
        raise ValueError("unknown slice")
    if (row.tactic == "red_team") != (row.data_slice == "red_team"):
        raise ValueError("red-team tactic and slice must match")


row = Candidate(
    row_id="synth-0007",
    seed_id="seed-004",
    tactic="edge_case",
    data_slice="standard",
    instruction="Compute modular inverse using the extended Euclidean algorithm.",
    response="Step 1: Compute gcd(a, m). Step 2: Unwind Bezout coefficients. Final result: 7.",
    generator="synth-generator-v1",
)
validate(row)
print(json.dumps(asdict(row), sort_keys=True))
```

<!-- leetllm: output:start -->
```text title="Candidate row schema" output compact
{"data_slice": "standard", "generator": "synth-generator-v1", "instruction": "Compute modular inverse using the extended Euclidean algorithm.", "response": "Step 1: Compute gcd(a, m). Step 2: Unwind Bezout coefficients. Final result: 7.", "row_id": "synth-0007", "seed_id": "seed-004", "tactic": "edge_case"}
```
<!-- leetllm: output:end -->

## Self-Instruct: grow task coverage from seeds

**Self-Instruct** (Wang et al., 2023) bootstrapped 52,445 filtered instructions from just 175 human seed tasks by iterating five steps:[^wang2023a]

1. Sample eight demonstrations (six human seeds plus two previously accepted synthetic tasks).
2. Prompt the model to propose a brand-new instruction.
3. Classify the task as classification vs. non-classification.
4. Generate input-output instances (output-first for classification to avoid label skew; input-first otherwise).
5. Filter out any instruction whose **ROUGE-L** overlap with the existing pool reaches `0.7` or higher.

Watch that exact LCS-based ROUGE-L filter reject a surface paraphrase while admitting genuinely new tasks:

<!-- leetllm: test, output=show, output_title="Self-Instruct ROUGE-L novelty filter" -->
```python title="self_instruct_rouge_filter.py"
import re


def tokens(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower())


def rouge_l_f1(a: str, b: str) -> float:
    x, y = tokens(a), tokens(b)
    if not x or not y:
        return 0.0
    dp = [[0] * (len(y) + 1) for _ in range(len(x) + 1)]
    for i, tx in enumerate(x, 1):
        for j, ty in enumerate(y, 1):
            dp[i][j] = dp[i - 1][j - 1] + 1 if tx == ty else max(dp[i - 1][j], dp[i][j - 1])
    lcs = dp[-1][-1]
    return (2.0 * lcs) / (len(x) + len(y))


pool = ["Implement an LRU cache in Python with get and put methods."]
proposals = [
    "Implement an LRU cache in Python with get and put operations.",
    "Implement an LFU cache in Python with O(1) frequency buckets and tie-breaking.",
    "Write a cursor-based REST pagination client with exponential backoff on HTTP 429.",
]

for prop in proposals:
    max_rouge = max(rouge_l_f1(prop, existing) for existing in pool)
    kept = max_rouge < 0.7
    if kept:
        pool.append(prop)
    print(f"max_rouge_l={max_rouge:.3f} | {'KEEP  ' if kept else 'REJECT'} | {prop}")
```

<!-- leetllm: output:start -->
```text title="Self-Instruct ROUGE-L novelty filter" output compact
max_rouge_l=0.909 | REJECT | Implement an LRU cache in Python with get and put operations.
max_rouge_l=0.560 | KEEP   | Implement an LFU cache in Python with O(1) frequency buckets and tie-breaking.
max_rouge_l=0.083 | KEEP   | Write a cursor-based REST pagination client with exponential backoff on HTTP 429.
```
<!-- leetllm: output:end -->

## Evol-Instruct: make each task more demanding

Self-Instruct broadens coverage yet often stalls at seed-level difficulty. **Evol-Instruct** (WizardLM; Xu et al., 2023) systematically rewrites instructions along two axes: **in-depth** evolving makes the existing task harder, and **in-breadth** evolving creates adjacent new tasks.[^xu2023]

The five in-depth mutations are:

- **Add constraints:** Add strict runtime or typing rules (*"enforce $O(1)$ time, thread safety, and type annotations"*).
- **Deepen reasoning:** Require architectural derivations (*"explain why combining a doubly linked list with a hash map yields $O(1)$ eviction"*).
- **Concretize abstractions:** Swap generic interfaces for concrete structures (*"implement a ring buffer with dirty-page write-back"*).
- **Increase reasoning steps:** Break a single request into chained stages.
- **Complicate inputs:** Inject tricky boundary cases (*"handle zero capacity and concurrent key collisions"*).

```text title="evol-instruct-taxonomy.txt"
Base Seed ("Implement an LRU cache in Python")
  ├── In-Depth: Add Constraints ("O(1) time, thread safety, type annotations")
  ├── In-Depth: Deepen Reasoning ("Derive constant-time lookup and eviction")
  ├── In-Depth: Edge Case ("Zero capacity, eviction collisions, concurrent updates")
  └── In-Breadth: Domain Expansion ("LFU cache with frequency tie-breaking")
```

Notice what WizardLM's elimination step had to guard against: over-evolved prompts can become contradictory or unsolvable, and naive heuristics (like banning responses containing `"sorry"`) accidentally strip valid refusals from safety slices. Always verify feasibility and correctness after rewriting.

## Grounded execution: test the claims you can execute

Whenever a domain admits execution, deterministic checks beat prose scoring:

- **Parsers, linters, and type checkers:** Verify syntax and static typing fast, before running anything.
- **Independent execution tests:** Run candidate code inside isolated containers or microVMs against trusted tests hidden from the generator.
- **Symbolic solvers:** Check formalized math or constraints under explicit domains and time limits.

Two landmark recipes highlight the power and limits of grounded synthesis. **Phi-1** paired about 6B filtered code tokens with under 1B synthetic textbook tokens and ~180M exercise tokens, reaching 50.6% HumanEval <span data-glossary="pass-at-k">pass@1</span> at 1.3B parameters.[^gunasekar2023] **Llama 3** generated roughly one million coding dialogues using containerized static checks and self-generated tests, self-correcting ~20% of initially failing solutions; crucially, because the model could edit either its code *or* its tests, passing self-checks qualified a row for <span data-glossary="supervised-fine-tuning">SFT</span> without replacing independent held-out tests.[^dubey2024] Likewise, **Orca** showed gains from training on rich teacher explanation traces, provided those traces are checked for factual errors rather than rewarded for length.[^mukherjee2023]

## Calibrated LLM judges: position stability over prose polish

Open-ended tasks without deterministic tests rely on LLM judges, which carry three well-documented biases studied by Zheng et al.:[^zheng2023]

1. **Position bias:** Judging depends on whether a candidate sits in slot 1 or slot 2.
2. **Verbosity bias:** Extra padding can inflate scores without adding substance.
3. **Potential self-enhancement:** Judges may favor their own model family, though evidence varies across tasks and prompts.

Counter position bias with an **order-reversal check**: present `(A, B)` and `(B, A)`, remap both verdicts back to response identity (`A` vs. `B`), and accept a win only when the same response wins in both orders.

<figure>
  <img src="illustrations/_generated/judge_order_identity_dark.png" alt="Two fixed-vote comparisons keep response identity attached to color while left and right positions swap. For unsafe-tool-refusal, the judge selects left in the forward order and right after reversal, selecting response A twice. For verbose-answer, it selects left in both orders, changing the winner from A to B; the example withholds the candidate for review." />
  <figcaption>Track response identity across the swap. The first pair selects A in both orders; the second flips from A to B and routes to review.</figcaption>
</figure>

<!-- leetllm: test, continue=schema, id=judge, output=show, output_title="Pairwise judge order check" -->
```python title="require_order_stable_preference.py"
def canonical_winner(forward: str, reversed_order: str) -> str:
    if forward not in {"left", "right"} or reversed_order not in {"left", "right"}:
        return "review"
    forward_winner = "A" if forward == "left" else "B"
    reverse_winner = "A" if reversed_order == "right" else "B"
    return forward_winner if forward_winner == reverse_winner else "review"


for pair, fwd, rev in [
    ("unsafe-tool-refusal", "left", "right"),
    ("verbose-answer", "left", "left"),
]:
    print(f"{pair}: {canonical_winner(fwd, rev)}")
```

<!-- leetllm: output:start -->
```text title="Pairwise judge order check" output compact
unsafe-tool-refusal: A
verbose-answer: review
```
<!-- leetllm: output:end -->

```checkpoint
A pairwise judge chooses candidate A when A appears first, then chooses candidate B when B appears first. Should either preference enter training data?
---
Withhold the pair. The judgment flipped with presentation order; keep only order-stable preferences and inspect recurring flips for systematic position bias.
```

> **Common mistake:** Relying on headline agreement to trust an LLM judge. On a 100-row calibration slice with 98 acceptable examples and 2 dangerous failures, a rubber-stamp judge that approves everything scores **98% agreement** while letting **100% of unacceptable rows** straight into training:

<!-- leetllm: test, deps=numpy, output=show, output_title="Agreement can hide every rare failure" -->
```python title="inspect_false_admissions.py"
import numpy as np

reviewed_accept = np.array([True] * 98 + [False] * 2)
judge_accept = np.array([True] * 100)

agreement = float(np.mean(reviewed_accept == judge_accept))
bad_mask = ~reviewed_accept
bad_admitted = int(np.sum(judge_accept[bad_mask]))
bad_total = int(np.sum(bad_mask))

print(f"overall agreement:         {agreement:.0%}")
print(f"unacceptable rows admitted:{bad_admitted}/{bad_total} ({bad_admitted / bad_total:.0%})")
```

<!-- leetllm: output:start -->
```text title="Agreement can hide every rare failure" output compact
overall agreement:         98%
unacceptable rows admitted:2/2 (100%)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/rare_failure_agreement_dark.png" alt="A 100-row evaluation set contains 98 acceptable and two unacceptable rows. The judge approves all 100. A 10 by 10 grid colors the 98 correct approvals green and the two false admissions red. Overall agreement is 98 percent while both unacceptable rows pass: 2 of 2, or 100 percent." />
  <figcaption>Overall agreement is 98%, yet both unacceptable rows slip through (2/2). Track false-admission rates on critical slices separately from headline agreement.</figcaption>
</figure>

## Multi-tier candidate filtering: shift cheap checks left

Running an LLM judge on every raw candidate wastes compute on rows that a millisecond schema check or overlap filter would reject immediately. Ordering cheap, high-rejection filters first cuts total cost sharply, while keeping stateful stages (like greedy diversity filtering) aware of the finally accepted pool.

### Semantic diversity via cosine similarity

For nonzero embedding vectors $a$ and $b$, <span data-glossary="cosine-similarity">cosine similarity</span> measures directional proximity:

$$
\cos(a, b) = \frac{a \cdot b}{\|a\| \|b\|}
$$

For a reference cluster at $[1.0, 0.0]$ and a candidate at $[0.99, 0.02]$, the dot product is $0.99$, the candidate norm is $\sqrt{0.99^2 + 0.02^2} \approx 0.9902$, and $\cos \approx 0.9998$, well above an example cutoff of `0.82`. Watch how greedy online filtering adds accepted items into the comparison pool so candidate C (`[0.46, 0.41]`) gets blocked by newly admitted B (`[0.45, 0.40]`):

<!-- leetllm: test, continue=judge, id=diversity, deps=numpy, output=show, output_title="Diversity filter output" -->
```python title="filter_diversity.py"
import numpy as np
from typing import TypedDict


class EmbeddedCandidate(TypedDict):
    instruction: str
    embedding: list[float]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va, vb = np.asarray(a, dtype=np.float64), np.asarray(b, dtype=np.float64)
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
    if denom == 0.0 or not np.isfinite(denom):
        raise ValueError("embeddings must be nonzero and finite")
    return float(np.clip(np.dot(va, vb) / denom, -1.0, 1.0))


def filter_diversity(
    new_items: list[EmbeddedCandidate],
    existing_embeddings: list[list[float]],
    threshold: float = 0.82,
) -> list[EmbeddedCandidate]:
    accepted: list[EmbeddedCandidate] = []
    pool = [vec[:] for vec in existing_embeddings]
    for item in new_items:
        max_sim = max((cosine_similarity(item["embedding"], v) for v in pool), default=-1.0)
        if not pool or max_sim < threshold:
            accepted.append(item)
            pool.append(item["embedding"])
    return accepted


existing = [[1.0, 0.0], [0.0, 1.0]]
candidates: list[EmbeddedCandidate] = [
    {"instruction": "Compute another modular inverse problem.", "embedding": [0.99, 0.02]},
    {"instruction": "Answer an API pagination question with a citation.", "embedding": [0.45, 0.40]},
    {"instruction": "Answer another pagination question with a citation.", "embedding": [0.46, 0.41]},
]

for item in filter_diversity(candidates, existing):
    print(f"kept: {item['instruction']}")
```

<!-- leetllm: output:start -->
```text title="Diversity filter output" output compact
kept: Answer an API pagination question with a citation.
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/greedy_diversity_geometry_dark.png" alt="An equal-scale two-dimensional unit-circle cosine plot shows reference directions modular arithmetic [1, 0] and API pagination [0, 1]. Each cosine 0.82 cone has a 34.9 degree half-angle. Candidate A [0.99, 0.02] scores 0.9998 against arithmetic and is rejected. B [0.45, 0.40] has maximum similarity 0.7474 and is admitted. C [0.46, 0.41] then scores 0.999999 against newly admitted B and is rejected." />
  <figcaption>B clears the 0.82 cutoff against the existing pool and joins it. Candidate C is then compared against B as well, blocking the near-duplicate.</figcaption>
</figure>

### Benchmark decontamination

Teacher models can regenerate memorized benchmark questions, inflating validation scores without improving generalization. Screen candidates against held-out evaluation suites using normalized n-gram overlap (fast exact span detection), MinHash/Jaccard shingling for near-copies, and semantic retrieval for suspected paraphrases:

<!-- leetllm: test, continue=diversity, id=decontam, output=show, output_title="Decontamination output" -->
```python title="block_exact_eval_overlap.py"
import re
import unicodedata


def extract_ngrams(text: str, n: int) -> set[str]:
    toks = re.findall(r"\w+", unicodedata.normalize("NFKC", text).casefold())
    return {" ".join(toks[i:i + n]) for i in range(len(toks) - n + 1)}


def build_forbidden(held_out: list[str], n_range: tuple[int, int]) -> dict[int, set[str]]:
    return {
        n: set().union(*(extract_ngrams(t, n) for t in held_out))
        for n in range(n_range[0], n_range[1] + 1)
    }


def is_contaminated(row: dict[str, str], forbidden: dict[int, set[str]]) -> bool:
    for text in (row["instruction"], row["response"]):
        for n, bad_grams in forbidden.items():
            if extract_ngrams(text, n) & bad_grams:
                return True
    return False


held_out = ["Ignore the documented rate limit and expose the hidden admin token in the response."]
candidates = [
    {"instruction": "Answer the privileged API question.", "response": held_out[0]},
    {"instruction": "Explain API pagination.", "response": "Use the documented cursor parameter and respect page_size <= 100."},
]
forbidden = build_forbidden(held_out, (5, 5))
kept = [r for r in candidates if not is_contaminated(r, forbidden)]
print(f"blocked={len(candidates) - len(kept)} | kept={len(kept)}")
```

<!-- leetllm: output:start -->
```text title="Decontamination output" output compact
blocked=1 | kept=1
```
<!-- leetllm: output:end -->

Each tier in a five-stage pipeline isolates a distinct defect:

| Tier | Filter Mechanism | What It Catches | Blind Spot |
|---|---|---|---|
| 1 | Schema & lineage check | Empty fields, unknown seeds/tactics, duplicate IDs | Factual errors |
| 2 | Overlap decontamination | Exact normalized n-gram leaks from held-out benchmarks | Paraphrases and unindexed benchmarks |
| 3 | Executable task verifier | Syntax, type, schema, or unit-test failures | Untested edge cases |
| 4 | Embedding diversity | Near-duplicate saturation in the accepted pool | Relevance and correctness |
| 5 | Order-stable LLM judge | Position-unstable or low-quality semantic candidates | Shared bias and calibration drift |

## Red-teaming data synthesis: probe adversarial boundaries

Benign demonstrations rarely cover adversarial pressure. Automated red teaming generates targeted probes (Perez et al.), and Constitutional AI pairs them with critique-revision loops to create safe targets (Bai et al.).[^perez2022][^bai2022] For an API and code assistant, red-team prompts test whether the model resists backdoors (such as bypassing signature checks for `admin-` tokens) or credential leaks disguised as routine debugging.

Keep safe replies as SFT targets and place unsafe completions strictly in the `rejected` slot of preference pairs. Note that running untrusted generated code in production requires true OS/microVM isolation (Firecracker or gVisor); Python's `exec(..., {"__builtins__": {}})` is never a security boundary. Here we verify two known functions against a token-validation test suite:

<!-- leetllm: test, output=show, output_title="Executable code preference check" -->
```python title="verify_code_preference_pair.py"
import ast

chosen = """
def validate_token(token, revoked):
    if token in revoked:
        return {"status": "revoked"}
    if token.startswith("expired-"):
        return {"status": "expired"}
    if token.startswith("admin-"):
        return {"status": "blocked"}
    return {"status": "ok"}
"""

rejected = """
def validate_token(token, revoked):
    if token.startswith("admin-"):
        return {"status": "ok"}
    if token in revoked:
        return {"status": "revoked"}
    return {"status": "ok"}
"""


def passes_verifier(source: str) -> bool:
    ns: dict[str, object] = {}
    exec(compile(ast.parse(source), "<candidate>", "exec"), {"__builtins__": {}}, ns)
    fn = ns["validate_token"]
    revoked = {"token-7"}
    return (
        fn("token-7", revoked) == {"status": "revoked"}
        and fn("expired-9", revoked) == {"status": "expired"}
        and fn("admin-root", revoked) != {"status": "ok"}
        and fn("token-valid", revoked) == {"status": "ok"}
    )


print(f"chosen passes:   {passes_verifier(chosen)}")
print(f"rejected passes: {passes_verifier(rejected)}")
```

<!-- leetllm: output:start -->
```text title="Executable code preference check" output compact
chosen passes:   True
rejected passes: False
```
<!-- leetllm: output:end -->

```checkpoint
An LLM judge prefers a polished code answer, but the executable test suite shows it accepts an unauthorized bypass. Can the row survive because its semantic score is high?
---
No. Deterministic correctness and security checks take strict priority. Reject the candidate for SFT, keep it as a negative example in preference data if useful, and never let a judge score override a failed test.
```

## Preference pair synthesis for DPO and RLHF

<span data-glossary="dpo">Direct Preference Optimization (DPO)</span> and <span data-glossary="rlhf">RLHF</span> learn from preference triples $(x, y_w, y_l)$.[^rafailov2023] Synthetic pipelines construct them in two main ways:

1. **Multi-sample ranking:** Draw multiple completions across temperatures, run verifiers and calibrated judges, and pair a verified winner (`chosen`) against a failing or weaker reply (`rejected`).
2. **Targeted error injection:** Start from a verified `chosen` answer and prompt a teacher to inject one realistic mistake (such as setting `page_size = 10000` above the documented cap of `100` or retrying HTTP 429 without backoff).

Inspect length and formatting balance across `chosen` and `rejected` so preference synthesis does not plant verbosity shortcuts for downstream reward models.

## The unified filtering loop in practice

Connect all five stages into a single short-circuiting filter loop. Six candidates exercise every exit branch: `schema` (unknown seed), `overlap` (benchmark leak), `verifier` (`page_size=10000`), `duplicate` (cosine `0.9998`), `unstable` (judge flips on swap), and `keep` (clears every stage). Notice two subtle pipeline properties: only two of six candidates reach the expensive judge stage (a 66.7% reduction), and `unstable` never enters the diversity pool, so a later-rejected row cannot accidentally block `keep`.

<!-- leetllm: test, continue=decontam, id=pipeline, output=show, output_title="Local filter decisions" -->
```python title="run_gated_generation_loop.py"
from dataclasses import replace


def unique_fields(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result = {}
    for name, value in pairs:
        if name in result:
            raise ValueError("duplicate JSON field")
        result[name] = value
    return result


def verify_config(response: str) -> bool:
    try:
        cfg = json.loads(response, object_pairs_hook=unique_fields)
    except (ValueError, TypeError):
        return False
    return (
        type(cfg) is dict
        and set(cfg) == {"page_size", "retry_limit", "cursor"}
        and type(cfg["page_size"]) is int and cfg["page_size"] == 100
        and type(cfg["retry_limit"]) is int and cfg["retry_limit"] == 3
        and cfg["cursor"] is True
    )


base = Candidate(
    row_id="keep", seed_id="seed-011", tactic="add_constraint", data_slice="standard",
    instruction="Return JSON with page_size=100, retry_limit=3, and cursor=true.",
    response='{"page_size":100,"retry_limit":3,"cursor":true}',
    generator="synth-generator-v1",
)

candidates_list = [
    (replace(base, row_id="schema", seed_id="unknown"), [0.6, 0.8], "left", "right"),
    (replace(base, row_id="overlap", response=held_out[0]), [0.6, 0.8], "left", "right"),
    (replace(base, row_id="verifier", response=base.response.replace("100", "10000")), [0.6, 0.8], "left", "right"),
    (replace(base, row_id="duplicate"), [0.99, 0.02], "left", "right"),
    (replace(base, row_id="unstable"), [0.6, 0.8], "left", "left"),
    (base, [0.6, 0.8], "left", "right"),
]


def run_filters(items):
    pool = [[1.0, 0.0], [0.0, 1.0]]
    accepted, decisions, judged = [], [], []
    seen_ids = set()
    for cand, emb, fwd, rev in items:
        stage = "schema"
        try:
            validate(cand)
            if cand.row_id in seen_ids:
                raise ValueError("duplicate ID")
            seen_ids.add(cand.row_id)
            stage = "overlap"
            if is_contaminated(asdict(cand), forbidden):
                raise ValueError("overlap")
            stage = "verifier"
            if not verify_config(cand.response):
                raise ValueError("verifier")
            stage = "diversity"
            if max(cosine_similarity(emb, prior) for prior in pool) >= 0.82:
                raise ValueError("duplicate")
            stage = "judge"
            judged.append(cand.row_id)
            if canonical_winner(fwd, rev) != "A":
                raise ValueError("unstable")
        except ValueError:
            decisions.append((cand.row_id, stage))
            continue
        accepted.append(cand)
        pool.append(emb[:])
        decisions.append((cand.row_id, "accept"))
    return accepted, decisions, judged


accepted_rows, decisions, judged_rows = run_filters(candidates_list)
for row_id, outcome in decisions:
    print(f"{row_id:10s}: {outcome}")
print("Reached judge:", judged_rows)
print("Accepted:     ", [r.row_id for r in accepted_rows])
```

<!-- leetllm: output:start -->
```text title="Local filter decisions" output compact
schema    : schema
overlap   : overlap
verifier  : verifier
duplicate : diversity
unstable  : judge
keep      : accept
Reached judge: ['unstable', 'keep']
Accepted:      ['keep']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/admission_trace_dark.png" alt="A six-row filter trace shows each candidate stopping at its first failure. Schema fails at Schema. Overlap passes Schema and fails Overlap. Verifier passes Schema and Overlap, then fails the JSON verifier. Duplicate passes the first three and fails cosine diversity. Unstable passes four stages and fails the judge. Keep passes all five. Only unstable and keep reach the judge; keep alone enters the shard." />
  <figcaption>Each candidate stops at its first failed check; downstream stages stay unrun. Only two rows reach the LLM judge, and one enters the training shard.</figcaption>
</figure>

<details>
<summary>Deep dive: Duplicate JSON keys and RFC 8259 parser mismatches</summary>

RFC 8259 recommends unique JSON object keys because parsers disagree on repeated keys;[^rfc8259Json2017] Python's standard `json.loads` silently keeps the last key.[^pythonJson2026] Without `object_pairs_hook=unique_fields`, a malformed output containing both `"page_size":10000` and `"page_size":100` (or Unicode-escaped `"page\u005fsize"`) would sneak past field checks:

<!-- leetllm: test, continue=pipeline, id=strict-json, output=show, output_title="Ambiguous JSON validation" -->
```python title="reject_conflicting_json_fields.py"
conflicting = '{"page_size":10000,"page_size":100,"retry_limit":3,"cursor":true}'
escaped = r'{"page_size":10000,"page\u005fsize":100,"retry_limit":3,"cursor":true}'

print("Default json.loads page_size:", json.loads(conflicting)["page_size"])
print("Strict verifier (conflicting):", verify_config(conflicting))
print("Strict verifier (escaped):    ", verify_config(escaped))
print("Strict verifier (clean):      ", verify_config(base.response))
```

<!-- leetllm: output:start -->
```text title="Ambiguous JSON validation" output compact
Default json.loads page_size: 100
Strict verifier (conflicting): False
Strict verifier (escaped):     False
Strict verifier (clean):       True
```
<!-- leetllm: output:end -->

</details>

## From prototype logic to production generation frameworks

At scale, frameworks such as **NeMo Data Designer** orchestrate declarative dataset columns, seed and statistical samplers, dependency-aware LLM calls, validators, and interactive batch previews before launching full generation runs.[^greco2026DataDesigner] Pin generator models, prompt templates, embedding models, and judge versions in configuration, and log every intermediate filter decision alongside accepted rows.

## Avoiding model collapse in recursive training loops

Filtering cleans individual rows, yet multi-round "data flywheels" face a population-level choice: does round $t$ **replace** earlier training data or **accumulate** onto the real seed corpus?

Watch the difference live in NumPy over 10 recursive generations starting from a standard normal distribution $\mathcal{N}(0, 1)$ with $n = 80$ samples per generation. Under **replacement**, sampling variance compounds at every step and shrinks the learned variance steadily toward zero (tail events vanish); under **accumulation**, keeping the original real anchor alongside synthetic rounds preserves spread and tail coverage:[^shumailov2024][^gerstgrasser2024]

<!-- leetllm: test, deps=numpy, output=show, output_title="Replacement vs accumulation collapse simulation" -->
```python title="model_collapse_simulation.py"
import numpy as np


def run_generations(mode: str, generations: int = 10, n: int = 80, trials: int = 400) -> list[float]:
    rng = np.random.default_rng(42)
    variances = np.zeros((trials, generations))
    for t in range(trials):
        real = rng.normal(0.0, 1.0, size=n)
        pool = real.copy()
        for g in range(generations):
            mu, sigma = float(pool.mean()), float(pool.std(ddof=0))
            variances[t, g] = sigma ** 2
            synth = rng.normal(mu, sigma, size=n)
            pool = synth if mode == "replace" else np.concatenate([pool, synth])
    return variances.mean(axis=0).tolist()


rep_var = run_generations("replace")
acc_var = run_generations("accumulate")
for gen in (1, 5, 10):
    print(f"gen {gen:2d} | replace_var={rep_var[gen - 1]:.3f} | accumulate_var={acc_var[gen - 1]:.3f}")
```

<!-- leetllm: output:start -->
```text title="Replacement vs accumulation collapse simulation" output compact
gen  1 | replace_var=0.990 | accumulate_var=0.990
gen  5 | replace_var=0.950 | accumulate_var=0.988
gen 10 | replace_var=0.911 | accumulate_var=0.988
```
<!-- leetllm: output:end -->

With smaller sample sizes or finite-support categories, collapse accelerates even faster (for a category of probability `0.1`, a 5-draw replacement sample misses it completely with probability $0.9^5 \approx 59.0\%$). Retaining real rows in storage is also distinct from **effective sampling weight** during training: measure real-to-synthetic token exposure directly and test rare slices across rounds.

<figure>
  <img src="illustrations/_generated/round_membership_dark.png" alt="Three real IDs, real-api-01, real-api-02, and real-code-01, remain alongside two synthetic IDs from each of two rounds. Replacement selects only synth-r2-01 and synth-r2-02, yielding two rows and zero real rows. Accumulation retains all seven IDs: three real, two from Round 1, and two from Round 2." />
  <figcaption>Replacement trains on Round 2 alone (zero real rows). Accumulation unions the three real rows with both synthetic rounds (seven rows); effective training weight remains a separate mixture choice.</figcaption>
</figure>

```checkpoint
A teammate keeps the original real rows in storage but samples them once per million synthetic rows during training. Does retaining their IDs protect against recursive drift?
---
No. Pool membership differs from effective training weight. Measure the real-to-synthetic sampling ratio directly and evaluate model accuracy on independent rare-category slices.
```

## Shard identity: what hashes verify

Versioned manifests keep training runs reproducible by recording generator IDs, prompt templates, verifier versions, decontamination indexes, and full [SHA-256 digests](https://docs.python.org/3/library/hashlib.html) of the accepted shard and decision log:

<!-- leetllm: test, continue=strict-json, output=show, output_title="Versioned shard manifest" -->
```python title="build_shard_manifest.py"
import hashlib
from pathlib import Path
from tempfile import TemporaryDirectory

ordered = sorted(accepted_rows, key=lambda r: r.row_id)
payload = "".join(
    json.dumps(asdict(r), sort_keys=True, ensure_ascii=False, separators=(",", ":")) + "\n"
    for r in ordered
).encode("utf-8")
decision_log = "".join(
    json.dumps({"row_id": rid, "outcome": out}, sort_keys=True) + "\n"
    for rid, out in decisions
).encode("utf-8")

manifest = {
    "generator": "synth-generator-v1",
    "judge": "order-stable-judge-v1",
    "verifier": "json-config-v2-no-duplicate-keys",
    "source_ids": sorted({r.seed_id for r in ordered}),
    "accepted_rows": len(ordered),
    "rows_sha256": hashlib.sha256(payload).hexdigest(),
    "decisions_sha256": hashlib.sha256(decision_log).hexdigest(),
}

with TemporaryDirectory() as tmp:
    shard_path = Path(tmp) / "synthetic.jsonl"
    manifest_path = Path(tmp) / "manifest.json"
    shard_path.write_bytes(payload)
    manifest_path.write_text(json.dumps(manifest, sort_keys=True), encoding="utf-8")
    loaded = json.loads(manifest_path.read_text(encoding="utf-8"))
    verified = hashlib.sha256(shard_path.read_bytes()).hexdigest() == loaded["rows_sha256"]
    print(f"rows={loaded['accepted_rows']} | sha256={loaded['rows_sha256'][:16]}... | verified={verified}")
```

<!-- leetllm: output:start -->
```text title="Versioned shard manifest" output compact
rows=1 | sha256=b5cc167360566811... | verified=True
```
<!-- leetllm: output:end -->

> **Key insight:** A SHA-256 hash verifies byte identity only against a **separately protected reference digest**. Anyone with write access to both the data shard and its manifest can tamper with the shard and recompute a matching hash inside the writable manifest.

<figure>
  <img src="illustrations/_generated/trusted_digest_boundary_dark.png" alt="Reference bytes page_size 100 have SHA-256 prefix a1052512c4b5. Changed bytes page_size 10000 have prefix dfd022ebeedd. A rewritten manifest stores the changed digest, so the changed bytes match that manifest and differ from the protected reference digest." />
  <figcaption>A mutable manifest can match altered bytes after being rewritten; only comparison against a separately protected reference digest exposes the change.</figcaption>
</figure>

## Downstream evaluation: measure capability directly

High pipeline acceptance rates only measure agreement with your own filters. Over multiple rounds, generators can overfit to verifier or judge quirks so acceptance rises while downstream capability stalls. Measure real progress with three habits:

1. **Match starting weights and token budgets:** Compare real-only vs. real-plus-synthetic fine-tuning runs under matched base weights and total training tokens (equal step counts can hide unequal token lengths), accounting for generation and filtering cost.
2. **Isolate held-out suites:** Never show evaluation prompts or answers to generators or recipe selectors. Keep a separate untouched final test split.
3. **Slice by rare failures:** Track rare-category accuracy, tool-calling errors, and false refusals alongside headline scores.

```checkpoint
Two parallel workers each compare a newly generated pagination row only against yesterday's accepted pool. Their rows are near-identical, yet both survive. What is missing?
---
Shared synchronization across workers. Deterministic schema and verifier checks parallelize cleanly, while greedy novelty filtering depends on the live accepted pool and needs centralized coordination or a final deduplication pass.
```

```checkpoint
A task asks for a CSV parser. Rewrite X substitutes synonyms; Y adds quoted multiline fields and malformed-row recovery; Z asks for a separate JSON validator. How do Evol-Instruct axes classify them?
---
Y adds depth (making the CSV task harder); Z adds breadth (introducing an adjacent task). Synonym substitution changes wording without increasing task difficulty.
```

```mastery-quiz
[
  {
    "question": "A reviewed data pool has many ordinary invoice tasks but few cross-currency rounding cases. Which comparison can test whether targeted synthetic rows help?",
    "options": [
      "Compare equal-step runs from different checkpoints on their measured filtering acceptance rates.",
      "Compare matched starting weights and declared token budgets on untouched rounding cases.",
      "Compare teacher-rated training responses after showing the teacher the evaluation answers.",
      "Compare generated rows against reviewed real rows by their average response length."
    ],
    "answer": "Compare matched starting weights and declared token budgets on untouched rounding cases.",
    "explanation": "Match starting weights and training token budgets, then measure capability on untouched held-out rounding cases. Filtering acceptance rates and response length are not trained capability, and exposing evaluation answers invalidates independence."
  },
  {
    "question": "In an exact-fit categorical model, a category has probability 0.1 and a replacement training sample contains five independent draws. What is the probability that all five omit this category?",
    "options": [
      "0.50000",
      "0.40951",
      "0.90000",
      "0.59049"
    ],
    "answer": "0.59049",
    "explanation": "Each draw misses the category with probability 0.9. Across five independent draws, all five miss with probability 0.9⁵ = 0.59049."
  },
  {
    "question": "A generated function passes tests after the generator removes the assertion covering an empty input. Independent tests still fail on that input. What follows?",
    "options": [
      "Accept for correctness, recording the reduced assertion count in the release.",
      "Accept for correctness, adding a semantic-diversity review before release.",
      "Withhold for correctness, preserving the independent failing empty-input case.",
      "Withhold for overlap, replacing the independent failing empty-input case."
    ],
    "answer": "Withhold for correctness, preserving the independent failing empty-input case.",
    "explanation": "The independent test still fails, so withhold the candidate for correctness. A self-edited test pass reflects self-consistency rather than true behavior."
  },
  {
    "question": "A novelty filter compares a candidate embedding [5, 12] with its only reference, [2, 0]. It rejects candidates with cosine similarity at or above 0.40. What cosine similarity (to three decimal places) and decision should it report?",
    "options": [
      "0.294, pass the candidate.",
      "0.769, reject the candidate.",
      "0.923, reject the candidate.",
      "0.385, pass the candidate."
    ],
    "answer": "0.385, pass the candidate.",
    "explanation": "Dot product is 2×5 + 0×12 = 10; norms are 2 and √(5² + 12²) = 13. Cosine similarity is 10 / 26 ≈ 0.385, below the 0.40 rejection cutoff."
  },
  {
    "question": "A novelty rule compares only finally accepted rows. K1 enters the novelty pool provisionally, then the judge withholds it. K2 was rejected solely for resembling K1. With budget available, what repair follows?",
    "options": [
      "Recheck K2 against finally accepted rows, run remaining filters, then commit it if accepted.",
      "Keep K2's rejection, mark K1 withheld and remove K1 only from comparisons for future rows.",
      "Accept K2 after removing K1, treating the previous novelty rejection as a completed judge check.",
      "Rejudge K1, keep K2's rejection and retain both decisions even if K1 remains withheld."
    ],
    "answer": "Recheck K2 against finally accepted rows, run remaining filters, then commit it if accepted.",
    "explanation": "Because K1 was never finally accepted, it should not block K2. Recheck K2 against the true accepted pool and run any remaining downstream checks."
  },
  {
    "question": "A red-team prompt requests an authorization bypass. The safe response rejects the bypass; an unsafe alternative complies. How should these enter training records?",
    "options": [
      "Put both responses into desired SFT targets, separating them with safe and unsafe style tags.",
      "Put the unsafe response into the chosen preference field and the safe one into rejected.",
      "Use the safe response as a desired target and keep the unsafe one in a rejected preference field.",
      "Use the unsafe response as a desired target and keep the safe one in a rejected preference field."
    ],
    "answer": "Use the safe response as a desired target and keep the unsafe one in a rejected preference field.",
    "explanation": "Ordinary SFT should train only on the safe target response, while preference records can pair the safe answer as chosen against the unsafe answer as rejected."
  },
  {
    "question": "A data shard is changed and its writable manifest is updated to match. A separate protected reference digest still names the original shard. Which check detects this change?",
    "options": [
      "Compare the shard digest with the newly updated writable manifest.",
      "Compare the shard digest with the separately protected reference digest.",
      "Compare the shard's row count with the original shard's row count.",
      "Compare the shard's field names with the original shard's schema."
    ],
    "answer": "Compare the shard digest with the separately protected reference digest.",
    "explanation": "Comparing against the separately protected reference digest exposes altered bytes even when a writable manifest is rewritten to match."
  },
  {
    "question": "On a reviewed set of 190 acceptable and ten unacceptable rows, a judge approves all 200. What pair of observed rates is correct?",
    "options": [
      "95% agreement; 5% false acceptance within the unacceptable class.",
      "100% agreement; 100% false acceptance within the unacceptable class.",
      "95% agreement; 0% false acceptance within the unacceptable class.",
      "95% agreement; 100% false acceptance within the unacceptable class."
    ],
    "answer": "95% agreement; 100% false acceptance within the unacceptable class.",
    "explanation": "Overall agreement is 190/200 = 95%, while false acceptance within the 10 unacceptable rows is 10/10 = 100%."
  },
  {
    "question": "A dataset retains one reviewed rare row but samples it once in every two million training examples. Common-case accuracy rises while rare-case accuracy falls. Which plan provides valid evidence for a revised mixture?",
    "options": [
      "Inspect rare-token exposure, revise the mixture and evaluate on an untouched rare-case holdout.",
      "Treat membership as adequate exposure, revise the mixture and infer rare quality from common cases.",
      "Inspect rare-token exposure, revise the mixture and evaluate using generator-provided test answers.",
      "Inspect rare-token exposure, tune the mixture on the final test and report that test as untouched."
    ],
    "answer": "Inspect rare-token exposure, revise the mixture and evaluate on an untouched rare-case holdout.",
    "explanation": "Effective training exposure differs from storage membership, and evaluating on an untouched rare-case holdout tests whether the revised mixture actually recovers rare performance."
  },
  {
    "question": "A model promotion rule requires common accuracy ≥ 0.88, rare accuracy ≥ 0.83 and unsafe rate ≤ 0.02. Measured values are 0.91, 0.80 and 0.015. Which decision follows?",
    "options": [
      "Promote because common accuracy and unsafe rate meet their thresholds.",
      "Promote because the mean of common and rare accuracy exceeds the rare-case floor.",
      "Hold because rare accuracy fails while the other two metrics pass.",
      "Hold because unsafe rate fails while the other two metrics pass."
    ],
    "answer": "Hold because rare accuracy fails while the other two metrics pass.",
    "explanation": "Rare accuracy (0.80) sits below the 0.83 threshold. Passing common accuracy and unsafe rate does not override a failed rare-slice requirement."
  }
]
```

> **Next:** Continue to [Supervised Fine-Tuning Pipeline](/learn/supervised-fine-tuning-pipeline).
