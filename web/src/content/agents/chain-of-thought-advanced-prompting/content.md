---
{
  "id": "chain-of-thought-advanced-prompting",
  "title": "CoT, ToT & Self-Consistency Prompting",
  "slug": "chain-of-thought-advanced-prompting",
  "category": "Prompt Engineering",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/cot_scratchpad_flow_dark.png",
  "companies": [
    "Google",
    "OpenAI",
    "Anthropic",
    "Meta",
    "Microsoft"
  ],
  "shortDescription": "When a merge rationale skips a required check, decide whether one trace, a vote, or a bounded search is worth the extra compute.",
  "keyConceptsTested": [
    "Chain-of-Thought prompting",
    "Zero-shot vs few-shot CoT",
    "Autoregressive scratchpads and compute limits",
    "Least-to-Most sequential decomposition",
    "Prompt-elicited CoT vs native reasoning",
    "Self-Consistency and answer canonicalization",
    "Majority voting and abstention",
    "Tree-of-Thoughts and Graph-of-Thoughts search",
    "Evaluator-guided pruning and backtracking",
    "RLVR and native reasoning models",
    "Reasoning failure modes and eval gates",
    "ReAct handoff to tool use"
  ],
  "section": "Applied LLM Engineering",
  "order": 2
}
---

Picture an arithmetic word problem with three inputs: 3 batches of 8 prompts, 10 shared warmup prompts subtracted, and 3 seeds per kept prompt. The deterministic answer is `42`, yet a one-shot completion emits a plausible derivation that quietly drops the `10` warmup prompts and returns `72`. What intermediate check reveals that slip before grading?

<!-- leetllm: audience:website:start -->The previous chapter compressed benchmark references into a retrieval index so a prompt receives relevant specification notes. Retrieval alone does not solve multi-step reasoning: a model can still skip a subtraction step, drop an operational constraint, or lock prematurely onto a wrong intermediate value. A longer explanation is not the same as a verified calculation, raising the core design question of how much <span data-glossary="test-time-compute">test-time compute</span> improves real accuracy under <span data-glossary="token">token</span> and latency budgets.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->A compressed retrieval index can place relevant problem notes or specifications into context, yet retrieval alone does not solve multi-step reasoning. A model can still skip a subtraction step, drop an operational constraint, or commit prematurely to a flawed intermediate value, proving that a longer explanation is not the same as a verified calculation. The central design question is how much extra <span data-glossary="test-time-compute">test-time compute</span> genuinely buys under fixed <span data-glossary="token">token</span> and latency budgets.<!-- leetllm: audience:book:end -->

## Start with a failure you can audit

Put the arithmetic dimension values in one record: `batches = 3`, `prompts_per_batch = 8`, `warmup_prompts = 10`, and `seeds = 3`. Calculating `(3 * 8 - 10) * 3` cleanly yields `42`, whereas a single autoregressive pass can overlook the subtraction step or misread multiplication precedence. Even when the prompt lays out every number plainly, greedy decoding emits tokens left to right without pausing to execute the algebra unless encouraged to spell out intermediate state.

A useful outward artifact is a short **verification record** containing those given inputs, the intermediate arithmetic checks, and the final integer answer. Compared against an open-ended rationale, a compact record is easy to check against a deterministic reference solver, turning free-form prose into an explicit output schema that downstream grading logic can validate reliably.

<!-- leetllm: test, output=show -->

```python title="verification-record.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class WordProblemCase:
    batches: int
    prompts_per_batch: int
    warmup_prompts: int
    seeds: int


def solve_reference(case: WordProblemCase) -> dict[str, object]:
    total_prompts = case.batches * case.prompts_per_batch
    kept_prompts = total_prompts - case.warmup_prompts
    checks = {
        "positive_batches": case.batches > 0 and case.prompts_per_batch > 0,
        "positive_kept": kept_prompts > 0,
        "positive_seeds": case.seeds > 0,
    }
    if not all(checks.values()):
        raise ValueError("problem dimensions must yield positive counts")
    final_answer = kept_prompts * case.seeds
    return {"kept_prompts": kept_prompts, "checks": checks, "final_answer": final_answer}


record = solve_reference(
    WordProblemCase(batches=3, prompts_per_batch=8, warmup_prompts=10, seeds=3)
)
for name, passed in record["checks"].items():
    print(f"{name}: {passed}")
print(f"kept_prompts: {record['kept_prompts']}")
print(f"final_answer: {record['final_answer']}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
positive_batches: True
positive_kept: True
positive_seeds: True
kept_prompts: 14
final_answer: 42
```
<!-- leetllm: output:end -->

Keep this small solver as the reference answer so every prompting variant gets scored against the same ground truth. Defining the structured output schema and reference scorer before spending money on repeated model calls keeps prompt iteration grounded in measurable accuracy. Deterministic state belongs in code rather than repeated sampling, because sampling five rationales over fixed arithmetic inputs adds latency without adding evidence, even when a model parses unstructured word-problem text first. If a required quantity is missing from the prompt altogether, emitting more reasoning tokens cannot invent it, because missing operands must come from tool calls or source data rather than token-space speculation.

```checkpoint
Why define a deterministic reference solver and verification record before testing reasoning prompts?
---
Without an unambiguous reference answer and intermediate checks, a longer rationale can look convincing while failing silently. The reference solver lets you compare every prompting strategy on the exact same yardstick.
```

## Chain-of-thought: give an intermediate result somewhere to go

A conventional decoder-only transformer applies a fixed stack of layers each time it predicts a token, though a short final response can still span several generated tokens or hide extensive internal reasoning tokens before emitting a concise public answer. Emitting intermediate steps adds sequential computation and updates the context consumed by later forward passes, just like writing down an algebraic subtotal before multiplying by a rate factor. With a <span data-glossary="kv-cache">KV cache</span>, the decoder reuses key and value tensors from earlier tokens instead of recomputing the entire prefix, while each newly generated token still traverses every transformer layer and attends across retained context. Because attention work scales with prefix length, response latency has no fixed `K × constant` rule per step, turning the generated text and cached activations into an active **computational scratchpad**. That scratchpad records a candidate subtotal rather than a verified truth, because wrong intermediate values propagate forward unless checked by a later self-correction step or external verifier.

Formal expressivity analysis supports the role of intermediate tokens under well-defined assumptions. Merrill and Sabharwal prove that bounded-depth transformers gain polynomial-time expressivity when allowed polynomially many intermediate chain-of-thought steps, subject to finite-precision, normalization, and unproved complexity separations.[^merrill2024cotExpressivity] Those theorems characterize expressive capacity rather than optimization guarantees, meaning empirical benchmark checks remain necessary to see whether a trained checkpoint learns the intended algorithm on realistic inputs.

Wei et al. demonstrated few-shot <span data-glossary="chain-of-thought">chain of thought (CoT)</span> by placing worked intermediate steps inside prompt exemplars, raising PaLM 540B accuracy on GSM8K from 17.9% under direct prompting to 56.9% with eight exemplars.[^wei2022a] Kojima et al. soon showed that even a zero-shot cue such as "Let's think step by step" can trigger multi-step derivations without worked examples.[^kojima2022] Treat those landmark results as motivation for empirical testing on your own model endpoint rather than universal defaults: in a June 2025 GPQA Diamond evaluation across eight models and 25 trials per condition, Meincke et al. found only modest accuracy improvements for non-reasoning models and marginal gains for native reasoning models alongside substantial latency penalties.[^meincke2025cot] Complementing that caveat, Zheng et al. documented a "curse of CoT" across nine pattern-based in-context-learning benchmarks and 16 models where explicit step-by-step prompting scored worse than direct answering, underscoring why direct and CoT baselines belong side by side on held-out cases.[^ye2025curseofcot]

