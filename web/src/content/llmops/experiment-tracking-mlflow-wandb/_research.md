---
query: "We are creating a research-backed page for the following: \"Experiment Tracking with MLflow and W&B\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: llmops\nCurrent page scope: Turn a live LLM regression into a reproducible candidate decision by logging inputs, metrics, artifacts, and promotion evidence.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "7f96ae5bad0a96f8bb74a97b32ed2ae5"
status: "completed"
---

# Experiment Tracking with MLflow and W&B

## Overview and Prerequisites

**Scope:** Turn a live LLM regression into a reproducible candidate decision by logging inputs, metrics, artifacts, and promotion evidence.

Traditional machine learning experiment tracking focuses on hyperparameter tuning and deterministic loss metrics computed over fixed validation sets. LLM experiment tracking introduces non-deterministic outputs, multi-step agent traces, prompt template versioning, and evaluation mechanisms like LLM-as-a-judge.

Before diving into this module, you should understand:

- The difference between single-turn prompt execution and multi-step agent trajectories.
- Basic LLM evaluation concepts (e.g., Groundedness, Answer Relevance, and safety guardrails).
- The concept of a Model Registry for artifact promotion.

## Core Mechanisms of LLM Experiment Tracking

To make an objective decision about whether a new prompt, model version, or RAG pipeline is better than the production baseline, you need to log four core pillars:

1. **Inputs:** The exact string templates (prompts), system instructions, generation parameters (temperature, max tokens), and the specific foundation model version used.
2. **Metrics:** Scores that measure quality, safety, and operational performance. Because exact-match testing is often insufficient for generative AI, metrics are usually calculated by deterministic code (e.g., regex checks), LLM judges, or human feedback.
3. **Artifacts:** The tangible outputs of the experiment. This includes logged traces (the exact inputs and outputs of every chain step), saved datasets (the evaluation golden set), and serialized application logic.
4. **Promotion Evidence:** An aggregated dashboard or report comparing the baseline and candidate across the standard evaluation dataset, enabling a clear deployment decision.

## MLflow for LLM Tracking

MLflow has expanded its traditional ML tracking to support Generative AI natively via the `mlflow.genai` module, integrating evaluation, tracing, and prompt management.

### Prompt Versioning and Registry

Treating prompts like code is essential for reproducibility. MLflow provides a Prompt Registry to centrally version templates, preventing ad-hoc prompt changes from silently altering evaluation baselines.

```python
import mlflow

# Registering a prompt template
mlflow.genai.register_prompt(
    name="customer-support-summarizer",
    template="Summarize the following interaction in {{num_sentences}} sentences: {{text}}"
)

# Loading the prompt in an evaluation script
prompt = mlflow.genai.load_prompt("prompts:/customer-support-summarizer@latest")
```

### Automated Evaluation

MLflow provides the `mlflow.genai.evaluate` API to run candidate models or prompts against an evaluation dataset. It supports built-in metrics, custom LLM judges, and code-based scorers.

```python
import mlflow
from mlflow.genai.judges import make_judge

# Create an LLM-as-a-judge metric using a specific judge model
answer_similarity = make_judge(
    name="answer_similarity",
    instructions=(
        "Return 'yes' if the output is similar to the expected answer, otherwise return 'no'."
    ),
    model="openai:/gpt-4o-mini",
    feedback_value_type="yes/no"
)

# Run the evaluation, passing the custom judge
results = mlflow.genai.evaluate(
    data=eval_dataset,
    predict_fn=my_llm_function,
    scorers=[answer_similarity],
)
```

This logs the metrics, per-row evaluation justifications, and traces directly to the MLflow server so that different iterations can be compared seamlessly in the UI.

## W&B Weave for LLM Tracking

Weights & Biases (W&B) handles generative AI through its **Weave** toolkit, which is specifically designed for agentic systems, traces, and LLM application evaluation. While W&B Models tracks traditional ML training loops, Weave focuses on execution traces and production monitoring.

