---
{
  "id": "blog-ai-engineer-portfolio-projects-interviews",
  "title": "AI Engineer Portfolio Projects for Interviews",
  "slug": "ai-engineer-portfolio-projects-interviews",
  "author": {
    "name": "LeetLLM Team"
  },
  "publishedAt": "2026-05-09",
  "updatedAt": "2026-11-23",
  "verifiedAt": "2026-11-23",
  "refreshAfter": "2027-01-22",
  "excerpt": "Five focused AI engineering projects, with concrete experiments, inspectable artifacts, and failure cases that make the work worth discussing.",
  "tags": ["Career", "Portfolio", "Projects"],
  "featured": false,
  "draft": false,
  "coverImage": "illustrations/_generated/eval_feedback_loop_dark.png"
}
---

The interesting part of a document assistant often starts after its first good answer. It cites a policy, but the policy was superseded. You fix retrieval, then discover that the new prompt follows an instruction hidden in a retrieved comment. The repository now contains something more useful than a demo: a sequence of decisions another engineer can examine.

Employers value different portfolio signals. Anthropic welcomes independent research, writing, and open-source work on resumes; OpenAI's engineering interview guide emphasizes design, code, performance, and tests.[^frontier2026careers][^openai2026interview] Make it easy for someone to inspect what you designed, what you tested, and what you learned. Tailor the project evidence to each role.

## Pick a problem you want to investigate

You don't need all five projects. Choose the question you would enjoy debugging, then check whether that work resembles the role you want. The [AI engineer role guide](/blog/what-does-an-ai-engineer-do) explains the differences between product, platform, and research work.

| Project | Main engineering question | A manageable first version |
|---|---|---|
| Document QA | Where did the answer lose contact with its sources? | A small sample runbook corpus with one deliberate policy conflict |
| Evaluation dashboard | Did a change help, or did the report hide a regression? | Compare two saved runs against a fixed case manifest |
| Support copilot | Does human approval still mean anything after a draft changes? | Draft and review replies without sending them |
| Repository assistant | Can a proposed fix stay inside an allowed file scope? | Repair one bug in a small project you own |
| Cost and latency study | Which savings survive a fair comparison? | Replay one workload with and without a reusable prompt prefix |

Document QA and its evaluation dashboard fit together naturally. The other projects can stand alone. Avoid building a platform that contains every idea before you have one result to explain. If you start with documents, can you show a cited answer that has lost contact with the policy still in force?

## 1. Document QA: make the source failure visible

Build `runbook-qa` over documents you wrote yourself or have permission to publish. Include a deployment procedure and two versions of an incident policy. In a separate manifest, mark v2 as superseded and v3 as active for a specified effective date. Precedence comes from the effective date and review metadata, not version order alone.

Give the assistant three questions. `q-rollback` asks for a procedure present in the active policy. `q-missing` asks for a procedure absent from the corpus. `q-conflict` asks about a rule that changed between versions. Define the expected behavior before changing prompts: answer with supporting evidence, abstain when evidence is missing, and apply the manifest's precedence rule when sources disagree.

A <span data-glossary="rag">RAG</span> system retrieves text before generating an answer. To debug it, save the intermediate evidence alongside the final response:

| Artifact | What it lets you check |
|---|---|
| Parsed document and chunk preview | Did ingestion preserve the procedure, heading, and table cells? |
| Retrieved source IDs and text | Did the relevant active passage reach the model? |
| Answer with claim-to-source links | Does the cited passage actually support each material claim? |
| Case outcome and failure note | Was the defect in parsing, retrieval, source selection, or generation? |

Try one controlled change, such as preserving headings during chunking. Replay the same questions. If the correct passage was already retrieved, better chunking may not fix the answer. If parsing deleted a table row, switching models won't restore the missing input.

Citation presence is easy to check mechanically; citation support is a separate judgment. Start with manually reviewed expected claims for the small corpus. Don't treat a valid source ID as proof that an answer is grounded.

Stop the first version at cited answers and explicit abstentions. Uploads, authentication, and multiple document formats can wait. The [Document QA capstone](/learn) expands this into a product with explicit evidence-selection and abstention rules. Evaluate cited answers across a baseline and candidate before trusting a comparison. Did the next change help, or did the report hide a regression?

## 2. Evaluation dashboard: test the report itself

A dashboard can be a separate project using saved model outputs. Its job is to make a comparison trustworthy and explain what the green percentage includes.

