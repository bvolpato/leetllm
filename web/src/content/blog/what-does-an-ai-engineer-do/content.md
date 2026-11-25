---
{
  "id": "blog-what-does-an-ai-engineer-do",
  "title": "What Does an AI Engineer Actually Do?",
  "slug": "what-does-an-ai-engineer-do",
  "author": {
    "name": "LeetLLM Team"
  },
  "publishedAt": "2026-02-19",
  "updatedAt": "2026-11-23",
  "verifiedAt": "2026-11-23",
  "refreshAfter": "2027-01-22",
  "excerpt": "Follow a support assistant from a wrong answer to a tested fix. See how applied AI, ML platforms, and research engineering divide the work.",
  "tags": [
    "AI Engineering",
    "Career",
    "Industry"
  ],
  "featured": true,
  "draft": false,
  "coverImage": "social_banner.png"
}
---

AI engineering turns models into software people can use. Depending on the team, the job can mean shipping a product feature, operating a training or serving platform, or building experiments for researchers. The engineer writes the surrounding code and checks whether the resulting system actually solves the task.

Consider a support incident. An assistant tells a customer that cancellation requires 60 days' notice, but the current policy says 30. Availability and latency dashboards are green, yet customers still receive the wrong answer. Before rewriting a prompt, inspect one request. Did the current policy reach the model? Did the answer match that evidence? Did the customer see the checked response? Each "no" points to different code. That chain is a useful picture of the job: find which check failed, fix that layer, and make the same mistake fail a test next time.

The title alone won't tell you which part you would own. The U.S. Bureau of Labor Statistics describes related work in its software developer, data scientist, and computer research scientist profiles; those occupations overlap with the work discussed here but are not interchangeable with an employer's AI-engineer title.[^bls2025softwaredevelopers][^bls2025datascientists][^bls2025researchscientists]

## Read the job behind the title

In 2023, swyx used "AI engineer" for software built on foundation models, general-purpose models reused across products, distinct from training those models.[^swyx2023] The distinction remains useful, but teams now use the title for several kinds of ownership.

Three job descriptions checked on **November 23, 2026** illustrate the range of work at frontier labs. This small sample shows those employers' research and product roles; broader postings help characterize the job market, and openings and responsibilities can change.

OpenAI's Applied AI Engineer, API Platform, Digital Natives role combines customer-facing architecture, hands-on prototypes, evaluations, integrations, and production launch, along with workshops and customer relationships.[^openai2026appliedengineerapiplatform] Anthropic's Research Engineer, RL Engineering role owns reinforcement-learning (RL) training systems across orchestration, environments, training, inference, and evaluation. The posting combines operating those systems with studying training behavior at scale and working with researchers on new methods; profiling and debugging distributed runs support that work.[^anthropicrl2026]

Anthropic's Research Engineer, Machine Learning (Reinforcement Learning) role combines novel methods, environments, evaluations, scaling, and research direction.[^anthropicagents2026] Both Anthropic postings mix systems and research. One emphasizes ownership of the RL training system; the other explicitly includes shaping research direction. Ask what artifact you would own and how the team would evaluate it, because job titles alone rarely separate these roles cleanly.

| Role family | Primary artifact | Work that often dominates | Not implied by title |
|---|---|---|---|
| Applied AI or product AI engineer | User-facing model-backed workflow | Product integration, retrieval, tool use, evaluations, experiments, and operations | Training a foundation model |
| Machine-learning or platform engineer | Repeatable train, deploy, or serve path | Data and training pipelines, serving, performance, reliability, and monitoring | Owning the user interface |
| Research engineer | Experimental result backed by working code | Implementing methods, building environments and evaluations, scaling runs, and analyzing failures | Being first author on every research claim |
| Research scientist | Supported research claim or new method | Hypotheses, experiment design, interpretation, and publication | Owning production infrastructure end to end |
| Data scientist | Analysis, predictive model, or decision evidence | Data preparation, statistics, experimentation, modeling, and communication | Operating a model-backed product service |

These are common areas of emphasis. A small team may combine several rows. In an interview, ask what you would deliver in the first three months, who uses it, how success is measured, and who handles failures after launch. A job that mainly helps customers integrate an API can look very different from one that owns an internal training cluster. The applied version of that question is concrete. Follow one wrong customer answer until you can name the layer that failed.

## Follow one request to its release