When a problem breaks naturally into ordered sub-questions, **least-to-most prompting** first prompts for the decomposition and then solves sub-problems sequentially by feeding earlier answers into later turns.[^zhou2022b] In a multi-step symbolic derivation, an initial prompt isolates the system of equations and subsequent steps substitute solved variables one at a time. Unlike tree search, linear decomposition avoids tracking parallel branches, though it introduces extra sequential round-trips and forwards any early arithmetic mistake into every downstream step.

### Keep four reasoning artifacts separate

The word *reasoning* now spans four distinct system artifacts with very different inspection and reliability guarantees. Treating them interchangeably produces fragile parsing and misleading benchmark reports, so distinguish each artifact explicitly before deciding what a given trace proves:

| Artifact | What it contains | What you can safely conclude |
| :--- | :--- | :--- |
| Prompt-elicited CoT | Intermediate text generated because a prompt asks for steps | It may aid derivation, yet its prose can still be unfaithful |
| Native reasoning tokens | Internal inference tokens consumed by a reasoning model | Counts measure compute usage, not correctness or visibility |
| Reasoning summary | Provider-generated description of internal reasoning | Useful for operator orientation, yet neither raw CoT nor proof of soundness |
| Verification record | Problem inputs, intermediate checks, and final answer emitted for your evaluator | Every field can be schema-checked and scored against a deterministic solver |

Provider API disclosure policies also differ across model families and generations. Checked October 10, 2026: OpenAI's documentation notes that raw reasoning tokens remain hidden even when supported models emit an opt-in reasoning summary, while internal tokens still occupy context window slots, count as billed output, and can exhaust `max_output_tokens` before returning a visible answer.[^openai2026reasoning] Similarly, Anthropic separates adaptive thinking from deprecated manual `budget_tokens`: current documentation deprecates manual mode on Opus and Sonnet 4.6 and rejects it on Opus 4.7 and 4.8, routing control through `thinking.type` and effort parameters while returning summarized thinking rather than raw CoT under `display: "summarized"`.[^anthropic2026thinkingSupport][^anthropic2026thinking] Always check the exact endpoint table for your target checkpoint rather than coding around assumed visibility or cross-version parameter compatibility.

Separating these artifacts also determines whether to orchestrate an external sampling loop or rely on a native reasoning model. An external CoT, voting, or search loop preserves inspectable candidate branches and explicit transition records, while remembering that prose rationales do not faithfully mirror internal activations. Native reasoning models internalize reflection and budget control behind provider APIs, making uniform task-level evaluation over final outputs, latency, tokens, and parse failures essential for fair comparisons. Regardless of architecture, request structured, checkable task fields at the application interface rather than prose claiming to expose internal weights:

```text title="single-trace-prompt.txt"
Use only the numeric inputs in the problem statement and standard arithmetic.
Return:
1. kept_prompts: integer result after removing warmup prompts
2. final_answer: integer count of graded runs
3. explanation: one short sentence summarizing the calculation

Problem:
- 3 evaluation batches of 8 prompts each
- 10 warmup prompts removed from the batch total
- 3 random seeds scored per remaining prompt
```

Those explicit intermediate fields make an algebraic slip directly observable without pretending we can read raw private cognition. Turpin et al. showed that CoT explanations can rationalize conclusions steered by hidden biasing cues without ever mentioning those cues.[^turpin2023] Logging the prompt inputs, extracted intermediate values, deterministic checks, and final output gives an objective record rather than trusting eloquent reasoning prose or a provider summary.

<!-- leetllm: test, output=show -->

```python title="score-reasoning-records.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class Candidate:
    name: str
    checks: dict[str, bool]
    kept_prompts: int
    final_answer: int


expected_checks = {
    "positive_kept": True,
    "exact_multiplication": True,
    "valid_format": True,
}
expected_kept = 14
expected_answer = 42
candidates = [
    Candidate("missing_check", {"positive_kept": True}, 14, 42),
    Candidate("wrong_intermediate", {**expected_checks, "exact_multiplication": False}, 16, 42),
    Candidate("complete_record", expected_checks, 14, 42),
]

for candidate in candidates:
    coverage = len(candidate.checks.keys() & expected_checks.keys()) / len(expected_checks)
    checks_ok = (
        candidate.checks.keys() == expected_checks.keys()
        and all(value is expected_checks[name] for name, value in candidate.checks.items())
    )
    steps_ok = candidate.kept_prompts == expected_kept and candidate.final_answer == expected_answer
    print(f"{candidate.name}: coverage={coverage:.0%}, checks_ok={checks_ok}, steps_ok={steps_ok}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
missing_check: coverage=33%, checks_ok=False, steps_ok=True
wrong_intermediate: coverage=100%, checks_ok=False, steps_ok=False
complete_record: coverage=100%, checks_ok=True, steps_ok=True
```
<!-- leetllm: output:end -->

Notice how `wrong_intermediate` includes every required JSON key and even lands on the right final integer `42`, while getting `kept_prompts = 16` wrong along the way. Field coverage checks alone would miss that silent arithmetic defect completely. Scoring intermediate invariants alongside the final number therefore separates verified derivations from lucky guesses or rationalized shortcuts.

### Zero-shot or few-shot?

Zero-shot CoT asks for intermediate steps without providing a solved exemplar, whereas few-shot CoT demonstrates worked examples and their target output layout. Exemplars steer step granularity and formatting stability, though neither guarantees sound arithmetic across multi-step deductions. Schema-constrained decoding can lock in the output structure, yet populated field values still demand independent verification against the task rules.

For a controlled ablation, hold the instruction, input values, and extracted fields fixed while varying only whether solved examples appear in the prompt. Notice that the prompt below asks for concise arithmetic steps and a tagged integer rather than claiming to expose hidden internal weights or private traces. Keeping that separation clean ensures your ablation measures the real lift from prompt exemplars rather than leaking formatting bias into the score.

<!-- leetllm: test, output=show -->

```python title="build-few-shot-math-prompt.py"
example = """Example:
Problem: 2 batches of 9 prompts, subtract 6 warmup prompts, 2 seeds per kept prompt.
Steps: total = 2 * 9 = 18; kept = 18 - 6 = 12; graded = 12 * 2 = 24.
#### 24"""

instruction = "Show concise intermediate arithmetic steps, then end with '#### <integer>'."
case = "Problem: 3 batches of 8 prompts, subtract 10 warmup prompts, 3 seeds per kept prompt."
zero_shot = f"{instruction}\n{case}"
few_shot = f"{instruction}\n{example}\n\nNow solve:\n{case}"

print(few_shot)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Show concise intermediate arithmetic steps, then end with '#### <integer>'.
Example:
Problem: 2 batches of 9 prompts, subtract 6 warmup prompts, 2 seeds per kept prompt.
Steps: total = 2 * 9 = 18; kept = 18 - 6 = 12; graded = 12 * 2 = 24.
#### 24

Now solve:
Problem: 3 batches of 8 prompts, subtract 10 warmup prompts, 3 seeds per kept prompt.
```
<!-- leetllm: output:end -->