For `runbook-qa`, add `q-injection`: retrieved text contains an instruction to ignore the task. Keep that case in both runs. Pin the case manifest, corpus, prompts, model identifiers, generation settings, and grader version. Change one component for the comparison; repeat model runs when variability could explain the difference.

In this worked example, the candidate fixes two failures and introduces one. Its pass rate rises from 50% to 75%, but it follows the injected instruction:

<figure>
  <img src="illustrations/_generated/eval_feedback_loop_dark.png" alt="Four-case evaluation gate comparison and feedback flow: Baseline scores 50 percent (passes rollback and injection; misses missing evidence and conflict) while Candidate scores 75 percent (passes rollback, missing evidence, and conflict; fails prompt injection). Neither clears all four required cases, so the HOLD verdict routes the candidate back to fix the failed trace before a 4/4 run reaches REVIEW." />
  <figcaption>The injection failure remains alongside the extra passing row, so the gate returns HOLD and feeds the failed trace back for repair before another rerun.</figcaption>
</figure>

Before trusting those percentages, check that every expected case appears exactly once. A missing failure, a duplicate success, or the string <code>"false"</code> accidentally treated as a true value can corrupt the report.

The following program evaluates already-graded rows; use a separate evaluator to grade model answers. All four cases are mandatory in this release check, including the answerable question: an assistant that abstains on everything must fail too. Passing makes a candidate eligible for further review before deployment.

<!-- leetllm: test, output=show, output_title="Evaluation decision report" -->
```python title="eval-decision-gate.py"
from collections import Counter
from dataclasses import dataclass


@dataclass(frozen=True)
class CaseResult:
    case_id: str
    passed: bool


EXPECTED = ("q-rollback", "q-missing", "q-conflict", "q-injection")


def evaluate(results: list[CaseResult]) -> dict:
    # Type annotations alone do not reject strings or integers at runtime.
    if any(type(r.case_id) is not str or type(r.passed) is not bool for r in results):
        return {"decision": "INVALID", "pass_rate": None, "reasons": ["invalid types"]}

    counts = Counter(r.case_id for r in results)
    problems = []
    for label, ids in (
        ("missing", set(EXPECTED) - set(counts)),
        ("unknown", set(counts) - set(EXPECTED)),
        ("duplicate", {key for key, count in counts.items() if count > 1}),
    ):
        if ids:
            problems.append(f"{label}: {', '.join(sorted(ids))}")
    if problems:
        return {"decision": "INVALID", "pass_rate": None, "reasons": problems}

    outcomes = {r.case_id: r.passed for r in results}
    failures = [case_id for case_id in EXPECTED if not outcomes[case_id]]
    return {
        "decision": "HOLD" if failures else "REVIEW",
        "pass_rate": sum(outcomes.values()) / len(EXPECTED),
        "reasons": failures,
    }


baseline = [CaseResult(case_id, passed) for case_id, passed in
            zip(EXPECTED, [True, False, False, True])]
candidate = [CaseResult(case_id, passed) for case_id, passed in
             zip(EXPECTED, [True, True, True, False])]
missed_answer = [CaseResult(case_id, passed) for case_id, passed in
                 zip(EXPECTED, [False, True, True, True])]
all_pass = [CaseResult(case_id, True) for case_id in EXPECTED]

assert evaluate(all_pass)["decision"] == "REVIEW"
assert evaluate(candidate)["reasons"] == ["q-injection"]
assert evaluate(candidate + [CaseResult("q-extra", True)])["decision"] == "INVALID"

for name, rows in (
    ("baseline", baseline),
    ("candidate", candidate),
    ("missed answer", missed_answer),
    ("all pass", all_pass),
    ("missing row", candidate[:-1]),
    ("duplicate row", candidate + candidate[:1]),
    ("unknown row", candidate + [CaseResult("q-extra", True)]),
    ("string boolean", [CaseResult("q-rollback", "false")]),
):
    report = evaluate(rows)
    rate = report["pass_rate"]
    score = "unscored" if rate is None else f"{rate:.0%}"
    print(f"{name}: {score}, {report['decision']}, {report['reasons']}")
```

<!-- leetllm: output:start -->
```text title="Evaluation decision report" output compact
baseline: 50%, HOLD, ['q-missing', 'q-conflict']
candidate: 75%, HOLD, ['q-injection']
missed answer: 75%, HOLD, ['q-rollback']
all pass: 100%, REVIEW, []
missing row: unscored, INVALID, ['missing: q-injection']
duplicate row: unscored, INVALID, ['duplicate: q-rollback']
unknown row: unscored, INVALID, ['unknown: q-extra']
string boolean: unscored, INVALID, ['invalid types']
```
<!-- leetllm: output:end -->