For the support assistant, start by defining the user task. A good task definition requires an answer grounded in the user's permitted policy documents, claim-level citations, an abstention when evidence is missing, and a <span data-glossary="latency-budget">latency budget</span>. An **abstention** states that the available evidence doesn't support an answer, which keeps a missing policy from becoming a guessed policy. A **response schema** names the expected output fields and their types, and application code checks that shape before using the response.

The model is one stage inside that task definition. The surrounding work is easier to see when each failure has an owner:

| Workstream | Concrete artifact | Failure that exposes it |
|---|---|---|
| Task and evaluation design | Supported inputs, expected outputs, refusal rules, and fixed evaluation cases | Team can't say whether one answer is correct |
| Context and data | Parsed sources, versioned index, access policy, and retrieval tests | Correct or permitted evidence never reaches the model |
| Tool layer | Schemas, authorization, <span data-glossary="idempotency">idempotency</span>, approval, and audit events | Model proposes an invalid or duplicate side effect |
| Model layer | Versioned prompt and model config, response schema, timeout, and fallback | Output can't be parsed, or behavior changes silently |
| Release evidence | Baseline-versus-candidate report, failed rows, and <span data-glossary="rollback">rollback</span> target | Demo improves while an important slice regresses |
| Operations | Joined traces, latency, errors, usage, and cost | Team sees a bad answer but can't locate its failing stage |

### Evidence before generation

<span data-glossary="rag">Retrieval-augmented generation</span> (RAG) adds selected external evidence at request time. For this assistant, every policy passage needs a source, version, and access scope. Splitting documents into passages is called <span data-glossary="chunking">chunking</span>. Search design depends on the documents. <span data-glossary="dense-retrieval">Dense retrieval</span> can find semantic matches; lexical methods such as <span data-glossary="bm25">BM25</span> score term matches.[^karpukhin2020][^robertson2009] Verify exact-identifier retrieval and source freshness separately. An exact-ID lookup may be simpler for a known plan code. Add hybrid search or a <span data-glossary="reranker">reranker</span> when measured retrieval failures justify the extra stage.

For authenticated account A, the application checks these policy records:

| Record | Account | Version | Notice period | Context decision |
|---|---|---|---|---|
| A-v2 | A | Current | 30 days | Include |
| A-v1 | A | Superseded | 60 days | Exclude |
| B-v4 | B | Current | 0 days | Exclude |

Only A-v2 enters the model context. The filter below applies that rule in code. It keeps records owned by the caller's account, drops superseded versions, and prints the notice period the model would see.

<!-- leetllm: test, output=show -->
```python title="effective_policy_filter.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class PolicyRecord:
    record_id: str
    account: str
    current: bool
    notice_days: int


RECORDS = [
    PolicyRecord("A-v2", "A", True, 30),
    PolicyRecord("A-v1", "A", False, 60),
    PolicyRecord("B-v4", "B", True, 0),
]


def eligible_context(records: list[PolicyRecord], account: str) -> list[PolicyRecord]:
    return [r for r in records if r.account == account and r.current]


def cache_key(account: str, record_ids: list[str]) -> str:
    return f"{account}:{'+'.join(sorted(record_ids))}"


context = eligible_context(RECORDS, "A")
print("context:", [r.record_id for r in context])
print("notice days:", [r.notice_days for r in context])
print("cache key:", cache_key("A", [r.record_id for r in context]))

stale_key = cache_key("A", ["A-v1"])
print("stale entry reused:", stale_key == cache_key("A", [r.record_id for r in context]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
context: ['A-v2']
notice days: [30]
cache key: A:A-v2
stale entry reused: False
```
<!-- leetllm: output:end -->

Because the cache key includes the policy version, an answer cached from A-v1 can't be returned once A-v2 becomes the current record. Enforce document permissions before sending evidence to the model or another service not authorized to see it. Check them again when a link or tool reads the source. A filter after generation is too late to prevent disclosure through the model request. Scope alone is also insufficient: A-v1 is allowed but stale. The [Document QA capstone](/learn) builds the ingestion, retrieval, citation, and abstention path.

### Trusted tools and actions

A model can propose a tool call, but application code decides whether to execute it. That code uses the authenticated caller's identity, validates arguments, checks authorization, applies <span data-glossary="rate-limit">rate limits</span>, and records the result. An account ID that the model produced is not permission to act on that account.