```checkpoint
When is few-shot CoT worth more prompt tokens than zero-shot CoT?
---
When examples stabilize formatting or step decomposition that the evaluator expects, and measured held-out accuracy justifies the extra input tokens and latency.
```

Stable formatting solves answer extraction rather than sampling <span data-glossary="variance">variance</span>, so a cleanly structured trace can still commit an arithmetic error partway through. Generating multiple stochastic derivations lets you observe whether independent paths agree on the same final quantity or diverge across competing numbers.

## Self-consistency: sample answers, then vote

One greedy candidate can commit to an incorrect intermediate result and carry it forward. It can also correct itself. A slip doesn't permanently lock every later token into failure. <span data-glossary="self-consistency">Self-consistency</span> samples several solution paths and chooses the most frequent extracted answer.[^wang2022c]

The bet is that different correct paths will converge on the same answer while mistakes vary. If every sample shares one misconception, voting can amplify it instead. Formally, an answer distribution can marginalize over reasoning trajectories $r$:

$$
P(y \mid x) = \sum_{r} P(y, r \mid x) = \sum_{r} P(y \mid r, x) P(r \mid x)
$$

Enumerating the full sum is impractical. Self-consistency instead samples trajectories and selects the most frequent extracted answer: a **plurality**, which does not have to exceed half the samples. Temperature and truncation change the sampled distribution, so these counts don't exactly integrate the unmodified model distribution. Independently drawn samples can still repeat the same systematic mistake. The vote operates on answers, not on whose rationale sounds best.

Suppose five sampled traces yield three derivations ending in `42`, one slip ending in `36`, and one malformed response missing its `####` answer marker. Canonicalizing numeric formats gives `42` three votes, and keeping all five samples in the denominator gives a leading share of `3 / 5 = 0.60`. A `0.60` gate accepts `42`, whereas an `0.80` high-confidence threshold abstains, avoiding the mistake of dropping the unparsed trace to falsely report `3 / 4 = 0.75`. Both the full-batch denominator and the abstention threshold reflect conservative evaluation engineering rather than a requirement of the original self-consistency algorithm.

Let $y_i$ be the generated completion from sample $i$, and let $c(y_i)$ extract and normalize its final numeric answer or return `None` when formatting is invalid. Across $N > 0$ sampled traces, the plurality answer $\hat{a}$ and its conservative vote share $s$ are:

$$
\hat{a} = \arg\max_a \sum_{i=1}^{N} \mathbf{1}[c(y_i)=a], \qquad s = \frac{1}{N}\sum_{i=1}^{N}\mathbf{1}[c(y_i)=\hat{a}]
$$

Even when some samples fail parsing, the denominator stays $N$ so malformed outputs dilute confidence instead of hiding behind filtered denominators. Emit $\hat{a}$ only when $\hat{a}$ has strictly more votes than any runner-up and $s \ge \tau$; otherwise abstain (as well as whenever $N = 0$).

To generate varied reasoning paths, decode with nonzero <span data-glossary="temperature">temperature</span> where supported, bearing in mind that some reasoning endpoints fix or restrict sampling knobs. The [Decoding Algorithms](/learn/decoding-algorithms) lesson details how temperature and nucleus sampling affect token entropy. Always log sampling settings alongside sample count $N$, because identical greedy duplicates contribute zero independent diversity.

In Wang et al.'s PaLM-540B experiments, sampling 40 trajectories per problem raised GSM8K accuracy from 56.5% with greedy CoT to 74.4% with self-consistency, a 17.9 percentage-point gain.[^wang2022c] That baseline differs slightly from Wei et al.'s 56.9% figure because prompt exemplars and decoding setup changed between the two runs. Wang et al. also noted that majority vote share correlates with accuracy on math benchmarks, though raw agreement remains an uncalibrated statistic whose threshold $\tau$ should be tuned on held-out validation splits rather than guessed once.

<figure>
  <img src="illustrations/_generated/cot_scratchpad_flow_dark.png" alt="Self-consistency majority voting over 5 sampled reasoning traces. Traces T1 through T3 reach 42, T4 errs to 36, and T5 fails answer extraction. Dividing over all 5 traces gives 60% agreement for 42, below an 80% abstention threshold, whereas omitting T5 would inflate agreement to 75%." />
  <figcaption>Three traces converge on 42 while an arithmetic slip (36) and an unparsed response (T5) stay inside the denominator of N = 5 attempts. Dividing by 5 exposes 60% support and triggers abstention below an 80% threshold, preventing filtered-denominator inflation to 75%.</figcaption>
</figure>

### Normalize before counting

Real completions vary subtly around equivalent final answers: trailing `.0`, stray whitespace, thousands commas, or extra words after `####`. Without canonicalization, `'42'` and `'42.0'` split the vote across two separate keys and depress apparent support. Writing an explicit extractor that parses only the structured marker (`#### <number>`) instead of scanning the full scratchpad avoids false matches on intermediate subtotals while returning `None` whenever no marker is present.

<!-- leetllm: test, id=cot-canonical, output=show -->

```python title="canonicalize-and-vote.py"
from collections import Counter
import re

ANSWER_RE = re.compile(r"####\s*(-?[\d,]+(?:\.0+)?)\s*$")


def canonicalize(text: str) -> str | None:
    match = ANSWER_RE.search(text.strip())
    if not match:
        return None
    cleaned = match.group(1).replace(",", "")
    if cleaned.endswith(".0"):
        cleaned = cleaned[:-2]
    return cleaned


samples = [
    "7 * 6 = 42\n#### 42",
    "21 * 2 = 42\n#### 42.0",
    "30 + 12 = 42\n#### 42",
    "30 + 6 = 36\n#### 36",
    "Step 1: 7 * 6... (truncated before answer)",
]
votes = Counter(ans for text in samples if (ans := canonicalize(text)) is not None)
winner = votes.most_common(1)[0][0] if votes else None

print(f"parsed_samples: {sum(votes.values())}/{len(samples)}")
print(f"votes: {dict(votes)}")
print(f"winner: {winner}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
parsed_samples: 4/5
votes: {'42': 3, '36': 1}
winner: 42
```
<!-- leetllm: output:end -->

### A leading answer can still lack support

A `2`-to-`2` tie, zero parsed answers, or a plurality resting on mostly malformed completions should return `abstain` rather than silently emitting a noisy guess. Counting unparsed traces in the denominator enforces that safeguard cleanly across noisy batches. Separating insufficient consensus (`abstain`) from any extracted candidate integer ensures downstream evaluators never mistake an abstention signal for a wrong arithmetic value.

<!-- leetllm: test, continue=cot-canonical, id=cot-vote, output=show -->

