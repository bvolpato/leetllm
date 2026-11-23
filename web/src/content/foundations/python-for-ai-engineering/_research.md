---
query: "We are creating a research-backed page for the following: \"Python for AI Engineering\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: foundations\nCurrent page scope: Learn Python as the first AI engineering loop: read JSONL rows, validate fields, compute exact-match accuracy, and harden the scorer with pytest, prompt snapshots, leakage checks, seeded runs, and a CI gate.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "faee94ba7fb3849b3f67b30b22750e39"
status: "completed"
---

This curriculum article structures the foundational loop of AI engineering: pulling data, running inferences, scoring the results, and gating the pipeline in CI.

When writing the actual `content.md` page, anchor the concepts in concrete code examples using `pytest` and `pydantic`. Here is the recommended structure, current standards, and research-backed coverage to include.

## 1. Prerequisites and Teaching Order

Start by explaining *why* we evaluate before we build complex agents. The mental model shift for traditional software engineers is crucial: LLM outputs are non-deterministic, so traditional unit tests are insufficient without a statistical or semantic scoring layer.

- **Prerequisites:** Python 3.12+, basic understanding of LLM API calls, and familiarity with standard testing (e.g., `pytest`).
- **Narrative Flow:** Ingest Data → Validate → Score → Harden → Automate.
- **Core Concept:** Transitioning from "does this code compile?" to "does this prompt drift?"

## 2. Data Ingestion: The JSONL Standard

Teach JSONL (JSON Lines) as the default format for evaluation datasets. Major frameworks and platforms standardize on JSONL because it processes efficiently row-by-row and maps perfectly to LLM batch jobs.

- **Format Standards:** Highlight the standard schema required by tools like Amazon Bedrock and Letta. A row typically contains `input`, `ground_truth`, and optional fields like `metadata`, `tags`, or `agent_args`.
- **Validation:** Show how to use `pydantic` to validate incoming JSONL rows before passing them to the evaluation loop. If a row lacks a `ground_truth` field, the exact-match scorer must catch it before execution.
- **Primary Sources:**

- Letta Dataset Concepts (2024): [https://docs.letta.com/guides/evals/concepts/datasets/](https://docs.letta.com/guides/evals/concepts/datasets/)
- Amazon Bedrock Evaluation (2024): [https://aws.amazon.com/blogs/machine-learning/llm-as-a-judge-on-amazon-bedrock-model-evaluation/](https://aws.amazon.com/blogs/machine-learning/llm-as-a-judge-on-amazon-bedrock-model-evaluation/)

## 3. Scoring: Exact-Match vs. LLM-as-a-Judge

Explain the transition from basic matching to semantic grading. While exact-match is fast and cheap, it is brittle.

- **Exact Match (Deterministic):** Best for extraction tasks (e.g., did the model output exactly "FAIL" or "PASS"?). Show a simple Python function checking substring presence.
- **LLM-as-a-Judge (Semantic):** Best for conversational or reasoning tasks. Teach how tools like Google's Agent Development Kit (ADK) evaluate both the *trajectory* (did the agent use the right tools?) and the *final response* (is it polite and grounded?).

Explore the breaking point between the two approaches here:

## 4. Hardening the Evaluator

LLM tests are notoriously flaky. Teach how to stabilize the evaluation suite so it provides a reliable signal.

- **Seeded Runs:** Show how to pass a `seed` parameter and set `temperature=0` to force maximum determinism from the provider API.
- **Snapshot Testing:** Explain "prompt drift." A wording change that improves one edge case might degrade three others. Introduce snapshot testing to compare outputs before and after prompt modifications.
- **Pytest Integration:** Frameworks like DeepEval hook directly into `pytest` using custom assertions (e.g., `assert_test()`), allowing failing metrics to fail the build locally and in CI.
- **Primary Sources:**

- DeepEval Pytest Integration (2024): [https://deepeval.com/docs/getting-started-rag](https://deepeval.com/docs/getting-started-rag)
- Braintrust LLM Evaluation Guide (2024): [https://www.braintrust.dev/articles/llm-evaluation-guide](https://www.braintrust.dev/articles/llm-evaluation-guide)

## 5. Security: Data Leakage Checks

Data leakage is not a single problem; it is four distinct vulnerabilities. Teach the reader how to instrument checks for each surface in their test loop.

| Leakage Surface | Mechanism | Detection Strategy |
| --- | --- | --- |
| Input PII | User types sensitive data (e.g., SSN) into the prompt. | Pre-LLM gateway scanning and masking. |
| Output Regurgitation | The model outputs PII memorized from training data. | Differential scanning (flagging entities in the output that were not in the input). |
| Retrieval Cross-Tenancy | RAG surfaces chunks belonging to Customer B in Customer A's session. | Synthetic two-tenant testing in CI. |
| Tool-Call Leakage | The model passes sensitive state into an external tool's audit logs. | Strict tool boundary violation monitoring. |

- **Primary Source:** Future AGI Leakage Prevention (2026): [https://futureagi.com/blog/evaluating-llm-data-leakage-prevention-2026/](https://futureagi.com/blog/evaluating-llm-data-leakage-prevention-2026/)

## 6. The CI/CD Gate

The final mastery outcome: the learner successfully wires their `pytest` evaluation loop into a GitHub Actions (or similar) pipeline.

- **Automating the Run:** Show a YAML snippet that executes `pytest` or `deepeval test run` on every pull request.
- **Defining the Threshold:** Explain why a 100% pass rate is unrealistic for LLM-as-a-judge workflows. Teach how to set statistical thresholds (e.g., "fail the PR if exact-match accuracy drops below 95% or if any leakage check fails").