If the assistant may open a billing ticket, the runtime must also handle duplicate submissions and ambiguous timeouts. A local request log can't by itself prevent a remote ticket from being created twice; the downstream service needs idempotency keys or a way to reconcile the result. [Function Calling & Tool Use](/learn/function-calling-tool-use-llms) develops these checks through read authorization, write approval, retries, and trajectory evaluation.

### Model and serving choices

A hosted API keeps accelerator scheduling off the product team's plate, but the application still owns model configuration, timeouts, usage, fallbacks, privacy, and release checks. Self-hosting adds batching, routing, <span data-glossary="gpu">GPU</span> memory, deployment, and cache management.

The <span data-glossary="kv-cache">key-value (KV) cache</span> stores attention data from previous tokens. <span data-glossary="pagedattention">PagedAttention</span> organizes that cache in blocks to reduce wasted <span data-glossary="vram">GPU memory</span> when request lengths vary.[^kwon2023pagedattention][^vllm2024]

Diagnosis also guides adaptation. If the correct policy never arrives, investigate the data path. If fields are malformed, test <span data-glossary="structured-output">structured output</span>, while still handling refusals and incomplete responses. Schema checks validate format; compare claims with evidence to assess truth.[^openai_structured_outputs] A persistent behavior gap with representative training and evaluation data may justify <span data-glossary="lora">Low-Rank Adaptation</span> (LoRA) or another tuning method.[^hu2021][^dettmers2023] Select the intervention from the measured failure.

[Inference: TTFT, TPS & KV Cache](/learn/inference-mechanics-ttft-tps-kv-cache) explains the serving path. [LoRA & Parameter-Efficient Tuning](/learn/lora-parameter-efficient-fine-tuning) covers the training and memory tradeoffs after a measured behavior gap makes tuning reasonable.

### Evaluation and release

Evaluation starts before release. It defines what the team is trying to preserve while prompts, retrieval, tools, models, and infrastructure change. Use direct assertions for schema validity, permitted source IDs, tool arguments, and labeled abstention cases. A citation's presence can be checked mechanically; whether it supports the claim may require human review or a model-based judge checked against human labels. Public benchmarks such as Massive Multitask Language Understanding (MMLU), HumanEval, and <span data-glossary="swe-bench">SWE-bench</span> describe behavior under their own datasets and protocols. They don't replace cases from your product.[^hendrycks2021][^chen2021][^jimenez2024]

> **Release rule:** Compare baseline and candidate on the same versioned cases. Inspect failed rows and <span data-glossary="evaluation-slice">required slices</span> before accepting an aggregate score.

The [LLM Benchmarks & Limitations](/learn/llm-evaluation-benchmarks-limitations) lesson turns these checks into a release decision with reproducible evidence. The 60-day answer is the case to run them on. The first failed condition tells you which layer to repair.

## Trace the failing layer

Return to the 60-day answer. Reconstruct the request: caller access scope, search query, returned source IDs and versions, final context, model response, validation result, and rendered output. Avoid copying sensitive request contents into unrestricted logs. Read the trace in order, stop at the first failed condition, repair that layer, and then replay the whole path to check for another fault.

| Trace condition | If it fails, inspect | Regression evidence |
|---|---|---|
| Current permitted policy A-v2 reaches context | Ingestion, effective-version filters, retrieval, and reranking | A-v2 enters; stale A-v1 and forbidden B-v4 don't |
| The answer is supported by A-v2 | Response format, abstention, and model choice | The answer says 30 days and cites A-v2 |
| The user sees the validated response | Parser, cache, persisted state, and rendering | The displayed answer remains 30 days for this account |
| All conditions hold but the case is still labeled wrong | Evaluation label and product expectation | The policy owner confirms the expected behavior |

If A-v2 never entered context, inspect ingestion, version selection, filters, retrieval, and any reranking. A prompt can't supply the missing source, although it can make the assistant abstain or request another lookup instead of guessing. If the right policy did enter context but the answer contradicts it, inspect the response format, abstention behavior, and model choice, and hold the evidence packet steady while comparing generation changes. If validation passed but the customer saw different text, inspect parsing, caching, state, and rendering, because the model can be correct while an ordinary application layer is wrong.