```python title="abstain-on-weak-votes.py"
from collections import Counter


def decide(samples: list[str], minimum_share: float = 0.6) -> str:
    if not 0.5 < minimum_share <= 1:
        raise ValueError("minimum_share must be in (0.5, 1]")
    counts = Counter(ans for text in samples if (ans := canonicalize(text)) is not None)
    if not counts:
        return "abstain"
    ranked = counts.most_common(2)
    winner, count = ranked[0]
    share = count / len(samples)
    tied = len(ranked) > 1 and ranked[0][1] == ranked[1][1]
    if tied or share < minimum_share:
        return "abstain"
    return winner


strong = [
    "7 * 6 = 42\n#### 42",
    "21 * 2 = 42\n#### 42.0",
    "30 + 12 = 42\n#### 42",
    "30 + 6 = 36\n#### 36",
    "truncated trace",
]
split = ["#### 42", "#### 42", "#### 36", "#### 36"]
mostly_rejected = ["#### 42", "#### 42", "no tag", "bad", "truncated"]

print(f"strong_vote: {decide(strong)}")
print(f"higher_threshold: {decide(strong, minimum_share=0.8)}")
print(f"split_vote: {decide(split)}")
print(f"mostly_rejected_vote: {decide(mostly_rejected)}")
print(f"empty_batch: {decide([])}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
strong_vote: 42
higher_threshold: abstain
split_vote: abstain
mostly_rejected_vote: abstain
empty_batch: abstain
```
<!-- leetllm: output:end -->

### Measure gains against call cost

Before running live API sweeps, unit-test the aggregation logic against representative sample distributions that capture majority recovery, correlated algebraic slips, and heavy truncation. Including both correlated errors (where all five samples produce the wrong integer) and weak consensus (where the first trace happened to be right while parse errors triggered abstention) makes accuracy vs. sample-cost tradeoffs explicit before evaluating real checkpoints.

<!-- leetllm: test, continue=cot-vote, output=show -->

```python title="measure-voting-gain.py"
eval_cases = {
    "noisy_clean_majority": {
        "expected": "42",
        "samples": ["#### 36", "#### 42", "#### 42.0", "#### 42", "bad"],
    },
    "arithmetic_slip_recovery": {
        "expected": "42",
        "samples": ["#### 42", "#### 42", "bad", "#### 42", "#### 36"],
    },
    "first_wrong_majority_right": {
        "expected": "42",
        "samples": ["#### 36", "#### 42", "#### 42", "#### 42", "#### 36"],
    },
    "shared_arithmetic_trap": {
        "expected": "42",
        "samples": ["#### 36"] * 5,
    },
    "weak_support": {
        "expected": "42",
        "samples": ["#### 42", "bad", "bad", "#### 36", "no tag"],
    },
}


single_correct = 0
vote_correct = 0
abstentions = 0
for name, item in eval_cases.items():
    winner = decide(item["samples"])
    single_correct += canonicalize(item["samples"][0]) == item["expected"]
    vote_correct += winner == item["expected"]
    abstentions += winner == "abstain"
    print(f"{name}: {winner}")

total = len(eval_cases)
print(f"single_trace_accuracy: {single_correct / total:.0%}")
print(f"vote_5_accuracy: {vote_correct / total:.0%}")
print(f"abstentions: {abstentions}/{total}")
print(f"required_samples_if_collected: single={total}, vote_5={total * 5}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
noisy_clean_majority: 42
arithmetic_slip_recovery: 42
first_wrong_majority_right: 42
shared_arithmetic_trap: 36
weak_support: abstain
single_trace_accuracy: 40%
vote_5_accuracy: 60%
abstentions: 1/5
required_samples_if_collected: single=5, vote_5=25
```
<!-- leetllm: output:end -->

These five cases give 60% self-consistency accuracy across the sample, while the unanimous `36` failure shows why raw sampling consensus never overrides an exact symbolic verifier. For an empirical model comparison, collect samples across the same held-out evaluation split, track abstentions separately from incorrect parses, repeat stochastic runs, and measure both total generated tokens and end-to-end latency. Multiple samples can decode in parallel batch slots, yet they still multiply GPU token generation cost.

```checkpoint
What should a self-consistency controller do when votes don't form a strong majority?
---
Abstain or route to review. More samples are useful only when a measured gain justifies their cost and the action remains safe.
```

## Tree-of-thoughts: search when branches can dead-end

Voting helps when independent paths tend to converge on the same short answer. It doesn't deliberately revisit an earlier choice. <span data-glossary="tree-of-thought">Tree-of-Thoughts (ToT)</span> represents partial solutions as search states, then generates alternatives, evaluates those states, and preserves only branches worth extending.[^yao2023]

Yao et al. evaluated ToT on planning and symbolic search benchmarks using beam search, where the beam width determines how many candidate states survive each pruning round. On Game of 24 with GPT-4, ToT at beam width 5 solved 74% of tasks compared with 4.0% for standard CoT and 9.0% for 100-sample CoT self-consistency.[^yao2023] That improvement highlights why tree search fits problems with verifiable partial states and genuine backtracking opportunities: unlike flat voting, search can abandon a misleading early move and expand an alternative branch instead.

The ToT framework organizes search into four explicit components:

1. **Thought decomposition**: breaking the problem into discrete intermediate states $s$ (such as an arithmetic move, a plan paragraph, or a code function stub).
2. **Thought generation**: proposing $k$ candidate next thoughts from state $s$.
3. **State evaluation**: querying the model or a programmatic validator to score each candidate state (such as classifying viability into `sure`, `maybe`, or `impossible`).
4. **Search controller**: maintaining the active frontier in an external orchestration loop using Breadth-First Search (BFS) with beam pruning or Depth-First Search (DFS) with backtracking.

Beyond strict tree branching, **Graph-of-Thoughts (GoT)** models generated thoughts and their dependencies as a general graph rather than forcing every state to share a single parent.[^besta2024] Graph topology unlocks two practical transformations that flat chains cannot express cleanly: aggregating partial results produced on independent branches and iteratively refining earlier candidates against critique feedback. Because neither combining two claims nor rewriting one trace guarantees truth on its own, every aggregated or refined node still requires an explicit evaluation score before advancing.

1. **Thought aggregation**: combining partial outputs from separate independent sub-problems (such as merging verified theorem lemmas from parallel sub-proofs).
2. **Thought refinement**: generating a new candidate from an earlier candidate and feedback, recognizing that an unverified critique can degrade a partial answer.

How the controller expands its frontier shapes serving cost. Concurrent branches keep more active sequence state; shared-prefix caching can reduce repeated prefill work where supported, but changed history still needs computation. Sequentially dependent calls add round-trips and latency. Bound expansion, measure endpoint behavior, and use the product's latency gate to decide whether search can run interactively or needs a background workflow. ToT doesn't require a particular caching algorithm or background execution.

### Use a problem that actually needs branching

Direct word problems with fixed inputs do not need a search tree, and missing numbers cannot be fabricated by exploring hypothetical branches. Switch instead to Game of 24 to isolate what explicit branching contributes: starting from `[4, 5, 6, 7]`, apply elementary arithmetic operations using each number exactly once to obtain `24`. One valid trajectory applies `6 - 4 = 2`, then `5 + 7 = 12`, and finally `2 * 12 = 24`, where each state tracks the multiset of remaining numbers and their symbolic expressions. Simply creating `24` along the way is insufficient if unused values remain, so only leaf states with a single remaining value equal to `24` count as solutions.

In a full Tree-of-Thoughts pipeline, a language model generates candidate steps and heuristic scores while an external loop manages the frontier. The breadth-first solver below replaces both model calls with exhaustive integer arithmetic over `Fraction` pairs, giving us a clean sandbox to examine state expansion and serve as an exact ground-truth verifier.

