---
{
  "id": "programmatic-prompt-optimization-dspy",
  "slug": "programmatic-prompt-optimization-dspy",
  "title": "Prompt Optimization with DSPy",
  "shortDescription": "A keyword match can accept an answer that cites a paper without verifying the claim it states, so prompt search must separate the metric, the data splits, and the saved program.",
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

A RAG citation verifier reads one retrieved abstract: Paper `P-4412` reports perplexity 18.4 on WikiText-103 for Llama-3-8B. A user asks what MMLU accuracy that same paper reports for Llama-3-8B. Imagine a candidate confidently quoting `P-4412` and a keyword-matching evaluator accepting the response. Mentioning a paper ID does not verify that the paper supports the asked claim.

Searching against that evaluator can select unsupported answers. DSPy helps separate four concerns that a large prompt string might mix: task fields, execution flow, instructions, and demonstrations. The same four concerns can be structured by hand, and changing models does not automatically break every hand-written prompt.

<span data-glossary="dspy">DSPy</span> expresses LM applications as programs.[^khattab2023] Its prompt optimizers search instructions and demonstrations against an explicit metric while preserving the program's declared execution structure. Model outputs and optimizer search can remain stochastic. The experiment-tracking lesson showed how to record comparisons; here you'll inspect what compilation changes and which claims require a real evaluation.

We'll pin DSPy **3.4.0** (`dspy[optuna]==3.4.0`) so each example uses a fixed, inspectable interface.[^dspy340Release2026] The executable examples use real interfaces and DSPy's `DummyLM` test double without provider calls. They inspect wiring, demonstration filtering, and serialization rather than running an instruction search over live weights.

## Give the program a narrow job

Our verifier module, `CitationVerifier`, produces two fields: a `verdict` (`ANSWER` or `ABSTAIN`) and a supporting `source_id`. Choosing `ABSTAIN` requires an empty ID. It generates neither free-form prose nor external retrieval calls, leaving application-level verification checks and rendering to the caller.

A **signature** declares input and output fields alongside a concise docstring describing the task.[^dspySignatures2026] A **module** manages the execution flow across predictors. For a single inference step, `dspy.Predict` wraps the signature directly:

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

Field descriptions guide prompt rendering; they do not guarantee claim grounding or retrieval quality. In this version, `dspy.ChainOfThought` prepends an output named `reasoning`, even though its customization argument is called `rationale_field`.[^dspyCot340Source2026] Generated reasoning isn't proof of soundness. Extra output generally adds generation work, though latency depends on the actual serving system. Direct prediction avoids that extra field here.

## Optimize the behavior you actually need

Prompt search uses the evaluation metric as its objective. Rewarding persuasive but unsupported answers can favor the wrong candidates; an optimizer doesn't independently know which errors your metric missed.

Our metric checks reference `verdict` and `source_id` labels. A prediction scores `1.0` only when both match, and any wrong paper ID scores `0.0`. Each answerable example here has one acceptable source ID; tasks with several valid abstracts need a support-aware metric or a set of acceptable IDs rather than penalizing alternate valid citations:

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


checks = [
    ("supported claim", trainset[0], dspy.Prediction(verdict="ANSWER", source_id="P-4412")),
    ("wrong source", trainset[0], dspy.Prediction(verdict="ANSWER", source_id="P-9999")),
    ("unsupported claim", trainset[1], dspy.Prediction(verdict="ANSWER", source_id="P-4412")),
    ("justified abstention", trainset[1], dspy.Prediction(verdict="ABSTAIN", source_id="")),
    ("abstention with a source", trainset[1], dspy.Prediction(verdict="ABSTAIN", source_id="P-4412")),
]
scores = [citation_metric(example, prediction) for _, example, prediction in checks]
for (name, _, _), score in zip(checks, scores):
    print(f"{name}: {score:.1f}")
assert scores == [1.0, 0.0, 0.0, 1.0, 0.0]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
supported claim: 1.0
wrong source: 0.0
unsupported claim: 0.0
justified abstention: 1.0
abstention with a source: 0.0
```
<!-- leetllm: output:end -->

This metric accepts `example`, `prediction`, and optional `trace`. Bootstrapping passes the recorded predictor trace; ordinary evaluation can omit it. Test wrong and malformed predictions before spending compute on search. Matching reference labels still depends on those labels and retrieved abstracts being accurate.

```checkpoint
Why doesn't finding `P-4412` in both the abstract and the answer prove that the answer is supported?
---
The identifier only tells you which paper was mentioned, not whether that paper reports the metric in the question. `P-4412` reports WikiText-103 perplexity, not MMLU accuracy. The metric must verify answer grounding through trusted labels or a dedicated faithfulness evaluator.
```

Matching labels on the rows in front of you is not the same as transfer. Which examples may shape the prompt, and which have to stay unseen until every instruction is frozen?

## Keep examples for learning separate from examples for judging

Prompt tuning uses feedback from data. A practical separation is:

1. **Training split:** Holds raw labeled examples and acts as the seed pool for teacher bootstrapping.
2. **Validation split (development set):** Guides optimizer search, trial comparisons, and candidate selection.
3. **Held-out test split:** Stays completely untouched until all prompt instructions and demonstration sets are frozen.

Different query IDs can paraphrase questions over the same source document. Splitting those queries across training and test may inflate an estimate of transfer to unseen papers. Group paraphrases together when measuring transfer to unseen documents; use response-held-out splits when targeting a different evaluation dimension.

To measure unseen-document transfer, group rows into **source families** by paper ID or corpus cluster. This metadata check ensures declared families stay inside a single split, though it cannot discover semantic duplicates assigned distinct family IDs:

<!-- leetllm: test, output=show, id=dspy-splits -->
```python title="split-by-source-family.py"
def validate_group_splits(splits: dict[str, list[tuple[str, str]]]) -> None:
    if set(splits) != {"train", "validation", "test"}:
        raise ValueError("need train, validation, and test splits")
    owner = {}
    seen_queries = set()
    for split, rows in splits.items():
        if not rows:
            raise ValueError("each split must contain rows")
        for query_id, family in rows:
            if not query_id.strip() or not family.strip():
                raise ValueError("query and family IDs must be nonempty strings")
            if query_id in seen_queries:
                raise ValueError("query IDs must be unique across splits")
            seen_queries.add(query_id)
            if family in owner and owner[family] != split:
                raise ValueError(f"source family {family} appears in {owner[family]} and {split}")
            owner[family] = split


splits = {
    "train": [("q-001", "P-4412"), ("q-002", "P-4412")],
    "validation": [("q-101", "P-5501")],
    "test": [("q-201", "P-6601")],
}
validate_group_splits(splits)
print("Clean source-family split: passed")
leaked = {**splits, "test": [("q-999", "P-4412")]}
try:
    validate_group_splits(leaked)
except ValueError as error:
    print("Rejected:", error)
else:
    raise AssertionError("Source-family leakage was missed")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Clean source-family split: passed
Rejected: source family P-4412 appears in train and test
```
<!-- leetllm: output:end -->

Never look at test errors to manually patch your prompts, re-tune your metric, or restart search. Once test results influence your prompt choices, that test split becomes development data. True generalization estimates require a fresh, unpolluted holdout.

The splits decide which rows may teach. They don't yet say which of those rows will actually appear in the prompt.

## How a demonstration gets into the prompt

The simplest few-shot optimizer is `dspy.LabeledFewShot`. It copies labeled training examples directly into predictor demonstration slots without running model calls or scoring candidate quality.

Calling `.compile()` returns a new, independent module instance while leaving the original student untouched:

<!-- leetllm: test, output=show, continue=dspy-metric, id=dspy-labeled -->
```python title="compile-labeled-demonstrations.py"
labeled = dspy.LabeledFewShot(k=2).compile(student, trainset=trainset, sample=False)
print("Original demonstration count:", len(student.decide.demos))
print("Compiled demonstration count:", len(labeled.decide.demos))
print("Returned a separate program:", labeled is not student)
assert len(student.decide.demos) == 0
assert len(labeled.decide.demos) == 2
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Original demonstration count: 0
Compiled demonstration count: 2
Returned a separate program: True
```
<!-- leetllm: output:end -->

`dspy.BootstrapFewShot` runs a **teacher program** over training inputs and scores its final prediction, with the predictor trace available to the metric. The teacher can be a copy of the student using the configured LM; a separate stronger model is optional. Accepted recorded predictor steps become bootstrapped demonstrations. Depending on its limits, the compiled result may also include labeled examples.[^dspyBootstrap340Source2026]

With the binary metric and nonzero threshold `1.0` used below, filtering follows this path:

<figure>
  <img src="illustrations/_generated/bootstrap_trace_gate_dark.png" alt="A DSPy 3.4.0 DummyLM trace runs two teacher predictions. For WikiText-103 perplexity, ANSWER with P-4412 matches the label, scores 1.0, and enters the compiled demonstrations. For MMLU accuracy, the same prediction conflicts with ABSTAIN and an empty source ID, scores 0.0, and is discarded. The compiled verifier holds one demonstration while the original student holds zero. A separate constant 0.5 probe accepts both traces at threshold None or 0.0 and zero at threshold 1.0." />
  <figcaption>The local test double produces two teacher predictions. The binary metric keeps the WikiText-103 trace and rejects the MMLU trace at threshold 1.0. The constant 0.5 probe demonstrates why a zero threshold falls back to truthiness and accepts a bad demonstration.</figcaption>
</figure>

In a multi-stage program, labels may cover only the final answer. A passing final result can promote intermediate recorded steps into demonstrations. Review intermediate outputs for factual grounding and causal relevance, and account for trace coverage and demonstration limits.[^dspyBootstrap2026]

Watch the **truthiness trap**. In DSPy 3.4.0, an unset **or zero** `metric_threshold` falls back to the returned score's truthiness. A partial score of `0.5` will let a flawed demonstration pass; negative numbers and NaN are truthy as well. Without a metric, every successful teacher execution is accepted unchecked. Pair a sound metric with a nonzero threshold matched to its scale; `1.0` is the acceptance value for our binary scorer.[^dspyBootstrap340Source2026]

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
    metric=citation_metric, metric_threshold=1.0,
    max_bootstrapped_demos=2, max_labeled_demos=0, max_rounds=1,
)
# Suppress optimizer logging during compile; inspect results directly below.
with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
    with dspy.context(lm=teacher_lm):
        bootstrapped = bootstrap.compile(student, trainset=trainset)

demos = bootstrapped.decide.demos
print("Accepted demonstration count:", len(demos))
print("Accepted question:", demos[0].question)
print("Original demonstration count:", len(student.decide.demos))
assert len(demos) == 1
assert demos[0].question == trainset[0].question


def partial_score_demo_count(threshold):
    compiler = dspy.BootstrapFewShot(
        metric=lambda example, prediction, trace=None: 0.5,
        metric_threshold=threshold,
        max_bootstrapped_demos=2, max_labeled_demos=0, max_rounds=1,
    )
    lm = DummyLM([
        {"verdict": "ANSWER", "source_id": "P-4412"},
        {"verdict": "ANSWER", "source_id": "P-4412"},
    ])
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        with dspy.context(lm=lm):
            result = compiler.compile(student, trainset=trainset)
    return len(result.decide.demos)


for threshold in (None, 0.0, 1.0):
    print(f"Partial-score demos at threshold {threshold}: {partial_score_demo_count(threshold)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Accepted demonstration count: 1
Accepted question: What WikiText-103 perplexity does Paper P-4412 report for Llama-3-8B?
Original demonstration count: 0
Partial-score demos at threshold None: 2
Partial-score demos at threshold 0.0: 2
Partial-score demos at threshold 1.0: 0
```
<!-- leetllm: output:end -->

The first teacher prediction matched the WikiText-103 label and was accepted. The second teacher prediction returned `P-4412` for the unanswerable MMLU question, failed the metric, and was discarded.

```checkpoint
A metric awards 0.5 when the verdict is right but the cited source ID is wrong. Why can that be dangerous during bootstrapping?
---
Without an explicit nonzero threshold, a truthy partial score counts as success and turns an inaccurate teacher trace into a demonstration. Define what acceptance means, remembering that a strict threshold only helps when the metric itself catches the error.
```

## Search instructions as well as demonstrations

A single bootstrap pass produces one set of demonstrations. DSPy provides a family of optimizers tailored to different stages of complexity, compute budgets, and prompt search spaces:[^dspyOptimizers2026]

- **`BootstrapFewShot`:** Collects accepted predictor demonstrations up to its limits. `max_rounds` controls attempts per case; it can stop before visiting every case once enough demonstrations are collected.
- **`BootstrapFewShotWithRandomSearch` (BootstrapRS):** Generates candidate demonstration subsets and evaluates multiple combinations across validation data, selecting the highest-scoring set.
- **`COPRO`:** Searches predictor instructions and output prefixes using candidate evaluations and histories of attempted instructions/scores. Its `compile(..., trainset=...)` uses that argument as the development evaluation set; it doesn't automatically inspect detailed failure traces or reserve a final test.[^dspyCopro340Source2026]
- **`MIPROv2` (Multiprompt Instruction PRoposal Optimizer Version 2):** Jointly searches instructions and few-shot demonstration sets across multi-stage pipelines.[^opsahlong2024] It proposes diverse instruction candidates grounded in data and uses Bayesian optimization (Tree-structured Parzen Estimator via Optuna) to search the combinatorial prompt space.

These prompt optimizers leave the underlying model weights untouched. Let $\phi$ denote a prompt candidate (its instructions and demonstration sets). The optimizer seeks to maximize the empirical validation score:

$$
\widehat{M}_{\mathrm{val}}(\phi) = \frac{1}{n}\sum_{i=1}^{n} M\bigl(x_i, P_\phi(x_i)\bigr).
$$

Here $P_\phi(x_i)$ represents the DSPy program running candidate prompt $\phi$ on validation input $x_i$.

In DSPy 3.4.0, `auto="light"` chooses heuristic budgets. For manual control, use `auto=None`, constructor `num_candidates`, and compile-time `num_trials`. Proposal and task LMs can be passed explicitly or inherited from `dspy.configure(lm=...)` or an active context, and both roles can share the same LM.[^dspyMiproSource2026]

<!-- leetllm: test, output=show, continue=dspy-bootstrap, id=dspy-mipro -->
```python title="check-mipro-configuration-without-generation.py"
offline_lm = DummyLM([])
with dspy.context(lm=offline_lm):
    inherited = dspy.MIPROv2(metric=citation_metric, auto=None, num_candidates=4)
print("Default LM serves both roles:", inherited.prompt_model is offline_lm and inherited.task_model is offline_lm)
manual = dspy.MIPROv2(
    metric=citation_metric, auto=None, num_candidates=4,
    prompt_model=offline_lm, task_model=offline_lm,
)
try:
    manual.compile(student, trainset=trainset)
except ValueError as error:
    assert "num_trials" in str(error)
    print("Missing manual trial budget: rejected")
else:
    raise AssertionError("Missing num_trials was accepted")

# A full search requires configured LMs, a trial budget, and a dedicated validation set:
# compiled = manual.compile(student, trainset=trainset, valset=valset,
#                           num_trials=12, minibatch=False)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Default LM serves both roles: True
Missing manual trial budget: rejected
```
<!-- leetllm: output:end -->

For instruction-only MIPROv2 candidates, set both demonstration limits to zero and start with a student that has no existing demonstrations. Those settings don't erase demonstrations already attached to its predictors. MIPROv2 can still bootstrap examples internally to inform instruction proposals, even when its candidates contain no demos. Pass a reviewed `valset` when split membership matters. In this pinned version, omitting it takes roughly the last 80% of the training list (capped at 1,000) as validation, with at least one example. That positional split doesn't isolate source families or reserve a final test.[^dspyMiproSource2026]

GEPA reflects on recorded executions and feedback to propose revised predictor instructions.[^gepa2025] In the pinned DSPy interface its metric must accept five arguments: `gold`, `pred`, `trace`, `pred_name`, and `pred_trace`. It can return a scalar, which produces generic score feedback, or `dspy.Prediction(score=..., feedback=...)` for a useful task-specific critique. Our three-argument scorer needs an adapter. Version 3.4.0 also supports an optional `program_trace` argument for scoring a Flex submodule; it does not remove the five-argument signature. Reflection proposes instructions without verifying or repairing the model's underlying reasoning.[^dspyGepa340Source2026]

What happens when the candidate that wins validation is opened on rows the search never used?

## A validation winner can lose on test

Repeatedly selecting candidate prompts on a small validation set creates a risk of adapting to its noise or narrow phrasing. A winning validation score alone doesn't show how the candidate will perform on new cases.

Consider a concrete comparison: baseline passes 14/20 validation queries (70%) and `compiled_a` passes 19/20 (95%), so selection picks `compiled_a`. On the separate test set, baseline passes 16/20 (80%) and `compiled_a` passes 13/20 (65%). The script selects using validation before reading test scores:

<!-- leetllm: test, output=show, id=dspy-selection -->
```python title="select-before-opening-test-results.py"
validation = {"baseline": (14, 20), "compiled_a": (19, 20)}
test = {"baseline": (16, 20), "compiled_a": (13, 20)}

def rate(result: tuple[int, int]) -> float:
    correct, total = result
    if total <= 0 or not 0 <= correct <= total:
        raise ValueError("invalid evaluation counts")
    return correct / total

selected = max(validation, key=lambda name: rate(validation[name]))
print("Validation winner:", selected)
print(f"Candidate test score: {rate(test[selected]):.2f}")
print(f"Baseline test score: {rate(test['baseline']):.2f}")
print("Observed improvement:", rate(test[selected]) > rate(test["baseline"]))
assert selected == "compiled_a"
assert rate(test[selected]) < rate(test["baseline"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Validation winner: compiled_a
Candidate test score: 0.65
Baseline test score: 0.80
Observed improvement: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/optimizer_search_loop_dark.png" alt="Validation and test bar charts use identical zero to 100 percent axes while Baseline keeps blue and Compiled A keeps purple. Validation scores of 14/20 (70 percent) and 19/20 (95 percent) pick Compiled A with a 25 percentage-point lead, while held-out test scores of 16/20 (80 percent) and 13/20 (65 percent) reverse the ranking with a 15-point deficit for Compiled A." />
  <figcaption>Keep axis scales and candidate colors fixed across splits. Validation gives Compiled A a 25 percentage-point lead, whereas test gives it a 15-point deficit, calling for paired outcomes, relevant slices, and uncertainty analysis before attributing a cause.</figcaption>
</figure>

Repeated candidate selection can overfit noisy or narrow development data, and the search algorithm itself doesn't remove that risk. A test reversal can reflect sampling variation, distribution shift, or scoring flaws. Aggregate counts alone don't reveal the mechanism or confirm a real population difference; preserve paired per-case outcomes, relevant slices, and sampling uncertainty in a real comparison.

Group related cases according to the intended transfer dimension, review the scorer, and keep final evaluation separate from selection. Define critical abstention constraints separately from the mean score; a small overall gain never compensates for fabricating citations on unsupported queries.

```checkpoint
After seeing the candidate fail on test, you fix its prompt and repeatedly rerun the same test. Is the next score still an untouched estimate?
---
No. Test feedback is now guiding development, even if those rows never appear in `.compile()`. Keep the useful regression cases, but reserve fresh cases for the final comparison after the prompt and evaluation choices are frozen.
```

## Budget the full search across requests

Forty full candidate evaluations over 50 cases account for 2,000 logical program executions. In pinned MIPROv2, `num_trials=40, minibatch=False` also evaluates the default program before those trials: another 50, or **2,050** total before bootstrapping and instruction proposals.[^dspyMiproSource2026] Minibatching and periodic full evaluations change that accounting.

Program executions aren't billable requests. A program may call several predictors and a model-backed judge; caches may avoid calls, while retries may add them. Count actual calls, usage, and estimated spend across teacher, proposer, task, and judge roles.

Version 3.4.0 changes the LM execution layer. Its default `engine="auto"` prefers native lm15 for supported requests; eligible compatibility fallback chooses LiteLLM before inference. Authentication errors, timeouts, and provider failures do not trigger a backend switch. Record the engine choice alongside the model and artifact when comparing runs.[^dspy340Release2026]

The native and canonical custom-engine path implements `n` answers as separate sequential requests. Here one logical prompt requests two answers. This deterministic engine counts the actual calls; it contacts no provider and incurs no token bill:[^dspy340LmEngine2026]

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
            id=None, model=request.model,
            message=Message.assistant(f"answer {self.calls}"),
            finish_reason="stop", usage=Usage(),
        )

engine = CountingEngine()
lm = dspy.LM("custom/counting", engine=engine, cache=False)
answers = lm("One logical prompt", n=2)
print("Returned answers:", len(answers))
print("Engine requests:", engine.calls)
assert answers == ["answer 1", "answer 2"]
assert engine.calls == 2
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Returned answers: 2
Engine requests: 2
```
<!-- leetllm: output:end -->

A real provider may bill the input twice on this path. LiteLLM can use its backend's native `n` behavior, which still requires provider-specific token accounting. Because DSPy's response cache is disabled here, the two calls measure exact engine requests rather than provider billing.

Enforce hard spending and latency caps outside DSPy. Track proposal-model token usage separately from task-model usage.

Suppose extra demonstrations add 2,500 logical input tokens to each request. At 100 requests/s, that is 250,000 extra logical input tokens/s. Billable uncached tokens, dollar spend, and first-token latency still depend on caching, rate cards, batching, and serving conditions, so measure task quality, actual usage, latency, and versioned cost estimates together.

Record random seeds, resolved model revisions when available, generation settings, cache settings, dependencies, and dataset and scorer versions. Mutable model aliases can silently point to changing weights, and even with `temperature=0`, backend updates and cached results can shift outputs. Store repeated trials alongside their configuration metadata.

Recorded settings still don't serve themselves. After the prompt is frozen, which file do you load, and which model actually answers?

## Save the prompt state and control the runtime model

Export the compiled prompt by calling `program.save("compiled.json")`. To restore, instantiate the matching Python module class and call `program.load("compiled.json")`. The JSON file stores the optimized instructions, extracted few-shot demonstrations, signature metadata, and model settings.[^dspySerialization2026]

Watch the **attached LM precedence trap**. Predictors retain their attached language model from compilation. If a saved artifact includes an attached model, configuring a new global default with `dspy.settings.configure(lm=...)` or `with dspy.context(lm=...)` won't override it. Call `program.set_lm(runtime_lm)` on the loaded program to bind the production model:

<!-- leetllm: test, output=show, continue=dspy-mipro, id=dspy-save -->
```python title="round-trip-real-dspy-state.py"
from pathlib import Path
from tempfile import TemporaryDirectory

saved_lm = dspy.LM(
    "openai/eval-model-a", api_key="unused-key", temperature=0,
    extra_headers={"X-Eval-Header": "trace-tag"},
)
runtime_lm = dspy.LM("openai/eval-model-b", temperature=0)
labeled.set_lm(saved_lm)

with TemporaryDirectory() as directory:
    artifact = Path(directory) / "compiled.json"
    labeled.save(artifact)
    restored = CitationVerifier()
    restored.load(artifact)
    with dspy.context(lm=runtime_lm):
        print("Attached model after load:", restored.get_lm().model)
    print("Restored demonstrations:", len(restored.decide.demos))
    print("Top-level API key serialized:", "unused-key" in artifact.read_text())
    print("Nested header string serialized:", "trace-tag" in artifact.read_text())
    assert restored.get_lm().model == "openai/eval-model-a"
    assert "unused-key" not in artifact.read_text()
    restored.set_lm(runtime_lm)
    print("Attached model after override:", restored.get_lm().model)
    assert restored.get_lm() is runtime_lm
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Attached model after load: openai/eval-model-a
Restored demonstrations: 2
Top-level API key serialized: False
Nested header string serialized: True
Attached model after override: openai/eval-model-b
```
<!-- leetllm: output:end -->

DSPy's serializer strips the top-level `api_key` entry, yet it does not recursively sanitize arbitrary configuration: the `X-Eval-Header` value above survives in JSON, and demonstrations, instructions, and custom LM config fields can also carry sensitive strings. Inspect the complete artifact before sharing it.[^dspySerialization2026]

Whole-program persistence with `save_program=True` uses `cloudpickle`. Loading an untrusted pickle can execute code, so verify file origin and integrity before loading it. State-only JSON avoids pickle deserialization, though it still depends on a compatible, reviewed Python program, matching dependency versions, and the intended runtime model.

<figure>
  <img src="illustrations/_generated/compile_deploy_loop_dark.png" alt="A LabeledFewShot serialization pass saves two demonstrations and attached eval-model-a in compiled.json. Loading state into CitationVerifier restores both demonstrations and model A. Setting the global context to eval-model-b leaves model A attached; calling set_lm(runtime_lm) binds model B. Always re-evaluate the updated artifact-model pair, and run application-level citation checks before showing verified answers to users." />
  <figcaption>Loading saved JSON restores both demonstrations and the attached eval-model-a. Setting a global eval-model-b leaves that attachment intact until set_lm explicitly binds model B. Re-evaluate any updated artifact-model pair and enforce citation checks in the host application.</figcaption>
</figure>

Attach a release manifest identifying code and artifact digests, DSPy and dependency versions, the effective model and configuration, dataset and scorer versions, evaluation results, and a verified rollback target. A digest identifies exact bytes without replacing explicit release checks. Re-evaluate any changed model-artifact pair before shipping, and manage benchmark refreshes so test results never leak into prompt tuning.

The signature, the metric, the demonstration filter, and the saved prompt are separate from the model that will run them. The served system matches the test only when that exact combination is the one the holdout evaluated.

```checkpoint
In pinned DSPy 3.4.0, a bootstrap scorer returns −0.2 for a bad example and metric_threshold is 0.0. Which behavior exposes the truthiness trap?
---
The negative score passes the filter; a zero threshold uses the score’s truthiness.

This implementation treats threshold 0.0 like an unset threshold and uses the score’s truthiness. Python treats a nonzero negative float as true, so the bad trace can be accepted. A meaningful nonzero threshold still depends on a metric that detects the actual error.
```

```checkpoint
A student already has three attached demonstrations. A team sets both MIPRO demonstration limits to zero and wants candidates with no demonstrations. What additional step is needed?
---
Start from a student with no attached demos and keep both limits at zero.

Zero candidate limits do not erase demonstrations already present in copied predictor state. Start with no attached demos as well. Candidate counts and test membership do not clear those slots, and internal bootstrap work may still inform proposals.
```

```mastery-quiz
[
  {
    "question": "A DSPy verifier needs three changes. Add source_id to a predictor’s declared outputs, run the evidence predictor before the verifying predictor, and award a point when the final verdict and source ID both match the label. Which components own those changes, in order?",
    "options": [
      "Signature, module, metric.",
      "Module, signature, metric.",
      "Signature, metric, module.",
      "Metric, module, signature."
    ],
    "answer": "Signature, module, metric.",
    "explanation": "The signature declares source_id. The module calls the two predictors in order. The metric compares the final fields with the label. Swapping the signature and module confuses a field declaration with a call. Using the metric for call order or field declarations gives the scorer a job that belongs to the program it evaluates."
  },
  {
    "question": "For two benchmark queries, retrieval returns Paper P14 first and Paper P26 second. Both reviewed labels specify ANSWER with P26. For the first query, the verifier returns ANSWER with P26. For the second query, it returns ANSWER with P14. The metric awards 1 when the verifier’s verdict and source ID both match the reviewed label and 0 otherwise. What scores do the first and second queries earn, in that order?",
    "options": [
      "(0, 0)",
      "(0, 1)",
      "(1, 0)",
      "(1, 1)"
    ],
    "answer": "(1, 0)",
    "explanation": "The first query earns 1 because ANSWER and P26 both match its label. The second query earns 0 because the verifier cites P14 where the label requires P26. Checking only the verdicts gives (1, 1). Grading the first retrieval result against each label gives (0, 0). Using that first result as the expected source for each reply gives (0, 1)."
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
    "explanation": "The query IDs differ, and F4 and F9 are distinct family IDs, so the pair passes. Predicting a failure treats the shared theorem citation as a family ID. Both queries ask about the same implication of Theorem 6. Counting Q53 as an unseen-theorem case mistakes a new query or family label for a new underlying theorem."
  },
  {
    "question": "A corpus FAQ states that lab lockers are reserved only for enrolled students. Asked about alumni access, a teacher’s reader writes “Alumni qualify for lockers.” Its verifier reads that note and returns ABSTAIN with an empty source ID. BootstrapFewShot records both calls and has room for both demonstrations. The final pair matches the label, so the run passes. What can each predictor receive as a demonstration, and what does the passing score verify?",
    "options": [
      "Only the verifier can receive a demonstration because only its output has a label. The alumni claim still needs a grounding check.",
      "The reader can get the note as an output and the verifier can get it as an input. The final score validates the alumni claim in both.",
      "The reader can get the note as an output and the verifier can get it as an input. The alumni claim still needs a grounding check.",
      "The reader and verifier can both receive demonstrations with a corrected note. The final abstention corrects the alumni claim."
    ],
    "answer": "The reader can get the note as an output and the verifier can get it as an input. The alumni claim still needs a grounding check.",
    "explanation": "The first predictor can get an example that teaches it to write the false note. The second can get an example that pairs that same note with the correct abstention. A final-pair score can accept both recorded steps without a separate label for the note. The score neither checks the claim against the student-only rule nor rewrites it."
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
    "explanation": "Each predictor has 2×2=4 configurations. Choosing independently for three predictors gives 4³=64. Adding configurations or counting only instructions omits the joint choices; a finite trial budget does not need to inspect the whole space."
  },
  {
    "question": "A full-evaluation search runs 12 trials over 30 cases and evaluates one default baseline first. Each program execution has two predictor requests and one judge request. Assume no cache hits or retries and exclude teacher/proposer work. Which pair is correct?",
    "options": [
      "360 logical executions; 1,080 requests.",
      "390 logical executions; 390 requests.",
      "360 logical executions; 1,170 requests.",
      "390 logical executions; 1,170 requests."
    ],
    "answer": "390 logical executions; 1,170 requests.",
    "explanation": "The baseline plus 12 trials gives 13×30=390 logical executions. Each makes three requests, so 390×3=1,170. Teacher and proposer work remain additional. Logical executions and requests are distinct units."
  },
  {
    "question": "One prompt on a DSPy 3.4.0 custom engine requests three answers with the response cache off. Each engine request carries the same 120 input tokens. The trace lists start and finish times in milliseconds for requests A (0 to 9), B (10 to 16), and C (18 to 27). What can you report about this run?",
    "options": [
      "Three engine requests ran in sequence. Pricing the input requires the provider’s usage records and rates.",
      "Three engine requests overlapped. Pricing the input requires the provider’s usage records and rates.",
      "Three engine requests ran in sequence. The input charge covers 360 tokens at the uncached rate.",
      "One engine request returned three answers. The input charge covers 120 tokens at the uncached rate."
    ],
    "answer": "Three engine requests ran in sequence. Pricing the input requires the provider’s usage records and rates.",
    "explanation": "The three request IDs count three calls. A finished before B started, and B finished before C started. The calls carried 3 × 120 = 360 logical input tokens. Disabling the DSPy response cache does not tell you how the provider meters repeated input. Counting one prompt would also miss two engine calls."
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
    "explanation": "The saved demo and nested header each carry a value that must come out of the shared file. Masking logs leaves the header in the file. Editing the training row leaves its compiled copy intact. Replacing the email changes what the model sees, so the score must come from the edited prompt."
  },
  {
    "question": "A release will use a saved verifier with model R. On load, its predictor has model Q attached even when the global default is R. The dashboard reuses the name “verifier” across builds. Which evaluation record ties a score to the intended prompt and model?",
    "options": [
      "Load the saved verifier, set the global default to R, and evaluate. Record the prompt digest, configured default, and score.",
      "Load the saved verifier, bind R to it, and evaluate. Record the prompt digest, effective model revision, and score.",
      "Load a baseline with an earlier instruction, bind R to it, and evaluate. Record the prompt digest, effective model revision, and score.",
      "Load the saved verifier, bind R to it, and evaluate. Record the dashboard name, evaluation date, and score."
    ],
    "answer": "Load the saved verifier, bind R to it, and evaluate. Record the prompt digest, effective model revision, and score.",
    "explanation": "Binding R to the restored program makes its predictors use R. The digest identifies the saved prompt, and the effective model revision identifies what ran. Changing the default leaves Q attached. Testing the baseline uses another prompt. A reused dashboard name and a date do not identify the evaluated pair."
  },
  {
    "question": "A frozen candidate’s mean development score fell. Of 600 final queries, 200 required abstention, and the candidate answered 3 of those 200. The abstention limit allows unsupported answers on at most 1.5% of queries that require abstention. Which observed rate and decision should the reviewer record for this check?",
    "options": [
      "0.5%. The check passes.",
      "1.5%. The check fails.",
      "1.5%. The check passes.",
      "About 1.52%. The check fails."
    ],
    "answer": "1.5%. The check passes.",
    "explanation": "All 200 queries that required abstention belong in the denominator, including the three failures. The observed rate is 100 × 3/200 = 1.5%. The limit includes equality, so the candidate passes this check even though its development mean fell. Dividing by all 600 queries gives 0.5%. Dividing by the 197 correct abstentions gives about 1.52%."
  }
]
```

> **Next:** Continue to [Model Versioning & Deployment](/learn/model-versioning-continuous-deployment). You'll package the compiled prompt state with its model pin, evaluation results, serving configuration, and rollback target so the live system matches the tested one.
