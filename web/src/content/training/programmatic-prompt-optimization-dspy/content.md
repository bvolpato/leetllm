---
{
  "id": "programmatic-prompt-optimization-dspy",
  "slug": "programmatic-prompt-optimization-dspy",
  "title": "Prompt Optimization with DSPy",
  "shortDescription": "A keyword match can reward a RAG answer that cites a paper without supporting the claim. Build a typed DSPy verifier, write a strict metric, separate source-family splits, and control the compiled artifact at runtime.",
  "difficulty": "Medium",
  "category": "Prompt Engineering",
  "section": "Applied LLM Engineering",
  "companies": ["Databricks", "Google", "Meta", "Microsoft", "Anthropic"],
  "prerequisites": ["prompt-engineering-fundamentals", "chain-of-thought-advanced-prompting", "llm-as-judge-automated-evaluation", "experiment-tracking-mlflow-wandb"],
  "order": 20,
  "coverImage": "social_banner.png",
  "keyConceptsTested": ["DSPy signatures and modules", "Metric design", "BootstrapFewShot acceptance", "MIPROv2 instruction and demonstration search", "Selection overfitting", "Compiled artifact and runtime model"],
  "relatedQuestions": ["experiment-tracking-mlflow-wandb", "llm-as-judge-automated-evaluation", "model-versioning-continuous-deployment", "prompt-engineering-fundamentals"]
}
---

A RAG citation verifier reads one retrieved abstract: *Paper `P-4412` reports perplexity 18.4 on WikiText-103 for Llama-3-8B.* A user asks what MMLU accuracy that paper reports for Llama-3-8B. A candidate prompt confidently cites `P-4412`, and a naive keyword evaluator awards full credit simply because the ID appears in both the abstract and the answer.

If you run automated prompt search against that weak evaluator, the optimizer will happily learn to hallucinate citations whenever a paper ID is in context. Fixing that failure requires separating four concerns that giant hand-edited prompt strings usually tangle together: input/output fields, execution flow, instructions, and few-shot demonstrations.

<span data-glossary="dspy">DSPy</span> expresses LLM pipelines as composable Python programs.[^khattab2023] Its optimizers search over instructions and demonstrations against an explicit evaluation metric while keeping your program's control flow fixed. The [experiment-tracking lesson](/learn/experiment-tracking-mlflow-wandb) showed how to record run comparisons; here you will build a citation verifier in DSPy, see how bootstrapping and joint search actually work, catch validation overfitting, and bind the right model to a saved prompt artifact.

## Give the program a narrow job

Keep the LLM's job narrow and verifiable. Our `CitationVerifier` outputs exactly two typed fields: a `verdict` (`ANSWER` or `ABSTAIN`) and a `source_id` (required for `ANSWER`, empty for `ABSTAIN`). Free-form prose and downstream rendering stay in ordinary Python code.

A **signature** declares input and output fields plus a concise task docstring.[^dspySignatures2026] A **module** wires one or more predictors together. For a single inference call, `dspy.Predict` wraps the signature directly:

<!-- leetllm: test, deps=dspy[optuna]==3.4.0, output=show, id=dspy-program -->
```python title="define-citation-verifier.py"
from typing import Literal
import dspy


class CitedVerdict(dspy.Signature):
    """Select a paper ID that supports answering the question, or abstain."""
    evidence: str = dspy.InputField(desc="Retrieved paper abstracts with source IDs")
    question: str = dspy.InputField()
    verdict: Literal["ANSWER", "ABSTAIN"] = dspy.OutputField()
    source_id: str = dspy.OutputField(desc="Supporting paper ID; empty for ABSTAIN")


class CitationVerifier(dspy.Module):
    def __init__(self):
        super().__init__()
        self.decide = dspy.Predict(CitedVerdict)

    def forward(self, question: str, evidence: str):
        return self.decide(question=question, evidence=evidence)


evidence = "Paper P-4412 reports perplexity 18.4 on WikiText-103 for Llama-3-8B."
trainset = [
    dspy.Example(
        question="What WikiText-103 perplexity does Paper P-4412 report for Llama-3-8B?",
        evidence=evidence,
        verdict="ANSWER",
        source_id="P-4412",
    ).with_inputs("question", "evidence"),
    dspy.Example(
        question="What MMLU accuracy does Paper P-4412 report for Llama-3-8B?",
        evidence=evidence,
        verdict="ABSTAIN",
        source_id="",
    ).with_inputs("question", "evidence"),
]

student = CitationVerifier()
print("Inputs:", sorted(trainset[0].inputs().keys()))
print("Expected verdicts:", [(row.verdict, row.source_id) for row in trainset])
print("Initial demonstrations:", len(student.decide.demos))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Inputs: ['evidence', 'question']
Expected verdicts: [('ANSWER', 'P-4412'), ('ABSTAIN', '')]
Initial demonstrations: 0
```
<!-- leetllm: output:end -->