<!-- leetllm: test, id=cot-search, output=show -->

```python title="breadth-first-game-of-24.py"
from collections import deque
from fractions import Fraction
from itertools import combinations


def combine(left: tuple[Fraction, str], right: tuple[Fraction, str]) -> list[tuple[Fraction, str]]:
    a, a_expr = left
    b, b_expr = right
    outcomes = [
        (a + b, f"({a_expr} + {b_expr})"),
        (a - b, f"({a_expr} - {b_expr})"),
        (b - a, f"({b_expr} - {a_expr})"),
        (a * b, f"({a_expr} * {b_expr})"),
    ]
    if b:
        outcomes.append((a / b, f"({a_expr} / {b_expr})"))
    if a:
        outcomes.append((b / a, f"({b_expr} / {a_expr})"))
    return outcomes


def solve_24(numbers: list[int], max_states: int = 10000) -> dict:
    if not 1 <= len(numbers) <= 4:
        raise ValueError("provide one to four integer values")
    if max_states < 1:
        raise ValueError("max_states must be a positive integer")
    frontier = deque([[(Fraction(number), str(number)) for number in numbers]])
    visited = set()
    examined = 0
    while frontier:
        state = frontier.popleft()
        key = tuple(sorted(value for value, expression in state))
        if key in visited:
            continue
        if examined >= max_states:
            return {"status": "budget_exhausted", "expression": None}
        visited.add(key)
        examined += 1
        if len(state) == 1 and state[0][0] == 24:
            return {"status": "solved", "expression": state[0][1]}
        for i, j in combinations(range(len(state)), 2):
            remainder = [item for k, item in enumerate(state) if k not in (i, j)]
            frontier.extend([remainder + [result] for result in combine(state[i], state[j])])
    return {"status": "no_solution", "expression": None}


solution = solve_24([4, 5, 6, 7])
print(f"status: {solution['status']}")
print(f"expression: {solution['expression']}")
print(f"one_state_budget: {solve_24([4, 5, 6, 7], max_states=1)['status']}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
status: solved
expression: ((6 - 4) * (5 + 7))
one_state_budget: budget_exhausted
```
<!-- leetllm: output:end -->

`Fraction` avoids floating-point rounding in the arithmetic check. States with the same remaining value multiset have the same future arithmetic possibilities, so the solver keeps one representative. The budget counts distinct states, including the initial state; duplicates don't consume it. Exhausting the queue proves no solution under these operations; hitting `max_states` with an unexamined distinct state only means the search stopped before answering.

Enumeration constructs legal moves by design. If a model proposes the next state instead, don't trust its remaining-number list. Starting with `4, 5, 6, 7`, the claim `6 * 4 = 24, remaining=[24]` discards 5 and 7. A goal check alone would accept that fabricated solution. Recompute the transition from the host's current state before applying a heuristic score:

<!-- leetllm: test, continue=cot-search, id=cot-legal, output=show -->

```python title="validate-proposed-arithmetic-state.py"
def legal_transition(current, left, right, operator, claimed_remaining) -> bool:
    remaining = [Fraction(value) for value in current]
    a, b = Fraction(left), Fraction(right)
    try:
        remaining.remove(a)
        remaining.remove(b)  # Each operand consumes a separate occurrence.
    except ValueError:
        return False
    if operator == "+":
        result = a + b
    elif operator == "-":
        result = a - b
    elif operator == "*":
        result = a * b
    elif operator == "/" and b != 0:
        result = a / b
    else:
        return False
    return sorted(remaining + [result]) == sorted(Fraction(v) for v in claimed_remaining)

start = [4, 5, 6, 7]
print("dropped inputs legal:", legal_transition(start, 6, 4, "*", [24]))
print("dead-end move legal:", legal_transition(start, 6, 4, "*", [24, 5, 7]))
print("valid-branch move legal:", legal_transition(start, 5, 7, "+", [12, 4, 6]))
print("reused single 4 legal:", legal_transition(start, 4, 4, "+", [8, 5, 6, 7]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dropped inputs legal: False
dead-end move legal: True
valid-branch move legal: True
reused single 4 legal: False
```
<!-- leetllm: output:end -->

The helper parses numeric inputs and an allowlisted operator without executing model-written code strings. Checking one transition verifies local arithmetic and multiset conservation, yet it cannot guarantee that a valid path to 24 exists further down the subtree. Notice that `[24, 5, 7]` satisfies the transition rule while still forming a dead end, so a complete solver retains the verified sequence of moves from the starting numbers rather than trusting an isolated `[24]` claim.

<figure>
  <img src="illustrations/_generated/tree_of_thought_search_dark.png" alt="Tree-of-Thoughts search over Game of 24 starting at {4, 5, 6, 7}. Branch A reaches [24, 5, 7] with heuristic score 0.95 yet hits a dead end. Branch B reaches [12, 4, 6] with score 0.40: width-1 beam drops it, whereas width-2 retains it through 6 - 4 = 2 and 12 * 2 = 24. Branch C leaves [2, 4, 6] at score 0.35." />
  <figcaption>Branch A scores highest at 0.95 and reaches a dead end. Width-1 beam search drops B despite B being solvable through 6 - 4 = 2 and 12 * 2 = 24, whereas a width-2 beam keeps B alive and reaches 24.</figcaption>
</figure>

### Pruning is a source of failure

An LLM evaluator is not an arithmetic oracle, because heuristic value prompts can prefer clean-looking partial numbers over deeper solvable configurations. Whenever a scorer ranks an attractive dead branch ahead of a tricky solvable path, a narrow beam eliminates the winning subtree before expansion ever reaches depth two. Keep that pruning bias in mind when inspecting how width-1 vs. width-2 beam search behaves on `[4, 5, 6, 7]` below.

<!-- leetllm: test, continue=cot-legal, output=show -->

```python title="beam-pruning-risk.py"
branches = [
    {"move": "6 * 4 = 24 first", "remaining": [24, 5, 7], "weak_score": 0.95},
    {"move": "5 + 7 = 12 first", "remaining": [12, 4, 6], "weak_score": 0.40},
    {"move": "7 - 5 = 2 first", "remaining": [2, 4, 6], "weak_score": 0.35},
]
for branch in branches:
    result = solve_24(branch["remaining"])
    if result["status"] == "budget_exhausted":
        raise RuntimeError("oracle budget too small")
    branch["solvable"] = result["status"] == "solved"
    branch["exact_score"] = float(branch["solvable"])


def keep_one(score_name: str) -> dict[str, object]:
    return max(branches, key=lambda branch: branch[score_name])


weak_choice = keep_one("weak_score")
exact_choice = keep_one("exact_score")
print(f"weak_evaluator_keeps_solution: {weak_choice['solvable']}")
print(f"exact_evaluator_keeps_solution: {exact_choice['solvable']}")
print(f"risk: beam_width_1 can prune the valid branch")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
weak_evaluator_keeps_solution: False
exact_evaluator_keeps_solution: True
risk: beam_width_1 can prune the valid branch
```
<!-- leetllm: output:end -->

