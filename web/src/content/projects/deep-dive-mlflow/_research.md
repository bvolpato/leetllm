# Research notes: MLflow as an evidence graph, not an orchestrator

## The investigation this chapter should answer

When `hybrid-reranker-v3` returns an unsupported answer, which recorded code revision, prompt version, evaluation dataset, retrieval settings, model artifact, trace, assessment, and promotion alias can explain or reproduce it?

## Map each feature to the source that owns it

- The original 2018 MLflow system paper describes experimentation, open interfaces, model packaging, and reproducibility: https://people.eecs.berkeley.edu/~alig/papers/mlflow.pdf . The OPML 2019 tutorial is a separate source, not this paper.
- Self-hosted architecture and backend-store documentation define the separation between relational metadata, tracking servers, artifact storage, and deployment modes: https://mlflow.org/docs/latest/self-hosting/architecture/overview/ and https://mlflow.org/docs/latest/self-hosting/architecture/backend-store/
- Tracking documentation defines runs, parameters, metrics, tags, and artifacts: https://mlflow.org/docs/latest/ml/tracking/
- Model-registry workflow documentation describes versioned models and mutable aliases: https://mlflow.org/docs/latest/ml/model-registry/workflow/
- GenAI tracing, production tracing, automatic evaluation, and prompt-registry guides own their corresponding current product semantics: https://mlflow.org/docs/latest/genai/tracing/ ; https://mlflow.org/docs/latest/genai/tracing/prod-tracing/ ; https://mlflow.org/docs/latest/genai/eval-monitor/automatic-evaluations/ ; https://mlflow.org/docs/latest/genai/prompt-registry/index.html
- AI Gateway documentation establishes a provider-access boundary rather than proving application-side authorization or output correctness: https://mlflow.org/docs/latest/genai/governance/ai-gateway/
- The public repository, pinned charter, contribution guide, and license establish project versus managed-product ownership: https://github.com/mlflow/mlflow and https://github.com/mlflow/mlflow/blob/0489fb31d8a144ec3c80d15eb44dbe24b790465e/LICENSE.txt

## Preserve the article's immutable evidence join

The running receipt is application `hybrid-reranker-v3`, commit `8b2f9e1`, retrieval depth `40`, rerank depth `8`, prompt `support-answer` version `17`, dataset `support-eval-2026-08-01`, failed case `RET-104`, and request duration `1,420 ms`. These values are teaching fixtures, not published production measurements.

A trace can explain one failed request; a retained evaluation snapshot turns representative trace cases into repeatable release evidence. A native MLflow evaluation dataset has a stable ID but mutable records and expectations; preserve the evaluated inputs, expectations, and digest separately. A registry alias is mutable and must resolve to an approved version before a comparison means anything. Prompt template versions are immutable, but their model configuration can be updated in place; record the actual configuration as well as the version.

The executable examples target MLflow 3.16.1 (released September 17, 2026). In its native evaluation implementation, `result.passed` skips absent scorer values without an accompanying scorer error and returns true when no result table exists. A release controller must independently verify required-case and required-assessment coverage: https://github.com/mlflow/mlflow/blob/v3.16.1/mlflow/genai/evaluation/entities.py . Span links added in 3.16.0 express relationships outside a single parent-child tree; a linked span's duration is not automatically added to its parent's duration: https://github.com/mlflow/mlflow/releases/tag/v3.16.0 .

## Security and claim limits

Artifact proxying concentrates storage authority in the tracking server; direct uploads distribute storage credentials to clients. Trace payloads, prompts, model outputs, and tool arguments can contain personal data or secrets, so retention, redaction, tenant isolation, and authorization require separate controls. Logging a metric doesn't certify its dataset, judge, confidence interval, or provenance.

MLflow doesn't allocate GPUs, replay failed actor state, serve an attention kernel, or implement an application's authorization policy. Current GenAI APIs, prompt aliases, gateway features, and workspace support are version-sensitive; verify against the actual installed or managed deployment rather than extrapolating from the original MLflow paper.