Notice `.with_inputs("question", "evidence")`: DSPy uses that declaration to distinguish prompt inputs from ground-truth labels inside each `Example`. Swapping `dspy.Predict` for `dspy.ChainOfThought` automatically prepends a `reasoning` output field (even though its customization parameter is named `rationale_field`).[^dspyCot340Source2026] Here direct prediction keeps latency low and avoids rewarding fluent rationales that still cite the wrong paper.

## Optimize the behavior you actually need

Every DSPy optimizer maximizes the metric you hand it. If your metric only checks string overlap, search amplifies plausible-sounding errors.

Our metric awards `1.0` only when both `verdict` and `source_id` match the reviewed label, and `0.0` for any mismatch or malformed pairing. When a corpus has multiple equally valid supporting papers, expand `source_id` comparison to an allowed set rather than penalizing alternate valid citations:

<!-- leetllm: test, output=show, continue=dspy-program, id=dspy-metric -->
```python title="score-the-citation.py"
def citation_metric(example, prediction, trace=None) -> float:
    expected_verdict = getattr(example, "verdict", None)
    expected_source = getattr(example, "source_id", None)
    if expected_verdict not in {"ANSWER", "ABSTAIN"}:
        raise ValueError("unknown labeled verdict")
    if (expected_verdict == "ABSTAIN" and expected_source != "") or (
        expected_verdict == "ANSWER" and not str(expected_source).strip()
    ):
        raise ValueError("invalid verdict/source label pairing")
    verdict = getattr(prediction, "verdict", None)
    source_id = getattr(prediction, "source_id", None)
    return float(verdict == expected_verdict and source_id == expected_source)


cases = [
    ("supported claim", trainset[0], dspy.Prediction(verdict="ANSWER", source_id="P-4412")),
    ("wrong source", trainset[0], dspy.Prediction(verdict="ANSWER", source_id="P-9999")),
    ("unsupported claim", trainset[1], dspy.Prediction(verdict="ANSWER", source_id="P-4412")),
    ("justified abstention", trainset[1], dspy.Prediction(verdict="ABSTAIN", source_id="")),
    ("abstention with a source", trainset[1], dspy.Prediction(verdict="ABSTAIN", source_id="P-4412")),
]
for name, example, prediction in cases:
    print(f"{name:25s}: {citation_metric(example, prediction):.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
supported claim          : 1.0
wrong source             : 0.0
unsupported claim        : 0.0
justified abstention     : 1.0
abstention with a source : 0.0
```
<!-- leetllm: output:end -->

Every DSPy metric takes `(example, prediction, trace=None)`. During bootstrapping, DSPy passes the recorded predictor call trace so you can inspect intermediate steps if needed; during ordinary evaluation, `trace` is `None`.

```checkpoint
Why doesn't finding `P-4412` in both the abstract and the answer prove that the answer is supported?
---
The identifier only tells you which paper was mentioned, not whether that paper reports the metric in the question. `P-4412` reports WikiText-103 perplexity, not MMLU accuracy. The metric must check answer grounding against reviewed labels or a faithfulness evaluator.
```

## Keep examples for learning separate from examples for judging

Automated prompt search is training on data, even though model weights stay frozen. Separate your data into three roles before running any optimizer:

1. **Training split:** Seed pool for bootstrapping demonstrations and proposing instructions.
2. **Validation split (development set):** Scores candidate prompts during search and picks the winner.
3. **Held-out test split:** Touched exactly once after instructions, demonstrations, and hyperparameters are frozen.

In retrieval tasks, distinct queries frequently paraphrase questions about the same underlying paper. If paraphrases of `P-4412` sit in both train and test, your test score measures memorization of that paper rather than generalization to unseen documents. Group examples by **source family** (paper ID or document cluster) so all questions about one paper stay in one split:

<!-- leetllm: test, output=show, id=dspy-splits -->
```python title="split-by-source-family.py"
def validate_group_splits(splits: dict[str, list[tuple[str, str]]]) -> None:
    if set(splits) != {"train", "validation", "test"}:
        raise ValueError("need train, validation, and test splits")
    family_split = {}
    seen_queries = set()
    for split, rows in splits.items():
        if not rows:
            raise ValueError(f"{split} split is empty")
        for query_id, family in rows:
            if query_id in seen_queries:
                raise ValueError(f"duplicate query ID {query_id}")
            seen_queries.add(query_id)
            if family in family_split and family_split[family] != split:
                raise ValueError(f"source family {family} appears in {family_split[family]} and {split}")
            family_split[family] = split


clean_splits = {
    "train": [("q-001", "P-4412"), ("q-002", "P-4412")],
    "validation": [("q-101", "P-5501")],
    "test": [("q-201", "P-6601")],
}
validate_group_splits(clean_splits)
print("Clean source-family split: passed")

leaked_splits = {**clean_splits, "test": [("q-999", "P-4412")]}
try:
    validate_group_splits(leaked_splits)
except ValueError as error:
    print("Leaked split rejected:", error)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Clean source-family split: passed
Leaked split rejected: source family P-4412 appears in train and test
```
<!-- leetllm: output:end -->

Never inspect test errors to tweak prompts or restart search. Once test outcomes guide your changes, that split has become development data and you need a fresh holdout to measure generalization.

## How a demonstration gets into the prompt

The simplest few-shot optimizer is `dspy.LabeledFewShot`: it copies labeled training rows straight into each predictor's `.demos` list without calling any language model. Calling `.compile()` always returns a new module copy so the original uncompiled student stays intact:

<!-- leetllm: test, output=show, continue=dspy-metric, id=dspy-labeled -->
```python title="compile-labeled-demonstrations.py"
labeled = dspy.LabeledFewShot(k=2).compile(student, trainset=trainset, sample=False)
print("Original demos:", len(student.decide.demos))
print("Compiled demos:", len(labeled.decide.demos))
print("Separate instance:", labeled is not student)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Original demos: 0
Compiled demos: 2
Separate instance: True
```
<!-- leetllm: output:end -->

`dspy.BootstrapFewShot` goes one step further: it runs a **teacher program** (either a copy of the student or a stronger model) over training inputs, evaluates each output with your metric, and keeps only passing predictor traces as demonstrations.[^dspyBootstrap340Source2026] In a multi-step pipeline, remember that a passing final label can still admit flawed intermediate steps unless your metric checks intermediate traces too.[^dspyBootstrap2026]

<figure>
  <img src="illustrations/_generated/bootstrap_trace_gate_dark.png" alt="A DSPy 3.4.0 DummyLM trace runs two teacher predictions. For WikiText-103 perplexity, ANSWER with P-4412 matches the label, scores 1.0, and enters the compiled demonstrations. For MMLU accuracy, the same prediction conflicts with ABSTAIN and an empty source ID, scores 0.0, and is discarded. The compiled verifier holds one demonstration while the original student holds zero. A separate constant 0.5 probe accepts both traces at threshold None or 0.0 and zero at threshold 1.0." />
  <figcaption>The teacher runs on both training queries. At threshold 1.0, the metric keeps the supported WikiText-103 trace and drops the unsupported MMLU trace. The constant 0.5 probe shows how threshold 0.0 falls back to Python truthiness and admits weak traces.</figcaption>
</figure>

> **Common mistake:** Leaving `metric_threshold` unset or setting it to `0.0`. In `BootstrapFewShot`, both `None` and `0.0` fall back to `bool(score)`! Any nonzero partial score (such as `0.5`, a negative number, or `NaN`) evaluates as truthy and quietly enters your prompt as a "passing" demonstration.[^dspyBootstrap340Source2026] Always pass an explicit nonzero threshold matched to your metric scale.

Run `BootstrapFewShot` with DSPy's deterministic `DummyLM` to watch both strict filtering and the truthiness trap in action:

<!-- leetllm: test, output=show, continue=dspy-labeled, id=dspy-bootstrap -->
```python title="bootstrap-with-a-local-test-double.py"
import contextlib
import io
from dspy.utils.dummies import DummyLM

teacher_lm = DummyLM([
    {"verdict": "ANSWER", "source_id": "P-4412"},
    {"verdict": "ANSWER", "source_id": "P-4412"},
])
bootstrap = dspy.BootstrapFewShot(
    metric=citation_metric,
    metric_threshold=1.0,
    max_bootstrapped_demos=2,
    max_labeled_demos=0,
    max_rounds=1,
)

with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
    with dspy.context(lm=teacher_lm):
        bootstrapped = bootstrap.compile(student, trainset=trainset)

demos = bootstrapped.decide.demos
print("Accepted demos:", len(demos), "| question:", demos[0].question)
print("Unmodified student demos:", len(student.decide.demos))


def partial_score_demo_count(threshold):
    compiler = dspy.BootstrapFewShot(
        metric=lambda example, prediction, trace=None: 0.5,
        metric_threshold=threshold,
        max_bootstrapped_demos=2,
        max_labeled_demos=0,
        max_rounds=1,
    )
    lm = DummyLM([
        {"verdict": "ANSWER", "source_id": "P-4412"},
        {"verdict": "ANSWER", "source_id": "P-4412"},
    ])
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        with dspy.context(lm=lm):
            return len(compiler.compile(student, trainset=trainset).decide.demos)


for threshold in (None, 0.0, 1.0):
    print(f"Constant 0.5 metric at threshold={str(threshold):4s} -> {partial_score_demo_count(threshold)} demos kept")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Accepted demos: 1 | question: What WikiText-103 perplexity does Paper P-4412 report for Llama-3-8B?
Unmodified student demos: 0
Constant 0.5 metric at threshold=None -> 2 demos kept
Constant 0.5 metric at threshold=0.0  -> 2 demos kept
Constant 0.5 metric at threshold=1.0  -> 0 demos kept
```
<!-- leetllm: output:end -->

The first teacher output matched the WikiText-103 label and entered the compiled demos; the second cited `P-4412` on the unanswerable MMLU question, scored `0.0`, and was filtered out. Meanwhile, a constant `0.5` scorer passed both demos whenever `metric_threshold` was `None` or `0.0`.

```checkpoint
A metric awards 0.5 when the verdict is right but the cited source ID is wrong. Why can that be dangerous during bootstrapping?
---
With `metric_threshold` unset or set to `0.0`, Python treats `0.5` as truthy and turns an inaccurate teacher trace into a few-shot demonstration. Set an explicit nonzero acceptance threshold that requires the full citation check to pass.
```

## Search instructions as well as demonstrations

Bootstrapping produces a single set of demonstrations while leaving your docstring instruction fixed. DSPy includes several optimizers that search broader prompt spaces without updating model weights:[^dspyOptimizers2026]