The heuristic scorer assigns rough plausibility weights, whereas the exact evaluator solves each remaining arithmetic subproblem exhaustively. Checking that one move is legal is cheaper than proving that a complete solution exists below it. Real search tasks need that distinction when choosing validators or a separately evaluated scorer.

Keep ToT for tasks with real branch structure, not ordinary classification. Prefer deterministic validators when a partial state can be checked in code. Measure solver recall at each beam width alongside final successes, then cap expansions and latency before an open-ended search reaches users.

```checkpoint
Why can Tree-of-Thoughts perform worse when the evaluator is weak and the beam is narrow?
---
Search spends compute only on retained states. If an incorrect evaluator prunes the valid branch early, later expansions can't recover it.
```

Search can revisit a bad choice only if the controller retained an alternative or supports backtracking. A pruned beam doesn't recover a discarded branch automatically. Expansion increases compute; its latency impact also depends on concurrency and which calls depend on earlier results.

## Native reasoning models and reinforcement learning

The original few-shot CoT work used exemplars without changing model weights. Reasoning-oriented post-training can instead teach intermediate problem-solving behavior. OpenAI's 2024 o1 announcement describes reinforcement learning, without publishing a complete training recipe.[^openai_learning_reasoning_2024] DeepSeek's 2025 R1 report gives a concrete rule-reward example; its R1-Zero variant starts RL without a preceding SFT stage, while R1 combines SFT and RL stages.[^deepseekai2025] These are historical training examples, not a list of current recommended endpoints.

### The shift to verifiable rewards

SFT can teach imitation of human-written, model-generated, or distilled solutions. Its quality depends on its data and objective; it doesn't impose a proved ceiling at human reasoning ability. RLVR adds a training signal based on outcomes a verifier can check. For example, it can check a math answer, run code tests, or validate a formal proof.

A verifier is only as good as what it checks. A finite test suite covers its tested cases; inspect intermediate steps when correctness depends on the derivation. Deterministic rewards can still be gamed. Anthropic's 2025 coding-RL study deliberately exposed vulnerable training environments and observed models learning to exploit them.[^anthropic2025rewardHacking] Evaluate sycophancy and other unwanted behavior separately under RLVR.

Algorithms such as GRPO optimize sampled outputs against their reward signal. Rewarding correct outcomes can encourage intermediate computation when it helps. Evaluate intermediate claims, output length effects, and reasoning disclosure separately.

### Emergent backtracking and test-time scaling

DeepSeek's R1-Zero evaluation reported emergent behaviors such as spontaneous reflection and exploring alternatives during reinforcement learning. While qualitative anecdotes sound impressive, engineering teams still need behavioral tests covering specific failure and recovery modes, including the three patterns below:

- **Self-correction**: spotting an arithmetic slip or violated problem invariant and generating corrective tokens ("Wait, 30 plus 6 gives 36, not 42; let me recheck the multiplication").
- **Emergent backtracking**: recognizing an unproductive branch and shifting to an alternate algebraic substitution or proof approach.
- **Sanity checking**: re-verifying edge cases before generating the final answer.

Snell et al. studied iterative revisions and verifier-guided search using capability-fine-tuned PaLM 2 models on MATH. Difficulty-aware allocation improved compute efficiency, and extra inference computation could beat a roughly 14× larger model in some matched-compute settings.[^snell2024] The result depends on question difficulty and the pretraining-to-inference workload. It isn't a universal log-linear law or evidence that an arbitrary 2,000-token scratchpad beats a model ten times larger.

```checkpoint
A coding candidate passes every unit test in the training split. What has that verifier actually proven?
---
That candidate passed those tests in that environment. The verifier hasn't proved correctness on untested inputs or ruled out a shortcut that fools the harness.
```

### Three failure modes of extended reasoning

Even with native reasoning, extended test-time computation introduces distinct vulnerabilities:

1. **Unfaithful rationalization**: a textual rationale isn't an execution trace of neural activations. Turpin et al. found that biasing features could affect answers without appearing in the generated explanation.[^turpin2023] That study concerns prompted explanations; don't infer a quantified failure rate for every native reasoning model from it.
2. **Extra cost without task gain**: the GPQA study and pattern-based ICL study give specific examples where explicit CoT adds cost with limited gains or worse accuracy.[^meincke2025cot][^ye2025curseofcot] They don't show that every formatting or retrieval task suffers the same degradation.
3. **Budget exhaustion and incomplete answers**: internal reasoning uses generation and context budget. OpenAI documents that an exhausted output limit can end a response before a visible answer.[^openai2026reasoning] Handle incomplete results as unfinished work; don't promote a partial rationale into an action.

## Choose compute with an eval gate

Direct prompting, single-trace CoT, majority voting, and tree search represent points along a compute-accuracy curve with sharply different token footprints and tail latencies. A disciplined engineering workflow starts from the cheapest strategy that clears task validation and escalates to higher-compute patterns only through an explicit <span data-glossary="eval-gate">eval gate</span> grounded in held-out benchmark runs and p95 latency constraints, as difficulty-aware test-time scaling studies confirm.[^snell2024] The benchmark points plotted below demonstrate how this two-axis selection rule works in practice: direct decoding (`190 ms`, `76%`) and a single CoT trace (`360 ms`, `84%`) fall below the `90%` accuracy floor, while tree search (`1840 ms`, `96%`) clears quality at the cost of nearly doubling the `900 ms` latency budget, leaving `Vote-5` (`740 ms`, `94%`) as the sole passing candidate. When calibrating a real serving deployment, swap in measured endpoint latencies and held-out benchmark metrics before locking in the routing threshold.

<figure>
  <img src="illustrations/_generated/prompt_patterns_dark.png" alt="Quadrant plot comparing four reasoning strategies by p95 latency (ms) and task accuracy (%). Direct (190ms, 76%) and CoT-1 (360ms, 84%) fall below the 90% accuracy floor. ToT (1840ms, 96%) exceeds the 900ms latency cap. Only Vote-5 (740ms, 94%) enters the passing top-left region." />
  <figcaption>The shaded upper-left quadrant marks strategies meeting at least 90% accuracy at or below 900 ms p95 latency. Vote-5 is the only candidate inside both thresholds.</figcaption>
</figure>

<!-- leetllm: test, id=cot-gate, output=show -->

```python title="compute-budget-gate.py"
results = [
    {"strategy": "direct", "accuracy": 0.76, "p95_ms": 190, "calls": 1},
    {"strategy": "single_trace", "accuracy": 0.84, "p95_ms": 360, "calls": 1},
    {"strategy": "vote_5", "accuracy": 0.94, "p95_ms": 740, "calls": 5},
    {"strategy": "tree_search", "accuracy": 0.96, "p95_ms": 1840, "calls": 14},
]

minimum_accuracy = 0.90
latency_budget_ms = 900


def eligible_result(row: dict) -> bool:
    accuracy, latency, calls = row.get("accuracy"), row.get("p95_ms"), row.get("calls")
    return (
        bool(row.get("strategy", "").strip())
        and accuracy is not None and minimum_accuracy <= accuracy <= 1
        and latency is not None and 0 < latency <= latency_budget_ms
        and calls is not None and calls > 0
    )


eligible = [
    row for row in results
    if eligible_result(row)
]
selected = min(eligible, key=lambda row: (row["calls"], row["p95_ms"]), default=None)

for row in results:
    print(f"{row['strategy']}: accuracy={row['accuracy']:.0%}, p95_ms={row['p95_ms']}, calls={row['calls']}")
print(f"selected: {selected['strategy'] if selected else 'none'}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
direct: accuracy=76%, p95_ms=190, calls=1
single_trace: accuracy=84%, p95_ms=360, calls=1
vote_5: accuracy=94%, p95_ms=740, calls=5
tree_search: accuracy=96%, p95_ms=1840, calls=14
selected: vote_5
```
<!-- leetllm: output:end -->

