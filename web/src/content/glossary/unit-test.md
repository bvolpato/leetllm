---
title: Unit test
importance: 66
---
A **unit test** checks a small unit of behavior against its schema, with controlled dependencies and a clear pass/fail assertion. Reliable unit tests aim for reproducibility; they can still test stochastic or concurrent code using controlled randomness, schedules, or explicit statistical expectations. The unit under test is usually a pure function, a class method, a parser, a schema validator, or a scoring helper. In the examples here, live models, networks, databases, clocks, and shared mutable state stay out of the path unless replaced by stubs or [test cases](glossary://fixture).

Classical software engineering (IEEE Std 1008 and common practice) treats unit testing as systematic verification of a designed unit against its specification. In AI/ML systems the same idea applies to the *deterministic shell* around models: tokenization, packing, routing, tool-argument validation, ACL filters, cache keys, retry classification, and reward checkers. Model quality still needs [offline evaluation](glossary://offline-evaluation) and [eval gates](glossary://eval-gate). Unit tests earn trust for the code those evals and production paths call.

## Intuition

Three layers people often mix:

| Layer | Question it answers | Typical signal |
| --- | --- | --- |
| **Unit test** | Does this function honor its schema on known inputs? | Fast, binary, local |
| **Integration / smoke** | Does the path across services start and connect? | Real or staged deps, still mostly deterministic |
| **Model / product eval** | Does the system behave well on a distribution of cases? | Scores, slices, judges, latency, cost |

Unit tests are cheap and precise. They catch the bug where `json.loads` fails on trailing commas, where an empty retrieval list returns `None` instead of `[]`, or where a score normalizer divides by zero. Offline evaluations measure model helpfulness, safety, and calibration. Eval gates can block release when those results miss their thresholds. A green unit suite can coexist with a broken prompt or bad index.

For coding models and agents, unit tests also become the **oracle**: HumanEval-style benches (Chen et al., 2021) grade functional correctness by running hidden unit tests; [SWE-bench](glossary://swe-bench) resolves issues when `FAIL_TO_PASS` and `PASS_TO_PASS` suites pass; [RLVR](glossary://rlvr) can use pass/fail as a verifiable reward.

## How it works

A solid unit test follows a small loop:

1. **Arrange.** Build fixed inputs and any stubs (mock clock, fake retriever, canned tool responses). Prefer pure sample datasets over ambient environment.
2. **Act.** Call one unit: one function, one method, one pure transform.
3. **Assert.** Check one primary outcome (and maybe a few tightly related edge properties). Failure should name a single schema break.
4. **Isolate.** No live HTTP, no production DB, no unseeded RNG, no wall-clock `datetime.now()` unless [injected](glossary://injected-now).

In Python this is usually `pytest` or `unittest`. Isolation comes from dependency injection, monkeypatching, and test cases, not from hoping production modules stay quiet.

A useful mental model for pass/fail over a suite of $n$ unit cases:

$$
\mathrm{PassRate} = \frac{1}{n}\sum_{i=1}^{n} \mathbf{1}[\mathrm{assert}_i(\mathrm{unit}(x_i)) = \mathrm{pass}]
$$

For CI gates the operational rule is stricter: every required case must pass (rate $= 1$), or the change does not merge. Flaky non-determinism breaks that schema; pytest documents flakiness as uncontrolled system state, order dependence, or overly strict timing/float assertions.

## Example

Tool-call argument validation before any model or network call. The unit under test is pure: schema + payload in, accept/reject out.

```python
from jsonschema import Draft202012Validator

TOOL_SCHEMA = {
    "type": "object",
    "properties": {
        "suite_id": {"type": "string", "minLength": 1},
        "model_id": {"type": "string", "minLength": 1},
        "max_samples": {"type": "integer", "minimum": 1, "maximum": 1000},
    },
    "required": ["suite_id", "model_id"],
    "additionalProperties": False,
}

validator = Draft202012Validator(TOOL_SCHEMA)

def validate_tool_args(payload: dict) -> list[str]:
    return [e.message for e in validator.iter_errors(payload)]

def test_rejects_missing_model_id():
    errors = validate_tool_args({"suite_id": "rag-grounding-v3"})
    assert any("model_id" in e for e in errors)

def test_accepts_minimal_valid_payload():
    assert validate_tool_args(
        {"suite_id": "rag-grounding-v3", "model_id": "candidate-7b"}
    ) == []

def test_rejects_unknown_field():
    errors = validate_tool_args(
        {"suite_id": "rag-grounding-v3", "model_id": "candidate-7b", "note": "extra"}
    )
    assert errors  # additionalProperties: false
```

These three cases never call an LLM. They still prevent a common production failure: the model emits almost-valid JSON, the gateway forwards it, and an eval job starts with the wrong or missing model. Pair this with a separate [JSON Schema](glossary://json-schema) schema for the wire format and an [eval harness](glossary://eval-harness) for whether the model *chooses* the right tool.

A second, coding-bench style unit: the generated function is the artifact; the unit tests are the grader (often [hidden](glossary://hidden-tests)):

```python
def has_close_elements(numbers: list[float], threshold: float) -> bool:
    """Return True if any two values differ by less than threshold."""
    ...

def test_close_pair():
    assert has_close_elements([1.0, 2.0, 3.0], 0.5) is False
    assert has_close_elements([1.0, 2.8, 3.0], 0.3) is True
```

Aggregate coding metrics such as [pass@k](glossary://pass-at-k) count how often samples pass the full unit suite, not how similar the source looks to a reference solution.

| Check | Result controls |
| --- | --- |
| Unit assertions | Deterministic CI pass or failure |
| Evals and judges | Quality gate over a distribution |
| RLVR verifier | Training reward or policy update |

## What belongs in unit tests

Good targets in LLM products:

- Prompt template rendering and required variable presence
- Tokenizer edge cases (`[UNK]`, empty string, emoji, long ids)
- chunk delimiter and overlap math
- [JSON Schema](glossary://json-schema) / Pydantic validation of tool args and structured outputs
- ACL and tenant filters on retrieval results
- Cache key construction (include model id, prompt version, corpus version)
- Retry classification (which errors are transient)
- Score aggregation, normalization, and tie-breaking
- Budget packing and token counting helpers
- Reward or verifier functions used in [RLVR](glossary://rlvr)

Keep each test about **one behavior** and **one reason to fail**. Edge cases that matter: empty input, duplicate ids, stale timestamps, invalid schema, max-length partitions, and Unicode normalization. If the test case becomes a multi-service product scenario, move it to integration, [smoke tests](glossary://smoke-test), or a [regression suite](glossary://regression-suite).

## Debug path

When a unit test is flaky or hard to trust:

1. **Remove time.** Inject a fixed clock; ban raw `time.time()` in the unit path.
2. **Remove network and disk.** Stub clients; use in-memory fakes.
3. **Remove randomness.** Seed RNGs or replace them; do not unit-test temperature sampling.
4. **Remove live models.** Unit-test the post-processor with a frozen model output test case.
5. **Remove shared state.** No global caches without reset; no order-dependent suite files.
6. **Relax only genuine noise.** Use approximate float compares where IEEE rounding is real; do not hide logic bugs.

pytest's guidance matches practice: flakes often mean uncontrolled state. A flaky check can still be a unit test, but its failures are poor evidence until the nondeterminism is understood. Control the source, quarantine temporarily, or move genuinely cross-system checks to integration with appropriate expectations.

## Trade-offs

| Choice | Gain | Cost |
| --- | --- | --- |
| Many pure unit tests | Fast CI, precise failures, safe refactors | Miss cross-service and model-behavior bugs |
| Heavy mocking | Full isolation | Tests can pass while real adapters disagree with mocks |
| Thin public tests only | Easy demos | Coding models overfit samples; production edges fail |
| Unit suite as sole release gate | Cheap green builds | Prompt/model regressions ship undetected |
| Unit tests as RLVR reward | Scalable training signal | Reward hacking if the suite is thin or public |

Unit tests and model evals are complements. Unit tests protect invariants. Evals measure behavior under distribution shift, judges, and product policy. Coding agents need both: unit oracles for functional correctness, and separate review for security, maintainability, and underspecified requirements (SWE-bench Verified documents how narrow or misaligned unit oracles reject valid patches).

## Why it matters here

LeetLLM lessons and production LLM systems share a lot of deterministic machinery: parsers, schemas, retrieval filters, packing, and verifiers. Unit tests catch those bugs before expensive model calls, before [eval gates](glossary://eval-gate), and before users see them. For code generation, unit tests *are* the functional truth signal behind HumanEval, [pass@k](glossary://pass-at-k), [SWE-bench](glossary://swe-bench) resolve rates, interview hidden suites, and [RLVR](glossary://rlvr) rewards. Thin or flaky units inflate leaderboards and ship broken shells; solid units keep the model layer focused on model failures.

## Related terms

- [test case](glossary://fixture)
- [Hidden tests](glossary://hidden-tests)
- [Regression suite](glossary://regression-suite)
- [pass@k](glossary://pass-at-k)
- [JSON Schema](glossary://json-schema)