### Decorator-based Tracing

Weave uses a simple `@weave.op` decorator to automatically trace function inputs, outputs, and execution time. This structure organizes multi-step agent actions into cohesive sessions and turns rather than disjointed raw logs.

```python
import weave
import openai

# Initialize the Weave project
weave.init("support-agent-eval")

# Trace the execution of a specific LLM call
@weave.op()
def correct_grammar(user_input: str) -> str:
    client = openai.OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": f"Correct the grammar: {user_input}"}],
    )
    return response.choices[0].message.content
```

### Evaluation Framework

Weave provides imperative evaluation APIs that execute candidate functions against baseline datasets, producing deep analytics tailored for agentic systems. The platform enables side-by-side visualization of different model or prompt configurations to catch regressions before they reach users, ensuring that a "win" in one area doesn't mask a failure in another.

## Making the Promotion Decision

Once tracking is established, deciding to promote an LLM application requires analyzing the dashboard for:

- **Quality Metrics:** Does the candidate beat the baseline in relevance, accuracy, and faithfulness to retrieved context?
- **Safety Guardrails:** Has toxicity, hallucination, or PII leakage increased?
- **Operational Metrics:** Is the new candidate substantially slower or more expensive (e.g., token usage) than the baseline? Operational evaluation is critical because a brilliant model that is too expensive to serve at scale is still a failure.

A strict LLMOps workflow gates production deployment behind these logged artifacts. If a candidate drops in accuracy by more than an acceptable threshold, it should block a deployment just like a failing unit test.

## Common Pitfalls and Failure Modes

- **Failing to version the evaluation dataset:** If the underlying questions in your evaluation dataset change, metrics comparing the current model to last month's model are invalid. Both MLflow and W&B support logging the dataset as an artifact.
- **Trusting saturated benchmarks:** When an LLM begins scoring perfectly on an evaluation dataset, the benchmark loses its discriminative power and produces accurate but uninformative results. You must periodically rotate in harder, domain-specific evaluation examples.
- **Unversioned Judge Prompts:** If you use LLM-as-a-judge, the prompt given to the judge model must be versioned just like the application prompt. If the judge's prompt drifts, the evaluation baseline is destroyed.
- **Ignoring Operational Costs:** An experiment might prove a complex prompt significantly increases quality, but if it quadruples token usage and latency, it may be commercially unviable for the intended usecase.

## References

- MLflow `mlflow.metrics` API Documentation: [https://mlflow.org/docs/latest/api_reference/python_api/mlflow.metrics.html](https://mlflow.org/docs/latest/api_reference/python_api/mlflow.metrics.html)
- LLM Evaluation and Agent Evaluation | MLflow AI Platform: [https://mlflow.org/llm-evaluation/](https://mlflow.org/llm-evaluation/)
- LLM Evaluation Frameworks Explained for AI Practitioners - MLflow: [https://mlflow.org/articles/llm-evaluation-frameworks-explained-for-ai-practitioners/](https://mlflow.org/articles/llm-evaluation-frameworks-explained-for-ai-practitioners/)
- Evaluating Prompts | MLflow AI Platform: [https://mlflow.org/docs/latest/genai/prompt-registry/evaluate-prompts/](https://mlflow.org/docs/latest/genai/prompt-registry/evaluate-prompts/)
- W&B Weave: Observability for production agents - Wandb: [https://wandb.ai/site/weave/](https://wandb.ai/site/weave/)
- LLM evaluation: Metrics, frameworks, and best practices | Weights & Biases: [https://wandb.ai/onlineinference/genai-research/reports/LLM-evaluation-Metrics-frameworks-and-best-practices--VmlldzoxMTMxNjQ4NA](https://wandb.ai/onlineinference/genai-research/reports/LLM-evaluation-Metrics-frameworks-and-best-practices--VmlldzoxMTMxNjQ4NA)