The gate rejects missing, non-finite, or out-of-domain measurements and invalid call counts. It uses call count as a simple tie-breaker, not as a dollar-cost estimate. Calls with different prompt lengths, reasoning budgets, or models can cost very different amounts. If no strategy clears the gate, return `none`; don't silently relax the requirements. For a real system, keep a table with:

| Metric | Why it matters |
| :--- | :--- |
| Action accuracy or task success | Extra reasoning must change correct outcomes |
| Unsafe-action and abstention rates | Reliability includes knowing when not to act |
| Input, output, and reasoning tokens | Sampling and search multiply spend |
| p50 and <span data-glossary="p95-latency">p95 latency</span> | Long tails can make support interactions unusable |
| Parse and schema failures | A correct thought is useless if the runtime can't consume its action |

Try a candidate with impossible measurements. These two comparisons alone would let it through:

<!-- leetllm: test, continue=cot-gate, output=show -->

```python title="reject-invalid-evaluation-metrics.py"
invalid = {"strategy": "corrupt_run", "accuracy": float("inf"), "p95_ms": -1, "calls": 1}
naive_accepts = invalid["accuracy"] >= minimum_accuracy and invalid["p95_ms"] <= latency_budget_ms
print(f"two_comparisons_accept: {naive_accepts}")
print(f"validated_gate_accepts: {eligible_result(invalid)}")
print(f"missing_metric_accepts: {eligible_result({'strategy': 'incomplete', 'calls': 1})}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
two_comparisons_accept: True
validated_gate_accepts: False
missing_metric_accepts: False
```
<!-- leetllm: output:end -->

Compare strategies on the exact same held-out evaluation split and report confidence intervals around success rates, because five correct examples never constitute a reliable accuracy estimate. Whenever high-stakes numeric or symbolic outputs drive downstream tool execution, measure silent wrong-answer rate separately from abstentions instead of trusting aggregate accuracy alone.

### Choose a lighter inference path when it meets the task

Check whether the task needs reasoning traces or search before adding their cost:

| Situation | Suitable approach |
| :--- | :--- |
| Inputs are deterministic numeric formulas or symbolic rules | Exact solver or calculator engine in the runtime |
| Pattern-matching few-shot ICL (curse-of-CoT regime) | Try a direct answer, then measure whether a scratchpad helps |
| Multi-step task with sequential sub-dependencies | Try least-to-most prompting before expanding search trees |
| Single-label classification, field extraction, or formatting with clear labels | Use structured output without a visible reasoning channel |
| No verifiable partial state and no backtracking value | Use a direct answer, one trace, or linear decomposition |
| Accuracy already meets the gate at one call | Keep one call when it meets the quality gate |
| Hard latency budgets where extra tokens blow p95 | Choose the least expensive strategy that clears quality |
| Intermediate tokens can leak <span data-glossary="secrets-management">secrets</span> | Restrict trace output, logging access, and retention |
| Need an audit trail of *why* an output was selected | Log prompt inputs, intermediate checks, and tool outputs |
| Missing live facts | Fetch them with a tool call |
| A native reasoning model already wins the eval | Compare it with custom scaffolding behind the same gate |

Adding a visible CoT <span data-glossary="agent-scaffold">scaffold</span> can add tokens and latency without a useful accuracy gain.[^meincke2025cot] Treat that prompt as another experimental arm, not as a required wrapper around every reasoning endpoint.

## Where reasoning ends and tools begin

All runnable experiments above operate on in-memory inputs or deterministic arithmetic state. Real math and engineering workflows often demand arbitrary-precision calculations, symbolic algebra lookups, or external knowledge queries whose answers do not live in static context. Pure token generation can only hallucinate or approximate when an uncached empirical fact or exact calculation sits outside its forward pass.

ReAct interleaves reasoning traces and typed tool actions so each returned observation updates the next step in the derivation.[^yao2023a] Rather than requiring raw private chain of thought, this loop isolates deliberation from deterministic execution through a structured action request, a checked tool response, and an updated prompt state:

```text title="reasoning-to-tool-handoff.txt"
Need: exact value of 15! / 6! should not be approximated in token space.
Next action request: python_eval(expr="math.factorial(15) // math.factorial(6)")
Runtime responsibility: validate AST allowlist, execute deterministically, capture stdout.
Next decision: substitute returned integer into remaining symbolic derivation.
```

That typed tool interface separates language generation from deterministic execution cleanly. First, the host runtime validates arguments against a strict schema before any external code executes. Second, execution errors return structured messages rather than silently corrupting downstream steps, keeping OS permissions and state mutations inside the host sandbox rather than inside model text.

## Try to break the evaluator

Modify each test case below and run its corresponding code cell to inspect how majority voting, dead-end pruning, and evaluation gates respond under edge cases.

1. Replace all five extracted answers in `shared_arithmetic_trap` with a uniform `36` while the true verified result is `42`. Why does 100% consensus fail final accuracy checking?
2. Run `solve_24([4, 5, 6, 7], max_states=1)`. Does that return status prove the puzzle is unsolvable?
3. Lower `latency_budget_ms` to `100` in the evaluation-gate example. What strategy gets selected?
4. Set one candidate's accuracy to `float("inf")` and p95 to `-1`. Would an unchecked `>=` comparison mistakenly accept it, and what does `eligible_result()` return?

Making all five samples repeat `36` exposes a blind spot of self-consistency: unanimous model agreement still fails external verification whenever every sampled trace shares the same framing error. With a one-state budget, the breadth-first solver reports `budget_exhausted` rather than `no_solution`, because unexplored states remain on the queue. Lowering the p95 latency cap to `100` ms causes the gate to return `none`, because no candidate strategy finishes within 100 ms. Finally, infinite accuracy and negative latency would slip past naive inequality checks, whereas `eligible_result()` rejects both as non-finite or out of range, separating shared reasoning mistakes, truncated search, infeasible latency budgets, and malformed metrics.