```checkpoint
The trace contains A-v2, the model returns 30 days, and validation passes. The customer sees 60 days. Which layer would you inspect first, and which tempting change would fail to address the evidence?
---
Inspect the response path after validation: cache keys, persisted state, parsing, and rendering. Check whether a stale response was reused across policy versions or accounts. A checked 30-day response can become a displayed 60-day response somewhere along that path. Add a regression case for the customer-visible result alongside one for raw model output.
```

For this incident, suppose the trace contains A-v1 and no A-v2. A day's work might look like this:

| Work | Result to inspect |
|---|---|
| Confirm the intended policy with its owner | A-v2 is effective for this account; 30 days is the expected answer |
| Reproduce the bad lookup locally | A-v1 still qualifies because the query omits the effective-version condition |
| Write the failing case and repair the query | A-v2 is included; A-v1 and another account's policy are excluded |
| Run the retrieval and answer evaluations | Inspect the original request, failures, abstentions, latency, and unchanged-account cases |
| Review and release the patch | Save the tested revisions, monitor the affected slice, and retain a known-good rollback path |

That's a query fix, a test, a review, and a rollout, and no new model was needed. A different trace could lead to a prompt experiment, an API integration fix, or an investigation with the model provider. During an active incident, contain harm first: a safe fallback or rollback may be necessary before the full repair is ready. One repaired request shows the applied job. The remaining choice is which artifact you want to own, and how you would prove it.

## Choose work you want to own

Widen one path you can still explain when it fails. Start with a narrow path: a retrieval endpoint, a tool schema, an <span data-glossary="eval-harness">eval harness</span>, or a serving change. Make it reproducible and explain a failure you diagnosed. Then connect those pieces end to end, choosing trade-offs across quality, latency, cost, permissions, and rollback, and explain them to the people who use or operate the system. Broader roles may set shared interfaces, reliability budgets, evaluation practice, or serving architecture across teams. Use these signals to discuss scope with an employer and ask how its levels map to actual responsibility.

### Match study to artifact

Choose a study path that matches the work you want to show. These routes suggest practice projects, and prerequisites still matter; hiring outcomes depend on role fit and the employer's process.

| Target | Curriculum path | Evidence to finish with |
|---|---|---|
| Applied AI | [First AI App End-to-End](/learn/design-production-rag-pipeline) → [File Ingestion for AI](/learn/chunking-strategies-document-processing) → [Function Calling & Tool Use](/learn/function-calling-tool-use-llms) → [LLM Benchmarks & Limitations](/learn/llm-evaluation-benchmarks-limitations) | Deployed workflow with traces, <span data-glossary="eval-row">eval rows</span>, failure handling, and rollback |
| Machine-learning or platform engineering | [PyTorch Training Loops](/learn/pytorch-training-loops) → [Dataset Pipelines and Data Quality](/learn/cross-validation-leakage-generalization) → [Model Versioning & Deployment](/learn/llm-deployment-gpu-serving-autoscaling) → [Inference: TTFT, TPS & KV Cache](/learn/inference-mechanics-ttft-tps-kv-cache) | Reproducible train-or-serve path with reliability and performance evidence |
| Research engineering | [The Transformer Architecture End-to-End](/learn/transformer-architecture-end-to-end) → [Distributed Training: FSDP & ZeRO](/learn/distributed-training-fsdp-deepspeed-zero) → [Capstone: Reproducible ML Study](/learn) | Baseline, implementation, controlled experiments, uncertainty, and artifacts |
| Data science moving toward AI systems | [Probability for Machine Learning](/learn/probability-for-machine-learning) → [Experiment Design and A/B Testing](/learn/experiment-design-ab-testing) → [PyTorch Training Loops](/learn/pytorch-training-loops) | Analysis or model tied to honest validation and a decision |

Framework names will change. The durable skills are task definition, data and permission scoping, model behavior, evaluation, systems performance, and evidence-backed communication.

A wrong answer splits into a missing document, a model that ignored the document, or a display path that showed something other than the checked answer. That split is the applied work the title often names. Use the routes above to build an artifact you can explain and test; hiring decisions depend on the role and its evaluation process.

For a step-by-step transition plan, continue to [How to Become an AI Engineer from Zero in 2026](/blog/how-to-become-ai-engineer-from-zero-2026). For project packaging and interview evidence, use [AI Engineer Portfolio Projects for Interviews](/blog/ai-engineer-portfolio-projects-interviews).