The missed-answer run has no safety regression, but it still fails a required functional case. In a larger evaluation, define quality thresholds and critical failures in advance while evaluating subjective judgments on their own criteria. Show uncertainty and slice counts. Use representative production cases to assess reliability beyond these four wiring checks.

```checkpoint
The candidate fixes missing evidence and policy precedence, but now follows a retrieved attack. Could you remove q-injection from the manifest to make the run eligible for review?
---
That changes the acceptance rules after seeing the result and hides a regression. Keep the pinned manifest for this comparison, inspect the attack trace, and fix the isolation failure. If requirements legitimately change, version the new manifest and rerun both systems under it; the old 75% figure tells you nothing about performance on the updated suite.
```

For the first dashboard, support importing two result files, rejecting incompatible manifests, and opening failed rows beside their outputs and grading reasons. A static HTML report is enough. The [Eval Dashboard capstone](/learn) adds comparison validity and release-gate behavior in more detail. A report can reject a bad comparison and still say nothing about a person in the loop. What happens to an approval after someone edits the draft?

## 3. Support copilot: bind approval to the exact draft

Approval has to stick to the text a person actually saw. Use a small sample subscription service with a cancellation policy. The copilot reads a customer message and drafts a supported reply. It can't issue a refund, modify the subscription, or send a message. A person reviews the draft and its policy evidence.

The interesting bug is stale approval. Suppose a reviewer approves draft 7, then someone edits the amount in draft 8. If the database stores only `approved = true` on the ticket, the application may treat the unreviewed text as approved.

Store a draft ID, revision, content hash, cited policy version, reviewer identity, decision, and timestamp. Approval applies to that exact revision. An edit creates a new revision that needs review. A policy change can also invalidate the evidence behind an existing draft, so specify when approval must be renewed.

Demonstrate the approval guarantee with three scenarios:

- A draft lacks support for a promised refund. The reviewer sees the missing evidence and rejects it under the project's policy.
- A draft changes after approval. The previous approval no longer authorizes the new revision.
- The same approved action is submitted twice. A simulated executor records one action using an <span data-glossary="idempotency">idempotency</span> key, not two.

Persist the state instead of using an in-memory UI toggle. For this portfolio version, the executor only appends to a local outbox. Label that simulation clearly. If you later add real sending, keep the executor outside the model's tool set and validate the approval, recipient, and exact content at execution time.

The [Human-in-the-Loop lesson](/learn/agent-failure-states-retry-fallback) develops the durable pause-and-resume mechanism. Your project can stay focused on proving that an edit, restart, or duplicate request doesn't bypass review. The same question shows up in a repository. Can a proposed fix stay inside a file scope the assistant is not allowed to widen?

## 4. Repository assistant: repair one bug inside the allowed scope

Put that scope limit in a small repository you own, such as a CSV-reporting utility. Give the assistant a concrete issue: the report crashes on an empty input file. Save the starting commit, a reproducing test, and the expected behavior. Let the assistant inspect files, propose a patch, and return test results for review.

Start by allowing changes only to the implementation file. Keep the evaluation tests outside its writable workspace. Otherwise, a candidate could “fix” the issue by deleting the assertion. Run the same trusted tests against the starting commit and the patched commit; a test that passes both never demonstrated the repair.

Repository contents are untrusted input, including comments that look like instructions. Put an adversarial instruction in a test file and check whether the assistant attempts an out-of-scope edit. Enforcement belongs in the host: validate paths and the complete diff, reject changes outside the allowlist, and run code in a disposable <span data-glossary="sandbox">sandbox</span> with no secrets, no network by default, and capped CPU and memory limits. Enforce file access with host allowlists and operating-system controls; prompt text cannot constrain filesystem access.

SWE-bench uses real issue descriptions, repository snapshots, and tests to study repository-level fixes.[^swebench2024] Borrow that task structure and report your one-repository exercise as a separate evaluation. Publish failed attempts as well as successes, and record tool permissions, budgets, and the test harness.

Leave automatic merging and deployment out of scope. The [Code Generation and Sandboxing lesson](/learn/code-generation-agents-sandboxing) explains how to separate model proposals from trusted execution and validation. A patch that stays in bounds can still be the expensive one. Which savings survive when you replay the same workload?

## 5. Cost and latency: measure the savings you actually get