```mastery-quiz
[
  {
    "question": "A deterministic solver computes expected_answer=42 for a multi-step arithmetic problem. Six sampled model completions all agree on 36 because of the same order-of-operations slip. Which final answer and ground truth govern automated grading?",
    "options": [
      "36; the sampled plurality.",
      "42; the deterministic solver.",
      "36; the longest trace explanation.",
      "Abstain; unanimous agreement overrides verification."
    ],
    "answer": "42; the deterministic solver.",
    "explanation": "Self-consistency estimates consensus across sampled trajectories rather than external correctness. Majority agreement cannot override a deterministic symbolic or numeric verifier when the ground-truth equation is known."
  },
  {
    "question": "On the same held-out math split, a format-only example fixes answer extraction while leaving intermediate step accuracy unchanged. A worked reasoning example raises end-to-end exact accuracy within the latency budget. Which follow-up experiment isolates the reasoning benefit?",
    "options": [
      "Compare worked and format-only examples with fixed inputs and metrics.",
      "Compare worked examples on easy cases with format examples on hard cases.",
      "Compare the longest worked replies with the shortest format replies.",
      "Compare worked-example training scores with format-example test scores."
    ],
    "answer": "Compare worked and format-only examples with fixed inputs and metrics.",
    "explanation": "Keep target prompts, numeric inputs, and evaluation metrics fixed. The format example isolates output parsing, so any accuracy jump from worked steps must show up under matched test conditions."
  },
  {
    "question": "Eight sampled traces extract six answers matching 42, one wrong integer 36, and one unparsed response missing a marker. Using all attempts as the denominator, what happens at minimum agreement thresholds 0.75 and 0.80?",
    "options": [
      "6/7. Accept 42 at 0.75 and accept 42 at 0.80.",
      "6/8. Abstain at 0.75 and abstain at 0.80.",
      "6/8. Accept 42 at 0.75 and accept 42 at 0.80.",
      "6/8. Accept 42 at 0.75 and abstain at 0.80."
    ],
    "answer": "6/8. Accept 42 at 0.75 and abstain at 0.80.",
    "explanation": "Six of the eight attempts vote for 42, giving a vote share of 6/8 = 0.75. That passes >= 0.75 and falls short of >= 0.80. Using 6/7 would drop the unparsed generation from the denominator and inflate apparent confidence."
  },
  {
    "question": "A 24-game host starts with occurrences [1, 3, 4, 6]. Candidate A computes 6/(1-3/4). Candidate B reports 6*4 and discards the other inputs. Which checks follow?",
    "options": [
      "A: 24, valid leaves; B: 24, invalid leaves.",
      "A: 24, invalid leaves; B: 24, valid leaves.",
      "A: 18, valid leaves; B: 24, valid leaves.",
      "A: 18, invalid leaves; B: 24, invalid leaves."
    ],
    "answer": "A: 24, valid leaves; B: 24, invalid leaves.",
    "explanation": "Exact fractions give 1-3/4=1/4 and 6/(1/4)=24. A uses every input occurrence once. B reaches the target number but drops 1 and 3, so its lineage fails."
  },
  {
    "question": "A route planner proposes east (0.88), north (0.52), then west (0.61). Its beam keeps the highest scores. A later map check shows that only west leads to the destination. If you replay this fork with the same scores, which routes remain available to expand?",
    "options": [
      "East at width 1, east and north at width 2.",
      "West at width 1, east and west at width 2.",
      "East at width 1, east and west at width 2.",
      "West at width 1, north and west at width 2."
    ],
    "answer": "East at width 1, east and west at width 2.",
    "explanation": "East ranks first, west second, and north third. The second slot gives the planner a chance to check west's continuation. Keeping east and north follows proposal order. Starting with west and then adding east uses the later map check to put west first. Keeping west and north takes the two most recent proposals."
  },
  {
    "question": "Measured benchmark runs give direct=(0.89 accuracy, 250 ms, 1 call), pair=(0.93, 800 ms, 2), vote=(0.94, 760 ms, 5), tree=(0.97, 1100 ms, 14). Require accuracy >= 0.90 and p95 <= 900 ms, then minimize calls. What gets selected?",
    "options": [
      "direct: 1 call and 250 ms.",
      "vote: 5 calls and 760 ms.",
      "tree: 14 calls and 1100 ms.",
      "pair: 2 calls and 800 ms."
    ],
    "answer": "pair: 2 calls and 800 ms.",
    "explanation": "Pair and vote meet both requirements; pair has fewer calls. Direct misses accuracy and tree misses latency. The gate does not relax a requirement to prefer a cheaper or more accurate row."
  },
  {
    "question": "A repair shop identifies a pump model from its serial number. A planner needs that model to choose a test. Later, two inspectors each report a different required repair. A supervisor reviews the draft work order and requests a revision. Which workflow preserves the dependencies?",
    "options": [
      "Pass the identified model to the planner. Use the higher-rated report for the draft, then revise it.",
      "Pass the identified model to the planner. Use both reports for the draft, then revise it.",
      "Choose the test independently of model identification. Use the higher-rated report for the draft, then revise it.",
      "Choose the test independently of model identification. Use both reports for the draft, then revise it."
    ],
    "answer": "Pass the identified model to the planner. Use both reports for the draft, then revise it.",
    "explanation": "Choosing a test depends on the pump model. Passing the first answer into the next step is least-to-most prompting. Planning independently would leave the model unknown. The work order needs a repair from each inspector, so selecting one report loses a required repair. A graph controller can combine both reports and use the feedback to revise the draft. Check that the revision still includes both repairs."
  },
  {
    "question": "An exact arithmetic solver has examined 40 distinct states, its full budget, without finding a goal. The next five queue entries have keys it has already examined. The sixth has a new key. Which stopping decision follows?",
    "options": [
      "Return no_solution when the 40th examination finds no goal.",
      "Return no_solution when the first queued key repeats.",
      "Return budget_exhausted after examining the sixth queued state.",
      "Return budget_exhausted before examining the sixth queued state."
    ],
    "answer": "Return budget_exhausted before examining the sixth queued state.",
    "explanation": "Skipping the five repeats leaves the count at 40. Examining the sixth state would raise it to 41. The new key leaves the puzzle undecided. Neither a failed goal check at the cap nor a repeated key proves no_solution. That result requires exhausting all reachable distinct states without finding a goal."
  },
  {
    "question": "A provider response uses 790 internal reasoning tokens under an 800-token output limit and emits no final structured answer record. Its short summary says the derivation looks sound. What should the application record?",
    "options": [
      "Complete solution; the summary confirms every intermediate check.",
      "Incomplete response; a summary and usage count do not replace the verified answer record.",
      "Complete solution; few visible tokens prove low inference cost.",
      "Invalid usage; internal tokens cannot draw from an output budget."
    ],
    "answer": "Incomplete response; a summary and usage count do not replace the verified answer record.",
    "explanation": "Native internal reasoning can consume the token budget before emitting a visible answer. A summary reflects a provider disclosure setting rather than proving intermediate checks or replacing the structured answer record."
  },
  {
    "question": "Two teams start with separate copies of the same model. Team A adds worked examples to its prompts. Team B trains its copy on sampled answers scored by a checker and saves the trained model. Each team now loads its own model for a fresh request without examples. Which weights will each use?",
    "options": [
      "A uses updated weights. B uses the original weights.",
      "A uses the original weights. B uses the original weights.",
      "A uses the original weights. B uses updated weights.",
      "A uses updated weights. B uses updated weights."
    ],
    "answer": "A uses the original weights. B uses updated weights.",
    "explanation": "Request A placed worked examples in the context window without modifying parameters. Request B trained on the verifier's outcome rewards and saved the updated weights. Assigning updated weights to A mistakes prompt conditioning for gradient updates, whereas assigning original weights to B ignores the saved parameter update."
  }
]
```

> **Next:** Continue to [Function Calling & Tool Use](/learn/function-calling-tool-use-llms). You can now choose and evaluate a reasoning budget over facts already in the prompt. Next you'll turn a missing observation into a typed tool request that a trusted runtime validates, executes, and logs.