- **`BootstrapFewShot`:** Collects accepted traces up to `max_bootstrapped_demos`, stopping early once the quota is full.
- **`BootstrapFewShotWithRandomSearch` (BootstrapRS):** Samples multiple candidate demonstration subsets and selects the one with the highest validation score.
- **`COPRO`:** Iteratively proposes and scores predictor instructions and output prefixes over the supplied development set.[^dspyCopro340Source2026]
- **`MIPROv2`:** Jointly optimizes instructions and demonstration subsets across multi-stage programs.[^opsahlong2024] It drafts data-grounded instruction candidates and uses Bayesian optimization (Optuna's Tree-structured Parzen Estimator) to search combinations of instructions and demos.

Formally, if $\phi$ denotes a prompt configuration (instructions plus demonstration sets) and $P_\phi(x_i)$ is the program's output on validation input $x_i$, search maximizes the empirical validation score:

$$
\widehat{M}_{\mathrm{val}}(\phi) = \frac{1}{n} \sum_{i=1}^{n} M\bigl(x_i, P_\phi(x_i)\bigr)
$$

In `MIPROv2`, presets such as `auto="light"` pick heuristic search budgets automatically. For explicit budget control, pass `auto=None`, set `num_candidates` on the optimizer, and pass `num_trials` plus a dedicated `valset` to `.compile()`. Proposal and task LMs inherit from the active `dspy.context(lm=...)` when omitted:[^dspyMiproSource2026]

<!-- leetllm: test, output=show, continue=dspy-bootstrap, id=dspy-mipro -->
```python title="check-mipro-configuration-without-generation.py"
offline_lm = DummyLM([])
with dspy.context(lm=offline_lm):
    inherited = dspy.MIPROv2(metric=citation_metric, auto=None, num_candidates=4)
print("Context LM inherited for both roles:", inherited.prompt_model is offline_lm and inherited.task_model is offline_lm)

manual = dspy.MIPROv2(
    metric=citation_metric,
    auto=None,
    num_candidates=4,
    prompt_model=offline_lm,
    task_model=offline_lm,
)
try:
    manual.compile(student, trainset=trainset)
except ValueError as error:
    print("Missing num_trials rejected:", str(error).splitlines()[0])

# Full search supplies configured LMs, a trial budget, and an explicit validation split:
# compiled = manual.compile(student, trainset=trainset, valset=valset,
#                           num_trials=12, minibatch=False)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Context LM inherited for both roles: True
Missing num_trials rejected: If auto is None, num_trials must also be provided. Given num_candidates=4, we'd recommend setting num_trials to ~8.
```
<!-- leetllm: output:end -->

Pass an explicit `valset` whenever source-family isolation matters: omitting `valset` causes `MIPROv2` to slice roughly the last 80% of `trainset` (capped at 1,000 rows) by position, which ignores paper IDs. Also note that setting both demo limits to `0` keeps new demos out of candidates, yet will not erase demos already attached to the input `student`, so always start instruction-only runs from a clean student.[^dspyMiproSource2026]

<details>
<summary>Deep dive: Reflective prompt evolution with GEPA</summary>

`GEPA` reflects on recorded execution traces and textual feedback to rewrite predictor instructions.[^gepa2025] Its DSPy metric requires a five-argument signature `(gold, pred, trace, pred_name, pred_trace)` (plus optional `program_trace` for Flex submodules) and works best when returning `dspy.Prediction(score=..., feedback=...)` with concrete failure diagnostics rather than a bare float.[^dspyGepa340Source2026] Wrap our three-argument `citation_metric` in a thin adapter before passing it to GEPA.

</details>

## A validation winner can lose on test

Searching many prompt candidates on a small validation set creates **selection overfitting**: a prompt can rise on validation by matching quirky phrasings or sampling noise while losing ground on unseen queries.

Watch a concrete reversal: on 20 validation queries, `compiled_a` jumps from `14/20` (70%) to `19/20` (95%), so selection picks it. When you open the 20-query test split, `compiled_a` drops to `13/20` (65%) while the uncompiled baseline scores `16/20` (80%):

<!-- leetllm: test, output=show, id=dspy-selection -->
```python title="select-before-opening-test-results.py"
validation = {"baseline": (14, 20), "compiled_a": (19, 20)}
test = {"baseline": (16, 20), "compiled_a": (13, 20)}

def accuracy(counts: tuple[int, int]) -> float:
    correct, total = counts
    return correct / total

selected = max(validation, key=lambda name: accuracy(validation[name]))
val_gain = accuracy(validation[selected]) - accuracy(validation["baseline"])
test_delta = accuracy(test[selected]) - accuracy(test["baseline"])

print(f"Selected on validation: {selected} ({val_gain:+.0%} vs baseline)")
print(f"Held-out test baseline: {accuracy(test['baseline']):.0%}")
print(f"Held-out test {selected}: {accuracy(test[selected]):.0%} ({test_delta:+.0%} vs baseline)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Selected on validation: compiled_a (+25% vs baseline)
Held-out test baseline: 80%
Held-out test compiled_a: 65% (-15% vs baseline)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/optimizer_search_loop_dark.png" alt="Validation and test bar charts use identical zero to 100 percent axes while Baseline keeps blue and Compiled A keeps purple. Validation scores of 14/20 (70 percent) and 19/20 (95 percent) pick Compiled A with a 25 percentage-point lead, while held-out test scores of 16/20 (80 percent) and 13/20 (65 percent) reverse the ranking with a 15-point deficit for Compiled A." />
  <figcaption>A 25-point validation lead reverses into a 15-point held-out deficit. Compare paired per-query outcomes and abstention slices rather than trusting a single validation peak.</figcaption>
</figure>

> **Key insight:** A higher validation score selects a candidate; only an untouched test split tells you whether it generalizes. Always track critical failure slices (like fabricated citations on unanswerable queries) alongside mean accuracy so a small average gain never hides hallucination regressions.

```checkpoint
After seeing the candidate fail on test, you fix its prompt and repeatedly rerun the same test. Is the next score still an untouched estimate?
---
No. Test feedback is now guiding development, even if those rows never enter `.compile()`. Keep those failure cases as regression tests, and reserve fresh unseen cases for final evaluation.
```

## Budget the full search across requests

Prompt search multiplies model calls rapidly. Evaluating 40 full `MIPROv2` trials (`minibatch=False`) on 50 validation cases runs `40 * 50 = 2,000` trial executions plus the initial 50-case baseline evaluation (`2,050` logical program runs) *before* counting teacher bootstrapping or instruction proposals.[^dspyMiproSource2026]

Even more important: **logical program executions are not billable API requests.** A multi-step program calls several predictors plus an optional LLM judge, and requesting multiple samples (`n > 1`) can multiply underlying engine calls too. In DSPy's native `lm15` engine and custom engines, requesting `n=2` completions executes two separate sequential `complete()` calls:[^dspy340Release2026][^dspy340LmEngine2026]

<!-- leetllm: test, deps=dspy[optuna]==3.4.0, output=show, id=dspy-engine-budget -->
```python title="count-engine-calls-for-two-answers.py"
import dspy
from dspy.lm15 import Message, Response, Usage

class CountingEngine:
    def __init__(self):
        self.calls = 0

    def complete(self, request):
        self.calls += 1
        return Response(
            id=None,
            model=request.model,
            message=Message.assistant(f"answer {self.calls}"),
            finish_reason="stop",
            usage=Usage(),
        )

engine = CountingEngine()
lm = dspy.LM("custom/counting", engine=engine, cache=False)
answers = lm("One logical prompt", n=2)
print("Returned answers:", answers)
print("Actual engine requests:", engine.calls)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Returned answers: ['answer 1', 'answer 2']
Actual engine requests: 2
```
<!-- leetllm: output:end -->

Every added demonstration also taxes *production* inference forever. Adding 2,500 tokens of few-shot examples to a prompt serving 100 requests/s adds 250,000 logical input tokens per second (with actual cost and first-token latency depending on prompt caching, batching, and provider pricing). Enforce hard spend and timeout caps outside DSPy, track proposal-model and task-model token usage separately, and log seeds, exact model revisions, engine backend (`lm15` vs LiteLLM), and dataset/metric hashes with every run.

## Save the prompt state and control the runtime model

Save a compiled program's state to JSON with `program.save("compiled.json")` and reload it into a fresh instance of the same Python class with `program.load("compiled.json")`. The JSON captures optimized instructions, demonstrations, signature metadata, and attached LM settings.[^dspySerialization2026]

Two operational traps bite teams right at deployment:

1. **Attached-LM precedence:** If a predictor had an LM attached during compilation, `load()` restores that attached LM, and it *overrides* any global `dspy.configure(lm=...)` or `dspy.context(lm=...)`. Call `restored.set_lm(runtime_lm)` explicitly to bind the serving model.
2. **Partial secret stripping:** DSPy's JSON serializer strips the top-level `api_key`, but nested fields such as `extra_headers` (and any sensitive text inside demonstrations) are written straight to disk.[^dspySerialization2026]

Watch both behaviors in a real save/load round trip:

<!-- leetllm: test, output=show, continue=dspy-mipro, id=dspy-save -->
```python title="round-trip-real-dspy-state.py"
from pathlib import Path
from tempfile import TemporaryDirectory

saved_lm = dspy.LM(
    "openai/eval-model-a",
    api_key="unused-key",
    temperature=0,
    extra_headers={"X-Eval-Header": "trace-tag"},
)
runtime_lm = dspy.LM("openai/eval-model-b", temperature=0)
labeled.set_lm(saved_lm)

with TemporaryDirectory() as directory:
    artifact = Path(directory) / "compiled.json"
    labeled.save(artifact)
    payload = artifact.read_text()

    restored = CitationVerifier()
    restored.load(artifact)

    with dspy.context(lm=runtime_lm):
        print("Model under dspy.context(runtime_lm):", restored.get_lm().model)
    restored.set_lm(runtime_lm)
    print("Model after explicit set_lm():      ", restored.get_lm().model)
    print("Restored demonstrations:            ", len(restored.decide.demos))
    print("Top-level api_key in JSON:          ", "unused-key" in payload)
    print("Nested extra_headers value in JSON: ", "trace-tag" in payload)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Model under dspy.context(runtime_lm): openai/eval-model-a
Model after explicit set_lm():       openai/eval-model-b
Restored demonstrations:             2
Top-level api_key in JSON:           False
Nested extra_headers value in JSON:  True
```
<!-- leetllm: output:end -->

> **Common mistake:** Using `save_program=True` with untrusted files. Whole-program saving relies on `cloudpickle`, which can execute arbitrary code on load. Prefer state-only JSON checked into version control alongside your Python module code, inspect the file for leaked headers or sensitive demo text, and re-evaluate whenever either the JSON artifact or the bound runtime model changes.

<figure>
  <img src="illustrations/_generated/compile_deploy_loop_dark.png" alt="A LabeledFewShot serialization pass saves two demonstrations and attached eval-model-a in compiled.json. Loading state into CitationVerifier restores both demonstrations and model A. Setting the global context to eval-model-b leaves model A attached; calling set_lm(runtime_lm) binds model B. Always re-evaluate the updated artifact-model pair, and run application-level citation checks before showing verified answers to users." />
  <figcaption>Loading saved JSON restores both demonstrations and the attached eval-model-a. A global context block leaves that binding intact until set_lm(runtime_lm) switches to model B.</figcaption>
</figure>

Treat the compiled JSON, Python program code, runtime model revision, and evaluation record as one versioned bundle with a previous known-good fallback. The served verifier matches your test score only when that exact combination runs in production.

```checkpoint
A bootstrap scorer returns −0.2 for a bad example and `metric_threshold` is `0.0`. What happens?
---
The negative score passes the filter because `metric_threshold=0.0` falls back to Python truthiness, and any nonzero float (including negative numbers) is truthy. Set an explicit positive threshold matched to your metric scale.
```

```checkpoint
A student already has three attached demonstrations. You set both MIPROv2 demonstration limits to zero to test instruction-only prompts. What else must you do?
---
Start from a fresh student with no attached demonstrations. Zero demonstration limits prevent adding new demos, but they do not strip demonstrations already attached to the input program.
```

```mastery-quiz
[
  {
    "question": "A DSPy verifier needs three changes: add source_id to a predictor's declared outputs, run the evidence predictor before the verifying predictor, and award a point when the final verdict and source ID both match the label. Which components own those changes, in order?",
    "options": [
      "Signature, module, metric.",
      "Module, signature, metric.",
      "Signature, metric, module.",
      "Metric, module, signature."
    ],
    "answer": "Signature, module, metric.",
    "explanation": "The signature declares source_id. The module calls the two predictors in order. The metric compares the final fields with the label."
  },
  {
    "question": "For two benchmark queries, retrieval returns Paper P14 first and Paper P26 second. Both reviewed labels specify ANSWER with P26. For the first query, the verifier returns ANSWER with P26. For the second query, it returns ANSWER with P14. The metric awards 1 when the verifier's verdict and source ID both match the reviewed label and 0 otherwise. What scores do the first and second queries earn, in that order?",
    "options": [
      "(0, 0)",
      "(0, 1)",
      "(1, 0)",
      "(1, 1)"
    ],
    "answer": "(1, 0)",
    "explanation": "The first query earns 1 because ANSWER and P26 both match its label. The second query earns 0 because the verifier cites P14 where the label requires P26."
  },
  {
    "question": "Training query Q18, in family F4, asks whether Theorem 6 implies convergence for convex losses. Test query Q53, in family F9, asks whether convex losses guarantee convergence under Theorem 6. How does the declared-family checker judge this pair, and does Q53 test transfer to an unseen theorem?",
    "options": [
      "The pair passes the check. Q53 tests an unseen theorem.",
      "The pair fails the check. Q53 tests a theorem seen in training.",
      "The pair fails the check. Q53 tests an unseen theorem.",
      "The pair passes the check. Q53 tests a theorem seen in training."
    ],
    "answer": "The pair passes the check. Q53 tests a theorem seen in training.",
    "explanation": "Because the query IDs and declared family IDs (F4 vs F9) differ, the metadata checker passes. Yet both queries paraphrase the same Theorem 6 implication, so Q53 does not test transfer to an unseen theorem."
  },
  {
    "question": "A corpus FAQ states that lab lockers are reserved only for enrolled students. Asked about alumni access, a teacher's reader writes 'Alumni qualify for lockers.' Its verifier reads that note and returns ABSTAIN with an empty source ID. BootstrapFewShot records both calls and has room for both demonstrations. The final pair matches the label, so the run passes. What can each predictor receive as a demonstration, and what does the passing score verify?",
    "options": [
      "Only the verifier can receive a demonstration because only its output has a label. The alumni claim still needs a grounding check.",
      "The reader can get the note as an output and the verifier can get it as an input. The final score validates the alumni claim in both.",
      "The reader can get the note as an output and the verifier can get it as an input. The alumni claim still needs a grounding check.",
      "The reader and verifier can both receive demonstrations with a corrected note. The final abstention corrects the alumni claim."
    ],
    "answer": "The reader can get the note as an output and the verifier can get it as an input. The alumni claim still needs a grounding check.",
    "explanation": "BootstrapFewShot records both predictor calls when the final output passes. Without an intermediate trace check, the false reader note can be saved as a demonstration for both steps."
  },
  {
    "question": "In a compact joint search, each of three predictors has two instruction choices and two demonstration-set choices. How many complete prompt configurations are possible?",
    "options": [
      "12",
      "16",
      "64",
      "8"
    ],
    "answer": "64",
    "explanation": "Each predictor has 2 x 2 = 4 configurations. Choosing independently across three predictors gives 4^3 = 64 total configurations."
  },
  {
    "question": "A full-evaluation search runs 12 trials over 30 cases and evaluates one default baseline first. Each program execution makes two predictor requests and one judge request. Assume no cache hits or retries and exclude teacher/proposer work. Which pair is correct?",
    "options": [
      "360 logical executions; 1,080 requests.",
      "390 logical executions; 390 requests.",
      "360 logical executions; 1,170 requests.",
      "390 logical executions; 1,170 requests."
    ],
    "answer": "390 logical executions; 1,170 requests.",
    "explanation": "The baseline plus 12 trials gives 13 x 30 = 390 logical executions. At three requests per execution, that is 390 x 3 = 1,170 model requests."
  },
  {
    "question": "One prompt on a DSPy custom engine requests three answers with the response cache off. Each engine request carries the same 120 input tokens. The trace lists start and finish times in milliseconds for requests A (0 to 9), B (10 to 16), and C (18 to 27). What can you report about this run?",
    "options": [
      "Three engine requests ran in sequence. Pricing the input requires the provider's usage records and rates.",
      "Three engine requests overlapped. Pricing the input requires the provider's usage records and rates.",
      "Three engine requests ran in sequence. The input charge covers 360 tokens at the uncached rate.",
      "One engine request returned three answers. The input charge covers 120 tokens at the uncached rate."
    ],
    "answer": "Three engine requests ran in sequence. Pricing the input requires the provider's usage records and rates.",
    "explanation": "The non-overlapping timestamps confirm three sequential requests carrying 3 x 120 = 360 logical input tokens, while actual billing depends on the provider's usage metering and caching rules."
  },
  {
    "question": "A reviewer opens a saved DSPy JSON file. The top-level API key is absent, but a demonstration contains a customer email and a nested Authorization header contains a secret. The team needs a shareable file and a score for the prompt it contains. Which plan gives them both?",
    "options": [
      "Replace the email in the saved demonstration and mask the header in evaluation logs. Reload and evaluate the edited file.",
      "Replace the email in the training row and remove the header from the saved JSON. Reload and evaluate the edited file.",
      "Evaluate the original file. Then replace the email in its saved demonstration and remove the nested header from the copy for release.",
      "Replace the email in the saved demonstration and remove the header from the saved JSON. Reload and evaluate that file."
    ],
    "answer": "Replace the email in the saved demonstration and remove the header from the saved JSON. Reload and evaluate that file.",
    "explanation": "Both the customer email and the nested header must be removed from the saved JSON artifact itself, and the edited artifact must be reloaded and evaluated so the reported score matches the shared prompt."
  },
  {
    "question": "A release will use a saved verifier with model R. On load, its predictor has model Q attached even when the global default is R. The dashboard reuses the name 'verifier' across builds. Which evaluation record ties a score to the intended prompt and model?",
    "options": [
      "Load the saved verifier, set the global default to R, and evaluate. Record the prompt digest, configured default, and score.",
      "Load the saved verifier, bind R to it, and evaluate. Record the prompt digest, effective model revision, and score.",
      "Load a baseline with an earlier instruction, bind R to it, and evaluate. Record the prompt digest, effective model revision, and score.",
      "Load the saved verifier, bind R to it, and evaluate. Record the dashboard name, evaluation date, and score."
    ],
    "answer": "Load the saved verifier, bind R to it, and evaluate. Record the prompt digest, effective model revision, and score.",
    "explanation": "Explicitly binding R via set_lm overrides the attached model Q, while recording the prompt digest and effective model revision uniquely identifies the evaluated pair."
  },
  {
    "question": "A frozen candidate's mean development score fell. Of 600 final queries, 200 required abstention, and the candidate answered 3 of those 200. The abstention limit allows unsupported answers on at most 1.5% of queries that require abstention. Which observed rate and decision should the reviewer record for this check?",
    "options": [
      "0.5%. The check passes.",
      "1.5%. The check fails.",
      "1.5%. The check passes.",
      "About 1.52%. The check fails."
    ],
    "answer": "1.5%. The check passes.",
    "explanation": "All 200 abstention-required queries form the denominator, giving 3 / 200 = 1.5%. Because the limit is inclusive ('at most 1.5%'), the candidate passes this check."
  }
]
```

> **Next:** Continue to [Model Versioning & Deployment](/learn/model-versioning-continuous-deployment). You'll package the compiled prompt state with its model pin, evaluation results, serving configuration, and previous known-good fallback so the live system matches the tested one.