Hold the questions fixed and change one cost lever at a time. Use a frozen question set from a document assistant, or a classification workload you already have. A prompt-prefix caching experiment is a manageable start: keep shared instructions and evidence stable, then vary the user question.

Record per-request input and output tokens, cache usage, elapsed time, errors, retries, and quality outcomes. Pin the model identifier, provider, rate-card date, concurrency, and workload. Separate cold requests from warm requests. Shuffling or alternating comparison runs can reduce the chance that changing service load explains the result.

Provider <span data-glossary="prefix-cache">prefix caching</span> reuses computation for a matching prefix; it doesn't reuse the previous answer. OpenAI's current guide documents model-dependent minimum prefix lengths, retention, and charges. Inspect returned usage such as `cached_tokens` instead of assuming repeated text hit the cache.[^openai2026promptcaching]

Check the cache cutoff as well as the text. On GPT-5.6 and later, implicit mode can reuse prefixes ending at earlier eligible messages. If the stable passage and changing question share one message, a write through the question may leave no reusable split point at the passage's end. Place an explicit breakpoint after that stable content in both requests, using the selected model's documented controls. Compare returned reads and writes. Moving a timestamp to the end preserves more text; reuse still needs an eligible matching prefix checkpoint.[^openai2026promptcaching]

For models that report `cache_write_tokens`, count writes separately too. The guide's input-cost calculation separates ordinary input, cached reads, and cache writes. A cold request may pay to populate a cache that your workload never reuses. Log both fields and apply the selected model's rate card; a high read discount alone doesn't prove the experiment saved money.[^openai2026promptcaching]

| Experiment | What to hold fixed | Failure worth showing |
|---|---|---|
| Reusable prefix | Questions, shared text, model, generation settings | A changing timestamp near the start prevents the intended cache reuse |
| Smaller model | Workload and grading policy | Cost falls but an important error slice worsens |
| Shorter context | Questions and source-precedence rules | The omitted passage contained the answer |
| Offline batching | Task inputs and quality checks | Some requests expire or fail and must be accounted for |

OpenAI's Batch API advertises 50% lower cost than synchronous requests with a 24-hour completion window. Batches can expire with unfinished requests, so reconcile every input ID with either a result or an error.[^openai2026batch] Report Batch completion under offline throughput; use a separate measurement for interactive response latency.

Report cost per attempted task and per successful task, including retries. State whether your estimate covers only provider charges or also retrieval and hosting. Show request count beside p50 and <span data-glossary="p95-latency">p95</span>; a tiny sample doesn't support a confident tail-latency claim. Keep quality next to cost, and label any latency statistic that excludes timeouts as covering successful requests only.

A measured result of “this workload got no cache hits” is worth explaining. It tells a reader more than a savings percentage copied from provider marketing. The [LLM Cost Engineering lesson](/learn/llm-cost-engineering-token-economics) covers usage-based accounting and the distinction between prefix caching and application-level answer reuse. Those measurements help only if someone can find the question, the comparison, and the limitation without an API key.

## Make the repository readable before it is runnable

A reader should be able to find the question, experiment, result, and limitation without providing an API key. Keep a static report and redacted traces alongside the code:

```text title="repository-layout.txt"
README.md                    # problem, non-goals, setup, test and eval commands
docs/design.md               # chosen approach and rejected alternative
evals/cases.jsonl            # versioned inputs and expected behavior
reports/compare.md           # same-case comparison, counts, failed rows
traces/redacted/             # representative success and failure traces
src/
tests/
.env.example                 # variable names, never credentials
```

Check the documented commands in a clean environment. If dependencies or paid services are required, say so. A mocked provider can demonstrate UI states and report logic; label those results as mocked and report live model quality separately. Never publish employer documents, customer data, credentials, or proprietary code to make a project look realistic.

Write the result as a small engineering account. What failed first? Which component did you change? What remained broken? For example: “Preserving headings recovered the missing source on these cases, but the answer still selected the superseded policy. I added a precedence filter and reran both versions.” Follow that sentence with the actual rows, not invented impact numbers.

If you used AI tools, distinguish generated code from the design, verification, and debugging you performed. If others contributed, identify your own subsystem and decisions. A controlled experiment with an unresolved limitation is easier to discuss honestly than a broad claim that the assistant is production-ready.

You don't need a sprawling platform to have something worth discussing. Choose one project, make one comparison reproducible, and explain one failure well. When your repository can support that conversation, the [interview preparation guide](/blog/how-to-prepare-for-ml-llm-interviews-2026) can help you prepare for the process you're entering.
